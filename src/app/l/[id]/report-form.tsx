"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/forms";
import { reportListing } from "./actions";

export function ReportForm({ listingId }: { listingId: string }) {
  const [state, action] = useActionState(reportListing, null);

  return (
    <details className="text-sm text-gray-500">
      <summary className="cursor-pointer">Report this listing</summary>
      {state?.message ? (
        <div className="mt-2">
          <FormMessage state={state} />
        </div>
      ) : (
        <form action={action} className="mt-2 space-y-2">
          <input type="hidden" name="listingId" value={listingId} />
          <select name="reason" className="input" required defaultValue="">
            <option value="" disabled>
              What&apos;s wrong?
            </option>
            <option>Wrong price or out of date</option>
            <option>Scam or fake</option>
            <option>Inappropriate content</option>
            <option>Prohibited item</option>
            <option>Other</option>
          </select>
          <FormMessage state={state} />
          <SubmitButton className="btn-secondary">Send report</SubmitButton>
        </form>
      )}
    </details>
  );
}
