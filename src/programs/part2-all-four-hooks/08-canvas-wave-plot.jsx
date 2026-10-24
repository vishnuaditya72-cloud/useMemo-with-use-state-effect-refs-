/**
 * HOOKS: useState + useEffect + useRef + useMemo
 *
 * useState  -> frequency, amplitude, noise, line colour
 * useRef    -> the <canvas> DOM node + draw counter
 * useMemo   -> generates 800 data points + stats. Depends on freq/amp/noise ONLY
 * useEffect -> draws the points onto the canvas (an imperative, non-React API) whenever points OR colour change
 *
 * Pattern: useMemo computes the DATA, useEffect pushes it to the OUTSIDE world.
 * Changing colour redraws but does NOT regenerate the data.
 */
import { useEffect, useMemo, useRef, useState } from "react";

const W = 720, H = 260, N = 800;
const COLORS = ["#7c9cff", "#4ade80", "#fbbf24", "#f87171"];
let pointRuns = 0;

export default function CanvasWave() {
  const [freq, setFreq] = useState(4);
  const [amp, setAmp] = useState(90);
  const [noise, setNoise] = useState(10);
  const [color, setColor] = useState(COLORS[0]);
  const canvasRef = useRef(null);
  const draws = useRef(0);

  const points = useMemo(() => {
    pointRuns++;
    return Array.from({ length: N }, (_, i) => {
      const jitter = (Math.sin(i * 12.9898) * 43758.5453) % 1; // deterministic pseudo-random in (-1,1)
      return amp * Math.sin((2 * Math.PI * freq * i) / N) + jitter * noise;
    });
  }, [freq, amp, noise]);

  const stats = useMemo(() => {
    const rms = Math.sqrt(points.reduce((s, y) => s + y * y, 0) / points.length);
    return { min: Math.min(...points), max: Math.max(...points), rms };
  }, [points]);

  useEffect(() => {
    draws.current++;
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = "#2a2f3a";
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((y, i) => {
      const px = (i / (N - 1)) * W, py = H / 2 - y;
      i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
    });
    ctx.stroke();
  }, [points, color]);

  const slider = (label, value, set, min, max) => (
    <label className="row">
      <span style={{ width: 90 }}>{label}: {value}</span>
      <input type="range" min={min} max={max} value={value} onChange={(e) => set(+e.target.value)} />
    </label>
  );

  return (
    <div>
      <h1>Canvas wave plot</h1>
      <p className="lead">useMemo makes the data, useEffect paints it, useRef holds the canvas.</p>
      <div className="panel">
        {slider("Frequency", freq, setFreq, 1, 20)}
        {slider("Amplitude", amp, setAmp, 10, 120)}
        {slider("Noise", noise, setNoise, 0, 60)}
        <div className="row">
          {COLORS.map((c) => <button key={c} className={`btn ${c === color ? "on" : ""}`} style={{ borderColor: c }} onClick={() => setColor(c)}>{c}</button>)}
        </div>
        <canvas ref={canvasRef} width={W} height={H} style={{ width: "100%", background: "#0b0d12", borderRadius: 8 }} />
        <p>
          <span className="badge">min {stats.min.toFixed(1)}</span>{" "}<span className="badge">max {stats.max.toFixed(1)}</span>{" "}
          <span className="badge">rms {stats.rms.toFixed(1)}</span>{" "}
          points generated: <span className="badge warn">{pointRuns}</span>{" "}
          canvas redraws: <span className="badge warn">{draws.current}</span>
        </p>
      </div>
      <div className="try"><b>Try this:</b> click colours — redraws climb, "points generated" doesn't. Move a slider — both climb.</div>
    </div>
  );
}
