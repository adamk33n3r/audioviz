import { RingBuffer } from '@adamk33n3r/ringbuffer.js';

import { getFFT, getFFTInternal } from './fft';

let curMaxX = -1;

export function getBands(numBands: number = 100, freqAnalyser: AnalyserNode): number[] {

    const bandFreqs = new Array(numBands);
    const m_freqMin = 20;
    const m_freqMax = 16000;
    const step = (Math.log(m_freqMax / m_freqMin) / numBands) / Math.log(2.0);
    bandFreqs[0] = m_freqMin * Math.pow(2, step / 2);

    for (let iBandF = 1; iBandF < numBands; iBandF++) {
        bandFreqs[iBandF] = bandFreqs[iBandF - 1] * Math.pow(2, step);
    }

    // df is how many Hz are in each bin (fft/2 bins)
    // 172.265625 Hz
    // 10.7666 Hz
    const df = freqAnalyser.context.sampleRate / freqAnalyser.fftSize;
    const scalar = 2 / freqAnalyser.context.sampleRate;
    let iBin = 0;
    let iBand = 0;
    let previousHzUsed = 0;
    const bandOut = new Array(numBands).fill(0);

    let fLin1: number;
    let fLog1: number;

    // Related to what value the fft will cutoff at 0. 30 means if it is less than 0.001. 60 means if it is less than 0.00001 etc.
    const sensitivity = 30;

    // each bin contains 172.265 Hz at 256 fft
    // 10.7666 at 4096 fft
    const fftData = getFFT(freqAnalyser);
    while (iBin <= freqAnalyser.frequencyBinCount && iBand < numBands) {
        // fLin1: what Hz the current bin starts at (increments by df for every bin)
        // I'm guessing the 0.5 is so that it won't include overlap data
        fLin1 = (iBin + 0.5) * df;
        // fLog1: what Hz the current band starts at
        fLog1 = bandFreqs[iBand];
        // Get the fftData for the current bin. Normalize to 0 - 1
        let fftVal = fftData[iBin];
        // if (fftVal !== 0 && fftVal !== undefined && fftVal !== NaN) {
        //   console.log('dude', fftVal);
        // }
        // x = max(0, 10.0 / parent->m_sensitivity * log10(x) + 1.0);
        // fftVal = 10.0 / parent->m_sensitivity * log10(fftValFirst);
        // fftVal / (10.0 / parent->m_sensitivity) = log10(fftValFirst);
        // fftVal = log10(fftValFirst)

        // console.log(fftVal);
        // return Math.max(0, 10 / sensitivity * Math.log10(band) + 1);
        // fftVal -= 1.0;
        // fftVal /= 10 / sensitivity;
        // fftVal = Math.pow(10, fftVal);

        if (fftVal > curMaxX) {
            curMaxX = fftVal;
            console.log(curMaxX);
        }
        // Get accumulated value for the current band (or 0 if just started band)
        let y = bandOut[iBand];

        // If the current bin's starting Hz is less than or equal to the current band's starting Hz
        // I.E. bin will go into band
        if (fLin1 <= fLog1) {
            // Hz difference from last Hz used
            y += (fLin1 - previousHzUsed) * fftVal * scalar;
            bandOut[iBand] = y;
            previousHzUsed = fLin1;
            iBin++;
            // Put it in one then start a new band
        } else {
            y += (fLog1 - previousHzUsed) * fftVal * scalar;
            bandOut[iBand] = y;
            previousHzUsed = fLog1;
            iBand++;
        }
    }

    return bandOut.map((band) => {
        band = Math.min(1, Math.max(0, band));
        return Math.max(0, 10 / sensitivity * Math.log10(band) + 1);
    });
}

