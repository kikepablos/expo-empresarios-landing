import Marquee from '../Marquee';

export default function MarqueeExample() {
  const words = [
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

  return <Marquee words={words} />;
}