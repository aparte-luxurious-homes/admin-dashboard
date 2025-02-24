'use client';

import React, { useCallback } from 'react';
import { Accept, useDropzone } from 'react-dropzone';

type DropzoneProps = {
  onDrop: (acceptedFiles: File[]) => void;
  accept?: Accept;
  multiple?: boolean;
};

export const CustomDropzone: React.FC<DropzoneProps> = ({
  onDrop,
  accept = {
    'image/*': []
  },
  multiple = false,
}) => {
  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      onDrop(acceptedFiles);
    },
    [onDrop]
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    acceptedFiles,
  } = useDropzone({
    onDrop: handleDrop,
    accept,
    multiple,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-4 flex justify-center items-center text-center cursor-pointer transition-colors h-20
        ${isDragActive ? 'border-teal-800 bg-blue-50' : 'border-gray-300'}
        ${isDragReject ? 'border-red-500 bg-red-50' : ''}`}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p className='text-blue-600'>Drop the files here ...</p>
      ) : (
        <p className='text-gray-600'>
          Drag 'n' drop some files here, or click to select files
        </p>
      )}

      {acceptedFiles.length > 0 && (
        <aside className='mt-4'>
          <h4 className='text-sm font-medium'>Files:</h4>
          <ul className='mt-1 text-sm text-gray-700'>
            {acceptedFiles.map((file) => (
              <li key={file.name}>
                {file.name} - {(file.size / 1024).toFixed(2)} KB
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
};

export default CustomDropzone;
