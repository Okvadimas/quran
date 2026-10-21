import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check, AlignRight, AlignCenter } from 'lucide-react';

const FONT_OPTIONS = [
  { id: 'font-scheherazade', name: 'Scheherazade New', fontClass: 'font-scheherazade' },
  { id: 'font-amiri', name: 'Amiri', fontClass: 'font-amiri' },
  { id: 'font-amiri-quran', name: 'Amiri Quran', fontClass: 'font-amiri-quran' },
];

const LIGHT_BG_PALETTES = [
  { name: 'Pure White', color: '#ffffff', border: '#e2e8f0' },
  { name: 'Warm Cream', color: '#fefce8', border: '#fef08a' },
  { name: 'Soft Parchment', color: '#fdfbf7', border: '#e7e5e4' },
  { name: 'Light Slate', color: '#f8fafc', border: '#cbd5e1' },
  { name: 'Soft Sage', color: '#f0fdf4', border: '#bbf7d0' },
  { name: 'Dark Emerald', color: '#064e3b', border: '#064e3b' },
  { name: 'Midnight', color: '#09090b', border: '#09090b' },
  { name: 'Navy Blue', color: '#0f172a', border: '#0f172a' },
];

const TEXT_PALETTES = [
  { name: 'Dark Slate (Default)', color: '#0f172a' },
  { name: 'Deep Bronze', color: '#451a03' },
  { name: 'Forest Emerald', color: '#064e3b' },
  { name: 'Gold / Amber', color: '#b45309' },
  { name: 'Pure White', color: '#ffffff' },
  { name: 'Soft Slate', color: '#334155' },
];

const ASPECT_RATIOS = [
  { id: 'auto', label: 'Auto Fit', desc: 'Fit to content' },
  { id: '1:1', label: '1:1', desc: 'Square' },
  { id: '16:9', label: '16:9', desc: 'Landscape' },
  { id: '9:16', label: '9:16', desc: 'Vertical / Story' },
  { id: '4:5', label: '4:5', desc: 'Portrait' },
];

