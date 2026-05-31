"use client";
/**
 * CalendarManager — Artist Portal calendar tab.
 *
 * Airbnb-host-style month grid:
 *   • Click or drag across days to select a date range.
 *   • A sheet slides up to label the block (tour leg / unavailable / available).
 *   • Existing blocks are colour-coded on the grid.
 *   • Click an existing block to edit or delete it.
 *   • Individual confirmed gigs (artist_dates) are rendered read-only.
 *   • Month navigation — shows 2 months side-by-side on desktop.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, Check, Loader2, Trash2, MapPin, Info } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@clerk/react";


// ── Types ─────────────────────────────────────────────────────────────────────
export interface AvailabilityBlock {
  id: string;
  artist_id: string;
  kind: "tour_leg" | "unavailable" | "available";
  label: string | null;
  city: string | null;
  cities: string[];
  start_date: string; // YYYY-MM-DD
  end_date: string;
  weekly_days: number[] | null;
  fee_override_inr: number | null;
  notes: string | null;
  is_public: boolean;
}

interface Gig {
  id: string;
  event_date: string;
  city: string;
  venue: string | null;
  status: "confirmed" | "tentative" | "available";
}

// ── Constants ─────────────────────────────────────────────────────────────────
const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

type BlockKind = "tour_leg" | "unavailable" | "available";

const KIND_META: Record<BlockKind, { label: string; bg: string; text: string; border: string; dot: string }> = {
  tour_leg:    { label: "Tour Leg",    bg: "bg-electric-blue",  text: "text-cream", border: "border-electric-blue", dot: "bg-electric-blue" },
  unavailable: { label: "Unavailable", bg: "bg-magenta",        text: "text-cream", border: "border-magenta",       dot: "bg-magenta" },
  available:   { label: "Open Slot",   bg: "bg-lime",           text: "text-ink",   border: "border-lime",          dot: "bg-lime" },
};

// ── Date utilities ─────────────────────────────────────────────────────────────
function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fromISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function isoMin(a: string, b: string): string { return a < b ? a : b; }
function isoMax(a: string, b: string): string { return a > b ? a : b; }
function isoRange(a: string, b: string): string[] {
  const out: string[] = [];
  let cur = fromISO(isoMin(a, b));
  const end = fromISO(isoMax(a, b));
  while (cur <= end) { out.push(toISO(cur)); cur = addDays(cur, 1); }
  return out;
}


// ── Block form (slide-up sheet) ────────────────────────────────────────────────
const emptyBlockForm = (start = "", end = "") => ({
  kind: "available" as BlockKind,
  label: "",
  city: "",
  cities_raw: "",
  fee_override_inr: "",
  notes: "",
  is_public: true,
  weekly_days: [] as number[],
  start_date: start,
  end_date: end,
});
type BlockForm = ReturnType<typeof emptyBlockForm>;

function BlockSheet({
  form,
  onChange,
  onSave,
  onDelete,
  onClose,
  saving,
  isEdit,
}: {
  form: BlockForm;
  onChange: (f: BlockForm) => void;  onSave: () => void;
  onDelete?: () => void;
  onClose: () => void;
  saving: boolean;
  isEdit: boolean;
}) {
  const set = <K extends keyof BlockForm>(k: K, v: BlockForm[K]) =>
    onChange({ ...form, [k]: v });

  const fmt = (iso: string) => {
    if (!iso) return "";
    try { return fromISO(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" }); }
    catch { return iso; }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/70 backdrop-blur-sm" onClick={onClose} />
      {/* Sheet */}
      <div className="relative w-full sm:max-w-lg bg-cream border-4 border-ink max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-4 border-ink bg-acid-yellow">
          <div>
            <p className="font-display text-xs uppercase text-ink/60 tracking-widest">
              {isEdit ? "Edit Block" : "Add Availability Block"}
            </p>
            <p className="font-display text-xl text-ink uppercase">
              {fmt(form.start_date)}
              {form.start_date !== form.end_date ? ` → ${fmt(form.end_date)}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="w-9 h-9 border-4 border-ink bg-ink text-cream flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Date range (editable) */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="font-display text-xs uppercase text-ink/60 block mb-1">From *</span>
              <input type="date" value={form.start_date}
                onChange={e => set("start_date", e.target.value)}
                className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm text-ink focus:outline-none" />
            </label>
            <label className="block">
              <span className="font-display text-xs uppercase text-ink/60 block mb-1">To *</span>
              <input type="date" value={form.end_date}
                onChange={e => set("end_date", e.target.value)}
                className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm text-ink focus:outline-none" />
            </label>
          </div>

          {/* Kind selector */}
          <div>
            <span className="font-display text-xs uppercase text-ink/60 block mb-2">Block Type *</span>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(KIND_META) as [BlockKind, typeof KIND_META[BlockKind]][]).map(([k, meta]) => (
                <button key={k} type="button" onClick={() => set("kind", k)}
                  className={`py-3 border-4 border-ink font-display text-xs uppercase transition-all ${
                    form.kind === k ? `${meta.bg} ${meta.text}` : "bg-cream text-ink hover:bg-acid-yellow"
                  }`}>
                  {meta.label}
                </button>
              ))}
            </div>
          </div>


          {/* Label */}
          <label className="block">
            <span className="font-display text-xs uppercase text-ink/60 block mb-1">Label (optional)</span>
            <input value={form.label} onChange={e => set("label", e.target.value)}
              placeholder={form.kind === "tour_leg" ? "e.g. Goa winter tour" : form.kind === "unavailable" ? "e.g. Recording week" : "e.g. Available in Mumbai"}
              className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm text-ink focus:outline-none focus:bg-acid-yellow/20" />
          </label>

          {/* Cities */}
          <label className="block">
            <span className="font-display text-xs uppercase text-ink/60 block mb-1">
              {form.kind === "tour_leg" ? "Cities on this leg (comma-separated)" : "City"}
            </span>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink/40" />
              <input value={form.cities_raw} onChange={e => set("cities_raw", e.target.value)}
                placeholder={form.kind === "tour_leg" ? "Goa, Mumbai, Pune" : "Bengaluru"}
                className="w-full border-4 border-ink pl-8 pr-3 py-2 bg-cream font-sans text-sm text-ink focus:outline-none focus:bg-acid-yellow/20" />
            </div>
          </label>

          {/* Weekly days (for recurring tour leg) */}
          <div>
            <span className="font-display text-xs uppercase text-ink/60 block mb-2">Repeat on days (leave blank for every day)</span>
            <div className="flex gap-1.5 flex-wrap">
              {DAYS.map((d, i) => (
                <button key={d} type="button"
                  onClick={() => set("weekly_days", form.weekly_days.includes(i)
                    ? form.weekly_days.filter(x => x !== i)
                    : [...form.weekly_days, i])}
                  className={`w-9 h-9 border-2 border-ink font-display text-xs transition-colors ${
                    form.weekly_days.includes(i) ? "bg-ink text-cream" : "bg-cream text-ink hover:bg-acid-yellow"
                  }`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Fee override */}
          {form.kind !== "unavailable" && (
            <label className="block">
              <span className="font-display text-xs uppercase text-ink/60 block mb-1">Fee for this leg (INR, optional override)</span>
              <input type="number" min={0} value={form.fee_override_inr}
                onChange={e => set("fee_override_inr", e.target.value)}
                placeholder="e.g. 35000"
                className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm text-ink focus:outline-none focus:bg-acid-yellow/20" />
            </label>
          )}

          {/* Notes */}
          <label className="block">
            <span className="font-display text-xs uppercase text-ink/60 block mb-1">Notes (visible to promoters)</span>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
              placeholder="Any context for promoters…"
              className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm text-ink focus:outline-none resize-none" />
          </label>

          {/* Public toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => set("is_public", !form.is_public)}
              className={`w-5 h-5 border-4 border-ink flex items-center justify-center transition-colors ${form.is_public ? "bg-ink" : "bg-cream"}`}>
              {form.is_public && <Check className="w-3 h-3 text-cream" />}
            </div>
            <span className="font-display text-xs uppercase text-ink">Show on public profile</span>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t-4 border-ink">
            <button disabled={saving || !form.start_date || !form.end_date} onClick={onSave}
              className="flex items-center gap-2 bg-ink text-cream font-display text-sm uppercase px-5 py-2.5 border-4 border-ink chunk-shadow hover:bg-magenta transition-all disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? "Saving…" : isEdit ? "Update Block" : "Add Block"}
            </button>
            {isEdit && onDelete && (
              <button onClick={onDelete}
                className="flex items-center gap-2 font-display text-sm uppercase px-4 py-2.5 border-4 border-magenta text-magenta hover:bg-magenta hover:text-cream transition-all">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// ── Month grid ─────────────────────────────────────────────────────────────────
function MonthGrid({
  year, month,
  dayMap,
  gigMap,
  selecting,
  selStart,
  selEnd,
  hoveredDay,
  onDayMouseDown,
  onDayMouseEnter,
  onDayClick,
}: {
  year: number; month: number;
  dayMap: Map<string, AvailabilityBlock>;
  gigMap: Map<string, Gig>;
  selecting: boolean;
  selStart: string | null;
  selEnd: string | null;
  hoveredDay: string | null;
  onDayMouseDown: (iso: string) => void;
  onDayMouseEnter: (iso: string) => void;
  onDayClick: (iso: string) => void;
}) {
  const today = toISO(new Date());
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Selection range
  const selRange = useMemo(() => {
    if (!selStart) return new Set<string>();
    const end = selecting && hoveredDay ? hoveredDay : (selEnd ?? selStart);
    return new Set(isoRange(selStart, end));
  }, [selStart, selEnd, hoveredDay, selecting]);

  const cells: (null | number)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="select-none">
      <p className="font-display text-sm uppercase text-ink mb-3 text-center">
        {MONTHS[month]} {year}
      </p>
      {/* Day labels */}
      <div className="grid grid-cols-7 gap-0.5 mb-0.5">
        {DAYS.map(d => (
          <div key={d} className="text-center font-display text-[10px] uppercase text-ink/40 py-1">{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const block = dayMap.get(iso);
          const gig = gigMap.get(iso);
          const inSel = selRange.has(iso);
          const isPast = iso < today;
          const isToday = iso === today;

          // Determine visual state
          let cellCls = "bg-cream text-ink/70 hover:bg-acid-yellow/40 cursor-pointer";
          let innerMark = "";

          if (block) {
            const meta = KIND_META[block.kind];
            cellCls = `${meta.bg} ${meta.text} cursor-pointer hover:opacity-80`;
          }
          if (gig) {
            if (gig.status === "confirmed") { cellCls = "bg-ink text-cream cursor-default"; innerMark = "●"; }
            else if (gig.status === "tentative") { cellCls = "bg-ink/40 text-cream cursor-default"; innerMark = "◌"; }
          }
          if (inSel) cellCls = "bg-acid-yellow text-ink cursor-pointer ring-2 ring-ink";
          if (isPast) cellCls += " opacity-30 !cursor-default pointer-events-none";
          if (isToday) cellCls += " ring-2 ring-ink ring-offset-1";

          return (
            <div
              key={iso}
              className={`relative aspect-square flex flex-col items-center justify-center border border-ink/10 text-xs font-display transition-colors ${cellCls}`}
              onMouseDown={() => !isPast && onDayMouseDown(iso)}
              onMouseEnter={() => !isPast && onDayMouseEnter(iso)}
              onClick={() => !isPast && onDayClick(iso)}
            >
              {day}
              {innerMark && <span className="text-[8px] leading-none mt-0.5 opacity-70">{innerMark}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ── Main component ────────────────────────────────────────────────────────────
export default function CalendarManager({ artistId }: { artistId: string }) {
  const { getToken } = useAuth();

  // Calendar navigation: start from current month
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed

  // Data
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection state (Airbnb drag-select)
  const [selecting, setSelecting] = useState(false);
  const [selStart, setSelStart] = useState<string | null>(null);
  const [selEnd, setSelEnd] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  // Sheet state
  const [sheet, setSheet] = useState<{ open: boolean; editBlock: AvailabilityBlock | null }>({ open: false, editBlock: null });
  const [blockForm, setBlockForm] = useState<BlockForm>(emptyBlockForm());
  const [saving, setSaving] = useState(false);

  // Load 6 months of data centered on view
  const loadRange = useCallback(async () => {
    setLoading(true);
    try {
      const from = toISO(new Date(viewYear, viewMonth - 1, 1));
      const to   = toISO(new Date(viewYear, viewMonth + 3, 0));
      const hdrs = await authHeaders();
      const [bRes, gRes] = await Promise.all([
        fetch(`/api/availability-blocks/mine?from=${from}&to=${to}`, { headers: hdrs }),
        fetch(`/api/artist-dates-public?artist_id=${artistId}&from=${from}&to=${to}`),
      ]);
      const bData = await bRes.json();
      const gData = gRes.ok ? await gRes.json() : [];
      setBlocks(Array.isArray(bData) ? bData : []);
      setGigs(Array.isArray(gData) ? gData : []);
    } catch { toast.error("Failed to load calendar"); }
    finally { setLoading(false); }
  }, [artistId, viewYear, viewMonth]);

  useEffect(() => { loadRange(); }, [loadRange]);

  async function authHeaders(): Promise<Record<string, string>> {
    const token = await getToken();
    return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  }

  // ── Day maps (memoised for render perf) ───────────────────────────────────
  const dayMap = useMemo(() => {
    const m = new Map<string, AvailabilityBlock>();
    for (const b of blocks) {
      const days = isoRange(b.start_date, b.end_date);
      for (const iso of days) {
        // later blocks (higher priority) override earlier ones
        const existing = m.get(iso);
        if (!existing || b.kind === "unavailable") m.set(iso, b);
      }
    }
    return m;
  }, [blocks]);

  const gigMap = useMemo(() => {
    const m = new Map<string, Gig>();
    for (const g of gigs) { m.set(g.event_date.slice(0, 10), g); }
    return m;
  }, [gigs]);

  // ── Drag-select handlers ───────────────────────────────────────────────────
  function handleDayMouseDown(iso: string) {
    setSelecting(true);
    setSelStart(iso);
    setSelEnd(iso);
    setHoveredDay(iso);
  }

  function handleDayMouseEnter(iso: string) {
    setHoveredDay(iso);
    if (selecting) setSelEnd(iso);
  }

  useEffect(() => {
    function onMouseUp() {
      if (selecting && selStart) {
        const end = selEnd ?? selStart;
        const start = isoMin(selStart, end);
        const finalEnd = isoMax(selStart, end);
        setSelecting(false);

        // If clicking on an existing block → open edit sheet
        const clickedBlock = dayMap.get(start);
        if (start === finalEnd && clickedBlock) {
          openEditSheet(clickedBlock);
          setSelStart(null); setSelEnd(null);
          return;
        }
        // Otherwise open add sheet for the range
        openAddSheet(start, finalEnd);
      }
    }
    window.addEventListener("mouseup", onMouseUp);
    return () => window.removeEventListener("mouseup", onMouseUp);
  }, [selecting, selStart, selEnd, dayMap]);

  function handleDayClick(iso: string) {
    // Single click on a block — open edit sheet
    const block = dayMap.get(iso);
    if (block && !selecting) openEditSheet(block);
  }

  // ── Sheet helpers ──────────────────────────────────────────────────────────
  function openAddSheet(start: string, end: string) {
    setBlockForm(emptyBlockForm(start, end));
    setSheet({ open: true, editBlock: null });
  }

  function openEditSheet(block: AvailabilityBlock) {
    setBlockForm({
      kind: block.kind,
      label: block.label ?? "",
      city: block.city ?? "",
      cities_raw: block.cities.join(", "),
      fee_override_inr: block.fee_override_inr ? String(block.fee_override_inr) : "",
      notes: block.notes ?? "",
      is_public: block.is_public,
      weekly_days: block.weekly_days ?? [],
      start_date: block.start_date,
      end_date: block.end_date,
    });
    setSheet({ open: true, editBlock: block });
  }

  function closeSheet() {
    setSheet({ open: false, editBlock: null });
    setSelStart(null); setSelEnd(null);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const hdrs = await authHeaders();
      const cities = blockForm.cities_raw.split(",").map(s => s.trim()).filter(Boolean);
      const payload = {
        kind: blockForm.kind,
        label: blockForm.label || null,
        city: cities[0] ?? null,
        cities,
        start_date: blockForm.start_date,
        end_date: blockForm.end_date,
        weekly_days: blockForm.weekly_days.length ? blockForm.weekly_days : null,
        fee_override_inr: blockForm.fee_override_inr ? Number(blockForm.fee_override_inr) : null,
        notes: blockForm.notes || null,
        is_public: blockForm.is_public,
      };

      if (sheet.editBlock) {
        await fetch(`/api/availability-blocks/${sheet.editBlock.id}`, { method: "PATCH", headers: hdrs, body: JSON.stringify(payload) });
        toast.success("Block updated");
      } else {
        await fetch("/api/availability-blocks", { method: "POST", headers: hdrs, body: JSON.stringify(payload) });
        toast.success("Block added");
      }
      closeSheet();
      loadRange();
    } catch (e: any) { toast.error(e.message ?? "Save failed"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!sheet.editBlock) return;
    setSaving(true);
    try {
      const hdrs = await authHeaders();
      await fetch(`/api/availability-blocks/${sheet.editBlock.id}`, { method: "DELETE", headers: hdrs });
      toast.success("Block removed");
      closeSheet();
      loadRange();
    } catch (e: any) { toast.error(e.message ?? "Delete failed"); }
    finally { setSaving(false); }
  }

  // ── Month navigation ───────────────────────────────────────────────────────
  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  // Second month (desktop side-by-side)
  const month2 = viewMonth === 11 ? 0 : viewMonth + 1;
  const year2  = viewMonth === 11 ? viewYear + 1 : viewYear;

  return (
    <div className="space-y-6" onMouseLeave={() => { if (selecting) setHoveredDay(null); }}>
      {/* Header */}
      <div className="flex items-end justify-between gap-4 border-b-4 border-ink pb-4">
        <div>
          <h2 className="font-display text-2xl uppercase text-ink">Availability Calendar</h2>
          <p className="text-sm text-ink/60 mt-0.5">
            Click a day or drag across a range to block out dates.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="w-9 h-9 border-4 border-ink flex items-center justify-center hover:bg-acid-yellow transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={nextMonth} className="w-9 h-9 border-4 border-ink flex items-center justify-center hover:bg-acid-yellow transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {(Object.entries(KIND_META) as [BlockKind, typeof KIND_META[BlockKind]][]).map(([k, meta]) => (
          <span key={k} className="flex items-center gap-1.5 font-display text-xs uppercase">
            <span className={`w-3 h-3 border-2 border-ink ${meta.bg}`} />
            {meta.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 font-display text-xs uppercase">
          <span className="w-3 h-3 border-2 border-ink bg-ink" /> Confirmed gig
        </span>
        <span className="flex items-center gap-1.5 font-display text-xs uppercase">
          <span className="w-3 h-3 border-2 border-ink bg-acid-yellow" /> Selected
        </span>
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="h-64 bg-ink/5 animate-pulse border-4 border-ink" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MonthGrid year={viewYear} month={viewMonth}
            dayMap={dayMap} gigMap={gigMap}
            selecting={selecting} selStart={selStart} selEnd={selEnd} hoveredDay={hoveredDay}
            onDayMouseDown={handleDayMouseDown}
            onDayMouseEnter={handleDayMouseEnter}
            onDayClick={handleDayClick}
          />
          <MonthGrid year={year2} month={month2}
            dayMap={dayMap} gigMap={gigMap}
            selecting={selecting} selStart={selStart} selEnd={selEnd} hoveredDay={hoveredDay}
            onDayMouseDown={handleDayMouseDown}
            onDayMouseEnter={handleDayMouseEnter}
            onDayClick={handleDayClick}
          />
        </div>
      )}

      {/* Instruction tip */}
      <div className="flex gap-2 items-start border-4 border-ink/20 bg-electric-blue/10 p-3">
        <Info className="w-4 h-4 text-electric-blue shrink-0 mt-0.5" />
        <p className="text-xs text-ink/70 font-sans leading-relaxed">
          <strong className="font-display uppercase">Tip:</strong> Drag across multiple days to create a tour leg in one go.
          Click any coloured block to edit or delete it. Confirmed gigs (●) are read-only — manage those in the <strong>Dates</strong> tab.
        </p>
      </div>

      {/* Block list summary */}
      {blocks.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-display text-sm uppercase text-ink/60 border-b border-ink/20 pb-2">Upcoming Blocks</h3>
          {blocks
            .filter(b => b.end_date >= toISO(new Date()))
            .sort((a, b) => a.start_date.localeCompare(b.start_date))
            .map(b => {
              const meta = KIND_META[b.kind];
              return (
                <div key={b.id}
                  onClick={() => openEditSheet(b)}
                  className="flex items-center gap-3 border-2 border-ink bg-cream p-3 cursor-pointer hover:bg-acid-yellow/20 transition-colors group">
                  <span className={`w-2.5 h-2.5 shrink-0 ${meta.bg} border border-ink`} />
                  <div className="flex-1 min-w-0">
                    <span className="font-display text-xs uppercase text-ink/80">
                      {b.start_date === b.end_date ? b.start_date : `${b.start_date} → ${b.end_date}`}
                    </span>
                    {(b.label || b.cities.length > 0) && (
                      <span className="ml-2 text-xs text-ink/50">
                        {[b.label, b.cities.slice(0, 2).join(", ")].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </div>
                  <span className={`font-display text-[10px] uppercase px-2 py-0.5 border border-ink ${meta.bg} ${meta.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
                    Edit
                  </span>
                </div>
              );
            })}
        </div>
      )}

      {/* Sheet */}
      {sheet.open && (
        <BlockSheet
          form={blockForm}
          onChange={setBlockForm}
          onSave={handleSave}
          onDelete={sheet.editBlock ? handleDelete : undefined}
          onClose={closeSheet}
          saving={saving}
          isEdit={!!sheet.editBlock}
        />
      )}
    </div>
  );
}
