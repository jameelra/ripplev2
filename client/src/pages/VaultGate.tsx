import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, RefreshCw, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useVaultStore } from "../stores/vaultStore";

function RippleLogo({ size = 56 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }} className="relative flex items-center justify-center shrink-0 select-none">
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

export default function VaultGate() {
  const { vaultType, unlockAmbientVault, unlockPinVault, setToastNotification } = useVaultStore();
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-unlock ambient vault on mount
  useEffect(() => {
    if (vaultType === "ambient") {
      setIsProcessing(true);
      unlockAmbientVault()
        .catch(() => setError("Auto-unlock failed. Please try again."))
        .finally(() => setIsProcessing(false));
    }
  }, [vaultType, unlockAmbientVault]);

  const handlePinUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);
    try {
      const success = await unlockPinVault(pin);
      if (!success) {
        setError("Incorrect PIN. Please try again.");
        setPin("");
      }
    } catch {
      setError("Decryption failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (vaultType === "ambient") {
    return (
      <div className="min-h-screen bg-[#f5f0ea] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <RippleLogo size={64} />
          <div className="space-y-1">
            <p className="font-serif text-xl font-bold text-[#1a2b22]">Unlocking your vault…</p>
            <p className="text-sm text-[#6b7a72]">Decrypting your health data securely.</p>
          </div>
          {isProcessing && <RefreshCw className="w-6 h-6 text-[#4a8a72] animate-spin mx-auto" />}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}
          {error && (
            <Button
              onClick={() => { setError(null); setIsProcessing(true); unlockAmbientVault().catch(() => setError("Failed again.")).finally(() => setIsProcessing(false)); }}
              className="bg-[#4a8a72] hover:bg-[#3a7060] text-white text-xs font-mono"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Retry
            </Button>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f0ea] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white border border-[#e0d5c8] rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#e0d5c8]/40"
      >
        <div className="flex flex-col items-center text-center space-y-4 mb-6">
          <RippleLogo size={56} />
          <div className="space-y-1">
            <p className="text-[9px] font-mono uppercase tracking-widest text-[#c07060] font-bold">
              Private Vault — Locked
            </p>
            <h2 className="font-serif text-xl font-bold text-[#1a2b22]">Enter Your PIN</h2>
            <p className="text-xs text-[#6b7a72] leading-relaxed">
              Your health data is encrypted. Enter your PIN to decrypt and access your vault.
            </p>
          </div>
        </div>

        <form onSubmit={handlePinUnlock} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase tracking-widest text-[#6b7a72] font-bold">Security PIN</label>
            <div className="relative">
              <Input
                type={showPin ? "text" : "password"}
                placeholder="Enter your PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="bg-[#f5f0ea] border-[#e0d5c8] text-[#1a2b22] pr-10"
                autoFocus
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

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isProcessing || pin.length < 4}
            className="w-full bg-[#c07060] hover:bg-[#a05848] text-white font-mono text-xs font-bold py-3 rounded-xl"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <><Lock className="w-4 h-4 mr-2" />Unlock Vault</>
            )}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#e0d5c8] text-center">
          <p className="text-[9px] font-mono uppercase tracking-widest text-[#a0a098]">
            AES-GCM · PBKDF2 · 600K Iterations
          </p>
        </div>
      </motion.div>
    </div>
  );
}
