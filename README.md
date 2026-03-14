# Fourier Magic 🪄

> ✨ **Built with love by Karm to celebrate Pi Day (March 14, 2026).**

> 🤖 **Disclaimer:** Major parts of this project have been vibe-coded and relied heavily on AI collaboration. The ultimate spirit of the codebase isn't perfection instead it's to encourage an appreciation for mathematics and to celebrate Pi Day!


An interactive, educational web application that brings the magic of mathematics to life. **Fourier Magic** takes any image (or selected presets) and mathematically deconstructs it into a continuous path, which is then re-drawn before your eyes using the power of the Discrete Fourier Transform (DFT) and rotating epicycles.

You can check it out on [Link](https://fourier-magic-pi-day.karmrajput13.workers.dev/)

### 🖼️ Usage
Since this is a client-side only application, simply clone the repository and open `index.html` in your favorite modern web browser, or serve it using any basic HTTP server.

Then navigate to `http://localhost:8000`.

---

## 🚀 Features
- **Mathematical Epicycles:** Watch as dozens (or hundreds) of rotating circles combine to trace out complex shapes like the Batman logo, an F1 car, or your own uploaded images.
- **Dynamic Live Equations:** As the circles rotate, the exact mathematical equation powering the drawing ($f(t) = c_0 + c_1 e^{i\omega t} + \dots$) is generated in real-time on a horizontally scrolling bar using KaTeX, complete with a one-click copy-to-clipboard button.
- **Asynchronous Processing:** The complex `O(N^2)` Fourier transform algorithms are chunked and executed asynchronously, keeping the UI silky smooth and providing a live-updating percentage counter.
- **Auto-Loop Presentation Mode:** Sit back and relax. If you don't interact with the page, it automatically loops through some of the coolest built-in presets continuously.
- **Complete Control:** Granular sliders let you adjust the Drawing Speed, the density of the sampled points, and incredibly, the exact number of Epicycles (Terms) used to draw the path.

---

## 🏗️ Project Architecture
The project is built entirely clean with zero complex build steps. It utilizes Vanilla ES6 JavaScript, standard HTML5 Canvas, and CSS Variables. 

### Core Modules
* **`index.html` & `style.css`**: The structural and visual presentation. Implements a clean, minimal "vibe" utilizing bold border shadows and flat UI constraints. Includes the KaTeX library via CDN for equation rendering.
* **`js/main.js`**: The central application controller (`FourierApp`). Manages the state, canvas rendering loop (`requestAnimationFrame`), slider inputs, auto-loop logic, and coordinates the translation of Fourier coefficients into rotating circles.
* **`js/process.js` / `imageProcessor.js`**: Handles the ingestion of user-uploaded images or presets. It draws the image to an invisible canvas, extracts the pixel data, runs edge detection (marching squares / contouring), and optionally solves a Traveling Salesperson Problem (TSP) heuristic to link scattered points into one continuous drawing line. 
* **`js/dft.js`**: The mathematical core. Given an array of complex numbers representing the target 2D path, it calculates the Discrete Fourier Transform. It yields execution to the main thread via Promises to prevent browser locking on high-density images.

---

## 📚 The Math Behind The Magic
Every 2D closed path can be interpreted as a complex function of time in the complex plane ($x + yi$). The Discrete Fourier Transform breaks this complex function down into a series of fundamental frequencies (sine and cosine waves), represented visually as rotating vectors (circles/epicycles) attached end-to-end.

The formula for the $k$-th frequency coefficient is roughly:
$$X_k = \sum_{n=0}^{N-1} x_n \cdot e^{-i \frac{2\pi}{N} k n}$$

Each resulting coefficient gives us the **Amplitude** (radius of the circle), **Frequency** (speed of rotation), and **Phase** (starting angle) necessary to reconstruct the drawing.

> *For a visual intuition on this beautiful concept, check out this amazing video by [3Blue1Brown: "But what is a Fourier series?"](https://www.youtube.com/watch?v=r6sGWTCMz2k)*

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
