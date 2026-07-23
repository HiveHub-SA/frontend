import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapaInteractivo } from './mapa-interactivo';

describe('MapaInteractivo', () => {
  let component: MapaInteractivo;
  let fixture: ComponentFixture<MapaInteractivo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapaInteractivo],
    }).compileComponents();

    fixture = TestBed.createComponent(MapaInteractivo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
