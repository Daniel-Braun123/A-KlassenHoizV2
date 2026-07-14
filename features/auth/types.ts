export type AuthDestination =
  | { kind: "invitation"; href: string }
  | { kind: "onboarding"; href: "/start" }
  | { kind: "round"; href: string };

export type RegistrationInput = Readonly<{
  displayName: string;
  email: string;
  password: string;
  next?: string;
}>;

export type SignInInput = Readonly<{
  email: string;
  password: string;
  next?: string;
}>;

export type PasswordResetRequestInput = Readonly<{
  email: string;
}>;
