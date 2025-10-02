import { FormEvent, useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getExpositorData, updateExpositorData, uploadExpositorLogo, uploadExpositorGallery } from '@/lib/firebase';
import { CheckCircle2, Upload, X, Loader2 } from 'lucide-react';

const categoriaOptions = [
  { value: 'Alimentos y Bebidas', label: 'Alimentos y Bebidas' },
  { value: 'Tecnología', label: 'Tecnología' },
  { value: 'Servicios', label: 'Servicios' },
  { value: 'Mobiliario', label: 'Mobiliario' },
  { value: 'Decoración', label: 'Decoración' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Logística', label: 'Logística' },
  { value: 'Otro', label: 'Otro' },
] as const;

interface ExpositorData {
  id: string;
  nombre?: string;
  apellidos?: string;
  telefono?: string;
  email?: string;
  empresa?: string;
  categoria?: string;
  idStand?: string;
  sitioWeb?: string;
  direccion?: string;
  descripcion?: string;
  logoUrl?: string;
  imagenesGaleria?: string[];
  [key: string]: any;
}

export default function RegisterExpositorPage() {
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const expositorId = searchParams.get('expositor');
  const empresaId = import.meta.env.VITE_EMPRESA_ID || 'advance-medical-68626';

  const [formData, setFormData] = useState({
    empresa: '',
    categoria: '',
    idStand: '',
    sitioWeb: '',
    direccion: '',
    descripcion: '',
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    lada: '+52',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  const [galeriaPreviews, setGaleriaPreviews] = useState<string[]>([]);
  const [existingGaleria, setExistingGaleria] = useState<string[]>([]);

  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error' | 'loading'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [expositorData, setExpositorData] = useState<ExpositorData | null>(null);

  // Cargar datos del expositor
  useEffect(() => {
    const loadExpositorData = async () => {
      if (!expositorId) {
        setStatus('idle');
        return;
      }

      try {
        setStatus('loading');
        const data = await getExpositorData(empresaId, expositorId);
        
        if (data) {
          setExpositorData(data);
          setFormData({
            empresa: data.empresa || '',
            categoria: data.categoria || '',
            idStand: data.idStand || '',
            sitioWeb: data.sitioWeb || '',
            direccion: data.direccion || '',
            descripcion: data.descripcion || '',
            nombre: data.nombre || '',
            apellidos: data.apellidos || '',
            email: data.email || '',
            telefono: data.telefono || '',
            lada: data.lada || '+52',
          });
          setLogoPreview(data.logoUrl || '');
          setExistingGaleria(data.imagenesGaleria || []);
        }
        setStatus('idle');
      } catch (error) {
        console.error('Error al cargar datos del expositor:', error);
        setStatus('idle');
      }
    };

    loadExpositorData();
  }, [expositorId, empresaId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Por favor seleccione una imagen válida');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGaleriaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      setErrorMessage('Solo se permiten archivos de imagen');
      return;
    }

    setGaleriaFiles(prev => [...prev, ...imageFiles]);

    // Crear previews
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGaleriaPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGaleriaImage = (index: number) => {
    setGaleriaFiles(prev => prev.filter((_, i) => i !== index));
    setGaleriaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingGaleria(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!expositorId) {
      setErrorMessage('No se encontró el ID del expositor');
      return;
    }

    // Validaciones
    if (!formData.empresa || !formData.categoria || !formData.nombre || !formData.email) {
      setErrorMessage('Por favor complete todos los campos obligatorios');
      return;
    }

    setStatus('sending');
    setErrorMessage('');

    try {
      let logoUrl = logoPreview;
      
      // Subir logo si hay uno nuevo
      if (logoFile) {
        logoUrl = await uploadExpositorLogo(empresaId, expositorId, logoFile);
      }

      // Subir imágenes de galería
      const galeriaUrls = [...existingGaleria];
      if (galeriaFiles.length > 0) {
        const uploadedUrls = await uploadExpositorGallery(empresaId, expositorId, galeriaFiles);
        galeriaUrls.push(...uploadedUrls);
      }

      // Actualizar datos en Firestore
      await updateExpositorData(empresaId, expositorId, {
        ...formData,
        logoUrl,
        imagenesGaleria: galeriaUrls,
        fechaActualizacion: new Date().toISOString(),
        registroCompleto: true,
      });

      setStatus('success');
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      console.error('Error al enviar el formulario:', error);
      setErrorMessage('Hubo un error al enviar el formulario. Por favor intente nuevamente.');
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navigation onRegisterClick={() => {}} />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Cargando información...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navigation onRegisterClick={() => {}} />
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-2xl mx-auto p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Registro Completado!
            </h2>
            <p className="text-gray-600 mb-4">
              Gracias por completar tu información como expositor.
            </p>
            <p className="text-sm text-gray-500">
              Serás redirigido a la página principal en unos momentos...
            </p>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation onRegisterClick={() => {}} />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Registro de Expositor
            </h1>
            <p className="text-lg text-gray-600">
              Complete su información para participar en la Expo Empresarios de la Baja
            </p>
          </div>

          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Logo del Expositor */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Logo de la Empresa</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="logo">Logo (Cuadrado recomendado)</Label>
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Formato cuadrado recomendado (500x500px)
                    </p>
                  </div>
                  {logoPreview && (
                    <div className="mt-4">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Información de la Empresa */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Información de la Empresa</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="empresa">Nombre de la Empresa *</Label>
                    <Input
                      id="empresa"
                      value={formData.empresa}
                      onChange={(e) => handleInputChange('empresa', e.target.value)}
                      placeholder="Nombre de la empresa"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="categoria">Categoría *</Label>
                    <Select
                      value={formData.categoria}
                      onValueChange={(value) => handleInputChange('categoria', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriaOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="idStand">ID de Stand</Label>
                    <Input
                      id="idStand"
                      value={formData.idStand}
                      onChange={(e) => handleInputChange('idStand', e.target.value)}
                      placeholder="Ej: A-101"
                      disabled
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Será asignado por el organizador
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="sitioWeb">Sitio Web</Label>
                    <Input
                      id="sitioWeb"
                      type="url"
                      value={formData.sitioWeb}
                      onChange={(e) => handleInputChange('sitioWeb', e.target.value)}
                      placeholder="https://www.ejemplo.com"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="direccion">Dirección</Label>
                    <Textarea
                      id="direccion"
                      value={formData.direccion}
                      onChange={(e) => handleInputChange('direccion', e.target.value)}
                      placeholder="Dirección completa de la empresa"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Descripción</h3>
                <div>
                  <Label htmlFor="descripcion">Descripción de Productos/Servicios</Label>
                  <Textarea
                    id="descripcion"
                    value={formData.descripcion}
                    onChange={(e) => handleInputChange('descripcion', e.target.value)}
                    placeholder="Describa los productos o servicios que ofrece su empresa..."
                    rows={6}
                    maxLength={1000}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {formData.descripcion.length}/1000 caracteres
                  </p>
                </div>
              </div>

              {/* Galería de Imágenes */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Galería de Imágenes</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="galeria">Imágenes de Productos/Servicios</Label>
                    <Input
                      id="galeria"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGaleriaChange}
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Puede seleccionar múltiples imágenes
                    </p>
                  </div>

                  {/* Imágenes existentes */}
                  {existingGaleria.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Imágenes actuales:</p>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                        {existingGaleria.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Imagen ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeExistingImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Nuevas imágenes */}
                  {galeriaPreviews.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Nuevas imágenes:</p>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                        {galeriaPreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Nueva imagen ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border-2 border-blue-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeGaleriaImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Datos de Contacto */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Datos de Contacto</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="nombre">Nombre del Contacto *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => handleInputChange('nombre', e.target.value)}
                      placeholder="Nombre"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="apellidos">Apellidos *</Label>
                    <Input
                      id="apellidos"
                      value={formData.apellidos}
                      onChange={(e) => handleInputChange('apellidos', e.target.value)}
                      placeholder="Apellidos"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Correo Electrónico *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="correo@empresa.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="telefono">Teléfono *</Label>
                    <div className="flex gap-2">
                      <Select
                        value={formData.lada}
                        onValueChange={(value) => handleInputChange('lada', value)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="+52">+52</SelectItem>
                          <SelectItem value="+1">+1</SelectItem>
                          <SelectItem value="+34">+34</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="telefono"
                        type="tel"
                        value={formData.telefono}
                        onChange={(e) => handleInputChange('telefono', e.target.value)}
                        placeholder="1234567890"
                        required
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {errorMessage}
                </div>
              )}

              <div className="flex justify-center pt-4">
                <Button
                  type="submit"
                  disabled={status === 'sending'}
                  className="px-8 py-6 text-lg"
                >
                  {status === 'sending' ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Completar Registro'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
