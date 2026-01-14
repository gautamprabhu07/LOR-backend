import fs from "fs/promises";
import path from "path";
import { createReadStream } from "fs";
import { randomUUID } from "crypto";
import { NotFoundError } from "../../core/errors/NotFoundError.js";

/**
 * STORAGE SERVICE
 * 🔒 Security: Abstracts file storage; hides disk paths
 * 📦 Flexible: Can swap to S3/Azure Blob later
 */

const UPLOAD_BASE_DIR = path.join(process.cwd(), "uploads");

export interface SaveFileResult {
  storageKey: string;
  size: number;
}

export const storageService = {
  /**
   * Save draft file (student upload)
   */
  async saveDraftFile(
    buffer: Buffer,
    studentId: string,
    submissionId: string,
    originalName: string
  ): Promise<SaveFileResult> {
    const sanitizedName = sanitizeFilename(originalName);
    const ext = path.extname(sanitizedName);
    const filename = `${randomUUID()}${ext}`;
    const storageKey = `drafts/${submissionId}/${filename}`;
    const fullPath = path.join(UPLOAD_BASE_DIR, storageKey);

    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // Write file
    await fs.writeFile(fullPath, buffer);

    console.log(`✅ Draft saved: ${storageKey} (${buffer.length} bytes)`);

    return {
      storageKey,
      size: buffer.length
    };
  },

  /**
   * Save final file (faculty upload)
   */
  async saveFinalFile(
    buffer: Buffer,
    facultyId: string,
    submissionId: string,
    originalName: string
  ): Promise<SaveFileResult> {
    const sanitizedName = sanitizeFilename(originalName);
    const ext = path.extname(sanitizedName);
    const filename = `${randomUUID()}${ext}`;
    const storageKey = `finals/${submissionId}/${filename}`;
    const fullPath = path.join(UPLOAD_BASE_DIR, storageKey);

    // Ensure directory exists
    await fs.mkdir(path.dirname(fullPath), { recursive: true });

    // Write file
    await fs.writeFile(fullPath, buffer);

    console.log(`✅ Final saved: ${storageKey} (${buffer.length} bytes)`);

    return {
      storageKey,
      size: buffer.length
    };
  },

  /**
   * Get file stream for download
   * 🔒 Security: Never exposes absolute paths; fails fast if file missing
   */
  getFileStream(storageKey: string): NodeJS.ReadableStream {
    const fullPath = path.join(UPLOAD_BASE_DIR, storageKey);

    // Security: Prevent path traversal
    const resolvedPath = path.resolve(fullPath);
    const resolvedBaseDir = path.resolve(UPLOAD_BASE_DIR);

    if (!resolvedPath.startsWith(resolvedBaseDir)) {
      console.error(`🚨 Path traversal attempt: ${storageKey}`);
      throw new NotFoundError("File not found");
    }

    // Check file exists synchronously (for streaming)
    try {
      return createReadStream(fullPath);
    } catch (err) {
      console.error(`File read error for ${storageKey}:`, err);
      throw new NotFoundError("File not found");
    }
  },

  /**
   * Check if file exists
   */
  async fileExists(storageKey: string): Promise<boolean> {
    const fullPath = path.join(UPLOAD_BASE_DIR, storageKey);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Delete file (for future cleanup/soft-delete flows)
   */
  async deleteFile(storageKey: string): Promise<void> {
    const fullPath = path.join(UPLOAD_BASE_DIR, storageKey);
    try {
      await fs.unlink(fullPath);
      console.log(`🗑️ File deleted: ${storageKey}`);
    } catch (err) {
      console.error(`Failed to delete ${storageKey}:`, err);
      // Don't throw - deletion failures should be logged, not block
    }
  }
};

/**
 * HELPER: Sanitize filename
 * 🔒 Security: Remove path separators, null bytes, control chars
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[/\\]/g, "") // Remove slashes
    .replace(/\0/g, "")     // Remove null bytes
    .replace(/[<>:"|?*]/g, "") // Remove invalid chars
    .trim()
    .slice(0, 255); // Max filename length
}
