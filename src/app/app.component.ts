import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'audioviz-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  public waveformAnalyzer: AnalyserNode;
  public freqAnalyser: AnalyserNode;
  public freqAnalyzerBig: AnalyserNode;
  public gainNode: GainNode;
  public audioCtx: AudioContext;
  public source: AudioBufferSourceNode;

  // public volume: number = 0.75;
  public get volume(): number {
    return this.gainNode.gain.value;
  }
  public set volume(value: number) {
    console.log(value);
    this.gainNode.gain.value = value;
  }
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

  private xPosWaveform: number;

  public canvas: HTMLCanvasElement;
  public canvasCtx: CanvasRenderingContext2D;
  public waveformCanvas: HTMLCanvasElement;
  public waveformCtx: CanvasRenderingContext2D;

  public ngOnInit() {
    this.audioCtx = new ((<any> window).AudioContext || (<any> window).webkitAudioContext)();
    this.waveformAnalyzer = this.audioCtx.createAnalyser();
    // this.source.connect(this.analyser);
    this.gainNode = this.audioCtx.createGain();
    this.waveformAnalyzer.connect(this.gainNode);
    this.gainNode.gain.value = this.volume;
    this.gainNode.connect(this.audioCtx.destination);

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
      this.source.connect(this.waveformAnalyzer);
      this.source.connect(this.freqAnalyser);
      this.source.connect(this.freqAnalyzerBig);
      console.log('Playing at', percent * this.source.buffer.duration);
      this.source.start(0, percent * this.source.buffer.duration);
      this.source.playbackRate.value = playbackRate;
    });

    this.waveformCanvas.addEventListener('mousemove', (event) => {
      this.xPosWaveform = event.offsetX;
    });

    this.waveformCanvas.addEventListener('mouseleave', (event) => {
      this.xPosWaveform = null;
    });

    this.volume = 0.75;
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
      this.audioCtx.decodeAudioData(arrayBuffer)
      .then((audioBuffer) => {
        // SAW WAVE
        // const samples = 3000;
        // audioBuffer = new AudioBuffer({length: samples, sampleRate: 3000});
        // const data = audioBuffer.getChannelData(0);
        // let accum = 0;
        // for (let i = 0; i < samples; i++) {
        //   accum += 0.1;
        //   if (accum > 1) {
        //     accum = 0;
        //   }
        //   data[i] = accum;
        // }
        this.createAudioSource(audioBuffer);
        this.visualize(audioBuffer);
      })
      .catch(function (error) {
        console.error('Error with decoding audio data', error);
      });
    };

    reader.readAsArrayBuffer(file);
  }

  private createAudioSource(buffer) {
    // var audioElement = new Audio(URL.createObjectURL(file));
    // this.audioCtx.createMediaElementSource(audioElement);
    this.source = this.audioCtx.createBufferSource();
    this.source.connect(this.waveformAnalyzer);
    this.source.buffer = buffer;
  }

  private visualize(buffer: AudioBuffer) {
      const data = buffer.getChannelData(0);
      // TODO: merge stereo channels
      // signal[i] = (fb[2*i] + fb[2*i+1]) / 2;
      // https://developer.mozilla.org/en-US/docs/Archive/Misc_top_level/Visualizing_Audio_Spectrum
      const step = Math.floor((buffer.duration * buffer.sampleRate) / 1000);

      this.waveformCtx.clearRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
      for (let i = 0; i < data.length; i += step) {
        const height = (data[i] * 100);
        this.drawBar(this.waveformCtx, i / step, 100, 1, height, 'red');
      }

      this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.freqAnalyser = this.audioCtx.createAnalyser();
      this.freqAnalyzerBig = this.audioCtx.createAnalyser();
      this.source.connect(this.freqAnalyser);
      this.source.connect(this.freqAnalyzerBig);
      this.freqAnalyser.fftSize = 8192;
      this.freqAnalyzerBig.fftSize = 256;
      this.freqAnalyser.maxDecibels = 0;
      this.freqAnalyzerBig.maxDecibels = 0;
      this.draw(buffer, data);




      // source.connect(audioCtx.destination);
      this.source.loop = true;
      this.source.playbackRate.value = 1;
      this.source.start();

  }

  private drawBar(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, color: string) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    ctx.restore();
  }

  private draw(buffer: AudioBuffer, data: Float32Array) {
    requestAnimationFrame(() => {
      this.draw(buffer, data);
    });

    const step = Math.floor((buffer.duration * buffer.sampleRate) / 1000);
    this.waveformCtx.clearRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
    for (let i = 0; i < data.length; i += step) {
      // let height = 0;
      // for (let j = -5; j < 5; j++) {
      //   height += data[i + j];
      // }
      // height /= 10;
      // height *= 100;

      // Signed
      // this.drawBar(this.waveformCtx, i / step, 100, 1, -data[i] * 100, 'red');

      // Mirrored
      const height = Math.abs(data[i] * 100);
      this.drawBar(this.waveformCtx, i / step, 100 - height, 1, 2 * height, 'red');
    }

    if (this.xPosWaveform) {
      this.drawBar(this.waveformCtx, this.xPosWaveform - 1, 0, 3, 200, '#333');
    }

    this.drawBars();
    this.drawWave();

    // Draw cursor
    // const percent = this.audioCtx.currentTime / this.source.buffer.duration;
    // console.log(percent);
    // console.log(percent * this.waveformCanvas.width);
    // console.log(this.audioCtx.currentTime);
    // this.drawBar(this.waveformCtx, percent * this.waveformCanvas.width, 0, 1, this.waveformCanvas.height, 'pink');
  }

  private drawWave() {
    const bufferLengthw = this.waveformAnalyzer.frequencyBinCount;
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

  private drawBars() {
    const bufferLength = this.freqAnalyser.frequencyBinCount;
    const bufferLength2 = this.freqAnalyzerBig.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const dataArray2 = new Uint8Array(bufferLength2);

    this.freqAnalyser.getByteFrequencyData(dataArray);
    this.freqAnalyzerBig.getByteFrequencyData(dataArray2);

    this.canvasCtx.fillStyle = 'rgb(0, 0, 0)';
    this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const barWidth = (this.canvas.width / bufferLength) * 2.5;
    const barWidth2 = (this.canvas.width / bufferLength2) * 2.5;
    let barHeight;
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i];
      this.canvasCtx.fillStyle = 'rgb(50, ' + (barHeight + 100) + ', 50)';
      // this.canvasCtx.fillRect(x, this.canvas.height - barHeight, barWidth, barHeight);
      this.canvasCtx.fillRect(x, this.canvas.height - 100 - barHeight / 2, barWidth, barHeight);
      x += barWidth + 1;
    }
    x = 0;
    for (let i = 0; i < bufferLength2; i++) {
      barHeight = dataArray2[i];
      this.canvasCtx.fillStyle = 'rgb(' + (barHeight + 100) + ', 50, 50)';
      this.canvasCtx.fillRect(x, 0, barWidth2, barHeight);
      // this.canvasCtx.fillRect(x, 100 - barHeight / 2, barWidth2, barHeight);
      x += barWidth2 + 1;
    }
  }
}
