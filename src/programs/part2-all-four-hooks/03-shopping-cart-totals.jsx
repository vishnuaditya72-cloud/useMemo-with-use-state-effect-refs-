/**
 * HOOKS: useState + useEffect + useRef + useMemo
 *
 * useState  -> cart quantities, coupon input text, applied coupon
 * useEffect -> syncs document.title with the cart size (an external system!)
 * useRef    -> coupon <input>, so we can select its text when the code is invalid
 * useMemo   -> line items + subtotal + discount + tax + total, ONLY when cart/coupon change
 *              (typing in the coupon box does not recompute totals)
 */
import { useEffect, useMemo, useRef, useState } from "react";

const CATALOG = [
  { id: "kb", name: "Mechanical keyboard", price: 89.0 },
  { id: "ms", name: "Wireless mouse", price: 39.5 },
  { id: "mn", name: "27″ monitor", price: 279.99 },
  { id: "hd", name: "Headset", price: 64.25 },
];
const COUPONS = { SAVE10: { type: "percent", value: 10 }, FLAT20: { type: "flat", value: 20 } };
const TAX_RATE = 0.08;

export default function CartTotals() {
  const [cart, setCart] = useState({});
  const [couponText, setCouponText] = useState("");
  const [applied, setApplied] = useState(null);
  const [message, setMessage] = useState("");
  const couponRef = useRef(null);
  const totalsRuns = useRef(0);

  const itemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  useEffect(() => {
    document.title = itemCount ? `Cart (${itemCount}) · useMemo Playground` : "useMemo Playground";
    return () => { document.title = "useMemo Playground"; };
  }, [itemCount]);

  const totals = useMemo(() => {
    totalsRuns.current++;
    const lines = CATALOG.filter((p) => cart[p.id]).map((p) => ({ ...p, qty: cart[p.id], line: p.price * cart[p.id] }));
    const subtotal = lines.reduce((s, l) => s + l.line, 0);
    const c = applied && COUPONS[applied];
    const discount = !c ? 0 : c.type === "percent" ? (subtotal * c.value) / 100 : Math.min(c.value, subtotal);
    const tax = (subtotal - discount) * TAX_RATE;
    return { lines, subtotal, discount, tax, total: subtotal - discount + tax };
  }, [cart, applied]);

  const change = (id, d) => setCart((c) => {
    const q = Math.max(0, (c[id] || 0) + d);
    const next = { ...c, [id]: q };
    if (!q) delete next[id];
    return next;
  });

  const applyCoupon = () => {
    const code = couponText.trim().toUpperCase();
    if (COUPONS[code]) { setApplied(code); setMessage(`Applied ${code}`); }
    else { setApplied(null); setMessage("Invalid code (try SAVE10 or FLAT20)"); couponRef.current.select(); }
  };

  const $ = (n) => `$${n.toFixed(2)}`;
  return (
    <div>
      <h1>Shopping cart totals</h1>
      <p className="lead">Watch the browser tab title change too (useEffect syncing an external system).</p>
      <div className="panel">
        {CATALOG.map((p) => (
          <div className="row" key={p.id}>
            <span style={{ width: 200 }}>{p.name}</span><span style={{ width: 70 }}>{$(p.price)}</span>
            <button className="btn" onClick={() => change(p.id, -1)}>−</button>
            <span style={{ width: 24, textAlign: "center" }}>{cart[p.id] || 0}</span>
            <button className="btn" onClick={() => change(p.id, 1)}>+</button>
          </div>
        ))}
      </div>
      <div className="panel">
        <div className="row">
          <input ref={couponRef} placeholder="coupon code" value={couponText} onChange={(e) => setCouponText(e.target.value)} />
          <button className="btn" onClick={applyCoupon}>Apply</button>
          <span className={applied ? "ok" : "err"}>{message}</span>
        </div>
        <table><tbody>
          <tr><td>Subtotal</td><td>{$(totals.subtotal)}</td></tr>
          <tr><td>Discount</td><td>−{$(totals.discount)}</td></tr>
          <tr><td>Tax (8%)</td><td>{$(totals.tax)}</td></tr>
          <tr><td><b>Total</b></td><td><b>{$(totals.total)}</b></td></tr>
        </tbody></table>
        <p>totals computed: <span className="badge warn">{totalsRuns.current}</span></p>
      </div>
      <div className="try"><b>Try this:</b> type in the coupon box — "totals computed" doesn't change until the cart or applied coupon does.</div>
    </div>
  );
}
