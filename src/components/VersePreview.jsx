import React, { forwardRef } from 'react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const VersePreview = forwardRef(function VersePreview(
  {
    verseData,
    loading,
    error,
    fontFamily,
    arabicFontSize,
    arabicLineHeight,
    isTransparent,
    bgColor,
    textColor,
    showTranslation,
    translationLang,
    translationFontSize,
    aspectRatio,
    showReference,
    showBismillah,
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
  },
  ref
) {
  const getFontFamilyName = () => {
    if (fontFamily === 'font-scheherazade') return "'Scheherazade New', serif";
    if (fontFamily === 'font-amiri-quran') return "'Amiri Quran', serif";
    return "'Amiri', serif";
  };

  const getAspectRatioStyle = () => {
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

  const currentTranslation = (() => {
    if (verseData?.chunkInfo) {
      return verseData?.customTranslation || '';
    }
    return translationLang === 'id'
      ? verseData?.indonesianText || 'Terjemahan tidak tersedia'
      : verseData?.englishText || 'Translation not available';
  })();

  return (
    <div className="relative w-full flex flex-col items-center">
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
        <div className="w-full mb-3 flex items-center justify-between bg-white border border-slate-200/90 rounded-xl px-3 py-2 shadow-xs text-xs">
          <button
            type="button"
            onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
            disabled={currentSlideIndex <= 0 || loading}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center gap-2 font-semibold text-slate-700">
            <span>
              Slide {currentSlideIndex + 1} of {totalSlides}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-200/60">
              Verse {startAyah + currentSlideIndex}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setCurrentSlideIndex(Math.min(totalSlides - 1, currentSlideIndex + 1))}
            disabled={currentSlideIndex >= totalSlides - 1 || loading}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Container with checkerboard if transparent */}
      <div
        className={`w-full rounded-2xl overflow-hidden p-2 transition-all ${
          isTransparent
            ? 'bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:16px_16px] bg-slate-100/70 border border-slate-300'
            : 'bg-white border border-slate-200 shadow-md shadow-slate-200/40'
        }`}
      >
        {/* Actual Export Target Node */}
        <div
          ref={ref}
          id="quran-export-card"
          style={{
            ...getAspectRatioStyle(),
            backgroundColor: isTransparent ? 'transparent' : bgColor,
            color: textColor,
          }}
          className={`relative w-full flex flex-col items-center justify-between ${
            aspectRatio === 'auto' ? 'py-6 px-6 sm:px-8' : 'p-8 sm:p-10'
          } transition-all rounded-xl select-none`}
        >
          {/* Subtle Corner Accents (only when not transparent and not compact auto) */}
          {!isTransparent && aspectRatio !== 'auto' && (
            <>
              <div
                className="absolute top-4 left-4 text-xs opacity-20 select-none pointer-events-none"
                style={{ color: textColor }}
              >
                ❖
              </div>
              <div
                className="absolute top-4 right-4 text-xs opacity-20 select-none pointer-events-none"
                style={{ color: textColor }}
              >
                ❖
              </div>
              <div
                className="absolute bottom-4 left-4 text-xs opacity-20 select-none pointer-events-none"
                style={{ color: textColor }}
              >
                ❖
              </div>
              <div
                className="absolute bottom-4 right-4 text-xs opacity-20 select-none pointer-events-none"
                style={{ color: textColor }}
              >
                ❖
              </div>
            </>
          )}

          {/* Top Header / Bismillah */}
          {showBismillah && (
            <div className="w-full flex flex-col items-center text-center pt-1 mb-2">
              <div
                className="font-amiri text-lg sm:text-xl opacity-85 select-none"
                style={{ color: textColor }}
                dir="rtl"
              >
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </div>
            </div>
          )}

          {/* Center Verse Content */}
          <div className="w-full my-auto py-3 flex flex-col items-center justify-center">
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
              <div className="w-full space-y-4">
                {/* Arabic Text */}
                <p
                  dir="rtl"
                  style={{
                    fontFamily: getFontFamilyName(),
                    fontSize: `${arabicFontSize}px`,
                    lineHeight: arabicLineHeight,
                    color: textColor,
                    textAlign: textAlign,
                  }}
                  className="w-full tracking-wide transition-all select-none"
                >
                  {verseData?.arabicText}
                </p>

                {/* Translation */}
                {showTranslation && currentTranslation && currentTranslation.trim() !== '' && (
                  <div className="w-full flex flex-col items-center pt-2">
                    <div
                      className="w-12 h-px mb-3 opacity-25"
                      style={{ backgroundColor: textColor }}
                    ></div>
                    <p
                      style={{
                        fontSize: `${translationFontSize}px`,
                        color: textColor,
                        textAlign: textAlign,
                      }}
                      className="max-w-md italic font-sans leading-relaxed opacity-90 transition-all select-none"
                    >
                      "{currentTranslation}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Reference Badge */}
          {showReference && (
            <div className="w-full flex items-center justify-center pb-1 pt-3">
              <div
                className="px-3.5 py-1 rounded-full text-xs font-medium tracking-wide flex items-center gap-2 select-none"
                style={{
                  color: textColor,
                  border: `1px solid ${textColor}30`,
                  backgroundColor: isTransparent ? 'transparent' : `${textColor}0d`,
                }}
              >
                <span>
                  QS. {surahInfo?.englishName || 'Surah'} [{surahInfo?.number || 1}]: {selectedAyah}
                  {verseData?.chunkInfo && (
                    <span className="opacity-90 font-medium">
                      {' '}• Bagian {verseData.chunkInfo.current}/{verseData.chunkInfo.total}
                    </span>
                  )}
                </span>
                <span className="opacity-40">•</span>
                <span className="font-amiri text-sm" dir="rtl">
                  {surahInfo?.name}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default VersePreview;
