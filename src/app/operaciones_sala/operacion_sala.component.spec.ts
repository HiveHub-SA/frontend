import { TestBed, ComponentFixture } from '@angular/core/testing';
import { OperacionSalaComponent } from './operacion_sala.component';
import { OperacionSalaService } from './operacion_sala.service';
import { of } from 'rxjs';

describe('OperacionSalaComponent', () => {
  let component: OperacionSalaComponent;
  let fixture: ComponentFixture<OperacionSalaComponent>;
  let mockService: jasmine.SpyObj<OperacionSalaService>;

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('OperacionSalaService', [
      'obtenerResumen',
      'obtenerHistorial',
      'registrarOperacion',
      'obtenerApiarios'
    ]);
    
    mockService.obtenerApiarios.and.returnValue(of([
      { id: 1, name: 'Apiario 1', createdAt: '2026-07-10T12:00:00', latitude: -34.0, longitude: -59.0 }
    ]));
    mockService.obtenerResumen.and.returnValue(of({ totalMielExtraida: 100, alzasProcesadas: 10, alzasEnEspera: 5 }));
    mockService.obtenerHistorial.and.returnValue(of([]));
    mockService.registrarOperacion.and.returnValue(of({
      id: 1,
      fecha: '2026-07-10',
      tipoOperacion: 'INGRESO',
      cantidadAlzas: 10,
      temporada: '2025/2026',
      apiariosNombres: ['Apiario 1']
    }));

    await TestBed.configureTestingModule({
      imports: [OperacionSalaComponent],
      providers: [
        { provide: OperacionSalaService, useValue: mockService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OperacionSalaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize screen data on init', () => {
    expect(mockService.obtenerApiarios).toHaveBeenCalled();
    expect(mockService.obtenerResumen).toHaveBeenCalledWith('2025/2026');
    expect(mockService.obtenerHistorial).toHaveBeenCalledWith('2025/2026');
    expect(component.resumen().totalMielExtraida).toBe(100);
    expect(component.resumen().alzasProcesadas).toBe(10);
    expect(component.resumen().alzasEnEspera).toBe(5);
  });

  it('should open and close the modal correctly', () => {
    component.abrirModal();
    expect(component.mostrarModal()).toBeTrue();
    expect(component.cantidadAlzasForm()).toBe(0);
    expect(component.kilosMielForm()).toBe(0);
    expect(component.tipoOperacionForm()).toBe('INGRESO');

    component.cerrarModal();
    expect(component.mostrarModal()).toBeFalse();
  });

  it('should switch form type correctly', () => {
    component.cambiarTipoFormulario('EXTRACCION');
    expect(component.tipoOperacionForm()).toBe('EXTRACCION');

    component.cambiarTipoFormulario('INGRESO');
    expect(component.tipoOperacionForm()).toBe('INGRESO');
  });

  it('should increment and decrement alzas form signal', () => {
    component.cantidadAlzasForm.set(2);

    component.incrementarAlzas();
    expect(component.cantidadAlzasForm()).toBe(3);

    component.decrementarAlzas();
    expect(component.cantidadAlzasForm()).toBe(2);

    component.decrementarAlzas();
    component.decrementarAlzas();
    // Should not go below 0
    component.decrementarAlzas();
    expect(component.cantidadAlzasForm()).toBe(0);
  });

  it('should submit registration and refresh data', () => {
    component.abrirModal();
    component.fechaForm.set('2026-11-10');
    component.cantidadAlzasForm.set(5);
    component.tipoOperacionForm.set('INGRESO');
    component.apiariosSeleccionadosForm.set([1]);

    spyOn(component, 'cargarDatosPantalla');
    component.guardarRegistro();

    expect(mockService.registrarOperacion).toHaveBeenCalled();
    expect(component.mostrarModal()).toBeFalse();
    expect(component.cargarDatosPantalla).toHaveBeenCalled();
  });
});
