import React from 'react';
import { Mic } from 'lucide-react';
import { medicalAudio } from '../utils/audioSimulator';

interface PushToTalkButtonProps {
  isPushToTalkActive: boolean;
  onStart: () => void;
  onStop: () => void;
}

export const PushToTalkButton: React.FC<PushToTalkButtonProps> = ({
  isPushToTalkActive,
  onStart,
  onStop,
}) => {
  return (
    <div className="relative flex items-center justify-center py-2 select-none">
      {/* Outer Ripple Wave when active */}
      {isPushToTalkActive && (
        <>
          <span className="absolute w-24 h-24 rounded-full bg-rose-400 opacity-40 animate-ping pointer-events-none" />
          <span className="absolute w-28 h-28 rounded-full bg-rose-300 opacity-30 animate-pulse pointer-events-none" />
        </>
      )}

      {/* Main Big Button */}
      <button
        type="button"
        onMouseDown={() => {
          medicalAudio.playHapticTap();
          onStart();
        }}
        onMouseUp={() => {
          medicalAudio.playHapticTap();
          onStop();
        }}
        onTouchStart={() => {
          medicalAudio.playHapticTap();
          onStart();
        }}
        onTouchEnd={() => {
          medicalAudio.playHapticTap();
          onStop();
        }}
        className={`relative z-10 w-full sm:w-auto min-w-0 max-w-sm h-14 sm:h-18 px-5 sm:px-8 rounded-full font-black text-xs sm:text-base flex items-center justify-center gap-2.5 sm:gap-3 transition-all duration-200 shadow-lg ${
          isPushToTalkActive
            ? 'bg-rose-500 text-white scale-[0.98] ring-4 ring-rose-200 shadow-rose-500/30'
            : 'bg-ios-blue hover:bg-blue-600 active:scale-95 text-white shadow-blue-500/25'
        }`}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isPushToTalkActive ? 'bg-white/20 animate-bounce' : 'bg-white/20'
        }`}>
          <Mic className="w-5 h-5" />
        </div>
        <div className="text-left">
          <span className="block leading-tight uppercase tracking-wider text-xs opacity-90">
            {isPushToTalkActive ? 'Release to Send Voice' : 'Push to Talk'}
          </span>
          <span className="block text-sm sm:text-base font-extrabold leading-tight">
            {isPushToTalkActive ? 'LISTENING TO YOU...' : 'HOLD TO SPEAK'}
          </span>
        </div>
      </button>
    </div>
  );
};
