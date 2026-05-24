"use client";

import { useState, useRef } from "react";

interface OpenHouseMeta {
  address: string;
  date: string;
  start_time: string;
  end_time: string;
  specs: string;
  price: string | null;
  listing_url: string;
}

interface OpenHousePackage {
  announcement: string;
  facebook_post: string;
  instagram_caption: string;
  twitter_post: string;
  nextdoor_post: string;
  text_blast: string;
  email_subject: string;
  email_body: string;
  sign_in_sheet_header: string;
  talking_points: string[];
  meta: OpenHouseMeta;
}

interface OpenHousePanelProps {
  listingId: string;
  address: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="px-3 py-1.5 border border-stone/20 rounded font-sans text-xs text-stone hover:border-gilt hover:text-gilt transition-colors flex-shrink-0"
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function ContentCard({ label, content, note }: { label: string; content: string; note?: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="font-sans text-xs font-medium text-stone uppercase tracking-wider">{label}</p>
          {note && <p className="font-sans text-xs text-stone/50 mt-0.5">{note}</p>}
        </div>
        <CopyButton text={content} />
      </div>
      <div className="bg-parchment rounded-md p-3">
        <p className="font-sans text-sm text-ink leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}

function QRCodeDisplay({ url, date, startTime, endTime }: {
  url: string; date: string; startTime: string; endTime: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // Generate QR code using Google Charts API (no library needed)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&color=1A1814&bgcolor=F7F5F1`;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: "#F7F5F1",
      });
      const link = document.createElement("a");
      link.download = "open-house-qr-card.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-sans text-xs font-medium text-stone uppercase tracking-wider">QR Code Card</p>
        <div className="flex gap-2">
          <CopyButton text={url} />
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-3 py-1.5 bg-ink text-gilt border border-ink rounded font-sans text-xs hover:bg-gilt hover:text-ink transition-colors"
          >
            {downloading ? "Saving…" : "⬇ Download card"}
          </button>
        </div>
      </div>

      {/* Printable QR card */}
      <div ref={cardRef} className="bg-parchment border border-stone/20 rounded-xl p-6 max-w-xs mx-auto text-center space-y-4">
        <div>
          <p className="font-serif text-2xl text-gilt tracking-widest">LIMEN</p>
          <p className="font-sans text-xs text-stone tracking-wider uppercase mt-1">Open House</p>
        </div>

        <div className="font-sans text-sm text-stone">
          <span className="font-medium text-ink">{date}</span>
          <br />
          {startTime} – {endTime}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrUrl}
          alt="QR Code"
          width={160}
          height={160}
          className="mx-auto rounded-lg"
          crossOrigin="anonymous"
        />
        <p className="font-sans text-xs text-stone">Scan to view listing details</p>
      </div>
    </div>
  );
}

