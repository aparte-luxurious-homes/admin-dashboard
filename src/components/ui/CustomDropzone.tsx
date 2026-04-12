"use client";

import Image from "next/image";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { Accept, useDropzone } from "react-dropzone";
import { Icon } from "@iconify/react";
import toast from "react-hot-toast";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

type DropzoneProps = {
  onDrop: (acceptedFiles: File[]) => void;
  accept?: Accept;
  multiple?: boolean;
  previewsRef: React.RefObject<{ url: string; file: File }[]>;
  minFiles?: number;
  maxImageSize?: number;
  maxVideoSize?: number;
};

const CustomDropzone: React.FC<DropzoneProps> = ({
  onDrop,
  accept = { "image/*": [], "video/*": [] },
  multiple = false,
  previewsRef,
  minFiles = 3,
  maxImageSize = MAX_IMAGE_SIZE,
  maxVideoSize = MAX_VIDEO_SIZE,
}) => {
  const [_, forceUpdate] = useState(0);
  const [showMinWarning, setShowMinWarning] = useState(false);

  // Check minimum files requirement
  useEffect(() => {
    const currentLength = previewsRef.current?.length || 0;
    if (currentLength < minFiles && currentLength > 0) {
      setShowMinWarning(true);
    } else {
      setShowMinWarning(false);
    }
  }, [previewsRef, minFiles]);

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Validate file sizes
      const oversized: string[] = [];
      const validFiles = acceptedFiles.filter((file) => {
        const isVideo = file.type.startsWith("video/");
        const limit = isVideo ? maxVideoSize : maxImageSize;
        if (file.size > limit) {
          oversized.push(`${file.name} (${formatFileSize(file.size)} — max ${formatFileSize(limit)})`);
          return false;
        }
        return true;
      });

      if (oversized.length > 0) {
        toast.error(
          `${oversized.length} file${oversized.length > 1 ? "s" : ""} too large:\n${oversized.join(", ")}`,
          { duration: 6000, style: { maxWidth: "500px" } }
        );
      }

      // Ensure only new files are added (prevent duplicates)
      const newFiles = validFiles.filter(
        (file) => !previewsRef.current?.some((prev) => prev.file.name === file.name)
      );

      if (newFiles.length === 0) {
        if (oversized.length === 0) toast.error("These files have already been added");
        return;
      }
  
      const newPreviews = newFiles.map((file) => ({
        url: URL.createObjectURL(file),
        file,
      }));
  
      // Update the ref with the new images (APPEND, not replace)
      previewsRef.current = [...(previewsRef.current || []), ...newPreviews];
  
      // Force re-render
      forceUpdate((prev) => prev + 1);
  
      // Pass updated file list to parent
      onDrop(previewsRef.current?.map((prev) => prev.file) || []);
      
      toast.success(`${newFiles.length} file${newFiles.length > 1 ? 's' : ''} added successfully`);
    },
    [onDrop, previewsRef]
  );
  
  // Function to remove images
  const handleRemove = useCallback(
    (fileName: string) => {
      // Filter out the removed file
      previewsRef.current = previewsRef.current?.filter((prev) => prev.file.name !== fileName) || [];
  
      // Force re-render
      forceUpdate((prev) => prev + 1);
  
      // Pass updated file list to parent
      onDrop(previewsRef.current?.map((prev) => prev.file) || []);
    },
    [onDrop, previewsRef]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleDrop,
    accept,
    multiple: true, // Always allow multiple for adding more
    noClick: true, // Disable click on the main area to open file dialog
  });

  return (
    <div className="space-y-4">
      {/* Dropzone Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 w-full text-center cursor-pointer transition-colors relative
          ${isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary/50"}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <Icon icon="solar:gallery-add-bold-duotone" className="text-4xl text-gray-400" />
          <p className="text-gray-600 font-medium">
            {isDragActive ? "Drop the files here..." : (
              <>
                <span className="hidden sm:inline">Drag & drop images or videos here</span>
                <span className="sm:hidden">Tap below to add photos or videos</span>
              </>
            )}
          </p>
          <p className="text-sm text-gray-400">or</p>
          <button
            type="button"
            onClick={open}
            className="w-full sm:w-auto px-6 py-2.5 sm:py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors"
          >
            Browse Files
          </button>
          <p className="text-xs text-gray-400 mt-2">
            Supported: JPG, PNG, GIF, WEBP, MP4, MOV, WEBM (Images max 10MB, Videos max 50MB)
          </p>
        </div>
      </div>

      {/* Minimum Files Warning */}
      {showMinWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2">
          <Icon icon="solar:danger-triangle-bold-duotone" className="text-amber-500 text-xl" />
          <p className="text-sm text-amber-700">
            Please add at least {minFiles - (previewsRef.current?.length || 0)} more image{minFiles - (previewsRef.current?.length || 0) > 1 ? 's' : ''} (minimum {minFiles} required)
          </p>
        </div>
      )}

      {/* Image Preview Grid */}
      {previewsRef.current && previewsRef.current.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-zinc-700">
              Uploaded Files ({previewsRef.current.length}/{minFiles} minimum)
            </h4>
            <button
              type="button"
              onClick={open}
              className="text-xs font-medium text-primary hover:text-primary/70 flex items-center gap-1"
            >
              <Icon icon="solar:add-circle-bold-duotone" className="text-base" />
              ADD MORE
            </button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previewsRef.current.map((preview, index) => (
              <div key={preview.file.name} className="relative group aspect-square">
                {preview.file.type.startsWith("video/") ? (
                  <video
                    src={preview.url}
                    muted
                    preload="metadata"
                    className="w-full h-full object-cover rounded-xl border border-gray-200"
                  />
                ) : (
                  <Image
                    src={preview.url}
                    alt={`preview-${index}`}
                    className="w-full h-full object-cover rounded-xl border border-gray-200"
                    width={200}
                    height={200}
                  />
                )}
                
                {/* Number Badge */}
                <div className="absolute top-2 left-2 w-6 h-6 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {index + 1}
                </div>
                {/* Video Badge */}
                {preview.file.type.startsWith("video/") && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded-md flex items-center gap-1">
                    <Icon icon="solar:play-bold" className="text-white text-[10px]" />
                    <span className="text-white text-[9px] font-bold">VIDEO</span>
                  </div>
                )}
                
                {/* Remove Overlay */}
                <div
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemove(preview.file.name);
                  }}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center cursor-pointer"
                >
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
                    <Icon icon="solar:trash-bin-trash-bold-duotone" className="text-white text-xl" />
                  </div>
                </div>
              </div>
            ))}

            {/* Add More Card */}
            {previewsRef.current.length > 0 && (
              <button
                type="button"
                onClick={open}
                className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors group"
              >
                <Icon icon="solar:add-circle-bold-duotone" className="text-3xl text-gray-400 group-hover:text-primary" />
                <span className="text-xs font-medium text-gray-500 group-hover:text-primary">Add More</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropzone;