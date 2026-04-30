import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import { extname, join } from "path";
import { getPlaiceholder } from "plaiceholder";
import sharp from "sharp";

import { prisma } from "@/src/libs";

import { ImageFormat, UploadResponse } from "./type";

// ---------------------------------------------------------------------------
// [1] Constants & Helpers
// Core constants, formats, and helpers for upload
// ---------------------------------------------------------------------------

const UPLOAD_DIR = join(process.cwd(), "uploads");

const IMAGE_FORMATS: { name: string; width: number }[] = [
  { name: "thumbnail", width: 245 },
  { name: "small", width: 500 },
  { name: "medium", width: 750 },
  { name: "large", width: 1000 },
];

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/tiff"];

// [1.1] Helper to resize and save multiple formats
async function processImage(buffer: Buffer, mimeType: string, originalWidth: number): Promise<Record<string, ImageFormat>> {
  const formats: Record<string, ImageFormat> = {};
  for (const format of IMAGE_FORMATS) {
    if (originalWidth <= format.width) continue;
    const filename = `${randomUUID()}.webp`;
    const filePath = join(UPLOAD_DIR, filename);
    const relativePath = `uploads/${filename}`;
    const { data, info } = await sharp(buffer)
      .resize({ width: format.width, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer({ resolveWithObject: true });
    await writeFile(filePath, data);
    formats[format.name] = {
      filename,
      height: info.height,
      mimetype: "image/webp",
      path: relativePath,
      size: info.size,
      url: `/${relativePath}`,
      width: info.width,
    };
  }
  return formats;
}

// ---------------------------------------------------------------------------
// [2] Upload primary service
// All core upload CRUD logic
// ---------------------------------------------------------------------------

export const service = {
  // [2.1] Delete a file
  async delete(fileId: number) {
    const fileRecord = await prisma.files.findUnique({ where: { id: fileId } });
    if (!fileRecord) {
      throw new Error("File not found");
    }
    await prisma.files.delete({ where: { id: fileId } });
    // [2.1.1] Delete the primary file
    const deleteFile = async (filename: string) => {
      try {
        await unlink(join(UPLOAD_DIR, filename));
      } catch {
        // The file may already be missing from disk
      }
    };
    await deleteFile(fileRecord.filename);
    // [2.1.2] Delete all derived formats if present
    if (fileRecord.formats) {
      const formats = fileRecord.formats as unknown as Record<string, ImageFormat>;
      await Promise.all(Object.values(formats).map((f) => deleteFile(f.filename)));
    }
    return fileRecord;
  },

  // [2.2] Get all files
  async getAll() {
    return await prisma.files.findMany({ orderBy: { createdAt: "desc" } });
  },

  // [2.3] Get a file by id
  async getById(fileId: number) {
    return await prisma.files.findUnique({ where: { id: fileId } });
  },

  // [2.4] Upload a new file
  async upload(file: File): Promise<UploadResponse> {
    // eslint-disable-next-line no-useless-catch
    try {
      await mkdir(UPLOAD_DIR, { recursive: true });
      // [2.4.1] Save the original file
      const originalFilename = file.name;
      const extension = extname(originalFilename);
      const filename = `${randomUUID()}${extension}`;
      const filePath = join(UPLOAD_DIR, filename);
      const relativePath = `uploads/${filename}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);

      let width: null | number = null;
      let height: null | number = null;
      let dominantColor: null | string = null;
      let placeholder: null | string = null;
      let formats: null | Record<string, ImageFormat> = null;

      // [2.4.2] Process metadata and derived formats if the file is an image
      if (IMAGE_MIME_TYPES.includes(file.type)) {
        const metadata = await sharp(buffer).metadata();
        width = metadata.width ?? null;
        height = metadata.height ?? null;
        if (width && height) {
          const [{ base64, color }, processedFormats] = await Promise.all([
            getPlaiceholder(buffer, { size: 32 }),
            processImage(buffer, file.type, width),
          ]);
          placeholder = base64;
          dominantColor = color.hex;
          formats = processedFormats;
        }
      }

      // [2.4.3] Persist file metadata to the database
      const fileRecord = await prisma.files.create({
        data: {
          dominantColor,
          filename,
          formats: formats ? JSON.parse(JSON.stringify(formats)) : undefined,
          height,
          mimetype: file.type || "application/octet-stream",
          originalFilename,
          path: relativePath,
          placeholder,
          size: file.size,
          width,
        },
      });

      return {
        id: fileRecord.id,
        createdAt: fileRecord.createdAt,
        dominantColor: fileRecord.dominantColor,
        filename: fileRecord.filename,
        formats: (fileRecord.formats as null | Record<string, ImageFormat>) ?? null,
        height: fileRecord.height,
        mimetype: fileRecord.mimetype,
        originalFilename: fileRecord.originalFilename,
        path: fileRecord.path,
        placeholder: fileRecord.placeholder,
        size: fileRecord.size,
        url: `/${fileRecord.path}`,
        width: fileRecord.width,
      };
    } catch (error) {
      throw error;
    }
  },
};
