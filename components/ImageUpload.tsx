"use client";

import { CldUploadWidget } from "next-cloudinary";
import Image from "next/image";
import { useCallback } from "react";

interface ImageUploadProps {
  value: string; // The current image URL
  onChange: (value: string) => void; // Function to call when upload completes
  disabled?: boolean;
  label?: string;
  preset?: string; // The Unsigned Preset name from Cloudinary
}

export default function ImageUpload({
  value,
  onChange,
  disabled,
  label = "Upload Photo",
  preset = "evmpwa", // Replace with your actual preset name!
}: ImageUploadProps) {
  const handleUpload = useCallback(
    (result: any) => {
      // Cloudinary returns the secure URL of the uploaded image
      if (result.info && result.info.secure_url) {
        onChange(result.info.secure_url);
      }
    },
    [onChange],
  );

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
          resourceType: "image",
          clientAllowedFormats: ["jpeg", "png", "jpg", "webp"],
          // Optional: Force cropping for profile pictures
          // cropping: true,
          // croppingAspectRatio: 1,
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
              {/* If we already have an image, show the preview */}
              {value ? (
                <div className="absolute inset-0 w-full h-full overflow-hidden rounded-2xl">
                  <Image
                    fill
                    style={{ objectFit: "cover" }}
                    alt="Upload"
                    src={value}
                  />
                  {/* Overlay to hint it can be clicked to change */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white font-bold text-sm flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                      </svg>
                      Change Photo
                    </span>
                  </div>
                </div>
              ) : (
                /* Empty State / Upload Prompt */
                <div className="flex flex-col items-center justify-center text-blue-600 gap-2">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-2xl">
                    📸
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-blue-500">
                    Tap to Upload
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
