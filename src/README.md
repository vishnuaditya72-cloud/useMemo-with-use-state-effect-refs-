# useMemo Playground

```bash
npm install
npm run dev      # open the printed localhost URL
```

Pick a program from the sidebar. Each one is a single file in `src/programs/`. Add your own `.jsx`
(with a default export) to any folder and it appears automatically.

## Part 1 — useMemo core (hooks: useMemo, plus useState only to trigger re-renders)
| File | Level | What it teaches |
|---|---|---|
| 01-easy-expensive-calculation | Easy | Skip heavy work when inputs are unchanged |
| 02-easy-filter-and-sort-derived-data | Easy | Derive lists instead of storing them in state |
| 03-hard-referential-equality-with-memo-children | Little hard | Stable object/array props for React.memo children |
| 04-hard-memoize-instances-and-functions | Little hard | Memoize instances, functions, and an actions object |
| 05-expert-multi-stage-pipeline | Expert | Chain of memos with minimal dependencies |

## Part 2 — all of useState, useEffect, useRef, useMemo in every program
01 debounced search · 02 stopwatch + lap stats · 03 cart totals · 04 form validation + autosave ·
05 responsive masonry · 06 async fetch + dashboard · 07 todo app · 08 canvas plot ·
09 virtualized 100k list · 10 expert kanban with stable props

## useMemo cheat sheet
```js
const value = useMemo(() => compute(a, b), [a, b]);
```
**Use it when**
1. The calculation is genuinely slow (loops over thousands of items, parsing, heavy math). Measure first.
2. You pass an object/array/function to a `React.memo` child and need a stable reference.
3. The value is a dependency of `useEffect` (or another `useMemo`) and a new reference each render would cause extra runs.
4. You build something costly to create (Intl formatters, regex, Map/Set, class instances).

**Don't bother when** the work is trivial (adding numbers, `a + b`, small `.map` over 10 items). Memoizing costs memory and comparisons too.

**Rules**
- The function must be PURE: no setState, no fetching, no DOM, no subscriptions. Side effects belong in `useEffect`.
- List every reactive value used inside in the dependency array.
- It's a performance hint, not a semantic guarantee: React may discard the cache. Code must still be correct without it.
- Dependencies compare with `Object.is`. Prefer primitives (`start`, `end`) over objects (`range`).
- `useCallback(fn, deps)` is the same as `useMemo(() => fn, deps)`.
- Don't mutate memoized values. Copy first (`[...list].sort()`).

## Notes
- `StrictMode` is deliberately off in `src/main.jsx` so the counters aren't doubled in dev.
- Counters use module variables / refs mutated during render. That is fine for demos but not something to do in real code.
- No other hooks (useCallback, useReducer, useContext, ...) are used anywhere.
