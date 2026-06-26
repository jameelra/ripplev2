// ─── Ripple v2 — Menopause Wiki Link Map ──────────────────────────────────────
// Maps symptoms, topics, and features to their exact Menopause Wiki sections.
// Source: menopausewiki.ca (The official wiki for r/menopause & r/perimenopause)
// Attribution: All links open the Menopause Wiki with full credit to its authors.

export const WIKI_BASE = "https://menopausewiki.ca";

// ── Core Pages ────────────────────────────────────────────────────────────────
export const WIKI_PAGES = {
  home: `${WIKI_BASE}/`,
  isThisPerimenopause: `${WIKI_BASE}/is-this-perimenopause/`,
  resources: `${WIKI_BASE}/resources/`,
  providers: `${WIKI_BASE}/providers/`,
  fitness: `${WIKI_BASE}/fitness/`,
} as const;

// ── Symptom Deep-Links (anchors within the main wiki page) ────────────────────
export const WIKI_SYMPTOM_LINKS: Record<string, { url: string; label: string; section: string }> = {
  // Vasomotor
  hotFlashes: {
    url: `${WIKI_BASE}/#hot-flashes-andor-night-sweats-vms-vasomotor-symptoms`,
    label: "Hot Flashes & Night Sweats",
    section: "Vasomotor Symptoms",
  },
  nightSweats: {
    url: `${WIKI_BASE}/#hot-flashes-andor-night-sweats-vms-vasomotor-symptoms`,
    label: "Night Sweats",
    section: "Vasomotor Symptoms",
  },

  // Sleep
  sleepLatency: {
    url: `${WIKI_BASE}/#sleep-disruptioninsomnia`,
    label: "Sleep Disruption & Insomnia",
    section: "Sleep",
  },

  // Musculoskeletal
  jointPain: {
    url: `${WIKI_BASE}/#jointmuscular-pain`,
    label: "Joint & Muscular Pain",
    section: "Musculoskeletal",
  },

  // Cognitive & Psychological
  brainFog: {
    url: `${WIKI_BASE}/#moodscognition`,
    label: "Brain Fog & Cognition",
    section: "Moods & Cognition",
  },
  irritability: {
    url: `${WIKI_BASE}/#moodscognition`,
    label: "Irritability & Mood Swings",
    section: "Moods & Cognition",
  },
  anxiety: {
    url: `${WIKI_BASE}/#moodscognition`,
    label: "Anxiety & Mood Changes",
    section: "Moods & Cognition",
  },

  // Energy & Cardiovascular
  fatigue: {
    url: `${WIKI_BASE}/#take-control-of-your-health-be-the-healthiest-you-can-be`,
    label: "Fatigue & Energy",
    section: "Health & Wellbeing",
  },
  heartPalpitations: {
    url: `${WIKI_BASE}/#symptoms-or-diagnosing-perimenopause`,
    label: "Heart Palpitations",
    section: "Symptoms",
  },

  // Other Physical
  breastTenderness: {
    url: `${WIKI_BASE}/#symptoms-or-diagnosing-perimenopause`,
    label: "Breast Tenderness",
    section: "Symptoms",
  },
  bloating: {
    url: `${WIKI_BASE}/#weight-gain`,
    label: "Bloating & Weight Changes",
    section: "Weight & Metabolism",
  },
  postCarbCrash: {
    url: `${WIKI_BASE}/#weight-gain`,
    label: "Metabolic Changes",
    section: "Weight & Metabolism",
  },
};

