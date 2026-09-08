import React, { useState } from 'react';
import { Search, Filter, Calendar, History, ArrowUpDown, Sparkles } from 'lucide-react';
import HistoryItem from '../components/history/HistoryItem';
import { HistoryItemSkeleton } from '../components/common/Skeleton';

const MOCK_HISTORY = [
  {
    id: 'hist-1',
    text: "Artificial intelligence has transformed the landscape of synthetic voice production, allowing creators to produce lifelike narration with nuanced emotional cadence.",
    language: "English (US)",
    voice: "Sarah (Female)",
    duration: "00:48",
    createdDate: "Today, 2:15 PM",
    isFavorite: true,
  },
  {
    id: 'hist-2',
    text: "Welcome to our introductory module on neural text processing. Please follow along with the transcript below.",
    language: "English (US)",
    voice: "David (Male)",
    duration: "00:22",
    createdDate: "Yesterday, 10:30 AM",
    isFavorite: false,
  },
  {
    id: 'hist-3',
    text: "नमस्ते और वोकलिस में आपका स्वागत है। हमारी तंत्रिका आवाज प्रणाली प्राकृतिक भाषण उत्पन्न करती है।",
    language: "Hindi",
    voice: "Priya (Female)",
    duration: "00:35",
    createdDate: "Sep 6, 2026",
    isFavorite: true,
  },
  {
    id: 'hist-4',
    text: "Ce projet vous permet de convertir n'importe quel texte écrit en audio de qualité studio avec une clarté remarquable.",
    language: "French",
    voice: "Chloé (Female)",
    duration: "00:41",
    createdDate: "Sep 5, 2026",
    isFavorite: false,
  },
];

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLang, setSelectedLang] = useState('all');
  const [selectedVoice, setSelectedVoice] = useState('all');
  const [items, setItems] = useState(MOCK_HISTORY);
  const [isLoading, setIsLoading] = useState(false);

  const toggleFavorite = (id) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, isFavorite: !it.isFavorite } : it))
    );
  };

  const handleDelete = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const filteredItems = items.filter((it) => {
    const matchesSearch = it.text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLang = selectedLang === 'all' || it.language.toLowerCase().includes(selectedLang.toLowerCase());
    return matchesSearch && matchesLang;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <History className="w-6 h-6 text-brand-600" />
            <span>Speech History</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse and manage all previously synthesized voice clips.
          </p>
        </div>

        {/* State Toggle for Day 2 Evaluation */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLoading(!isLoading)}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-medium"
          >
            {isLoading ? "Show Loaded Items" : "Preview Loading Skeletons"}
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-card flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history by script keywords..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        {/* Filter: Language */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className="flex-1 md:w-40 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            <option value="all">All Languages</option>
            <option value="english">English</option>
            <option value="hindi">Hindi</option>
            <option value="french">French</option>
          </select>

          {/* Filter: Voice */}
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="flex-1 md:w-36 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            <option value="all">All Voices</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
          </select>

          {/* Filter: Date */}
          <select
            className="hidden sm:block md:w-36 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            <option value="latest">Latest First</option>
            <option value="oldest">Oldest First</option>
            <option value="duration">Longest Duration</option>
          </select>
        </div>
      </div>

      {/* History Items List or Skeletons */}
      <div className="space-y-3">
        {isLoading ? (
          <>
            <HistoryItemSkeleton />
            <HistoryItemSkeleton />
            <HistoryItemSkeleton />
          </>
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <HistoryItem
              key={item.id}
              item={item}
              onPlay={() => alert(`Play preview: ${item.voice}`)}
              onDownload={() => alert(`Download: ${item.id}.mp3`)}
              onDelete={handleDelete}
              onToggleFavorite={toggleFavorite}
            />
          ))
        ) : (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No matching audio records</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search query or clear the active filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
