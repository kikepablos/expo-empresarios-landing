import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getUserProfile } from '@/lib/firebase';
import { EMPRESA_ID } from '@/config/constants';
import { Loader2, User, Lock, Calendar, Ticket } from 'lucide-react';
import ProfileInfo from '@/components/profile/ProfileInfo';
import ProfileEdit from '@/components/profile/ProfileEdit';
import ProfilePassword from '@/components/profile/ProfilePassword';
import ProfileSchedule from '@/components/profile/ProfileSchedule';
import ProfileBadges from '@/components/profile/ProfileBadges';
import { useAuthCheck } from '@/hooks/useAuthCheck';

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const { loading: authLoading, userProfile } = useAuthCheck();
  const [profile, setProfile] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    // Detectar tab desde hash en URL
    const hash = window.location.hash.substring(1);
    const validTabs = ['info', 'edit', 'password', 'schedule'];
    
    // Solo agregar 'badges' si NO es expositor
    if (userProfile && userProfile.tipo !== 'expositor') {
      validTabs.push('badges');
    }
    
    if (hash && validTabs.includes(hash)) {
      setActiveTab(hash);
    } else if (hash === 'badges' && userProfile?.tipo === 'expositor') {
      // Si intenta acceder a badges siendo expositor, redirigir a info
      setActiveTab('info');
      window.location.hash = 'info';
    }
  }, [userProfile]);

  // Cargar perfil cuando userProfile esté disponible
  useEffect(() => {
    if (userProfile) {
      setProfile(userProfile);
    }
  }, [userProfile]);

  const loadProfile = async () => {
    try {
      setRefreshing(true);
      const data = await getUserProfile(EMPRESA_ID);
      
      if (!data) {
        console.error('No se encontró perfil');
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error al cargar perfil:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleProfileUpdate = () => {
    loadProfile();
  };

  // Actualizar hash cuando cambie el tab
  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation onRegisterClick={() => navigate('/registro')} />
        <div className="container mx-auto px-4 py-24 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-foreground/60">Verificando autenticación...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const userType = profile.tipo === 'expositor' ? 'Expositor' : 'Contacto';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation onRegisterClick={() => navigate('/registro')} />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-serif text-4xl font-bold text-foreground mb-2">
              Mi Perfil
            </h1>
            <p className="text-foreground/60">
              Tipo de usuario: <strong>{userType}</strong>
            </p>
          </div>

          {/* Tabs */}
          <Card className="bg-card border border-border">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className={`grid w-full ${profile.tipo === 'expositor' ? 'grid-cols-4' : 'grid-cols-5'} lg:w-auto lg:inline-grid`}>
                <TabsTrigger value="info" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Información</span>
                </TabsTrigger>
                {/* Solo mostrar Pases si NO es expositor */}
                {profile.tipo !== 'expositor' && (
                  <TabsTrigger value="badges" className="flex items-center gap-2">
                    <Ticket className="w-4 h-4" />
                    <span className="hidden sm:inline">Tus Pases</span>
                  </TabsTrigger>
                )}
                <TabsTrigger value="edit" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Editar Datos</span>
                </TabsTrigger>
                <TabsTrigger value="password" className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span className="hidden sm:inline">Contraseña</span>
                </TabsTrigger>
                <TabsTrigger value="schedule" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Disponibilidad</span>
                </TabsTrigger>
              </TabsList>

              <div className="p-6">
                {/* Información del Usuario */}
                <TabsContent value="info">
                  <ProfileInfo profile={profile} />
                </TabsContent>

                {/* Tus Pases - Solo para contactos */}
                {profile.tipo !== 'expositor' && (
                  <TabsContent value="badges">
                    <ProfileBadges profile={profile} />
                  </TabsContent>
                )}

                {/* Editar Datos */}
                <TabsContent value="edit">
                  <ProfileEdit 
                    profile={profile} 
                    onUpdate={handleProfileUpdate}
                    onCancel={() => setActiveTab('info')}
                  />
                </TabsContent>

                {/* Cambiar Contraseña */}
                <TabsContent value="password">
                  <ProfilePassword />
                </TabsContent>

                {/* Horario de Disponibilidad */}
                <TabsContent value="schedule">
                  <ProfileSchedule 
                    profile={profile}
                    onUpdate={handleProfileUpdate}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
