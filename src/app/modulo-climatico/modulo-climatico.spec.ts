import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModuloClimaticoComponent } from './modulo-climatico';
import { provideHttpClient } from '@angular/common/http';

describe('ModuloClimaticoComponent', () => {
  let component: ModuloClimaticoComponent;
  let fixture: ComponentFixture<ModuloClimaticoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModuloClimaticoComponent],
      providers: [provideHttpClient()]
    }).compileComponents();

    fixture = TestBed.createComponent(ModuloClimaticoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
