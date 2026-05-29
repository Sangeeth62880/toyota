// ============================================================================
// Route: POST /api/upload — Upload a car model image (admin only)
// ============================================================================
//
// Auth: Admin only
// Body: FormData with a single "file" field (image/*)
// Response: { data: { url: string }, error: null, message: "Uploaded" }
// Errors: 400 (no file, wrong type, too large), 401, 403, 500
//
// Storage: Supabase Storage bucket "car-images"
// Max file size: 5 MB
// Accepted types: image/png, image/jpeg, image/webp, image/svg+xml
//
// ============================================================================

import { NextRequest } from "next/server";
import {
  getAuthenticatedUser,
  requireAdmin,
  respond,
} from "@/lib/api-helpers";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
];
const BUCKET_NAME = "car-images";

/**
 * POST /api/upload
 *
 * Accepts a multipart form upload, stores it in Supabase Storage,
 * and returns the public URL for the uploaded asset.
 */
export async function POST(request: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedUser();
    const authError = requireAdmin(user);
    if (authError) return authError;

    // ── Parse multipart form ────────────────────────────────────────
    const formData = await request.formData().catch(() => null);
    if (!formData) {
      return respond.badRequest("Request must be multipart/form-data");
    }

    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return respond.badRequest("A file field is required");
    }

    // ── Validate type ───────────────────────────────────────────────
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return respond.badRequest(
        `Unsupported file type "${file.type}". Accepted: PNG, JPEG, WebP, SVG`
      );
    }

    // ── Validate size ───────────────────────────────────────────────
    if (file.size > MAX_FILE_SIZE) {
      return respond.badRequest(
        `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum: 5 MB`
      );
    }

    // ── Determine file extension from MIME type ─────────────────────
    const extMap: Record<string, string> = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
      "image/svg+xml": "svg",
    };
    const ext = extMap[file.type] || "png";

    // ── Generate unique path ────────────────────────────────────────
    // Format: car-models/<timestamp>-<sanitized-name>.<ext>
    const sanitized = file.name
      .replace(/\.[^/.]+$/, "") // remove original extension
      .replace(/[^a-zA-Z0-9_-]/g, "_") // sanitize
      .substring(0, 48); // cap length
    const filename = `car-models/${Date.now()}-${sanitized}.${ext}`;

    // ── Upload to Supabase Storage ──────────────────────────────────
    const buffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase Storage upload error:", uploadError);
      return respond.serverError(
        `Upload failed: ${uploadError.message}`
      );
    }

    // ── Get public URL ──────────────────────────────────────────────
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename);

    return respond.success(
      { url: urlData.publicUrl },
      "Image uploaded successfully"
    );
  } catch (err) {
    console.error("Upload route error:", err);
    return respond.serverError();
  }
}
