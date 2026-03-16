export interface RapidPipelineConfig {
    apiKey: string;
    baseUrl?: string;
    maxFileSizeMB?: number; // Add max file size option
  }
  
  export interface ScalingJob {
    jobId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    outputUrls?: Record<string, string>;
    error?: string;
  }
  
  const RAPIDPIPELINE_API_URL = process.env.RAPIDPIPELINE_API_URL || 'https://api.rapidpipeline.com/v1';
  const DEFAULT_MAX_SIZE_MB = 10; // RapidPipeline's likely limit
  
  export class RapidPipelineClient {
    private apiKey: string;
    private baseUrl: string;
    private maxFileSizeBytes: number;
  
    constructor(config: RapidPipelineConfig) {
      this.apiKey = config.apiKey;
      this.baseUrl = config.baseUrl || RAPIDPIPELINE_API_URL;
      const maxSizeMB = config.maxFileSizeMB || DEFAULT_MAX_SIZE_MB;
      this.maxFileSizeBytes = maxSizeMB * 1024 * 1024;
    }
  
    async uploadModel(fileBuffer: ArrayBuffer, filename: string): Promise<string> {
      // Check file size first
      if (fileBuffer.byteLength > this.maxFileSizeBytes) {
        const sizeMB = (fileBuffer.byteLength / (1024 * 1024)).toFixed(2);
        const maxMB = (this.maxFileSizeBytes / (1024 * 1024)).toFixed(2);
        throw new Error(`File too large: ${sizeMB}MB exceeds RapidPipeline limit of ${maxMB}MB. Please compress the model first.`);
      }
  
      const formData = new FormData();
      const blob = new Blob([fileBuffer], { type: 'model/gltf-binary' });
      formData.append('file', blob, filename);
  
      const response = await fetch(`${this.baseUrl}/models/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });
  
      if (!response.ok) {
        if (response.status === 413) {
          throw new Error('Upload failed: File too large (413). Please compress your model.');
        }
        throw new Error(`Upload failed: ${response.statusText} (${response.status})`);
      }
  
      const data = await response.json();
      return data.modelId;
    }
  
    async createScalingJob(modelId: string, sizes: string[]): Promise<string> {
      const response = await fetch(`${this.baseUrl}/jobs/scale`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          modelId,
          sizes,
          format: 'glb',
          options: {
            preserveTextures: true,
            preserveMaterials: true,
            compression: 'draco' // Request compression if available
          }
        })
      });
  
      if (!response.ok) {
        throw new Error(`Job creation failed: ${response.statusText} (${response.status})`);
      }
  
      const data = await response.json();
      return data.jobId;
    }
  
    async getJobStatus(jobId: string): Promise<ScalingJob> {
      const response = await fetch(`${this.baseUrl}/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
  
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText} (${response.status})`);
      }
  
      return await response.json();
    }
  
    async downloadScaledModel(jobId: string, size: string): Promise<ArrayBuffer> {
      const response = await fetch(`${this.baseUrl}/jobs/${jobId}/download/${size}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
  
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText} (${response.status})`);
      }
  
      return await response.arrayBuffer();
    }
  }