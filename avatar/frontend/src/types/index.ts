export interface BaseMeasurements {
  height: number;
  weight: number;
  waist: number;
  hips: number;
}

export interface MaleMeasurements extends BaseMeasurements {
  shoulder: number;
  chest: number;
}

export interface FemaleMeasurements extends BaseMeasurements {
  bust: number;
}

export type AvatarMeasurements = MaleMeasurements | FemaleMeasurements;

export interface Garment {
  id: string;
  name: string;
  category: string;
  color?: string;
}

export interface GarmentItem {
  id: string;
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';
}

export interface AvatarRequest {
  gender: 'male' | 'female';
  height: number;
  weight: number;
  shoulder?: number;
  chest?: number;
  bust?: number;
  waist: number;
  hips: number;
  garments: string[]; // Backward compatibility
  garment_items: GarmentItem[]; // New format with sizes
}

export interface AvatarResponse {
  avatar_url: string;
  filename: string;
  message: string;
  success?: boolean;
}

export interface GarmentsResponse {
  garments: Garment[];
}

export interface AvatarViewerProps {
  url: string | null;
  garments?: string[];
}

export interface GarmentWithSize extends Garment {
  selectedSize: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';
}