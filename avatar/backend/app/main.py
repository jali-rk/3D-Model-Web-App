from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import os
import traceback

from .schemas import AvatarRequest
from .models.avatar_generator import generate_avatar
from .services.mesh_exporter import export_complete_avatar
from .config import OUTPUT_PATH, GARMENT_PATH

app = FastAPI(title="Fashion Avatar Generator")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files
app.mount("/avatars", StaticFiles(directory=OUTPUT_PATH), name="avatars")

@app.post("/generate-avatar")
async def create_avatar(data: AvatarRequest):
    """Generate fashion avatar with garments"""
    
    print(f"\n{'='*50}")
    print(f"Generating avatar for {data.gender}")
    print(f"Measurements: {data.dict()}")
    print(f"Garments (legacy): {data.garments}")
    print(f"Garment items with sizes: {data.garment_items}")
    print(f"{'='*50}\n")
    
    try:
        # Generate base avatar
        vertices, faces, joints = generate_avatar(data.dict())
        
        # Use garment_items if provided, otherwise fall back to garments (with default size M)
        garments_to_use = data.garment_items if data.garment_items else [
            {"id": g, "size": "M"} for g in data.garments
        ]
        
        # Export with garments
        filename = export_complete_avatar(
            vertices, 
            faces, 
            joints,
            garments_to_use
        )
        
        if filename:
            avatar_url = f"http://127.0.0.1:8000/avatars/{filename}"
            return {
                "avatar_url": avatar_url,
                "filename": filename,
                "message": "Avatar generated successfully",
                "success": True
            }
        else:
            return {
                "error": "Failed to export avatar",
                "success": False
            }
            
    except Exception as e:
        print(f"❌ Error generating avatar: {e}")
        traceback.print_exc()
        return {
            "error": str(e),
            "success": False
        }

@app.get("/garments")
async def list_garments():
    """List available garment types"""
    garments = [
        {"id": "shirt", "name": "Casual Shirt", "category": "upper", "color": "#ff6b6b"},
        {"id": "jacket", "name": "Denim Jacket", "category": "upper", "color": "#4a90e2"},
        {"id": "pants", "name": "Jeans", "category": "lower", "color": "#2c3e50"},
        {"id": "dress", "name": "Summer Dress", "category": "full", "color": "#ff9ff3"},
        {"id": "tshirt", "name": "T-Shirt", "category": "upper", "color": "#feca57"},
    ]
    return {"garments": garments}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    garment_exists = os.path.exists(os.path.join(GARMENT_PATH, "shirt_template.glb"))
    return {
        "status": "healthy", 
        "model": "SMPL-X",
        "garment_template": garment_exists,
        "garment_path": GARMENT_PATH
    }