export default function OpenHousePanel({ listingId, address }: OpenHousePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<OpenHousePackage | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("social");

  // Form state
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("1:00 PM");
  const [endTime, setEndTime] = useState("3:00 PM");
  const [notes, setNotes] = useState("");

  const handleGenerate = async () => {
    if (!date || !startTime || !endTime) return;
    setGenerating(true);
    setError("");
    try {
      const res = await fetch(`/api/listings/${listingId}/open-house`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, start_time: startTime, end_time: endTime, notes, address }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setError(b.error ?? "Generation failed");
        return;
      }
      const data = await res.json();
      setResult(data);
      setActiveTab("social");
    } catch {
      setError("Generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const TABS = [
    { id: "social", label: "Social" },
    { id: "email", label: "Email & Text" },
    { id: "onsite", label: "On-site" },
    { id: "qr", label: "QR Code" },
  ];

  return (
    <div className="bg-white border border-stone/20 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-parchment/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🏡</span>
          <div className="text-left">
            <p className="font-display text-lg text-ink">Open House Package</p>
            <p className="font-sans text-xs text-stone">Generate social posts, email blast, QR code, and talking points</p>
          </div>
        </div>
        <span className="font-sans text-xs text-stone">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="border-t border-stone/10">
          {/* Setup form */}
          {!result && (
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-sans text-xs tracking-widest uppercase text-stone">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full border border-stone/20 px-3 py-2 font-sans text-sm text-ink focus:outline-none focus:border-gilt rounded-md"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-sans text-xs tracking-widest uppercase text-stone">Start time</label>
                  <input
                    type="text"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    placeholder="1:00 PM"
                    className="w-full border border-stone/20 px-3 py-2 font-sans text-sm text-ink focus:outline-none focus:border-gilt rounded-md"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-sans text-xs tracking-widest uppercase text-stone">End time</label>
                  <input
                    type="text"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    placeholder="3:00 PM"
                    className="w-full border border-stone/20 px-3 py-2 font-sans text-sm text-ink focus:outline-none focus:border-gilt rounded-md"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-sans text-xs tracking-widest uppercase text-stone">
                  Notes <span className="normal-case tracking-normal text-stone/50">(optional — refreshments, parking, etc.)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Light refreshments provided. Street parking available."
                  className="w-full border border-stone/20 px-3 py-2 font-sans text-sm text-ink focus:outline-none focus:border-gilt rounded-md"
                />
              </div>
              {error && <p className="font-sans text-xs text-red-600">{error}</p>}
              <button
                onClick={handleGenerate}
                disabled={generating || !date || !startTime || !endTime}
                className="w-full bg-ink text-gilt py-3 font-sans text-xs tracking-widest uppercase hover:bg-gilt hover:text-ink transition-colors disabled:opacity-50"
              >
                {generating ? "Generating open house package…" : "Generate open house package"}
              </button>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="p-5 space-y-5">
              {/* Event summary */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="bg-parchment rounded-lg px-4 py-2 font-sans text-sm">
                  <span className="font-medium text-ink">{result.meta.date}</span>
                  <span className="text-stone mx-2">·</span>
                  <span className="text-stone">{result.meta.start_time} – {result.meta.end_time}</span>
                </div>
                <button
                  onClick={() => { setResult(null); setDate(""); }}
                  className="font-sans text-xs text-stone hover:text-ink border border-stone/20 px-3 py-1.5 rounded"
                >
                  Change date/time
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 border-b border-stone/20">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 font-sans text-xs transition-colors ${
                      activeTab === tab.id
                        ? "border-b-2 border-gilt text-ink font-medium -mb-px"
                        : "text-stone hover:text-ink"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Social tab */}
              {activeTab === "social" && (
                <div className="space-y-5">
                  <ContentCard label="Announcement" content={result.announcement} note="Use anywhere — MLS remarks, listing description update, etc." />
                  <ContentCard label="Facebook Post" content={result.facebook_post} note="Post to your Facebook page and Facebook Marketplace" />
                  <ContentCard label="Instagram Caption" content={result.instagram_caption} note="Pair with your best listing photo" />
                  <ContentCard label="X / Twitter" content={result.twitter_post} note="Under 240 characters" />
                  <ContentCard label="Nextdoor" content={result.nextdoor_post} note="Post in the For Sale section of the neighborhood" />
                </div>
              )}

              {/* Email & Text tab */}
              {activeTab === "email" && (
                <div className="space-y-5">
                  <ContentCard label="Text Blast (SMS)" content={result.text_blast} note="Under 160 characters — ready to send to your buyers list" />
                  <ContentCard label="Email Subject Line" content={result.email_subject} note="Paste into your email subject field" />
                  <ContentCard label="Email Body" content={result.email_body} note="Paste into your sphere of influence email blast" />
                </div>
              )}

              {/* On-site tab */}
              {activeTab === "onsite" && (
                <div className="space-y-5">
                  <ContentCard
                    label="Sign-In Sheet Header"
                    content={result.sign_in_sheet_header}
                    note="Print at the top of your sign-in sheet or display on a tablet"
                  />
                  <div className="space-y-2">
                    <p className="font-sans text-xs font-medium text-stone uppercase tracking-wider">Agent Talking Points</p>
                    <p className="font-sans text-xs text-stone/50">Use these during your tour — specific to this property</p>
                    <div className="space-y-2">
                      {result.talking_points.map((point, i) => (
                        <div key={i} className="flex items-start gap-3 bg-parchment rounded-md p-3">
                          <span className="font-serif text-gilt text-lg leading-none flex-shrink-0">{i + 1}</span>
                          <p className="font-sans text-sm text-ink leading-relaxed">{point}</p>
                        </div>
                      ))}
                    </div>
                    <CopyButton text={result.talking_points.map((p, i) => `${i + 1}. ${p}`).join("\n")} />
                  </div>
                </div>
              )}

              {/* QR Code tab */}
              {activeTab === "qr" && (
                <div className="space-y-4">
                  <p className="font-sans text-xs text-stone">
                    Download the QR card to print and place at the open house. Visitors can scan to view listing details.
                  </p>
                  <QRCodeDisplay
                    url={result.meta.listing_url}
                    date={result.meta.date}
                    startTime={result.meta.start_time}
                    endTime={result.meta.end_time}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
