"use client";
import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

interface HoverVideoPreviewProps {
  videoId: string;
  title: string;
  className?: string;
}

export default function HoverVideoPreview({ videoId, title, className = "" }: HoverVideoPreviewProps) {
  const [imageError, setImageError] = useState(false);
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

  return (
    <div
      className={`relative overflow-hidden rounded-[var(--radius)] bg-[var(--color-cream-dark)] group/video ${className}`}
    >
      {imageError ? (
        // Fallback UI when thumbnail fails to load
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-50)] to-[var(--color-accent-50)] flex flex-col items-center justify-center text-center p-4">
          <Play className="w-12 h-12 text-[var(--color-brand)] mb-2 opacity-50" />
          <p className="text-xs text-[var(--color-text-muted)] font-medium">Video Thumbnail</p>
          <p className="text-[10px] text-[var(--color-text-muted)] mt-1 opacity-75">Thumbnail unavailable</p>
        </div>
      ) : (
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          className="object-cover transition-transform group-hover/video:scale-105"
          loading="lazy"
          unoptimized
          onError={() => setImageError(true)}
        />
      )}
      {/* Play overlay */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/video:opacity-100 transition-opacity flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-white/95 flex items-center justify-center shadow-lg transform group-hover/video:scale-110 transition-transform">
          <Play className="w-6 h-6 text-[var(--color-brand)] ml-1" fill="currentColor" />
        </div>
      </div>
    </div>
  );
}
