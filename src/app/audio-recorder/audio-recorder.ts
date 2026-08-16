import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { AudioRecord } from './models/audio-record.model';
import { IndexedDbAudioService } from './services/indexed-db-audio.service';
import { TranscriptionService } from './services/transcription.service';
import { convertBlobToVoskWav } from './utils/wav-encoder.util';

type RecorderState = 'idle' | 'requesting-permission' | 'recording' | 'preview';

@Component({
  selector: 'app-audio-recorder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audio-recorder.html',
  styleUrls: ['./audio-recorder.css'],
})
export class AudioRecorderComponent implements OnInit, OnDestroy {
  //Grabacion en curso
  recorderState: RecorderState = 'idle';
  recordingSeconds = 0;
  previewUrl: string | null = null;
  isSavingPreview = false;
  recorderErrorMessage: string | null = null;

  savedAudios: AudioRecord[] = [];
  isLoadingList = true;

  //almacenamiento por si se esta quedando sin espacio
  storageWarning: string | null = null;

  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private recordedChunks: Blob[] = [];
  private pendingPreviewBlob: Blob | null = null;
  private recordingStartedAt = 0;
  private recordingTimerHandle: ReturnType<typeof setInterval> | null = null;

  // URLs de audio en la lista, gestionadas manualmente para poder liberarlas
  private listObjectUrls = new Map<number, string>();

  constructor(
    private readonly indexedDbAudio: IndexedDbAudioService,
    private readonly transcriptionService: TranscriptionService,
    private readonly changeDetectorRef: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    await this.indexedDbAudio.requestPersistentStorage();
    await this.refreshSavedAudios();
    await this.checkStorageQuota();
  }

  ngOnDestroy(): void {
    this.stopMediaTracks();
    this.clearRecordingTimer();
    this.revokePreviewUrl();
    this.listObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  }

  // ============================== Grabación ==============================

  async startRecording(): Promise<void> {
    this.recorderErrorMessage = null;
    this.recorderState = 'requesting-permission';
    this.changeDetectorRef.markForCheck();

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      this.recorderState = 'idle';
      this.recorderErrorMessage =
        'No se pudo acceder al micrófono. Verificá los permisos del navegador e intentá nuevamente.';
      this.changeDetectorRef.markForCheck();
      return;
    }

    try {
      const mimeType = this.pickSupportedMimeType();
      this.mediaRecorder = mimeType
        ? new MediaRecorder(this.mediaStream, { mimeType })
        : new MediaRecorder(this.mediaStream);

      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.handleRecordingStopped();
        this.changeDetectorRef.markForCheck();
      };

      this.mediaRecorder.onerror = () => {
        this.stopMediaTracks();
        this.clearRecordingTimer();
        this.recorderState = 'idle';
        this.recorderErrorMessage =
          'La grabación se interrumpió inesperadamente. Intentá de nuevo.';
        this.changeDetectorRef.markForCheck();
      };

      this.mediaRecorder.start();
      this.recorderState = 'recording';
      this.recordingStartedAt = Date.now();
      this.recordingSeconds = 0;
      this.recordingTimerHandle = setInterval(() => {
        this.recordingSeconds = Math.floor((Date.now() - this.recordingStartedAt) / 1000);
        this.changeDetectorRef.markForCheck();
      }, 1000);

