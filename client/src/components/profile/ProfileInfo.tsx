import { Mail, Phone, MapPin, Building2, Briefcase, User, Globe, Calendar } from 'lucide-react';

interface ProfileInfoProps {
  profile: any;
}

export default function ProfileInfo({ profile }: ProfileInfoProps) {
  const isExpositor = profile.tipo === 'expositor';

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        Información Personal
      </h2>

      {/* Logo/Avatar para expositores */}
      {isExpositor && profile.logoUrl && (
        <div className="flex justify-center mb-8">
          <div className="w-32 h-32 rounded-lg border-2 border-border overflow-hidden bg-card p-4">
            <img
              src={profile.logoUrl}
              alt={profile.empresa}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Grid de información */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nombre */}
        <InfoField
          icon={<User className="w-5 h-5 text-primary" />}
          label="Nombre Completo"
          value={`${profile.nombre || ''} ${profile.apellidos || ''}`.trim() || 'No especificado'}
        />

        {/* Email */}
        <InfoField
          icon={<Mail className="w-5 h-5 text-primary" />}
          label="Correo Electrónico"
          value={profile.email || 'No especificado'}
        />

        {/* Teléfono */}
        <InfoField
          icon={<Phone className="w-5 h-5 text-primary" />}
          label="Teléfono"
          value={profile.telefono ? `${profile.lada || ''} ${profile.telefono}`.trim() : 'No especificado'}
        />

        {/* Empresa */}
        <InfoField
          icon={<Building2 className="w-5 h-5 text-primary" />}
          label={isExpositor ? 'Empresa' : 'Empresa/Organización'}
          value={profile.empresa || 'No especificado'}
        />

        {/* Puesto (solo contactos) */}
        {!isExpositor && (
          <InfoField
            icon={<Briefcase className="w-5 h-5 text-primary" />}
            label="Puesto"
            value={profile.puesto || 'No especificado'}
          />
        )}

        {/* Categoría (solo expositores) */}
        {isExpositor && profile.categoria && (
          <InfoField
            icon={<Briefcase className="w-5 h-5 text-primary" />}
            label="Categoría"
            value={profile.categoria}
          />
        )}

        {/* Dirección */}
        {profile.direccion && (
          <InfoField
            icon={<MapPin className="w-5 h-5 text-primary" />}
            label="Dirección"
            value={profile.direccion}
            fullWidth
          />
        )}

        {/* Sitio Web (solo expositores) */}
        {isExpositor && profile.sitioWeb && (
          <InfoField
            icon={<Globe className="w-5 h-5 text-primary" />}
            label="Sitio Web"
            value={profile.sitioWeb}
            isLink
          />
        )}

        {/* ID de Stand (solo expositores) */}
        {isExpositor && profile.idStand && (
          <InfoField
            icon={<Building2 className="w-5 h-5 text-primary" />}
            label="ID de Stand"
            value={profile.idStand}
          />
        )}

        {/* Estado */}
        <InfoField
          icon={<Calendar className="w-5 h-5 text-primary" />}
          label="Estado"
          value={
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              profile.status === 'Completado' || profile.status === 'Confirmado'
                ? 'bg-green-500/20 text-green-500'
                : profile.status === 'Activo'
                ? 'bg-blue-500/20 text-blue-500'
                : profile.status === 'Pendiente'
                ? 'bg-yellow-500/20 text-yellow-500'
                : 'bg-gray-500/20 text-gray-500'
            }`}>
              {profile.status || 'No especificado'}
            </span>
          }
        />
      </div>

      {/* Descripción (solo expositores) */}
      {isExpositor && profile.descripcion && (
        <div className="mt-6 p-6 bg-muted/50 rounded-lg">
          <h3 className="text-lg font-semibold text-foreground mb-3">
            Descripción de la Empresa
          </h3>
          <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">
            {profile.descripcion}
          </p>
        </div>
      )}

      {/* Información del Acompañante (solo contactos con acompañante) */}
      {!isExpositor && profile.invitadoAcompanante && (
        <div className="mt-6 p-6 bg-muted/50 rounded-lg">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Información del Acompañante
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField
              icon={<User className="w-5 h-5 text-primary" />}
              label="Nombre"
              value={`${profile.invitadoAcompanante.nombre || ''} ${profile.invitadoAcompanante.apellidos || ''}`.trim()}
            />
            <InfoField
              icon={<Mail className="w-5 h-5 text-primary" />}
              label="Email"
              value={profile.invitadoAcompanante.email || 'No especificado'}
            />
            <InfoField
              icon={<Phone className="w-5 h-5 text-primary" />}
              label="Teléfono"
              value={profile.invitadoAcompanante.telefono || 'No especificado'}
            />
            <InfoField
              icon={<Briefcase className="w-5 h-5 text-primary" />}
              label="Puesto"
              value={profile.invitadoAcompanante.puesto || 'No especificado'}
            />
          </div>
        </div>
      )}

      {/* Fechas */}
      <div className="mt-6 p-4 bg-muted/30 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-foreground/60">
          {profile.fechaRegistro && (
            <div>
              <strong>Fecha de Registro:</strong> {new Date(profile.fechaRegistro).toLocaleDateString('es-MX')}
            </div>
          )}
          {profile.fechaActualizacion && (
            <div>
              <strong>Última Actualización:</strong> {new Date(profile.fechaActualizacion).toLocaleDateString('es-MX')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface InfoFieldProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode | string;
  fullWidth?: boolean;
  isLink?: boolean;
}

function InfoField({ icon, label, value, fullWidth, isLink }: InfoFieldProps) {
  return (
    <div className={`${fullWidth ? 'md:col-span-2' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">{icon}</div>
        <div className="flex-1">
          <p className="text-sm text-foreground/60 mb-1">{label}</p>
          {isLink && typeof value === 'string' ? (
            <a
              href={value.startsWith('http') ? value : `https://${value}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground font-medium hover:text-primary break-all"
            >
              {value}
            </a>
          ) : (
            <p className="text-foreground font-medium break-words">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}
