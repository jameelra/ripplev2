import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ShieldCheck, Lock, ArrowRight, Eye, EyeOff, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useVaultStore } from "../stores/vaultStore";

// ─── Ripple Logo ──────────────────────────────────────────────────────────────
function RippleLogo({ size = 56 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative flex items-center justify-center shrink-0 select-none"
    >
      <div className="absolute inset-0 rounded-full bg-[#f5f0ea] border border-[#e0d5c8] flex items-center justify-center">
        <div className="w-[80%] h-[80%] rounded-full border border-[#c8d8d0]/60 bg-[#eef4f1] flex items-center justify-center">
          <div className="w-[60%] h-[60%] rounded-full border border-[#a8c8bc]/70 bg-[#dbeee7] flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-[#c07060] animate-ripple" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i < current ? "bg-[#4a8a72] w-6" : i === current ? "bg-[#4a8a72] w-8" : "bg-[#e0d5c8] w-4"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Legal Step Component ─────────────────────────────────────────────────────
function LegalStep({
  step,
  title,
  subtitle,
  content,
  checkLabel,
  checked,
  onCheck,
  onNext,
}: {
  step: number;
  title: string;
  subtitle: string;
  content: React.ReactNode;
  checkLabel: string;
  checked: boolean;
  onCheck: (v: boolean) => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#c07060] font-bold">
          Step {step} of 5 — Legal Agreement
        </p>
        <h2 className="font-serif text-2xl font-bold text-[#1a2b22]">{title}</h2>
        <p className="text-sm text-[#6b7a72]">{subtitle}</p>
      </div>

      <div className="bg-[#f5f0ea] border border-[#e0d5c8] rounded-xl p-4 max-h-52 overflow-y-auto scrollbar-thin text-sm text-[#4a4a42] leading-relaxed space-y-3">
        {content}
      </div>

      <div className="flex items-start gap-3 bg-[#eef4f1] border border-[#c8d8d0] rounded-xl p-4">
        <Checkbox
          id={`legal-check-${step}`}
          checked={checked}
          onCheckedChange={(v) => onCheck(Boolean(v))}
          className="mt-0.5 border-[#4a8a72] data-[state=checked]:bg-[#4a8a72] data-[state=checked]:border-[#4a8a72]"
        />
        <label
          htmlFor={`legal-check-${step}`}
          className="text-sm font-medium text-[#1a2b22] cursor-pointer leading-relaxed"
        >
          {checkLabel}
        </label>
      </div>

      <Button
        onClick={onNext}
        disabled={!checked}
        className="w-full bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
      >
        I Understand, Continue <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}

// ─── Main Onboarding Component ────────────────────────────────────────────────
export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [tosChecked, setTosChecked] = useState(false);
  const [vaultChoice, setVaultChoice] = useState<"ambient" | "pin" | null>(null);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    setupAmbientVault,
    setupPinVault,
    setIsOnboardingCompleted,
    setIsLegalAccepted,
    setToastNotification,
  } = useVaultStore();

  const handleAmbientSetup = async () => {
    setIsProcessing(true);
    try {
      await setupAmbientVault();
      setIsLegalAccepted(true);
      setIsOnboardingCompleted(true);
      setToastNotification({
        type: "success",
        title: "Vault Activated",
        description: "Your health data is now encrypted and protected on this device.",
      });
      onComplete();
    } catch (err) {
      setToastNotification({ type: "error", title: "Setup Failed", description: String(err) });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePinSetup = async () => {
    setPinError(null);
    if (pin.length < 4) { setPinError("PIN must be at least 4 characters."); return; }
    if (pin !== confirmPin) { setPinError("PINs do not match."); return; }
    setIsProcessing(true);
    try {
      await setupPinVault(pin);
      setIsLegalAccepted(true);
      setIsOnboardingCompleted(true);
      setToastNotification({
        type: "success",
        title: "Private Vault Activated",
        description: "Zero-knowledge encryption is now active. Your PIN is never stored.",
      });
      onComplete();
    } catch (err) {
      setToastNotification({ type: "error", title: "Setup Failed", description: String(err) });
    } finally {
      setIsProcessing(false);
    }
  };

  const steps = [
    // ─── Walkthrough Screen 1: What is Ripple? ────────────────────────────────
    <div key="walk1" className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-[#eef4f1] rounded-3xl flex items-center justify-center text-4xl">📊</div>
      </div>
      <div className="space-y-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#c07060] font-bold">1 of 3</p>
        <h1 className="font-serif text-2xl font-bold text-[#1a2b22]">Your body is telling you something.</h1>
        <p className="text-sm text-[#6b7a72] leading-relaxed max-w-sm mx-auto">
          Ripple helps you track perimenopause symptoms, understand your biology, and walk into GP appointments with clinical-grade evidence — not just a feeling.
        </p>
      </div>
      <div className="space-y-2.5 text-left">
        {[
          { emoji: "📈", title: "12 symptom sliders", desc: "Log hot flashes, brain fog, joint pain and more in under 60 seconds" },
          { emoji: "📊", title: "Greene Climacteric Scale", desc: "A validated clinical score your doctor will recognise" },
          { emoji: "💊", title: "HRT Tracker", desc: "Log your medications, track adherence, see what's working" },
          { emoji: "🧹", title: "Trigger Tracker", desc: "Discover what makes your symptoms better or worse" },
        ].map(({ emoji, title, desc }) => (
          <div key={title} className="flex items-start gap-3 bg-[#f5f0ea] rounded-xl p-3">
            <span className="text-xl shrink-0">{emoji}</span>
            <div>
              <p className="text-xs font-bold text-[#1a2b22]">{title}</p>
              <p className="text-[10px] text-[#6b7a72] leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <Button onClick={() => setStep(1)} className="w-full bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold py-3.5 rounded-xl">
        Next <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>,

    // ─── Walkthrough Screen 2: Why encryption matters ─────────────────────────
    <div key="walk2" className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-[#faf5f3] rounded-3xl flex items-center justify-center text-4xl">🔒</div>
      </div>
      <div className="space-y-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#c07060] font-bold">2 of 3</p>
        <h1 className="font-serif text-2xl font-bold text-[#1a2b22]">Your health data belongs to you. Only you.</h1>
        <p className="text-sm text-[#6b7a72] leading-relaxed max-w-sm mx-auto">
          In a world where period tracking data has been used against women, Ripple takes a different approach.
        </p>
      </div>
      <div className="bg-[#1a2b22] rounded-2xl p-5 text-left space-y-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#4a8a72] font-bold">Zero-Knowledge Architecture</p>
        <p className="text-sm text-white/90 leading-relaxed">
          Your symptoms are encrypted in your browser using <strong className="text-white">AES-GCM</strong> before they leave your device. We store only the encrypted ciphertext.
        </p>
        <p className="text-xs text-white/60 leading-relaxed">
          This means: even if our servers were hacked, your health data would be unreadable. Even we cannot read it.
        </p>
        <div className="border-t border-white/10 pt-3 space-y-1.5">
          {[
            "✓ No data selling, ever",
            "✓ No third-party sharing",
            "✓ No time limits on your data",
            "✓ Full deletion on request",
          ].map((item) => (
            <p key={item} className="text-xs text-[#4a8a72] font-mono font-bold">{item}</p>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setStep(0)} className="flex-1 text-xs border-[#e0d5c8] text-[#6b7a72]">Back</Button>
        <Button onClick={() => setStep(2)} className="flex-1 bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold py-3.5 rounded-xl">
          Next <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>,

    // ─── Walkthrough Screen 3: The 30-day promise ─────────────────────────────
    <div key="walk3" className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="w-20 h-20 bg-[#eef4f1] rounded-3xl flex items-center justify-center text-4xl">🏆</div>
      </div>
      <div className="space-y-3">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#c07060] font-bold">3 of 3</p>
        <h1 className="font-serif text-2xl font-bold text-[#1a2b22]">30 days changes everything.</h1>
        <p className="text-sm text-[#6b7a72] leading-relaxed max-w-sm mx-auto">
          After 30 days of logging, Ripple transforms from a tracker into a clinical advocate.
        </p>
      </div>
      <div className="space-y-3">
        {[
          { days: "Day 1",  icon: "📝", title: "Start logging",              desc: "Your first symptom log takes 60 seconds" },
          { days: "Day 7",  icon: "📈", title: "Patterns emerge",            desc: "Your PSS score and trend charts come alive" },
          { days: "Day 14", icon: "⚡",    title: "Triggers identified",        desc: "Discover what's making your symptoms worse" },
          { days: "Day 30", icon: "🏥", title: "GP brief ready",             desc: "Walk in with a clinical-grade 8-section evidence report" },
        ].map(({ days, icon, title, desc }) => (
          <div key={days} className="flex items-center gap-4 bg-[#f5f0ea] rounded-xl p-3.5 text-left">
            <div className="text-center shrink-0 w-10">
              <p className="text-[9px] font-mono font-bold text-[#c07060] uppercase tracking-wider">{days}</p>
              <span className="text-xl">{icon}</span>
            </div>
            <div>
              <p className="text-xs font-bold text-[#1a2b22]">{title}</p>
              <p className="text-[10px] text-[#6b7a72] leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setStep(1)} className="flex-1 text-xs border-[#e0d5c8] text-[#6b7a72]">Back</Button>
        <Button onClick={() => setStep(3)} className="flex-1 bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold py-3.5 rounded-xl">
          Get Started <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>,

    // Step 3: Welcome (was Step 0)
    <div key="welcome" className="space-y-6 text-center">
      <div className="flex justify-center">
        <RippleLogo size={72} />
      </div>
      <div className="space-y-2">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#c07060] font-bold">
          Sovereign Health Timeline
        </p>
        <h1 className="font-serif text-3xl font-bold text-[#1a2b22]">Welcome to Ripple</h1>
        <p className="text-sm text-[#6b7a72] max-w-sm mx-auto leading-relaxed">
          A discreet, privacy-first companion for tracking perimenopause symptoms, understanding your biology, and walking into GP appointments armed with clinical-grade evidence.
        </p>
      </div>
      <div className="grid gap-3 text-left">
        {[
          { icon: ShieldCheck, title: "Zero-Knowledge Privacy", desc: "Your health data is encrypted in your browser. We can never read it." },
          { icon: Lock, title: "Clinical-Grade Evidence", desc: "Generate GP appointment briefs backed by NAMS and BMS guidelines." },
          { icon: CheckCircle2, title: "Your Data, Your Control", desc: "No time limits, no data selling, no third-party sharing." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex gap-3 items-start bg-[#f5f0ea] border border-[#e0d5c8] rounded-xl p-3.5">
            <Icon className="w-5 h-5 text-[#4a8a72] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-[#1a2b22]">{title}</p>
              <p className="text-xs text-[#6b7a72] leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
      <Button
        onClick={() => setStep(4)}
        className="w-full bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold py-3.5 rounded-xl"
      >
        Get Started <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>,

    // Step 4: Medical Disclaimer (was Step 1)
    <LegalStep
      key="disclaimer"
      step={4}
      title="Medical Disclaimer"
      subtitle="Please read carefully before proceeding."
      content={
        <>
          <div className="flex gap-2 items-start bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-amber-800">This is not a medical device. Read before continuing.</p>
          </div>
          <p><strong>Ripple is for informational and educational purposes only.</strong> The application, including all AI-generated insights, symptom analyses, and educational content, does not constitute professional medical advice, diagnosis, or treatment.</p>
          <p>Ripple is not a medical device as defined by the U.S. Food and Drug Administration (FDA) under the 21st Century Cures Act. It is classified as a general wellness application intended to help users track and understand their health patterns.</p>
          <p><strong>Always seek the advice of your physician or other qualified health provider</strong> with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read or generated on the Ripple application.</p>
          <p>Reliance on any information provided by Ripple is solely at your own risk. The involvement of medical professionals in the design of this application does not create a doctor-patient relationship between those professionals and you.</p>
          <p>If you are experiencing a medical emergency, call your local emergency services immediately.</p>
        </>
      }
      checkLabel="I have read and understand the Medical Disclaimer. I acknowledge that Ripple is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment."
      checked={disclaimerChecked}
      onCheck={setDisclaimerChecked}
      onNext={() => setStep(5)}
    />,

    // Step 5: Privacy Policy (was Step 2)
    <LegalStep
      key="privacy"
      step={5}
      title="Privacy Policy"
      subtitle="How Ripple protects your health data."
      content={
        <>
          <p><strong>Zero-Knowledge Architecture:</strong> All health data — including symptom logs, diary entries, and biological signals — is encrypted client-side in your browser using AES-GCM encryption before it is stored. Ripple's servers only ever receive and store encrypted ciphertext. We cannot read your health data.</p>
          <p><strong>Data We Collect:</strong> We collect your account information (email, name) for authentication purposes. We collect encrypted vault blobs for cloud backup. We do not collect raw health data.</p>
          <p><strong>Data We Never Share:</strong> We will never sell, share, or disclose your health data to third parties, advertisers, data brokers, or marketing networks. Your reproductive and hormonal health data is treated with the highest level of sensitivity.</p>
          <p><strong>Your Rights:</strong> You have the right to request complete deletion of all your data at any time. You can export your data in a portable format. You can withdraw consent at any time by deleting your account.</p>
          <p><strong>Applicable Laws:</strong> We comply with the FTC Health Breach Notification Rule, the CCPA/CPRA (California), the GDPR (European Union), and the 2024 HIPAA Privacy Rule updates for reproductive health data.</p>
          <p><strong>Cookies:</strong> We use only essential session cookies for authentication. We do not use tracking or advertising cookies.</p>
        </>
      }
      checkLabel="I have read and agree to the Privacy Policy. I understand how my data is collected, stored, and protected."
      checked={privacyChecked}
      onCheck={setPrivacyChecked}
      onNext={() => setStep(6)}
    />,

    // Step 6: Terms of Service (was Step 3)
    <LegalStep
      key="tos"
      step={6}
      title="Terms of Service"
      subtitle="The rules that govern your use of Ripple."
      content={
        <>
          <p><strong>Acceptance:</strong> By using Ripple, you agree to these Terms of Service. If you do not agree, please do not use the application.</p>
          <p><strong>Permitted Use:</strong> Ripple is intended for personal health tracking and educational purposes only. You must be 18 years of age or older to use this application.</p>
          <p><strong>Not a Medical Service:</strong> Ripple does not provide medical advice, diagnosis, or treatment. The AI-generated insights are for educational reference only and must not be used as a basis for medical decisions without consulting a qualified healthcare provider.</p>
          <p><strong>User Responsibilities:</strong> You are responsible for maintaining the security of your vault PIN. You agree not to use Ripple for any unlawful purpose. You agree not to attempt to reverse-engineer, copy, or redistribute the application.</p>
          <p><strong>Intellectual Property:</strong> All content, features, and functionality of Ripple are owned by the Ripple development team and are protected by applicable intellectual property laws.</p>
          <p><strong>Limitation of Liability:</strong> To the maximum extent permitted by law, Ripple and its creators shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the application.</p>
          <p><strong>Governing Law:</strong> These Terms shall be governed by and construed in accordance with applicable laws.</p>
        </>
      }
      checkLabel="I have read and agree to the Terms of Service. I am 18 years of age or older."
      checked={tosChecked}
      onCheck={setTosChecked}
      onNext={() => setStep(7)}
    />,

    // Step 7: Vault Setup (was Step 4)
    <div key="vault" className="space-y-5">
      <div className="space-y-1">
        <p className="text-[10px] font-mono uppercase tracking-widest text-[#c07060] font-bold">
          Step 7 of 8 — Security Vault
        </p>
        <h2 className="font-serif text-2xl font-bold text-[#1a2b22]">Protect Your Health Data</h2>
        <p className="text-sm text-[#6b7a72] leading-relaxed">
          Choose how you want to secure your encrypted health vault. All data is encrypted in your browser — we never see it.
        </p>
      </div>

      {!vaultChoice ? (
        <div className="grid gap-3">
          <button
            onClick={() => setVaultChoice("ambient")}
            className="w-full text-left bg-[#eef4f1] hover:bg-[#ddeee7] border border-[#c8d8d0] rounded-xl p-4 transition-all"
          >
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-[#4a8a72] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-[#1a2b22]">Frictionless Mode</p>
                <p className="text-xs text-[#6b7a72] mt-1 leading-relaxed">
                  No PIN required. Your vault is automatically secured using a device-specific key. Seamless access every time.
                </p>
                <p className="text-[10px] font-mono text-[#4a8a72] mt-2 uppercase tracking-wider font-bold">Recommended for most users</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setVaultChoice("pin")}
            className="w-full text-left bg-[#faf5f3] hover:bg-[#f5ede9] border border-[#e8d8d0] rounded-xl p-4 transition-all"
          >
            <div className="flex items-start gap-3">
              <Lock className="w-6 h-6 text-[#c07060] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-[#1a2b22]">Private PIN Mode</p>
                <p className="text-xs text-[#6b7a72] mt-1 leading-relaxed">
                  Set a personal PIN. Maximum security — your data can only be decrypted with your PIN. Never stored or transmitted.
                </p>
                <p className="text-[10px] font-mono text-[#c07060] mt-2 uppercase tracking-wider font-bold">Maximum privacy</p>
              </div>
            </div>
          </button>
        </div>
      ) : vaultChoice === "ambient" ? (
        <div className="space-y-4">
          <div className="bg-[#eef4f1] border border-[#c8d8d0] rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#4a8a72]" />
              <p className="font-bold text-sm text-[#1a2b22]">Frictionless Mode Selected</p>
            </div>
            <p className="text-xs text-[#6b7a72] leading-relaxed">
              Your vault will be automatically secured using AES-GCM encryption with a device-specific key derived via PBKDF2 (600,000 iterations). No PIN needed.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setVaultChoice(null)} className="flex-1 text-xs">
              ← Back
            </Button>
            <Button
              onClick={handleAmbientSetup}
              disabled={isProcessing}
              className="flex-1 bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold rounded-xl"
            >
              {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Activate Vault <ArrowRight className="w-4 h-4 ml-1" /></>}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-widest text-[#6b7a72] font-bold">Create PIN</label>
              <div className="relative">
                <Input
                  type={showPin ? "text" : "password"}
                  placeholder="Minimum 4 characters"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="bg-[#f5f0ea] border-[#e0d5c8] text-[#1a2b22] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7a72]"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-mono uppercase tracking-widest text-[#6b7a72] font-bold">Confirm PIN</label>
              <Input
                type="password"
                placeholder="Re-enter your PIN"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                className="bg-[#f5f0ea] border-[#e0d5c8] text-[#1a2b22]"
              />
            </div>
            {pinError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">{pinError}</p>
            )}
            <p className="text-[10px] text-[#6b7a72] leading-relaxed">
              ⚠️ Your PIN is never stored or transmitted. If you forget it, your vault data cannot be recovered. Store it safely.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setVaultChoice(null)} className="flex-1 text-xs">
              ← Back
            </Button>
            <Button
              onClick={handlePinSetup}
              disabled={isProcessing || pin.length < 4}
              className="flex-1 bg-[#c07060] hover:bg-[#a05848] text-white font-mono text-xs font-bold rounded-xl"
            >
              {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <>Activate Private Vault <ArrowRight className="w-4 h-4 ml-1" /></>}
            </Button>
          </div>
        </div>
      )}
    </div>,
  ];

  return (
    <div className="min-h-screen bg-[#f5f0ea] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#e0d5c8] rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#e0d5c8]/40 relative overflow-hidden">
        {/* Decorative ripple */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#eef4f1]/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <RippleLogo size={28} />
            <span className="text-sm font-bold text-[#1a2b22] font-serif">Ripple</span>
          </div>
          <StepIndicator current={step} total={8} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 pt-4 border-t border-[#e0d5c8] text-center">
          <p className="text-[9px] font-mono uppercase tracking-widest text-[#a0a098]">
            Privacy-Preserving Wellness Reference · Not Medical Advice
          </p>
        </div>
      </div>
    </div>
  );
}
