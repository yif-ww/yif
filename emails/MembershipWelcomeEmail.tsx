import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Heading,
  Text,
  Hr,
  Link,
  Tailwind,
  pixelBasedPreset,
} from "@react-email/components";

export interface MembershipWelcomeEmailProps {
  recipientName: string;
  tierName: string;
  membershipNumber: string;
  amountPaid: string;
  expiresAt: string;
  reference: string;
  recipientEmail: string;
  dashboardUrl: string;
}

export default function MembershipWelcomeEmail({
  recipientName,
  tierName,
  membershipNumber,
  amountPaid,
  expiresAt,
  reference,
  recipientEmail,
  dashboardUrl,
}: MembershipWelcomeEmailProps) {
  return (
    <Html lang="en">
      <Tailwind
        config={{
          presets: [pixelBasedPreset],
          theme: {
            extend: {
              colors: {
                navy: "#1a2744",
                "navy-dark": "#111b33",
                gold: "#c9913d",
                "gold-pale": "#f5e6cb",
                cream: "#f5f0e8",
                "cream-dark": "#ede5d4",
                charcoal: "#2c2c2c",
                muted: "#7a7062",
                green: "#2d6a4f",
              },
            },
          },
        }}
      >
        <Head />
        <Preview>
          Welcome to YIF, {recipientName}! Your {tierName} membership is now
          active.
        </Preview>
        <Body className="bg-cream font-sans m-0 p-0">
          <Container className="max-w-[600px] mx-auto py-10 px-4">
            {/* Header */}
            <Section className="bg-navy rounded-t-2xl px-8 py-8 text-center">
              <Heading className="text-white font-serif text-3xl font-bold m-0 leading-tight">
                Yoruba Indigenes&apos; Foundation
              </Heading>
              <Text className="text-gold-pale text-sm m-0 mt-1 tracking-widest uppercase">
                Member Welcome
              </Text>
            </Section>

            {/* Body */}
            <Section className="bg-white px-8 py-8">
              <Text className="text-navy text-lg font-semibold m-0 mb-2">
                Welcome, {recipientName}!
              </Text>
              <Text className="text-muted text-sm leading-relaxed m-0 mb-6">
                Your <strong>{tierName}</strong> membership is now active. You
                are now part of a growing community of Yoruba indigenes
                committed to heritage, progress, and unity.
              </Text>

              {/* Membership card summary */}
              <Section className="bg-cream rounded-xl px-6 py-5 mb-6">
                <table width="100%" cellPadding={0} cellSpacing={0}>
                  <tbody>
                    <tr>
                      <td className="text-muted text-xs py-1.5">
                        Membership Number
                      </td>
                      <td className="text-navy text-xs font-bold text-right py-1.5">
                        {membershipNumber}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted text-xs py-1.5">Tier</td>
                      <td className="text-navy text-xs font-bold text-right py-1.5">
                        {tierName}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted text-xs py-1.5">Amount Paid</td>
                      <td className="text-navy text-xs font-bold text-right py-1.5">
                        {amountPaid}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted text-xs py-1.5">Valid Until</td>
                      <td className="text-navy text-xs font-bold text-right py-1.5">
                        {expiresAt}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted text-xs py-1.5">Reference</td>
                      <td className="text-navy text-xs font-mono text-right py-1.5">
                        {reference}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Section>

              <Text className="text-muted text-xs m-0 mb-6">
                Log in to your member portal to access your profile, explore
                upcoming events, and connect with fellow members.
              </Text>

              <Link
                href={dashboardUrl}
                className="inline-block bg-navy text-white text-sm font-semibold rounded-lg px-6 py-3 no-underline"
              >
                Go to Member Portal
              </Link>
            </Section>

            <Hr className="border-cream-dark mx-0 my-0" />

            {/* Footer */}
            <Section className="bg-white rounded-b-2xl px-8 pb-8 pt-4 text-center">
              <Text className="text-muted text-xs m-0">
                This email was sent to {recipientEmail}. If you have any
                questions, reply to this email or contact us at{" "}
                <Link
                  href="mailto:info@yif.org"
                  className="text-navy underline"
                >
                  info@yif.org
                </Link>
                .
              </Text>
              <Text className="text-muted text-xs m-0 mt-2">
                &copy; {new Date().getFullYear()} Yoruba Indigenes&apos;
                Foundation. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
