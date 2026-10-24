/**
 * HOOKS: useState + useEffect + useRef + useMemo   (+ React.memo, which is a wrapper, not a hook)
 *
 * GOAL: moving ONE card should re-render only the affected columns and only the changed cards.
 *
 * The three techniques that make that work:
 *  1) IMMUTABLE updates: moving a card creates a new object for that card only. Others keep identity.
 *  2) STABLE ACTIONS: useMemo(() => ({ move }), []) — functional setState means [] deps are safe,
 *     so the handlers prop never changes (this is useCallback without useCallback).
 *  3) STABLE COLUMN ARRAYS: grouping with .filter() makes new arrays every time, which would defeat React.memo.
 *     So inside useMemo we compare with the previous array (kept in a useRef) and REUSE it when every element is identical.
 *
 * useState  -> cards + an unrelated tick
 * useEffect -> saves to localStorage + sets document title
 * useRef    -> previous column arrays (for technique 3) and per-component render counters
 */
import { memo, useEffect, useMemo, useRef, useState } from "react";

const COLS = [
  { key: "todo", title: "To do" },
  { key: "doing", title: "Doing" },
  { key: "done", title: "Done" },
];
const INITIAL = [
  ["Design schema", "done"], ["Set up CI", "done"], ["Auth flow", "doing"], ["Write tests", "doing"],
  ["Dashboard UI", "todo"], ["Rate limiting", "todo"], ["Docs site", "todo"], ["Billing", "todo"],
].map(([title, status], i) => ({ id: i + 1, title, status }));
const KEY = "usememo-kanban";
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || INITIAL; } catch { return INITIAL; } };

const Card = memo(function Card({ card, actions }) {
  const renders = useRef(0);
  renders.current++;
  const idx = COLS.findIndex((c) => c.key === card.status);
  return (
    <div className="tile row" style={{ justifyContent: "space-between" }}>
      <span>{card.title} <span className="badge">r{renders.current}</span></span>
      <span>
        <button className="btn" disabled={idx === 0} onClick={() => actions.move(card.id, -1)}>◀</button>{" "}
        <button className="btn" disabled={idx === COLS.length - 1} onClick={() => actions.move(card.id, 1)}>▶</button>
      </span>
    </div>
  );
});

const Column = memo(function Column({ col, cards, actions }) {
  const renders = useRef(0);
  renders.current++;
  return (
    <div className="panel" style={{ flex: 1, minWidth: 0 }}>
      <h4>{col.title} ({cards.length}) <span className="badge warn">column renders: {renders.current}</span></h4>
      <div className="grid">{cards.map((c) => <Card key={c.id} card={c} actions={actions} />)}</div>
    </div>
  );
});

export default function Kanban() {
  const [cards, setCards] = useState(load);
  const [tick, setTick] = useState(0);
  const prevColumns = useRef({});

  const actions = useMemo(() => ({
    move: (id, dir) => setCards((list) => list.map((c) => {
      if (c.id !== id) return c; // same object -> identity preserved
      const j = COLS.findIndex((x) => x.key === c.status) + dir;
      return j < 0 || j >= COLS.length ? c : { ...c, status: COLS[j].key };
    })),
  }), []);

  const byColumn = useMemo(() => {
    const next = {};
    for (const col of COLS) {
      const fresh = cards.filter((c) => c.status === col.key);
      const old = prevColumns.current[col.key];
      next[col.key] = old && old.length === fresh.length && old.every((c, i) => c === fresh[i]) ? old : fresh;
    }
    prevColumns.current = next;
    return next;
  }, [cards]);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(cards));
    document.title = `${byColumn.todo.length} to do · useMemo Playground`;
    return () => { document.title = "useMemo Playground"; };
  }, [cards, byColumn]);

  return (
    <div>
      <h1>Kanban with stable props (expert)</h1>
      <p className="lead">Every card/column shows how many times it has rendered.</p>
      <div className="row">
        <button className="btn" onClick={() => setTick((t) => t + 1)}>Re-render parent (tick {tick})</button>
        <button className="btn" onClick={() => setCards(INITIAL)}>Reset board</button>
      </div>
      <div className="row" style={{ alignItems: "flex-start", flexWrap: "nowrap" }}>
        {COLS.map((col) => <Column key={col.key} col={col} cards={byColumn[col.key]} actions={actions} />)}
      </div>
      <div className="try">
        <b>Try this:</b> (1) Click "Re-render parent" — NO counter moves anywhere. (2) Move a card from To do → Doing: only those two
        columns tick, the Done column doesn't, and only the moved card's counter increments. Remove the ref-reuse trick in
        `byColumn` and watch every column re-render on every move.
      </div>
    </div>
  );
}
