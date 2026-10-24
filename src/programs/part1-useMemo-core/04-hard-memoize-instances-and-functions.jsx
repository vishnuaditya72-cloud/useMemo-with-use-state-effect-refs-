/**
 * LEVEL: LITTLE HARD  |  CONCEPT: memoize object INSTANCES and FUNCTIONS
 *
 * 1) Creating `new Intl.NumberFormat(...)` is surprisingly costly. Create it once per
 *    (locale, currency), not on every render.
 * 2) useMemo can return a FUNCTION: useMemo(() => (x) => ..., deps).
 *    That is how you get a stable function identity WITHOUT useCallback
 *    (useCallback(fn, deps) is literally useMemo(() => fn, deps)).
 * 3) A memoized "actions" object with [] deps + functional setState = handlers that never change.
 */
import { memo, useMemo, useState } from "react";

const PRESETS = [
  { label: "US  · USD", locale: "en-US", currency: "USD" },
  { label: "India · INR", locale: "en-IN", currency: "INR" },
  { label: "Germany · EUR", locale: "de-DE", currency: "EUR" },
  { label: "Japan · JPY", locale: "ja-JP", currency: "JPY" },
];

let formatterBuilds = 0;
const rowRenders = {};

const Row = memo(function Row({ item, format, actions }) {
  rowRenders[item.id] = (rowRenders[item.id] || 0) + 1;
  return (
    <tr>
      <td>{item.name}</td>
      <td>{format(item.price)}</td>
      <td>
        <button className="btn" onClick={() => actions.dec(item.id)}>−</button>{" "}
        {item.qty}{" "}
        <button className="btn" onClick={() => actions.inc(item.id)}>+</button>
      </td>
      <td>{format(item.price * item.qty)}</td>
      <td><span className="badge">renders: {rowRenders[item.id]}</span></td>
    </tr>
  );
});

export default function MemoizeInstancesAndFunctions() {
  const [presetIdx, setPresetIdx] = useState(0);
  const [rows, setRows] = useState([
    { id: 1, name: "Keyboard", price: 4999, qty: 1 },
    { id: 2, name: "Monitor", price: 15999, qty: 2 },
    { id: 3, name: "Webcam", price: 3499, qty: 1 },
  ]);
  const [note, setNote] = useState(""); // typing here re-renders the parent on every keystroke

  const preset = PRESETS[presetIdx];

  // (1)+(2): build the formatter ONCE per preset and expose it as a stable function.
  const format = useMemo(() => {
    formatterBuilds++;
    const nf = new Intl.NumberFormat(preset.locale, { style: "currency", currency: preset.currency });
    return (n) => nf.format(n);
  }, [preset.locale, preset.currency]);

  // (3): stable handlers. [] deps is safe because we use functional updates (prev => next).
  const actions = useMemo(
    () => ({
      inc: (id) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, qty: r.qty + 1 } : r))),
      dec: (id) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, qty: Math.max(0, r.qty - 1) } : r))),
    }),
    []
  );

  const total = useMemo(() => rows.reduce((s, r) => s + r.price * r.qty, 0), [rows]);

  return (
    <div>
      <h1>Memoize instances & functions</h1>
      <p className="lead">Formatter built {formatterBuilds}× so far. Rows are React.memo children.</p>

      <div className="panel">
        <div className="row">
          {PRESETS.map((p, i) => (
            <button key={p.label} className={`btn ${i === presetIdx ? "on" : ""}`} onClick={() => setPresetIdx(i)}>{p.label}</button>
          ))}
        </div>
        <div className="row">
          <input placeholder="type a note (re-renders parent)…" value={note} onChange={(e) => setNote(e.target.value)} />
          <span>Formatter builds: <span className="badge warn">{formatterBuilds}</span></span>
        </div>
        <table>
          <thead><tr><th>Item</th><th>Price</th><th>Qty</th><th>Line total</th><th /></tr></thead>
          <tbody>{rows.map((r) => <Row key={r.id} item={r} format={format} actions={actions} />)}</tbody>
        </table>
        <p>Total: <span className="badge good">{format(total)}</span></p>
      </div>

      <div className="try">
        <b>Try this:</b> type in the note box — no row re-renders and no formatter rebuild (stable `format` + `actions`).
        Click + on one item — only THAT row re-renders. Switch currency — formatter rebuilds once and all rows re-render (their `format` prop truly changed).
      </div>
    </div>
  );
}
