import React, { useEffect, useState } from 'react';
import { AvatarGesture, SpeechState } from '../types';
import { Heart, Activity, AlertCircle } from 'lucide-react';

interface AnimatedPatientProps {
  name: string;
  age: number;
  chiefComplaint: string;
  gesture: AvatarGesture;
  speechState: SpeechState;
  painScore: number;
  heartRate: number;
  compact?: boolean;
}

export const AnimatedPatient: React.FC<AnimatedPatientProps> = ({
  name,
  age,
  chiefComplaint,
  gesture,
  speechState,
  painScore,
  heartRate,
  compact = false,
}) => {
  const [blink, setBlink] = useState(false);
  const [visemeIndex, setVisemeIndex] = useState(0);

  // Natural blinking effect
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3800 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Lip-sync viseme animation while speaking
  useEffect(() => {
    if (speechState === 'speaking') {
      const visemeInterval = setInterval(() => {
        setVisemeIndex((prev) => (prev + 1) % 4);
      }, 130);
      return () => clearInterval(visemeInterval);
    } else {
      setVisemeIndex(0);
    }
  }, [speechState]);

  // Determine gesture label and badge style
  const getGestureInfo = (g: AvatarGesture) => {
    switch (g) {
      case 'clutch_chest':
        return { label: 'Clutching Chest (Severe Angina)', color: 'bg-red-50 text-red-600 border-red-200' };
      case 'short_of_breath':
        return { label: 'Tachypneic (Short of Breath)', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'wincing':
        return { label: 'Wincing in Pain', color: 'bg-rose-50 text-rose-600 border-rose-200' };
      case 'cough':
        return { label: 'Coughing & Wheezing', color: 'bg-orange-50 text-orange-600 border-orange-200' };
      case 'holding_abdomen':
        return { label: 'Guarding Abdomen', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'rub_temple':
        return { label: 'Rubbing Temple (Headache)', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'nodding':
        return { label: 'Nodding Attentively', color: 'bg-blue-50 text-ios-blue border-blue-200' };
      case 'thinking':
        return { label: 'Recalling History', color: 'bg-slate-50 text-slate-700 border-slate-200' };
      case 'relieved':
        return { label: 'Relieved & Reassured', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'speaking':
        return { label: 'Explaining Symptoms', color: 'bg-blue-50 text-ios-blue border-blue-200' };
      default:
        return { label: 'Resting (Guarded)', color: 'bg-slate-50 text-slate-600 border-slate-200' };
    }
  };

  const gestureInfo = getGestureInfo(gesture);

  // Dynamic SVG mouth shapes based on visemes and expressions
  const renderMouth = () => {
    if (speechState === 'speaking') {
      switch (visemeIndex) {
        case 0:
          return <ellipse cx="100" cy="116" rx="9" ry="5" fill="#5A2E2E" />;
        case 1:
          return <ellipse cx="100" cy="116" rx="12" ry="7" fill="#4A1E1E" />;
        case 2:
          return <rect x="91" y="113" width="18" height="6" rx="3" fill="#5A2E2E" />;
        case 3:
          return <ellipse cx="100" cy="116" rx="7" ry="8" fill="#5A2E2E" />;
        default:
          return <ellipse cx="100" cy="116" rx="10" ry="5" fill="#5A2E2E" />;
      }
    }

    if (gesture === 'wincing' || gesture === 'clutch_chest') {
      return <path d="M91 118 Q96 113 100 117 Q104 113 109 118" stroke="#4A1E1E" strokeWidth="2.5" fill="none" strokeLinecap="round" />;
    }

    if (gesture === 'short_of_breath') {
      return <ellipse cx="100" cy="117" rx="8" ry="6" fill="#3D1A1A" />;
    }

    if (gesture === 'relieved') {
      return <path d="M92 115 Q100 122 108 115" stroke="#4A1E1E" strokeWidth="2.2" fill="none" strokeLinecap="round" />;
    }

    return <path d="M93 116 Q100 118 107 116" stroke="#4A1E1E" strokeWidth="2" fill="none" strokeLinecap="round" />;
  };

  const renderEyebrows = () => {
    if (gesture === 'wincing' || gesture === 'clutch_chest' || gesture === 'holding_abdomen') {
      return (
        <>
          <path d="M78 85 Q87 90 94 88" stroke="#334155" strokeWidth="2.8" fill="none" strokeLinecap="round" />
          <path d="M122 85 Q113 90 106 88" stroke="#334155" strokeWidth="2.8" fill="none" strokeLinecap="round" />
        </>
      );
    }
    if (gesture === 'short_of_breath') {
      return (
        <>
          <path d="M78 84 Q86 80 94 84" stroke="#334155" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M122 84 Q114 80 106 84" stroke="#334155" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      );
    }
    return (
      <>
        <path d="M78 87 Q86 84 94 86" stroke="#334155" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M122 87 Q114 84 106 86" stroke="#334155" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    );
  };

  const renderEyes = () => {
    if (blink || gesture === 'wincing') {
      return (
        <>
          <path d="M80 98 Q87 101 94 98" stroke="#1E293B" strokeWidth="2.2" fill="none" strokeLinecap="round" />
          <path d="M106 98 Q113 101 120 98" stroke="#1E293B" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        </>
      );
    }

    return (
      <>
        <ellipse cx="87" cy="98" rx="6.5" ry="4.5" fill="#FFFFFF" />
        <circle cx={gesture === 'thinking' ? 89 : 87} cy="98" r="3" fill="#1E293B" />
        <circle cx={gesture === 'thinking' ? 90 : 88} cy="97" r="1" fill="#FFFFFF" />

        <ellipse cx="113" cy="98" rx="6.5" ry="4.5" fill="#FFFFFF" />
        <circle cx={gesture === 'thinking' ? 115 : 113} cy="98" r="3" fill="#1E293B" />
        <circle cx={gesture === 'thinking' ? 116 : 114} cy="97" r="1" fill="#FFFFFF" />
      </>
    );
  };

  return (
    <div className="w-full bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-md overflow-hidden transition-all duration-300 select-none">
      {/* Top Clinical Header Bar */}
      <div className="flex items-center justify-between px-3.5 sm:px-5 py-2.5 sm:py-3.5 bg-gradient-to-r from-slate-50 to-blue-50/40 border-b border-slate-100">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <span className="text-sm sm:text-base font-extrabold text-slate-900">{name}</span>
            <span className="text-[11px] sm:text-xs text-slate-500 ml-1 font-normal">({age} y/o)</span>
          </div>
        </div>

        {/* Vitals Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] sm:text-xs font-bold border border-rose-100">
            <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-500 animate-heart-pulse fill-rose-500" />
            <span>{heartRate} bpm</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] sm:text-xs font-bold border border-amber-100">
            <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" />
            <span>Pain {painScore}/10</span>
          </div>
        </div>
      </div>

      {/* Main Responsive Avatar Stage */}
      <div className="relative flex flex-col items-center justify-center pt-2 sm:pt-4 pb-3 sm:pb-5 px-3 sm:px-4 bg-gradient-to-b from-blue-50/20 via-white to-slate-50/30 min-h-[160px] sm:min-h-[260px] md:min-h-[300px]">
        {/* Subtle background ambient ring */}
        <div className="absolute w-44 h-44 sm:w-60 sm:h-60 rounded-full bg-gradient-to-tr from-sky-100/40 to-blue-100/30 blur-2xl pointer-events-none -top-2" />

        {/* Big Gesture Pill */}
        <div className="z-10 mb-2 sm:mb-3">
          <div className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold border shadow-xs flex items-center gap-1.5 sm:gap-2 transition-all duration-300 ${gestureInfo.color}`}>
            <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{gestureInfo.label}</span>
          </div>
        </div>

        {/* 2D Vector Medical Avatar Character */}
        <div
          className={`relative w-32 h-36 sm:w-48 sm:h-52 md:w-56 md:h-60 select-none transition-transform duration-300 ${
            gesture === 'short_of_breath'
              ? 'animate-pulse'
              : gesture === 'wincing'
              ? 'animate-wince'
              : 'animate-breathe'
          }`}
        >
          <svg
            viewBox="0 0 200 230"
            className="w-full h-full drop-shadow-sm"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FBD5C0" />
                <stop offset="100%" stopColor="#EAB59A" />
              </linearGradient>

              <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6BA6E8" />
                <stop offset="100%" stopColor="#4380C9" />
              </linearGradient>

              <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3F4857" />
                <stop offset="100%" stopColor="#1E2430" />
              </linearGradient>
            </defs>

            {/* Torso / Gown */}
            <path
              d="M50 170 Q40 185 30 230 L170 230 Q160 185 150 170 Q130 162 100 162 Q70 162 50 170 Z"
              fill="url(#shirtGrad)"
            />

            {/* Collar */}
            <path
              d="M82 165 Q100 180 118 165"
              fill="none"
              stroke="#DCEAF8"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Neck */}
            <rect x="88" y="132" width="24" height="34" rx="6" fill="url(#skinGrad)" />

            {/* Ears */}
            <circle cx="64" cy="102" r="9" fill="url(#skinGrad)" />
            <circle cx="136" cy="102" r="9" fill="url(#skinGrad)" />

            {/* Head */}
            <path
              d="M68 96 C68 62 132 62 132 96 C132 130 118 140 100 140 C82 140 68 130 68 96 Z"
              fill="url(#skinGrad)"
            />

            {/* Hair */}
            <path
              d="M65 88 C64 60 85 45 100 45 C115 45 136 60 135 88 C130 76 118 68 100 68 C82 68 70 76 65 88 Z"
              fill="url(#hairGrad)"
            />

            {/* Diaphoresis / Sweat */}
            {(gesture === 'clutch_chest' || gesture === 'short_of_breath') && (
              <>
                <circle cx="76" cy="80" r="1.8" fill="#60A5FA" opacity="0.8" />
                <circle cx="122" cy="78" r="1.5" fill="#60A5FA" opacity="0.8" />
                <path d="M76 82 Q76 86 77 87" stroke="#60A5FA" strokeWidth="1" fill="none" opacity="0.8" />
              </>
            )}

            {/* Eyebrows */}
            {renderEyebrows()}

            {/* Eyes */}
            {renderEyes()}

            {/* Nose */}
            <path
              d="M100 99 L97 108 L103 108"
              fill="none"
              stroke="#CB8E75"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Mouth */}
            {renderMouth()}

            {/* 1. Clutching Chest */}
            {gesture === 'clutch_chest' && (
              <g className="transition-all duration-300">
                <path
                  d="M165 220 Q145 185 105 186"
                  fill="none"
                  stroke="#4380C9"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                <ellipse cx="98" cy="186" rx="14" ry="10" fill="url(#skinGrad)" />
                <circle cx="92" cy="183" r="3.5" fill="#CB8E75" />
                <circle cx="97" cy="181" r="3.5" fill="#CB8E75" />
                <circle cx="103" cy="183" r="3.5" fill="#CB8E75" />
                <path
                  d="M98 172 L98 166 M86 176 L81 172 M110 176 L115 172"
                  stroke="#EF4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.8"
                />
              </g>
            )}

            {/* 2. Holding Abdomen */}
            {gesture === 'holding_abdomen' && (
              <g className="transition-all duration-300">
                <path
                  d="M38 220 Q65 210 95 212"
                  fill="none"
                  stroke="#4380C9"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                <path
                  d="M162 220 Q135 210 105 212"
                  fill="none"
                  stroke="#4380C9"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                <ellipse cx="88" cy="212" rx="12" ry="8" fill="url(#skinGrad)" />
                <ellipse cx="112" cy="212" rx="12" ry="8" fill="url(#skinGrad)" />
              </g>
            )}

            {/* 3. Rubbing Temple */}
            {gesture === 'rub_temple' && (
              <g className="transition-all duration-300">
                <path
                  d="M165 220 Q160 140 132 94"
                  fill="none"
                  stroke="#4380C9"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                <ellipse cx="130" cy="92" rx="10" ry="7" fill="url(#skinGrad)" />
                <circle cx="127" cy="88" r="3" fill="#CB8E75" />
              </g>
            )}

            {/* 4. Cough */}
            {gesture === 'cough' && (
              <g className="transition-all duration-300">
                <path
                  d="M165 220 Q145 150 104 122"
                  fill="none"
                  stroke="#4380C9"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                <ellipse cx="102" cy="120" rx="13" ry="10" fill="url(#skinGrad)" />
                <path d="M80 120 L72 118 M78 126 L70 128" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
              </g>
            )}

            {/* 5. Thinking */}
            {gesture === 'thinking' && (
              <g className="transition-all duration-300">
                <path
                  d="M165 220 Q150 170 118 144"
                  fill="none"
                  stroke="#4380C9"
                  strokeWidth="14"
                  strokeLinecap="round"
                />
                <ellipse cx="116" cy="142" rx="9" ry="7" fill="url(#skinGrad)" />
                <circle cx="114" cy="136" r="3" fill="#CB8E75" />
              </g>
            )}

            {/* 6. Resting Arms */}
            {(gesture === 'idle' || gesture === 'speaking' || gesture === 'nodding' || gesture === 'relieved') && (
              <g>
                <path
                  d="M38 225 Q45 210 55 228"
                  fill="none"
                  stroke="#4380C9"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
                <path
                  d="M162 225 Q155 210 145 228"
                  fill="none"
                  stroke="#4380C9"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
              </g>
            )}
          </svg>
        </div>

        {/* Responsive Chief Complaint Quote Bubble */}
        <div className="z-10 mt-1 sm:mt-2 px-3 sm:px-5 py-1.5 sm:py-2.5 max-w-[96%] rounded-xl sm:rounded-2xl bg-white border border-slate-200/90 shadow-xs text-center">
          <p className="text-xs sm:text-sm italic text-slate-800 font-medium leading-relaxed line-clamp-2 sm:line-clamp-none">
            {chiefComplaint}
          </p>
        </div>
      </div>
    </div>
  );
};
