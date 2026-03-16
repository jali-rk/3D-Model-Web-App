// types/tripo.types.ts
export interface UploadResponse {
  code: number;
  message?: string;
  data: {
    image_token: string;
  };
}

export interface TaskRequest {
  type: 'image_to_model';
  file: {
    file_token: string;
  };
  pbr?: boolean;
  // Add size parameter
  size?: 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'XXXL';
}

export interface TaskResponse {
  code: number;
  message?: string;
  data: {
    task_id: string;
  };
}

export interface TaskStatusResponse {
  code: number;
  message?: string;
  data: {
    task_id: string;
    status: 'pending' | 'running' | 'success' | 'failed';
    output?: {
      model: string;
      pbr_model?: string;
    };
  };
}

export interface BatchTaskResponse {
  code: number;
  message?: string;
  data: {
    task_ids: Record<string, string>; // Maps size to task_id
  };
}

export interface BatchTaskStatusResponse {
  code: number;
  message?: string;
  data: {
    tasks: Record<string, {
      task_id: string;
      status: 'pending' | 'running' | 'success' | 'failed';
      output?: {
        model: string;
        pbr_model?: string;
      };
    }>;
  };
}

export interface ErrorResponse {
  error: string;
}