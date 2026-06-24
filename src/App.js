"use client";

import { useState, useEffect, useRef, useMemo, createContext, useContext } from "react";

/* ════════════════════════════════════════════════════════
   CURRENCIES
════════════════════════════════════════════════════════ */
const CURRENCIES = [
  { id: "SAR", code: "SAR", ar: "ر.س", en: "SAR", locale: "ar-SA", nameAr: "ريال سعودي", nameEn: "Saudi Riyal" },
  { id: "AED", code: "AED", ar: "د.إ", en: "AED", locale: "ar-AE", nameAr: "درهم إماراتي", nameEn: "UAE Dirham" },
  { id: "EGP", code: "EGP", ar: "ج.م", en: "EGP", locale: "ar-EG", nameAr: "جنيه مصري", nameEn: "Egyptian Pound" },
  { id: "USD", code: "USD", ar: "$",   en: "$",   locale: "en-US", nameAr: "دولار أمريكي", nameEn: "US Dollar" },
  { id: "DZD", code: "DZD", ar: "د.ج", en: "DZD", locale: "fr-DZ", nameAr: "دينار جزائري", nameEn: "Algerian Dinar" },
];
function getCurrency(id) { return CURRENCIES.find(c => c.id === id) || CURRENCIES[0]; }
function fmtMoney(n, cur) {
  const c = cur || CURRENCIES[0];
  try { return Number(n).toLocaleString(c.locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
  catch { return String(n); }
}
function curSymbol(cur, lang) {
  const c = cur || CURRENCIES[0];
  return lang === "ar" ? c.ar : c.en;
}

/* ════════════════════════════════════════════════════════
   i18n
════════════════════════════════════════════════════════ */
const I18nContext = createContext(null);
const useI18n = () => useContext(I18nContext);

const ACCENTS = [
  { id: "violet", color: "#8b5cf6", nameAr: "بنفسجي", nameEn: "Violet" },
  { id: "sky", color: "#0ea5e9", nameAr: "سماوي", nameEn: "Sky" },
  { id: "emerald", color: "#10b981", nameAr: "أخضر", nameEn: "Emerald" },
  { id: "rose", color: "#f43f5e", nameAr: "وردي", nameEn: "Rose" },
  { id: "amber", color: "#f59e0b", nameAr: "ذهبي", nameEn: "Amber" },
];
const ACCENT_VARS = {
  violet: { a300: "#c4b5fd", a400: "#a78bfa", a500: "#8b5cf6", a600: "#7c3aed", b600: "#4f46e5", b800: "#3730a3" },
  sky: { a300: "#7dd3fc", a400: "#38bdf8", a500: "#0ea5e9", a600: "#0284c7", b600: "#0369a1", b800: "#075985" },
  emerald: { a300: "#6ee7b7", a400: "#34d399", a500: "#10b981", a600: "#059669", b600: "#047857", b800: "#065f46" },
  rose: { a300: "#fda4af", a400: "#fb7185", a500: "#f43f5e", a600: "#e11d48", b600: "#be123c", b800: "#9f1239" },
  amber: { a300: "#fcd34d", a400: "#fbbf24", a500: "#f59e0b", a600: "#d97706", b600: "#b45309", b800: "#92400e" },
};

/* ════════════════════════════════════════════════════════
   DATE HELPERS — matches utils/dates.ts exactly
════════════════════════════════════════════════════════ */
function toKey(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function isSameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
function startOfWeek(d) { return addDays(d, -((d.getDay() + 1) % 7)); } // Saturday = start
const DAYS_SHORT_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const DAYS_SHORT_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function getDaysShort(lang) { return lang === "ar" ? DAYS_SHORT_AR : DAYS_SHORT_EN; }
const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function getMonths(lang) { return lang === "ar" ? MONTHS_AR : MONTHS_EN; }
function getMonthGrid(y, m) {
  const first = new Date(y, m, 1);
  const startPad = (first.getDay() + 1) % 7;
  const start = addDays(first, -startPad);
  const weeks = []; let cur = start;
  for (let w = 0; w < 6; w++) { const row = []; for (let i = 0; i < 7; i++) { row.push(cur); cur = addDays(cur, 1); } weeks.push(row); }
  return weeks;
}
function formatFullDate(d, lang) {
  const months = getMonths(lang);
  return lang === "ar" ? `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}` : `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}
function hourLabel(h, lang) {
  const hh = h % 12 === 0 ? 12 : h % 12;
  if (lang === "ar") return `${hh} ${h < 12 ? "ص" : "م"}`;
  return `${hh} ${h < 12 ? "AM" : "PM"}`;
}
function minutesToLabel(mins, lang) {
  const h = Math.floor(mins / 60), m = mins % 60;
  const hh12 = h % 12 === 0 ? 12 : h % 12;
  const period = lang === "ar" ? (h < 12 ? "ص" : "م") : (h < 12 ? "AM" : "PM");
  return `${String(hh12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}

/* ════════════════════════════════════════════════════════
   DESIGN SYSTEM — unified tokens for professional polish
════════════════════════════════════════════════════════ */
const DS = {
  // Neutral palette (slate-zinc blend, warmer than pure zinc)
  surface:   "#0c0e16",   // app background
  surface1:  "#11131e",   // sheet / modal
  surface2:  "#181B27",   // card
  surface3:  "#1f2333",   // card hover / input
  border:    "rgba(255,255,255,0.06)",
  borderStrong: "rgba(255,255,255,0.12)",
  text1:     "#f8fafc",   // primary
  text2:     "#cbd5e1",   // secondary
  text3:     "#94a3b8",   // muted
  text4:     "#64748b",   // hint
  text5:     "#475569",   // disabled
  // Radii
  rSm: 10, rMd: 14, rLg: 18, rXl: 22, r2xl: 28,
  // Soft elevation shadows (multi-layer for depth)
  shadowSm: "0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)",
  shadowMd: "0 4px 12px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.25)",
  shadowLg: "0 12px 32px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.3)",
  shadowXl: "0 24px 48px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.35)",
  // Type scale
  fzMicro: 10, fzXs: 11, fzSm: 12, fzBase: 13, fzMd: 14, fzLg: 16, fzXl: 18, fz2xl: 22, fz3xl: 28, fz4xl: 34,
  // Spacing rhythm (4px base)
  s1: 4, s2: 8, s3: 12, s4: 16, s5: 20, s6: 24, s8: 32, s10: 40,
};

/* ════════════════════════════════════════════════════════
   ICONS
════════════════════════════════════════════════════════ */
const _BellIcon = (p) => (<svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>);
const FlameIcon = ({ size = 14, ...p }) => (<svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" {...p}><path d="M12 2c1 4-4 5-4 9a4 4 0 0 0 8 0c0-1-.5-2-1-2.5.5 2 0 4-1.5 4.5 1-3-2-4-2-7 0-1 .3-2.5.5-4z" /></svg>);
const CheckIcon = ({ size = 14, ...p }) => (<svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 6 9 17l-5-5" /></svg>);
const ChevronDownIcon = ({ size = 16, rotate = false }) => (<svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ transform: rotate ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><path d="m6 9 6 6 6-6" /></svg>);
const ChevronLeftIcon = ({ size = 16, flip = false }) => (<svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ transform: flip ? "rotate(180deg)" : "none" }}><path d="m15 6-6 6 6 6" /></svg>);
const SparkleIcon = ({ size = 14, ...p }) => (<svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" {...p}><path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5z" /></svg>);
const PlusIcon = ({ size = 20, ...p }) => (<svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 5v14M5 12h14" /></svg>);
const EditIcon = ({ size = 14, ...p }) => (<svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" /></svg>);
const _MenuIcon = () => (<svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>);
const _ClockIcon = () => (<svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);

/* ════════════════════════════════════════════════════════
   localStorage hook
════════════════════════════════════════════════════════ */
function useLS(key, init) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : (typeof init === "function" ? init() : init); }
    catch { return typeof init === "function" ? init() : init; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal];
}

/* ════════════════════════════════════════════════════════
   SHEET WRAPPER — premium bottom sheet with proper depth
════════════════════════════════════════════════════════ */
function Sheet({ children, onClose, maxH = "88%" }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", animation: "fadeIn 0.2s both" }} />
      <div style={{
        position: "relative", width: "100%", maxHeight: maxH, overflowY: "auto",
        borderRadius: "28px 28px 0 0",
        background: `linear-gradient(180deg, ${DS.surface1} 0%, ${DS.surface} 100%)`,
        borderTop: `1px solid ${DS.borderStrong}`,
        padding: "12px 20px 32px",
        boxShadow: DS.shadowXl,
        animation: "sheetIn 0.4s cubic-bezier(.21,.61,.35,1) both",
      }}>
        <div style={{ margin: "0 auto 20px", height: 4, width: 44, borderRadius: 4, background: "rgba(255,255,255,0.22)" }} />
        {children}
      </div>
    </div>
  );
}
function SheetInput({ value, onChange, placeholder, autoFocus, accentColor, onKeyDown }) {
  return (
    <input autoFocus={autoFocus} value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown}
      style={{ width: "100%", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.06)",
        padding: "14px 16px", fontSize: 15, fontWeight: 500, color: "#fff", outline: "none", boxSizing: "border-box",
        "::placeholder": { color: "rgba(255,255,255,0.35)" } }}
      onFocus={e => e.target.style.borderColor = accentColor || "#8b5cf6"}
      onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.12)"} />
  );
}
function SheetSelect({ value, onChange, children }) {
  return (
    <select value={value} onChange={onChange} style={{ width: "100%", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.12)",
      background: "#161927", padding: "12px 14px", fontSize: 14, fontWeight: 500, color: "#fff", outline: "none" }}>
      {children}
    </select>
  );
}
function PrimaryBtn({ label, onClick, disabled, accentColor, accentColor2 }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: "100%", marginTop: 24, borderRadius: 16, border: "none", padding: "15px 0",
      fontSize: 15, fontWeight: 700, color: "#fff", cursor: disabled ? "not-allowed" : "pointer",
      background: `linear-gradient(135deg, ${accentColor}, ${accentColor2 || accentColor})`,
      opacity: disabled ? 0.4 : 1, transition: "all 0.2s",
      boxShadow: disabled ? "none" : `0 8px 24px ${accentColor}40, 0 2px 8px ${accentColor}30`,
      transform: disabled ? "none" : "translateY(0)",
    }}
    onMouseDown={e => !disabled && (e.currentTarget.style.transform = "translateY(1px)")}
    onMouseUp={e => !disabled && (e.currentTarget.style.transform = "translateY(0)")}
    onMouseLeave={e => !disabled && (e.currentTarget.style.transform = "translateY(0)")}
    >{label}</button>
  );
}

/* ════════════════════════════════════════════════════════
   PROGRESS RING — refined with gradient + glow
════════════════════════════════════════════════════════ */
function ProgressRing({ percent, doneLabel, size = 112, stroke = 8, gradientId = "ringGrad" }) {
  const r = (size - stroke) / 2 - 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <div style={{ position: "relative", display: "grid", placeItems: "center", height: size, width: size, flexShrink: 0 }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ transform: "rotate(-90deg)", filter: `drop-shadow(0 0 8px rgba(255,255,255,0.15))` }}>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.7)" />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={`url(#${gradientId})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(.3,.7,.3,1)" }} />
      </svg>
      <div style={{ position: "absolute", textAlign: "center" }}>
        <div style={{ fontSize: size > 90 ? 26 : 18, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>{percent}%</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 2 }}>{doneLabel}</div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   HOME SCREEN — matches data.ts seed exactly
════════════════════════════════════════════════════════ */
const _HOME_TASKS_SEED = [
  { id: "t1", title: "مراجعة خطة المشروع الأسبوعية", titleEn: "Review weekly project plan", time: "09:00 ص", timeEn: "09:00 AM", category: "العمل", categoryEn: "Work", categoryColor: "#818cf8", priority: "high", done: true },
  { id: "t2", title: "اجتماع فريق التصميم", titleEn: "Design team meeting", time: "11:30 ص", timeEn: "11:30 AM", category: "العمل", categoryEn: "Work", categoryColor: "#818cf8", priority: "high", done: false },
  { id: "t3", title: "قراءة 20 صفحة من كتاب العادات الذرية", titleEn: "Read 20 pages of Atomic Habits", time: "04:00 م", timeEn: "04:00 PM", category: "تطوير ذاتي", categoryEn: "Self-growth", categoryColor: "#34d399", priority: "medium", done: false },
  { id: "t4", title: "تمارين رياضية — جري 5 كم", titleEn: "Workout — 5km run", time: "06:30 م", timeEn: "06:30 PM", category: "صحة", categoryEn: "Health", categoryColor: "#f472b6", priority: "medium", done: false },
  { id: "t5", title: "شراء مستلزمات المنزل", titleEn: "Buy home supplies", time: "08:00 م", timeEn: "08:00 PM", category: "شخصي", categoryEn: "Personal", categoryColor: "#fbbf24", priority: "low", done: false },
];
const _HOME_HABITS_SEED = [
  { id: "h1", title: "شرب الماء", titleEn: "Drink water", emoji: "💧", streak: 12, goal: 8, doneToday: 5, color: "#38bdf8" },
  { id: "h2", title: "قراءة", titleEn: "Reading", emoji: "📖", streak: 7, goal: 1, doneToday: 1, color: "#34d399" },
  { id: "h3", title: "تأمل", titleEn: "Meditation", emoji: "🧘", streak: 21, goal: 1, doneToday: 0, color: "#a78bfa" },
  { id: "h4", title: "رياضة", titleEn: "Exercise", emoji: "🏃", streak: 4, goal: 1, doneToday: 0, color: "#fb7185" },
];

/* Reusable section header — consistent typography across all screens */
function SectionHeader({ title, onMore, lang, A, moreLabel }) {
  const { t } = useI18n();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: DS.text1, margin: 0, letterSpacing: -0.2 }}>{title}</h3>
      {onMore && (
        <button onClick={onMore} style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 12, fontWeight: 600, color: A.a400, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          {moreLabel || t("عرض الكل", "View all")}<ChevronLeftIcon size={14} flip={lang === "en"} />
        </button>
      )}
    </div>
  );
}

