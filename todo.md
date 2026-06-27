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

## Phase 4 — Cycle Data in Evidence Engine Brief
- [x] Extend generateEvidence tRPC input schema to accept cycleEvents array
- [x] Compute clinical cycle summary on server: avg length, variability, bleeding days, irregular flags
- [x] Embed cycle summary as Section 4 in the GP brief markdown (renumbered)
- [x] Update EvidenceEngine.tsx to pass cycleEvents from vaultStore to the mutation
- [x] Add cycle summary preview card in the Evidence Engine UI (before generating)
- [x] Update existing Evidence Engine test to include cycle data and verify cycle section in brief

## Sprint 1 — HRT & Trigger Data Foundation
- [x] Add HRT types to shared/types.ts (HRTMedication, HRTDoseLog, HRTDeliveryMethod, HRTScheduleType, ApplicationSite)
- [x] Add Trigger types to shared/types.ts (TriggerEntry, TriggerLog, TriggerCorrelation, TriggerAnalysis, TreatmentResponseSummary)
- [x] Extend DayLog with triggers and quickLogOnly fields
- [x] Build hrtEngine.ts — correlation engine + treatment response algorithm
- [x] Build hrtMedications.ts — pre-set medication database (30 entries)
- [x] Extend vaultStore with hrtMedications, hrtDoseLogs, triggerAnalysis state
- [x] Add addHRTMedication, updateHRTMedication, removeHRTMedication, logHRTDose actions
- [x] Add updateTriggerAnalysis action (auto-runs after every saveLog) (runs correlation engine)
- [x] Add hrt_tracker, trigger_tracker, quick_log to TabId union
- [x] Extend loadVaultData to load HRT data from encrypted storage
- [x] Extend resetVault to clear HRT storage keys
- [x] Write unit tests for correlation engine and treatment response algorithm (16 tests, all passing)

## Sprint 2 — HRT Tracker UI
- [x] Build HRTMedicationForm.tsx — 5-step form (name, delivery method, dose/schedule, start date, confirm)
- [x] Build HRTTracker.tsx — 3-view page (My Regimen / Today's Doses / Dose History)
- [x] Build medication card component with patch countdown and adherence badge
- [x] Build Today's Doses view with Mark as Taken, application site selector
- [x] Build Dose History view with adherence percentage and timeline
- [x] Build Treatment Response view — before/after PSS comparison with improved/worsened symptoms — before/after PSS comparison
- [x] Wire HRT Tracker into sidebar navigation (hrt_tracker tab)
- [x] Add HRT reminder card to Dashboard (shows if dose due today)
- [x] Write integration tests for HRT medication CRUD (covered by Sprint 1 unit tests)

## Sprint 3 — Trigger Tracker UI
- [x] Add TriggerExperiment type to shared/types.ts
- [x] Extend vaultStore with triggerExperiments state and CRUD actions
- [x] Build TriggerTracker.tsx — 3-view page (Today / Insights / Experiments)
- [x] Build Today view — one-tap trigger chip grid, intensity selector, previous-day triggers
- [x] Build Insights view — correlation cards with same-day + next-day effect bars
- [x] Build Experiments view — start/track/complete experiment flow
- [x] Wire TriggerTracker into sidebar navigation (trigger_tracker tab)
- [x] Add trigger insight card to Dashboard (shows top trigger after 14 days) (shows top trigger after 14 days)
- [x] Wire trigger logs into Today's Log (triggers stored in DayLog via saveLog) (SymptomLog.tsx) via quick-add

## Sprint 4 — Evidence Engine Integration & Quick Log
- [x] Extend generateEvidence tRPC input schema with hrtMedications and triggerAnalysis
- [x] Write Section 4 (Current Treatment Regimen) in GP brief markdown
- [x] Write Section 5 (Identified Symptom Triggers) in GP brief markdown
- [x] Renumber existing sections 4-8 (Cycle=6, Dismissal=7, Evidence=8)
- [x] Update EvidenceEngine.tsx to pass hrtMedications and triggerAnalysis to mutation
- [x] Add HRT and trigger preview cards to Evidence Engine UI
- [x] Update Evidence Engine tests — 7 new assertions (Treatment Regimen, Oestrogel, Utrogestan, Triggers, Alcohol, Hot Flashes)
- [x] Build QuickLog.tsx modal component (3 questions, 30 seconds)
- [x] Add floating Quick Log FAB to AppShell (globally available inside the app)
- [x] Wire Quick Log save to vaultStore.saveLog with quickLogOnly flag

## Sprint 5 — Appointment Prep & Surgical Menopause Mode
- [x] Build AppointmentPrep.tsx — guided pre-appointment checklist page
- [x] Wire AppointmentPrep into sidebar navigation
- [x] Add menopauseMode to vaultStore (natural | surgical | early) (natural | surgical | early)
- [x] Add surgeryDate field to vaultStore for surgical mode
- [x] Add menopause mode selection as standalone My Journey Mode page in sidebar
- [x] Conditionally replace Cycle Calendar with MenopauseMode in surgical mode
- [x] Build MenopauseMode.tsx with Days Since Surgery counter and mode selector — days since surgery counter + symptom focus
- [x] Replace Cycle Calendar with MenopauseMode in surgical mode routing
- [x] Add Days Since Surgery card to Dashboard in surgical mode

## Sprint 6 — Navigation, Onboarding & Pricing
- [x] Research health app pricing benchmarks and HRT add-on strategy
- [x] Reorganise sidebar into collapsible groups (Core / Clinical Tools / Trackers / Settings)
- [x] Build 3-screen onboarding walkthrough (What is Ripple / Why encryption / 30-day promise)
- [x] Redesign Upgrade Hub with new pricing and HRT add-on tier
- [x] Checkpoint and deliver Stripe connection guidance

## Sprint 7 — Heatmap Calendar & Settings
- [x] Build SymptomHeatmap.tsx component — monthly calendar with PSS colour coding
- [x] Embed SymptomHeatmap in Dashboard (below trend chart) (below trend chart)
- [x] Build Settings.tsx page — vault management, menopause mode, notifications, data export
- [x] Wire Settings into sidebar navigation (settings tab)
- [x] Add data export (JSON download of all vault data)
