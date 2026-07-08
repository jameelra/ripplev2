import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert, Plus, Trash2, Edit3, CheckCircle2, X, Calendar,
  Building2, User, MessageSquare, AlertCircle, ChevronDown, ChevronUp,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useVaultStore } from "../stores/vaultStore";
import { DismissalRecord } from "../../../shared/types";

// ─── Common dismissal responses (for quick-select) ────────────────────────────
const COMMON_RESPONSES = [
  "Told me it's just stress or anxiety",
  "Prescribed antidepressants without investigating hormones",
  "Said I'm too young for perimenopause",
  "Said my hormone levels are 'normal' and dismissed symptoms",
  "Recommended weight loss and exercise without further investigation",
  "Attributed symptoms to normal ageing",
  "Refused to discuss hormone therapy",
  "Said to wait and see",
  "Dismissed symptoms as psychosomatic",
];

// ─── Dismissal Form ───────────────────────────────────────────────────────────
function DismissalForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: DismissalRecord;
  onSave: (record: DismissalRecord) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().split("T")[0]);
  const [clinicName, setClinicName] = useState(initial?.clinicName ?? "");
  const [clinicianName, setClinicianName] = useState(initial?.clinicianName ?? "");
  const [symptomsReported, setSymptomsReported] = useState(
    initial?.symptomsReported?.join(", ") ?? ""
  );
  const [response, setResponse] = useState(initial?.response ?? "");
  const [wasResolved, setWasResolved] = useState(initial?.wasResolved ?? false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!clinicName.trim()) { setError("Please enter the clinic or practice name."); return; }
    if (!response.trim()) { setError("Please describe the clinician's response."); return; }

    const record: DismissalRecord = {
      id: initial?.id ?? `dismissal_${Date.now()}`,
      date,
      clinicName: clinicName.trim(),
      clinicianName: clinicianName.trim(),
      symptomsReported: symptomsReported.split(",").map((s) => s.trim()).filter(Boolean),
      response: response.trim(),
      wasResolved,
    };
    onSave(record);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] font-mono uppercase tracking-widest text-[#6b7a72] font-bold">Date of Appointment</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-[#f5f0ea] border-[#e0d5c8] text-[#1a2b22]"
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-mono uppercase tracking-widest text-[#6b7a72] font-bold">Clinic / Practice Name *</label>
          <Input
            placeholder="e.g. City Medical Centre"
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            className="bg-[#f5f0ea] border-[#e0d5c8] text-[#1a2b22]"
            required
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-mono uppercase tracking-widest text-[#6b7a72] font-bold">Clinician Name (optional)</label>
        <Input
          placeholder="e.g. Dr. Smith (or leave blank)"
          value={clinicianName}
          onChange={(e) => setClinicianName(e.target.value)}
          className="bg-[#f5f0ea] border-[#e0d5c8] text-[#1a2b22]"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] font-mono uppercase tracking-widest text-[#6b7a72] font-bold">Symptoms You Reported</label>
        <Input
          placeholder="e.g. hot flashes, brain fog, joint pain (comma-separated)"
          value={symptomsReported}
          onChange={(e) => setSymptomsReported(e.target.value)}
          className="bg-[#f5f0ea] border-[#e0d5c8] text-[#1a2b22]"
        />
        <p className="text-[10px] text-[#9a9490]">Separate multiple symptoms with commas</p>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-mono uppercase tracking-widest text-[#6b7a72] font-bold">Clinician's Response *</label>
        <textarea
          placeholder="Describe what the clinician said or did (or didn't do)…"
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          rows={3}
          className="w-full bg-[#f5f0ea] border border-[#e0d5c8] rounded-xl p-3.5 text-sm text-[#1a2b22] placeholder-[#9a9490] resize-none focus:outline-none focus:border-[#4a8a72]/50 leading-relaxed"
          required
        />
        {/* Quick-select common responses */}
        <div className="space-y-1">
          <p className="text-[10px] text-[#9a9490] font-mono">Quick select:</p>
          <div className="flex flex-wrap gap-1.5">
            {COMMON_RESPONSES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setResponse(r)}
                className="text-[10px] bg-[#f5f0ea] hover:bg-[#faf5f3] border border-[#e0d5c8] hover:border-[#e8d8d0] text-[#6b7a72] hover:text-[#c07060] px-2.5 py-1 rounded-full transition-colors"
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-[#f5f0ea] rounded-xl p-4">
        <div>
          <p className="text-sm font-bold text-[#1a2b22]">Was this concern eventually resolved?</p>
          <p className="text-xs text-[#6b7a72]">Did a subsequent appointment address this dismissal?</p>
        </div>
        <Switch
          checked={wasResolved}
          onCheckedChange={setWasResolved}
          className="data-[state=checked]:bg-[#4a8a72]"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1 text-xs font-mono border-[#e0d5c8] text-[#6b7a72]">
          Cancel
        </Button>
        <Button type="submit" className="flex-1 bg-[#c07060] hover:bg-[#a05848] text-white font-mono text-xs font-bold rounded-xl">
          <ShieldAlert className="w-4 h-4 mr-1.5" />
          {initial ? "Update Record" : "Log Dismissal"}
        </Button>
      </div>
    </form>
  );
}

// ─── Dismissal Record Card ────────────────────────────────────────────────────
function DismissalCard({
  record,
  onEdit,
  onDelete,
}: {
  record: DismissalRecord;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`ripple-card overflow-hidden ${record.wasResolved ? "border-[#c8d8d0]" : "border-[#e8d8d0]"}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 hover:bg-[#faf8f5] transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border font-bold ${
                record.wasResolved
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}>
                {record.wasResolved ? "Resolved" : "Unresolved"}
              </span>
              <span className="text-[10px] text-[#9a9490] font-mono">{record.date}</span>
            </div>
            <p className="text-sm font-bold text-[#1a2b22]">{record.clinicName}</p>
            {record.clinicianName && (
              <p className="text-xs text-[#6b7a72]">{record.clinicianName}</p>
            )}
            <p className="text-xs text-[#4a4a42] leading-relaxed line-clamp-2">{record.response}</p>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[#9a9490] shrink-0 mt-1" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#9a9490] shrink-0 mt-1" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-[#f0ebe4]"
          >
            <div className="p-4 space-y-3">
              {record.symptomsReported.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#9a9490] font-bold">Symptoms Reported</p>
                  <div className="flex flex-wrap gap-1.5">
                    {record.symptomsReported.map((s, i) => (
                      <span key={i} className="text-xs bg-[#f5f0ea] border border-[#e0d5c8] text-[#6b7a72] px-2.5 py-1 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <p className="text-[10px] font-mono uppercase tracking-widest text-[#9a9490] font-bold">Clinician's Response</p>
                <p className="text-sm text-[#3a3a32] leading-relaxed">{record.response}</p>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={onEdit}
                  className="flex items-center gap-1.5 text-xs text-[#4a8a72] font-semibold hover:underline"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={onDelete}
                  className="flex items-center gap-1.5 text-xs text-red-500 font-semibold hover:underline ml-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DismissalTracker() {
  const { dismissals, addDismissal, updateDismissal, removeDismissal, setToastNotification, setActiveTab } = useVaultStore();
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DismissalRecord | null>(null);

  const unresolvedCount = dismissals.filter((d) => !d.wasResolved).length;

  const handleSave = async (record: DismissalRecord) => {
    if (editingRecord) {
      await updateDismissal(record);
      setToastNotification({ type: "success", title: "Record Updated", description: "Dismissal record has been updated in your vault." });
      setEditingRecord(null);
    } else {
      await addDismissal(record);
      setToastNotification({ type: "success", title: "Dismissal Logged", description: "This record has been encrypted and saved. It will appear in your Evidence Engine brief." });
      setShowForm(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this dismissal record? This cannot be undone.")) {
      await removeDismissal(id);
      setToastNotification({ type: "info", title: "Record Deleted", description: "Dismissal record has been removed from your vault." });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="ripple-section-title">Dismissal Tracker</h1>
          <p className="text-sm text-[#6b7a72] mt-1">
            Log instances of medical dismissal — these feed directly into your Evidence Engine brief
          </p>
        </div>
        {!showForm && !editingRecord && (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-[#c07060] hover:bg-[#a05848] text-white font-mono text-xs font-bold px-4 py-2.5 rounded-xl shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Log Dismissal
          </Button>
        )}
      </div>

      {/* Why this matters */}
      <div className="ripple-card p-4 bg-[#faf5f3] border-[#e8d8d0] space-y-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#c07060]" />
          <p className="text-sm font-bold text-[#1a2b22]">Why Track Dismissals?</p>
        </div>
        <p className="text-xs text-[#6b7a72] leading-relaxed">
          Nearly 40% of women feel misdiagnosed during perimenopause. Logging dismissals creates a formal record that is automatically included in your GP appointment brief — giving you documented evidence to counter future dismissal and advocate for appropriate care.
        </p>
        <button
          onClick={() => setActiveTab("evidence_engine")}
          className="text-xs text-[#c07060] font-semibold hover:underline flex items-center gap-1"
        >
          <FileText className="w-3.5 h-3.5" />
          View in Evidence Engine →
        </button>
      </div>

      {/* Stats */}
      {dismissals.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="ripple-card p-4 text-center">
            <p className="font-serif text-3xl font-bold text-[#c07060]">{dismissals.length}</p>
            <p className="text-xs text-[#6b7a72] mt-1">Total Records</p>
          </div>
          <div className="ripple-card p-4 text-center">
            <p className={`font-serif text-3xl font-bold ${unresolvedCount > 0 ? "text-red-600" : "text-emerald-600"}`}>
              {unresolvedCount}
            </p>
            <p className="text-xs text-[#6b7a72] mt-1">Unresolved</p>
          </div>
        </div>
      )}

      {/* Add / Edit Form */}
      <AnimatePresence>
        {(showForm || editingRecord) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="ripple-card p-5 border-[#e8d8d0] bg-[#faf5f3]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#c07060]" />
                <p className="font-serif text-base font-bold text-[#1a2b22]">
                  {editingRecord ? "Edit Dismissal Record" : "Log a New Dismissal"}
                </p>
              </div>
              <button
                onClick={() => { setShowForm(false); setEditingRecord(null); }}
                className="p-1.5 text-[#9a9490] hover:text-[#1a2b22] hover:bg-[#f5f0ea] rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <DismissalForm
              initial={editingRecord ?? undefined}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingRecord(null); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Records list */}
      {dismissals.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs text-[#9a9490] font-mono">
            {dismissals.length} record{dismissals.length !== 1 ? "s" : ""} · sorted by most recent
          </p>
          {[...dismissals]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((record) => (
              <DismissalCard
                key={record.id}
                record={record}
                onEdit={() => { setEditingRecord(record); setShowForm(false); }}
                onDelete={() => handleDelete(record.id)}
              />
            ))}
        </div>
      ) : !showForm ? (
        <div className="ripple-card p-8 text-center space-y-3">
          <div className="w-14 h-14 bg-[#faf5f3] border border-[#e8d8d0] rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7 text-[#c07060]" />
          </div>
          <div className="space-y-1">
            <p className="font-serif text-base font-bold text-[#1a2b22]">No dismissal records yet</p>
            <p className="text-xs text-[#6b7a72] max-w-sm mx-auto leading-relaxed">
              If a doctor has dismissed or minimised your symptoms, log it here. Your records will be included in your Evidence Engine brief.
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-[#c07060] hover:bg-[#a05848] text-white font-mono text-xs font-bold px-6 py-3 rounded-xl"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Log Your First Dismissal
          </Button>
        </div>
      ) : null}

      {/* Evidence Engine link */}
      {dismissals.length > 0 && (
        <div className="ripple-card p-4 bg-[#eef4f1] border-[#c8d8d0] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#4a8a72] shrink-0" />
            <div>
              <p className="text-sm font-bold text-[#1a2b22]">
                {dismissals.length} record{dismissals.length !== 1 ? "s" : ""} ready for your GP brief
              </p>
              <p className="text-xs text-[#6b7a72]">
                Your dismissal history will appear in the Evidence Engine appointment brief.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("evidence_engine")}
            className="shrink-0 bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold px-4 py-2 rounded-xl transition-colors"
          >
            Generate Brief →
          </button>
        </div>
      )}

      {/* Footer note */}
      <div className="flex items-start gap-2 text-[10px] text-[#9a9490] bg-[#f5f0ea] rounded-xl p-3.5">
        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          All dismissal records are encrypted in your secure vault using AES-GCM encryption. They are never transmitted to our servers in readable form. Only you can access this data.
        </p>
      </div>
    </div>
  );
}
