import { useState } from 'react';
import { Button } from '@/components/ui/button';
import RegistrationModal from '../RegistrationModal';

export default function RegistrationModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-8">
      <Button
        onClick={() => setIsOpen(true)}
        data-testid="button-open-modal"
      >
        Open Registration Modal
      </Button>
      
      <RegistrationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}