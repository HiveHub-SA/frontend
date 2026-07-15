import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleColmena } from './detalle-colmena';

describe('DetalleColmena', () => {
  let component: DetalleColmena;
  let fixture: ComponentFixture<DetalleColmena>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleColmena],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalleColmena);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
