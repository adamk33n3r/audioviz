import { Component, OnInit, Input, ViewChild, ElementRef } from '@angular/core';

import { Track, Mixer } from '../audio/mixer';

@Component({
    selector: 'av-oscillator',
    templateUrl: './oscillator.component.html',
    styleUrls: ['./oscillator.component.css']
})
export class OscillatorComponent implements OnInit {

    @Input()
    public track: Track;

    @Input()
    public mixer: Mixer;

    public hertz: number = 110;
    public selectedTrack: Track;
    public selectedType: Exclude<OscillatorType, 'custom'>;
    public types = [
        'sine',
        'square',
        'sawtooth',
        'triangle',
    ];

    private oscillator: OscillatorNode;
    private analyser: AnalyserNode;

    @ViewChild('canvas', { static: true })
    private canvasElement: ElementRef<HTMLCanvasElement>;

    private get canvas(): HTMLCanvasElement {
        return this.canvasElement.nativeElement;
    }

    constructor() { }

    public ngOnInit() {
        this.selectedTrack = this.mixer.masterTrack;
        this.selectedType = 'triangle';
        this.analyser = this.mixer.audioContext.createAnalyser();
        setInterval(() => {
            const ctx = this.canvas.getContext('2d');
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            // ctx.fillStyle = 'red';
            // ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.strokeStyle = 'white';
            ctx.fillStyle = 'white';
            ctx.lineWidth = 2;
            const data = new Uint8Array(this.analyser.fftSize);
            this.analyser.getByteTimeDomainData(data);
            let x = 0;
            const step = this.canvas.width / data.length;
            ctx.beginPath();
            for (let i = 0; i < data.length; i++) {
                const v = data[i] / 255;
                const y = (this.canvas.height / 2) + (this.canvas.height / 4) * (v - 0.5);
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                x += step;
            }
            ctx.lineTo(this.canvas.width, this.canvas.height / 2);
            ctx.stroke();
        }, 34);
    }

    public pulse() {
        if (this.oscillator) {
            this.oscillator.disconnect(this.analyser);
            this.oscillator.stop();
        }
        // TODO: Move that to a service. And also probably an oscillator class like mixer.ts
        this.oscillator = this.mixer.audioContext.createOscillator();
        this.oscillator.connect(this.analyser);
        this.oscillator.type = this.selectedType;
        this.oscillator.frequency.value = this.hertz;
        // this.oscillator.connect(this.track);


        // const modFreq = this.mixer.audioContext.createOscillator();
        // modFreq.frequency.value = 1;

        this.oscillator.start(0);
        this.oscillator.connect(this.selectedTrack);
        // modFreq.start(0);
        // this.oscillator.frequency.setValueAtTime(200, this.mixer.audioContext.currentTime  + 0.5);
        // this.oscillator.frequency.setValueCurveAtTime([440, 220], this.mixer.audioContext.currentTime, 0.1);
        // this.oscillator.frequency.setTargetAtTime(200, this.mixer.audioContext.currentTime, 1);
        this.oscillator.stop(this.mixer.audioContext.currentTime + 2);
        // modFreq.stop(this.mixer.audioContext.currentTime + 3);
    }

}
