import React, { useState } from 'react';
import { Download, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { toPng, toJpeg, toBlob } from 'html-to-image';
import confetti from 'canvas-confetti';
import JSZip from 'jszip';
import { triggerFileDownload } from '../utils/downloadHelper';

export default function ExportToolbar({
  previewRef,
  surahInfo,
  selectedAyah,
  isTransparent,
  bgColor,
  // Range / Multiple Images props
  mode,
  startAyah,
  endAyah,
  totalSlides,
  rangeAyahsList,
  setCurrentSlideIndex,
  // Chunk mode props
  isChunkMode = false,
  activeChunkIndex = 0,
  totalChunks = 1,
}) {
  const [format, setFormat] = useState('png'); // 'png' | 'jpeg'
  const scale = 3; // Locked to 3x Ultra HD (~2000px+) for 1080p and 4K YouTube video clarity
  const [downloading, setDownloading] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.8 },
      });
    } catch (e) {
      // ignore
    }
  };

  const getSurahClean = () => {
    return (surahInfo?.englishName || 'Surah')
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();
  };

  // Download Single Verse
  const handleSingleDownload = async () => {
    if (!previewRef.current) return;
    setDownloading(true);
    setErrorMessage('');
    setProgressText('Generating image...');

    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const node = previewRef.current;
      const options = {
        pixelRatio: scale,
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

      let dataUrl = '';
      if (format === 'png') {
        dataUrl = await toPng(node, options);
      } else {
        dataUrl = await toJpeg(node, { ...options, quality: 0.95 });
      }

      const chunkSuffix = isChunkMode ? `_Part_${activeChunkIndex + 1}` : '';
      const filename = `Quran_${getSurahClean()}_Verse_${selectedAyah}${chunkSuffix}.${format === 'jpeg' ? 'jpg' : 'png'}`;
      triggerFileDownload(dataUrl, filename);

      triggerConfetti();
    } catch (err) {
      console.error('Export error:', err);
      setErrorMessage(
        'Failed to export image. Please ensure your browser allows downloads and try again.'
      );
    } finally {
      setDownloading(false);
      setProgressText('');
    }
  };

  // Copy Single Verse to Clipboard
  const handleCopyToClipboard = async () => {
    if (!previewRef.current) return;
    setDownloading(true);
    setErrorMessage('');

    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const node = previewRef.current;
      const blob = await toBlob(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: isTransparent ? null : bgColor,
      });

      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        triggerConfetti();
      } else {
        throw new Error('Clipboard API is not supported on this browser.');
      }
    } catch (err) {
      console.error('Clipboard copy error:', err);
      setErrorMessage('Browser does not support direct image copying. Please use the Download button.');
    } finally {
      setDownloading(false);
    }
  };

  // Download Multiple Images (ZIP)
  const handleMultipleDownloadZip = async () => {
    if (!previewRef.current || !rangeAyahsList || rangeAyahsList.length === 0) return;
    setDownloading(true);
    setErrorMessage('');
    setProgressPercent(0);

    const zip = new JSZip();
    const total = rangeAyahsList.length;
    const surahClean = getSurahClean();

    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const node = previewRef.current;
      const options = {
        pixelRatio: scale,
        cacheBust: true,
        backgroundColor: isTransparent ? null : bgColor,
      };

      for (let i = 0; i < total; i++) {
        const ayahNumber = rangeAyahsList[i]?.numberInSurah || startAyah + i;
        setProgressText(`Rendering image ${i + 1} of ${total} (Verse ${ayahNumber})...`);
        setProgressPercent(Math.round(((i + 1) / (total + 1)) * 100));

        setCurrentSlideIndex(i);
        await new Promise((r) => setTimeout(r, 70));

        const dataUrl = await toPng(node, options);
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');

        const paddedIndex = String(i + 1).padStart(2, '0');
        const filename = `Verse_${paddedIndex}_QS_${surahClean}_${ayahNumber}.png`;
        zip.file(filename, base64Data, { base64: true });
      }

      setProgressText('Compressing into ZIP archive...');
      setProgressPercent(95);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const filename = `Quran_${surahClean}_Verses_${startAyah}-${endAyah}.zip`;
      triggerFileDownload(zipBlob, filename);

      setProgressPercent(100);
      triggerConfetti();
    } catch (err) {
      console.error('Bulk export ZIP error:', err);
      setErrorMessage('An error occurred while rendering the images. Please try again.');
    } finally {
      setDownloading(false);
      setProgressText('');
      setProgressPercent(0);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">
          {mode === 'single' ? 'Export & Download' : 'Download Multiple Images (.ZIP)'}
        </h3>

        {isTransparent && format === 'jpeg' && mode === 'single' && (
          <span className="text-[11px] text-amber-600 flex items-center gap-1 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            JPG does not support transparency
          </span>
        )}
      </div>

      {/* Format & Quality */}
      {mode === 'single' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              File Format
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setFormat('png')}
                className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  format === 'png'
                    ? 'bg-white text-emerald-950 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                PNG {isTransparent && '(Transparent)'}
              </button>
              <button
                type="button"
                onClick={() => setFormat('jpeg')}
                className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  format === 'jpeg'
                    ? 'bg-white text-emerald-950 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                JPG / JPEG
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Output Quality
            </label>
            <div className="bg-slate-50 border border-slate-200 py-2 px-3 rounded-xl text-xs text-slate-700 flex items-center justify-between">
              <span className="font-semibold text-emerald-800">Ultra HD (3x)</span>
              <span className="text-[11px] text-slate-500 font-medium">Ready for 1080p & 4K</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs text-slate-700 flex items-center justify-between">
          <span>High-resolution <strong>PNG</strong> images in .ZIP</span>
          <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 text-[11px]">
            Ultra HD (3x) • YouTube Ready
          </span>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Progress Bar */}
      {downloading && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200/90 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              {progressText || 'Processing images...'}
            </span>
            {progressPercent > 0 && <span>{progressPercent}%</span>}
          </div>
          {progressPercent > 0 && (
            <div className="w-full bg-emerald-200/60 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {mode === 'single' ? (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          <button
            type="button"
            onClick={handleSingleDownload}
            disabled={downloading}
            className="sm:col-span-8 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-60"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>
              {downloading ? 'Processing Image...' : `Download Image (${format.toUpperCase()})`}
            </span>
          </button>

          <button
            type="button"
            onClick={handleCopyToClipboard}
            disabled={downloading}
            className="sm:col-span-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-700 font-semibold text-xs border border-slate-200 transition-all cursor-pointer disabled:opacity-60"
            title="Copy image directly to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Image</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="pt-1">
          <button
            type="button"
            onClick={handleMultipleDownloadZip}
            disabled={downloading}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-60"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>
              {downloading
                ? 'Preparing Multiple Images...'
                : `Download Multiple Images: ${totalSlides} Images (.ZIP)`}
            </span>
          </button>
          <p className="text-[11px] text-slate-500 text-center mt-2">
            Exports a <strong>.ZIP</strong> archive containing {totalSlides} individual high-resolution PNG images.
          </p>
        </div>
      )}
    </div>
  );
}
