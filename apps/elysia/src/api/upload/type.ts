export interface ImageFormat {
  filename: string;
  height: number;
  mimetype: string;
  path: string;
  size: number;
  url: string;
  width: number;
}

export interface UploadedFile {
  createdAt: Date;
  dominantColor: null | string;
  filename: string;
  formats: null | Record<string, ImageFormat>;
  height: null | number;
  id: number;
  mimetype: string;
  originalFilename: string;
  path: string;
  placeholder: null | string;
  size: number;
  updatedAt: Date;
  width: null | number;
}

export interface UploadResponse {
  createdAt: Date;
  dominantColor: null | string;
  filename: string;
  formats: null | Record<string, ImageFormat>;
  height: null | number;
  id: number;
  mimetype: string;
  originalFilename: string;
  path: string;
  placeholder: null | string;
  size: number;
  url: string;
  width: null | number;
}
