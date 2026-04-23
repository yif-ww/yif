"use server";

import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  subject: z.enum(
    ["inquiry", "donation", "membership", "scholarship", "event", "other"],
    { error: "Please select a valid subject" },
  ),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be under 2000 characters"),
});

export type ContactFormState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    subject: formData.get("subject"),
    message: formData.get("message"),
  };

  const result = contactSchema.safeParse(raw);

  if (!result.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".") || "root";
      if (!fieldErrors[path]) fieldErrors[path] = [];
      fieldErrors[path].push(issue.message);
    }
    return { success: false, errors: fieldErrors };
  }

  // Send email via env-configured SMTP
  // Requires: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_TO_EMAIL
  // Integration left for deployment configuration (nodemailer / Resend / etc.)
  // For now log submission on the server and return success
  const { name, email, subject, message, phone } = result.data;
  console.log("[YIF Contact Form]", { name, email, subject, phone, message });

  return {
    success: true,
    message:
      "Thank you for reaching out! Your message has been received. We will respond within 2–3 business days.",
  };
}
