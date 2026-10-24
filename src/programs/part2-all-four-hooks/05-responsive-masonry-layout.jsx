/**
 * HOOKS: useState + useEffect + useRef + useMemo
 *
 * useState  -> measured container width
 * useEffect -> ResizeObserver subscription (with cleanup)
 * useRef    -> the container DOM node + counters
 * useMemo   -> masonry column distribution. KEY IDEA: it depends on `cols` (a few discrete values),
 *              NOT on `width` (changes every pixel you drag). Depend on the coarsest value that matters.
 */
import { useEffect, useMemo, useRef, useState } from "react";

const ITEMS = Array.from({ length: 28 }, (_, i) => ({ id: i + 1, h: 50 + ((i * 47) % 90) }));

export default function ResponsiveMasonry() {
  const [width, setWidth] = useState(0);
  const boxRef = useRef(null);
  const widthUpdates = useRef(0);
  const layoutRuns = useRef(0);

  useEffect(() => {
    const el = boxRef.current;
    setWidth(el.clientWidth);
    const ro = new ResizeObserver(([entry]) => {
      widthUpdates.current++;
      setWidth(Math.round(entry.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cols = width < 420 ? 1 : width < 640 ? 2 : width < 860 ? 3 : 4; // cheap -> no memo

  const columns = useMemo(() => {
    layoutRuns.current++;
    const cs = Array.from({ length: cols }, () => ({ h: 0, items: [] }));
    for (const item of ITEMS) {
      const shortest = cs.reduce((a, b) => (b.h < a.h ? b : a));
      shortest.items.push(item);
      shortest.h += item.h + 8;
    }
    return cs;
  }, [cols]);

  return (
    <div>
      <h1>Responsive masonry layout</h1>
      <p className="lead">Drag the bottom-right corner of the box to resize it.</p>
      <div className="row">
        <span>width: <span className="badge">{width}px</span></span>
        <span>columns: <span className="badge good">{cols}</span></span>
        <span>resize events: <span className="badge">{widthUpdates.current}</span></span>
        <span>layout computed: <span className="badge warn">{layoutRuns.current}</span></span>
      </div>
      <div ref={boxRef} style={{ resize: "horizontal", overflow: "auto", border: "1px dashed var(--acc)", padding: 10, minWidth: 260, maxWidth: "100%", width: "100%" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          {columns.map((c, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              {c.items.map((it) => <div key={it.id} className="tile" style={{ height: it.h }}>#{it.id}</div>)}
            </div>
          ))}
        </div>
      </div>
      <div className="try"><b>Try this:</b> drag slowly. "resize events" climbs on every pixel, but "layout computed" only moves when the column count changes.</div>
    </div>
  );
}
