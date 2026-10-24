/**
 * HOOKS: useState + useEffect + useRef + useMemo
 *
 * useState  -> field values, which fields were touched, submitted flag
 * useEffect -> autosaves a draft (never the passwords!) to localStorage
 * useRef    -> a map of input elements; on a bad submit we focus the FIRST invalid one
 * useMemo   -> `errors`, `isValid`, `strength` derived from values. Never store these in state.
 */
import { useEffect, useMemo, useRef, useState } from "react";

const FIELDS = [
  { key: "name", label: "Name", type: "text" },
  { key: "email", label: "Email", type: "email" },
  { key: "password", label: "Password", type: "password" },
  { key: "confirm", label: "Confirm password", type: "password" },
];
const DRAFT_KEY = "usememo-form-draft";

const loadDraft = () => {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY)) || {}; } catch { return {}; }
};

export default function FormValidation() {
  const [values, setValues] = useState(() => ({ name: "", email: "", password: "", confirm: "", ...loadDraft() }));
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const fieldRefs = useRef({});

  useEffect(() => {
    const { password, confirm, ...safe } = values; // never persist secrets
    localStorage.setItem(DRAFT_KEY, JSON.stringify(safe));
  }, [values]);

  const errors = useMemo(() => {
    const e = {};
    if (values.name.trim().length < 2) e.name = "At least 2 characters";
    if (!/^\S+@\S+\.\S+$/.test(values.email)) e.email = "Enter a valid email";
    if (values.password.length < 8) e.password = "At least 8 characters";
    else if (!/\d/.test(values.password)) e.password = "Include a number";
    if (values.confirm !== values.password || !values.confirm) e.confirm = "Passwords must match";
    return e;
  }, [values]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const strength = useMemo(() => {
    const p = values.password;
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return { score: s, label: ["very weak", "weak", "fair", "good", "strong", "excellent"][s] };
  }, [values.password]);

  const onSubmit = (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirm: true });
    const firstBad = FIELDS.find((f) => errors[f.key]);
    if (firstBad) { fieldRefs.current[firstBad.key].focus(); setSubmitted(false); }
    else setSubmitted(true);
  };

  return (
    <div>
      <h1>Form validation + autosave</h1>
      <p className="lead">Errors are DERIVED with useMemo — no extra state to keep in sync.</p>
      <form className="panel" onSubmit={onSubmit}>
        {FIELDS.map((f) => (
          <div key={f.key} style={{ marginBottom: 10 }}>
            <label>{f.label}<br />
              <input
                ref={(el) => (fieldRefs.current[f.key] = el)}
                type={f.type}
                value={values[f.key]}
                style={{ width: 280 }}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                onBlur={() => setTouched((t) => ({ ...t, [f.key]: true }))}
              />
            </label>
            {touched[f.key] && errors[f.key] && <div className="err">{errors[f.key]}</div>}
            {f.key === "password" && values.password && <div className="hint">strength: {strength.label} ({strength.score}/5)</div>}
          </div>
        ))}
        <div className="row">
          <button className="btn on" type="submit">Sign up</button>
          <span>form valid: <span className={`badge ${isValid ? "good" : "bad"}`}>{String(isValid)}</span></span>
          {submitted && <span className="ok">Submitted ✔</span>}
        </div>
      </form>
      <div className="try"><b>Try this:</b> press Sign up with an empty form → focus jumps to the first invalid field (useRef). Type name/email, refresh the page → they come back (useEffect autosave).</div>
    </div>
  );
}
