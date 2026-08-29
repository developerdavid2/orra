"use client";

import { Badge } from "@orra/ui/components/badge";
import { Button } from "@orra/ui/components/button";
import { Card, CardContent, CardHeader } from "@orra/ui/components/card";
import { cn } from "@orra/ui/lib/utils";
import { Check, Loader, Star } from "lucide-react";

const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`;

const AURORA = {
  baseGradient:
    "radial-gradient(ellipse at 30% 100%, rgba(55,25,110,0.85) 0%, rgba(18,10,42,1) 55%, rgba(6,4,14,1) 100%)",
  bloomGradient:
    "radial-gradient(ellipse 55% 50% at 25% 100%, rgba(60,210,90,0.10), transparent 60%)",
  bevelColor: "from-transparent via-emerald-400/20 to-transparent",
  sweepColor: "from-transparent via-emerald-400/50 to-transparent",
};

interface PlanCardProps {
  name: string;
  description: string;
  features: string[];
  priceLabel: string;
  isCurrent?: boolean;
  onUpgrade?: () => void;
  isUpgrading?: boolean;
  upgradeDisabled?: boolean;
  upgradeLabel?: string;
  highlighted?: boolean;
}

export function PlanCard({
  name,
  description,
  features,
  priceLabel,
  isCurrent = false,
  onUpgrade,
  isUpgrading = false,
  upgradeDisabled = false,
  upgradeLabel,
  highlighted = false,
}: PlanCardProps) {
  return (
    <Card
      className={cn(
        "group relative flex flex-col overflow-hidden border-0",
        !highlighted && "border bg-card",
        isCurrent
          ? "ring-1 ring-primary/40"
          : highlighted && "ring-1 ring-white/[0.07] shadow-lg",
      )}
      style={highlighted ? { background: AURORA.baseGradient } : undefined}
    >
      {highlighted && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: AURORA.bloomGradient }}
          />
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-px bg-linear-to-r",
              AURORA.bevelColor,
            )}
          />
          <div className="absolute inset-0 opacity-25 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.10),transparent_55%)]" />
          <span
            className={cn(
              "pointer-events-none absolute top-0 z-20 h-px w-[55%] opacity-0 transition-all duration-500 left-[45%] group-hover:left-4 group-hover:opacity-60 bg-linear-to-r",
              AURORA.sweepColor,
            )}
          />
          <span
            className={cn(
              "pointer-events-none absolute bottom-0 z-20 h-px w-[35%] opacity-0 transition-all duration-500 left-4 group-hover:left-[60%] group-hover:opacity-50 bg-linear-to-r",
              AURORA.sweepColor,
            )}
          />
          <div
            className="absolute inset-0 opacity-[0.07] mix-blend-screen pointer-events-none"
            style={{ backgroundImage: NOISE, backgroundSize: "200px 200px" }}
          />
        </>
      )}

      <div className="relative z-10 flex flex-1 flex-col">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <p
              className={cn(
                "text-base font-semibold",
                highlighted && "text-white",
              )}
            >
              {name}
            </p>
            {isCurrent ? (
              <Badge>Current plan</Badge>
            ) : highlighted ? (
              <Badge
                variant="default"
                className="bg-emerald-500/15 text-emerald-300 border-emerald-400/30"
              >
                <Star className="size-3 mr-1" />
                Most popular
              </Badge>
            ) : null}
          </div>

          <p
            className={cn(
              "text-sm",
              highlighted ? "text-white/50" : "text-muted-foreground",
            )}
          >
            {description}
          </p>

          <span
            className={cn(
              "mt-1 block font-mono text-2xl font-semibold tracking-tight tabular-nums",
              highlighted && "text-white",
            )}
          >
            {priceLabel}
          </span>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-5 pt-4">
          <ul className="space-y-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <Check
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    highlighted ? "text-emerald-400" : "text-primary",
                  )}
                />
                <span
                  className={
                    highlighted ? "text-white/60" : "text-muted-foreground"
                  }
                >
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          {onUpgrade && (
            <div className="mt-auto">
              <Button
                onClick={onUpgrade}
                disabled={isUpgrading || upgradeDisabled}
                variant={highlighted ? "default" : "outline"}
                className="w-full"
              >
                {isUpgrading && <Loader className="size-4 animate-spin" />}
                {isUpgrading ? "Redirecting..." : upgradeLabel}
              </Button>

              {upgradeDisabled && (
                <p
                  className={cn(
                    "mt-2 text-center text-xs",
                    highlighted ? "text-white/40" : "text-muted-foreground",
                  )}
                >
                  Billing is coming soon
                </p>
              )}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
