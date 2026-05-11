import * as ort from 'onnxruntime-web';

let session = null;

// The classes from backend/services/vision.py:
// 0: pork_liempo
// 1: tilapia_local
// 2: whole_chicken
const LABELS = {
  0: "Pork Belly Liempo",
  1: "Tilapia (Local)",
  2: "Whole Chicken",
};

export async function loadModel() {
  if (session) return;
  try {
    // Specify the path to the wasm files to ensure they load correctly from public folder
    ort.env.wasm.wasmPaths = '/';
    session = await ort.InferenceSession.create('/model.onnx', { executionProviders: ['wasm'] });
    console.log("ONNX Model loaded.");
  } catch (err) {
    console.error("Failed to load ONNX model:", err);
  }
}

export async function detectActiveCommodity(videoElement) {
  if (!session || !videoElement || videoElement.readyState < 2) return null;

  // Create an offscreen canvas to resize the frame to 640x640
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 640;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  // Draw video frame to canvas
  ctx.drawImage(videoElement, 0, 0, 640, 640);
  const imageData = ctx.getImageData(0, 0, 640, 640).data;

  // Prepare input tensor: [1, 3, 640, 640] Float32Array
  const float32Data = new Float32Array(3 * 640 * 640);
  
  // YOLO expects RGB channels separated, normalized to 0.0 - 1.0
  for (let i = 0; i < 640 * 640; i++) {
    float32Data[i] = imageData[i * 4] / 255.0;                   // R
    float32Data[i + 640 * 640] = imageData[i * 4 + 1] / 255.0;       // G
    float32Data[i + 2 * 640 * 640] = imageData[i * 4 + 2] / 255.0;   // B
  }

  const inputTensor = new ort.Tensor('float32', float32Data, [1, 3, 640, 640]);

  try {
    const feeds = {};
    feeds[session.inputNames[0]] = inputTensor;
    const output = await session.run(feeds);
    
    // Output shape is [1, 7, 8400]
    const outputTensor = output[session.outputNames[0]];
    const data = outputTensor.data;

    let bestConf = 0;
    let bestClass = -1;

    // We have 8400 anchors. For each anchor, we check the class probabilities.
    // The data array is flattened. Shape [1, 7, 8400] means:
    // data[0 ... 8399] is x
    // data[8400 ... 16799] is y
    // data[16800 ... 25199] is w
    // data[25200 ... 33599] is h
    // data[33600 ... 41999] is class 0 conf
    // data[42000 ... 50399] is class 1 conf
    // data[50400 ... 58799] is class 2 conf

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

    if (bestConf > 0.45 && bestClass !== -1) {
      return {
        className: LABELS[bestClass],
        confidence: bestConf
      };
    }
    
    return null;
  } catch (e) {
    console.error("Inference error:", e);
    return null;
  }
}
