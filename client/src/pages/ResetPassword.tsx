import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Loader2, Lock, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { validateNewPassword } from "@/lib/passwordReset";

function RippleLogo({ size = 56 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size }} className="relative flex items-center justify-center shrink-0 select-none">
      <div className="absolute inset-0 rounded-full bg-[#f5f0ea] border border-[#e0d5c8] flex items-center justify-center">
        <div className="w-[80%] h-[80%] rounded-full border border-[#c8d8d0]/60 bg-[#eef4f1] flex items-center justify-center">
          <div className="w-[60%] h-[60%] rounded-full border border-[#a8c8bc]/70 bg-[#dbeee7] flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-[#c07060]" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Reached via the link in the password-reset email (see AuthContext.resetPassword,
// which sets redirectTo to this route). Supabase's client parses the recovery
// token out of the URL on load and turns it into a session — by the time
// AuthProvider's `loading` flips to false, `session` is either that recovery
// session (link valid) or null (link invalid/expired/already used).
export default function ResetPassword() {
  const { session, loading, updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateNewPassword(password, confirmPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    const result = await updatePassword(password);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f0ea] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <RippleLogo size={64} />
          <p className="text-sm text-[#6b7a72]">Verifying your reset link…</p>
          <Loader2 className="w-6 h-6 text-[#4a8a72] animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#f5f0ea] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-white border border-[#e0d5c8] rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#e0d5c8]/40 text-center space-y-4"
        >
          <div className="w-12 h-12 rounded-xl bg-[#eef4f1] border border-[#c8d8d0] flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6 text-[#4a8a72]" />
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-xl font-bold text-[#1a2b22]">Password updated</h2>
            <p className="text-sm text-[#6b7a72]">You can now log in with your new password.</p>
          </div>
          <Button
            onClick={() => { window.location.href = "/"; }}
            className="w-full h-10 bg-[#1a2b22] hover:bg-[#1a2b22]/90 text-white rounded-xl text-sm font-medium"
          >
            Continue to Ripple
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#f5f0ea] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm bg-white border border-[#e0d5c8] rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#e0d5c8]/40 text-center space-y-4"
        >
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-left">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
            <p className="text-xs text-red-700">
              This password reset link is invalid or has expired. Request a new one from the log in screen.
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = "/"; }}
            className="w-full h-10 bg-[#1a2b22] hover:bg-[#1a2b22]/90 text-white rounded-xl text-sm font-medium"
          >
            Back to Ripple
          </Button>
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
            <h2 className="font-serif text-xl font-bold text-[#1a2b22]">Set a new password</h2>
            <p className="text-xs text-[#6b7a72] leading-relaxed">
              Choose a new password for your Ripple account.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reset-password">New password</Label>
            <Input
              id="reset-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reset-confirm-password">Confirm new password</Label>
            <Input
              id="reset-confirm-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-10 bg-[#1a2b22] hover:bg-[#1a2b22]/90 text-white rounded-xl text-sm font-medium"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Lock className="w-4 h-4 mr-2" />Update Password</>}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
