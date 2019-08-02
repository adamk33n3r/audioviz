import * as jsFFT from 'jsfft';

const fftData = new Uint8Array(2048);
export function getFFT(freqAnalyser: AnalyserNode) {
    const binCount = freqAnalyser.frequencyBinCount;
    const sampleData = new Uint8Array(binCount);
    freqAnalyser.getByteTimeDomainData(sampleData);


    // calculate window function coefficients (http://en.wikipedia.org/wiki/Window_function#Hann_.28Hanning.29_window)
    const fftKWdw = new Array(freqAnalyser.fftSize).fill(1);
    for (let iBin = 0; iBin < freqAnalyser.fftSize; ++iBin) {
        fftKWdw[iBin] = (0.5 * (1.0 - Math.cos(2 * Math.PI * iBin / (freqAnalyser.fftSize - 1))));
    }




    const data = new jsFFT.ComplexArray(binCount).map((val, i) => {
        val.real = sampleData[i] * fftKWdw[i];
    });


    const attack = 300;
    const decay = 300;
    const overlap = freqAnalyser.fftSize / 2;
    const scalar = 1 / Math.sqrt(freqAnalyser.fftSize);
    const m_kFFT = [
        Math.exp(Math.log10(0.01) / (freqAnalyser.context.sampleRate / (freqAnalyser.fftSize - overlap) * attack * 0.001)),
        Math.exp(Math.log10(0.01) / (freqAnalyser.context.sampleRate / (freqAnalyser.fftSize - overlap) * decay * 0.001)),
    ];


    const freqs = data.FFT();
    freqs.forEach((frequency, i) => {
        // TODO: Implement overlap
        // 								float x1 = (m->m_fftTmpOut[iBin].r * m->m_fftTmpOut[iBin].r + m->m_fftTmpOut[iBin].i * m->m_fftTmpOut[iBin].i) * scalar;
        const x0 = fftData[i];

        const x1 = (frequency.real * frequency.real + frequency.imag * frequency.imag) * scalar;
        const newVal = x1 + m_kFFT[(x1 < x0) ? 1 : 0] * (x0 - x1);
        fftData[i] = newVal;
    });
    // console.log(test);

    return fftData;
}

let fftDataInternal = new Uint8Array(128);
let fftDataInternalFloat = new Float32Array(128);
export function getFFTInternal(freqAnalyser: AnalyserNode) {
    if (fftDataInternal.length !== freqAnalyser.frequencyBinCount) {
        fftDataInternal = new Uint8Array(freqAnalyser.frequencyBinCount);
        fftDataInternalFloat = new Float32Array(freqAnalyser.frequencyBinCount);
    }
    freqAnalyser.getByteFrequencyData(fftDataInternal);
    fftDataInternalFloat.set(fftDataInternal);
    return fftDataInternalFloat.map((fft) => fft / 255);
}
