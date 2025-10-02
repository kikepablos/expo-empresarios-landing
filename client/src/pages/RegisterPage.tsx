import { FormEvent, useCallback, useMemo, useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { submitRegistration } from '@/lib/firebaseFunctions';
import { getInvitadoData, updateInvitadoData, crearSolicitud, generarCodigoConfirmacion, enviarCorreoConfirmacion, enviarCorreoSolicitud } from '@/lib/firebase';

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

interface InvitadoData {
  id: string;
  nombre?: string;
  apellidos?: string;
  telefono?: string;
  email?: string;
  empresa?: string;
  puesto?: string;
  [key: string]: any;
}

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const invitadoId = searchParams.get('invitado');
  const empresaId = import.meta.env.VITE_EMPRESA_ID || 'advance-medical-68626'; // ID de la empresa

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

  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error' | 'loading'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [invitadoData, setInvitadoData] = useState<InvitadoData | null>(null);

  // Cargar datos del invitado al montar el componente
  useEffect(() => {
    const loadInvitadoData = async () => {
      if (!invitadoId) {
        setStatus('idle');
        return;
      }

      try {
        setStatus('loading');
        const data = await getInvitadoData(empresaId, invitadoId);
        
        if (data) {
          setInvitadoData(data);
          // Prellenar el formulario con los datos existentes
          setFormData((prev) => ({
            ...prev,
            firstName: data.nombre || '',
            lastName: data.apellidos || '',
            phone: data.telefono || '',
            email: data.email || '',
            company: data.empresa || '',
            role: data.puesto || '',
          }));
        }
        setStatus('idle');
      } catch (error) {
        console.error('Error al cargar datos del invitado:', error);
        setStatus('idle');
      }
    };

    loadInvitadoData();
  }, [invitadoId, empresaId]);

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
        // Generar código de confirmación
        const codigoConfirmacion = generarCodigoConfirmacion();

        // Si hay invitadoId, actualizar en Firestore
        if (invitadoId) {
          await updateInvitadoData(empresaId, invitadoId, {
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
            status: 'Confirmado',
            codigoConfirmacion: codigoConfirmacion,
          });

          console.log('Datos actualizados en Firestore, enviando correo...');
          
          // Enviar correo de confirmación al invitado principal
          try {
            await enviarCorreoConfirmacion(
              formData.email,
              formData.firstName,
              formData.lastName,
              codigoConfirmacion,
              formData.guestType !== 'sin invitado',
              formData.guestType !== 'sin invitado' 
                ? `${formData.guestFirstName} ${formData.guestLastName}` 
                : undefined
            );
            console.log('Correo principal enviado exitosamente');
          } catch (emailError) {
            console.error('Error al enviar correo principal:', emailError);
            // No lanzar el error para que el registro se complete
          }

          // Si hay invitado acompañante, enviarle correo también
          if (formData.guestType !== 'sin invitado' && formData.guestEmail) {
            try {
              const codigoInvitado = generarCodigoConfirmacion();
              await enviarCorreoConfirmacion(
                formData.guestEmail,
                formData.guestFirstName,
                formData.guestLastName,
                codigoInvitado,
                false
              );
              console.log('Correo de acompañante enviado exitosamente');
            } catch (emailError) {
              console.error('Error al enviar correo de acompañante:', emailError);
              // No lanzar el error para que el registro se complete
            }
          }
        } else {
          // Si no hay invitadoId, crear una nueva solicitud en Firestore
          console.log('Creando nueva solicitud...');
          
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
          console.log('Solicitud creada exitosamente');

          // Enviar correo de recepción de solicitud al solicitante
          try {
            await enviarCorreoSolicitud(
              formData.email,
              formData.firstName,
              formData.lastName
            );
            console.log('Correo de solicitud enviado exitosamente');
          } catch (emailError) {
            console.error('Error al enviar correo de solicitud:', emailError);
          }

          // Si hay invitado acompañante, enviarle correo también
          if (formData.guestType !== 'sin invitado' && formData.guestEmail) {
            try {
              await enviarCorreoSolicitud(
                formData.guestEmail,
                formData.guestFirstName,
                formData.guestLastName
              );
              console.log('Correo de acompañante de solicitud enviado exitosamente');
            } catch (emailError) {
              console.error('Error al enviar correo de acompañante de solicitud:', emailError);
            }
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
          error instanceof Error ? error.message : 'No pudimos enviar tu registro. Intenta nuevamente en unos minutos.',
        );
      }
    },
    [formData, isFormValid, status, invitadoId, empresaId],
  );

  // Mostrar loading mientras se cargan los datos
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando información...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation onRegisterClick={() => navigate('/registro')} />

      <main className="pt-24 pb-16">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1549924231-f129b911e442?w=1600&fit=crop"
              alt="Registro Expo Empresarios"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/70" />
          </div>
          <div className="relative container mx-auto px-4 py-24 text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4">
              {invitadoId ? 'Completa tu registro' : 'Regístrate para la 12ª Expo Empresarios'}
            </h1>
            <p className="max-w-2xl mx-auto text-foreground/90">
              {invitadoId
                ? 'Completa tu información para confirmar tu asistencia a la 12ª Expo Empresarios de la Baja.'
                : 'Completa tus datos para asegurar tu espacio. Te confirmaremos tu registro entre 24 y 72 horas hábiles.'}
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 mt-12">
          <div className="grid lg:grid-cols-[2fr_1fr] gap-10 items-start">
            <Card className="bg-[#0b0b0b] border border-border shadow-xl">
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
                  <div className="space-y-4 border border-border/50 rounded-xl p-6 bg-black/40">
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
                    {invitadoId
                      ? '¡Gracias por confirmar tu asistencia! Nos vemos en la Expo Empresarios de la Baja.'
                      : '¡Gracias por registrarte! Tu solicitud será revisada y nos pondremos en contacto contigo muy pronto.'}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    type="submit"
                    disabled={!isFormValid || status === 'sending'}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {status === 'sending' ? 'Enviando...' : 'Enviar registro'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate('/')}
                  >
                    Volver al inicio
                  </Button>
                </div>
              </form>
            </Card>

            <aside className="space-y-6">
              <Card className="bg-black/50 border border-border p-6">
                <h3 className="font-serif text-2xl text-primary mb-3">¿Qué sigue después del registro?</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li>1. Nuestro equipo revisará tu solicitud y disponibilidad de espacios.</li>
                  <li>2. Si ya está su registro completo y autorizado, solo imprima su gafete, y el de su invitado, y preséntese con una identificación el día de la Expo.</li>
                </ul>
              </Card>

              <Card className="bg-black/50 border border-border p-6">
                <h3 className="font-serif text-xl text-primary mb-3">Información de contacto</h3>
                <p className="text-sm text-muted-foreground">
                  ¿Tienes preguntas adicionales? Escríbenos a{' '}
                  <a href="mailto:registro@expoempresarioslabaja.com" className="text-primary underline">
                    registro@expoempresarioslabaja.com
                  </a>{' '}
                  o envíanos un mensaje por WhatsApp.
                </p>
              </Card>
            </aside>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}


