import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';

interface GalleryImage {
  id: string;
  url?: string;
  src?: string;
  alt: string;
  year?: string;
}

interface GalleryProps {
  images: GalleryImage[];
}

export default function Gallery({ images }: GalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, navigate] = useLocation();

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleImageClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // If no images, show placeholder
  if (images.length === 0) {
    const placeholderWords = [
      "Historias de Negocio",
      "Casos de Éxito", 
      "Proveedores en Acción",
      "Networking Real"
    ];

    return (
      <section id="galeria" className="py-16 md:py-24 bg-background border-y border-border" data-testid="gallery-section">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4" data-testid="gallery-title">
              Ediciones anteriores
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {placeholderWords.map((word, index) => (
              <Card key={index} className="aspect-square flex items-center justify-center bg-[#111111] border border-border" data-testid={`gallery-placeholder-${index}`}>
                <span className="font-serif text-2xl text-primary text-center px-4">
                  {word}
                </span>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const currentImage = images[currentIndex];
  const imageUrl = currentImage.url || currentImage.src || '';

  return (
    <section id="galeria" className="py-16 md:py-24 bg-background border-y border-border" data-testid="gallery-section">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4" data-testid="gallery-title">
            Ediciones anteriores
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            Recorrido visual por las conexiones y experiencias que hemos creado en once ediciones previas.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          <Card className="overflow-hidden bg-[#111111] border border-border cursor-pointer group" onClick={handleImageClick}>
            <div className="relative w-full h-72 md:h-[28rem]">
              <img
                src={imageUrl}
                alt={currentImage.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                data-testid="gallery-carousel-image"
              />
            </div>
          </Card>

          <button
            onClick={goToPrevious}
            className="absolute -left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/70 text-foreground hover:bg-black/90 transition-colors"
            data-testid="carousel-prev"
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={goToNext}
            className="absolute -right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/70 text-foreground hover:bg-black/90 transition-colors"
            data-testid="carousel-next"
            aria-label="Imagen siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-center mt-6 space-x-2" data-testid="carousel-indicators">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex ? 'w-8 bg-primary' : 'w-2 bg-muted'
              }`}
              aria-label={`Ir a la imagen ${index + 1}`}
            />
          ))}
        </div>

        <div className="text-center mt-10">
          <Button size="lg" onClick={() => navigate('/galeria')} data-testid="button-view-gallery">
            Ver galería completa
          </Button>
        </div>
      </div>

      {/* Modal para ver imagen en grande */}
      {isModalOpen && currentImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={handleCloseModal}
        >
          <button
            onClick={handleCloseModal}
            className="absolute top-4 right-4 text-white hover:text-primary transition-colors z-10"
            aria-label="Cerrar"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Imagen anterior"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div
            className="max-w-7xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageUrl}
              alt={currentImage.alt}
              className="w-full h-full object-contain"
            />
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            aria-label="Imagen siguiente"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}