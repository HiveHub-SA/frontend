import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioRecorderComponent } from './audio-recorder';
import { provideHttpClient } from '@angular/common/http';

describe('AudioRecorderComponent', () => {
  let component: AudioRecorderComponent;
  let fixture: ComponentFixture<AudioRecorderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AudioRecorderComponent],
      providers: [provideHttpClient()]
    }).compileComponents();

    fixture = TestBed.createComponent(AudioRecorderComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
