
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from './Icon';

interface ImageUploadProps {
  id: string;
  title: string;
  onFileChange: (file: File | null) => void;
  isOptional?: boolean;
  clearTrigger?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ id, title, onFileChange, isOptional = false, clearTrigger }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onFileChange(file);
    }
  };

  const clearFile = useCallback(() => {
    setPreview(null);
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileChange]);

  useEffect(() => {
    if (clearTrigger !== undefined && clearTrigger > 0) {
      clearFile();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearTrigger]);

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {title} {!isOptional && <span className="text-red-500">*</span>}
      </label>
      <div className="mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md h-48 bg-white relative group">
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="max-h-full max-w-full object-contain" />
            <button
              onClick={clearFile}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              aria-label="Remove image"
            >
              <Icon name="trash" className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="space-y-1 text-center">
            <Icon name="upload" className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label htmlFor={id} className="relative cursor-pointer bg-white rounded-md font-medium text-brand-secondary hover:text-brand-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                <span>Upload a file</span>
                <input ref={fileInputRef} id={id} name={id} type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
              </label>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          </div>
        )}
      </div>
    </div>
  );
};
