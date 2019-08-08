import { Effect } from './daw/effects/effect';
import { Observable, interval, timer, fromEvent, Subject } from 'rxjs';
import { gainToDb, dbToGain } from './utils';

export class Mixer {
    public masterTrack: Track;
    private masterGain: GainNode;
    private _tracks: Track[] = [];

    public get tracks(): Track[] {
        return this._tracks;
    }

    public get gain(): number {
        const db = Math.log10(this.masterGain.gain.value) * 20;
        return db;
    }

    public set gain(db: number) {
        const gain = Math.pow(10, db / 20);
        this.masterGain.gain.value = gain;
        // this.masterGain.gain.setTargetAtTime(gain, this.audioContext.currentTime, 1 / 2 / 3);
    }

    public constructor(public audioContext: BaseAudioContext) {
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterTrack = this.createNewTrack('Master');
        this.masterTrack.connect(this.masterGain);
    }

    public createNewTrack(name?: string): Track {
        const track = new Track(this, this._tracks.length, name);
        this._tracks.push(track);
        return track;
    }

    public getTrack(number: number): Track {
        return this._tracks[number];
    }

    public connectBeforeGain(node: AudioNode) {
        this.masterTrack.connect(node);
    }

    public connectAfterGain(node: AudioNode) {
        this.masterGain.connect(node);
    }
}

export class Track extends GainNode {
    public get mixer(): Mixer {
        return this._mixer;
    }

    // public dbObservable: Observable<number[]>;
    public dbSubject: Subject<number[]> = new Subject();
    private freqData: Uint8Array;
    private timeDataLeft: Float32Array;
    private timeDataRight: Float32Array;

    private effectSlots: Effect[] = [];
    private analyserLeft: AnalyserNode;
    private analyserRight: AnalyserNode;

    public constructor(private _mixer: Mixer, private num: number, public name: string = num.toString()) {
        super(_mixer.audioContext);
        // this.gain.value = dbToGain(-9);
        this.analyserLeft = this.context.createAnalyser();
        this.analyserLeft.fftSize = 256;
        this.analyserRight = this.context.createAnalyser();
        this.analyserRight.fftSize = 256;
        this.freqData = new Uint8Array(this.analyserLeft.frequencyBinCount);
        this.timeDataLeft = new Float32Array(this.analyserLeft.fftSize);
        this.timeDataRight = new Float32Array(this.analyserRight.fftSize);

        const splitter = this.context.createChannelSplitter();
        this.connect(splitter);
        splitter.connect(this.analyserLeft, 0);
        splitter.connect(this.analyserRight, 0);

        // this.dbSubject.next([0, 0]);

        // this.dbObservable = new Observable((subscriber) => {
        //     subscriber.next([0, 0]);
        // });

        let lastL = -Infinity;
        let lastR = -Infinity;
        const smoothing = 0.8;
        setInterval(() => {
            this.analyserLeft.getFloatTimeDomainData(this.timeDataLeft);
            this.analyserRight.getFloatTimeDomainData(this.timeDataRight);
            let rmsL = Math.max(this.rms(this.timeDataLeft), lastL * smoothing);
            let rmsR = Math.max(this.rms(this.timeDataRight), lastR * smoothing);
            rmsL = rmsL < 0.001 ? 0 : rmsL;
            rmsR = rmsR < 0.001 ? 0 : rmsR;
            const dbL = Math.max(-40, this.getDecibels(rmsL));
            const dbR = Math.max(-40, this.getDecibels(rmsR));
            if (rmsL !== lastL || rmsR !== lastR) {
                this.dbSubject.next([dbL, dbR]);
                lastL = rmsL;
                lastR = rmsR;
            }

        }, 10);

        // For non-master tracks
        if (this._mixer.masterTrack) {
            this.connect(this._mixer.masterTrack);
        }
    }

    public addEffect(effect: Effect, idx?: number): void {
    }

    private getRMS() {
    }

    private rms(input: Float32Array) {
        let sum = 0;
        for (let i = 0; i < input.length; i++) {
          sum += input[i] * input[i];
        }
        return Math.sqrt(sum / input.length);
    }

    public getDecibels(value) {
        if (value == null) return 0;
        return Math.round(Math.round(20 * Math.log10(value) * 100) / 100 * 100) / 100;
    }
}
