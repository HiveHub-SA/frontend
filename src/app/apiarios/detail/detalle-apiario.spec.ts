import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApiarioDetailComponent } from './detalle-apiario';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

describe('ApiarioDetailComponent', () => {
  let component: ApiarioDetailComponent;
  let fixture: ComponentFixture<ApiarioDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApiarioDetailComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ApiarioDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
