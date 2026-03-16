import os

# This points to the backend folder
BACKEND_DIR = os.path.dirname(os.path.dirname(__file__))  
BASE_DIR = os.path.dirname(BACKEND_DIR)  

MODEL_PATH = os.path.join(BACKEND_DIR, "models", "smplx") 
GARMENT_PATH = os.path.join(BACKEND_DIR, "models", "garments")  
OUTPUT_PATH = os.path.join(BACKEND_DIR, "output", "avatars")  

# Add debug prints to verify paths
print(f"BACKEND_DIR: {BACKEND_DIR}")
print(f"MODEL_PATH: {MODEL_PATH}")
print(f"GARMENT_PATH: {GARMENT_PATH}")
print(f"OUTPUT_PATH: {OUTPUT_PATH}")

os.makedirs(OUTPUT_PATH, exist_ok=True)
os.makedirs(GARMENT_PATH, exist_ok=True)
os.makedirs(MODEL_PATH, exist_ok=True)

MALE_MODEL = os.path.join(MODEL_PATH, "SMPLX_MALE.npz")
FEMALE_MODEL = os.path.join(MODEL_PATH, "SMPLX_FEMALE.npz")
NEUTRAL_MODEL = os.path.join(MODEL_PATH, "SMPLX_NEUTRAL.npz")