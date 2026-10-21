import React from 'react';
import { SURAHS } from '../data/surahs';
import { ChevronLeft, ChevronRight, Shuffle, Loader2 } from 'lucide-react';

export default function VerseSelector({
  selectedSurah,
  setSelectedSurah,
  selectedAyah,
  setSelectedAyah,
  mode,
  setMode,
  startAyah,
  setStartAyah,
  endAyah,
  setEndAyah,
  loading,
  onRandomVerse,
}) {
  const currentSurahData = SURAHS.find((s) => s.number === selectedSurah) || SURAHS[0];
  const totalAyahs = currentSurahData.numberOfAyahs;

  const handleSurahChange = (e) => {
    const newSurahNum = parseInt(e.target.value, 10);
    setSelectedSurah(newSurahNum);
    setSelectedAyah(1);
    setStartAyah(1);
    setEndAyah(Math.min(5, (SURAHS.find((s) => s.number === newSurahNum) || {}).numberOfAyahs || 1));
  };

  const handleAyahChange = (e) => {
    setSelectedAyah(parseInt(e.target.value, 10));
  };

  const handleStartAyahChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setStartAyah(val);
    if (val > endAyah) {
      setEndAyah(val);
    }
  };

  const handleEndAyahChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setEndAyah(val);
    if (val < startAyah) {
      setStartAyah(val);
    }
  };

  const handlePrevAyah = () => {
    if (selectedAyah > 1) {
      setSelectedAyah(selectedAyah - 1);
    } else if (selectedSurah > 1) {
      const prevSurah = SURAHS.find((s) => s.number === selectedSurah - 1);
      setSelectedSurah(selectedSurah - 1);
      setSelectedAyah(prevSurah ? prevSurah.numberOfAyahs : 1);
    }
  };

  const handleNextAyah = () => {
    if (selectedAyah < totalAyahs) {
      setSelectedAyah(selectedAyah + 1);
    } else if (selectedSurah < 114) {
      setSelectedSurah(selectedSurah + 1);
      setSelectedAyah(1);
    }
  };

  const totalRangeSlides = Math.max(1, endAyah - startAyah + 1);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header & Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-800">Select Surah & Verse</h2>

        {/* Mode Toggle: Single Verse vs Verse Range */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              mode === 'single'
                ? 'bg-white text-slate-900 font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Single Verse
          </button>
          <button
            type="button"
            onClick={() => setMode('range')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              mode === 'range'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Verse Range (Multiple)
          </button>
        </div>
      </div>

      {/* Surah Dropdown */}
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1.5">
          Surah Name (1 - 114)
        </label>
        <div className="relative">
          <select
            value={selectedSurah}
            onChange={handleSurahChange}
            disabled={loading}
            className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 outline-none transition-all appearance-none cursor-pointer"
          >
            {SURAHS.map((surah) => (
              <option key={surah.number} value={surah.number}>
                {surah.number}. {surah.englishName} ({surah.englishNameTranslation}) — {surah.numberOfAyahs} verses
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Mode Single Verse */}
      {mode === 'single' ? (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-8">
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Verse Number (1 - {totalAyahs})
            </label>
            <div className="relative">
              <select
                value={selectedAyah}
                onChange={handleAyahChange}
                disabled={loading}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 text-slate-800 text-sm rounded-xl px-3.5 py-2.5 outline-none transition-all appearance-none cursor-pointer"
              >
                {Array.from({ length: totalAyahs }, (_, i) => i + 1).map((ayahNum) => (
                  <option key={ayahNum} value={ayahNum}>
                    Verse {ayahNum}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          <div className="sm:col-span-4">
            <button
              onClick={onRandomVerse}
              disabled={loading}
              type="button"
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 active:scale-95 border border-emerald-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              title="Display random verse for inspiration"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Shuffle className="w-3.5 h-3.5" />
              )}
              <span>Random Verse</span>
            </button>
          </div>
        </div>
      ) : (
        /* Mode Verse Range */
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                From Verse (1 - {totalAyahs})
              </label>
              <div className="relative">
                <select
                  value={startAyah}
                  onChange={handleStartAyahChange}
                  disabled={loading}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:bg-white text-slate-800 text-sm rounded-xl px-3 py-2.5 outline-none transition-all cursor-pointer"
                >
                  {Array.from({ length: totalAyahs }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      Verse {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                To Verse (1 - {totalAyahs})
              </label>
              <div className="relative">
                <select
                  value={endAyah}
                  onChange={handleEndAyahChange}
                  disabled={loading}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:bg-white text-slate-800 text-sm rounded-xl px-3 py-2.5 outline-none transition-all cursor-pointer"
                >
                  {Array.from({ length: totalAyahs }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n} disabled={n < startAyah}>
                      Verse {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick Select Full Surah Button */}
          <button
            type="button"
            onClick={() => {
              setStartAyah(1);
              setEndAyah(totalAyahs);
            }}
            className={`w-full py-2 px-3 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
              startAyah === 1 && endAyah === totalAyahs
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border-emerald-200'
            }`}
          >
            {startAyah === 1 && endAyah === totalAyahs
              ? `✓ Full Surah Selected (All ${totalAyahs} Verses)`
              : `Select Full Surah (All ${totalAyahs} Verses)`}
          </button>

          {/* Range summary */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-700">
            <span className="font-medium">
              Selected: <strong>{totalRangeSlides} verses</strong> (1 image per verse)
            </span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-md text-[11px]">
              Verses {startAyah} to {endAyah}
            </span>
          </div>
        </div>
      )}

      {/* Stepper info */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-700">{currentSurahData.englishName}</span>
          <span>•</span>
          <span className="font-amiri text-slate-800 text-sm" dir="rtl">{currentSurahData.name}</span>
          <span>•</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
            {currentSurahData.revelationType === 'Meccan' ? 'Meccan' : 'Medinan'}
          </span>
        </div>

        {mode === 'single' && (
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevAyah}
              disabled={loading || (selectedSurah === 1 && selectedAyah === 1)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Previous Verse"
              type="button"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-slate-700 font-mono text-xs">
              {selectedAyah}/{totalAyahs}
            </span>
            <button
              onClick={handleNextAyah}
              disabled={loading || (selectedSurah === 114 && selectedAyah === totalAyahs)}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Next Verse"
              type="button"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