// ── Reverse Lookup Symptom Links ──────────────────────────────────────────────
export const WIKI_REVERSE_LOOKUP_LINKS: Record<string, string> = {
  "burning tongue": `${WIKI_BASE}/#symptoms-or-diagnosing-perimenopause`,
  "burning mouth": `${WIKI_BASE}/#symptoms-or-diagnosing-perimenopause`,
  "formication": `${WIKI_BASE}/#symptoms-or-diagnosing-perimenopause`,
  "skin crawling": `${WIKI_BASE}/#symptoms-or-diagnosing-perimenopause`,
  "frozen shoulder": `${WIKI_BASE}/#jointmuscular-pain`,
  "shoulder pain": `${WIKI_BASE}/#jointmuscular-pain`,
  "hair thinning": `${WIKI_BASE}/#hair-loss`,
  "hair loss": `${WIKI_BASE}/#hair-loss`,
  "heart palpitations": `${WIKI_BASE}/#symptoms-or-diagnosing-perimenopause`,
  "palpitations": `${WIKI_BASE}/#symptoms-or-diagnosing-perimenopause`,
  "electric shock": `${WIKI_BASE}/#symptoms-or-diagnosing-perimenopause`,
  "dry eyes": `${WIKI_BASE}/#symptoms-or-diagnosing-perimenopause`,
  "tinnitus": `${WIKI_BASE}/#symptoms-or-diagnosing-perimenopause`,
  "ringing ears": `${WIKI_BASE}/#symptoms-or-diagnosing-perimenopause`,
  "vaginal dryness": `${WIKI_BASE}/#atrophic-vaginitis-vaginal-atrophy-or-the-genitourinary-syndrome-of-menopause-gsm`,
  "vaginal atrophy": `${WIKI_BASE}/#atrophic-vaginitis-vaginal-atrophy-or-the-genitourinary-syndrome-of-menopause-gsm`,
  "osteoporosis": `${WIKI_BASE}/#osteoporosis`,
  "bone density": `${WIKI_BASE}/#osteoporosis`,
  "weight gain": `${WIKI_BASE}/#weight-gain`,
  "belly fat": `${WIKI_BASE}/#weight-gain`,
  "sleep": `${WIKI_BASE}/#sleep-disruptioninsomnia`,
  "insomnia": `${WIKI_BASE}/#sleep-disruptioninsomnia`,
  "hot flash": `${WIKI_BASE}/#hot-flashes-andor-night-sweats-vms-vasomotor-symptoms`,
  "night sweat": `${WIKI_BASE}/#hot-flashes-andor-night-sweats-vms-vasomotor-symptoms`,
  "brain fog": `${WIKI_BASE}/#moodscognition`,
  "memory": `${WIKI_BASE}/#moodscognition`,
  "anxiety": `${WIKI_BASE}/#moodscognition`,
  "depression": `${WIKI_BASE}/#moodscognition`,
  "joint pain": `${WIKI_BASE}/#jointmuscular-pain`,
  "irregular periods": `${WIKI_BASE}/#irregular-periodsbleeding`,
  "bleeding": `${WIKI_BASE}/#irregular-periodsbleeding`,
};

// ── Treatment Reference Links ─────────────────────────────────────────────────
export const WIKI_TREATMENT_LINKS = {
  hormoneTherapy: {
    url: `${WIKI_BASE}/#hormonal-therapy-from-peri-to-postmenopause`,
    label: "Hormone Therapy (MHT/HRT)",
    description: "Methods, dosages, benefits, risks, and timing",
  },
  nonHormonal: {
    url: `${WIKI_BASE}/#non-hormonal-therapy-from-peri-to-postmenopause`,
    label: "Non-Hormonal Treatments",
    description: "Vitamins, supplements, herbals, SERMs",
  },
  testosterone: {
    url: `${WIKI_BASE}/#testosterone-therapy-optional`,
    label: "Testosterone Therapy",
    description: "Optional add-on therapy for libido and energy",
  },
  startingHRT: {
    url: `${WIKI_BASE}/#what-to-expect-when-starting-or-changing-hormone-therapy`,
    label: "Starting Hormone Therapy",
    description: "What to expect when beginning MHT",
  },
  doctorVisit: {
    url: `${WIKI_BASE}/#navigating-your-medical-appointment`,
    label: "Navigating Your GP Appointment",
    description: "How to ask for treatment, handle dismissal",
  },
} as const;

// ── Clinical Guideline Links ──────────────────────────────────────────────────
export const CLINICAL_GUIDELINE_LINKS = [
  {
    name: "NAMS 2022 Hormone Therapy Position Statement",
    organisation: "The Menopause Society (NAMS)",
    url: "https://menopause.org/wp-content/uploads/professional/nams-2022-hormone-therapy-position-statement.pdf",
    type: "PDF",
    year: 2022,
  },
  {
    name: "NAMS 2023 Non-Hormone Therapy Position Statement",
    organisation: "The Menopause Society (NAMS)",
    url: "https://menopause.org/wp-content/uploads/professional/2023-nonhormone-therapy-position-statement.pdf",
    type: "PDF",
    year: 2023,
  },
  {
    name: "NICE Menopause Guidelines",
    organisation: "National Institute for Health and Care Excellence (UK)",
    url: "https://www.nice.org.uk/guidance/ng23",
    type: "Guideline",
    year: 2015,
  },
  {
    name: "IMS White Paper: Menopause and MHT in 2024",
    organisation: "International Menopause Society",
    url: "https://www.imsociety.org/wp-content/uploads/2024/09/Menopause-and-MHT-in-2024-addressing-the-key-controversies-an-International-Menopause-Society-White-Paper.pdf",
    type: "PDF",
    year: 2024,
  },
  {
    name: "BMS Menopause Specialist Directory",
    organisation: "British Menopause Society",
    url: "https://thebms.org.uk/find-a-menopause-specialist/",
    type: "Directory",
    year: 2024,
  },
] as const;

