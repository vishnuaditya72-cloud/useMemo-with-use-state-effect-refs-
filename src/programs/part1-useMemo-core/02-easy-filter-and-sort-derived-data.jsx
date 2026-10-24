/**
 * LEVEL: EASY  |  CONCEPT: derived data (filter + sort) from state
 *
 * Rule of thumb: don't store derived data in state. Store the RAW inputs
 * (query, sort key, items) and DERIVE the visible list during render.
 * useMemo makes that derivation cheap when unrelated state changes.
 */
import { useMemo, useState } from "react";

const NAMES = ["Keyboard", "Mouse", "Monitor", "Webcam", "Headset", "Dock", "Cable", "Charger", "Speaker", "Tablet"];
const PRODUCTS = Array.from({ length: 5000 }, (_, i) => ({
  id: i + 1,
  name: `${NAMES[i % NAMES.length]} #${i + 1}`,
  price: ((i * 37) % 500) + 9,
  rating: ((i * 13) % 50) / 10,
  inStock: i % 3 !== 0,
}));

let filterRuns = 0;

export default function FilterSort() {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("price");
  const [desc, setDesc] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [unrelated, setUnrelated] = useState(0);

  const visible = useMemo(() => {
    filterRuns++;
    const q = query.trim().toLowerCase();
    const list = PRODUCTS.filter(
      (p) => (!onlyInStock || p.inStock) && p.name.toLowerCase().includes(q)
    );
    const dir = desc ? -1 : 1;
    // .sort() mutates, but `list` is already a fresh array from .filter(), so this is safe.
    list.sort((a, b) =>
      sortBy === "name" ? a.name.localeCompare(b.name) * dir : (a[sortBy] - b[sortBy]) * dir
    );
    return list;
  }, [query, sortBy, desc, onlyInStock]);

  return (
    <div>
      <h1>Filter + sort (derived data)</h1>
      <p className="lead">5,000 products. The visible list is derived — never stored in state.</p>

      <div className="panel">
        <div className="row">
          <input placeholder="search name…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="price">Sort: price</option>
            <option value="rating">Sort: rating</option>
            <option value="name">Sort: name</option>
          </select>
          <button className="btn" onClick={() => setDesc((d) => !d)}>{desc ? "Descending" : "Ascending"}</button>
          <label><input type="checkbox" checked={onlyInStock} onChange={(e) => setOnlyInStock(e.target.checked)} /> in stock only</label>
        </div>
        <div className="row">
          <button className="btn" onClick={() => setUnrelated((n) => n + 1)}>Unrelated state: {unrelated}</button>
          <span>Matches: <span className="badge good">{visible.length}</span></span>
          <span>Filter/sort ran: <span className="badge warn">{filterRuns}</span></span>
        </div>
        <table>
          <thead><tr><th>Name</th><th>Price</th><th>Rating</th><th>Stock</th></tr></thead>
          <tbody>
            {visible.slice(0, 10).map((p) => (
              <tr key={p.id}><td>{p.name}</td><td>${p.price}</td><td>{p.rating.toFixed(1)}</td><td>{p.inStock ? "yes" : "no"}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="hint">Showing first 10 of {visible.length}.</p>
      </div>

      <div className="try">
        <b>Try this:</b> click "Unrelated state" — the "ran" badge doesn't move. Type in search / change sort — it does.
      </div>
    </div>
  );
}
