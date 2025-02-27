"use client";

import Image from "next/image";
import React, { useState, useCallback, useRef } from "react";
import { Accept, useDropzone } from "react-dropzone";

type DropzoneProps = {
  onDrop: (acceptedFiles: File[]) => void;
  accept?: Accept;
  multiple?: boolean;
  previewsRef: React.RefObject<{ url: string; file: File }[]>;
};

const CustomDropzone: React.FC<DropzoneProps> = ({
  onDrop,
  accept = { "image/*": [] },
  multiple = false,
  previewsRef
}) => {
  const [_, forceUpdate] = useState(0); // Force update without re-rendering everything

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Ensure only new files are added (prevent duplicates)
      const newFiles = acceptedFiles.filter(
        (file) => !previewsRef.current.some((prev) => prev.file.name === file.name)
      );
  
      if (newFiles.length === 0) return; // No updates if no new files
  
      const newPreviews = newFiles.map((file) => ({
        url: URL.createObjectURL(file),
        file,
      }));
  
      // Update the ref with the new images
      previewsRef.current = [...previewsRef.current, ...newPreviews];
  
      // Force re-render
      forceUpdate((prev) => prev + 1);
  
      // Pass updated file list to parent
      onDrop(previewsRef.current.map((prev) => prev.file));
    },
    [onDrop, previewsRef]
  );
  
  // Function to remove images
  const handleRemove = useCallback(
    (fileName: string) => {
      // Filter out the removed file
      previewsRef.current = previewsRef.current.filter((prev) => prev.file.name !== fileName);
  
      // Force re-render
      forceUpdate((prev) => prev + 1);
  
      // Pass updated file list to parent
      onDrop(previewsRef.current.map((prev) => prev.file));
    },
    [onDrop, previewsRef]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept,
    multiple,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-10 w-full text-center cursor-pointer transition-colors 
        ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}
      `}
    >
      <input {...getInputProps()} />
      {previewsRef.current.length > 0 ? (
        <div className="flex w-fit flex-wrap gap-4 mt-4">
          {previewsRef.current.map((preview, index) => (
            <div key={preview.file.name} className="relative w-40 h-40">
              <Image
                src={preview.url}
                alt={`preview-${index}`}
                className="w-full h-full object-cover rounded-md"
                width={100}
                height={100}
              />
              <div
                 onClick={(event) => {
                  event.stopPropagation();
                  handleRemove(preview.file.name);
                }}
                className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              >
                <div
                  
                  className=" text-white rounded-full w-6 h-6 flex items-center justify-center font-normal"
                >
                  Remove
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">
          {isDragActive ? "Drop the files here..." : "Drag & drop images here, or click to select"}
        </p>
      )}
    </div>
  );
};

export default CustomDropzone;
