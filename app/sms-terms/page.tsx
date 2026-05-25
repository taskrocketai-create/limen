import Link from "next/link";

export const metadata = {
  title: "SMS Terms | Limen",
  description: "Limen SMS messaging terms and conditions.",
};

export default function SmsTermsPage() {
  return (
    <div className="min-h-screen bg-parchment">
      <header className="bg-ink px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-gilt font-serif text-xl tracking-widest">LIMEN</Link>
        <Link href="/login" className="text-parchment text-sm opacity-70 hover:opacity-100 font-sans">Sign in</Link>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="font-serif text-4xl text-ink mb-2">SMS Terms & Conditions</h1>
          <p className="font-sans text-sm text-stone">Last updated: May 2026</p>
        </div>
        <div className="space-y-6">
          {[
            {
              title: "Program Description",
              content: "Limen sends SMS messages to real estate agents and homeowners in connection with the Limen listing platform. Messages may include intake form links, listing approval notifications, and platform alerts.",
            },
            {
              title: "Consent",
              content: "By providing your phone number and using the Limen platform, you consent to receive SMS messages related to your account and listings. Homeowners consent to receive an intake link SMS when their agent initiates the process. Message frequency varies based on platform activity.",
            },
            {
              title: "Message Frequency",
              content: "Message frequency varies. You may receive messages when: a new listing is created, an intake form is sent or completed, a listing package is approved, or other account events occur.",
            },
            {
              title: "Message and Data Rates",
              content: "Message and data rates may apply. Check with your mobile carrier for details about your plan.",
            },
            {
              title: "Opt-Out",
              content: "Reply STOP to any SMS message to unsubscribe from that message thread. You will receive a confirmation message. After opting out, you will not receive further SMS messages unless you re-consent. To opt back in, contact support@limenai.org.",
            },
            {
              title: "Help",
              content: "Reply HELP to any SMS message for assistance, or contact us at support@limenai.org.",
            },
            {
              title: "Supported Carriers",
              content: "Limen SMS is available on all major US carriers including AT&T, Verizon, T-Mobile, and others. Carrier support is not guaranteed for all carriers.",
            },
            {
              title: "Privacy",
              content: "Your phone number and SMS consent information will not be sold or shared with third parties for marketing purposes. See our Privacy Policy for full details.",
            },
            {
              title: "Contact",
              content: "For questions about our SMS program, contact support@limenai.org or visit limenai.org.",
            },
          ].map((s, i) => (
            <div key={i} className="bg-white border border-stone/20 rounded-lg p-6 space-y-2">
              <h2 className="font-serif text-xl text-ink">{s.title}</h2>
              <p className="font-sans text-sm text-stone leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-8 border-t border-stone/20 text-center">
          <div className="flex justify-center gap-6">
            <Link href="/privacy-policy" className="font-sans text-xs text-stone hover:text-ink">Privacy Policy</Link>
            <Link href="/disclaimer" className="font-sans text-xs text-stone hover:text-ink">Disclaimer & Legal</Link>
            <Link href="/login" className="font-sans text-xs text-stone hover:text-ink">Sign in</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
