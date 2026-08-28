import { Component, OnInit, OnDestroy, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InspeccionService } from '../inspeccion.service';
import { ApiarioService } from '../../apiarios/apiario.service';
import { InspeccionColmenaDTO } from '../inspeccion.model';
import { NavbarComponent } from '../../navbar/navbar.component';
import { InspeccionDraftService } from '../inspeccion-draft.service';
import { IndexedDbAudioService } from '../../audio-recorder/services/indexed-db-audio.service';
import { TranscriptionService } from '../../audio-recorder/services/transcription.service';
import { AudioRecord } from '../../audio-recorder/models/audio-record.model';
import { convertBlobToVoskWav } from '../../audio-recorder/utils/wav-encoder.util';

type RecorderState = 'idle' | 'requesting-permission' | 'recording' | 'preview';

/**
 * Componente para la pantalla de Inspección Manual por Colmena (US 32).
 * Integra grabador de audio offline (un audio por colmena) + formulario táctil.
 */
@Component({
  selector: 'app-inspeccionar-colmena',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, NavbarComponent],
  templateUrl: './inspeccionar-colmena.html',
  styleUrl: './inspeccionar-colmena.css',
})
export class InspeccionarColmenaComponent implements OnInit, OnDestroy {
  apiarioId!: number;
  inspeccionId!: number;
  colmenaId!: number;

  nombreApiario = signal<string>('Apiario');
  nombreColmena = signal<string>('Colmena');
  loading = signal<boolean>(true);

  // ── Formulario ──────────────────────────────────────────────────────────────
  varroa = signal<'NO_DETECTADA' | 'DETECTADA'>('NO_DETECTADA');
  estadoReina = signal<'VISTA_Y_SANA' | 'NO_VISTA' | 'CELDA_REAL' | 'AUSENTE'>('VISTA_Y_SANA');
  nivelAlimento = signal<'BAJO' | 'MEDIO' | 'ALTO'>('MEDIO');
  produjoMiel = signal<boolean>(true);
  observaciones: string = '';

  // ── Grabador de audio ────────────────────────────────────────────────────────
  recorderState: RecorderState = 'idle';
  recordingSeconds = 0;
  previewUrl: string | null = null;
  isSavingPreview = false;
  recorderErrorMessage: string | null = null;

