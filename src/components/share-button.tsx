"use client";

import { useState } from "react";

/**
 * Lets sellers and customers share a page back into the Viber group (or
 * anywhere else) as a single link instead of reposting posters.
 */
export function ShareButton({ path, text, label = "Share" }: { path: string; text: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = () => new URL(path, window.location.origin).toString();

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: text, text, url: url() });
        return;
      } catch {
        // User cancelled or sharing failed; fall through to the menu.
      }
    }
    setOpen((o) => !o);
  }

  async function copy() {
    await navigator.clipboard.writeText(`${text}\n${url()}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative inline-block">
      <button type="button" onClick={share} className="btn-secondary">
        📤 {label}
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-2 w-52 rounded-xl border border-gray-200 bg-white p-1 shadow-lg">
          <a
            href={`viber://forward?text=${encodeURIComponent(`${text}\n${url()}`)}`}
            className="block rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
          >
            💜 Share to Viber
          </a>
          <button type="button" onClick={copy} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50">
            {copied ? "✅ Copied" : "🔗 Copy link"}
          </button>
        </div>
      )}
    </div>
  );
}
