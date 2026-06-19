import { useState, useEffect, useRef, useMemo, createContext, useContext } from "react";

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
const DAYS_SHORT_AR = ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
const DAYS_SHORT_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function getDaysShort(lang) { return lang === "ar" ? DAYS_SHORT_AR : DAYS_SHORT_EN; }
const MONTHS_AR = ["جانفي", "فيفري", "مارس", "أفريل", "ماي", "جوان", "جويلية", "اوت", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
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
   ICONS
════════════════════════════════════════════════════════ */
const BellIcon = (p) => (<svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>);
const FlameIcon = ({ size = 14, ...p }) => (<svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" {...p}><path d="M12 2c1 4-4 5-4 9a4 4 0 0 0 8 0c0-1-.5-2-1-2.5.5 2 0 4-1.5 4.5 1-3-2-4-2-7 0-1 .3-2.5.5-4z" /></svg>);
const CheckIcon = ({ size = 14, ...p }) => (<svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 6 9 17l-5-5" /></svg>);
const ChevronDownIcon = ({ size = 16, rotate = false }) => (<svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ transform: rotate ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><path d="m6 9 6 6 6-6" /></svg>);
const ChevronLeftIcon = ({ size = 16, flip = false }) => (<svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ transform: flip ? "rotate(180deg)" : "none" }}><path d="m15 6-6 6 6 6" /></svg>);
const SparkleIcon = ({ size = 14, ...p }) => (<svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" {...p}><path d="M12 2l1.5 5.5L19 9l-5.5 1.5L12 16l-1.5-5.5L5 9l5.5-1.5z" /></svg>);
const PlusIcon = ({ size = 20, ...p }) => (<svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 5v14M5 12h14" /></svg>);
const EditIcon = ({ size = 14, ...p }) => (<svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3Z" /></svg>);
const MenuIcon = () => (<svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>);
const ClockIcon = () => (<svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>);

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
   SHEET WRAPPER
════════════════════════════════════════════════════════ */
function Sheet({ children, onClose, maxH = "88%" }) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 40, display: "flex", alignItems: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} />
      <div style={{
        position: "relative", width: "100%", maxHeight: maxH, overflowY: "auto",
        borderRadius: "24px 24px 0 0", borderTop: "1px solid rgba(255,255,255,0.1)",
        background: "#11131e", padding: "20px 20px 32px", boxShadow: "0 -10px 40px rgba(0,0,0,0.5)",
        animation: "floatIn 0.35s cubic-bezier(.21,.61,.35,1) both",
      }}>
        <div style={{ margin: "0 auto 16px", height: 4, width: 40, borderRadius: 4, background: "rgba(255,255,255,0.15)" }} />
        {children}
      </div>
    </div>
  );
}
function SheetInput({ value, onChange, placeholder, autoFocus, accentColor, onKeyDown }) {
  return (
    <input autoFocus={autoFocus} value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown}
      style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
        padding: "12px 16px", fontSize: 14, color: "#fff", outline: "none", boxSizing: "border-box" }}
      onFocus={e => e.target.style.borderColor = accentColor}
      onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
  );
}
function SheetSelect({ value, onChange, children }) {
  return (
    <select value={value} onChange={onChange} style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)",
      background: "#161927", padding: "10px 12px", fontSize: 14, color: "#fff", outline: "none" }}>
      {children}
    </select>
  );
}
function PrimaryBtn({ label, onClick, disabled, accentColor, accentColor2 }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width: "100%", marginTop: 24, borderRadius: 16, border: "none", padding: "14px 0",
      fontSize: 14, fontWeight: 700, color: "#fff", cursor: disabled ? "not-allowed" : "pointer",
      background: `linear-gradient(135deg, ${accentColor}, ${accentColor2 || accentColor})`,
      opacity: disabled ? 0.4 : 1, transition: "all 0.2s",
      boxShadow: disabled ? "none" : `0 8px 20px ${accentColor}50`,
    }}>{label}</button>
  );
}

