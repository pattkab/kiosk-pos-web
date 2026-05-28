"use client";

import { useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { toast } from "sonner";
import { getUserErrorMessage } from "@/lib/errors/user-message";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  className?: string;
  bucket?: string;
  folder?: string;
  label?: string;
  alt?: string;
  previewClassName?: string;
  imageClassName?: string;
}

export function ImageUpload({
  value,
  onChange,
  className,
  bucket = "product-images",
  folder = "product-images",
  label = "Upload image",
  alt = "Uploaded image",
  previewClassName,
  imageClassName,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const supabase = createClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop() ?? "png";
      const fileName =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? `${crypto.randomUUID()}.${fileExt}`
          : `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `${folder.replace(/^\/|\/$/g, "")}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      onChange(publicUrl);
    } catch (error: any) {
      toast.error(getUserErrorMessage(error, "Image upload failed."));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
  };

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center space-y-4",
        className,
      )}
    >
      {value ? (
        <div
          className={cn(
            "relative h-40 w-40 overflow-hidden rounded-lg border bg-muted",
            previewClassName,
          )}
        >
          <Image
            fill
            src={value}
            alt={alt}
            className={cn("object-cover", imageClassName)}
          />
          <button
            onClick={handleRemove}
            className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-destructive-foreground shadow-sm transition hover:opacity-80"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex h-40 w-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition hover:bg-muted">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isUploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{label}</p>
              </>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleUpload}
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  );
}
