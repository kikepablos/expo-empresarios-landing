import { useCallback, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Navigation from '@/components/Navigation';
import HeroCarousel from '@/components/HeroCarousel';
import Marquee from '@/components/Marquee';
import CountdownTimer from '@/components/CountdownTimer';
import AboutEvent from '@/components/AboutEvent';
import IncludesSection from '@/components/IncludesSection';
import RaffleSection from '@/components/RaffleSection';
import Gallery from '@/components/Gallery';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';
import ExpositorCarousel from '@/components/ExpositorCarousel';
import { getCarrouselImages, getGaleriaImages, getExpositores } from '@/lib/firebase';
import { EMPRESA_ID } from '@/config/constants';
import networkingImage from '@assets/generated_images/Business_networking_event_68afdf8a.png';

export default function Home() {
  const [, navigate] = useLocation();
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [galeriaImages, setGaleriaImages] = useState<any[]>([]);
  const [expositores, setExpositores] = useState<any[]>([]);
  const [loadingCarrousel, setLoadingCarrousel] = useState(true);
  const [loadingGaleria, setLoadingGaleria] = useState(true);
  const [loadingExpositores, setLoadingExpositores] = useState(true);
  const empresaId = EMPRESA_ID;

  // Cargar imágenes del carrousel desde Firebase
  useEffect(() => {
    const loadCarrouselImages = async () => {
      try {
        setLoadingCarrousel(true);
        const images = await getCarrouselImages(empresaId);
        
        if (images && images.length > 0) {
          // Mapear las imágenes de Firebase al formato esperado por el componente
          const slides = images.map((img: any) => ({
            id: img.id,
            image: img.url,
            alt: img.alt
          }));
          setHeroSlides(slides);
        }
      } catch (error) {
        console.error('Error al cargar imágenes del carrousel:', error);
      } finally {
        setLoadingCarrousel(false);
      }
    };

    loadCarrouselImages();
  }, [empresaId]);

  // Cargar imágenes de la galería desde Firebase
  useEffect(() => {
    const loadGaleriaImages = async () => {
      try {
        setLoadingGaleria(true);
        const images = await getGaleriaImages(empresaId);
        
        if (images && images.length > 0) {
          // Mapear las imágenes de Firebase al formato esperado por Gallery
          const gallerySlides = images.map((img: any) => ({
            id: img.id,
            url: img.url,
            alt: img.alt
          }));
          setGaleriaImages(gallerySlides);
        }
      } catch (error) {
        console.error('Error al cargar imágenes de la galería:', error);
      } finally {
        setLoadingGaleria(false);
      }
    };

    loadGaleriaImages();
  }, [empresaId]);

  // Cargar expositores desde Firebase
  useEffect(() => {
    const loadExpositores = async () => {
      try {
        setLoadingExpositores(true);
        const data = await getExpositores(empresaId);
        setExpositores(data);
      } catch (error) {
        console.error('Error al cargar expositores:', error);
      } finally {
        setLoadingExpositores(false);
      }
    };

    loadExpositores();
  }, [empresaId]);

  // Marquee words
  const marqueeWords = [
    "Participantes: 16 Proveedores",
    "600+ Ejecutivos Invitados",
    "Hotel Krystal Grand Los Cabos",
    "Citas 1:1 con Compradores",
    "Degustaciones y Networking",
    "Rifas con Grandes Premios",
    "Banda en Vivo y Mariachi",
    "Show Profesional",
    "Gastos cubiertos por la Expo",
    "Desde 2012 Impulsando Negocios",
    "Expo Amigos Los Cabos",
    "Expo Empresarios de la Baja"
  ];


  const handleRegisterClick = useCallback(() => {
    navigate('/registro');
  }, [navigate]);

  const handleScrollToEvent = () => {
    const eventSection = document.querySelector('#evento');
    if (eventSection) {
      eventSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <Navigation onRegisterClick={handleRegisterClick} />

      {/* Hero Section */}
      <div id="hero">
        {loadingCarrousel ? (
          <div className="h-screen flex items-center justify-center bg-gradient-to-r from-primary to-secondary">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-xl">Cargando...</p>
            </div>
          </div>
        ) : heroSlides.length > 0 ? (
          <HeroCarousel
            slides={heroSlides}
            onRegisterClick={handleRegisterClick}
          />
        ) : (
          <div className="h-screen flex items-center justify-center bg-gradient-to-r from-primary to-secondary">
            <div className="text-center text-white px-4">
              <h1 className="text-5xl md:text-6xl font-serif font-bold mb-4">
                12ª Expo Empresarios de la Baja
              </h1>
              <p className="text-xl md:text-2xl mb-8">
                Los Cabos, Baja California Sur
              </p>
              <button
                onClick={handleRegisterClick}
                className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all"
              >
                Regístrate Ahora
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Marquee */}
      <Marquee words={marqueeWords} />

      {/* Countdown Timer */}
      <CountdownTimer
        targetDate="2025-11-21T09:00:00-07:00"
        title="Faltan para la 12ª Expo Empresarios de la Baja"
      />

      {/* Expositores Carousel */}
      {!loadingExpositores && expositores.length > 0 && (
        <ExpositorCarousel expositores={expositores} />
      )}

      {/* About Event */}
      <AboutEvent image={networkingImage} />

      {/* Includes Section */}
      <IncludesSection onScrollToEvent={handleScrollToEvent} />

      {/* Raffle Section */}
      <RaffleSection onRegisterClick={handleRegisterClick} />

      {/* Gallery */}
      {!loadingGaleria && <Gallery images={galeriaImages} />}
      {/* Contact Section */}
      <ContactSection />

      {/* Footer */}
      <Footer />
    </div>
  );
}