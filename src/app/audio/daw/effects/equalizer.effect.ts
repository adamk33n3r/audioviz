import { Effect } from './effect';

export class EqualizerEffect extends Effect {
    public process(buffer: AudioBuffer): AudioBuffer {
        throw new Error('Method not implemented.');
    }
}
