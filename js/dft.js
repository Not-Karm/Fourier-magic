// Discrete Fourier Transform
// Treats an array of 2D points as complex numbers: z(n) = x(n) + i*y(n)

async function dft(points, progressCallback = null) {
    const N = points.length;
    let X = [];

    const chunkSize = 100; // Yield to browser every 100 frequencies

    for (let k = 0; k < N; k++) {
        let re = 0;
        let im = 0;

        for (let n = 0; n < N; n++) {
            const phi = (2 * Math.PI * k * n) / N;
            re += points[n].x * Math.cos(phi) + points[n].y * Math.sin(phi);
            im += points[n].y * Math.cos(phi) - points[n].x * Math.sin(phi);
        }

        re = re / N;
        im = im / N;

        let freq = k < N / 2 ? k : k - N;
        let amp = Math.sqrt(re * re + im * im);
        let phase = Math.atan2(im, re);

        X.push({ re, im, freq, amp, phase });

        // Periodically yield to main thread to prevent UI freezing
        if (k % chunkSize === 0) {
            if (progressCallback) {
                progressCallback(Math.round((k / N) * 100));
            }
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    // Sort by amplitude descending so largest epicycles are at the center
    X.sort((a, b) => b.amp - a.amp);

    return X;
}
