"use client";

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';

interface GelatoEditorProps {
  productUid: string;
  onDesignComplete: (designData: GelatoDesignData) => void;
  onClose?: () => void;
}

interface GelatoDesignData {
  designId: string;
  previewUrl: string;
  productUid: string;
  variants: any[];
}

export default function GelatoEditor({ productUid, onDesignComplete, onClose }: GelatoEditorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  useEffect(() => {
    if (sdkLoaded && editorRef.current) {
      initializeEditor();
    }
  }, [sdkLoaded, productUid]);

  const initializeEditor = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if Gelato SDK is available
      if (typeof window !== 'undefined' && (window as any).Gelato) {
        const Gelato = (window as any).Gelato;
        
        // Initialize the Gelato Personalization Studio
        const editor = new Gelato.Editor({
          apiKey: process.env.NEXT_PUBLIC_GELATO_API_KEY || '',
          container: editorRef.current,
          productUid: productUid,
          locale: 'en-US',
          theme: {
            primaryColor: '#918c86', // brand-medium (gray)
            secondaryColor: '#000000', // brand-dark (black)
          },
          onReady: () => {
            setIsLoading(false);
          },
          onDesignSave: (design: GelatoDesignData) => {
            onDesignComplete(design);
          },
          onError: (err: Error) => {
            setError(err.message);
            setIsLoading(false);
          },
        });
      } else {
        // Fallback to custom upload interface if SDK not available
        setIsLoading(false);
      }
    } catch (err) {
      setError('Failed to initialize editor');
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Load Gelato SDK */}
      <Script
        src="https://cdn.gelato.com/sdk/personalization-studio.js"
        onLoad={() => setSdkLoaded(true)}
        onError={() => {
          setError('Failed to load Gelato editor');
          setIsLoading(false);
        }}
      />

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-medium mb-4"></div>
          <p className="text-brand-darkest">Loading Gelato Editor...</p>
        </div>
      )}

      {/* Error State - Show Custom Fallback */}
      {error && (
        <CustomUploadFallback 
          productUid={productUid} 
          onDesignComplete={onDesignComplete} 
        />
      )}

      {/* Gelato Editor Container */}
      <div 
        ref={editorRef} 
        className={`w-full min-h-[600px] ${isLoading || error ? 'hidden' : ''}`}
      />

      {/* Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// Fallback component if Gelato SDK doesn't load
function CustomUploadFallback({ 
  productUid, 
  onDesignComplete 
}: { 
  productUid: string; 
  onDesignComplete: (data: GelatoDesignData) => void;
}) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      // Upload to Gelato
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/gelato/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        // Design complete with uploaded image
        onDesignComplete({
          designId: result.fileId || `design-${Date.now()}`,
          previewUrl: result.fileUrl || uploadedImage || '',
          productUid: productUid,
          variants: [],
        });
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg">
      <h3 className="text-2xl font-bold text-brand-darkest mb-6 font-playfair text-center">
        Upload Your Image
      </h3>
      
      <div 
        className="border-4 border-dashed border-brand-light rounded-xl p-12 text-center hover:border-brand-medium transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        {uploadedImage ? (
          <div className="space-y-4">
            <img 
              src={uploadedImage} 
              alt="Preview" 
              className="max-h-64 mx-auto rounded-lg shadow-md"
            />
            <p className="text-brand-medium font-semibold">✓ Image uploaded!</p>
            <button 
              className="text-sm text-brand-dark underline"
              onClick={(e) => {
                e.stopPropagation();
                setUploadedImage(null);
              }}
            >
              Choose different image
            </button>
          </div>
        ) : uploading ? (
          <div className="py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-brand-medium mx-auto mb-4"></div>
            <p className="text-brand-darkest">Uploading...</p>
          </div>
        ) : (
          <div className="py-8">
            <div className="text-6xl mb-4">📷</div>
            <p className="text-xl font-semibold text-brand-darkest mb-2">
              Click to upload your image
            </p>
            <p className="text-brand-dark/60">
              Supports JPG, PNG, HEIC up to 50MB
            </p>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Product Preview */}
      {uploadedImage && (
        <div className="mt-8">
          <h4 className="text-lg font-semibold text-brand-darkest mb-4">Preview on Product</h4>
          <div className="grid grid-cols-3 gap-4">
            {/* Canvas Preview */}
            <div className="text-center">
              <div className="bg-gray-100 p-4 rounded-lg aspect-square flex items-center justify-center shadow-inner">
                <div className="relative w-4/5 aspect-square bg-white shadow-xl">
                  <img 
                    src={uploadedImage} 
                    alt="Canvas preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <p className="text-sm text-brand-dark mt-2">Canvas</p>
            </div>
            
            {/* Framed Preview */}
            <div className="text-center">
              <div className="bg-gray-100 p-4 rounded-lg aspect-square flex items-center justify-center shadow-inner">
                <div className="relative w-4/5 aspect-square bg-black p-2">
                  <div className="w-full h-full bg-white p-1">
                    <img 
                      src={uploadedImage} 
                      alt="Framed preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
              <p className="text-sm text-brand-dark mt-2">Framed</p>
            </div>
            
            {/* Print Preview */}
            <div className="text-center">
              <div className="bg-gray-100 p-4 rounded-lg aspect-square flex items-center justify-center shadow-inner">
                <div className="relative w-4/5 aspect-square bg-white shadow-md">
                  <img 
                    src={uploadedImage} 
                    alt="Print preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <p className="text-sm text-brand-dark mt-2">Print</p>
            </div>
          </div>
        </div>
      )}

      {uploadedImage && (
        <button
          onClick={() => {
            onDesignComplete({
              designId: `design-${Date.now()}`,
              previewUrl: uploadedImage,
              productUid: productUid,
              variants: [],
            });
          }}
          className="w-full mt-8 bg-gradient-to-r from-brand-medium to-brand-dark text-white py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all"
        >
          Continue with This Image →
        </button>
      )}
    </div>
  );
}

