import { Effect } from './effect';

export class LimiterEffect extends Effect {
    public process(buffer: AudioBuffer): AudioBuffer {
        throw new Error('Method not implemented.');
    }
}
