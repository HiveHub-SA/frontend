import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificacionesClima } from './notificaciones-clima';

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
