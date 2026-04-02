import React, { useCallback, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'terence-dania-conception-dashboard-v2';

const HIM_DAILY = ['No weed', 'No alcohol', 'Supplements taken', 'Workout completed', 'Sleep 7+ hours', 'Clean nutrition'];
const HER_DAILY = ['Supplements taken', 'Clean nutrition', 'Workout completed', 'Sleep 7+ hours', 'Hydration goal met', 'Stress managed'];
const HIM_SUPPS = ['CoQ10', 'Omega-3', 'Vitamin D', 'Magnesium', 'Zinc', 'L-Carnitine (Phase 2+)', 'NAC (optional)'];
const HER_SUPPS = ['Prenatal Vitamin', 'CoQ10', 'Omega-3', 'Vitamin D', 'Choline', 'Myo-Inositol (optional)'];
const HIM_WORK = [{ n: 'Strength Training', g: '3–4x/week' }, { n: 'Cardio', g: '2x/week' }];
const HER_WORK = [{ n: 'Walking / Low Intensity', g: '4–5x/week' }, { n: 'Light Strength / Pilates', g: '2–3x/week' }];
const LAB_HIM = [{ n: 'Semen Analysis', t: '~Day 90' }, { n: 'Testosterone Panel', t: 'Baseline' }];
const LAB_HER = [{ n: 'AMH', t: 'Any cycle day' }, { n: 'FSH / LH', t: 'Day 2–4' }, { n: 'Estradiol', t: 'Day 2–4' }];
const TAPER = ['50% Usage', '2–3x/week', '1–2x/week', '0 Use'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const todayKey = (d = new Date()) => {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt.toISOString().split('T')[0];
};

const defaultData = {
  checks: {},
  supps: {},
  workouts: {},
  taper: {},
  alcohol: {},
  attempts: {},
  labs: {},
  labNotes: {},
  reviews: {},
  startDate: '',
  cycleStart: '',
  cycleLen: 28,
  subtab1: 'Him',
  subtab2: 'Him',
  subtab3: 'Him',
  subtab4: 'Him',
  reminderMode: 'Morning + Evening',
};

function Toggle({ on, onToggle }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        padding: 2,
        cursor: 'pointer',
        border: 'none',
        background: on ? '#7BAE7F' : 'rgba(120,120,128,0.16)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: on ? 'flex-end' : 'flex-start',
        transition: 'all 0.2s',
        flexShrink: 0,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }}
      />
    </button>
  );
}

function Ring({ pct, size = 48, color = '#C4956A' }) {
  const r = (size - 5) / 2;
  const c = 2 * Math.PI * r;
  const o = c - (pct / 100) * c;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(120,120,128,0.08)" strokeWidth={4} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeDasharray={c}
          strokeDashoffset={o}
          strokeLinecap="round"
          style={{ transition: 'all 0.4s' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          color,
        }}
      >
        {Math.round(pct)}%
      </div>
    </div>
  );
}

function Card({ children }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 14,
        padding: '16px 18px',
        marginBottom: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)',
      }}
    >
      {children}
    </div>
  );
}

