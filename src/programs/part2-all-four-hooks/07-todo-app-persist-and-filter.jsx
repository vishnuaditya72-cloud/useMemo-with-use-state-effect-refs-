/**
 * HOOKS: useState + useEffect + useRef + useMemo
 *
 * useState  -> todos (lazy-initialised from localStorage), filter, input text
 * useEffect -> persists todos on every change
 * useRef    -> input element (refocus after add) + `nextId` counter (a mutable value that doesn't need a re-render)
 * useMemo   -> visible list (by filter) and counters — two memos with DIFFERENT dependencies
 */
import { useEffect, useMemo, useRef, useState } from "react";

const KEY = "usememo-todos";
const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
};

export default function Todos() {
  const [todos, setTodos] = useState(load);
  const [filter, setFilter] = useState("all");
  const [text, setText] = useState("");
  const inputRef = useRef(null);
  const nextId = useRef(todos.reduce((m, t) => Math.max(m, t.id), 0) + 1);

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(todos)); }, [todos]);

  const visible = useMemo(() => {
    if (filter === "active") return todos.filter((t) => !t.done);
    if (filter === "done") return todos.filter((t) => t.done);
    return todos;
  }, [todos, filter]);

  const counts = useMemo(() => {
    const done = todos.filter((t) => t.done).length;
    return { total: todos.length, done, active: todos.length - done };
  }, [todos]);

  const add = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setTodos((t) => [...t, { id: nextId.current++, text: text.trim(), done: false }]);
    setText("");
    inputRef.current.focus();
  };

  return (
    <div>
      <h1>Todo app</h1>
      <p className="lead">Persists to localStorage — refresh the page and your todos remain.</p>
      <div className="panel">
        <form className="row" onSubmit={add}>
          <input ref={inputRef} placeholder="what needs doing?" value={text} onChange={(e) => setText(e.target.value)} style={{ width: 260 }} />
          <button className="btn on" type="submit">Add</button>
        </form>
        <div className="row">
          {["all", "active", "done"].map((f) => <button key={f} className={`btn ${filter === f ? "on" : ""}`} onClick={() => setFilter(f)}>{f}</button>)}
          <span className="badge">{counts.active} left</span><span className="badge good">{counts.done} done</span><span className="badge">{counts.total} total</span>
          <button className="btn" onClick={() => setTodos((t) => t.filter((x) => !x.done))} disabled={!counts.done}>Clear done</button>
        </div>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {visible.map((t) => (
            <li key={t.id} className="row">
              <input type="checkbox" checked={t.done} onChange={() => setTodos((all) => all.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))} />
              <span style={{ textDecoration: t.done ? "line-through" : "none", opacity: t.done ? 0.5 : 1 }}>{t.text}</span>
              <button className="btn" onClick={() => setTodos((all) => all.filter((x) => x.id !== t.id))}>✕</button>
            </li>
          ))}
        </ul>
        {!visible.length && <p className="hint">Nothing here.</p>}
      </div>
    </div>
  );
}
