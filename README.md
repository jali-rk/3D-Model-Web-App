# 3D Fashion Avatar & Garment Try-On Application

This is a full-stack R&D application for generating realistic 3D avatars using SMPL-X models and dressing them with AI-generated 3D garments from Tripo AI.

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python** (3.9+)
- **Anaconda** or **Miniconda**
- **Node.js** (18+)
- **npm** or **yarn**

---

## 📁 Project Structure

```
3d_fashion_new/
├── avatar/
│   ├── backend/
│   │   ├── app/
│   │   │   ├── models/
│   │   │   │   ├── avatar_generator.py
│   │   │   │   ├── body_measurements.py
│   │   │   │   └── garment_scaler.py
│   │   │   ├── services/
│   │   │   │   └── mesh_exporter.py
│   │   │   ├── main.py
│   │   │   ├── config.py
│   │   │   └── schemas.py
│   │   ├── models/
│   │   │   ├── smplx/
│   │   │   │   ├── SMPLX_FEMALE.npz
│   │   │   │   └── SMPLX_MALE.npz
│   │   │   └── garments/
│   │   │       ├── shirt_template_M.glb
│   │   │       └── ...
│   │   ├── output/
│   │   │   └── avatars/
│   │   └── run.py
│   └── frontend/
│       ├── app/
│       ├── public/
│       └── package.json
│
└── tripo-ai-generator/
    ├── app/
    │   ├── api/
    │   │   ├── proxy-model/
    │   │   ├── task/
    │   │   └── upload/
    │   ├── components/
    │   │   ├── ModelViewer.tsx
    │   │   ├── SizeSelector.tsx
    │   │   └── ScaledModelDownloader.tsx
    │   ├── page.tsx
    │   └── types/
    ├── public/
    └── package.json
```

---

## 🎭 Avatar Application

### Backend Setup (FastAPI + Python)

**Located at:** `E:\3d_fashion_new\avatar\backend`

#### 1. Navigate to Backend

```bash
cd E:\3d_fashion_new\avatar\backend
```

#### 2. Create and Activate Conda Environment

```bash
conda create -n tf_env python=3.9 -y
conda activate tf_env
```

#### 3. Install Python Dependencies

```bash
# PyTorch with CUDA support
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# SMPL-X and 3D processing libraries
pip install smplx
pip install trimesh
pip install pygltflib
pip install numpy

# FastAPI and server dependencies
pip install fastapi
pip install uvicorn
pip install python-multipart
pip install pydantic
```

#### 4. Create Required Directories

```bash
mkdir -p "models\smplx"
mkdir -p "models\garments"
mkdir -p "output\avatars"
```

#### 5. Download SMPL-X Models

