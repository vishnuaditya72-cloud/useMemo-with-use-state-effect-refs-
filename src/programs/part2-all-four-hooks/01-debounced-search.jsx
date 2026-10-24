/**
 * HOOKS: useState + useEffect + useRef + useMemo
 *
 * useState  -> `query` (what you type) and `debounced` (what we actually search with)
 * useEffect -> debounce timer: waits 300ms after you stop typing
 * useRef    -> holds the <input> so we can autofocus it on mount
 * useMemo   -> filters 20,000 items, ONLY when `debounced` changes (not on every keystroke)
 */
import { useEffect, useMemo, useRef, useState } from "react";

const COUNTRIES = ["India", "Japan", "Brazil", "Canada", "Kenya", "Norway", "Chile", "Egypt", "Spain", "Nepal"];
const ITEMS = Array.from({ length: 20000 }, (_, i) => `${COUNTRIES[i % COUNTRIES.length]} – Store ${i + 1}`);

export default function DebouncedSearch() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const inputRef = useRef(null);
  const filterRuns = useRef(0);

  useEffect(() => { inputRef.current.focus(); }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim().toLowerCase()), 300);
    return () => clearTimeout(id); // cancel the previous timer on every keystroke
  }, [query]);

  const results = useMemo(() => {
    filterRuns.current++;
    return ITEMS.filter((s) => s.toLowerCase().includes(debounced));
  }, [debounced]);

  return (
    <div>
      <h1>Debounced search</h1>
      <p className="lead">Type fast — the expensive filter only runs after you pause.</p>
      <div className="panel">
        <div className="row">
          <input ref={inputRef} placeholder="try 'nepal 99'…" value={query} onChange={(e) => setQuery(e.target.value)} style={{ width: 280 }} />
          <button className="btn" onClick={() => { setQuery(""); inputRef.current.focus(); }}>Clear</button>
        </div>
        <p>
          typed: <span className="badge">{query || "∅"}</span> searching: <span className="badge">{debounced || "∅"}</span>{" "}
          filter runs: <span className="badge warn">{filterRuns.current}</span> matches: <span className="badge good">{results.length}</span>
        </p>
        <ul>{results.slice(0, 8).map((r) => <li key={r}>{r}</li>)}</ul>
      </div>
      <div className="try"><b>Try this:</b> type "spain 1234" quickly. Filter runs once when you pause, not once per character.</div>
    </div>
  );
}
