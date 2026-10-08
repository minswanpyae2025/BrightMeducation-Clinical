import React, { useState } from 'react';
import { OSCECase, PhysicalExamPoint, ExamTechnique, AvatarGesture } from '../types';
import {
  Stethoscope,
  Activity,
  Heart,
  Wind,
  CheckCircle,
  Eye,
  Hand,
  Volume2,
  Sparkles,
  Info,
} from 'lucide-react';
import { medicalAudio } from '../utils/audioSimulator';

interface PhysicalExamViewProps {
  currentCase: OSCECase;
  onExamPointRevealed: (point: PhysicalExamPoint) => void;
  onPatientSpokenResponse: (text: string, gesture?: AvatarGesture) => void;
}

export const PhysicalExamView: React.FC<PhysicalExamViewProps> = ({
  currentCase,
  onExamPointRevealed,
  onPatientSpokenResponse,
}) => {
  const [selectedSystemId, setSelectedSystemId] = useState<string>(
    currentCase.physicalExamSystems[0]?.id || ''
  );
  const [activePoint, setActivePoint] = useState<PhysicalExamPoint | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const currentSystem =
    currentCase.physicalExamSystems.find((s) => s.id === selectedSystemId) ||
    currentCase.physicalExamSystems[0];

  const handlePerformExam = (point: PhysicalExamPoint) => {
    medicalAudio.playHapticTap();
    setActivePoint(point);
    onExamPointRevealed(point);

    // Play synthesized auscultation sound if point has audio
    if (point.soundType) {
      setIsPlayingAudio(true);
      if (point.soundType === 'heart_normal') {
        medicalAudio.playHeartSound(false);
      } else if (point.soundType === 'heart_murmur') {
        medicalAudio.playHeartSound(true);
      } else if (point.soundType === 'lung_crackles') {
        medicalAudio.playRespiratorySound('lung_crackles');
      } else if (point.soundType === 'lung_wheeze') {
        medicalAudio.playRespiratorySound('lung_wheeze');
      } else if (point.soundType === 'lung_vesicular') {
        medicalAudio.playRespiratorySound('lung_vesicular');
      }

      setTimeout(() => setIsPlayingAudio(false), 2000);
    }

    // Trigger AI patient voice & gesture
    if (point.patientReaction) {
      onPatientSpokenResponse(point.patientReaction, point.gestureOnAction || 'nodding');
    }
  };

  const getTechniqueBadge = (tech: ExamTechnique) => {
    switch (tech) {
      case 'auscultation':
        return { label: 'Auscultation', icon: <Stethoscope className="w-3 h-3" />, color: 'bg-blue-50 text-ios-blue border-blue-200' };
      case 'palpation':
        return { label: 'Palpation', icon: <Hand className="w-3 h-3" />, color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'percussion':
        return { label: 'Percussion', icon: <Activity className="w-3 h-3" />, color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'inspection':
        return { label: 'Inspection', icon: <Eye className="w-3 h-3" />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-ios-xl border border-slate-100 shadow-ios-md overflow-hidden">
      {/* Top Header & System Switcher */}
      <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-ios-blue flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Focused Physical Examination Simulator
              </h3>
              <p className="text-[11px] text-slate-500">
                Interactive bedside auscultation, palpation, and clinical sign elicitation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-ios-pill bg-white text-xs font-semibold text-slate-700 border border-slate-200 shadow-ios-sm">
            <Activity className="w-3.5 h-3.5 text-ios-blue" />
            <span>Interactive Bedside</span>
          </div>
        </div>

        {/* System Category Tabs */}
        <div className="flex overflow-x-auto no-scrollbar gap-1.5 bg-slate-100/80 p-1 rounded-ios-lg">
          {currentCase.physicalExamSystems.map((system) => {
            const isSelected = system.id === currentSystem?.id;
            return (
              <button
                key={system.id}
                onClick={() => {
                  medicalAudio.playHapticTap();
                  setSelectedSystemId(system.id);
                  setActivePoint(null);
                }}
                className={`flex-1 min-w-[120px] py-1.5 px-3 rounded-ios-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-white text-ios-blue shadow-ios-sm font-bold border border-slate-200/50'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{system.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Body Stage & Interactive Landmarks */}
      <div className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-y-auto">
        {/* Left: Interactive 2D Anatomical Map (5 Cols on large) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-blue-50/20 via-white to-slate-50/40 rounded-ios-lg p-3 border border-slate-100 flex flex-col items-center justify-center min-h-[300px]">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Tap Landmark to Apply Tool
          </div>

          {/* Interactive Anatomical Silhouette */}
          <div className="relative w-48 sm:w-56 h-64 sm:h-72 bg-white/70 rounded-ios-lg border border-slate-100 shadow-ios-sm flex items-center justify-center select-none overflow-hidden">
            {/* Minimalist torso silhouette SVG */}
            <svg
              viewBox="0 0 100 130"
              className="w-full h-full text-slate-200 fill-current opacity-70"
            >
              <path d="M40 8 C40 3 60 3 60 8 C60 14 40 14 40 8 Z" fill="#E2E8F0" />
              <path d="M44 14 L56 14 L58 22 L42 22 Z" fill="#E2E8F0" />
              {/* Torso & shoulders */}
              <path
                d="M26 26 C34 20 66 20 74 26 C82 32 80 50 78 72 C76 86 70 120 70 125 L30 125 C30 120 24 86 22 72 C20 50 18 32 26 26 Z"
                fill="#F1F5F9"
                stroke="#CBD5E1"
                strokeWidth="1.2"
              />
              {/* Ribcage subtle arcs */}
              <path d="M42 38 Q50 42 58 38" stroke="#E2E8F0" strokeWidth="1" fill="none" />
              <path d="M38 48 Q50 54 62 48" stroke="#E2E8F0" strokeWidth="1" fill="none" />
              <path d="M36 58 Q50 64 64 58" stroke="#E2E8F0" strokeWidth="1" fill="none" />
              {/* Navel */}
              <circle cx="50" cy="88" r="1.5" fill="#CBD5E1" />
            </svg>

            {/* Interactive Anatomical Pins / Hotspots */}
            {currentSystem?.points.map((pt) => {
              const isSelected = activePoint?.id === pt.id;
              const isRevealed = pt.revealed;

              return (
                <button
                  key={pt.id}
                  onClick={() => handlePerformExam(pt)}
                  style={{
                    left: `${pt.coords.x}%`,
                    top: `${pt.coords.y}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-all z-20 ${
                    isSelected ? 'scale-125 ring-4 ring-ios-blue/30' : 'hover:scale-110'
                  }`}
                  title={`${pt.name} (${pt.technique})`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-ios-md border transition-all ${
                      isSelected
                        ? 'bg-ios-blue text-white border-white animate-pulse'
                        : isRevealed
                        ? 'bg-emerald-500 text-white border-white'
                        : 'bg-white text-ios-blue border-blue-200'
                    }`}
                  >
                    {pt.technique === 'auscultation' ? (
                      <Stethoscope className="w-3.5 h-3.5" />
                    ) : pt.technique === 'palpation' ? (
                      <Hand className="w-3.5 h-3.5" />
                    ) : (
                      <Activity className="w-3.5 h-3.5" />
                    )}
                  </div>

                  {/* Pulsing beacon if not yet examined */}
                  {!isRevealed && (
                    <span className="absolute inset-0 rounded-full bg-sky-400 opacity-60 animate-ping pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Exam Findings & Clinical Interpretation (7 Cols on large) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
          {/* List of Examination Actions in this System */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Examination Maneuvers ({currentSystem?.name}):
            </span>

            <div className="grid grid-cols-1 gap-2">
              {currentSystem?.points.map((pt) => {
                const isSelected = activePoint?.id === pt.id;
                const techBadge = getTechniqueBadge(pt.technique);

                return (
                  <button
                    key={pt.id}
                    onClick={() => handlePerformExam(pt)}
                    className={`text-left p-3 rounded-ios-lg border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-50/70 border-ios-blue ring-1 ring-ios-blue shadow-ios-sm'
                        : 'bg-white hover:bg-slate-50/80 border-slate-100 shadow-ios-sm'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${techBadge.color}`}
                      >
                        {techBadge.icon}
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-semibold text-slate-800 block">
                          {pt.name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-normal">
                          {pt.actionLabel}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {pt.revealed && (
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                      {pt.soundType && (
                        <span className="px-2 py-0.5 rounded-ios-pill bg-sky-50 text-sky-700 text-[10px] font-semibold border border-sky-200">
                          Audio
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Finding Report Card */}
          {activePoint ? (
            <div className="p-4 rounded-ios-lg bg-gradient-to-br from-blue-50/60 via-white to-slate-50 border border-blue-200/80 shadow-ios-sm animate-fadeIn">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ios-blue uppercase tracking-wider">
                    Official OSCE Finding:
                  </span>
                  {activePoint.isKeyFinding && (
                    <span className="px-2 py-0.5 rounded-ios-pill bg-rose-50 text-rose-600 text-[10px] font-bold border border-rose-200">
                      High Yield Sign
                    </span>
                  )}
                </div>

                {activePoint.soundType && (
                  <button
                    onClick={() => {
                      medicalAudio.playHapticTap();
                      if (activePoint.soundType === 'heart_normal') medicalAudio.playHeartSound(false);
                      if (activePoint.soundType === 'heart_murmur') medicalAudio.playHeartSound(true);
                      if (activePoint.soundType === 'lung_crackles') medicalAudio.playRespiratorySound('lung_crackles');
                      if (activePoint.soundType === 'lung_wheeze') medicalAudio.playRespiratorySound('lung_wheeze');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-ios-pill bg-ios-blue text-white text-xs font-semibold hover:bg-blue-600 transition-all shadow-ios-sm active:scale-95"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Replay Audio</span>
                  </button>
                )}
              </div>

              <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
                {activePoint.name}
              </h4>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white p-3 rounded-ios-md border border-slate-100 shadow-ios-sm">
                {activePoint.finding}
              </p>

              {activePoint.patientReaction && (
                <div className="mt-2 text-xs italic text-slate-500 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-ios-blue shrink-0" />
                  <span>Patient Reaction: "{activePoint.patientReaction}"</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-ios-lg bg-slate-50 border border-dashed border-slate-200 text-center">
              <Stethoscope className="w-8 h-8 text-slate-300 mx-auto mb-1" />
              <p className="text-xs text-slate-500 font-medium">
                Select any examination point above or tap the anatomical figure to elicit bedside findings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
