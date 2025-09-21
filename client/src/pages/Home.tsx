import { useState } from 'react';
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
import RegistrationModal from '@/components/RegistrationModal';

// Import generated images
import heroImage1 from '@assets/generated_images/Hotel_supplier_trade_show_bfcc9c37.png';
import heroImage2 from '@assets/generated_images/Hotel_amenities_display_05ff5c9a.png';
import heroImage3 from '@assets/generated_images/Business_handshake_deal_ac437db6.png';
import heroImage4 from '@assets/generated_images/Hotel_industry_conference_5c55b8b3.png';
import heroImage5 from '@assets/generated_images/Hotel_technology_equipment_871583bb.png';
import networkingImage from '@assets/generated_images/Business_networking_event_68afdf8a.png';

export default function Home() {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  // Hero carousel slides
  const heroSlides = [
    {
      id: 1,
      image: heroImage1,
      alt: 'Stands de proveedores con hoteleros visitando'
    },
    {
      id: 2,
      image: heroImage2,
      alt: 'Productos de amenidades exhibidos'
    },
    {
      id: 3,
      image: heroImage3,
      alt: 'Apretón de manos cerrando trato'
    },
    {
      id: 4,
      image: heroImage4,
      alt: 'Ponencia con profesionales hoteleros'
    },
    {
      id: 5,
      image: heroImage5,
      alt: 'Tecnologías para gestión hotelera'
    }
  ];

  // Marquee words
  const marqueeWords = [
    "Innovación Hotelera",
    "Proveedores Certificados",
    "Equipamiento & Mobiliario",
    "Amenidades & Blancos",
    "A&B · Cafetería · Cocina",
    "Energía & Sustentabilidad",
    "Limpieza & Mantenimiento",
    "Seguridad & Cerraduras",
    "Tecnología · PMS · Channel Manager",
    "Marketing & OTA",
    "Decoración & Interiorismo",
    "Servicios Financieros & Seguros"
  ];

  // Mock gallery images - todo: remove mock functionality
  const galleryImages = [
    {
      id: 1,
      src: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=400&fit=crop',
      alt: 'Edición 2023 - Networking',
      year: '2023'
    },
    {
      id: 2,
      src: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=400&fit=crop',
      alt: 'Edición 2022 - Conferencias',
      year: '2022'
    },
    {
      id: 3,
      src: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=400&fit=crop',
      alt: 'Edición 2021 - Expositores',
      year: '2021'
    },
    {
      id: 4,
      src: 'https://images.unsplash.com/photo-1582192730841-2a8d94f2eeae?w=400&h=400&fit=crop',
      alt: 'Edición 2020 - Stands',
      year: '2020'
    }
  ];

  const handleRegisterClick = () => {
    setIsRegistrationOpen(true);
  };

  const handleExhibitorClick = () => {
    console.log('Exhibitor interest clicked');
    // In real app: scroll to contact or open exhibitor form
    const contactSection = document.querySelector('#contacto');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToEvent = () => {
    const eventSection = document.querySelector('#evento');
    if (eventSection) {
      eventSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <Navigation
        onRegisterClick={handleRegisterClick}
        onExhibitorClick={handleExhibitorClick}
      />

      {/* Hero Section */}
      <div id="hero">
        <HeroCarousel
          slides={heroSlides}
          onRegisterClick={handleRegisterClick}
        />
      </div>

      {/* Marquee */}
      <Marquee words={marqueeWords} />

      {/* Countdown Timer */}
      <CountdownTimer
        targetDate="2025-11-14T10:00:00-07:00"
        title="Faltan para el gran día"
      />

      {/* About Event */}
      <AboutEvent image={networkingImage} />

      {/* Includes Section */}
      <IncludesSection onScrollToEvent={handleScrollToEvent} />

      {/* Raffle Section */}
      <RaffleSection onRegisterClick={handleRegisterClick} />

      {/* Gallery */}
      <Gallery images={galleryImages} />

      {/* Contact Section */}
      <ContactSection />

      {/* Footer */}
      <Footer />

      {/* Registration Modal */}
      <RegistrationModal
        isOpen={isRegistrationOpen}
        onClose={() => setIsRegistrationOpen(false)}
      />
    </div>
  );
}