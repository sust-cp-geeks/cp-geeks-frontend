import React, { useState, useEffect } from 'react';

const CONTEST = {
  name: 'Weekly Practice Round #14',
  date: 'Apr 27, 2026',
  time: '8:00 PM BST',
  duration: '2.5 hrs',
  problems: '6 – 8',
  platform: 'Codeforces',
  ratingRange: '800 – 2000',
  targetISO: '2026-04-27T20:00:00+06:00',
};

const SQUAD = [
  { name: 'Rafiul Hasan',   handle: '@rafi_codes', role: 'Team Lead',       initials: 'RH', bg: '#EEEDFE', fg: '#3C3489' },
  { name: 'Nusrat Sultana', handle: '@nusrat_ac',  role: 'Algorithms',      initials: 'NS', bg: '#E1F5EE', fg: '#085041' },
  { name: 'Mahir Ahmed',    handle: '@mahir_dp',   role: 'Data Structures', initials: 'MA', bg: '#FAEEDA', fg: '#633806' },
  { name: 'Tanvir Islam',   handle: '@tanvir_cf',  role: 'Reserve',         initials: 'TI', bg: '#FAECE7', fg: '#4A1B0C' },
];

const CAT_STYLES = {
  Contest: { background: '#FAEEDA', color: '#854F0B', border: '0.5px solid #FAC775' },
  System:  { background: '#E6F1FB', color: '#185FA5', border: '0.5px solid #B5D4F4' },
  Update:  { background: '#EAF3DE', color: '#3B6D11', border: '0.5px solid #C0DD97' },
  Alert:   { background: '#FCEBEB', color: '#A32D2D', border: '0.5px solid #F7C1C1' },
};

const mono = { fontFamily: "'JetBrains Mono', monospace" };

function useCountdown(isoTarget) {
  const calc = () => {
    const diff = new Date(isoTarget) - Date.now();
    if (diff <= 0) return 'LIVE NOW';
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    return d > 0 ? `in ${d}d ${h}h ${m}m` : `in ${h}h ${m}m`;
  };
  const [label, setLabel] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setLabel(calc()), 30000);
    return () => clearInterval(id);
  }, [isoTarget]);
  return label;
}

const SectionLabel = ({ text }) => (
  <p style={{ ...mono, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-text-secondary, #888)', borderBottom: '0.5px solid var(--color-border-tertiary, #ddd)', paddingBottom: 8, marginBottom: 20, marginTop: 0 }}>
    {text}
  </p>
);

export default function News() {
  const countdown = useCountdown(CONTEST.targetISO);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8080/api/announcements')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAnnouncements(data.data.map(item => ({
            cat: item.category || 'Update',
            headline: item.title,
            date: new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            author: 'Admin'
          })));
        }
      })
      .catch(err => console.error("Failed to fetch announcements:", err));
  }, []);

  return (
    <div style={{ fontFamily: "'Syne', sans-serif", padding: '2rem', maxWidth: 1000, margin: '0 auto' }}>
      <p style={{ ...mono, fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-secondary, #888)', marginBottom: 6 }}>
      </p>
      <h1 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 2rem' }}>News & Announcements</h1>

      {/* ── Practice Contest ── */}
      <SectionLabel text="next_practice_contest" />
      <div style={{ background: 'var(--color-background-secondary, #f6f6f4)', border: '0.5px solid var(--color-border-secondary, #ccc)', borderLeft: '3px solid #1D9E75', borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <div>
            <span style={{ ...mono, fontSize: 12, background: '#E1F5EE', color: '#0F6E56', padding: '4px 12px', borderRadius: 99, border: '0.5px solid #9FE1CB', display: 'inline-block', marginBottom: 8 }}>UPCOMING</span>
            <h3 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{CONTEST.name}</h3>
          </div>
          <span style={{ ...mono, fontSize: 15, background: '#E1F5EE', color: '#0F6E56', padding: '8px 16px', borderRadius: 8, border: '0.5px solid #9FE1CB', whiteSpace: 'nowrap' }}>{countdown}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10 }}>
          {[['date', CONTEST.date], ['time', CONTEST.time], ['duration', CONTEST.duration], ['problems', CONTEST.problems], ['platform', CONTEST.platform], ['rating range', CONTEST.ratingRange]].map(([label, val]) => (
            <div key={label} style={{ background: 'var(--color-background-primary, #fff)', border: '0.5px solid var(--color-border-tertiary, #ddd)', borderRadius: 8, padding: '10px 14px' }}>
              <div style={{ ...mono, fontSize: 12, color: 'var(--color-text-secondary, #888)', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Inter-University Squad ── */}
      <SectionLabel text="inter_university_squad — ICPC Dhaka Regional 2026" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: '1.5rem' }}>
        {SQUAD.map(m => (
          <div key={m.handle} style={{ background: 'var(--color-background-primary, #fff)', border: '0.5px solid var(--color-border-tertiary, #ddd)', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: m.bg, color: m.fg, display: 'flex', alignItems: 'center', justifyContent: 'center', ...mono, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{m.initials}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{m.name}</div>
              <div style={{ ...mono, fontSize: 12, color: 'var(--color-text-secondary, #888)' }}>{m.handle}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary, #888)', marginTop: 3 }}>{m.role}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Announcements ── */}
      <SectionLabel text="announcements" />
      <div>
        {announcements.length > 0 ? (
          announcements.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 0', borderBottom: i < announcements.length - 1 ? '0.5px solid var(--color-border-tertiary, #ddd)' : 'none' }}>
              <span style={{ ...mono, fontSize: 12, padding: '3px 10px', borderRadius: 99, flexShrink: 0, marginTop: 3, ...(CAT_STYLES[a.cat] || CAT_STYLES['Update']) }}>{a.cat}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 4 }}>{a.headline}</div>
                <div style={{ ...mono, fontSize: 12, color: 'var(--color-text-secondary, #888)' }}>{a.date} · {a.author}</div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ ...mono, fontSize: 14, color: 'var(--color-text-secondary, #888)' }}>No announcements yet.</div>
        )}
      </div>
    </div>
  );
}