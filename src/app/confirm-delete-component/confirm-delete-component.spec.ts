import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfirmDeleteComponent } from './confirm-delete-component';

describe('ConfirmDeleteComponent', () => {
  let component: ConfirmDeleteComponent;
  let fixture: ComponentFixture<ConfirmDeleteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDeleteComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDeleteComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
