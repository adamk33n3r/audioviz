import { Component, OnInit } from '@angular/core';
import { AudioDecoderService } from '../audio-decoder.service';
import { Mixer } from '../audio/mixer';

@Component({
    selector: 'av-daw',
    templateUrl: './daw.component.html',
    styleUrls: ['./daw.component.css']
})
export class DawComponent implements OnInit {

    public mixer: Mixer;

    public oscillators = [0];

    private audioCtx: AudioContext;
    private source: AudioBufferSourceNode;

    constructor(private $audioDecoder: AudioDecoderService) { }

    public ngOnInit() {
        this.audioCtx = new ((<any>window).AudioContext || (<any>window).webkitAudioContext)();
        this.mixer = new Mixer(this.audioCtx);
    }

    public addOscillator() {
        this.oscillators.push(0);
    }

    public fileSelected(file: File) {
        if (this.source) {
            this.source.stop(0);
        }

        this.$audioDecoder.decodeAudioFile(this.audioCtx, file)
        .then((audioBuffer) => {
            console.log(audioBuffer);
            this.source = this.audioCtx.createBufferSource();
            this.source.connect(this.mixer.masterTrack);
            this.source.buffer = audioBuffer;
        });
    }

}
