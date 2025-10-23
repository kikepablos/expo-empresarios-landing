import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EMPRESA_ID } from '@/config/constants';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import { 
  Loader2, 
  Search, 
  Filter, 
  Download, 
  UserPlus, 
  Mail, 
  Phone, 
  Building2,
  CheckSquare,
  Square,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import * as XLSX from 'xlsx';

export default function MisContactosPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { loading: authLoading, userProfile } = useAuthCheck();
  const [contactos, setContactos] = useState<any[]>([]);
  const [filteredContactos, setFilteredContactos] = useState<any[]>([]);
  const [selectedContactos, setSelectedContactos] = useState<Set<string>>(new Set());
  
  // Filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterInteres, setFilterInteres] = useState<string>('todos');

  useEffect(() => {
    if (userProfile) {
      loadContactos();
    }
  }, [userProfile]);

  useEffect(() => {
    applyFilters();
  }, [contactos, searchTerm, filterTipo, filterInteres]);

  const loadContactos = async () => {
    if (!userProfile) return;
    
    try {
      // Cargar contactos del usuario
      const userCollection = userProfile.tipo === 'expositor' ? 'expositores' : 'contactos';
      const contactosRef = collection(
        db,
        `empresas/${EMPRESA_ID}/${userCollection}/${userProfile.id}/contactos`
      );
      
      const snapshot = await getDocs(contactosRef);
      const contactosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setContactos(contactosData);
    } catch (error) {
      console.error('Error al cargar contactos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los contactos',
        variant: 'destructive',
      });
    }
  };

  const applyFilters = () => {
    let filtered = [...contactos];

    // Filtro de búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(contacto =>
        contacto.nombre?.toLowerCase().includes(search) ||
        contacto.apellidos?.toLowerCase().includes(search) ||
        contacto.email?.toLowerCase().includes(search) ||
        contacto.empresa?.toLowerCase().includes(search)
      );
    }

    // Filtro por tipo
    if (filterTipo !== 'todos') {
      filtered = filtered.filter(contacto => contacto.tipoContacto === filterTipo);
    }

    // Filtro por interés
    if (filterInteres !== 'todos') {
      filtered = filtered.filter(contacto => 
        contacto.interes?.toLowerCase() === filterInteres.toLowerCase()
      );
    }

    setFilteredContactos(filtered);
  };

  const toggleSelectContacto = (contactoId: string) => {
    const newSelected = new Set(selectedContactos);
    if (newSelected.has(contactoId)) {
      newSelected.delete(contactoId);
    } else {
      newSelected.add(contactoId);
    }
    setSelectedContactos(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedContactos.size === filteredContactos.length) {
      setSelectedContactos(new Set());
    } else {
      setSelectedContactos(new Set(filteredContactos.map(c => c.id)));
    }
  };

  const exportToExcel = (exportAll: boolean = false) => {
    const contactosToExport = exportAll 
      ? filteredContactos 
      : filteredContactos.filter(c => selectedContactos.has(c.id));

    if (contactosToExport.length === 0) {
      toast({
        title: 'Aviso',
        description: 'No hay contactos para exportar',
        variant: 'destructive',
      });
      return;
    }

    // Preparar datos para Excel
    const excelData = contactosToExport.map(contacto => ({
      'Nombre': contacto.nombre || '',
      'Apellidos': contacto.apellidos || '',
      'Email': contacto.email || '',
      'Teléfono': contacto.telefono || '',
      'Empresa': contacto.empresa || '',
      'Puesto': contacto.puesto || '',
      'Tipo': contacto.tipoContacto || '',
      'Nivel de Interés': contacto.interes || '',
      'Notas': contacto.notas || '',
      'Fecha de Registro': contacto.fechaRegistro 
        ? new Date(contacto.fechaRegistro).toLocaleDateString('es-ES')
        : '',
    }));

    // Crear libro de Excel
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contactos');

    // Ajustar ancho de columnas
    const colWidths = [
      { wch: 15 }, // Nombre
      { wch: 15 }, // Apellidos
      { wch: 25 }, // Email
      { wch: 15 }, // Teléfono
      { wch: 20 }, // Empresa
      { wch: 20 }, // Puesto
      { wch: 12 }, // Tipo
      { wch: 15 }, // Interés
      { wch: 30 }, // Notas
      { wch: 15 }, // Fecha
    ];
    ws['!cols'] = colWidths;

    // Descargar archivo
    const fileName = `mis_contactos_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: '¡Descarga exitosa!',
      description: `Se exportaron ${contactosToExport.length} contactos`,
    });
  };

  if (authLoading || !userProfile) {
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation onRegisterClick={() => navigate('/registro')} />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-serif text-4xl font-bold text-foreground mb-2">
              Mis Contactos
            </h1>
            <p className="text-foreground/60">
              Gestiona y organiza todos tus contactos de la expo
            </p>
          </div>

          {/* Filtros y Acciones */}
          <Card className="bg-card border border-border p-6 mb-6">
            <div className="space-y-4">
              {/* Búsqueda */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/60" />
                  <Input
                    type="text"
                    placeholder="Buscar por nombre, email o empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filtros */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Select value={filterTipo} onValueChange={setFilterTipo}>
                    <SelectTrigger>
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Tipo de contacto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los tipos</SelectItem>
                      <SelectItem value="invitado">Invitados</SelectItem>
                      <SelectItem value="expositor">Expositores</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Select value={filterInteres} onValueChange={setFilterInteres}>
                    <SelectTrigger>
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Nivel de interés" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los niveles</SelectItem>
                      <SelectItem value="alto">Alto</SelectItem>
                      <SelectItem value="medio">Medio</SelectItem>
                      <SelectItem value="bajo">Bajo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex flex-col md:flex-row gap-3 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={toggleSelectAll}
                  className="flex-1 md:flex-initial"
                >
                  {selectedContactos.size === filteredContactos.length ? (
                    <>
                      <Square className="w-4 h-4 mr-2" />
                      Deseleccionar Todo
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Seleccionar Todo
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => exportToExcel(false)}
                  disabled={selectedContactos.size === 0}
                  className="flex-1 md:flex-initial"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Seleccionados ({selectedContactos.size})
                </Button>

                <Button
                  onClick={() => exportToExcel(true)}
                  disabled={filteredContactos.length === 0}
                  className="flex-1 md:flex-initial bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Todos ({filteredContactos.length})
                </Button>
              </div>
            </div>
          </Card>

          {/* Lista de Contactos */}
          {filteredContactos.length === 0 ? (
            <Card className="bg-card border border-border p-12 text-center">
              <UserPlus className="w-16 h-16 text-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No hay contactos
              </h3>
              <p className="text-foreground/60 mb-6">
                {searchTerm || filterTipo !== 'todos' || filterInteres !== 'todos'
                  ? 'No se encontraron contactos con los filtros aplicados'
                  : 'Aún no has registrado ningún contacto'}
              </p>
              {searchTerm || filterTipo !== 'todos' || filterInteres !== 'todos' ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterTipo('todos');
                    setFilterInteres('todos');
                  }}
                >
                  Limpiar Filtros
                </Button>
              ) : null}
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredContactos.map((contacto) => (
                <Card
                  key={contacto.id}
                  className="bg-card border border-border p-6 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <div className="pt-1">
                      <Checkbox
                        checked={selectedContactos.has(contacto.id)}
                        onCheckedChange={() => toggleSelectContacto(contacto.id)}
                      />
                    </div>

                    {/* Información del Contacto */}
                    <div className="flex-1 grid md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          {contacto.nombre} {contacto.apellidos}
                        </h3>
                        
                        {contacto.email && (
                          <div className="flex items-center gap-2 text-sm text-foreground/70 mb-1">
                            <Mail className="w-4 h-4" />
                            <span>{contacto.email}</span>
                          </div>
                        )}
                        
                        {contacto.telefono && (
                          <div className="flex items-center gap-2 text-sm text-foreground/70 mb-1">
                            <Phone className="w-4 h-4" />
                            <span>{contacto.telefono}</span>
                          </div>
                        )}
                        
                        {contacto.empresa && (
                          <div className="flex items-center gap-2 text-sm text-foreground/70">
                            <Building2 className="w-4 h-4" />
                            <span>{contacto.empresa} {contacto.puesto && `- ${contacto.puesto}`}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        {contacto.tipoContacto && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                              {contacto.tipoContacto === 'expositor' ? 'Expositor' : 'Invitado'}
                            </span>
                          </div>
                        )}
                        
                        {contacto.interes && (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              contacto.interes.toLowerCase() === 'alto'
                                ? 'bg-green-500/10 text-green-600'
                                : contacto.interes.toLowerCase() === 'medio'
                                ? 'bg-yellow-500/10 text-yellow-600'
                                : 'bg-gray-500/10 text-gray-600'
                            }`}>
                              Interés: {contacto.interes}
                            </span>
                          </div>
                        )}
                        
                        {contacto.notas && (
                          <p className="text-sm text-foreground/60 line-clamp-2">
                            {contacto.notas}
                          </p>
                        )}
                        
                        {contacto.fechaRegistro && (
                          <p className="text-xs text-foreground/40">
                            Registrado: {new Date(contacto.fechaRegistro).toLocaleDateString('es-ES')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Botón Ver Detalle */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Navegar al perfil del contacto
                        const tipoRuta = contacto.tipo === 'expositor' ? 'expositor' : 'invitado';
                        navigate(`/${tipoRuta}/${contacto.contactoId}`);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Perfil
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