/* ════════════════════════════════════════════════════════
   PROGRESS RING
════════════════════════════════════════════════════════ */
function ProgressRing({ percent, doneLabel }) {
  const r = 42, circ = 2 * Math.PI * r, offset = circ - (percent / 100) * circ;
  return (
    <div style={{ position: "relative", display: "grid", placeItems: "center", height: 112, width: 112, flexShrink: 0 }}>
      <svg viewBox="0 0 100 100" width={112} height={112} style={{ transform: "rotate(-90deg)" }}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="white" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.3,.7,.3,1)" }} />
      </svg>
      <div style={{ position: "absolute", textAlign: "center" }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#fff" }}>{percent}%</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>{doneLabel}</div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   HOME SCREEN — matches data.ts seed exactly
════════════════════════════════════════════════════════ */
const HOME_TASKS_SEED = [
  { id: "t1", title: "مراجعة خطة المشروع الأسبوعية", titleEn: "Review weekly project plan", time: "09:00 ص", timeEn: "09:00 AM", category: "العمل", categoryEn: "Work", categoryColor: "#818cf8", priority: "high", done: true },
  { id: "t2", title: "اجتماع فريق التصميم", titleEn: "Design team meeting", time: "11:30 ص", timeEn: "11:30 AM", category: "العمل", categoryEn: "Work", categoryColor: "#818cf8", priority: "high", done: false },
  { id: "t3", title: "قراءة 20 صفحة من كتاب العادات الذرية", titleEn: "Read 20 pages of Atomic Habits", time: "04:00 م", timeEn: "04:00 PM", category: "تطوير ذاتي", categoryEn: "Self-growth", categoryColor: "#34d399", priority: "medium", done: false },
  { id: "t4", title: "تمارين رياضية — جري 5 كم", titleEn: "Workout — 5km run", time: "06:30 م", timeEn: "06:30 PM", category: "صحة", categoryEn: "Health", categoryColor: "#f472b6", priority: "medium", done: false },
  { id: "t5", title: "شراء مستلزمات المنزل", titleEn: "Buy home supplies", time: "08:00 م", timeEn: "08:00 PM", category: "شخصي", categoryEn: "Personal", categoryColor: "#fbbf24", priority: "low", done: false },
];
const HOME_HABITS_SEED = [
  { id: "h1", title: "شرب الماء", titleEn: "Drink water", emoji: "💧", streak: 12, goal: 8, doneToday: 5, color: "#38bdf8" },
  { id: "h2", title: "قراءة", titleEn: "Reading", emoji: "📖", streak: 7, goal: 1, doneToday: 1, color: "#34d399" },
  { id: "h3", title: "تأمل", titleEn: "Meditation", emoji: "🧘", streak: 21, goal: 1, doneToday: 0, color: "#a78bfa" },
  { id: "h4", title: "رياضة", titleEn: "Exercise", emoji: "🏃", streak: 4, goal: 1, doneToday: 0, color: "#fb7185" },
];

function HomeScreen({ onNavigate }) {
  const { lang, t, userName, A } = useI18n();
  const [tasks, setTasks] = useState(HOME_TASKS_SEED);
  const [notifOpen, setNotifOpen] = useState(false);
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  const dShort = getDaysShort(lang);
  const week = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(today), i));
  const doneCount = tasks.filter(x => x.done).length;
  const percent = Math.round((doneCount / tasks.length) * 100);

  const priorityStyles = {
    high: { label: t("عالية", "High"), bg: "rgba(244,63,94,0.15)", color: "#fb7185" },
    medium: { label: t("متوسطة", "Medium"), bg: "rgba(245,158,11,0.15)", color: "#fbbf24" },
    low: { label: t("منخفضة", "Low"), bg: "rgba(14,165,233,0.15)", color: "#38bdf8" },
  };
  const toggleTask = (id) => setTasks(prev => prev.map(x => x.id === id ? { ...x, done: !x.done } : x));
  const sortedTasks = useMemo(() => [...tasks].sort((a, b) => Number(a.done) - Number(b.done)), [tasks]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: "16px 20px 128px" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", animation: "floatIn 0.45s both" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "grid", placeItems: "center", height: 48, width: 48, borderRadius: 16,
            background: `linear-gradient(135deg, ${A.a500}, ${A.b600})`, fontSize: 18, fontWeight: 700, color: "#fff",
            boxShadow: `0 8px 16px ${A.a600}4d` }}>{userName.charAt(0)}</div>
          <div>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>{t("صباح الخير 👋", "Good morning 👋")}</p>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>{userName}</h1>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <button onClick={() => setNotifOpen(o => !o)} style={{
            position: "relative", display: "grid", placeItems: "center", height: 44, width: 44, borderRadius: 16,
            border: notifOpen ? `1px solid ${A.a500}66` : "1px solid rgba(255,255,255,0.1)",
            background: notifOpen ? `${A.a500}26` : "rgba(255,255,255,0.05)",
            color: notifOpen ? A.a300 : "#cbd5e1", cursor: "pointer" }}>
            <BellIcon />
            <span style={{ position: "absolute", top: 10, [lang === "ar" ? "left" : "right"]: 10, height: 8, width: 8, borderRadius: "50%", background: "#fb7185", boxShadow: "0 0 0 2px #0c0e16" }} />
          </button>
          {notifOpen && (
            <>
              <div onClick={() => setNotifOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }} />
              <div style={{ position: "absolute", [lang === "ar" ? "left" : "right"]: 0, top: 48, zIndex: 40, width: 256, overflow: "hidden", borderRadius: 16,
                border: "1px solid rgba(255,255,255,0.1)", background: "#161927", boxShadow: "0 16px 40px rgba(0,0,0,0.6)", animation: "floatIn 0.3s both" }}>
                <p style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "#fff", margin: 0 }}>{t("الإشعارات", "Notifications")}</p>
                {[
                  { emoji: "⏰", text: t("اجتماع فريق التصميم بعد ساعة", "Design team meeting in 1 hour"), time: t("قبل ٥ دقائق", "5 min ago") },
                  { emoji: "🔥", text: t("سلسلة التأمل وصلت ٢١ يوم!", "Meditation streak hit 21 days!"), time: t("قبل ساعتين", "2 hours ago") },
                  { emoji: "🎯", text: t("اقترب موعد هدف إنقاص الوزن", "Weight loss goal deadline is near"), time: t("أمس", "Yesterday") },
                ].map((n, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "12px 16px", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <span style={{ fontSize: 16 }}>{n.emoji}</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: 11, lineHeight: 1.4, color: "#e2e8f0", margin: 0 }}>{n.text}</p>
                      <p style={{ marginTop: 2, fontSize: 9, color: "#64748b", margin: 0 }}>{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      <section style={{ display: "flex", justifyContent: "space-between", gap: 6, animation: "floatIn 0.45s 60ms both" }}>
        {week.map(d => {
          const isActive = d.getDate() === selectedDay;
          return (
            <button key={toKey(d)} onClick={() => setSelectedDay(d.getDate())} style={{
              display: "flex", flex: 1, flexDirection: "column", alignItems: "center", gap: 4, borderRadius: 16, padding: "10px 0",
              border: "none", cursor: "pointer", transition: "all 0.2s",
              background: isActive ? `linear-gradient(180deg, ${A.a500}, ${A.b600})` : "transparent",
              boxShadow: isActive ? `0 8px 16px ${A.a600}4d` : "none" }}>
              <span style={{ fontSize: 10, color: isActive ? "#fff" : "#64748b" }}>{dShort[d.getDay()]}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: isActive ? "#fff" : "#cbd5e1" }}>{d.getDate()}</span>
            </button>
          );
        })}
      </section>

      <section style={{ position: "relative", overflow: "hidden", borderRadius: 24, padding: 20,
        background: `linear-gradient(225deg, ${A.a600}, ${A.b600}, ${A.b800})`, boxShadow: `0 16px 32px ${A.b800}4d`, animation: "floatIn 0.45s 120ms both" }}>
        <div style={{ position: "absolute", top: -40, left: -40, height: 160, width: 160, borderRadius: "50%", background: "rgba(255,255,255,0.1)", filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: -48, right: -32, height: 144, width: 144, borderRadius: "50%", background: "rgba(232,121,249,0.2)", filter: "blur(40px)" }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 20, background: "rgba(255,255,255,0.15)", padding: "4px 12px", fontSize: 11, fontWeight: 500, color: "#fff", width: "fit-content" }}>
              <SparkleIcon size={14} />{t("تقدّم اليوم", "Today's progress")}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.3, color: "#fff", margin: 0 }}>{t(`أنجزت ${doneCount} من ${tasks.length} مهام`, `Completed ${doneCount} of ${tasks.length} tasks`)}</h2>
            <p style={{ fontSize: 12, lineHeight: 1.5, color: "rgba(224,231,255,0.8)", margin: 0 }}>
              {percent >= 100 ? t("رائع! أكملت كل مهام اليوم 🎉", "Amazing! All tasks done today 🎉") : t("استمر، أنت على الطريق الصحيح نحو هدفك", "Keep going, you're on the right road")}
            </p>
          </div>
          <ProgressRing percent={percent} doneLabel={t("مكتمل", "Done")} />
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, animation: "floatIn 0.45s 180ms both" }}>
        {[
          { value: String(tasks.length - doneCount), label: t("مهام متبقية", "Tasks left"), color: A.a400, bg: `${A.a500}1a` },
          { value: "21", label: t("أطول سلسلة", "Best streak"), color: "#fbbf24", bg: "rgba(245,158,11,0.1)", flame: true },
          { value: "4", label: t("عادات نشطة", "Active habits"), color: "#34d399", bg: "rgba(16,185,129,0.1)" },
        ].map(s => (
          <div key={s.label} style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", background: s.bg, padding: "14px 12px", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 20, fontWeight: 700, color: s.color }}>{s.flame && <FlameIcon size={16} />}{s.value}</div>
            <div style={{ marginTop: 2, fontSize: 11, color: "#94a3b8" }}>{s.label}</div>
          </div>
        ))}
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 12, animation: "floatIn 0.45s 240ms both" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>{t("عاداتك اليوم", "Today's habits")}</h3>
          <button onClick={() => onNavigate?.("habits")} style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 12, fontWeight: 500, color: A.a400, background: "none", border: "none", cursor: "pointer" }}>
            {t("عرض الكل", "View all")}<ChevronLeftIcon size={14} flip={lang === "en"} />
          </button>
        </div>
        <div style={{ display: "flex", gap: 12, overflowX: "auto", margin: "0 -20px", padding: "0 20px 4px" }}>
          {HOME_HABITS_SEED.map(h => {
            const pct = Math.min(100, Math.round((h.doneToday / h.goal) * 100));
            return (
              <div key={h.id} style={{ width: 120, flexShrink: 0, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.04)", padding: 14 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 24 }}>{h.emoji}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 2, borderRadius: 20, background: "rgba(245,158,11,0.1)", padding: "2px 6px", fontSize: 10, fontWeight: 600, color: "#fbbf24" }}><FlameIcon size={11} />{h.streak}</span>
                </div>
                <p style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: "#fff", margin: "8px 0 0" }}>{t(h.title, h.titleEn)}</p>
                <p style={{ fontSize: 10, color: "#64748b", margin: "2px 0 0" }}>{h.doneToday}/{h.goal} {h.goal > 1 ? t("أكواب", "cups") : t("مرة", "time")}</p>
                <div style={{ marginTop: 8, height: 6, overflow: "hidden", borderRadius: 8, background: "rgba(255,255,255,0.1)" }}>
                  <div style={{ height: "100%", borderRadius: 8, width: `${pct}%`, background: h.color, transition: "width 0.5s" }} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section style={{ display: "flex", flexDirection: "column", gap: 12, animation: "floatIn 0.45s 300ms both" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>{t("مهام اليوم", "Today's tasks")}</h3>
          <button onClick={() => onNavigate?.("tasks")} style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 12, fontWeight: 500, color: A.a400, background: "none", border: "none", cursor: "pointer" }}>
            {t("عرض الكل", "View all")}<ChevronLeftIcon size={14} flip={lang === "en"} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sortedTasks.map(task => {
            const ps = priorityStyles[task.priority];
            return (
              <button key={task.id} onClick={() => toggleTask(task.id)} style={{
                display: "flex", width: "100%", alignItems: "center", gap: 14, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)",
                padding: 14, textAlign: lang === "ar" ? "right" : "left", background: task.done ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
                opacity: task.done ? 0.6 : 1, cursor: "pointer", transition: "all 0.15s" }}>
                <span style={{ display: "grid", placeItems: "center", height: 24, width: 24, flexShrink: 0, borderRadius: "50%",
                  border: `2px solid ${task.done ? A.a500 : "#475569"}`, background: task.done ? A.a500 : "transparent", color: "#fff" }}>
                  {task.done && <CheckIcon size={12} />}
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, fontWeight: 600,
                    color: task.done ? "#64748b" : "#fff", textDecoration: task.done ? "line-through" : "none" }}>{t(task.title, task.titleEn)}</span>
                  <span style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#64748b" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><ClockIcon />{t(task.time, task.timeEn)}</span>
                    <span style={{ borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 500, color: task.categoryColor, background: `${task.categoryColor}1f` }}>{t(task.category, task.categoryEn)}</span>
                  </span>
                </span>
                <span style={{ flexShrink: 0, borderRadius: 20, padding: "4px 8px", fontSize: 10, fontWeight: 600, background: ps.bg, color: ps.color }}>{ps.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section style={{ borderRadius: 24, border: "1px solid rgba(255,255,255,0.05)", background: "linear-gradient(270deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))", padding: 20, animation: "floatIn 0.45s 360ms both" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span style={{ fontSize: 28 }}>🚀</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.6, color: "#fff", margin: 0 }}>
              {t(`"الطريق إلى النجاح يبدأ بخطوة... وأنت قطعت ${percent}% من طريق اليوم"`, `"The road to success starts with a step... you've covered ${percent}% of today's road"`)}
            </p>
            <p style={{ marginTop: 4, fontSize: 11, color: "#64748b", margin: "4px 0 0" }}>{t("رود — رفيقك في الإنجاز", "Road — your companion to getting things done")}</p>
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

function TasksScreen() {
  const { lang, t, A } = useI18n();
  const [events, setEvents] = useState(() => makeTasksSeed(lang));
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
  const calLetters = lang === "ar" ? ["س", "ح", "ن", "ث", "ر", "خ", "ج"] : ["Sa", "Su", "Mo", "Tu", "We", "Th", "Fr"];
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
      <header style={{ zIndex: 20, borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(12,14,22,0.95)", padding: "16px 16px 8px", backdropFilter: "blur(20px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={() => view !== "month" && setMonthOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 12, padding: "6px 8px", border: "none", background: "transparent", cursor: "pointer" }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>{mNames[headerDate.getMonth()]} <span style={{ fontWeight: 400, color: "#94a3b8" }}>{headerDate.getFullYear()}</span></h1>
            {view !== "month" && <ChevronDownIcon size={16} rotate={monthOpen} />}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", padding: 2 }}>
              {[{ id: "day", label: t("يوم", "Day") }, { id: "week", label: t("أسبوع", "Week") }, { id: "month", label: t("شهر", "Month") }].map(v => (
                <button key={v.id} onClick={() => { setView(v.id); setActiveId(null); setMonthOpen(false); }} style={{
                  borderRadius: 10, border: "none", padding: "4px 10px", fontSize: 11, fontWeight: 500, cursor: "pointer", transition: "all 0.2s",
                  background: view === v.id ? A.a500 : "transparent", color: view === v.id ? "#fff" : "#94a3b8",
                  boxShadow: view === v.id ? "0 2px 8px rgba(0,0,0,0.2)" : "none" }}>{v.label}</button>
              ))}
            </div>
            <button onClick={() => setAddSheet({ dateKey: toKey(selected), start: Math.min((new Date().getHours() + 1) * 60, 23 * 60) })} style={{
              display: "grid", placeItems: "center", height: 32, width: 32, borderRadius: 12, border: "none", cursor: "pointer",
              background: `linear-gradient(135deg, ${A.a500}, ${A.b600})`, color: "#fff", boxShadow: `0 8px 16px ${A.a600}66` }}>
              <PlusIcon size={16} />
            </button>
          </div>
        </div>

        {monthOpen && view !== "month" && (
          <div style={{ marginTop: 12, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.03)", padding: 12, animation: "floatIn 0.3s both" }}>
            <div style={{ marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button onClick={() => setGridMonth(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))} style={{ display: "grid", placeItems: "center", height: 28, width: 28, borderRadius: 8, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}><ChevronLeftIcon size={16} flip={lang === "en"} /></button>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{mNames[gridMonth.m]} {gridMonth.y}</span>
              <button onClick={() => setGridMonth(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))} style={{ display: "grid", placeItems: "center", height: 28, width: 28, borderRadius: 8, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}><ChevronLeftIcon size={16} flip={lang === "ar"} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
              {calLetters.map((d, i) => <span key={i} style={{ padding: "4px 0", textAlign: "center", fontSize: 10, color: "#64748b" }}>{d}</span>)}
              {monthGrid.flat().map((d, i) => {
                const inMonth = d.getMonth() === gridMonth.m;
                const isSel = isSameDay(d, selected);
                const isToday = isSameDay(d, new Date());
                const hasEvents = (eventsByKey.get(toKey(d))?.length ?? 0) > 0;
                return (
                  <button key={i} onClick={() => pickDate(d)} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "2px 0", background: "none", border: "none", cursor: "pointer" }}>
                    <span style={{ display: "grid", placeItems: "center", height: 28, width: 28, borderRadius: "50%", fontSize: 12, transition: "all 0.15s",
                      background: isSel ? A.a500 : "transparent", fontWeight: isSel || isToday ? 700 : 400,
                      color: isSel ? "#fff" : isToday ? A.a400 : inMonth ? "#cbd5e1" : "#475569",
                      boxShadow: isToday && !isSel ? `0 0 0 1px ${A.a500}80 inset` : "none" }}>{d.getDate()}</span>
                    <span style={{ marginTop: 1, height: 4, width: 4, borderRadius: "50%", background: hasEvents && !isSel ? `${A.a400}b3` : "transparent" }} />
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
                  style={{ position: "relative", flex: 1, borderInlineStart: "1px solid rgba(255,255,255,0.05)" }}>
                  {Array.from({ length: 24 }, (_, i) => (
                    <div key={i} style={{ position: "absolute", insetInline: 0, borderTop: "1px solid rgba(255,255,255,0.05)", top: i * HOUR }} />
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
      style={{ position: "absolute", userSelect: "none", overflow: "visible", borderRadius: 8, textAlign: "start", transition: "box-shadow 0.2s",
        zIndex: isActive ? 30 : 5, top, height, insetInlineEnd: `calc(${rightPct}% + 2px)`, width: `calc(${widthPct}% - 4px)`,
        background: e.status === "done" ? `${color}cc` : color, boxShadow: isActive ? "0 0 0 2px #fff, 0 20px 40px rgba(0,0,0,0.5)" : `0 2px 10px ${color}33`, touchAction: "none" }}>
      <div style={{ overflow: "hidden", padding: "4px 6px", height: "100%" }}>
        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 700, lineHeight: 1.3, color: "#fff",
          fontSize: compact ? 9 : 11, textDecoration: e.status === "done" ? "line-through" : "none", opacity: e.status === "done" ? 0.8 : 1 }}>{e.title}</span>
        {height > 34 && !compact && <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 9, color: "rgba(255,255,255,0.8)" }}>{mtl(e.start)} – {mtl(e.end)}</span>}
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
          <button key={e.id} onClick={() => onPickEvent(e)} style={{ display: "flex", width: "100%", alignItems: "center", gap: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.04)", padding: 12, textAlign: "start", background2: "none", cursor: "pointer" }}>
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
  const [duration, setDuration] = useState(60);
  const [y, m, d] = dateKey.split("-").map(Number);
  const dateLabel = formatFullDate(new Date(y, m - 1, d), lang);
  const timeOptions = Array.from({ length: 48 }, (_, i) => i * 30);
  return (
    <Sheet onClose={onClose}>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>{t("مهمة جديدة", "New task")}</h3>
      <p style={{ marginTop: 2, fontSize: 12, color: "#94a3b8" }}>📅 {dateLabel}</p>
      <SheetInput autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder={t("ماذا تريد أن تنجز؟", "What do you want to get done?")} accentColor="#0ea5e9" />
      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <p style={{ marginBottom: 6, fontSize: 11, color: "#94a3b8" }}>{t("وقت البدء", "Start time")}</p>
          <SheetSelect value={start} onChange={e => setStart(Number(e.target.value))}>{timeOptions.map(x => <option key={x} value={x}>{minutesToLabel(x, lang)}</option>)}</SheetSelect>
        </div>
        <div>
          <p style={{ marginBottom: 6, fontSize: 11, color: "#94a3b8" }}>{t("المدة", "Duration")}</p>
          <SheetSelect value={duration} onChange={e => setDuration(Number(e.target.value))}>
            <option value={30}>{t("٣٠ دقيقة", "30 min")}</option><option value={60}>{t("ساعة", "1 hour")}</option><option value={90}>{t("ساعة ونصف", "1.5 hours")}</option><option value={120}>{t("ساعتان", "2 hours")}</option><option value={180}>{t("٣ ساعات", "3 hours")}</option>
          </SheetSelect>
        </div>
      </div>
      <PrimaryBtn label={t("حفظ المهمة", "Save task")} disabled={!title.trim()} accentColor="#0ea5e9" accentColor2="#2563eb" onClick={() => onSave(title, start, duration)} />
    </Sheet>
  );
}

function TaskEditSheet({ event, onClose, onSave, onDelete, A }) {
  const { lang, t } = useI18n();
  const [title, setTitle] = useState(event.title);
  const [start, setStart] = useState(event.start - (event.start % 30));
  const [duration, setDuration] = useState(event.end - event.start);
  const [y, m, d] = event.dateKey.split("-").map(Number);
  const dateLabel = formatFullDate(new Date(y, m - 1, d), lang);
  const timeOptions = Array.from({ length: 48 }, (_, i) => i * 30);
  const durOptions = [30, 60, 90, 120, 180];
  if (!durOptions.includes(duration)) durOptions.push(duration);
  const durLabel = x => lang === "ar" ? (x < 60 ? `${x} دقيقة` : x % 60 === 0 ? `${x / 60} ساعة` : `${Math.floor(x / 60)} س ${x % 60} د`) : (x < 60 ? `${x} min` : x % 60 === 0 ? `${x / 60} h` : `${Math.floor(x / 60)}h ${x % 60}m`);
  return (
    <Sheet onClose={onClose}>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>{t("تعديل المهمة", "Edit task")}</h3>
      <p style={{ marginTop: 2, fontSize: 12, color: "#94a3b8" }}>📅 {dateLabel}</p>
      <SheetInput autoFocus value={title} onChange={e => setTitle(e.target.value)} accentColor="#0ea5e9" />
      <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <p style={{ marginBottom: 6, fontSize: 11, color: "#94a3b8" }}>{t("وقت البدء", "Start time")}</p>
          <SheetSelect value={start} onChange={e => setStart(Number(e.target.value))}>{timeOptions.map(x => <option key={x} value={x}>{minutesToLabel(x, lang)}</option>)}</SheetSelect>
        </div>
        <div>
          <p style={{ marginBottom: 6, fontSize: 11, color: "#94a3b8" }}>{t("المدة", "Duration")}</p>
          <SheetSelect value={duration} onChange={e => setDuration(Number(e.target.value))}>{durOptions.sort((a, b) => a - b).map(x => <option key={x} value={x}>{durLabel(x)}</option>)}</SheetSelect>
        </div>
      </div>
      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
        <button onClick={() => onSave(event.id, title, start, duration)} disabled={!title.trim()} style={{ borderRadius: 16, border: "none", padding: "14px 0", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer", background: "linear-gradient(135deg,#0ea5e9,#2563eb)", boxShadow: "0 8px 20px rgba(14,165,233,0.3)", opacity: !title.trim() ? 0.4 : 1 }}>{t("حفظ التعديلات", "Save changes")}</button>
        <button onClick={onDelete} style={{ borderRadius: 16, border: "1px solid rgba(244,63,94,0.2)", background: "rgba(244,63,94,0.1)", padding: "14px 0", fontSize: 14, fontWeight: 700, color: "#fb7185", cursor: "pointer" }}>{t("حذف", "Delete")}</button>
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
        <span style={{ marginTop: 6, height: 16, width: 16, flexShrink: 0, borderRadius: 6, background: STATUS_COLOR[event.status] }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <h3 style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>{event.title}</h3>
          <p style={{ marginTop: 2, fontSize: 12, color: "#94a3b8" }}>{dateLabel} · {mtl(event.start)} – {mtl(event.end)}</p>
        </div>
        <button onClick={onEdit} style={{ display: "flex", flexShrink: 0, alignItems: "center", gap: 4, borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", padding: "6px 12px", fontSize: 11, fontWeight: 600, color: "#cbd5e1", cursor: "pointer" }}><EditIcon size={14} />{t("تعديل", "Edit")}</button>
      </div>
      <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {options.map(o => {
          const isCurrent = event.status === o.s;
          const c = STATUS_COLOR[o.s];
          return (
            <button key={o.s} onClick={() => onStatus(o.s)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6, borderRadius: 16, border: `1px solid ${c}40`, padding: "14px 0", cursor: "pointer", transition: "all 0.15s",
              background: `${c}1a`, color: c, boxShadow: isCurrent ? `0 0 0 2px ${c}` : "none" }}>
              <span style={{ display: "grid", placeItems: "center", height: 36, width: 36, borderRadius: "50%", fontSize: 16, fontWeight: 700, color: "#fff", background: c }}>{o.emoji}</span>
              <span style={{ fontSize: 12, fontWeight: 700 }}>{o.label}</span>
            </button>
          );
        })}
      </div>
      {event.status !== "pending" && <p style={{ marginTop: 12, textAlign: "center", fontSize: 10, color: "#64748b" }}>{t(`اضغط على الحالة الحالية (${statusLabel(event.status, t)}) لإلغائها وإرجاع اللون الأزرق`, `Tap the current status (${statusLabel(event.status, t)}) to reset it back to blue`)}</p>}
    </Sheet>
  );
}
/* ════════════════════════════════════════════════════════
   HABITS SCREEN — counter-based, due-day aware, 10-week grid
════════════════════════════════════════════════════════ */
const HABIT_COLORS = [
  { id: "violet", value: "#8b5cf6" }, { id: "sky", value: "#0ea5e9" }, { id: "emerald", value: "#10b981" },
  { id: "rose", value: "#f43f5e" }, { id: "amber", value: "#f59e0b" }, { id: "pink", value: "#ec4899" },
];
const HABIT_ICONS = ["💧", "📖", "🧘", "🏃", "🍎", "😴", "✍️", "🚭", "💊", "🎯", "🧹", "☀️"];
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

function HabitsScreen() {
  const { lang, t, A } = useI18n();
  const [habits, setHabits] = useState(() => makeHabitsSeed(t));
  const [addOpen, setAddOpen] = useState(false);
  const [editHabit, setEditHabit] = useState(null);
  const [statsHabit, setStatsHabit] = useState(null);
  const today = new Date();

  const dueToday = habits.filter(h => isDue(h, today));
  const doneToday = dueToday.filter(h => isDoneOn(h, today)).length;

  function bump(h, delta) {
    setHabits(prev => prev.map(x => {
      if (x.id !== h.id) return x;
      const key = toKey(today);
      const cur = x.log[key] ?? 0;
      const next = Math.max(0, Math.min(x.goal, cur + delta));
      return { ...x, log: { ...x.log, [key]: next } };
    }));
  }
  function addHabit(form) { setHabits(prev => [...prev, { id: `h${Date.now()}`, title: form.title, icon: form.icon, color: form.color, goal: form.goal, days: form.days, log: {} }]); }
  function updateHabit(id, patch) { setHabits(prev => prev.map(h => h.id === id ? { ...h, ...patch } : h)); }
  function deleteHabit(id) { setHabits(prev => prev.filter(h => h.id !== id)); }

  return (
    <div style={{ padding: "16px 20px 128px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>{t("العادات", "Habits")}</h1>
        <button onClick={() => setAddOpen(true)} style={{ display: "grid", placeItems: "center", height: 40, width: 40, borderRadius: 14, border: "none", cursor: "pointer", background: `linear-gradient(135deg, ${A.a500}, ${A.b600})`, color: "#fff", boxShadow: `0 6px 16px ${A.a600}4d` }}><PlusIcon size={18} /></button>
      </div>
      <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 18 }}>{t(`أنجزت ${doneToday} من ${dueToday.length} عادات اليوم`, `Completed ${doneToday} of ${dueToday.length} habits today`)}</p>

      {habits.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}><div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>🔥</div><p style={{ color: "#94a3b8", fontSize: 14 }}>{t("لا توجد عادات بعد", "No habits yet")}</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {habits.map(h => {
            const streak = calcStreak(h, today);
            const due = isDue(h, today);
            const count = countOn(h, today);
            const done = isDoneOn(h, today);
            const pct = Math.min(100, Math.round((count / h.goal) * 100));
            return (
              <div key={h.id} style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.04)", padding: 16, opacity: due ? 1 : 0.55 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <button onClick={() => setStatsHabit(h)} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", textAlign: "start", flex: 1, minWidth: 0 }}>
                    <span style={{ display: "grid", placeItems: "center", height: 40, width: 40, borderRadius: 12, fontSize: 20, flexShrink: 0, background: `${h.color}26` }}>{h.icon}</span>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 13, fontWeight: 700, color: "#fff" }}>{h.title}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#fbbf24" }}><FlameIcon size={11} />{streak} {t("يوم", "days")}{!due && <span style={{ marginInlineStart: 6, color: "#64748b" }}>· {t("غير مستحقة اليوم", "Not due today")}</span>}</span>
                    </span>
                  </button>
                  <button onClick={() => setEditHabit(h)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 4, flexShrink: 0 }}><EditIcon size={14} /></button>
                </div>

                {h.goal > 1 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button disabled={!due || count <= 0} onClick={() => bump(h, -1)} style={{ display: "grid", placeItems: "center", height: 36, width: 36, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#cbd5e1", fontSize: 18, cursor: due ? "pointer" : "not-allowed", opacity: !due || count <= 0 ? 0.4 : 1 }}>−</button>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11, color: "#94a3b8" }}><span>{count}/{h.goal}</span><span style={{ color: h.color, fontWeight: 700 }}>{pct}%</span></div>
                      <div style={{ height: 8, borderRadius: 8, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: h.color, borderRadius: 8, transition: "width 0.4s" }} /></div>
                    </div>
                    <button disabled={!due || count >= h.goal} onClick={() => bump(h, 1)} style={{ display: "grid", placeItems: "center", height: 36, width: 36, borderRadius: 10, border: "none", background: h.color, color: "#fff", fontSize: 18, fontWeight: 700, cursor: due ? "pointer" : "not-allowed", opacity: !due || count >= h.goal ? 0.4 : 1 }}>+</button>
                  </div>
                ) : (
                  <button disabled={!due} onClick={() => bump(h, done ? -1 : 1)} style={{
                    width: "100%", borderRadius: 12, border: done ? "none" : `1px solid ${h.color}50`, background: done ? h.color : "transparent",
                    color: done ? "#0c0e16" : h.color, padding: "10px 0", fontSize: 12, fontWeight: 700, cursor: due ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: due ? 1 : 0.5 }}>
                    {done ? <><CheckIcon size={14} />{t("تم اليوم", "Done today")}</> : t("تسجيل اليوم", "Mark today")}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {addOpen && <HabitFormSheet onClose={() => setAddOpen(false)} onSave={f => { addHabit(f); setAddOpen(false); }} A={A} />}
      {editHabit && <HabitFormSheet habit={editHabit} onClose={() => setEditHabit(null)} onSave={p => { updateHabit(editHabit.id, p); setEditHabit(null); }} onDelete={() => { deleteHabit(editHabit.id); setEditHabit(null); }} A={A} />}
      {statsHabit && <HabitStatsSheet habit={habits.find(x => x.id === statsHabit.id) ?? statsHabit} onClose={() => setStatsHabit(null)} A={A} />}
    </div>
  );
}

function HabitFormSheet({ habit, onClose, onSave, onDelete, A }) {
  const { lang, t } = useI18n();
  const [title, setTitle] = useState(habit?.title || "");
  const [icon, setIcon] = useState(habit?.icon || HABIT_ICONS[0]);
  const [color, setColor] = useState(habit?.color || HABIT_COLORS[0].value);
  const [goal, setGoal] = useState(habit?.goal || 1);
  const [days, setDays] = useState(habit?.days || ALL_WEEKDAYS);
  const dayLabels = lang === "ar" ? ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"] : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const toggleDay = (d) => setDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());
  return (
    <Sheet onClose={onClose} maxH="92%">
      <h3 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 16 }}>{habit ? t("تعديل العادة", "Edit habit") : t("عادة جديدة", "New habit")}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <SheetInput autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder={t("اسم العادة...", "Habit name...")} accentColor={A.a500} />
        <div><p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>{t("الرمز", "Icon")}</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{HABIT_ICONS.map(e => (<button key={e} onClick={() => setIcon(e)} style={{ height: 38, width: 38, borderRadius: 10, fontSize: 18, border: icon === e ? `2px solid ${A.a500}` : "1px solid rgba(255,255,255,0.1)", background: icon === e ? `${A.a500}1f` : "rgba(255,255,255,0.04)", cursor: "pointer" }}>{e}</button>))}</div>
        </div>
        <div><p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>{t("اللون", "Color")}</p>
          <div style={{ display: "flex", gap: 8 }}>{HABIT_COLORS.map(c => (<button key={c.id} onClick={() => setColor(c.value)} style={{ height: 30, width: 30, borderRadius: "50%", background: c.value, border: color === c.value ? "3px solid #fff" : "3px solid transparent", cursor: "pointer" }} />))}</div>
        </div>
        <div><p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>{t("الهدف اليومي", "Daily goal")}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => setGoal(g => Math.max(1, g - 1))} style={{ height: 32, width: 32, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", cursor: "pointer" }}>−</button>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#fff", minWidth: 24, textAlign: "center" }}>{goal}</span>
            <button onClick={() => setGoal(g => Math.min(20, g + 1))} style={{ height: 32, width: 32, borderRadius: 10, border: "none", background: A.a500, color: "#fff", cursor: "pointer" }}>+</button>
          </div>
        </div>
        <div><p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>{t("أيام التكرار", "Repeat on")}</p>
          <div style={{ display: "flex", gap: 6 }}>{dayLabels.map((l, i) => (<button key={i} onClick={() => toggleDay(i)} style={{ flex: 1, borderRadius: 10, border: days.includes(i) ? "none" : "1px solid rgba(255,255,255,0.1)", background: days.includes(i) ? A.a500 : "rgba(255,255,255,0.04)", color: days.includes(i) ? "#fff" : "#94a3b8", padding: "8px 0", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>{l}</button>))}</div>
        </div>
      </div>
      <PrimaryBtn label={habit ? t("حفظ", "Save") : t("إضافة العادة", "Add habit")} disabled={!title.trim() || days.length === 0} accentColor={A.a500} accentColor2={A.b600}
        onClick={() => { if (!title.trim() || !days.length) return; onSave({ title: title.trim(), icon, color, goal, days }); }} />
      {habit && onDelete && <button onClick={onDelete} style={{ width: "100%", marginTop: 10, borderRadius: 14, border: "1px solid rgba(244,63,94,0.2)", background: "rgba(244,63,94,0.08)", padding: "11px 0", color: "#fb7185", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{t("حذف العادة", "Delete habit")}</button>}
    </Sheet>
  );
}

function HabitStatsSheet({ habit, onClose, A }) {
  const { lang, t } = useI18n();
  const today = new Date();
  const weeks = 10;
  const gridStart = addDays(startOfWeek(today), -(weeks - 1) * 7);
  const cols = Array.from({ length: weeks }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(gridStart, w * 7 + d)));
  const dueDays = ALL_WEEKDAYS_COUNT(habit, gridStart, today);
  const doneCount = cols.flat().filter(d => d <= today && isDue(habit, d) && isDoneOn(habit, d)).length;
  const streak = calcStreak(habit, today);
  const dayLabels = lang === "ar" ? ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"] : ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  function ALL_WEEKDAYS_COUNT(h, from, to) {
    let c = 0, d = from;
    while (d <= to) { if (isDue(h, d)) c++; d = addDays(d, 1); }
    return c;
  }

  return (
    <Sheet onClose={onClose} maxH="85%">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ display: "grid", placeItems: "center", height: 44, width: 44, borderRadius: 14, fontSize: 22, background: `${habit.color}26` }}>{habit.icon}</span>
        <div><h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>{habit.title}</h3><p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>{t("إحصائيات العادة", "Habit stats")}</p></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 18 }}>
        <div style={{ borderRadius: 14, background: "rgba(255,255,255,0.04)", padding: "12px 6px", textAlign: "center" }}><div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 3, fontSize: 16, fontWeight: 700, color: "#fbbf24" }}><FlameIcon size={13} />{streak}</div><div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>{t("سلسلة", "Streak")}</div></div>
        <div style={{ borderRadius: 14, background: "rgba(255,255,255,0.04)", padding: "12px 6px", textAlign: "center" }}><div style={{ fontSize: 16, fontWeight: 700, color: habit.color }}>{doneCount}</div><div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>{t("مرات منجزة", "Times done")}</div></div>
        <div style={{ borderRadius: 14, background: "rgba(255,255,255,0.04)", padding: "12px 6px", textAlign: "center" }}><div style={{ fontSize: 16, fontWeight: 700, color: "#34d399" }}>{dueDays ? Math.round((doneCount / dueDays) * 100) : 0}%</div><div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>{t("معدل الإنجاز", "Success rate")}</div></div>
      </div>
      <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>{t(`آخر ${weeks} أسابيع`, `Last ${weeks} weeks`)}</p>
      <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 8 }}>
        {cols.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {week.map((d, di) => {
              const future = d > today; const due = isDue(habit, d); const done = due && isDoneOn(habit, d);
              return <div key={di} title={toKey(d)} style={{ height: 14, width: 14, borderRadius: 4, background: future ? "transparent" : !due ? "rgba(255,255,255,0.03)" : done ? habit.color : "rgba(255,255,255,0.08)", border: isSameDay(d, today) ? `1px solid ${habit.color}` : "none" }} />;
            })}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 6 }}>{dayLabels.map((l, i) => <span key={i} style={{ width: 14, fontSize: 7, color: "#475569", textAlign: "center" }}>{l[0]}</span>)}</div>
    </Sheet>
  );
}
/* ════════════════════════════════════════════════════════
   GOALS SCREEN — milestone checklist, sorted by deadline
════════════════════════════════════════════════════════ */
const GOAL_EMOJIS = ["🎯", "🏋️", "💰", "📚", "🗣️", "✈️", "🏠", "🚗", "💼", "🎓", "🧘", "🎨"];

function makeGoalsSeed(t) {
  const today = new Date();
  return [
    {
      id: "g1", title: t("إنقاص الوزن ٨ كيلو", "Lose 8 kg"), emoji: "🏋️", color: "#fb7185",
      deadline: toKey(addDays(today, 63)),
      milestones: [
        { id: "m1", title: t("إنقاص أول كيلوغرامين", "Lose first 2 kg"), done: true },
        { id: "m2", title: t("الالتزام بنظام غذائي صحي لمدة شهر", "Stick to healthy diet for a month"), done: false },
        { id: "m3", title: t("ممارسة الرياضة 3 مرات أسبوعياً", "Exercise 3x per week"), done: false },
        { id: "m4", title: t("الوصول للوزن المستهدف", "Reach target weight"), done: false },
      ],
    },
    {
      id: "g2", title: t("ادخار ٣٠ ألف ريال", "Save 30,000 SAR"), emoji: "💰", color: "#fbbf24",
      deadline: "2026-10-12",
      milestones: [
        { id: "m1", title: t("ادخار أول 10 آلاف", "Save first 10k"), done: true },
        { id: "m2", title: t("ادخار 20 ألف", "Save 20k"), done: true },
        { id: "m3", title: t("ادخار 25 ألف", "Save 25k"), done: false },
        { id: "m4", title: t("الوصول للهدف الكامل", "Reach full goal"), done: false },
      ],
    },
    {
      id: "g3", title: t("قراءة 12 كتاباً هذه السنة", "Read 12 books this year"), emoji: "📚", color: "#34d399",
      deadline: "2026-12-31",
      milestones: [
        { id: "m1", title: t("الكتاب الأول إلى الثالث", "Books 1–3"), done: true },
        { id: "m2", title: t("الكتاب الرابع إلى السادس", "Books 4–6"), done: true },
        { id: "m3", title: t("الكتاب السابع إلى التاسع", "Books 7–9"), done: true },
        { id: "m4", title: t("الكتاب العاشر", "Book 10"), done: true },
        { id: "m5", title: t("الكتاب الحادي عشر", "Book 11"), done: false },
        { id: "m6", title: t("الكتاب الثاني عشر", "Book 12"), done: false },
      ],
    },
    {
      id: "g4", title: t("تعلم لغة جديدة", "Learn a new language"), emoji: "🗣️", color: "#38bdf8",
      deadline: toKey(addDays(today, -10)),
      milestones: [
        { id: "m1", title: t("إنهاء المستوى الأول", "Finish level 1"), done: true },
        { id: "m2", title: t("إنهاء المستوى الثاني", "Finish level 2"), done: true },
        { id: "m3", title: t("التحدث بثقة لمدة 5 دقائق", "Speak confidently for 5 min"), done: true },
        { id: "m4", title: t("اجتياز الاختبار النهائي", "Pass final test"), done: true },
      ],
    },
  ];
}

function goalProgress(g) { return g.milestones.length ? Math.round((g.milestones.filter(m => m.done).length / g.milestones.length) * 100) : 0; }
function goalDone(g) { return goalProgress(g) >= 100; }

function GoalsScreen() {
  const { lang, t, A } = useI18n();
  const [goals, setGoals] = useState(() => makeGoalsSeed(t));
  const [filter, setFilter] = useState("active");
  const [addOpen, setAddOpen] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [expanded, setExpanded] = useState({});

  const filtered = useMemo(() => {
    let list = goals;
    if (filter === "active") list = goals.filter(g => !goalDone(g));
    if (filter === "done") list = goals.filter(g => goalDone(g));
    return [...list].sort((a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999"));
  }, [goals, filter]);

  const activeCount = goals.filter(g => !goalDone(g)).length;
  const doneCount = goals.filter(g => goalDone(g)).length;
  const overallPct = goals.length ? Math.round(goals.reduce((s, g) => s + goalProgress(g), 0) / goals.length) : 0;

  function addGoal(form) { setGoals(prev => [...prev, { id: `g${Date.now()}`, title: form.title, emoji: form.emoji, color: form.color, deadline: form.deadline, milestones: form.milestones.map((m, i) => ({ id: `m${i}`, title: m, done: false })) }]); }
  function updateGoal(id, patch) { setGoals(prev => prev.map(g => g.id === id ? { ...g, ...patch } : g)); }
  function deleteGoal(id) { setGoals(prev => prev.filter(g => g.id !== id)); }
  function toggleMilestone(g, mid) { updateGoal(g.id, { milestones: g.milestones.map(m => m.id === mid ? { ...m, done: !m.done } : m) }); }

  function deadlineLabel(g) {
    if (!g.deadline) return "";
    const [y, m, d] = g.deadline.split("-").map(Number);
    const dl = new Date(y, m - 1, d);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((dl - today) / 86400000);
    if (goalDone(g)) return formatFullDate(dl, lang);
    if (diffDays < 0) return t("انتهى الموعد", "Overdue");
    if (diffDays === 0) return t("اليوم", "Today");
    if (diffDays <= 31) return t(`باقٍ ${diffDays} يوم`, `${diffDays} days left`);
    return formatFullDate(dl, lang);
  }

  return (
    <div style={{ padding: "16px 20px 128px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div><h1 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>{t("الأهداف", "Goals")}</h1><p style={{ fontSize: 11, color: "#94a3b8", margin: "2px 0 0" }}>{t(`${doneCount} من ${goals.length} أهداف مكتملة`, `${doneCount} of ${goals.length} goals done`)}</p></div>
        <button onClick={() => setAddOpen(true)} style={{ display: "grid", placeItems: "center", height: 40, width: 40, borderRadius: 14, border: "none", cursor: "pointer", background: `linear-gradient(135deg, ${A.a500}, ${A.b600})`, color: "#fff", boxShadow: `0 6px 16px ${A.a600}4d` }}><PlusIcon size={18} /></button>
      </div>

      <div style={{ borderRadius: 20, padding: 18, marginBottom: 16, background: `linear-gradient(135deg, ${A.a600}4d, ${A.b600}4d)`, border: `1px solid ${A.a500}4d`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div><p style={{ fontSize: 12, color: "#cbd5e1", margin: 0 }}>{t("التقدم الكلي", "Overall progress")}</p><p style={{ fontSize: 13, color: "#f0abfc", margin: "4px 0 0", display: "flex", alignItems: "center", gap: 6 }}>🌸 {t("واصل التقدم نحو أحلامك", "Keep moving toward your dreams")}</p></div>
        <ProgressRing percent={overallPct} doneLabel={t("إجمالي", "Overall")} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
        {[{ id: "all", label: t("الكل", "All"), count: goals.length }, { id: "done", label: t("مكتملة", "Done"), count: doneCount }, { id: "active", label: t("قيد التنفيذ", "Active"), count: activeCount }].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{ flexShrink: 0, borderRadius: 20, border: "none", padding: "7px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer", background: filter === f.id ? `linear-gradient(135deg, ${A.a500}, ${A.b600})` : "rgba(255,255,255,0.05)", color: filter === f.id ? "#fff" : "#94a3b8" }}>{f.label} {f.count}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}><div style={{ fontSize: 48, marginBottom: 12, opacity: 0.4 }}>🎯</div><p style={{ color: "#94a3b8", fontSize: 14 }}>{t("لا توجد أهداف", "No goals")}</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map(g => {
            const isOpen = !!expanded[g.id];
            const pct = goalProgress(g);
            const done = goalDone(g);
            const doneSteps = g.milestones.filter(m => m.done).length;
            return (
              <div key={g.id} style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.04)", padding: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                  <button onClick={() => setExpanded(e => ({ ...e, [g.id]: !e[g.id] }))} style={{ display: "flex", alignItems: "flex-start", gap: 10, flex: 1, minWidth: 0, background: "none", border: "none", cursor: "pointer", textAlign: "start" }}>
                    <ChevronDownIcon size={14} rotate={isOpen} />
                    <span style={{ fontSize: 26, flexShrink: 0 }}>{g.emoji}</span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#fff", textDecoration: done ? "line-through" : "none", opacity: done ? 0.6 : 1 }}>{g.title}</span>
                      <span style={{ display: "block", fontSize: 11, color: "#64748b", marginTop: 3 }}>{doneSteps}/{g.milestones.length} {t("مراحل", "steps")} · {deadlineLabel(g)}</span>
                    </span>
                  </button>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: g.color }}>{pct}%</span>
                    <button onClick={() => setEditGoal(g)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 4 }}><EditIcon size={13} /></button>
                  </div>
                </div>
                <div style={{ marginTop: 10, height: 6, borderRadius: 8, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: g.color, borderRadius: 8, transition: "width 0.5s" }} /></div>
                {isOpen && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 8 }}>
                    {g.milestones.map(m => (
                      <button key={m.id} onClick={() => toggleMilestone(g, m.id)} style={{ display: "flex", width: "100%", alignItems: "center", gap: 10, background: "none", border: "none", cursor: "pointer", textAlign: "start" }}>
                        <span style={{ display: "grid", placeItems: "center", height: 22, width: 22, flexShrink: 0, borderRadius: "50%", border: `2px solid ${m.done ? g.color : "#475569"}`, background: m.done ? g.color : "transparent" }}>{m.done && <CheckIcon size={12} />}</span>
                        <span style={{ fontSize: 12, color: m.done ? "#64748b" : "#e2e8f0", textDecoration: m.done ? "line-through" : "none" }}>{m.title}</span>
                      </button>
                    ))}
                    <button onClick={() => deleteGoal(g.id)} style={{ marginTop: 6, alignSelf: "flex-start", fontSize: 11, color: "#fb7185", background: "none", border: "none", cursor: "pointer" }}>{t("حذف الهدف", "Delete goal")}</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {addOpen && <GoalFormSheet onClose={() => setAddOpen(false)} onSave={f => { addGoal(f); setAddOpen(false); }} A={A} />}
      {editGoal && <GoalFormSheet goal={editGoal} onClose={() => setEditGoal(null)} onSave={p => { updateGoal(editGoal.id, p); setEditGoal(null); }} A={A} />}
    </div>
  );
}

function GoalFormSheet({ goal, onClose, onSave, A }) {
  const { t } = useI18n();
  const [title, setTitle] = useState(goal?.title || "");
  const [emoji, setEmoji] = useState(goal?.emoji || GOAL_EMOJIS[0]);
  const [color, setColor] = useState(goal?.color || "#8b5cf6");
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
        <SheetInput value={deadline} onChange={e => setDeadline(e.target.value)} placeholder="YYYY-MM-DD" accentColor={A.a500} />
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
    <Comp onClick={onClick} style={{ display: "flex", width: "100%", alignItems: "center", gap: 12, borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.04)", padding: 14, cursor: onClick ? "pointer" : "default", textAlign: "start" }}>
      <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#fff" }}>{title}</span>
        {subtitle && <span style={{ display: "block", fontSize: 10, color: "#64748b", marginTop: 2 }}>{subtitle}</span>}
      </span>
      {right}
    </Comp>
  );
}
function ToggleSwitch({ on, onClick, accentColor }) {
  return (
    <button onClick={onClick} style={{ position: "relative", height: 24, width: 42, flexShrink: 0, borderRadius: 20, border: "none", cursor: "pointer", background: on ? accentColor : "rgba(255,255,255,0.15)", transition: "background 0.2s" }}>
      <span style={{ position: "absolute", top: 2, [on ? "right" : "left"]: 2, height: 20, width: 20, borderRadius: "50%", background: "#fff", transition: "all 0.2s", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }} />
    </button>
  );
}

function MoreScreen() {
  const { lang, setLang, t, A, accent, setAccent, userName, setUserName } = useI18n();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);
  const [achOpen, setAchOpen] = useState(false);
  const [notifOn, setNotifOn] = useLS("road_set_notif", true);
  const [soundOn, setSoundOn] = useLS("road_set_sound", true);
  const [vibrateOn, setVibrateOn] = useLS("road_set_vibrate", true);
  const [weekStart, setWeekStart] = useLS("road_set_weekstart", "saturday");

  const level = 8, levelPts = 1240, nextLevelPts = 1500;
  const levelPct = Math.round((levelPts / nextLevelPts) * 100);
  const unlockedCount = ACHIEVEMENTS.filter(a => a.unlocked).length;

  return (
    <div style={{ padding: "16px 20px 128px" }}>
      <div style={{ borderRadius: 22, padding: 18, marginBottom: 16, background: `linear-gradient(135deg, ${A.a600}, ${A.b600})`, boxShadow: `0 12px 28px ${A.b600}4d` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {editingName ? (
            <input autoFocus value={nameInput} onChange={e => setNameInput(e.target.value)} onBlur={() => { setUserName(nameInput.trim() || userName); setEditingName(false); }} onKeyDown={e => e.key === "Enter" && e.currentTarget.blur()}
              style={{ flex: 1, background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 10, padding: "8px 12px", color: "#fff", fontSize: 15, fontWeight: 700, outline: "none" }} />
          ) : (
            <button onClick={() => { setNameInput(userName); setEditingName(true); }} style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", flex: 1 }}>
              <EditIcon size={13} /><span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{userName}</span>
            </button>
          )}
          <div style={{ display: "grid", placeItems: "center", height: 52, width: 52, borderRadius: 16, background: "rgba(255,255,255,0.15)", fontSize: 20, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{userName.charAt(0)}</div>
        </div>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", margin: "10px 0 0" }}>{t("عضو منذ يناير 2026", "Member since Jan 2026")}</p>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 20, background: "rgba(255,255,255,0.15)", padding: "4px 12px", fontSize: 11, fontWeight: 700, color: "#fff" }}>⭐ {t(`المستوى ${level}`, `Level ${level}`)}</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>{levelPts.toLocaleString()} {t("نقطة", "pts")}</span>
        </div>
        <div style={{ marginTop: 8, height: 8, borderRadius: 8, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}><div style={{ height: "100%", width: `${levelPct}%`, background: "linear-gradient(90deg, #fbbf24, #f59e0b)", borderRadius: 8 }} /></div>
        <p style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", margin: "6px 0 0", textAlign: lang === "ar" ? "left" : "right" }}>{t(`المستوى ${level + 1} عند ${nextLevelPts.toLocaleString()}`, `Level ${level + 1} at ${nextLevelPts.toLocaleString()}`)}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[{ value: "1", label: t("هدف محقق", "Goal done"), color: A.a400 }, { value: "4", label: t("عادات نشطة", "Habits"), color: "#34d399" }, { value: "21", label: t("أطول سلسلة", "Best streak"), color: "#fbbf24", flame: true }, { value: "127", label: t("مهمة منجزة", "Tasks done"), color: "#38bdf8" }].map(s => (
          <div key={s.label} style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.04)", padding: "10px 6px", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 2, fontSize: 16, fontWeight: 700, color: s.color }}>{s.flame && <FlameIcon size={12} />}{s.value}</div>
            <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.04)", padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>{t("إنتاجية هذا الأسبوع", "This week's productivity")}</h3>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>{t("المعدل", "Avg")} 76%</span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 90 }}>
          {[70, 45, 100, 90, 60, 100, 80].map((v, i) => {
            const labels = getDaysShort(lang);
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 9, color: "#64748b" }}>{v}%</span>
                <div style={{ width: "100%", height: 60, display: "flex", alignItems: "flex-end" }}>
                  <div style={{ width: "100%", height: `${v}%`, borderRadius: 6, background: v >= 80 ? `linear-gradient(180deg, ${A.a400}, ${A.a600})` : v === 0 ? "rgba(255,255,255,0.06)" : `${A.a500}55` }} />
                </div>
                <span style={{ fontSize: 9, color: "#64748b" }}>{labels[i]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={() => setAchOpen(true)} style={{ width: "100%", textAlign: "start", borderRadius: 18, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.04)", padding: 16, marginBottom: 16, cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}><h3 style={{ fontSize: 13, fontWeight: 700, color: "#fff", margin: 0 }}>{t("الإنجازات", "Achievements")}</h3><ChevronLeftIcon size={14} flip={lang === "en"} /></div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {ACHIEVEMENTS.slice(0, 4).map(a => (<div key={a.id} style={{ display: "grid", placeItems: "center", height: 40, width: 40, borderRadius: 12, fontSize: 18, background: a.unlocked ? `${A.a500}26` : "rgba(255,255,255,0.04)", opacity: a.unlocked ? 1 : 0.3 }}>{a.emoji}</div>))}
          <div style={{ display: "grid", placeItems: "center", height: 40, width: 40, borderRadius: 12, fontSize: 11, color: "#94a3b8", background: "rgba(255,255,255,0.04)" }}>+{ACHIEVEMENTS.length - 4}</div>
        </div>
        <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 10 }}>{t(`فتحت ${unlockedCount} من ${ACHIEVEMENTS.length} إنجازات`, `Unlocked ${unlockedCount} of ${ACHIEVEMENTS.length}`)}</p>
      </button>

      <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", margin: "0 0 12px" }}>{t("الإشعارات والتفاعل", "Notifications & feedback")}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <SettingsRow icon="🔔" title={t("الإشعارات", "Notifications")} subtitle={t("تذكيرات المهام والعادات", "Task & habit reminders")} right={<ToggleSwitch on={notifOn} onClick={() => setNotifOn(o => !o)} accentColor={A.a500} />} />
        <SettingsRow icon="🔊" title={t("الأصوات", "Sounds")} subtitle={t("صوت عند إكمال مهمة", "Sound on task completion")} right={<ToggleSwitch on={soundOn} onClick={() => setSoundOn(o => !o)} accentColor={A.a500} />} />
        <SettingsRow icon="📳" title={t("الاهتزاز", "Vibration")} subtitle={t("اهتزاز خفيف عند التفاعل", "Light haptic feedback")} right={<ToggleSwitch on={vibrateOn} onClick={() => setVibrateOn(o => !o)} accentColor={A.a500} />} />
      </div>

      <h3 style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", margin: "0 0 12px" }}>{t("الإعدادات العامة", "General settings")}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.04)", padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div><p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0 }}>{t("اللغة", "Language")}</p><p style={{ fontSize: 10, color: "#64748b", margin: "2px 0 0" }}>{t("لغة التطبيق بالكامل", "Full app language")}</p></div>
          <div style={{ display: "flex", borderRadius: 20, background: "rgba(255,255,255,0.08)", padding: 3 }}>
            <button onClick={() => setLang("en")} style={{ borderRadius: 16, border: "none", padding: "6px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", background: lang === "en" ? `linear-gradient(135deg, ${A.a500}, ${A.b600})` : "transparent", color: lang === "en" ? "#fff" : "#94a3b8" }}>English</button>
            <button onClick={() => setLang("ar")} style={{ borderRadius: 16, border: "none", padding: "6px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer", background: lang === "ar" ? `linear-gradient(135deg, ${A.a500}, ${A.b600})` : "transparent", color: lang === "ar" ? "#fff" : "#94a3b8" }}>العربية</button>
          </div>
        </div>

        <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.04)", padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div><p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0 }}>{t("بداية الأسبوع", "Week starts on")}</p><p style={{ fontSize: 10, color: "#64748b", margin: "2px 0 0" }}>{t("اليوم الأول في عرض الأسبوع", "First day shown in week view")}</p></div>
          <div style={{ display: "flex", borderRadius: 20, background: "rgba(255,255,255,0.08)", padding: 3 }}>
            <button onClick={() => setWeekStart("sunday")} style={{ borderRadius: 16, border: "none", padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", background: weekStart === "sunday" ? A.a500 : "transparent", color: weekStart === "sunday" ? "#fff" : "#94a3b8" }}>{t("الأحد", "Sun")}</button>
            <button onClick={() => setWeekStart("saturday")} style={{ borderRadius: 16, border: "none", padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", background: weekStart === "saturday" ? A.a500 : "transparent", color: weekStart === "saturday" ? "#fff" : "#94a3b8" }}>{t("السبت", "Sat")}</button>
          </div>
        </div>

        <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.04)", padding: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div><p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: 0 }}>{t("لون التطبيق (الثيم)", "App color (theme)")}</p><p style={{ fontSize: 10, color: "#64748b", margin: "2px 0 0" }}>{ACCENTS.find(a => a.id === accent)?.[lang === "ar" ? "nameAr" : "nameEn"]}</p></div>
            <span style={{ fontSize: 18 }}>🎨</span>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
            {ACCENTS.map(a => (<button key={a.id} onClick={() => setAccent(a.id)} style={{ height: 36, width: 36, borderRadius: "50%", background: a.color, border: accent === a.id ? "3px solid #fff" : "3px solid transparent", cursor: "pointer", boxShadow: accent === a.id ? `0 0 0 2px ${a.color}, 0 4px 10px ${a.color}99` : "none", display: "grid", placeItems: "center" }}>{accent === a.id && <CheckIcon size={14} />}</button>))}
          </div>
        </div>
      </div>

      <p style={{ textAlign: "center", fontSize: 10, color: "#475569", marginTop: 8 }}>{t("رود v1.0 — صُنع بحب 💜", "Road v1.0 — made with love 💜")}</p>

      {achOpen && (
        <Sheet onClose={() => setAchOpen(false)} maxH="80%">
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 16 }}>{t("جميع الإنجازات", "All achievements")}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {ACHIEVEMENTS.map(a => (
              <div key={a.id} style={{ borderRadius: 14, border: "1px solid rgba(255,255,255,0.06)", padding: 14, textAlign: "center", background: a.unlocked ? `${A.a500}14` : "rgba(255,255,255,0.02)", opacity: a.unlocked ? 1 : 0.4 }}>
                <div style={{ fontSize: 30, marginBottom: 6 }}>{a.emoji}</div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#fff", margin: 0 }}>{lang === "ar" ? a.titleAr : a.titleEn}</p>
                <p style={{ fontSize: 9, color: "#64748b", margin: "4px 0 0" }}>{lang === "ar" ? a.descAr : a.descEn}</p>
                {!a.unlocked && <p style={{ fontSize: 9, color: "#475569", margin: "4px 0 0" }}>🔒 {t("مقفل", "Locked")}</p>}
              </div>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
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
function fmtMoney(n) { return Number(n).toLocaleString("fr-DZ", { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }

function FinanceScreen() {
  const { lang, t, A } = useI18n();
  const [txs, setTxs] = useLS("road_finance_txs", []);
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
    <div style={{ padding: "16px 20px 128px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0 }}>{t("مصروف", "Finance")}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setAddType("income");  setAddOpen(true); }} style={{ borderRadius: 20, border: `1px solid #10b98150`, background: "#10b98115", color: "#34d399", padding: "6px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>+ {t("دخل", "Income")}</button>
          <button onClick={() => { setAddType("expense"); setAddOpen(true); }} style={{ borderRadius: 20, border: `1px solid #ef444450`, background: "#ef444415", color: "#fb7185", padding: "6px 14px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>- {t("مصروف", "Expense")}</button>
        </div>
      </div>

      {/* Month nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <button onClick={prevMonth} style={{ display: "grid", placeItems: "center", height: 32, width: 32, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#cbd5e1", cursor: "pointer" }}><ChevronLeftIcon size={14} flip={lang === "en"} /></button>
        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{months[fm-1]} {fy}</span>
        <button onClick={nextMonth} disabled={isCurrentMonth} style={{ display: "grid", placeItems: "center", height: 32, width: 32, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: isCurrentMonth ? "#475569" : "#cbd5e1", cursor: isCurrentMonth ? "not-allowed" : "pointer" }}><ChevronLeftIcon size={14} flip={lang === "ar"} /></button>
      </div>

      {/* Balance hero card */}
      <div style={{ borderRadius: 22, padding: 20, marginBottom: 16,
        background: `linear-gradient(225deg, ${A.a600}, ${A.b600}, ${A.b800})`,
        boxShadow: `0 16px 32px ${A.b800}4d`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, left: -30, height: 120, width: 120, borderRadius: "50%", background: "rgba(255,255,255,0.08)", filter: "blur(30px)" }} />
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>{t("الرصيد", "Balance")}</div>
        <div style={{ fontSize: 30, fontWeight: 900, color: "#fff", marginBottom: 4, direction: "ltr", textAlign: lang === "ar" ? "right" : "left" }}>
          {balance >= 0 ? "+" : ""}{fmtMoney(balance)} {t("د.ج", "DZD")}
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>{t(`معدل التوفير: ${Math.max(savingRate, 0)}%`, `Saving rate: ${Math.max(savingRate, 0)}%`)}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
          <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginBottom: 2 }}>💰 {t("دخل", "Income")}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", direction: "ltr" }}>{fmtMoney(totalIn)} {t("د.ج", "DZD")}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginBottom: 2 }}>💸 {t("مصروف", "Expense")}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", direction: "ltr" }}>{fmtMoney(totalEx)} {t("د.ج", "DZD")}</div>
          </div>
        </div>
      </div>

      {/* 6-month trend */}
      <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.04)", padding: 16, marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{t("آخر 6 أشهر", "Last 6 months")}</span>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ fontSize: 9, color: "#34d399", fontWeight: 600 }}>● {t("دخل", "Income")}</span>
            <span style={{ fontSize: 9, color: "#fb7185", fontWeight: 600 }}>● {t("مصروف", "Expense")}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80, direction: "ltr" }}>
          {trend.map((d, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: "100%", display: "flex", gap: 2, alignItems: "flex-end", height: 60 }}>
                <div style={{ flex: 1, borderRadius: "3px 3px 0 0", background: "#34d399", opacity: i === 5 ? 1 : 0.5, height: `${Math.max((d.income / maxTrend) * 56, d.income > 0 ? 3 : 1)}px` }} />
                <div style={{ flex: 1, borderRadius: "3px 3px 0 0", background: "#fb7185", opacity: i === 5 ? 1 : 0.5, height: `${Math.max((d.expense / maxTrend) * 56, d.expense > 0 ? 3 : 1)}px` }} />
              </div>
              <span style={{ fontSize: 8, color: i === 5 ? "#fff" : "#64748b" }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Expense by category */}
      {byCat.length > 0 && (
        <div style={{ borderRadius: 18, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.04)", padding: 16, marginBottom: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", display: "block", marginBottom: 12 }}>{t("المصروف حسب الفئة", "Spending by category")}</span>
          {byCat.map(cat => {
            const pct = totalEx > 0 ? Math.round((cat.total / totalEx) * 100) : 0;
            return (
              <div key={cat.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{cat.icon}</span>
                    <span style={{ fontSize: 12, color: "#e2e8f0" }}>{lang === "ar" ? cat.labelAr : cat.labelEn}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#fb7185", direction: "ltr" }}>{fmtMoney(cat.total)} {t("د.ج","DZD")}</span>
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
        <div style={{ textAlign: "center", padding: "40px 20px", borderRadius: 18, border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)" }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>💳</div>
          <p style={{ color: "#64748b", fontSize: 13 }}>{t("لا توجد معاملات هذا الشهر", "No transactions this month")}</p>
        </div>
      ) : sorted.map(tx => {
        const cat = getFinCat(tx.category);
        const color = tx.type === "income" ? "#34d399" : "#fb7185";
        return (
          <div key={tx.id} style={{ display: "flex", alignItems: "center", gap: 12, borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.03)", padding: "12px 14px", marginBottom: 8 }}>
            <div style={{ display: "grid", placeItems: "center", height: 42, width: 42, borderRadius: 12, flexShrink: 0, background: `${color}18`, fontSize: 20 }}>{cat.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.note || (lang === "ar" ? cat.labelAr : cat.labelEn)}</div>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{lang === "ar" ? cat.labelAr : cat.labelEn} · {tx.date}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 800, color, direction: "ltr" }}>{tx.type === "income" ? "+" : "-"}{fmtMoney(tx.amount)}</span>
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
  const { lang, t } = useI18n();
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
        <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>{t(`المبلغ (د.ج)`, "Amount (DZD)")}</p>
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

function BottomNav({ active, onChange }) {
  const { t, A } = useI18n();
  const items = [
    { id: "more",    label: t("المزيد",   "More"),    Icon: MoreNavIcon },
    { id: "finance", label: t("مصروف",    "Finance"), Icon: FinanceNavIcon },
    { id: "goals",   label: t("الأهداف",  "Goals"),   Icon: GoalsNavIcon },
    { id: "habits",  label: t("العادات",  "Habits"),  Icon: HabitsNavIcon },
    { id: "tasks",   label: t("المهام",   "Tasks"),   Icon: TasksNavIcon },
    { id: "home",    label: t("الرئيسية", "Home"),    Icon: HomeNavIcon },
  ];
  return (
    <div style={{ position: "absolute", bottom: 0, insetInlineStart: 0, insetInlineEnd: 0, zIndex: 30, borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(12,14,22,0.92)", backdropFilter: "blur(20px)", paddingBottom: 6 }}>
      <div style={{ display: "flex" }}>
        {items.map(it => {
          const isActive = active === it.id;
          return (
            <button key={it.id} onClick={() => onChange(it.id)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "10px 0 6px", background: "none", border: "none", cursor: "pointer", position: "relative", color: isActive ? A.a400 : "#64748b" }}>
              {isActive && <div style={{ position: "absolute", top: 0, insetInlineStart: "30%", insetInlineEnd: "30%", height: 2, borderRadius: 4, background: A.a500 }} />}
              <it.Icon active={isActive} />
              <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 400 }}>{it.label}</span>
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
  const [lang, setLang] = useLS("road_lang", "ar");
  const [accent, setAccent] = useLS("road_accent", "violet");
  const [userName, setUserName] = useLS("road_username", () => (lang === "ar" ? "سلطان العتيبي" : "John Doe"));
  const [tab, setTab] = useState("home");

  const t = (ar, en) => (lang === "ar" ? ar : en);
  const A = ACCENT_VARS[accent];

  useEffect(() => { document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"; document.documentElement.lang = lang; }, [lang]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, accent, setAccent, A, userName, setUserName }}>
      <div style={{ minHeight: "100vh", width: "100%", background: "radial-gradient(circle at top, rgba(139,92,246,0.12), transparent 60%)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
        <div style={{
          position: "relative", height: "100vh", width: "100%", maxWidth: 480, overflow: "hidden",
          background: "#0c0e16", color: "#fff", direction: lang === "ar" ? "rtl" : "ltr",
          fontFamily: lang === "ar" ? "'IBM Plex Sans Arabic', system-ui, sans-serif" : "system-ui, -apple-system, sans-serif",
        }}>
          <style>{`
            *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
            ::-webkit-scrollbar{width:0;height:0;}
            input,select,button,textarea{font-family:inherit;}
            @keyframes floatIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
            @media (min-width: 481px) {
              body { background: #05060a; }
            }
          `}</style>
          <div style={{ height: "100%", overflowY: "auto" }}>
            {tab === "home"    && <HomeScreen onNavigate={setTab} />}
            {tab === "tasks"   && <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}><TasksScreen /></div>}
            {tab === "habits"  && <HabitsScreen />}
            {tab === "goals"   && <GoalsScreen />}
            {tab === "finance" && <FinanceScreen />}
            {tab === "more"    && <MoreScreen />}
          </div>
          <BottomNav active={tab} onChange={setTab} />
        </div>
      </div>
    </I18nContext.Provider>
  );
}
