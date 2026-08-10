import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModuloClimatico } from './modulo-climatico';

describe('ModuloClimatico', () => {
  let component: ModuloClimatico;
  let fixture: ComponentFixture<ModuloClimatico>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModuloClimatico],
    }).compileComponents();

    fixture = TestBed.createComponent(ModuloClimatico);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
