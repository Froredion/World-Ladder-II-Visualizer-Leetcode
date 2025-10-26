import { useEffect, useMemo, useRef, useState } from "react";
import { examples, WordLadderExample } from "./examples";

// Tailwind is available. All npm libraries are available, but this file is self-contained.
// Default export a React component so it can render in-canvas.
export default function WordLadderVisualizer() {
  // ----- Inputs -----
  const [beginWord, setBeginWord] = useState("hit");
  const [endWord, setEndWord] = useState("cog");
  const [wordListText, setWordListText] = useState(
    ["hot", "dot", "dog", "lot", "log", "cog"].join("\n")
  );

  // ----- Examples -----
  const loadExample = (example: WordLadderExample) => {
    setBeginWord(example.begin);
    setEndWord(example.end);
    setWordListText(example.words.join("\n"));
    setIsPlaying(false);
    setStep(0);
  };

  // ----- Controls -----
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(750); // ms per step
  const timerRef = useRef<number | null>(null);

  // ----- Algorithm State -----
  type Parents = Record<string, Set<string>>; // child -> set(parents)

  const words = useMemo(() => {
    const set = new Set(
      wordListText
        .split(/\r?\n|,|\s+/)
        .map((w) => w.trim().toLowerCase())
        .filter(Boolean)
    );
    // Ensure endWord presence per LeetCode spec
    if (!set.has(endWord.toLowerCase())) set.add(endWord.toLowerCase());
    // Ensure beginWord not necessarily in set; it's the source
    return Array.from(set);
  }, [wordListText, endWord]);

  const wordLen = useMemo(() => beginWord.length, [beginWord]);

  // Build buckets for O(26*L*words) neighbor finding
  const patternBuckets = useMemo(() => {
    const buckets: Record<string, string[]> = {};
    for (const w of words) {
      if (w.length !== wordLen) continue;
      for (let i = 0; i < wordLen; i++) {
        const key = w.slice(0, i) + "*" + w.slice(i + 1);
        (buckets[key] ||= []).push(w);
      }
    }
    // Also include beginWord in buckets so neighbors from source can be found even if not in dictionary
    if (beginWord.length === wordLen) {
      const bw = beginWord.toLowerCase();
      for (let i = 0; i < wordLen; i++) {
        const key = bw.slice(0, i) + "*" + bw.slice(i + 1);
        (buckets[key] ||= []).push(bw);
      }
    }
    return buckets;
  }, [words, wordLen, beginWord]);

  const getNeighbors = (w: string): string[] => {
    const res: Set<string> = new Set();
    for (let i = 0; i < wordLen; i++) {
      const key = w.slice(0, i) + "*" + w.slice(i + 1);
      const arr = patternBuckets[key] || [];
      for (const v of arr) if (v !== w && v.length === w.length) res.add(v);
    }
    return Array.from(res);
  };

  // Precompute BFS levels step-by-step for visualization
  type BFSFrame = {
    level: number;
    frontier: string[]; // nodes being expanded at this level
    nextFrontier: string[]; // nodes discovered for the next level (after expansion)
    visitedSnapshot: string[]; // visited set at end of the level
    parentsSnapshot: Parents; // partial parents up to this level
    found: boolean; // did we find endWord on this level?
  };

  const frames = useMemo(() => {
    const src = beginWord.toLowerCase();
    const tgt = endWord.toLowerCase();
    if (src.length !== tgt.length) return [] as BFSFrame[];

    const visited = new Set<string>();
    const parents: Parents = {};
    let frontier = [src];
    let level = 0;
    let found = false;

    const out: BFSFrame[] = [];
    visited.add(src);

    while (frontier.length && !found) {
      const next = new Set<string>();
      for (const node of frontier) {
        for (const nei of getNeighbors(node)) {
          if (!visited.has(nei)) {
            // First time seeing nei in this level
            if (!parents[nei]) parents[nei] = new Set();
            parents[nei].add(node);
            next.add(nei);
          }
          // Note: We intentionally skip same-level connections to avoid cycles in the parent graph
        }
      }

      // Convert next to array and mark visited AFTER processing entire level (classic layered BFS)
      const nextArr = Array.from(next);
      for (const n of nextArr) visited.add(n);

      const frame: BFSFrame = {
        level,
        frontier: [...frontier],
        nextFrontier: nextArr,
        visitedSnapshot: Array.from(visited),
        parentsSnapshot: Object.fromEntries(
          Object.entries(parents).map(([k, v]) => [k, new Set(Array.from(v))])
        ),
        found: nextArr.includes(tgt),
      };
      out.push(frame);

      if (nextArr.includes(tgt)) {
        found = true;
        break;
      }

      frontier = nextArr;
      level++;
    }

    return out;
  }, [beginWord, endWord, patternBuckets]);

  // Reconstruct all shortest paths once found
  const finalParents = useMemo(() => {
    if (!frames.length) return {} as Parents;
    return frames[frames.length - 1].parentsSnapshot;
  }, [frames]);

  const allPaths = useMemo(() => {
    // Backtrack from endWord to beginWord using parents
    const src = beginWord.toLowerCase();
    const tgt = endWord.toLowerCase();
    const res: string[][] = [];
    if (!finalParents[tgt]) return res;

    const path: string[] = [tgt];
    const visiting = new Set<string>(); // Track nodes in current path to prevent cycles
    
    const dfs = (w: string) => {
      if (w === src) {
        res.push([...path].reverse());
        return;
      }
      const ps = finalParents[w];
      if (!ps) return;
      for (const p of ps) {
        // Prevent cycles by checking if parent is already in current path
        if (visiting.has(p)) continue;
        
        path.push(p);
        visiting.add(p);
        dfs(p);
        visiting.delete(p);
        path.pop();
      }
    };
    
    visiting.add(tgt);
    dfs(tgt);
    // Sort results for deterministic display
    res.sort((a, b) => a.join("->").localeCompare(b.join("->")));
    return res;
  }, [finalParents, beginWord, endWord]);

  // ----- Playback state -----
  const [step, setStep] = useState(0); // index into frames (shows after expanding that level)

  useEffect(() => {
    // reset when inputs change
    setStep(0);
    setIsPlaying(false);
  }, [beginWord, endWord, wordListText]);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    if (step >= frames.length - 1) {
      setIsPlaying(false);
      return;
    }
    timerRef.current = window.setTimeout(() => setStep((s) => Math.min(s + 1, frames.length - 1)), speedMs) as unknown as number;
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [isPlaying, step, speedMs, frames.length]);

  const current = frames[step] as BFSFrame | undefined;

  // ----- Layout helpers for the graph (levels as columns) -----
  const columns = useMemo(() => {
    // Build columns 0..step+1 from frames
    const cols: string[][] = [];
    if (!frames.length) return cols;
    // Column 0: beginWord
    cols.push([beginWord.toLowerCase()]);
    for (let i = 0; i <= step; i++) {
      const f = frames[i];
      const next = f.nextFrontier.filter((w) => w.length === beginWord.length);
      if (next.length) cols.push(next);
    }
    return cols;
  }, [frames, step, beginWord]);

  const positions = useMemo(() => {
    // Compute x/y positions for each node for SVG
    const spacingX = 200;
    const spacingY = 56;
    const startX = 120;
    const startY = 100; // Increased from 40 to provide more top padding
    const pos: Record<string, { x: number; y: number }> = {};
    columns.forEach((col, ci) => {
      const height = (col.length - 1) * spacingY;
      const baseY = startY - height / 2;
      col.forEach((w, ri) => {
        pos[`${w}@${ci}`] = { x: startX + ci * spacingX, y: baseY + ri * spacingY };
      });
    });
    return { pos };
  }, [columns]);

  // Build edge list from parents within visible columns
  const edges = useMemo(() => {
    const list: Array<{ from: { key: string; x: number; y: number }; to: { key: string; x: number; y: number } }> = [];
    if (!columns.length) return list;

    // Map word -> column indices it appears in
    const wordCols: Record<string, number[]> = {};
    columns.forEach((col, ci) => {
      for (const w of col) (wordCols[w] ||= []).push(ci);
    });

    // Use parents up to current step
    const ps = current?.parentsSnapshot || {};
    for (const [child, parentsSet] of Object.entries(ps)) {
      const childCols = wordCols[child];
      if (!childCols) continue;
      // Child likely appears in some column; draw from any parent in previous columns
      for (const ci of childCols) {
        for (const parent of parentsSet) {
          const pi = (wordCols[parent] || []).filter((x) => x < ci).pop();
          if (pi === undefined) continue;
          const fromKey = `${parent}@${pi}`;
          const toKey = `${child}@${ci}`;
          const from = positions.pos[fromKey];
          const to = positions.pos[toKey];
          if (!from || !to) continue;
          list.push({ from: { key: fromKey, ...from }, to: { key: toKey, ...to } });
        }
      }
    }

    return list;
  }, [columns, positions, current]);

  // Highlight shortest paths when BFS found target
  const solved = frames.length > 0 && frames[frames.length - 1].found;
  const visiblePaths = solved ? allPaths : [];

  const reset = () => {
    setIsPlaying(false);
    setStep(0);
  };

  // ----- Render -----
  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <header className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Word Ladder II — Visual BFS Pathfinder</h1>
          <p className="text-sm text-slate-600 mt-1">Visualize layered BFS and backtracking to enumerate all shortest transformation sequences.</p>
        </header>

        {/* Examples Section */}
        <section className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow p-4 md:p-6 mb-6 border border-blue-100">
          <h2 className="font-semibold text-lg mb-3 text-slate-800">📚 Try These Examples</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {examples.map((example, idx) => (
              <button
                key={idx}
                onClick={() => loadExample(example)}
                className="bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl p-3 text-left transition-all hover:shadow-md group"
              >
                <div className="font-semibold text-sm text-slate-800 mb-1 group-hover:text-blue-600">
                  {example.name}
                </div>
                <div className="text-xs text-slate-500 line-clamp-2">
                  {example.description}
                </div>
                <div className="text-xs text-slate-400 mt-2 font-mono">
                  {example.words.length} words
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Controls */}
        <section className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow p-4 space-y-3 border">
            <h2 className="font-semibold">Problem Setup</h2>
            <div className="flex gap-2">
              <label className="text-sm w-28 pt-2">Begin word</label>
              <input
                className="flex-1 border rounded-xl px-3 py-2"
                value={beginWord}
                onChange={(e) => setBeginWord(e.target.value.trim().toLowerCase())}
              />
            </div>
            <div className="flex gap-2">
              <label className="text-sm w-28 pt-2">End word</label>
              <input
                className="flex-1 border rounded-xl px-3 py-2"
                value={endWord}
                onChange={(e) => setEndWord(e.target.value.trim().toLowerCase())}
              />
            </div>
            <div>
              <label className="text-sm block mb-1">Word list (comma/space/newline separated)</label>
              <textarea
                rows={6}
                className="w-full border rounded-xl px-3 py-2 font-mono text-xs"
                value={wordListText}
                onChange={(e) => setWordListText(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">Note: End word is auto-added if missing; words of different length are ignored.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-4 space-y-4 border">
            <h2 className="font-semibold">Playback</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => setIsPlaying((p) => !p)}
                disabled={!frames.length}
              >
                {isPlaying ? "Pause" : "Play"}
              </button>
              <button
                className="px-3 py-2 rounded-xl border hover:bg-slate-100"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={!frames.length || step === 0}
              >
                Step ◀
              </button>
              <button
                className="px-3 py-2 rounded-xl border hover:bg-slate-100"
                onClick={() => setStep((s) => Math.min(frames.length - 1, s + 1))}
                disabled={!frames.length || step >= frames.length - 1}
              >
                Step ▶
              </button>
              <button className="px-3 py-2 rounded-xl border hover:bg-slate-100" onClick={reset} disabled={!frames.length}>
                Reset
              </button>
            </div>
            <div>
              <label className="text-sm">Speed: {speedMs} ms/step</label>
              <input
                type="range"
                min={200}
                max={2000}
                step={50}
                value={speedMs}
                onChange={(e) => setSpeedMs(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="text-sm text-slate-600">
              {frames.length ? (
                <>
                  <div>Levels built: <span className="font-semibold">{frames.length}</span></div>
                  <div>Current level: <span className="font-semibold">{current?.level ?? 0}</span></div>
                  <div>
                    Frontier this level: <span className="font-mono">[{current?.frontier.join(", ")}]</span>
                  </div>
                  <div>
                    Discovered next: <span className="font-mono">[{current?.nextFrontier.join(", ")}]</span>
                  </div>
                </>
              ) : (
                <div className="italic">Enter inputs to generate BFS layers.</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-4 space-y-3 border">
            <h2 className="font-semibold">Results</h2>
            {visiblePaths.length ? (
              <>
                <p className="text-sm text-slate-600">All shortest sequences ({visiblePaths.length}):</p>
                <div className="flex flex-wrap gap-2 max-h-56 overflow-auto">
                  {visiblePaths.map((p, i) => (
                    <span key={i} className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                      {p.join(" → ")}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-600">Shortest sequences appear once the target is discovered during BFS.</p>
            )}
            <div className="pt-2 text-xs text-slate-500">
              <p>Visualization notes:</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Columns represent BFS levels (layered search).</li>
                <li>Edges show parent links captured during BFS for shortest-path backtracking.</li>
                <li>Green rings highlight nodes that lie on at least one shortest path.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Graph Canvas */}
        <section className="bg-white rounded-2xl shadow border p-4 md:p-6">
          <h2 className="font-semibold mb-4">Layered Graph</h2>
          <div className="relative w-full overflow-auto">
            <Graph
              columns={columns}
              edges={edges}
              positions={positions.pos}
              beginWord={beginWord.toLowerCase()}
              endWord={endWord.toLowerCase()}
              solvedWords={new Set(visiblePaths.flat())}
            />
          </div>
        </section>

        {/* Debug / Details */}
        <section className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow p-4 border">
            <h3 className="font-semibold mb-2">Visited (end of current level)</h3>
            <div className="text-sm font-mono flex flex-wrap gap-1">
              {current?.visitedSnapshot.map((w) => (
                <span key={w} className="px-2 py-0.5 rounded bg-slate-100 border">
                  {w}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow p-4 border">
            <h3 className="font-semibold mb-2">Parents Map (partial)</h3>
            <div className="text-xs font-mono max-h-64 overflow-auto">
              {Object.entries(current?.parentsSnapshot || {}).map(([child, ps]) => (
                <div key={child} className="mb-1">
                  <span className="text-slate-700">{child}</span>
                  <span> ← </span>
                  <span className="text-slate-500">{Array.from(ps).join(", ")}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="text-xs text-slate-500 mt-6">
          Inspired by LeetCode 126. Word Ladder II. This visualization focuses on layered BFS with backtracking to enumerate all shortest sequences.
        </footer>
      </div>
    </div>
  );
}

function Graph({
  columns,
  edges,
  positions,
  beginWord,
  endWord,
  solvedWords,
}: {
  columns: string[][];
  edges: Array<{ from: { key: string; x: number; y: number }; to: { key: string; x: number; y: number } }>;
  positions: Record<string, { x: number; y: number }>;
  beginWord: string;
  endWord: string;
  solvedWords: Set<string>;
}) {
  // Compute canvas size from positions
  const { width, height } = useMemo(() => {
    let maxX = 0,
      maxY = 0,
      minY = Infinity;
    for (const p of Object.values(positions)) {
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
      minY = Math.min(minY, p.y);
    }
    // Ensure proper padding at top and bottom
    const bottomPadding = 80;
    return { width: maxX + 160, height: Math.max(300, maxY + bottomPadding) };
  }, [positions]);

  return (
    <div className="relative">
      <svg width={width} height={height} className="block">
        {/* Edges */}
        {edges.map((e, idx) => {
          const path = `M ${e.from.x} ${e.from.y} C ${e.from.x + 40} ${e.from.y}, ${e.to.x - 40} ${e.to.y}, ${e.to.x} ${e.to.y}`;
          return <path key={idx} d={path} stroke="#94a3b8" strokeWidth={1.5} fill="none" />;
        })}
      </svg>
      {/* Nodes on top for readability */}
      {columns.map((col, ci) => (
        <div key={ci} className="absolute" style={{ left: 0, top: 0 }}>
          {col.map((w) => {
            const key = `${w}@${ci}`;
            const p = positions[key];
            if (!p) return null;
            const isSource = ci === 0 && w === beginWord;
            const isTarget = w === endWord;
            const inSolution = solvedWords.has(w);
            return (
              <div
                key={key}
                className={[
                  "absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-xl border shadow-sm text-sm bg-white",
                  isSource ? "border-sky-300 ring-1 ring-sky-200" : "border-slate-200",
                  isTarget ? "font-semibold" : "",
                  inSolution ? "ring-2 ring-emerald-400" : "",
                ].join(" ")}
                style={{ left: p.x, top: p.y }}
                title={w}
              >
                {w}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
