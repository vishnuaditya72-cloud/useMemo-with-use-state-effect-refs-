/**
 * LEVEL: LITTLE HARD  |  CONCEPT: useMemo for REFERENTIAL EQUALITY (not for speed!)
 *
 * In JS:  {} === {}  is false.  So `const config = { a: 1 }` inside a component is a
 * brand-new object every render. If you pass it as a prop to a React.memo child,
 * the child sees "a new prop!" and re-renders anyway.
 *
 * useMemo keeps the SAME object reference until its deps change -> memo child can skip.
 *
 * (React.memo is a component wrapper, not a hook.)
 */
import { memo, useMemo, useState } from "react";

const renders = { bad: 0, good: 0 };

const Panel = memo(function Panel({ kind, config, items }) {
  renders[kind]++; // counts how many times THIS child actually rendered
  return (
    <div className="tile">
      <div>
        <b>{kind === "bad" ? "Without useMemo" : "With useMemo"}</b>{" "}
        <span className={`badge ${kind === "bad" ? "bad" : "good"}`}>child renders: {renders[kind]}</span>
      </div>
      <div className="mono hint">config = {JSON.stringify(config)}</div>
      <div className="mono hint">items = {items.join(", ")}</div>
    </div>
  );
});

export default function ReferentialEquality() {
  const [theme, setTheme] = useState("light");
  const [tick, setTick] = useState(0); // unrelated re-render trigger

  // New object + new array on EVERY render -> memo child can't skip.
  const badConfig = { theme, size: 3 };
  const badItems = ["a", "b", "c"];

  // Same references until `theme` changes (items never change -> [] deps).
  const goodConfig = useMemo(() => ({ theme, size: 3 }), [theme]);
  const goodItems = useMemo(() => ["a", "b", "c"], []);

  return (
    <div>
      <h1>Referential equality + React.memo</h1>
      <p className="lead">Same data, same UI — but one child re-renders needlessly.</p>

      <div className="panel">
        <div className="row">
          <button className="btn" onClick={() => setTick((t) => t + 1)}>Re-render parent (tick {tick})</button>
          <button className="btn" onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}>
            Toggle theme (currently {theme})
          </button>
        </div>
        <div className="grid">
          <Panel kind="bad" config={badConfig} items={badItems} />
          <Panel kind="good" config={goodConfig} items={goodItems} />
        </div>
      </div>

      <div className="try">
        <b>Try this:</b> click "Re-render parent" repeatedly. The red child re-renders every time; the green one never does.
        Then toggle the theme — now the green child re-renders too, because its dependency (theme) really changed. That's correct behavior.
      </div>
    </div>
  );
}
