import { invitationTokenSchema } from "./schemas";
export function invitationReturnPath(token: string) {
  return `/invite/${invitationTokenSchema.parse(token)}` as const;
}
