import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  public analyser: AnalyserNode;
  public freqAnalyser: AnalyserNode;
  public freqAnalyser2: AnalyserNode;
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
    return this.source.playbackRate.value;
  }
  public set playbackRate(value: number) {
    this.source.playbackRate.value = value;
  }

  public canvas: HTMLCanvasElement;
  public canvasCtx: CanvasRenderingContext2D;
  public waveformCanvas: HTMLCanvasElement;
  public waveformCtx: CanvasRenderingContext2D;

  public ngOnInit() {
    this.audioCtx = new ((<any> window).AudioContext || (<any> window).webkitAudioContext)();
    this.analyser = this.audioCtx.createAnalyser();
    // this.source.connect(this.analyser);
    this.gainNode = this.audioCtx.createGain();
    this.analyser.connect(this.gainNode);
    this.gainNode.gain.value = this.volume;
    this.gainNode.connect(this.audioCtx.destination);

    this.analyser.fftSize = 2048;
    this.analyser.fftSize = 8192;

    this.canvas = document.querySelector('#oscilloscope') as HTMLCanvasElement;
    this.canvasCtx = this.canvas.getContext('2d');
    this.waveformCanvas = document.querySelector('#waveform') as HTMLCanvasElement;
    this.waveformCtx = this.waveformCanvas.getContext('2d');

    this.waveformCanvas.addEventListener('click', (event) => {
      var x = event.offsetX;
      var y = event.offsetY;
      console.log('Clicked here:', x, y);
      var percent = x / this.waveformCanvas.width;
      console.log('Percentage:', percent);
      this.source.stop();
      this.createAudioSource(this.source.buffer);
      this.source.connect(this.analyser);
      this.source.connect(this.freqAnalyser);
      this.source.connect(this.freqAnalyser2);
      console.log('Playing at', percent * this.source.buffer.duration);
      this.source.start(0, percent * this.source.buffer.duration);
    });

    this.volume = 0.75;
  }


  public setUp(file: File) {
    const reader = new FileReader;
    reader.onload = () => {
      const arrayBuffer = reader.result;
      this.audioCtx.decodeAudioData(arrayBuffer)
      .then((audioBuffer) => {
        this.createAudioSource(audioBuffer);
        this.visualize(audioBuffer);
      })
      .catch(function (error) {
        console.error('Error with decodng audio data', error);
      });
    };

    reader.readAsArrayBuffer(file);
  }

  private createAudioSource(buffer) {
    // var audioElement = new Audio(URL.createObjectURL(file));
    // this.audioCtx.createMediaElementSource(audioElement);
    this.source = this.audioCtx.createBufferSource();
    this.source.connect(this.analyser);
    this.source.buffer = buffer;
  }

  private visualize(buffer: AudioBuffer) {
      var buff = buffer.getChannelData(0);
      // TODO: merge stereo channels
      // signal[i] = (fb[2*i] + fb[2*i+1]) / 2;
      // https://developer.mozilla.org/en-US/docs/Archive/Misc_top_level/Visualizing_Audio_Spectrum
      var step = Math.floor((buffer.duration * buffer.sampleRate) / 1000);

      this.waveformCtx.clearRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
      for (var i = 0; i < buff.length; i+=step) {
        var height = (buff[i] * 100);
        this.drawBar(this.waveformCtx, i/step, 100, 1, height, 'red');
      }

      var bufferLengthw = this.analyser.frequencyBinCount;
      var dataArrayw = new Uint8Array(bufferLengthw);

      this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.freqAnalyser = this.audioCtx.createAnalyser();
      this.freqAnalyser2 = this.audioCtx.createAnalyser();
      this.source.connect(this.freqAnalyser);
      this.source.connect(this.freqAnalyser2);
      this.freqAnalyser.fftSize = 8192;
      this.freqAnalyser2.fftSize = 256;
      this.freqAnalyser.maxDecibels = 0;
      this.freqAnalyser2.maxDecibels = 0;
      this.draw();




      //source.connect(audioCtx.destination);
      this.source.loop = false;
      this.source.playbackRate.value = this.playbackRate;
      this.source.start();
      
  }

  private drawBar(ctx, x, y, width, height, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
    ctx.restore();
  }

  private draw() {
    requestAnimationFrame(this.draw.bind(this));
    this.drawBars();
    this.drawWaveform();

    // Draw cursor
    // var percent = this.audioCtx.currentTime / this.source.buffer.duration;
    // console.log(percent);
    // console.log(percent * this.waveformCanvas.width);
    // this.drawBar(this.waveformCtx, percent * this.waveformCanvas.width, 0, 1, this.waveformCanvas.height, 'pink');
  }

  private drawWaveform() {
    const bufferLengthw = this.analyser.frequencyBinCount;
    const dataArrayw = new Uint8Array(bufferLengthw);

    this.analyser.getByteTimeDomainData(dataArrayw);
    this.canvasCtx.fillStyle = 'rgb(255, 255, 255)';
    //canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    this.canvasCtx.lineWidth = 2;
    this.canvasCtx.strokeStyle = 'rgb(200, 200, 200)';
    this.canvasCtx.beginPath();
    var sliceWidth = this.canvas.width * 1.0 / bufferLengthw;
    var x = 0;
    for (var i = 0; i < bufferLengthw; i++) {
      var v = dataArrayw[i] / 255;
      var y = (this.canvas.height / 2) + (this.canvas.height / 4) * (v - 0.5);

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
    const bufferLength2 = this.freqAnalyser2.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const dataArray2 = new Uint8Array(bufferLength2);

    this.freqAnalyser.getByteFrequencyData(dataArray);
    this.freqAnalyser2.getByteFrequencyData(dataArray2);

    this.canvasCtx.fillStyle = 'rgb(0, 0, 0)';
    this.canvasCtx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    var barWidth = (this.canvas.width / bufferLength) * 2.5;
    var barWidth2 = (this.canvas.width / bufferLength2) * 2.5;
    var barHeight;
    var x = 0;
    for (var i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i];
      this.canvasCtx.fillStyle = 'rgb(' + (barHeight + 100) + ', 50, 50)';
      this.canvasCtx.fillRect(x, this.canvas.height - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }
    x = 0;
    for (var i = 0; i < bufferLength2; i++) {
      barHeight = dataArray2[i];
      this.canvasCtx.fillStyle = 'rgb(' + (barHeight + 100) + ', 50, 50)';
      this.canvasCtx.fillRect(x, 0, barWidth2, barHeight);
      x += barWidth2 + 1;
    }
  }
}
