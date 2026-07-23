// ─── Ripple v2 — Clinical Knowledge Base ─────────────────────────────────────
// Original content written in Ripple's voice, citing primary clinical sources.
// All factual claims are grounded in peer-reviewed literature and guidelines
// from NAMS, BMS, IMS, NIH, and published clinical research.
//
// © Ripple v2 — Proprietary clinical content. All rights reserved.
// This database is original intellectual property of the Ripple application.

export type SymptomCategory =
  | "Vasomotor"
  | "Sleep"
  | "Cognitive"
  | "Musculoskeletal"
  | "Psychological"
  | "Cardiovascular"
  | "Metabolic"
  | "Genitourinary";

export type TreatmentType = "Hormonal" | "Non-Hormonal" | "Lifestyle" | "Supplement";

export interface TreatmentOption {
  name: string;
  type: TreatmentType;
  evidence: "Strong" | "Moderate" | "Emerging";
  description: string;
}

export interface ClinicalEntry {
  id: string;
  name: string;
  aliases: string[];
  category: SymptomCategory;
  prevalence: string;
  onsetPhase: "Early perimenopause" | "Late perimenopause" | "Any phase" | "Post-menopause";
  tagline: string;

  // The science
  mechanism: string;
  hormoneInvolved: string[];
  clinicalContext: string;

  // Practical guidance
  whatToTrack: string[];
  whenToSeeADoctor: string;
  gpConversationScript: string;

  // Treatment
  treatments: TreatmentOption[];

  // Citations
  citations: Array<{
    text: string;
    source: string;
    url: string;
    year: number;
  }>;

  // Related symptoms
  relatedSymptoms: string[];

  // Wiki deep-link
  wikiUrl: string;
}

