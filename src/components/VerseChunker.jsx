import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  Archive,
  Eye,
  Repeat,
  Info,
  Layers,
  SlidersHorizontal,
  BookmarkCheck,
  Flag,
  FileText,
} from 'lucide-react';
import { toPng, toJpeg } from 'html-to-image';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import AyahMarker from './AyahMarker';
import { triggerFileDownload } from '../utils/downloadHelper';

// Helper to tokenize Arabic words and handle waqaf pause marks
export function parseArabicWords(text) {
  if (!text) return [];
  const rawTokens = text.trim().split(/\s+/).filter(Boolean);
  const words = [];
  const waqafOnlyRegex = /^[\u06D6-\u06ED\u0615-\u061Aۗۖۘۙۚۛۜ]+$/;

  for (let i = 0; i < rawTokens.length; i++) {
    const token = rawTokens[i];
    if (waqafOnlyRegex.test(token) && words.length > 0) {
      words[words.length - 1].text += ` ${token}`;
      words[words.length - 1].hasWaqaf = true;
    } else {
      words.push({
        index: words.length,
        text: token,
        hasWaqaf: false,
      });
    }
  }
  return words;
}

export default function VerseChunker({
  previewRef,
  currentVerseData,
  selectedAyah,
  surahInfo,
  isTransparent,
  bgColor,
  textColor = '#fdf6e6',
  isChunkMode,
  setIsChunkMode,
  chunks,
  setChunks,
  activeChunkIndex,
  setActiveChunkIndex,
  previewTarget = 'full',
  setPreviewTarget,
  fontFamily = 'font-scheherazade',
  arabicFontSize = 32,
  arabicLineHeight = 2.2,
  aspectRatio = '16:9',
  showTranslation = true,
  showTransliteration = true,
  latinFontSize = 14,
  translationLang = 'id',
  translationFontSize = 19,
  translationFontFamily = 'font-outfit',
  translationAllCaps = false,
  showTranslationAyahNumber = true,
  translationTextColor = '#d4b187',
  showReference = false,
  showBismillah = false,
  showAyahNumber = true,
  textAlign = 'center',
}) {
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState({ text: '', percent: 0 });
  const [downloadingSingle, setDownloadingSingle] = useState(false);
  const chunkExportRef = useRef(null);
  const [exportingChunk, setExportingChunk] = useState(null);

  // Target boundary to set when clicking word chips: 'start' or 'end'
  const [selectionTarget, setSelectionTarget] = useState('start');

  // Parse words from current verse
  const words = useMemo(() => {
    return parseArabicWords(currentVerseData?.arabicText || '');
  }, [currentVerseData?.arabicText]);

  // Current active chunk target
  const currentTargetChunk = useMemo(() => {
    return chunks[activeChunkIndex] || chunks[0];
  }, [chunks, activeChunkIndex]);

  // Range state for currently active / edited chunk
  const [rangeSelection, setRangeSelection] = useState({ start: 0, end: 0 });

  // Initialize chunks when verse changes or when chunk list is empty
  useEffect(() => {
    if (words.length > 0 && chunks.length === 0) {
      if (words.length > 14) {
        const mid = Math.floor(words.length / 2);
        const chunk1 = {
          id: `chunk-${Date.now()}-1`,
          startIndex: 0,
          endIndex: mid,
          arabicText: words.slice(0, mid + 1).map((w) => w.text).join(' '),
          customTranslation: '',
        };
        const chunk2 = {
          id: `chunk-${Date.now()}-2`,
          startIndex: Math.max(0, mid - 1), // small i'adah overlap
          endIndex: words.length - 1,
          arabicText: words.slice(Math.max(0, mid - 1)).map((w) => w.text).join(' '),
          customTranslation: '',
        };
        setChunks([chunk1, chunk2]);
        setActiveChunkIndex(0);
      } else {
        const chunk1 = {
          id: `chunk-${Date.now()}-1`,
          startIndex: 0,
          endIndex: words.length - 1,
          arabicText: words.map((w) => w.text).join(' '),
          customTranslation: '',
        };
        setChunks([chunk1]);
        setActiveChunkIndex(0);
      }
    }
  }, [selectedAyah, surahInfo?.number, words.length]);

  // Keep rangeSelection in sync with the current chunk
  useEffect(() => {
    if (currentTargetChunk && words.length > 0) {
      const validStart = Math.min(Math.max(0, currentTargetChunk.startIndex ?? 0), words.length - 1);
      const validEnd = Math.min(Math.max(validStart, currentTargetChunk.endIndex ?? words.length - 1), words.length - 1);
      setRangeSelection({ start: validStart, end: validEnd });
    }
  }, [currentTargetChunk, words.length]);

  // Safe and direct chunk range update helper
  const updateChunkRange = (chunkId, newStart, newEnd) => {
    if (!chunkId || words.length === 0) return;
    const validStart = Math.max(0, Math.min(newStart, words.length - 1));
    const validEnd = Math.max(validStart, Math.min(newEnd, words.length - 1));
    const slicedText = words.slice(validStart, validEnd + 1).map((w) => w.text).join(' ');

    setRangeSelection({ start: validStart, end: validEnd });

    setChunks((prev) =>
      prev.map((c) => {
        if (c.id === chunkId) {
          return {
            ...c,
            startIndex: validStart,
            endIndex: validEnd,
            arabicText: slicedText,
          };
        }
        return c;
      })
    );
  };

  // Change Start Word via Dropdown or Stepper
  const handleStartWordChange = (newStart) => {
    if (!currentTargetChunk) return;
    const clampedStart = Math.max(0, Math.min(newStart, words.length - 1));
    const clampedEnd = Math.max(clampedStart, rangeSelection.end);
    updateChunkRange(currentTargetChunk.id, clampedStart, clampedEnd);
  };

  // Change End Word via Dropdown or Stepper
  const handleEndWordChange = (newEnd) => {
    if (!currentTargetChunk) return;
    const clampedEnd = Math.max(0, Math.min(newEnd, words.length - 1));
    const clampedStart = Math.min(rangeSelection.start, clampedEnd);
    updateChunkRange(currentTargetChunk.id, clampedStart, clampedEnd);
  };

  // Handle clicking a word chip in the word cloud
  const handleWordChipClick = (clickedIdx) => {
    if (!currentTargetChunk) return;

    if (selectionTarget === 'start') {
      // Set start word
      const newStart = clickedIdx;
      const newEnd = Math.max(newStart, rangeSelection.end);
      updateChunkRange(currentTargetChunk.id, newStart, newEnd);
      // Automatically advance to 'end' target for the next click
      setSelectionTarget('end');
    } else {
      // Set end word
      const newEnd = clickedIdx;
      const newStart = Math.min(rangeSelection.start, newEnd);
      updateChunkRange(currentTargetChunk.id, newStart, newEnd);
      // Switch back to 'start' target
      setSelectionTarget('start');
    }
  };

  const midPoint = Math.floor(words.length / 2);
  const isMiddleToEndActive =
    words.length > 0 &&
    rangeSelection.start === midPoint &&
    rangeSelection.end === words.length - 1;
  const isStartToMiddleActive =
    words.length > 0 &&
    rangeSelection.start === 0 &&
    rangeSelection.end === midPoint;
  const isAllWordsActive =
    words.length > 0 &&
    rangeSelection.start === 0 &&
    rangeSelection.end === words.length - 1;

  // Helper for export styles
  const getAspectRatioStyle = (ratio) => {
    switch (ratio) {
      case '1:1':
        return { aspectRatio: '1 / 1', minHeight: '480px', width: '100%' };
      case '9:16':
        return { aspectRatio: '9 / 16', minHeight: '620px', width: '100%' };
      case '4:5':
        return { aspectRatio: '4 / 5', minHeight: '540px', width: '100%' };
      case '16:9':
        return { aspectRatio: '16 / 9', minHeight: '400px', width: '100%' };
      case 'auto':
      default:
        return { minHeight: 'auto', width: '100%' };
    }
  };

  const getFontFamilyName = (f) => {
    if (f === 'font-scheherazade') return "'Scheherazade New', serif";
    if (f === 'font-amiri-quran') return "'Amiri Quran', serif";
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

  // Quick preset shortcuts
  const handleQuickPreset = (type) => {
    if (!currentTargetChunk || words.length === 0) return;
    const mid = Math.floor(words.length / 2);

    if (type === 'middleToEnd') {
      updateChunkRange(currentTargetChunk.id, mid, words.length - 1);
    } else if (type === 'startToMiddle') {
      updateChunkRange(currentTargetChunk.id, 0, mid);
    } else if (type === 'allWords') {
      updateChunkRange(currentTargetChunk.id, 0, words.length - 1);
    }
  };

  // Fine-tuning step (-1 / +1)
  const handleStepRange = (targetBound, delta) => {
    if (!currentTargetChunk) return;
    if (targetBound === 'start') {
      const nextStart = Math.max(0, Math.min(rangeSelection.start + delta, rangeSelection.end));
      updateChunkRange(currentTargetChunk.id, nextStart, rangeSelection.end);
    } else {
      const nextEnd = Math.max(rangeSelection.start, Math.min(rangeSelection.end + delta, words.length - 1));
      updateChunkRange(currentTargetChunk.id, rangeSelection.start, nextEnd);
    }
  };

  // Add a new breath chunk
  const handleAddChunk = () => {
    if (words.length === 0) return;
    const lastChunk = chunks[chunks.length - 1];
    let nextStart = 0;
    let nextEnd = words.length - 1;

    if (lastChunk) {
      if (lastChunk.endIndex < words.length - 1) {
        // Intelligently start from end of last chunk (with 1 word overlap if applicable)
        nextStart = Math.max(0, lastChunk.endIndex > 0 ? lastChunk.endIndex : lastChunk.endIndex + 1);
        nextEnd = words.length - 1;
      } else {
        // If last chunk already reached the end, suggest second half
        nextStart = Math.floor(words.length / 2);
        nextEnd = words.length - 1;
      }
    }

    const newChunk = {
      id: `chunk-${Date.now()}`,
      startIndex: nextStart,
      endIndex: nextEnd,
      arabicText: words.slice(nextStart, nextEnd + 1).map((w) => w.text).join(' '),
      customTranslation: '',
    };

    const newChunks = [...chunks, newChunk];
    setChunks(newChunks);
    setActiveChunkIndex(newChunks.length - 1);
  };

  // Duplicate chunk (useful for i'adah repetition)
  const handleDuplicateChunk = (chunk, index) => {
    const duplicated = {
      ...chunk,
      id: `chunk-${Date.now()}`,
    };
    const newChunks = [...chunks];
    newChunks.splice(index + 1, 0, duplicated);
    setChunks(newChunks);
    setActiveChunkIndex(index + 1);
  };

  // Delete chunk
  const handleDeleteChunk = (chunkId, index) => {
    if (chunks.length <= 1) return;
    const newChunks = chunks.filter((c) => c.id !== chunkId);
    setChunks(newChunks);
    if (activeChunkIndex >= newChunks.length) {
      setActiveChunkIndex(newChunks.length - 1);
    } else if (activeChunkIndex === index) {
      setActiveChunkIndex(Math.max(0, index - 1));
    }
  };

  // Update translation for chunk
  const handleUpdateTranslation = (chunkId, text) => {
    setChunks((prev) =>
      prev.map((c) => (c.id === chunkId ? { ...c, customTranslation: text } : c))
    );
  };

  // Update custom latin for chunk
  const handleUpdateLatin = (chunkId, text) => {
    setChunks((prev) =>
      prev.map((c) => (c.id === chunkId ? { ...c, customLatin: text } : c))
    );
  };

  // Check if a chunk is an i'adah (repetition of words from preceding chunk)
  const isChunkIadah = (chunkIndex) => {
    if (chunkIndex <= 0) return false;
    const prevChunk = chunks[chunkIndex - 1];
    const currChunk = chunks[chunkIndex];
    return currChunk && prevChunk && currChunk.startIndex <= prevChunk.endIndex;
  };

  // Download single chunk with dedicated offscreen renderer
  const handleDownloadSingleChunk = async (chunkToDownload, index, format = 'png') => {
    if (!chunkToDownload) return;
    setDownloadingSingle(true);

    try {
      setExportingChunk({
        ...chunkToDownload,
        partIndex: index + 1,
      });

      // Wait a tick for offscreen DOM element to render
      await new Promise((r) => setTimeout(r, 80));

      if (!chunkExportRef.current) {
        throw new Error('Export node not ready');
      }

      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const node = chunkExportRef.current;
      const options = {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor:
          format === 'jpeg'
            ? isTransparent
              ? '#ffffff'
              : bgColor
            : isTransparent
            ? null
            : bgColor,
      };

      const dataUrl =
        format === 'png'
          ? await toPng(node, options)
          : await toJpeg(node, { ...options, quality: 0.95 });

      const surahClean = (surahInfo?.englishName || 'Surah')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase();
      const filename = `Quran_${surahClean}_Verse_${selectedAyah}_part_${index + 1}.${
        format === 'jpeg' ? 'jpg' : 'png'
      }`;
      triggerFileDownload(dataUrl, filename);

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error('Download chunk error:', err);
    } finally {
      setDownloadingSingle(false);
      setExportingChunk(null);
    }
  };

  const handleDownloadActiveChunk = (format = 'png') => {
    handleDownloadSingleChunk(currentTargetChunk, activeChunkIndex, format);
  };

  // Download all chunks as ZIP
  const handleDownloadAllChunksZip = async () => {
    if (chunks.length === 0) return;
    setDownloadingZip(true);
    setZipProgress({ text: 'Memulai ekspor potongan...', percent: 0 });

    const zip = new JSZip();
    const total = chunks.length;
    const surahClean = (surahInfo?.englishName || 'Surah')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();

    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const options = {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: isTransparent ? null : bgColor,
      };

      for (let i = 0; i < total; i++) {
        setZipProgress({
          text: `Memproses Gambar Potongan ${i + 1} dari ${total}...`,
          percent: Math.round(((i + 1) / (total + 1)) * 100),
        });

        setExportingChunk({
          ...chunks[i],
          partIndex: i + 1,
        });

        await new Promise((r) => setTimeout(r, 80));

        if (!chunkExportRef.current) continue;
        const dataUrl = await toPng(chunkExportRef.current, options);
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');

        const paddedIndex = String(i + 1).padStart(2, '0');
        const filename = `Verse_${selectedAyah}_Part_${paddedIndex}_QS_${surahClean}.png`;
        zip.file(filename, base64Data, { base64: true });
      }

      setZipProgress({ text: 'Mengemas ke file ZIP...', percent: 95 });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const filename = `Quran_${surahClean}_Verse_${selectedAyah}_Parts_1_to_${total}.zip`;
      triggerFileDownload(zipBlob, filename);

      setZipProgress({ text: 'Selesai!', percent: 100 });
      try {
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.8 } });
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error('ZIP chunks export error:', err);
    } finally {
      setDownloadingZip(false);
      setZipProgress({ text: '', percent: 0 });
      setExportingChunk(null);
    }
  };

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs transition-all space-y-4">
      {/* Header with Switch Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div
            className={`p-2 rounded-xl transition-colors ${
              isChunkMode ? 'bg-emerald-100/70 text-emerald-800' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-800">
                Pecah Ayat / Potongan Nafas
              </h3>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                Imam Recitation
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Potong ayat jadi beberapa tarikan nafas & tentukan kata awal sampai akhir secara custom
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-xs font-medium text-slate-600">
            {isChunkMode ? 'Aktif' : 'Nonaktif'}
          </span>
          <button
            type="button"
            onClick={() => setIsChunkMode(!isChunkMode)}
            role="switch"
            aria-checked={isChunkMode}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              isChunkMode ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isChunkMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* When Inactive, show brief benefit invitation */}
      {!isChunkMode && (
        <div className="py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-start gap-3 text-xs text-slate-600">
          <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-700">Tips Murottal / Video Quran:</span>{' '}
            Aktifkan fitur ini jika imam tidak membaca 1 ayat dalam 1 tarikan nafas. Anda bisa membagi ayat
            ke dalam potongan nafas terpisah dari kata berapa saja sampai kata berapa saja, lalu ekspor semuanya
            ke file .ZIP!
          </div>
        </div>
      )}

      {/* Active Mode Studio */}
      {isChunkMode && (
        <div className="space-y-5">
          {/* 1. Interactive Word Selector Section */}
          <div className="bg-slate-50/90 border border-slate-200/90 rounded-xl p-3.5 sm:p-4 space-y-3.5">
            {/* Header: which chunk is being edited */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-slate-800">
                  Pengaturan Rentang Kata:{' '}
                  <span className="text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Nafas #{activeChunkIndex + 1}
                  </span>
                </span>
                <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Total {words.length} Kata
                </span>
              </div>

              <span className="text-[11px] text-slate-500">
                Pilih potongan di bawah untuk mengaktifkan preview dan mengatur ulang katanya
              </span>
            </div>

            {/* Direct Start & End Word Dropdowns (Full Custom Choice) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              {/* Mulai dari Kata */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mulai dari Kata (Awal):</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStepRange('start', -1)}
                      disabled={rangeSelection.start <= 0}
                      title="Mundurkan 1 kata"
                      className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 cursor-pointer"
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepRange('start', 1)}
                      disabled={rangeSelection.start >= rangeSelection.end}
                      title="Majukan 1 kata"
                      className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 cursor-pointer"
                    >
                      +1
                    </button>
                  </div>
                </div>

                <select
                  value={rangeSelection.start}
                  onChange={(e) => handleStartWordChange(Number(e.target.value))}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  {words.map((w) => (
                    <option key={`start-opt-${w.index}`} value={w.index}>
                      Kata #{w.index + 1} — {w.text}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sampai Kata */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Flag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sampai Kata (Akhir):</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStepRange('end', -1)}
                      disabled={rangeSelection.end <= rangeSelection.start}
                      title="Mundurkan 1 kata"
                      className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 cursor-pointer"
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStepRange('end', 1)}
                      disabled={rangeSelection.end >= words.length - 1}
                      title="Majukan 1 kata"
                      className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 cursor-pointer"
                    >
                      +1
                    </button>
                  </div>
                </div>

                <select
                  value={rangeSelection.end}
                  onChange={(e) => handleEndWordChange(Number(e.target.value))}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  {words.map((w) => (
                    <option key={`end-opt-${w.index}`} value={w.index}>
                      Kata #{w.index + 1} — {w.text}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Presets Buttons with Dynamic Active State */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <span className="text-[11px] font-semibold text-slate-500">Pilihan Cepat:</span>

              <button
                type="button"
                onClick={() => handleQuickPreset('middleToEnd')}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                  isMiddleToEndActive
                    ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-500 shadow-xs ring-1 ring-emerald-400 font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                ⚡ Tengah s/d Akhir
              </button>

              <button
                type="button"
                onClick={() => handleQuickPreset('startToMiddle')}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                  isStartToMiddleActive
                    ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-500 shadow-xs ring-1 ring-emerald-400 font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                Awal s/d Tengah
              </button>

              <button
                type="button"
                onClick={() => handleQuickPreset('allWords')}
                className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                  isAllWordsActive
                    ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-500 shadow-xs ring-1 ring-emerald-400 font-bold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                Semua Kata (1 s/d {words.length})
              </button>
            </div>

            {/* Word Cloud Mode Indicator & Instructions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-200/80">
              <span className="text-[11px] text-slate-600">
                Atau klik langsung pada kata di bawah:
              </span>

              {/* Mode Tabs for Clicking: Start vs End Word */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white p-1 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectionTarget('start')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectionTarget === 'start'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>1. Pilih Kata Awal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectionTarget('end')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectionTarget === 'end'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>2. Pilih Kata Akhir</span>
                </button>
              </div>
            </div>

            {/* Arabic Word Cloud */}
            <div
              dir="rtl"
              className="flex flex-wrap gap-2 p-3.5 bg-white rounded-xl border border-slate-200/90 max-h-60 overflow-y-auto selection:bg-none"
            >
              {words.map((word) => {
                const isStart = word.index === rangeSelection.start;
                const isEnd = word.index === rangeSelection.end;
                const isSelected =
                  word.index >= rangeSelection.start && word.index <= rangeSelection.end;

                return (
                  <button
                    key={`word-chip-${word.index}`}
                    type="button"
                    onClick={() => handleWordChipClick(word.index)}
                    className={`group relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-base sm:text-lg font-arabic transition-all cursor-pointer border select-none ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs scale-[1.02] ring-1 ring-emerald-500'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    {/* Word text */}
                    <span className="font-scheherazade text-base sm:text-xl leading-none">
                      {word.text}
                    </span>

                    {/* Order & boundary badge */}
                    <div className="flex items-center gap-1">
                      <span
                        className={`text-[10px] font-sans px-1.5 py-0.5 rounded-md font-bold transition-colors ${
                          isSelected
                            ? 'bg-emerald-800 text-emerald-100'
                            : 'bg-slate-200/90 text-slate-600 group-hover:bg-slate-300'
                        }`}
                      >
                        {word.index + 1}
                      </span>

                      {/* Start / End badge tags */}
                      {isStart && isEnd ? (
                        <span className="text-[9px] font-sans bg-amber-400 text-amber-950 font-extrabold px-1.5 py-0.2 rounded">
                          1 Kata
                        </span>
                      ) : isStart ? (
                        <span className="text-[9px] font-sans bg-amber-400 text-amber-950 font-extrabold px-1.5 py-0.2 rounded">
                          Awal
                        </span>
                      ) : isEnd ? (
                        <span className="text-[9px] font-sans bg-blue-300 text-blue-950 font-extrabold px-1.5 py-0.2 rounded">
                          Akhir
                        </span>
                      ) : null}
                    </div>

                    {/* Waqaf alert indicator */}
                    {word.hasWaqaf && (
                      <span
                        title="Tanda waqaf (titik berhenti)"
                        className="w-2 h-2 rounded-full bg-amber-400 absolute -top-1 -right-1 ring-2 ring-white"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Summary info bar */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Rentang Aktif:</span>
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  Kata #{rangeSelection.start + 1} s/d #{rangeSelection.end + 1} (
                  {rangeSelection.end - rangeSelection.start + 1} kata)
                </span>
              </div>

              <span className="text-[11px] text-slate-400">
                Klik berikutnya akan mengubah:{' '}
                <strong className="text-emerald-700">
                  {selectionTarget === 'start' ? 'Kata Awal' : 'Kata Akhir'}
                </strong>
              </span>
            </div>
          </div>

          {/* 2. Daftar Potongan Nafas (Chunk Cards List) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-700" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Daftar Potongan Nafas ({chunks.length})
                </h4>
              </div>

              <button
                type="button"
                onClick={handleAddChunk}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-all cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Potongan Nafas</span>
              </button>
            </div>

            {/* List of Chunks */}
            <div className="space-y-2.5">
              {chunks.map((chunk, idx) => {
                const isActive = idx === activeChunkIndex;
                const isCurrentPreview = isActive && previewTarget === 'chunk';
                const isIadah = isChunkIadah(idx);

                return (
                  <div
                    key={chunk.id}
                    onClick={() => {
                      setActiveChunkIndex(idx);
                      if (setPreviewTarget) setPreviewTarget('chunk');
                    }}
                    className={`rounded-xl border p-3.5 transition-all cursor-pointer ${
                      isCurrentPreview
                        ? 'bg-emerald-50/50 border-emerald-400 shadow-xs ring-1 ring-emerald-300/50'
                        : 'bg-white hover:bg-slate-50 hover:border-slate-300 border-slate-200'
                    }`}
                  >
                    {/* Chunk Top Bar */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            isCurrentPreview
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          Nafas #{idx + 1}
                        </span>

                        <span className="text-[11px] font-medium text-slate-500">
                          Kata {chunk.startIndex + 1} – {chunk.endIndex + 1} (
                          {chunk.endIndex - chunk.startIndex + 1} kata)
                        </span>

                        {/* I'adah badge if this breath repeats previous words */}
                        {isIadah && (
                          <span
                            title="Tarikan nafas ini mengulang kata dari potongan sebelumnya"
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60"
                          >
                            <Repeat className="w-3 h-3" />
                            I'adah (Ulang)
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveChunkIndex(idx);
                            if (setPreviewTarget) setPreviewTarget('chunk');
                          }}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                            isCurrentPreview
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isCurrentPreview ? 'Preview Aktif' : 'Tampilkan di Preview'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadSingleChunk(chunk, idx);
                          }}
                          title="Download gambar potongan ini"
                          disabled={downloadingSingle || downloadingZip}
                          className="p-1.5 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateChunk(chunk, idx);
                          }}
                          title="Duplikat potongan untuk mengulang (i'adah)"
                          className="p-1.5 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {chunks.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChunk(chunk.id, idx);
                            }}
                            title="Hapus potongan ini"
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Arabic snippet with Ayah Marker ornament ONLY IF at end of ayat */}
                    <div
                      dir="rtl"
                      className="font-scheherazade text-lg sm:text-xl text-slate-800 leading-relaxed py-2 px-3 bg-slate-50/70 rounded-lg border border-slate-100 text-right select-none flex items-center justify-between gap-3"
                    >
                      <span className="flex-1">{chunk.arabicText || '...'}</span>
                      {showAyahNumber && selectedAyah && chunk.endIndex === words.length - 1 && (
                        <AyahMarker
                          number={selectedAyah}
                          size={28}
                          color="#0f172a"
                        />
                      )}
                    </div>

                    {/* Latin Transliteration Preview in Chunk Card if Transliteration is ON */}
                    {showTransliteration && (
                      <div className="mt-2.5 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                          Teks Latin (Transliterasi) Potongan:
                        </span>
                        {chunk.customLatin && chunk.customLatin.trim() !== '' ? (
                          <p
                            style={{ fontFamily: "'Outfit', sans-serif" }}
                            className="text-amber-800/90 italic leading-relaxed font-normal text-[11px]"
                          >
                            {chunk.customLatin}
                          </p>
                        ) : (
                          <p className="text-slate-400 italic text-[11px]">
                            (Belum ada teks latin potongan — isi pada kolom di bawah)
                          </p>
                        )}
                      </div>
                    )}

                    {/* Latin Input per chunk */}
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <label className="font-medium flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-400" />
                          Kustom Teks Latin Potongan (Opsional)
                        </label>
                        {chunk.customLatin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateLatin(chunk.id, '');
                            }}
                            className="text-rose-600 hover:underline cursor-pointer"
                          >
                            Kosongkan
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={chunk.customLatin || ''}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveChunkIndex(idx);
                          if (setPreviewTarget) setPreviewTarget('chunk');
                        }}
                        onChange={(e) => handleUpdateLatin(chunk.id, e.target.value)}
                        placeholder="Ketik teks latin khusus untuk potongan ini..."
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-inter cursor-text"
                      />
                    </div>

                    {/* Translation Preview in Chunk Card if Translation is ON */}
                    {showTranslation && (
                      <div className="mt-2.5 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                        <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                          Terjemahan Potongan:
                        </span>
                        {chunk.customTranslation && chunk.customTranslation.trim() !== '' ? (
                          <p
                            style={{
                              fontFamily: getTranslationFontName(),
                              textTransform: translationAllCaps ? 'uppercase' : 'none',
                              letterSpacing: translationAllCaps ? '0.04em' : 'normal',
                            }}
                            className="text-slate-700 leading-relaxed font-normal"
                          >
                            {showTranslationAyahNumber && selectedAyah && idx === 0 && !/^\s*[\(\[]\s*\d+\s*[\)\]]/.test(chunk.customTranslation) && (
                              <span className="font-semibold mr-1.5 opacity-90">
                                ( {selectedAyah} )
                              </span>
                            )}
                            {chunk.customTranslation}
                          </p>
                        ) : (
                          <p
                            style={{ fontFamily: getTranslationFontName() }}
                            className="text-slate-400 italic text-[11px]"
                          >
                            (Belum ada terjemahan khusus potongan — isi pada kolom di bawah)
                          </p>
                        )}
                      </div>
                    )}

                    {/* Translation Input per chunk */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <label className="font-medium flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-400" />
                          Kustom Terjemahan Potongan (Opsional)
                        </label>
                        {chunk.customTranslation && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateTranslation(chunk.id, '');
                            }}
                            className="text-rose-600 hover:underline cursor-pointer"
                          >
                            Kosongkan
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={chunk.customTranslation || ''}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveChunkIndex(idx);
                          if (setPreviewTarget) setPreviewTarget('chunk');
                        }}
                        onChange={(e) => handleUpdateTranslation(chunk.id, e.target.value)}
                        placeholder="Ketik terjemahan khusus untuk potongan nafas ini..."
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-inter cursor-text"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Export & Download Controls for Chunks */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                Ekspor Gambar Potongan
              </span>
              <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                Ultra HD (3x)
              </span>
            </div>

            {/* Progress indicator during ZIP download */}
            {downloadingZip && (
              <div className="bg-white border border-emerald-200 rounded-lg p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-700 font-medium">
                  <span>{zipProgress.text}</span>
                  <span>{zipProgress.percent}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all duration-200"
                    style={{ width: `${zipProgress.percent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Buttons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDownloadActiveChunk('png')}
                disabled={downloadingSingle || downloadingZip}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Download Nafas #{activeChunkIndex + 1} (PNG)</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadAllChunksZip}
                disabled={downloadingZip || downloadingSingle || chunks.length === 0}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Download Semua Potongan (.ZIP)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offscreen Dedicated Node for Chunk Rendering & Export */}
      <div
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '1000px',
          pointerEvents: 'none',
          zIndex: -999,
          opacity: 1,
        }}
      >
        {exportingChunk && (
          <div
            ref={chunkExportRef}
            style={{
              ...getAspectRatioStyle(aspectRatio),
              backgroundColor: isTransparent ? 'transparent' : bgColor,
              color: textColor,
            }}
            className={`relative w-full flex flex-col items-center justify-between ${
              aspectRatio === 'auto' ? 'py-8 px-8 sm:px-10' : 'p-10 sm:p-12'
            } rounded-xl select-none`}
          >
            {/* Subtle Corner Accents */}
            {!isTransparent && aspectRatio !== 'auto' && (
              <>
                <div className="absolute top-4 left-4 text-xs opacity-20 pointer-events-none" style={{ color: textColor }}>❖</div>
                <div className="absolute top-4 right-4 text-xs opacity-20 pointer-events-none" style={{ color: textColor }}>❖</div>
                <div className="absolute bottom-4 left-4 text-xs opacity-20 pointer-events-none" style={{ color: textColor }}>❖</div>
                <div className="absolute bottom-4 right-4 text-xs opacity-20 pointer-events-none" style={{ color: textColor }}>❖</div>
              </>
            )}

            {/* Top Header / Bismillah */}
            {showBismillah && (
              <div className="w-full flex flex-col items-center text-center pt-1 mb-2">
                <div
                  className="font-amiri text-xl opacity-90 select-none inline-block"
                  style={{
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

            {/* Center Arabic Text with Stable Anchor */}
            <div className="w-full my-auto py-2 grid grid-rows-[1fr_auto_1fr] items-center">
              {/* Row 1: Top spacing balance */}
              <div className="w-full min-h-[10px]"></div>

              {/* Row 2: Arabic Text (Anchored Center) */}
              <div className="w-full flex items-center justify-center py-1">
                <p
                  dir="rtl"
                  style={{
                    fontFamily: getFontFamilyName(fontFamily),
                    fontSize: `${arabicFontSize}px`,
                    lineHeight: arabicLineHeight,
                    textAlign: textAlign,
                    filter: textColor?.toLowerCase() === '#fdf6e6'
                      ? 'drop-shadow(0 0 2.5px rgba(255, 240, 195, 0.35)) drop-shadow(0 0 6px rgba(230, 165, 55, 0.12))'
                      : undefined,
                  }}
                  className="w-full tracking-wide select-none"
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
                    {exportingChunk.arabicText}
                  </span>
                  {showAyahNumber && selectedAyah && exportingChunk.endIndex === words.length - 1 && (
                    <AyahMarker
                      number={selectedAyah}
                      size={Math.max(28, Math.round(arabicFontSize * 1.15))}
                      color={textColor}
                    />
                  )}
                </p>
              </div>

              {/* Row 3: Transliteration & Translation in Chunk Export (Top-aligned, flows downward) */}
              <div className="w-full flex flex-col items-center justify-start self-start">
                {/* Latin Transliteration in Chunk Export */}
                {showTransliteration && (exportingChunk.customLatin || '').trim() !== '' && (
                  <div className="w-full max-w-4xl text-center select-none mt-2 mb-1 px-4">
                    <p
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: `${latinFontSize}px`,
                        color: translationTextColor || textColor,
                        opacity: 0.85,
                        letterSpacing: '0.02em',
                        fontStyle: 'italic',
                        lineHeight: 1.4,
                        textAlign: textAlign,
                      }}
                    >
                      {exportingChunk.customLatin}
                    </p>
                  </div>
                )}

                {/* Translation in Chunk Export */}
                {showTranslation && (exportingChunk.customTranslation || '').trim() !== '' && (() => {
                  const effectiveColor = translationTextColor || textColor;
                  const isGradient = typeof effectiveColor === 'string' && effectiveColor.includes('gradient');
                  return (
                    <div className="w-full flex flex-col items-center mt-4 pt-2">
                      <div
                        className="w-16 h-px mb-4 opacity-30"
                        style={{ background: effectiveColor }}
                      ></div>
                      <p
                        style={{
                          fontFamily: getTranslationFontName(),
                          fontSize: `${translationFontSize}px`,
                          textAlign: textAlign,
                          textTransform: translationAllCaps ? 'uppercase' : 'none',
                          letterSpacing: translationAllCaps ? '0.04em' : 'normal',
                          ...(isGradient
                            ? {
                                backgroundImage: effectiveColor,
                                WebkitBackgroundImage: effectiveColor,
                                WebkitBackgroundClip: 'text',
                                backgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                color: '#e4d5ab',
                              }
                            : {
                                color: effectiveColor,
                              }),
                        }}
                        className="max-w-5xl w-full font-normal leading-relaxed opacity-90 select-none px-4"
                      >
                      {showTranslationAyahNumber && selectedAyah && (exportingChunk.partIndex === 1 || exportingChunk.startIndex === 0) && !/^\s*[\(\[]\s*\d+\s*[\)\]]/.test(exportingChunk.customTranslation) && (
                        <span className="font-semibold mr-2 opacity-95">
                          ( {selectedAyah} )
                        </span>
                      )}
                      {exportingChunk.customTranslation}
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
                  className="px-3.5 py-1 rounded-full text-xs font-medium tracking-wide flex items-center gap-2 select-none"
                  style={{
                    color: textColor,
                    border: `1px solid ${textColor}30`,
                    backgroundColor: isTransparent ? 'transparent' : `${textColor}0d`,
                  }}
                >
                  <span>
                    QS. {surahInfo?.englishName || 'Surah'} [{surahInfo?.number || 1}]: {selectedAyah}
                    <span className="opacity-90 font-medium">
                      {' '}• Bagian {exportingChunk.partIndex}/{chunks.length}
                    </span>
                  </span>
                  <span className="opacity-40">•</span>
                  <span className="font-amiri text-sm" dir="rtl">
                    {surahInfo?.name}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
