"use client";

import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer } from 'react-konva';
import useImage from 'use-image';
import { X, Download } from 'lucide-react';

// Hardcoded test image URLs (using WordPress media URLs from the site)
const TEST_IMAGES = [
  {
    id: 'test-1',
    name: 'Test Image 1',
    url: 'https://theartfulexperience.com/wp-content/uploads/2024/01/sample-image-1.jpg',
  },
  {
    id: 'test-2',
    name: 'Test Image 2',
    url: 'https://theartfulexperience.com/wp-content/uploads/2024/01/sample-image-2.jpg',
  },
  {
    id: 'test-3',
    name: 'Test Image 3',
    url: 'https://theartfulexperience.com/wp-content/uploads/2024/01/sample-image-3.jpg',
  },
];

// Fallback to placeholder images if WordPress URLs don't work
const FALLBACK_IMAGES = [
  {
    id: 'test-1',
    name: 'Test Image 1',
    url: 'https://via.placeholder.com/800/600?text=Test+Image+1',
  },
  {
    id: 'test-2',
    name: 'Test Image 2',
    url: 'https://via.placeholder.com/600/800?text=Test+Image+2',
  },
  {
    id: 'test-3',
    name: 'Test Image 3',
    url: 'https://via.placeholder.com/1000/1000?text=Test+Image+3',
  },
];

interface CanvasImage {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export default function ProjectEditorDemo() {
  const [images, setImages] = useState<CanvasImage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const imageRefs = useRef<Record<string, any>>({});

  // Stage dimensions (simple poster size: 18x24 inches at 300 DPI, scaled down for display)
  const STAGE_WIDTH = 1800; // 18 inches * 100px per inch (scaled)
  const STAGE_HEIGHT = 2400; // 24 inches * 100px per inch (scaled)
  const DISPLAY_SCALE = 0.3; // Scale down for display

  // Update transformer when selection changes
  useEffect(() => {
    if (!transformerRef.current) return;

    const selectedNode = selectedId ? imageRefs.current[selectedId] : null;

    if (selectedNode) {
      transformerRef.current.nodes([selectedNode]);
      transformerRef.current.getLayer()?.batchDraw();
    } else {
      transformerRef.current.nodes([]);
    }
  }, [selectedId]);

  // Handle thumbnail click - add image to canvas
  const handleThumbnailClick = (testImage: typeof TEST_IMAGES[0]) => {
    console.log('[Demo] Thumbnail clicked:', testImage.id);

    // Create a temporary image to get dimensions
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;

      // Calculate scale to fit 80% of stage
      const maxWidth = STAGE_WIDTH * 0.8;
      const maxHeight = STAGE_HEIGHT * 0.8;
      const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);

      const scaledWidth = imgWidth * scale;
      const scaledHeight = imgHeight * scale;

      // Center on stage
      const x = (STAGE_WIDTH - scaledWidth) / 2;
      const y = (STAGE_HEIGHT - scaledHeight) / 2;

      const newImage: CanvasImage = {
        id: `img-${Date.now()}-${Math.random()}`,
        url: testImage.url,
        x,
        y,
        width: scaledWidth,
        height: scaledHeight,
        rotation: 0,
      };

      console.log('[Demo] Adding image to canvas:', {
        id: newImage.id,
        position: { x, y },
        size: { width: scaledWidth, height: scaledHeight },
      });

