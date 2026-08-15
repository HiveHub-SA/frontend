import { TestBed } from '@angular/core/testing';
import { InspeccionDraftService } from '../../src/app/inspecciones/inspeccion-draft.service';
import { InspeccionColmenaDTO } from '../../src/app/inspecciones/inspeccion.model';

describe('InspeccionDraftService (Pruebas APB / Edge Cases)', () => {
  let service: InspeccionDraftService;
  const APIARIO_ID = 10;
  const STORAGE_KEY = `hivehub_draft_apiario_${APIARIO_ID}`;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InspeccionDraftService);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('debe crear el servicio correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe guardar y retornar un borrador local general (US 15)', () => {
    service.saveDraft(APIARIO_ID, { floracion: 'Girasol', inspeccionId: 100 });

    const draft = service.getDraft(APIARIO_ID);
    expect(draft).not.toBeNull();
    expect(draft?.floracion).toBe('Girasol');
    expect(draft?.inspeccionId).toBe(100);
  });

  it('debe guardar continuamente el borrador en progreso por colmena (US 15)', () => {
    const progressForm: Partial<InspeccionColmenaDTO> = {
      varroa: 'DETECTADA',
      estadoReina: 'VISTA_Y_SANA',
      nivelAlimento: 'ALTO',
      produjoMiel: true,
      observaciones: 'Probando auto-guardado en tiempo real'
    };

    service.saveColmenaFormProgress(APIARIO_ID, 1, progressForm);

    const savedProgress = service.getColmenaDraftData(APIARIO_ID, 1);
    expect(savedProgress).not.toBeNull();
    expect(savedProgress?.varroa).toBe('DETECTADA');
    expect(savedProgress?.observaciones).toBe('Probando auto-guardado en tiempo real');
  });

  it('debe tolerar y recuperarse limpiamente ante JSON corrupto en localStorage (APB)', () => {
    // Inyectar JSON corrupto en localStorage simulando manipulación por consola
    localStorage.setItem(STORAGE_KEY, '{ json_malformado_corrupto ...');

    const draft = service.getDraft(APIARIO_ID);
    expect(draft).toBeNull();
  });

  it('debe purgar limpiamente el borrador al finalizar (clearDraft)', () => {
    service.saveDraft(APIARIO_ID, { floracion: 'Eucalipto' });
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();

    service.clearDraft(APIARIO_ID);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
