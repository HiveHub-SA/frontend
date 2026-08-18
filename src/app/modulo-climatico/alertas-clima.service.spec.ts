import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AlertasClimaService } from './alertas-clima.service';
import { ClimaService, WeatherData } from './clima.service';
import { of } from 'rxjs';

describe('AlertasClimaService (Historia 14)', () => {
  let service: AlertasClimaService;
  let climaServiceSpy: jasmine.SpyObj<ClimaService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ClimaService', ['obtenerClimaApiario']);

    TestBed.configureTestingModule({
      providers: [
        AlertasClimaService,
        { provide: ClimaService, useValue: spy }
      ]
    });
    service = TestBed.inject(AlertasClimaService);
    climaServiceSpy = TestBed.inject(ClimaService) as jasmine.SpyObj<ClimaService>;
  });

  it('Consulta de un apiario con pronóstico de lluvias extremas muestra alerta visual (pasa)', fakeAsync(() => {
    const mockClimaLluvia: WeatherData = {
      temp: 20, condicion: 'Tormenta', humedad: 90, iconoCode: 1087, esDeDia: true, alertaLluvia: null,
      horas: [{ hora: '10:00', temp: 20, iconoCode: 1087, probabilidadLluvia: 80 }]
    };
    
    climaServiceSpy.obtenerClimaApiario.and.returnValue(of(mockClimaLluvia));
    
    service.evaluarApiarios([{ id: 1, nombre: 'Apiario 1', lat: -32, lng: -63 }]);
    tick(); // Avanza el ciclo de observables

    const alertas = service.alertas();
    expect(alertas.length).toBe(1);
    expect(alertas[0].tipo).toBe('lluvia');
    expect(alertas[0].nivel).toBe('peligro');
  }));

  it('Consulta de un apiario con pronóstico de caída brusca de temperatura muestra alerta visual (pasa)', fakeAsync(() => {
    const mockClimaFrio: WeatherData = {
      temp: 5, condicion: 'Despejado', humedad: 40, iconoCode: 1000, esDeDia: true, alertaLluvia: null,
      horas: [{ hora: '10:00', temp: 5, iconoCode: 1000, probabilidadLluvia: 0 }]
    };
    
    climaServiceSpy.obtenerClimaApiario.and.returnValue(of(mockClimaFrio));
    
    service.evaluarApiarios([{ id: 2, nombre: 'Apiario 2', lat: -32, lng: -63 }]);
    tick();

    const alertas = service.alertas();
    expect(alertas.length).toBe(1);
    expect(alertas[0].tipo).toBe('frio');
    expect(alertas[0].mensaje).toContain('Las abejas formarán el bolo invernal');
  }));

  it('Consulta sin condiciones climáticas extremas no muestra ninguna alerta (pasa)', fakeAsync(() => {
    const mockClimaNormal: WeatherData = {
      temp: 22, condicion: 'Despejado', humedad: 40, iconoCode: 1000, esDeDia: true, alertaLluvia: null,
      horas: [{ hora: '10:00', temp: 22, iconoCode: 1000, probabilidadLluvia: 0 }]
    };
    
    climaServiceSpy.obtenerClimaApiario.and.returnValue(of(mockClimaNormal));
    
    service.evaluarApiarios([{ id: 3, nombre: 'Apiario 3', lat: -32, lng: -63 }]);
    tick();

    expect(service.alertas().length).toBe(0);
    expect(service.alertaToastInicial()).toBeFalse();
  }));
});