'use client';

import { useState } from 'react';
import Image from 'next/image';

interface MediaItem {
  id: string;
  media_type: 'image' | 'video';
  url: string;
  thumbnail_url?: string;
}

export default function ProductMediaGallery({
  media,
  mainImage
}: {
  media: MediaItem[];
  mainImage: string;
}) {
  const allMedia: MediaItem[] = media.length > 0 ? media : [{ id: 'default', media_type: 'image', url: mainImage }];
  const [activeMedia, setActiveMedia] = useState<MediaItem>(allMedia[0]);
  const [zoomStyle, setZoomStyle] = useState({ display: 'none', left: '0%', top: '0%' });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({ display: 'block', left: `${x}%`, top: `${y}%` });
  };

  return (
    <div className="flex flex-col gap-4">
      <div 
        className="relative h-96 w-full overflow-hidden rounded-lg border bg-gray-50 cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setZoomStyle({ ...zoomStyle, display: 'none' })}
      >
        {activeMedia.media_type === 'image' ? (
          <>
            <Image
              src={activeMedia.url}
              alt="Product View"
              fill
              className="object-contain"
              priority
            />
            <div 
              className="absolute pointer-events-none w-full h-full bg-no-repeat transition-opacity duration-150"
              style={{
                display: zoomStyle.display,
                backgroundImage: `url(${activeMedia.url})`,
                backgroundPosition: `${zoomStyle.left} ${zoomStyle.top}`,
                backgroundSize: '250%'
              }}
            />
          </>
        ) : (
          <video src={activeMedia.url} controls className="h-full w-full object-contain" />
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {allMedia.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveMedia(item)}
            className={`relative h-20 w-20 flex-shrink-0 rounded-md border-2 overflow-hidden ${
              activeMedia.id === item.id ? 'border-orange-500' : 'border-gray-200'
            }`}
          >
            {item.media_type === 'image' ? (
              <Image src={item.url} alt="Thumbnail" fill className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-900 text-xs text-white">
                Video
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
