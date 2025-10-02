export interface EnhancementSettings {
  brightness: number;    // -100 to 100
  contrast: number;      // -100 to 100
  sharpness: number;     // 0 to 100
  threshold: number;     // 0 to 255 (0 = disabled)
}

// Clone ImageData
function cloneImageData(imageData: ImageData): ImageData {
  const cloned = new ImageData(
    new Uint8ClampedArray(imageData.data),
    imageData.width,
    imageData.height
  );
  return cloned;
}

// 1. Brightness Adjustment
export function adjustBrightness(imageData: ImageData, value: number): ImageData {
  const result = cloneImageData(imageData);
  const data = result.data;
  const adjustment = (value / 100) * 255;
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, data[i] + adjustment));     // R
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + adjustment)); // G
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + adjustment)); // B
  }
  
  return result;
}

// 2. Contrast Adjustment
export function adjustContrast(imageData: ImageData, value: number): ImageData {
  const result = cloneImageData(imageData);
  const data = result.data;
  const factor = (259 * (value + 255)) / (255 * (259 - value));
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
    data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
    data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
  }
  
  return result;
}

// 3. Sharpening Filter (3x3 convolution kernel)
export function sharpenImage(imageData: ImageData, intensity: number): ImageData {
  const result = cloneImageData(imageData);
  const width = imageData.width;
  const height = imageData.height;
  const srcData = imageData.data;
  const dstData = result.data;
  
  const centerWeight = 5 + (intensity / 20);
  const kernel = [
    0, -1, 0,
    -1, centerWeight, -1,
    0, -1, 0
  ];
  
  // Apply convolution
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) { // RGB channels only
        let sum = 0;
        
        // Apply kernel
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIndex = ((y + ky) * width + (x + kx)) * 4 + c;
            const kernelIndex = (ky + 1) * 3 + (kx + 1);
            sum += srcData[pixelIndex] * kernel[kernelIndex];
          }
        }
        
        const index = (y * width + x) * 4 + c;
        dstData[index] = Math.min(255, Math.max(0, sum));
      }
    }
  }
  
  return result;
}

// 4. Black/White Threshold
export function applyThreshold(imageData: ImageData, threshold: number): ImageData {
  const result = cloneImageData(imageData);
  const data = result.data;
  
  for (let i = 0; i < data.length; i += 4) {
    // Convert to grayscale using luminosity method
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    
    // Apply threshold
    const value = gray > threshold ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = value;
  }
  
  return result;
}

// Combine all filters in optimal order
export function applyAllFilters(
  originalData: ImageData,
  settings: EnhancementSettings
): ImageData {
  let result = cloneImageData(originalData);
  
  // Apply in optimal order
  if (settings.brightness !== 0) {
    result = adjustBrightness(result, settings.brightness);
  }
  
  if (settings.contrast !== 0) {
    result = adjustContrast(result, settings.contrast);
  }
  
  if (settings.sharpness > 0) {
    result = sharpenImage(result, settings.sharpness);
  }
  
  if (settings.threshold > 0) {
    result = applyThreshold(result, settings.threshold);
  }
  
  return result;
}