  /** Audio guardado para esta colmena (máximo 1) */
  savedAudio: AudioRecord | null = null;
  isLoadingAudio = true;
  savedAudioUrl: string | null = null;

  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private recordedChunks: Blob[] = [];
  private pendingPreviewBlob: Blob | null = null;
  private recordingStartedAt = 0;
  private recordingTimerHandle: ReturnType<typeof setInterval> | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiarioService: ApiarioService,
    private inspeccionService: InspeccionService,
    private draftService: InspeccionDraftService,
    private indexedDbAudio: IndexedDbAudioService,
    private transcriptionService: TranscriptionService,
    private cdr: ChangeDetectorRef,
  ) {}

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.apiarioId = Number(this.route.snapshot.params['apiarioId']);
    this.inspeccionId = Number(this.route.snapshot.params['inspeccionId']);
    this.colmenaId = Number(this.route.snapshot.params['colmenaId']);

    if (this.apiarioId) {
      this.apiarioService.getApiarioById(this.apiarioId).subscribe({
        next: (data) => {
          if (data && data.name) this.nombreApiario.set(data.name);
          const colmenaEncontrada = data.colmenas?.find(
            (c: any) => (c['id'] as number) === this.colmenaId,
          );
          if (colmenaEncontrada && colmenaEncontrada['name']) {
            this.nombreColmena.set(colmenaEncontrada['name'] as string);
          }
        },
      });
    }

    if (this.inspeccionId && this.colmenaId) {
      this.cargarDetalleColmena();
    } else {
      this.loading.set(false);
    }

    this.cargarAudioGuardado();
  }

  ngOnDestroy(): void {
    this.stopMediaTracks();
    this.clearRecordingTimer();
    this.revokePreviewUrl();
    if (this.savedAudioUrl) URL.revokeObjectURL(this.savedAudioUrl);
  }

  // ── Carga del formulario ─────────────────────────────────────────────────────

  cargarDetalleColmena(): void {
    const localForm = this.draftService.getColmenaDraftData(this.apiarioId, this.colmenaId);
    if (localForm) {
      if (localForm.varroa) this.varroa.set(localForm.varroa);
      if (localForm.estadoReina) this.estadoReina.set(localForm.estadoReina);
      if (localForm.nivelAlimento) this.nivelAlimento.set(localForm.nivelAlimento);
      if (localForm.produjoMiel !== undefined) this.produjoMiel.set(localForm.produjoMiel);
      if (localForm.observaciones) this.observaciones = localForm.observaciones;
      if (localForm.colmenaName) this.nombreColmena.set(localForm.colmenaName);
      this.loading.set(false);
    }

    this.inspeccionService.getInspeccionColmena(this.inspeccionId, this.colmenaId).subscribe({
      next: (dto) => {
        if (dto && !localForm) {
          if (dto.varroa) this.varroa.set(dto.varroa);
          if (dto.estadoReina) this.estadoReina.set(dto.estadoReina);
          if (dto.nivelAlimento) this.nivelAlimento.set(dto.nivelAlimento);
          if (dto.produjoMiel !== undefined) this.produjoMiel.set(dto.produjoMiel);
          if (dto.observaciones) this.observaciones = dto.observaciones;
          if (dto.colmenaName) this.nombreColmena.set(dto.colmenaName);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private autoSaveLocal(): void {
    this.draftService.saveColmenaFormProgress(this.apiarioId, this.colmenaId, {
      inspeccionId: this.inspeccionId,
      colmenaId: this.colmenaId,
      colmenaName: this.nombreColmena(),
      varroa: this.varroa(),
      estadoReina: this.estadoReina(),
      nivelAlimento: this.nivelAlimento(),
      produjoMiel: this.produjoMiel(),
      observaciones: this.observaciones,
    });
  }

  setVarroa(val: 'NO_DETECTADA' | 'DETECTADA'): void {
    this.varroa.set(val);
    this.autoSaveLocal();
  }

  setEstadoReina(val: 'VISTA_Y_SANA' | 'NO_VISTA' | 'CELDA_REAL' | 'AUSENTE'): void {
    this.estadoReina.set(val);
    this.autoSaveLocal();
  }

  setNivelAlimento(val: 'BAJO' | 'MEDIO' | 'ALTO'): void {
    this.nivelAlimento.set(val);
    this.autoSaveLocal();
  }

  setProdujoMiel(val: boolean): void {
    this.produjoMiel.set(val);
    this.autoSaveLocal();
  }

  onObservacionesChange(): void {
    this.autoSaveLocal();
  }

  guardarColmena(): void {
    const payload: InspeccionColmenaDTO = {
      inspeccionId: this.inspeccionId,
      colmenaId: this.colmenaId,
      colmenaName: this.nombreColmena(),
      varroa: this.varroa(),
      estadoReina: this.estadoReina(),
      nivelAlimento: this.nivelAlimento(),
      produjoMiel: this.produjoMiel(),
      observaciones: this.observaciones,
    };

    this.draftService.saveColmenaCompletada(this.apiarioId, this.colmenaId, payload);

    this.inspeccionService
      .saveInspeccionColmena(this.inspeccionId, this.colmenaId, payload)
      .subscribe({
        next: () => {
          this.router.navigate(['/apiarios', this.apiarioId, 'inspecciones', 'nueva'], {
            queryParams: { inspeccionId: this.inspeccionId },
          });
        },
        error: (err) => {
          console.error('Error al guardar inspección de colmena:', err);
          this.router.navigate(['/apiarios', this.apiarioId, 'inspecciones', 'nueva'], {
            queryParams: { inspeccionId: this.inspeccionId },
          });
        },
      });
  }

  // ── Audio: carga ─────────────────────────────────────────────────────────────

  /**
   * Busca en IndexedDB el audio asociado a esta inspección+colmena.
   * La clave de búsqueda está codificada en el label generado al guardar.
   */
  private async cargarAudioGuardado(): Promise<void> {
    this.isLoadingAudio = true;
    this.cdr.markForCheck();
    try {
      const todos = await this.indexedDbAudio.getAllAudios();
      const audioKey = this.buildAudioKey();
      const encontrado = todos.find((a) => a.label === audioKey);
      if (encontrado) {
        this.savedAudio = encontrado;
        this.savedAudioUrl = URL.createObjectURL(encontrado.blob);
      } else {
        this.savedAudio = null;
        this.savedAudioUrl = null;
      }
    } finally {
      this.isLoadingAudio = false;
      this.cdr.markForCheck();
    }
  }

  /** Clave única para identificar el audio de esta colmena en esta inspección */
  private buildAudioKey(): string {
    return `inspeccion-${this.inspeccionId}-colmena-${this.colmenaId}`;
  }

  // ── Audio: grabación ─────────────────────────────────────────────────────────

  async startRecording(): Promise<void> {
    this.recorderErrorMessage = null;
    this.recorderState = 'requesting-permission';
    this.cdr.markForCheck();

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      this.recorderState = 'idle';
      this.recorderErrorMessage =
        'No se pudo acceder al micrófono. Verificá los permisos del navegador.';
      this.cdr.markForCheck();
      return;
    }

    try {
      const mimeType = this.pickSupportedMimeType();
      this.mediaRecorder = mimeType
        ? new MediaRecorder(this.mediaStream, { mimeType })
        : new MediaRecorder(this.mediaStream);

      this.recordedChunks = [];

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) this.recordedChunks.push(event.data);
      };

      this.mediaRecorder.onstop = () => {
        this.handleRecordingStopped();
        this.cdr.markForCheck();
      };

      this.mediaRecorder.onerror = () => {
        this.stopMediaTracks();
        this.clearRecordingTimer();
        this.recorderState = 'idle';
        this.recorderErrorMessage =
          'La grabación se interrumpió inesperadamente. Intentá de nuevo.';
        this.cdr.markForCheck();
      };

      this.mediaRecorder.start();
      this.recorderState = 'recording';
      this.recordingStartedAt = Date.now();
      this.recordingSeconds = 0;
      this.recordingTimerHandle = setInterval(() => {
        this.recordingSeconds = Math.floor((Date.now() - this.recordingStartedAt) / 1000);
        this.cdr.markForCheck();
      }, 1000);

      this.cdr.markForCheck();
    } catch {
      this.stopMediaTracks();
      this.recorderState = 'idle';
      this.recorderErrorMessage =
        'No se pudo iniciar la grabación en este navegador. Probá con otro dispositivo.';
      this.cdr.markForCheck();
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.clearRecordingTimer();
    this.stopMediaTracks();
    this.cdr.markForCheck();
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
    this.cdr.markForCheck();
  }

  async savePreview(): Promise<void> {
    if (!this.pendingPreviewBlob) return;

    this.isSavingPreview = true;
    this.recorderErrorMessage = null;
    this.cdr.markForCheck();

    try {
      const wavBlob = await convertBlobToVoskWav(this.pendingPreviewBlob);

      const record: Omit<AudioRecord, 'id'> = {
        blob: wavBlob,
        label: this.buildAudioKey(),
        createdAt: new Date(),
        durationSeconds: this.recordingSeconds,
        sampleRate: 16000,
        sizeBytes: wavBlob.size,
        transcriptionStatus: 'pending',
      };

      await this.indexedDbAudio.addAudio(record);
      await this.cargarAudioGuardado();
      this.discardPreview();
    } catch {
      this.recorderErrorMessage =
        'No se pudo guardar el audio. El formato puede no ser compatible con este navegador.';
    } finally {
      this.isSavingPreview = false;
      this.cdr.markForCheck();
    }
  }

  // ── Audio: acciones sobre el audio guardado ──────────────────────────────────

  async deleteAudio(): Promise<void> {
    if (!this.savedAudio?.id) return;

    await this.indexedDbAudio.deleteAudio(this.savedAudio.id);

    if (this.savedAudioUrl) {
      URL.revokeObjectURL(this.savedAudioUrl);
      this.savedAudioUrl = null;
    }
    this.savedAudio = null;
    this.cdr.markForCheck();
  }

  async transcribeAudio(): Promise<void> {
    if (!this.savedAudio?.id) return;

    this.savedAudio.transcriptionStatus = 'transcribing';
    this.savedAudio.transcriptionError = undefined;
    this.cdr.markForCheck();

    try {
      const filename = `audio_inspeccion_${this.inspeccionId}_colmena_${this.colmenaId}.wav`;
      const result = await this.transcriptionService.transcribeAudio(
        this.savedAudio.blob,
        filename,
      );
      this.savedAudio.transcriptionStatus = 'done';
      this.savedAudio.transcriptionText = result.transcription;
    } catch (error) {
      this.savedAudio.transcriptionStatus = 'error';
      this.savedAudio.transcriptionError =
        error instanceof Error ? error.message : 'Error desconocido al transcribir';
    } finally {
      await this.indexedDbAudio.updateAudio(this.savedAudio);
      this.cdr.markForCheck();
    }
  }

  // ── Audio: reproductor custom ────────────────────────────────────────────────

  togglePlay(player: HTMLAudioElement): void {
    if (player.paused) {
      player.play();
    } else {
      player.pause();
    }
  }

  seekTo(event: MouseEvent, track: HTMLElement, player: HTMLAudioElement): void {
    if (!player.duration || !isFinite(player.duration)) return;
    const rect = track.getBoundingClientRect();
    const fraction = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    player.currentTime = fraction * player.duration;
  }

  getProgressPercent(player: HTMLAudioElement): number {
    if (!player.duration || !isFinite(player.duration)) return 0;
    return (player.currentTime / player.duration) * 100;
  }

  getPlayerTimeLabel(player: HTMLAudioElement): string {
    const seconds = player.currentTime > 0 ? player.currentTime : player.duration || 0;
    return this.formatDuration(Math.floor(isFinite(seconds) ? seconds : 0));
  }

  /** Handler vacío: fuerza detección de cambios ante eventos del <audio> nativo */
  onPlayerTick(): void {}

  // ── Utilidades ───────────────────────────────────────────────────────────────

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

  private pickSupportedMimeType(): string | null {
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
    for (const candidate of candidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(candidate)) {
        return candidate;
      }
    }
    return null;
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
}