Download the base models from: [Google Drive - SMPL-X Models](https://drive.google.com/your-link-here)

Place them in `models\smplx\` with these **exact names**:

```
models\smplx\SMPLX_FEMALE.npz
models\smplx\SMPLX_MALE.npz
```

#### 6. Add Garment Files

Place your generated 3D garment GLB files in `models\garments\` following this naming convention:

```
{garment_type}_template_{size}.glb
```

**Garment types:** `shirt`, `tshirt`, `jacket`, `pants`, `jeans`, `dress`, `blouse`, `skirt`, `frock`

**Sizes:** `XS`, `S`, `M`, `L`, `XL`, `XXL`, `XXXL`

Example files:

```
models\garments\shirt_template_M.glb
models\garments\dress_template_XL.glb
```

#### 7. Start Backend Server

```bash
conda activate tf_env
python run.py
```

The backend will start at: **http://localhost:8000**

**Available API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/generate-avatar` | Generate avatar with selected garments |
| `GET` | `/garments` | List all available garment types |
| `GET` | `/health` | Health check endpoint |

#### 8. Verify Backend is Running

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{
  "status": "healthy",
  "model": "SMPL-X",
  "garment_template": true,
  "garment_path": "E:\\3d_fashion_new\\avatar\\backend\\models\\garments"
}
```

---

### Frontend Setup (React + TypeScript)

**Located at:** `E:\3d_fashion_new\avatar\frontend`

#### 1. Navigate to Frontend

```bash
cd E:\3d_fashion_new\avatar\frontend
```

#### 2. Install Node.js Dependencies

```bash
npm install

# Three.js and React Three Fiber
npm install @react-three/fiber @react-three/drei three
npm install --save-dev @types/three

# Additional utilities
npm install axios
```

#### 3. Configure API Connection

Create a `.env.local` file in the frontend root:

```env
REACT_APP_API_URL=http://localhost:8000
```

#### 4. Start Frontend Development Server

```bash
npm run dev
```

The frontend will start at: **http://localhost:5173**

---

## 🤖 Tripo AI Garment Generator

**Located at:** `E:\3d_fashion_new\tripo-ai-generator`

#### 1. Navigate to the Application

```bash
cd E:\3d_fashion_new\tripo-ai-generator
```

#### 2. Install Node.js Dependencies

```bash
npm install

# Three.js dependencies for 3D viewing
npm install @react-three/fiber @react-three/drei three
npm install --save-dev @types/three
```

#### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_TRIPO_API_URL=https://api.tripo3d.ai/v1
TRIPO_API_KEY=your_tripo_api_key_here
```

> **Get your Tripo API Key:**
> 1. Sign up at [Tripo AI](https://www.tripo3d.ai)
> 2. Navigate to **API Settings**
> 3. Copy your API key

#### 4. Start Development Server

```bash
npm run dev
```

The application will start at: **http://localhost:3000**

#### 5. Generate Garments

1. Open **http://localhost:3000**
2. Upload a garment image (JPG, PNG, WEBP)
3. Select sizes to generate (XS through XXXL)
4. Click **"Generate 3D Model with Tripo"**
5. Wait for generation (~1–2 minutes)
6. Download generated garments (base model, individual sizes, or all at once)

#### 6. Export Garments to Avatar Application

After generating garments, copy them to the avatar garments folder:

```bash
cp -r "E:\3d_fashion_new\tripo-ai-generator\downloads\*.glb" ^
      "E:\3d_fashion_new\avatar\backend\models\garments\"
```

---

## ⚙️ Configuration

### Backend Configuration

Edit `app\config.py`:

```python
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "smplx")
GARMENT_PATH = os.path.join(BASE_DIR, "models", "garments")
OUTPUT_PATH = os.path.join(BASE_DIR, "output", "avatars")

MALE_MODEL = os.path.join(MODEL_PATH, "SMPLX_MALE.npz")
FEMALE_MODEL = os.path.join(MODEL_PATH, "SMPLX_FEMALE.npz")
```

### Garment Positioning

Size-specific positioning offsets are defined in `app\models\garment_scaler.py`:

```python
self.size_offsets = {
    'upper': {
        'XS': {'y': -0.28, 'z': 0.003},
        'S':  {'y': -0.30, 'z': 0.004},
        'M':  {'y': -0.32, 'z': 0.005},
        # ... etc
    }
}
```

---

## 🔄 Complete Workflow

### Step 1 — Generate Garments (Tripo App)

Start the Tripo generator at [http://localhost:3000](http://localhost:3000), upload garment images, generate 3D models, and download GLB files.

### Step 2 — Setup Avatar Backend

Start the backend at [http://localhost:8000](http://localhost:8000) and ensure models and garments are in place.

### Step 3 — Start Avatar Frontend

Start the frontend at [http://localhost:5173](http://localhost:5173) and access the avatar application.

### Step 4 — Create Fashion Avatars

Select gender and body measurements, choose garments from the generated files, and generate the complete avatar.

---

## 📋 Quick Command Reference

Open **three separate terminals** and run:

```bash
# Terminal 1 — Tripo Generator (Port 3000)
cd E:\Onecodelabs_asssignments\3d_fashion_new\tripo-ai-generator
npm run dev

# Terminal 2 — Avatar Backend (Port 8000)
cd E:\3d_fashion_new\avatar\backend
conda activate tf_env
python run.py

# Terminal 3 — Avatar Frontend (Port 5173)
cd E:\3d_fashion_new\avatar\frontend
npm run dev
```

---

## 🎯 Usage Guide

### Generating an Avatar

1. Select **gender** (Male / Female) using the toggle buttons
2. Adjust body measurements using the sliders:
   - **Height:** 140–210 cm
   - **Weight:** 40–120 kg
   - **Shoulder / Chest / Bust:** 35–60 cm / 80–140 cm
   - **Waist:** 50–120 cm
   - **Hips:** 80–140 cm
3. Click **"Generate 3D Model with Tripo"**

### Selecting Garments

1. Wait for base model generation (~1–2 minutes)
2. Select garment types from the grid:
   - 👕 **Upper body:** Shirt, T-Shirt, Jacket, Blouse
   - 👖 **Lower body:** Pants, Jeans, Skirt
   - 👗 **Full body:** Dress, Frock
3. Click on a garment to select it
4. Choose a size from the dropdown (XS through XXXL)

### Generating Final Avatar

1. Click **"Generate Fashion Avatar"**
2. Wait for processing (~30–60 seconds)
3. View the complete avatar with garments in the 3D viewer
4. Use the mouse to interact:
   - **Rotate:** Click and drag
   - **Zoom:** Scroll wheel
   - **Pan:** Right-click and drag

---

## ✅ Verification Checklist

- [ ] Backend running at [http://localhost:8000/health](http://localhost:8000/health)
- [ ] SMPL-X models present in `backend/models/smplx/`
- [ ] Garment files present in `backend/models/garments/`
- [ ] Tripo generator running at [http://localhost:3000](http://localhost:3000)
- [ ] Avatar frontend running at [http://localhost:5173](http://localhost:5173)
- [ ] API keys configured in `.env.local`

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| `ModuleNotFoundError: No module named 'smplx'` | Run: `pip install smplx` |
| `FileNotFoundError: SMPLX_FEMALE.npz` | Verify models are in `models/smplx/` folder |
| `FileNotFoundError: shirt_template_M.glb` | Check garment files in `models/garments/` |
| Backend port conflict | Change port in `run.py` or kill the process using port 8000 |
| Garments not appearing | Check console for position offsets; verify garment loading |
| WebGL errors | Update graphics drivers; try Chrome or Firefox |
| CORS errors | Ensure backend CORS middleware allows the frontend origin |
| Address already in use | Change port in configuration or kill the conflicting process |

---

## 📚 Technologies Used

- [SMPL-X](https://smpl-x.is.tue.mpg.de/) — 3D parametric body model
- [Tripo AI](https://www.tripo3d.ai) — AI-powered 3D generation
- [FastAPI](https://fastapi.tiangolo.com/) — Python backend framework
- [Trimesh](https://trimesh.org/) — 3D mesh manipulation
- [Next.js](https://nextjs.org/docs) — React framework
- [Three.js](https://threejs.org/docs/) — 3D graphics library
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) — React renderer for Three.js

---

## 🤝 Contributing

This is an R&D project. Contributions and feedback are welcome!

---

## 📝 License

This project is for research and development purposes only.

---

*Last Updated: March 2026 — Version 1.0.0 (R&D Release)*
