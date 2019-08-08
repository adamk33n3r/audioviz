export function dbToGain(db: number) {
    return Math.pow(10, (db / 20));
}
export function gainToDb(gain: number) {
    return 20 * Math.log10(gain);
}
