"use client";

import { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Loader2, Upload, Link2, ImageIcon } from "lucide-react";
import { z } from "zod";
import type { CarModel } from "@/lib/types";
import { cn } from "@/lib/utils";

const carModelSchema = z.object({
  name: z.string().trim().min(1, "Model name is required"),
  variant: z.string().trim().max(100, "Variant name too long").optional(),
  image_url: z
    .string()
    .trim()
    .url("Please enter a valid image URL")
    .or(z.literal(""))
    .optional(),
  is_active: z.boolean().default(true),
});

type CarModelFormData = z.infer<typeof carModelSchema>;

interface CarModelFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: CarModel | null;
  onSave: (data: CarModelFormData) => Promise<void>;
}

export default function CarModelFormModal({
  isOpen,
  onOpenChange,
  initialData,
  onSave,
}: CarModelFormModalProps) {
  const [name, setName] = useState("");
  const [variant, setVariant] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [imageMode, setImageMode] = useState<"url" | "upload">("url");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, setIsPending] = useState(false);
  const [isValidUrl, setIsValidUrl] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || "");
      setVariant(initialData?.variant || "");
      setImageUrl(initialData?.image_url || "");
      setIsActive(initialData ? initialData.is_active : true);
      setErrors({});
      setIsPending(false);
      setIsUploading(false);
      setUploadError(null);
      setDragActive(false);
      setImageMode(initialData?.image_url ? "url" : "upload");
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    const cleanUrl = imageUrl.trim();
    if (!cleanUrl) {
      setIsValidUrl(false);
      return;
    }
    try {
      new URL(cleanUrl);
      setIsValidUrl(true);
    } catch {
      setIsValidUrl(false);
    }
  }, [imageUrl]);

  const handleFileUpload = async (file: File) => {
    const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
    if (!ACCEPTED.includes(file.type)) {
      setUploadError("Unsupported format. Use PNG, JPEG, WebP, or SVG.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError(`File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 5 MB.`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        setUploadError(json.error || "Upload failed");
        return;
      }

      setImageUrl(json.data.url);
    } catch {
      setUploadError("Network error during upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = "";
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isPending) return;

    const result = carModelSchema.safeParse({
      name,
      variant: variant || undefined,
      image_url: imageUrl || undefined,
      is_active: isActive,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err: z.ZodIssue) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsPending(true);

    try {
      await onSave({
        name: name.trim(),
        variant: variant.trim() || undefined,
        image_url: imageUrl.trim() || undefined,
        is_active: isActive,
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Mutation save error:", err);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300" />

        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-[460px] max-h-[90vh] overflow-y-auto -translate-x-[50%] -translate-y-[50%] bg-white rounded-[4px] border border-[#E5E5E5] p-6 shadow-2xl focus:outline-none select-none">
          
          <div className="flex items-center justify-between border-b border-[#F4F4F4] pb-4 mb-5">
            <Dialog.Title className="font-sans font-bold text-[18px] text-[#0A0A0A]">
              {initialData ? "Edit Car Model" : "Add Car Model"}
            </Dialog.Title>
            <Dialog.Close className="text-[#767676] hover:text-[#0A0A0A] rounded-[4px] hover:bg-[#F4F4F4] p-1 transition-colors focus:outline-none focus:ring-1 focus:ring-[#EB0A1E]">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <Dialog.Description className="sr-only">
            Add or edit Toyota car models details inside Nippon Toyota databases.
          </Dialog.Description>

          <form onSubmit={handleSubmit} className="space-y-4 font-sans" noValidate>
            
            <div>
              <label
                htmlFor="model-name"
                className="block text-[12px] font-bold text-[#0A0A0A] uppercase tracking-wider mb-1.5"
              >
                Model Name <span className="text-[#EB0A1E]">*</span>
              </label>
              <input
                id="model-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                placeholder="Model Name (e.g. Fortuner, Camry)"
                className={`w-full h-[40px] px-3 text-[13px] text-[#0A0A0A] placeholder-[#9CA3AF] bg-white border ${
                  errors.name ? "border-[#EB0A1E]" : "border-[#E0E0E0]"
                } rounded-[4px] transition-colors focus:border-[#EB0A1E] focus:ring-1 focus:ring-[#EB0A1E] outline-none disabled:opacity-50`}
                required
              />
              {errors.name && (
                <p className="text-[12px] text-[#EB0A1E] font-medium mt-1 leading-none">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="variant"
                className="block text-[12px] font-bold text-[#0A0A0A] uppercase tracking-wider mb-1.5"
              >
                Variant / Trim
              </label>
              <input
                id="variant"
                type="text"
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                disabled={isPending}
                placeholder="e.g. 2.8L 4x4 AT, Hybrid Platinum"
                className="w-full h-[40px] px-3 text-[13px] text-[#0A0A0A] placeholder-[#9CA3AF] bg-white border border-[#E0E0E0] rounded-[4px] transition-colors focus:border-[#EB0A1E] focus:ring-1 focus:ring-[#EB0A1E] outline-none disabled:opacity-50"
              />
              {errors.variant && (
                <p className="text-[12px] text-[#EB0A1E] font-medium mt-1 leading-none">
                  {errors.variant}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#0A0A0A] uppercase tracking-wider mb-2">
                Model Image
              </label>

              <div className="flex gap-0 mb-3 border border-[#E0E0E0] rounded-[4px] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setImageMode("upload")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 h-[34px] text-[12px] font-semibold uppercase tracking-wider transition-colors duration-150",
                    imageMode === "upload"
                      ? "bg-[#0A0A0A] text-white"
                      : "bg-white text-[#767676] hover:bg-[#F4F4F4]"
                  )}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode("url")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 h-[34px] text-[12px] font-semibold uppercase tracking-wider transition-colors duration-150 border-l border-[#E0E0E0]",
                    imageMode === "url"
                      ? "bg-[#0A0A0A] text-white"
                      : "bg-white text-[#767676] hover:bg-[#F4F4F4]"
                  )}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  Paste URL
                </button>
              </div>

              {imageMode === "upload" && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isPending || isUploading}
                  />

                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "relative w-full h-[120px] rounded-[4px] border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2",
                      dragActive
                        ? "border-[#EB0A1E] bg-[#EB0A1E]/5"
                        : "border-[#E0E0E0] bg-[#FAFAFA] hover:border-[#767676] hover:bg-[#F4F4F4]",
                      (isPending || isUploading) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-6 h-6 text-[#EB0A1E] animate-spin" />
                        <span className="text-[12px] text-[#767676] font-medium">
                          Uploading...
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-[#767676]" />
                        <span className="text-[12px] text-[#767676] font-medium">
                          Drop image here or click to browse
                        </span>
                        <span className="text-[10px] text-[#9CA3AF]">
                          PNG, JPEG, WebP, SVG — Max 5 MB
                        </span>
                      </>
                    )}
                  </div>

                  {uploadError && (
                    <p className="text-[12px] text-[#EB0A1E] font-medium mt-1.5 leading-tight">
                      {uploadError}
                    </p>
                  )}
                </div>
              )}

              {imageMode === "url" && (
                <div>
                  <input
                    id="image-url"
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    disabled={isPending}
                    placeholder="e.g. https://images.unsplash.com/... or hosted asset"
                    className={`w-full h-[40px] px-3 text-[13px] text-[#0A0A0A] placeholder-[#9CA3AF] bg-white border ${
                      errors.image_url ? "border-[#EB0A1E]" : "border-[#E0E0E0]"
                    } rounded-[4px] transition-colors focus:border-[#EB0A1E] focus:ring-1 focus:ring-[#EB0A1E] outline-none disabled:opacity-50`}
                  />
                  {errors.image_url && (
                    <p className="text-[12px] text-[#EB0A1E] font-medium mt-1 leading-none">
                      {errors.image_url}
                    </p>
                  )}
                </div>
              )}
            </div>

            {isValidUrl && (
              <div className="space-y-1.5">
                <span className="block text-[11px] font-bold text-[#767676] uppercase tracking-wide">
                  Preview
                </span>
                <div className="relative w-full h-[120px] rounded-[4px] overflow-hidden border border-[#E5E5E5] bg-[#F4F4F4] flex items-center justify-center">
                  <img
                    src={imageUrl}
                    alt="Toyota vehicle preview"
                    className="w-full h-full object-cover"
                    onError={() => setIsValidUrl(false)}
                  />
                </div>
              </div>
            )}

            {imageMode === "upload" && imageUrl && !isUploading && (
              <div className="flex items-center gap-2 px-3 py-2 bg-[#E6F4EA] border border-[#C5E8CF] rounded-[4px]">
                <ImageIcon className="w-4 h-4 text-[#137333] flex-shrink-0" />
                <span className="text-[12px] text-[#137333] font-medium truncate flex-1">
                  Image uploaded successfully
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl("");
                    setUploadError(null);
                  }}
                  className="text-[11px] text-[#767676] hover:text-[#EB0A1E] font-semibold uppercase tracking-wider transition-colors"
                >
                  Remove
                </button>
              </div>
            )}

            {initialData && (
              <div className="flex items-center justify-between py-2 border-y border-[#F4F4F4]">
                <div>
                  <span className="block text-[12px] font-bold text-[#0A0A0A] uppercase tracking-wider">
                    Model Status
                  </span>
                  <span className="block text-[12px] text-[#767676]">
                    Show or hide model inside sales logs form dropdown list.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsActive((prev) => !prev)}
                  disabled={isPending}
                  className={`relative inline-flex h-[24px] w-[44px] flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#EB0A1E] focus:ring-offset-2 ${
                    isActive ? "bg-[#EB0A1E]" : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F4F4F4] mt-6">
              <Dialog.Close
                type="button"
                disabled={isPending}
                className="h-[40px] px-5 text-[13px] font-semibold text-[#0A0A0A] hover:bg-[#F4F4F4] transition-colors rounded-none border border-[#E0E0E0] focus:outline-none disabled:opacity-50"
              >
                Cancel
              </Dialog.Close>

              <button
                type="submit"
                disabled={isPending || isUploading}
                className="h-[40px] px-5 bg-[#EB0A1E] hover:bg-[#C5081A] text-white text-[13px] font-semibold rounded-none transition-colors duration-200 flex items-center justify-center focus:ring-2 focus:ring-[#EB0A1E] focus:ring-offset-2 outline-none disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
