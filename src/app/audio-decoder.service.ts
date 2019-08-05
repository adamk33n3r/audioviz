import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioDecoderService {

  constructor() { }

  public decodeAudioFile(audioCtx: AudioContext, file: File): Promise<AudioBuffer> {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        resolve(this.decodeAudioData(audioCtx, arrayBuffer));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  private decodeAudioData(audioCtx: AudioContext, arrayBuffer: ArrayBuffer) {
    return audioCtx.decodeAudioData(arrayBuffer)
    .catch(function (error) {
      console.error('Error with decoding audio data', error);
      throw error;
    });
  }
}
