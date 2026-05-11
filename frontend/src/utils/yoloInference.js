let worker = null;
let isReady = false;
let resolveCurrentInference = null;

let canvas = null;
let ctx = null;

export function loadModel() {
  if (worker) return;
  // Initialize Web Worker
  worker = new Worker(new URL('./yoloWorker.js', import.meta.url), { type: 'module' });

  worker.onmessage = (e) => {
    const { type, result } = e.data;
    if (type === 'ready') {
      isReady = true;
    } else if (type === 'result') {
      if (resolveCurrentInference) {
        resolveCurrentInference(result);
        resolveCurrentInference = null;
      }
    }
  };
}

export async function detectActiveCommodity(videoElement) {
  if (!worker || !isReady || !videoElement || videoElement.readyState < 2) return null;
  if (resolveCurrentInference) return null; // Drop frame if worker is still busy

  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 640;
    ctx = canvas.getContext('2d', { willReadFrequently: true });
  }

  // Draw video frame to canvas
  ctx.drawImage(videoElement, 0, 0, 640, 640);
  const imageData = ctx.getImageData(0, 0, 640, 640);
  const pixels = imageData.data;

  return new Promise((resolve) => {
    resolveCurrentInference = resolve;
    // Transfer the underlying ArrayBuffer to the worker for zero-copy performance
    worker.postMessage({ pixels }, [pixels.buffer]);
  });
}

export function cleanupModel() {
  if (worker) {
    worker.terminate();
    worker = null;
    isReady = false;
    resolveCurrentInference = null;
  }
}
