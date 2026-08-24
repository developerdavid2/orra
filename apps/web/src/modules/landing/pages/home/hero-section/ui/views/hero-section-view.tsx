"use client";

import { useRef } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { CustomEase } from "gsap/CustomEase";

import { PremiumButton } from "@/components/premium-button";
import { RotatingTextCircle } from "@/components/rotating-text-circle";
import { LandingContainer } from "@/modules/landing/components/landing-container";
import { useReducedMotion } from "@/modules/landing/lib/reduced-motion";
import { useLandingReady } from "@/modules/landing/lib/use-landing-ready";
import HeroBackground from "../components/hero-background";
import { HeroMiniChart } from "../components/hero-mini-chart";
import { useRouter } from "next/navigation";

gsap.registerPlugin(MotionPathPlugin, CustomEase);
CustomEase.create("glide", "0.8, 0, 0.2, 1");

const containerVariants = {
  hidden: { opacity: 0 },
  visible: (i = 1) => ({
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15 * i,
    },
  }),
};

const blurWordVariants = {
  hidden: {
    filter: "blur(12px)",
    opacity: 0,
    y: 12,
  },
  visible: {
    filter: "blur(0px)",
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.4, 0.25, 1] as const,
    },
  },
};

export default function HeroSectionView() {
  const reduced = useReducedMotion();
  const ready = useLandingReady((s) => s.ready);
  const router = useRouter();
  const heroTitleRef = useRef<HTMLDivElement>(null);
  const paragraphText =
    "ORRA connects to your bank accounts, explains your spending in plain English, and automates peer bill splits.";

  useGSAP(
    () => {
      const letters =
        heroTitleRef.current?.querySelectorAll<HTMLElement>(".orra-letter");
      const path = heroTitleRef.current?.querySelector(
        "#orra-arc-path",
      ) as SVGPathElement | null;
      const glowHead = heroTitleRef.current?.querySelector(
        ".orra-glow-head",
      ) as HTMLElement | null;

      if (!letters?.length) return;

      if (reduced) {
        gsap.set(letters, { opacity: 1, filter: "blur(0px)", scale: 1, y: 0 });
        if (path) gsap.set(path, { opacity: 0 });
        if (glowHead) gsap.set(glowHead, { opacity: 0 });
        return;
      }

      if (!ready || !path || !glowHead) return;

      gsap.set(letters, {
        opacity: 0,
        filter: "blur(20px)",
        scale: 1.5,
        y: 16,
      });

      const tl = gsap.timeline({ delay: 0.15 });

      tl.to(path, { strokeDashoffset: 0, duration: 2.2, ease: "glide" }, 0)
        .to(glowHead, { opacity: 1, duration: 0.25 }, 0)
        .to(
          glowHead,
          {
            motionPath: {
              path: "#orra-arc-path",
              align: "#orra-arc-path",
              alignOrigin: [0.5, 0.5],
            },
            duration: 2.2,
            ease: "glide",
          },
          0,
        )
        .to(
          letters,
          {
            opacity: 1,
            filter: "blur(0px)",
            scale: 1,
            y: 0,
            duration: 1.1,
            ease: "power3.out",
            stagger: { each: 0.24, from: "random" },
          },
          0.35,
        )
        .to(
          [glowHead, path],
          { opacity: 0, duration: 0.6, ease: "power2.out" },
          "-=0.5",
        );
    },
    { scope: heroTitleRef, dependencies: [ready, reduced] },
  );

  return (
    <section className="relative min-h-svh w-full overflow-hidden">
      <HeroBackground />

      <LandingContainer className="relative z-10 flex min-h-svh flex-col justify-between py-10">
        <div className="my-auto flex flex-col items-center text-center">
          <h1
            ref={heroTitleRef}
            className="relative w-full select-none text-[clamp(4rem,11vw,12rem)] font-normal leading-none tracking-[0.2em] md:tracking-[0.85em] text-section-ink mb-[10%]"
          >
            <svg
              className="pointer-events-none absolute left-0 top-[-22%] h-[55%] w-full"
              viewBox="0 0 100 40"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                id="orra-arc-path"
                d="M 4 32 Q 50 -12 96 32"
                stroke="none"
              />
            </svg>

            <div
              className="orra-glow-head pointer-events-none absolute left-0 top-0 h-[0.35em] w-[0.35em] rounded-full opacity-0 blur-[0.18em]"
              style={{
                background:
                  "radial-gradient(circle, #fff 0%, #B9B1FF 60%, transparent 100%)",
              }}
            />

            <div className="relative flex w-full items-center justify-center pl-[0.2em] md:pl-[0.35em]">
              {"ORRA".split("").map((letter, idx) => (
                <span
                  key={idx}
                  className="orra-letter inline-block font-rostex opacity-0 blur-[20px] drop-shadow-[0_0_35px_rgba(185,177,255,0.15)]"
                >
                  {letter}
                </span>
              ))}
            </div>
          </h1>
        </div>

        <div className="position absolute bottom-[15%] left-1/2 -translate-x-1/2 z-20">
          {/* Description Paragraph */}
          <motion.p
            variants={containerVariants}
            initial={reduced ? false : "hidden"}
            animate={ready ? "visible" : "hidden"}
            custom={1.4}
            className="mt-6 max-w-lg flex flex-wrap justify-center gap-x-[0.35em] gap-y-1 text-center text-sm font-light text-section-ink/70"
          >
            {paragraphText.split(" ").map((word, idx) => (
              <motion.span
                key={idx}
                variants={blurWordVariants}
                className="inline-block"
              >
                {word}
              </motion.span>
            ))}
          </motion.p>

          {/* Primary Action Button */}
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 15 }}
            animate={ready ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.8 }}
            className=" mt-6 flex justify-center xl:mb-0"
          >
            <PremiumButton
              icon={ArrowRight}
              className="scale-105 py-6"
              onClick={() => router.push("/auth/signup")}
            >
              GET STARTED
            </PremiumButton>
          </motion.div>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="items-end hidden lg:flex">
            <HeroMiniChart />
            <div className="size-16 bg-violet-500/30 blur-2xl absolute bottom-[20%] left-3 -z-1" />
          </div>

          <RotatingTextCircle
            text="ORRA • SECURE INFRASTRUCTURE • "
            icon={ShieldCheck}
            iconSize={22}
          />
        </div>
      </LandingContainer>
    </section>
  );
}
