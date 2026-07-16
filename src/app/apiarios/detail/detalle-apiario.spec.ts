import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleApiario } from './detalle-apiario';

describe('DetalleApiario', () => {
  let component: DetalleApiario;
  let fixture: ComponentFixture<DetalleApiario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleApiario],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalleApiario);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