export default function StyleControls({
  fontFamily,
  setFontFamily,
  arabicFontSize,
  setArabicFontSize,
  arabicLineHeight,
  setArabicLineHeight,
  isTransparent,
  setIsTransparent,
  bgColor,
  setBgColor,
  textColor,
  setTextColor,
  showTranslation,
  setShowTranslation,
  translationLang,
  setTranslationLang,
  translationFontSize,
  setTranslationFontSize,
  aspectRatio,
  setAspectRatio,
  showReference,
  setShowReference,
  showBismillah,
  setShowBismillah,
  textAlign,
  setTextAlign,
}) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* 1. Quick Presets Aspect Ratio */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">
            Aspect Ratio
          </h3>
          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
            {aspectRatio === 'auto' ? 'Auto Fit' : aspectRatio}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {ASPECT_RATIOS.map((ratio) => {
            const isSelected = aspectRatio === ratio.id;
            return (
              <button
                key={ratio.id}
                type="button"
                onClick={() => setAspectRatio(ratio.id)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-semibold ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="text-xs font-bold">{ratio.label}</span>
                <span className="text-[10px] opacity-75 mt-0.5 leading-tight">{ratio.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Advanced Design Settings Accordion */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden transition-all">
        <button
          type="button"
          onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Advanced Design Settings
            </h3>
            <p className="text-xs text-slate-500">
              Fonts, text sizes, color palette, translation, and ornaments
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <span>{isAdvancedOpen ? 'Hide Settings' : 'Show Settings'}</span>
            {isAdvancedOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-600" />
            )}
          </div>
        </button>

        {isAdvancedOpen && (
          <div className="p-4 sm:p-5 border-t border-slate-200/80 space-y-6 bg-white animate-in fade-in duration-200">
            {/* Arabic Font */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-2.5">
                Arabic Font Style
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {FONT_OPTIONS.map((f) => {
                  const isSelected = fontFamily === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFontFamily(f.id)}
                      className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                          : 'border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xs block font-sans mb-1">{f.name}</span>
                      <span className={`${f.fontClass} text-lg block leading-relaxed`} dir="rtl">
                        القرآن
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sizes & Spacing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                  <span>Arabic Font Size</span>
                  <span className="font-mono text-emerald-700 font-bold">{arabicFontSize}px</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="64"
                  step="2"
                  value={arabicFontSize}
                  onChange={(e) => setArabicFontSize(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                  <span>Line Height</span>
                  <span className="font-mono text-emerald-700 font-bold">{arabicLineHeight}</span>
                </div>
                <input
                  type="range"
                  min="1.6"
                  max="3.0"
                  step="0.1"
                  value={arabicLineHeight}
                  onChange={(e) => setArabicLineHeight(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
              </div>
            </div>

            {/* Colors */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-slate-700">Colors</h4>

              {/* Background Color */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-600 font-medium">Background Color</span>
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isTransparent}
                      onChange={(e) => setIsTransparent(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 w-3.5 h-3.5"
                    />
                    <span>Transparent (PNG)</span>
                  </label>
                </div>

                {!isTransparent && (
                  <div className="flex flex-wrap items-center gap-2">
                    {LIGHT_BG_PALETTES.map((pal) => (
                      <button
                        key={pal.color}
                        type="button"
                        onClick={() => setBgColor(pal.color)}
                        title={pal.name}
                        style={{ backgroundColor: pal.color, borderColor: pal.border }}
                        className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center shadow-xs ${
                          bgColor.toLowerCase() === pal.color.toLowerCase()
                            ? 'scale-110 ring-2 ring-emerald-500 ring-offset-1'
                            : 'hover:scale-105'
                        }`}
                      >
                        {bgColor.toLowerCase() === pal.color.toLowerCase() && (
                          <Check
                            className={`w-3.5 h-3.5 ${
                              pal.color === '#ffffff' || pal.color.startsWith('#fe') || pal.color.startsWith('#f')
                                ? 'text-slate-800'
                                : 'text-white'
                            }`}
                          />
                        )}
                      </button>
                    ))}
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-7 h-7 rounded-full cursor-pointer border border-slate-300 overflow-hidden"
                      title="Custom background color"
                    />
                  </div>
                )}
              </div>

              {/* Text Color */}
              <div>
                <span className="text-xs text-slate-600 font-medium block mb-2">Text Color</span>
                <div className="flex flex-wrap items-center gap-2">
                  {TEXT_PALETTES.map((pal) => (
                    <button
                      key={pal.color}
                      type="button"
                      onClick={() => setTextColor(pal.color)}
                      title={pal.name}
                      style={{ backgroundColor: pal.color }}
                      className={`w-7 h-7 rounded-full border border-slate-300 transition-transform cursor-pointer flex items-center justify-center shadow-xs ${
                        textColor.toLowerCase() === pal.color.toLowerCase()
                          ? 'scale-110 ring-2 ring-emerald-500 ring-offset-1'
                          : 'hover:scale-105'
                      }`}
                    >
                      {textColor.toLowerCase() === pal.color.toLowerCase() && (
                        <Check
                          className={`w-3.5 h-3.5 ${
                            pal.color === '#ffffff' ? 'text-slate-900' : 'text-white'
                          }`}
                        />
                      )}
                    </button>
                  ))}
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-7 h-7 rounded-full cursor-pointer border border-slate-300 overflow-hidden"
                    title="Custom text color"
                  />
                </div>
              </div>
            </div>

            {/* Translation */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Translation Text</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTranslation}
                    onChange={(e) => setShowTranslation(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {showTranslation && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Language</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setTranslationLang('id')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          translationLang === 'id'
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Indonesian
                      </button>
                      <button
                        type="button"
                        onClick={() => setTranslationLang('en')}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                          translationLang === 'en'
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        English
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>Translation Size</span>
                      <span className="font-mono text-emerald-700 font-bold">{translationFontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="24"
                      value={translationFontSize}
                      onChange={(e) => setTranslationFontSize(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Ornaments & Alignment */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <span className="text-xs font-semibold text-slate-700 block">
                Ornaments & Alignment
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBismillah}
                    onChange={(e) => setShowBismillah(e.target.checked)}
                    className="rounded text-emerald-600 accent-emerald-600 w-4 h-4"
                  />
                  <span className="text-slate-700 font-medium">Bismillah</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showReference}
                    onChange={(e) => setShowReference(e.target.checked)}
                    className="rounded text-emerald-600 accent-emerald-600 w-4 h-4"
                  />
                  <span className="text-slate-700 font-medium">Verse Reference</span>
                </label>

                <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-slate-50/60">
                  <button
                    type="button"
                    onClick={() => setTextAlign('center')}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs cursor-pointer ${
                      textAlign === 'center' ? 'bg-white font-bold text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                    <span>Center</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTextAlign('right')}
                    className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs cursor-pointer ${
                      textAlign === 'right' ? 'bg-white font-bold text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                    <span>Right</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