      this.changeDetectorRef.markForCheck();
    } catch (error) {
      // Si MediaRecorder no pudo crearse o iniciarse (codec no soportado,
      // navegador sin soporte, etc.), no dejamos la UI colgada en
      // "Solicitando acceso": liberamos el stream y mostramos el error.
      this.stopMediaTracks();
      this.recorderState = 'idle';
      this.recorderErrorMessage =
        'No se pudo iniciar la grabación en este navegador. Probá con otro navegador o dispositivo.';
      this.changeDetectorRef.markForCheck();
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.clearRecordingTimer();
    this.stopMediaTracks();
    this.changeDetectorRef.markForCheck();
  }

  private handleRecordingStopped(): void {
    const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
    this.pendingPreviewBlob = new Blob(this.recordedChunks, { type: mimeType });
    this.previewUrl = URL.createObjectURL(this.pendingPreviewBlob);
    this.recorderState = 'preview';
  }

  discardPreview(): void {
    this.revokePreviewUrl();
    this.pendingPreviewBlob = null;
    this.recordingSeconds = 0;
    this.recorderState = 'idle';
    this.changeDetectorRef.markForCheck();
  }

  async savePreview(): Promise<void> {
    if (!this.pendingPreviewBlob) {
      return;
    }

    this.isSavingPreview = true;
    this.recorderErrorMessage = null;
    this.changeDetectorRef.markForCheck();

    try {
      // Conversión a WAV PCM 16-bit mono 16kHz: formato de entrada esperado por Vosk.
      // Se hace aca una sola vez al guardar, para que el backend siempre reciba
      // el mismo formato sin importar que codec uso el navegador al grabar.
      const wavBlob = await convertBlobToVoskWav(this.pendingPreviewBlob);

      const record: Omit<AudioRecord, 'id'> = {
        blob: wavBlob,
        label: this.buildDefaultLabel(),
        createdAt: new Date(),
        durationSeconds: this.recordingSeconds,
        sampleRate: 16000,
        sizeBytes: wavBlob.size,
        transcriptionStatus: 'pending',
      };

      await this.indexedDbAudio.addAudio(record);
      await this.refreshSavedAudios();
      await this.checkStorageQuota();

      this.discardPreview();
    } catch (error) {
      this.recorderErrorMessage =
        'No se pudo guardar el audio. Es posible que el formato no sea compatible con este navegador.';
    } finally {
      this.isSavingPreview = false;
      this.changeDetectorRef.markForCheck();
    }
  }

  // ============================== Lista de audios ==============================

  async refreshSavedAudios(): Promise<void> {
    this.isLoadingList = true;
    this.changeDetectorRef.markForCheck();
    try {
      // Liberar URLs previas antes de recrearlas
      this.listObjectUrls.forEach((url) => URL.revokeObjectURL(url));
      this.listObjectUrls.clear();

      this.savedAudios = await this.indexedDbAudio.getAllAudios();

      for (const audio of this.savedAudios) {
        if (audio.id !== undefined) {
          this.listObjectUrls.set(audio.id, URL.createObjectURL(audio.blob));
        }
      }
    } finally {
      this.isLoadingList = false;
      this.changeDetectorRef.markForCheck();
    }
  }

  getAudioUrl(audio: AudioRecord): string | null {
    return audio.id !== undefined ? (this.listObjectUrls.get(audio.id) ?? null) : null;
  }

  async deleteAudio(audio: AudioRecord): Promise<void> {
    if (audio.id === undefined) {
      return;
    }

    const url = this.listObjectUrls.get(audio.id);
    if (url) {
      URL.revokeObjectURL(url);
      this.listObjectUrls.delete(audio.id);
    }

    await this.indexedDbAudio.deleteAudio(audio.id);
    await this.refreshSavedAudios();
    await this.checkStorageQuota();
  }

  async transcribeAudio(audio: AudioRecord): Promise<void> {
    if (audio.id === undefined) {
      return;
    }

    audio.transcriptionStatus = 'transcribing';
    audio.transcriptionError = undefined;
    this.changeDetectorRef.markForCheck();

    try {
      const result = await this.transcriptionService.transcribeAudio(
        audio.blob,
        `${audio.label}.wav`,
      );
      audio.transcriptionStatus = 'done';
      audio.transcriptionText = result.transcription;
    } catch (error) {
      audio.transcriptionStatus = 'error';
      audio.transcriptionError =
        error instanceof Error ? error.message : 'Error desconocido al transcribir.';
    } finally {
      await this.indexedDbAudio.updateAudio(audio);
      this.changeDetectorRef.markForCheck();
    }
  }

  // ============================== Utilidades ==============================

  private async checkStorageQuota(): Promise<void> {
    const estimate = await this.indexedDbAudio.estimateStorage();
    if (!estimate || estimate.quotaBytes === 0) {
      this.storageWarning = null;
      return;
    }

    const usageRatio = estimate.usageBytes / estimate.quotaBytes;
    this.storageWarning =
      usageRatio > 0.8
        ? 'El almacenamiento local está por agotarse. Sincronizá y liberá audios transcriptos cuando tengas conexión.'
        : null;
  }

  private pickSupportedMimeType(): string | null {
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
    for (const candidate of candidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(candidate)) {
        return candidate;
      }
    }
    return null;
  }

  private buildDefaultLabel(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `Inspección ${pad(now.getDate())}/${pad(now.getMonth() + 1)} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  private stopMediaTracks(): void {
    this.mediaStream?.getTracks().forEach((track) => track.stop());
    this.mediaStream = null;
  }

  private clearRecordingTimer(): void {
    if (this.recordingTimerHandle !== null) {
      clearInterval(this.recordingTimerHandle);
      this.recordingTimerHandle = null;
    }
  }

  private revokePreviewUrl(): void {
    if (this.previewUrl) {
      URL.revokeObjectURL(this.previewUrl);
      this.previewUrl = null;
    }
  }

  formatDuration(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // ============================================================
  // Reproductor de audio custom (play/pausa + barra de progreso)
  // ============================================================
  // En vez del <audio controls> nativo del navegador, el template usa un
  // <audio> oculto por elemento + una barra de progreso propia. Estos métodos
  // reciben la referencia del elemento nativo directamente desde el template
  // (variable de plantilla `#previewPlayer` / `#itemPlayer`), así que no
  // hace falta llevar un registro de "cual esta sonando" en el componente.

  togglePlay(player: HTMLAudioElement): void {
    if (player.paused) {
      player.play();
    } else {
      player.pause();
    }
  }

  seekTo(event: MouseEvent, track: HTMLElement, player: HTMLAudioElement): void {
    if (!player.duration || !isFinite(player.duration)) {
      return;
    }
    const rect = track.getBoundingClientRect();
    const fraction = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    player.currentTime = fraction * player.duration;
  }

  getProgressPercent(player: HTMLAudioElement): number {
    if (!player.duration || !isFinite(player.duration)) {
      return 0;
    }
    return (player.currentTime / player.duration) * 100;
  }

  getPlayerTimeLabel(player: HTMLAudioElement): string {
    const seconds = player.currentTime > 0 ? player.currentTime : player.duration || 0;
    return this.formatDuration(Math.floor(isFinite(seconds) ? seconds : 0));
  }

  /**
   * Handler vacio a proposito: solo existe para que Angular reaccione a los
   * eventos nativos del <audio> (timeupdate/play/pause/ended) y dispare
   * deteccion de cambios, asi la barra de progreso y el icono play/pausa
   * se actualizan en tiempo real sin necesidad de un estado adicional.
   */
  onPlayerTick(): void {}
}
