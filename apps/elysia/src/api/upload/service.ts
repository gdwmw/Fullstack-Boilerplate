import { ALLOWED_TYPES, IMAGE_FORMATS } from "@repo/constants";
import { IFilesModel, TFormats } from "@repo/types";
import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import { extname, join } from "path";
import { getPlaiceholder } from "plaiceholder";
import sharp from "sharp";

import { Prisma } from "@/src/generated/prisma/client";
import { logger } from "@/src/libs/pino";
import { prisma } from "@/src/libs/prisma";
import { createPaginationMeta } from "@/src/utils/pagination";

import { TQuerySchema } from "./type";

const UPLOAD_DIR = join(process.cwd(), "uploads");

const processImage = async (buffer: Buffer, originalWidth: number): Promise<TFormats> => {
  const formatsToGenerate = IMAGE_FORMATS.filter((format) => originalWidth > format.width);

  const processedFormats = await Promise.all(
    formatsToGenerate.map(async ({ name, width: targetWidth }) => {
      const filename = `${randomUUID()}.webp`;
      const relativePath = `uploads/${filename}`;
      const filePath = join(UPLOAD_DIR, filename);
      const { data, info } = await sharp(buffer)
        .resize({ width: targetWidth, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer({ resolveWithObject: true });

      await writeFile(filePath, data);

      return [
        name,
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

  return Object.fromEntries(processedFormats) as TFormats;
};

const removeUploadedFile = async (filename: string) => {
  const filePath = join(UPLOAD_DIR, filename);

  try {
    await unlink(filePath);
  } catch (error) {
    logger.warn(
      {
        error,
        filename,
        filePath,
        scope: "upload",
      },
      "failed to delete uploaded file from disk",
    );
  }
};

export const service = {
  async delete(fileId: string) {
    const fileRecord = await prisma.files.delete({ where: { id: fileId } });

    await removeUploadedFile(fileRecord.filename);

    const generatedFormats = fileRecord.formats as null | TFormats;

    if (generatedFormats) {
      const generatedFiles = Object.values(generatedFormats);
      await Promise.all(generatedFiles.map(({ filename }) => removeUploadedFile(filename)));
    }

    return fileRecord;
  },

  async getAll({ page, pageSize }: TQuerySchema) {
    const recordsToSkip = (page - 1) * pageSize;

    const [files, totalFiles] = await prisma.$transaction([
      prisma.files.findMany({
        orderBy: { createdAt: "desc" },
        skip: recordsToSkip,
        take: pageSize,
      }),
      prisma.files.count(),
    ]);

    return {
      data: files,
      meta: createPaginationMeta({ page, pageSize, totalData: totalFiles }),
    };
  },

  async getById(fileId: string) {
    return await prisma.files.findUnique({ where: { id: fileId } });
  },

  async upload(file: File): Promise<IFilesModel> {
    await mkdir(UPLOAD_DIR, { recursive: true });

    const originalFilename = file.name;
    const extension = extname(originalFilename);
    const filename = `${randomUUID()}${extension}`;
    const relativePath = `uploads/${filename}`;
    const absolutePath = join(UPLOAD_DIR, filename);
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    await writeFile(absolutePath, fileBuffer);

    let width: null | number = null;
    let height: null | number = null;
    let dominantColor: null | string = null;
    let placeholder: null | string = null;
    let formats: null | TFormats = null;
    const isAllowedImageType = ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number]);

    if (isAllowedImageType) {
      const imageMetadata = await sharp(fileBuffer).metadata();
      width = imageMetadata.width ?? null;
      height = imageMetadata.height ?? null;

      if (width && height) {
        const [placeholderData, generatedFormats] = await Promise.all([getPlaiceholder(fileBuffer, { size: 32 }), processImage(fileBuffer, width)]);

        placeholder = placeholderData.base64;
        dominantColor = placeholderData.color.hex;
        formats = generatedFormats;
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
        url: `/${relativePath}`,
        width,
      },
    });

    return {
      ...fileRecord,
      formats: (fileRecord.formats as null | TFormats) ?? null,
    };
  },
};
