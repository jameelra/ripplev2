import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  BookOpen, Globe, Stethoscope, GraduationCap, ExternalLink,
  BookMarked, Headphones, Newspaper, AlertCircle, Search, MapPin
} from "lucide-react";
import {
  WIKI_PAGES,
  WIKI_TREATMENT_LINKS,
  CLINICAL_GUIDELINE_LINKS,
  PROVIDER_DIRECTORY_LINKS,
  TELEHEALTH_PROVIDERS,
  CURATED_RESOURCES,
} from "../lib/wikiLinks";

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, description }: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-3">
      <div className="w-9 h-9 bg-[#eef4f1] rounded-xl flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4.5 h-4.5 text-[#4a8a72]" />
      </div>
      <div>
        <h2 className="font-serif text-base font-bold text-[#1a2b22]">{title}</h2>
        {description && <p className="text-xs text-[#6b7a72] mt-0.5 leading-relaxed">{description}</p>}
      </div>
    </div>
  );
}

// ─── Resource Link Card ───────────────────────────────────────────────────────
function ResourceLink({ href, label, description, badge, icon: Icon = ExternalLink, variant = "default" }: {
  href: string;
  label: string;
  description?: string;
  badge?: string;
  icon?: React.ElementType;
  variant?: "default" | "wiki" | "guideline";
}) {
  const styles = {
    default: "bg-[#f5f0ea] border-[#e0d5c8] hover:bg-[#eef4f1] hover:border-[#c8d8d0]",
    wiki: "bg-[#eef4f1] border-[#c8d8d0] hover:bg-[#ddeee7] hover:border-[#a8c8bc]",
    guideline: "bg-[#faf5f3] border-[#e8d8d0] hover:bg-[#f5ede9] hover:border-[#d8c0b8]",
  };
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center justify-between border rounded-xl p-3.5 transition-colors group no-underline ${styles[variant]}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Icon className={`w-4 h-4 shrink-0 ${variant === "guideline" ? "text-[#c07060]" : "text-[#4a8a72]"}`} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-bold text-[#1a2b22]">{label}</p>
            {badge && (
              <span className="text-[9px] font-mono uppercase tracking-wider bg-[#4a8a72]/10 text-[#4a8a72] border border-[#4a8a72]/20 px-1.5 py-0.5 rounded-full font-bold">
                {badge}
              </span>
            )}
          </div>
          {description && <p className="text-[10px] text-[#6b7a72] leading-snug mt-0.5">{description}</p>}
        </div>
      </div>
      <ExternalLink className="w-3 h-3 text-[#9a9490] shrink-0 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
    </a>
  );
}

