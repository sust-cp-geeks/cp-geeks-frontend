import React, { useState, useEffect } from 'react';
import './SubmissionHeatmap.css';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKS = 53;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Codeforces has no date filter on user.status, so a profile costs one full
// pull (~700KB). Keyed by handle and kept for the life of the page so walking
// back and forth through the leaderboard does not re-hit their rate limit.
const cache = new Map();

// Same thresholds Codeforces uses on a profile: one submission already counts,
// and the top band starts low enough that a normal practice day fills in.
const levelOf = (count) => {
  if (!count) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
};

const localDayKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

async function fetchSubmissionDays(handle) {
  if (cache.has(handle)) return cache.get(handle);

  const res = await fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}`);
  const body = await res.json();
  // Codeforces answers 200 with {"status":"FAILED"} for a bad handle, and 403
  // once it decides you are calling too fast — neither throws on its own.
  if (body.status !== 'OK' || !Array.isArray(body.result)) {
    throw new Error(body.comment || 'Codeforces returned no submissions');
  }

  const days = new Map();
  for (const s of body.result) {
    if (!s.creationTimeSeconds) continue;
    const key = localDayKey(new Date(s.creationTimeSeconds * 1000));
    days.set(key, (days.get(key) || 0) + 1);
  }
  cache.set(handle, days);
  return days;
}

export default function SubmissionHeatmap({ handle }) {
  // One piece of state, stamped with the handle it belongs to, so switching
  // profiles can never show the previous person's calendar while the next one
  // loads — and so the effect only ever sets state from its callback.
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!handle) return;
    let cancelled = false;

    fetchSubmissionDays(handle)
      .then((days) => { if (!cancelled) setResult({ handle, days, error: '' }); })
      .catch(() => {
        if (!cancelled) {
          setResult({ handle, days: null, error: 'Could not load submission activity from Codeforces.' });
        }
      });

    return () => { cancelled = true; };
  }, [handle]);

  const loading = !result || result.handle !== handle;
  const error = result?.error || '';
  const days = result?.days;

  if (loading) {
    return (
      <div className="heatmap-section">
        <h3>Submission Activity</h3>
        <p className="heatmap-note">Loading activity…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="heatmap-section">
        <h3>Submission Activity</h3>
        <p className="heatmap-note">{error}</p>
      </div>
    );
  }

  // Anchor on the Sunday of the current week and count 53 weeks back from
  // there. Subtracting 371 days first and then rounding down to a Sunday would
  // drag the whole window backwards and cut today off the end of the grid.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - start.getDay() - (WEEKS - 1) * 7);

  const columns = [];
  const monthLabels = [];
  let total = 0;
  let lastMonth = -1;

  for (let w = 0; w < WEEKS; w++) {
    const cells = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(start.getTime() + (w * 7 + d) * DAY_MS);
      if (date > today) { cells.push(null); continue; }
      const count = days.get(localDayKey(date)) || 0;
      total += count;
      cells.push({ date, count });
    }
    columns.push(cells);

    const first = cells.find(Boolean);
    if (first && first.date.getMonth() !== lastMonth) {
      lastMonth = first.date.getMonth();
      monthLabels.push({ week: w, label: MONTHS[lastMonth] });
    }
  }

  return (
    <div className="heatmap-section">
      <h3>Submission Activity</h3>
      <p className="heatmap-note">{total} submissions in the last year</p>

      <div className="heatmap-scroll">
        <div className="heatmap-inner">
          <div className="heatmap-months">
            {monthLabels.map(({ week, label }) => (
              <span key={`${label}-${week}`} className="heatmap-month" style={{ gridColumnStart: week + 1 }}>
                {label}
              </span>
            ))}
          </div>

          <div className="heatmap-body">
            <div className="heatmap-weekdays">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
            </div>

            <div className="heatmap-grid">
              {columns.map((cells, w) => (
                <div key={w} className="heatmap-week">
                  {cells.map((cell, d) =>
                    cell ? (
                      <div
                        key={d}
                        className={`heatmap-cell level-${levelOf(cell.count)}`}
                        title={`${cell.count} submission${cell.count === 1 ? '' : 's'} on ${cell.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                      />
                    ) : (
                      <div key={d} className="heatmap-cell is-empty" />
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="heatmap-legend">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((l) => <div key={l} className={`heatmap-cell level-${l}`} />)}
        <span>More</span>
      </div>
    </div>
  );
}
