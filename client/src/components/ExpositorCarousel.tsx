import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface Expositor {
  id: string;
  empresa: string;
  logoUrl: string;
  categoria?: string;
}

interface ExpositorCarouselProps {
  expositores: Expositor[];
}

export default function ExpositorCarousel({ expositores }: ExpositorCarouselProps) {
  const [, navigate] = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(5);

  // Responsive items per view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(2);
      } else if (window.innerWidth < 768) {
        setItemsPerView(3);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(4);
      } else {
        setItemsPerView(5);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, expositores.length - itemsPerView);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const handleExpositorClick = (expositorId: string) => {
    navigate(`/expositor/${expositorId}`);
  };

  if (expositores.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-background/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
            Nuestros Expositores
          </h2>
          <p className="text-foreground/70 max-w-2xl mx-auto">
            Conoce a las empresas que participarán en la 12ª Expo Empresarios de la Baja
          </p>
        </div>

        <div className="relative">
          {/* Botón Anterior */}
          {currentIndex > 0 && (
            <Button
              onClick={handlePrev}
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 rounded-full bg-background/90 hover:bg-background shadow-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          )}

          {/* Carrousel */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out gap-6"
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
              }}
            >
              {expositores.map((expositor) => (
                <div
                  key={expositor.id}
                  className="flex-shrink-0"
                  style={{ width: `calc(${100 / itemsPerView}% - ${(itemsPerView - 1) * 24 / itemsPerView}px)` }}
                >
                  <button
                    onClick={() => handleExpositorClick(expositor.id)}
                    className="w-full group"
                  >
                    <div className="relative aspect-square bg-card border-2 border-border rounded-lg overflow-hidden hover:border-primary transition-all duration-300 hover:shadow-xl">
                      <img
                        src={expositor.logoUrl}
                        alt={expositor.empresa}
                        className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-300"
                      />
                      {/* Overlay con nombre */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
                        <p className="text-white font-semibold text-center text-sm line-clamp-2">
                          {expositor.empresa}
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Botón Siguiente */}
          {currentIndex < maxIndex && (
            <Button
              onClick={handleNext}
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 rounded-full bg-background/90 hover:bg-background shadow-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Indicadores */}
        {maxIndex > 0 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: maxIndex + 1 }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentIndex === index
                    ? 'bg-primary w-8'
                    : 'bg-foreground/30 hover:bg-foreground/50'
                }`}
                aria-label={`Ir a página ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
