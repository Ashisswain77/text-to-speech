import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Download, 
  Star, 
  Volume2, 
  VolumeX, 
  Loader2
} from 'lucide-react';
import Skeleton from '../common/Skeleton';

export default function AudioResult({
  language = "English (US)",
  voice = "Sarah",
  duration = "01:24",
  textSnippet = "Your generated voiceover sample is ready for playback and export.",
  isLoading = false,
  onDownload,
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [progress, setProgress] = useState(30);
  const [volume, setVolume] = useState(85);
  const [isMuted, setIsMuted] = useState(false);

  // Simulated waveform bar heights
  const waveformHeights = [
    25, 40, 55, 75, 50, 60, 85, 70, 45, 60, 80, 95, 65, 40, 30, 55, 75, 80, 50,
    65, 90, 100, 75, 55, 40, 50, 70, 85, 90, 60, 40, 30, 55, 70, 85, 75, 55, 35,
    30, 45, 65, 80, 55, 40, 30, 45, 60, 75, 50, 30
  ];

  // Loading state shimmer representation
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3.5 w-48" />
          </div>
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 sm:p-6 transition-all duration-200">
      {/* 1. Header: Title and Voice / Language / Duration */}
      <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Generated Audio</h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Mock Preview
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {language} · <span className="text-slate-800 font-semibold">{voice}</span> · {duration}
          </p>
        </div>
      </div>

      {/* 2. Waveform Visualization Area */}
      <div className="my-4 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
        <div className="h-12 flex items-center justify-between gap-1 px-1">
          {waveformHeights.map((h, i) => {
            const isPlayed = (i / waveformHeights.length) * 100 <= progress;
            return (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className={`
                  flex-1 rounded-full transition-all duration-150
                  ${isPlayed ? 'bg-brand-600' : 'bg-slate-200'}
                `}
              />
            );
          })}
        </div>
      </div>

      {/* 3. Player Controls: Play/Pause, Scrubber, Timestamps & Volume */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
            className="w-10 h-10 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-sm shadow-brand-500/20 transition-all flex-shrink-0 focus:outline-none focus:ring-4 focus:ring-brand-500/20 active:scale-95"
          >
            {isPlaying ? (
              <Pause className="w-4.5 h-4.5 fill-current" />
            ) : (
              <Play className="w-4.5 h-4.5 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Progress / Seek bar */}
          <div className="flex-1">
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              aria-label="Seek audio timeline"
              className="w-full cursor-pointer accent-brand-600"
            />
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
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
              className="w-14 sm:w-20 cursor-pointer accent-brand-600"
            />
          </div>
        </div>

        {/* Timestamps */}
        <div className="flex justify-between text-xs text-slate-400 font-medium px-0.5">
          <span>00:00</span>
          <span>{duration}</span>
        </div>
      </div>

      {/* 4. Action Footer: Favorite & Download Audio */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        {/* Favorite Button */}
        <button
          type="button"
          onClick={() => setIsFavorite(!isFavorite)}
          aria-label={isFavorite ? "Favorited" : "Favorite audio"}
          className={`
            inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors
            ${isFavorite
              ? 'text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200'
              : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200'
            }
          `}
        >
          <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
          <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
        </button>

        {/* Download Audio Button */}
        <button
          type="button"
          onClick={() => {
            if (onDownload) onDownload();
            else alert("Download UI placeholder: Real audio export will be enabled during Day 3 backend integration.");
          }}
          className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-md transition-all active:scale-[0.98]"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Audio</span>
        </button>
      </div>
    </div>
  );
}
