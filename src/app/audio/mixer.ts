import { Effect } from './daw/effects/effect';

export class Mixer {
    public masterTrack: Track;
    private masterGain: GainNode;
    private tracks: Track[] = [];

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
        this.masterTrack = this.createNewTrack();
        this.masterTrack.connect(this.masterGain);
    }

    public createNewTrack(): Track {
        const track = new Track(this);
        this.tracks.push(track);
        return track;
    }

    public getTrack(number: number): Track {
        return this.tracks[number];
    }

    public connectBeforeGain(node: AudioNode) {
        this.masterTrack.connect(node);
    }

    public connectAfterGain(node: AudioNode) {
        this.masterGain.connect(node);
    }
}

export class Track extends GainNode {
    private effectSlots: Effect[] = [];
    public constructor(private mixer: Mixer) {
        super(mixer.audioContext);
        if (this.mixer.masterTrack) {
            this.connect(this.mixer.masterTrack);
        }
    }

    public addEffect(effect: Effect, idx?: number): void {
    }
}