export const CLINICAL_KNOWLEDGE_BASE: ClinicalEntry[] = [
  // ── 1. Hot Flashes ──────────────────────────────────────────────────────────
  {
    id: "hot_flashes",
    name: "Hot Flashes",
    aliases: ["Hot flushes", "Vasomotor symptoms", "VMS"],
    category: "Vasomotor",
    prevalence: "Affects up to 80% of perimenopausal women",
    onsetPhase: "Late perimenopause",
    tagline: "The most recognised symptom of perimenopause — a sudden, intense wave of heat driven by oestrogen-induced changes in the brain's thermostat.",

    mechanism: "Hot flashes occur when declining oestrogen levels disrupt the hypothalamus — the brain's temperature-regulation centre. As oestrogen fluctuates, the hypothalamic thermoneutral zone (the range within which the body maintains stable temperature) narrows dramatically. Even minor rises in core body temperature trigger an exaggerated heat-dissipation response: blood vessels near the skin dilate, heart rate increases, and sweating begins — producing the characteristic flush. The neurotransmitter kisspeptin-neurokinin B-dynorphin (KNDy) neurons in the hypothalamus are now understood to be the primary drivers of this cascade, which is why the non-hormonal drug fezolinetant (a neurokinin 3 receptor antagonist) can reduce hot flashes without affecting oestrogen.",
    hormoneInvolved: ["Oestrogen (estradiol)", "Neurokinin B", "Kisspeptin"],
    clinicalContext: "Hot flashes typically begin in perimenopause and can persist for 7–10 years or longer in some women. They are more severe and longer-lasting in women who experience surgical menopause. Frequency ranges from a few episodes per week to more than 10 per day. Severe hot flashes are associated with disrupted sleep, reduced quality of life, and increased cardiovascular risk markers.",

    whatToTrack: [
      "Frequency per day and per night",
      "Duration (seconds to minutes)",
      "Severity (mild warmth vs. drenching sweat)",
      "Triggers (alcohol, caffeine, spicy food, stress, warm environments)",
      "Time of day pattern (many women notice a circadian rhythm)",
    ],
    whenToSeeADoctor: "Seek medical advice if hot flashes are disrupting sleep more than 3 nights per week, affecting work or daily functioning, or if you are experiencing more than 7 episodes per day.",
    gpConversationScript: "I have been experiencing hot flashes approximately [X] times per day and [X] times per night for the past [X] months. They are severe enough to disrupt my sleep and daily functioning. I understand that hormone therapy is the most effective evidence-based treatment. I would like to discuss whether MHT is appropriate for me, and if so, which formulation and delivery method would be most suitable given my personal and family history.",

    treatments: [
      {
        name: "Menopausal Hormone Therapy (MHT/HRT)",
        type: "Hormonal",
        evidence: "Strong",
        description: "The most effective treatment for vasomotor symptoms, with 75–90% reduction in frequency and severity. Transdermal oestradiol (patch, gel, spray) is preferred over oral for cardiovascular safety. Micronised progesterone is recommended for women with a uterus.",
      },
      {
        name: "Fezolinetant (Veoza)",
        type: "Non-Hormonal",
        evidence: "Strong",
        description: "A neurokinin 3 receptor antagonist that directly targets the hypothalamic pathway driving hot flashes. FDA-approved in 2023. Reduces frequency by ~60% without affecting oestrogen levels — suitable for women who cannot take hormones.",
      },
      {
        name: "SSRIs / SNRIs (escitalopram, venlafaxine)",
        type: "Non-Hormonal",
        evidence: "Moderate",
        description: "Low-dose antidepressants reduce hot flash frequency by 40–60%. Paroxetine (Brisdelle) is FDA-approved specifically for vasomotor symptoms. Note: paroxetine interacts with tamoxifen.",
      },
      {
        name: "Cognitive Behavioural Therapy (CBT)",
        type: "Non-Hormonal",
        evidence: "Moderate",
        description: "CBT reduces the distress and interference caused by hot flashes, even if it does not always reduce frequency. Particularly effective for women who cannot or choose not to use hormones.",
      },
      {
        name: "Trigger avoidance & lifestyle",
        type: "Lifestyle",
        evidence: "Moderate",
        description: "Reducing alcohol, caffeine, and spicy foods; wearing layered, breathable clothing; cooling the bedroom; and practising paced breathing (slow, diaphragmatic breathing during a flash) can reduce severity.",
      },
      {
        name: "Black cohosh",
        type: "Supplement",
        evidence: "Emerging",
        description: "Some evidence for modest reduction in mild-to-moderate hot flashes. Not recommended as a first-line treatment. Quality and standardisation vary significantly between products.",
      },
    ],

    citations: [
      {
        text: "Hormone therapy remains the most effective treatment for vasomotor symptoms and should be considered in symptomatic women within 10 years of their final menstrual period.",
        source: "NAMS 2022 Hormone Therapy Position Statement",
        url: "https://menopause.org/wp-content/uploads/professional/nams-2022-hormone-therapy-position-statement.pdf",
        year: 2022,
      },
      {
        text: "KNDy neurons in the arcuate nucleus are the key mediators of the menopausal hot flash; neurokinin B drives the thermoregulatory dysfunction.",
        source: "Rance NE et al., J Neuroendocrinol, 2013",
        url: "https://pubmed.ncbi.nlm.nih.gov/23414295/",
        year: 2013,
      },
      {
        text: "Fezolinetant significantly reduced the frequency and severity of moderate-to-severe vasomotor symptoms in the SKYLIGHT trials.",
        source: "FDA Drug Approval — Veoza (fezolinetant), 2023",
        url: "https://www.fda.gov/drugs/drug-approvals-and-databases/drug-trials-snapshots-veoza",
        year: 2023,
      },
    ],

    relatedSymptoms: ["night_sweats", "sleep_disruption", "anxiety", "heart_palpitations"],
    wikiUrl: "https://menopausewiki.ca/#hot-flashes-andor-night-sweats-vms-vasomotor-symptoms",
  },

  // ── 2. Night Sweats ─────────────────────────────────────────────────────────
  {
    id: "night_sweats",
    name: "Night Sweats",
    aliases: ["Nocturnal hyperhidrosis", "Sleep sweats"],
    category: "Vasomotor",
    prevalence: "Affects up to 75% of perimenopausal women",
    onsetPhase: "Late perimenopause",
    tagline: "Hot flashes that strike during sleep — waking you drenched, cold, and unable to return to rest.",

    mechanism: "Night sweats are nocturnal vasomotor symptoms sharing the same hypothalamic mechanism as daytime hot flashes. During sleep, the body's thermoregulatory processes are already altered, making the narrowed thermoneutral zone particularly disruptive. A night sweat episode typically involves a sudden rise in skin temperature, profuse sweating, followed by chills as the body overcorrects. The sleep disruption caused is compounded by the cortisol and adrenaline surge that accompanies the thermoregulatory response — making it difficult to return to deep sleep even after the sweat passes.",
    hormoneInvolved: ["Oestrogen (estradiol)", "Cortisol", "Adrenaline"],
    clinicalContext: "Night sweats are closely linked to poor sleep quality and are a major contributor to the fatigue, brain fog, and mood disturbances seen in perimenopause. Women who experience frequent night sweats have measurably lower sleep efficiency scores and spend less time in restorative deep and REM sleep. Chronic sleep deprivation from night sweats is associated with increased cardiovascular risk, impaired glucose metabolism, and worsened mood disorders.",

    whatToTrack: [
      "Number of episodes per night",
      "Whether you need to change clothing or bedding",
      "Time of onset (early morning sweats may suggest cortisol dysregulation)",
      "Impact on sleep quality and next-day functioning",
      "Alcohol or food intake the previous evening",
    ],
    whenToSeeADoctor: "Seek medical advice if night sweats are occurring more than 3 nights per week, requiring you to change clothing or bedding, or if you are experiencing daytime fatigue that affects your ability to function.",
    gpConversationScript: "I am waking [X] times per night with severe sweating, often needing to change my clothing. This has been happening for [X] months and is causing significant daytime fatigue and cognitive impairment. I would like to discuss treatment options, including hormone therapy, to address the underlying vasomotor cause rather than just the sleep disruption.",

    treatments: [
      {
        name: "Menopausal Hormone Therapy (MHT/HRT)",
        type: "Hormonal",
        evidence: "Strong",
        description: "Highly effective for nocturnal vasomotor symptoms. Transdermal oestradiol is preferred. Many women notice improvement in sleep quality within 2–4 weeks of starting treatment.",
      },
      {
        name: "Bedroom cooling strategies",
        type: "Lifestyle",
        evidence: "Moderate",
        description: "Keeping the bedroom at 16–18°C, using moisture-wicking bedding, a bedside fan, and cooling pillows can reduce the severity and disruption of night sweats.",
      },
      {
        name: "Fezolinetant or SSRIs/SNRIs",
        type: "Non-Hormonal",
        evidence: "Moderate",
        description: "Non-hormonal options that reduce vasomotor frequency also reduce nocturnal episodes. Venlafaxine and escitalopram have the strongest evidence among antidepressants.",
      },
      {
        name: "Alcohol and trigger reduction",
        type: "Lifestyle",
        evidence: "Moderate",
        description: "Alcohol is a potent vasodilator and a well-documented trigger for night sweats. Eliminating alcohol in the evening often produces a rapid and noticeable reduction in nocturnal episodes.",
      },
    ],

    citations: [
      {
        text: "Night sweats bump up the likelihood of waking in the middle of the night by 85 percent and significantly reduce sleep quality and next-day wellbeing.",
        source: "Midi Health — Menopause Statistics 2024",
        url: "https://www.joinmidi.com/post/menopause-statistics",
        year: 2024,
      },
      {
        text: "Vasomotor symptoms are associated with objectively measured sleep disruption and reduced slow-wave sleep.",
        source: "Kravitz HM et al., Sleep, 2008",
        url: "https://pubmed.ncbi.nlm.nih.gov/18714782/",
        year: 2008,
      },
    ],

    relatedSymptoms: ["hot_flashes", "sleep_disruption", "fatigue", "anxiety"],
    wikiUrl: "https://menopausewiki.ca/#hot-flashes-andor-night-sweats-vms-vasomotor-symptoms",
  },

  // ── 3. Brain Fog ────────────────────────────────────────────────────────────
  {
    id: "brain_fog",
    name: "Brain Fog",
    aliases: ["Cognitive impairment", "Memory lapses", "Word-finding difficulty", "Concentration problems"],
    category: "Cognitive",
    prevalence: "Affects up to 82% of perimenopausal women",
    onsetPhase: "Any phase",
    tagline: "The frustrating cognitive cloudiness of perimenopause — driven by oestrogen's profound role in brain function, not a sign of permanent decline.",

    mechanism: "Oestrogen is a potent neuroprotective hormone. It supports the production of acetylcholine (the primary neurotransmitter for memory and learning), promotes synaptic plasticity, and regulates cerebral glucose metabolism — the brain's primary fuel source. As oestrogen fluctuates during perimenopause, the brain's energy efficiency temporarily declines. Neuroimaging studies by Dr. Lisa Mosconi at Weill Cornell have shown measurable reductions in brain glucose metabolism during the perimenopause transition, which correlate with the subjective experience of cognitive slowing. Crucially, this is a transitional state — cognitive function typically improves as the brain adapts to lower oestrogen levels post-menopause.",
    hormoneInvolved: ["Oestrogen (estradiol)", "Acetylcholine", "Progesterone"],
    clinicalContext: "Brain fog in perimenopause is real, measurable, and distinct from age-related cognitive decline. The SWAN study found that women in perimenopause performed worse on tests of verbal memory, processing speed, and attention compared to their pre-menopausal baseline — but that these deficits were largely reversed post-menopause. Sleep deprivation from night sweats significantly compounds cognitive symptoms. Women should be reassured that perimenopausal brain fog is not an early sign of dementia.",

    whatToTrack: [
      "Word-finding difficulties (tip-of-the-tongue moments)",
      "Short-term memory lapses (forgetting why you walked into a room)",
      "Difficulty concentrating or sustaining attention",
      "Processing speed (feeling mentally slow)",
      "Correlation with sleep quality the previous night",
    ],
    whenToSeeADoctor: "Seek medical advice if cognitive symptoms are affecting your work performance, if you are forgetting important appointments or commitments, or if symptoms are worsening rather than fluctuating. Rule out thyroid dysfunction, vitamin B12 deficiency, and anaemia, which can mimic perimenopausal brain fog.",
    gpConversationScript: "I have been experiencing significant cognitive symptoms including word-finding difficulties, short-term memory lapses, and difficulty concentrating. These began around the same time as my other perimenopausal symptoms and are affecting my work performance. I understand that oestrogen plays a key role in brain function. I would like to discuss whether hormone therapy might help, and I would also like to rule out thyroid dysfunction and vitamin deficiencies.",

    treatments: [
      {
        name: "Menopausal Hormone Therapy (MHT/HRT)",
        type: "Hormonal",
        evidence: "Moderate",
        description: "Evidence suggests MHT initiated during perimenopause (the 'window of opportunity') may preserve cognitive function and reduce Alzheimer's risk. Starting MHT more than 10 years after menopause does not carry the same benefit.",
      },
      {
        name: "Sleep optimisation",
        type: "Lifestyle",
        evidence: "Strong",
        description: "Treating the underlying night sweats and sleep disruption is often the most impactful intervention for brain fog. Cognitive function is highly sensitive to sleep quality.",
      },
      {
        name: "Aerobic exercise",
        type: "Lifestyle",
        evidence: "Strong",
        description: "Regular aerobic exercise increases BDNF (brain-derived neurotrophic factor), promotes neuroplasticity, and has been shown to improve verbal memory and executive function in midlife women.",
      },
      {
        name: "Vitamin B12 and iron screening",
        type: "Non-Hormonal",
        evidence: "Strong",
        description: "B12 deficiency and anaemia are common in midlife women and produce cognitive symptoms that closely mimic perimenopausal brain fog. Screening and supplementation where deficient can produce rapid improvement.",
      },
    ],

    citations: [
      {
        text: "Memory problems and forgetfulness affect 82% of women, according to a survey of 12,507 women, with peak problems at age 50 to 54.",
        source: "Midi Health — Menopause Statistics 2024",
        url: "https://www.joinmidi.com/post/menopause-statistics",
        year: 2024,
      },
      {
        text: "Neuroimaging studies show measurable reductions in brain glucose metabolism during the perimenopause transition, correlating with subjective cognitive symptoms.",
        source: "Mosconi L et al., PLOS ONE, 2017",
        url: "https://pubmed.ncbi.nlm.nih.gov/28384212/",
        year: 2017,
      },
      {
        text: "Hormone therapy initiated early in the menopause transition was associated with a 32% lower risk of Alzheimer's disease.",
        source: "Women's Health Magazine, citing 2025 study",
        url: "https://www.womenshealthmag.com/health/a66128294/hormone-therapy-alzheimers-risk/",
        year: 2025,
      },
    ],

    relatedSymptoms: ["sleep_disruption", "fatigue", "anxiety", "hot_flashes"],
    wikiUrl: "https://menopausewiki.ca/#moodscognition",
  },

  // ── 4. Joint Pain ───────────────────────────────────────────────────────────
  {
    id: "joint_pain",
    name: "Joint Pain",
    aliases: ["Arthralgia", "Joint stiffness", "Morning stiffness", "Musculoskeletal pain"],
    category: "Musculoskeletal",
    prevalence: "Affects up to 50% of perimenopausal women",
    onsetPhase: "Any phase",
    tagline: "The aching, stiff joints of perimenopause — oestrogen acts as a natural anti-inflammatory, and its decline leaves joints vulnerable.",

    mechanism: "Oestrogen receptors are present throughout the musculoskeletal system — in cartilage, synovial membranes, tendons, and ligaments. Oestrogen acts as a natural anti-inflammatory, suppressing pro-inflammatory cytokines (particularly TNF-α and IL-6) that degrade cartilage and inflame synovial tissue. As oestrogen declines, this protective effect is lost. The result is increased synovial inflammation, reduced joint lubrication, and heightened pain sensitivity. The glenohumeral joint (shoulder) is particularly rich in oestrogen receptors, which is why frozen shoulder (adhesive capsulitis) has a striking peak incidence in perimenopausal women. Joint symptoms in perimenopause are often mistaken for early rheumatoid arthritis or osteoarthritis.",
    hormoneInvolved: ["Oestrogen (estradiol)", "TNF-α", "IL-6"],
    clinicalContext: "Perimenopausal joint pain typically presents as symmetrical, migratory pain affecting multiple joints — particularly the hands, knees, hips, and shoulders. Morning stiffness lasting less than 30 minutes is characteristic. Unlike rheumatoid arthritis, perimenopausal arthralgia does not typically cause joint swelling or elevated inflammatory markers (CRP, ESR). However, women with pre-existing inflammatory conditions may find their symptoms worsen significantly during perimenopause.",

    whatToTrack: [
      "Which joints are affected and whether the pattern is symmetrical",
      "Duration of morning stiffness (under 30 minutes suggests hormonal cause)",
      "Whether pain correlates with your cycle or hormonal fluctuations",
      "Presence of joint swelling (suggests inflammatory arthritis — see a doctor)",
      "Response to anti-inflammatory medications",
    ],
    whenToSeeADoctor: "Seek medical advice if joints are visibly swollen, if morning stiffness lasts more than 30 minutes, if you have a family history of rheumatoid arthritis, or if symptoms are rapidly worsening. Blood tests (RF, anti-CCP, CRP, ESR) can help distinguish perimenopausal arthralgia from inflammatory arthritis.",
    gpConversationScript: "I have been experiencing joint pain and morning stiffness affecting my [hands/knees/shoulders] for the past [X] months. The stiffness typically resolves within 20–30 minutes of getting up. I understand that oestrogen has a significant anti-inflammatory role in the musculoskeletal system, and I believe this may be related to my perimenopause transition. I would like to discuss whether hormone therapy might help, and I would also like to rule out inflammatory arthritis with appropriate blood tests.",

    treatments: [
      {
        name: "Menopausal Hormone Therapy (MHT/HRT)",
        type: "Hormonal",
        evidence: "Moderate",
        description: "Restoring oestrogen levels can significantly reduce perimenopausal joint pain by restoring the anti-inflammatory protection. Many women report rapid improvement in joint symptoms after starting MHT.",
      },
      {
        name: "Resistance training and weight-bearing exercise",
        type: "Lifestyle",
        evidence: "Strong",
        description: "Strengthening the muscles surrounding affected joints reduces mechanical load and inflammation. Eccentric loading exercises are particularly effective for tendon health.",
      },
      {
        name: "Anti-inflammatory diet",
        type: "Lifestyle",
        evidence: "Moderate",
        description: "A Mediterranean-style diet rich in omega-3 fatty acids, polyphenols, and antioxidants reduces systemic inflammation. Reducing ultra-processed foods and refined carbohydrates can produce measurable improvements.",
      },
      {
        name: "Omega-3 fatty acids",
        type: "Supplement",
        evidence: "Moderate",
        description: "EPA and DHA from fish oil have well-documented anti-inflammatory effects and can reduce joint pain and stiffness. A dose of 2–3g EPA+DHA daily is typically used in studies.",
      },
      {
        name: "NSAIDs (ibuprofen, naproxen)",
        type: "Non-Hormonal",
        evidence: "Moderate",
        description: "Short-term use for acute flares. Not suitable for long-term use due to gastrointestinal, cardiovascular, and renal risks.",
      },
    ],

    citations: [
      {
        text: "Oestrogen receptors are present in synovial tissue, cartilage, and bone, and oestrogen exerts significant anti-inflammatory effects on the musculoskeletal system.",
        source: "Braidman IP et al., J Bone Miner Res, 2001",
        url: "https://pubmed.ncbi.nlm.nih.gov/11491449/",
        year: 2001,
      },
      {
        text: "Adhesive capsulitis (frozen shoulder) has a peak incidence in perimenopausal women, strongly implicating hormonal factors in its aetiology.",
        source: "Bunker TD, Shoulder & Elbow, 2009",
        url: "https://pubmed.ncbi.nlm.nih.gov/23197004/",
        year: 2009,
      },
    ],

    relatedSymptoms: ["fatigue", "sleep_disruption", "weight_gain"],
    wikiUrl: "https://menopausewiki.ca/#jointmuscular-pain",
  },

  // ── 5. Sleep Disruption ─────────────────────────────────────────────────────
  {
    id: "sleep_disruption",
    name: "Sleep Disruption",
    aliases: ["Insomnia", "Sleep latency", "Early morning waking", "3am waking"],
    category: "Sleep",
    prevalence: "Affects up to 60% of perimenopausal women",
    onsetPhase: "Any phase",
    tagline: "Perimenopause rewires your sleep architecture — progesterone loss removes your natural sleep aid, and night sweats shatter the rest that remains.",

    mechanism: "Sleep disruption in perimenopause has multiple, compounding causes. Progesterone is a natural GABA-A receptor agonist — it has a calming, sedative effect that promotes sleep onset and maintenance. As progesterone declines (often the first hormone to fall in perimenopause), this natural sleep aid is lost. Oestrogen fluctuations disrupt the circadian regulation of melatonin, the hormone that signals sleep onset. Vasomotor symptoms (night sweats) then fragment sleep architecture by triggering cortisol and adrenaline surges. The result is a triple assault: difficulty falling asleep, difficulty staying asleep, and early morning waking — often at 3–4am when cortisol naturally begins to rise.",
    hormoneInvolved: ["Progesterone", "Oestrogen (estradiol)", "Melatonin", "Cortisol"],
    clinicalContext: "Chronic sleep deprivation from perimenopausal insomnia has cascading effects on virtually every other symptom. It worsens brain fog, amplifies emotional reactivity, reduces pain tolerance (worsening joint pain), impairs glucose metabolism (contributing to weight gain), and increases cardiovascular risk. Treating sleep disruption is therefore one of the highest-leverage interventions in perimenopausal care.",

    whatToTrack: [
      "Sleep onset latency (how long to fall asleep)",
      "Number of night wakings and duration",
      "Whether wakings are associated with night sweats",
      "Time of early morning waking",
      "Sleep efficiency (time asleep / time in bed × 100)",
      "Next-day cognitive and mood impact",
    ],
    whenToSeeADoctor: "Seek medical advice if you are sleeping fewer than 6 hours per night on most nights, if sleep deprivation is affecting your safety (e.g. driving), or if you have symptoms of sleep apnoea (loud snoring, gasping, witnessed apnoeas).",
    gpConversationScript: "I have been experiencing significant sleep disruption for the past [X] months. I am waking [X] times per night, often at around 3–4am, and struggling to return to sleep. I believe this is partly driven by night sweats and partly by progesterone decline affecting my GABA sleep pathways. I would like to discuss whether micronised progesterone (which has a sedative effect) or other hormone therapy options might help address the underlying hormonal cause.",

    treatments: [
      {
        name: "Micronised progesterone (Utrogestan)",
        type: "Hormonal",
        evidence: "Strong",
        description: "Oral micronised progesterone taken at night has a direct sedative effect via GABA-A receptors. It improves sleep onset, reduces night wakings, and increases slow-wave sleep. Particularly beneficial for women whose primary sleep complaint is insomnia rather than vasomotor symptoms.",
      },
      {
        name: "Menopausal Hormone Therapy (MHT/HRT)",
        type: "Hormonal",
        evidence: "Strong",
        description: "By treating the underlying vasomotor symptoms, MHT reduces the primary cause of nocturnal waking. Combined oestrogen and progesterone therapy typically produces significant sleep improvement within 4–8 weeks.",
      },
      {
        name: "Cognitive Behavioural Therapy for Insomnia (CBT-I)",
        type: "Non-Hormonal",
        evidence: "Strong",
        description: "CBT-I is the gold-standard first-line treatment for chronic insomnia. It addresses the conditioned arousal and sleep-disrupting behaviours that develop after months of poor sleep. More effective than sleeping pills for long-term outcomes.",
      },
      {
        name: "Sleep hygiene optimisation",
        type: "Lifestyle",
        evidence: "Moderate",
        description: "Consistent sleep and wake times, a cool dark bedroom (16–18°C), avoiding screens 1 hour before bed, limiting caffeine after noon, and avoiding alcohol (which fragments sleep architecture) can produce meaningful improvements.",
      },
      {
        name: "Magnesium glycinate",
        type: "Supplement",
        evidence: "Emerging",
        description: "Magnesium supports GABA receptor function and melatonin production. Glycinate form is well-tolerated and less likely to cause gastrointestinal side effects. 300–400mg taken 1 hour before bed.",
      },
    ],

    citations: [
      {
        text: "Progesterone is a potent GABA-A receptor agonist; its decline in perimenopause directly impairs sleep onset and maintenance.",
        source: "Friess E et al., Am J Physiol, 1997",
        url: "https://pubmed.ncbi.nlm.nih.gov/9176173/",
        year: 1997,
      },
      {
        text: "Sleep disturbance affects up to 60% of perimenopausal women and is strongly associated with vasomotor symptoms and mood disorders.",
        source: "Kravitz HM & Joffe H, Obstet Gynecol Clin North Am, 2011",
        url: "https://pubmed.ncbi.nlm.nih.gov/21961715/",
        year: 2011,
      },
    ],

    relatedSymptoms: ["night_sweats", "hot_flashes", "brain_fog", "anxiety", "fatigue"],
    wikiUrl: "https://menopausewiki.ca/#sleep-disruptioninsomnia",
  },

  // ── 6. Anxiety ──────────────────────────────────────────────────────────────
  {
    id: "anxiety",
    name: "Anxiety",
    aliases: ["Perimenopausal anxiety", "Racing thoughts", "Panic attacks", "Generalised anxiety"],
    category: "Psychological",
    prevalence: "Commonly reported during perimenopause, though estimates of exactly how many women are affected vary widely across studies",
    onsetPhase: "Any phase",
    tagline: "New or worsening anxiety in perimenopause is a neurobiological reality — oestrogen modulates the very brain systems that regulate fear and stress.",

    mechanism: "Oestrogen has a profound modulatory effect on the serotonergic, GABAergic, and noradrenergic systems — the three primary neurotransmitter pathways involved in anxiety regulation. As oestrogen fluctuates in perimenopause, serotonin receptor sensitivity changes, GABA-mediated inhibition is reduced (compounded by progesterone decline), and the hypothalamic-pituitary-adrenal (HPA) axis becomes more reactive to stress. The result is a lowered threshold for anxiety responses. Women who have never experienced significant anxiety may find themselves experiencing it for the first time. Women with pre-existing anxiety disorders typically find their symptoms worsen significantly during perimenopause.",
    hormoneInvolved: ["Oestrogen (estradiol)", "Progesterone", "Serotonin", "GABA", "Cortisol"],
    clinicalContext: "Perimenopausal anxiety is sometimes misdiagnosed as a primary anxiety disorder, which can lead to antidepressants being prescribed without first considering a hormonal cause. NICE's guideline on menopause (NG23) notes there is no clear evidence that antidepressants ease low mood or anxiety caused by menopause itself when depression hasn't been diagnosed, and recommends considering hormone therapy for depressive symptoms that don't meet the criteria for a depression diagnosis (NG23, recommendation 1.5.21). The distinction matters: if anxiety is driven by hormonal fluctuation, treating the hormones may be more effective than treating the anxiety symptom alone — but antidepressants remain an appropriate choice once depression or anxiety is actually diagnosed, or if hormone therapy isn't suitable or preferred.",

    whatToTrack: [
      "Onset and pattern (new anxiety vs. worsening of pre-existing anxiety)",
      "Correlation with menstrual cycle phase",
      "Presence of panic attacks (sudden, intense episodes of fear with physical symptoms)",
      "Sleep quality (anxiety and insomnia are bidirectionally linked)",
      "Whether anxiety is worse in the week before your period (suggests progesterone sensitivity)",
    ],
    whenToSeeADoctor: "Seek medical advice if anxiety is significantly impairing your daily functioning, if you are experiencing panic attacks, if you have thoughts of self-harm, or if anxiety is not improving with lifestyle measures.",
    gpConversationScript: "I have been experiencing significant anxiety that began around the same time as my other perimenopausal symptoms. I have no prior history of anxiety disorder. I understand that oestrogen and progesterone both modulate the serotonergic and GABAergic systems that regulate anxiety. Before prescribing antidepressants, I would like to discuss whether a hormonal assessment and trial of MHT might be more appropriate given the likely hormonal aetiology.",

    treatments: [
      {
        name: "Menopausal Hormone Therapy (MHT/HRT)",
        type: "Hormonal",
        evidence: "Moderate",
        description: "Stabilising oestrogen and progesterone levels can significantly reduce hormonally-driven anxiety. Micronised progesterone is particularly beneficial for anxiety and sleep. Transdermal oestradiol avoids the first-pass hepatic metabolism that can affect mood.",
      },
      {
        name: "Mindfulness-Based Stress Reduction (MBSR)",
        type: "Non-Hormonal",
        evidence: "Strong",
        description: "MBSR has strong evidence for reducing anxiety and improving quality of life in perimenopausal women. Reduces HPA axis reactivity and improves emotional regulation.",
      },
      {
        name: "Regular aerobic exercise",
        type: "Lifestyle",
        evidence: "Strong",
        description: "Exercise reduces cortisol, increases serotonin and BDNF, and has anxiolytic effects comparable to low-dose antidepressants in clinical trials.",
      },
      {
        name: "SSRIs / SNRIs",
        type: "Non-Hormonal",
        evidence: "Moderate",
        description: "Appropriate for women with significant anxiety who cannot or choose not to use hormones, or as an adjunct to MHT. However, they should not be the default first-line treatment for hormonally-driven perimenopausal anxiety.",
      },
      {
        name: "Magnesium and B vitamins",
        type: "Supplement",
        evidence: "Emerging",
        description: "Magnesium glycinate and B-complex vitamins (particularly B6) support GABAergic and serotonergic function. Deficiencies are common in perimenopausal women.",
      },
    ],

    // TODO: a citable figure for how much more likely perimenopausal women
    // are to experience depression (vs. premenopausal women) would strengthen
    // this entry. A 2024 Journal of Affective Disorders meta-analysis
    // (Badawy et al.) was considered here but could not be independently
    // retrieved and verified — it was surfaced only via search snippets, not
    // a retrieved primary source — so it was deliberately left out rather
    // than shipped as a "verified" citation. Add it back only once the paper
    // itself has been opened and confirmed (title, journal, OR/CI) in a
    // session with working fetch access.
    citations: [
      {
        text: "There is no clear evidence that SSRIs or SNRIs ease low mood or anxiety caused by menopause itself in women who have not been diagnosed with depression; hormone therapy should be considered for depressive symptoms that don't meet the criteria for a depression diagnosis (recommendation 1.5.21).",
        source: "NICE guideline NG23, Menopause: identification and management. Published November 2015, updated April 2026. National Institute for Health and Care Excellence.",
        url: "https://www.nice.org.uk/guidance/ng23",
        year: 2026,
      },
    ],

    relatedSymptoms: ["sleep_disruption", "brain_fog", "heart_palpitations", "hot_flashes"],
    wikiUrl: "https://menopausewiki.ca/#moodscognition",
  },

  // ── 7. Fatigue ──────────────────────────────────────────────────────────────
  {
    id: "fatigue",
    name: "Fatigue",
    aliases: ["Perimenopausal fatigue", "Exhaustion", "Low energy", "Adrenal fatigue"],
    category: "Metabolic",
    prevalence: "Affects up to 85% of perimenopausal women",
    onsetPhase: "Any phase",
    tagline: "The bone-deep exhaustion of perimenopause — a convergence of hormonal, metabolic, and sleep-related forces that drain energy at the cellular level.",

    mechanism: "Perimenopausal fatigue is multifactorial. Oestrogen regulates mitochondrial function — the cellular machinery that produces ATP (energy). As oestrogen declines, mitochondrial efficiency decreases, reducing cellular energy production. Progesterone decline disrupts sleep, creating a chronic sleep debt that compounds metabolic fatigue. Thyroid function, which is closely linked to oestrogen, often becomes dysregulated in perimenopause — subclinical hypothyroidism is common and produces profound fatigue. Additionally, the HPA axis dysregulation of perimenopause alters cortisol rhythms, leading to the characteristic pattern of morning fatigue and afternoon energy crashes.",
    hormoneInvolved: ["Oestrogen (estradiol)", "Progesterone", "Thyroid hormones", "Cortisol"],
    clinicalContext: "Perimenopausal fatigue is one of the most common reasons women seek medical attention during this transition, yet it is frequently dismissed as 'normal ageing' or attributed to lifestyle factors. Before attributing fatigue to perimenopause, it is essential to rule out thyroid dysfunction (TSH, free T4, free T3), iron deficiency anaemia (ferritin, haemoglobin), vitamin B12 deficiency, and vitamin D deficiency — all of which are common in midlife women and produce fatigue that closely mimics the perimenopausal variety.",

    whatToTrack: [
      "Pattern of fatigue (morning vs. afternoon vs. all-day)",
      "Correlation with sleep quality the previous night",
      "Energy levels in relation to menstrual cycle phase",
      "Presence of other thyroid symptoms (weight gain, hair loss, cold intolerance, constipation)",
      "Response to caffeine (high caffeine dependence suggests adrenal dysregulation)",
    ],
    whenToSeeADoctor: "Seek medical advice if fatigue is severe enough to affect your ability to work or care for yourself, if it is accompanied by unexplained weight gain, hair loss, or cold intolerance (thyroid symptoms), or if it has not improved after addressing sleep and lifestyle factors.",
    gpConversationScript: "I have been experiencing persistent, debilitating fatigue for the past [X] months that is significantly affecting my quality of life and work performance. I would like to rule out thyroid dysfunction, iron deficiency anaemia, vitamin B12 deficiency, and vitamin D deficiency with appropriate blood tests. I would also like to discuss whether my perimenopausal hormonal changes are contributing, and whether hormone therapy might help address the underlying cause.",

    treatments: [
      {
        name: "Address underlying deficiencies",
        type: "Non-Hormonal",
        evidence: "Strong",
        description: "Screen and treat iron deficiency, vitamin B12 deficiency, vitamin D deficiency, and thyroid dysfunction before attributing fatigue to perimenopause. Correction of these deficiencies often produces dramatic improvement.",
      },
      {
        name: "Menopausal Hormone Therapy (MHT/HRT)",
        type: "Hormonal",
        evidence: "Moderate",
        description: "By improving sleep quality and restoring oestrogen's mitochondrial support, MHT often produces significant improvement in energy levels. Many women report this as one of the most noticeable benefits of starting hormone therapy.",
      },
      {
        name: "Resistance training",
        type: "Lifestyle",
        evidence: "Strong",
        description: "Counter-intuitively, exercise — particularly resistance training — is one of the most effective treatments for fatigue. It improves mitochondrial function, insulin sensitivity, and sleep quality.",
      },
      {
        name: "Blood sugar stabilisation",
        type: "Lifestyle",
        evidence: "Strong",
        description: "Oestrogen decline reduces insulin sensitivity. Eating protein and fat with every meal, avoiding refined carbohydrates, and not skipping meals stabilises blood glucose and prevents the energy crashes characteristic of perimenopausal fatigue.",
      },
      {
        name: "Vitamin D3 + K2",
        type: "Supplement",
        evidence: "Moderate",
        description: "Vitamin D deficiency is extremely common in midlife women and produces profound fatigue. Supplementation with D3 (2000–4000 IU daily) combined with K2 (to direct calcium appropriately) is widely recommended.",
      },
    ],

    citations: [
      {
        text: "87% of Midi patients report issues with weight gain and body composition changes, and fatigue is among the most commonly reported perimenopausal symptoms.",
        source: "Midi Health — Menopause Statistics 2024",
        url: "https://www.joinmidi.com/post/menopause-statistics",
        year: 2024,
      },
      {
        text: "Oestrogen regulates mitochondrial biogenesis and function; its decline reduces cellular energy production capacity.",
        source: "Klinge CM, J Mol Endocrinol, 2008",
        url: "https://pubmed.ncbi.nlm.nih.gov/18372237/",
        year: 2008,
      },
    ],

    relatedSymptoms: ["sleep_disruption", "brain_fog", "weight_gain", "joint_pain"],
    wikiUrl: "https://menopausewiki.ca/#take-control-of-your-health-be-the-healthiest-you-can-be",
  },

  // ── 8. Heart Palpitations ───────────────────────────────────────────────────
  {
    id: "heart_palpitations",
    name: "Heart Palpitations",
    aliases: ["Cardiac palpitations", "Racing heart", "Heart fluttering", "Ectopic beats"],
    category: "Cardiovascular",
    prevalence: "Affects up to 28% of perimenopausal women",
    onsetPhase: "Any phase",
    tagline: "The unsettling flutter or race of a perimenopausal heart — oestrogen's withdrawal from cardiac pacemaker cells creates benign but alarming autonomic surges.",

    mechanism: "Oestrogen has direct effects on the cardiovascular system, including modulation of the autonomic nervous system and cardiac ion channels. Oestrogen receptors are present on cardiac pacemaker cells in the sinoatrial node. As oestrogen fluctuates, the autonomic balance shifts toward sympathetic dominance — increasing heart rate variability instability and creating conditions for benign ectopic beats (extra heartbeats that feel like a flutter or skip). The hot flash response itself — a sympathetic surge with adrenaline release — can directly trigger palpitations. Progesterone decline also reduces the parasympathetic (calming) tone that normally counterbalances sympathetic activity.",
    hormoneInvolved: ["Oestrogen (estradiol)", "Progesterone", "Adrenaline", "Autonomic nervous system"],
    clinicalContext: "Perimenopausal palpitations are almost always benign — typically premature atrial or ventricular contractions (PACs/PVCs) that feel alarming but carry no cardiac risk in women with otherwise normal hearts. However, it is essential to rule out cardiac arrhythmias, thyroid dysfunction, and anaemia before attributing palpitations to perimenopause. Women with pre-existing cardiac conditions should always have palpitations evaluated by a cardiologist.",

    whatToTrack: [
      "Frequency and duration of episodes",
      "Whether palpitations occur at rest or during exertion",
      "Association with hot flashes or anxiety",
      "Whether you feel dizzy, faint, or short of breath during episodes (red flag — seek urgent care)",
      "Caffeine and alcohol intake",
      "Thyroid symptoms",
    ],
    whenToSeeADoctor: "Seek urgent medical advice if palpitations are accompanied by chest pain, shortness of breath, dizziness, or fainting. Seek non-urgent advice if palpitations are new, frequent (more than 6 per minute), or if you have a personal or family history of cardiac arrhythmia.",
    gpConversationScript: "I have been experiencing heart palpitations — a fluttering or racing sensation — that began around the same time as my other perimenopausal symptoms. I understand these are often benign ectopic beats driven by autonomic changes from oestrogen fluctuation. I would like an ECG and thyroid function tests to rule out arrhythmia and thyroid dysfunction, and to discuss whether hormone therapy might help stabilise my autonomic nervous system.",

    treatments: [
      {
        name: "Menopausal Hormone Therapy (MHT/HRT)",
        type: "Hormonal",
        evidence: "Moderate",
        description: "Stabilising oestrogen levels often reduces the frequency of palpitations by restoring autonomic balance. Many women report significant improvement after starting MHT.",
      },
      {
        name: "Caffeine and alcohol reduction",
        type: "Lifestyle",
        evidence: "Strong",
        description: "Both caffeine and alcohol are potent triggers for ectopic beats and palpitations. Reducing or eliminating them often produces rapid improvement.",
      },
      {
        name: "Vagal nerve stimulation techniques",
        type: "Non-Hormonal",
        evidence: "Moderate",
        description: "Cold water on the face, the Valsalva manoeuvre (bearing down), or slow diaphragmatic breathing can terminate an episode of palpitations by increasing vagal tone.",
      },
      {
        name: "Magnesium glycinate",
        type: "Supplement",
        evidence: "Moderate",
        description: "Magnesium is essential for cardiac electrical stability. Deficiency is common in perimenopausal women and is associated with increased ectopic beat frequency.",
      },
    ],

    citations: [
      {
        text: "Fluctuating estradiol irritates the cardiac pacing node and the autonomic nervous system, causing sudden benign ventricular ectopic pacing, especially at bedtime.",
        source: "Menopause Wiki — Symptom Database",
        url: "https://menopausewiki.ca/#symptoms-or-diagnosing-perimenopause",
        year: 2023,
      },
      {
        text: "Palpitations affect approximately 28% of perimenopausal women and are strongly associated with vasomotor symptoms.",
        source: "Evernow Menopause Study, 40,000 women",
        url: "https://www.evernow.com/menopause-study",
        year: 2023,
      },
    ],

    relatedSymptoms: ["hot_flashes", "anxiety", "sleep_disruption", "fatigue"],
    wikiUrl: "https://menopausewiki.ca/#symptoms-or-diagnosing-perimenopause",
  },

  // ── 9. Vaginal Atrophy (GSM) ─────────────────────────────────────────────────
  {
    id: "vaginal_atrophy",
    name: "Vaginal Atrophy (GSM)",
    aliases: ["Genitourinary syndrome of menopause", "GSM", "Vaginal dryness", "Vulvovaginal atrophy"],
    category: "Genitourinary",
    prevalence: "Affects up to 45% of post-menopausal women; underreported in perimenopause",
    onsetPhase: "Late perimenopause",
    tagline: "Unlike vasomotor symptoms, vaginal atrophy does not improve with time — it worsens progressively without treatment, but responds remarkably well to localised oestrogen.",

    mechanism: "The vaginal epithelium, urethra, bladder, and pelvic floor are all richly supplied with oestrogen receptors. Oestrogen maintains the thickness, elasticity, and lubrication of vaginal tissue, and supports the Lactobacillus-dominant vaginal microbiome that maintains a protective acidic pH. As oestrogen declines, the vaginal epithelium thins and loses its rugae (folds), collagen content decreases, lubrication diminishes, and the vaginal pH rises — creating conditions for recurrent infections and inflammation. The urethra and bladder are similarly affected, contributing to urinary urgency, frequency, and recurrent UTIs.",
    hormoneInvolved: ["Oestrogen (estradiol)", "Lactobacillus microbiome"],
    clinicalContext: "GSM is the preferred clinical term because it captures the full spectrum of genitourinary symptoms — not just vaginal dryness. It is critically underreported because women are embarrassed to discuss it and because many healthcare providers do not ask about it. Unlike vasomotor symptoms, GSM does not resolve spontaneously — it worsens progressively without treatment. However, it responds extremely well to localised (topical) oestrogen, which carries minimal systemic absorption and is safe for virtually all women, including those with a history of breast cancer (with oncologist guidance).",

    whatToTrack: [
      "Vaginal dryness (at rest and during sexual activity)",
      "Vaginal irritation, burning, or itching",
      "Pain during sexual intercourse (dyspareunia)",
      "Urinary urgency, frequency, or leakage",
      "Recurrent urinary tract infections",
      "Changes in vaginal discharge",
    ],
    whenToSeeADoctor: "Seek medical advice if you are experiencing pain during sexual intercourse, recurrent UTIs (more than 2 per year), urinary incontinence, or significant vaginal discomfort. These symptoms are highly treatable and should not be accepted as an inevitable consequence of ageing.",
    gpConversationScript: "I have been experiencing vaginal dryness, discomfort, and pain during intercourse that has been worsening over the past [X] months. I understand this is the genitourinary syndrome of menopause (GSM), caused by oestrogen decline in the vaginal tissues. I would like to discuss localised vaginal oestrogen therapy, which I understand has minimal systemic absorption and is safe and highly effective. I would also like to discuss whether I might benefit from systemic hormone therapy in addition.",

    treatments: [
      {
        name: "Localised vaginal oestrogen (cream, pessary, ring)",
        type: "Hormonal",
        evidence: "Strong",
        description: "The gold-standard treatment for GSM. Minimal systemic absorption means it is safe for virtually all women, including those with a history of hormone-sensitive cancers (with oncologist guidance). Produces significant improvement in vaginal tissue health, lubrication, and urinary symptoms within 4–12 weeks. Must be used continuously — stopping leads to recurrence.",
      },
      {
        name: "Ospemifene (Osphena)",
        type: "Non-Hormonal",
        evidence: "Strong",
        description: "An oral SERM (selective oestrogen receptor modulator) that acts as an oestrogen agonist in vaginal tissue without stimulating breast or uterine tissue. FDA-approved for dyspareunia due to GSM.",
      },
      {
        name: "Vaginal moisturisers (Replens, hyaluronic acid)",
        type: "Non-Hormonal",
        evidence: "Moderate",
        description: "Non-hormonal vaginal moisturisers used regularly (3x per week) can reduce dryness and discomfort. They do not reverse the underlying tissue changes but provide symptomatic relief.",
      },
      {
        name: "Lubricants",
        type: "Non-Hormonal",
        evidence: "Moderate",
        description: "Silicone or water-based lubricants used during sexual activity reduce friction and discomfort. They do not treat the underlying atrophy but significantly improve comfort.",
      },
      {
        name: "Pelvic floor physiotherapy",
        type: "Non-Hormonal",
        evidence: "Strong",
        description: "Pelvic floor physiotherapy addresses the muscular component of GSM — particularly pelvic floor hypertonicity (tightness) that contributes to dyspareunia. Also addresses urinary incontinence.",
      },
    ],

    citations: [
      {
        text: "Unlike vasomotor symptoms, genitourinary syndrome of menopause does not resolve spontaneously and worsens progressively without treatment.",
        source: "Portman DJ & Gass ML, Menopause, 2014",
        url: "https://pubmed.ncbi.nlm.nih.gov/25160739/",
        year: 2014,
      },
      {
        text: "Vaginal dryness affects 45% of women in postmenopause; it is significantly underreported due to embarrassment.",
        source: "Midi Health — Menopause Statistics 2024",
        url: "https://www.joinmidi.com/post/menopause-statistics",
        year: 2024,
      },
    ],

    relatedSymptoms: ["weight_gain", "fatigue"],
    wikiUrl: "https://menopausewiki.ca/#atrophic-vaginitis-vaginal-atrophy-or-the-genitourinary-syndrome-of-menopause-gsm",
  },

  // ── 10. Weight Gain ─────────────────────────────────────────────────────────
  {
    id: "weight_gain",
    name: "Weight Gain",
    aliases: ["Perimenopausal weight gain", "Belly fat", "Visceral fat", "Metabolic changes", "Meno belly"],
    category: "Metabolic",
    prevalence: "Affects up to 87% of perimenopausal women",
    onsetPhase: "Any phase",
    tagline: "The body composition shift of perimenopause — oestrogen decline redirects fat storage from the hips to the abdomen, and insulin resistance makes it harder to shift.",

    mechanism: "Oestrogen plays a central role in regulating fat distribution, insulin sensitivity, and metabolic rate. In the reproductive years, oestrogen directs fat storage to the hips, thighs, and buttocks (subcutaneous fat). As oestrogen declines, fat redistribution shifts toward the abdomen — specifically visceral fat (fat surrounding the organs). Visceral fat is metabolically active in a harmful way: it secretes inflammatory cytokines, worsens insulin resistance, and increases cardiovascular risk. Simultaneously, oestrogen decline reduces insulin sensitivity, making the body less efficient at managing blood glucose. Muscle mass also declines with age (sarcopenia), reducing basal metabolic rate. The result is weight gain even without changes in diet or activity.",
    hormoneInvolved: ["Oestrogen (estradiol)", "Insulin", "Cortisol", "Leptin"],
    clinicalContext: "Post-menopausal women gain an average of 1.5 pounds per year. The shift to visceral fat distribution is clinically significant: visceral fat is a major risk factor for type 2 diabetes, cardiovascular disease, and certain cancers. A waist circumference above 88cm (35 inches) in women is associated with significantly increased metabolic risk. Addressing perimenopausal weight gain is therefore not merely cosmetic — it is a critical component of long-term health management.",

    whatToTrack: [
      "Waist circumference (more clinically meaningful than total weight)",
      "Body composition changes (muscle loss vs. fat gain)",
      "Blood glucose and insulin levels (fasting glucose, HbA1c)",
      "Correlation with sleep quality (poor sleep drives cortisol and hunger hormones)",
      "Dietary patterns, particularly refined carbohydrate and alcohol intake",
    ],
    whenToSeeADoctor: "Seek medical advice if your waist circumference exceeds 88cm (35 inches), if you have a family history of type 2 diabetes or cardiovascular disease, if you are experiencing unexplained rapid weight gain, or if lifestyle changes are not producing results.",
    gpConversationScript: "I have been experiencing significant weight gain and a shift in body composition — particularly increased abdominal fat — over the past [X] months despite no changes in my diet or activity level. I understand that oestrogen decline redistributes fat to the abdomen and reduces insulin sensitivity. I would like to discuss whether hormone therapy might help address the metabolic component of this change, and I would also like to check my fasting glucose and HbA1c.",

    treatments: [
      {
        name: "Menopausal Hormone Therapy (MHT/HRT)",
        type: "Hormonal",
        evidence: "Moderate",
        description: "MHT does not cause weight gain (a common misconception) and may help prevent the shift to visceral fat distribution. Transdermal oestradiol has a more favourable metabolic profile than oral oestrogen.",
      },
      {
        name: "Resistance training",
        type: "Lifestyle",
        evidence: "Strong",
        description: "The single most effective intervention for perimenopausal body composition. Resistance training preserves and builds muscle mass, increases basal metabolic rate, improves insulin sensitivity, and specifically reduces visceral fat.",
      },
      {
        name: "Protein-prioritised diet",
        type: "Lifestyle",
        evidence: "Strong",
        description: "Adequate protein intake (1.2–1.6g per kg body weight) is essential for preserving muscle mass during perimenopause. Protein also has the highest thermic effect of food and promotes satiety.",
      },
      {
        name: "Reducing refined carbohydrates and alcohol",
        type: "Lifestyle",
        evidence: "Strong",
        description: "Both refined carbohydrates and alcohol drive insulin spikes and visceral fat accumulation. Reducing these has a disproportionate impact on abdominal fat compared to other dietary changes.",
      },
      {
        name: "GLP-1 receptor agonists (Ozempic, Wegovy)",
        type: "Non-Hormonal",
        evidence: "Strong",
        description: "For women with significant metabolic dysfunction or obesity, GLP-1 receptor agonists can produce substantial weight loss and improve insulin sensitivity. Should be used alongside lifestyle changes, not as a replacement.",
      },
    ],

    citations: [
      {
        text: "Post-menopausal women gain an average of 1.5 pounds per year; 87% of Midi patients report issues with weight gain and body composition changes.",
        source: "Midi Health — Menopause Statistics 2024",
        url: "https://www.joinmidi.com/post/menopause-statistics",
        year: 2024,
      },
      {
        text: "Visceral fat accumulation in post-menopausal women is associated with increased risk of cardiovascular disease, type 2 diabetes, and certain cancers.",
        source: "Menopause Wiki — Weight Gain Section",
        url: "https://menopausewiki.ca/#weight-gain",
        year: 2023,
      },
    ],

    relatedSymptoms: ["fatigue", "joint_pain", "sleep_disruption", "brain_fog"],
    wikiUrl: "https://menopausewiki.ca/#weight-gain",
  },
];

