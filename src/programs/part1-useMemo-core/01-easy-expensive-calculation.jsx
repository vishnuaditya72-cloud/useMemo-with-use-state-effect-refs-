/**
 * LEVEL: EASY  |  CONCEPT: skip an expensive calculation when its inputs didn't change
 *
 * useMemo(() => compute(a, b), [a, b])
 *   - React runs the function on the first render.
 *   - On later renders, if [a, b] are the same (Object.is), it returns the CACHED result
 *     and does NOT run the function again.
 *
 * (useState is used here only to cause re-renders. useMemo is the star.)
 */
import { useMemo, useState } from "react";

let computeCount = 0; // module-level counter just so you can SEE how often the work runs

function sumOfPrimes(limit) {
  computeCount++;
  console.log("sumOfPrimes ran for limit =", limit);
  let sum = 0;
  for (let n = 2; n <= limit; n++) {
    let prime = true;
    for (let d = 2; d * d <= n; d++) {
      if (n % d === 0) { prime = false; break; }
    }
    if (prime) sum += n;
  }
  return sum;
}

export default function ExpensiveCalculation() {
  const [limit, setLimit] = useState(1_000_000);
  const [clicks, setClicks] = useState(0); // has NOTHING to do with the calculation
  const [memoOn, setMemoOn] = useState(true);

  // With memo ON: recomputes only when `limit` (or memoOn) changes.
  const cached = useMemo(() => (memoOn ? sumOfPrimes(limit) : null), [limit, memoOn]);
  // With memo OFF: recomputes on EVERY render (every click!).
  const result = memoOn ? cached : sumOfPrimes(limit);

  return (
    <div>
      <h1>Expensive calculation</h1>
      <p className="lead">Sum of all primes up to N. Clicking the unrelated counter re-renders this component.</p>

      <div className="panel">
        <div className="row">
          <span>N =</span>
          {[100_000, 1_000_000, 3_000_000].map((n) => (
            <button key={n} className={`btn ${limit === n ? "on" : ""}`} onClick={() => setLimit(n)}>
              {n.toLocaleString()}
            </button>
          ))}
        </div>
        <div className="row">
          <button className={`btn ${memoOn ? "on" : ""}`} onClick={() => setMemoOn((v) => !v)}>
            useMemo: {memoOn ? "ON" : "OFF"}
          </button>
          <button className="btn" onClick={() => setClicks((c) => c + 1)}>
            Unrelated counter: {clicks}
          </button>
        </div>
        <p>Result: <span className="badge good">{result.toLocaleString()}</span></p>
        <p>Times the calculation has run: <span className="badge warn">{computeCount}</span></p>
      </div>

      <div className="try">
        <b>Try this:</b> with memo ON, click the counter many times — the run count stays put and the UI stays snappy.
        Switch memo OFF (use N = 3,000,000) and click again: the count jumps on every click and you can feel the lag.
      </div>
    </div>
  );
}
