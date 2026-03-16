import * as THREE from 'three';

// Size scaling factors
export const SIZE_SCALE_FACTORS: Record<string, number> = {
  'XS': 0.85,
  'S': 0.925,
  'M': 1.0,
  'L': 1.075,
  'XL': 1.15,
  'XXL': 1.225,
  'XXXL': 1.3
};

// Size measurements for reference
export const SIZE_MEASUREMENTS: Record<string, {
  chest: number;
  waist: number;
  length: number;
  shoulder: number;
}> = {
  'XS': { chest: 84, waist: 68, length: 62, shoulder: 38 },
  'S': { chest: 90, waist: 74, length: 64, shoulder: 40 },
  'M': { chest: 96, waist: 80, length: 66, shoulder: 42 },
  'L': { chest: 102, waist: 86, length: 68, shoulder: 44 },
  'XL': { chest: 108, waist: 92, length: 70, shoulder: 46 },
  'XXL': { chest: 114, waist: 98, length: 72, shoulder: 48 },
  'XXXL': { chest: 120, waist: 104, length: 74, shoulder: 50 }
};

/**
 * Scale a GLB file to a specific size
 * This mimics the working Python script but in JavaScript/Node.js
 */
export async function scaleGLB(
  inputBuffer: ArrayBuffer,
  targetSize: string,
  baseFilename: string = 'model'
): Promise<ArrayBuffer> {
  try {
    // Dynamically import Three.js modules (only on server-side)
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
    
    // Create a simple promise-based loader
    const loader = new GLTFLoader();
    
    // Parse the GLB buffer
    const gltf = await new Promise<any>((resolve, reject) => {
      loader.parse(
        inputBuffer,
        '',
        (result) => resolve(result),
        (error) => reject(error)
      );
    });
    
    // Get the scene
    const scene = gltf.scene;
    
    // Apply scaling based on target size
    const scaleFactor = SIZE_SCALE_FACTORS[targetSize] || 1.0;
    
    // Scale the entire scene
    scene.scale.set(scaleFactor, scaleFactor, scaleFactor);
    
    // Also scale any animations if present
    if (gltf.animations && gltf.animations.length > 0) {
      console.log(`Scaling ${gltf.animations.length} animations...`);
      // Animation scaling would go here if needed
    }
    
    // Export back to GLB
    const exporter = new GLTFExporter();
    
    const scaledBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      exporter.parse(
        scene,
        (result) => {
          if (result instanceof ArrayBuffer) {
            resolve(result);
          } else {
            // Convert JSON to buffer if needed
            const jsonString = JSON.stringify(result);
            resolve(Buffer.from(jsonString).buffer);
          }
        },
        (error) => reject(error),
        { binary: true }
      );
    });
    
    return scaledBuffer;
    
  } catch (error) {
    console.error('Error scaling GLB:', error);
    throw error;
  }
}

/**
 * Alternative simpler scaling using vertex manipulation
 * This is more like the Python script approach
 */
export function scaleGLBSimple(
  inputBuffer: ArrayBuffer,
  targetSize: string
): ArrayBuffer {
  // This is a placeholder - the actual implementation
  // will be done in the API route using Node.js buffers
  // but we're keeping this for compatibility
  return inputBuffer;
}

/**
 * Get file info for logging
 */
export function getFileInfo(buffer: ArrayBuffer): { sizeKB: number; sizeMB: string } {
  const sizeKB = buffer.byteLength / 1024;
  const sizeMB = (buffer.byteLength / (1024 * 1024)).toFixed(2);
  return { sizeKB, sizeMB };
}