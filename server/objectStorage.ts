import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Response } from "express";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export interface StorageFile {
  key: string;
  contentType?: string;
  size?: number;
  exists: boolean;
}

export interface ObjectAclPolicy {
  owner: string;
  visibility: "public" | "private";
}

const isS3Configured = (): boolean => {
  return !!(process.env.S3_BUCKET_NAME && process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY);
};

const getS3Client = (): S3Client | null => {
  if (!isS3Configured()) {
    return null;
  }

  return new S3Client({
    region: process.env.S3_REGION || "us-east-1",
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
    forcePathStyle: !!process.env.S3_ENDPOINT,
  });
};

const LOCAL_STORAGE_DIR = path.join(process.cwd(), "uploads");

const ensureLocalStorageDir = () => {
  if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
  }
};

export class ObjectStorageService {
  private s3Client: S3Client | null;
  private bucketName: string;
  private useLocalStorage: boolean;

  constructor() {
    this.s3Client = getS3Client();
    this.bucketName = process.env.S3_BUCKET_NAME || "local-storage";
    this.useLocalStorage = !this.s3Client;

    if (this.useLocalStorage) {
      ensureLocalStorageDir();
      console.log("Using local filesystem for object storage (development mode)");
      console.log("Set S3_BUCKET_NAME, S3_ACCESS_KEY, S3_SECRET_KEY for S3 storage");
    } else {
      console.log(`Using S3 storage: ${this.bucketName}`);
    }
  }

  async getObjectEntityUploadURL(): Promise<string> {
    const objectId = randomUUID();
    const key = `uploads/${objectId}`;

    if (this.useLocalStorage) {
      return `/api/upload/local/${objectId}`;
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const signedUrl = await getSignedUrl(this.s3Client!, command, { expiresIn: 900 });
    return signedUrl;
  }

  async generateUploadUrl(filename: string, contentType: string): Promise<{ uploadUrl: string; objectKey: string }> {
    const objectId = randomUUID();
    const ext = path.extname(filename);
    const key = `uploads/${objectId}${ext}`;

    if (this.useLocalStorage) {
      return {
        uploadUrl: `/api/upload/local/${objectId}${ext}`,
        objectKey: `/objects/${objectId}${ext}`,
      };
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const signedUrl = await getSignedUrl(this.s3Client!, command, { expiresIn: 900 });
    
    return {
      uploadUrl: signedUrl,
      objectKey: this.getPublicUrl(key),
    };
  }

  async getObjectEntityFile(objectPath: string): Promise<StorageFile> {
    const key = this.normalizePathToKey(objectPath);

    if (this.useLocalStorage) {
      const localPath = path.join(LOCAL_STORAGE_DIR, key);
      const exists = fs.existsSync(localPath);
      return {
        key,
        exists,
        size: exists ? fs.statSync(localPath).size : undefined,
      };
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const response = await this.s3Client!.send(command);
      return {
        key,
        exists: true,
        contentType: response.ContentType,
        size: response.ContentLength,
      };
    } catch (error: any) {
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        return { key, exists: false };
      }
      throw error;
    }
  }

  async downloadObject(file: StorageFile, res: Response, cacheTtlSec: number = 3600) {
    if (!file.exists) {
      throw new ObjectNotFoundError();
    }

    if (this.useLocalStorage) {
      const localPath = path.join(LOCAL_STORAGE_DIR, file.key);
      const stat = fs.statSync(localPath);
      const contentType = this.getContentType(file.key);

      res.set({
        "Content-Type": contentType,
        "Content-Length": stat.size,
        "Cache-Control": `public, max-age=${cacheTtlSec}`,
      });

      const stream = fs.createReadStream(localPath);
      stream.pipe(res);
      return;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: file.key,
      });
      const response = await this.s3Client!.send(command);

      res.set({
        "Content-Type": response.ContentType || "application/octet-stream",
        "Content-Length": response.ContentLength?.toString(),
        "Cache-Control": `public, max-age=${cacheTtlSec}`,
      });

      const stream = response.Body as NodeJS.ReadableStream;
      stream.pipe(res);
    } catch (error) {
      console.error("Error downloading file:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error downloading file" });
      }
    }
  }

  async saveLocalFile(objectId: string, buffer: Buffer, contentType?: string): Promise<string> {
    ensureLocalStorageDir();
    const localPath = path.join(LOCAL_STORAGE_DIR, objectId);
    fs.writeFileSync(localPath, buffer);
    return `/objects/${objectId}`;
  }

  async deleteObject(objectPath: string): Promise<void> {
    const key = this.normalizePathToKey(objectPath);

    if (this.useLocalStorage) {
      const localPath = path.join(LOCAL_STORAGE_DIR, key);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
      return;
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });
    await this.s3Client!.send(command);
  }

  normalizeObjectEntityPath(rawPath: string): string {
    if (!rawPath) return rawPath;

    if (rawPath.startsWith("https://") && rawPath.includes("s3.amazonaws.com")) {
      const url = new URL(rawPath);
      return `/objects${url.pathname}`;
    }

    if (rawPath.startsWith("https://storage.googleapis.com/")) {
      const url = new URL(rawPath);
      return `/objects${url.pathname}`;
    }

    return rawPath;
  }

  getPublicUrl(key: string): string {
    if (this.useLocalStorage) {
      return `/objects/${key}`;
    }

    if (process.env.S3_ENDPOINT) {
      return `${process.env.S3_ENDPOINT}/${this.bucketName}/${key}`;
    }

    return `https://${this.bucketName}.s3.${process.env.S3_REGION || 'us-east-1'}.amazonaws.com/${key}`;
  }

  private normalizePathToKey(objectPath: string): string {
    if (objectPath.startsWith("/objects/")) {
      return objectPath.slice(9);
    }
    if (objectPath.startsWith("/")) {
      return objectPath.slice(1);
    }
    return objectPath;
  }

  private getContentType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".flac": "audio/flac",
      ".ogg": "audio/ogg",
      ".m4a": "audio/mp4",
    };
    return mimeTypes[ext] || "application/octet-stream";
  }

  async trySetObjectEntityAclPolicy(
    rawPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    return this.normalizeObjectEntityPath(rawPath);
  }

  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: StorageFile;
    requestedPermission?: string;
  }): Promise<boolean> {
    return objectFile.exists;
  }

  getPublicObjectSearchPaths(): Array<string> {
    return ["uploads"];
  }

  getPrivateObjectDir(): string {
    return "uploads";
  }

  async searchPublicObject(filePath: string): Promise<StorageFile | null> {
    const file = await this.getObjectEntityFile(`/objects/uploads/${filePath}`);
    return file.exists ? file : null;
  }

  isConfigured(): boolean {
    return !this.useLocalStorage;
  }
}

export const objectStorageService = new ObjectStorageService();
