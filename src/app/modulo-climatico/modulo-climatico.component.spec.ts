import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModuloClimaticoComponent } from './modulo-climatico';
import { ClimaService, WeatherData } from './clima.service';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('ModuloClimaticoComponent (Historia 07)', () => {
  let component: ModuloClimaticoComponent;
  let fixture: ComponentFixture<ModuloClimaticoComponent>;
  let climaServiceSpy: jasmine.SpyObj<ClimaService>;

  const mockDataCompleta: WeatherData = {
    temp: 24, condicion: 'Despejado', humedad: 45, iconoCode: 1000, esDeDia: true, alertaLluvia: null,
    horas: [
      { hora: '10:00', temp: 25, iconoCode: 1000, probabilidadLluvia: 0 },
      { hora: '11:00', temp: 26, iconoCode: 1000, probabilidadLluvia: 0 },
      { hora: '12:00', temp: 26, iconoCode: 1003, probabilidadLluvia: 10 },
      { hora: '13:00', temp: 22, iconoCode: 1183, probabilidadLluvia: 80 },
      { hora: '14:00', temp: 20, iconoCode: 1183, probabilidadLluvia: 90 }
    ]
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ClimaService', ['obtenerClimaApiario']);

    await TestBed.configureTestingModule({
      imports: [ModuloClimaticoComponent],
      providers: [{ provide: ClimaService, useValue: spy }]
    }).compileComponents();

    fixture = TestBed.createComponent(ModuloClimaticoComponent);
    component = fixture.componentInstance;
    climaServiceSpy = TestBed.inject(ClimaService) as jasmine.SpyObj<ClimaService>;
  });

  it('El usuario selecciona un apiario y el sistema muestra el clima actual y pronóstico 5 horas (pasa)', () => {
    climaServiceSpy.obtenerClimaApiario.and.returnValue(of(mockDataCompleta));
    component.visible = true;
    component.apiario = { nombre: 'Apiario Central', lat: -32.41, lng: -63.32 };
    
    // Disparamos el ciclo de vida OnChanges manualmente para el test
    component.ngOnChanges({
      visible: { currentValue: true, previousValue: false, firstChange: true, isFirstChange: () => true }
    });
    
    fixture.detectChanges();

    // Verificamos que la UI muestre la temperatura actual[cite: 2]
    const tempPrincipal = fixture.debugElement.query(By.css('.temp-value')).nativeElement;
    expect(tempPrincipal.textContent).toContain('24°C');

    // Verificamos que se rendericen las 5 horas[cite: 2]
    const horasCards = fixture.debugElement.queryAll(By.css('.hora-card'));
    expect(horasCards.length).toBe(5);
  });

  it('El usuario consulta el clima y el sistema muestra únicamente el clima actual, sin el pronóstico (falla)', () => {
    // Simulamos un error en la data donde las horas vienen vacías
    const dataIncompleta = { ...mockDataCompleta, horas: [] };
    climaServiceSpy.obtenerClimaApiario.and.returnValue(of(dataIncompleta));
    
    component.apiario = { nombre: 'Apiario Central', lat: -32.41, lng: -63.32 };
    component.cargarClima();
    fixture.detectChanges();

    // La UI no debe renderizar tarjetas de hora[cite: 2]
    const horasCards = fixture.debugElement.queryAll(By.css('.hora-card'));
    expect(horasCards.length).toBe(0); // Debería fallar la expectativa del usuario de ver 5 tarjetas
  });

  it('El usuario selecciona un apiario y el sistema consulta usando coordenadas de otro apiario (falla)', () => {
    climaServiceSpy.obtenerClimaApiario.and.returnValue(of(mockDataCompleta));
    component.apiario = { nombre: 'Apiario Norte', lat: -30.00, lng: -60.00 }; // Coordenadas incorrectas
    
    component.cargarClima();
    
    // Verificamos que el servicio haya sido llamado con las coordenadas erróneas que forzamos
    expect(climaServiceSpy.obtenerClimaApiario).toHaveBeenCalledWith(-30.00, -60.00);
  });
});