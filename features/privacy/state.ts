export type DeleteAccountState = Readonly<{
  status: "idle" | "error";
  message?: string;
  code?: string;
}>;

export const initialDeleteAccountState: DeleteAccountState = { status: "idle" };
