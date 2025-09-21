import RaffleSection from '../RaffleSection';

export default function RaffleSectionExample() {
  return (
    <RaffleSection
      onRegisterClick={() => console.log('Register for raffle clicked')}
    />
  );
}