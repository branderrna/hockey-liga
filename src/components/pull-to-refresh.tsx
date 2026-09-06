import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

/*
 * Pull-to-refresh, for the home-screen app only.
 *
 * Launched from the iPhone home screen there is no browser chrome, so there is
 * no reload button and no native pull-to-refresh — the page can be left with no
 * way to pick up new scores short of force-quitting. In a browser tab all of
 * that already exists, so this stays out of the way there.
 *
 * A full document reload is deliberate. Fixtures are bundled at build time
 * rather than fetched (see src/data/matches.generated.ts), so invalidating the
 * router would re-render the same data. Only a new document from the Worker
 * carries a newer deploy.
 */

/** Finger travel, in px, before the gesture arms. */
const THRESHOLD = 72;
/** How far the indicator can travel, so a long drag does not run away. */
const MAX_TRAVEL = 110;
/** Drag resistance: the indicator moves at this fraction of the finger. */
const RESISTANCE = 0.5;

const isStandalone = () =>
  // iOS sets this on home-screen launches; the media query covers installed
  // PWAs elsewhere. iOS only reports the media query from 16.4, so both.
  (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
  window.matchMedia("(display-mode: standalone)").matches;

export function PullToRefresh() {
  // Resolved after mount: the server cannot know how the app was launched, and
  // rendering the indicator during SSR would not match the client.
  const [enabled, setEnabled] = useState(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const pullRef = useRef(0);

  useEffect(() => setEnabled(isStandalone()), []);

  useEffect(() => {
    if (!enabled) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let decided = false;

    const setPullTo = (next: number) => {
      pullRef.current = next;
      setPull(next);
    };

    const onStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      // Multi-touch is a pinch or a two-finger scroll, never this gesture.
      if (e.touches.length !== 1 || !touch) return;
      // Only from a true resting position at the top of the document.
      if (window.scrollY > 0) return;
      // Overlays own their own scrolling; a drag inside one is not a page pull.
      if ((e.target as Element | null)?.closest?.("[data-no-pull-to-refresh]")) return;
      startX = touch.clientX;
      startY = touch.clientY;
      tracking = true;
      decided = false;
    };

    const onMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!tracking || !touch) return;

      const dy = touch.clientY - startY;
      const dx = touch.clientX - startX;

      // Settle the axis once, on the first movement that is big enough to read.
      // The weekend strip is a horizontal scroller sitting near the top of the
      // page: without this, swiping it sideways would be swallowed as a pull.
      if (!decided) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        decided = true;
        if (Math.abs(dx) >= Math.abs(dy)) {
          tracking = false;
          return;
        }
      }

      if (dy <= 0 || window.scrollY > 0) {
        tracking = false;
        setPullTo(0);
        return;
      }

      // Non-passive, so this suppresses the rubber-band that would otherwise
      // drag the whole document out from under the indicator.
      e.preventDefault();
      setPullTo(Math.min(MAX_TRAVEL, dy * RESISTANCE));
    };

    const onEnd = () => {
      if (!tracking) return;
      tracking = false;
      if (pullRef.current >= THRESHOLD) {
        setRefreshing(true);
        window.location.reload();
        return;
      }
      setPullTo(0);
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [enabled]);

  if (!enabled || (pull === 0 && !refreshing)) return null;

  const armed = pull >= THRESHOLD;

  return (
    <div
      // aria-hidden: this mirrors a touch gesture that a screen reader user is
      // not performing, and it announces nothing they can act on.
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center"
      style={{ transform: `translateY(${refreshing ? THRESHOLD : pull}px)` }}
    >
      <div className="surface flex items-center gap-2 px-3 py-1.5 shadow-[0_6px_20px_oklch(0_0_0/0.09)]">
        <RefreshCw
          className={`size-3 text-muted-foreground ${refreshing ? "animate-spin" : ""}`}
          style={refreshing ? undefined : { transform: `rotate(${(pull / THRESHOLD) * 180}deg)` }}
        />
        <span className="meta-mono">
          {refreshing ? "Refreshing…" : armed ? "Release to refresh" : "Pull to refresh"}
        </span>
      </div>
    </div>
  );
}
