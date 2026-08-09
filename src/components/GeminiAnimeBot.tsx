import React, { useState } from 'react';
import { Bot, Sparkles, X, Send, Play, Star, ChevronRight, MessageSquare } from 'lucide-react';
import { Anime } from '../types';

interface GeminiAnimeBotProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAnimeTitle: (title: string) => void;
}

interface AiRecommendation {
  title: string;
  genre: string;
  episodes: string;
  whyWatch: string;
  similarity: string;
}

export const GeminiAnimeBot: React.FC<GeminiAnimeBotProps> = ({
  isOpen,
  onClose,
  onSelectAnimeTitle,
}) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<AiRecommendation[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAsk = async (queryText?: string) => {
    const textToSubmit = queryText || prompt;
    if (!textToSubmit.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToSubmit,
        }),
      });

      if (!response.ok) {
        throw new Error('AI recommendation service failed');
      }

      const data = await response.json();
      setSummary(data.summary || 'Here are top recommendations tailored for you!');
      setRecommendations(data.recommendations || []);
    } catch (err: any) {
      console.error(err);
      setError('Unable to fetch AI recommendations right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    'Dark fantasy like Jujutsu Kaisen or Demon Slayer',
    'Heartwarming wholesome slice of life anime',
    'Mind-bending psychological thriller with plot twists',
    'Top action anime with epic fight animation',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white">
        {/* Header decoration */}
        <div className="h-1.5 w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-red-600" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 space-y-6">
          {/* Title Header */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">AniBot AI Assistant</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Powered by Gemini
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ask for anime recommendations based on your mood, favorite tropes, or similar shows!
              </p>
            </div>
          </div>

          {/* Prompt suggestions pills */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Quick Prompts
            </p>
            <div className="flex flex-wrap gap-1.5">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(p);
                    handleAsk(p);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-500/40 text-xs text-slate-300 transition text-left"
                >
                  ✨ {p}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what kind of anime you want to watch..."
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Ask AI</span>
                </>
              )}
            </button>
          </form>

          {/* Results Area */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {error && <p className="text-xs text-red-400 p-3 rounded-xl bg-red-950/50">{error}</p>}

            {summary && <p className="text-xs text-slate-300 italic font-medium">{summary}</p>}

            {recommendations.length > 0 && (
              <div className="space-y-2.5">
                {recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-purple-500/40 transition flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white group-hover:text-purple-300">
                          {rec.title}
                        </h4>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                          {rec.similarity} Match
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-snug">{rec.whyWatch}</p>
                      <p className="text-[10px] text-slate-500">
                        {rec.genre} • {rec.episodes}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        onSelectAnimeTitle(rec.title);
                        onClose();
                      }}
                      className="px-3 py-2 bg-slate-900 group-hover:bg-purple-600 text-slate-300 group-hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
                    >
                      <span>Find</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