// ─── Country filter for telehealth ───────────────────────────────────────────
const COUNTRIES = ["All", "USA", "Canada", "Australia"] as const;
type Country = (typeof COUNTRIES)[number];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Resources() {
  const [selectedCountry, setSelectedCountry] = useState<Country>("All");

  const filteredTelehealth = TELEHEALTH_PROVIDERS.filter(
    (p) => selectedCountry === "All" || p.country === selectedCountry
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="ripple-section-title">Resources</h1>
        <p className="text-sm text-[#6b7a72] mt-1">
          Curated clinical references, provider directories, books, and trusted community knowledge
        </p>
      </div>

      {/* Menopause Wiki Hero */}
      <motion.a
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        href={WIKI_PAGES.home}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4 bg-[#eef4f1] border border-[#c8d8d0] rounded-2xl p-5 hover:bg-[#ddeee7] transition-colors group no-underline block"
      >
        <div className="w-12 h-12 bg-[#4a8a72] rounded-xl flex items-center justify-center shrink-0">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-serif text-base font-bold text-[#1a2b22]">The Menopause Wiki</p>
            <span className="text-[9px] font-mono uppercase tracking-wider bg-[#4a8a72] text-white px-2 py-0.5 rounded-full font-bold">
              Primary Source
            </span>
          </div>
          <p className="text-xs text-[#6b7a72] mt-0.5 leading-relaxed">
            The official knowledge base for r/menopause & r/perimenopause — 500,000+ members. Evidence-based information on symptoms, treatments, and navigating care.
          </p>
          <p className="text-[10px] font-mono text-[#4a8a72] mt-1.5 font-bold">menopausewiki.ca →</p>
        </div>
        <ExternalLink className="w-4 h-4 text-[#4a8a72] shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </motion.a>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          All external resources are provided for educational purposes only. Ripple does not endorse individual providers, products, or treatments. Always consult a qualified healthcare professional.
        </p>
      </div>

      {/* Wiki Sections */}
      <div className="ripple-card p-5 space-y-3">
        <SectionHeader
          icon={Search}
          title="Menopause Wiki — Key Sections"
          description="Deep-links into the most clinically useful parts of the wiki"
        />
        <div className="space-y-2">
          <ResourceLink href={WIKI_PAGES.isThisPerimenopause} label="Is This Perimenopause?" description="Self-assessment guide — symptoms, cycle changes, age ranges" icon={AlertCircle} variant="wiki" />
          <ResourceLink href={`${WIKI_PAGES.home}#symptoms-or-diagnosing-perimenopause`} label="Full Symptom List (40+ symptoms)" description="Every symptom with hormonal mechanism and clinical context" icon={BookOpen} variant="wiki" />
          <ResourceLink href={`${WIKI_PAGES.home}#hot-flashes-andor-night-sweats-vms-vasomotor-symptoms`} label="Hot Flashes & Night Sweats" description="Vasomotor symptoms — non-hormonal and hormonal treatments" icon={BookOpen} variant="wiki" />
          <ResourceLink href={`${WIKI_PAGES.home}#sleep-disruptioninsomnia`} label="Sleep Disruption & Insomnia" description="Causes, OTC options, prescription options, lifestyle changes" icon={BookOpen} variant="wiki" />
          <ResourceLink href={`${WIKI_PAGES.home}#moodscognition`} label="Moods, Brain Fog & Cognition" description="Anxiety, depression, memory — hormonal and non-hormonal approaches" icon={BookOpen} variant="wiki" />
          <ResourceLink href={`${WIKI_PAGES.home}#jointmuscular-pain`} label="Joint & Muscular Pain" description="Diagnosis and treatment of perimenopause-related joint symptoms" icon={BookOpen} variant="wiki" />
          <ResourceLink href={`${WIKI_PAGES.home}#hair-loss`} label="Hair Loss & Texture Changes" description="Androgenic causes, diagnosis, and treatment options" icon={BookOpen} variant="wiki" />
          <ResourceLink href={`${WIKI_PAGES.home}#atrophic-vaginitis-vaginal-atrophy-or-the-genitourinary-syndrome-of-menopause-gsm`} label="Vaginal Atrophy (GSM)" description="Genitourinary syndrome — local and systemic treatment options" icon={BookOpen} variant="wiki" />
          <ResourceLink href={`${WIKI_PAGES.home}#osteoporosis`} label="Osteoporosis" description="Bone density, diagnosis, prevention, and treatment" icon={BookOpen} variant="wiki" />
          <ResourceLink href={`${WIKI_PAGES.home}#weight-gain`} label="Weight Gain & Metabolic Changes" description="Visceral fat, metabolic syndrome, and management strategies" icon={BookOpen} variant="wiki" />
          <ResourceLink href={WIKI_TREATMENT_LINKS.doctorVisit.url} label="Navigating Your Medical Appointment" description="How to ask for treatment, handle dismissal, advocate for yourself" icon={Stethoscope} variant="wiki" />
          <ResourceLink href={WIKI_TREATMENT_LINKS.hormoneTherapy.url} label="Hormone Therapy (MHT/HRT)" description="Methods, dosages, timing, benefits, risks — full clinical detail" icon={Stethoscope} variant="wiki" />
          <ResourceLink href={WIKI_TREATMENT_LINKS.nonHormonal.url} label="Non-Hormonal Treatments" description="Vitamins, supplements, herbals, SERMs, lifestyle interventions" icon={Stethoscope} variant="wiki" />
          <ResourceLink href={WIKI_PAGES.fitness} label="Menopause Fitness Wiki" description="Exercise guidance specifically for perimenopause and menopause" icon={BookOpen} variant="wiki" />
        </div>
      </div>

      {/* Clinical Guidelines */}
      <div className="ripple-card p-5 space-y-3">
        <SectionHeader
          icon={GraduationCap}
          title="Clinical Guidelines & Position Statements"
          description="Peer-reviewed guidelines from leading menopause societies worldwide"
        />
        <div className="space-y-2">
          {CLINICAL_GUIDELINE_LINKS.map((g) => (
            <ResourceLink
              key={g.name}
              href={g.url}
              label={g.name}
              description={`${g.organisation} · ${g.year} · ${g.type}`}
              icon={GraduationCap}
              variant="guideline"
              badge={String(g.year)}
            />
          ))}
        </div>
      </div>

      {/* Provider Directories */}
      <div className="ripple-card p-5 space-y-3">
        <SectionHeader
          icon={Globe}
          title="Find a Menopause Specialist"
          description="Searchable directories of menopause-trained practitioners by country and region"
        />
        <div className="space-y-2">
          {PROVIDER_DIRECTORY_LINKS.map((p) => (
            <ResourceLink
              key={p.name}
              href={p.url}
              label={p.name}
              description={`${p.region}${p.note ? ` · ${p.note}` : ""}`}
              icon={MapPin}
              variant="default"
            />
          ))}
        </div>
      </div>

      {/* Telehealth Providers */}
      <div className="ripple-card p-5 space-y-3">
        <SectionHeader
          icon={Stethoscope}
          title="Telehealth Menopause Providers"
          description="Online providers offering perimenopause and menopause care. Not endorsed by Ripple — research independently."
        />
        {/* Country filter */}
        <div className="flex gap-1.5 flex-wrap">
          {COUNTRIES.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCountry(c)}
              className={`text-xs font-mono font-bold px-3 py-1.5 rounded-full border transition-all ${
                selectedCountry === c
                  ? "bg-[#4a8a72] text-white border-[#4a8a72]"
                  : "bg-[#f5f0ea] text-[#6b7a72] border-[#e0d5c8] hover:border-[#c8d8d0]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {filteredTelehealth.map((p) => (
            <ResourceLink
              key={p.name}
              href={p.url}
              label={p.name}
              description={`${p.country}${p.note ? ` · ${p.note}` : ""}`}
              icon={Stethoscope}
              variant="default"
              badge={p.country}
            />
          ))}
        </div>
        <ResourceLink
          href={WIKI_PAGES.providers}
          label="Full Provider Directory on Menopause Wiki"
          description="More providers, academic centres, and country-specific resources"
          icon={BookOpen}
          variant="wiki"
        />
      </div>

      {/* Books & Podcasts */}
      <div className="ripple-card p-5 space-y-3">
        <SectionHeader
          icon={BookMarked}
          title="Recommended Books & Resources"
          description="Curated by the Menopause Wiki community — evidence-based, doctor-authored"
        />
        <div className="space-y-2">
          {CURATED_RESOURCES.map((r) => (
            <ResourceLink
              key={r.title}
              href={r.url}
              label={r.title}
              description={r.author}
              icon={r.type === "book" ? BookMarked : r.type === "website" ? Globe : Headphones}
              variant="default"
              badge={r.type}
            />
          ))}
        </div>
      </div>

      {/* Attribution footer */}
      <div className="flex items-start gap-2 text-[10px] text-[#9a9490] bg-[#f5f0ea] rounded-xl p-3.5">
        <BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Resource links are sourced from the{" "}
          <a href={WIKI_PAGES.home} target="_blank" rel="noopener noreferrer" className="text-[#4a8a72] font-semibold hover:underline">
            Menopause Wiki
          </a>
          {" "}(menopausewiki.ca), the official knowledge base for r/menopause and r/perimenopause. All clinical guidelines link directly to their original publisher. Ripple does not host, modify, or claim ownership of any external content.
        </p>
      </div>
    </div>
  );
}
