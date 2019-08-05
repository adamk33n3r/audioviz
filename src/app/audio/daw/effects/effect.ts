export abstract class Effect {
    public abstract process(buffer: AudioBuffer): AudioBuffer;
}
