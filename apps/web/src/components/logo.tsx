"use client";

import Image, { type ImageProps } from "next/image";
import Link from "next/link";
import { useSidebar } from "@orra/ui/components/sidebar";
import { cn } from "@orra/ui/lib/utils";
import type { Route } from "next";

interface LogoProps {
  /** Path relative to /public directory or remote URL */
  src?: string;
  /** Alternate image URL shown in light mode (src is used in dark mode) */
  lightSrc?: string;
  /** Fixed width & height in px. Ignored when `fill` is true. */
  size?: number;
  /** Enables Next.js fill mode for responsive scaling based on parent container. */
  fill?: boolean;
  /** Class names applied to the root <Link> wrapper. */
  className?: string;
  /** Class names applied directly to the internal Next.js <Image /> element. */
  imageClassName?: string;
  href?: string;
  /** Force text to show when outside of a SidebarProvider context */
  showText?: boolean;
}

export function Logo({
  src = "https://eqr61bekec.ufs.sh/f/sH4weU3V69zXnzhdeSMk3esQXWfzAdqRZFS04jaIGwr1umCg",
  lightSrc,
  size = 32,
  fill = false,
  className,
  imageClassName,
  href = "/",
  showText,
}: LogoProps) {
  // Safely attempt to read sidebar context
  let isExpanded = true;
  try {
    const sidebar = useSidebar();
    isExpanded = sidebar.state === "expanded";
  } catch {
    // Falls back to showText if used outside SidebarProvider
    isExpanded = showText ?? true;
  }

  const shouldDisplayText = showText !== undefined ? showText : isExpanded;

  const hasLightVariant = Boolean(lightSrc);
  const imageBaseClass =
    "object-contain transition-transform duration-300 hover:scale-105";

  return (
    <Link
      href={href as Route}
      className={cn(
        "flex items-center gap-2.5 px-1 py-1 rounded-lg select-none outline-none focus-visible:ring-2 focus-visible:ring-landing-violet-400 transition-opacity hover:opacity-90",
        className,
      )}
    >
      {/* Dynamic Sizing / Fill SVG Image Wrapper */}
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center",
          fill ? "w-full h-full" : undefined,
        )}
        style={!fill ? { width: `${size}px`, height: `${size}px` } : undefined}
      >
        {hasLightVariant ? (
          <>
            {/* Dark mode variant */}
            <Image
              src={src}
              alt="Orra Logo"
              fill={fill}
              width={!fill ? size : undefined}
              height={!fill ? size : undefined}
              priority
              className={cn(
                imageBaseClass,
                "hidden dark:block",
                imageClassName,
              )}
            />
            {/* Light mode variant */}
            <Image
              src={lightSrc as string}
              alt="Orra Logo"
              fill={fill}
              width={!fill ? size : undefined}
              height={!fill ? size : undefined}
              priority
              className={cn(
                imageBaseClass,
                "block dark:hidden",
                imageClassName,
              )}
            />
          </>
        ) : (
          <Image
            src={src}
            alt="Orra Logo"
            fill={fill}
            width={!fill ? size : undefined}
            height={!fill ? size : undefined}
            priority
            className={cn(imageBaseClass, imageClassName)}
          />
        )}
      </div>

      {/* Brand Text */}
      {shouldDisplayText && (
        <span className="text-[20px] font-semibold tracking-wide text-foreground transition-opacity duration-200 font-rostex">
          Orra
        </span>
      )}
    </Link>
  );
}
