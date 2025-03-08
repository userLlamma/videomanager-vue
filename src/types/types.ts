export interface TagInfo {
    id: number;
    name: string;
    category?: string;
    confidence: number;
    usage_count?: number;
  }
  
  export interface Material {
    id: number;
    source_video: string;
    frame_path: string;
    timestamp: number;
    description?: string;
    added_date: string;
    tags: TagInfo[];
    projects?: number[];
  }
  
  export interface Project {
    id: number;
    name: string;
    description?: string;
    created_date: string;
    material_count: number;
  }
  
  export interface ProcessingResult {
    success: boolean;
    message?: string;
    video_path?: string;
    frames_count?: number;
    error?: string;
  }