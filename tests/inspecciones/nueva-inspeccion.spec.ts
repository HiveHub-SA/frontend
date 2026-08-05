import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NuevaInspeccionComponent } from '../../src/app/inspecciones/nueva/nueva-inspeccion';
import { InspeccionService } from '../../src/app/inspecciones/inspeccion.service';
import { ApiarioService } from '../../src/app/apiarios/apiario.service';
import { InspeccionDraftService } from '../../src/app/inspecciones/inspeccion-draft.service';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('NuevaInspeccionComponent (Pruebas APB y Clics Múltiples)', () => {
  let component: NuevaInspeccionComponent;
  let fixture: ComponentFixture<NuevaInspeccionComponent>;
  let mockInspeccionService: jasmine.SpyObj<InspeccionService>;
  let mockApiarioService: jasmine.SpyObj<ApiarioService>;
  let mockDraftService: jasmine.SpyObj<InspeccionDraftService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockInspeccionService = jasmine.createSpyObj('InspeccionService', [
      'getInspeccionById',
      'getInspeccionesByApiario',
      'getInspeccionesColmenas',
      'updateFloracion',
      'createInspeccion',
      'finalizarInspeccion'
    ]);
    mockApiarioService = jasmine.createSpyObj('ApiarioService', ['getApiarioById']);
    mockDraftService = jasmine.createSpyObj('InspeccionDraftService', [
      'getDraft',
      'saveDraft',
      'clearDraft'
    ]);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [NuevaInspeccionComponent],
      providers: [
        { provide: InspeccionService, useValue: mockInspeccionService },
        { provide: ApiarioService, useValue: mockApiarioService },
        { provide: InspeccionDraftService, useValue: mockDraftService },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { id: '10' },
              queryParams: {}
            }
          }
        }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    mockApiarioService.getApiarioById.and.returnValue(of({
      id: 10,
      name: 'Apiario Central',
      latitude: -34.6,
      longitude: -58.4,
      createdAt: '2026-08-01T00:00:00',
      colmenas: [{ id: 1, name: 'Colmena #01', createdAt: '2026-08-01T00:00:00' }]
    }));
    mockInspeccionService.getInspeccionesByApiario.and.returnValue(of([]));
    mockDraftService.getDraft.and.returnValue(null);

    fixture = TestBed.createComponent(NuevaInspeccionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crear el componente de Nueva Inspección', () => {
    expect(component).toBeTruthy();
  });

  it('debe seleccionar una floración y guardar borrador local continuo (US 35 / US 15)', () => {
    component.seleccionarFloracion('Trébol');

    expect(component.floracionActual()).toBe('Trébol');
    expect(mockDraftService.saveDraft).toHaveBeenCalledWith(10, { floracion: 'Trébol' });
  });

  it('debe purgar el borrador local al finalizar la inspección con éxito', () => {
    component.inspeccionId = 12;
    mockInspeccionService.finalizarInspeccion.and.returnValue(of({ id: 12, estado: 'SINCRONIZADA', apiarioId: 10, fecha: '' }));

    component.finalizarInspeccion();

    expect(mockDraftService.clearDraft).toHaveBeenCalledWith(10);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/apiarios', 10, 'inspecciones']);
  });
});