function Tabs({ tabs, active, set }) {
  return (
    <div style={{ display: 'flex', background: 'rgba(120,120,128,0.08)', borderRadius: 10, padding: 2, marginBottom: 14 }}>
      {tabs.map((t) => (
        <button
          type="button"
          key={t}
          onClick={() => set(t)}
          style={{
            flex: 1,
            padding: '7px 0',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            cursor: 'pointer',
            background: active === t ? '#fff' : 'transparent',
            color: active === t ? '#1a1a1a' : '#8E8E93',
            fontWeight: active === t ? 600 : 500,
            boxShadow: active === t ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function Hdr({ icon, title, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0, color: '#1a1a1a', letterSpacing: '-0.02em' }}>{title}</h2>
      </div>
      {sub && <p style={{ fontSize: 12, color: '#8E8E93', margin: '4px 0 0 26px' }}>{sub}</p>}
    </div>
  );
}

function SmallButton({ children, onClick, variant = 'default' }) {
  const colors = {
    default: { bg: '#F3F3F5', color: '#1a1a1a', border: '1px solid rgba(0,0,0,0.08)' },
    danger: { bg: '#FFF4F3', color: '#C75B52', border: '1px solid rgba(199,91,82,0.18)' },
    accent: { bg: 'rgba(196,149,106,0.12)', color: '#C4956A', border: '1px solid rgba(196,149,106,0.18)' },
  }[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        borderRadius: 8,
        border: colors.border,
        background: colors.bg,
        color: colors.color,
        padding: '8px 12px',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

export default function App() {
  const [tab, setTab] = useState('daily');
  const [data, setData] = useState(defaultData);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setData({ ...defaultData, ...parsed });
      }
    } catch (err) {
      console.error('Failed to load saved progress', err);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save progress', err);
    }
  }, [data, loaded]);

  const u = useCallback((key, val) => {
    setData((p) => ({ ...p, [key]: typeof val === 'function' ? val(p[key]) : val }));
  }, []);

  const today = useMemo(() => todayKey(), []);

  const toggle = (bucket, group, id) => {
    u(bucket, (prev) => {
      const g = prev[group] || {};
      return { ...prev, [group]: { ...g, [id]: !g[id] } };
    });
  };

  const getChecked = (bucket, group) => {
    const g = data[bucket]?.[group] || {};
    return Object.values(g).filter(Boolean).length;
  };

  const dayNum = data.startDate
    ? Math.min(90, Math.max(1, Math.floor((new Date(today) - new Date(data.startDate)) / 86400000) + 1))
    : 0;
  const phase = dayNum <= 30 ? { n: 1, l: 'Reset Phase', short: 'Reset', c: '#D4A574' } : dayNum <= 60 ? { n: 2, l: 'Build Phase', short: 'Build', c: '#7BAE7F' } : { n: 3, l: 'Peak Phase', short: 'Peak', c: '#C4956A' };

  const clearAllData = () => {
    const ok = window.confirm('Reset the full dashboard? This clears all check-ins, logs, labs, and review notes on this device.');
    if (!ok) return;
    setData(defaultData);
    setTab('daily');
  };

  const setStartDate = (newDate) => {
    u('startDate', newDate || '');
  };

  const DailySection = () => {
    const who = data.subtab1;
    const items = who === 'Him' ? HIM_DAILY : HER_DAILY;
    const key = today + '_' + who;
    const checked = getChecked('checks', key);
    const pct = (checked / items.length) * 100;
    return (
      <Card>
        <Hdr icon="📋" title="Daily Scorecard" sub="Track today's commitments" />
        <Tabs tabs={['Him', 'Her']} active={who} set={(v) => u('subtab1', v)} />
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
          <Ring pct={pct} size={56} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{checked}/{items.length} completed</div>
            <div style={{ fontSize: 12, color: '#8E8E93' }}>Today's score</div>
          </div>
        </div>
        {items.map((item, i) => {
          const on = !!(data.checks[key] || {})[i];
          return (
            <div
              key={i}
              role="button"
              tabIndex={0}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer' }}
              onClick={() => toggle('checks', key, i)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggle('checks', key, i); }}
            >
              <span style={{ fontSize: 15, color: on ? '#7BAE7F' : '#1a1a1a', textDecoration: on ? 'line-through' : 'none' }}>{item}</span>
              <Toggle on={on} onToggle={() => toggle('checks', key, i)} />
            </div>
          );
        })}
      </Card>
    );
  };

  const ProgressSection = () => {
    const pct = dayNum ? (dayNum / 90) * 100 : 0;
    return (
      <Card>
        <Hdr icon="🎯" title="90-Day Progress" sub="Choose your Day 1, then update it anytime if needed" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 12, color: '#8E8E93', marginBottom: 6 }}>Start date</div>
              <input
                type="date"
                value={data.startDate}
                max={today}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ padding: '10px 16px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.08)', fontSize: 15, background: '#F9F9F9' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, alignSelf: 'end', flexWrap: 'wrap' }}>
              <SmallButton variant="accent" onClick={() => setStartDate(today)}>Use Today</SmallButton>
              <SmallButton variant="danger" onClick={() => setStartDate('')}>Clear Start Date</SmallButton>
            </div>
          </div>

          {data.startDate ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <div>
                  <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em' }}>Day {dayNum}</span>
                  <span style={{ fontSize: 14, color: '#8E8E93', marginLeft: 6 }}>/ 90</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: phase.c, background: phase.c + '18', padding: '3px 10px', borderRadius: 6 }}>{phase.l}</span>
              </div>
              <div style={{ width: '100%', height: 8, background: 'rgba(120,120,128,0.08)', borderRadius: 8 }}>
                <div style={{ width: pct + '%', height: '100%', borderRadius: 8, background: phase.c, transition: 'width 0.4s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: '#8E8E93' }}>
                <span>Started: {new Date(data.startDate + 'T00:00:00').toLocaleDateString()}</span>
                <span>{90 - dayNum} days remaining</span>
              </div>
            </>
          ) : (
            <div style={{ fontSize: 13, color: '#8E8E93' }}>No start date set yet. Pick the true Day 1 whenever you're ready.</div>
          )}
        </div>
      </Card>
    );
  };

  const SuppsSection = () => {
    const who = data.subtab2;
    const items = who === 'Him' ? HIM_SUPPS : HER_SUPPS;
    const key = today + '_supps_' + who;
    const checked = getChecked('supps', key);
    const pct = items.length ? (checked / items.length) * 100 : 0;
    return (
      <Card>
        <Hdr icon="💊" title="Supplement Stack" sub="Daily supplement compliance" />
        <Tabs tabs={['Him', 'Her']} active={who} set={(v) => u('subtab2', v)} />
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
          <Ring pct={pct} size={44} color="#7BAE7F" />
          <span style={{ fontSize: 12, color: '#8E8E93' }}>{checked}/{items.length} taken today</span>
        </div>
        {items.map((s, i) => {
          const on = !!(data.supps[key] || {})[i];
          return (
            <div
              key={i}
              onClick={() => toggle('supps', key, i)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer' }}
            >
              <span style={{ fontSize: 14, color: on ? '#7BAE7F' : '#1a1a1a' }}>{s}</span>
              <Toggle on={on} onToggle={() => toggle('supps', key, i)} />
            </div>
          );
        })}
      </Card>
    );
  };

  const TaperSection = () => {
    const wk = Math.min(4, Math.ceil(Math.max(dayNum, 1) / 7));
    const weedToday = !!data.taper[today];
    const drinksToday = data.alcohol[today] || 0;
    return (
      <Card>
        <Hdr icon="🚫" title="Taper Tracker" sub="Weed & alcohol reduction — Terence" />
        <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', marginBottom: 8 }}>4-WEEK TAPER PLAN</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {TAPER.map((t, i) => (
            <div key={i} style={{ flex: 1, padding: '8px 4px', borderRadius: 8, textAlign: 'center', background: wk === i + 1 ? 'rgba(196,149,106,0.1)' : 'rgba(120,120,128,0.04)', border: wk === i + 1 ? '1px solid rgba(196,149,106,0.3)' : '1px solid transparent' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: wk === i + 1 ? '#C4956A' : '#C7C7CC' }}>Wk {i + 1}</div>
              <div style={{ fontSize: 9, color: '#8E8E93', marginTop: 2 }}>{t}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
          <span style={{ fontSize: 14 }}>Used weed today?</span>
          <Toggle on={weedToday} onToggle={() => u('taper', (p) => ({ ...p, [today]: !p[today] }))} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
          <span style={{ fontSize: 14 }}>Drinks today</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" onClick={() => u('alcohol', (p) => ({ ...p, [today]: Math.max(0, (p[today] || 0) - 1) }))} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', background: '#F9F9F9', fontSize: 16, cursor: 'pointer' }}>−</button>
            <span style={{ fontSize: 18, fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{drinksToday}</span>
            <button type="button" onClick={() => u('alcohol', (p) => ({ ...p, [today]: (p[today] || 0) + 1 }))} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', background: '#F9F9F9', fontSize: 16, cursor: 'pointer' }}>+</button>
          </div>
        </div>
      </Card>
    );
  };

  const WorkoutSection = () => {
    const who = data.subtab3;
    const items = who === 'Him' ? HIM_WORK : HER_WORK;
    const key = today + '_work_' + who;
    return (
      <Card>
        <Hdr icon="🏋️" title="Workouts" sub="Weekly movement goals" />
        <Tabs tabs={['Him', 'Her']} active={who} set={(v) => u('subtab3', v)} />
        {items.map((w, i) => {
          const on = !!(data.workouts[key] || {})[i];
          return (
            <div key={i} onClick={() => toggle('workouts', key, i)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.04)', cursor: 'pointer' }}>
              <div>
                <div style={{ fontSize: 14, color: '#1a1a1a' }}>{w.n}</div>
                <div style={{ fontSize: 11, color: '#8E8E93' }}>Goal: {w.g}</div>
              </div>
              <Toggle on={on} onToggle={() => toggle('workouts', key, i)} />
            </div>
          );
        })}
      </Card>
    );
  };

  const CycleSection = () => {
    const cl = data.cycleLen;
    const ovDay = data.cycleStart ? new Date(new Date(data.cycleStart).getTime() + (cl - 14) * 86400000) : null;
    const fertStart = ovDay ? new Date(ovDay.getTime() - 5 * 86400000) : null;
    const fertEnd = ovDay ? new Date(ovDay.getTime() + 1 * 86400000) : null;
    const now = new Date(today + 'T00:00:00');
    const isFertile = fertStart && fertEnd && now >= fertStart && now <= fertEnd;
    return (
      <Card>
        <Hdr icon="🌸" title="Cycle & Conception" sub="Ovulation tracking & attempt log" />
        {isFertile && (
          <div style={{ background: 'rgba(196,149,106,0.08)', border: '1px solid rgba(196,149,106,0.2)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>🔥</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#C4956A' }}>Fertile Window Active</div>
              <div style={{ fontSize: 11, color: '#8E8E93' }}>Sex every 1–2 days recommended</div>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#8E8E93' }}>Last period start</span>
            <input type="date" value={data.cycleStart} onChange={(e) => u('cycleStart', e.target.value)} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.08)', fontSize: 13, background: '#F9F9F9' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#8E8E93' }}>Cycle length</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button type="button" onClick={() => u('cycleLen', Math.max(21, cl - 1))} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(0,0,0,0.08)', background: '#F9F9F9', fontSize: 14, cursor: 'pointer' }}>−</button>
              <span style={{ fontSize: 14, fontWeight: 600, minWidth: 30, textAlign: 'center' }}>{cl}d</span>
              <button type="button" onClick={() => u('cycleLen', Math.min(40, cl + 1))} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(0,0,0,0.08)', background: '#F9F9F9', fontSize: 14, cursor: 'pointer' }}>+</button>
            </div>
          </div>
          {ovDay && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, color: '#8E8E93' }}>Est. ovulation</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#C4956A' }}>{ovDay.toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
        </div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', marginBottom: 8 }}>ATTEMPT LOG (7 DAYS)</div>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(today + 'T00:00:00');
            d.setDate(d.getDate() - 6 + i);
            const k = todayKey(d);
            const on = !!data.attempts[k];
            return (
              <div key={i} onClick={() => u('attempts', (p) => ({ ...p, [k]: !p[k] }))} style={{ flex: 1, textAlign: 'center', padding: '6px 0', borderRadius: 8, cursor: 'pointer', background: on ? 'rgba(123,174,127,0.12)' : 'rgba(120,120,128,0.04)' }}>
                <div style={{ fontSize: 10, color: '#8E8E93' }}>{DAYS[d.getDay()]}</div>
                <div style={{ fontSize: 16, marginTop: 2 }}>{on ? '✓' : '○'}</div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  const LabSection = () => {
    const who = data.subtab4;
    const items = who === 'Him' ? LAB_HIM : LAB_HER;
    const statuses = ['Not Started', 'Scheduled', 'Completed'];
    const sColors = { 'Not Started': '#8E8E93', Scheduled: '#C4956A', Completed: '#5A9E5F' };
    return (
      <Card>
        <Hdr icon="🧪" title="Lab & Testing" sub="Track key baseline labs" />
        <Tabs tabs={['Him', 'Her']} active={who} set={(v) => u('subtab4', v)} />
        {items.map((lab, i) => {
          const lk = who + '_' + i;
          const st = data.labs[lk] || 'Not Started';
          const note = data.labNotes[lk] || '';
          return (
            <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{lab.n}</div>
                  <div style={{ fontSize: 11, color: '#8E8E93' }}>{lab.t}</div>
                </div>
                <button type="button" onClick={() => { const idx = statuses.indexOf(st); u('labs', (p) => ({ ...p, [lk]: statuses[(idx + 1) % 3] })); }} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: sColors[st], background: sColors[st] + '18' }}>
                  {st}
                </button>
              </div>
              <input type="text" placeholder="Add notes..." value={note} onChange={(e) => u('labNotes', (p) => ({ ...p, [lk]: e.target.value }))} style={{ width: '100%', marginTop: 8, padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.06)', fontSize: 12, background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          );
        })}
      </Card>
    );
  };

  const ReviewSection = () => {
    const wk = Math.ceil(Math.max(dayNum, 1) / 7) || 1;
    const rev = data.reviews[wk] || { wins: '', adj: '', ready: 'Medium' };
    const setRev = (k, v) => u('reviews', (p) => ({ ...p, [wk]: { ...rev, [k]: v } }));
    const rc = { Low: '#E8725A', Medium: '#D4A574', High: '#7BAE7F' };
    const himKey = today + '_Him';
    const herKey = today + '_Her';
    const himPct = Math.round((getChecked('checks', himKey) / HIM_DAILY.length) * 100);
    const herPct = Math.round((getChecked('checks', herKey) / HER_DAILY.length) * 100);
    return (
      <Card>
        <Hdr icon="📊" title={'Week ' + wk + ' Review'} sub="Reflect and recalibrate" />
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, background: 'rgba(196,149,106,0.06)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#8E8E93', marginBottom: 4 }}>TERENCE</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#C4956A' }}>{himPct}%</div>
          </div>
          <div style={{ flex: 1, background: 'rgba(123,174,127,0.06)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#8E8E93', marginBottom: 4 }}>DANIA</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#7BAE7F' }}>{herPct}%</div>
          </div>
        </div>
        {[{ k: 'wins', l: 'WINS THIS WEEK', ph: 'What went well...' }, { k: 'adj', l: 'ADJUSTMENTS NEEDED', ph: 'What to improve...' }].map((f) => (
          <div key={f.k} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', marginBottom: 6 }}>{f.l}</div>
            <textarea value={rev[f.k]} onChange={(e) => setRev(f.k, e.target.value)} placeholder={f.ph} rows={2} style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid rgba(0,0,0,0.06)', fontSize: 13, background: '#FAFAFA', outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
        ))}
        <div style={{ fontSize: 12, fontWeight: 600, color: '#8E8E93', marginBottom: 8 }}>READINESS LEVEL</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['Low', 'Medium', 'High'].map((r) => (
            <button type="button" key={r} onClick={() => setRev('ready', r)} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s', background: rev.ready === r ? rc[r] + '18' : 'rgba(120,120,128,0.06)', color: rev.ready === r ? rc[r] : '#8E8E93', outline: rev.ready === r ? '2px solid ' + rc[r] + '40' : 'none' }}>{r}</button>
          ))}
        </div>
      </Card>
    );
  };

  const ReminderSection = () => (
    <Card>
      <Hdr icon="🔔" title="Gentle reminder plan" sub="Best next step for a busy, glanceable routine" />
      <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.5 }}>
        Use <strong>Morning + Evening</strong> rhythm:
        <div style={{ marginTop: 8 }}>• Morning: supplements, hydration, workout plan</div>
        <div>• Evening: scorecard, taper log, attempt log if relevant</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
        {['Morning + Evening', 'Morning only', 'Evening only'].map((mode) => (
          <SmallButton key={mode} variant={data.reminderMode === mode ? 'accent' : 'default'} onClick={() => u('reminderMode', mode)}>{mode}</SmallButton>
        ))}
      </div>
      <div style={{ fontSize: 12, color: '#8E8E93', marginTop: 12 }}>
        True push notifications can be added next, but on iPhone they work best after saving the site to the Home Screen. For reliability, calendar reminders are the strongest option.
      </div>
    </Card>
  );

  const sections = { daily: DailySection, progress: ProgressSection, supps: SuppsSection, taper: TaperSection, workout: WorkoutSection, cycle: CycleSection, labs: LabSection, review: ReviewSection };
  const Content = sections[tab];
  const nav = [
    { id: 'daily', icon: '📋', l: 'Daily' },
    { id: 'progress', icon: '🎯', l: 'Progress' },
    { id: 'supps', icon: '💊', l: 'Supps' },
    { id: 'taper', icon: '🚫', l: 'Taper' },
    { id: 'workout', icon: '🏋️', l: 'Workout' },
    { id: 'cycle', icon: '🌸', l: 'Cycle' },
    { id: 'labs', icon: '🧪', l: 'Labs' },
    { id: 'review', icon: '📊', l: 'Review' },
  ];

  if (!loaded) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', fontFamily: 'sans-serif' }}>Loading dashboard…</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F2F2F7', fontFamily: "-apple-system,'SF Pro Display','Helvetica Neue',sans-serif", paddingBottom: 90 }}>
      <div style={{ background: 'linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%)', padding: '20px 18px 24px', color: '#fff' }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#C4956A', marginBottom: 4 }}>CONCEPTION PROTOCOL</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.03em', lineHeight: 1.2 }}>Terence &amp; DaNia</h1>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>90-Day Command Center</div>
        <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 14px', flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{dayNum > 0 ? `Day ${dayNum}` : 'Set Day 1'}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{dayNum > 0 ? 'of 90' : 'choose start date'}</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '8px 14px', flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: phase.c }}>{phase.short}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{phase.l}</div>
          </div>
        </div>
      </div>
      <div style={{ padding: '16px 14px' }}>
        <ReminderSection />
        <Content />
        <Card>
          <Hdr icon="🛟" title="Controls" sub="Use these only when you want to make a major change" />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <SmallButton variant="danger" onClick={clearAllData}>Reset all saved progress</SmallButton>
          </div>
        </Card>
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '6px 0 env(safe-area-inset-bottom, 8px)', zIndex: 100 }}>
        {nav.map((n) => (
          <button type="button" key={n.id} onClick={() => setTab(n.id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, border: 'none', background: 'none', cursor: 'pointer', padding: '4px 2px' }}>
            <span style={{ fontSize: 17, opacity: tab === n.id ? 1 : 0.4 }}>{n.icon}</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: tab === n.id ? '#C4956A' : '#8E8E93' }}>{n.l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
