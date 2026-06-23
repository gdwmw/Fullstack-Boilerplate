import { TFormatKey } from "../../types/src";

export const IMAGE_FORMATS: { name: TFormatKey; width: number }[] = [
  { name: "thumbnail", width: 245 },
  { name: "small", width: 500 },
  { name: "medium", width: 750 },
  { name: "large", width: 1000 },
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const ALLOWED_TYPES = ["image/avif", "image/gif", "image/jpeg", "image/png", "image/tiff", "image/webp"] as const;
