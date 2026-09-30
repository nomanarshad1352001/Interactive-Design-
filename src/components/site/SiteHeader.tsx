"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpLeft, Menu, Phone, Waves, X } from "lucide-react";

const NAV = [
  { label: "Home", href: "#", current: false },
  { label: "Our Shop", href: "#", current: false },
  { label: "Who We Serve", href: "#", current: false },
  { label: "About", href: "#", current: false },
  { label: "Design Studio", href: "#studio", current: true },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40">
      {/* top utility bar */}
      <div className="bg-ink-950 text-sand-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5 text-[11px] tracking-wide sm:px-6">
          <a
            href="#"
            className="inline-flex items-center gap-1.5 text-sand-100/80 transition hover:text-white"
          >
            <ArrowUpLeft className="h-3 w-3" />
            Back to CoastalCustomTees.com
          </a>
          <p className="hidden items-center gap-2 text-sand-100/80 sm:flex">
            <Phone className="h-3 w-3 text-coral-400" />
            (843) 279-3268 · Little River, SC
          </p>
        </div>
      </div>

      {/* main bar */}
      <div
        className={`border-b border-ink-900/10 transition-all duration-300 ${
          scrolled ? "bg-sand-50/90 shadow-card backdrop-blur-xl" : "bg-sand-50/70 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="#" className="group flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-teal-500 to-ink-800 text-white shadow-card transition-transform duration-300 group-hover:-rotate-6">
              <Waves className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block font-display text-[17px] font-semibold tracking-tight text-ink-900">
                Coastal Custom Tees
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-teal-600">
                Design Studio
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  item.current
                    ? "bg-ink-900 text-sand-50"
                    : "text-ink-600 hover:bg-ink-900/5 hover:text-ink-900"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="#quote"
              className="hidden items-center gap-2 rounded-full bg-coral-500 px-5 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-coral-600 sm:inline-flex"
            >
              Get a Quote
            </a>
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-ink-900/10 text-ink-800 lg:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden border-t border-ink-900/10 lg:hidden"
            >
              <div className="space-y-1 px-4 py-4">
                {NAV.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-xl px-4 py-2.5 text-sm font-medium ${
                      item.current ? "bg-ink-900 text-sand-50" : "text-ink-700 hover:bg-ink-900/5"
                    }`}
                  >
                    {item.label}
                  </a>
                ))}
                <a
                  href="#quote"
                  onClick={() => setOpen(false)}
                  className="mt-2 block rounded-xl bg-coral-500 px-4 py-3 text-center text-sm font-bold text-white"
                >
                  Get a Quote
                </a>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
