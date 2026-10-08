import React, { useEffect, useState } from 'react';
import { Play, Pause, CheckCircle2, AlertTriangle } from 'lucide-react';
import { medicalAudio } from '../utils/audioSimulator';

interface StationTimerProps {
  totalMinutes: number;
  isRunning: boolean;
  onTimeExpired: () => void;
  onFinishStation: () => void;
  onTogglePlayPause: () => void;
}

export const StationTimer: React.FC<StationTimerProps> = ({
  totalMinutes,
  isRunning,
  onTimeExpired,
  onFinishStation,
  onTogglePlayPause,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(totalMinutes * 60);
  const [hasPlayedWarning, setHasPlayedWarning] = useState(false);

  useEffect(() => {
    setSecondsRemaining(totalMinutes * 60);
    setHasPlayedWarning(false);
  }, [totalMinutes]);

  useEffect(() => {
    let interval: number | null = null;

    if (isRunning && secondsRemaining > 0) {
      interval = window.setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            medicalAudio.playOSCEChime(false);
            onTimeExpired();
            return 0;
          }

          // 2-minute warning chime
          if (prev === 120 && !hasPlayedWarning) {
            medicalAudio.playOSCEChime(true);
            setHasPlayedWarning(true);
          }

          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsRemaining, hasPlayedWarning, onTimeExpired]);

  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  const formattedTime = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  const isWarning = secondsRemaining <= 120 && secondsRemaining > 30;
  const isUrgent = secondsRemaining <= 30;

  const totalSeconds = totalMinutes * 60;
  const progressPercent = Math.max(0, Math.min(100, ((totalSeconds - secondsRemaining) / totalSeconds) * 100));

  return (
    <div className="flex items-center gap-2 sm:gap-3 bg-white/95 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 rounded-ios-pill border border-slate-200/80 shadow-ios-sm">
      {/* Play / Pause Toggle */}
      <button
        onClick={() => {
          medicalAudio.playHapticTap();
          onTogglePlayPause();
        }}
        className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all"
        title={isRunning ? 'Pause OSCE Timer' : 'Resume OSCE Timer'}
        aria-label={isRunning ? 'Pause OSCE Timer' : 'Resume OSCE Timer'}
      >
        {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
      </button>

      {/* Clock Display */}
      <div className="flex items-center gap-1.5">
        <div
          className={`font-mono text-sm sm:text-base font-bold tracking-tight transition-colors ${
            isUrgent
              ? 'text-red-600 animate-pulse'
              : isWarning
              ? 'text-amber-600'
              : 'text-slate-800'
          }`}
        >
          {formattedTime}
        </div>

        {/* Small badge warning */}
        {isWarning && (
          <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-ios-pill bg-amber-50 text-amber-700 text-[10px] font-medium border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            2m left
          </span>
        )}
      </div>

      {/* Subtle Progress Bar */}
      <div className="hidden md:block w-14 bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            isUrgent ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-ios-blue'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Finish Station Button */}
      <button
        onClick={() => {
          medicalAudio.playHapticTap();
          onFinishStation();
        }}
        className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1 rounded-ios-pill bg-blue-50 hover:bg-blue-100 text-ios-blue text-xs font-semibold border border-blue-200 active:scale-95 transition-all"
        title="Complete OSCE Station & View Rubric Feedback"
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Finish Station</span>
        <span className="sm:hidden">Done</span>
      </button>
    </div>
  );
};
