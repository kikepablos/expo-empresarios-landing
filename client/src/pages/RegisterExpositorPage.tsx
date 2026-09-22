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
import { getExpositorData, updateExpositorData, uploadExpositorLogo, uploadExpositorGallery, createExpositorAccount, sendWelcomeEmail, crearSolicitudExpositor, enviarCorreoSolicitudEnRevisionExpositor } from '@/lib/firebase';
import { EMPRESA_ID, APP_CONFIG } from '@/config/constants';
import { CheckCircle2, Upload, X, Loader2, Eye, EyeOff } from 'lucide-react';
import { compressImage, compressImages, formatFileSize, needsCompression } from '@/utils/imageCompression';

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
  const empresaId = EMPRESA_ID;

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
    password: '',
    confirmPassword: '',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
  const [galeriaPreviews, setGaleriaPreviews] = useState<string[]>([]);
  const [existingGaleria, setExistingGaleria] = useState<string[]>([]);

  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error' | 'loading'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [expositorData, setExpositorData] = useState<ExpositorData | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressionMessage, setCompressionMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Cargar datos del expositor
  useEffect(() => {
    const loadExpositorData = async () => {
      console.log('🔍 Cargando datos del expositor...', { expositorId, empresaId });
      
      if (!expositorId) {
        console.log('⚠️ No hay expositorId en la URL');
        setStatus('idle');
        return;
      }

      try {
        setStatus('loading');
        console.log('📡 Consultando Firestore...');
        const data = await getExpositorData(empresaId, expositorId);
        
        console.log('📦 Datos recibidos:', data);
        
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
            password: '',
            confirmPassword: '',
          });
          
          // Cargar logo si existe
          if (data.logoUrl) {
            console.log('🖼️ Logo encontrado:', data.logoUrl);
            setLogoPreview(data.logoUrl);
          } else {
            console.log('⚠️ No se encontró logo');
          }
          
          // Cargar galería si existe
          if (data.imagenesGaleria && data.imagenesGaleria.length > 0) {
            console.log('📷 Imágenes de galería encontradas:', data.imagenesGaleria.length);
            setExistingGaleria(data.imagenesGaleria);
          } else {
            console.log('⚠️ No se encontraron imágenes de galería');
          }
          
          console.log('✅ Datos cargados exitosamente');
        } else {
          console.log('❌ No se encontraron datos para este expositor');
        }
        setStatus('idle');
      } catch (error) {
        console.error('❌ Error al cargar datos del expositor:', error);
        setStatus('idle');
      }
    };

    loadExpositorData();
  }, [expositorId, empresaId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor seleccione una imagen válida');
      return;
    }

    try {
      setCompressing(true);
      
      // Verificar si necesita compresión
      if (needsCompression(file, 1)) {
        setCompressionMessage(`Comprimiendo logo (${formatFileSize(file.size)})...`);
        const compressedFile = await compressImage(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 800,
          quality: 0.85,
        });
        setLogoFile(compressedFile);
        
        // Crear preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoPreview(reader.result as string);
          setCompressionMessage('');
        };
        reader.readAsDataURL(compressedFile);
      } else {
        // No necesita compresión
        setLogoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Error al procesar logo:', error);
      setErrorMessage('Error al procesar la imagen');
    } finally {
      setCompressing(false);
    }
  };

  const handleGaleriaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      setErrorMessage('Solo se permiten archivos de imagen');
      return;
    }

    if (imageFiles.length === 0) return;

    try {
      setCompressing(true);
      setCompressionMessage(`Procesando ${imageFiles.length} imagen${imageFiles.length > 1 ? 'es' : ''}...`);

      // Verificar si alguna imagen necesita compresión
      const needsCompress = imageFiles.some(file => needsCompression(file, 1));

      let processedFiles = imageFiles;
      
      if (needsCompress) {
        setCompressionMessage(`Comprimiendo ${imageFiles.length} imagen${imageFiles.length > 1 ? 'es' : ''}...`);
        processedFiles = await compressImages(imageFiles, {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          quality: 0.8,
        });
      }

      // Agregar archivos procesados
      setGaleriaFiles(prev => [...prev, ...processedFiles]);

      // Crear previews
      processedFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setGaleriaPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });

      setCompressionMessage('');
    } catch (error) {
      console.error('Error al procesar imágenes:', error);
      setErrorMessage('Error al procesar las imágenes');
    } finally {
      setCompressing(false);
    }
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

    // Validaciones básicas
    if (!formData.empresa || !formData.categoria || !formData.nombre || !formData.email) {
      setErrorMessage('Por favor complete todos los campos obligatorios');
      return;
    }

    setStatus('sending');
    setErrorMessage('');

    try {
      // FLUJO 1: CON INVITACIÓN (expositorId existe)
      if (expositorId) {
        console.log('📝 Iniciando registro CON invitación...');

        // Validar contraseña
        if (!formData.password || formData.password.length < 6) {
          setErrorMessage('La contraseña debe tener al menos 6 caracteres');
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setErrorMessage('Las contraseñas no coinciden');
          return;
        }

        // 1. Crear cuenta de Firebase Auth
        console.log('🔐 Creando cuenta de autenticación...');
        const authResult = await createExpositorAccount(formData.email, formData.password);
        const userUid = authResult.uid;
        console.log('✅ Cuenta creada con UID:', userUid);

        // 2. Subir logo si hay uno nuevo
        let logoUrl = logoPreview;
        if (logoFile) {
          console.log('📤 Subiendo logo...');
          logoUrl = await uploadExpositorLogo(empresaId, expositorId, logoFile);
        }

        // 3. Subir imágenes de galería
        const galeriaUrls = [...existingGaleria];
        if (galeriaFiles.length > 0) {
          console.log('📤 Subiendo', galeriaFiles.length, 'imágenes de galería...');
          const uploadedUrls = await uploadExpositorGallery(empresaId, expositorId, galeriaFiles);
          galeriaUrls.push(...uploadedUrls);
        }

        // 4. Preparar datos (sin contraseñas)
        const { password, confirmPassword, ...expositorDataClean } = formData;

        // 5. Actualizar datos en Firestore con UID
        console.log('💾 Guardando datos en Firestore...');
        await updateExpositorData(empresaId, expositorId, {
          ...expositorDataClean,
          logoUrl,
          imagenesGaleria: galeriaUrls,
          userUid, // Guardar UID del usuario
          fechaActualizacion: new Date().toISOString(),
          registroCompleto: true,
          status: 'Confirmado',
        });

        // 6. Enviar correo de bienvenida
        console.log('📧 Enviando correo de bienvenida...');
        // Con protocolo: sin https:// el enlace del correo no es clickeable en varios clientes
        const dashboardUrl = `https://${APP_CONFIG.urls.landing}`;
        await sendWelcomeEmail(
          formData.email,
          formData.nombre,
          formData.empresa,
          dashboardUrl + '/login'
        );
        console.log('✅ Correo de bienvenida enviado');

        setStatus('success');
        
        // Esperar 2 segundos para mostrar el mensaje de éxito
        // setTimeout(() => {
        //   // Redirigir a Mi Perfil (ya está autenticado porque createExpositorAccount hace login)
        //   navigate('/perfil');
        // }, 2000);
      } 
      // FLUJO 2: SIN INVITACIÓN (solicitud nueva)
      else {
        console.log('📝 Iniciando solicitud SIN invitación...');

        // NO crear cuenta, NO validar contraseña
        // Preparar datos (sin contraseñas)
        const { password, confirmPassword, ...expositorDataClean } = formData;

        // Crear solicitud en estado "Pendiente"
        console.log('💾 Creando solicitud de expositor...');
        await crearSolicitudExpositor(empresaId, expositorDataClean, {
          logo: logoFile,
          galeria: galeriaFiles,
        });

        // Enviar correo de solicitud en revisión
        console.log('📧 Enviando correo de solicitud en revisión...');
        await enviarCorreoSolicitudEnRevisionExpositor(
          formData.email,
          formData.nombre,
          formData.empresa
        );
        console.log('✅ Correo de solicitud enviado');

        setStatus('success');
        setTimeout(() => {
          navigate('/');
        }, 3000);
      }
    } catch (error: any) {
      console.error('❌ Error al enviar el formulario:', error);
      
      // Mostrar mensaje de error específico
      const errorMsg = error?.message || 'Hubo un error al enviar el formulario. Por favor intente nuevamente.';
      setErrorMessage(errorMsg);
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation onRegisterClick={() => navigate('/registro')} />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-foreground/80">Cargando información...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navigation onRegisterClick={() => navigate('/registro')} />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[80vh]">
          <Card className="max-w-2xl w-full bg-[#0b0b0b] border border-border p-8">
            <div className="text-center mb-6">
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-foreground mb-2">
                ¡Registro Completado Exitosamente!
              </h2>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-foreground/80 text-center">
                Gracias por completar tu información, <strong>{formData.nombre}</strong>.
              </p>

              <div className="bg-primary/10 border border-primary/30 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {expositorId ? '✨ Tu cuenta ha sido creada' : '📋 Solicitud enviada'}
                </h3>
                <ul className="text-sm text-foreground/80 space-y-2 text-left">
                  {expositorId ? (
                    <>
                      <li>✅ Cuenta de acceso configurada</li>
                      <li>✅ Información de expositor guardada</li>
                      <li>✅ Correo de bienvenida enviado a <strong>{formData.email}</strong></li>
                    </>
                  ) : (
                    <>
                      <li>✅ Solicitud recibida</li>
                      <li>✅ Información guardada</li>
                      <li>✅ Correo de confirmación enviado a <strong>{formData.email}</strong></li>
                    </>
                  )}
                </ul>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-sm text-foreground/70 mb-2">
                  {expositorId ? (
                    <>🎉 <strong>Ya puedes acceder a tu perfil</strong> y gestionar tu información</>
                  ) : (
                    <>📧 <strong>Revisa tu correo</strong> para más detalles sobre el proceso de aprobación</>
                  )}
                </p>
              </div>

              <p className="text-center text-sm text-foreground/60">
                Redirigiendo en unos segundos...
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => navigate(expositorId ? '/mi-perfil' : '/')}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-6"
              >
                {expositorId ? '🚀 Ir a Mi Perfil' : '🏠 Volver al Inicio'}
              </Button>
            </div>
          </Card>
        </div>
        <Footer />
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
              src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&fit=crop"
              alt="Registro Expositor"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/70" />
          </div>
          <div className="relative container mx-auto px-4 py-24 text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4">
              Registro de Expositor
            </h1>
            <p className="max-w-2xl mx-auto text-foreground/90">
              Complete su información para participar en la Expo Empresarios de la Baja
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 mt-12">
          <div className="grid lg:grid-cols-[2fr_1fr] gap-10 items-start">
            <Card className="bg-[#0b0b0b] border border-border shadow-xl">
              <form className="p-8 space-y-8" onSubmit={handleSubmit}>
              {/* Logo del Expositor */}
              <div>
                <h3 className="text-xl font-semibold mb-4">Logo de la Empresa</h3>
                <div className="space-y-4">
                  {logoPreview && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-foreground/80 mb-2">Logo actual:</p>
                      <img
                        src={logoPreview}
                        alt="Logo actual"
                        className="w-40 h-40 object-cover rounded-lg border-2 border-primary/50 shadow-lg"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="logo">{logoPreview ? 'Cambiar Logo (Opcional)' : 'Logo (Cuadrado recomendado)'}</Label>
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="mt-1"
                      disabled={compressing}
                    />
                    {compressing && compressionMessage && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-primary">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{compressionMessage}</span>
                      </div>
                    )}
                    <p className="text-sm text-foreground/60 mt-1">
                      Formato cuadrado recomendado (500x500px). Las imágenes grandes se comprimirán automáticamente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Información de la Empresa */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">Información de la Empresa</h3>
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
                    <p className="text-sm text-foreground/60 mt-1">
                      Será asignado por el organizador
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="sitioWeb">Sitio Web</Label>
                    <Input
                      id="sitioWeb"
                      type="text"
                      value={formData.sitioWeb}
                      onChange={(e) => handleInputChange('sitioWeb', e.target.value)}
                      placeholder="https://www.ejemplo.com"
                    />
                    <p className="text-sm text-foreground/60 mt-1">
                      Opcional - Incluye https:// si tienes uno
                    </p>
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
                <h3 className="text-xl font-semibold mb-4 text-foreground">Descripción</h3>
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
                  <p className="text-sm text-foreground/60 mt-1">
                    {formData.descripcion.length}/1000 caracteres
                  </p>
                </div>
              </div>

              {/* Galería de Imágenes */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">Galería de Imágenes</h3>
                <div className="space-y-4">
                  {/* Imágenes existentes */}
                  {existingGaleria.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-foreground/80 mb-3">Imágenes actuales ({existingGaleria.length}):</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {existingGaleria.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Imagen ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border-2 border-border"
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
                    <div className="mb-4">
                      <p className="text-sm font-medium text-foreground/80 mb-3">Nuevas imágenes a agregar ({galeriaPreviews.length}):</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {galeriaPreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Nueva imagen ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border-2 border-primary/50"
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

                  <div>
                    <Label htmlFor="galeria">
                      {existingGaleria.length > 0 || galeriaPreviews.length > 0 
                        ? 'Agregar más imágenes (Opcional)' 
                        : 'Imágenes de Productos/Servicios'}
                    </Label>
                    <Input
                      id="galeria"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGaleriaChange}
                      className="mt-1"
                      disabled={compressing}
                    />
                    {compressing && compressionMessage && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-primary">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{compressionMessage}</span>
                      </div>
                    )}
                    <p className="text-sm text-foreground/60 mt-1">
                      Puede seleccionar múltiples imágenes. Las imágenes grandes se comprimirán automáticamente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Datos de Contacto */}
              <div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">Datos de Contacto</h3>
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

              {/* Seguridad de la Cuenta */}
              {/* Mostrar campos de contraseña solo si hay invitación */}
              {expositorId && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-foreground">Seguridad de la Cuenta</h3>
                  <p className="text-sm text-foreground/60 mb-4">
                    Crea una contraseña para acceder a tu cuenta y gestionar tu información
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="password">Contraseña *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          required
                          minLength={6}
                          className="mt-1 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-sm text-foreground/60 mt-1">
                        Mínimo 6 caracteres
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          placeholder="Repite tu contraseña"
                          required
                          minLength={6}
                          className="mt-1 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground transition-colors"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <p className="text-sm text-red-500 mt-1">
                          Las contraseñas no coinciden
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="bg-red-950/50 border border-red-800 text-red-400 px-4 py-3 rounded-lg">
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

          {/* Panel Lateral */}
          <div className="space-y-6">
            <Card className="bg-[#0b0b0b] border border-border p-6">
              <h3 className="text-lg font-semibold text-primary mb-4">
                Información del Evento
              </h3>
              <div className="space-y-3 text-sm text-foreground/80">
                <p className="flex items-start gap-2">
                  <span className="text-primary">📅</span>
                  <span>Viernes 21 de noviembre 2025</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary">📍</span>
                  <span>Hotel Krystal Grand Los Cabos</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary">🎯</span>
                  <span>Más de 600 ejecutivos esperados</span>
                </p>
              </div>
            </Card>

            <Card className="bg-[#0b0b0b] border border-border p-6">
              <h3 className="text-lg font-semibold text-primary mb-4">
                Beneficios para Expositores
              </h3>
              <ul className="space-y-2 text-sm text-foreground/80">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>Stand personalizado en la expo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>Visibilidad ante más de 600 ejecutivos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>Perfil en el catálogo digital</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-1">✓</span>
                  <span>Oportunidades de networking</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </section>
    </main>

      <Footer />
    </div>
  );
}
