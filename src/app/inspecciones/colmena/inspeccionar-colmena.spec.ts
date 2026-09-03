import { ComponentFixture, TestBed } from "@angular/core/testing";
import { InspeccionarColmenaComponent } from "./inspeccionar-colmena";
import { TranscriptionService } from "../../audio-recorder/services/transcription.service";
import { ActivatedRoute } from "@angular/router";
import { ApiarioService } from "../../apiarios/apiario.service";
import { InspeccionService } from "../inspeccion.service";
import { InspeccionDraftService } from "../inspeccion-draft.service";
import { IndexedDbAudioService } from "../../audio-recorder/services/indexed-db-audio.service";

describe('InspeccionarColmenaComponent - Completar formulario con IA', () => {
  let component: InspeccionarColmenaComponent;
  let fixture: ComponentFixture<InspeccionarColmenaComponent>;
  let transcriptionServiceSpy: jasmine.SpyObj<TranscriptionService>;

  beforeEach(async () => {
    transcriptionServiceSpy = jasmine.createSpyObj('TranscriptionService', [
      'transcribeAudio',
      'completarFormulario',
    ]);

    await TestBed.configureTestingModule({
      imports: [InspeccionarColmenaComponent], 
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { params: {} } } },
        { provide: ApiarioService, useValue: jasmine.createSpyObj('ApiarioService', ['getApiarioById']) },
        { provide: InspeccionService, useValue: jasmine.createSpyObj('InspeccionService', ['getInspeccionColmena']) },
        { provide: InspeccionDraftService, useValue: jasmine.createSpyObj('InspeccionDraftService', ['getColmenaDraftData', 'saveColmenaFormProgress']) },
        { provide: IndexedDbAudioService, useValue: jasmine.createSpyObj('IndexedDbAudioService', ['updateAudio']) },
        { provide: TranscriptionService, useValue: transcriptionServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(InspeccionarColmenaComponent);
    component = fixture.componentInstance;
  });

  // Pruebas #1 y #2: botón según conectividad
  it('debe poner isOnline en false al recibir el evento "offline"', () => {
    fixture.detectChanges(); 
    window.dispatchEvent(new Event('offline'));
    expect(component.isOnline()).toBeFalse();
  });

  it('debe poner isOnline en true al recibir el evento "online"', () => {
    fixture.detectChanges();
    window.dispatchEvent(new Event('online'));
    expect(component.isOnline()).toBeTrue();
  });

  // Prueba #3: transcribe automáticamente si hace falta
 it('debe transcribir el audio antes de completar si todavía no fue transcripto', async () => {
    component.isOnline.set(true);
    component.savedAudio = {
    id: 1,
    blob: new Blob(['audio-fake'], { type: 'audio/wav' }),
    transcriptionStatus: 'idle',
    transcriptionText: undefined,
 } as any;

    transcriptionServiceSpy.transcribeAudio.and.callFake(async () => {
        return { transcription: 'texto transcripto' };
    });
    transcriptionServiceSpy.completarFormulario.and.resolveTo({
        estadoReina: 'VISTA_Y_SANA', nivelAlimento: null, produjoMiel: null, observaciones: null,
    });

    await component.completarFormularioConIA();

    expect(transcriptionServiceSpy.transcribeAudio).toHaveBeenCalled();
    expect(transcriptionServiceSpy.completarFormulario).toHaveBeenCalledWith('texto transcripto');
 });

  // Prueba #4: solo pisa los campos no nulos
  it('no debe modificar un campo que la IA devolvió en null', async () => {
    component.isOnline.set(true);
    component.savedAudio = { transcriptionStatus: 'done', transcriptionText: 'texto' } as any;
    component.setNivelAlimento('BAJO'); // valor previo cargado por el usuario

    transcriptionServiceSpy.completarFormulario.and.resolveTo({
      estadoReina: 'VISTA_Y_SANA', nivelAlimento: null, produjoMiel: true, observaciones: null,
    });

    await component.completarFormularioConIA();

    expect(component.estadoReina()).toBe('VISTA_Y_SANA');
    expect(component.nivelAlimento()).toBe('BAJO'); // no lo tocó
  });

  // Prueba #6: corrección manual posterior al autocompletado
  it('debe permitir corregir manualmente un campo autocompletado por la IA', async () => {
    component.isOnline.set(true);
    component.savedAudio = { transcriptionStatus: 'done', transcriptionText: 'texto' } as any;

    transcriptionServiceSpy.completarFormulario.and.resolveTo({
      estadoReina: 'AUSENTE', nivelAlimento: null, produjoMiel: null, observaciones: null,
    });

    await component.completarFormularioConIA();
    expect(component.estadoReina()).toBe('AUSENTE');

    component.setEstadoReina('VISTA_Y_SANA'); // corrección manual del usuario
    expect(component.estadoReina()).toBe('VISTA_Y_SANA');
  });

  // Prueba #7: error visible al usuario
  it('debe mostrar un error si el servicio de IA falla', async () => {
    component.isOnline.set(true);
    component.savedAudio = { transcriptionStatus: 'done', transcriptionText: 'texto' } as any;

    transcriptionServiceSpy.completarFormulario.and.rejectWith(new Error('Groq no disponible'));

    await component.completarFormularioConIA();

    expect(component.formularioIAError).toBe('Groq no disponible');
  });
});