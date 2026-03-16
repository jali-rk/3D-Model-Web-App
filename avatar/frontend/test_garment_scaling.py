"""
Simple GLB Scaler - This WILL work!
Save as 'scale_simple.py' in your frontend folder
"""

import trimesh
import os
import sys

def main():
    # Your paths
    input_file = r"E:\Onecodelabs_asssignments\3d_fashion_new\avatar\backend\models\garments\shirt_template.glb"
    output_folder = r"E:\Onecodelabs_asssignments\3d_fashion_new\avatar\backend\models\garments\scaled"
    
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"❌ Error: Input file not found!")
        print(f"   {input_file}")
        input("\nPress Enter to exit...")
        return
    
    # Create output folder
    os.makedirs(output_folder, exist_ok=True)
    
    # Show input file info
    input_size = os.path.getsize(input_file) / 1024
    print("\n" + "="*50)
    print("👕 GARMENT SIZE SCALER")
    print("="*50)
    print(f"\n📁 Input file: {os.path.basename(input_file)}")
    print(f"   Size: {input_size:.1f} KB")
    print(f"📁 Output folder: {output_folder}")
    
    # Size options
    print("\n📏 Available sizes:")
    print("   1. XS  (0.85x) - Extra Small")
    print("   2. S   (0.92x) - Small")
    print("   3. M   (1.00x) - Medium (original)")
    print("   4. L   (1.08x) - Large")
    print("   5. XL  (1.15x) - Extra Large")
    print("   6. XXL (1.25x) - Double Extra Large")
    print("   0. Exit")
    
    try:
        choice = input("\nEnter your choice (0-6): ").strip()
        
        if choice == '0':
            print("\n👋 Goodbye!")
            return
        
        # Map choices to sizes
        size_map = {
            '1': ('XS', 0.85),
            '2': ('S', 0.92),
            '3': ('M', 1.0),
            '4': ('L', 1.08),
            '5': ('XL', 1.15),
            '6': ('XXL', 1.25)
        }
        
        if choice not in size_map:
            print("\n❌ Invalid choice! Please enter a number between 0-6")
            return
        
        size_name, scale = size_map[choice]
        output_file = os.path.join(output_folder, f"shirt_template_{size_name}.glb")
        
        print(f"\n🔄 Creating {size_name} size (scale: {scale})...")
        
        # Load the mesh
        print("   Loading GLB file...")
        mesh = trimesh.load(input_file)
        
        # Check what we loaded
        if isinstance(mesh, trimesh.Scene):
            print(f"   Found scene with {len(mesh.geometry)} meshes")
            # Scale each mesh in the scene
            for geom_name, geom in mesh.geometry.items():
                print(f"      Scaling {geom_name}...")
                geom.vertices *= scale
        else:
            print(f"   Found single mesh with {len(mesh.vertices)} vertices")
            mesh.vertices *= scale
        
        # Save the scaled file
        print("   Saving scaled file...")
        mesh.export(output_file)
        
        # Verify it worked
        if os.path.exists(output_file):
            new_size = os.path.getsize(output_file) / 1024
            print(f"\n✅ SUCCESS!")
            print(f"   📁 File: {output_file}")
            print(f"   📦 Original size: {input_size:.1f} KB")
            print(f"   📦 New size: {new_size:.1f} KB")
        else:
            print(f"\n❌ Failed to save file")
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nTrying alternative method...")
        
        try:
            # Alternative method using trimesh.load_mesh
            print("   Reloading with load_mesh...")
            mesh = trimesh.load_mesh(input_file)
            print(f"   Loaded mesh with {len(mesh.vertices)} vertices")
            mesh.vertices *= scale
            mesh.export(output_file)
            
            if os.path.exists(output_file):
                new_size = os.path.getsize(output_file) / 1024
                print(f"\n✅ SUCCESS with alternative method!")
                print(f"   📁 File: {output_file}")
                print(f"   📦 Size: {new_size:.1f} KB")
            else:
                print(f"\n❌ Alternative method also failed")
        except Exception as e2:
            print(f"\n❌ Alternative method error: {e2}")
    
    input("\nPress Enter to exit...")

if __name__ == "__main__":
    main()