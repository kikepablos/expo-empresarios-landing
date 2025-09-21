import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Phone, Mail, Building, User } from 'lucide-react';

interface ContactFormData {
  nombre: string;
  correo: string;
  telefono: string;
  empresa: string;
  mensaje: string;
}

export default function ContactSection() {
  const [formData, setFormData] = useState<ContactFormData>({
    nombre: '',
    correo: '',
    telefono: '',
    empresa: '',
    mensaje: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Contact form submitted:', formData);
      setSubmitStatus('success');
      setFormData({
        nombre: '',
        correo: '',
        telefono: '',
        empresa: '',
        mensaje: ''
      });
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus('idle'), 3000);
    }
  };

  const handleWhatsAppClick = () => {
    console.log('WhatsApp clicked');
    // In real app: window.open('https://wa.me/phone_number', '_blank');
  };

  const isFormValid = formData.nombre && formData.correo && formData.telefono && formData.empresa;

  return (
    <section id="contacto" className="py-16 md:py-24" data-testid="contact-section">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4" data-testid="contact-title">
              ¿Tienes dudas o deseas exponer?
            </h2>
            <p className="text-xl text-muted-foreground" data-testid="contact-subtitle">
              Escríbenos y te respondemos en menos de 24 horas.
            </p>
          </div>

          <Card className="hover-elevate">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                Contacto directo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nombre" className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Nombre completo
                    </Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                      required
                      data-testid="input-nombre"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="empresa" className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Empresa
                    </Label>
                    <Input
                      id="empresa"
                      value={formData.empresa}
                      onChange={(e) => handleInputChange('empresa', e.target.value)}
                      required
                      data-testid="input-empresa"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="correo" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Correo electrónico
                    </Label>
                    <Input
                      id="correo"
                      type="email"
                      value={formData.correo}
                      onChange={(e) => handleInputChange('correo', e.target.value)}
                      required
                      data-testid="input-correo"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="telefono" className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Teléfono
                    </Label>
                    <Input
                      id="telefono"
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => handleInputChange('telefono', e.target.value)}
                      required
                      data-testid="input-telefono"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="mensaje">Mensaje (opcional)</Label>
                  <Textarea
                    id="mensaje"
                    value={formData.mensaje}
                    onChange={(e) => handleInputChange('mensaje', e.target.value)}
                    rows={4}
                    placeholder="Cuéntanos más sobre tu consulta..."
                    data-testid="textarea-mensaje"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    type="submit"
                    disabled={!isFormValid || isSubmitting}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    data-testid="button-submit-contact"
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleWhatsAppClick}
                    className="flex-1"
                    data-testid="button-whatsapp"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>

                <div className="text-center">
                  {submitStatus === 'success' && (
                    <p className="text-green-600 text-sm" data-testid="success-message">
                      ¡Gracias! Te contactaremos muy pronto.
                    </p>
                  )}
                  {submitStatus === 'error' && (
                    <p className="text-red-600 text-sm" data-testid="error-message">
                      Revisa los campos marcados.
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    Al enviar aceptas nuestro Aviso de Privacidad.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}