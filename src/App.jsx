import { useMemo, useState } from "react";

// Auto-discovers every program file. Drop a new .jsx into src/programs/<folder>/ and it shows up.
const modules = import.meta.glob("./programs/**/*.jsx", { eager: true });

export default function App() {
  const groups = useMemo(() => {
    const out = {};
    Object.entries(modules)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([path, mod]) => {
        const [, , folder, file] = path.split("/");
        const name = file.replace(".jsx", "");
        (out[folder] ||= []).push({ path, name, Component: mod.default });
      });
    return out;
  }, []);

  const first = Object.values(groups)[0][0];
  const [activePath, setActivePath] = useState(first.path);
  const active = Object.values(groups).flat().find((p) => p.path === activePath);
  const Active = active.Component;

  return (
    <div className="layout">
      <aside className="side">
        <h2>useMemo Playground</h2>
        {Object.entries(groups).map(([folder, items]) => (
          <div key={folder}>
            <h3>{folder}</h3>
            {items.map((p) => (
              <button
                key={p.path}
                className={p.path === activePath ? "active" : ""}
                onClick={() => setActivePath(p.path)}
              >
                {p.name.replace(/-/g, " ")}
              </button>
            ))}
          </div>
        ))}
        <p className="hint">Open the browser console too: several demos log when they recompute.</p>
      </aside>
      <main className="main">
        <div className="path">src/programs/{active.path.replace("./programs/", "")}</div>
        {/* key => remount on switch so every demo starts fresh */}
        <Active key={active.path} />
      </main>
    </div>
  );
}
