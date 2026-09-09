import React, { useState } from 'react';
import { Play, Pause, Download, Star, Trash2, Calendar, Clock, Globe } from 'lucide-react';

export default function HistoryItem({
  item,
  onPlay,
  onDownload,
  onDelete,
  onToggleFavorite,
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="group p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-subtle hover:shadow-card hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-150">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Text preview & Metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Globe className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              {item.language}
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-800/60">
              {item.voice}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
              <Clock className="w-3 h-3" />
              {item.duration}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 hidden sm:inline-flex">
              <Calendar className="w-3 h-3" />
              {item.createdDate}
            </span>
          </div>

          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 line-clamp-2 leading-relaxed">
            "{item.text}"
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 w-full md:w-auto justify-end">
          {/* Play/Pause */}
          <button
            type="button"
            onClick={() => {
              setIsPlaying(!isPlaying);
              if (onPlay) onPlay(item);
            }}
            aria-label={isPlaying ? "Pause audio" : "Play audio"}
            className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Favorite Toggle */}
          <button
            type="button"
            onClick={() => {
              if (onToggleFavorite) onToggleFavorite(item.id);
            }}
            aria-label={item.isFavorite ? "Remove favorite" : "Add to favorites"}
            className={`
              w-9 h-9 rounded-xl flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500
              ${item.isFavorite 
                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/60' 
                : 'text-slate-400 dark:text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }
            `}
          >
            <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Download */}
          <button
            type="button"
            onClick={() => {
              if (onDownload) onDownload(item);
            }}
            aria-label="Download audio file"
            className="w-9 h-9 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => {
              if (onDelete) onDelete(item.id);
            }}
            aria-label="Delete history item"
            className="w-9 h-9 rounded-xl text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
