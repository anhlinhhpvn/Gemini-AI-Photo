
import React from 'react';
import { Icon } from './Icon';

interface GalleryItemProps {
  src: string;
  onView: () => void;
  onDownload: () => void;
}

export const GalleryItem: React.FC<GalleryItemProps> = ({ src, onView, onDownload }) => {
  return (
    <div className="relative aspect-square group overflow-hidden rounded-lg shadow-md bg-gray-200">
      <img src={src} alt="Generated result" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center gap-4">
        <button
          onClick={onView}
          className="p-3 bg-white/80 text-brand-dark rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-200 delay-100 hover:bg-white"
          aria-label="View larger image"
        >
          <Icon name="view" className="w-6 h-6" />
        </button>
        <button
          onClick={onDownload}
          className="p-3 bg-white/80 text-brand-dark rounded-full transform scale-0 group-hover:scale-100 transition-transform duration-200 delay-200 hover:bg-white"
          aria-label="Download image"
        >
          <Icon name="download" className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
