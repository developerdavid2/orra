import { useIntersectionObserver } from "@/hooks/ui/use-intersection-observer";
import { Button } from "@orra/ui/components/button";
import { Spinner } from "@orra/ui/components/spinner";
import { cn } from "@orra/ui/lib/utils";
import { useEffect } from "react";

interface InfiniteScrollProps {
  isManual?: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  isLoading?: boolean;
  hideEndMessage?: boolean;
}

export const InfiniteScroll = ({
  isManual = false,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  isLoading = false,
  hideEndMessage,
}: InfiniteScrollProps) => {
  const { targetRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.5,
    rootMargin: "100px",
  });

  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage && !isManual) {
      fetchNextPage();
    }
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isIntersecting,
    isManual,
  ]);

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 p-4",
        hideEndMessage && "invisible hidden",
      )}
    >
      <div ref={targetRef} />
      {hasNextPage ? (
        <Button
          variant="secondary"
          disabled={!hasNextPage || isFetchingNextPage || isLoading}
          onClick={() => fetchNextPage()}
          className="gap-2"
        >
          {isFetchingNextPage ? (
            <>
              <Spinner className="h-4 w-4" />
              Loading more...
            </>
          ) : (
            "Load more"
          )}
        </Button>
      ) : !hideEndMessage ? (
        <p className="text-xs text-muted-foreground">
          You have reached the end of the list
        </p>
      ) : null}
    </div>
  );
};
