from typing import Optional, List
from pydantic import BaseModel

class GarmentItem(BaseModel):
    id: str
    size: str = 'M'  # XS, S, M, L, XL, XXL, XXXL

class AvatarRequest(BaseModel):
    gender: str
    height: float
    weight: float
    shoulder: Optional[float] = None
    chest: Optional[float] = None
    bust: Optional[float] = None
    waist: float
    hips: float
    garments: List[str] = []  # Backward compatibility
    garment_items: List[GarmentItem] = []  # New format with sizes