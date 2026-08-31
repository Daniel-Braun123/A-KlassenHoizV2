import type { Database } from "@/lib/supabase/database.types";

export type PushReminderKind = Database["app"]["Enums"]["push_reminder_kind"];

export type PushPayload = Readonly<{
  title: string;
  body: string;
  url: string;
  tag: string;
  badgeCount?: number;
}>;

export type ClaimedPushReminder =
  Database["api"]["Functions"]["claim_due_push_reminders"]["Returns"][number];

export type ClaimedPushEvent =
  Database["api"]["Functions"]["claim_due_push_events"]["Returns"][number];
