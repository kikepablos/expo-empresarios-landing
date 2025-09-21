import Navigation from '../Navigation';

export default function NavigationExample() {
  return (
    <Navigation
      onRegisterClick={() => console.log('Register clicked')}
      onExhibitorClick={() => console.log('Exhibitor clicked')}
    />
  );
}