export type AuthDestination =
  | { kind: "invitation"; href: string }
  | { kind: "onboarding"; href: "/start" }
  | { kind: "round"; href: string };

export type OAuthEntryPoint = "login" | "register";

export type OAuthSignInInput = Readonly<{
  entryPoint: OAuthEntryPoint;
  next?: string;
}>;

export type RegistrationInput = Readonly<{
  displayName: string;
  email: string;
  password: string;
  next?: string;
}>;

export type RegistrationResult =
  | Readonly<{ kind: "authenticated"; destination: string }>
  | Readonly<{ kind: "confirmation_required" }>;

export type SignInInput = Readonly<{
  email: string;
  password: string;
  next?: string;
}>;

export type PasswordResetRequestInput = Readonly<{
  email: string;
}>;
