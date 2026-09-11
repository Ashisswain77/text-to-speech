import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Download, 
  Star, 
  Volume2, 
  VolumeX, 
  Volume1,
  RotateCcw,
  RotateCw,
  Check
} from 'lucide-react';
import Skeleton from '../common/Skeleton';

/**
 * Format seconds into mm:ss display string.
 */
function formatTime(secs) {
  if (!Number.isFinite(secs) || secs < 0) return '00:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// Sophisticated natural speech envelope fallback (80 fine-grained bars)
const DEFAULT_SPEECH_ENVELOPE = [
  16, 22, 34, 48, 65, 82, 72, 54, 38, 26, 42, 68, 88, 96, 84, 62, 40, 24, 30, 52,
  74, 86, 76, 58, 36, 22, 34, 60, 84, 98, 90, 70, 48, 28, 18, 26, 48, 72, 88, 78,
  58, 38, 24, 36, 64, 86, 94, 82, 60, 40, 26, 32, 56, 78, 90, 80, 58, 36, 22, 30,
  52, 74, 88, 76, 54, 34, 22, 32, 58, 80, 86, 72, 50, 32, 22, 18, 26, 38, 28, 16
];

export default function AudioResult({
  language = "English (US)",
  voice = "Sarah",
  audioUrl = null,
  isLoading = false,
  onDownload,
}) {
  const audioRef = useRef(null);
  const waveformRef = useRef(null);

  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isDownloaded, setIsDownloaded] = useState(false);

  // Interactive scrubbing & hover preview states
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoverPct, setHoverPct] = useState(null);
  const [hoverTime, setHoverTime] = useState(0);

  // Dynamic real audio peak extraction
  const [waveformPeaks, setWaveformPeaks] = useState(DEFAULT_SPEECH_ENVELOPE);

  // Extract actual audio waveform peaks from the generated audio blob
  useEffect(() => {
    if (!audioUrl) {
      setWaveformPeaks(DEFAULT_SPEECH_ENVELOPE);
      return;
    }

    let isCancelled = false;

    async function extractWaveform() {
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;

        const audioCtx = new AudioContextClass();
        const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        if (isCancelled) {
          audioCtx.close().catch(() => {});
          return;
        }

        const channelData = decodedBuffer.getChannelData(0);
        const barCount = 80;
        const blockSize = Math.floor(channelData.length / barCount);
        const peaks = [];

        for (let i = 0; i < barCount; i++) {
          const start = i * blockSize;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(channelData[start + j] || 0);
          }
          const avg = sum / blockSize;
          // Apply balanced non-linear scaling for natural symmetric soundwave
          const scaled = Math.min(100, Math.max(12, Math.round(Math.pow(avg * 4.0, 0.75) * 100)));
          peaks.push(scaled);
        }

        setWaveformPeaks(peaks);
        audioCtx.close().catch(() => {});
      } catch {
        // Fallback to natural vocal cadence
        setWaveformPeaks(DEFAULT_SPEECH_ENVELOPE);
      }
    }

    extractWaveform();

    return () => {
      isCancelled = true;
    };
  }, [audioUrl]);

  // Sync volume / mute to HTML audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted]);

  // Reset states on new audioUrl
  useEffect(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setIsDownloaded(false);
  }, [audioUrl]);

  // Audio element event handlers
  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (audio && Number.isFinite(audio.duration)) {
      setDuration(audio.duration);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (isScrubbing) return;
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    if (audio.duration > 0) {
      setProgress((audio.currentTime / audio.duration) * 100);
    }
  }, [isScrubbing]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setProgress(100);
    if (audioRef.current) {
      setCurrentTime(audioRef.current.duration || 0);
    }
  }, []);

  // Play / Pause toggle
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (progress >= 100) {
        audio.currentTime = 0;
        setProgress(0);
      }
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [isPlaying, audioUrl, progress]);

  // Seek to percentage on waveform
  const seekToPercentage = useCallback((pct) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const clampedPct = Math.max(0, Math.min(100, pct));
    const targetTime = (clampedPct / 100) * duration;
    audio.currentTime = targetTime;
    setCurrentTime(targetTime);
    setProgress(clampedPct);
  }, [duration]);

  // Interactive scrubbing mouse handlers
  const handleWaveformMouseDown = (e) => {
    if (!waveformRef.current || !duration) return;
    setIsScrubbing(true);
    const rect = waveformRef.current.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    seekToPercentage(pct);

    const handleMouseMove = (moveEvent) => {
      const movePct = ((moveEvent.clientX - rect.left) / rect.width) * 100;
      seekToPercentage(movePct);
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleWaveformHover = (e) => {
    if (!waveformRef.current || !duration) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setHoverPct(pct);
    setHoverTime((pct / 100) * duration);
  };

  const handleWaveformLeave = () => {
    setHoverPct(null);
  };

  // Quick skips (-5s / +5s)
  const skip = (delta) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const nextTime = Math.max(0, Math.min(duration, audio.currentTime + delta));
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
    setProgress((nextTime / duration) * 100);
  };

  // Cycle playback rate (1.0x -> 1.25x -> 1.5x -> 0.8x)
  const cyclePlaybackRate = () => {
    const rates = [1.0, 1.25, 1.5, 0.8];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  // Loading skeleton placeholder
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card p-6 sm:p-8 space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40 rounded-lg" />
            <Skeleton className="h-3.5 w-60 rounded-md" />
          </div>
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
        <div className="h-24 w-full flex items-center justify-between gap-1.5 py-4">
          {Array.from({ length: 64 }).map((_, i) => (
            <div
              key={i}
              style={{ height: `${Math.max(15, (Math.sin(i * 0.25) + 1) * 45)}%` }}
              className="flex-1 bg-slate-200 dark:bg-slate-700/60 rounded-full"
            />
          ))}
        </div>
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>
    );
  }

  const displayDuration = formatTime(duration);
  const displayCurrent = formatTime(currentTime);

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-elevated p-6 sm:p-8 transition-all duration-300">
      {/* Hidden HTML5 Audio Element */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />
      )}

      {/* 1. Header: Title, Voice Metadata, and Status Beacon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Generated Audio
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Studio Master
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium">{language}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">{voice}</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="font-mono text-slate-400 dark:text-slate-500">{displayDuration}</span>
          </div>
        </div>

        {/* Audio Format Pill Badges */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium tracking-wide uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
            MP3 · 44.1 kHz
          </span>
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium tracking-wide uppercase bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
            128 kbps
          </span>
        </div>
      </div>

      {/* 2. Open, Borderless Fluid Waveform Area (No Square Box Container) */}
      <div className="my-6 sm:my-8">
        <div
          ref={waveformRef}
          onMouseDown={handleWaveformMouseDown}
          onMouseMove={handleWaveformHover}
          onMouseLeave={handleWaveformLeave}
          role="slider"
          aria-label="Interactive audio waveform timeline"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={Math.round(progress)}
          className="relative h-24 sm:h-32 w-full cursor-pointer select-none flex items-center justify-between gap-[2px] sm:gap-[3px] py-4 group/wave"
        >
          {/* Delicate Center Zero-Crossing Horizontal Baseline */}
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-200/50 dark:bg-slate-800/60 pointer-events-none" />

          {/* Dynamic Ambient Aura behind the Playhead */}
          <div
            style={{ left: `${progress}%` }}
            className={`
              pointer-events-none absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-40 h-32 blur-3xl rounded-full transition-opacity duration-300
              ${isPlaying ? 'bg-brand-500/20 dark:bg-brand-500/25 opacity-100' : 'bg-brand-500/10 opacity-60'}
            `}
          />

          {/* Hover Scrub Tooltip Badge */}
          {hoverPct !== null && (
            <div
              style={{ left: `${hoverPct}%` }}
              className="pointer-events-none absolute -top-3 -translate-x-1/2 px-2.5 py-0.5 rounded-md bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-mono font-bold shadow-lg z-30 transition-transform animate-in fade-in zoom-in-95 duration-100"
            >
              {formatTime(hoverTime)}
            </div>
          )}

          {/* Hover Target Vertical Guideline */}
          {hoverPct !== null && (
            <div
              style={{ left: `${hoverPct}%` }}
              className="pointer-events-none absolute top-0 bottom-0 w-[1px] bg-brand-400/60 dark:bg-brand-400/40 z-10 border-l border-dashed border-brand-400"
            />
          )}

          {/* Glowing Playhead Vertical Needle */}
          <div
            style={{ left: `${progress}%` }}
            className="pointer-events-none absolute top-0 bottom-0 w-[2px] bg-brand-600 dark:bg-brand-400 z-20 transition-all duration-75 shadow-[0_0_12px_rgba(99,102,241,0.9)]"
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-brand-600 dark:bg-brand-400 border-2 border-white dark:border-slate-900 shadow-md animate-pulse" />
          </div>

          {/* 80 Symmetrical Soundwave Bars (Originating from Center Baseline) */}
          {waveformPeaks.map((heightPct, idx) => {
            const barPct = (idx / waveformPeaks.length) * 100;
            const isPlayed = barPct <= progress;
            const isHovered = hoverPct !== null && barPct <= hoverPct && !isPlayed;
            const isPlayheadNear = isPlaying && Math.abs(barPct - progress) < 4.5;

            // Fluid rhythmic wave animation delay per bar during active playback
            const animDelay = `${((idx * 41) % 100) / 100 * 1.1}s`;

            return (
              <div
                key={idx}
                style={{
                  height: `${heightPct}%`,
                  transformOrigin: 'center',
                  animationDelay: animDelay,
                }}
                className={`
                  relative flex-1 max-w-[4px] rounded-full transition-all duration-150
                  ${isPlayed
                    ? 'bg-gradient-to-t from-indigo-600 via-brand-500 to-indigo-500 dark:from-indigo-400 dark:via-brand-400 dark:to-indigo-300 shadow-[0_0_8px_rgba(99,102,241,0.3)]'
                    : isHovered
                    ? 'bg-brand-300 dark:bg-brand-700/80'
                    : 'bg-slate-200/85 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700'
                  }
                  ${isPlaying && isPlayed ? 'animate-wave-live' : ''}
                  ${isPlayheadNear ? 'scale-y-125 brightness-125 shadow-[0_0_10px_rgba(99,102,241,0.6)]' : ''}
                `}
              />
            );
          })}
        </div>

        {/* Timeline Monospace Timestamps & Clean Scrub Guide */}
        <div className="flex items-center justify-between pt-2 px-1 font-mono text-xs text-slate-400 dark:text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {displayCurrent}
            </span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span>{displayDuration}</span>
          </div>

          <span className="text-[11px] text-slate-400/70 hidden sm:inline-block font-sans">
            Click or drag anywhere on wave to scrub
          </span>

          <div className="font-semibold text-brand-600 dark:text-brand-400 text-right">
            {Math.round(progress)}%
          </div>
        </div>
      </div>

      {/* 3. Integrated Studio Controls Bar (Clean & Borderless) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
        {/* Core Audio Controls: Play/Pause, Skips, Playback Speed */}
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-center sm:justify-start">
          {/* Skip -5s */}
          <button
            type="button"
            onClick={() => skip(-5)}
            disabled={!audioUrl}
            title="Rewind 5 seconds"
            aria-label="Rewind 5 seconds"
            className="p-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-40"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Hero Play/Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            disabled={!audioUrl}
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
            className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-brand-600 via-indigo-600 to-brand-500 hover:from-brand-500 hover:to-indigo-400 text-white flex items-center justify-center shadow-lg shadow-brand-500/30 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group/play"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Skip +5s */}
          <button
            type="button"
            onClick={() => skip(5)}
            disabled={!audioUrl}
            title="Forward 5 seconds"
            aria-label="Forward 5 seconds"
            className="p-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-40"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Playback Speed Chip */}
          <button
            type="button"
            onClick={cyclePlaybackRate}
            disabled={!audioUrl}
            title="Cycle playback speed"
            aria-label={`Playback speed ${playbackRate}x`}
            className="px-3 py-1.5 rounded-full text-xs font-mono font-bold text-brand-600 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/80 hover:bg-brand-100 dark:hover:bg-brand-900/60 border border-brand-200/60 dark:border-brand-800/60 transition-all active:scale-95 disabled:opacity-40"
          >
            {playbackRate.toFixed(playbackRate % 1 === 0 ? 1 : 2)}x
          </button>
        </div>

        {/* Right Side Controls: Volume & Action Buttons */}
        <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto justify-center sm:justify-end">
          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? "Unmute audio" : "Mute audio"}
              aria-label={isMuted ? "Unmute audio" : "Mute audio"}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-500" />
              ) : volume < 50 ? (
                <Volume1 className="w-4 h-4" />
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
              className="w-18 sm:w-24 cursor-pointer accent-brand-600 dark:accent-brand-500"
            />
          </div>

          {/* Favorite Button */}
          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            aria-label={isFavorite ? "Favorited" : "Favorite audio"}
            className={`
              p-2.5 rounded-full transition-all duration-150 active:scale-95 border
              ${isFavorite
                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/60 shadow-xs'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }
            `}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
          </button>

          {/* Download Audio Master Button */}
          <button
            type="button"
            onClick={() => {
              if (onDownload) {
                onDownload();
              } else if (audioUrl) {
                const a = document.createElement('a');
                a.href = audioUrl;
                a.download = `speechengine-${voice.toLowerCase()}-${Date.now()}.mp3`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setIsDownloaded(true);
                setTimeout(() => setIsDownloaded(false), 2500);
              }
            }}
            disabled={!audioUrl}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-950 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500 text-white rounded-full text-xs font-semibold shadow-md shadow-slate-950/10 dark:shadow-brand-600/20 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloaded ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Downloaded</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download MP3</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
