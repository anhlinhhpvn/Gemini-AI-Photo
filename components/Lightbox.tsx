
import React, { useEffect } from 'react';
import { Icon } from './Icon';

interface LightboxProps {
  src: string | null;
  onClose: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ src, onClose }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!src) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4"
        onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 text-white p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-75 transition-colors"
        onClick={onClose}
        aria-label="Close lightbox"
      >
        <Icon name="close" className="w-8 h-8" />
      </button>
      <div className="relative max-w-full max-h-full" onClick={(e) => e.stopPropagation()}>
        <img src={src} alt="Generated photoshoot" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
      </div>
    </div>
  );
};
