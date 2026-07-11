import { API_URL } from '../api';
import React, { useState, useEffect } from 'react';
import './News.css';

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
  { name: 'Rafiul Hasan',   handle: '@rafi_codes', role: 'Team Lead',       initials: 'RH', bg: 'rgba(96, 96, 200, 0.2)',  fg: '#a5b4fc' },
  { name: 'Nusrat Sultana', handle: '@nusrat_ac',  role: 'Algorithms',      initials: 'NS', bg: 'rgba(16, 185, 129, 0.2)', fg: '#34d399' },
  { name: 'Mahir Ahmed',    handle: '@mahir_dp',   role: 'Data Structures', initials: 'MA', bg: 'rgba(250, 190, 50, 0.2)', fg: '#fbbf24' },
  { name: 'Tanvir Islam',   handle: '@tanvir_cf',  role: 'Reserve',         initials: 'TI', bg: 'rgba(239, 68, 68, 0.15)', fg: '#f87171' },
];

function useCountdown(isoTarget) {
  const [timeLeft, setTimeLeft] = useState(() => new Date(isoTarget) - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      setTimeLeft(new Date(isoTarget) - Date.now());
    }, 30000);
    return () => clearInterval(id);
  }, [isoTarget]);

  if (timeLeft <= 0) return 'LIVE NOW';
  const d = Math.floor(timeLeft / 86400000);
  const h = Math.floor((timeLeft % 86400000) / 3600000);
  const m = Math.floor((timeLeft % 3600000) / 60000);
  return d > 0 ? `in ${d}d ${h}h ${m}m` : `in ${h}h ${m}m`;
}

const SectionLabel = ({ text }) => (
  <p className="news-section-label">{text}</p>
);

export default function News() {
  const countdown = useCountdown(CONTEST.targetISO);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/announcements`)
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

  const contestStats = [
    ['date', CONTEST.date],
    ['time', CONTEST.time],
    ['duration', CONTEST.duration],
    ['problems', CONTEST.problems],
    ['platform', CONTEST.platform],
    ['rating range', CONTEST.ratingRange],
  ];

  return (
    <div className="news-page">
      <h1 className="page-title">News & Announcements</h1>

      {/* ── Practice Contest ── */}
      <SectionLabel text="next_practice_contest" />
      <div className="news-contest-card">
        <div className="news-contest-header">
          <div>
            <span className="news-badge">UPCOMING</span>
            <h3 className="news-contest-name">{CONTEST.name}</h3>
          </div>
          <span className="news-countdown">{countdown}</span>
        </div>
        <div className="news-contest-grid">
          {contestStats.map(([label, val]) => (
            <div key={label} className="news-contest-stat">
              <div className="stat-label">{label}</div>
              <div className="stat-value">{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Inter-University Squad ── */}
      <SectionLabel text="inter_university_squad — ICPC Dhaka Regional 2026" />
      <div className="news-squad-grid">
        {SQUAD.map(m => (
          <div key={m.handle} className="news-squad-card">
            <div className="news-squad-avatar" style={{ background: m.bg, color: m.fg }}>
              {m.initials}
            </div>
            <div>
              <div className="news-squad-name">{m.name}</div>
              <div className="news-squad-handle">{m.handle}</div>
              <div className="news-squad-role">{m.role}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Announcements ── */}
      <SectionLabel text="announcements" />
      <div>
        {announcements.length > 0 ? (
          announcements.map((a, i) => (
            <div key={i} className="news-announcement-row">
              <span className={`news-cat-badge ${a.cat}`}>{a.cat}</span>
              <div style={{ flex: 1 }}>
                <div className="news-announcement-headline">{a.headline}</div>
                <div className="news-announcement-meta">{a.date} · {a.author}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="news-empty">No announcements yet.</div>
        )}
      </div>
    </div>
  );
}