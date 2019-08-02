import { Component, OnInit } from '@angular/core';

import { getFFT, getBands, getFFTInternal, getBandsInternal } from './audio';
import { Mixer } from './audio/mixer';


@Component({
  selector: 'audioviz-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  public waveformAnalyzer: AnalyserNode;
  public freqAnalyser: AnalyserNode;
  public audioCtx: AudioContext;
  public elementSource: MediaElementAudioSourceNode;
  public element: HTMLAudioElement;
  public source: AudioBufferSourceNode;

  // public volume: number = 0.75;
  public get volume(): number {
    return this.mixer.gain;
  }
  public set volume(value: number) {
    this.mixer.gain = value;
  }

  public get maxDecibels(): number {
    if (!this.freqAnalyser) return null;
    return this.freqAnalyser.maxDecibels;
  }
  public set maxDecibels(value: number) {
    if (!this.freqAnalyser) return;
    this.freqAnalyser.maxDecibels = value;
  }
  public get minDecibels(): number {
    if (!this.freqAnalyser) return null;
    return this.freqAnalyser.minDecibels;
  }
  public set minDecibels(value: number) {
    if (!this.freqAnalyser) return;
    this.freqAnalyser.minDecibels = value;
  }
  public multiplier: number = 40;

  public get playbackRate(): number {
    if (!this.source) {
      return 0;
    }

    return this.source.playbackRate.value;
  }
  public set playbackRate(value: number) {
    if (!this.source) {
      return;
    }

    this.source.playbackRate.value = value;
  }
  private cachedPlaybackRate: number = 1;
  private cachedTime: number = 0;

  // FPS
  private fps: number = 30;
  // private now: Date;
  private then: number = Date.now();
  private interval = 1000 / this.fps;
  private delta: number;

  private xPosWaveform: number;
  private xPosWaveFormJustLeft: boolean = false;

  public canvas: HTMLCanvasElement;
  public canvasCtx: CanvasRenderingContext2D;
  public waveformCanvas: HTMLCanvasElement;
  public waveformCtx: CanvasRenderingContext2D;

  public mixer: Mixer;

  public ngOnInit() {
    this.audioCtx = new ((<any> window).AudioContext || (<any> window).webkitAudioContext)();
    this.mixer = new Mixer(this.audioCtx);
    this.mixer.createNewTrack();
    // this.gainNode = this.audioCtx.createGain();
    // this.gainNode.gain.value = this.volume;
    // this.gainNode.connect(this.audioCtx.destination);
    this.waveformAnalyzer = this.audioCtx.createAnalyser();
    this.mixer.connectAfterGain(this.waveformAnalyzer);


    // new AudioCon
    // this.audioCtx.audioWorklet.addModule('assets/white-noise-processor.js').then(() => {
    //   const whiteNoiseNode = new AudioWorkletNode(this.audioCtx, 'white-noise-processor');
    //   // console.log(whiteNoiseNode);
    //   // whiteNoiseNode.connect(this.gainNode);
    // });

    this.waveformAnalyzer.fftSize = 2048;
    this.waveformAnalyzer.fftSize = 8192;

    this.canvas = document.querySelector('#oscilloscope') as HTMLCanvasElement;
    this.canvasCtx = this.canvas.getContext('2d');
    this.waveformCanvas = document.querySelector('#waveform') as HTMLCanvasElement;
    this.waveformCtx = this.waveformCanvas.getContext('2d');

    this.waveformCanvas.addEventListener('click', (event) => {
      if (!this.source) {
        return;
      }
      const x = event.offsetX;
      const y = event.offsetY;
      console.log('Clicked here:', x, y);
      const percent = x / this.waveformCanvas.width;
      console.log('Percentage:', percent);
      const playbackRate = this.source.playbackRate.value;
      console.log(playbackRate);
      this.source.stop();
      this.createAudioSource(this.source.buffer);

      this.mixer.connectAfterGain(this.freqAnalyser);

      console.log('Playing at', percent * this.source.buffer.duration);
      this.source.start(0, percent * this.source.buffer.duration);
      this.source.playbackRate.value = playbackRate;
    });

    this.waveformCanvas.addEventListener('mousemove', (event) => {
      this.xPosWaveform = event.offsetX;
    });

    this.waveformCanvas.addEventListener('mouseleave', (event) => {
      this.xPosWaveform = null;
      this.xPosWaveFormJustLeft = true;
    });

    this.volume = 0.75;

    // const audioUrl = 'assets/september.mp3';
    // const request = new XMLHttpRequest();
    // request.open('GET', audioUrl, true);
    // request.responseType = 'arraybuffer';
    // request.onload = () => {
    //   const arrayBuffer = request.response as ArrayBuffer;
    //   this.decodeAudioData(arrayBuffer).then(() => {
    //     this.source.start();
    //     this.pause();
    //   });
    // };
    // request.send();

    // const osc = this.audioCtx.createOscillator();
    // osc.connect(this.gainNode);
    // osc.frequency.value = 880;
    // osc.setPeriodicWave(new PeriodicWave(this.audioCtx, {real: [0, Math.sin(Math.PI/2), Math.sin(Math.PI), Math.sin(Math.PI/2*3)]}));
    // osc.start();
  }

  public play() {
    this.playbackRate = this.cachedPlaybackRate;
  }

  public pause() {
    this.cachedPlaybackRate = this.playbackRate;
    this.playbackRate = 0;
  }


  public setUp(file: File) {
    if (this.source) {
      this.source.stop(0);
    }
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      this.decodeAudioData(arrayBuffer).then(() => {
        this.source.start();
        this.pause();
      });
    };

    reader.readAsArrayBuffer(file);
  }

  private generateSawWave() {
    const samples = 10000;
    const audioBuffer = new AudioBuffer({length: samples, sampleRate: 3000});
    const data = audioBuffer.getChannelData(0);
    let accum = 0;
    for (let i = 0; i < samples; i++) {
      accum += 0.1;
      if (accum > 1) {
        accum = 0;
      }
      data[i] = accum;
    }

    return audioBuffer;
  }

  private generateSineWave() {
    const samples = 10000;
    const audioBuffer = new AudioBuffer({length: samples, sampleRate: 3000});
    const data = audioBuffer.getChannelData(0);
    let accum = 0;
    for (let i = 0; i < samples; i++) {
      data[i] = Math.sin(i);
    }

    return audioBuffer;
  }

  private decodeAudioData(arrayBuffer: ArrayBuffer) {
      return this.audioCtx.decodeAudioData(arrayBuffer)
      .then((audioBuffer) => {
        // audioBuffer = this.generateSawWave();
        this.createAudioSource(audioBuffer);
        this.visualize(audioBuffer);
      })
      .catch(function (error) {
        console.error('Error with decoding audio data', error);
      });
  }

  private createAudioSource(buffer) {
    this.source = this.audioCtx.createBufferSource();
    this.source.buffer = buffer;
    this.source.connect(this.mixer.masterTrack);
  }

  private visualize(buffer: AudioBuffer) {
      const data = buffer.getChannelData(0);
      // TODO: merge stereo channels
      // signal[i] = (fb[2*i] + fb[2*i+1]) / 2;

      this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.freqAnalyser = this.audioCtx.createAnalyser();

      this.mixer.connectAfterGain(this.freqAnalyser);

      this.freqAnalyser.fftSize = 4096;
      this.freqAnalyser.maxDecibels = -10;
      this.freqAnalyser.minDecibels = -100;


      this.waveformCanvasValues = new Array(this.waveformCanvas.width);
      const step = Math.floor(buffer.length / this.waveformCanvas.width);
      this.waveformCtx.clearRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
      const maxHeight = 100;
      for (let i = 0; i < this.waveformCanvas.width; i++) {
        // Mirrored
        const percentX = i / this.waveformCanvas.width;
        const center = Math.floor(percentX * data.length);
        let height = 0;
        for (let j = 0; j < step; j++) {
          height += Math.abs(data[center - step / 2 + j] * maxHeight);
        }
        height /= step;
        this.waveformCanvasValues[i] = height;
      }

      this.waveformCtx.clearRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
      this.waveformCanvasValues.forEach((height, i) => {
        this.drawBar(this.waveformCtx, i, maxHeight - height, 1, 2 * height, '#aaa');
      });

      // Loops
      this.draw(buffer, data);




      // source.connect(audioCtx.destination);
      this.source.loop = true;
      this.source.playbackRate.value = 1;
      // this.source.start();

  }

  private drawBar(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    ctx.restore();
  }

  private waveformCanvasValues = [];

  private draw(buffer: AudioBuffer, data: Float32Array) {
    requestAnimationFrame(() => {
      this.draw(buffer, data);
    });

    const now = Date.now();
    this.delta = now - this.then;
    if (this.delta <= this.interval) {
      return;
    }

    this.then = now - (this.delta % this.interval);

    // END FPS

    const step = Math.floor(buffer.length / this.waveformCanvas.width);
    const maxHeight = 100;

    if (this.xPosWaveform) {
      this.waveformCtx.clearRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
      this.waveformCanvasValues.forEach((height, i) => {
        this.drawBar(this.waveformCtx, i, maxHeight - height, 1, 2 * height, '#aaa');
      });
      const range = 25;
      const min = -Math.floor(range / 2);
      const max = Math.ceil(range / 2);
      for (let i = min; i < max; i++) {
        const percentX = (this.xPosWaveform + i) / this.waveformCanvas.width;
        const center = Math.floor(percentX * data.length);
        let height = 0;
        for (let j = 0; j < step; j++) {
          height += Math.abs(data[center - step / 2 + j] * maxHeight);
        }
        height /= step;
        this.drawBar(this.waveformCtx, this.xPosWaveform + i, maxHeight - height, 1, 2 * height, 'red');
      }
      this.drawBar(this.waveformCtx, this.xPosWaveform - 1, 0, 3, 200, '#333');
    } else if (this.xPosWaveFormJustLeft) {
      this.xPosWaveFormJustLeft = false;
      this.waveformCtx.clearRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
      this.waveformCanvasValues.forEach((height, i) => {
        this.drawBar(this.waveformCtx, i, maxHeight - height, 1, 2 * height, '#aaa');
      });
    }

    // Don't update visualization if paused
    // if (this.playbackRate === 0) {
    //   return;
    // }
    this.drawBars();
    this.drawWave();

    // Draw playing cursor
    // const percent = this.audioCtx.currentTime / this.source.buffer.duration;
    // console.log(percent);
    // console.log(percent * this.waveformCanvas.width);
    // console.log(this.audioCtx.currentTime);
    // this.drawBar(this.waveformCtx, percent * this.waveformCanvas.width, 0, 1, this.waveformCanvas.height, 'pink');
  }

  private drawWave() {
    const bufferLengthw = this.waveformAnalyzer.fftSize;
    const dataArrayw = new Uint8Array(bufferLengthw);

    this.waveformAnalyzer.getByteTimeDomainData(dataArrayw);
    this.canvasCtx.fillStyle = 'rgb(255, 255, 255)';
    // canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    this.canvasCtx.lineWidth = 2;
    this.canvasCtx.strokeStyle = 'rgb(200, 200, 200)';
    this.canvasCtx.beginPath();
    const sliceWidth = this.canvas.width * 1.0 / bufferLengthw;
    let x = 0;
    for (let i = 0; i < bufferLengthw; i++) {
      const v = dataArrayw[i] / 255;
      const y = (this.canvas.height / 2) + (this.canvas.height / 4) * (v - 0.5);

      if ( i === 0) {
        this.canvasCtx.moveTo(x, y);
      } else {
        this.canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.canvasCtx.lineTo(this.canvas.width, this.canvas.height / 2);
    this.canvasCtx.stroke();
  }

  private m = 2;

  private curMaxX = -1;

  private prevCurMax = -Infinity;
  private drawBars() {
    const bufferLength = this.freqAnalyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    this.freqAnalyser.getByteFrequencyData(dataArray);


    this.canvasCtx.fillStyle = 'rgb(0, 0, 0)';
    this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    let xPos = 0;

    const bands = getBandsInternal(100, this.freqAnalyser).slice(1);

    const padding = 1;
    const extra = (bands.length) * padding;
    const barWidth = ((this.canvas.width - extra) / (bands.length));
    for (let i = 0; i < bands.length; i++) {
      let divider = 3;
      if (i >= bands.length - (bands.length * 0.01) || i <= bands.length * 0.01) {
        divider = 12;
      } else if (i >= bands.length - (bands.length * 0.02) || i <= bands.length * 0.02) {
        divider = 11;
      } else if (i >= bands.length - (bands.length * 0.03) || i <= bands.length * 0.03) {
        divider = 10;
      } else if (i >= bands.length - (bands.length * 0.04) || i <= bands.length * 0.04) {
        divider = 9;
      } else if (i >= bands.length - (bands.length * 0.05) || i <= bands.length * 0.05) {
        divider = 8;
      } else if (i >= bands.length - (bands.length * 0.06) || i <= bands.length * 0.06) {
        divider = 7;
      } else if (i >= bands.length - (bands.length * 0.07) || i <= bands.length * 0.07) {
        divider = 6;
      } else if (i >= bands.length - (bands.length * 0.08) || i <= bands.length * 0.08) {
        divider = 5;
      } else if (i >= bands.length - (bands.length * 0.09) || i <= bands.length * 0.09) {
        divider = 4;
      }
      // 0 - 1
      let barHeight = bands[i];
      const prev = bands[i - 1] || barHeight;
      const next = bands[i + 1] || barHeight;
      barHeight = ((barHeight + prev + next) / divider) * Math.log10(this.multiplier);
      // this.canvasCtx.fillStyle = 'rgb(' + (barHeight * 255 + 100) + ', 50, 50)';
      this.canvasCtx.fillStyle = 'rgb(0, ' + (barHeight * 255 + 100) + ', 255)';
      const height = barHeight * this.canvas.height / 2;
      this.canvasCtx.fillRect(xPos, this.canvas.height - height, barWidth, Math.max(1, height));
      xPos += barWidth + padding;
    }

    xPos = 0;

    const fftData = getFFTInternal(this.freqAnalyser);

    const start = 0;
    const end = fftData.length - 500;

    const padding2 = 0;
    const extra2 = (end - start) * padding2;
    const barWidth2 = ((this.canvas.width - extra2) / (end - start));
    for (let i = start; i < end; i++) {
      let barHeight = fftData[i];
      const prev = fftData[i - 1] || barHeight;
      const next = fftData[i + 1] || barHeight;
      barHeight = (barHeight + prev + next) / 3;
      this.canvasCtx.fillStyle = 'rgb(' + (barHeight * 255 + 100) + ', 255, 50)';
      barHeight = barHeight * this.canvas.height / 2;
      this.canvasCtx.fillRect(xPos, 100 - barHeight / 2, barWidth2, barHeight);
      xPos += barWidth2 + padding2;
    }
  }
}
