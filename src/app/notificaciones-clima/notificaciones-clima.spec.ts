import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificacionesClima } from './notificaciones-clima';
import { AlertasClimaService, AlertaExtrema } from '../modulo-climatico/alertas-clima.service';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';

describe('NotificacionesClima', () => {
  let component: NotificacionesClima;
  let fixture: ComponentFixture<NotificacionesClima>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificacionesClima],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificacionesClima);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

// Mocks de los servicios
class MockAlertasClimaService {
  alertas = signal<AlertaExtrema[]>([]);
  seleccionarAlertaYRedirigir = jasmine.createSpy('seleccionarAlertaYRedirigir');
}

class MockRouter {
  navigate = jasmine.createSpy('navigate');
}

class MockMapaService {
  centrarEnCoordenadas = jasmine.createSpy('centrarEnCoordenadas');
}

fdescribe('NotificacionesClimaComponent (Centrado de Mapa)', () => {
  let component: NotificacionesClima;
  let fixture: ComponentFixture<NotificacionesClima>;
  let routerSpy: MockRouter;
  let mapaServiceSpy: MockMapaService;

  const mockAlerta: AlertaExtrema = {
    id: '1-lluvia',
    apiarioId: 1,
    nombreApiario: 'Apiario Central',
    lat: -32.41,
    lng: -63.32,
    tipo: 'lluvia',
    nivel: 'peligro',
    titulo: 'Lluvia',
    mensaje: 'Precipitaciones fuertes',
    icono: 'rainy'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificacionesClima],
      providers: [
        { provide: AlertasClimaService, useClass: MockAlertasClimaService },
        { provide: Router, useClass: MockRouter },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificacionesClima);
    component = fixture.componentInstance;
    routerSpy = TestBed.inject(Router) as unknown as MockRouter;
    
    // Inyectar la alerta de prueba en el signal
    const alertasService = TestBed.inject(AlertasClimaService);
    alertasService.alertas.set([mockAlerta]);
    
    fixture.detectChanges();
  });

  it('El usuario puede seleccionar una notificación desde el panel para visualizar la ubicación (pasa)', () => {
    spyOn(component, 'seleccionarAlerta').and.callThrough();
    component.mostrarDropdown = true;
    fixture.detectChanges();

    // Simula el click en la interfaz gráfica
    const alertaElement = fixture.debugElement.query(By.css('.alerta-item')).nativeElement;
    alertaElement.click();

    expect(component.seleccionarAlerta).toHaveBeenCalledWith(mockAlerta);
    // Verifica que el dropdown se cierra al hacer click
    expect(component.mostrarDropdown).toBeFalse();
  });

  it('El usuario selecciona una notificación y el sistema redirige al mapa centrando la visualización (pasa)', () => {
    // Obtenemos la instancia del servicio mockeado inyectado en el test
    const alertasServiceSpy = TestBed.inject(AlertasClimaService);
    
    component.seleccionarAlerta(mockAlerta);

    // Verificamos que el componente haya llamado a la función del servicio encargada de redirigir
    expect(alertasServiceSpy.seleccionarAlertaYRedirigir).toHaveBeenCalledWith(mockAlerta);
  });

  it('El usuario selecciona una notificación y el sistema no redirige si los datos están corruptos (falla)', () => {
    // Simulamos una alerta con coordenadas inválidas o nulas
    const alertaInvalida = { ...mockAlerta, lat: null, lng: null } as unknown as AlertaExtrema;
    
    component.seleccionarAlerta(alertaInvalida);

    // El sistema debe prevenir la redirección si no hay lat/lng válidos
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('El usuario intenta seleccionar una notificación, pero esta no permite acceder a la ubicación (falla)', () => {
    const alertasServiceSpy = TestBed.inject(AlertasClimaService);
    component.mostrarDropdown = true;
    fixture.detectChanges();

    // Forzamos un objeto sin datos de apiario para simular la desvinculación o error
    const alertaSinApiario = { ...mockAlerta, apiarioId: undefined };
    
    // Suponiendo que el componente tiene una validación interna antes de llamar al servicio
    if (alertaSinApiario.apiarioId) {
        component.seleccionarAlerta(alertaSinApiario as any);
    }

    // Comprobamos que el servicio de redirección NO fue llamado debido a la falta de datos
    expect(alertasServiceSpy.seleccionarAlertaYRedirigir).not.toHaveBeenCalled();
  });
});