import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrarApiarioComponent } from './registrar-apiario';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

describe('RegistrarApiarioComponent', () => {
  let component: RegistrarApiarioComponent;
  let fixture: ComponentFixture<RegistrarApiarioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrarApiarioComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrarApiarioComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
