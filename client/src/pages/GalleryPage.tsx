import { useCallback, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { getGaleriaImages } from '@/lib/firebase';

export default function GalleryPage() {
  const [, navigate] = useLocation();
  const [galeriaImages, setGaleriaImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const empresaId = import.meta.env.VITE_EMPRESA_ID || 'advance-medical-68626';

  // Cargar imágenes de la galería desde Firebase
  useEffect(() => {
    const loadGaleriaImages = async () => {
      try {
        setLoading(true);
        const images = await getGaleriaImages(empresaId);
        setGaleriaImages(images);
      } catch (error) {
        console.error('Error al cargar imágenes de la galería:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGaleriaImages();
  }, [empresaId]);

  const handleRegisterClick = useCallback(() => {
    navigate('/registro');
  }, [navigate]);

  const handleImageClick = (image: any) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  const handleNextImage = () => {
    if (!selectedImage) return;
    const currentIndex = galeriaImages.findIndex(img => img.id === selectedImage.id);
    const nextIndex = (currentIndex + 1) % galeriaImages.length;
    setSelectedImage(galeriaImages[nextIndex]);
  };

  const handlePrevImage = () => {
    if (!selectedImage) return;
    const currentIndex = galeriaImages.findIndex(img => img.id === selectedImage.id);
    const prevIndex = currentIndex === 0 ? galeriaImages.length - 1 : currentIndex - 1;
    setSelectedImage(galeriaImages[prevIndex]);
  };

  return (
    <div className="min-h-screen">
      <Navigation onRegisterClick={handleRegisterClick} />
      <main className="pt-28 pb-20 bg-background">
        <section className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="text-sm uppercase tracking-[0.4em] text-primary">Galería</span>
            <h1 className="font-serif text-4xl md:text-5xl font-bold mt-4 mb-6">
              Momentos memorables de las ediciones pasadas
            </h1>
            <p className="text-muted-foreground">
              Una mirada a las conexiones estratégicas, degustaciones y experiencias premium que hemos compartido con la
              comunidad hotelera de Los Cabos a lo largo de once ediciones.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando galería...</p>
              </div>
            </div>
          ) : galeriaImages.length > 0 ? (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
              {/* collage layout */}
              {galeriaImages.map((image) => (
                <figure
                  key={image.id}
                  className="mb-6 break-inside-avoid overflow-hidden rounded-xl border border-border bg-[#111111] shadow-lg cursor-pointer group"
                  onClick={() => handleImageClick(image)}
                >
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </figure>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-lg">No hay imágenes en la galería aún.</p>
            </div>
          )}
        </section>
      </main>

      {/* Modal para ver imagen en grande */}
      {isModalOpen && selectedImage && (
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
              handlePrevImage();
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
              src={selectedImage.url}
              alt={selectedImage.alt}
              className="w-full h-full object-contain"
            />
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNextImage();
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

      <Footer />
    </div>
  );
}
