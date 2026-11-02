import React from 'react';

export default function Navbar({ dataSource = 'kemenag' }) {
  const isKemenag = dataSource === 'kemenag';

  return (
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <img
              src="/logo.png"
              alt="Soul of Quran"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                Soul of Quran
              </h1>
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                Light & Clean
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Generate high-resolution aesthetic Quran verse images for social media and presentations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              isKemenag
                ? 'text-emerald-800 bg-emerald-50/90 border-emerald-200'
                : 'text-amber-800 bg-amber-50/90 border-amber-200'
            }`}
            title={
              isKemenag
                ? 'Sumber aktif: EQuran.id (Mushaf & Terjemahan Standar Kemenag RI)'
                : 'Sumber aktif: AlQuran.cloud (Mode Fallback karena EQuran.id tidak dapat dijangkau)'
            }
          >
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                isKemenag ? 'bg-emerald-500' : 'bg-amber-500'
              } animate-pulse`}
            ></span>
            <span>
              {isKemenag ? 'Kemenag RI (EQuran API)' : 'AlQuran.cloud (Fallback)'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
