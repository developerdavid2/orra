// lib/prewarmed-link.ts
"use client";

import type { UseQueryResult } from "@tanstack/react-query";

export function usePrewarmedLink(query: UseQueryResult<string, Error>) {
  const { data: url, isFetching, refetch } = query;

  const prewarm = () => {
    if (!url && !isFetching) refetch();
  };

  const onClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (url) return; // real href already set — let the browser navigate normally
    e.preventDefault();
    const win = window.open("", "_blank", "noopener,noreferrer");
    const result = await refetch();
    if (result.data) {
      win?.location.assign(result.data);
    } else {
      win?.close();
    }
  };

  return {
    href: url ?? "#",
    isFetching,
    onPointerEnter: prewarm,
    onFocus: prewarm,
    onClick,
  };
}
