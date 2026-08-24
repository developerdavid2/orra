import HeroSectionView from "@/modules/landing/pages/home/hero-section/ui/views/hero-section-view";
import { ManifestoSectionView } from "@/modules/landing/pages/home/manifesto-section/ui/views/manifesto-section-view";

export default function Home() {
  return (
    <div className="relative w-full">
      <section data-blur-section id="hero">
        <HeroSectionView />
      </section>

      <section data-blur-section id="manifesto">
        <ManifestoSectionView />
      </section>

      <section className="relative z-10 min-h-screen w-full border-t border-white/5 bg-landing-bg p-12">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-display text-4xl font-extrabold uppercase tracking-tight text-white md:text-6xl">
            Social Settlements
          </h2>
          <p className="mt-4 max-w-xl text-lg text-white/60">
            Split bills instantly with peer balance resolution—powered by open
            banking data.
          </p>
        </div>
      </section>
    </div>
  );
}
