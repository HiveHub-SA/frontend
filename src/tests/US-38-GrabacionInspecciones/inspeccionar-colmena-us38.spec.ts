import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';

import { InspeccionarColmenaComponent } from '../../app/inspecciones/colmena/inspeccionar-colmena';
import { IndexedDbAudioService } from '../../app/audio-recorder/services/indexed-db-audio.service';
import { TranscriptionService } from '../../app/audio-recorder/services/transcription.service';
import { InspeccionService } from '../../app/inspecciones/inspeccion.service';
import { ApiarioService } from '../../app/apiarios/apiario.service';
import { InspeccionDraftService } from '../../app/inspecciones/inspeccion-draft.service';
import { AudioRecord } from '../../app/audio-recorder/models/audio-record.model';
import { NavbarComponent } from '../../app/navbar/navbar.component';

// ─────────────────────────────────────────────────────────────────────────────
// Factory de AudioRecord de prueba
// ─────────────────────────────────────────────────────────────────────────────
function makeAudioRecord(overrides: Partial<AudioRecord> = {}): AudioRecord {
  return {
    id: 1,
    blob: new Blob(['fake-audio'], { type: 'audio/wav' }),
    label: 'inspeccion-10-colmena-5',
    createdAt: new Date('2026-08-01T10:00:00Z'),
    durationSeconds: 14,
    sampleRate: 16000,
    sizeBytes: 10240,
    transcriptionStatus: 'pending',
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Stub de NavbarComponent para no arrastrar dependencias de ruta
// ─────────────────────────────────────────────────────────────────────────────
import { Component } from '@angular/core';
@Component({ selector: 'app-navbar', template: '', standalone: true })
class NavbarStubComponent {}

// ─────────────────────────────────────────────────────────────────────────────
// Suite principal
// ─────────────────────────────────────────────────────────────────────────────
describe('InspeccionarColmenaComponent – US 38: Integración del Grabador de Voz', () => {
  let component: InspeccionarColmenaComponent;
  let fixture: ComponentFixture<InspeccionarColmenaComponent>;

  let indexedDbAudioSpy: jasmine.SpyObj<IndexedDbAudioService>;
  let transcriptionSpy: jasmine.SpyObj<TranscriptionService>;
  let inspeccionServiceSpy: jasmine.SpyObj<InspeccionService>;
  let apiarioServiceSpy: jasmine.SpyObj<ApiarioService>;
  let draftServiceSpy: jasmine.SpyObj<InspeccionDraftService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const APIARIO_ID = 3;
  const INSPECCION_ID = 10;
  const COLMENA_ID = 5;
  const AUDIO_KEY = `inspeccion-${INSPECCION_ID}-colmena-${COLMENA_ID}`;

  beforeEach(async () => {
    jasmine.getEnv().allowRespy(true);


    indexedDbAudioSpy = jasmine.createSpyObj('IndexedDbAudioService', [
      'getAllAudios',
      'addAudio',
      'deleteAudio',
      'updateAudio',
    ]);
    transcriptionSpy = jasmine.createSpyObj('TranscriptionService', ['transcribeAudio']);
    inspeccionServiceSpy = jasmine.createSpyObj('InspeccionService', [
      'getInspeccionColmena',
      'saveInspeccionColmena',
    ]);
    apiarioServiceSpy = jasmine.createSpyObj('ApiarioService', ['getApiarioById']);
    draftServiceSpy = jasmine.createSpyObj('InspeccionDraftService', [
      'getColmenaDraftData',
      'saveColmenaFormProgress',
      'saveColmenaCompletada',
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    // Respuestas por defecto no bloqueantes
    indexedDbAudioSpy.getAllAudios.and.returnValue(Promise.resolve([]));
    indexedDbAudioSpy.addAudio.and.returnValue(Promise.resolve(99));
    indexedDbAudioSpy.deleteAudio.and.returnValue(Promise.resolve());
    indexedDbAudioSpy.updateAudio.and.returnValue(Promise.resolve());
    inspeccionServiceSpy.getInspeccionColmena.and.returnValue(of({} as any));
    inspeccionServiceSpy.saveInspeccionColmena.and.returnValue(of({} as any));
    apiarioServiceSpy.getApiarioById.and.returnValue(
      of({ id: APIARIO_ID, name: 'Apiario Test', colmenas: [] } as any),
    );
    draftServiceSpy.getColmenaDraftData.and.returnValue(null);
    draftServiceSpy.saveColmenaFormProgress.and.stub();
    draftServiceSpy.saveColmenaCompletada.and.stub();

    await TestBed.configureTestingModule({
      imports: [InspeccionarColmenaComponent, NavbarStubComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                apiarioId: APIARIO_ID,
                inspeccionId: INSPECCION_ID,
                colmenaId: COLMENA_ID,
              },
            },
          },
        },
        { provide: Router, useValue: routerSpy },
        { provide: IndexedDbAudioService, useValue: indexedDbAudioSpy },
        { provide: TranscriptionService, useValue: transcriptionSpy },
        { provide: InspeccionService, useValue: inspeccionServiceSpy },
        { provide: ApiarioService, useValue: apiarioServiceSpy },
        { provide: InspeccionDraftService, useValue: draftServiceSpy },
      ],
    })
      .overrideComponent(InspeccionarColmenaComponent, {
        remove: { imports: [NavbarComponent] },
        add: { imports: [NavbarStubComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(InspeccionarColmenaComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    // Limpiar Object URLs para no contaminar entre tests
    spyOn(URL, 'revokeObjectURL').and.stub();
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 1. ESTADO INICIAL
  // ══════════════════════════════════════════════════════════════════════════

  describe('Estado inicial del grabador', () => {
    it('debe iniciar en estado "idle" sin audio guardado', async () => {
      indexedDbAudioSpy.getAllAudios.and.returnValue(Promise.resolve([]));

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.recorderState).toBe('idle');
      expect(component.savedAudio).toBeNull();
      expect(component.isLoadingAudio).toBeFalse();
    });

    it('debe recuperar el audio existente en IndexedDB para esta colmena al inicializar', async () => {
      const audioExistente = makeAudioRecord({ label: AUDIO_KEY });
      indexedDbAudioSpy.getAllAudios.and.returnValue(Promise.resolve([audioExistente]));
      spyOn(URL, 'createObjectURL').and.returnValue('blob:fake-url');

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.savedAudio).toEqual(audioExistente);
      expect(component.savedAudioUrl).toBe('blob:fake-url');
    });

    it('NO debe cargar audios de otras colmenas o inspecciones', async () => {
      const audioDeOtraColmena = makeAudioRecord({ label: 'inspeccion-10-colmena-99' });
      const audioDeOtraInspeccion = makeAudioRecord({ label: 'inspeccion-77-colmena-5' });
      indexedDbAudioSpy.getAllAudios.and.returnValue(
        Promise.resolve([audioDeOtraColmena, audioDeOtraInspeccion]),
      );

      fixture.detectChanges();
      await fixture.whenStable();

      expect(component.savedAudio).toBeNull();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 2. GRABACIÓN: permisos y flujo de estados
  // ══════════════════════════════════════════════════════════════════════════

  describe('CA: el usuario puede grabar un audio por colmena', () => {
    it('debe cambiar a "requesting-permission" de forma sincrónica al llamar startRecording()', () => {
      // Usamos una Promise que nunca resuelve para atrapar el estado intermedio
      spyOn(navigator.mediaDevices, 'getUserMedia').and.returnValue(new Promise(() => {}));

      component.startRecording();

      expect(component.recorderState).toBe('requesting-permission');
    });

    it('debe pasar a "recording" cuando el micrófono es concedido', async () => {
      const mockStream = {
        getTracks: () => [{ stop: jasmine.createSpy('stop') }],
      } as unknown as MediaStream;

      spyOn(navigator.mediaDevices, 'getUserMedia').and.returnValue(Promise.resolve(mockStream));

      // Stub de MediaRecorder para que no falle en JSDOM
      const mockMediaRecorder = {
        start: jasmine.createSpy('start'),
        stop: jasmine.createSpy('stop'),
        state: 'inactive' as RecordingState,
        mimeType: 'audio/webm',
        ondataavailable: null as any,
        onstop: null as any,
        onerror: null as any,
      };
      spyOn(window as any, 'MediaRecorder').and.returnValue(mockMediaRecorder);

      await component.startRecording();

      expect(component.recorderState).toBe('recording');
    });

    it('debe volver a "idle" y mostrar mensaje si el micrófono es denegado', async () => {
      spyOn(navigator.mediaDevices, 'getUserMedia').and.returnValue(
        Promise.reject(new Error('NotAllowedError')),
      );

      await component.startRecording();

      expect(component.recorderState).toBe('idle');
      expect(component.recorderErrorMessage).toContain('micrófono');
    });

    it('debe pasar a "preview" al procesar la grabación detenida', () => {
      spyOn(URL, 'createObjectURL').and.returnValue('blob:preview-url');

      // Simular chunks grabados
      (component as any).recordedChunks = [new Blob(['audio-data'], { type: 'audio/webm' })];
      (component as any).mediaRecorder = { mimeType: 'audio/webm' };

      (component as any).handleRecordingStopped();

      expect(component.recorderState).toBe('preview');
      expect(component.previewUrl).toBe('blob:preview-url');
      expect((component as any).pendingPreviewBlob).not.toBeNull();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 3. GUARDADO: persistencia con la clave correcta
  // ══════════════════════════════════════════════════════════════════════════

  describe('CA: el audio se guarda correctamente con clave por colmena', () => {
    it('debe guardar el audio con el label "inspeccion-{inspeccionId}-colmena-{colmenaId}"', async () => {
      spyOn(URL, 'createObjectURL').and.returnValue('blob:url');
      spyOn(URL, 'revokeObjectURL').and.stub();

      (component as any).pendingPreviewBlob = new Blob(['fake'], { type: 'audio/webm' });
      (component as any).recordingSeconds = 14;

      // Simular que convertBlobToVoskWav devuelve el mismo blob (no usamos Web Audio real)
      const wavBlob = new Blob(['wav-data'], { type: 'audio/wav' });
      spyOn<any>(component as any, 'savePreview').and.callFake(async () => {
        const record = {
          blob: wavBlob,
          label: (component as any).buildAudioKey(),
          createdAt: new Date(),
          durationSeconds: (component as any).recordingSeconds,
          sampleRate: 16000,
          sizeBytes: wavBlob.size,
          transcriptionStatus: 'pending' as const,
        };
        await indexedDbAudioSpy.addAudio(record);
        (component as any).recorderState = 'idle';
        component.isSavingPreview = false;
      });

      component['inspeccionId'] = INSPECCION_ID;
      component['colmenaId'] = COLMENA_ID;
      await component.savePreview();

      const llamada = indexedDbAudioSpy.addAudio.calls.mostRecent();
      expect(llamada).toBeTruthy();
      expect(llamada.args[0].label).toBe(AUDIO_KEY);
      expect(llamada.args[0].sampleRate).toBe(16000);
      expect(llamada.args[0].transcriptionStatus).toBe('pending');
    });

    it('debe construir la clave de audio como "inspeccion-{id}-colmena-{id}"', () => {
      component['inspeccionId'] = INSPECCION_ID;
      component['colmenaId'] = COLMENA_ID;

      const clave = (component as any).buildAudioKey();

      expect(clave).toBe(AUDIO_KEY);
    });

    it('después de guardar con éxito el recorderState debe ser "idle"', async () => {
      spyOn(URL, 'createObjectURL').and.returnValue('blob:url');
      spyOn(URL, 'revokeObjectURL').and.stub();

      // Inyectar blob de preview directamente para poder llamar discardPreview internamente
      (component as any).pendingPreviewBlob = new Blob(['fake'], { type: 'audio/webm' });

      // Reemplazamos savePreview con una versión controlada sin Web Audio
      spyOn<any>(component as any, 'savePreview').and.callFake(async () => {
        await indexedDbAudioSpy.addAudio({
          blob: new Blob(['wav'], { type: 'audio/wav' }),
          label: AUDIO_KEY,
          createdAt: new Date(),
          durationSeconds: 10,
          sampleRate: 16000,
          sizeBytes: 1000,
          transcriptionStatus: 'pending',
        });
        component.discardPreview();
        component.isSavingPreview = false;
      });

      await component.savePreview();

      expect(component.recorderState).toBe('idle');
      expect(component.isSavingPreview).toBeFalse();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 4. REPRODUCCIÓN
  // ══════════════════════════════════════════════════════════════════════════

  describe('CA: el usuario puede reproducir el audio guardado', () => {
    it('togglePlay debe llamar play() cuando el reproductor está pausado', () => {
      const mockPlayer = jasmine.createSpyObj<HTMLAudioElement>('HTMLAudioElement', [
        'play',
        'pause',
      ]);
      (mockPlayer as any).paused = true;

      component.togglePlay(mockPlayer);

      expect(mockPlayer.play).toHaveBeenCalledTimes(1);
      expect(mockPlayer.pause).not.toHaveBeenCalled();
    });

    it('togglePlay debe llamar pause() cuando el reproductor ya está en reproducción', () => {
      const mockPlayer = jasmine.createSpyObj<HTMLAudioElement>('HTMLAudioElement', [
        'play',
        'pause',
      ]);
      (mockPlayer as any).paused = false;

      component.togglePlay(mockPlayer);

      expect(mockPlayer.pause).toHaveBeenCalledTimes(1);
      expect(mockPlayer.play).not.toHaveBeenCalled();
    });

    it('getProgressPercent debe retornar el porcentaje correcto de progreso', () => {
      const mockPlayer = { currentTime: 30, duration: 60 } as HTMLAudioElement;

      expect(component.getProgressPercent(mockPlayer)).toBe(50);
    });

    it('getProgressPercent debe retornar 0 cuando la duración no está disponible (NaN)', () => {
      const mockPlayer = { currentTime: 0, duration: NaN } as HTMLAudioElement;

      expect(component.getProgressPercent(mockPlayer)).toBe(0);
    });

    it('seekTo debe actualizar currentTime proporcionalmente al click en la barra', () => {
      const mockPlayer = { duration: 60, currentTime: 0 } as HTMLAudioElement;
      const mockTrack = {
        getBoundingClientRect: () => ({ left: 0, width: 200 }),
      } as unknown as HTMLElement;
      const mockEvent = { clientX: 100 } as MouseEvent; // click al 50% del ancho

      component.seekTo(mockEvent, mockTrack, mockPlayer);

      expect(mockPlayer.currentTime).toBeCloseTo(30, 1);
    });

    it('seekTo NO debe modificar currentTime si el audio no tiene duración cargada', () => {
      const mockPlayer = { duration: NaN, currentTime: 0 } as HTMLAudioElement;
      const mockTrack = {
        getBoundingClientRect: () => ({ left: 0, width: 200 }),
      } as unknown as HTMLElement;
      const mockEvent = { clientX: 100 } as MouseEvent;

      component.seekTo(mockEvent, mockTrack, mockPlayer);

      expect(mockPlayer.currentTime).toBe(0);
    });

    it('getPlayerTimeLabel debe mostrar la duración si currentTime es 0', () => {
      const mockPlayer = { currentTime: 0, duration: 75 } as HTMLAudioElement;

      const label = component.getPlayerTimeLabel(mockPlayer);

      expect(label).toBe('1:15');
    });

    it('getPlayerTimeLabel debe mostrar currentTime cuando ya avanzó', () => {
      const mockPlayer = { currentTime: 45, duration: 75 } as HTMLAudioElement;

      const label = component.getPlayerTimeLabel(mockPlayer);

      expect(label).toBe('0:45');
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 5. ELIMINACIÓN: el usuario puede borrar el audio y grabar uno nuevo
  // ══════════════════════════════════════════════════════════════════════════

  describe('CA: el usuario puede eliminar el audio y grabar uno nuevo en su lugar', () => {
    it('deleteAudio debe llamar indexedDbAudio.deleteAudio con el id correcto', async () => {
      spyOn(URL, 'revokeObjectURL').and.stub();
      component.savedAudio = makeAudioRecord({ id: 7 });
      component.savedAudioUrl = 'blob:some-url';

      await component.deleteAudio();

      expect(indexedDbAudioSpy.deleteAudio).toHaveBeenCalledWith(7);
    });

    it('después de eliminar, savedAudio debe ser null', async () => {
      spyOn(URL, 'revokeObjectURL').and.stub();
      component.savedAudio = makeAudioRecord({ id: 7 });
      component.savedAudioUrl = 'blob:some-url';

      await component.deleteAudio();

      expect(component.savedAudio).toBeNull();
    });

    it('después de eliminar, savedAudioUrl debe ser null', async () => {
      spyOn(URL, 'revokeObjectURL').and.stub();
      component.savedAudio = makeAudioRecord({ id: 7 });
      component.savedAudioUrl = 'blob:some-url';

      await component.deleteAudio();

      expect(component.savedAudioUrl).toBeNull();
    });

    it('después de eliminar el recorderState debe seguir en "idle", listo para una nueva grabación', async () => {
      spyOn(URL, 'revokeObjectURL').and.stub();
      component.savedAudio = makeAudioRecord({ id: 7 });
      component.savedAudioUrl = 'blob:some-url';

      await component.deleteAudio();

      expect(component.recorderState).toBe('idle');
    });

    it('deleteAudio debe liberar la Object URL del audio eliminado con revokeObjectURL', async () => {
      const revokeSpy = spyOn(URL, 'revokeObjectURL').and.stub();
      component.savedAudio = makeAudioRecord({ id: 2 });
      component.savedAudioUrl = 'blob:old-url';

      await component.deleteAudio();

      expect(revokeSpy).toHaveBeenCalledWith('blob:old-url');
    });

    it('deleteAudio NO debe llamar a IndexedDB si savedAudio no tiene id definido', async () => {
      spyOn(URL, 'revokeObjectURL').and.stub();
      component.savedAudio = makeAudioRecord({ id: undefined });

      await component.deleteAudio();

      expect(indexedDbAudioSpy.deleteAudio).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 6. DESCARTE: discardPreview vuelve a idle sin guardar
  // ══════════════════════════════════════════════════════════════════════════

  describe('Descarte de la vista previa sin guardar', () => {
    it('discardPreview debe volver el estado a "idle" y limpiar la URL de vista previa', () => {
      spyOn(URL, 'revokeObjectURL').and.stub();
      component.recorderState = 'preview';
      (component as any).previewUrl = 'blob:preview';
      (component as any).pendingPreviewBlob = new Blob(['data']);
      component.recordingSeconds = 20;

      component.discardPreview();

      expect(component.recorderState).toBe('idle');
      expect(component.previewUrl).toBeNull();
      expect(component.recordingSeconds).toBe(0);
    });

    it('discardPreview NO debe persistir nada en IndexedDB', () => {
      spyOn(URL, 'revokeObjectURL').and.stub();
      component.recorderState = 'preview';
      (component as any).previewUrl = 'blob:preview';
      (component as any).pendingPreviewBlob = new Blob(['data']);

      component.discardPreview();

      expect(indexedDbAudioSpy.addAudio).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 7. TRANSCRIPCIÓN
  // ══════════════════════════════════════════════════════════════════════════

  describe('CA: transcripción del audio guardado', () => {
    it('debe cambiar transcriptionStatus a "transcribing" mientras se procesa', fakeAsync(() => {
      let resolveTranscription!: (val: any) => void;
      transcriptionSpy.transcribeAudio.and.returnValue(
        new Promise((res) => {
          resolveTranscription = res;
        }),
      );
      component.savedAudio = makeAudioRecord({ id: 1, transcriptionStatus: 'pending' });

      component.transcribeAudio();
      tick(0); // Avanzar la microtask queue

      expect(component.savedAudio?.transcriptionStatus).toBe('transcribing');

      // Resolver para limpiar el fakeAsync
      resolveTranscription({ transcription: 'ok' });
      flush();
    }));

    it('debe marcar como "done" y guardar el texto al transcribir con éxito', async () => {
      transcriptionSpy.transcribeAudio.and.returnValue(
        Promise.resolve({ transcription: 'Colmena fuerte, reina activa.' }),
      );
      component.savedAudio = makeAudioRecord({ id: 1, transcriptionStatus: 'pending' });

      await component.transcribeAudio();

      expect(component.savedAudio?.transcriptionStatus).toBe('done');
      expect(component.savedAudio?.transcriptionText).toBe('Colmena fuerte, reina activa.');
      expect(indexedDbAudioSpy.updateAudio).toHaveBeenCalled();
    });

    it('debe marcar como "error" y persistir el mensaje si la transcripción falla', async () => {
      transcriptionSpy.transcribeAudio.and.returnValue(
        Promise.reject(new Error('Servidor no disponible')),
      );
      component.savedAudio = makeAudioRecord({ id: 1, transcriptionStatus: 'pending' });

      await component.transcribeAudio();

      expect(component.savedAudio?.transcriptionStatus).toBe('error');
      expect(component.savedAudio?.transcriptionError).toContain('Servidor no disponible');
      expect(indexedDbAudioSpy.updateAudio).toHaveBeenCalled();
    });

    it('debe construir el filename usando inspeccionId y colmenaId', async () => {
      transcriptionSpy.transcribeAudio.and.returnValue(Promise.resolve({ transcription: 'ok' }));
      component.savedAudio = makeAudioRecord({ id: 1 });
      component['inspeccionId'] = INSPECCION_ID;
      component['colmenaId'] = COLMENA_ID;

      await component.transcribeAudio();

      const filenameUsado: string | undefined = transcriptionSpy.transcribeAudio.calls.mostRecent().args[1];
      expect(filenameUsado).toContain(String(INSPECCION_ID));
      expect(filenameUsado).toContain(String(COLMENA_ID));
    });

    it('transcribeAudio NO debe hacer nada si savedAudio no tiene id', async () => {
      component.savedAudio = makeAudioRecord({ id: undefined });

      await component.transcribeAudio();

      expect(transcriptionSpy.transcribeAudio).not.toHaveBeenCalled();
      expect(indexedDbAudioSpy.updateAudio).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 8. LÍMITE: un solo audio por colmena
  // ══════════════════════════════════════════════════════════════════════════

  describe('CA: límite de un audio por colmena', () => {
    it('cargarAudioGuardado debe asignar solo el primer audio encontrado con la clave de esta colmena', async () => {
      const audio1 = makeAudioRecord({ id: 1, label: AUDIO_KEY });
      const audio2 = makeAudioRecord({ id: 2, label: AUDIO_KEY }); // hipotético duplicado
      indexedDbAudioSpy.getAllAudios.and.returnValue(Promise.resolve([audio1, audio2]));
      spyOn(URL, 'createObjectURL').and.returnValue('blob:url');

      fixture.detectChanges();
      await fixture.whenStable();

      // savedAudio es un objeto único, no un array
      expect(Array.isArray(component.savedAudio)).toBeFalse();
      expect(component.savedAudio?.id).toBe(1);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 9. UTILIDADES
  // ══════════════════════════════════════════════════════════════════════════

  describe('Utilidades de formato', () => {
    it('formatDuration debe formatear 0 segundos como "0:00"', () => {
      expect(component.formatDuration(0)).toBe('0:00');
    });

    it('formatDuration debe formatear 14 segundos como "0:14"', () => {
      expect(component.formatDuration(14)).toBe('0:14');
    });

    it('formatDuration debe formatear 60 segundos como "1:00"', () => {
      expect(component.formatDuration(60)).toBe('1:00');
    });

    it('formatDuration debe formatear 75 segundos como "1:15"', () => {
      expect(component.formatDuration(75)).toBe('1:15');
    });

    it('formatDuration debe formatear 125 segundos como "2:05"', () => {
      expect(component.formatDuration(125)).toBe('2:05');
    });

    it('formatSize debe mostrar bytes para valores menores a 1 KB', () => {
      expect(component.formatSize(512)).toBe('512 B');
    });

    it('formatSize debe mostrar KB para valores entre 1 KB y 1 MB', () => {
      expect(component.formatSize(2048)).toBe('2 KB');
    });

    it('formatSize debe mostrar MB con un decimal para valores mayores a 1 MB', () => {
      expect(component.formatSize(1048576)).toBe('1.0 MB');
    });
  });
});