const ring = new RingBuffer<number>(100);
export function getBandsInternal(numBands: number = 100, freqAnalyser: AnalyserNode) {

    const bandFreqs = new Array(numBands);
    const m_freqMin = 20;
    const m_freqMax = 16000;
    const step = Math.log(m_freqMax / m_freqMin) / Math.log(2.0) / 100;
    bandFreqs[0] = m_freqMin * Math.pow(2, step / 2);

    for (let iBandF = 1; iBandF < numBands; iBandF++) {
        bandFreqs[iBandF] = bandFreqs[iBandF - 1] * Math.pow(2, step);
        if (iBandF === 10) {
            // 40.351
        }
    }

    // df is how many Hz are in each bin (fft/2 bins)
    // 172.265625 Hz
    // 10.7666 Hz
    const df = freqAnalyser.context.sampleRate / freqAnalyser.fftSize;
    const scalar = 2 / freqAnalyser.context.sampleRate;
    let iBin = 0;
    let iBand = 0;
    let previousHzUsed = 0;
    const bandOut = new Array(numBands).fill(0);

    let fLin1: number;
    let fLog1: number;

    // Related to what value the fft will cutoff at 0. 30 means if it is less than 0.001. 60 means if it is less than 0.00001 etc.
    const sensitivity = 35;

    // each bin contains 172.265 Hz at 256 fft
    // 10.7666 at 4096 fft
    const fftData = getFFTInternal(freqAnalyser);
    while (iBin <= freqAnalyser.frequencyBinCount && iBand < numBands) {
        // fLin1: what Hz the current bin starts at (increments by df for every bin)
        // I'm guessing the 0.5 is so that it won't include overlap data
        fLin1 = (iBin + 0.5) * df;
        // fLog1: what Hz the current band starts at
        fLog1 = bandFreqs[iBand];
        // Get the fftData for the current bin.
        const mult = 2;
        let fftVal = fftData[iBin] * mult;
        // if (fftVal !== 0 && fftVal !== undefined && fftVal !== NaN) {
        //   console.log('dude', fftVal);
        // }
        // x = max(0, 10.0 / parent->m_sensitivity * log10(x) + 1.0);
        // fftVal = 10.0 / parent->m_sensitivity * log10(fftValFirst);
        // fftVal / (10.0 / parent->m_sensitivity) = log10(fftValFirst);
        // fftVal = log10(fftValFirst)

        // console.log(fftVal);
        // return Math.max(0, 10 / sensitivity * Math.log10(band) + 1);
        // if (fftVal > curMaxX) {
        //     curMaxX = fftVal;
        //     console.log('band:', curMaxX);
        // }

        fftVal -= 1.0;
        fftVal /= 10 / sensitivity;
        fftVal = Math.pow(10, fftVal);
        const max = Math.pow(10, (mult - 1) * (sensitivity / 10));
        const min = Math.pow(10, -1 / (10 / sensitivity));

        if (fftVal === max) {
            // fftVal = (freqAnalyser.frequencyBinCount - iBin) * 10;
        } else if (fftVal !== min) {
            // ring.push(fftVal);
            // const all = ring.all();
            // document.getElementById('log').innerText = all.join('\n');
        }

        // Get accumulated value for the current band (or 0 if just started band)
        let y = bandOut[iBand];
        const debug = false; // iBand === 10 || iBand === 11;
        if (debug) {
            console.log(iBand, y, fftVal, iBin);
            console.log(fLin1, fLog1, previousHzUsed, fftVal, scalar, (fLog1 - previousHzUsed) * fftVal * scalar);
        }

        // If the current bin's mid-point Hz is less than or equal to the current band's starting Hz
        // I.E. bin will go into band and so will the next bin
        if (fLin1 <= fLog1) {
            // Hz difference from last Hz used
            y += (fLin1 - previousHzUsed) * fftVal * scalar;
            bandOut[iBand] = y;
            previousHzUsed = fLin1;
            iBin++;
        // Put it in current band then start a new band
        } else {
            y += (fLog1 - previousHzUsed) * fftVal * scalar;
            bandOut[iBand] = y;
            previousHzUsed = fLog1;
            iBand++;
        }
        if (debug) {
            console.log(y, iBin, iBand, previousHzUsed);
        }
    }

    return bandOut.map((band, i) => {
        // return band;
        band = Math.min(1, Math.max(0, band));
        return Math.max(0, 10 / sensitivity * Math.log10(band) + 1);
    });
}
