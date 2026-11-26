"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { profile } from "@/content/site";

type Status = "idle" | "sending" | "sent" | "error";

const ERRORS: Record<string, string> = {
  invalid: "Please check your name, a valid email, and a message of at least 10 characters.",
  rate_limited: "Too many messages in a short time. Please try again in a few minutes.",
  not_configured: `The form isn't connected yet. Please email ${profile.email} directly.`,
  send_failed: `Something went wrong sending your message. Please email ${profile.email} directly.`,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="group block">
      <span className="mb-2 block text-[11px] uppercase tracking-[0.22em] text-muted transition-colors group-focus-within:text-accent">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full border-b border-line-strong bg-transparent pb-3 text-lg text-text outline-none transition-colors placeholder:text-muted/50 focus:border-accent";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "send_failed");
      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(ERRORS[(err as Error).message] ?? ERRORS.send_failed);
    }
  }

  return (
    <div className="glass relative w-full overflow-hidden rounded-3xl !bg-bg/85 p-6 text-left sm:p-10">
      <AnimatePresence mode="wait">
        {status === "sent" ? (
          <motion.div key="sent" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="py-10 text-center">
            <p className="font-serif text-4xl italic text-accent">Thank you.</p>
            <p className="mt-3 text-text/75">Your message is on its way. I&apos;ll reply to the email you gave.</p>
            <button onClick={() => setStatus("idle")} className="mt-8 text-xs uppercase tracking-[0.22em] text-muted hover:text-text">
              Send another
            </button>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={onSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8" noValidate={false}>
            <div className="grid gap-8 sm:grid-cols-2">
              <Field label="Your name">
                <input name="name" required maxLength={100} autoComplete="name" placeholder="Jane Doe" className={inputClass} />
              </Field>
              <Field label="Email">
                <input name="email" type="email" required maxLength={200} autoComplete="email" placeholder="jane@company.com" className={inputClass} />
              </Field>
            </div>
            <Field label="Message">
              <textarea name="message" required minLength={10} maxLength={5000} rows={4} placeholder="Tell me about the project or role…" className={`${inputClass} resize-none`} />
            </Field>
            {/* Hidden from people; bots that fill it are ignored. */}
            <input name="company" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="min-h-5 text-sm text-red-300/90" role="status" aria-live="polite">
                {status === "error" ? error : ""}
              </p>
              <button
                type="submit"
                disabled={status === "sending"}
                className="group flex shrink-0 items-center justify-center gap-3 whitespace-nowrap rounded-full bg-accent px-8 py-4 text-sm font-medium text-bg transition-opacity disabled:opacity-60"
              >
                {status === "sending" ? "Sending…" : "Send message"}
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
