import trimesh
import uuid
import os
import time
import numpy as np
from ..config import OUTPUT_PATH
from ..models.garment_scaler import garment_scaler
from ..models.body_measurements import body_measurer

def export_complete_avatar(vertices, faces, joints, garment_items=None):
    """Export avatar with positioned garments (size-aware)"""
    
    start_total = time.time()
    garment_count = len(garment_items) if garment_items else 0
    print(f"\n🔄 Starting avatar export with {garment_count} garments")
    
    try:
        # Create base avatar mesh
        avatar_mesh = trimesh.Trimesh(vertices=vertices, faces=faces)
        
        # Center and scale avatar
        center = avatar_mesh.centroid
        avatar_mesh.vertices -= center
        
        # Scale avatar to reasonable size
        bounds = avatar_mesh.bounds
        height = bounds[1][1] - bounds[0][1]
        scale_factor = 1.8 / height
        avatar_mesh.vertices *= scale_factor
        
        # Scale joints as well
        if joints is not None:
            joints = joints.copy()
            joints -= center
            joints *= scale_factor
        
        # Extract body measurements
        measurements = body_measurer.extract_from_vertices(avatar_mesh.vertices, joints)
        
        # Add skin color
        skin_colors = np.ones((len(avatar_mesh.vertices), 4)) * [0.95, 0.85, 0.75, 1.0]
        avatar_mesh.visual = trimesh.visual.ColorVisuals(
            mesh=avatar_mesh, vertex_colors=skin_colors
        )
        
        # Prepare all meshes
        all_meshes = [avatar_mesh]
        
        # Add garments if requested
        if garment_items:
            for i, garment_item in enumerate(garment_items):
                # Handle both string (backward compatibility) and dict formats
                if isinstance(garment_item, str):
                    garment_type = garment_item
                    garment_size = 'M'
                    print(f"\n👕 Processing garment {i+1}: {garment_type} (default size M)")
                else:
                    garment_type = garment_item['id'] if isinstance(garment_item, dict) else garment_item.id
                    garment_size = garment_item.get('size', 'M') if isinstance(garment_item, dict) else getattr(garment_item, 'size', 'M')
                    print(f"\n👕 Processing garment {i+1}: {garment_type} (size: {garment_size})")
                
                # Create positioned garment with size
                garment = garment_scaler.create_garment(
                    garment_type,
                    measurements,
                    avatar_mesh.vertices,
                    joints,
                    garment_size
                )
                
                if garment is not None:
                    if hasattr(garment, 'visual') and garment.visual is not None:
                        print(f"  ✅ Garment has visual data: {type(garment.visual).__name__}")
                        if hasattr(garment.visual, 'vertex_colors') and garment.visual.vertex_colors is not None:
                            print(f"  🎨 Vertex colors present: {garment.visual.vertex_colors.shape}")
                    else:
                        print(f"  ⚠️ Garment has NO visual data - adding default color")
                        default_color = np.ones((len(garment.vertices), 4)) * [200, 100, 100, 255]
                        garment.visual = trimesh.visual.ColorVisuals(
                            mesh=garment, vertex_colors=default_color
                        )
                    
                    # Layer offset for multiple garments
                    layer_offset = 0.005 * (i + 1)
                    
                    if hasattr(garment, 'vertices'):
                        temp_visual = None
                        if hasattr(garment, 'visual') and garment.visual is not None:
                            if hasattr(garment.visual, 'copy'):
                                temp_visual = garment.visual.copy()
                        
                        # Apply offset
                        garment.vertices[:, 2] += layer_offset
                        
                        if temp_visual is not None and (not hasattr(garment, 'visual') or garment.visual is None):
                            garment.visual = temp_visual
                            print(f"  ✅ Restored visual data after offset")
                    
                    all_meshes.append(garment)
                    size_info = f" (size {garment_size})" if not isinstance(garment_item, str) else ""
                    print(f"  ✅ Added {garment_type}{size_info}")
                else:
                    print(f"  ❌ Failed to create {garment_type}")
        
        # Combine all meshes
        print("\n🔄 Combining meshes...")
        
        scene = trimesh.Scene()
        for j, mesh in enumerate(all_meshes):
            scene.add_geometry(mesh, node_name=f"mesh_{j}")
        
        print(f"  ✅ Created scene with {len(all_meshes)} meshes")
        
        # Generate filename
        timestamp = int(time.time())
        filename = f"avatar_{timestamp}_{uuid.uuid4().hex[:8]}.glb"
        path = os.path.join(OUTPUT_PATH, filename)
        
        # Export as GLB
        scene.export(path, include_normals=True)
        
        total_time = time.time() - start_total
        print(f"\n✅ Export complete in {total_time:.2f}s")
        print(f"📁 File saved: {filename}")
        
        # Cleanup old files
        cleanup_old_files(20)
        
        return filename
        
    except Exception as e:
        print(f"❌ Error in export: {e}")
        import traceback
        traceback.print_exc()
        return export_avatar_only(vertices, faces)

def export_avatar_only(vertices, faces):
    """Quick export without garments for fallback"""
    print("⚠️ Using fallback: avatar-only export")
    
    mesh = trimesh.Trimesh(vertices=vertices, faces=faces)
    
    # Center and scale
    center = mesh.centroid
    mesh.vertices -= center
    
    bounds = mesh.bounds
    height = bounds[1][1] - bounds[0][1]
    scale_factor = 1.8 / height
    mesh.vertices *= scale_factor
    
    # Add skin color
    skin_colors = np.ones((len(mesh.vertices), 4)) * [0.95, 0.85, 0.75, 1.0]
    mesh.visual = trimesh.visual.ColorVisuals(mesh=mesh, vertex_colors=skin_colors)
    
    timestamp = int(time.time())
    filename = f"avatar_{timestamp}_{uuid.uuid4().hex[:8]}.glb"
    path = os.path.join(OUTPUT_PATH, filename)
    
    mesh.export(path, include_normals=True)
    print(f"✅ Fallback export complete: {filename}")
    
    return filename

def cleanup_old_files(keep_count=20):
    """Keep only the most recent files"""
    try:
        files = [f for f in os.listdir(OUTPUT_PATH) if f.endswith('.glb')]
        files.sort(key=lambda x: os.path.getctime(os.path.join(OUTPUT_PATH, x)))
        
        for file in files[:-keep_count]:
            try:
                os.remove(os.path.join(OUTPUT_PATH, file))
                print(f"Cleaned up: {file}")
            except:
                pass
    except Exception as e:
        print(f"Cleanup error: {e}")