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
