import React from 'react';

export const GOVT_MONOGRAM_SRC =
  '/assets/aistudio/3840px-Government_Seal_of_Bangladesh.svg__1__2d6f6b7f.png';
export const DPE_LOGO_SRC =
  '/assets/aistudio/IMG_37af5b1e-49c8-43ce-b5f9-886334f0761d_f8bf63d3.png';

interface EmblemImgProps {
  src?: string;
  alt?: string;
  className?: string;
}

export const GovtMonogramImg: React.FC<EmblemImgProps> = ({
  src,
  alt = 'গণপ্রজাতন্ত্রী বাংলাদেশ সরকারের জাতীয় মনোগ্রাম',
  className = 'h-14 w-14 object-contain',
}) => (
  <img
    src={src || GOVT_MONOGRAM_SRC}
    alt={alt}
    referrerPolicy="no-referrer"
    className={`rounded-full bg-white p-0.5 object-contain border border-slate-200/80 shadow-2xs ${className}`}
  />
);

export const DpeLogoImg: React.FC<EmblemImgProps> = ({
  src,
  alt = 'প্রাথমিক শিক্ষা অধিদপ্তরের লোগো',
  className = 'h-14 w-14 object-contain',
}) => (
  <img
    src={src || DPE_LOGO_SRC}
    alt={alt}
    referrerPolicy="no-referrer"
    className={`rounded-xl bg-white p-0.5 object-contain border border-emerald-200/80 shadow-2xs ${className}`}
  />
);

interface OfficialA4LetterheadProps {
  schoolName: string;
  addressLine?: string;
  documentTitle?: string;
  subtitle?: string;
  leftLogoSrc?: string;
  rightLogoSrc?: string;
  compact?: boolean;
  className?: string;
}

/**
 * Standard institutional A4 letterhead featuring Bangladesh Government Monogram on the left,
 * official DPE/School header in the center, and Directorate of Primary Education (DPE) logo on the right.
 */
export const OfficialA4Letterhead: React.FC<OfficialA4LetterheadProps> = ({
  schoolName,
  addressLine,
  documentTitle,
  subtitle,
  leftLogoSrc,
  rightLogoSrc,
  compact = false,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center justify-between gap-3 border-b-2 border-slate-900 ${
        compact ? 'pb-3 mb-4' : 'pb-4 mb-5'
      } ${className}`}
    >
      <div className="shrink-0 flex flex-col items-center">
        <GovtMonogramImg
          src={leftLogoSrc}
          className={compact ? 'h-12 w-12 sm:h-14 sm:w-14 object-contain' : 'h-14 w-14 sm:h-16 sm:w-16 object-contain'}
        />
      </div>

      <div className="flex-1 min-w-0 text-center">
        <p className="text-[11px] sm:text-xs font-bold text-emerald-900 tracking-tight">
          গণপ্রজাতন্ত্রী বাংলাদেশ সরকার · প্রাথমিক শিক্ষা অধিদপ্তর
        </p>
        <h2
          className={`${
            compact ? 'text-base sm:text-lg' : 'text-lg sm:text-xl'
          } font-extrabold text-slate-950 mt-0.5 leading-snug`}
        >
          {schoolName}
        </h2>
        {addressLine && (
          <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5">{addressLine}</p>
        )}
        {documentTitle && (
          <div className="mt-2 inline-block border-y border-emerald-800 bg-emerald-50/70 px-4 py-1 rounded-sm">
            <h3 className="text-xs sm:text-sm font-bold text-emerald-950">{documentTitle}</h3>
          </div>
        )}
        {subtitle && (
          <p className="text-[11px] sm:text-xs font-semibold text-slate-700 mt-1">{subtitle}</p>
        )}
      </div>

      <div className="shrink-0 flex flex-col items-center">
        <DpeLogoImg
          src={rightLogoSrc}
          className={compact ? 'h-12 w-12 sm:h-14 sm:w-14 object-contain' : 'h-14 w-14 sm:h-16 sm:w-16 object-contain'}
        />
      </div>
    </div>
  );
};

export const OfficialWatermark: React.FC<{ opacityClass?: string }> = ({
  opacityClass = 'opacity-[0.06]',
}) => (
  <div
    aria-hidden="true"
    className={`pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden ${opacityClass}`}
  >
    <img
      src={GOVT_MONOGRAM_SRC}
      alt=""
      className="w-60 h-60 sm:w-72 sm:h-72 object-contain select-none"
    />
  </div>
);
