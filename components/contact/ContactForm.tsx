"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  submitContactForm,
  type ContactFormState,
} from "@/app/(public)/contact/actions";

const SUBJECTS = [
  { value: "inquiry", label: "General Inquiry" },
  { value: "donation", label: "Donation" },
  { value: "membership", label: "Membership" },
  { value: "scholarship", label: "Scholarship" },
  { value: "event", label: "Event" },
  { value: "other", label: "Other" },
] as const;

const initialState: ContactFormState = {};

export default function ContactForm() {
  const [state, action, isPending] = useActionState(
    submitContactForm,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  const fieldClass =
    "w-full rounded-lg border border-[var(--yif-cream-dark)] bg-white px-4 py-3 text-[var(--yif-charcoal)] text-sm placeholder:text-gray-400 focus:border-[var(--yif-gold)] focus:outline-none focus:ring-2 focus:ring-[var(--yif-gold)]/20 transition-colors";
  const labelClass =
    "block text-xs font-semibold uppercase tracking-[0.15em] text-[var(--yif-navy)] mb-2";
  const errorClass = "mt-1 text-xs text-[var(--yif-terracotta)] font-medium";

  return (
    <form ref={formRef} action={action} noValidate className="space-y-6">
      {/* Success banner */}
      {state.success && (
        <div className="rounded-lg bg-[var(--yif-green)]/10 border border-[var(--yif-green)]/30 px-5 py-4 flex items-start gap-3">
          <svg
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--yif-green)]"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm text-[var(--yif-green)] font-medium">
            {state.message}
          </p>
        </div>
      )}

      {/* General error */}
      {state.success === false && !state.errors && (
        <div className="rounded-lg bg-[var(--yif-terracotta)]/10 border border-[var(--yif-terracotta)]/30 px-5 py-4">
          <p className="text-sm text-[var(--yif-terracotta)] font-medium">
            Something went wrong. Please try again.
          </p>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Name */}
        <div>
          <label htmlFor="name" className={labelClass}>
            Full Name <span className="text-[var(--yif-terracotta)]">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            autoComplete="name"
            required
            placeholder="Your full name"
            className={fieldClass}
            aria-describedby={state.errors?.name ? "name-error" : undefined}
          />
          {state.errors?.name && (
            <p id="name-error" className={errorClass}>
              {state.errors.name[0]}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className={labelClass}>
            Email Address{" "}
            <span className="text-[var(--yif-terracotta)]">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className={fieldClass}
            aria-describedby={state.errors?.email ? "email-error" : undefined}
          />
          {state.errors?.email && (
            <p id="email-error" className={errorClass}>
              {state.errors.email[0]}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Phone */}
        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone Number{" "}
            <span className="text-gray-400 font-normal normal-case tracking-normal">
              (optional)
            </span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            autoComplete="tel"
            placeholder="+234 000 0000 000"
            className={fieldClass}
          />
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="subject" className={labelClass}>
            Subject <span className="text-[var(--yif-terracotta)]">*</span>
          </label>
          <select
            id="subject"
            name="subject"
            required
            defaultValue=""
            className={`${fieldClass} cursor-pointer`}
            aria-describedby={
              state.errors?.subject ? "subject-error" : undefined
            }
          >
            <option value="" disabled>
              Select a subject
            </option>
            {SUBJECTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {state.errors?.subject && (
            <p id="subject-error" className={errorClass}>
              {state.errors.subject[0]}
            </p>
          )}
        </div>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className={labelClass}>
          Message <span className="text-[var(--yif-terracotta)]">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Tell us how we can help you…"
          className={`${fieldClass} resize-none`}
          aria-describedby={state.errors?.message ? "message-error" : undefined}
        />
        {state.errors?.message && (
          <p id="message-error" className={errorClass}>
            {state.errors.message[0]}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-[var(--yif-gold)] px-8 py-4 text-white font-semibold text-sm uppercase tracking-[0.15em] hover:bg-[var(--yif-gold-light)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--yif-gold)] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Sending…
          </span>
        ) : (
          "Send Message"
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        We respect your privacy. Your information will never be shared with
        third parties.
      </p>
    </form>
  );
}
