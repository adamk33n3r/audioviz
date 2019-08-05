import { TestBed } from '@angular/core/testing';

import { AudioDecoderService } from './audio-decoder.service';

describe('AudioDecoderService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AudioDecoderService = TestBed.get(AudioDecoderService);
    expect(service).toBeTruthy();
  });
});
