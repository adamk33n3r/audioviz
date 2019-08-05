import { Effect } from './effect';

export class CompressorEffect extends Effect {
    static test = 5;
    public act() { console.log('act'); }
    public process(buffer: AudioBuffer): AudioBuffer {
        throw new Error('Method not implemented.');
    }
}
