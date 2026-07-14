import { signOutAction } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";

export function SessionMenu() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="ghost">
        Abmelden
      </Button>
    </form>
  );
}
