export type ApplicationErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "INACTIVE_PROFILE"
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "CONFLICT"
  | "DEADLINE_PASSED"
  | "RATE_LIMITED"
  | "UNAVAILABLE";

const publicMessages: Readonly<Record<ApplicationErrorCode, string>> = {
  UNAUTHENTICATED: "Bitte melde dich erneut an.",
  FORBIDDEN: "Diese Aktion ist für dich nicht verfügbar.",
  INACTIVE_PROFILE: "Dein Profil kann diese Aktion derzeit nicht ausführen.",
  INVALID_INPUT: "Bitte prüfe deine Eingaben.",
  NOT_FOUND: "Der angeforderte Inhalt ist nicht verfügbar.",
  CONFLICT: "Die Daten wurden zwischenzeitlich geändert. Bitte lade die Ansicht neu.",
  DEADLINE_PASSED: "Die Tippfrist für dieses Spiel ist abgelaufen.",
  RATE_LIMITED: "Zu viele Versuche. Bitte probiere es später erneut.",
  UNAVAILABLE: "Das hat gerade nicht funktioniert. Bitte probiere es erneut.",
};

export class ApplicationError extends Error {
  readonly code: ApplicationErrorCode;

  constructor(code: ApplicationErrorCode, internalMessage?: string, options?: ErrorOptions) {
    super(internalMessage ?? code, options);
    this.name = "ApplicationError";
    this.code = code;
  }
}

export function publicMessageFor(code: ApplicationErrorCode): string {
  return publicMessages[code];
}

export function toApplicationError(error: unknown): ApplicationError {
  return error instanceof ApplicationError
    ? error
    : new ApplicationError("UNAVAILABLE", "Unexpected application error", { cause: error });
}
