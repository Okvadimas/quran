import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { Loader2, ChevronLeft, ChevronRight, Maximize2, Minimize2, FileText, Copy, RotateCcw } from 'lucide-react';
import AyahMarker from './AyahMarker';

const VersePreview = forwardRef(function VersePreview(
  {
    verseData,
    loading,
    error,
    fontFamily,
    arabicFontSize = 32,
    arabicLineHeight,
    isTransparent,
    bgColor,
    textColor,
    showTranslation,
    showTransliteration = true,
    translationLang,
    translationFontSize,
    translationFontFamily = 'font-lora',
    translationAllCaps = false,
    showTranslationAyahNumber = true,
    aspectRatio,
    showReference,
    showBismillah,
    showAyahNumber = true,
    textAlign,
    surahInfo,
    selectedAyah,
    // Range props
    mode,
    currentSlideIndex,
    setCurrentSlideIndex,
    totalSlides,
    startAyah,
    endAyah,
    chunks = [],
    activeChunkIndex = 0,
    setActiveChunkIndex,
    previewTarget = 'full',
    setPreviewTarget,
    customVerseTranslation = '',
    onUpdateCustomVerseTranslation,
    defaultVerseTranslation = '',
    customVerseLatin = '',
    onUpdateCustomVerseLatin,
    defaultVerseLatin = '',
    translationTextColor = null,
  },
  ref
) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isEditingTranslation, setIsEditingTranslation] = useState(false);
  const containerRef = useRef(null);

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
    } else {
      setIsFullscreen(false);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullscreen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  const getFontFamilyName = () => {
    if (fontFamily === 'font-scheherazade') return "'Scheherazade New', serif";
    if (fontFamily === 'font-amiri-quran') return "'Amiri Quran', serif";
    return "'Amiri', serif";
  };

  const getTranslationFontName = () => {
    switch (translationFontFamily) {
      case 'font-bebas':
        return "'Bebas Neue', Impact, sans-serif";
      case 'font-oswald':
        return "'Oswald', sans-serif";
      case 'font-lora':
        return "'Lora', Georgia, serif";
      case 'font-jakarta':
        return "'Plus Jakarta Sans', system-ui, sans-serif";
      case 'font-merriweather':
        return "'Merriweather', Georgia, serif";
      case 'font-outfit':
        return "'Outfit', system-ui, sans-serif";
      case 'font-inter':
      default:
        return "'Inter', system-ui, sans-serif";
    }
  };

  const getAspectRatioStyle = () => {
    if (isFullscreen) {
      return {
        width: '100vw',
        height: '100vh',
        minHeight: '100vh',
      };
    }

    switch (aspectRatio) {
      case '1:1':
        return { aspectRatio: '1 / 1', minHeight: '480px' };
      case '9:16':
        return { aspectRatio: '9 / 16', minHeight: '620px' };
      case '4:5':
        return { aspectRatio: '4 / 5', minHeight: '540px' };
      case '16:9':
        return { aspectRatio: '16 / 9', minHeight: '400px' };
      case 'auto':
      default:
        return { minHeight: 'auto', width: '100%' };
    }
  };

  const [previewCardWidth, setPreviewCardWidth] = useState(690);

  useEffect(() => {
    if (isFullscreen) return;
    const el = document.getElementById('quran-export-card');
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        setPreviewCardWidth(rect.width);
      }
    };

    measure();
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width || entry.target.getBoundingClientRect().width;
        if (w > 0) {
          setPreviewCardWidth(w);
        }
      }
    });

    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [isFullscreen, aspectRatio]);

  // Exact scale multiplier based on card width (preserves 100% identical line breaks & visual percentages)
  const scaleFactor = isFullscreen && previewCardWidth > 0
    ? (typeof window !== 'undefined' ? window.innerWidth / previewCardWidth : 2.7)
    : 1;

  // Proportional font scaling for immersive full screen presentation (identical visual %)
  const effectiveArabicFontSize = isFullscreen
    ? Math.round(arabicFontSize * scaleFactor)
    : arabicFontSize;

  const effectiveTranslationFontSize = isFullscreen
    ? Math.round(translationFontSize * scaleFactor)
    : translationFontSize;

  // Tokenize full verse to check if active chunk is the last chunk
  const words = React.useMemo(() => {
    if (!verseData?.arabicText) return [];
    const rawTokens = verseData.arabicText.trim().split(/\s+/).filter(Boolean);
    const waqafOnlyRegex = /^[\u06D6-\u06ED\u0615-\u061Aۗۖۘۙۚۛۜ]+$/;
    const list = [];
    for (let i = 0; i < rawTokens.length; i++) {
      const token = rawTokens[i];
      if (waqafOnlyRegex.test(token) && list.length > 0) {
        list[list.length - 1] += ` ${token}`;
      } else {
        list.push(token);
      }
    }
    return list;
  }, [verseData?.arabicText]);

  const isChunkActive = mode === 'single' && previewTarget === 'chunk' && chunks && chunks.length > 0;
  const currentChunk = isChunkActive ? (chunks[activeChunkIndex] || chunks[0]) : null;
  const isLastChunk = currentChunk ? (currentChunk.endIndex === words.length - 1) : true;
  const isFirstChunk = currentChunk ? (currentChunk.startIndex === 0 || activeChunkIndex === 0) : true;

  const displayedArabicText = currentChunk ? currentChunk.arabicText : (verseData?.arabicText || '');
  
  const activeCustomVerseLatin =
    verseData?.customLatin !== undefined && verseData?.customLatin !== ''
      ? verseData.customLatin
      : (customVerseLatin || '');

  const displayedLatinText = (() => {
    if (isChunkActive && currentChunk) {
      if (currentChunk.customLatin && currentChunk.customLatin.trim() !== '') {
        return currentChunk.customLatin;
      }
      return currentChunk.latinText || '';
    }
    if (activeCustomVerseLatin && activeCustomVerseLatin.trim() !== '') {
      return activeCustomVerseLatin;
    }
    return verseData?.latinText || '';
  })();

  const shouldRenderAyahMarker = showAyahNumber && selectedAyah && (!isChunkActive || isLastChunk);
  const shouldRenderTranslationAyahNumber = showTranslationAyahNumber && (!isChunkActive || isFirstChunk);

  const defaultFullTranslation = translationLang === 'id'
    ? verseData?.indonesianText || 'Terjemahan tidak tersedia'
    : verseData?.englishText || 'Translation not available';

  const activeCustomVerseTranslation =
    verseData?.customTranslation !== undefined && verseData?.customTranslation !== ''
      ? verseData.customTranslation
      : (customVerseTranslation || '');

  const currentTranslation = (() => {
    if (isChunkActive && currentChunk) {
      if (currentChunk.customTranslation && currentChunk.customTranslation.trim() !== '') {
        return currentChunk.customTranslation;
      }
      return defaultFullTranslation;
    }
    if (activeCustomVerseTranslation && activeCustomVerseTranslation.trim() !== '') {
      return activeCustomVerseTranslation;
    }
    return defaultFullTranslation;
  })();

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Top Preview Bar with Mode Switch & Fullscreen Button */}
      <div className="w-full flex items-center justify-between mb-2 gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {mode === 'single' && (
            <span className="text-xs font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
              QS. {surahInfo?.englishName || 'Surah'} : {selectedAyah}
            </span>
          )}

          {/* Quick Edit Custom Translation Button for Full Verse */}
          {mode === 'single' && previewTarget === 'full' && (
            <button
              type="button"
              onClick={() => setIsEditingTranslation(!isEditingTranslation)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                (activeCustomVerseTranslation && activeCustomVerseTranslation.trim() !== '') || (activeCustomVerseLatin && activeCustomVerseLatin.trim() !== '')
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs font-bold'
                  : isEditingTranslation
                  ? 'bg-slate-100 text-slate-800 border-slate-300 shadow-2xs font-bold'
                  : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 shadow-2xs'
              }`}
              title="Edit kustom teks latin dan terjemahan untuk ayat ini"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {(activeCustomVerseTranslation && activeCustomVerseTranslation.trim() !== '') || (activeCustomVerseLatin && activeCustomVerseLatin.trim() !== '')
                  ? 'Kustom Teks (Aktif)'
                  : 'Edit Teks (Latin / Terjemahan)'}
              </span>
            </button>
          )}

          {/* Selector Tampilan: Full 1 Ayat vs Pecahan */}
          {mode === 'single' && chunks && chunks.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setPreviewTarget && setPreviewTarget('full')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    previewTarget === 'full'
                      ? 'bg-white text-emerald-800 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Full 1 Ayat
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTarget && setPreviewTarget('chunk')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    previewTarget === 'chunk'
                      ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span>Pecahan</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      previewTarget === 'chunk' ? 'bg-white/25 text-white font-bold' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {chunks.length}
                  </span>
                </button>
              </div>

              {/* Pemilih Pecahan ke berapa (Aktif saat mode Pecahan dipilih) */}
              {previewTarget === 'chunk' && (
                <div className="inline-flex items-center gap-1 bg-emerald-50/90 p-0.5 rounded-lg border border-emerald-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setActiveChunkIndex && setActiveChunkIndex(Math.max(0, activeChunkIndex - 1))}
                    disabled={activeChunkIndex === 0}
                    className="p-1 rounded text-emerald-800 hover:bg-emerald-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Pecahan Sebelumnya"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1 px-0.5">
                    {chunks.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveChunkIndex && setActiveChunkIndex(idx)}
                        className={`px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer ${
                          activeChunkIndex === idx
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-white hover:bg-emerald-100 text-slate-700 border border-emerald-200/60'
                        }`}
                      >
                        #{idx + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveChunkIndex && setActiveChunkIndex(Math.min(chunks.length - 1, activeChunkIndex + 1))}
                    disabled={activeChunkIndex === chunks.length - 1}
                    className="p-1 rounded text-emerald-800 hover:bg-emerald-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Pecahan Selanjutnya"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={toggleFullscreen}
          title="Tampilkan Live Preview Layar Penuh (Fullscreen)"
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Maximize2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Full Screen</span>
        </button>
      </div>

      {/* Quick Text Editor Collapsible Panel */}
      {mode === 'single' && previewTarget === 'full' && isEditingTranslation && (
        <div className="w-full mb-3 p-3.5 bg-white rounded-2xl border border-emerald-200 shadow-xs animate-in fade-in duration-200 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              Editor Teks Ayat {selectedAyah} (QS. {surahInfo?.englishName || 'Surah'})
            </span>
            <button
              type="button"
              onClick={() => setIsEditingTranslation(false)}
              className="text-[11px] text-slate-500 hover:text-slate-800 px-2 py-0.5 rounded-md hover:bg-slate-100 cursor-pointer font-medium"
            >
              Tutup
            </button>
          </div>

          {/* Section 1: Kustom Teks Latin */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700 text-[11px]">
                  Teks Latin (Transliterasi)
                </span>
                {activeCustomVerseLatin && activeCustomVerseLatin.trim() !== '' && (
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Kustom Aktif
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {(!activeCustomVerseLatin || activeCustomVerseLatin.trim() === '') && (defaultVerseLatin || verseData?.latinText) && (
                  <button
                    type="button"
                    onClick={() => onUpdateCustomVerseLatin && onUpdateCustomVerseLatin(defaultVerseLatin || verseData?.latinText || '')}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 hover:underline font-medium cursor-pointer flex items-center gap-1"
                    title="Salin teks latin bawaan untuk diedit"
                  >
                    <Copy className="w-3 h-3" />
                    Salin Default
                  </button>
                )}
                {activeCustomVerseLatin && activeCustomVerseLatin.trim() !== '' && (
                  <button
                    type="button"
                    onClick={() => onUpdateCustomVerseLatin && onUpdateCustomVerseLatin('')}
                    className="text-[11px] text-rose-600 hover:underline font-medium cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>
            </div>
            <input
              type="text"
              value={activeCustomVerseLatin}
              onChange={(e) => onUpdateCustomVerseLatin && onUpdateCustomVerseLatin(e.target.value)}
              placeholder={defaultVerseLatin || verseData?.latinText || 'Ketik ejaan latin kustom untuk ayat ini... (Kosongkan untuk pakai bawaan API)'}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-sans leading-relaxed"
            />
          </div>

          {/* Section 2: Kustom Terjemahan */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700 text-[11px]">
                  Terjemahan ({translationLang === 'id' ? 'Indonesia' : 'English'})
                </span>
                {activeCustomVerseTranslation && activeCustomVerseTranslation.trim() !== '' && (
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Kustom Aktif
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {(!activeCustomVerseTranslation || activeCustomVerseTranslation.trim() === '') && defaultFullTranslation && (
                  <button
                    type="button"
                    onClick={() => onUpdateCustomVerseTranslation && onUpdateCustomVerseTranslation(defaultFullTranslation)}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 hover:underline font-medium cursor-pointer flex items-center gap-1"
                    title="Salin teks terjemahan bawaan untuk diedit"
                  >
                    <Copy className="w-3 h-3" />
                    Salin Default
                  </button>
                )}
                {activeCustomVerseTranslation && activeCustomVerseTranslation.trim() !== '' && (
                  <button
                    type="button"
                    onClick={() => onUpdateCustomVerseTranslation && onUpdateCustomVerseTranslation('')}
                    className="text-[11px] text-rose-600 hover:underline font-medium cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>
            </div>
            <textarea
              rows={2}
              value={activeCustomVerseTranslation}
              onChange={(e) => onUpdateCustomVerseTranslation && onUpdateCustomVerseTranslation(e.target.value)}
              placeholder={defaultFullTranslation || 'Ketik terjemahan kustom untuk ayat ini... (Kosongkan jika ingin memakai terjemahan asli)'}
              className="w-full px-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-sans leading-relaxed resize-y"
            />
          </div>
        </div>
      )}

      {/* Main Container / Fullscreen Overlay */}
      <div
        ref={containerRef}
        className={
          isFullscreen
            ? 'fixed inset-0 z-50 w-screen h-screen bg-[#000000] flex items-center justify-center p-0 m-0 overflow-hidden select-none animate-in fade-in duration-150'
            : 'relative w-full flex flex-col items-center'
        }
      >
        {/* Floating Controls in Fullscreen (Tucked into corners, non-intrusive) */}
        {isFullscreen && (
          <div className="fixed top-5 left-6 right-6 z-50 flex items-center justify-between pointer-events-none gap-2">
            <div className="flex items-center gap-2 pointer-events-auto bg-black/60 hover:bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 text-white shadow-xl transition-opacity opacity-75 hover:opacity-100">
              <span className="text-xs font-bold text-white tracking-wide">
                QS. {surahInfo?.englishName || 'Surah'} [{surahInfo?.number || 1}]: {selectedAyah}
              </span>
              <span className="opacity-40">•</span>
              <span className="font-amiri text-xs" dir="rtl">{surahInfo?.name}</span>
            </div>

            {/* In-Fullscreen View Switcher */}
            {mode === 'single' && chunks && chunks.length > 0 && (
              <div className="pointer-events-auto flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/15 text-white shadow-xl">
                <button
                  type="button"
                  onClick={() => setPreviewTarget && setPreviewTarget('full')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    previewTarget === 'full'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Full 1 Ayat
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTarget && setPreviewTarget('chunk')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    previewTarget === 'chunk'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  Pecahan
                </button>

                {previewTarget === 'chunk' && (
                  <div className="flex items-center gap-1 pl-1 border-l border-white/20">
                    {chunks.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveChunkIndex && setActiveChunkIndex(idx)}
                        className={`px-2 py-0.5 rounded text-xs font-bold transition-all cursor-pointer ${
                          activeChunkIndex === idx
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : 'text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        #{idx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={toggleFullscreen}
              className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black/60 hover:bg-black/90 text-white text-xs font-semibold backdrop-blur-md transition-all cursor-pointer border border-white/20 shadow-xl opacity-75 hover:opacity-100"
            >
              <Minimize2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Keluar (Esc)</span>
            </button>
          </div>
        )}

        {/* Chunk / Nafas Indicator Navigator */}
        {verseData?.chunkInfo && (
          <div className="w-full mb-3 flex items-center justify-between bg-white border border-emerald-200/90 rounded-xl px-3 py-2 shadow-xs text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-slate-800">
                Mode Potongan Nafas Imam
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg text-[11px] font-bold border border-emerald-200">
                Bagian {verseData.chunkInfo.current} dari {verseData.chunkInfo.total}
              </span>
            </div>
          </div>
        )}

        {/* Range Slide Navigator */}
        {mode === 'range' && (
          <div className={`w-full mb-3 flex items-center justify-between rounded-xl px-3 py-2 shadow-xs text-xs ${
            isFullscreen ? 'max-w-5xl bg-black/60 text-white border border-white/10' : 'bg-white border border-slate-200/90'
          }`}>
            <button
              type="button"
              onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
              disabled={currentSlideIndex <= 0 || loading}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer ${
                isFullscreen ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <div className={`flex items-center gap-2 font-semibold ${isFullscreen ? 'text-white' : 'text-slate-700'}`}>
              <span>
                Slide {currentSlideIndex + 1} of {totalSlides}
              </span>
              <span className="opacity-40">•</span>
              <span className="text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-400/30">
                Verse {startAyah + currentSlideIndex}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setCurrentSlideIndex(Math.min(totalSlides - 1, currentSlideIndex + 1))}
              disabled={currentSlideIndex >= totalSlides - 1 || loading}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer ${
                isFullscreen ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Container with checkerboard if transparent */}
        <div
          className={`w-full ${isFullscreen ? 'w-screen h-screen flex items-center justify-center p-0 m-0' : 'rounded-2xl overflow-hidden p-2'} transition-all ${
            isTransparent && !isFullscreen
              ? 'bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px] bg-slate-100/70 border border-slate-300'
              : isFullscreen
              ? 'bg-transparent'
              : 'bg-white border border-slate-200 shadow-md shadow-slate-200/40'
          }`}
        >
          {/* Actual Export Target Node */}
          <div
            ref={ref}
            id="quran-export-card"
            style={{
              ...getAspectRatioStyle(),
              backgroundColor: isTransparent && !isFullscreen ? 'transparent' : bgColor,
              color: textColor,
              padding: `${Math.round(36 * scaleFactor)}px`,
            }}
            className={`relative flex flex-col items-center justify-between ${
              isFullscreen
                ? 'w-screen h-screen rounded-none border-none shadow-none ring-0'
                : 'w-full rounded-xl'
            } transition-all select-none`}
          >
          {/* Subtle Corner Accents */}
          {!isTransparent && (
            <>
              <div
                className="absolute select-none pointer-events-none"
                style={{
                  color: textColor,
                  top: `${Math.round(18 * scaleFactor)}px`,
                  left: `${Math.round(18 * scaleFactor)}px`,
                  fontSize: `${Math.round(13 * scaleFactor)}px`,
                  opacity: 0.2,
                }}
              >
                ❖
              </div>
              <div
                className="absolute select-none pointer-events-none"
                style={{
                  color: textColor,
                  top: `${Math.round(18 * scaleFactor)}px`,
                  right: `${Math.round(18 * scaleFactor)}px`,
                  fontSize: `${Math.round(13 * scaleFactor)}px`,
                  opacity: 0.2,
                }}
              >
                ❖
              </div>
              <div
                className="absolute select-none pointer-events-none"
                style={{
                  color: textColor,
                  bottom: `${Math.round(18 * scaleFactor)}px`,
                  left: `${Math.round(18 * scaleFactor)}px`,
                  fontSize: `${Math.round(13 * scaleFactor)}px`,
                  opacity: 0.2,
                }}
              >
                ❖
              </div>
              <div
                className="absolute select-none pointer-events-none"
                style={{
                  color: textColor,
                  bottom: `${Math.round(18 * scaleFactor)}px`,
                  right: `${Math.round(18 * scaleFactor)}px`,
                  fontSize: `${Math.round(13 * scaleFactor)}px`,
                  opacity: 0.2,
                }}
              >
                ❖
              </div>
            </>
          )}

          {/* Top Header / Bismillah */}
          {showBismillah && (
            <div className="w-full flex flex-col items-center text-center pt-1 mb-2">
              <div
                className="font-amiri opacity-90 select-none inline-block"
                style={{
                  fontSize: `${Math.round(20 * scaleFactor)}px`,
                  ...(textColor?.toLowerCase() === '#fdf6e6'
                    ? {
                        backgroundImage: 'linear-gradient(180deg, #FFFFFF 0%, #FFF8EB 26%, #FBDCA0 62%, #EDB14A 100%)',
                        WebkitBackgroundImage: 'linear-gradient(180deg, #FFFFFF 0%, #FFF8EB 26%, #FBDCA0 62%, #EDB14A 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        color: '#FFF8EB',
                        filter: 'drop-shadow(0 0 2.5px rgba(255, 240, 195, 0.35)) drop-shadow(0 0 6px rgba(230, 165, 55, 0.12))',
                      }
                    : {
                        color: textColor,
                      }),
                }}
                dir="rtl"
              >
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>
            </div>
          )}

          {/* Center Verse Content with Stable Arabic Anchor */}
          <div className="w-full my-auto py-2 grid grid-rows-[1fr_auto_1fr] items-center">
            {/* Row 1: Top spacing balance */}
            <div className="w-full min-h-[10px]"></div>

            {/* Row 2: Arabic Text (Anchored Center - strictly stable) */}
            <div className="w-full flex items-center justify-center py-1">
              {loading ? (
                <div className="flex flex-col items-center gap-3 py-12">
                  <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
                  <span className="text-xs font-medium text-slate-500">Loading Quran verse...</span>
                </div>
              ) : error ? (
                <div className="text-center py-8 px-4 text-rose-600">
                  <p className="font-semibold text-sm">Failed to load verse</p>
                  <p className="text-xs opacity-80 mt-1">{error}</p>
                </div>
              ) : (
                <p
                  dir="rtl"
                  style={{
                    fontFamily: getFontFamilyName(),
                    fontSize: `${effectiveArabicFontSize}px`,
                    lineHeight: arabicLineHeight,
                    textAlign: textAlign,
                    filter: textColor?.toLowerCase() === '#fdf6e6'
                      ? 'drop-shadow(0 0 2.5px rgba(255, 240, 195, 0.35)) drop-shadow(0 0 6px rgba(230, 165, 55, 0.12))'
                      : undefined,
                  }}
                  className="w-full max-w-[94%] tracking-wide transition-all select-none"
                >
                  <span
                    style={
                      textColor?.toLowerCase() === '#fdf6e6'
                        ? {
                            backgroundImage: 'linear-gradient(180deg, #FFFFFF 0%, #FFFDF2 30%, #FCE6B5 75%, #F2BF5E 100%)',
                            WebkitBackgroundImage: 'linear-gradient(180deg, #FFFFFF 0%, #FFFDF2 30%, #FCE6B5 75%, #F2BF5E 100%)',
                            WebkitBackgroundClip: 'text',
                            backgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            color: '#FFFDF2',
                          }
                        : {
                            color: textColor,
                          }
                    }
                  >
                    {displayedArabicText}
                  </span>
                  {shouldRenderAyahMarker && (
                    <AyahMarker
                      number={selectedAyah}
                      size={Math.max(28, Math.round(effectiveArabicFontSize * 1.15))}
                      color={textColor}
                    />
                  )}
                </p>
              )}
            </div>

            {/* Row 3: Latin Transliteration & Translation (Top-aligned, grows downwards without pushing Arabic up) */}
            <div className="w-full flex flex-col items-center justify-start self-start">
              {/* Latin Transliteration (Right below Arabic, above the divider line) */}
              {!loading && !error && showTransliteration && displayedLatinText && displayedLatinText.trim() !== '' && (
                <div
                  className="w-full max-w-[90%] text-center select-none"
                  style={{
                    marginTop: `${Math.round(8 * scaleFactor)}px`,
                    marginBottom: `${Math.round(2 * scaleFactor)}px`,
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: `${Math.max(11, Math.round(14 * scaleFactor))}px`,
                      color: translationTextColor || '#d4b187',
                      opacity: 0.85,
                      letterSpacing: '0.02em',
                      fontStyle: 'italic',
                      lineHeight: 1.4,
                      textAlign: textAlign,
                    }}
                    className="transition-all"
                  >
                    {displayedLatinText}
                  </p>
                </div>
              )}

              {/* Translation (with divider line) */}
              {!loading && !error && showTranslation && currentTranslation && currentTranslation.trim() !== '' && (() => {
                const effectiveTranslationColor = translationTextColor || textColor;
                const isGradient = typeof effectiveTranslationColor === 'string' && effectiveTranslationColor.includes('gradient');
                return (
                  <div
                    className="w-full flex flex-col items-center"
                    style={{
                      marginTop: showTransliteration && displayedLatinText ? `${Math.round(8 * scaleFactor)}px` : `${Math.round(18 * scaleFactor)}px`,
                      paddingTop: `${Math.round(6 * scaleFactor)}px`,
                    }}
                  >
                    <div
                      className="opacity-30"
                      style={{
                        background: effectiveTranslationColor,
                        width: `${Math.round(64 * scaleFactor)}px`,
                        height: `${Math.max(1, Math.round(1.5 * scaleFactor))}px`,
                        marginBottom: `${Math.round(14 * scaleFactor)}px`,
                      }}
                    ></div>
                    <p
                      style={{
                        fontFamily: getTranslationFontName(),
                        fontSize: `${effectiveTranslationFontSize}px`,
                        textAlign: textAlign,
                        textTransform: translationAllCaps ? 'uppercase' : 'none',
                        letterSpacing: translationAllCaps ? '0.04em' : 'normal',
                        ...(isGradient
                          ? {
                              backgroundImage: effectiveTranslationColor,
                              WebkitBackgroundImage: effectiveTranslationColor,
                              WebkitBackgroundClip: 'text',
                              backgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              color: '#e4d5ab',
                              filter: 'drop-shadow(0 1px 3px rgba(184, 134, 94, 0.25))',
                            }
                          : {
                              color: effectiveTranslationColor,
                            }),
                      }}
                      className="w-full max-w-[92%] font-normal leading-relaxed opacity-95 transition-all select-none"
                    >
                      {shouldRenderTranslationAyahNumber && !/^\s*[\(\[]\s*\d+\s*[\)\]]/.test(currentTranslation) && (
                        <span className="font-semibold mr-2 opacity-95">
                          ( {mode === 'range' ? startAyah + currentSlideIndex : selectedAyah} )
                        </span>
                      )}
                      {currentTranslation}
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Bottom Reference Badge */}
          {showReference && (
            <div className="w-full flex items-center justify-center pb-1 pt-3">
              <div
                className="rounded-full font-medium tracking-wide flex items-center gap-2 select-none"
                style={{
                  color: textColor,
                  border: `1px solid ${textColor}30`,
                  backgroundColor: isTransparent ? 'transparent' : `${textColor}0d`,
                  fontSize: isFullscreen ? `${Math.round(12 * scaleFactor)}px` : '12px',
                  padding: isFullscreen
                    ? `${Math.round(4 * scaleFactor)}px ${Math.round(14 * scaleFactor)}px`
                    : '4px 14px',
                }}
              >
                <span>
                  QS. {surahInfo?.englishName || 'Surah'} [{surahInfo?.number || 1}]: {selectedAyah}
                  {isChunkActive && (
                    <span className="opacity-90 font-medium">
                      {' '}• Pecahan #{activeChunkIndex + 1}/{chunks.length}
                    </span>
                  )}
                  {!isChunkActive && verseData?.chunkInfo && (
                    <span className="opacity-90 font-medium">
                      {' '}• Bagian {verseData.chunkInfo.current}/{verseData.chunkInfo.total}
                    </span>
                  )}
                </span>
                <span className="opacity-40">•</span>
                <span
                  className="font-amiri"
                  style={{
                    fontSize: isFullscreen ? `${Math.round(14 * scaleFactor)}px` : '14px',
                  }}
                  dir="rtl"
                >
                  {surahInfo?.name}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
});

export default VersePreview;
