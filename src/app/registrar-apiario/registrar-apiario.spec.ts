import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MockRegistrarApiario } from './registrar-apiario';

describe('MockRegistrarApiario', () => {
  let component: MockRegistrarApiario;
  let fixture: ComponentFixture<MockRegistrarApiario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockRegistrarApiario],
    }).compileComponents();

    fixture = TestBed.createComponent(MockRegistrarApiario);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
