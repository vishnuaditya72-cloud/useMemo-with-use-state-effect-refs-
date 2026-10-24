/**
 * LEVEL: EXPERT  |  CONCEPT: a CHAIN of useMemo stages, each with the MINIMUM dependencies
 *
 * rows ──> filtered ──> sorted ──> pageRows
 *              └──────> stats
 *
 * Each stage only reruns when ITS inputs change:
 *   - change page         -> only `pageRows` reruns
 *   - change sort         -> `sorted` + `pageRows` (filter & stats are skipped)
 *   - change search/dept  -> filter, sort, stats, page all rerun (upstream changed)
 *   - unrelated re-render -> nothing reruns
 *
 * Also notice what is NOT memoized: totalPages. It's trivial math — memoizing it would cost more than it saves.
 */
import { useMemo, useState } from "react";

const DEPTS = ["Engineering", "Sales", "Support", "Design", "Finance"];
const counts = { rows: 0, filter: 0, sort: 0, stats: 0, page: 0 };

function makeRows(n) {
  let seed = 42;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    name: `Employee ${i + 1}`,
    dept: DEPTS[Math.floor(rnd() * DEPTS.length)],
    salary: Math.round(30000 + rnd() * 90000),
    age: Math.round(21 + rnd() * 40),
  }));
}

export default function Pipeline() {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");
  const [sortKey, setSortKey] = useState("salary");
  const [dir, setDir] = useState("desc");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [tick, setTick] = useState(0);

  const rows = useMemo(() => { counts.rows++; return makeRows(20000); }, []);

  const filtered = useMemo(() => {
    counts.filter++;
    const q = search.trim().toLowerCase();
    return rows.filter((r) => (dept === "All" || r.dept === dept) && r.name.toLowerCase().includes(q));
  }, [rows, search, dept]);

  const sorted = useMemo(() => {
    counts.sort++;
    const m = dir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) =>
      typeof a[sortKey] === "string" ? a[sortKey].localeCompare(b[sortKey]) * m : (a[sortKey] - b[sortKey]) * m
    );
  }, [filtered, sortKey, dir]); // depends on `filtered`, NOT on search/dept directly

  const stats = useMemo(() => {
    counts.stats++;
    const byDept = {};
    let total = 0;
    for (const r of filtered) {
      total += r.salary;
      (byDept[r.dept] ||= { n: 0, sum: 0 });
      byDept[r.dept].n++;
      byDept[r.dept].sum += r.salary;
    }
    return { n: filtered.length, avg: filtered.length ? Math.round(total / filtered.length) : 0, byDept };
  }, [filtered]); // sorting/paging never retrigger this

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize)); // cheap -> no memo
  const safePage = Math.min(page, totalPages - 1);

  const pageRows = useMemo(() => {
    counts.page++;
    return sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);
  }, [sorted, safePage, pageSize]);

  const header = (key, label) => (
    <th style={{ cursor: "pointer" }} onClick={() => {
      if (sortKey === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
      else { setSortKey(key); setDir("desc"); }
    }}>
      {label} {sortKey === key ? (dir === "asc" ? "▲" : "▼") : ""}
    </th>
  );

  return (
    <div>
      <h1>Multi-stage pipeline (20,000 rows)</h1>
      <p className="lead">filter → sort → paginate, with stats branching off the filtered list.</p>

      <div className="panel">
        <h4>Stage run counters</h4>
        <div className="row">
          {Object.entries(counts).map(([k, v]) => <span key={k} className="badge warn">{k}: {v}</span>)}
          <button className="btn" onClick={() => setTick((t) => t + 1)}>unrelated re-render ({tick})</button>
        </div>
      </div>

      <div className="panel">
        <div className="row">
          <input placeholder="search name (e.g. 77)…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
          <select value={dept} onChange={(e) => { setDept(e.target.value); setPage(0); }}>
            <option>All</option>{DEPTS.map((d) => <option key={d}>{d}</option>)}
          </select>
          <select value={pageSize} onChange={(e) => { setPageSize(+e.target.value); setPage(0); }}>
            {[10, 25, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
        </div>
        <p>
          <span className="badge good">{stats.n.toLocaleString()} rows</span>{" "}
          <span className="badge">avg salary ${stats.avg.toLocaleString()}</span>{" "}
          {Object.entries(stats.byDept).map(([d, v]) => <span key={d} className="badge">{d}: {v.n}</span>)}
        </p>
        <table>
          <thead><tr>{header("name", "Name")}{header("dept", "Dept")}{header("salary", "Salary")}{header("age", "Age")}</tr></thead>
          <tbody>{pageRows.map((r) => (
            <tr key={r.id}><td>{r.name}</td><td>{r.dept}</td><td>${r.salary.toLocaleString()}</td><td>{r.age}</td></tr>
          ))}</tbody>
        </table>
        <div className="row">
          <button className="btn" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>◀ Prev</button>
          <span>Page {safePage + 1} / {totalPages}</span>
          <button className="btn" disabled={safePage >= totalPages - 1} onClick={() => setPage(safePage + 1)}>Next ▶</button>
        </div>
      </div>

      <div className="try">
        <b>Try this:</b> flip pages → only <b>page</b> increments. Click a column header → <b>sort</b> + <b>page</b> only.
        Type in search → filter, sort, stats, page all increment. Click "unrelated re-render" → nothing increments.
      </div>
    </div>
  );
}
