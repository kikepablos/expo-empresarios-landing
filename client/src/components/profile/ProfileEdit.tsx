import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateUserProfile, uploadExpositorLogo, uploadExpositorGallery, deleteImageFromStorage } from '@/lib/firebase';
import { EMPRESA_ID } from '@/config/constants';
import { Loader2, Save, X, Upload, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfileEditProps {
  profile: any;
  onUpdate: () => void;
  onCancel: () => void;
}

const categoriaOptions = [
  { value: 'Alimentos y Bebidas', label: 'Alimentos y Bebidas' },
  { value: 'Tecnología', label: 'Tecnología' },
  { value: 'Servicios', label: 'Servicios' },
  { value: 'Mobiliario', label: 'Mobiliario' },
  { value: 'Decoración', label: 'Decoración' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Construcción', label: 'Construcción' },
  { value: 'Salud', label: 'Salud' },
  { value: 'Educación', label: 'Educación' },
  { value: 'Otro', label: 'Otro' },
];

export default function ProfileEdit({ profile, onUpdate, onCancel }: ProfileEditProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>(profile.logoUrl || '');
  const [galleryImages, setGalleryImages] = useState<string[]>(profile.imagenesGaleria || []);
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [deletingImageUrl, setDeletingImageUrl] = useState<string | null>(null);
  
  const isExpositor = profile.tipo === 'expositor';

  const [formData, setFormData] = useState({
    nombre: profile.nombre || '',
    apellidos: profile.apellidos || '',
    email: profile.email || '',
    telefono: profile.telefono || '',
    lada: profile.lada || '+52',
    empresa: profile.empresa || '',
    puesto: profile.puesto || '',
    direccion: profile.direccion || '',
    categoria: profile.categoria || '',
    sitioWeb: profile.sitioWeb || '',
    idStand: profile.idStand || '',
    descripcion: profile.descripcion || '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setNewGalleryFiles(prev => [...prev, ...files]);
    }
  };

  const handleRemoveNewGalleryFile = (index: number) => {
    setNewGalleryFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingImage = async (imageUrl: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta imagen?')) {
      return;
    }

    setDeletingImageUrl(imageUrl);
    try {
      await deleteImageFromStorage(imageUrl);
      setGalleryImages(prev => prev.filter(url => url !== imageUrl));
      
      toast({
        title: 'Imagen eliminada',
        description: 'La imagen ha sido eliminada exitosamente.',
      });
    } catch (error) {
      console.error('Error al eliminar imagen:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la imagen',
        variant: 'destructive',
      });
    } finally {
      setDeletingImageUrl(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let logoUrl = profile.logoUrl;
      let updatedGalleryImages = [...galleryImages];

      // Subir nuevo logo si hay uno
      if (logoFile && isExpositor) {
        logoUrl = await uploadExpositorLogo(EMPRESA_ID, profile.id, logoFile);
      }

      // Subir nuevas imágenes de galería
      if (newGalleryFiles.length > 0 && isExpositor) {
        const newUrls = await uploadExpositorGallery(EMPRESA_ID, profile.id, newGalleryFiles);
        updatedGalleryImages = [...updatedGalleryImages, ...newUrls];
      }

      // Preparar datos según tipo de usuario
      const dataToUpdate: any = {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        email: formData.email,
        telefono: formData.telefono,
        lada: formData.lada,
        empresa: formData.empresa,
      };

      if (isExpositor) {
        dataToUpdate.categoria = formData.categoria;
        dataToUpdate.direccion = formData.direccion;
        dataToUpdate.sitioWeb = formData.sitioWeb;
        dataToUpdate.idStand = formData.idStand;
        dataToUpdate.descripcion = formData.descripcion;
        dataToUpdate.imagenesGaleria = updatedGalleryImages;
        if (logoUrl) {
          dataToUpdate.logoUrl = logoUrl;
        }
      } else {
        dataToUpdate.puesto = formData.puesto;
        if (formData.direccion) {
          dataToUpdate.direccion = formData.direccion;
        }
      }

      await updateUserProfile(EMPRESA_ID, profile.id, profile.tipo, dataToUpdate);

      toast({
        title: '¡Perfil actualizado!',
        description: 'Tus datos han sido guardados exitosamente.',
      });

      onUpdate();
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el perfil',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        Editar Información
      </h2>

      {/* Logo (solo expositores) */}
      {isExpositor && (
        <div className="mb-6">
          <Label>Logo de la Empresa</Label>
          <div className="mt-2 flex items-center gap-4">
            {logoPreview && (
              <div className="w-24 h-24 rounded-lg border-2 border-border overflow-hidden bg-card p-2">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div>
              <Input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="max-w-xs"
              />
              <p className="text-sm text-foreground/60 mt-1">
                Formatos: JPG, PNG. Tamaño recomendado: 500x500px
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Información Básica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="nombre">Nombre *</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => handleInputChange('nombre', e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="apellidos">Apellidos *</Label>
          <Input
            id="apellidos"
            value={formData.apellidos}
            onChange={(e) => handleInputChange('apellidos', e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="email">Correo Electrónico *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="telefono">Teléfono *</Label>
          <div className="flex gap-2">
            <Select
              value={formData.lada}
              onValueChange={(value) => handleInputChange('lada', value)}
              disabled={loading}
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
              disabled={loading}
              className="flex-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="empresa">{isExpositor ? 'Empresa' : 'Empresa/Organización'} *</Label>
          <Input
            id="empresa"
            value={formData.empresa}
            onChange={(e) => handleInputChange('empresa', e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {/* Puesto (solo contactos) */}
        {!isExpositor && (
          <div>
            <Label htmlFor="puesto">Puesto</Label>
            <Input
              id="puesto"
              value={formData.puesto}
              onChange={(e) => handleInputChange('puesto', e.target.value)}
              disabled={loading}
            />
          </div>
        )}

        {/* Categoría (solo expositores) */}
        {isExpositor && (
          <div>
            <Label htmlFor="categoria">Categoría *</Label>
            <Select
              value={formData.categoria}
              onValueChange={(value) => handleInputChange('categoria', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categoriaOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* ID Stand (solo expositores) */}
        {isExpositor && (
          <div>
            <Label htmlFor="idStand">ID de Stand</Label>
            <Input
              id="idStand"
              value={formData.idStand}
              onChange={(e) => handleInputChange('idStand', e.target.value)}
              disabled={loading}
            />
          </div>
        )}

        {/* Sitio Web (solo expositores) */}
        {isExpositor && (
          <div>
            <Label htmlFor="sitioWeb">Sitio Web</Label>
            <Input
              id="sitioWeb"
              type="url"
              value={formData.sitioWeb}
              onChange={(e) => handleInputChange('sitioWeb', e.target.value)}
              placeholder="www.ejemplo.com"
              disabled={loading}
            />
          </div>
        )}
      </div>

      {/* Dirección */}
      <div>
        <Label htmlFor="direccion">Dirección</Label>
        <Input
          id="direccion"
          value={formData.direccion}
          onChange={(e) => handleInputChange('direccion', e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Descripción (solo expositores) */}
      {isExpositor && (
        <div>
          <Label htmlFor="descripcion">Descripción de la Empresa</Label>
          <Textarea
            id="descripcion"
            value={formData.descripcion}
            onChange={(e) => handleInputChange('descripcion', e.target.value)}
            rows={5}
            disabled={loading}
            placeholder="Describe los productos o servicios que ofrece tu empresa..."
          />
        </div>
      )}

      {/* Galería de Imágenes (solo expositores) */}
      {isExpositor && (
        <div className="space-y-4">
          <div>
            <Label>Galería de Imágenes</Label>
            <p className="text-sm text-foreground/60 mt-1 mb-3">
              Imágenes de tus productos o servicios (máximo recomendado: 10 imágenes)
            </p>
          </div>

          {/* Imágenes existentes */}
          {galleryImages.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">
                Imágenes actuales ({galleryImages.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {galleryImages.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-card border-2 border-border rounded-lg overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={`Imagen ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteExistingImage(imageUrl)}
                      disabled={loading || deletingImageUrl === imageUrl}
                    >
                      {deletingImageUrl === imageUrl ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nuevas imágenes a subir */}
          {newGalleryFiles.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3 text-green-600">
                Nuevas imágenes a subir ({newGalleryFiles.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {newGalleryFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-card border-2 border-green-500 rounded-lg overflow-hidden">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Nueva ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveNewGalleryFile(index)}
                      disabled={loading}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botón para agregar más imágenes */}
          <div>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryFilesChange}
              disabled={loading}
              className="hidden"
              id="gallery-input"
            />
            <Label
              htmlFor="gallery-input"
              className="inline-flex items-center justify-center px-4 py-2 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar más imágenes
            </Label>
            <p className="text-xs text-foreground/60 mt-2">
              Puedes seleccionar múltiples imágenes a la vez
            </p>
          </div>
        </div>
      )}

      {/* Botones */}
      <div className="flex gap-4 justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