// ── Provider Directory Links by Region ───────────────────────────────────────
export const PROVIDER_DIRECTORY_LINKS = [
  {
    region: "Global / USA",
    name: "The Menopause Society (NAMS) — Find a Practitioner",
    url: "https://portal.menopause.org/NAMS/NAMS/Directory/Menopause-Practitioner.aspx",
    note: "Includes USA, Canada, Brazil, Japan, France, New Zealand, and more",
  },
  {
    region: "United Kingdom",
    name: "British Menopause Society — Find a Specialist",
    url: "https://thebms.org.uk/find-a-menopause-specialist/",
    note: "Includes online-only clinics",
  },
  {
    region: "Australia",
    name: "Australasian Menopause Society",
    url: "https://www.menopause.org.au/health-info/find-an-ams-doctor",
    note: "Some providers offer telehealth",
  },
  {
    region: "Canada",
    name: "Canadian Menopause Society",
    url: "https://www.sigmamenopause.com/",
    note: null,
  },
  {
    region: "International",
    name: "ISSWSH — International Society for Women's Sexual Health",
    url: "https://app.v1.statusplus.net/membership/provider/index?society=isswsh",
    note: "USA, Canada, Brazil, Japan, Italy, Australia, and more",
  },
  {
    region: "France",
    name: "France Menopause Society",
    url: "https://gemvi.org/liens-utiles/",
    note: null,
  },
  {
    region: "Spain",
    name: "AEEM — Asociación Española para el Estudio de la Menopausia",
    url: "https://aeem.es/para-la-mujer/",
    note: null,
  },
] as const;

// ── Telehealth Providers by Country ──────────────────────────────────────────
export const TELEHEALTH_PROVIDERS = [
  // USA
  { country: "USA", name: "Midi Health", url: "https://www.joinmidi.com/", note: "Takes most insurance" },
  { country: "USA", name: "Gennev", url: "https://www.gennev.com/", note: "Takes Anthem, United Healthcare, Aetna" },
  { country: "USA", name: "Alloy", url: "https://www.myalloy.com/", note: null },
  { country: "USA", name: "Evernow", url: "https://www.evernow.com/", note: null },
  { country: "USA", name: "Winona", url: "https://bywinona.com/", note: null },
  // Canada
  { country: "Canada", name: "Blair Health", url: "https://blairhealth.ca/", note: "Prescribes regulated MHT and testosterone" },
  { country: "Canada", name: "Modern Menopause", url: "https://www.modernmenopause.ca/", note: null },
  { country: "Canada", name: "Penelope", url: "https://speakwithpenelope.ca/", note: null },
  { country: "Canada", name: "Felix", url: "https://www.felixforyou.ca/", note: null },
  // Australia
  { country: "Australia", name: "Wellfemme", url: "https://wellfemme.com.au/", note: "Medicare rebate eligible" },
  { country: "Australia", name: "Myma Health", url: "https://mymahealth.com.au", note: "Medicare rebate eligible" },
  { country: "Australia", name: "Remi Health", url: "https://remi.com.au/", note: "Medicare rebate eligible" },
  { country: "Australia", name: "Viv Health", url: "https://vivhealth.com.au", note: "Medicare rebate eligible" },
] as const;

// ── Curated Books & Resources ─────────────────────────────────────────────────
export const CURATED_RESOURCES = [
  {
    type: "book" as const,
    title: "The New Menopause",
    author: "Dr. Mary Claire Haver",
    url: "https://www.goodreads.com/book/show/197516602-the-new-menopause",
  },
  {
    type: "book" as const,
    title: "The Menopause Manifesto",
    author: "Dr. Jen Gunter",
    url: "https://www.penguinrandomhouse.ca/books/652048/the-menopause-manifesto-by-dr-jen-gunter/9780735280786",
  },
  {
    type: "book" as const,
    title: "Estrogen Matters",
    author: "Drs. Avrum Bluming & Carol Tavris",
    url: "https://www.amazon.com/Estrogen-Matters-Hormones-Menopause-Well-Being/dp/0316481203/",
  },
  {
    type: "book" as const,
    title: "Perimenopause Power",
    author: "Maisie Hill",
    url: "https://www.amazon.com/Perimenopause-Power/dp/B08XY5RQ2S/",
  },
  {
    type: "website" as const,
    title: "The Vajenda",
    author: "Dr. Jen Gunter",
    url: "https://vajenda.substack.com/",
  },
  {
    type: "website" as const,
    title: "The Menopause Wiki",
    author: "r/menopause & r/perimenopause Community",
    url: "https://menopausewiki.ca/",
  },
] as const;

// ── Helper: Get wiki link for a symptom key ───────────────────────────────────
export function getSymptomWikiLink(symptomKey: string): string | null {
  return WIKI_SYMPTOM_LINKS[symptomKey]?.url ?? null;
}

// ── Helper: Get wiki link for a reverse lookup query ─────────────────────────
export function getReverseLookupWikiLink(query: string): string | null {
  const q = query.toLowerCase();
  for (const [keyword, url] of Object.entries(WIKI_REVERSE_LOOKUP_LINKS)) {
    if (q.includes(keyword)) return url;
  }
  return WIKI_PAGES.home;
}
