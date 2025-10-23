import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getExpositorData, getCurrentUser } from '@/lib/firebase';
import { EMPRESA_ID } from '@/config/constants';
import { MapPin, Globe, Phone, Mail, Calendar, ArrowLeft, Loader2, LogIn } from 'lucide-react';
import LoginModal from '@/components/auth/LoginModal';

export default function ExpositorDetailPage() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute('/expositor/:id');
  const expositorId = params?.id;
  
  const [expositor, setExpositor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    // Verificar usuario loggeado
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  useEffect(() => {
    const loadExpositor = async () => {
      if (!expositorId) {
        navigate('/');
        return;
      }

      try {
        setLoading(true);
        const data = await getExpositorData(EMPRESA_ID, expositorId);
        
        if (!data) {
          navigate('/');
          return;
        }

        setExpositor(data);
        
        // Establecer la primera imagen como seleccionada si hay galería
        if (data.imagenesGaleria && data.imagenesGaleria.length > 0) {
          setSelectedImage(data.imagenesGaleria[0]);
        }
      } catch (error) {
        console.error('Error al cargar expositor:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    loadExpositor();
  }, [expositorId]);

  const handleAgendarCita = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Redirigir a página de agendar cita con el expositorId
    navigate(`/agendar-cita?expositor=${expositorId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation onRegisterClick={() => navigate('/registro')} />
        <div className="container mx-auto px-4 py-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-foreground/60">Cargando información del expositor...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!expositor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation onRegisterClick={() => navigate('/registro')} />

      <main className="pt-24 pb-16">
        {/* Header con fondo */}
        <section className="relative overflow-hidden bg-gradient-to-r from-primary/10 to-blue-500/10">
          <div className="container mx-auto px-4 py-12">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Logo */}
              {expositor.logoUrl && (
                <div className="w-full md:w-64 flex-shrink-0">
                  <div className="aspect-square bg-card border-2 border-border rounded-lg overflow-hidden p-6">
                    <img
                      src={expositor.logoUrl}
                      alt={expositor.empresa}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Información Principal */}
              <div className="flex-1">
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
                  {expositor.empresa}
                </h1>

                {expositor.categoria && (
                  <div className="inline-block bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-semibold mb-6">
                    {expositor.categoria}
                  </div>
                )}

                {/* Datos de Contacto */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {expositor.direccion && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-foreground/60">Dirección</p>
                        <p className="text-foreground">{expositor.direccion}</p>
                      </div>
                    </div>
                  )}

                  {expositor.sitioWeb && (
                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-foreground/60">Sitio Web</p>
                        <a
                          href={expositor.sitioWeb.startsWith('http') ? expositor.sitioWeb : `https://${expositor.sitioWeb}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {expositor.sitioWeb}
                        </a>
                      </div>
                    </div>
                  )}

                  {expositor.telefono && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-foreground/60">Teléfono</p>
                        <a
                          href={`tel:${expositor.lada || ''}${expositor.telefono}`}
                          className="text-foreground hover:text-primary"
                        >
                          {expositor.lada} {expositor.telefono}
                        </a>
                      </div>
                    </div>
                  )}

                  {expositor.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-foreground/60">Email</p>
                        <a
                          href={`mailto:${expositor.email}`}
                          className="text-foreground hover:text-primary"
                        >
                          {expositor.email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Botón Agendar Cita */}
                {user && (
                  <Button
                    onClick={handleAgendarCita}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold"
                    size="lg"
                  >
                    <Calendar className="w-5 h-5 mr-2" />
                    Agendar Cita
                  </Button>
                )}

                {!user && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-sm text-foreground/70">
                      <strong>Inicia sesión</strong> para agendar una cita con este expositor
                    </p>
                    <Button
                      onClick={() => setShowLoginModal(true)}
                      variant="outline"
                      className="mt-2"
                      size="sm"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Iniciar Sesión
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Descripción */}
        {expositor.descripcion && (
          <section className="container mx-auto px-4 py-12">
            <Card className="bg-card border border-border p-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Acerca de {expositor.empresa}
              </h2>
              <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">
                {expositor.descripcion}
              </p>
            </Card>
          </section>
        )}

        {/* Galería de Imágenes */}
        {expositor.imagenesGaleria && expositor.imagenesGaleria.length > 0 && (
          <section className="container mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              Galería de Productos/Servicios
            </h2>

            {/* Imagen Principal */}
            <div className="mb-6">
              <div className="aspect-video bg-card border-2 border-border rounded-lg overflow-hidden">
                <img
                  src={selectedImage || expositor.imagenesGaleria[0]}
                  alt="Imagen principal"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Miniaturas */}
            {expositor.imagenesGaleria.length > 1 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {expositor.imagenesGaleria.map((imagen: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(imagen)}
                    className={`aspect-square bg-card border-2 rounded-lg overflow-hidden hover:border-primary transition-all ${
                      selectedImage === imagen ? 'border-primary ring-2 ring-primary/50' : 'border-border'
                    }`}
                  >
                    <img
                      src={imagen}
                      alt={`Imagen ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Información de Contacto del Expositor */}
        {(expositor.nombre || expositor.apellidos) && (
          <section className="container mx-auto px-4 py-12">
            <Card className="bg-card border border-border p-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Persona de Contacto
              </h2>
              <div className="space-y-2">
                <p className="text-lg">
                  <strong>{expositor.nombre} {expositor.apellidos}</strong>
                </p>
                {expositor.email && (
                  <p className="text-foreground/80">
                    <Mail className="w-4 h-4 inline mr-2" />
                    <a href={`mailto:${expositor.email}`} className="hover:text-primary">
                      {expositor.email}
                    </a>
                  </p>
                )}
                {expositor.telefono && (
                  <p className="text-foreground/80">
                    <Phone className="w-4 h-4 inline mr-2" />
                    <a href={`tel:${expositor.lada}${expositor.telefono}`} className="hover:text-primary">
                      {expositor.lada} {expositor.telefono}
                    </a>
                  </p>
                )}
              </div>
            </Card>
          </section>
        )}
      </main>

      <Footer />

      {/* Modal de Login */}
      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        onLoginSuccess={() => {
          // El componente se actualizará automáticamente cuando cambie el estado de autenticación
          const currentUser = getCurrentUser();
          setUser(currentUser);
        }}
      />
    </div>
  );
}