// ── Helper functions ──────────────────────────────────────────────────────────

export function getEntryById(id: string): ClinicalEntry | undefined {
  return CLINICAL_KNOWLEDGE_BASE.find((e) => e.id === id);
}

export function getEntriesByCategory(category: SymptomCategory): ClinicalEntry[] {
  return CLINICAL_KNOWLEDGE_BASE.filter((e) => e.category === category);
}

export function searchEntries(query: string): ClinicalEntry[] {
  const q = query.toLowerCase();
  return CLINICAL_KNOWLEDGE_BASE.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.aliases.some((a) => a.toLowerCase().includes(q)) ||
      e.tagline.toLowerCase().includes(q) ||
      e.mechanism.toLowerCase().includes(q)
  );
}

export const CATEGORIES: SymptomCategory[] = [
  "Vasomotor",
  "Sleep",
  "Cognitive",
  "Musculoskeletal",
  "Psychological",
  "Cardiovascular",
  "Metabolic",
  "Genitourinary",
];

export const CATEGORY_COLORS: Record<SymptomCategory, { bg: string; text: string; border: string }> = {
  Vasomotor:     { bg: "bg-orange-50",  text: "text-orange-700",  border: "border-orange-200" },
  Sleep:         { bg: "bg-indigo-50",  text: "text-indigo-700",  border: "border-indigo-200" },
  Cognitive:     { bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200" },
  Musculoskeletal:{ bg: "bg-amber-50",  text: "text-amber-700",   border: "border-amber-200" },
  Psychological: { bg: "bg-purple-50",  text: "text-purple-700",  border: "border-purple-200" },
  Cardiovascular:{ bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200" },
  Metabolic:     { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  Genitourinary: { bg: "bg-pink-50",    text: "text-pink-700",    border: "border-pink-200" },
};
