import Gallery from '../Gallery';

export default function GalleryExample() {
  // Mock gallery images - todo: remove mock functionality
  const images = [
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

  return <Gallery images={images} />;
}