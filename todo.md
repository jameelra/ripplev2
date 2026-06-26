# Ripple v2 — Project TODO

## Foundation
- [x] Global design system — CSS variables, fonts (Playfair Display + Inter), color palette
- [x] Database schema — users, symptom_logs, cycle_events, vault_blobs tables
- [x] Shared types — SymptomLog, DayLog, CycleLog, BiologicalSignals
- [x] Client-side crypto utilities — AES-GCM encrypt/decrypt, PBKDF2 key derivation
- [x] Zustand vault store — sessionKey, isVaultConfigured, licenseTier, logs, activeTab

## Onboarding & Legal (Feature 1 & 2)
- [x] Onboarding step 1 — Medical Disclaimer with mandatory checkbox (unskippable)
- [x] Onboarding step 2 — Privacy Policy acceptance (unskippable)
- [x] Onboarding step 3 — Terms of Service acceptance (unskippable)
- [x] Onboarding step 4 — Vault setup: choose Ambient Mode or Private PIN Mode
- [x] Ambient vault setup — derive key from device constant, auto-unlock on return
- [x] PIN vault setup — PBKDF2 key derivation, PIN confirmation, min 4 chars
- [x] Vault unlock screen — re-authenticate on return visit

## Dashboard (Feature 3)
- [x] Perimenopause Severity Score (PSS) calculation and display
- [x] Symptom trend chart (Recharts line chart, last 14 days)
- [x] Sleep & HRV biometric summary cards
- [x] Streak tracker (consecutive logging days)
- [x] Empty state for new users

## Symptom Logging (Feature 4 & 5)
- [x] 12-symptom severity sliders (0–3 scale): hot flashes, night sweats, brain fog, joint pain, sleep latency, irritability, anxiety, fatigue, heart palpitations, breast tenderness, bloating, post-carb crash
- [x] Biological signals form: sleep duration, sleep efficiency, HRV, resting heart rate
- [x] Cycle tracker: period logging, flow intensity (light/medium/heavy/spotting), irregular pattern detection
- [x] Save log to encrypted vault (localStorage via AES-GCM)
- [x] AI diary text field with LLM analysis trigger

## AI Diary Analysis (Feature 7)
- [x] Free-text diary entry field
- [x] LLM call via built-in Forge API for symptom extraction and narrative insight
- [x] Heuristic fallback when LLM unavailable
- [x] Display extracted symptoms, hormone prediction, and narrative insight

## Evidence Engine (Feature 8)
- [x] Greene Climacteric Scale score calculation (vasomotor, somatic, psychological clusters)
- [x] Structured GP appointment brief generator
- [x] Peer-reviewed citations (NAMS, BMS, Endocrine Society)
- [x] Print/copy-to-clipboard functionality
- [x] Pro tier gate

## Reverse Symptom Lookup (Feature 9)
- [x] Search input for unusual symptoms
- [x] Perimenopause correlation database (burning tongue, frozen shoulder, formication, etc.)
- [x] GP conversation script generator per symptom
- [x] LLM-enhanced lookup for unlisted symptoms (Pro tier)

## Upgrade Hub (Feature 10)
- [x] Free tier feature list
- [x] Pro tier — $9.99/mo feature list
- [x] Premier tier — $17.99/mo feature list
- [x] Feature-limit gating (not time-limit gating)
- [x] Upgrade CTA buttons

## Navigation & Layout
- [x] App shell with sidebar navigation (dashboard-style)
- [x] Mobile-responsive hamburger menu
- [x] Active tab state management via Zustand
- [x] Toast notification system

## Phase 1 — Menopause Wiki Integration
- [x] Build wikiLinkMap — symptom-to-wiki-URL mapping for all 40+ topics
- [x] Update ReverseLookup — add "Learn More on Menopause Wiki" per symptom result
- [x] Update ReverseLookup — add "Browse All Symptoms" wiki link in header
- [x] Update EvidenceEngine — add "Clinical References" panel with wiki + NAMS/BMS links
- [x] Update EvidenceEngine — add treatment reference links in the GP brief footer
- [x] Add Resources page — curated wiki sections, provider directories, books, podcasts
- [x] Wire Resources tab into sidebar navigation
- [x] Add contextual wiki nudge on Dashboard empty state
- [x] Add "Learn More" wiki link on Symptom Log per symptom slider

## Phase 2 — Clinical Knowledge Base & Dismissal Tracker

### Clinical Knowledge Base
- [x] Write 10 original symptom entries (hot flashes, night sweats, brain fog, joint pain, sleep disruption, anxiety, fatigue, heart palpitations, vaginal atrophy, weight gain)
- [x] Build clinicalKnowledgeBase.ts — structured TypeScript data file with all entries
- [x] Build ClinicalKnowledgeBase page — searchable, filterable symptom encyclopedia
- [x] Wire ClinicalKnowledgeBase into sidebar navigation
- [x] Add "Learn More" deep-links from Symptom Log sliders to CKB entries

### Dismissal Record Tracker
- [x] Add dismissals array to vaultStore — encrypted storage
- [x] Build DismissalTracker page — form to log a new dismissal record
- [x] Build dismissal record list with edit/delete
- [x] Wire dismissal records into Evidence Engine GP brief
- [x] Add Dismissal Tracker to sidebar navigation

## Phase 3 — Cycle Calendar & Biological Correlations

### Cycle Calendar
- [x] Extend vaultStore with cycleEvents array (period start/end, ovulation, spotting) and encrypted storage
- [x] Build cycle intelligence engine — predict ovulation window, next period, flag irregular cycles
- [x] Build CycleCalendar page — interactive monthly calendar with colour-coded markers
- [x] Add Reproductive Window Intelligence banner with analysis status
- [x] Add Log History Trace panel (right side) showing recent cycle events
- [x] Add quick-log buttons: Period Began, Active Day, Ovulation, Spotting
- [x] Wire CycleCalendar into sidebar navigation

### Biological Correlations Chart
- [x] Build BiologicalCorrelations component — dual-axis time-series chart using Recharts
- [x] Implement metric switcher: Sleep & HRV | Aches & Flashes | Mood & Sleep
- [x] Add hover/touch tooltip showing exact values per date
- [x] Embed BiologicalCorrelations in Dashboard (below trend chart)
- [x] Add BiologicalCorrelations as standalone page accessible from sidebar