      setImages((prev) => [...prev, newImage]);
      setSelectedId(newImage.id);
    };
    img.onerror = () => {
      console.error('[Demo] Failed to load image:', testImage.url);
      alert('Failed to load image. Please check the URL.');
    };
    img.src = testImage.url;
  };

  // Handle image drag end
  const handleDragEnd = (imageId: string, e: any) => {
    const node = e.target;
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId
          ? {
              ...img,
              x: node.x(),
              y: node.y(),
            }
          : img
      )
    );
  };

  // Handle image transform end
  const handleTransformEnd = (imageId: string, e: any) => {
    const node = e.target;
    setImages((prev) =>
      prev.map((img) =>
        img.id === imageId
          ? {
              ...img,
              x: node.x(),
              y: node.y(),
              width: node.width() * node.scaleX(),
              height: node.height() * node.scaleY(),
              rotation: node.rotation(),
            }
          : img
      )
    );

    // Reset scale after transform
    node.scaleX(1);
    node.scaleY(1);
  };

  // Export PNG
  const handleExport = () => {
    if (!stageRef.current) {
      alert('Stage not ready');
      return;
    }

    try {
      const stage = stageRef.current.getStage();
      const dataUrl = stage.toDataURL({
        pixelRatio: 2, // Higher quality
        width: STAGE_WIDTH,
        height: STAGE_HEIGHT,
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `poster-design-${Date.now()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('[Demo] Export complete');
    } catch (error) {
      console.error('[Demo] Export error:', error);
      alert('Failed to export image');
    }
  };

  // Image Component
  const ImageComponent = ({ image }: { image: CanvasImage }) => {
    const [img, status] = useImage(image.url, 'anonymous');
    const imageRef = useRef<any>(null);

    useEffect(() => {
      if (imageRef.current) {
        imageRefs.current[image.id] = imageRef.current;
      }
      return () => {
        delete imageRefs.current[image.id];
      };
    }, [image.id]);

    if (status === 'loading') {
      return (
        <KonvaImage
          ref={imageRef}
          x={image.x}
          y={image.y}
          width={image.width}
          height={image.height}
          fill="#e5e7eb"
          opacity={0.5}
        />
      );
    }

    if (status === 'failed' || !img) {
      return (
        <KonvaImage
          ref={imageRef}
          x={image.x}
          y={image.y}
          width={image.width}
          height={image.height}
          fill="#fee2e2"
          opacity={0.5}
        />
      );
    }

    return (
      <KonvaImage
        ref={imageRef}
        image={img}
        x={image.x}
        y={image.y}
        width={image.width}
        height={image.height}
        rotation={image.rotation}
        draggable
        onClick={() => {
          console.log('[Demo] Image clicked:', image.id);
          setSelectedId(image.id);
        }}
        onTap={() => {
          setSelectedId(image.id);
        }}
        onDragEnd={(e) => handleDragEnd(image.id, e)}
        onTransformEnd={(e) => handleTransformEnd(image.id, e)}
      />
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Konva Poster Editor Demo</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export PNG
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Test Images</h3>
          <p className="text-xs text-gray-500 mb-4">Click an image to add it to the canvas</p>

          <div className="space-y-3">
            {TEST_IMAGES.map((testImage) => (
              <button
                key={testImage.id}
                onClick={() => handleThumbnailClick(testImage)}
                className="w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all hover:shadow-md relative group"
              >
                <img
                  src={testImage.url}
                  alt={testImage.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    const fallback = FALLBACK_IMAGES.find((f) => f.id === testImage.id);
                    if (fallback && e.currentTarget.src !== fallback.url) {
                      e.currentTarget.src = fallback.url;
                    }
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded">
                    Add to Canvas
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-600">
              <div>Images on canvas: {images.length}</div>
              <div>Selected: {selectedId || 'none'}</div>
            </div>
          )}
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center bg-gray-100 p-8 overflow-auto">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <Stage
              ref={stageRef}
              width={STAGE_WIDTH * DISPLAY_SCALE}
              height={STAGE_HEIGHT * DISPLAY_SCALE}
              scaleX={DISPLAY_SCALE}
              scaleY={DISPLAY_SCALE}
              onClick={(e) => {
                // Deselect if clicking on empty space
                const clickedOnEmpty = e.target === e.target.getStage();
                if (clickedOnEmpty) {
                  setSelectedId(null);
                }
              }}
              onTap={(e) => {
                const tappedOnEmpty = e.target === e.target.getStage();
                if (tappedOnEmpty) {
                  setSelectedId(null);
                }
              }}
            >
              <Layer>
                {/* Background */}
                <Rect
                  x={0}
                  y={0}
                  width={STAGE_WIDTH}
                  height={STAGE_HEIGHT}
                  fill="#ffffff"
                  stroke="#e5e7eb"
                  strokeWidth={1}
                />

                {/* Images */}
                {images.map((image) => (
                  <ImageComponent key={image.id} image={image} />
                ))}

                {/* Transformer */}
                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    // Allow any resize
                    return newBox;
                  }}
                />
              </Layer>
            </Stage>
          </div>
        </div>
      </div>
    </div>
  );
}

