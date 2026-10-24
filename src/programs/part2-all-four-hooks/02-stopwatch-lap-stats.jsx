/**
 * HOOKS: useState + useEffect + useRef + useMemo
 *
 * useState  -> elapsed time, running flag, laps
 * useEffect -> starts/stops a 30ms interval based on `running` (cleanup clears it)
 * useRef    -> the start timestamp (changing it must NOT re-render) + a stats-run counter
 * useMemo   -> lap statistics. The stopwatch re-renders ~33×/sec, but stats depend only on `laps`
 */
import { useEffect, useMemo, useRef, useState } from "react";

const fmt = (ms) => {
  const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000), c = Math.floor((ms % 1000) / 10);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(c).padStart(2, "0")}`;
};

export default function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState([]); // newest first: { n, total, split }
  const startedAt = useRef(0);
  const statsRuns = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed(Date.now() - startedAt.current), 30);
    return () => clearInterval(id);
  }, [running]);

  const start = () => { startedAt.current = Date.now() - elapsed; setRunning(true); };
  const lap = () => {
    const lastTotal = laps.length ? laps[0].total : 0;
    setLaps([{ n: laps.length + 1, total: elapsed, split: elapsed - lastTotal }, ...laps]);
  };
  const reset = () => { setRunning(false); setElapsed(0); setLaps([]); };

  const stats = useMemo(() => {
    statsRuns.current++;
    if (!laps.length) return null;
    const splits = laps.map((l) => l.split);
    return {
      fastest: Math.min(...splits),
      slowest: Math.max(...splits),
      average: splits.reduce((a, b) => a + b, 0) / splits.length,
    };
  }, [laps]);

  return (
    <div>
      <h1>Stopwatch with lap statistics</h1>
      <p className="lead">The clock re-renders constantly; the stats only recompute when you add a lap.</p>
      <div className="panel">
        <div className="mono" style={{ fontSize: 44 }}>{fmt(elapsed)}</div>
        <div className="row">
          {running ? <button className="btn on" onClick={() => setRunning(false)}>Pause</button> : <button className="btn on" onClick={start}>Start</button>}
          <button className="btn" onClick={lap} disabled={!running}>Lap</button>
          <button className="btn" onClick={reset}>Reset</button>
          <span>stats computed: <span className="badge warn">{statsRuns.current}</span></span>
        </div>
        {stats && (
          <p>
            <span className="badge good">fastest {fmt(stats.fastest)}</span>{" "}
            <span className="badge bad">slowest {fmt(stats.slowest)}</span>{" "}
            <span className="badge">avg {fmt(stats.average)}</span>
          </p>
        )}
        <table><tbody>{laps.map((l) => <tr key={l.n}><td>Lap {l.n}</td><td className="mono">{fmt(l.split)}</td><td className="mono hint">{fmt(l.total)}</td></tr>)}</tbody></table>
      </div>
      <div className="try"><b>Try this:</b> start, then watch "stats computed" while time ticks — it stays at 1 until you press Lap.</div>
    </div>
  );
}
