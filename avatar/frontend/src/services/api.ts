import axios from 'axios';
import type { AxiosInstance } from 'axios';
import type { AvatarRequest, AvatarResponse, GarmentsResponse } from '../types';

class AvatarApi {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: 'http://127.0.0.1:8000',
      timeout: 180000, // 3 minutes for avatar generation
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async generateAvatar(data: AvatarRequest): Promise<AvatarResponse> {
    try {
      // Convert the frontend format to backend format
      const payload = {
        gender: data.gender,
        height: data.height,
        weight: data.weight,
        shoulder: data.shoulder,
        chest: data.chest,
        bust: data.bust,
        waist: data.waist,
        hips: data.hips,
        garments: [], // Legacy field - empty
        garment_items: data.garment_items || [] // New format with sizes
      };
      
      console.log('🚀 Sending to backend:', payload);
      
      const response = await this.api.post<AvatarResponse>('/generate-avatar', payload);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  async getGarments(): Promise<GarmentsResponse> {
    try {
      const response = await this.api.get<GarmentsResponse>('/garments');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || error.message);
      }
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.api.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }
}

export const avatarApi = new AvatarApi();