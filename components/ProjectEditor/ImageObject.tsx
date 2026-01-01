"use client";

import { useEffect, useRef } from 'react';
import { Image as KonvaImage } from 'react-konva';
import { Image as KonvaImageType } from 'konva';
import useImage from 'use-image';
import { type UploadedAsset, type KonvaObject } from '@/lib/projectEditorStore';

interface ImageObjectProps {
  obj: KonvaObject;
  asset: UploadedAsset;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (e: any) => void;
  onTransformEnd: (e: any) => void;
  onImageLoad: (image: KonvaImageType) => void;
  imageRefs: React.MutableRefObject<Record<string, KonvaImageType>>;
}

export default function ImageObject({
  obj,
  asset,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
  onImageLoad,
  imageRefs,
}: ImageObjectProps) {
  const [image, imageStatus] = useImage(asset.src, 'anonymous');
  const imageRef = useRef<KonvaImageType>(null);

  useEffect(() => {
    if (imageRef.current && image) {
      imageRef.current.image(image);
      imageRef.current.getLayer()?.batchDraw();
      onImageLoad(imageRef.current);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[ImageObject] Image loaded:', {
          objId: obj.id,
          assetId: asset.id,
          dimensions: { width: image.width, height: image.height },
          position: { x: obj.x, y: obj.y },
          size: { width: obj.width, height: obj.height },
        });
      }
    }
  }, [image, onImageLoad, obj.id, asset.id, obj.x, obj.y, obj.width, obj.height]);

  // Log errors
  useEffect(() => {
    if (imageStatus === 'failed') {
      console.error('[ImageObject] Failed to load image:', {
        objId: obj.id,
        assetId: asset.id,
        src: asset.src.substring(0, 50) + '...',
      });
    }
  }, [imageStatus, obj.id, asset.id, asset.src]);

  if (imageStatus === 'loading') {
    // Show placeholder while loading
    return (
      <KonvaImage
        ref={(node) => {
          if (node) {
            imageRef.current = node;
            imageRefs.current[obj.id] = node;
          }
        }}
        x={obj.x}
        y={obj.y}
        width={obj.width}
        height={obj.height}
        fill="#e5e7eb"
        opacity={0.5}
      />
    );
  }

  if (imageStatus === 'failed' || !image) {
    // Show error placeholder
    return (
      <KonvaImage
        ref={(node) => {
          if (node) {
            imageRef.current = node;
            imageRefs.current[obj.id] = node;
          }
        }}
        x={obj.x}
        y={obj.y}
        width={obj.width}
        height={obj.height}
        fill="#fee2e2"
        opacity={0.5}
      />
    );
  }

  return (
    <KonvaImage
      ref={(node) => {
        if (node) {
          imageRef.current = node;
          imageRefs.current[obj.id] = node;
        }
      }}
      image={image}
      x={obj.x}
      y={obj.y}
      width={obj.width}
      height={obj.height}
      rotation={obj.rotation}
      scaleX={obj.scaleX}
      scaleY={obj.scaleY}
      draggable
      onClick={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onTap={(e) => {
        e.cancelBubble = true;
        onSelect();
      }}
      onDragStart={(e) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[ImageObject] Drag start:', obj.id);
        }
      }}
      onDragEnd={(e) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[ImageObject] Drag end:', obj.id, { x: e.target.x(), y: e.target.y() });
        }
        onDragEnd(e);
      }}
      onTransformEnd={onTransformEnd}
    />
  );
}

