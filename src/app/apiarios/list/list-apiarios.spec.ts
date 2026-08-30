import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApiarioListComponent } from './list-apiarios';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

describe('ApiarioListComponent', () => {
  let component: ApiarioListComponent;
  let fixture: ComponentFixture<ApiarioListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApiarioListComponent],
      providers: [provideHttpClient(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(ApiarioListComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
