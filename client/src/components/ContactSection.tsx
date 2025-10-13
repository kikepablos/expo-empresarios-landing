import { useState, useCallback, useMemo, FormEvent } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { crearSolicitud, generarCodigoConfirmacion, enviarCorreoSolicitud } from '@/lib/firebase';
import { EMPRESA_ID } from '@/config/constants';

const guestTypeOptions = [
  { value: 'sin invitado', label: 'Sin invitado' },
  { value: 'invitado personal', label: 'Invitado personal' },
  { value: 'colaborador', label: 'Colaborador' },
] as const;

const guestRelationshipOptions = [
  { value: 'conyuge', label: 'Esposo(a) / Pareja' },
  { value: 'hijo', label: 'Hijo(a)' },
  { value: 'padre', label: 'Padre / Madre' },
  { value: 'familiar', label: 'Otro familiar' },
  { value: 'amigo', label: 'Amigo(a)' },
] as const;

type GuestType = typeof guestTypeOptions[number]['value'];

export default function ContactSection() {
  const empresaId = EMPRESA_ID;
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    company: '',
    role: '',
    guestType: 'sin invitado' as GuestType,
    guestFirstName: '',
    guestLastName: '',
    guestPhone: '',
    guestEmail: '',
    guestRole: '',
    guestRelationship: '',
    notes: '',
  });
  
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = useCallback((field: keyof typeof formData, value: string) => {
    setFormData((prev) => {
      if (field === 'guestType') {
        return {
          ...prev,
          guestType: value as GuestType,
          guestFirstName: '',
          guestLastName: '',
          guestPhone: '',
          guestEmail: '',
          guestRole: '',
          guestRelationship: '',
        };
      }
      return { ...prev, [field]: value };
    });
  }, []);

  const needsGuestFields = useMemo(() => formData.guestType !== 'sin invitado', [formData.guestType]);

  const isFormValid = useMemo(() => {
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.email || !formData.company || !formData.role) {
      return false;
    }

    if (formData.guestType === 'colaborador') {
      return Boolean(
        formData.guestFirstName &&
          formData.guestLastName &&
          formData.guestPhone &&
          formData.guestEmail &&
          formData.guestRole,
      );
    }

    if (formData.guestType === 'invitado personal') {
      return Boolean(
        formData.guestFirstName &&
          formData.guestLastName &&
          formData.guestPhone &&
          formData.guestEmail &&
          formData.guestRelationship,
      );
    }

    return true;
  }, [formData]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!isFormValid || status === 'sending') return;

      setStatus('sending');
      setErrorMessage('');

      try {
        const codigoConfirmacion = generarCodigoConfirmacion();
        
        const solicitudData = {
          nombre: formData.firstName,
          apellidos: formData.lastName,
          telefono: formData.phone,
          email: formData.email,
          empresa: formData.company,
          puesto: formData.role,
          tipoInvitado: formData.guestType,
          invitadoAcompanante: formData.guestType === 'sin invitado'
            ? null
            : {
                nombre: formData.guestFirstName,
                apellidos: formData.guestLastName,
                telefono: formData.guestPhone,
                email: formData.guestEmail,
                ...(formData.guestType === 'colaborador'
                  ? { puesto: formData.guestRole }
                  : { parentesco: formData.guestRelationship }),
              },
          notas: formData.notes,
          codigoConfirmacion: codigoConfirmacion,
        };

        await crearSolicitud(empresaId, solicitudData);

        try {
          await enviarCorreoSolicitud(
            formData.email,
            formData.firstName,
            formData.lastName
          );
        } catch (emailError) {
          console.error('Error al enviar correo:', emailError);
        }

        if (formData.guestType !== 'sin invitado' && formData.guestEmail) {
          try {
            await enviarCorreoSolicitud(
              formData.guestEmail,
              formData.guestFirstName,
              formData.guestLastName
            );
          } catch (emailError) {
            console.error('Error al enviar correo de acompañante:', emailError);
          }
        }

        setStatus('success');
        setFormData({
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          company: '',
          role: '',
          guestType: 'sin invitado',
          guestFirstName: '',
          guestLastName: '',
          guestPhone: '',
          guestEmail: '',
          guestRole: '',
          guestRelationship: '',
          notes: '',
        });
      } catch (error) {
        console.error('Registration error', error);
        setStatus('error');
        setErrorMessage(
          error instanceof Error ? error.message : 'No pudimos enviar tu registro. Intenta nuevamente.'
        );
      }
    },
    [formData, isFormValid, status, empresaId]
  );


  return (
    <section id="contacto" className="py-16 md:py-24" data-testid="contact-section">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4" data-testid="contact-title">
              Confirma tu participación en la 12ª Expo Empresarios de la Baja
            </h2>
            <p className="text-xl text-muted-foreground" data-testid="contact-subtitle">
              Completa tus datos para enviarte la ficha de pago y asegurar tu espacio. Cupo limitado a 16 proveedores.
            </p>
          </div>

          <Card className="bg-card border border-border shadow-xl">
            <form className="p-8 space-y-6" onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(event) => handleChange('firstName', event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(event) => handleChange('lastName', event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Número de teléfono *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(event) => handleChange('phone', event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo electrónico *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(event) => handleChange('email', event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa *</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(event) => handleChange('company', event.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Puesto *</Label>
                    <Input
                      id="role"
                      value={formData.role}
                      onChange={(event) => handleChange('role', event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Tipo de invitado *</Label>
                    <Select
                      value={formData.guestType}
                      onValueChange={(value: GuestType) => handleChange('guestType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una opción" />
                      </SelectTrigger>
                      <SelectContent>
                        {guestTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {needsGuestFields && (
                  <div className="space-y-4 border border-border/50 rounded-xl p-6 bg-muted/50">
                    <h3 className="font-serif text-xl text-primary">
                      {formData.guestType === 'colaborador' ? 'Datos del colaborador' : 'Datos del invitado'}
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="guestFirstName">Nombre *</Label>
                        <Input
                          id="guestFirstName"
                          value={formData.guestFirstName}
                          onChange={(event) => handleChange('guestFirstName', event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guestLastName">Apellido *</Label>
                        <Input
                          id="guestLastName"
                          value={formData.guestLastName}
                          onChange={(event) => handleChange('guestLastName', event.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="guestPhone">Teléfono *</Label>
                        <Input
                          id="guestPhone"
                          value={formData.guestPhone}
                          onChange={(event) => handleChange('guestPhone', event.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="guestEmail">Correo electrónico *</Label>
                        <Input
                          id="guestEmail"
                          type="email"
                          value={formData.guestEmail}
                          onChange={(event) => handleChange('guestEmail', event.target.value)}
                          required
                        />
                      </div>
                    </div>

                    {formData.guestType === 'colaborador' && (
                      <div className="space-y-2">
                        <Label htmlFor="guestRole">Puesto *</Label>
                        <Input
                          id="guestRole"
                          value={formData.guestRole}
                          onChange={(event) => handleChange('guestRole', event.target.value)}
                          required
                        />
                      </div>
                    )}

                    {formData.guestType === 'invitado personal' && (
                      <div className="space-y-2">
                        <Label htmlFor="guestRelationship">Parentesco *</Label>
                        <Select
                          value={formData.guestRelationship}
                          onValueChange={(value) => handleChange('guestRelationship', value)}
                        >
                          <SelectTrigger id="guestRelationship">
                            <SelectValue placeholder="Selecciona el parentesco" />
                          </SelectTrigger>
                          <SelectContent>
                            {guestRelationshipOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notes">Mensaje (opcional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(event) => handleChange('notes', event.target.value)}
                    placeholder="Cuéntanos detalles adicionales o requerimientos especiales"
                  />
                </div>

                {status === 'error' && (
                  <p className="text-sm text-red-500">{errorMessage}</p>
                )}
                {status === 'success' && (
                  <p className="text-sm text-green-500">
                    ¡Gracias por registrarte! Tu solicitud será revisada y nos pondremos en contacto contigo muy pronto.
                  </p>
                )}

                <div className="flex justify-center">
                  <Button
                    type="submit"
                    disabled={!isFormValid || status === 'sending'}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-8"
                  >
                    {status === 'sending' ? 'Enviando...' : 'Enviar registro'}
                  </Button>
                </div>
              </form>
          </Card>
        </div>
      </div>
    </section>
  );
}