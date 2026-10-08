import React, { useState } from 'react';
import { OSCECase, PhysicalExamPoint, ExamTechnique, AvatarGesture, SpeechState, Language } from '../types';
import { AnimatedPatient } from './AnimatedPatient';
import { AudioWaveform } from './AudioWaveform';
import { translations } from '../locales/i18n';
import {
  Stethoscope,
  Activity,
  Hand,
  Eye,
  CheckCircle2,
  Volume2,
} from 'lucide-react';
import { medicalAudio } from '../utils/audioSimulator';

interface PhysicalExamStationViewProps {
  currentCase: OSCECase;
  speechState: SpeechState;
  currentGesture: AvatarGesture;
  language: Language;
  onExamPointRevealed: (point: PhysicalExamPoint) => void;
  onPatientSpokenResponse: (text: string, gesture?: AvatarGesture) => void;
  onManualGestureChange: (gesture: AvatarGesture) => void;
}

export const PhysicalExamStationView: React.FC<PhysicalExamStationViewProps> = ({
  currentCase,
  speechState,
  currentGesture,
  language,
  onExamPointRevealed,
  onPatientSpokenResponse,
}) => {
  const currentSystem = currentCase.physicalExamSystems[0];
  const [activePoint, setActivePoint] = useState<PhysicalExamPoint | null>(
    currentSystem?.points[0] || null
  );

  const t = translations[language];

  const handlePerformExam = (point: PhysicalExamPoint) => {
    medicalAudio.playHapticTap();
    setActivePoint(point);
    onExamPointRevealed(point);

    if (point.soundType) {
      if (point.soundType === 'heart_normal') medicalAudio.playHeartSound(false);
      if (point.soundType === 'heart_murmur') medicalAudio.playHeartSound(true);
      if (point.soundType === 'lung_crackles') medicalAudio.playRespiratorySound('lung_crackles');
      if (point.soundType === 'lung_wheeze') medicalAudio.playRespiratorySound('lung_wheeze');
      if (point.soundType === 'lung_vesicular') medicalAudio.playRespiratorySound('lung_vesicular');
    }

    const reactionText = language === 'my' ? (point.patientReaction_my || point.patientReaction) : point.patientReaction;
    if (reactionText) {
      onPatientSpokenResponse(reactionText, point.gestureOnAction || 'nodding');
    }
  };

  const getBadge = (tech: ExamTechnique) => {
    switch (tech) {
      case 'auscultation':
        return { label: 'Auscultation', icon: <Stethoscope className="w-3.5 h-3.5" />, color: 'bg-blue-50 text-ios-blue border-blue-200' };
      case 'palpation':
        return { label: 'Palpation', icon: <Hand className="w-3.5 h-3.5" />, color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'percussion':
        return { label: 'Percussion', icon: <Activity className="w-3.5 h-3.5" />, color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'inspection':
        return { label: 'Inspection', icon: <Eye className="w-3.5 h-3.5" />, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
  };

  const patientName = language === 'my' ? currentCase.patient.name_my : currentCase.patient.name;
  const systemName = language === 'my' ? (currentSystem?.name_my || currentSystem?.name) : currentSystem?.name;
  const systemSummary = language === 'my' ? (currentSystem?.summary_my || currentSystem?.summary) : currentSystem?.summary;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-6 items-start pb-safe-bottom w-full min-w-0 overflow-x-hidden">
      {/* LEFT COLUMN: ANIMATED PATIENT & WAVEFORM (5 Cols on iPad/Desktop) */}
      <div className="md:col-span-5 space-y-3 sm:space-y-4 md:sticky md:top-24 w-full min-w-0">
        <AnimatedPatient
          name={patientName}
          age={currentCase.patient.age}
          chiefComplaint={language === 'my' ? currentCase.patient.chiefComplaint_my : currentCase.patient.chiefComplaint}
          gesture={currentGesture}
          speechState={speechState}
          painScore={currentCase.vitals.painScore}
          heartRate={currentCase.vitals.hr}
        />

        <AudioWaveform
          speechState={speechState}
          isPushToTalkActive={false}
        />

        {/* System Overview Card */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-md">
          <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-ios-blue block mb-1">
            {t.systemExam}
          </span>
          <h4 className="text-base sm:text-lg font-black text-slate-900">
            {systemName}
          </h4>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {systemSummary}
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: INTERACTIVE EXAMINATION STAGE (7 Cols on iPad/Desktop) */}
      <div className="md:col-span-7 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-md p-3.5 sm:p-6 md:p-8 space-y-4 sm:space-y-6 w-full min-w-0 overflow-hidden">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
            {t.bedsideManeuvers}
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900">
            {t.selectLandmark}
          </h3>
        </div>

        {/* Maneuvers Cards List */}
        <div className="grid grid-cols-1 gap-3">
          {currentSystem?.points.map((pt) => {
            const isSelected = activePoint?.id === pt.id;
            const badge = getBadge(pt.technique);
            const ptName = language === 'my' ? (pt.name_my || pt.name) : pt.name;
            const ptAction = language === 'my' ? (pt.actionLabel_my || pt.actionLabel) : pt.actionLabel;

            return (
              <button
                key={pt.id}
                onClick={() => handlePerformExam(pt)}
                className={`w-full p-4 sm:p-5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-blue-50/70 border-ios-blue ring-2 ring-ios-blue/20 shadow-md scale-[1.01]'
                    : 'bg-white hover:bg-slate-50 border-slate-200/80 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold border ${badge.color}`}
                  >
                    {badge.icon}
                  </div>
                  <div>
                    <span className="text-sm sm:text-base font-extrabold text-slate-900 block">
                      {ptName}
                    </span>
                    <span className="text-xs text-slate-500 font-normal">
                      {ptAction}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {pt.revealed && (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t.examined}</span>
                    </span>
                  )}
                  {pt.soundType && (
                    <span className="px-3 py-1 rounded-full bg-sky-50 text-ios-blue text-xs font-bold border border-sky-200 flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Audio</span>
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Big Finding Report Box */}
        {activePoint ? (
          <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-50/60 via-white to-slate-50 border border-blue-200 shadow-md space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-ios-blue">
                {t.clinicalFinding}
              </span>
              {activePoint.soundType && (
                <button
                  onClick={() => {
                    medicalAudio.playHapticTap();
                    if (activePoint.soundType === 'heart_normal') medicalAudio.playHeartSound(false);
                    if (activePoint.soundType === 'heart_murmur') medicalAudio.playHeartSound(true);
                    if (activePoint.soundType === 'lung_crackles') medicalAudio.playRespiratorySound('lung_crackles');
                    if (activePoint.soundType === 'lung_wheeze') medicalAudio.playRespiratorySound('lung_wheeze');
                  }}
                  className="px-4 py-2 rounded-full bg-ios-blue text-white text-xs font-bold hover:bg-blue-600 transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{t.replayAudio}</span>
                </button>
              )}
            </div>

            <h4 className="text-lg font-black text-slate-900">
              {language === 'my' ? (activePoint.name_my || activePoint.name) : activePoint.name}
            </h4>

            <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm text-sm sm:text-base text-slate-800 leading-relaxed font-medium">
              {language === 'my' ? (activePoint.finding_my || activePoint.finding) : activePoint.finding}
            </div>

            {(activePoint.patientReaction || activePoint.patientReaction_my) && (
              <p className="text-xs sm:text-sm text-slate-600 italic">
                {t.patientResponse} "{language === 'my' ? (activePoint.patientReaction_my || activePoint.patientReaction) : activePoint.patientReaction}"
              </p>
            )}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-3xl border border-slate-200 text-slate-500">
            {t.selectLandmark}
          </div>
        )}
      </div>
    </div>
  );
};
