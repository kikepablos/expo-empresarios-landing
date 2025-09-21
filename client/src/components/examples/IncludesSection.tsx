import IncludesSection from '../IncludesSection';

export default function IncludesSectionExample() {
  return (
    <IncludesSection
      onScrollToEvent={() => console.log('Scroll to event clicked')}
    />
  );
}