/**
 * Fourier Magic - Image Processor
 * Extracts a continuous path of 2D coordinates from an image.
 */

class ImageProcessor {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }

    async process(imageElement, maxPoints) {
        return new Promise((resolve) => {
            try {
                // 1. Resize Image
                const MAX_DIM = 400;
                let w = imageElement.naturalWidth || imageElement.width;
                let h = imageElement.naturalHeight || imageElement.height;
                
                if (w > MAX_DIM || h > MAX_DIM) {
                    const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
                    w = Math.floor(w * ratio);
                    h = Math.floor(h * ratio);
                }

                this.canvas.width = w;
                this.canvas.height = h;
                
                // Fill white to fix transparent PNGs
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(0, 0, w, h);
                this.ctx.drawImage(imageElement, 0, 0, w, h);

                // 2. Perform Edge Detection
                const imageData = this.ctx.getImageData(0, 0, w, h);
                const edges = this.detectSolidBoundaries(imageData);

                // 3. Extract and filter points
                let points = this.extractAndGridPoints(edges, w, h, maxPoints);
                
                // Center the points around 0,0
                const centered = points.map(p => ({
                    x: p.x - w / 2,
                    y: p.y - h / 2
                }));

                // 4. Connect points sequentially (TSP)
                const path = solveTSP(centered);
                resolve(path);

            } catch (err) {
                console.error("Image processing failed:", err);
                resolve([]);
            }
        });
    }

    detectSolidBoundaries(imageData) {
        const data = imageData.data;
        const w = imageData.width;
        const h = imageData.height;
        const edges = new Uint8ClampedArray(w * h);

        const getLuminance = (i) => 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

        // Auto-detect background color
        let corners = [0, (w-1)*4, (h-1)*w*4, ((h-1)*w + w - 1)*4];
        let bgLum = 0;
        for(let c of corners) bgLum += getLuminance(c);
        bgLum /= 4;
        let isDarkBg = bgLum < 128;

        // Isolate primary content
        for (let i = 0; i < data.length; i += 4) {
            let px = i / 4;
            let lum = getLuminance(i);
            let isContent = false;
            
            if (data[i+3] > 50) { // Check alpha
                if (isDarkBg && lum > 128) isContent = true;
                if (!isDarkBg && lum < 128) isContent = true;
            }
            if (isContent) edges[px] = 255;
        }

        // Trace the exact boundary of the content
        const boundary = new Uint8ClampedArray(w * h);
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                let idx = y * w + x;
                if (edges[idx] === 255) {
                    // Check neighbors to see if it's an edge pixel
                    if (edges[idx - 1] === 0 || edges[idx + 1] === 0 || 
                        edges[idx - w] === 0 || edges[idx + w] === 0 ||
                        edges[idx - w - 1] === 0 || edges[idx - w + 1] === 0 ||
                        edges[idx + w - 1] === 0 || edges[idx + w + 1] === 0) {
                        boundary[idx] = 255;
                    }
                }
            }
        }
        return boundary;
    }

    extractAndGridPoints(edgeData, w, h, maxPoints) {
        let rawPoints = [];
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (edgeData[y * w + x] === 255) {
                    rawPoints.push({ x, y });
                }
            }
        }

        if (rawPoints.length === 0) return [];

        // Spatial Gridding: merge close points to simplify the shape
        let gridSize = 1;
        let allPoints = [...rawPoints];
        
        while (allPoints.length > maxPoints) {
            gridSize += 0.5;
            let grid = new Map();
            for (let p of rawPoints) {
                let gx = Math.floor(p.x / gridSize);
                let gy = Math.floor(p.y / gridSize);
                let key = `${gx},${gy}`;
                if (!grid.has(key)) {
                    grid.set(key, p);
                }
            }
            allPoints = Array.from(grid.values());
        }

        return allPoints;
    }
}
