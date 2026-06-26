import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ChevronDown, ChevronUp, ExternalLink, BookOpen,
  Stethoscope, GraduationCap, AlertCircle, CheckCircle2, X, FlaskConical
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  CLINICAL_KNOWLEDGE_BASE,
  CATEGORIES,
  CATEGORY_COLORS,
  ClinicalEntry,
  SymptomCategory,
  TreatmentOption,
  searchEntries,
  getEntriesByCategory,
} from "../lib/clinicalKnowledgeBase";

// ─── Evidence Badge ───────────────────────────────────────────────────────────
function EvidenceBadge({ level }: { level: TreatmentOption["evidence"] }) {
  const styles = {
    Strong:   "bg-emerald-50 text-emerald-700 border-emerald-200",
    Moderate: "bg-amber-50 text-amber-700 border-amber-200",
    Emerging: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border font-bold ${styles[level]}`}>
      {level} evidence
    </span>
  );
}

// ─── Treatment Type Badge ─────────────────────────────────────────────────────
function TreatmentTypeBadge({ type }: { type: TreatmentOption["type"] }) {
  const styles = {
    Hormonal:       "bg-[#faf5f3] text-[#c07060] border-[#e8d8d0]",
    "Non-Hormonal": "bg-[#eef4f1] text-[#4a8a72] border-[#c8d8d0]",
    Lifestyle:      "bg-amber-50 text-amber-700 border-amber-200",
    Supplement:     "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border font-bold ${styles[type]}`}>
      {type}
    </span>
  );
}

// ─── Entry Card (collapsed) ───────────────────────────────────────────────────
function EntryCard({ entry, onExpand }: { entry: ClinicalEntry; onExpand: () => void }) {
  const colors = CATEGORY_COLORS[entry.category];
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onExpand}
      className="w-full text-left ripple-card p-4 hover:bg-[#faf8f5] transition-colors group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border font-bold ${colors.bg} ${colors.text} ${colors.border}`}>
              {entry.category}
            </span>
            <span className="text-[10px] text-[#9a9490] font-mono">{entry.prevalence}</span>
          </div>
          <h3 className="font-serif text-base font-bold text-[#1a2b22]">{entry.name}</h3>
          <p className="text-xs text-[#6b7a72] leading-relaxed line-clamp-2">{entry.tagline}</p>
        </div>
        <ChevronDown className="w-4 h-4 text-[#9a9490] shrink-0 mt-1 group-hover:text-[#4a8a72] transition-colors" />
      </div>
    </motion.button>
  );
}

