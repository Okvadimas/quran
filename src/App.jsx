import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import VerseSelector from './components/VerseSelector';
import StyleControls from './components/StyleControls';
import VersePreview from './components/VersePreview';
import ExportToolbar from './components/ExportToolbar';
import VerseChunker from './components/VerseChunker';
import { SURAHS } from './data/surahs';

export default function App() {
  // Surah & Verse state (Defaults to Surah 25: Al-Furqan)
  const [selectedSurah, setSelectedSurah] = useState(25);
  const [selectedAyah, setSelectedAyah] = useState(20);

  // Mode: 'single' | 'range'
  const [mode, setMode] = useState('single');
  const [startAyah, setStartAyah] = useState(20);
  const [endAyah, setEndAyah] = useState(30);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Chunking / Potongan Nafas State (Imam Recitation Splitter)
  const [isChunkMode, setIsChunkMode] = useState(false);
  const [chunks, setChunks] = useState([]);
  const [activeChunkIndex, setActiveChunkIndex] = useState(0);

  // Styling state
  const [fontFamily, setFontFamily] = useState('font-scheherazade');
  const [arabicFontSize, setArabicFontSize] = useState(36);
  const [arabicLineHeight, setArabicLineHeight] = useState(2.2);
  const [textAlign, setTextAlign] = useState('center');

  // Colors: Default Light Mode (White background, Dark slate text)
  const [isTransparent, setIsTransparent] = useState(false);
  const [bgColor, setBgColor] = useState('#ffffff');
  const [textColor, setTextColor] = useState('#0f172a');

  // Translation (Default unchecked)
  const [showTranslation, setShowTranslation] = useState(false);
  const [translationLang, setTranslationLang] = useState('id'); // 'id' | 'en'
  const [translationFontSize, setTranslationFontSize] = useState(15);

  // Layout: Default Auto Fit (Fit Content), ornaments unchecked
  const [aspectRatio, setAspectRatio] = useState('auto');
  const [showReference, setShowReference] = useState(false);
  const [showBismillah, setShowBismillah] = useState(false);

  // Surah data & verses
  const [surahVerses, setSurahVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cache
  const cacheRef = useRef({});
  const previewRef = useRef(null);

  const currentSurahData = SURAHS.find((s) => s.number === selectedSurah) || SURAHS[0];

  // Fetch full surah data
  useEffect(() => {
    let isMounted = true;

    if (cacheRef.current[selectedSurah]) {
      setSurahVerses(cacheRef.current[selectedSurah]);
      return;
    }

    setLoading(true);
    setError(null);

    const fetchSurah = async () => {
      try {
        const res = await fetch(
          `https://api.alquran.cloud/v1/surah/${selectedSurah}/editions/quran-simple,id.indonesian,en.asad`
        );

        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }

        const json = await res.json();
        if (json.code === 200 && Array.isArray(json.data) && json.data.length >= 3) {
          const arabicAyahs = json.data[0].ayahs || [];
          const indoAyahs = json.data[1].ayahs || [];
          const englishAyahs = json.data[2].ayahs || [];

          const combined = arabicAyahs.map((item, idx) => ({
            numberInSurah: item.numberInSurah,
            arabicText: item.text,
            indonesianText: indoAyahs[idx]?.text || '',
            englishText: englishAyahs[idx]?.text || '',
          }));

          if (isMounted) {
            cacheRef.current[selectedSurah] = combined;
            setSurahVerses(combined);
          }
        } else {
          throw new Error('Invalid Quran data format.');
        }
      } catch (err) {
        console.error('Fetch surah error:', err);
        if (isMounted) {
          setError('Failed to fetch verse data. Please check your internet connection.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSurah();

    return () => {
      isMounted = false;
    };
  }, [selectedSurah]);

  // Adjust bounds when surah changes
  useEffect(() => {
    const maxAyahs = currentSurahData.numberOfAyahs;
    if (selectedAyah > maxAyahs) setSelectedAyah(1);
    if (startAyah > maxAyahs) setStartAyah(1);
    if (endAyah > maxAyahs || endAyah < startAyah) setEndAyah(Math.min(maxAyahs, startAyah + 5));
    setCurrentSlideIndex(0);
  }, [selectedSurah]);

  useEffect(() => {
    setCurrentSlideIndex(0);
  }, [startAyah, endAyah, mode]);

  // Reset chunks when surah or ayah changes
  useEffect(() => {
    setChunks([]);
    setActiveChunkIndex(0);
  }, [selectedSurah, selectedAyah]);

  const rangeAyahsList = React.useMemo(() => {
    if (mode !== 'range' || surahVerses.length === 0) return [];
    return surahVerses.filter(
      (v) => v.numberInSurah >= startAyah && v.numberInSurah <= endAyah
    );
  }, [mode, surahVerses, startAyah, endAyah]);

  const totalRangeSlides = Math.max(1, endAyah - startAyah + 1);

  const currentVerseData = React.useMemo(() => {
    let baseData;
    if (mode === 'single') {
      baseData =
        surahVerses.find((v) => v.numberInSurah === selectedAyah) || {
          arabicText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
          indonesianText: 'Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.',
          englishText: 'In the name of God, the Most Gracious, the Most Merciful.',
          numberInSurah: selectedAyah,
        };
    } else {
      baseData =
        rangeAyahsList[currentSlideIndex] ||
        surahVerses.find((v) => v.numberInSurah === startAyah + currentSlideIndex) || {
          arabicText: '...',
          indonesianText: '...',
          englishText: '...',
          numberInSurah: startAyah + currentSlideIndex,
        };
    }

    // When single mode + chunk mode is enabled with chunks defined
    if (mode === 'single' && isChunkMode && chunks.length > 0) {
      const activeChunk = chunks[activeChunkIndex] || chunks[0];
      if (activeChunk) {
        return {
          ...baseData,
          arabicText: activeChunk.arabicText,
          customTranslation: activeChunk.customTranslation,
          chunkInfo: {
            current: activeChunkIndex + 1,
            total: chunks.length,
          },
        };
      }
    }

    return baseData;
  }, [mode, surahVerses, selectedAyah, rangeAyahsList, currentSlideIndex, startAyah, isChunkMode, chunks, activeChunkIndex]);

  const activeAyahNumber =
    mode === 'single' ? selectedAyah : currentVerseData?.numberInSurah || startAyah + currentSlideIndex;

  const handleRandomVerse = () => {
    const randomSurahObj = SURAHS[Math.floor(Math.random() * SURAHS.length)];
    const randomAyahNum = Math.floor(Math.random() * randomSurahObj.numberOfAyahs) + 1;
    setSelectedSurah(randomSurahObj.number);
    setSelectedAyah(randomAyahNum);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-emerald-500/20 selection:text-emerald-900">
      <Navbar />

      {/* Full width container without max-w-7xl constraint */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* SISI KIRI: Configuration & Controls */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* 1. Surah & Verse Selector */}
            <VerseSelector
              selectedSurah={selectedSurah}
              setSelectedSurah={setSelectedSurah}
              selectedAyah={selectedAyah}
              setSelectedAyah={setSelectedAyah}
              mode={mode}
              setMode={setMode}
              startAyah={startAyah}
              setStartAyah={setStartAyah}
              endAyah={endAyah}
              setEndAyah={setEndAyah}
              loading={loading}
              onRandomVerse={handleRandomVerse}
            />

            {/* 2. Aspect Ratio & Advanced Design Settings */}
            <StyleControls
              fontFamily={fontFamily}
              setFontFamily={setFontFamily}
              arabicFontSize={arabicFontSize}
              setArabicFontSize={setArabicFontSize}
              arabicLineHeight={arabicLineHeight}
              setArabicLineHeight={setArabicLineHeight}
              isTransparent={isTransparent}
              setIsTransparent={setIsTransparent}
              bgColor={bgColor}
              setBgColor={setBgColor}
              textColor={textColor}
              setTextColor={setTextColor}
              showTranslation={showTranslation}
              setShowTranslation={setShowTranslation}
              translationLang={translationLang}
              setTranslationLang={setTranslationLang}
              translationFontSize={translationFontSize}
              setTranslationFontSize={setTranslationFontSize}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              showReference={showReference}
              setShowReference={setShowReference}
              showBismillah={showBismillah}
              setShowBismillah={setShowBismillah}
              textAlign={textAlign}
              setTextAlign={setTextAlign}
            />

            {/* 3. Export Toolbar */}
            <ExportToolbar
              previewRef={previewRef}
              surahInfo={currentSurahData}
              selectedAyah={activeAyahNumber}
              isTransparent={isTransparent}
              bgColor={bgColor}
              mode={mode}
              startAyah={startAyah}
              endAyah={endAyah}
              totalSlides={totalRangeSlides}
              rangeAyahsList={rangeAyahsList}
              setCurrentSlideIndex={setCurrentSlideIndex}
              isChunkMode={isChunkMode}
              activeChunkIndex={activeChunkIndex}
              totalChunks={chunks.length}
            />
          </div>

          {/* SISI KANAN: Live Preview & Studio (Sticky on desktop with scroll support) */}
          <div className="lg:col-span-7 flex flex-col gap-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto pr-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">
                Live Preview
              </h2>
              <span className="text-xs text-slate-500">
                Aspect Ratio:{' '}
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200/60">
                  {aspectRatio === 'auto' ? 'Auto Fit' : aspectRatio}
                </span>
              </span>
            </div>

            {/* Canvas / Image Preview */}
            <VersePreview
              ref={previewRef}
              verseData={currentVerseData}
              loading={loading}
              error={error}
              fontFamily={fontFamily}
              arabicFontSize={arabicFontSize}
              arabicLineHeight={arabicLineHeight}
              isTransparent={isTransparent}
              bgColor={bgColor}
              textColor={textColor}
              showTranslation={showTranslation}
              translationLang={translationLang}
              translationFontSize={translationFontSize}
              aspectRatio={aspectRatio}
              showReference={showReference}
              showBismillah={showBismillah}
              textAlign={textAlign}
              surahInfo={currentSurahData}
              selectedAyah={activeAyahNumber}
              mode={mode}
              currentSlideIndex={currentSlideIndex}
              setCurrentSlideIndex={setCurrentSlideIndex}
              totalSlides={totalRangeSlides}
              startAyah={startAyah}
              endAyah={endAyah}
            />

            {/* Recitation Splitter (Potongan Nafas Imam) - Placed directly below Live Preview */}
            {mode === 'single' && (
              <VerseChunker
                previewRef={previewRef}
                currentVerseData={surahVerses.find((v) => v.numberInSurah === selectedAyah) || currentVerseData}
                selectedAyah={selectedAyah}
                surahInfo={currentSurahData}
                isTransparent={isTransparent}
                bgColor={bgColor}
                isChunkMode={isChunkMode}
                setIsChunkMode={setIsChunkMode}
                chunks={chunks}
                setChunks={setChunks}
                activeChunkIndex={activeChunkIndex}
                setActiveChunkIndex={setActiveChunkIndex}
                fontFamily={fontFamily}
              />
            )}
          </div>
        </div>
      </main>

      {/* Full width footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 mt-12 text-center text-xs text-slate-500 w-full px-4 sm:px-6 lg:px-8">
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} Soul of Quran — Minimal Light Edition</p>
          <p className="text-slate-500">
            Source Data: <span className="text-emerald-700 font-semibold">AlQuran.cloud (quran-simple)</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
