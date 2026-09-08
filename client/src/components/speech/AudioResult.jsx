import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Download, 
  Star, 
  Volume2, 
  VolumeX, 
  Share2, 
  Check,
  Sparkles
} from 'lucide-react';

export default function AudioResult({
  language = "English (US)",
  voice = "Sarah",
  duration = "01:24",
  textSnippet = "Welcome to Vocalis. Convert your written ideas into natural speech effortlessly...",
  onDownload,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [progress, setProgress] = useState(28); // 28% for preview
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate simulated waveform heights
  const waveformHeights = [
    30, 45, 60, 80, 50, 65, 90, 75, 40, 55, 85, 95, 70, 45, 30, 60, 80, 75, 50,
    65, 90, 100, 80, 60, 40, 50, 70, 85, 90, 65, 45, 35, 55, 75, 90, 80, 60, 40,
    30, 50, 70, 85, 60, 45, 30, 40, 65, 80, 55, 35
  ];

  const handleShare = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-elevated p-5 sm:p-6 transition-all duration-200">
      {/* Header with Title, Metadata & Favorite Toggle */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-base font-bold text-slate-900">Generated Audio</h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Ready
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {language} · <span className="text-slate-800 font-semibold">{voice}</span> · {duration}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Share/Link button */}
          <button
            type="button"
            onClick={handleShare}
            title="Copy Audio Link"
            aria-label="Copy audio link"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {copied ? <Check className="w-4.5 h-4.5 text-emerald-600" /> : <Share2 className="w-4.5 h-4.5" />}
          </button>

          {/* Favorite Star Button */}
          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            aria-label={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            aria-pressed={isFavorite}
            className={`
              p-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-brand-500
              ${isFavorite 
                ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' 
                : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
              }
            `}
          >
            <Star className={`w-5 h-5 ${isFavorite ? 'fill-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Script snippet preview */}
      <div className="py-3 text-xs text-slate-600 italic bg-slate-50/60 px-3.5 rounded-xl my-4 border border-slate-100">
        "{textSnippet}"
      </div>

      {/* Waveform Visualization Area */}
      <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
        <div className="h-14 flex items-center justify-between gap-1 px-1">
          {waveformHeights.map((h, i) => {
            const isPlayed = (i / waveformHeights.length) * 100 <= progress;
            return (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className={`
                  flex-1 rounded-full transition-all duration-150
                  ${isPlayed ? 'bg-brand-600' : 'bg-slate-200 hover:bg-slate-300'}
                `}
              />
            );
          })}
        </div>
      </div>

      {/* Player Controls Bar */}
      <div className="space-y-2">
        <div className="flex items-center gap-4">
          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
            className="w-11 h-11 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-md shadow-brand-500/20 hover:scale-105 active:scale-95 transition-all flex-shrink-0 focus:outline-none focus:ring-4 focus:ring-brand-500/20"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Seek / Progress Slider */}
          <div className="flex-1 space-y-1">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              aria-label="Seek audio timeline"
              className="w-full cursor-pointer accent-brand-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 font-medium">
              <span>00:24</span>
              <span>{duration}</span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              aria-label={isMuted ? "Unmute audio" : "Mute audio"}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-500" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              aria-label="Audio player volume"
              className="w-16 sm:w-20 cursor-pointer accent-brand-600"
            />
          </div>
        </div>
      </div>

      {/* Action Footer: Download Audio Button */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Audio Spec:</span>
          <span>48kHz · 256kbps · MP3</span>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onDownload) onDownload();
            else alert("Download placeholder: Audio file download will be available on Day 3.");
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold shadow-xs hover:shadow-md transition-all focus:outline-none focus:ring-4 focus:ring-slate-900/20 active:scale-[0.98]"
        >
          <Download className="w-4 h-4" />
          <span>Download Audio</span>
        </button>
      </div>
    </div>
  );
}
