import { useState, useRef } from 'react';
import { X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const imageRef = useRef<HTMLDivElement>(null);

  const currentImage = images[selectedIndex] || '';
  const hasMultipleImages = images.length > 1;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!images.length) {
    return (
      <div className="aspect-square overflow-hidden rounded-xl bg-muted flex items-center justify-center">
        <span className="text-8xl text-muted-foreground">🔧</span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Main Image with Zoom */}
        <div
          ref={imageRef}
          className="relative aspect-square overflow-hidden rounded-xl bg-muted cursor-zoom-in group"
          onMouseEnter={() => setIsZoomed(true)}
          onMouseLeave={() => setIsZoomed(false)}
          onMouseMove={handleMouseMove}
          onClick={() => setIsLightboxOpen(true)}
        >
          <img
            src={currentImage}
            alt={productName}
            className={cn(
              "h-full w-full object-cover transition-transform duration-300",
              isZoomed && "scale-150"
            )}
            style={
              isZoomed
                ? {
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  }
                : undefined
            }
          />
          
          {/* Zoom indicator */}
          <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="h-5 w-5 text-foreground" />
          </div>

          {/* Navigation arrows */}
          {hasMultipleImages && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-sm rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Image counter */}
          {hasMultipleImages && (
            <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium">
              {selectedIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {hasMultipleImages && (
          <div className="grid grid-cols-4 gap-3">
            {images.slice(0, 4).map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedIndex(i)}
                className={cn(
                  "aspect-square overflow-hidden rounded-lg bg-muted transition-all",
                  selectedIndex === i
                    ? "ring-2 ring-primary ring-offset-2"
                    : "opacity-70 hover:opacity-100"
                )}
              >
                <img
                  src={img}
                  alt={`${productName} ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 bg-muted rounded-full p-2 hover:bg-muted/80 transition-colors z-10"
          >
            <X className="h-6 w-6" />
          </button>

          {hasMultipleImages && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-muted rounded-full p-3 hover:bg-muted/80 transition-colors z-10"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-muted rounded-full p-3 hover:bg-muted/80 transition-colors z-10"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          <div
            className="max-w-5xl max-h-[90vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={currentImage}
              alt={productName}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>

          {/* Lightbox thumbnails */}
          {hasMultipleImages && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedIndex(i);
                  }}
                  className={cn(
                    "w-16 h-16 overflow-hidden rounded-md transition-all",
                    selectedIndex === i
                      ? "ring-2 ring-primary"
                      : "opacity-50 hover:opacity-100"
                  )}
                >
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
