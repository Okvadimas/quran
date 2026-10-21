import React, { useState, useEffect, useMemo } from 'react';
import {
  Scissors,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  Archive,
  Eye,
  Repeat,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Info,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { toPng, toJpeg, toBlob } from 'html-to-image';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';

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
  isChunkMode,
  setIsChunkMode,
  chunks,
  setChunks,
  activeChunkIndex,
  setActiveChunkIndex,
  fontFamily = 'font-scheherazade',
}) {
  const [editingChunkId, setEditingChunkId] = useState(null);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState({ text: '', percent: 0 });
  const [copiedId, setCopiedId] = useState(null);
  const [downloadingSingle, setDownloadingSingle] = useState(false);

  // Parse words from current verse
  const words = useMemo(() => {
    return parseArabicWords(currentVerseData?.arabicText || '');
  }, [currentVerseData?.arabicText]);

  // Temporary selection state when editing or creating a chunk
  const [rangeSelection, setRangeSelection] = useState({ start: 0, end: 0 });

  // Initialize or reset chunks when verse changes or when chunk mode turned on
  useEffect(() => {
    if (words.length > 0) {
      if (chunks.length === 0) {
        // Default to dividing into 2 logical chunks if verse is long, or 1 chunk
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
            startIndex: Math.max(0, mid - 1), // Notice small i'adah repetition by default!
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
    }
  }, [selectedAyah, surahInfo?.number, words.length]);

  // Sync editing range with active or edited chunk
  useEffect(() => {
    const targetChunk = chunks.find((c) => c.id === editingChunkId) || chunks[activeChunkIndex] || chunks[0];
    if (targetChunk && words.length > 0) {
      setRangeSelection({
        start: Math.min(targetChunk.startIndex, words.length - 1),
        end: Math.min(targetChunk.endIndex, words.length - 1),
      });
    }
  }, [editingChunkId, activeChunkIndex, chunks, words.length]);

  // Handle word chip click
  const handleWordClick = (clickedIdx) => {
    setRangeSelection((prev) => {
      // If start is after clickedIdx, move start
      if (clickedIdx < prev.start) {
        return { start: clickedIdx, end: prev.end };
      }
      // If clicking after start, update end
      if (clickedIdx > prev.start) {
        return { start: prev.start, end: clickedIdx };
      }
      // Clicking on start word toggles or keeps
      return { start: clickedIdx, end: clickedIdx };
    });
  };

  // Apply range selection to the currently active or edited chunk
  const applyRangeToChunk = (chunkId) => {
    const start = Math.min(rangeSelection.start, rangeSelection.end);
    const end = Math.max(rangeSelection.start, rangeSelection.end);
    const slicedText = words.slice(start, end + 1).map((w) => w.text).join(' ');

    setChunks((prev) =>
      prev.map((c) => {
        if (c.id === chunkId) {
          return {
            ...c,
            startIndex: start,
            endIndex: end,
            arabicText: slicedText,
          };
        }
        return c;
      })
    );
    setEditingChunkId(null);
  };

  // Add a new breath chunk
  const handleAddChunk = () => {
    if (words.length === 0) return;
    const lastChunk = chunks[chunks.length - 1];
    let nextStart = 0;
    let nextEnd = words.length - 1;

    if (lastChunk) {
      // Intelligently suggest starting from the end of last chunk (with 1 word overlap for i'adah)
      nextStart = Math.max(0, Math.min(words.length - 1, lastChunk.endIndex - 1));
      nextEnd = Math.min(words.length - 1, nextStart + 8);
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
    setEditingChunkId(newChunk.id);
  };

  // Duplicate chunk (useful for i'adah)
  const handleDuplicateChunk = (chunk, index) => {
    const duplicated = {
      ...chunk,
      id: `chunk-${Date.now()}`,
    };
    const newChunks = [...chunks];
    newChunks.splice(index + 1, 0, duplicated);
    setChunks(newChunks);
    setActiveChunkIndex(index + 1);
    setEditingChunkId(duplicated.id);
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
    if (editingChunkId === chunkId) {
      setEditingChunkId(null);
    }
  };

  // Update translation for chunk
  const handleUpdateTranslation = (chunkId, text) => {
    setChunks((prev) =>
      prev.map((c) => (c.id === chunkId ? { ...c, customTranslation: text } : c))
    );
  };

  // Check if a chunk is an i'adah (repetition of words from the preceding chunk)
  const isChunkIadah = (chunkIndex) => {
    if (chunkIndex <= 0) return false;
    const prevChunk = chunks[chunkIndex - 1];
    const currChunk = chunks[chunkIndex];
    return currChunk.startIndex <= prevChunk.endIndex;
  };

  // Download single active chunk
  const handleDownloadActiveChunk = async (format = 'png') => {
    if (!previewRef.current) return;
    setDownloadingSingle(true);

    try {
      const node = previewRef.current;
      const options = {
        pixelRatio: 3,
        cacheBust: true,
        skipFonts: true,
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
      const link = document.createElement('a');
      link.download = `Quran_${surahClean}_Verse_${selectedAyah}_part_${activeChunkIndex + 1}.${format === 'jpeg' ? 'jpg' : 'png'}`;
      link.href = dataUrl;
      link.click();

      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error('Download chunk error:', err);
    } finally {
      setDownloadingSingle(false);
    }
  };

  // Download all chunks as ZIP
  const handleDownloadAllChunksZip = async () => {
    if (!previewRef.current || chunks.length === 0) return;
    setDownloadingZip(true);
    setZipProgress({ text: 'Memulai ekspor potongan...', percent: 0 });

    const zip = new JSZip();
    const total = chunks.length;
    const surahClean = (surahInfo?.englishName || 'Surah')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();

    try {
      const node = previewRef.current;
      const options = {
        pixelRatio: 3,
        cacheBust: true,
        skipFonts: true,
        backgroundColor: isTransparent ? null : bgColor,
      };

      const originalActiveIndex = activeChunkIndex;

      for (let i = 0; i < total; i++) {
        setZipProgress({
          text: `Memproses Gambar Potongan ${i + 1} dari ${total}...`,
          percent: Math.round(((i + 1) / (total + 1)) * 100),
        });

        setActiveChunkIndex(i);
        await new Promise((r) => setTimeout(r, 80));

        const dataUrl = await toPng(node, options);
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');

        const paddedIndex = String(i + 1).padStart(2, '0');
        const filename = `Verse_${selectedAyah}_Part_${paddedIndex}_QS_${surahClean}.png`;
        zip.file(filename, base64Data, { base64: true });
      }

      setZipProgress({ text: 'Mengemas ke file ZIP...', percent: 95 });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Quran_${surahClean}_Verse_${selectedAyah}_Parts_1_to_${total}.zip`;
      link.click();
      URL.revokeObjectURL(downloadUrl);

      // Restore active index
      setActiveChunkIndex(originalActiveIndex);

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
    }
  };

  const activeChunk = chunks[activeChunkIndex] || chunks[0];
  const isEditing = editingChunkId !== null;
  const currentEditingChunk = chunks.find((c) => c.id === editingChunkId);

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs transition-all space-y-4">
      {/* Header with Switch Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl transition-colors ${isChunkMode ? 'bg-emerald-100/70 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
            <Scissors className="w-4 h-4" />
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
              Potong ayat jadi beberapa tarikan nafas & dukung pengulangan kata (i'adah)
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
            <span className="font-semibold text-slate-700">Tips Murottal / Video Quran:</span> Aktifkan fitur ini jika imam tidak membaca 1 ayat dalam 1 tarikan nafas. Anda bisa membagi ayat ke dalam potongan-potongan nafas terpisah dan mengekspor semuanya sekaligus ke file .ZIP!
          </div>
        </div>
      )}

      {/* Active Mode Studio */}
      {isChunkMode && (
        <div className="space-y-5">
          {/* 1. Interactive Word Selector Section */}
          <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  {isEditing ? (
                    <span>
                      Ubah Rentang:{' '}
                      <strong className="text-emerald-700">
                        Potongan #{chunks.findIndex((c) => c.id === editingChunkId) + 1}
                      </strong>
                    </span>
                  ) : (
                    <span>Seleksi Kata Potongan Aktif (#{activeChunkIndex + 1})</span>
                  )}
                </span>
                <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                  Total {words.length} Kata
                </span>
              </div>

              {isEditing && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingChunkId(null)}
                    className="text-xs text-slate-600 hover:text-slate-800 font-medium px-2.5 py-1 rounded-lg border border-slate-200 bg-white cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => applyRangeToChunk(editingChunkId)}
                    className="text-xs text-white font-semibold px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Simpan Perubahan
                  </button>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Klik kata awal lalu kata akhir untuk menentukan potongan nafas imam. Anda leluasa mengulang kata yang sama (i'adah) pada potongan berikutnya.
            </p>

            {/* Arabic Word Cloud / Badges */}
            <div
              dir="rtl"
              className="flex flex-wrap gap-1.5 p-3 bg-white rounded-xl border border-slate-200/90 max-h-56 overflow-y-auto selection:bg-none"
            >
              {words.map((word) => {
                const isSelected =
                  word.index >= Math.min(rangeSelection.start, rangeSelection.end) &&
                  word.index <= Math.max(rangeSelection.start, rangeSelection.end);
                const isStart = word.index === Math.min(rangeSelection.start, rangeSelection.end);
                const isEnd = word.index === Math.max(rangeSelection.start, rangeSelection.end);

                return (
                  <button
                    key={`word-${word.index}`}
                    type="button"
                    onClick={() => {
                      handleWordClick(word.index);
                      if (!isEditing && activeChunk) {
                        // Apply immediately if not in explicit edit mode
                        const targetStart = word.index < rangeSelection.start ? word.index : rangeSelection.start;
                        const targetEnd = word.index >= rangeSelection.start ? word.index : rangeSelection.end;
                        const sliced = words.slice(targetStart, targetEnd + 1).map((w) => w.text).join(' ');
                        setChunks((prev) =>
                          prev.map((c, idx) =>
                            idx === activeChunkIndex
                              ? { ...c, startIndex: targetStart, endIndex: targetEnd, arabicText: sliced }
                              : c
                          )
                        );
                      }
                    }}
                    className={`group relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm sm:text-base font-arabic transition-all cursor-pointer border select-none ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs scale-[1.02]'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    {/* Word text */}
                    <span className="font-scheherazade text-base sm:text-lg leading-none">
                      {word.text}
                    </span>

                    {/* Word order badge */}
                    <span
                      className={`text-[9px] font-sans px-1 py-0.2 rounded font-semibold transition-colors ${
                        isSelected
                          ? 'bg-emerald-800 text-emerald-100'
                          : 'bg-slate-200/80 text-slate-500 group-hover:bg-slate-300'
                      }`}
                    >
                      {word.index + 1}
                    </span>

                    {/* Waqaf mark alert dot */}
                    {word.hasWaqaf && (
                      <span
                        title="Tanda waqaf (titik berhenti)"
                        className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute -top-1 -right-1 ring-2 ring-white"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Adjustment Controls for Word Range */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Rentang:</span>
                <span className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
                  Kata {Math.min(rangeSelection.start, rangeSelection.end) + 1} s/d{' '}
                  {Math.max(rangeSelection.start, rangeSelection.end) + 1} (
                  {Math.abs(rangeSelection.end - rangeSelection.start) + 1} kata)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const full = { start: 0, end: words.length - 1 };
                    setRangeSelection(full);
                    if (activeChunk) {
                      const sliced = words.map((w) => w.text).join(' ');
                      setChunks((prev) =>
                        prev.map((c, idx) =>
                          idx === activeChunkIndex
                            ? { ...c, startIndex: 0, endIndex: words.length - 1, arabicText: sliced }
                            : c
                        )
                      );
                    }
                  }}
                  className="px-2 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  Pilih Semua Kata
                </button>
              </div>
            </div>
          </div>

          {/* 2. Daftar Potongan Nafas (Chunk Cards) */}
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
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-200/80 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Potongan Nafas</span>
              </button>
            </div>

            {/* List of Chunks */}
            <div className="space-y-2.5">
              {chunks.map((chunk, idx) => {
                const isActive = idx === activeChunkIndex;
                const isIadah = isChunkIadah(idx);

                return (
                  <div
                    key={chunk.id}
                    className={`rounded-xl border p-3.5 transition-all ${
                      isActive
                        ? 'bg-emerald-50/40 border-emerald-400/80 shadow-xs ring-1 ring-emerald-300/40'
                        : 'bg-white hover:bg-slate-50/80 border-slate-200'
                    }`}
                  >
                    {/* Chunk Top Bar */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                            isActive
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
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveChunkIndex(idx);
                            setRangeSelection({
                              start: chunk.startIndex,
                              end: chunk.endIndex,
                            });
                          }}
                          className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                            isActive
                              ? 'bg-emerald-700 text-white font-semibold'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <Eye className="w-3 h-3" />
                          <span>{isActive ? 'Preview Aktif' : 'Lihat'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingChunkId(chunk.id);
                            setActiveChunkIndex(idx);
                            setRangeSelection({
                              start: chunk.startIndex,
                              end: chunk.endIndex,
                            });
                          }}
                          title="Ubah rentang kata"
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Scissors className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicateChunk(chunk, idx)}
                          title="Duplikat potongan untuk mengulang (i'adah)"
                          className="p-1 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {chunks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteChunk(chunk.id, idx)}
                            title="Hapus potongan ini"
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Arabic snippet */}
                    <div
                      dir="rtl"
                      className="font-scheherazade text-lg sm:text-xl text-slate-800 leading-relaxed py-1 px-2 bg-slate-50/70 rounded-lg border border-slate-100 text-right select-none"
                    >
                      {chunk.arabicText || '...'}
                    </div>

                    {/* Translation Input (Optional per chunk) */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <label className="font-medium flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-400" />
                          Terjemahan Potongan (Opsional)
                        </label>
                        {chunk.customTranslation && (
                          <button
                            type="button"
                            onClick={() => handleUpdateTranslation(chunk.id, '')}
                            className="text-rose-600 hover:underline cursor-pointer"
                          >
                            Kosongkan
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        value={chunk.customTranslation || ''}
                        onChange={(e) => handleUpdateTranslation(chunk.id, e.target.value)}
                        placeholder="Contoh: Dan Kami tidak mengutus rasul-rasul sebelummu... (bisa dikosongkan)"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
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
    </div>
  );
}
