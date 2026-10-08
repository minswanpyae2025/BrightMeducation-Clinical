import React from 'react';
import { OSCECase, OSCEStationPhase, Language } from '../types';
import { UserProfile } from '../lib/supabase';
import { StationTimer } from './StationTimer';
import { translations } from '../locales/i18n';
import {
  Stethoscope,
  Volume2,
  VolumeX,
  Coins,
  ChevronLeft,
  User,
  Globe,
} from 'lucide-react';
import { medicalAudio } from '../utils/audioSimulator';

interface HeaderProps {
  currentCase: OSCECase | null;
  stationPhase: OSCEStationPhase;
  userProfile: UserProfile;
  language: Language;
  onToggleLanguage: () => void;
  isTimerRunning: boolean;
  onTimeExpired: () => void;
  onFinishStation: () => void;
  onToggleTimer: () => void;
  onGoToHub: () => void;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentCase,
  stationPhase,
  userProfile,
  language,
  onToggleLanguage,
  isTimerRunning,
  onTimeExpired,
  onFinishStation,
  onToggleTimer,
  onGoToHub,
  onOpenAuthModal,
}) => {
  const [isMuted, setIsMuted] = React.useState(medicalAudio.getMuted());
  const t = translations[language];

  const toggleSound = () => {
    const next = !isMuted;
    medicalAudio.setMuted(next);
    setIsMuted(next);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 select-none shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
        {/* Left: Brand or Back to Hub */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {stationPhase !== 'hub' ? (
            <button
              onClick={() => {
                medicalAudio.playHapticTap();
                onGoToHub();
              }}
              className="px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs sm:text-sm flex items-center gap-1 transition-all shrink-0 active:scale-95"
            >
              <ChevronLeft className="w-4 h-4 text-ios-blue" />
              <span>{t.stationsHub}</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-ios-blue text-white flex items-center justify-center shadow-md shrink-0">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm sm:text-lg font-black text-slate-900 tracking-tight truncate">
                    Bright Meducation
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-blue-50 text-ios-blue text-[10px] font-black uppercase tracking-wider border border-blue-100">
                    Clinical
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium block truncate">
                  OSCE Simulation
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Center: Timer (only active in consultation) */}
        {stationPhase === 'consultation' && currentCase && (
          <div className="shrink-0 scale-90 sm:scale-100">
            <StationTimer
              totalMinutes={currentCase.durationMinutes}
              isRunning={isTimerRunning}
              onTimeExpired={onTimeExpired}
              onFinishStation={onFinishStation}
              onTogglePlayPause={onToggleTimer}
            />
          </div>
        )}

        {/* Right: Language, Credits, User */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Dual Language Switcher */}
          <button
            onClick={() => {
              medicalAudio.playHapticTap();
              onToggleLanguage();
            }}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs transition-all border border-slate-200/80 active:scale-95"
            title="Switch Language / ဘာသာစကား ပြောင်းလဲမည်"
          >
            <Globe className="w-3.5 h-3.5 text-ios-blue" />
            <span className="hidden xs:inline">{language === 'my' ? '🇲🇲 မြန်မာ' : '🇬🇧 EN'}</span>
            <span className="xs:hidden">{language === 'my' ? 'မြန်မာ' : 'EN'}</span>
          </button>

          {/* Real Credits Pill (Verified in Supabase) */}
          <button
            onClick={() => {
              medicalAudio.playHapticTap();
              onOpenAuthModal();
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-50 to-sky-50 text-ios-blue font-black text-xs sm:text-sm border border-blue-200 shadow-sm active:scale-95 transition-all"
            title={t.creditsExplanation}
          >
            <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
            <span>{userProfile.credits}</span>
            <span className="hidden sm:inline">{t.credits}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              medicalAudio.playHapticTap();
              toggleSound();
            }}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-95"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-ios-blue" />}
          </button>

          {/* User Profile */}
          <button
            onClick={() => {
              medicalAudio.playHapticTap();
              onOpenAuthModal();
            }}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-slate-900 text-white font-black text-xs flex items-center justify-center shadow-sm active:scale-95 transition-all"
            title="Account Profile"
          >
            {userProfile.full_name?.charAt(0) || <User className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
