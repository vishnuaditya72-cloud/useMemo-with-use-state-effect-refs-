/**
 * HOOKS: useState + useEffect + useRef + useMemo
 *
 * Renders 100,000 rows while only ~20 DOM nodes exist (windowing / virtualization).
 *
 * useState  -> scrollTop and viewport height
 * useEffect -> subscribes to the scroll + window resize events (cleanup removes them)
 * useRef    -> the scroll container (to measure it and to scrollTo a row)
 * useMemo   -> the visible [start, end) range, then the visible slice.
 *
 * Expert detail: the slice memo depends on the PRIMITIVES `start` and `end`, not on the range object.
 * Scrolling 1px changes scrollTop but usually not `start`/`end` -> the slice and its rows are reused.
 */
import { useEffect, useMemo, useRef, useState } from "react";

const TOTAL = 100_000, ROW_H = 36, OVERSCAN = 5;

export default function VirtualList() {
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(400);
  const [jump, setJump] = useState("");
  const viewRef = useRef(null);
  const sliceRuns = useRef(0);

  const rows = useMemo(
    () => Array.from({ length: TOTAL }, (_, i) => ({ id: i, label: `Row ${i.toLocaleString()}`, value: (i * 7919) % 1000 })),
    []
  );

  useEffect(() => {
    const el = viewRef.current;
    const measure = () => setViewportH(el.clientHeight);
    const onScroll = () => setScrollTop(el.scrollTop);
    measure();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    return () => { el.removeEventListener("scroll", onScroll); window.removeEventListener("resize", measure); };
  }, []);

  const { start, end } = useMemo(() => ({
    start: Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN),
    end: Math.min(TOTAL, Math.ceil((scrollTop + viewportH) / ROW_H) + OVERSCAN),
  }), [scrollTop, viewportH]);

  const visible = useMemo(() => { sliceRuns.current++; return rows.slice(start, end); }, [rows, start, end]);

  const goTo = (e) => {
    e.preventDefault();
    const n = Math.min(TOTAL - 1, Math.max(0, parseInt(jump, 10) || 0));
    viewRef.current.scrollTo({ top: n * ROW_H });
  };

  return (
    <div>
      <h1>Virtualized list — 100,000 rows</h1>
      <p className="lead">Open DevTools → Elements and watch: only a couple dozen rows exist at any time.</p>
      <form className="row" onSubmit={goTo}>
        <input placeholder="jump to row #" value={jump} onChange={(e) => setJump(e.target.value)} />
        <button className="btn" type="submit">Go</button>
        <span>rendered rows: <span className="badge good">{visible.length}</span></span>
        <span>range: <span className="badge">{start.toLocaleString()}–{end.toLocaleString()}</span></span>
        <span>slice recomputed: <span className="badge warn">{sliceRuns.current}</span></span>
      </form>
      <div ref={viewRef} style={{ height: 420, overflow: "auto", border: "1px solid var(--line)", borderRadius: 8, position: "relative" }}>
        <div style={{ height: TOTAL * ROW_H, position: "relative" }}>
          <div style={{ position: "absolute", top: start * ROW_H, left: 0, right: 0 }}>
            {visible.map((r) => (
              <div key={r.id} style={{ height: ROW_H, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", borderBottom: "1px solid var(--line)", background: r.id % 2 ? "var(--panel)" : "var(--panel2)" }}>
                <span>{r.label}</span><span className="badge">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="try"><b>Try this:</b> jump to row 99,990, then drag the scrollbar around. Smooth, even though the list is 100k long.</div>
    </div>
  );
}
