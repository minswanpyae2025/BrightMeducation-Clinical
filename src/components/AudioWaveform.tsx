import React, { useEffect, useState, useRef } from 'react';
import { SpeechState } from '../types';
import { Volume2, Mic } from 'lucide-react';

interface AudioWaveformProps {
  speechState: SpeechState;
  isPushToTalkActive: boolean;
  compact?: boolean;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  speechState,
  isPushToTalkActive,
  compact = false,
}) => {
  const [barHeights, setBarHeights] = useState<number[]>(new Array(28).fill(14));
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    let phase = 0;

    const updateBars = () => {
      phase += 0.15;
      const newHeights = [];
      const totalBars = 28;

      for (let i = 0; i < totalBars; i++) {
        let height = 10;

        if (speechState === 'speaking') {
          // AI Patient speaking wave
          const wave1 = Math.sin(phase + i * 0.3);
          const wave2 = Math.cos(phase * 1.5 + i * 0.25);
          const combined = Math.abs((wave1 + wave2) / 2);
          height = 14 + combined * 42;
        } else if (isPushToTalkActive || speechState === 'listening') {
          // Candidate speaking wave
          const wave = Math.abs(Math.sin(phase * 1.8 + i * 0.4));
          height = 16 + wave * 46;
        } else if (speechState === 'processing') {
          const wave = Math.abs(Math.sin(phase * 0.9 + i * 0.2));
          height = 12 + wave * 16;
        } else {
          // Ambient gentle resting pulse
          const wave = Math.abs(Math.sin(phase * 0.4 + i * 0.25));
          height = 8 + wave * 8;
        }

        newHeights.push(Math.min(56, Math.max(8, height)));
      }

      setBarHeights(newHeights);
      animationFrameRef.current = requestAnimationFrame(updateBars);
    };

    animationFrameRef.current = requestAnimationFrame(updateBars);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [speechState, isPushToTalkActive]);

  const getStatus = () => {
    if (isPushToTalkActive || speechState === 'listening') {
      return {
        text: 'Listening to Candidate Voice...',
        badge: 'bg-rose-50 text-rose-600 border-rose-200',
        barColor: 'bg-gradient-to-t from-rose-500 to-pink-400',
      };
    }
    if (speechState === 'speaking') {
      return {
        text: 'Patient Speaking...',
        badge: 'bg-sky-50 text-ios-blue border-sky-200',
        barColor: 'bg-gradient-to-t from-ios-blue to-sky-400',
      };
    }
    if (speechState === 'processing') {
      return {
        text: 'Clinical reasoning...',
        badge: 'bg-slate-50 text-slate-600 border-slate-200',
        barColor: 'bg-slate-300',
      };
    }
    return {
      text: 'Push-to-Talk or Tap to Speak',
      badge: 'bg-slate-50 text-slate-500 border-slate-200',
      barColor: 'bg-slate-200',
    };
  };

  const status = getStatus();

  if (compact) {
    return (
      <div className="w-full bg-white/95 rounded-2xl px-3 py-2 border border-slate-200/80 shadow-xs flex items-center justify-between gap-2 select-none">
        <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border truncate max-w-[200px] ${status.badge}`}>
          {status.text}
        </div>
        <div className="flex items-center gap-1 h-5 px-1 shrink-0">
          {barHeights.slice(0, 18).map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-75 ${status.barColor}`}
              style={{
                height: `${Math.min(18, Math.max(3, h * 0.35))}px`,
                opacity: isPushToTalkActive || speechState === 'speaking' ? 1 : 0.4,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-md">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Audio Frequency Stream
        </span>
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${status.badge}`}>
          {status.text}
        </div>
      </div>

      {/* Waveform Bar Equalizer */}
      <div className="flex items-center justify-center gap-1 sm:gap-1.5 h-16 px-3 bg-gradient-to-b from-slate-50/60 to-blue-50/30 rounded-2xl border border-slate-100">
        {barHeights.map((h, i) => (
          <div
            key={i}
            className={`w-1 sm:w-1.5 rounded-full transition-all duration-75 ${status.barColor}`}
            style={{
              height: `${h}px`,
              opacity: isPushToTalkActive || speechState === 'speaking' ? 0.95 : 0.45,
            }}
          />
        ))}
      </div>
    </div>
  );
};
