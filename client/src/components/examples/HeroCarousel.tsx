import HeroCarousel from '../HeroCarousel';
import heroImage1 from '@assets/generated_images/Hotel_supplier_trade_show_bfcc9c37.png';
import heroImage2 from '@assets/generated_images/Hotel_amenities_display_05ff5c9a.png';
import heroImage3 from '@assets/generated_images/Business_handshake_deal_ac437db6.png';
import heroImage4 from '@assets/generated_images/Hotel_industry_conference_5c55b8b3.png';
import heroImage5 from '@assets/generated_images/Hotel_technology_equipment_871583bb.png';

export default function HeroCarouselExample() {
  const slides = [
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

  return (
    <HeroCarousel
      slides={slides}
      onRegisterClick={() => console.log('Register button clicked')}
    />
  );
}