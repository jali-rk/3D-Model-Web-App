# test_garment_pygltf.py
import os
import numpy as np
import pygltflib
from pathlib import Path

GARMENT_PATH = r"E:\Onecodelabs_asssignments\3d_fashion_new\avatar\backend\models\garments\scaled"

def analyze_glb_with_pygltflib(filename):
    """Analyze GLB file using pygltflib"""
    
    filepath = os.path.join(GARMENT_PATH, filename)
    print(f"\n{'='*60}")
    print(f"Analyzing: {filename}")
    print(f"{'='*60}")
    
    # Load the GLB file
    gltf = pygltflib.GLTF2().load(filepath)
    
    print(f"\n📊 GLTF Structure:")
    print(f"  Asset: {gltf.asset}")
    print(f"  Scenes: {len(gltf.scenes)}")
    print(f"  Nodes: {len(gltf.nodes)}")
    print(f"  Meshes: {len(gltf.meshes)}")
    print(f"  Accessors: {len(gltf.accessors)}")
    print(f"  Buffer Views: {len(gltf.bufferViews)}")
    print(f"  Buffers: {len(gltf.buffers)}")
    
    # Check buffers
    print(f"\n📦 Buffers:")
    for i, buffer in enumerate(gltf.buffers):
        print(f"  Buffer {i}: {buffer.uri if buffer.uri else 'embedded'}, {buffer.byteLength} bytes")
    
    # Check buffer views
    print(f"\n🔍 Buffer Views:")
    for i, view in enumerate(gltf.bufferViews):
        print(f"  View {i}: buffer={view.buffer}, offset={view.byteOffset}, length={view.byteLength}, target={view.target}")
    
    # Check accessors
    print(f"\n📐 Accessors:")
    for i, accessor in enumerate(gltf.accessors):
        print(f"  Accessor {i}: {accessor.type} {accessor.componentType}, count={accessor.count}, bufferView={accessor.bufferView}")
        
        # Try to decode the data if it's positions
        if hasattr(accessor, 'min') and accessor.min:
            print(f"    Min: {accessor.min}")
            print(f"    Max: {accessor.max}")
        
        # Get the actual data
        if accessor.bufferView is not None:
            buffer_view = gltf.bufferViews[accessor.bufferView]
            buffer_data = gltf.binary_blob()
            
            if buffer_data:
                start = buffer_view.byteOffset
                end = start + buffer_view.byteLength
                data = buffer_data[start:end]
                
                # Decode based on component type
                if accessor.componentType == 5126:  # FLOAT
                    dtype = np.float32
                elif accessor.componentType == 5123:  # UNSIGNED_SHORT
                    dtype = np.uint16
                elif accessor.componentType == 5125:  # UNSIGNED_INT
                    dtype = np.uint32
                else:
                    dtype = np.uint8
                
                decoded = np.frombuffer(data, dtype=dtype)
                print(f"    Data shape: {decoded.shape}")
                
                if accessor.type == "VEC3" and accessor.componentType == 5126:
                    # This is likely positions
                    positions = decoded.reshape(-1, 3)
                    print(f"    Positions shape: {positions.shape}")
                    print(f"    Position bounds: [{positions.min(axis=0)}, {positions.max(axis=0)}]")
                    
                    if hasattr(accessor, 'min') and accessor.min:
                        print(f"    Accessor min: {accessor.min}")
                        print(f"    Accessor max: {accessor.max}")

def main():
    files = ['shirt_template_XL.glb', 'shirt_template_XS.glb']
    
    for filename in files:
        filepath = os.path.join(GARMENT_PATH, filename)
        if os.path.exists(filepath):
            analyze_glb_with_pygltflib(filename)
        else:
            print(f"❌ File not found: {filename}")

if __name__ == "__main__":
    main()