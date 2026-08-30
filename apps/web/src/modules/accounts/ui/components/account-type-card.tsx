import { useEffect, useState } from "react";
import { cn } from "@orra/ui/lib/utils";
import { ACCOUNT_TYPE_CONFIG } from "../../constants";
import { formatAmount } from "@/lib/utils";
import { AccountTypeBadge } from "./account-badges";
import type { AccountType } from "@orra/types";

const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`;

const AURORA_CONFIG: Record<
  AccountType,
  {
    baseGradient: string;
    bloomGradient: string;
    bevelColor: string;
    sweepColor: string;
    iconGlow: string;
  }
> = {
  checking: {
    baseGradient:
      "radial-gradient(ellipse_at_30%_0%,rgba(40,60,180,0.85)_0%,rgba(15,10,50,1)_50%,rgba(6,4,14,1)_100%)",
    bloomGradient:
      "radial-gradient(ellipse_70%_55%_at_25%_0%,rgba(80,140,255,0.28),transparent_65%)",
    bevelColor: "from-transparent via-blue-400/25 to-transparent",
    sweepColor: "from-transparent via-blue-400/60 to-transparent",
    iconGlow: "shadow-[0_0_20px_rgba(80,140,255,0.3)]",
  },
  savings: {
    baseGradient:
      "radial-gradient(ellipse at 30% 100%, rgba(55,25,110,0.85) 0%, rgba(18,10,42,1) 55%, rgba(6,4,14,1) 100%)",
    bloomGradient:
      "radial-gradient(ellipse 55% 50% at 25% 100%, rgba(60,210,90,0.10), transparent 60%)",
    bevelColor: "from-transparent via-emerald-400/20 to-transparent",
    sweepColor: "from-transparent via-emerald-400/50 to-transparent",
    iconGlow: "shadow-[0_0_20px_rgba(60,220,140,0.25)]",
  },
  credit: {
    baseGradient:
      "radial-gradient(ellipse at 80% 50%, rgba(80,60,120,0.9) 0%, rgba(20,10,45,1) 55%, rgba(6,4,14,1) 100%)",
    bloomGradient:
      "radial-gradient(ellipse_70%_55%_at_25%_0%,rgba(255,80,140,0.15),transparent_65%)",
    bevelColor: "from-transparent via-rose-400/25 to-transparent",
    sweepColor: "from-transparent via-rose-400/55 to-transparent",
    iconGlow: "shadow-[0_0_20px_rgba(150,120,230,0.30)]",
  },

  investment: {
    baseGradient:
      "radial-gradient(ellipse at 25% 0%, rgba(60,30,120,0.9) 0%, rgba(20,10,45,1) 50%, rgba(6,4,14,1) 100%)",
    bloomGradient:
      "radial-gradient(ellipse_55%_50%_at_20%_100%,rgba(67,10,200,0.18),transparent_60%)",
    bevelColor: "from-transparent via-violet-400/20 to-transparent",
    sweepColor: "from-transparent via-violet-400/50 to-transparent",
    iconGlow: "shadow-[0_0_20px_rgba(140,100,220,0.35)]",
  },
  crypto: {
    baseGradient:
      "radial-gradient(ellipse_at_30%_0%,rgba(30,50,120,0.5)_0%,rgba(20,10,45,1)_50%,rgba(6,4,14,1)_100%)",
    bloomGradient:
      "radial-gradient(ellipse_60%_55%_at_80%_100%,rgba(255,140,60,0.12),transparent_60%)",
    bevelColor: "from-transparent via-yellow-400/20 to-transparent",
    sweepColor: "from-transparent via-yellow-400/50 to-transparent",
    iconGlow: "shadow-[0_0_20px_rgba(255,110,10,0.25)]",
  },
};

function useMaskedNumber(seed: string, intervalMs: number) {
  const rand = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++)
      h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
    return Math.abs(h);
  };
  const generate = () => {
    const base = rand(seed + Date.now().toString().slice(-5));
    const last4 = String((base % 9000) + 1000);
    return `•••• •••• •••• ${last4}`;
  };
  const [masked, setMasked] = useState(() => generate());
  useEffect(() => {
    const t = setInterval(() => setMasked(generate()), intervalMs);
    return () => clearInterval(t);
  }, [seed, intervalMs]);
  return masked;
}

const ROTATE_MS: Record<string, number> = {
  checking: 17000,
  savings: 23000,
  credit: 31000,
  investment: 19000,
  crypto: 27000,
};

function NfcIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      className="text-white/30"
    >
      <path
        d="M12 2C10 6 10 18 12 22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M16 4.5C15 8 15 16 16 19.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M20 7C20 10.5 20 13.5 20 17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

export function AccountTypeCard({
  type,
  totalBalance,
  accountCount,
  isBalanceVisible,
}: {
  type: AccountType;
  totalBalance: number;
  accountCount: number;
  isBalanceVisible: boolean;
}) {
  const config = ACCOUNT_TYPE_CONFIG[type];
  const aurora = AURORA_CONFIG[type];
  const masked = useMaskedNumber(type, ROTATE_MS[type] ?? 21000);
  if (!config) return null;

  const isEmpty = accountCount === 0;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl p-px",
        "h-62.5 w-full cursor-pointer select-none",
        "ring-1 ring-white/[0.07]",
        "transition-shadow duration-500 ease-out",
        isEmpty && "opacity-40 saturate-50",
      )}
      style={{
        background: aurora.baseGradient.replace(/_/g, " "),
      }}
    >
      {/* Inner surface */}
      <div
        className="relative h-full w-full overflow-hidden rounded-[15px]"
        style={{
          background: aurora.baseGradient.replace(/_/g, " "),
        }}
      >
        {/* Aurora bloom — unique per card type */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: aurora.bloomGradient.replace(/_/g, " "),
          }}
        />

        {/* Top bevel — type-specific tint */}
        <div
          className={cn(
            "absolute inset-x-0 top-0 h-px bg-linear-to-r",
            aurora.bevelColor,
          )}
        />

        {/* Inner radial light */}
        <div className="absolute inset-0 opacity-25 pointer-events-none bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.10),transparent_55%)]" />

        {/* TOP MOVING LIGHT — sweeps on hover */}
        <span
          className={cn(
            "pointer-events-none absolute top-0 z-20 h-px w-[55%] opacity-0 transition-all duration-500 left-[45%] group-hover:left-4 group-hover:opacity-60 bg-linear-to-r",
            aurora.sweepColor,
          )}
        />

        {/* BOTTOM MOVING LIGHT — sweeps on hover */}
        <span
          className={cn(
            "pointer-events-none absolute bottom-0 z-20 h-px w-[35%] opacity-0 transition-all duration-500 left-4 group-hover:left-[60%] group-hover:opacity-50 bg-linear-to-r",
            aurora.sweepColor,
          )}
        />

        {/* Noise grain */}
        <div
          className="absolute inset-0 opacity-[0.07] mix-blend-screen pointer-events-none"
          style={{ backgroundImage: NOISE, backgroundSize: "200px 200px" }}
        />

        <div className="relative z-10 flex flex-col justify-between h-full p-5">
          <div
            className={cn(
              "w-fit p-2 rounded-full backdrop-blur-md bg-black/20 border-black/30 shadow-md",
            )}
          >
            <AccountTypeBadge type={type} variant="icon" />
          </div>

          {/* MIDDLE: Balance */}
          <div className="space-y-0.5">
            <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest">
              {isEmpty ? "No accounts" : "Available balance"}
            </p>
            {!isEmpty && (
              <p
                className={cn(
                  "text-2xl font-bold text-white tabular-nums tracking-widest transition-all duration-300",
                  !isBalanceVisible && "select-none",
                )}
              >
                {isBalanceVisible
                  ? formatAmount(Math.abs(totalBalance))
                  : "$ ••••"}
              </p>
            )}
          </div>

          {/* BOTTOM: Masked account number + shine line */}
          <div className="space-y-2">
            <div className="h-px w-full bg-linear-to-r from-transparent via-white/15 to-transparent" />
            <div className="flex items-end justify-between">
              <p
                className={cn(
                  "text-[11px] font-mono text-white/35 tracking-[0.18em] transition-all duration-700",
                  !isBalanceVisible && "blur-sm",
                )}
              >
                {masked}
              </p>
              <p className="text-[10px] font-mono text-white/25">
                {isEmpty
                  ? "——"
                  : `${accountCount} ${accountCount === 1 ? "acct" : "accts"}`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
