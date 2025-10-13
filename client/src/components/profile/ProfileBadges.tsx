import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Ticket } from 'lucide-react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { EMPRESA_ID } from '@/config/constants';

interface ProfileBadgesProps {
  profile: any;
}

export default function ProfileBadges({ profile }: ProfileBadgesProps) {
  const canvasRefUser = useRef<HTMLCanvasElement>(null);
  const canvasRefGuest = useRef<HTMLCanvasElement>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [guestData, setGuestData] = useState<any>(null);
  const [loadingGuestData, setLoadingGuestData] = useState(false);

  const hasGuestInfo = profile.invitadoAcompanante && profile.invitadoAcompanante.email;

  // Generar QR Code
  const generateQRCode = async (invitadoId: string): Promise<string> => {
    try {
      const qrUrl = `https://expo-empresarios-de-la-baja.web.app/invitado/${invitadoId}`;
      return await QRCode.toDataURL(qrUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      return '';
    }
  };

  // Generar el PDF del gafete
  const generatePDF = async (invitadoData: any, isGuest: boolean = false) => {
    try {
      if (isGuest) {
        setLoadingGuest(true);
      } else {
        setLoadingUser(true);
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [108, 140], // Tamaño 1/4 de carta (4.25" x 5.5")
      });

      // Fondo con imagen
      try {
        const bgImg = new Image();
        bgImg.src = '/background_badge.png';
        
        await new Promise((resolve, reject) => {
          bgImg.onload = resolve;
          bgImg.onerror = reject;
        });
        
        pdf.addImage(bgImg, 'PNG', 0, 0, 108, 140);
      } catch (error) {
        console.error('Error loading background:', error);
        pdf.setFillColor(30, 30, 35);
        pdf.rect(0, 0, 108, 140, 'F');
      }

      // Logo circular superior
      try {
        const logoImg = new Image();
        logoImg.src = '/logo-expo.png';
        
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
        });
        
        pdf.addImage(logoImg, 'PNG', 27, 5, 54, 54);
      } catch (error) {
        console.error('Error loading logo:', error);
        pdf.setFillColor(0, 0, 0);
        pdf.circle(54, 32, 22, 'F');
        pdf.setDrawColor(200, 170, 110);
        pdf.setLineWidth(0.8);
        pdf.circle(54, 32, 22, 'S');
        
        pdf.setTextColor(200, 170, 110);
        pdf.setFontSize(11);
        pdf.setFont('times', 'normal');
        pdf.text('Expo Empresarios', 54, 42, { align: 'center' });
        pdf.setFontSize(9);
        pdf.text('De La Baja', 54, 48, { align: 'center' });
        pdf.setFontSize(6);
        pdf.text('desde 2012', 54, 52, { align: 'center' });
      }

      // Nombre del invitado
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      const nombreCompleto = `${invitadoData.nombre || ''} ${invitadoData.apellidos || ''}`.toUpperCase();
      pdf.text(nombreCompleto, 54, 68, { align: 'center', maxWidth: 92 });

      // Puesto y empresa
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const puestoEmpresa = `${invitadoData.puesto || ''}, ${invitadoData.empresa || ''}`;
      pdf.text(puestoEmpresa, 54, 75, { align: 'center', maxWidth: 92 });

      // Generar QR Code
      const qrCodeDataUrl = await generateQRCode(invitadoData.id);
      
      if (qrCodeDataUrl) {
        pdf.addImage(qrCodeDataUrl, 'PNG', 12, 85, 28, 28);
      }

      // Badge Number
      pdf.setTextColor(100, 150, 150);
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      pdf.text('BADGE NUMBER', 50, 100, { align: 'left' });

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text(invitadoData.codigoConfirmacion || 'XXXX', 50, 108, { align: 'left' });

      // Fondo blanco para sección "Powered by"
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 118, 108, 22, 'F');

      // Powered by section
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Powered by', 54, 127, { align: 'center' });

      // Logo SmartRoute
      try {
        const smartrouteImg = new Image();
        smartrouteImg.src = '/smartrouteLogoSinFondo.png';
        
        await new Promise((resolve, reject) => {
          smartrouteImg.onload = resolve;
          smartrouteImg.onerror = reject;
        });
        
        pdf.addImage(smartrouteImg, 'PNG', 29, 129, 50, 9);
      } catch (error) {
        console.error('Error loading SmartRoute logo:', error);
        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text('SmartRoute', 54, 133, { align: 'center' });
      }

      // Descargar el PDF
      pdf.save(`pase_${invitadoData.nombre}_${invitadoData.apellidos}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el pase. Por favor intenta de nuevo.');
    } finally {
      if (isGuest) {
        setLoadingGuest(false);
      } else {
        setLoadingUser(false);
      }
    }
  };

  // Buscar datos completos del invitado acompañante
  useEffect(() => {
    const fetchGuestData = async () => {
      if (!hasGuestInfo) {
        setGuestData(null);
        return;
      }

      try {
        setLoadingGuestData(true);
        console.log('🔍 Buscando datos del acompañante con email:', profile.invitadoAcompanante.email);
        
        const contactosRef = collection(db, `empresas/${EMPRESA_ID}/contactos`);
        const q = query(contactosRef, where('email', '==', profile.invitadoAcompanante.email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const guestDoc = querySnapshot.docs[0];
          const guestFullData = {
            id: guestDoc.id,
            ...guestDoc.data()
          };
          console.log('✅ Datos del acompañante encontrados:', guestFullData);
          setGuestData(guestFullData);
        } else {
          console.log('⚠️ No se encontró el acompañante en la base de datos');
          setGuestData(null);
        }
      } catch (error) {
        console.error('Error al buscar datos del acompañante:', error);
        setGuestData(null);
      } finally {
        setLoadingGuestData(false);
      }
    };

    fetchGuestData();
  }, [hasGuestInfo, profile.invitadoAcompanante]);

  // Generar QR en canvas para vista previa del usuario
  useEffect(() => {
    console.log('🔍 ProfileBadges - Generando QR para usuario:', {
      hasCanvas: !!canvasRefUser.current,
      profileId: profile.id,
      profileData: profile
    });
    
    // Usar setTimeout para asegurar que el canvas esté en el DOM
    const timer = setTimeout(() => {
      if (canvasRefUser.current && profile.id) {
        // Limpiar canvas antes de generar nuevo QR
        const canvas = canvasRefUser.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        const qrUrl = `https://expo-empresarios-de-la-baja.web.app/invitado/${profile.id}`;
        console.log('✅ Generando QR del usuario con URL:', qrUrl);
        QRCode.toCanvas(canvasRefUser.current, qrUrl, {
          width: 110,
          margin: 0,
          errorCorrectionLevel: 'M'
        }).then(() => {
          console.log('✅ QR del usuario generado exitosamente');
        }).catch(error => {
          console.error('❌ Error al generar QR del usuario:', error);
        });
      } else {
        console.warn('⚠️ No se puede generar QR del usuario:', {
          hasCanvas: !!canvasRefUser.current,
          hasProfileId: !!profile.id
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [profile.id]);

  // Generar QR en canvas para vista previa del acompañante
  useEffect(() => {
    // Usar setTimeout para asegurar que el canvas esté en el DOM
    const timer = setTimeout(() => {
      if (canvasRefGuest.current && guestData && guestData.id) {
        // Limpiar canvas antes de generar nuevo QR
        const canvas = canvasRefGuest.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        const qrUrl = `https://expo-empresarios-de-la-baja.web.app/invitado/${guestData.id}`;
        console.log('✅ Generando QR del acompañante con URL:', qrUrl);
        QRCode.toCanvas(canvasRefGuest.current, qrUrl, {
          width: 110,
          margin: 0,
          errorCorrectionLevel: 'M'
        }).then(() => {
          console.log('✅ QR del acompañante generado exitosamente');
        }).catch(error => {
          console.error('❌ Error al generar QR del acompañante:', error);
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [guestData]);

  const renderBadge = (invitadoData: any, canvasRef: any, isGuest: boolean = false) => {
    return (
      <div className="space-y-4">
        <div
          style={{
            width: '400px',
            height: '600px',
            backgroundImage: 'url(/background_badge.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            borderRadius: '12px',
            padding: '20px',
            color: 'white',
            position: 'relative',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
          }}
        >
          {/* Logo circular */}
          <div
            style={{
              width: '140px',
              height: '140px',
              margin: '20px auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img 
              src="/logo-expo.png" 
              alt="Logo Expo Empresarios" 
              style={{ 
                width: '100%', 
                height: '100%',
                objectFit: 'contain'
              }}
            />
          </div>

          {/* Nombre */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '15px',
              fontSize: '26px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            {invitadoData.nombre} {invitadoData.apellidos}
          </div>

          {/* Puesto y empresa */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '8px',
              fontSize: '16px',
              color: '#ccc',
              fontWeight: '500',
            }}
          >
            {invitadoData.puesto}, {invitadoData.empresa}
          </div>

          {/* QR y Badge Number */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginTop: '25px',
              padding: '0 30px',
            }}
          >
            {/* QR Code */}
            <div style={{ width: '110px', height: '110px', background: 'white', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
              <canvas 
                ref={canvasRef} 
                width={110} 
                height={110}
                style={{ maxWidth: '100%', maxHeight: '100%' }}
              />
            </div>
            
            {/* Badge Number */}
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '110px' }}>
              <div>
                <div style={{ fontSize: '8px', color: '#888', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Badge Number
                </div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff', letterSpacing: '2px' }}>
                  {invitadoData.codigoConfirmacion || 'XXXX'}
                </div>
              </div>
            </div>
          </div>

          {/* Powered by section */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: '#ffffff',
              padding: '10px',
              textAlign: 'center',
              borderRadius: '0 0 12px 12px',
            }}
          >
            <div style={{ fontSize: '16px', color: '#666', marginBottom: '0px', fontWeight: '500' }}>
              Powered by
            </div>
            <img 
              src="/smartrouteLogoSinFondo.png" 
              alt="SmartRoute" 
              style={{ 
                height: '55px',
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto'
              }}
            />
          </div>
        </div>

        <button
          onClick={() => generatePDF(invitadoData, isGuest)}
          disabled={isGuest ? loadingGuest : loadingUser}
          style={{ 
            width: '100%',
            padding: '10px 16px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background-color 0.2s',
            opacity: (isGuest ? loadingGuest : loadingUser) ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (!(isGuest ? loadingGuest : loadingUser)) {
              e.currentTarget.style.backgroundColor = '#1d4ed8';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
          }}
        >
          
          { loadingUser ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#ffffff' }} />
              <span style={{ color: '#ffffff' }}>Generando PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" style={{ color: '#ffffff' }} />
              <span style={{ color: '#ffffff' }}>Descargar Pase en PDF</span>
            </>
          )}
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <Ticket className="w-6 h-6 text-primary" />
        Tus Pases
      </h2>

      <p className="text-foreground/60 mb-8">
        Descarga tu pase para el evento. Presenta el código QR o el Badge Number en la entrada.
      </p>

      {loadingGuestData ? (
        <div className="text-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-foreground/60">Cargando información del acompañante...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pase del Usuario */}
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Tu Pase
              </h3>
              <div className="flex justify-center">
                {renderBadge(profile, canvasRefUser, false)}
              </div>
            </div>

            {/* Pase del Invitado */}
            {guestData && guestData.id && (
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Pase de tu Acompañante
                </h3>
                <div className="flex justify-center">
                  {renderBadge(guestData, canvasRefGuest, true)}
                </div>
              </div>
            )}
          </div>

          {hasGuestInfo && !guestData && (
            <div className="text-center p-8 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-foreground/80">
                <strong>Información del acompañante incompleta</strong>
              </p>
              <p className="text-foreground/60 mt-2">
                Tu acompañante <strong>{profile.invitadoAcompanante.nombre} {profile.invitadoAcompanante.apellidos}</strong> aún no ha completado su registro.
              </p>
            </div>
          )}

          {!hasGuestInfo && (
            <div className="text-center p-8 bg-muted/30 rounded-lg">
              <p className="text-foreground/60">
                No has registrado un acompañante para este evento.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
