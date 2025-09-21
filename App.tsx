import React, { useState, useCallback, useEffect } from 'react';
import { ProductDetail, GeneratedImage } from './types';
import { ImageUpload } from './components/ImageUpload';
import { Icon } from './components/Icon';
import { Spinner } from './components/Spinner';
import { GalleryItem } from './components/GalleryItem';
import { Lightbox } from './components/Lightbox';
import { generatePhotoshootImage } from './services/geminiService';

const POSES = [
  "full-body shot, standing, looking at camera",
  "candid walking shot, side profile",
  "close-up portrait, serious expression",
  "sitting on a minimalist stool, three-quarter view"
];

const LOADING_MESSAGES = [
  "Analyzing model's face...",
  "Stitching product textures...",
  "Setting up the virtual studio...",
  "Adjusting the lighting...",
  "Posing the model...",
  "Finalizing the 4K render..."
];

export default function App() {
  const [modelImage, setModelImage] = useState<File | null>(null);
  const [productFrontImage, setProductFrontImage] = useState<File | null>(null);
  const [productBackImage, setProductBackImage] = useState<File | null>(null);
  const [styleImage, setStyleImage] = useState<File | null>(null);
  const [productDetails, setProductDetails] = useState<ProductDetail[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [productInputClearTrigger, setProductInputClearTrigger] = useState<number>(0);

  const isGenerateDisabled = !modelImage || !productFrontImage || isLoading;

  // Fix: Replaced NodeJS.Timeout with a browser-compatible type for setInterval and improved useEffect logic.
  useEffect(() => {
    let interval: number | undefined;
    if (isLoading) {
      setLoadingMessage(LOADING_MESSAGES[0]);
      let i = 1;
      interval = window.setInterval(() => {
        setLoadingMessage(LOADING_MESSAGES[i % LOADING_MESSAGES.length]);
        i++;
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const addProductDetail = () => {
    setProductDetails([...productDetails, { id: crypto.randomUUID(), image: null, description: '' }]);
  };

  const updateProductDetail = <K extends keyof ProductDetail>(id: string, key: K, value: ProductDetail[K]) => {
    setProductDetails(productDetails.map(detail => detail.id === id ? { ...detail, [key]: value } : detail));
  };

  const removeProductDetail = (id: string) => {
    setProductDetails(productDetails.filter(detail => detail.id !== id));
  };

  const clearProductInputs = useCallback(() => {
    setProductFrontImage(null);
    setProductBackImage(null);
    setProductDetails([]);
    setProductInputClearTrigger(prev => prev + 1);
  }, []);

  const handleGenerate = async () => {
    if (isGenerateDisabled) return;
    
    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);

    try {
      for (const pose of POSES) {
        if (!modelImage || !productFrontImage) break; // Should not happen due to button state, but good practice
        
        const newImageSrc = await generatePhotoshootImage(
          pose,
          modelImage,
          productFrontImage,
          productBackImage,
          styleImage,
          productDetails,
          additionalNotes
        );

        setGeneratedImages(prev => [...prev, { id: crypto.randomUUID(), src: newImageSrc }]);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      }
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during image generation.";
        console.error(err);
        setError(`Generation failed: ${errorMessage}`);
    } finally {
        setIsLoading(false);
        clearProductInputs();
    }
  };
  
  const handleDownload = (src: string) => {
    const link = document.createElement('a');
    link.href = src;
    link.download = `ai-photoshoot-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-brand-dark">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-primary tracking-tight">
            AI Photoshoot Generator
            </h1>
            <p className="text-gray-500 mt-1">Create professional fashion photoshoots in seconds.</p>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Inputs */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <div className="p-6 bg-white rounded-lg shadow-md space-y-6">
                <h2 className="text-xl font-semibold border-b pb-3">1. Core Assets</h2>
                <ImageUpload id="model-image" title="Model's Face" onFileChange={setModelImage} />
                <ImageUpload id="product-front" title="Product Image (Front)" onFileChange={setProductFrontImage} clearTrigger={productInputClearTrigger} />
                <ImageUpload id="product-back" title="Product Image (Back)" onFileChange={setProductBackImage} isOptional clearTrigger={productInputClearTrigger}/>
                <ImageUpload id="style-ref" title="Style Reference" onFileChange={setStyleImage} isOptional />
            </div>

            <div className="p-6 bg-white rounded-lg shadow-md space-y-4">
                <h2 className="text-xl font-semibold border-b pb-3">2. Product Details (Optional)</h2>
                {productDetails.map((detail, index) => (
                    <div key={detail.id} className="p-4 border rounded-md space-y-3 bg-gray-50">
                        <div className="flex justify-between items-center">
                            <p className="font-medium text-sm text-gray-600">Detail #{index + 1}</p>
                            <button onClick={() => removeProductDetail(detail.id)} className="text-red-500 hover:text-red-700 p-1">
                                <Icon name="trash" className="w-5 h-5" />
                            </button>
                        </div>
                        <ImageUpload id={`detail-image-${detail.id}`} title="Detail Image" onFileChange={(file) => updateProductDetail(detail.id, 'image', file)} isOptional clearTrigger={productInputClearTrigger} />
                        <input
                            type="text"
                            placeholder="e.g., sleeve cuff texture"
                            value={detail.description}
                            onChange={(e) => updateProductDetail(detail.id, 'description', e.target.value)}
                            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm"
                        />
                    </div>
                ))}
                <button onClick={addProductDetail} className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-dashed border-gray-400 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100 transition-colors">
                    <Icon name="add" className="w-5 h-5" />
                    Add Detail
                </button>
            </div>
            
            <div className="p-6 bg-white rounded-lg shadow-md space-y-4">
                <h2 className="text-xl font-semibold border-b pb-3">3. Additional Notes (Optional)</h2>
                <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    rows={4}
                    placeholder="e.g., model is holding a small handbag"
                    className="w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm"
                />
            </div>
          </div>

          {/* Right Column: Controls & Output */}
          <div className="w-full lg:w-2/3 lg:sticky top-24 self-start">
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h2 className="text-xl font-semibold border-b pb-3 mb-6">4. Generation</h2>
              <button
                onClick={handleGenerate}
                disabled={isGenerateDisabled}
                className="w-full py-3 px-4 text-lg font-semibold rounded-md text-white transition-all duration-300 ease-in-out bg-brand-primary hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-3 transform hover:scale-105 active:scale-100"
              >
                {isLoading ? <Spinner className="w-6 h-6" /> : 'Generate Photoshoot'}
              </button>
              
              <div className="mt-6 min-h-[4rem] flex flex-col items-center justify-center text-center">
                  {isLoading && (
                    <div className="text-gray-600">
                        <p className="font-semibold text-lg">{loadingMessage}</p>
                        <p className="text-sm">Please wait, this can take a few minutes...</p>
                    </div>
                  )}
                  {error && <p className="text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
                  {!isLoading && !error && generatedImages.length === 0 && <p className="text-gray-500">Your generated photoshoot will appear here.</p>}
              </div>

              {generatedImages.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Results</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {generatedImages.map((image) => (
                            <GalleryItem
                                key={image.id}
                                src={image.src}
                                onView={() => setLightboxImage(image.src)}
                                onDownload={() => handleDownload(image.src)}
                            />
                        ))}
                    </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Lightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />
    </div>
  );
}