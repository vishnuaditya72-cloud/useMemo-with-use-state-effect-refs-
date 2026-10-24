/**
 * HOOKS: useState + useEffect + useRef + useMemo
 *
 * useState  -> region, loaded data, status, client-side status filter
 * useEffect -> "fetches" orders whenever the region changes (fake API, 700ms delay — no internet needed)
 * useRef    -> request id, to IGNORE stale responses (race-condition guard) + fetch counter
 * useMemo   -> client-side filter and dashboard summary derived from the fetched data
 */
import { useEffect, useMemo, useRef, useState } from "react";

const REGIONS = ["North", "South", "East", "West"];
const STATUSES = ["paid", "pending", "refunded"];

function fakeFetchOrders(region) {
  // Earlier regions respond SLOWER on purpose so you can provoke a race condition.
  const delay = 1200 - REGIONS.indexOf(region) * 300;
  return new Promise((resolve) => {
    setTimeout(() => {
      let seed = region.length * 977 + REGIONS.indexOf(region) * 31;
      const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
      resolve(Array.from({ length: 3000 }, (_, i) => ({
        id: i + 1,
        customer: `Customer ${Math.floor(rnd() * 200)}`,
        amount: Math.round(rnd() * 50000) / 100,
        status: STATUSES[Math.floor(rnd() * 3)],
      })));
    }, delay);
  });
}

export default function AsyncDashboard() {
  const [region, setRegion] = useState("North");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const latestRequest = useRef(0);
  const fetches = useRef(0);

  useEffect(() => {
    const id = ++latestRequest.current;
    fetches.current++;
    setLoading(true);
    fakeFetchOrders(region).then((rows) => {
      if (id !== latestRequest.current) return; // a newer request exists -> drop this stale one
      setData(rows);
      setLoading(false);
    });
  }, [region]);

  const filtered = useMemo(
    () => (statusFilter === "all" ? data : data.filter((o) => o.status === statusFilter)),
    [data, statusFilter]
  );

  const summary = useMemo(() => {
    const byCustomer = new Map();
    let revenue = 0;
    for (const o of filtered) {
      revenue += o.amount;
      byCustomer.set(o.customer, (byCustomer.get(o.customer) || 0) + o.amount);
    }
    const top = [...byCustomer.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { count: filtered.length, revenue, avg: filtered.length ? revenue / filtered.length : 0, top };
  }, [filtered]);

  return (
    <div>
      <h1>Async data + dashboard</h1>
      <p className="lead">Fake API with different delays per region. Click regions quickly to see the race guard work.</p>
      <div className="panel">
        <div className="row">
          {REGIONS.map((r) => <button key={r} className={`btn ${r === region ? "on" : ""}`} onClick={() => setRegion(r)}>{r}</button>)}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">all statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <span>requests sent: <span className="badge warn">{fetches.current}</span></span>
        </div>
        {loading ? <p className="hint">Loading {region}…</p> : (
          <>
            <p>
              <span className="badge good">{summary.count} orders</span>{" "}
              <span className="badge">revenue ${summary.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>{" "}
              <span className="badge">avg ${summary.avg.toFixed(2)}</span>
            </p>
            <h4>Top customers</h4>
            <table><tbody>{summary.top.map(([c, v]) => <tr key={c}><td>{c}</td><td>${v.toFixed(2)}</td></tr>)}</tbody></table>
          </>
        )}
      </div>
      <div className="try"><b>Try this:</b> click North then quickly East. North is slower, so its response arrives AFTER East's — the useRef id check discards it, and you still see East. Changing the status filter is instant: no refetch, only the memos rerun.</div>
    </div>
  );
}
