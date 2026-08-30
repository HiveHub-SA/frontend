import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColmenaDetailComponent } from './detalle-colmena';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

describe('ColmenaDetailComponent', () => {
  let component: ColmenaDetailComponent;
  let fixture: ComponentFixture<ColmenaDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColmenaDetailComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ColmenaDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
