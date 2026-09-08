import React, { useState } from 'react';
import { Star, Play, Pause, Download, Trash2, Globe, Clock, Sparkles } from 'lucide-react';

const INITIAL_FAVORITES = [
  {
    id: 'fav-1',
    title: "Brand Anthem Voiceover",
    text: "Artificial intelligence has transformed the landscape of synthetic voice production, allowing creators to produce lifelike narration with nuanced emotional cadence.",
    language: "English (US)",
    voice: "Sarah — Female",
    duration: "00:48",
    addedDate: "Sep 7, 2026",
  },
  {
    id: 'fav-2',
    title: "Hindi Product Walkthrough",
    text: "नमस्ते और वोकलिस में आपका स्वागत है। हमारी तंत्रिका आवाज प्रणाली प्राकृतिक भाषण उत्पन्न करती है।",
    language: "Hindi",
    voice: "Priya — Female",
    duration: "00:35",
    addedDate: "Sep 6, 2026",
  },
  {
    id: 'fav-3',
    title: "Keynote Narration Sample",
    text: "Every great invention begins with a clear articulation of purpose and vision.",
    language: "English (US)",
    voice: "David — Male",
    duration: "00:19",
    addedDate: "Sep 4, 2026",
  },
];

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState(INITIAL_FAVORITES);
  const [activeAudioId, setActiveAudioId] = useState(null);

  const handleRemove = (id) => {
    setFavorites((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Star className="w-6 h-6 text-amber-500 fill-amber-400" />
            <span>Starred Favorites</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quick access to your highest rated and pinned speech generations.
          </p>
        </div>

        <span className="text-xs font-semibold px-3 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-200">
          {favorites.length} Saved Items
        </span>
      </div>

      {/* Favorites Grid */}
      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites.map((item) => {
            const isPlaying = activeAudioId === item.id;
            return (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-card hover:border-slate-300 transition-all flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {item.title}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      title="Remove from favorites"
                      className="text-amber-500 hover:text-slate-400 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <Star className="w-4.5 h-4.5 fill-amber-400" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-3">
                    "{item.text}"
                  </p>

                  <div className="flex items-center gap-2 flex-wrap text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                      {item.language}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 font-medium">
                      {item.voice}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.duration}
                    </span>
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveAudioId(isPlaying ? null : item.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold transition-colors"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />}
                    <span>{isPlaying ? 'Pause' : 'Play Audio'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => alert(`Downloading: ${item.title}.mp3`)}
                      aria-label="Download audio"
                      className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      aria-label="Delete favorite"
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Star className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">No favorite audio clips saved</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Star audio results from the Create Speech workspace or History to access them quickly here.
          </p>
        </div>
      )}
    </div>
  );
}
