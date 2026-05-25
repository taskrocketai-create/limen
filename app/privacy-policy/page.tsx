import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Limen",
  description: "Limen privacy policy — how we collect, use, and protect your information.",
};

export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: "Information We Collect",
      content: `We collect information you provide directly to us when you create an account, create listings, complete homeowner intake forms, or contact us for support.

This includes: name, email address, phone number, real estate license number, brokerage name, property addresses, listing details, homeowner information you enter, and photos you upload.

We also collect usage data automatically, including pages visited, features used, and actions taken within the platform.`,
    },
    {
      title: "How We Use Your Information",
      content: `We use your information to:

- Provide, operate, and improve the Limen platform
- Generate AI-powered listing content using property details you provide
- Send transactional emails including intake links, approval confirmations, and homeowner thank-you messages
- Process subscription payments through Stripe
- Send SMS notifications where you have opted in
- Respond to support requests
- Comply with legal obligations`,
    },
    {
      title: "Information Sharing",
      content: `We do not sell your personal information to third parties.

We share information with service providers who help us operate the platform, including:
- Supabase (database and authentication)
- Anthropic (AI content generation)
- Stripe (payment processing)
- Resend (transactional email)
- Twilio (SMS messaging)
- Vercel (hosting)

Each provider is bound by their own privacy policies and data processing agreements.`,
    },
    {
      title: "Homeowner Data",
      content: `When agents use Limen to send intake links to homeowners, homeowner-provided information is used solely to generate listing content for that specific property. Homeowner data is not used for marketing, sold to third parties, or shared outside the platform.

Homeowners may request deletion of their intake data by contacting us at privacy@limenai.org.`,
    },
    {
      title: "Data Retention",
      content: `We retain your account data for as long as your account is active. Listing data is retained for the duration of your subscription and for a reasonable period after cancellation to allow for data export.

You may request deletion of your account and associated data at any time by contacting privacy@limenai.org.`,
    },
    {
      title: "Security",
      content: `We implement industry-standard security measures including encrypted data transmission (TLS), encrypted data storage, and access controls. However, no method of transmission or storage is 100% secure.`,
    },
    {
      title: "Cookies",
      content: `We use cookies and similar technologies to maintain your login session and improve platform performance. We do not use cookies for advertising purposes.`,
    },
    {
      title: "Your Rights",
      content: `You have the right to access, correct, or delete your personal information. To exercise these rights, contact us at privacy@limenai.org. We will respond within 30 days.`,
    },
    {
      title: "Changes to This Policy",
      content: `We may update this privacy policy from time to time. We will notify you of significant changes by email or by displaying a notice on the platform.`,
    },
    {
      title: "Contact",
      content: `For privacy-related questions or requests, contact us at privacy@limenai.org.`,
    },
  ];

  return (
    <div className="min-h-screen bg-parchment">
      <header className="bg-ink px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-gilt font-serif text-xl tracking-widest">LIMEN</Link>
        <Link href="/login" className="text-parchment text-sm opacity-70 hover:opacity-100 font-sans">Sign in</Link>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="font-serif text-4xl text-ink mb-2">Privacy Policy</h1>
          <p className="font-sans text-sm text-stone">Last updated: May 2026</p>
        </div>
        <div className="space-y-8">
          {sections.map((s, i) => (
            <div key={i} className="bg-white border border-stone/20 rounded-lg p-6 space-y-3">
              <h2 className="font-serif text-xl text-ink">{s.title}</h2>
              {s.content.split("\n\n").map((p, j) => (
                <p key={j} className="font-sans text-sm text-stone leading-relaxed whitespace-pre-line">{p}</p>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-10 pt-8 border-t border-stone/20 text-center space-y-3">
          <div className="flex justify-center gap-6">
            <Link href="/sms-terms" className="font-sans text-xs text-stone hover:text-ink">SMS Terms</Link>
            <Link href="/disclaimer" className="font-sans text-xs text-stone hover:text-ink">Disclaimer & Legal</Link>
            <Link href="/login" className="font-sans text-xs text-stone hover:text-ink">Sign in</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
