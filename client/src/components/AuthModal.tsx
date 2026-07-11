import { useState, type FormEvent } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already registered") || m.includes("already exists")) {
    return "That email is already registered — try logging in instead.";
  }
  if (m.includes("invalid login credentials")) {
    return "Incorrect email or password.";
  }
  if (m.includes("password") && (m.includes("6") || m.includes("short") || m.includes("weak"))) {
    return "Password must be at least 6 characters.";
  }
  if (m.includes("valid email")) {
    return "Please enter a valid email address.";
  }
  return message;
}

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setEmail("");
    setPassword("");
    setError(null);
    setNotice(null);
    setSubmitting(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeAuthModal();
      reset();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setSubmitting(true);

    const result = mode === "signIn" ? await signIn(email, password) : await signUp(email, password);

    setSubmitting(false);

    if (result.error) {
      setError(friendlyAuthError(result.error));
      return;
    }

    if (mode === "signUp" && result.needsEmailConfirmation) {
      setNotice("Account created — check your email to confirm it, then log in.");
      setMode("signIn");
      setPassword("");
      return;
    }

    closeAuthModal();
    reset();
  };

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-white rounded-2xl border border-[#e0d5c8] p-0 gap-0 overflow-hidden">
        <div className="flex flex-col items-center gap-2 p-6 pb-4 text-center bg-[#f5f0ea] border-b border-[#e0d5c8]">
          <div className="w-12 h-12 rounded-xl bg-white border border-[#e0d5c8] flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-[#4a8a72]" />
          </div>
          <DialogTitle className="font-serif text-xl font-bold text-[#1a2b22]">
            {mode === "signIn" ? "Welcome back" : "Create your account"}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#6b7a72]">
            Your Ripple account handles sign-in only — your symptom data stays encrypted on this device.
          </DialogDescription>
        </div>

        <Tabs
          value={mode}
          onValueChange={(v) => {
            setMode(v as "signIn" | "signUp");
            setError(null);
            setNotice(null);
          }}
          className="p-6 pt-5"
        >
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="signIn">Log In</TabsTrigger>
            <TabsTrigger value="signUp">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value={mode} forceMount className="m-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="auth-email">Email</Label>
                <Input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="auth-password">Password</Label>
                <Input
                  id="auth-password"
                  type="password"
                  autoComplete={mode === "signIn" ? "current-password" : "new-password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              {notice && (
                <p className="text-xs text-[#4a8a72] bg-[#eef4f1] border border-[#c8d8d0] rounded-lg px-3 py-2">
                  {notice}
                </p>
              )}

              <DialogFooter className="pt-1">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-10 bg-[#1a2b22] hover:bg-[#1a2b22]/90 text-white rounded-xl text-sm font-medium"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : mode === "signIn" ? (
                    "Log In"
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
