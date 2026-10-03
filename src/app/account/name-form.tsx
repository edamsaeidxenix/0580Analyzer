"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/forms";
import { updateName } from "./actions";

export function NameForm({ defaultName, next, welcome }: { defaultName: string; next: string | null; welcome: boolean }) {
  const [state, action] = useActionState(updateName, null);
  return (
    <form action={action} className="space-y-3">
      {next && <input type="hidden" name="next" value={next} />}
      <label className="block">
        <span className="label">Your name</span>
        <input name="name" defaultValue={defaultName} required maxLength={60} className="input" autoFocus={welcome} />
        <span className="mt-1 block text-xs text-gray-500">Shops see this name on your orders.</span>
      </label>
      <FormMessage state={state} />
      <SubmitButton>{welcome ? "Continue" : "Save"}</SubmitButton>
    </form>
  );
}
