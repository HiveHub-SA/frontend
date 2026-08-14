import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioRecorder } from './audio-recorder';

describe('AudioRecorder', () => {
  let component: AudioRecorder;
  let fixture: ComponentFixture<AudioRecorder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AudioRecorder],
    }).compileComponents();

    fixture = TestBed.createComponent(AudioRecorder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
