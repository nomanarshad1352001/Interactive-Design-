import { MousePointerClick, PackageSearch, Shirt, Sparkles } from "lucide-react";
import SiteHeader from "@/components/site/SiteHeader";
import HeroStrip from "@/components/site/HeroStrip";
import SiteFooter from "@/components/site/SiteFooter";
import DesignStudio from "@/components/studio/DesignStudio";

const STEPS = [
  {
    icon: Shirt,
    title: "Pick a garment",
    text: "T-shirts, hoodies, hats and tote bags in 16 coastal colors — every mockup is real garment photography.",
  },
  {
    icon: MousePointerClick,
    title: "Make it yours",
    text: "Upload logos or photos, add text in 14 fonts, drag, resize and rotate on the front and back views."
  },
  {
    icon: PackageSearch,
    title: "Send for a quote",
    text: "Choose sizes and quantities, drop in your contact info, and get a free DTF print quote in 1–2 business days.",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroStrip />

        {/* the studio */}
        <section id="studio" className="relative scroll-mt-24 bg-sand-50 py-12 sm:py-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ink-900/20 to-transparent"
          />
          <DesignStudio />
        </section>

        {/* how it works */}
        <section className="relative overflow-hidden bg-ink-900 py-16 text-sand-50 sm:py-20">
          <div aria-hidden className="grain absolute inset-0" />
          <div
            aria-hidden
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-coral-500/15 blur-3xl"
          />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-teal-300">
                  <Sparkles className="h-3.5 w-3.5" /> How it works
                </p>
                <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  From idea to ink in minutes
                </h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-sand-100/70">
                No accounts, no checkout maze — design it, send it, and we handle the DTF printing
                from Little River, SC.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <div
                  key={step.title}
                  className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-teal-300/40 hover:bg-white/10"
                >
                  <span className="font-display text-5xl font-semibold text-white/10">
                    0{i + 1}
                  </span>
                  <span className="mt-4 grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-lift transition-transform duration-300 group-hover:-rotate-6">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-sand-100/70">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
