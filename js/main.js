/**
 * Fourier Magic - Main Application Logic
 * Refactored for simplicity and readability.
 */

class FourierApp {
    constructor() {
        // Core elements
        this.canvas = document.getElementById('mainCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.processor = new ImageProcessor();
        
        // UI Controls
        this.statusBox = document.getElementById('statusBox');
        this.epicycleSlider = document.getElementById('epicyclesSlider');
        this.epicycleValue = document.getElementById('epicyclesVal');
        this.speedSlider = document.getElementById('speedSlider');
        this.speedValue = document.getElementById('speedVal');
        this.densitySlider = document.getElementById('pointDensity');
        this.densityValue = document.getElementById('densityValue');
        this.saveBtn = document.getElementById('saveBtn');
        this.copyBtn = document.getElementById('copyEquationBtn');
        
        // State
        this.width = 0;
        this.height = 0;
        this.fourierData = [];
        this.tracedPath = [];
        this.time = 0;
        this.scaleRatio = 1;
        this.animationSpeed = 1;
        this.numPoints = 700;
        this.isPaused = false;
        
        // Auto-loop properties
        this.userInteracted = false;
        this.autoLoopPresets = ['preset_batman', 'preset_monstercan', 'preset_cat'];
        this.autoLoopIndex = 0;
        this.lastEqString = ""; // Store for copying
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.handleResize();
        this.startRenderLoop();
        
        // Start auto-loop sequence on load
        setTimeout(() => this.triggerAutoLoopNext(), 500);
    }

    triggerAutoLoopNext() {
        if (this.userInteracted) return;
        
        const presetId = this.autoLoopPresets[this.autoLoopIndex];
        const imgElement = document.getElementById(presetId);
        
        if (imgElement && imgElement.complete) {
            document.getElementById('fileName').innerText = "Preset: " + imgElement.title;
            this.processNewImage(imgElement);
        } else {
            // Wait for image to load if not ready
            setTimeout(() => this.triggerAutoLoopNext(), 500);
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.handleResize());

        // File Upload
        document.getElementById('imageUpload').addEventListener('change', (e) => {
            this.userInteracted = true;
            const file = e.target.files[0];
            if (!file) return;
            document.getElementById('fileName').innerText = file.name;
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = () => this.processNewImage(img);
        });

        // Presets
        document.querySelectorAll('.preset-img').forEach(img => {
            img.addEventListener('click', () => {
                this.userInteracted = true;
                document.getElementById('fileName').innerText = "Preset: " + img.title;
                this.processNewImage(img);
            });
        });

        // Sliders
        this.densitySlider.addEventListener('input', (e) => {
            this.userInteracted = true;
            this.numPoints = parseInt(e.target.value);
            this.densityValue.innerText = this.numPoints;
        });

        this.speedSlider.addEventListener('input', (e) => {
            this.userInteracted = true;
            this.animationSpeed = parseFloat(e.target.value);
            this.speedValue.innerText = this.animationSpeed + 'x';
        });

        this.epicycleSlider.addEventListener('input', (e) => {
            this.userInteracted = true;
            this.epicycleValue.innerText = e.target.value;
            this.tracedPath = []; // Clear path when changing detail level
            this.time = 0;
        });

        // Update the full equation ONLY when the slider dragging stops to avoid severe lag
        this.epicycleSlider.addEventListener('change', () => {
            this.updateEquation();
        });

        // Save Button
        this.saveBtn.addEventListener('click', () => {
            this.userInteracted = true;
            const link = document.createElement('a');
            link.download = 'fourier-magic.png';
            link.href = this.canvas.toDataURL('image/png');
            link.click();
        });

        // Copy Equation Button
        if (this.copyBtn) {
            this.copyBtn.addEventListener('click', () => {
                if (this.lastEqString) {
                    navigator.clipboard.writeText(this.lastEqString).then(() => {
                        const icon = this.copyBtn.innerHTML;
                        this.copyBtn.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="#10B981" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                        setTimeout(() => this.copyBtn.innerHTML = icon, 2000);
                    });
                }
            });
        }
    }

    handleResize() {
        // Match canvas physical size to its CSS rendered size
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    setStatus(message, isWorking = true) {
        this.statusBox.innerText = message;
        if (isWorking) {
            this.statusBox.classList.remove('hidden');
        } else {
            // Hide after a short delay when done
            setTimeout(() => this.statusBox.classList.add('hidden'), 2000);
        }
    }

    async processNewImage(imageElement) {
        this.fourierData = []; // Stop current animation
        this.setStatus("1. Extracting edges and connecting path...");
        
        // Use timeout to allow UI to update before heavy processing
        setTimeout(async () => {
            const points = await this.processor.process(imageElement, this.numPoints);
            
            if (points.length === 0) {
                this.setStatus("Error: Could not find clear edges. Try another image.", true);
                if (!this.userInteracted) {
                    this.autoLoopIndex = (this.autoLoopIndex + 1) % this.autoLoopPresets.length;
                    setTimeout(() => this.triggerAutoLoopNext(), 1000);
                }
                return;
            }

            this.setStatus("2. Calculating Fourier Mathematics... 0% (This may take a moment)");
            
            // Wait slightly so the status message renders
            setTimeout(async () => {
                this.fourierData = await dft(points, (progress) => {
                    this.setStatus(`2. Calculating Fourier Mathematics... ${progress}%`);
                });
                this.setupAnimation(points);
                this.setStatus("Drawing!", false);
            }, 50);
            
        }, 50);
    }

    setupAnimation(originalPoints) {
        // Update slider UI
        this.epicycleSlider.max = this.fourierData.length;
        this.epicycleSlider.value = this.fourierData.length;
        this.epicycleSlider.disabled = false;
        this.epicycleValue.innerText = this.fourierData.length;

        // Calculate scale to fit canvas
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (let p of originalPoints) {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        }
        
        const pathLargestDim = Math.max(1, Math.max(maxX - minX, maxY - minY));
        const canvasSmallestDim = Math.min(this.width, this.height);
        
        // Leave 20% padding around the edge
        this.scaleRatio = (canvasSmallestDim * 0.8) / pathLargestDim;

        this.tracedPath = [];
        this.time = 0;
        this.saveBtn.style.display = 'block';

        // Display equation initially
        this.updateEquation();
    }

    updateEquation() {
        if (!window.katex || this.fourierData.length === 0) return;

        const activeEpicycles = parseInt(this.epicycleSlider.value);
        // Show all active epicycles
        const topTerms = this.fourierData.slice(0, activeEpicycles);
        
        let eqString = "f(t) = ";
        
        topTerms.forEach((term, index) => {
            const amp = Math.round(term.amp);
            const freq = term.freq;
            const phase = term.phase.toFixed(2);
            
            if (index > 0) eqString += " + ";
            if (freq === 0) {
                eqString += `${amp}`;
            } else {
                let phaseStr = phase >= 0 ? `+ ${phase}` : `- ${Math.abs(phase)}`;
                eqString += `${amp} e^{i(${freq}t ${phaseStr})}`;
            }
        });
        
        this.lastEqString = eqString;
        
        const eqBar = document.getElementById('equationBar');
        if (eqBar) {
            eqBar.classList.remove('hidden');
            if (this.copyBtn) this.copyBtn.classList.remove('hidden');
            
            try {
                katex.render(eqString, eqBar, {
                    throwOnError: false,
                    displayMode: false, // Inline mode keeps it on one line
                    maxExpand: Infinity 
                });
            } catch (e) {
                console.error("KaTeX failed to render", e);
            }
        }
    }

    drawEpicycles(startX, startY) {
        let x = startX;
        let y = startY;
        
        const activeEpicycles = parseInt(this.epicycleSlider.value);

        for (let i = 0; i < activeEpicycles && i < this.fourierData.length; i++) {
            let prevX = x;
            let prevY = y;

            let coeff = this.fourierData[i];
            let radius = coeff.amp * this.scaleRatio;
            let currentAngle = coeff.freq * this.time + coeff.phase;

            x += radius * Math.cos(currentAngle);
            y += radius * Math.sin(currentAngle);

            // Draw the faint circle
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.arc(prevX, prevY, radius, 0, 2 * Math.PI);
            this.ctx.stroke();

            // Draw the connecting radius line
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.beginPath();
            this.ctx.moveTo(prevX, prevY);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        }
        
        return { x, y };
    }

    startRenderLoop() {
        const render = () => {
            // Clear canvas with a very faint trail effect
            this.ctx.fillStyle = 'rgba(17, 17, 17, 0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);

            if (this.fourierData.length > 0) {
                // Calculate the position of the final drawing pen
                let penPosition = this.drawEpicycles(this.width / 2, this.height / 2);
                
                if (!this.isPaused) {
                    // Add point to our traced path
                    this.tracedPath.push(penPosition);
                    
                    const dt = (2 * Math.PI) / this.fourierData.length;
                    this.time += dt * this.animationSpeed;
                    
                    // Reset drawing when it completes a full cycle (2*PI)
                    if (this.time >= 2 * Math.PI) {
                        this.isPaused = true;
                        setTimeout(() => {
                            this.time = 0;
                            this.tracedPath = []; 
                            this.isPaused = false;
                            
                            // If auto-loop is active and user hasn't interacted, load next preset
                            if (!this.userInteracted) {
                                this.autoLoopIndex = (this.autoLoopIndex + 1) % this.autoLoopPresets.length;
                                this.triggerAutoLoopNext();
                            }
                        }, 3000);
                    }
                }

                // Draw the historic path
                this.ctx.beginPath();
                for (let i = 0; i < this.tracedPath.length; i++) {
                    if (i === 0) this.ctx.moveTo(this.tracedPath[i].x, this.tracedPath[i].y);
                    else this.ctx.lineTo(this.tracedPath[i].x, this.tracedPath[i].y);
                }
                
                this.ctx.strokeStyle = '#10B981'; // accent-green
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }

            requestAnimationFrame(render);
        };
        
        render();
    }
}

// Boot the application
window.onload = () => {
    new FourierApp();
};
