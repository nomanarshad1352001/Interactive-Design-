"use client";

import { useState } from "react";
import { CheckCircle2, Mail, MapPin, Phone, Send, Waves } from "lucide-react";

const QUICK_LINKS = ["Home", "Our Shop", "About Us", "Contact", "Design Studio"];
const SERVE = [
  "Business & Staff",
  "Teams & Schools",
  "Weddings & Bridal",
  "Events & Celebrations",
];
const AREAS = [
  "Little River, SC",
  "North Myrtle Beach, SC",
  "Myrtle Beach, SC",
  "Cherry Grove, SC",
  "Calabash, NC",
  "Surfside Beach, SC",
  "Conway, SC",
  "Loris, SC",
];

export default function SiteFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer className="relative overflow-hidden bg-ink-950 text-sand-100">
      <div aria-hidden className="grain absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <a href="#" className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white">
                <Waves className="h-5 w-5" />
              </span>
              <span className="font-display text-xl font-semibold tracking-tight text-white">
                Coastal Custom Tees
              </span>
            </a>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-sand-100/70">
              Premium custom apparel and promotional products serving the Grand Strand and Coastal
              Carolina communities.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-sand-100/80">
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-teal-300" /> (843) 279-3268
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-teal-300" /> coastalcustomtees@gmail.com
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 text-teal-300" /> Little River, South Carolina
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {QUICK_LINKS.map((l) => (
                <li key={l}>
                  <a href="#" className="text-sand-100/75 transition hover:text-white">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
            <h3 className="mt-8 text-xs font-bold uppercase tracking-[0.2em] text-teal-300">
              Who We Serve
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {SERVE.map((l) => (
                <li key={l}>
                  <a href="#" className="text-sand-100/75 transition hover:text-white">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">
              Service Areas
            </h3>
            <ul className="mt-4 grid grid-cols-1 gap-2.5 text-sm">
              {AREAS.map((l) => (
                <li key={l} className="text-sand-100/75">
                  {l}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">
              Stay in the Loop
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-sand-100/70">
              Get deals, new products, and coastal inspiration delivered to your inbox.
            </p>
            {subscribed ? (
              <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-500/15 px-4 py-3 text-sm font-semibold text-teal-200">
                <CheckCircle2 className="h-4 w-4" /> You&apos;re on the list. Welcome aboard!
              </p>
            ) : (
              <form
                className="mt-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email.trim()) setSubscribed(true);
                }}
              >
                <div className="flex overflow-hidden rounded-xl border border-white/15 bg-white/5 backdrop-blur focus-within:border-teal-300/60">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email address"
                    className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder:text-sand-100/40 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="grid w-12 shrink-0 place-items-center bg-coral-500 text-white transition hover:bg-coral-600"
                    aria-label="Subscribe"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-sand-100/50 sm:flex-row">
          <p>© 2026 Coastal Custom Tees. Little River, SC. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="transition hover:text-white">
              Privacy Policy
            </a>
            <a href="#" className="transition hover:text-white">
              Terms of Use
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
