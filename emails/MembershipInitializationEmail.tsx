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

export interface MembershipInitializationEmailProps {
  recipientName: string;
  tierName: string;
  amountNaira: string;
  reference: string;
  paymentUrl: string;
  recipientEmail: string;
}

export default function MembershipInitializationEmail({
  recipientName,
  tierName,
  amountNaira,
  reference,
  paymentUrl,
  recipientEmail,
}: MembershipInitializationEmailProps) {
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
              },
            },
          },
        }}
      >
        <Head />
        <Preview>
          Your YIF {tierName} membership application is ready — complete your
          payment to activate.
        </Preview>
        <Body className="bg-cream font-sans m-0 p-0">
          <Container className="max-w-[600px] mx-auto py-10 px-4">
            {/* Header */}
            <Section className="bg-navy rounded-t-2xl px-8 py-8 text-center">
              <Heading className="text-white font-serif text-3xl font-bold m-0 leading-tight">
                Yoruba Indigenes&apos; Foundation
              </Heading>
              <Text className="text-gold-pale text-sm m-0 mt-1 tracking-widest uppercase">
                Membership Application
              </Text>
            </Section>

            {/* Body */}
            <Section className="bg-white px-8 py-8">
              <Text className="text-navy text-lg font-semibold m-0 mb-2">
                Hi {recipientName},
              </Text>
              <Text className="text-muted text-sm leading-relaxed m-0 mb-6">
                Your <strong>{tierName}</strong> membership application has been
                received. To complete your membership and gain full access to
                the YIF member portal, please finalize your payment of{" "}
                <strong>{amountNaira}</strong>.
              </Text>

              {/* Application summary */}
              <Section className="bg-cream rounded-xl px-6 py-5 mb-6">
                <table width="100%" cellPadding={0} cellSpacing={0}>
                  <tbody>
                    <tr>
                      <td className="text-muted text-xs py-1.5">
                        Membership Tier
                      </td>
                      <td className="text-navy text-xs font-bold text-right py-1.5">
                        {tierName}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted text-xs py-1.5">Amount Due</td>
                      <td className="text-navy text-xs font-bold text-right py-1.5">
                        {amountNaira}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted text-xs py-1.5">
                        Payment Reference
                      </td>
                      <td className="text-navy text-xs font-mono text-right py-1.5">
                        {reference}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-muted text-xs py-1.5">Status</td>
                      <td className="text-xs font-bold text-right py-1.5 text-gold">
                        Pending Payment
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Section>

              <Text className="text-muted text-sm leading-relaxed m-0 mb-6">
                Use the button below to proceed to the secure payment page. If
                you were redirected there already, you can ignore this email or
                use the link to resume your payment at any time.
              </Text>

              <Link
                href={paymentUrl}
                className="inline-block bg-gold text-white text-sm font-semibold rounded-lg px-6 py-3 no-underline"
              >
                Complete Payment
              </Link>
            </Section>

            <Hr className="border-cream-dark mx-0 my-0" />

            {/* What happens next */}
            <Section className="bg-white px-8 py-6">
              <Text className="text-navy text-sm font-semibold m-0 mb-3">
                What happens next?
              </Text>
              <Text className="text-muted text-xs leading-relaxed m-0 mb-1">
                1. Complete your payment on the secure Paystack page.
              </Text>
              <Text className="text-muted text-xs leading-relaxed m-0 mb-1">
                2. Your membership will be activated automatically within
                seconds.
              </Text>
              <Text className="text-muted text-xs leading-relaxed m-0">
                3. You will receive a confirmation email with your membership
                details and access to the member portal.
              </Text>
            </Section>

            <Hr className="border-cream-dark mx-0 my-0" />

            {/* Footer */}
            <Section className="bg-white rounded-b-2xl px-8 pb-8 pt-4 text-center">
              <Text className="text-muted text-xs m-0">
                This email was sent to {recipientEmail}. If you did not initiate
                this application, please contact us at{" "}
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
