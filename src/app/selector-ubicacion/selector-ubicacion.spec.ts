import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectorUbicacionComponent } from './selector-ubicacion';
import { provideHttpClient } from '@angular/common/http';

describe('SelectorUbicacionComponent', () => {
  let component: SelectorUbicacionComponent;
  let fixture: ComponentFixture<SelectorUbicacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectorUbicacionComponent],
      providers: [provideHttpClient()]
    }).compileComponents();

    fixture = TestBed.createComponent(SelectorUbicacionComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
