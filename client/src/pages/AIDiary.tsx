import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RefreshCw, AlertCircle, BookOpen, Zap, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useVaultStore } from "../stores/vaultStore";
import { Streamdown } from "streamdown";

export default function AIDiary() {
  const { logs, saveLog, getLogForToday } = useVaultStore();
  const [text, setText] = useState(getLogForToday()?.diaryText ?? "");
  const [result, setResult] = useState<{
    narrativeInsight: string;
    hormonePrediction: string;
    extractedSymptoms: string[];
    disclaimer: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeMutation = trpc.ai.analyzeDiary.useMutation({
    onSuccess: (data) => {
      setResult(data.data);
      setIsAnalyzing(false);
    },
    onError: () => {
      setIsAnalyzing(false);
    },
  });

  const handleAnalyze = () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    analyzeMutation.mutate({ text });
  };

  const handleSaveDiary = async () => {
    const today = new Date().toISOString().split("T")[0];
    const existing = getLogForToday();
    const log = existing ?? {
      id: today,
      date: today,
      symptoms: {
        hotFlashes: 0, nightSweats: 0, sleepLatency: 0, jointPain: 0,
        brainFog: 0, irritability: 0, anxiety: 0, fatigue: 0,
        heartPalpitations: 0, breastTenderness: 0, bloating: 0, postCarbCrash: 0,
      },
      signals: { sleepDuration: 7, sleepEfficiency: 85, hrv: 55, restingHeartRate: 68 },
      cycle: { cycleActive: false, spotting: false },
      diaryText: text,
      timestamp: new Date().toISOString(),
    };
    await saveLog({
      ...log,
      diaryText: text,
      aiInsight: result?.narrativeInsight,
      hormonePrediction: result?.hormonePrediction,
    });
  };

  const examplePrompts = [
    "Woke up at 3am drenched in sweat, couldn't get back to sleep. My hands were stiff this morning and I had a brain fog all afternoon.",
    "Feeling really anxious today for no reason. Heart was racing a bit in the evening. Tired but can't sleep.",
    "Hot flash hit me during a meeting today — so embarrassing. Joint pain in my knees is worse when it's cold.",
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="ripple-section-title">AI Diary Analysis</h1>
        <p className="text-sm text-[#6b7a72] mt-1">
          Describe how you feel — the AI extracts symptom insights and hormonal patterns
        </p>
      </div>

      {/* Disclaimer Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Educational purposes only.</strong> AI-generated insights are not medical diagnoses. Always consult your healthcare provider.
        </p>
      </div>

      {/* Diary Input */}
      <div className="ripple-card p-5 space-y-4">
        <div>
          <p className="ripple-label mb-0.5">Today's Journal Entry</p>
          <p className="text-xs text-[#6b7a72]">Write freely — describe your symptoms, mood, energy, and anything unusual</p>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="How are you feeling today? Describe any symptoms, patterns, or changes you've noticed..."
          rows={6}
          className="w-full bg-[#f5f0ea] border border-[#e0d5c8] rounded-xl p-4 text-sm text-[#1a2b22] placeholder-[#9a9490] resize-none focus:outline-none focus:border-[#4a8a72]/50 leading-relaxed"
        />

        {/* Example prompts */}
        {!text && (
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[#9a9490] font-bold">Example entries</p>
            <div className="space-y-1.5">
              {examplePrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setText(prompt)}
                  className="w-full text-left text-xs text-[#6b7a72] bg-[#f5f0ea] hover:bg-[#eef4f1] border border-[#e0d5c8] rounded-lg px-3 py-2.5 transition-colors leading-relaxed"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleAnalyze}
            disabled={!text.trim() || isAnalyzing}
            className="flex-1 bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold py-3 rounded-xl"
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analysing…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Analyse with AI
              </span>
            )}
          </Button>
          {text && (
            <Button
              onClick={handleSaveDiary}
              variant="outline"
              className="px-4 text-xs font-mono border-[#e0d5c8] text-[#6b7a72]"
            >
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Analysis Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Hormone Prediction Badge */}
            <div className="ripple-card p-4 bg-[#eef4f1] border-[#c8d8d0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#4a8a72]/10 rounded-xl flex items-center justify-center">
                  <Zap className="w-5 h-5 text-[#4a8a72]" />
                </div>
                <div>
                  <p className="ripple-label">Hormonal Pattern Detected</p>
                  <p className="font-serif text-lg font-bold text-[#1a2b22]">{result.hormonePrediction}</p>
                </div>
              </div>
            </div>

            {/* Narrative Insight */}
            <div className="ripple-card p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#c07060]" />
                <p className="ripple-label">Symptom Insight</p>
              </div>
              <div className="text-sm text-[#3a3a32] leading-relaxed">
                <Streamdown>{result.narrativeInsight}</Streamdown>
              </div>

              {result.extractedSymptoms.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-[#f0ebe4]">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#9a9490] font-bold">Detected Symptoms</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.extractedSymptoms.map((s, i) => (
                      <span key={i} className="text-xs bg-[#f5f0ea] border border-[#e0d5c8] text-[#6b7a72] px-2.5 py-1 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2 text-xs text-[#9a9490] bg-[#f5f0ea] rounded-xl p-3.5">
              <BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{result.disclaimer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {logs.filter((l) => l.diaryText).length > 0 && (
        <div className="ripple-card p-5 space-y-4">
          <p className="ripple-label">Previous Entries</p>
          <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
            {logs
              .filter((l) => l.diaryText)
              .slice(-5)
              .reverse()
              .map((log) => (
                <div key={log.id} className="border-l-2 border-[#e0d5c8] pl-3 space-y-1">
                  <p className="text-[10px] font-mono text-[#9a9490] uppercase tracking-wider">{log.date}</p>
                  <p className="text-xs text-[#4a4a42] leading-relaxed line-clamp-2">{log.diaryText}</p>
                  {log.hormonePrediction && (
                    <span className="text-[9px] bg-[#eef4f1] text-[#4a8a72] px-2 py-0.5 rounded-full font-mono">
                      {log.hormonePrediction}
                    </span>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
