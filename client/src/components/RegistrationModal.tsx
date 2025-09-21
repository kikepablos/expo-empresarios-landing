import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { User, Mail, Phone, Briefcase, Building } from 'lucide-react';

interface RegistrationData {
  nombre: string;
  correo: string;
  telefono: string;
  puesto: string;
  empresa: string;
}

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegistrationModal({ isOpen, onClose }: RegistrationModalProps) {
  const [formData, setFormData] = useState<RegistrationData>({
    nombre: '',
    correo: '',
    telefono: '',
    puesto: '',
    empresa: ''
  });
  const [consents, setConsents] = useState({
    marketing: false,
    privacy: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (field: keyof RegistrationData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleConsentChange = (field: 'marketing' | 'privacy', checked: boolean) => {
    setConsents(prev => ({ ...prev, [field]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate registration submission
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Registration submitted:', { ...formData, consents });
      setSubmitStatus('success');
      
      // Reset form after success
      setTimeout(() => {
        setFormData({
          nombre: '',
          correo: '',
          telefono: '',
          puesto: '',
          empresa: ''
        });
        setConsents({ marketing: false, privacy: false });
        setSubmitStatus('idle');
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = 
    formData.nombre && 
    formData.correo && 
    formData.telefono && 
    formData.puesto && 
    formData.empresa && 
    consents.privacy;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" data-testid="registration-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif" data-testid="modal-title">
            Registro de Asistente
          </DialogTitle>
        </DialogHeader>

        {submitStatus === 'success' ? (
          <div className="text-center py-8" data-testid="success-content">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">¡Gracias por registrarte!</h3>
            <p className="text-muted-foreground">Te enviamos tu pase por correo.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="reg-nombre" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nombre completo *
              </Label>
              <Input
                id="reg-nombre"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                required
                data-testid="input-reg-nombre"
              />
            </div>

            <div>
              <Label htmlFor="reg-correo" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Correo electrónico *
              </Label>
              <Input
                id="reg-correo"
                type="email"
                value={formData.correo}
                onChange={(e) => handleInputChange('correo', e.target.value)}
                required
                data-testid="input-reg-correo"
              />
            </div>

            <div>
              <Label htmlFor="reg-telefono" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Número de teléfono *
              </Label>
              <Input
                id="reg-telefono"
                type="tel"
                value={formData.telefono}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                required
                data-testid="input-reg-telefono"
              />
            </div>

            <div>
              <Label htmlFor="reg-puesto" className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Puesto *
              </Label>
              <Input
                id="reg-puesto"
                value={formData.puesto}
                onChange={(e) => handleInputChange('puesto', e.target.value)}
                placeholder="Ej: Director General, Gerente de Compras"
                required
                data-testid="input-reg-puesto"
              />
            </div>

            <div>
              <Label htmlFor="reg-empresa" className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                Empresa / Hotel *
              </Label>
              <Input
                id="reg-empresa"
                value={formData.empresa}
                onChange={(e) => handleInputChange('empresa', e.target.value)}
                required
                data-testid="input-reg-empresa"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="marketing-consent"
                  checked={consents.marketing}
                  onCheckedChange={(checked) => handleConsentChange('marketing', checked as boolean)}
                  data-testid="checkbox-marketing"
                />
                <Label htmlFor="marketing-consent" className="text-sm leading-relaxed">
                  Acepto recibir información del evento y proveedores participantes.
                </Label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="privacy-consent"
                  checked={consents.privacy}
                  onCheckedChange={(checked) => handleConsentChange('privacy', checked as boolean)}
                  data-testid="checkbox-privacy"
                />
                <Label htmlFor="privacy-consent" className="text-sm leading-relaxed">
                  He leído el Aviso de Privacidad. *
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              data-testid="button-submit-registration"
            >
              {isSubmitting ? 'Enviando registro...' : 'Enviar registro'}
            </Button>

            {submitStatus === 'error' && (
              <p className="text-red-600 text-sm text-center" data-testid="error-message">
                No pudimos completar el registro. Intenta de nuevo.
              </p>
            )}
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}