import * as ort from 'onnxruntime-web';

ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';

let session = null;

const LABELS = {
  0: "Pork Belly Liempo",
  1: "Tilapia (Local)",
  2: "Whole Chicken",
};

async function init() {
  if (session) return;
  try {
    session = await ort.InferenceSession.create('/model.onnx', { executionProviders: ['wasm'] });
    console.log("✅ ONNX Model loaded in Web Worker.");
    postMessage({ type: 'ready' });
  } catch (err) {
    console.error("❌ Failed to load ONNX model in Web Worker:", err);
  }
}

init();

let float32Data = new Float32Array(3 * 640 * 640);

self.onmessage = async (e) => {
  if (!session) return;

  const { pixels } = e.data;
  
  // Convert Uint8ClampedArray to normalized Float32Array
  for (let i = 0; i < 640 * 640; i++) {
    float32Data[i] = pixels[i * 4] / 255.0;                   // R
    float32Data[i + 640 * 640] = pixels[i * 4 + 1] / 255.0;       // G
    float32Data[i + 2 * 640 * 640] = pixels[i * 4 + 2] / 255.0;   // B
  }

  const inputTensor = new ort.Tensor('float32', float32Data, [1, 3, 640, 640]);

  try {
    const feeds = {};
    feeds[session.inputNames[0]] = inputTensor;
    const output = await session.run(feeds);
    
    const outputTensor = output[session.outputNames[0]];
    const data = outputTensor.data;

    let bestConf = 0;
    let bestClass = -1;
    const numAnchors = 8400;
    const numClasses = 3;

    for (let c = 0; c < numClasses; c++) {
      const classOffset = (4 + c) * numAnchors;
      for (let a = 0; a < numAnchors; a++) {
        const conf = data[classOffset + a];
        if (conf > bestConf) {
          bestConf = conf;
          bestClass = c;
        }
      }
    }

    if (bestConf > 0.35 && bestClass !== -1) {
      postMessage({ 
        type: 'result', 
        result: { className: LABELS[bestClass], confidence: bestConf } 
      });
    } else {
      postMessage({ type: 'result', result: null });
    }

  } catch (err) {
    console.error(err);
    postMessage({ type: 'result', result: null });
  }
};
