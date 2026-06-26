import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MessageSquare, RefreshCw, Sparkles, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";

const QUICK_SEARCHES = [
  "Burning tongue", "Frozen shoulder", "Skin crawling", "Hair thinning",
  "Heart palpitations", "Electric shock sensation", "Dry eyes", "Tinnitus",
];

interface SymptomResult {
  name: string;
  coincidenceRate: string;
  explanation: string;
  relatedSymptomsToTrack: string[];
  gpConversationGuide: string;
}

function ResultCard({ result }: { result: SymptomResult }) {
  const [showScript, setShowScript] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="ripple-card p-5 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-serif text-base font-bold text-[#1a2b22]">{result.name}</p>
          <span className="inline-block mt-1 text-[10px] font-mono uppercase tracking-wider bg-[#eef4f1] text-[#4a8a72] border border-[#c8d8d0] px-2 py-0.5 rounded-full font-bold">
            {result.coincidenceRate}
          </span>
        </div>
        <Sparkles className="w-4 h-4 text-[#c07060] shrink-0 mt-1" />
      </div>

      <p className="text-sm text-[#4a4a42] leading-relaxed">{result.explanation}</p>

      {result.relatedSymptomsToTrack.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#9a9490] font-bold">Track alongside</p>
          <div className="flex flex-wrap gap-1.5">
            {result.relatedSymptomsToTrack.map((s, i) => (
              <span key={i} className="text-xs bg-[#f5f0ea] border border-[#e0d5c8] text-[#6b7a72] px-2.5 py-1 rounded-full">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-[#f0ebe4] pt-3">
        <button
          onClick={() => setShowScript(!showScript)}
          className="flex items-center gap-2 text-xs font-bold text-[#4a8a72] hover:text-[#3a7060] transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          GP Conversation Script
          {showScript ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <AnimatePresence>
          {showScript && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 bg-[#f5f0ea] border border-[#e0d5c8] rounded-xl p-4"
            >
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#9a9490] font-bold mb-2">
                Say this to your doctor:
              </p>
              <p className="text-sm text-[#3a3a32] leading-relaxed italic">
                "{result.gpConversationGuide}"
              </p>
              <button
                onClick={() => navigator.clipboard.writeText(result.gpConversationGuide)}
                className="mt-2 text-[10px] text-[#4a8a72] font-mono font-bold hover:underline"
              >
                Copy to clipboard →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function ReverseLookup() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SymptomResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [noResults, setNoResults] = useState(false);

  const lookupMutation = trpc.ai.reverseLookup.useMutation({
    onSuccess: (data) => {
      setResults(data.results as SymptomResult[]);
      setNoResults(data.results.length === 0);
      setIsSearching(false);
      setSearched(true);
    },
    onError: () => {
      setIsSearching(false);
      setSearched(true);
      setNoResults(true);
    },
  });

  const handleSearch = (q?: string) => {
    const searchQuery = q ?? query;
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setResults([]);
    setSearched(false);
    setNoResults(false);
    if (q) setQuery(q);
    lookupMutation.mutate({ query: searchQuery });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="ripple-section-title">Symptom Lookup</h1>
        <p className="text-sm text-[#6b7a72] mt-1">
          Search unusual symptoms to discover their perimenopause connection
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <strong>Educational purposes only.</strong> Symptom correlations are based on published research. Always consult your healthcare provider for diagnosis.
        </p>
      </div>

      {/* Search */}
      <div className="ripple-card p-5 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9a9490]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g. burning tongue, frozen shoulder, skin crawling…"
              className="pl-9 bg-[#f5f0ea] border-[#e0d5c8] text-[#1a2b22] placeholder-[#9a9490]"
            />
          </div>
          <Button
            onClick={() => handleSearch()}
            disabled={!query.trim() || isSearching}
            className="bg-[#4a8a72] hover:bg-[#3a7060] text-white font-mono text-xs font-bold px-5 rounded-xl"
          >
            {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {/* Quick searches */}
        <div className="space-y-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#9a9490] font-bold">Quick searches</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_SEARCHES.map((qs) => (
              <button
                key={qs}
                onClick={() => handleSearch(qs)}
                className="text-xs bg-[#f5f0ea] hover:bg-[#eef4f1] border border-[#e0d5c8] hover:border-[#c8d8d0] text-[#6b7a72] hover:text-[#4a8a72] px-3 py-1.5 rounded-full transition-colors"
              >
                {qs}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-[#6b7a72] font-mono">
              {results.length} result{results.length !== 1 ? "s" : ""} found for "{query}"
            </p>
            {results.map((result, i) => (
              <ResultCard key={i} result={result} />
            ))}
          </div>
        )}

        {searched && noResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="ripple-card p-6 text-center space-y-3"
          >
            <Search className="w-8 h-8 text-[#9a9490] mx-auto" />
            <div>
              <p className="font-serif text-base font-bold text-[#1a2b22]">No direct match found</p>
              <p className="text-xs text-[#6b7a72] mt-1 leading-relaxed">
                Try different keywords, or consult your healthcare provider about this symptom.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