// ─── Entry Detail (expanded) ──────────────────────────────────────────────────
function EntryDetail({ entry, onClose }: { entry: ClinicalEntry; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"overview" | "treatments" | "gp_guide">("overview");
  const colors = CATEGORY_COLORS[entry.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="ripple-card overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 border-b border-[#f0ebe4]">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border font-bold ${colors.bg} ${colors.text} ${colors.border}`}>
                {entry.category}
              </span>
              <span className="text-[10px] text-[#9a9490] font-mono">{entry.prevalence}</span>
              <span className="text-[10px] text-[#9a9490] font-mono">{entry.onsetPhase}</span>
            </div>
            <h2 className="font-serif text-xl font-bold text-[#1a2b22]">{entry.name}</h2>
            {entry.aliases.length > 0 && (
              <p className="text-[10px] text-[#9a9490]">Also known as: {entry.aliases.join(", ")}</p>
            )}
            <p className="text-sm text-[#4a4a42] leading-relaxed italic">{entry.tagline}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#9a9490] hover:text-[#1a2b22] hover:bg-[#f5f0ea] rounded-lg transition shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#f5f0ea] p-1 rounded-xl mt-4">
          {([
            { id: "overview" as const, label: "The Science" },
            { id: "treatments" as const, label: `Treatments (${entry.treatments.length})` },
            { id: "gp_guide" as const, label: "GP Script" },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id ? "bg-white text-[#1a2b22] shadow-sm" : "text-[#6b7a72] hover:text-[#1a2b22]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-5">
        {/* Overview tab */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#9a9490] font-bold">The Mechanism</p>
              <p className="text-sm text-[#3a3a32] leading-relaxed">{entry.mechanism}</p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#9a9490] font-bold">Hormones Involved</p>
              <div className="flex flex-wrap gap-1.5">
                {entry.hormoneInvolved.map((h) => (
                  <span key={h} className="text-xs bg-[#faf5f3] border border-[#e8d8d0] text-[#c07060] px-2.5 py-1 rounded-full font-semibold">
                    {h}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#9a9490] font-bold">Clinical Context</p>
              <p className="text-sm text-[#3a3a32] leading-relaxed">{entry.clinicalContext}</p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#9a9490] font-bold">What to Track</p>
              <ul className="space-y-1.5">
                {entry.whatToTrack.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#4a4a42]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#4a8a72] shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1">
              <p className="text-[10px] font-mono uppercase tracking-widest text-amber-700 font-bold">When to See a Doctor</p>
              <p className="text-xs text-amber-800 leading-relaxed">{entry.whenToSeeADoctor}</p>
            </div>

            {/* Citations */}
            <div className="space-y-2 border-t border-[#f0ebe4] pt-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#9a9490] font-bold">Clinical Sources</p>
              {entry.citations.map((c, i) => (
                <div key={i} className="bg-[#f5f0ea] rounded-xl p-3 space-y-1">
                  <p className="text-[10px] text-[#6b7a72] leading-relaxed italic">"{c.text}"</p>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[10px] text-[#4a8a72] font-semibold hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {c.source} · {c.year}
                  </a>
                </div>
              ))}
            </div>

            {/* Wiki link */}
            <a
              href={entry.wikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-[#4a8a72] font-semibold hover:underline"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Read more on the Menopause Wiki →
            </a>
          </div>
        )}

        {/* Treatments tab */}
        {activeTab === "treatments" && (
          <div className="space-y-3">
            {entry.treatments.map((t, i) => (
              <div key={i} className="bg-[#f5f0ea] rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <p className="text-sm font-bold text-[#1a2b22]">{t.name}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <TreatmentTypeBadge type={t.type} />
                    <EvidenceBadge level={t.evidence} />
                  </div>
                </div>
                <p className="text-xs text-[#4a4a42] leading-relaxed">{t.description}</p>
              </div>
            ))}
            <div className="flex items-start gap-2 text-[10px] text-[#9a9490] bg-[#f5f0ea] rounded-xl p-3">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <p>Treatment information is for educational purposes only. Always discuss treatment options with a qualified healthcare provider before starting any new treatment.</p>
            </div>
          </div>
        )}

        {/* GP Script tab */}
        {activeTab === "gp_guide" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#9a9490] font-bold">Say this to your doctor</p>
              <div className="bg-[#eef4f1] border border-[#c8d8d0] rounded-xl p-4">
                <p className="text-sm text-[#1a2b22] leading-relaxed italic">"{entry.gpConversationScript}"</p>
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(entry.gpConversationScript)}
                className="text-[10px] text-[#4a8a72] font-mono font-bold hover:underline"
              >
                Copy to clipboard →
              </button>
            </div>

            <div className="bg-[#faf5f3] border border-[#e8d8d0] rounded-xl p-4 space-y-2">
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#c07060] font-bold">Common Dismissive Responses — and How to Respond</p>
              <div className="space-y-2 text-xs text-[#4a4a42]">
                <p><span className="font-bold text-[#c07060]">Doctor says:</span> "You're too young for menopause."</p>
                <p className="text-[#6b7a72] leading-relaxed">→ "Perimenopause can begin in the early 40s and sometimes earlier. The average duration is 4–10 years. My symptoms align with the clinical presentation described in NAMS guidelines."</p>
              </div>
              <div className="space-y-2 text-xs text-[#4a4a42] pt-2 border-t border-[#e8d8d0]">
                <p><span className="font-bold text-[#c07060]">Doctor says:</span> "Your hormone levels are normal."</p>
                <p className="text-[#6b7a72] leading-relaxed">→ "NAMS guidelines state that perimenopause is a clinical diagnosis based on symptoms and age, not hormone levels. Hormone levels fluctuate daily and a single test cannot capture the full picture."</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ClinicalKnowledgeBase() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<SymptomCategory | "All">("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredEntries = useMemo(() => {
    let entries = CLINICAL_KNOWLEDGE_BASE;
    if (query.trim()) {
      entries = searchEntries(query);
    } else if (selectedCategory !== "All") {
      entries = getEntriesByCategory(selectedCategory);
    }
    return entries;
  }, [query, selectedCategory]);

  const expandedEntry = expandedId ? CLINICAL_KNOWLEDGE_BASE.find((e) => e.id === expandedId) : null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="ripple-section-title">Clinical Knowledge Base</h1>
        <p className="text-sm text-[#6b7a72] mt-1">
          Original clinical entries — 10 symptoms explained with mechanisms, treatments, and GP scripts
        </p>
      </div>

      {/* Proprietary badge */}
      <div className="flex items-center gap-3 bg-[#eef4f1] border border-[#c8d8d0] rounded-xl p-3.5">
        <FlaskConical className="w-5 h-5 text-[#4a8a72] shrink-0" />
        <div>
          <p className="text-xs font-bold text-[#1a2b22]">Ripple Original Clinical Content</p>
          <p className="text-[10px] text-[#6b7a72] leading-relaxed">
            Written in Ripple's own voice, citing NAMS, BMS, NIH, and peer-reviewed literature. Proprietary intellectual property.
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Educational purposes only.</strong> This content does not constitute medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9490]" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelectedCategory("All"); setExpandedId(null); }}
          placeholder="Search symptoms, mechanisms, treatments…"
          className="pl-9 bg-[#f5f0ea] border-[#e0d5c8] text-[#1a2b22] placeholder-[#9a9490]"
        />
      </div>

      {/* Category filter */}
      {!query && (
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => { setSelectedCategory("All"); setExpandedId(null); }}
            className={`text-xs font-mono font-bold px-3 py-1.5 rounded-full border transition-all ${
              selectedCategory === "All"
                ? "bg-[#1a2b22] text-white border-[#1a2b22]"
                : "bg-[#f5f0ea] text-[#6b7a72] border-[#e0d5c8] hover:border-[#c8d8d0]"
            }`}
          >
            All ({CLINICAL_KNOWLEDGE_BASE.length})
          </button>
          {CATEGORIES.map((cat) => {
            const colors = CATEGORY_COLORS[cat];
            const count = CLINICAL_KNOWLEDGE_BASE.filter((e) => e.category === cat).length;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setExpandedId(null); }}
                className={`text-xs font-mono font-bold px-3 py-1.5 rounded-full border transition-all ${
                  selectedCategory === cat
                    ? `${colors.bg} ${colors.text} ${colors.border}`
                    : "bg-[#f5f0ea] text-[#6b7a72] border-[#e0d5c8] hover:border-[#c8d8d0]"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Results count */}
      <p className="text-xs text-[#9a9490] font-mono">
        {filteredEntries.length} entr{filteredEntries.length !== 1 ? "ies" : "y"}
        {query && ` matching "${query}"`}
        {selectedCategory !== "All" && !query && ` in ${selectedCategory}`}
      </p>

      {/* Entry list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredEntries.map((entry) =>
            expandedEntry?.id === entry.id ? (
              <EntryDetail
                key={entry.id}
                entry={entry}
                onClose={() => setExpandedId(null)}
              />
            ) : (
              <EntryCard
                key={entry.id}
                entry={entry}
                onExpand={() => setExpandedId(entry.id)}
              />
            )
          )}
        </AnimatePresence>

        {filteredEntries.length === 0 && (
          <div className="ripple-card p-6 text-center space-y-2">
            <Search className="w-8 h-8 text-[#9a9490] mx-auto" />
            <p className="font-serif text-base font-bold text-[#1a2b22]">No entries found</p>
            <p className="text-xs text-[#6b7a72]">Try a different search term or browse by category.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-start gap-2 text-[10px] text-[#9a9490] bg-[#f5f0ea] rounded-xl p-3.5">
        <GraduationCap className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          All clinical content cites peer-reviewed sources from NAMS, BMS, IMS, NIH, and published research. Content is reviewed against current clinical guidelines. For the most up-to-date information, always consult primary sources and your healthcare provider.
        </p>
      </div>
    </div>
  );
}
