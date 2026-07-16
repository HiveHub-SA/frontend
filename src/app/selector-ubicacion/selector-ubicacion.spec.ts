import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectorUbicacion } from './selector-ubicacion';

describe('SelectorUbicacion', () => {
  let component: SelectorUbicacion;
  let fixture: ComponentFixture<SelectorUbicacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectorUbicacion],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectorUbicacion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
