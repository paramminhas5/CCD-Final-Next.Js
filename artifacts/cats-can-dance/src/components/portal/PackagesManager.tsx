"use client";
/**
 * PackagesManager — Artist Portal tab
 *
 * Lets an artist define their booking packages:
 *   - "Club Night 90 min — ₹40,000 from"
 *   - "Festival Headline — ₹1,20,000 flat"
 *   - "B2B Set — ₹25,000 from"
 *
 * UX goals (Airbnb host parity):
 *   • Cards for existing packages with inline edit.
 *   • Drag-handle for reordering (sort_order).
 *   • "Add package" sheet that slides up.
 *   • Active / inactive toggle so artist can pause without deleting.
 *   • Preview badge exactly as promoters will see it on /book.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus, Pencil, Trash2, GripVertical, Check, X, Loader2,
  Eye, EyeOff, ChevronDown, ChevronUp, Clock, IndianRupee,
} from "lucide-react";
import { toast } from "sonner";
import { useSafeAuth } from "@/lib/clerk-safe";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ArtistPackage {
  id: string;
  artist_id: string;
  name: string;
  description: string | null;
  suitable_for: string[];
  price_inr: number;
  price_is_minimum: boolean;
  travel_included: boolean;
  travel_note: string | null;
  set_duration_min: number | null;
  set_type: "solo" | "b2b" | "live" | "live_pa";
  tech_rider: string | null;
  is_active: boolean;
  sort_order: number;
}

const SET_TYPES = [
  { value: "solo",    label: "Solo DJ Set" },
  { value: "b2b",     label: "B2B Set" },
  { value: "live",    label: "Live" },
  { value: "live_pa", label: "Live PA" },
];

const EVENT_TYPES = [
  "Club night", "Festival", "Rooftop party", "Warehouse rave",
  "Corporate event", "Private party", "Wedding", "Conference", "Other",
];

const ACCENT_COLOURS = [
  "bg-acid-yellow text-ink",
  "bg-magenta text-cream",
  "bg-electric-blue text-cream",
  "bg-lime text-ink",
  "bg-orange text-ink",
];

function packageAccent(pkg: ArtistPackage): string {
  return ACCENT_COLOURS[pkg.name.charCodeAt(0) % ACCENT_COLOURS.length];
}

function fmtPrice(pkg: ArtistPackage): string {
  const formatted = `₹${pkg.price_inr.toLocaleString("en-IN")}`;
  return pkg.price_is_minimum ? `from ${formatted}` : formatted;
}

// ── Empty form ────────────────────────────────────────────────────────────────
const emptyForm = () => ({
  name: "",
  description: "",
  suitable_for: [] as string[],
  price_inr: "",
  price_is_minimum: true,
  travel_included: false,
  travel_note: "",
  set_duration_min: "",
  set_type: "solo" as ArtistPackage["set_type"],
  tech_rider: "",
  is_active: true,
});
type FormState = ReturnType<typeof emptyForm>;

// ── Package Form (shared for Add + Edit) ──────────────────────────────────────
function PackageForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: FormState;
  onSave: (f: FormState) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const set = <K extends keyof FormState>(k: K) =>
    (e: { target: { value: string } }) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  function toggleSuitableFor(type: string) {
    setForm(f => ({
      ...f,
      suitable_for: f.suitable_for.includes(type)
        ? f.suitable_for.filter(t => t !== type)
        : [...f.suitable_for, type],
    }));
  }

  return (
    <div className="space-y-5">
      {/* Name + type row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="font-display text-xs uppercase text-ink/60 tracking-widest block mb-1">Package Name *</span>
          <input
            value={form.name}
            onChange={set("name")}
            placeholder="e.g. Club Night Set"
            className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-ink focus:outline-none focus:bg-acid-yellow/20 transition-colors"
          />
        </label>
        <label className="block">
          <span className="font-display text-xs uppercase text-ink/60 tracking-widest block mb-1">Set Type</span>
          <select
            value={form.set_type}
            onChange={set("set_type")}
            className="w-full border-4 border-ink px-3 py-2 bg-cream font-display text-xs uppercase text-ink focus:outline-none"
          >
            {SET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
      </div>

      {/* Pricing row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="font-display text-xs uppercase text-ink/60 tracking-widest block mb-1">Price (INR) *</span>
          <div className="relative">
            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink/40" />
            <input
              type="number"
              min={0}
              value={form.price_inr}
              onChange={set("price_inr")}
              placeholder="40000"
              className="w-full border-4 border-ink pl-8 pr-3 py-2 bg-cream font-sans text-ink focus:outline-none focus:bg-acid-yellow/20 transition-colors"
            />
          </div>
        </label>
        <label className="block">
          <span className="font-display text-xs uppercase text-ink/60 tracking-widest block mb-1">Set Duration (min)</span>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink/40" />
            <input
              type="number"
              min={0}
              value={form.set_duration_min}
              onChange={set("set_duration_min")}
              placeholder="90"
              className="w-full border-4 border-ink pl-8 pr-3 py-2 bg-cream font-sans text-ink focus:outline-none focus:bg-acid-yellow/20 transition-colors"
            />
          </div>
        </label>
      </div>

      {/* Price modifiers */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => setForm(f => ({ ...f, price_is_minimum: !f.price_is_minimum }))}
            className={`w-5 h-5 border-4 border-ink flex items-center justify-center transition-colors ${form.price_is_minimum ? "bg-ink" : "bg-cream"}`}
          >
            {form.price_is_minimum && <Check className="w-3 h-3 text-cream" />}
          </div>
          <span className="font-display text-xs uppercase text-ink">Price is minimum (show "from ₹X")</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => setForm(f => ({ ...f, travel_included: !f.travel_included }))}
            className={`w-5 h-5 border-4 border-ink flex items-center justify-center transition-colors ${form.travel_included ? "bg-ink" : "bg-cream"}`}
          >
            {form.travel_included && <Check className="w-3 h-3 text-cream" />}
          </div>
          <span className="font-display text-xs uppercase text-ink">Travel included</span>
        </label>
      </div>

      {/* Travel note */}
      {form.travel_included && (
        <label className="block">
          <span className="font-display text-xs uppercase text-ink/60 tracking-widest block mb-1">Travel note (optional)</span>
          <input
            value={form.travel_note}
            onChange={set("travel_note")}
            placeholder="e.g. Includes travel within Karnataka"
            className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm text-ink focus:outline-none focus:bg-acid-yellow/20 transition-colors"
          />
        </label>
      )}

      {/* Description */}
      <label className="block">
        <span className="font-display text-xs uppercase text-ink/60 tracking-widest block mb-1">Description (promoter-facing)</span>
        <textarea
          value={form.description}
          onChange={set("description")}
          rows={2}
          placeholder="What does this package include? Sound requirements, set structure, vibe…"
          className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm text-ink focus:outline-none focus:bg-acid-yellow/20 transition-colors resize-none"
        />
      </label>

      {/* Tech rider */}
      <label className="block">
        <span className="font-display text-xs uppercase text-ink/60 tracking-widest block mb-1">Tech rider (short)</span>
        <textarea
          value={form.tech_rider}
          onChange={set("tech_rider")}
          rows={2}
          placeholder="e.g. 2× CDJ-3000, DJM-900NXS2, monitor on stage…"
          className="w-full border-4 border-ink px-3 py-2 bg-cream font-sans text-sm text-ink focus:outline-none focus:bg-acid-yellow/20 transition-colors resize-none"
        />
      </label>

      {/* Suitable for */}
      <div>
        <span className="font-display text-xs uppercase text-ink/60 tracking-widest block mb-2">Suitable for</span>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => toggleSuitableFor(type)}
              className={`font-display text-xs uppercase px-3 py-1.5 border-2 border-ink transition-colors ${
                form.suitable_for.includes(type)
                  ? "bg-ink text-cream"
                  : "bg-cream text-ink hover:bg-acid-yellow"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t-4 border-ink">
        <button
          type="button"
          disabled={saving || !form.name || !form.price_inr}
          onClick={() => onSave(form)}
          className="flex items-center gap-2 bg-ink text-cream font-display text-sm uppercase px-5 py-2.5 border-4 border-ink chunk-shadow hover:bg-magenta hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {saving ? "Saving…" : "Save Package"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="font-display text-sm uppercase px-4 py-2.5 border-4 border-ink text-ink/60 hover:bg-ink/10 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Package Card ──────────────────────────────────────────────────────────────
function PackageCard({
  pkg,
  onEdit,
  onToggleActive,
  onDelete,
  dragHandleProps,
}: {
  pkg: ArtistPackage;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  dragHandleProps?: {
    onMouseDown?: () => void;
    [key: string]: any;
  };
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const accent = packageAccent(pkg);

  return (
    <div className={`relative border-4 border-ink bg-cream chunk-shadow transition-transform ${!pkg.is_active ? "opacity-50" : ""}`}>
      {/* Colour bar */}
      <div className={`h-2 ${accent.split(" ")[0]}`} />

      <div className="p-5">
        <div className="flex items-start gap-3">
          {/* Drag handle */}
          <div
            {...dragHandleProps}
            className="mt-1 cursor-grab active:cursor-grabbing text-ink/30 hover:text-ink/60 transition-colors shrink-0"
          >
            <GripVertical className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-display text-xl text-ink uppercase leading-tight">{pkg.name}</h3>
              {!pkg.is_active && (
                <span className="font-display text-[10px] uppercase px-2 py-0.5 bg-ink/20 text-ink/60 border border-ink/30">
                  Paused
                </span>
              )}
            </div>

            {/* Price + duration row */}
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className={`font-display text-sm uppercase px-2 py-0.5 border-2 border-ink ${accent}`}>
                {fmtPrice(pkg)}
              </span>
              {pkg.set_duration_min && (
                <span className="flex items-center gap-1 font-display text-xs uppercase text-ink/60">
                  <Clock className="w-3 h-3" />{pkg.set_duration_min} min
                </span>
              )}
              <span className="font-display text-xs uppercase text-ink/60 border border-ink/20 px-2 py-0.5">
                {SET_TYPES.find(t => t.value === pkg.set_type)?.label ?? pkg.set_type}
              </span>
              {pkg.travel_included && (
                <span className="font-display text-xs uppercase text-ink/60">✈ Travel incl.</span>
              )}
            </div>

            {/* Suitable for tags */}
            {pkg.suitable_for.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {pkg.suitable_for.map(t => (
                  <span key={t} className="font-display text-[10px] uppercase px-1.5 py-0.5 bg-acid-yellow text-ink border border-ink">
                    {t}
                  </span>
                ))}
              </div>
            )}

            {pkg.description && (
              <p className="text-sm text-ink/60 line-clamp-2">{pkg.description}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-1.5 shrink-0">
            <button
              onClick={onEdit}
              className="w-8 h-8 border-2 border-ink flex items-center justify-center hover:bg-acid-yellow transition-colors"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onToggleActive}
              className="w-8 h-8 border-2 border-ink flex items-center justify-center hover:bg-acid-yellow transition-colors"
              title={pkg.is_active ? "Pause" : "Activate"}
            >
              {pkg.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            {confirmDelete ? (
              <button
                onClick={onDelete}
                className="w-8 h-8 border-2 border-magenta bg-magenta flex items-center justify-center"
                title="Confirm delete"
              >
                <Check className="w-3.5 h-3.5 text-cream" />
              </button>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                onBlur={() => setTimeout(() => setConfirmDelete(false), 200)}
                className="w-8 h-8 border-2 border-ink flex items-center justify-center hover:border-magenta hover:text-magenta transition-colors"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PackagesManager({ artistId }: { artistId: string }) {
  const { getToken } = useSafeAuth();
  const [packages, setPackages] = useState<ArtistPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/artist-packages?artist_id=${artistId}`);
      const data = await r.json();
      // Show all (including inactive) for the portal owner
      const all = await fetch(`/api/artist-packages?artist_id=${artistId}`);
      const allData = await all.json();
      setPackages(Array.isArray(allData) ? allData : []);
    } catch {
      toast.error("Failed to load packages");
    } finally {
      setLoading(false);
    }
  }, [artistId]);

  useEffect(() => { load(); }, [load]);

  async function authHeaders() {
    const token = await getToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async function handleSave(form: FormState, editingId: string | null) {
    setSaving(true);
    try {
      const hdrs = await authHeaders();
      const payload = {
        name: form.name,
        description: form.description || null,
        suitable_for: form.suitable_for,
        price_inr: Number(form.price_inr),
        price_is_minimum: form.price_is_minimum,
        travel_included: form.travel_included,
        travel_note: form.travel_note || null,
        set_duration_min: form.set_duration_min ? Number(form.set_duration_min) : null,
        set_type: form.set_type,
        tech_rider: form.tech_rider || null,
        is_active: form.is_active,
      };

      if (editingId) {
        await fetch(`/api/artist-packages/${editingId}`, {
          method: "PATCH",
          headers: hdrs,
          body: JSON.stringify(payload),
        });
        toast.success("Package updated");
      } else {
        await fetch("/api/artist-packages", {
          method: "POST",
          headers: hdrs,
          body: JSON.stringify(payload),
        });
        toast.success("Package added");
      }
      setShowForm(false);
      setEditId(null);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(pkg: ArtistPackage) {
    const hdrs = await authHeaders();
    await fetch(`/api/artist-packages/${pkg.id}`, {
      method: "PATCH",
      headers: hdrs,
      body: JSON.stringify({ is_active: !pkg.is_active }),
    });
    toast.success(pkg.is_active ? "Package paused" : "Package activated");
    load();
  }

  async function handleDelete(pkg: ArtistPackage) {
    const hdrs = await authHeaders();
    await fetch(`/api/artist-packages/${pkg.id}`, { method: "DELETE", headers: hdrs });
    toast.success("Package removed");
    load();
  }

  // ── Drag-to-reorder ────────────────────────────────────────────────────────
  function onDragStart(idx: number) { dragItem.current = idx; }
  function onDragEnter(idx: number) { dragOver.current = idx; }

  async function onDragEnd() {
    if (dragItem.current === null || dragOver.current === null) return;
    if (dragItem.current === dragOver.current) return;

    const reordered = [...packages];
    const [moved] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOver.current, 0, moved);
    dragItem.current = null;
    dragOver.current = null;

    const withOrder = reordered.map((p, i) => ({ ...p, sort_order: i }));
    setPackages(withOrder);

    const hdrs = await authHeaders();
    await fetch("/api/artist-packages/reorder", {
      method: "POST",
      headers: hdrs,
      body: JSON.stringify({ order: withOrder.map(p => ({ id: p.id, sort_order: p.sort_order })) }),
    });
  }

  const editingPkg = editId ? packages.find(p => p.id === editId) : null;
  const formInitial: FormState = editingPkg
    ? {
        name: editingPkg.name,
        description: editingPkg.description ?? "",
        suitable_for: editingPkg.suitable_for,
        price_inr: String(editingPkg.price_inr),
        price_is_minimum: editingPkg.price_is_minimum,
        travel_included: editingPkg.travel_included,
        travel_note: editingPkg.travel_note ?? "",
        set_duration_min: editingPkg.set_duration_min ? String(editingPkg.set_duration_min) : "",
        set_type: editingPkg.set_type,
        tech_rider: editingPkg.tech_rider ?? "",
        is_active: editingPkg.is_active,
      }
    : emptyForm();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 border-b-4 border-ink pb-4">
        <div>
          <h2 className="font-display text-2xl uppercase text-ink">Booking Packages</h2>
          <p className="text-sm text-ink/60 mt-0.5">
            Define what you offer. Promoters see these when booking you.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditId(null); }}
            className="flex items-center gap-2 bg-ink text-cream font-display text-xs uppercase px-4 py-2.5 border-4 border-ink chunk-shadow hover:bg-magenta hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
          >
            <Plus className="w-4 h-4" /> Add Package
          </button>
        )}
      </div>

      {/* Add / Edit form */}
      {(showForm || editId) && (
        <div className="border-4 border-ink bg-acid-yellow/10 p-5 chunk-shadow">
          <h3 className="font-display text-sm uppercase text-ink/70 mb-4">
            {editId ? "Edit Package" : "New Package"}
          </h3>
          <PackageForm
            initial={formInitial}
            onSave={form => handleSave(form, editId)}
            onCancel={() => { setShowForm(false); setEditId(null); }}
            saving={saving}
          />
        </div>
      )}

      {/* Package list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="border-4 border-ink bg-ink/5 animate-pulse h-28" />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="border-4 border-ink bg-cream p-10 text-center">
          <div className="w-14 h-14 border-4 border-ink bg-acid-yellow flex items-center justify-center mx-auto mb-4">
            <IndianRupee className="w-6 h-6 text-ink" />
          </div>
          <p className="font-display text-xl text-ink uppercase mb-2">No packages yet</p>
          <p className="text-sm text-ink/60 mb-5">
            Add your first package — promoters will see it when requesting a booking.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-ink text-cream font-display text-xs uppercase px-5 py-2.5 border-4 border-ink chunk-shadow hover:bg-magenta transition-colors"
          >
            <Plus className="w-4 h-4" /> Add First Package
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="font-display text-xs uppercase text-ink/40 tracking-widest">
            Drag to reorder — top package appears first to promoters
          </p>
          {packages.map((pkg, idx) => (
            <div
              key={pkg.id}
              draggable
              onDragStart={() => onDragStart(idx)}
              onDragEnter={() => onDragEnter(idx)}
              onDragEnd={onDragEnd}
              onDragOver={e => e.preventDefault()}
            >
              <PackageCard
                pkg={pkg}
                onEdit={() => { setEditId(pkg.id); setShowForm(false); }}
                onToggleActive={() => handleToggleActive(pkg)}
                onDelete={() => handleDelete(pkg)}
                dragHandleProps={{
                  onMouseDown: () => {},
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Promoter-view tip */}
      {packages.filter(p => p.is_active).length > 0 && (
        <div className="border-4 border-ink/30 bg-electric-blue/10 p-4 flex gap-3 items-start">
          <Eye className="w-4 h-4 text-electric-blue shrink-0 mt-0.5" />
          <div>
            <p className="font-display text-xs uppercase text-ink mb-0.5">What promoters see</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {packages.filter(p => p.is_active).map(p => (
                <span key={p.id} className={`font-display text-xs uppercase px-2 py-1 border-2 border-ink ${packageAccent(p)}`}>
                  {p.name} · {fmtPrice(p)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
