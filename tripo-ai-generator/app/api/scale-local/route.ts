import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

// Size scaling factors (same as Python script)
const SIZE_SCALE_FACTORS: Record<string, number> = {
  'XS': 0.85,
  'S': 0.92,
  'M': 1.0,
  'L': 1.08,
  'XL': 1.15,
  'XXL': 1.25,
  'XXXL': 1.3
};

export async function POST(request: Request) {
  let tempDir: string | null = null;
  
  try {
    const { modelUrl, targetSize } = await request.json();

    if (!modelUrl || !targetSize) {
      return NextResponse.json(
        { error: 'Model URL and target size required' },
        { status: 400 }
      );
    }

    console.log(`📥 Downloading model for scaling to ${targetSize}...`);

    // Download the model from Tripo
    const response = await fetch(modelUrl);
    if (!response.ok) {
      throw new Error(`Failed to download model: ${response.status}`);
    }

    const modelBuffer = await response.arrayBuffer();
    const fileSizeMB = (modelBuffer.byteLength / (1024 * 1024)).toFixed(2);
    console.log(`✅ Model downloaded: ${fileSizeMB} MB`);

    // Create temp directory for processing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'glb-scale-'));
    const inputPath = path.join(tempDir, 'input.glb');
    const outputPath = path.join(tempDir, `output_${targetSize}.glb`);
    
    // Save input file
    await fs.writeFile(inputPath, Buffer.from(modelBuffer));
    
    // Get scale factor
    const scaleFactor = SIZE_SCALE_FACTORS[targetSize] || 1.0;
    console.log(`📏 Scaling to ${targetSize} (factor: ${scaleFactor})...`);

    // Create Python script that does EXACTLY what your working script does
    const pythonScript = `
import trimesh
import sys
import os

input_file = sys.argv[1]
output_file = sys.argv[2]
scale = float(sys.argv[3])

print(f"Loading: {input_file}")
mesh = trimesh.load(input_file)

if isinstance(mesh, trimesh.Scene):
    print(f"Found scene with {len(mesh.geometry)} meshes")
    for geom_name, geom in mesh.geometry.items():
        print(f"  Scaling {geom_name}...")
        geom.vertices *= scale
else:
    print(f"Found single mesh with {len(mesh.vertices)} vertices")
    mesh.vertices *= scale

mesh.export(output_file)
print(f"Saved to: {output_file}")
`;

    const scriptPath = path.join(tempDir, 'scale.py');
    await fs.writeFile(scriptPath, pythonScript);
    
    // Execute Python script
    const { stdout, stderr } = await execAsync(
      `python "${scriptPath}" "${inputPath}" "${outputPath}" ${scaleFactor}`
    );
    
    console.log('Python output:', stdout);
    if (stderr) console.error('Python stderr:', stderr);
    
    // Read the scaled file
    const scaledBuffer = await fs.readFile(outputPath);
    const scaledSizeMB = (scaledBuffer.length / (1024 * 1024)).toFixed(2);
    console.log(`✅ Scaling complete: ${scaledSizeMB} MB`);

    // Return the scaled model
    return new NextResponse(scaledBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'model/gltf-binary',
        'Content-Disposition': `attachment; filename="garment_${targetSize}.glb"`,
        'Access-Control-Allow-Origin': '*',
        'Content-Length': scaledBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Scaling error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    // Clean up temp files
    if (tempDir) {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}