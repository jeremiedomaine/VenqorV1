export type AuthErrorCode =
  | "auth"
  | "email_taken"
  | "weak_password"
  | "invalid_email"
  | "signup_failed";

export function signUpErrorCode(message: string): AuthErrorCode {
  const m = message.toLowerCase();

  if (
    m.includes("already registered") ||
    m.includes("already been registered") ||
    m.includes("user already registered")
  ) {
    return "email_taken";
  }

  if (
    m.includes("password") &&
    (m.includes("least") || m.includes("weak") || m.includes("short"))
  ) {
    return "weak_password";
  }

  if (m.includes("valid email") || m.includes("invalid email")) {
    return "invalid_email";
  }

  return "signup_failed";
}

const SIGNUP_MESSAGES: Record<AuthErrorCode, string> = {
  auth: "Erreur de connexion. Vérifiez vos identifiants.",
  email_taken:
    "Un compte existe déjà avec cet email. Connectez-vous ou utilisez une autre adresse.",
  weak_password: "Le mot de passe doit contenir au moins 6 caractères.",
  invalid_email: "Adresse email invalide.",
  signup_failed:
    "Impossible de créer le compte. Vérifiez vos informations ou réessayez.",
};

export function authErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  if (code in SIGNUP_MESSAGES) {
    return SIGNUP_MESSAGES[code as AuthErrorCode];
  }
  return SIGNUP_MESSAGES.signup_failed;
}
