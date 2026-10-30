import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import VerseSelector from './components/VerseSelector';
import StyleControls from './components/StyleControls';
import VersePreview from './components/VersePreview';
import ExportToolbar from './components/ExportToolbar';
import VerseChunker from './components/VerseChunker';
import { SURAHS } from './data/surahs';

export default function App() {
  // Surah & Verse state (Defaults to Surah 23: Al-Mu'minun, Verse 1)
  const [selectedSurah, setSelectedSurah] = useState(23);
  const [selectedAyah, setSelectedAyah] = useState(1);

  // Mode: 'single' | 'range'
  const [mode, setMode] = useState('single');
  const [startAyah, setStartAyah] = useState(1);
  const [endAyah, setEndAyah] = useState(1);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Chunking / Potongan Nafas State (Imam Recitation Splitter)
  const [isChunkMode, setIsChunkMode] = useState(false);
  const [chunks, setChunks] = useState([]);
  const [activeChunkIndex, setActiveChunkIndex] = useState(0);
  const [previewTarget, setPreviewTarget] = useState('full'); // 'full' | 'chunk'

  // Styling state
  const [fontFamily, setFontFamily] = useState('font-scheherazade');
  const [arabicFontSize, setArabicFontSize] = useState(32);
  const [arabicLineHeight, setArabicLineHeight] = useState(2.2);
  const [textAlign, setTextAlign] = useState('center');

  // Colors: Default Pure Black Mode (#000000 background, White text)
  const [isTransparent, setIsTransparent] = useState(false);
  const [bgColor, setBgColor] = useState('#000000');
  const [textColor, setTextColor] = useState('#fdf6e6');

  // Translation (Default: Outfit geometric font, natural casing, Bronze Gold #d4b187 from cover subtitle)
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTransliteration, setShowTransliteration] = useState(true); // Latin Transliteration (Default ON)
  const [latinFontSize, setLatinFontSize] = useState(14);
  const [translationLang, setTranslationLang] = useState('id'); // 'id' | 'en'
  const [translationFontSize, setTranslationFontSize] = useState(19);
  const [translationFontFamily, setTranslationFontFamily] = useState('font-outfit');
  const [translationAllCaps, setTranslationAllCaps] = useState(false);
  const [showTranslationAyahNumber, setShowTranslationAyahNumber] = useState(true);
  const [translationTextColor, setTranslationTextColor] = useState('#d4b187'); // Bronze Gold (Cover)
  const [customVerseTranslations, setCustomVerseTranslations] = useState({});
  const [customVerseLatins, setCustomVerseLatins] = useState({});

  // Layout: Default 16:9 Landscape, ornaments
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [showReference, setShowReference] = useState(false);
  const [showBismillah, setShowBismillah] = useState(false);
  const [showAyahNumber, setShowAyahNumber] = useState(true);

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
          `https://api.alquran.cloud/v1/surah/${selectedSurah}/editions/quran-simple,id.indonesian,en.asad,en.transliteration`
        );

        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }

        const json = await res.json();
        if (json.code === 200 && Array.isArray(json.data) && json.data.length >= 3) {
          const arabicAyahs = json.data[0].ayahs || [];
          const indoAyahs = json.data[1].ayahs || [];
          const englishAyahs = json.data[2].ayahs || [];
          const latinAyahs = json.data[3]?.ayahs || [];

          const combined = arabicAyahs.map((item, idx) => ({
            numberInSurah: item.numberInSurah,
            arabicText: item.text,
            indonesianText: indoAyahs[idx]?.text || '',
            englishText: englishAyahs[idx]?.text || '',
            latinText: latinAyahs[idx]?.text || '',
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
    setPreviewTarget('full');
  }, [selectedSurah, selectedAyah]);

  const rangeAyahsList = React.useMemo(() => {
    if (mode !== 'range' || surahVerses.length === 0) return [];
    return surahVerses
      .filter((v) => v.numberInSurah >= startAyah && v.numberInSurah <= endAyah)
      .map((v) => ({
        ...v,
        customTranslation: customVerseTranslations[`${selectedSurah}:${v.numberInSurah}`] || '',
        customLatin: customVerseLatins[`${selectedSurah}:${v.numberInSurah}`] || '',
      }));
  }, [mode, surahVerses, startAyah, endAyah, selectedSurah, customVerseTranslations, customVerseLatins]);

  const totalRangeSlides = Math.max(1, endAyah - startAyah + 1);

  const currentVerseData = React.useMemo(() => {
    let baseData;
    if (mode === 'single') {
      baseData =
        surahVerses.find((v) => v.numberInSurah === selectedAyah) || {
          arabicText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
          indonesianText: 'Dengan nama Allah Yang Maha Pengasih, Maha Penyayang.',
          englishText: 'In the name of God, the Most Gracious, the Most Merciful.',
          latinText: "Bismillaahir-rohmaanir-rohiim",
          numberInSurah: selectedAyah,
        };
    } else {
      baseData =
        rangeAyahsList[currentSlideIndex] ||
        surahVerses.find((v) => v.numberInSurah === startAyah + currentSlideIndex) || {
          arabicText: '...',
          indonesianText: '...',
          englishText: '...',
          latinText: '...',
          numberInSurah: startAyah + currentSlideIndex,
        };
    }

    const ayahNum = baseData.numberInSurah || (mode === 'single' ? selectedAyah : startAyah + currentSlideIndex);
    const key = `${selectedSurah}:${ayahNum}`;
    const customText = customVerseTranslations[key] || '';
    const customLatinText = customVerseLatins[key] || '';

    return {
      ...baseData,
      customTranslation: customText,
      customLatin: customLatinText,
    };
  }, [mode, surahVerses, selectedAyah, rangeAyahsList, currentSlideIndex, startAyah, selectedSurah, customVerseTranslations, customVerseLatins]);

  const activeAyahNumber =
    mode === 'single' ? selectedAyah : currentVerseData?.numberInSurah || startAyah + currentSlideIndex;

  const activeAyahKey = `${selectedSurah}:${activeAyahNumber}`;
  const customVerseTranslation = customVerseTranslations[activeAyahKey] || '';
  const customVerseLatin = customVerseLatins[activeAyahKey] || '';

  const handleUpdateCustomVerseTranslation = (text) => {
    setCustomVerseTranslations((prev) => {
      const next = { ...prev };
      if (text && text.trim() !== '') {
        next[activeAyahKey] = text;
      } else {
        delete next[activeAyahKey];
      }
      return next;
    });
  };

  const handleUpdateCustomVerseLatin = (text) => {
    setCustomVerseLatins((prev) => {
      const next = { ...prev };
      if (text && text.trim() !== '') {
        next[activeAyahKey] = text;
      } else {
        delete next[activeAyahKey];
      }
      return next;
    });
  };

  const defaultVerseTranslation =
    translationLang === 'id'
      ? currentVerseData?.indonesianText || ''
      : currentVerseData?.englishText || '';

  const defaultVerseLatin = currentVerseData?.latinText || '';

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
              translationFontFamily={translationFontFamily}
              setTranslationFontFamily={setTranslationFontFamily}
              translationAllCaps={translationAllCaps}
              setTranslationAllCaps={setTranslationAllCaps}
              showTranslationAyahNumber={showTranslationAyahNumber}
              setShowTranslationAyahNumber={setShowTranslationAyahNumber}
              selectedAyah={activeAyahNumber}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              showReference={showReference}
              setShowReference={setShowReference}
              showBismillah={showBismillah}
              setShowBismillah={setShowBismillah}
              showAyahNumber={showAyahNumber}
              setShowAyahNumber={setShowAyahNumber}
              textAlign={textAlign}
              setTextAlign={setTextAlign}
              customVerseTranslation={customVerseTranslation}
              onUpdateCustomVerseTranslation={handleUpdateCustomVerseTranslation}
              defaultVerseTranslation={defaultVerseTranslation}
              customVerseLatin={customVerseLatin}
              onUpdateCustomVerseLatin={handleUpdateCustomVerseLatin}
              defaultVerseLatin={defaultVerseLatin}
              translationTextColor={translationTextColor}
              setTranslationTextColor={setTranslationTextColor}
              showTransliteration={showTransliteration}
              setShowTransliteration={setShowTransliteration}
              latinFontSize={latinFontSize}
              setLatinFontSize={setLatinFontSize}
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
              showTransliteration={showTransliteration}
              latinFontSize={latinFontSize}
              translationLang={translationLang}
              translationFontSize={translationFontSize}
              translationFontFamily={translationFontFamily}
              translationAllCaps={translationAllCaps}
              showTranslationAyahNumber={showTranslationAyahNumber}
              aspectRatio={aspectRatio}
              showReference={showReference}
              showBismillah={showBismillah}
              showAyahNumber={showAyahNumber}
              textAlign={textAlign}
              surahInfo={currentSurahData}
              selectedAyah={activeAyahNumber}
              mode={mode}
              currentSlideIndex={currentSlideIndex}
              setCurrentSlideIndex={setCurrentSlideIndex}
              totalSlides={totalRangeSlides}
              startAyah={startAyah}
              endAyah={endAyah}
              chunks={chunks}
              activeChunkIndex={activeChunkIndex}
              setActiveChunkIndex={setActiveChunkIndex}
              previewTarget={previewTarget}
              setPreviewTarget={setPreviewTarget}
              customVerseTranslation={customVerseTranslation}
              onUpdateCustomVerseTranslation={handleUpdateCustomVerseTranslation}
              defaultVerseTranslation={defaultVerseTranslation}
              customVerseLatin={customVerseLatin}
              onUpdateCustomVerseLatin={handleUpdateCustomVerseLatin}
              defaultVerseLatin={defaultVerseLatin}
              translationTextColor={translationTextColor}
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
                textColor={textColor}
                isChunkMode={isChunkMode}
                setIsChunkMode={setIsChunkMode}
                chunks={chunks}
                setChunks={setChunks}
                activeChunkIndex={activeChunkIndex}
                setActiveChunkIndex={setActiveChunkIndex}
                previewTarget={previewTarget}
                setPreviewTarget={setPreviewTarget}
                fontFamily={fontFamily}
                arabicFontSize={arabicFontSize}
                arabicLineHeight={arabicLineHeight}
                aspectRatio={aspectRatio}
                showTranslation={showTranslation}
                showTransliteration={showTransliteration}
                latinFontSize={latinFontSize}
                translationLang={translationLang}
                translationFontSize={translationFontSize}
                translationFontFamily={translationFontFamily}
                translationAllCaps={translationAllCaps}
                showTranslationAyahNumber={showTranslationAyahNumber}
                translationTextColor={translationTextColor}
                showReference={showReference}
                showBismillah={showBismillah}
                showAyahNumber={showAyahNumber}
                textAlign={textAlign}
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
