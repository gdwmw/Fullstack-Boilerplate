import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import { extname, join } from "path";
import { getPlaiceholder } from "plaiceholder";
import sharp from "sharp";

import { Prisma } from "@/src/generated/prisma/client";
import { logger, prisma } from "@/src/libs";

import { ImageFormat, UploadResponse } from "./type";

const UPLOAD_DIR = join(process.cwd(), "uploads");

const IMAGE_FORMATS: { name: string; width: number }[] = [
  { name: "thumbnail", width: 245 },
  { name: "small", width: 500 },
  { name: "medium", width: 750 },
  { name: "large", width: 1000 },
];

const IMAGE_MIME_TYPES = new Set(["image/avif", "image/gif", "image/jpeg", "image/png", "image/tiff", "image/webp"]);

async function processImage(buffer: Buffer, originalWidth: number): Promise<Record<string, ImageFormat>> {
  const processedFormats = await Promise.all(
    IMAGE_FORMATS.filter((format) => originalWidth > format.width).map(async (format) => {
      const filename = `${randomUUID()}.webp`;
      const filePath = join(UPLOAD_DIR, filename);
      const relativePath = `uploads/${filename}`;
      const { data, info } = await sharp(buffer)
        .resize({ width: format.width, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer({ resolveWithObject: true });

      await writeFile(filePath, data);

      return [
        format.name,
        {
          filename,
          height: info.height,
          mimetype: "image/webp",
          path: relativePath,
          size: info.size,
          url: `/${relativePath}`,
          width: info.width,
        },
      ] as const;
    }),
  );

  return Object.fromEntries(processedFormats);
}

async function removeUploadedFile(filename: string) {
  try {
    await unlink(join(UPLOAD_DIR, filename));
  } catch (error) {
    logger.warn(
      {
        error,
        filename,
        scope: "upload",
      },
      "failed to delete uploaded file from disk",
    );
  }
}

export const service = {
  async delete(fileId: number) {
    const fileRecord = await prisma.files.delete({ where: { id: fileId } });

    await removeUploadedFile(fileRecord.filename);

    if (fileRecord.formats) {
      const formats = fileRecord.formats as unknown as Record<string, ImageFormat>;
      await Promise.all(Object.values(formats).map((file) => removeUploadedFile(file.filename)));
    }

    return fileRecord;
  },

  async getAll() {
    return await prisma.files.findMany({ orderBy: { createdAt: "desc" } });
  },

  async getById(fileId: number) {
    return await prisma.files.findUnique({ where: { id: fileId } });
  },

  async upload(file: File): Promise<UploadResponse> {
    await mkdir(UPLOAD_DIR, { recursive: true });
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

    if (IMAGE_MIME_TYPES.has(file.type)) {
      const metadata = await sharp(buffer).metadata();
      width = metadata.width ?? null;
      height = metadata.height ?? null;
      if (width && height) {
        const [{ base64, color }, processedFormats] = await Promise.all([getPlaiceholder(buffer, { size: 32 }), processImage(buffer, width)]);
        placeholder = base64;
        dominantColor = color.hex;
        formats = processedFormats;
      }
    }

    const fileRecord = await prisma.files.create({
      data: {
        dominantColor,
        filename,
        formats: formats ? (structuredClone(formats) as unknown as Prisma.InputJsonValue) : undefined,
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
  },
};
