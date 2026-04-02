"use client";

import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import { useCallback } from "react";

interface MediaUploadProps {
  value: string;
  onChange: (url: string, resourceType: string) => void;
  disabled?: boolean;
  label?: string;
  preset?: string;
}

export default function MediaUpload({
  value,
  onChange,
  disabled,
  label = "Upload Photo or Video",
  preset = "evmpwa",
}: MediaUploadProps) {
  const handleUpload = useCallback(
    (result: any) => {
      if (result.info && result.info.secure_url) {
        const rType = result.info.resource_type || "image"; // 'image' or 'video'
        onChange(result.info.secure_url, rType);
      }
    },
    [onChange]
  );

  const isVideo = value && (value.includes("/video/") || value.endsWith(".mp4") || value.endsWith(".webm") || value.endsWith(".mov"));

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="text-sm font-extrabold text-gray-800">{label}</label>
      )}

      <CldUploadWidget
        onSuccess={handleUpload}
        uploadPreset={preset}
        options={{
          maxFiles: 1,
          resourceType: "auto", // Accept both images and videos
          clientAllowedFormats: [
            "jpeg", "png", "jpg", "webp", "gif",
            "mp4", "webm", "mov", "avi",
          ],
          maxFileSize: 50000000, // 50MB for videos
        }}
      >
        {({ open }) => {
          const onClick = (e: React.MouseEvent) => {
            e.preventDefault();
            open();
          };

          return (
            <div
              onClick={disabled ? undefined : onClick}
              className={`relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl transition-all ${
                disabled
                  ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50"
                  : "cursor-pointer border-blue-300 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-500 active:scale-[0.98]"
              }`}
            >
              {value ? (
                <div className="absolute inset-0 w-full h-full overflow-hidden rounded-2xl">
                  {isVideo ? (
                    <video
                      src={value}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <Image
                      fill
                      style={{ objectFit: "cover" }}
                      alt="Upload preview"
                      src={value}
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white font-bold text-sm flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                      </svg>
                      Change Media
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-blue-600 gap-2">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-2xl">
                    📎
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-blue-500">
                    Tap to Upload
                  </span>
                  <span className="text-[10px] text-gray-400 font-semibold">
                    Photos & Videos
                  </span>
                </div>
              )}
            </div>
          );
        }}
      </CldUploadWidget>
    </div>
  );
}
