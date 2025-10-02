export interface RegistrationRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  company: string;
  role: string;
  guestType: 'sin invitado' | 'invitado personal' | 'colaborador';
  guest?: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    role?: string;
    relationship?: string;
  } | null;
}

export interface RegistrationResponse {
  message: string;
}

/**
 * Envía la información de registro a una Firebase Function.
 *
 * La URL se puede configurar con `VITE_FIREBASE_FUNCTION_URL`.
 * Si no se setea, hará fallback a `/api/register`, ideal para proxys locales.
 */
export async function submitRegistration(
  payload: RegistrationRequest,
): Promise<RegistrationResponse> {
  const endpoint = import.meta.env.VITE_FIREBASE_FUNCTION_URL ?? '/api/register';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(errorText || 'No se pudo completar el registro.');
  }

  return response
    .json()
    .catch(() => ({ message: 'Registro recibido' } satisfies RegistrationResponse));
}