function HomeScreen({ onNavigate, events, habits, goals, txs }) {
  const { lang, t, A, cur } = useI18n();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);

  const dShort = getDaysShort(lang);
  const months = getMonths(lang);
  const week = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(today), i));

  // ── Tasks for selected day (from events array in TasksScreen) ──
  const selKey = toKey(selectedDate);
  const dayEvents = (Array.isArray(events)
    ? events.filter(e => e.dateKey === selKey)
    : (events[selKey] || [])
  ).sort((a, b) => a.start - b.start);
  const dayDone  = dayEvents.filter(e => e.status === "done").length;
  const dayTotal = dayEvents.length;
  const percent  = dayTotal ? Math.round((dayDone / dayTotal) * 100) : 0;
  const isToday  = isSameDay(selectedDate, today);

  // ── Habits stats ──
  const todayKey = toKey(today);
  function calcStreak(h) {
    let s = 0, d = today;
    while (true) {
      if (h.days && h.days.includes(d.getDay())) { if ((h.log[toKey(d)] ?? 0) >= h.goal) s++; else break; }
      else if (!h.days) { if (h.log[toKey(d)]) s++; else break; }
      d = addDays(d, -1);
      if (s > 0 && d < addDays(today, -370)) break;
      if (d < addDays(today, -370)) break;
    }
    return s;
  }
  const dueHabitsToday = habits.filter(h => !h.days || h.days.includes(today.getDay()));
  const doneHabitsToday = dueHabitsToday.filter(h => (h.log?.[todayKey] ?? 0) >= (h.goal ?? 1)).length;
  const longestStreak = habits.reduce((max, h) => Math.max(max, calcStreak(h)), 0);

  // ── Goals stats ──
  const _activeGoals = goals.filter(g => {
    const done = g.milestones ? g.milestones.filter(m => m.done).length : (g.doneSteps ?? 0);
    const total = g.milestones ? g.milestones.length : (g.totalSteps ?? 1);
    return total > 0 && done < total;
  }).length;

  // ── Finance stats (this month) ──
  const now = new Date();
  const monthTxs = txs.filter(tx => {
    const d = new Date(tx.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const monthIn  = monthTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const monthEx  = monthTxs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const monthBal = monthIn - monthEx;

  const _priorityColors = { high: "#fb7185", medium: "#fbbf24", low: "#38bdf8" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22, padding: "20px 20px 128px" }}>

      {/* ── LOGO + GREETING ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4, animation: "floatIn 0.45s both" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "grid", placeItems: "center", height: 42, width: 42, borderRadius: 13,
            background: `linear-gradient(135deg, ${A.a500}, ${A.b600})`,
            boxShadow: `0 6px 20px ${A.a600}50`, fontSize: 20 }}>⚡</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: DS.text1, letterSpacing: -0.5, lineHeight: 1.1 }}>Road</span>
            <span style={{ fontSize: 10, color: DS.text4, fontWeight: 500 }}>{t("رفيقك في الإنجاز", "Your companion")}</span>
          </div>
        </div>
        <div style={{ display: "grid", placeItems: "center", height: 40, width: 40, borderRadius: 12, background: "rgba(255,255,255,0.04)", border: `1px solid ${DS.border}`, fontSize: 18 }}>👋</div>
      </div>

      {/* ── WEEK STRIP ── */}
      <section style={{ display: "flex", justifyContent: "space-between", gap: 4, animation: "floatIn 0.45s 60ms both" }}>
        {week.map(d => {
          const isActive = isSameDay(d, selectedDate);
          const isTdy    = isSameDay(d, today);
          const dk       = toKey(d);
          const dayEvs   = Array.isArray(events) ? events.filter(e => e.dateKey === dk) : (events[dk] || []);
          const hasTasks = dayEvs.length > 0;
          return (
            <button key={dk} onClick={() => setSelectedDate(d)} style={{
              display: "flex", flex: 1, flexDirection: "column", alignItems: "center", gap: 5,
              borderRadius: 16, padding: "10px 0 8px", border: "none", cursor: "pointer", transition: "all 0.25s cubic-bezier(.3,.7,.3,1)",
              background: isActive ? `linear-gradient(180deg, ${A.a500}, ${A.b600})` : "transparent",
              boxShadow: isActive ? `0 8px 20px ${A.a600}40` : "none" }}>
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 500, color: isActive ? "rgba(255,255,255,0.85)" : DS.text4 }}>{dShort[d.getDay()]}</span>
              <span style={{ fontSize: 15, fontWeight: 700, color: isActive ? "#fff" : isTdy ? A.a400 : DS.text2, letterSpacing: -0.3 }}>{d.getDate()}</span>
              <span style={{ height: 4, width: 4, borderRadius: "50%",
                background: hasTasks ? (isActive ? "rgba(255,255,255,0.7)" : A.a400) : "transparent" }} />
            </button>
          );
        })}
      </section>

      {/* ── PROGRESS HERO CARD ── */}
      <section style={{ position: "relative", overflow: "hidden", borderRadius: 26, padding: 22,
        background: `linear-gradient(135deg, ${A.a600} 0%, ${A.b600} 60%, ${A.b800} 100%)`,
        boxShadow: `0 20px 40px ${A.b800}50, 0 8px 16px ${A.b800}30, inset 0 1px 0 rgba(255,255,255,0.15)`,
        animation: "floatIn 0.45s 120ms both" }}>
        <div style={{ position: "absolute", top: -50, left: -50, height: 180, width: 180, borderRadius: "50%", background: "rgba(255,255,255,0.12)", filter: "blur(50px)" }} />
        <div style={{ position: "absolute", bottom: -60, right: -40, height: 160, width: 160, borderRadius: "50%", background: "rgba(232,121,249,0.25)", filter: "blur(50px)" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, minWidth: 0 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 20, background: "rgba(255,255,255,0.18)", padding: "5px 12px", fontSize: 11, fontWeight: 600, color: "#fff", width: "fit-content", backdropFilter: "blur(8px)" }}>
              <SparkleIcon size={13} />
              {isToday ? t("تقدّم اليوم", "Today's progress") : `${selectedDate.getDate()} ${months[selectedDate.getMonth()]}`}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.25, color: "#fff", margin: 0, letterSpacing: -0.5 }}>
              {dayTotal === 0
                ? t("لا توجد مهام", "No tasks")
                : t(`أنجزت ${dayDone} من ${dayTotal} مهام`, `Done ${dayDone} of ${dayTotal} tasks`)}
            </h2>
            <p style={{ fontSize: 12, lineHeight: 1.5, color: "rgba(255,255,255,0.8)", margin: 0, fontWeight: 500 }}>
              {percent >= 100
                ? t("رائع! أكملت كل المهام 🎉", "Amazing! All done 🎉")
                : dayTotal === 0
                  ? t("اضغط على المهام لإضافة مهام", "Tap Tasks to add new ones")
                  : t(`باقٍ ${dayTotal - dayDone} ${dayTotal - dayDone === 1 ? "مهمة" : "مهام"} لإكمال اليوم`, `${dayTotal - dayDone} ${dayTotal - dayDone === 1 ? "task" : "tasks"} left today`)}
            </p>
          </div>
          <ProgressRing percent={percent} doneLabel={t("مكتمل", "Done")} size={104} stroke={8} gradientId="homeRing" />
        </div>
      </section>

      {/* ── QUICK STATS ── */}
      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, animation: "floatIn 0.45s 180ms both" }}>
        {[
          { value: String(dayTotal - dayDone), label: t("مهام متبقية", "Tasks left"), color: A.a400, bg: `${A.a500}14`, onClick: () => onNavigate("tasks") },
          { value: longestStreak, label: t("أطول سلسلة", "Best streak"), color: "#fbbf24", bg: "rgba(245,158,11,0.08)", flame: true, onClick: () => onNavigate("habits") },
          { value: String(doneHabitsToday) + "/" + String(dueHabitsToday.length), label: t("عادات اليوم", "Today's habits"), color: "#34d399", bg: "rgba(16,185,129,0.08)", onClick: () => onNavigate("habits") },
        ].map(s => (
          <button key={s.label} onClick={s.onClick} style={{ borderRadius: 18, border: `1px solid ${DS.border}`, background: DS.surface2, padding: "16px 8px", textAlign: "center", cursor: "pointer", transition: "all 0.2s", boxShadow: DS.shadowSm }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: -0.3 }}>{s.flame && <FlameIcon size={14} />}{s.value}</div>
            <div style={{ marginTop: 4, fontSize: 10, color: DS.text3, fontWeight: 500 }}>{s.label}</div>
          </button>
        ))}
      </section>

      {/* ── TODAY'S HABITS ── */}
      {habits.length > 0 && (
        <section style={{ display: "flex", flexDirection: "column", gap: 12, animation: "floatIn 0.45s 240ms both" }}>
          <SectionHeader title={t("عاداتك اليوم", "Today's habits")} onMore={() => onNavigate("habits")} lang={lang} A={A} />
          <div style={{ display: "flex", gap: 12, overflowX: "auto", margin: "0 -20px", padding: "0 20px 4px" }}>
            {habits.slice(0, 6).map(h => {
              const count   = h.log?.[todayKey] ?? 0;
              const goal    = h.goal ?? 1;
              const pct     = Math.min(100, Math.round((count / goal) * 100));
              const streak  = calcStreak(h);
              const isDue   = !h.days || h.days.includes(today.getDay());
              return (
                <div key={h.id} style={{ width: 116, flexShrink: 0, borderRadius: 18, border: `1px solid ${DS.border}`, background: DS.surface2, padding: 14, opacity: isDue ? 1 : 0.45, boxShadow: DS.shadowSm }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 22 }}>{h.icon || "🔥"}</span>
                    {streak > 0 && <span style={{ display: "flex", alignItems: "center", gap: 2, borderRadius: 20, background: "rgba(245,158,11,0.12)", padding: "2px 6px", fontSize: 9, fontWeight: 700, color: "#fbbf24" }}><FlameIcon size={10} />{streak}</span>}
                  </div>
                  <p style={{ marginTop: 8, fontSize: 12, fontWeight: 600, color: DS.text1, margin: "8px 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.title}</p>
                  <p style={{ fontSize: 10, color: DS.text4, margin: 0, fontWeight: 500 }}>{count}/{goal}</p>
                  <div style={{ marginTop: 8, height: 5, overflow: "hidden", borderRadius: 8, background: "rgba(255,255,255,0.08)" }}>
                    <div style={{ height: "100%", borderRadius: 8, width: `${pct}%`, background: `linear-gradient(90deg, ${h.color || A.a600}, ${h.color || A.a400})`, transition: "width 0.4s" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── DAY'S TASKS ── */}
      <section style={{ display: "flex", flexDirection: "column", gap: 12, animation: "floatIn 0.45s 300ms both" }}>
        <SectionHeader
          title={isToday ? t("مهام اليوم", "Today's tasks") : `${selectedDate.getDate()} ${months[selectedDate.getMonth()]}`}
          onMore={() => onNavigate("tasks")} lang={lang} A={A}
        />
        {dayEvents.length === 0 ? (
          <div style={{ borderRadius: 18, border: `1px dashed ${DS.borderStrong}`, background: "rgba(255,255,255,0.015)", padding: "32px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>📋</div>
            <p style={{ color: DS.text4, fontSize: 13, margin: 0, fontWeight: 500 }}>{t("لا توجد مهام في هذا اليوم", "No tasks on this day")}</p>
          </div>
        ) : dayEvents.slice(0, 5).map(ev => {
          const sc = STATUS_COLOR[ev.status] || A.a500;
          return (
            <button key={ev.id} onClick={() => onNavigate("tasks")} style={{
              display: "flex", width: "100%", alignItems: "center", gap: 12, borderRadius: 16,
              border: `1px solid ${DS.border}`, padding: 14,
              textAlign: lang === "ar" ? "right" : "left",
              background: DS.surface2,
              opacity: ev.status === "done" ? 0.55 : 1, cursor: "pointer", transition: "all 0.15s", boxShadow: DS.shadowSm }}>
              <span style={{ height: 36, width: 4, flexShrink: 0, borderRadius: 4, background: sc }} />
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  fontSize: 13, fontWeight: 600, color: ev.status === "done" ? DS.text4 : DS.text1,
                  textDecoration: ev.status === "done" ? "line-through" : "none" }}>{ev.title}</span>
                <span style={{ fontSize: 10, color: DS.text4, fontWeight: 500 }}>{minutesToLabel(ev.start, lang)} – {minutesToLabel(ev.end, lang)}</span>
              </span>
              <span style={{ flexShrink: 0, borderRadius: 20, padding: "3px 10px", fontSize: 9, fontWeight: 700, background: `${sc}22`, color: sc }}>
                {statusLabel(ev.status, t)}
              </span>
            </button>
          );
        })}
      </section>

      {/* ── FINANCE SUMMARY ── */}
      <section style={{ animation: "floatIn 0.45s 360ms both" }}>
        <SectionHeader title={t("ملخص المصروف", "Finance summary")} onMore={() => onNavigate("finance")} lang={lang} A={A} />
        <div style={{ borderRadius: 18, border: `1px solid ${DS.border}`, background: DS.surface2, padding: 18, boxShadow: DS.shadowSm, marginTop: 12 }}>
          <p style={{ fontSize: 11, color: DS.text3, margin: "0 0 6px", fontWeight: 500 }}>{getMonths(lang)[now.getMonth()]} {now.getFullYear()}</p>
          <p style={{ fontSize: 28, fontWeight: 900, color: monthBal >= 0 ? "#34d399" : "#fb7185", margin: "0 0 16px", direction: "ltr", textAlign: lang === "ar" ? "right" : "left", letterSpacing: -0.5 }}>
            {monthBal >= 0 ? "+" : ""}{fmtMoney(monthBal, cur)} {curSymbol(cur, lang)}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { label: t("دخل", "Income"), val: monthIn, color: "#34d399" },
              { label: t("مصروف", "Expense"), val: monthEx, color: "#fb7185" },
              { label: t("معاملات", "Txs"), val: monthTxs.length, color: A.a400, noMoney: true },
            ].map(s => (
              <div key={s.label} style={{ borderRadius: 12, background: "rgba(255,255,255,0.03)", padding: "12px 8px", textAlign: "center", border: `1px solid ${DS.border}` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: s.color, direction: "ltr" }}>{s.noMoney ? s.val : fmtMoney(s.val, cur)}</div>
                <div style={{ fontSize: 9, color: DS.text4, marginTop: 3, fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {monthTxs.length === 0 && (
            <p style={{ textAlign: "center", fontSize: 11, color: DS.text5, marginTop: 14, fontWeight: 500 }}>{t("لا توجد معاملات هذا الشهر", "No transactions this month")}</p>
          )}
        </div>
      </section>

      {/* ── QUOTE ── */}
      <section style={{ borderRadius: 24, border: `1px solid ${DS.border}`, background: `linear-gradient(135deg, ${A.a500}0d, ${A.b600}0d)`, padding: 20, animation: "floatIn 0.45s 420ms both", boxShadow: DS.shadowSm }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
          <span style={{ fontSize: 30, lineHeight: 1 }}>🚀</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.6, color: DS.text1, margin: 0 }}>
              {t(`"الطريق إلى النجاح يبدأ بخطوة... وأنت قطعت ${percent}% من طريق اليوم"`, `"The road to success starts with a step... you've covered ${percent}% of today's road"`)}
            </p>
            <p style={{ marginTop: 6, fontSize: 11, color: DS.text4, margin: "6px 0 0", fontWeight: 500 }}>{t("رود — رفيقك في الإنجاز", "Road — your companion to getting things done")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   TASKS SCREEN — full gesture system (press/scroll/move/resize)
════════════════════════════════════════════════════════ */
const HOUR = 56, SNAP = 15;
const STATUS_COLOR = { pending: "#0ea5e9", done: "#22c55e", postponed: "#f59e0b", missed: "#ef4444" };
function statusLabel(s, t) {
  if (s === "pending") return t("قيد التنفيذ", "In progress");
  if (s === "done") return t("منجزة", "Done");
  if (s === "postponed") return t("مؤجلة", "Postponed");
  return t("فائتة", "Missed");
}

function makeTasksSeed(lang) {
  const T = (ar, en) => (lang === "ar" ? ar : en);
  const today = new Date();
  return [
    { id: "e1", title: T("اجتماع فريق التصميم", "Design team meeting"), dateKey: toKey(today), start: 9 * 60, end: 10 * 60 + 30, status: "done" },
    { id: "e2", title: T("مراجعة خطة المشروع", "Review project plan"), dateKey: toKey(today), start: 11 * 60, end: 12 * 60, status: "pending" },
    { id: "e3", title: T("غداء مع أحمد", "Lunch with Ahmed"), dateKey: toKey(today), start: 13 * 60, end: 14 * 60, status: "pending" },
    { id: "e4", title: T("تمارين رياضية", "Workout"), dateKey: toKey(today), start: 18 * 60 + 30, end: 19 * 60 + 30, status: "pending" },
    { id: "e5", title: T("قراءة — العادات الذرية", "Reading — Atomic Habits"), dateKey: toKey(today), start: 21 * 60, end: 22 * 60, status: "pending" },
    { id: "e6", title: T("مكالمة مع العميل", "Client call"), dateKey: toKey(addDays(today, 1)), start: 10 * 60, end: 11 * 60, status: "pending" },
    { id: "e7", title: T("تسليم التقرير الشهري", "Submit monthly report"), dateKey: toKey(addDays(today, 1)), start: 14 * 60, end: 15 * 60 + 30, status: "postponed" },
    { id: "e8", title: T("موعد طبيب الأسنان", "Dentist appointment"), dateKey: toKey(addDays(today, -1)), start: 16 * 60 + 30, end: 17 * 60 + 30, status: "missed" },
    { id: "e9", title: T("تخطيط الأسبوع القادم", "Plan next week"), dateKey: toKey(addDays(today, 3)), start: 9 * 60, end: 10 * 60, status: "pending" },
    { id: "e10", title: T("عشاء عائلي", "Family dinner"), dateKey: toKey(addDays(today, 4)), start: 20 * 60, end: 21 * 60 + 30, status: "pending" },
  ];
}

function layoutDay(events) {
  const sorted = [...events].sort((a, b) => a.start - b.start || b.end - a.end);
  const colEnds = [];
  const placed = sorted.map(e => {
    let col = colEnds.findIndex(end => end <= e.start);
    if (col === -1) { col = colEnds.length; colEnds.push(e.end); }
    else colEnds[col] = e.end;
    return { event: e, col };
  });
  return placed.map(p => ({ ...p, total: colEnds.length }));
}

function TasksScreen({ events, setEvents }) {
  const { lang, t, A } = useI18n();
  const [selected, setSelected] = useState(new Date());
  const [view, setView] = useState("day");
  const [monthOpen, setMonthOpen] = useState(false);
  const today0 = new Date();
  const [gridMonth, setGridMonth] = useState({ y: today0.getFullYear(), m: today0.getMonth() });
  const [now, setNow] = useState(new Date());
  const [addSheet, setAddSheet] = useState(null);
  const [statusSheet, setStatusSheet] = useState(null);
  const [editSheet, setEditSheet] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [preview, setPreview] = useState(null);

  const scrollRef = useRef(null);
  const gestureRef = useRef(null);

  const mNames = getMonths(lang);
  const dShort = getDaysShort(lang);
  const calLetters = lang === "ar" ? ["سبت", "أحد", "اثن", "ثلا", "أرب", "خمي", "جمع"] : ["Sa", "Su", "Mo", "Tu", "We", "Th", "Fr"];
  const mtl = (m) => minutesToLabel(m, lang);

  useEffect(() => { const tm = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(tm); }, []);
  useEffect(() => {
    if (view === "month") return;
    const h = isSameDay(selected, new Date()) ? Math.max(new Date().getHours() - 1.5, 0) : 7.5;
    scrollRef.current?.scrollTo({ top: h * HOUR });
  }, [view]);

  const eventsByKey = useMemo(() => {
    const map = new Map();
    for (const e of events) { const arr = map.get(e.dateKey) ?? []; arr.push(e); map.set(e.dateKey, arr); }
    return map;
  }, [events]);

  const weekStart = startOfWeek(selected);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const visibleDays = view === "week" ? weekDates : [selected];

  const pickDate = (d) => { setSelected(d); setGridMonth({ y: d.getFullYear(), m: d.getMonth() }); setMonthOpen(false); };

  const saveEvent = (title, start, duration) => {
    if (!addSheet || !title.trim()) return;
    setEvents(prev => [...prev, { id: `e${Date.now()}`, title: title.trim(), dateKey: addSheet.dateKey, start, end: Math.min(start + duration, 24 * 60), status: "pending" }]);
    setAddSheet(null);
  };
  const updateEventFn = (id, title, start, duration) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, title: title.trim(), start, end: Math.min(start + duration, 24 * 60) } : e));
    setEditSheet(null);
  };
  const setStatusFn = (id, status) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status: e.status === status ? "pending" : status } : e));
    setStatusSheet(null);
  };
  const deleteEventFn = (id) => { setEvents(prev => prev.filter(e => e.id !== id)); setEditSheet(null); setStatusSheet(null); };

  const clearGesture = () => { const g = gestureRef.current; if (g?.timer) window.clearTimeout(g.timer); gestureRef.current = null; };

  const onEventPointerDown = (ev, e, dayIdx) => {
    if (view === "month") return;
    ev.currentTarget.setPointerCapture(ev.pointerId);
    const colWidth = ev.currentTarget.parentElement?.getBoundingClientRect().width ?? 300;
    const isActive = activeId === e.id;
    const g = { id: e.id, mode: isActive ? "move" : "press", longPressFired: false, startX: ev.clientX, startY: ev.clientY, lastY: ev.clientY,
      origStart: e.start, origEnd: e.end, origDayIdx: dayIdx, colWidth, timer: null };
    if (!isActive) {
      g.timer = window.setTimeout(() => { g.mode = "move"; g.longPressFired = true; g.timer = null; setActiveId(e.id); navigator.vibrate?.(15); }, 380);
    }
    gestureRef.current = g;
  };
  const onResizePointerDown = (ev, e, dayIdx) => {
    ev.stopPropagation();
    ev.currentTarget.setPointerCapture(ev.pointerId);
    gestureRef.current = { id: e.id, mode: "resize", longPressFired: true, startX: ev.clientX, startY: ev.clientY, lastY: ev.clientY,
      origStart: e.start, origEnd: e.end, origDayIdx: dayIdx, colWidth: 300, timer: null };
  };
  const onEventPointerMove = (ev) => {
    const g = gestureRef.current;
    if (!g) return;
    const dx = ev.clientX - g.startX, dy = ev.clientY - g.startY;
    if (g.mode === "press") {
      if (Math.hypot(dx, dy) > 8) { if (g.timer) window.clearTimeout(g.timer); g.timer = null; g.mode = "scroll"; g.lastY = ev.clientY; }
      return;
    }
    if (g.mode === "scroll") { if (scrollRef.current) scrollRef.current.scrollTop -= ev.clientY - g.lastY; g.lastY = ev.clientY; return; }
    const deltaMin = Math.round(((dy / HOUR) * 60) / SNAP) * SNAP;
    if (g.mode === "move") {
      const dur = g.origEnd - g.origStart;
      const newStart = Math.min(Math.max(g.origStart + deltaMin, 0), 24 * 60 - dur);
      const dirFactor = lang === "ar" ? -1 : 1;
      const shift = view === "week" ? Math.round((dirFactor * dx) / g.colWidth) : 0;
      const newIdx = Math.min(Math.max(g.origDayIdx + shift, 0), visibleDays.length - 1);
      setPreview({ id: g.id, start: newStart, end: newStart + dur, dayIdx: newIdx });
    } else if (g.mode === "resize") {
      const newEnd = Math.min(Math.max(g.origEnd + deltaMin, g.origStart + SNAP), 24 * 60);
      setPreview({ id: g.id, start: g.origStart, end: newEnd, dayIdx: g.origDayIdx });
    }
  };
  const onEventPointerUp = (e) => {
    const g = gestureRef.current;
    if (!g) return;
    if (g.mode === "press") { clearGesture(); setStatusSheet(e); return; }
    if ((g.mode === "move" || g.mode === "resize") && preview && preview.id === g.id) {
      const targetDate = visibleDays[preview.dayIdx] ?? selected;
      setEvents(prev => prev.map(x => x.id === g.id ? { ...x, start: preview.start, end: preview.end, dateKey: toKey(targetDate) } : x));
      setActiveId(g.id);
    } else if (g.mode === "move" && !g.longPressFired) setStatusSheet(e);
    setPreview(null); clearGesture();
  };
  const onEventPointerCancel = () => { setPreview(null); clearGesture(); };

  const nowMins = now.getHours() * 60 + now.getMinutes();
  const monthGrid = getMonthGrid(gridMonth.y, gridMonth.m);
  const headerDate = view === "month" ? new Date(gridMonth.y, gridMonth.m, 1) : selected;

  return (
    <div style={{ position: "relative", display: "flex", height: "100%", flexDirection: "column" }}>
      <header style={{ zIndex: 20, borderBottom: `1px solid ${DS.border}`, background: "rgba(12,14,22,0.92)", padding: "16px 16px 10px", backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => view !== "month" && setMonthOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 12, padding: "6px 8px", border: "none", background: "transparent", cursor: "pointer" }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: DS.text1, margin: 0, letterSpacing: -0.4 }}>{mNames[headerDate.getMonth()]} <span style={{ fontWeight: 400, color: DS.text3 }}>{headerDate.getFullYear()}</span></h1>
            {view !== "month" && <ChevronDownIcon size={16} rotate={monthOpen} />}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", borderRadius: 12, border: `1px solid ${DS.border}`, background: DS.surface2, padding: 3 }}>
              {[{ id: "day", label: t("يوم", "Day") }, { id: "week", label: t("أسبوع", "Week") }, { id: "month", label: t("شهر", "Month") }].map(v => (
                <button key={v.id} onClick={() => { setView(v.id); setActiveId(null); setMonthOpen(false); }} style={{
                  borderRadius: 10, border: "none", padding: "5px 11px", fontSize: 11, fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                  background: view === v.id ? `linear-gradient(135deg, ${A.a500}, ${A.b600})` : "transparent", color: view === v.id ? "#fff" : DS.text3,
                  boxShadow: view === v.id ? `0 2px 8px ${A.a600}40` : "none" }}>{v.label}</button>
              ))}
            </div>
            <button onClick={() => setAddSheet({ dateKey: toKey(selected), start: Math.min((new Date().getHours() + 1) * 60, 23 * 60) })} style={{
              display: "grid", placeItems: "center", height: 34, width: 34, borderRadius: 12, border: "none", cursor: "pointer",
              background: `linear-gradient(135deg, ${A.a500}, ${A.b600})`, color: "#fff", boxShadow: `0 6px 16px ${A.a600}50` }}>
              <PlusIcon size={16} />
            </button>
          </div>
        </div>

        {monthOpen && view !== "month" && (
          <div style={{ marginTop: 12, borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)", background: "#181B27", padding: "16px 12px", animation: "floatIn 0.3s both", boxShadow: "0 16px 40px rgba(0,0,0,0.5)" }}>
            {/* Month nav */}
            <div style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button onClick={() => setGridMonth(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))}
                style={{ display: "grid", placeItems: "center", height: 32, width: 32, borderRadius: 10, color: "#94a3b8", background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", fontSize: 16 }}>
                {lang === "ar" ? "›" : "‹"}
              </button>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{mNames[gridMonth.m]} {gridMonth.y}</span>
              <button onClick={() => setGridMonth(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))}
                style={{ display: "grid", placeItems: "center", height: 32, width: 32, borderRadius: 10, color: "#94a3b8", background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", fontSize: 16 }}>
                {lang === "ar" ? "‹" : "›"}
              </button>
            </div>
            {/* Day letters */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
              {calLetters.map((d, i) => (
                <span key={i} style={{ textAlign: "center", fontSize: 11, color: "#64748b", padding: "4px 0", fontWeight: 500 }}>{d}</span>
              ))}
            </div>
            {/* Date grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
              {monthGrid.flat().map((d, i) => {
                const inMonth = d.getMonth() === gridMonth.m;
                const isSel   = isSameDay(d, selected);
                const isToday = isSameDay(d, new Date());
                const hasEvs  = (eventsByKey.get(toKey(d))?.length ?? 0) > 0;
                return (
                  <button key={i} onClick={() => pickDate(d)} style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                    padding: "5px 0", background: "none", border: "none", cursor: "pointer" }}>
                    <span style={{
                      display: "grid", placeItems: "center", height: 34, width: 34, borderRadius: "50%",
                      fontSize: 13, fontWeight: isSel || isToday ? 700 : 400, transition: "all 0.15s",
                      background: isSel ? A.a500 : "transparent",
                      color: isSel ? "#fff" : isToday ? A.a400 : inMonth ? "#e2e8f0" : "#3d4060",
                      boxShadow: isSel ? `0 4px 12px ${A.a600}60` : isToday && !isSel ? `0 0 0 1.5px ${A.a500} inset` : "none",
                    }}>{d.getDate()}</span>
                    <span style={{ height: 4, width: 4, borderRadius: "50%",
                      background: hasEvs && !isSel ? A.a400 : "transparent" }} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {!monthOpen && view === "day" && (
          <div style={{ marginTop: 8, display: "flex" }}>
            <div style={{ width: 48, flexShrink: 0 }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", flex: 1 }}>
              {weekDates.map(d => {
                const isSel = isSameDay(d, selected);
                const isToday = isSameDay(d, new Date());
                const hasEvents = (eventsByKey.get(toKey(d))?.length ?? 0) > 0;
                return (
                  <button key={toKey(d)} onClick={() => setSelected(d)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "4px 0", background: "none", border: "none", cursor: "pointer" }}>
                    <span style={{ fontSize: 9, color: "#64748b" }}>{dShort[d.getDay()]}</span>
                    <span style={{ display: "grid", placeItems: "center", height: 32, width: 32, borderRadius: "50%", fontSize: 13, transition: "all 0.2s",
                      background: isSel ? `linear-gradient(135deg, ${A.a500}, ${A.b600})` : "transparent",
                      fontWeight: isSel || isToday ? 700 : 400, color: isSel ? "#fff" : isToday ? A.a400 : "#cbd5e1",
                      boxShadow: isSel ? `0 8px 16px ${A.a600}66` : "none" }}>{d.getDate()}</span>
                    <span style={{ height: 4, width: 4, borderRadius: "50%", background: hasEvents && !isSel ? `${A.a400}b3` : "transparent" }} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {view === "month" ? (
        <MonthTaskView grid={monthGrid} month={gridMonth} setMonth={setGridMonth} selected={selected} onSelect={d => setSelected(d)}
          eventsByKey={eventsByKey} onPickEvent={e => setStatusSheet(e)} onAdd={key => setAddSheet({ dateKey: key, start: 9 * 60 })} A={A} />
      ) : (
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto" }}>
          {view === "week" && (
            <div style={{ position: "sticky", top: 0, zIndex: 10, display: "flex", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(12,14,22,0.95)", backdropFilter: "blur(8px)" }}>
              <div style={{ width: 36, flexShrink: 0 }} />
              {visibleDays.map(d => {
                const isToday = isSameDay(d, new Date());
                const isSel = isSameDay(d, selected);
                return (
                  <button key={toKey(d)} onClick={() => setSelected(d)} style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", padding: "6px 0", background: "none", border: "none", cursor: "pointer" }}>
                    <span style={{ fontSize: 8, color: "#64748b" }}>{dShort[d.getDay()]}</span>
                    <span style={{ marginTop: 2, display: "grid", placeItems: "center", height: 24, width: 24, borderRadius: "50%", fontSize: 11, fontWeight: 700,
                      background: isToday ? A.a500 : "transparent", color: isToday ? "#fff" : isSel ? A.a400 : "#cbd5e1",
                      boxShadow: isSel && !isToday ? `0 0 0 1px ${A.a500}66 inset` : "none" }}>{d.getDate()}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ position: "relative", display: "flex", height: 24 * HOUR + 20 }}>
            <div style={{ position: "relative", flexShrink: 0, width: view === "week" ? 36 : 48 }}>
              {Array.from({ length: 23 }, (_, i) => i + 1).map(h => (
                <span key={h} style={{ position: "absolute", [lang === "ar" ? "left" : "right"]: 4, fontSize: 9, color: "#64748b", top: h * HOUR - 6 }}>{hourLabel(h, lang)}</span>
              ))}
            </div>
            {visibleDays.map((d, di) => {
              const key = toKey(d);
              const baseEvents = (eventsByKey.get(key) ?? []).filter(e => !(preview && preview.id === e.id));
              const dayEvents = layoutDay(baseEvents);
              const dragged = preview && preview.dayIdx === di ? events.find(e => e.id === preview.id) : null;
              const isTodayCol = isSameDay(d, new Date());
              return (
                <div key={key}
                  onClick={(ev) => {
                    if (activeId) { setActiveId(null); return; }
                    const rect = ev.currentTarget.getBoundingClientRect();
                    const y = ev.clientY - rect.top;
                    const hourSlot = Math.min(Math.max(Math.floor(y / HOUR), 0), 23);
                    setAddSheet({ dateKey: key, start: hourSlot * 60 });
                  }}
                  style={{ position: "relative", flex: 1 }}>
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} style={{
                      position: "absolute", insetInline: "4px",
                      top: i * HOUR + 3, height: HOUR - 6,
                      borderRadius: 10,
                      background: i % 2 === 0 ? DS.surface2 : "rgba(24,27,39,0.5)",
                      border: `1px solid ${i % 2 === 0 ? DS.border : "rgba(255,255,255,0.025)"}`,
                      transition: "background 0.15s",
                    }} />
                  ))}
                  {dayEvents.map(({ event: e, col, total }) => (
                    <EventBlock key={e.id} event={e} mtl={mtl} top={(e.start / 60) * HOUR} height={Math.max(((e.end - e.start) / 60) * HOUR - 2, 22)}
                      rightPct={col * (100 / total)} widthPct={100 / total} compact={view === "week"} isActive={activeId === e.id}
                      onPointerDown={ev => onEventPointerDown(ev, e, di)} onPointerMove={onEventPointerMove}
                      onPointerUp={() => onEventPointerUp(e)} onPointerCancel={onEventPointerCancel}
                      onResizeDown={ev => onResizePointerDown(ev, e, di)} onResizeMove={onEventPointerMove} onResizeUp={() => onEventPointerUp(e)} />
                  ))}
                  {dragged && preview && (
                    <div style={{ pointerEvents: "none", position: "absolute", zIndex: 30, overflow: "hidden", borderRadius: 8, padding: "4px 8px", opacity: 0.95,
                      boxShadow: "0 20px 40px rgba(0,0,0,0.4)", outline: "2px solid rgba(255,255,255,0.8)",
                      top: (preview.start / 60) * HOUR, height: Math.max(((preview.end - preview.start) / 60) * HOUR - 2, 22), insetInline: 2, background: STATUS_COLOR[dragged.status] }}>
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11, fontWeight: 700, lineHeight: 1.3, color: "#fff" }}>{dragged.title}</span>
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 9, color: "rgba(255,255,255,0.85)" }}>{mtl(preview.start)} – {mtl(preview.end)}</span>
                    </div>
                  )}
                  {isTodayCol && (
                    <div style={{ pointerEvents: "none", position: "absolute", insetInline: 0, zIndex: 5, display: "flex", alignItems: "center", top: (nowMins / 60) * HOUR }}>
                      <span style={{ marginInlineStart: -4, height: 10, width: 10, borderRadius: "50%", background: "rgba(203,213,225,0.7)" }} />
                      <span style={{ height: 2, flex: 1, background: "rgba(203,213,225,0.7)" }} />
                    </div>
                  )}
                  {view === "day" && dayEvents.length === 0 && !dragged && (
                    <div style={{ pointerEvents: "none", position: "absolute", insetInline: 0, top: "40%", textAlign: "center" }}>
                      <span style={{ fontSize: 12, color: "#475569" }}>{t("لا توجد مهام — اضغط على أي وقت للإضافة", "No tasks — tap any time to add")}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ height: 96 }} />
        </div>
      )}

      {activeId && view !== "month" && (
        <div style={{ pointerEvents: "none", position: "absolute", insetInline: 0, bottom: 96, zIndex: 20, display: "flex", justifyContent: "center" }}>
          <span style={{ borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(22,25,39,0.95)", padding: "8px 16px", fontSize: 11, color: "#cbd5e1", boxShadow: "0 16px 40px rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", animation: "floatIn 0.3s both" }}>
            {t("اسحب المهمة للتحريك · اسحب الدائرة السفلية للتمديد", "Drag to move · drag the bottom circle to resize")}
          </span>
        </div>
      )}

      {addSheet && <TaskAddSheet dateKey={addSheet.dateKey} defaultStart={addSheet.start} onClose={() => setAddSheet(null)} onSave={saveEvent} A={A} />}
      {statusSheet && (
        <TaskStatusSheet event={events.find(e => e.id === statusSheet.id) ?? statusSheet} onClose={() => setStatusSheet(null)}
          onStatus={s => setStatusFn(statusSheet.id, s)}
          onEdit={() => { const fresh = events.find(e => e.id === statusSheet.id) ?? statusSheet; setStatusSheet(null); setEditSheet(fresh); }} A={A} />
      )}
      {editSheet && <TaskEditSheet event={editSheet} onClose={() => setEditSheet(null)} onSave={updateEventFn} onDelete={() => deleteEventFn(editSheet.id)} A={A} />}
    </div>
  );
}

function EventBlock({ event: e, mtl, top, height, rightPct, widthPct, compact, isActive, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onResizeDown, onResizeMove, onResizeUp }) {
  const color = STATUS_COLOR[e.status];
  return (
    <div onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}
      onContextMenu={ev => ev.preventDefault()} onClick={ev => ev.stopPropagation()}
      style={{ position: "absolute", userSelect: "none", overflow: "visible", borderRadius: 10, textAlign: "start", transition: "box-shadow 0.2s, transform 0.15s",
        zIndex: isActive ? 30 : 5, top, height, insetInlineEnd: `calc(${rightPct}% + 2px)`, width: `calc(${widthPct}% - 4px)`,
        background: e.status === "done" ? `${color}cc` : color,
        boxShadow: isActive ? "0 0 0 2px #fff, 0 20px 40px rgba(0,0,0,0.5)" : `0 2px 8px ${color}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
        touchAction: "none" }}>
      <div style={{ overflow: "hidden", padding: "5px 7px", height: "100%" }}>
        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 700, lineHeight: 1.3, color: "#fff",
          fontSize: compact ? 9 : 11, textDecoration: e.status === "done" ? "line-through" : "none", opacity: e.status === "done" ? 0.8 : 1 }}>{e.title}</span>
        {height > 34 && !compact && <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 9, color: "rgba(255,255,255,0.85)", fontWeight: 500 }}>{mtl(e.start)} – {mtl(e.end)}</span>}
      </div>
      {isActive && (
        <div onPointerDown={onResizeDown} onPointerMove={onResizeMove} onPointerUp={onResizeUp}
          style={{ position: "absolute", bottom: -12, left: "50%", zIndex: 40, display: "grid", placeItems: "center", height: 28, width: 28, transform: "translateX(-50%)", touchAction: "none" }}>
          <span style={{ height: 14, width: 14, borderRadius: "50%", border: `2px solid ${color}`, background: "#fff", boxShadow: "0 4px 10px rgba(0,0,0,0.3)" }} />
        </div>
      )}
    </div>
  );
}

function MonthTaskView({ grid, month, setMonth, selected, onSelect, eventsByKey, onPickEvent, onAdd, A }) {
  const { lang, t } = useI18n();
  const mNames = getMonths(lang);
  const dShort = getDaysShort(lang);
  const mtl = m => minutesToLabel(m, lang);
  const selKey = toKey(selected);
  const selEvents = [...(eventsByKey.get(selKey) ?? [])].sort((a, b) => a.start - b.start);

  return (
    <div style={{ flex: 1, overflowY: "auto", paddingBottom: 128 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 0" }}>
        <button onClick={() => setMonth(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))} style={{ display: "grid", placeItems: "center", height: 32, width: 32, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#cbd5e1", cursor: "pointer" }}><ChevronLeftIcon size={16} flip={lang === "en"} /></button>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{mNames[month.m]} {month.y}</span>
        <button onClick={() => setMonth(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))} style={{ display: "grid", placeItems: "center", height: 32, width: 32, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#cbd5e1", cursor: "pointer" }}><ChevronLeftIcon size={16} flip={lang === "ar"} /></button>
      </div>
      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "0 4px 4px" }}>
        {dShort.map((_, i) => { const idx = (i + 6) % 7; return <span key={i} style={{ textAlign: "center", fontSize: 10, color: "#64748b" }}>{dShort[idx]}</span>; })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", padding: "0 4px" }}>
        {grid.flat().map((d, i) => {
          const key = toKey(d);
          const inMonth = d.getMonth() === month.m;
          const isSel = isSameDay(d, selected);
          const isToday = isSameDay(d, new Date());
          const list = [...(eventsByKey.get(key) ?? [])].sort((a, b) => a.start - b.start);
          return (
            <button key={i} onClick={() => onSelect(d)} style={{
              display: "flex", minHeight: 68, flexDirection: "column", alignItems: "stretch", gap: 2, borderBottom: "1px solid rgba(255,255,255,0.04)",
              padding: 2, textAlign: "start", background: isSel ? `${A.a500}1a` : "transparent", borderRadius: isSel ? 8 : 0,
              boxShadow: isSel ? `0 0 0 1px ${A.a500}66 inset` : "none", border: "none", cursor: "pointer" }}>
              <span style={{ margin: "0 auto", display: "grid", placeItems: "center", height: 20, width: 20, borderRadius: "50%", fontSize: 10,
                background: isToday ? A.a500 : "transparent", fontWeight: isToday ? 700 : 400, color: isToday ? "#fff" : inMonth ? "#cbd5e1" : "#475569" }}>{d.getDate()}</span>
              {list.slice(0, 2).map(e => (
                <span key={e.id} style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderRadius: 4, padding: "1px 4px", fontSize: 7.5, fontWeight: 600, lineHeight: 1.3, color: "#fff", background: STATUS_COLOR[e.status] }}>{e.title}</span>
              ))}
              {list.length > 2 && <span style={{ textAlign: "center", fontSize: 8, color: "#64748b" }}>+{list.length - 2}</span>}
            </button>
          );
        })}
      </div>
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8, padding: "0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>{formatFullDate(selected, lang)}</h3>
          <button onClick={() => onAdd(selKey)} style={{ display: "flex", alignItems: "center", gap: 4, borderRadius: 20, border: `1px solid ${A.a500}4d`, background: `${A.a500}1a`, padding: "4px 12px", fontSize: 11, fontWeight: 600, color: A.a300, cursor: "pointer" }}><PlusIcon size={14} />{t("إضافة", "Add")}</button>
        </div>
        {selEvents.length === 0 ? (
          <p style={{ padding: "24px 0", textAlign: "center", fontSize: 12, color: "#475569" }}>{t("لا توجد مهام في هذا اليوم", "No tasks on this day")}</p>
        ) : selEvents.map(e => (
          <button key={e.id} onClick={() => onPickEvent(e)} style={{ display: "flex", width: "100%", alignItems: "center", gap: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.04)", padding: 12, textAlign: "start", cursor: "pointer" }}>
            <span style={{ height: 36, width: 6, flexShrink: 0, borderRadius: 20, background: STATUS_COLOR[e.status] }} />
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, fontWeight: 600, color: "#fff", textDecoration: e.status === "done" ? "line-through" : "none", opacity: e.status === "done" ? 0.6 : 1 }}>{e.title}</span>
              <span style={{ fontSize: 10, color: "#64748b" }}>{mtl(e.start)} – {mtl(e.end)}</span>
            </span>
            <span style={{ flexShrink: 0, borderRadius: 20, padding: "2px 8px", fontSize: 9, fontWeight: 700, background: `${STATUS_COLOR[e.status]}55`, color: STATUS_COLOR[e.status] }}>{statusLabel(e.status, t)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TaskAddSheet({ dateKey, defaultStart, onClose, onSave, A }) {
  const { lang, t } = useI18n();
  const [title, setTitle] = useState("");
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(Math.min(defaultStart + 60, 23 * 60 + 30));
  const [y, m, d] = dateKey.split("-").map(Number);
  const dateLabel = formatFullDate(new Date(y, m - 1, d), lang);
  const timeOptions = Array.from({ length: 48 }, (_, i) => i * 30);
  const _endOptions = timeOptions.filter(t => t > start);
  const accentBlue = "#0ea5e9";

  return (
    <Sheet onClose={onClose}>
      <h3 style={{ fontSize: 20, fontWeight: 800, color: DS.text1, margin: 0, letterSpacing: -0.4 }}>{t("مهمة جديدة", "New task")}</h3>
      <p style={{ marginTop: 4, fontSize: 12, color: DS.text3, fontWeight: 500 }}>📅 {dateLabel}</p>
      <div style={{ marginTop: 18 }}>
        <p style={{ marginBottom: 8, fontSize: 11, color: DS.text3, fontWeight: 600 }}>{t("عنوان المهمة", "Task title")}</p>
        <SheetInput autoFocus value={title} onChange={e => setTitle(e.target.value)}
          placeholder={t("ماذا تريد أن تنجز؟", "What do you want to get done?")} accentColor={accentBlue} />
      </div>
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <p style={{ marginBottom: 8, fontSize: 11, color: DS.text3, fontWeight: 600 }}>{t("وقت البدء", "Start time")}</p>
          <SheetSelect value={start} onChange={e => {
            const v = Number(e.target.value);
            setStart(v);
            if (end <= v) setEnd(Math.min(v + 60, 23 * 60 + 30));
          }}>
            {timeOptions.map(x => <option key={x} value={x}>{minutesToLabel(x, lang)}</option>)}
          </SheetSelect>
        </div>
        <div>
          <p style={{ marginBottom: 8, fontSize: 11, color: DS.text3, fontWeight: 600 }}>{t("وقت الانتهاء", "End time")}</p>
          <SheetSelect value={end} onChange={e => setEnd(Number(e.target.value))}>
            {timeOptions.filter(x => x > start).map(x => <option key={x} value={x}>{minutesToLabel(x, lang)}</option>)}
          </SheetSelect>
        </div>
      </div>
      <PrimaryBtn label={t("حفظ المهمة", "Save task")} disabled={!title.trim() || end <= start}
        accentColor={accentBlue} accentColor2="#2563eb"
        onClick={() => onSave(title, start, end - start)} />
    </Sheet>
  );
}

function TaskEditSheet({ event, onClose, onSave, onDelete, A }) {
  const { lang, t } = useI18n();
  const [title, setTitle] = useState(event.title);
  const [start, setStart] = useState(event.start - (event.start % 30));
  const [end, setEnd] = useState(event.end - (event.end % 30) || event.start + 60);
  const [y, m, d] = event.dateKey.split("-").map(Number);
  const dateLabel = formatFullDate(new Date(y, m - 1, d), lang);
  const timeOptions = Array.from({ length: 48 }, (_, i) => i * 30);
  const accentBlue = "#0ea5e9";

  return (
    <Sheet onClose={onClose}>
      <h3 style={{ fontSize: 20, fontWeight: 800, color: DS.text1, margin: 0, letterSpacing: -0.4 }}>{t("تعديل المهمة", "Edit task")}</h3>
      <p style={{ marginTop: 4, fontSize: 12, color: DS.text3, fontWeight: 500 }}>📅 {dateLabel}</p>
      <div style={{ marginTop: 18 }}>
        <p style={{ marginBottom: 8, fontSize: 11, color: DS.text3, fontWeight: 600 }}>{t("عنوان المهمة", "Task title")}</p>
        <SheetInput autoFocus value={title} onChange={e => setTitle(e.target.value)} accentColor={accentBlue} />
      </div>
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <p style={{ marginBottom: 8, fontSize: 11, color: DS.text3, fontWeight: 600 }}>{t("وقت البدء", "Start time")}</p>
          <SheetSelect value={start} onChange={e => {
            const v = Number(e.target.value);
            setStart(v);
            if (end <= v) setEnd(Math.min(v + 60, 23 * 60 + 30));
          }}>
            {timeOptions.map(x => <option key={x} value={x}>{minutesToLabel(x, lang)}</option>)}
          </SheetSelect>
        </div>
        <div>
          <p style={{ marginBottom: 8, fontSize: 11, color: DS.text3, fontWeight: 600 }}>{t("وقت الانتهاء", "End time")}</p>
          <SheetSelect value={end} onChange={e => setEnd(Number(e.target.value))}>
            {timeOptions.filter(x => x > start).map(x => <option key={x} value={x}>{minutesToLabel(x, lang)}</option>)}
          </SheetSelect>
        </div>
      </div>
      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
        <button onClick={() => onSave(event.id, title, start, end - start)} disabled={!title.trim() || end <= start}
          style={{ borderRadius: 16, border: "none", padding: "14px 0", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer",
            background: "linear-gradient(135deg,#0ea5e9,#2563eb)", boxShadow: "0 8px 20px rgba(14,165,233,0.3)",
            opacity: !title.trim() || end <= start ? 0.4 : 1 }}>{t("حفظ التعديلات", "Save changes")}</button>
        <button onClick={onDelete} style={{ borderRadius: 16, border: "1px solid rgba(244,63,94,0.2)",
          background: "rgba(244,63,94,0.1)", padding: "14px 0", fontSize: 14, fontWeight: 700,
          color: "#fb7185", cursor: "pointer" }}>{t("حذف", "Delete")}</button>
      </div>
    </Sheet>
  );
}

function TaskStatusSheet({ event, onClose, onStatus, onEdit, A }) {
  const { lang, t } = useI18n();
  const mtl = m => minutesToLabel(m, lang);
  const [y, m, d] = event.dateKey.split("-").map(Number);
  const dateLabel = formatFullDate(new Date(y, m - 1, d), lang);
  const options = [{ s: "done", label: t("منجزة", "Done"), emoji: "✓" }, { s: "postponed", label: t("مؤجلة", "Postponed"), emoji: "⏳" }, { s: "missed", label: t("فائتة", "Missed"), emoji: "✕" }];
  return (
    <Sheet onClose={onClose}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ marginTop: 6, height: 18, width: 18, flexShrink: 0, borderRadius: 6, background: STATUS_COLOR[event.status], boxShadow: `0 2px 8px ${STATUS_COLOR[event.status]}60` }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 18, fontWeight: 800, color: DS.text1, margin: 0, letterSpacing: -0.3 }}>{event.title}</h3>
          <p style={{ marginTop: 4, fontSize: 12, color: DS.text3, fontWeight: 500 }}>{dateLabel} · {mtl(event.start)} – {mtl(event.end)}</p>
        </div>
        <button onClick={onEdit} style={{ display: "flex", flexShrink: 0, alignItems: "center", gap: 4, borderRadius: 20, border: `1px solid ${DS.border}`, background: DS.surface2, padding: "7px 12px", fontSize: 11, fontWeight: 600, color: DS.text2, cursor: "pointer", boxShadow: DS.shadowSm }}><EditIcon size={14} />{t("تعديل", "Edit")}</button>
      </div>
      <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {options.map(o => {
          const isCurrent = event.status === o.s;
          const c = STATUS_COLOR[o.s];
          return (
            <button key={o.s} onClick={() => onStatus(o.s)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8, borderRadius: 16, border: `1.5px solid ${isCurrent ? c : `${c}40`}`, padding: "16px 0", cursor: "pointer", transition: "all 0.2s",
              background: `${c}1a`, color: c, boxShadow: isCurrent ? `0 0 0 3px ${c}40, 0 8px 20px ${c}30` : "none" }}>
              <span style={{ display: "grid", placeItems: "center", height: 40, width: 40, borderRadius: "50%", fontSize: 17, fontWeight: 700, color: "#fff", background: c, boxShadow: `0 4px 12px ${c}50` }}>{o.emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{o.label}</span>
            </button>
          );
        })}
      </div>
      {event.status !== "pending" && <p style={{ marginTop: 14, textAlign: "center", fontSize: 10, color: DS.text4, fontWeight: 500 }}>{t(`اضغط على الحالة الحالية (${statusLabel(event.status, t)}) لإلغائها وإرجاع اللون الأزرق`, `Tap the current status (${statusLabel(event.status, t)}) to reset it back to blue`)}</p>}
    </Sheet>
  );
}
/* ════════════════════════════════════════════════════════
   HABITS SCREEN — counter-based, due-day aware, 10-week grid
════════════════════════════════════════════════════════ */
const _HABIT_COLORS = [
  { id: "violet", value: "#8b5cf6" }, { id: "sky", value: "#0ea5e9" }, { id: "emerald", value: "#10b981" },
  { id: "rose", value: "#f43f5e" }, { id: "amber", value: "#f59e0b" }, { id: "pink", value: "#ec4899" },
];
const _HABIT_ICONS = ["💧", "📖", "🧘", "🏃", "🍎", "😴", "✍️", "🚭", "💊", "🎯", "🧹", "☀️"];
const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]; // 0=Sun

function makeHabitsSeed(t) {
  const today = new Date();
  function genLog(rate, max) {
    const log = {};
    for (let i = 0; i < 70; i++) { const d = addDays(today, -i); if (Math.random() < rate) log[toKey(d)] = Math.ceil(Math.random() * max); }
    return log;
  }
  return [
    { id: "h1", title: t("شرب الماء", "Drink water"), icon: "💧", color: "#0ea5e9", goal: 8, days: ALL_WEEKDAYS, log: genLog(0.75, 8) },
    { id: "h2", title: t("قراءة ٢٠ صفحة", "Read 20 pages"), icon: "📖", color: "#10b981", goal: 1, days: ALL_WEEKDAYS, log: genLog(0.6, 1) },
    { id: "h3", title: t("تأمل ١٠ دقائق", "Meditate 10 min"), icon: "🧘", color: "#8b5cf6", goal: 1, days: ALL_WEEKDAYS, log: genLog(0.9, 1) },
    { id: "h4", title: t("رياضة", "Exercise"), icon: "🏃", color: "#f43f5e", goal: 1, days: [0, 2, 4], log: genLog(0.5, 1) },
  ];
}

function isDue(h, d) { return h.days.includes(d.getDay()); }
function countOn(h, d) { return h.log[toKey(d)] ?? 0; }
function isDoneOn(h, d) { return countOn(h, d) >= h.goal; }

function calcStreak(h, today) {
  let streak = 0, d = today;
  while (true) {
    if (isDue(h, d)) { if (isDoneOn(h, d)) streak++; else break; }
    d = addDays(d, -1);
    if (streak > 0 && d < addDays(today, -370)) break;
    if (d < addDays(today, -370)) break;
  }
  return streak;
}


function HabitRing({ pct, isSelected, isToday, isFuture, date, accentColor, accentColor2 }) {
  const R = 18, C = 2 * Math.PI * R;
  const dash = (pct / 100) * C;
  const full = pct >= 100;
  return (
    <svg width={44} height={44} viewBox="0 0 44 44" style={{ display: "block" }}>
      {/* track */}
      <circle cx={22} cy={22} r={R} fill={isSelected ? "rgba(14,165,233,0.18)" : "rgba(255,255,255,0.04)"}
        stroke={isFuture ? "#2a2d3a" : "rgba(255,255,255,0.08)"} strokeWidth={2.5} />
      {/* progress arc */}
      {pct > 0 && (
        <circle cx={22} cy={22} r={R} fill="none"
          stroke={full ? "#0ea5e9" : isSelected ? "#0ea5e9" : accentColor}
          strokeWidth={2.5} strokeDasharray={`${dash} ${C}`}
          strokeLinecap="round" strokeDashoffset={C * 0.25}
          style={{ transition: "stroke-dasharray 0.4s" }} />
      )}
      {/* selected glow ring */}
      {isSelected && (
        <circle cx={22} cy={22} r={20} fill="none" stroke="#0ea5e9" strokeWidth={1.5} opacity={0.5} />
      )}
      {/* date number */}
      <text x={22} y={27} textAnchor="middle" fontSize={13} fontWeight={700}
        fill={isSelected ? "#0ea5e9" : isToday ? "#fff" : isFuture ? "#3d4060" : "#94a3b8"}>
        {date}
      </text>
    </svg>
  );
}

function HabitsScreen({ habits, setHabits }) {
  const { lang, t, A } = useI18n();
  const [addOpen,     setAddOpen]     = useState(false);
  const [editHabit,   setEditHabit]   = useState(null);
  const [statsOpen,   setStatsOpen]   = useState(false);
  const [statsPeriod, setStatsPeriod] = useState(null);
  const [menuOpen,    setMenuOpen]    = useState(false);

  const today    = new Date();
  const todayKey = toKey(today);

  /* selected day — default to today */
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const selectedDate = (() => { const [y,m,d] = selectedKey.split("-").map(Number); return new Date(y,m-1,d); })();

  function bumpFor(h, dayKey, delta) {
    setHabits(prev => prev.map(x => {
      if (x.id !== h.id) return x;
      const cur  = x.log[dayKey] ?? 0;
      const next = Math.max(0, Math.min(x.goal ?? 1, cur + delta));
      return { ...x, log: { ...x.log, [dayKey]: next } };
    }));
  }

  function addHabit(form) {
    setHabits(prev => [...prev, { id: `h${Date.now()}`, title: form.title, icon: form.icon, color: form.color, goal: form.goal, days: form.days, log: {} }]);
  }
  function updateHabit(id, patch) { setHabits(prev => prev.map(h => h.id === id ? { ...h, ...patch } : h)); }
  function deleteHabit(id)        { setHabits(prev => prev.filter(h => h.id !== id)); }

  const weekStart = startOfWeek(today);
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const dShort    = getDaysShort(lang);

  /* day completion % for a given date */
  function dayPct(d) {
    const dk  = toKey(d);
    const due = habits.filter(h => !h.days || h.days.includes(d.getDay()));
    if (!due.length) return 0;
    const done = due.filter(h => (h.log[dk] ?? 0) >= (h.goal ?? 1)).length;
    return Math.round((done / due.length) * 100);
  }

  const isFutureDay = (d) => toKey(d) > todayKey;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 14px" }}>
        <button onClick={() => setAddOpen(true)} style={{
          display: "grid", placeItems: "center", height: 46, width: 46, borderRadius: 15, border: "none", cursor: "pointer",
          background: `linear-gradient(135deg, ${A.a500}, ${A.b600})`, color: "#fff", boxShadow: `0 6px 18px ${A.a600}50` }}>
          <PlusIcon size={20} />
        </button>

        <h1 style={{ fontSize: 20, fontWeight: 800, color: DS.text1, margin: 0, letterSpacing: -0.4 }}>{t("العادات", "Habits")}</h1>

        {/* Stats menu */}
        <div style={{ position: "relative" }}>
          <button onClick={() => setMenuOpen(o => !o)} style={{
            display: "grid", placeItems: "center", height: 46, width: 46, borderRadius: 15,
            border: menuOpen ? `1px solid ${A.a500}66` : `1px solid ${DS.border}`,
            background: menuOpen ? `${A.a500}26` : DS.surface2, color: menuOpen ? A.a300 : DS.text2, cursor: "pointer", boxShadow: DS.shadowSm }}>
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }} />
              <div style={{ position: "absolute", [lang === "ar" ? "left" : "right"]: 0, top: 52, zIndex: 40, minWidth: 220,
                borderRadius: 18, border: `1px solid ${DS.borderStrong}`, background: DS.surface1,
                boxShadow: DS.shadowLg, animation: "scaleIn 0.18s both", overflow: "hidden" }}>
                {[
                  { id: "today", icon: "📊", label: t("إحصائيات اليوم", "Today's stats") },
                  { id: "week",  icon: "📅", label: t("إحصائيات آخر أسبوع", "Last week stats") },
                  { id: "month", icon: "🗓️", label: t("إحصائيات آخر شهر", "Last month stats") },
                ].map((item, i) => (
                  <button key={item.id} onClick={() => { setStatsPeriod(item.id); setStatsOpen(true); setMenuOpen(false); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: 10, padding: "14px 18px", background: "none", border: "none",
                      borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      color: "#e2e8f0", cursor: "pointer", fontFamily: "inherit", textAlign: lang === "ar" ? "right" : "left" }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</span>
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── WEEK STRIP — clickable rings with progress ── */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 16px 16px", gap: 4 }}>
        {weekDates.map(d => {
          const dk         = toKey(d);
          const isSelected = dk === selectedKey;
          const isToday    = dk === todayKey;
          const isFuture   = isFutureDay(d);
          const pct        = isFuture ? 0 : dayPct(d);
          return (
            <button key={dk} onClick={() => setSelectedKey(dk)}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                background: "none", border: "none", cursor: "pointer", padding: 0 }}>
              <span style={{ fontSize: 9, fontWeight: isSelected ? 700 : 400,
                color: isSelected ? "#0ea5e9" : isToday ? A.a400 : "#64748b" }}>
                {dShort[d.getDay()]}
              </span>
              <HabitRing pct={pct} isSelected={isSelected} isToday={isToday} isFuture={isFuture}
                date={d.getDate()} accentColor={A.a500} accentColor2={A.b600} />
            </button>
          );
        })}
      </div>

      {/* ── HABIT CARDS ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 128px" }}>
        {habits.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.25 }}>🔥</div>
            <p style={{ color: DS.text3, fontSize: 15, fontWeight: 600 }}>{t("لا توجد عادات بعد", "No habits yet")}</p>
            <p style={{ color: DS.text4, fontSize: 12, marginTop: 6, fontWeight: 500 }}>{t("اضغط + لإضافة عادتك الأولى", "Tap + to add your first habit")}</p>
          </div>
        ) : habits.filter(h => !h.days || h.days.includes(selectedDate.getDay())).length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.25 }}>📅</div>
            <p style={{ color: DS.text3, fontSize: 15, fontWeight: 600 }}>{t("لا توجد عادات لهذا اليوم", "No habits for this day")}</p>
          </div>
        ) : habits.filter(h => !h.days || h.days.includes(selectedDate.getDay())).map(h => {
          const goal    = h.goal ?? 1;
          const count   = h.log?.[selectedKey] ?? 0;
          const done    = count >= goal;
          const isDue   = true;
          const isFuture = isFutureDay(selectedDate);
          const streak  = calcStreak(h, today);
          const pct     = Math.min(100, Math.round((count / goal) * 100));
          const canEdit = !isFuture && isDue;

          /* tap check: for goal=1 toggle; for goal>1 increment (reset when done) */
          function handleCheck() {
            if (!canEdit) return;
            if (goal === 1) {
              bumpFor(h, selectedKey, done ? -1 : 1);
            } else {
              bumpFor(h, selectedKey, done ? -goal : 1);
            }
          }

          return (
            <div key={h.id} style={{
              borderRadius: 20, border: `1px solid ${done ? "rgba(14,165,233,0.3)" : DS.border}`,
              background: done ? "rgba(14,165,233,0.07)" : DS.surface2,
              padding: "14px 16px", marginBottom: 10,
              transition: "all 0.2s",
              boxShadow: done ? "0 0 0 1px rgba(14,165,233,0.15)" : DS.shadowSm,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, direction: "ltr" }}>

                {/* LEFT: check button — always left */}
                <button onClick={handleCheck} disabled={!canEdit}
                  style={{
                    flexShrink: 0, display: "grid", placeItems: "center",
                    height: 40, width: 40, borderRadius: "50%", border: "none",
                    background: done ? "#0ea5e9" : "rgba(255,255,255,0.06)",
                    color: done ? "#fff" : "#475569",
                    cursor: canEdit ? "pointer" : "not-allowed",
                    boxShadow: done ? "0 4px 14px rgba(14,165,233,0.45)" : "none",
                    transition: "all 0.22s",
                  }}>
                  <CheckIcon size={16} />
                </button>

                {/* MIDDLE: title + info */}
                <div style={{ flex: 1, minWidth: 0, direction: "rtl" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-start", marginBottom: 3 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: DS.text1, letterSpacing: -0.2 }}>{h.title}</span>
                    {streak > 0 && (
                      <span style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 11, color: "#fbbf24", fontWeight: 700 }}>
                        {streak} <FlameIcon size={11} />
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 11, margin: 0, fontWeight: 500, textAlign: "right",
                    color: done ? "#0ea5e9" : DS.text4 }}>
                    {done
                      ? `${t("اكتملت", "Completed")} ✓`
                      : isFuture
                        ? t("يوم قادم", "Future day")
                        : !isDue
                          ? t("غير مستحقة", "Not due")
                          : goal > 1
                            ? `${count}/${goal} ${t("مرات", "times")}`
                            : t("لم تكتمل بعد", "Not done yet")}
                  </p>
                  {/* progress bar for counter habits */}
                  {goal > 1 && isDue && !isFuture && (
                    <div style={{ marginTop: 8, height: 5, borderRadius: 6, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, borderRadius: 6,
                        background: done ? "#0ea5e9" : `linear-gradient(90deg, ${A.a600}, ${A.a400})`,
                        transition: "width 0.3s", boxShadow: done ? "0 0 8px rgba(14,165,233,0.5)" : `0 0 8px ${A.a500}50` }} />
                    </div>
                  )}
                </div>

                {/* RIGHT: icon (blue when done) */}
                <button onClick={() => setEditHabit(h)}
                  style={{
                    flexShrink: 0, display: "grid", placeItems: "center",
                    height: 40, width: 40, borderRadius: 12,
                    border: done ? "1.5px solid rgba(14,165,233,0.4)" : `1px solid ${DS.border}`,
                    background: done ? "rgba(14,165,233,0.18)" : DS.surface3,
                    fontSize: 20, cursor: "pointer", transition: "all 0.22s",
                  }}>
                  {h.icon}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {addOpen   && <HabitFormSheet onClose={() => setAddOpen(false)} onSave={f => { addHabit(f); setAddOpen(false); }} A={A} />}
      {editHabit && <HabitFormSheet habit={editHabit} onClose={() => setEditHabit(null)} onSave={p => { updateHabit(editHabit.id, p); setEditHabit(null); }} onDelete={() => { deleteHabit(editHabit.id); setEditHabit(null); }} A={A} />}
      {statsOpen && <HabitStatsSheet habits={habits} period={statsPeriod} onClose={() => setStatsOpen(false)} A={A} />}
    </div>
  );
}

/* ── Habit emoji & color pickers ── */
const HABIT_ICONS_NEW = ["🏃","🤸","🤩","🥗","💪","🧘","🧘","📖","💧","☕","🙏","🧠"];
const HABIT_COLORS_NEW = [
  { id: "violet",  value: "#8b5cf6" }, { id: "sky",    value: "#0ea5e9" },
  { id: "emerald", value: "#10b981" }, { id: "rose",   value: "#f43f5e" },
  { id: "amber",   value: "#f59e0b" }, { id: "pink",   value: "#ec4899" },
];

function HabitFormSheet({ habit, onClose, onSave, onDelete, A }) {
  const { lang, t } = useI18n();
  const [title, setTitle] = useState(habit?.title || "");
  const [icon,  setIcon]  = useState(habit?.icon  || HABIT_ICONS_NEW[0]);
  const [color, _setColor] = useState(habit?.color || HABIT_COLORS_NEW[0].value);
  const [goal,  setGoal]  = useState(habit?.goal  || 1);
  const [days,  setDays]  = useState(habit?.days  || ALL_WEEKDAYS);

  const dayLabels = lang === "ar"
    ? ["سبت", "أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة"]
    : ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
  const dayOrder = [6, 0, 1, 2, 3, 4, 5]; // Sat=6,Sun=0,...Fri=5

  const toggleDay = d => setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());

  return (
    <Sheet onClose={onClose} maxH="92%">
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 16 }}>
        {habit ? t("تعديل العادة", "Edit habit") : t("عادة جديدة", "New habit")}
      </h3>

      {/* Title */}
      <div style={{ marginBottom: 18 }}>
        <SheetInput autoFocus value={title} onChange={e => setTitle(e.target.value)}
          placeholder={t("مثال: المشي ٣٠ دقيقة...", "e.g. Walk 30 minutes...")} accentColor={A.a500} />
      </div>

      {/* Icon picker */}
      <div style={{ marginBottom: 18 }}>
        <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, textAlign: lang === "ar" ? "right" : "left" }}>{t("الرمز", "Icon")}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {HABIT_ICONS_NEW.map(e => (
            <button key={e} onClick={() => setIcon(e)} style={{
              height: 44, width: 44, borderRadius: 12, fontSize: 20, border: "none", cursor: "pointer",
              background: icon === e ? A.a500 : "rgba(255,255,255,0.06)",
              boxShadow: icon === e ? `0 4px 12px ${A.a500}50` : "none", transition: "all 0.15s" }}>{e}</button>
          ))}
        </div>
      </div>

      {/* Daily goal counter */}
      <div style={{ marginBottom: 18 }}>
        <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, textAlign: lang === "ar" ? "right" : "left" }}>{t("المرات يومياً", "Daily times")}</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", padding: "8px 16px" }}>
          <button onClick={() => setGoal(g => Math.max(1, g - 1))} style={{
            height: 34, width: 34, borderRadius: 10, border: "none",
            background: "rgba(255,255,255,0.08)", color: "#fff", fontSize: 20, cursor: "pointer", fontWeight: 300 }}>−</button>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#fff" }}>{goal}</span>
          <button onClick={() => setGoal(g => Math.min(20, g + 1))} style={{
            height: 34, width: 34, borderRadius: 10, border: "none",
            background: A.a500, color: "#fff", fontSize: 20, cursor: "pointer", fontWeight: 700,
            boxShadow: `0 4px 10px ${A.a500}50` }}>+</button>
        </div>
      </div>

      {/* Days of repetition */}
      <div style={{ marginBottom: 4 }}>
        <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, textAlign: lang === "ar" ? "right" : "left" }}>{t("أيام التكرار", "Repeat on")}</p>
        <div style={{ display: "flex", gap: 6, justifyContent: "space-between" }}>
          {dayOrder.map((dayIdx, i) => {
            const selected = days.includes(dayIdx);
            return (
              <button key={dayIdx} onClick={() => toggleDay(dayIdx)} style={{
                flex: 1, borderRadius: 12, border: "none", padding: "10px 0", fontSize: 10, fontWeight: 700, cursor: "pointer",
                background: selected ? `linear-gradient(135deg, ${A.a500}, ${A.b600})` : "rgba(255,255,255,0.06)",
                color: selected ? "#fff" : "#94a3b8", transition: "all 0.2s",
                boxShadow: selected ? `0 4px 10px ${A.a500}40` : "none" }}>{dayLabels[i]}</button>
            );
          })}
        </div>
      </div>

      <PrimaryBtn
        label={habit ? t("حفظ", "Save") : t("إنشاء العادة", "Create habit")}
        disabled={!title.trim() || days.length === 0} accentColor={A.a500} accentColor2={A.b600}
        onClick={() => { if (!title.trim() || !days.length) return; onSave({ title: title.trim(), icon, color, goal, days }); }} />

      {habit && onDelete && (
        <button onClick={onDelete} style={{ width: "100%", marginTop: 10, borderRadius: 14,
          border: "1px solid rgba(244,63,94,0.2)", background: "rgba(244,63,94,0.08)",
          padding: "12px 0", color: "#fb7185", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
          {t("حذف العادة", "Delete habit")}
        </button>
      )}
    </Sheet>
  );
}

/* ── Habit Stats Sheet — today / last week (Sat–Fri) / last month ── */
function HabitStatsSheet({ habits, period, onClose, A }) {
  const { lang, t } = useI18n();
  const today = new Date();

  /* Date range */
  let rangeLabel = "", rangeFrom = today, rangeTo = today;
  if (period === "today") {
    rangeLabel = t("اليوم", "Today");
    rangeFrom = rangeTo = today;
  } else if (period === "week") {
    rangeFrom = startOfWeek(today); // Saturday
    rangeTo   = addDays(rangeFrom, 6); // Friday
    rangeLabel = t("من السبت حق اليوم", "Sat to today");
  } else if (period === "month") {
    rangeFrom = new Date(today.getFullYear(), today.getMonth(), 1);
    rangeTo   = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    rangeLabel = t(`${getMonths(lang)[today.getMonth()]} ${today.getFullYear()}`, `${getMonths(lang)[today.getMonth()]} ${today.getFullYear()}`);
  }

  /* Compute per-habit stats */
  const stats = habits.map(h => {
    let due = 0, done = 0;
    let d = new Date(rangeFrom);
    while (d <= Math.min(rangeTo, today)) {
      if (!h.days || h.days.includes(d.getDay())) {
        due++;
        if ((h.log[toKey(d)] ?? 0) >= h.goal) done++;
      }
      d = addDays(d, 1);
    }
    const pct = due > 0 ? Math.round((done / due) * 100) : 0;
    return { ...h, due, done, pct };
  });

  const avgPct = stats.length
    ? Math.round(stats.reduce((s, h) => s + h.pct, 0) / stats.length)
    : 0;

  return (
    <Sheet onClose={onClose} maxH="80%">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>
            {period === "today" ? t("إحصائيات اليوم", "Today's stats") :
             period === "week"  ? t("إحصائيات آخر أسبوع", "Last week stats") :
                                  t("إحصائيات آخر شهر", "Last month stats")}
          </h3>
          <p style={{ fontSize: 11, color: "#64748b", margin: "3px 0 0" }}>{rangeLabel}</p>
        </div>
        <div style={{ textAlign: lang === "ar" ? "left" : "right" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: A.a400 }}>{avgPct}%</div>
          <div style={{ fontSize: 10, color: "#64748b" }}>{t("المعدل العام", "Overall avg")}</div>
        </div>
      </div>

      {stats.length === 0 ? (
        <p style={{ textAlign: "center", color: "#64748b", padding: "20px 0" }}>{t("لا توجد عادات", "No habits")}</p>
      ) : stats.map(h => (
        <div key={h.id} style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>{h.icon}</span>
              <span style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>{h.title}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: h.pct >= 80 ? "#34d399" : h.pct >= 50 ? A.a400 : "#fb7185" }}>
              {h.pct}%
            </span>
          </div>
          <div style={{ height: 7, borderRadius: 8, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 8, width: `${h.pct}%`,
              background: h.pct >= 80 ? "linear-gradient(90deg,#059669,#34d399)" :
                          h.pct >= 50 ? `linear-gradient(90deg,${A.b600},${A.a400})` :
                                        "linear-gradient(90deg,#be123c,#fb7185)",
              transition: "width 0.5s ease" }} />
          </div>
        </div>
      ))}
    </Sheet>
  );
}


const GOAL_EMOJIS = ["🎯","🏋️","💰","📚","🗣️","✈️","🏠","🚗","💼","🎓","🧘","🎨"];

function makeGoalsSeed(t) {
  const today = new Date();
  return [
    { id:"g1", title:t("إنقاص الوزن ٨ كيلو","Lose 8 kg"), emoji:"🏋️", color:"#fb7185",
      deadline:toKey(addDays(today,63)),
      milestones:[
        {id:"m1",title:t("إنقاص أول كيلوغرامين","Lose first 2 kg"),done:true},
        {id:"m2",title:t("الالتزام بنظام غذائي صحي لمدة شهر","Stick to healthy diet for a month"),done:false},
        {id:"m3",title:t("ممارسة الرياضة 3 مرات أسبوعياً","Exercise 3x per week"),done:false},
        {id:"m4",title:t("الوصول للوزن المستهدف","Reach target weight"),done:false},
      ]},
    { id:"g2", title:t("ادخار ٣٠ ألف ريال","Save 30,000 SAR"), emoji:"💰", color:"#fbbf24",
      deadline:"2026-10-12",
      milestones:[
        {id:"m1",title:t("ادخار أول 10 آلاف","Save first 10k"),done:true},
        {id:"m2",title:t("ادخار 20 ألف","Save 20k"),done:true},
        {id:"m3",title:t("ادخار 25 ألف","Save 25k"),done:false},
        {id:"m4",title:t("الوصول للهدف الكامل","Reach full goal"),done:false},
      ]},
    { id:"g3", title:t("قراءة 12 كتاباً هذه السنة","Read 12 books this year"), emoji:"📚", color:"#34d399",
      deadline:"2026-12-31",
      milestones:[
        {id:"m1",title:t("الكتاب الأول إلى الثالث","Books 1–3"),done:true},
        {id:"m2",title:t("الكتاب الرابع إلى السادس","Books 4–6"),done:true},
        {id:"m3",title:t("الكتاب السابع إلى التاسع","Books 7–9"),done:true},
        {id:"m4",title:t("الكتاب العاشر","Book 10"),done:true},
        {id:"m5",title:t("الكتاب الحادي عشر","Book 11"),done:false},
        {id:"m6",title:t("الكتاب الثاني عشر","Book 12"),done:false},
      ]},
  ];
}

function goalProgress(g) { return g.milestones.length ? Math.round((g.milestones.filter(m => m.done).length / g.milestones.length) * 100) : 0; }
function goalDone(g) { return goalProgress(g) >= 100; }

function GoalsScreen({ goals, setGoals }) {
  const { lang, t, A } = useI18n();
  const [filter, setFilter] = useState("active");
  const [addOpen, setAddOpen] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [expanded, setExpanded] = useState({});

  const filtered = useMemo(() => {
    let list = goals;
    if (filter === "active") list = goals.filter(g => !goalDone(g));
    if (filter === "done")   list = goals.filter(g => goalDone(g));
    return [...list].sort((a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999"));
  }, [goals, filter]);

  const activeCount  = goals.filter(g => !goalDone(g)).length;
  const doneCount    = goals.filter(g => goalDone(g)).length;
  const overallPct   = goals.length ? Math.round(goals.reduce((s, g) => s + goalProgress(g), 0) / goals.length) : 0;

  function addGoal(form)         { setGoals(prev => [...prev, { id: `g${Date.now()}`, title: form.title, emoji: form.emoji, color: form.color, deadline: form.deadline, milestones: form.milestones.map((m, i) => ({ id: `m${i}`, title: m, done: false })) }]); }
  function updateGoal(id, patch) { setGoals(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g)); }
  function deleteGoal(id)        { setGoals(prev => prev.filter(g => g.id !== id)); }
  function toggleMilestone(g, mid) { updateGoal(g.id, { milestones: g.milestones.map(m => m.id === mid ? { ...m, done: !m.done } : m) }); }

  function deadlineLabel(g) {
    if (!g.deadline) return "";
    const [y, m, d] = g.deadline.split("-").map(Number);
    const dl = new Date(y, m - 1, d);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((dl - today) / 86400000);
    if (goalDone(g)) return formatFullDate(dl, lang);
    if (diffDays < 0)    return t("انتهى الموعد", "Overdue");
    if (diffDays === 0)  return t("اليوم", "Today");
    if (diffDays <= 7)   return t(`باقٍ ${diffDays} أيام`, `${diffDays} days left`);
    if (diffDays <= 31)  return t(`باقٍ ${diffDays} يوم`, `${diffDays} days left`);
    return formatFullDate(dl, lang);
  }

  return (
    <div style={{ padding: "0 0 128px" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 20px 4px" }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: "#0ea5e9", letterSpacing: -0.4 }}>{overallPct}%</span>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: DS.text1, margin: 0, letterSpacing: -0.4 }}>{t("الأهداف", "Goals")}</h1>
        <button onClick={() => setAddOpen(true)} style={{ display: "grid", placeItems: "center", height: 46, width: 46, borderRadius: 15, border: "none", cursor: "pointer", background: `linear-gradient(135deg, ${A.a500}, ${A.b600})`, color: "#fff", boxShadow: `0 6px 18px ${A.a600}50` }}>
          <PlusIcon size={20} />
        </button>
      </div>

      {/* ── FILTER TABS ── */}
      <div style={{ display: "flex", gap: 8, padding: "14px 20px", overflowX: "auto" }}>
        {[
          { id: "active", label: t("قيد التنفيذ", "In progress"), count: activeCount },
          { id: "done",   label: t("مكتملة", "Done"),             count: doneCount   },
          { id: "all",    label: t("الكل", "All"),                count: goals.length },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
            borderRadius: 20, border: "none", padding: "8px 16px", fontSize: 12, fontWeight: 600,
            cursor: "pointer", transition: "all 0.2s",
            background: filter === f.id ? `linear-gradient(135deg, ${A.a500}, ${A.b600})` : DS.surface2,
            color: filter === f.id ? "#fff" : DS.text3,
            boxShadow: filter === f.id ? `0 4px 12px ${A.a600}40` : DS.shadowSm,
          }}>
            {f.label}
            <span style={{ fontSize: 10, opacity: 0.8, background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "1px 6px" }}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* ── GOALS LIST ── */}
      <div style={{ padding: "0 20px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", borderRadius: 22, border: `1.5px dashed ${DS.borderStrong}`, background: "rgba(255,255,255,0.015)" }}>
            <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.3 }}>🎯</div>
            <p style={{ color: DS.text3, fontSize: 15, fontWeight: 600, margin: 0 }}>{t("لا توجد أهداف", "No goals")}</p>
            <p style={{ color: DS.text4, fontSize: 12, marginTop: 6, fontWeight: 500 }}>{t("اضغط + لإضافة هدف جديد", "Tap + to add a new goal")}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map(g => {
              const isOpen    = !!expanded[g.id];
              const pct       = goalProgress(g);
              const done      = goalDone(g);
              const doneSteps = g.milestones.filter(m => m.done).length;
              const dl        = deadlineLabel(g);
              const isOverdue = dl === t("انتهى الموعد", "Overdue");
              const dlColor   = isOverdue ? "#fb7185" : done ? "#34d399" : DS.text4;

              return (
                <div key={g.id} style={{ borderRadius: 20, border: `1px solid ${DS.border}`, background: DS.surface2, overflow: "hidden", boxShadow: DS.shadowSm }}>

                  {/* ── TOP ROW: emoji right, title middle, chevron left ── */}
                  <button onClick={() => setExpanded(e => ({ ...e, [g.id]: !e[g.id] }))}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "16px 16px 0", background: "none", border: "none", cursor: "pointer", direction: "rtl" }}>

                    {/* rightmost: emoji icon box */}
                    <div style={{ flexShrink: 0, display: "grid", placeItems: "center", height: 46, width: 46, borderRadius: 14, background: `${g.color}22`, border: `1.5px solid ${g.color}44`, fontSize: 22 }}>
                      {g.emoji}
                    </div>

                    {/* middle: title + meta */}
                    <div style={{ flex: 1, minWidth: 0, textAlign: "right" }}>
                      <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: DS.text1, letterSpacing: -0.2, textDecoration: done ? "line-through" : "none", opacity: done ? 0.55 : 1 }}>{g.title}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, justifyContent: "flex-start" }}>
                        <span style={{ fontSize: 11, color: DS.text4, fontWeight: 500 }}>{doneSteps}/{g.milestones.length} {t("مراحل", "steps")}</span>
                        {dl && <span style={{ fontSize: 11, color: dlColor, fontWeight: 500 }}>· {dl}</span>}
                      </span>
                    </div>

                    {/* leftmost: chevron */}
                    <span style={{ color: DS.text4, flexShrink: 0 }}><ChevronDownIcon size={14} rotate={isOpen} /></span>
                  </button>

                  {/* ── PROGRESS BAR ── */}
                  <div style={{ padding: "12px 16px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, height: 7, borderRadius: 6, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, borderRadius: 6, background: "linear-gradient(90deg, #0284c7, #0ea5e9)", transition: "width 0.5s", boxShadow: "0 0 8px rgba(14,165,233,0.5)" }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#0ea5e9", flexShrink: 0, minWidth: 36, textAlign: "left" }}>{pct}%</span>
                  </div>

                  {/* ── MILESTONES (always visible when expanded) ── */}
                  {isOpen && (
                    <div style={{ borderTop: `1px solid ${DS.border}`, padding: "10px 16px 0" }}>
                      {g.milestones.map((m, idx) => (
                        <button key={m.id} onClick={() => toggleMilestone(g, m.id)}
                          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", padding: "10px 0", borderBottom: idx < g.milestones.length - 1 ? `1px solid ${DS.border}` : "none" }}>
                          {/* title + label — right side (RTL) */}
                          <div style={{ flex: 1, textAlign: "right" }}>
                            <span style={{ fontSize: 13, color: m.done ? DS.text4 : DS.text2, fontWeight: 500, textDecoration: m.done ? "line-through" : "none" }}>{m.title}</span>
                            <span style={{ display: "block", fontSize: 10, color: DS.text5, marginTop: 2 }}>{t(`المرحلة ${idx + 1}`, `Step ${idx + 1}`)}</span>
                          </div>
                          {/* circle check — left side */}
                          <div style={{ flexShrink: 0, display: "grid", placeItems: "center", height: 28, width: 28, borderRadius: "50%", border: `2px solid ${m.done ? "#0ea5e9" : DS.text5}`, background: m.done ? "#0ea5e9" : "transparent", transition: "all 0.2s", boxShadow: m.done ? "0 0 10px rgba(14,165,233,0.5)" : "none" }}>
                            {m.done && <CheckIcon size={13} />}
                          </div>
                        </button>
                      ))}

                      {/* ── ACTION ROW: edit + delete ── */}
                      <div style={{ display: "flex", gap: 10, padding: "12px 0 14px" }}>
                        <button onClick={() => setEditGoal(g)}
                          style={{ display: "grid", placeItems: "center", height: 42, width: 42, borderRadius: 12, border: `1px solid ${DS.border}`, background: DS.surface3, color: DS.text3, cursor: "pointer", flexShrink: 0 }}>
                          <EditIcon size={15} />
                        </button>
                        <button onClick={() => deleteGoal(g.id)}
                          style={{ flex: 1, height: 42, borderRadius: 12, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.08)", color: "#fb7185", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                          {t("حذف الهدف", "Delete goal")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {addOpen  && <GoalFormSheet onClose={() => setAddOpen(false)}  onSave={f => { addGoal(f); setAddOpen(false); }} A={A} />}
      {editGoal && <GoalFormSheet goal={editGoal} onClose={() => setEditGoal(null)} onSave={p => { updateGoal(editGoal.id, p); setEditGoal(null); }} A={A} />}
    </div>
  );
}

function DeadlinePicker({ value, onChange, accentColor, lang }) {
  const today = new Date();
  const initDate = value ? (() => { const [y,m,d] = value.split("-").map(Number); return new Date(y,m-1,d); })() : null;
  const [viewY, setViewY] = useState(initDate ? initDate.getFullYear() : today.getFullYear());
  const [viewM, setViewM] = useState(initDate ? initDate.getMonth() : today.getMonth());

  const months = getMonths(lang);
  const dShort = getDaysShort(lang); // Sat-first: [س، أ، إ، ث، أر، خ، ج] / [Sa, Su, Mo, Tu, We, Th, Fr]

  const grid = getMonthGrid(viewY, viewM); // 6×7, Saturday-first
  const selKey = value || null;
  const todayKey = toKey(today);

  function prevM() { if (viewM === 0) { setViewY(y => y-1); setViewM(11); } else setViewM(m => m-1); }
  function nextM() { if (viewM === 11) { setViewY(y => y+1); setViewM(0); } else setViewM(m => m+1); }

  const displayLabel = value
    ? formatFullDate((() => { const [y,m,d] = value.split("-").map(Number); return new Date(y,m-1,d); })(), lang)
    : lang === "ar" ? "اختر تاريخاً" : "Pick a date";

  return (
    <div>
      <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>
        {lang === "ar" ? "الموعد النهائي" : "Deadline"}
      </p>
      {/* Selected date badge */}
      <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: value ? accentColor : "#64748b" }}>📅 {displayLabel}</span>
        {value && (
          <button onClick={() => onChange("")} style={{ fontSize: 10, color: "#fb7185", background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)", borderRadius: 8, padding: "2px 8px", cursor: "pointer", fontWeight: 600 }}>
            {lang === "ar" ? "مسح" : "Clear"}
          </button>
        )}
      </div>
      {/* Calendar */}
      <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", background: DS.surface3, padding: "12px 10px" }}>
        {/* Month nav */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <button onClick={prevM} style={{ display: "grid", placeItems: "center", height: 28, width: 28, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "none", color: "#cbd5e1", cursor: "pointer", fontSize: 16, fontWeight: 700 }}>‹</button>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{months[viewM]} {viewY}</span>
          <button onClick={nextM} style={{ display: "grid", placeItems: "center", height: 28, width: 28, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "none", color: "#cbd5e1", cursor: "pointer", fontSize: 16, fontWeight: 700 }}>›</button>
        </div>
        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
          {dShort.map((l, i) => (
            <span key={i} style={{ textAlign: "center", fontSize: 9, color: "#64748b", fontWeight: 600, padding: "2px 0" }}>{l}</span>
          ))}
        </div>
        {/* Date grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
          {grid.flat().map((d, i) => {
            const dk = toKey(d);
            const inMonth = d.getMonth() === viewM;
            const isSel = dk === selKey;
            const isToday = dk === todayKey;
            const isPast = d < today && !isToday;
            return (
              <button key={i} onClick={() => !isPast && onChange(dk)} disabled={isPast}
                style={{
                  display: "grid", placeItems: "center", height: 32, borderRadius: 8, border: "none",
                  cursor: isPast ? "not-allowed" : "pointer", fontSize: 12, fontWeight: isSel || isToday ? 700 : 400,
                  transition: "all 0.15s",
                  background: isSel ? accentColor : "transparent",
                  color: isSel ? "#fff" : isToday ? accentColor : isPast ? "#2a3050" : inMonth ? "#e2e8f0" : "#3d4060",
                  boxShadow: isSel ? `0 2px 8px ${accentColor}60` : isToday && !isSel ? `0 0 0 1.5px ${accentColor} inset` : "none",
                  opacity: isPast ? 0.35 : 1,
                }}>
                {d.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GoalFormSheet({ goal, onClose, onSave, A }) {
  const { lang, t } = useI18n();
  const [title, setTitle] = useState(goal?.title || "");
  const [emoji, setEmoji] = useState(goal?.emoji || GOAL_EMOJIS[0]);
  const [color, _setColor] = useState(goal?.color || "#8b5cf6");
  const [deadline, setDeadline] = useState(goal?.deadline || "");
  const [milestoneTitles, setMilestoneTitles] = useState(goal?.milestones?.map(m => m.title) || ["", "", "", ""]);
  const setM = (i, v) => setMilestoneTitles(prev => prev.map((x, idx) => idx === i ? v : x));
  const addM = () => setMilestoneTitles(prev => [...prev, ""]);
  const removeM = (i) => setMilestoneTitles(prev => prev.filter((_, idx) => idx !== i));
  const validMilestones = milestoneTitles.filter(m => m.trim());

  return (
    <Sheet onClose={onClose} maxH="92%">
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 16 }}>{goal ? t("تعديل الهدف", "Edit goal") : t("هدف جديد", "New goal")}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <SheetInput autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder={t("عنوان الهدف...", "Goal title...")} accentColor={A.a500} />
        <div><p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>{t("الرمز", "Emoji")}</p><div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{GOAL_EMOJIS.map(e => (<button key={e} onClick={() => setEmoji(e)} style={{ height: 36, width: 36, borderRadius: 10, fontSize: 18, border: emoji === e ? `2px solid ${A.a500}` : "1px solid rgba(255,255,255,0.1)", background: emoji === e ? `${A.a500}1f` : "rgba(255,255,255,0.04)", cursor: "pointer" }}>{e}</button>))}</div></div>
        <DeadlinePicker value={deadline} onChange={setDeadline} accentColor={A.a500} lang={lang} />
        <div>
          <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>{t("المراحل (الخطوات)", "Milestones (steps)")}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {milestoneTitles.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 6 }}>
                <SheetInput value={m} onChange={e => setM(i, e.target.value)} placeholder={t(`مرحلة ${i + 1}`, `Step ${i + 1}`)} accentColor={A.a500} />
                {milestoneTitles.length > 1 && <button onClick={() => removeM(i)} style={{ flexShrink: 0, width: 38, borderRadius: 10, border: "1px solid rgba(244,63,94,0.2)", background: "rgba(244,63,94,0.08)", color: "#fb7185", cursor: "pointer" }}>✕</button>}
              </div>
            ))}
            <button onClick={addM} style={{ borderRadius: 10, border: `1px dashed ${A.a500}50`, background: "transparent", color: A.a300, padding: "8px 0", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ {t("إضافة مرحلة", "Add step")}</button>
          </div>
        </div>
      </div>
      <PrimaryBtn label={goal ? t("حفظ", "Save") : t("إضافة الهدف", "Add goal")} disabled={!title.trim() || validMilestones.length === 0} accentColor={A.a500} accentColor2={A.b600}
        onClick={() => { if (!title.trim() || !validMilestones.length) return; onSave({ title: title.trim(), emoji, color, deadline, milestones: validMilestones }); }} />
    </Sheet>
  );
}

/* ════════════════════════════════════════════════════════
   MORE SCREEN — profile, level, chart, achievements, settings list
════════════════════════════════════════════════════════ */
const ACHIEVEMENTS = [
  { id: "a1", emoji: "⚡", titleAr: "بداية قوية", titleEn: "Strong start", descAr: "أكمل أول 5 مهام", descEn: "Complete your first 5 tasks", unlocked: true },
  { id: "a2", emoji: "🔥", titleAr: "أسبوع كامل", titleEn: "Full week", descAr: "سلسلة عادات لمدة 7 أيام", descEn: "7-day habit streak", unlocked: true },
  { id: "a3", emoji: "🏆", titleAr: "بطل الإنجاز", titleEn: "Achiever", descAr: "أنجز 100 مهمة", descEn: "Complete 100 tasks", unlocked: true },
  { id: "a4", emoji: "🎯", titleAr: "هدّاف", titleEn: "Goal scorer", descAr: "أكمل أول هدف", descEn: "Complete your first goal", unlocked: true },
  { id: "a5", emoji: "🔥", titleAr: "سلسلة ٣٠ يوم", titleEn: "30-day streak", descAr: "حافظ على عادة لمدة 30 يوم", descEn: "Maintain a habit for 30 days", unlocked: false },
  { id: "a6", emoji: "👑", titleAr: "أسطورة", titleEn: "Legend", descAr: "أنجز 500 مهمة", descEn: "Complete 500 tasks", unlocked: false },
  { id: "a7", emoji: "💎", titleAr: "مثالي", titleEn: "Perfectionist", descAr: "أكمل أسبوعاً بنسبة 100%", descEn: "Finish a week at 100%", unlocked: false },
  { id: "a8", emoji: "🌟", titleAr: "نجم صاعد", titleEn: "Rising star", descAr: "افتح 5 إنجازات", descEn: "Unlock 5 achievements", unlocked: false },
];

function SettingsRow({ icon, title, subtitle, right, onClick }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp onClick={onClick} style={{ display: "flex", width: "100%", alignItems: "center", gap: 12, borderRadius: 16, border: `1px solid ${DS.border}`, background: DS.surface2, padding: 14, cursor: onClick ? "pointer" : "default", textAlign: "start", boxShadow: DS.shadowSm, transition: "all 0.15s" }}>
      <span style={{ fontSize: 18, flexShrink: 0, width: 32, height: 32, display: "grid", placeItems: "center", borderRadius: 10, background: DS.surface3 }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: DS.text1 }}>{title}</span>
        {subtitle && <span style={{ display: "block", fontSize: 10, color: DS.text4, marginTop: 2, fontWeight: 500 }}>{subtitle}</span>}
      </span>
      {right}
    </Comp>
  );
}
function ToggleSwitch({ on, onClick, accentColor }) {
  return (
    <button onClick={onClick} style={{ position: "relative", height: 26, width: 46, flexShrink: 0, borderRadius: 20, border: "none", cursor: "pointer", background: on ? accentColor : "rgba(255,255,255,0.12)", transition: "background 0.25s", boxShadow: on ? `0 2px 8px ${accentColor}60` : "none" }}>
      <span style={{ position: "absolute", top: 3, insetInlineStart: on ? "auto" : 3, insetInlineEnd: on ? 3 : "auto", height: 20, width: 20, borderRadius: "50%", background: "#fff", transition: "all 0.25s cubic-bezier(.3,.7,.3,1)", boxShadow: "0 2px 6px rgba(0,0,0,0.25)" }} />
    </button>
  );
}

function MoreScreen({ events, habits, goals, txs }) {
  const { lang, setLang, t, A, accent, setAccent } = useI18n();
  const [notifOn, setNotifOn] = useLS("road_set_notif", true);
  const [soundOn, setSoundOn] = useLS("road_set_sound", true);
  const [vibrateOn, setVibrateOn] = useLS("road_set_vibrate", true);

  // Real stats from shared state
  const tasksDone = (events || []).filter(e => e.status === "done").length;
  const activeHabits = (habits || []).length;
  const bestStreak = (habits || []).reduce((max, h) => Math.max(max, calcStreak(h, new Date())), 0);
  const goalsDone = (goals || []).filter(g => goalDone(g)).length;

  return (
    <div style={{ padding: "20px 20px 128px" }}>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
        {[{ value: String(goalsDone), label: t("هدف محقق", "Goal done"), color: A.a400 }, { value: String(activeHabits), label: t("عادات نشطة", "Habits"), color: "#34d399" }, { value: String(bestStreak), label: t("أطول سلسلة", "Best streak"), color: "#fbbf24", flame: true }, { value: String(tasksDone), label: t("مهمة منجزة", "Tasks done"), color: "#38bdf8" }].map(s => (
          <div key={s.label} style={{ borderRadius: 14, border: `1px solid ${DS.border}`, background: DS.surface2, padding: "12px 6px", textAlign: "center", boxShadow: DS.shadowSm }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, fontSize: 17, fontWeight: 800, color: s.color, letterSpacing: -0.3 }}>{s.flame && <FlameIcon size={12} />}{s.value}</div>
            <div style={{ fontSize: 9, color: DS.text3, marginTop: 3, fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Weekly productivity chart */}
      <div style={{ borderRadius: 18, border: `1px solid ${DS.border}`, background: DS.surface2, padding: 16, marginBottom: 16, boxShadow: DS.shadowSm }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: DS.text1, margin: 0, letterSpacing: -0.2 }}>{t("إنتاجية هذا الأسبوع", "This week's productivity")}</h3>
          <span style={{ fontSize: 11, color: DS.text3, fontWeight: 600 }}>{t("المعدل", "Avg")} 76%</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 90 }}>
          {[70, 45, 100, 90, 60, 100, 80].map((v, i) => {
            const labels = getDaysShort(lang);
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 9, color: v >= 80 ? A.a400 : DS.text4, fontWeight: v >= 80 ? 700 : 500 }}>{v}%</span>
                <div style={{ width: "100%", height: 60, display: "flex", alignItems: "flex-end" }}>
                  <div style={{ width: "100%", height: `${v}%`, borderRadius: 6, background: v >= 80 ? `linear-gradient(180deg, ${A.a400}, ${A.a600})` : v === 0 ? "rgba(255,255,255,0.06)" : `${A.a500}55`, transition: "height 0.4s", boxShadow: v >= 80 ? `0 0 8px ${A.a500}50` : "none" }} />
                </div>
                <span style={{ fontSize: 9, color: DS.text4, fontWeight: 500 }}>{labels[i]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notifications section */}
      <SectionTitle>{t("الإشعارات والتفاعل", "Notifications & feedback")}</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <SettingsRow icon="🔔" title={t("الإشعارات", "Notifications")} subtitle={t("تذكيرات المهام والعادات", "Task & habit reminders")} right={<ToggleSwitch on={notifOn} onClick={() => setNotifOn(o => !o)} accentColor={A.a500} />} />
        <SettingsRow icon="🔊" title={t("الأصوات", "Sounds")} subtitle={t("صوت عند إكمال مهمة", "Sound on task completion")} right={<ToggleSwitch on={soundOn} onClick={() => setSoundOn(o => !o)} accentColor={A.a500} />} />
        <SettingsRow icon="📳" title={t("الاهتزاز", "Vibration")} subtitle={t("اهتزاز خفيف عند التفاعل", "Light haptic feedback")} right={<ToggleSwitch on={vibrateOn} onClick={() => setVibrateOn(o => !o)} accentColor={A.a500} />} />
      </div>

      {/* General settings */}
      <SectionTitle>{t("الإعدادات العامة", "General settings")}</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <div style={{ borderRadius: 16, border: `1px solid ${DS.border}`, background: DS.surface2, padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: DS.shadowSm }}>
          <div><p style={{ fontSize: 13, fontWeight: 600, color: DS.text1, margin: 0 }}>{t("اللغة", "Language")}</p><p style={{ fontSize: 10, color: DS.text4, margin: "2px 0 0", fontWeight: 500 }}>{t("لغة التطبيق بالكامل", "Full app language")}</p></div>
          <div style={{ display: "flex", borderRadius: 20, background: DS.surface3, padding: 3 }}>
            <button onClick={() => setLang("en")} style={{ borderRadius: 16, border: "none", padding: "6px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", background: lang === "en" ? `linear-gradient(135deg, ${A.a500}, ${A.b600})` : "transparent", color: lang === "en" ? "#fff" : DS.text3, boxShadow: lang === "en" ? `0 2px 8px ${A.a600}40` : "none" }}>English</button>
            <button onClick={() => setLang("ar")} style={{ borderRadius: 16, border: "none", padding: "6px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", background: lang === "ar" ? `linear-gradient(135deg, ${A.a500}, ${A.b600})` : "transparent", color: lang === "ar" ? "#fff" : DS.text3, boxShadow: lang === "ar" ? `0 2px 8px ${A.a600}40` : "none" }}>العربية</button>
          </div>
        </div>
        <div style={{ borderRadius: 16, border: `1px solid ${DS.border}`, background: DS.surface2, padding: 14, boxShadow: DS.shadowSm }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div><p style={{ fontSize: 13, fontWeight: 600, color: DS.text1, margin: 0 }}>{t("لون التطبيق (الثيم)", "App color (theme)")}</p><p style={{ fontSize: 10, color: DS.text4, margin: "2px 0 0", fontWeight: 500 }}>{ACCENTS.find(a => a.id === accent)?.[lang === "ar" ? "nameAr" : "nameEn"]}</p></div>
            <span style={{ fontSize: 18 }}>🎨</span>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
            {ACCENTS.map(a => (<button key={a.id} onClick={() => setAccent(a.id)} style={{ height: 38, width: 38, borderRadius: "50%", background: a.color, border: accent === a.id ? "3px solid #fff" : "3px solid transparent", cursor: "pointer", boxShadow: accent === a.id ? `0 0 0 2px ${a.color}, 0 6px 14px ${a.color}aa` : "none", display: "grid", placeItems: "center", transition: "all 0.2s" }}>{accent === a.id && <CheckIcon size={14} />}</button>))}
          </div>
        </div>
      </div>

      <p style={{ textAlign: "center", fontSize: 10, color: DS.text5, marginTop: 8, fontWeight: 500 }}>{t("رود v1.0 — صُنع بحب 💜", "Road v1.0 — made with love 💜")}</p>


    </div>
  );
}

/* Reusable section title for settings groups */
function SectionTitle({ children }) {
  return <h3 style={{ fontSize: 12, fontWeight: 700, color: DS.text3, margin: "0 0 12px", letterSpacing: 0.5, textTransform: "uppercase" }}>{children}</h3>;
}

/* ════════════════════════════════════════════════════════
   BOTTOM NAV
════════════════════════════════════════════════════════ */
const HomeNavIcon = ({ active }) => (<svg viewBox="0 0 24 24" width={20} height={20} fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8}><path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const TasksNavIcon = ({ active }) => (<svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="17" rx="3" /><path d="M3 9h18" />{active && <path d="m8 13 2 2 4-4" />}</svg>);
const HabitsNavIcon = ({ active }) => (<svg viewBox="0 0 24 24" width={20} height={20} fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8}><path d="M12 2c1 4-4 5-4 9a4 4 0 0 0 8 0c0-1-.5-2-1-2.5.5 2 0 4-1.5 4.5 1-3-2-4-2-7 0-1 .3-2.5.5-4z" /></svg>);
const GoalsNavIcon = ({ active }) => (<svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" />{active && <circle cx="12" cy="12" r="1.5" fill="currentColor" />}</svg>);
/* ════════════════════════════════════════════════════════
   FINANCE SCREEN — مصروف
════════════════════════════════════════════════════════ */
const INCOME_CATS = [
  { id: "salary",    labelAr: "راتب",     labelEn: "Salary",     icon: "💼" },
  { id: "freelance", labelAr: "عمل حر",   labelEn: "Freelance",  icon: "💻" },
  { id: "invest",    labelAr: "استثمار",  labelEn: "Investment", icon: "📈" },
  { id: "gift",      labelAr: "هدية",     labelEn: "Gift",       icon: "🎁" },
  { id: "other_in",  labelAr: "أخرى",     labelEn: "Other",      icon: "💰" },
];
const EXPENSE_CATS = [
  { id: "food",      labelAr: "طعام",     labelEn: "Food",       icon: "🍔" },
  { id: "transport", labelAr: "مواصلات",  labelEn: "Transport",  icon: "🚗" },
  { id: "shopping",  labelAr: "تسوق",     labelEn: "Shopping",   icon: "🛍️" },
  { id: "bills",     labelAr: "فواتير",   labelEn: "Bills",      icon: "📄" },
  { id: "health",    labelAr: "صحة",      labelEn: "Health",     icon: "🏥" },
  { id: "entertain", labelAr: "ترفيه",    labelEn: "Fun",        icon: "🎮" },
  { id: "edu",       labelAr: "تعليم",    labelEn: "Education",  icon: "📚" },
  { id: "rent",      labelAr: "إيجار",    labelEn: "Rent",       icon: "🏠" },
  { id: "other_ex",  labelAr: "أخرى",     labelEn: "Other",      icon: "💸" },
];
const ALL_FIN_CATS = [...INCOME_CATS, ...EXPENSE_CATS];
function getFinCat(id) { return ALL_FIN_CATS.find(c => c.id === id) || { labelAr: "أخرى", labelEn: "Other", icon: "💰" }; }

function FinanceScreen({ txs, setTxs }) {
  const { lang, t, A, cur } = useI18n();
  const [addOpen, setAddOpen] = useState(false);
  const [addType, setAddType] = useState("expense");
  const [filterMonth, setFilterMonth] = useState(() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`; });

  const months = getMonths(lang);
  const [fy, fm] = filterMonth.split("-").map(Number);

  const monthTxs = txs.filter(tx => { const d = new Date(tx.date); return d.getFullYear() === fy && d.getMonth()+1 === fm; });
  const totalIn  = monthTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalEx  = monthTxs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance  = totalIn - totalEx;
  const savingRate = totalIn > 0 ? Math.round(((totalIn - totalEx) / totalIn) * 100) : 0;

  // last 6 months bar chart
  const now = new Date();
  const trend = Array.from({ length: 6 }, (_, i) => {
    let m = now.getMonth() - 5 + i, y = now.getFullYear();
    if (m < 0) { m += 12; y--; }
    const list = txs.filter(tx => { const d = new Date(tx.date); return d.getFullYear() === y && d.getMonth() === m; });
    return {
      label: months[m].slice(0, 3),
      income:  list.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expense: list.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  });
  const maxTrend = Math.max(...trend.map(d => Math.max(d.income, d.expense)), 1);

  // expense by category
  const byCat = EXPENSE_CATS.map(cat => ({
    ...cat,
    total: monthTxs.filter(tx => tx.type === "expense" && tx.category === cat.id).reduce((s, t) => s + t.amount, 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  function prevMonth() {
    const [y, m] = filterMonth.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    setFilterMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);
  }
  function nextMonth() {
    const [y, m] = filterMonth.split("-").map(Number);
    if (y === now.getFullYear() && m === now.getMonth()+1) return;
    const d = new Date(y, m, 1);
    setFilterMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);
  }
  const isCurrentMonth = filterMonth === `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;

  const sorted = [...monthTxs].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ padding: "20px 20px 128px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: DS.text1, margin: 0, letterSpacing: -0.4 }}>{t("مصروف", "Finance")}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setAddType("income");  setAddOpen(true); }} style={{ borderRadius: 20, border: "1px solid #10b98160", background: "#10b98120", color: "#6ee7b7", padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", boxShadow: "0 2px 8px rgba(16,185,129,0.15)" }}>+ {t("دخل", "Income")}</button>
          <button onClick={() => { setAddType("expense"); setAddOpen(true); }} style={{ borderRadius: 20, border: "1px solid #ef444460", background: "#ef444420", color: "#fda4af", padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", boxShadow: "0 2px 8px rgba(239,68,68,0.15)" }}>- {t("مصروف", "Expense")}</button>
        </div>
      </div>

      {/* Month nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <button onClick={prevMonth} style={{ display: "grid", placeItems: "center", height: 34, width: 34, borderRadius: 11, border: `1px solid ${DS.border}`, background: DS.surface2, color: DS.text2, cursor: "pointer", boxShadow: DS.shadowSm }}><ChevronLeftIcon size={14} flip={lang === "en"} /></button>
        <span style={{ fontSize: 15, fontWeight: 700, color: DS.text1, letterSpacing: -0.2 }}>{months[fm-1]} {fy}</span>
        <button onClick={nextMonth} disabled={isCurrentMonth} style={{ display: "grid", placeItems: "center", height: 34, width: 34, borderRadius: 11, border: `1px solid ${DS.border}`, background: DS.surface2, color: isCurrentMonth ? DS.text5 : DS.text2, cursor: isCurrentMonth ? "not-allowed" : "pointer", boxShadow: DS.shadowSm }}><ChevronLeftIcon size={14} flip={lang === "ar"} /></button>
      </div>

      {/* Balance hero card */}
      <div style={{ borderRadius: 24, padding: 22, marginBottom: 16,
        background: `linear-gradient(135deg, ${A.a600} 0%, ${A.b600} 60%, ${A.b800} 100%)`,
        boxShadow: `0 20px 40px ${A.b800}50, 0 8px 16px ${A.b800}30, inset 0 1px 0 rgba(255,255,255,0.15)`,
        position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, left: -40, height: 140, width: 140, borderRadius: "50%", background: "rgba(255,255,255,0.1)", filter: "blur(40px)" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 6, fontWeight: 600 }}>{t("الرصيد", "Balance")}</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 6, direction: "ltr", textAlign: lang === "ar" ? "right" : "left", letterSpacing: -0.8 }}>
            {balance >= 0 ? "+" : ""}{fmtMoney(balance, cur)} {curSymbol(cur, lang)}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{t(`معدل التوفير: ${Math.max(savingRate, 0)}%`, `Saving rate: ${Math.max(savingRate, 0)}%`)}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
            <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 14, padding: "12px 14px", backdropFilter: "blur(4px)" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", marginBottom: 3, fontWeight: 600 }}>💰 {t("دخل", "Income")}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", direction: "ltr", letterSpacing: -0.3 }}>{fmtMoney(totalIn, cur)} {curSymbol(cur, lang)}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 14, padding: "12px 14px", backdropFilter: "blur(4px)" }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", marginBottom: 3, fontWeight: 600 }}>💸 {t("مصروف", "Expense")}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", direction: "ltr", letterSpacing: -0.3 }}>{fmtMoney(totalEx, cur)} {curSymbol(cur, lang)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 6-month trend */}
      <div style={{ borderRadius: 18, border: `1px solid ${DS.border}`, background: DS.surface2, padding: 16, marginBottom: 14, boxShadow: DS.shadowSm }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: DS.text1, letterSpacing: -0.2 }}>{t("آخر 6 أشهر", "Last 6 months")}</span>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ fontSize: 9, color: "#34d399", fontWeight: 600 }}>● {t("دخل", "Income")}</span>
            <span style={{ fontSize: 9, color: "#fb7185", fontWeight: 600 }}>● {t("مصروف", "Expense")}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80, direction: "ltr" }}>
          {trend.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: "100%", display: "flex", gap: 2, alignItems: "flex-end", height: 60 }}>
                <div style={{ flex: 1, borderRadius: "3px 3px 0 0", background: "linear-gradient(180deg, #34d399, #10b981)", opacity: i === 5 ? 1 : 0.5, height: `${Math.max((d.income / maxTrend) * 56, d.income > 0 ? 3 : 1)}px` }} />
                <div style={{ flex: 1, borderRadius: "3px 3px 0 0", background: "linear-gradient(180deg, #fb7185, #ef4444)", opacity: i === 5 ? 1 : 0.5, height: `${Math.max((d.expense / maxTrend) * 56, d.expense > 0 ? 3 : 1)}px` }} />
              </div>
              <span style={{ fontSize: 9, color: i === 5 ? DS.text2 : DS.text4, fontWeight: i === 5 ? 700 : 500 }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expense by category */}
      {byCat.length > 0 && (
        <div style={{ borderRadius: 18, border: `1px solid ${DS.border}`, background: DS.surface2, padding: 16, marginBottom: 14, boxShadow: DS.shadowSm }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: DS.text1, display: "block", marginBottom: 14, letterSpacing: -0.2 }}>{t("المصروف حسب الفئة", "Spending by category")}</span>
          {byCat.map(cat => {
            const pct = totalEx > 0 ? Math.round((cat.total / totalEx) * 100) : 0;
            return (
              <div key={cat.id} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{cat.icon}</span>
                    <span style={{ fontSize: 12, color: "#e2e8f0" }}>{lang === "ar" ? cat.labelAr : cat.labelEn}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#fb7185", direction: "ltr" }}>{fmtMoney(cat.total, cur)} {curSymbol(cur, lang)}</span>
                </div>
                <div style={{ height: 5, borderRadius: 8, background: "rgba(255,255,255,0.08)" }}>
                  <div style={{ height: "100%", borderRadius: 8, width: `${pct}%`, background: "linear-gradient(90deg,#fb7185,#f43f5e)", transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transactions list */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{t("المعاملات", "Transactions")}</span>
        <span style={{ fontSize: 11, color: "#64748b" }}>{monthTxs.length} {t("معاملة", "items")}</span>
      </div>

      {sorted.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 20px", borderRadius: 20, border: `1.5px dashed ${DS.borderStrong}`, background: "rgba(255,255,255,0.015)" }}>
          <div style={{ fontSize: 48, marginBottom: 14, opacity: 0.25 }}>💳</div>
          <p style={{ color: DS.text3, fontSize: 14, fontWeight: 600, margin: 0 }}>{t("لا توجد معاملات هذا الشهر", "No transactions this month")}</p>
          <p style={{ color: DS.text4, fontSize: 11, marginTop: 4, fontWeight: 500 }}>{t("ابدأ بتسجيل دخلك ومصروفاتك", "Start tracking your income and expenses")}</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
            <button onClick={() => { setAddType("income"); setAddOpen(true); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 16px", borderRadius: 12, border: "1px solid #10b98140", background: "#10b98115", color: "#34d399", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+ {t("دخل", "Income")}</button>
            <button onClick={() => { setAddType("expense"); setAddOpen(true); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "8px 16px", borderRadius: 12, border: "1px solid #ef444440", background: "#ef444415", color: "#fb7185", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>- {t("مصروف", "Expense")}</button>
          </div>
        </div>
      ) : sorted.map(tx => {
        const cat = getFinCat(tx.category);
        const color = tx.type === "income" ? "#34d399" : "#fb7185";
        return (
          <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 16, border: `1px solid ${DS.border}`, background: DS.surface2, padding: "12px 14px", marginBottom: 8, boxShadow: DS.shadowSm }}>
            <div style={{ display: "grid", placeItems: "center", height: 42, width: 42, borderRadius: 12, flexShrink: 0, background: `${color}18`, fontSize: 20 }}>{cat.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.note || (lang === "ar" ? cat.labelAr : cat.labelEn)}</div>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{lang === "ar" ? cat.labelAr : cat.labelEn} · {tx.date}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color, direction: "ltr" }}>{tx.type === "income" ? "+" : "-"}{fmtMoney(tx.amount, cur)} {curSymbol(cur, lang)}</span>
              <button onClick={() => setTxs(prev => prev.filter(x => x.id !== tx.id))} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 14, padding: 2 }}>✕</button>
            </div>
          </div>
        );
      })}

      {addOpen && (
        <FinanceAddSheet type={addType} onClose={() => setAddOpen(false)}
          onSave={form => { setTxs(prev => [...prev, { id: String(Date.now()), ...form }]); setAddOpen(false); }} A={A} />
      )}
    </div>
  );
}

function FinanceAddSheet({ type, onClose, onSave, A }) {
  const { lang, t, cur } = useI18n();
  const [txType, setTxType] = useState(type);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState(type === "income" ? "salary" : "food");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const cats = txType === "income" ? INCOME_CATS : EXPENSE_CATS;
  const incColor = "#34d399", expColor = "#fb7185";
  const color = txType === "income" ? incColor : expColor;

  return (
    <Sheet onClose={onClose} maxH="92%">
      {/* Type toggle */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
        {[{ v: "income", l: `💰 ${t("دخل", "Income")}` }, { v: "expense", l: `💸 ${t("مصروف", "Expense")}` }].map(({ v, l }) => (
          <button key={v} onClick={() => { setTxType(v); setCategory(v === "income" ? "salary" : "food"); }} style={{
            padding: 12, borderRadius: 14, border: `1.5px solid ${txType === v ? (v === "income" ? incColor : expColor) : "rgba(255,255,255,0.1)"}`,
            background: txType === v ? `${v === "income" ? incColor : expColor}18` : "rgba(255,255,255,0.03)",
            color: txType === v ? (v === "income" ? incColor : expColor) : "#94a3b8",
            fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{l}</button>
        ))}
      </div>

      {/* Amount */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>{t(`المبلغ (${curSymbol(cur, lang)})`, `Amount (${curSymbol(cur, lang)})`)}</p>
        <input autoFocus value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="0"
          style={{ width: "100%", borderRadius: 14, border: `2px solid ${color}40`, background: "rgba(255,255,255,0.04)",
            padding: "14px 16px", fontSize: 24, fontWeight: 900, color, outline: "none", boxSizing: "border-box", direction: "ltr", textAlign: lang === "ar" ? "right" : "left" }} />
      </div>

      {/* Category */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>{t("الفئة", "Category")}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          {cats.map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)} style={{
              padding: "10px 6px", borderRadius: 12, border: `1.5px solid ${category === cat.id ? color : "rgba(255,255,255,0.08)"}`,
              background: category === cat.id ? `${color}15` : "rgba(255,255,255,0.03)",
              cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 20 }}>{cat.icon}</span>
              <span style={{ fontSize: 9, color: category === cat.id ? color : "#94a3b8", fontWeight: 600 }}>{lang === "ar" ? cat.labelAr : cat.labelEn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>{t("ملاحظة (اختياري)", "Note (optional)")}</p>
        <SheetInput value={note} onChange={e => setNote(e.target.value)} placeholder={t("أضف وصفاً...", "Add description...")} accentColor={color} />
      </div>

      {/* Date */}
      <div style={{ marginBottom: 4 }}>
        <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>{t("التاريخ", "Date")}</p>
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "#161927",
            padding: "10px 14px", fontSize: 14, color: "#fff", outline: "none", boxSizing: "border-box" }} />
      </div>

      <PrimaryBtn label={txType === "income" ? t("إضافة دخل ✓", "Add income ✓") : t("إضافة مصروف ✓", "Add expense ✓")}
        disabled={!amount || Number(amount) <= 0} accentColor={color} accentColor2={color}
        onClick={() => { if (!amount || Number(amount) <= 0) return; onSave({ type: txType, amount: Number(amount), category, note: note.trim(), date }); }} />
    </Sheet>
  );
}

const FinanceNavIcon = ({ active }) => (<svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v1m0 8v1M9.5 9.5c.5-1 1.5-1.5 2.5-1.5s2.5.5 2.5 2c0 1.5-1.5 2-2.5 2.5S9 14 9 15.5c0 1 1 2 3 2s2.5-.5 3-1.5" /></svg>);

const MoreNavIcon = () => (<svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>);

function makeTxsSeed(t) {
  const now = new Date();
  const d = (offset) => {
    const dt = new Date(now); dt.setDate(dt.getDate() + offset);
    return dt.toISOString().slice(0, 10);
  };
  return [
    { id: "tx1", type: "income",  amount: 8500,  category: "salary",  note: t("راتب الشهر", "Monthly salary"),     date: d(-20) },
    { id: "tx2", type: "expense", amount: 1200,  category: "food",    note: t("بقالة الأسبوع", "Weekly groceries"),   date: d(-18) },
    { id: "tx3", type: "expense", amount: 350,   category: "fuel",    note: t("بنزين", "Fuel"),                       date: d(-15) },
    { id: "tx4", type: "income",  amount: 500,   category: "other_in",note: t("مشروع جانبي", "Side project"),         date: d(-12) },
    { id: "tx5", type: "expense", amount: 280,   category: "cafe",    note: t("قهوة ووجبات", "Coffee & meals"),       date: d(-10) },
    { id: "tx6", type: "expense", amount: 800,   category: "bills",   note: t("فاتورة الكهرباء", "Electricity bill"), date: d(-8)  },
    { id: "tx7", type: "expense", amount: 150,   category: "transport",note: t("مواصلات", "Transport"),               date: d(-5)  },
    { id: "tx8", type: "income",  amount: 1200,  category: "other_in",note: t("استشارة", "Consulting"),               date: d(-3)  },
    { id: "tx9", type: "expense", amount: 420,   category: "shopping",note: t("ملابس", "Clothes"),                    date: d(-2)  },
    { id: "tx10",type: "expense", amount: 95,    category: "cafe",    note: t("قهوة", "Coffee"),                      date: d(0)   },
  ];
}

function BottomNav({ active, onChange }) {
  const { lang, t, A } = useI18n();
  const itemsAr = [
    { id: "more",    label: t("المزيد",   "More"),    Icon: MoreNavIcon },
    { id: "finance", label: t("مصروف",    "Finance"), Icon: FinanceNavIcon },
    { id: "goals",   label: t("الأهداف",  "Goals"),   Icon: GoalsNavIcon },
    { id: "habits",  label: t("العادات",  "Habits"),  Icon: HabitsNavIcon },
    { id: "tasks",   label: t("المهام",   "Tasks"),   Icon: TasksNavIcon },
    { id: "home",    label: t("الرئيسية", "Home"),    Icon: HomeNavIcon },
  ];
  const items = lang === "en" ? [...itemsAr].reverse() : itemsAr;
  return (
    <div style={{
      position: "absolute", bottom: 0, insetInlineStart: 0, insetInlineEnd: 0, zIndex: 30,
      borderTop: "1px solid " + DS.border,
      background: "rgba(12,14,22,0.85)",
      backdropFilter: "blur(24px) saturate(180%)",
      WebkitBackdropFilter: "blur(24px) saturate(180%)",
      paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 6px)",
      boxShadow: "0 -8px 24px rgba(0,0,0,0.3)",
    }}>
      <div style={{ display: "flex" }}>
        {items.map(it => {
          const isActive = active === it.id;
          return (
            <button key={it.id} onClick={() => onChange(it.id)} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              padding: "10px 0 6px", background: "none", border: "none", cursor: "pointer",
              position: "relative", color: isActive ? A.a400 : DS.text4,
              transition: "color 0.2s",
            }}>
              {isActive && (
                <div style={{
                  position: "absolute", top: 0, insetInlineStart: "30%", insetInlineEnd: "30%",
                  height: 3, borderRadius: 4,
                  background: `linear-gradient(90deg, ${A.a400}, ${A.a600})`,
                  boxShadow: `0 2px 8px ${A.a500}80`,
                  animation: "scaleIn 0.2s both",
                }} />
              )}
              <div style={{ transform: isActive ? "translateY(-1px) scale(1.05)" : "none", transition: "transform 0.2s" }}>
                <it.Icon active={isActive} />
              </div>
              <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 500, letterSpacing: 0.2 }}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   APP ROOT — with phone frame + ambient glow like app.tsx
════════════════════════════════════════════════════════ */
export default function RoadApp() {
  const [lang, setLang]       = useLS("road_lang",    "ar");
  const [accent, setAccent]   = useLS("road_accent",  "violet");
  const [currency, setCurrency] = useLS("road_currency", "DZD");
  const [userName, setUserName] = useLS("road_username", () => (lang === "ar" ? "سلطان العتيبي" : "John Doe"));
  const [tab, setTab]         = useState("home");

  const t = (ar, en) => (lang === "ar" ? ar : en);
  const A = ACCENT_VARS[accent];
  const cur = getCurrency(currency);

  // Shared persistent state — passed down to all screens
  const [events, setEvents] = useLS("road_events",      () => makeTasksSeed(lang));
  const [habits, setHabits] = useLS("road_habits",      () => makeHabitsSeed(t));
  const [goals,  setGoals]  = useLS("road_goals",       () => makeGoalsSeed(t));
  const [txs,    setTxs]    = useLS("road_finance_txs", () => makeTxsSeed(t));

  useEffect(() => { document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"; document.documentElement.lang = lang; }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, accent, setAccent, A, userName, setUserName, currency, setCurrency, cur }}>
      <div style={{ minHeight: "100vh", width: "100%",
        background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${A.a500}1a, transparent 70%), radial-gradient(ellipse 60% 40% at 50% 100%, ${A.b800}20, transparent 70%), #05060a`,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
        <div style={{
          position: "relative", height: "100vh", width: "100%", maxWidth: 480, overflow: "hidden",
          background: DS.surface, color: DS.text1, direction: lang === "ar" ? "rtl" : "ltr",
          fontFamily: lang === "ar" ? "'IBM Plex Sans Arabic', system-ui, sans-serif" : "system-ui, -apple-system, sans-serif",
          boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 30px 80px rgba(0,0,0,0.6)`,
        }}>
          <style>{`
            *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
            ::-webkit-scrollbar{width:0;height:0;}
            input,select,button,textarea{font-family:inherit;}
            button{transition:transform 0.15s ease, opacity 0.15s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;}
            button:active:not(:disabled){transform:scale(0.96);}
            button:disabled{cursor:not-allowed;}
            input:focus,select:focus,textarea:focus{outline:none;}
            @keyframes floatIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
            @keyframes fadeIn{from{opacity:0}to{opacity:1}}
            @keyframes sheetIn{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
            @keyframes scaleIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
            @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
            @media (min-width: 481px) { body { background: #05060a; } }
          `}</style>
          <div style={{ height: "100%", overflowY: "auto" }}>
            {tab === "home"    && <HomeScreen    onNavigate={setTab} events={events} habits={habits} goals={goals} txs={txs} />}
            {tab === "tasks"   && <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}><TasksScreen events={events} setEvents={setEvents} /></div>}
            {tab === "habits"  && <HabitsScreen  habits={habits}  setHabits={setHabits} />}
            {tab === "goals"   && <GoalsScreen   goals={goals}    setGoals={setGoals} />}
            {tab === "finance" && <FinanceScreen txs={txs}        setTxs={setTxs} />}
            {tab === "more"    && <MoreScreen events={events} habits={habits} goals={goals} txs={txs} />}
          </div>
          <BottomNav active={tab} onChange={setTab} />
        </div>
      </div>
    </I18nContext.Provider>
  );
}
