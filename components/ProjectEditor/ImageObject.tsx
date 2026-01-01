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
  const [image] = useImage(asset.src);
  const imageRef = useRef<KonvaImageType>(null);

  useEffect(() => {
    if (imageRef.current && image) {
      imageRef.current.image(image);
      imageRef.current.getLayer()?.batchDraw();
      onImageLoad(imageRef.current);
    }
  }, [image, onImageLoad]);

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
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={onDragEnd}
      onTransformEnd={onTransformEnd}
    />
  );
}

