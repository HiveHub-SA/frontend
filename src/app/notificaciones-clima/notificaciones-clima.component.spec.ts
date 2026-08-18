import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificacionesClima } from './notificaciones-clima';
import { AlertasClimaService } from '../modulo-climatico/alertas-clima.service';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('NotificacionesClimaComponent (Historia 14)', () => {
  let component: NotificacionesClima;
  let fixture: ComponentFixture<NotificacionesClima>;
  let alertasServiceMock: Partial<AlertasClimaService>;

  beforeEach(async () => {
    // Creamos un mock del servicio usando Angular Signals
    alertasServiceMock = {
      alertas: signal([]),
    };

    await TestBed.configureTestingModule({
      imports: [NotificacionesClima],
      providers: [
        { provide: AlertasClimaService, useValue: alertasServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NotificacionesClima);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('El usuario consulta un apiario con lluvias extremas y no muestra ninguna alerta (falla)', () => {
    // Simulamos que el servicio falló y no cargó la alerta en el signal
    alertasServiceMock.alertas?.set([]);
    
    component.mostrarDropdown = true; // Forzamos abrir el panel
    fixture.detectChanges();

    // Verificamos que se muestre el estado vacío cuando debió haber una alerta[cite: 4]
    const emptyState = fixture.debugElement.query(By.css('.empty-alerts')).nativeElement;
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent).toContain('Sin alertas extremas registradas');
  });

  it('El usuario consulta un apiario sin clima extremo y muestra una alerta (falla)', () => {
    // Forzamos una alerta "falsa" en un clima normal para simular la falla
    alertasServiceMock.alertas?.set([{
      id: 'falsa-alerta', apiarioId: 1, nombreApiario: 'Apiario Falso', lat: 0, lng: 0,
      tipo: 'calor', nivel: 'peligro', titulo: 'Calor', mensaje: 'Falso positivo', icono: 'wb_sunny'
    }]);

    component.mostrarDropdown = true;
    fixture.detectChanges();

    // Verificamos que se renderiza el div .alerta-item cuando no debería existir[cite: 4]
    const alertaRenderizada = fixture.debugElement.query(By.css('.alerta-item'));
    expect(alertaRenderizada).toBeTruthy();
    
    // Verificamos el badge rojo[cite: 4]
    const badge = fixture.debugElement.query(By.css('.badge-count')).nativeElement;
    expect(badge.textContent.trim()).toBe('1');
  });
});