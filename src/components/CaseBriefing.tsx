import React from 'react';
import { OSCECase, Language } from '../types';
import { translations } from '../locales/i18n';
import {
  Clock,
  MapPin,
  FileCheck2,
  Heart,
  UserCheck,
  ArrowRight,
  ChevronLeft,
  Coins,
} from 'lucide-react';
import { medicalAudio } from '../utils/audioSimulator';

interface CaseBriefingProps {
  currentCase: OSCECase;
  userCredits: number;
  language: Language;
  onStartStation: () => void;
  onGoBack: () => void;
  onOpenCreditsModal: () => void;
}

export const CaseBriefing: React.FC<CaseBriefingProps> = ({
  currentCase,
  userCredits,
  language,
  onStartStation,
  onGoBack,
  onOpenCreditsModal,
}) => {
  const t = translations[language];
  const canAfford = userCredits >= currentCase.creditsCost;

  const stationTitle = language === 'my' ? currentCase.title_my : currentCase.title;
  const stationSubtitle = language === 'my' ? currentCase.subtitle_my : currentCase.subtitle;
  const patientName = language === 'my' ? currentCase.patient.name_my : currentCase.patient.name;
  const setting = language === 'my' ? currentCase.candidateBrief.setting_my : currentCase.candidateBrief.setting;
  const situation = language === 'my' ? currentCase.candidateBrief.situation_my : currentCase.candidateBrief.situation;
  const triageNote = language === 'my' ? currentCase.candidateBrief.triageNote_my : currentCase.candidateBrief.triageNote;
  const tasks = language === 'my' ? currentCase.candidateBrief.tasks_my : currentCase.candidateBrief.tasks;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10 space-y-8 select-none pb-safe-bottom">
      {/* Back Button & Station Top Tag */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            medicalAudio.playHapticTap();
            onGoBack();
          }}
          className="px-4 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 shadow-sm text-slate-700 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{t.changeStation}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full bg-blue-50 text-ios-blue text-xs font-extrabold border border-blue-200">
            {currentCase.subCategory.toUpperCase()}
          </span>
          <div className="px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 text-xs font-extrabold border border-amber-200 flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>{currentCase.creditsCost} {t.credits}</span>
          </div>
        </div>
      </div>

      {/* Main Big Briefing Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-lg space-y-8">
        {/* Title & Demographics */}
        <div className="space-y-2 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-bold">
              {currentCase.subCategory.toUpperCase()}
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              {currentCase.difficulty}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            {stationTitle}
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            {stationSubtitle}
          </p>
        </div>

        {/* Setting & Patient Profile Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 text-slate-900 text-xs font-black uppercase tracking-wider mb-2">
              <MapPin className="w-4 h-4 text-ios-blue" />
              <span>{t.clinicalSetting}</span>
            </div>
            <p className="text-sm sm:text-base text-slate-800 font-bold">
              {setting}
            </p>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {situation}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-2 text-slate-900 text-xs font-black uppercase tracking-wider mb-2">
              <UserCheck className="w-4 h-4 text-ios-blue" />
              <span>{t.patientProfile}</span>
            </div>
            <p className="text-sm sm:text-base text-slate-800 font-extrabold">
              {patientName}, {currentCase.patient.age} {t.yearsOld}
            </p>
            <p className="text-xs text-slate-500 mt-2 italic">
              {language === 'my' ? currentCase.patient.appearance_my : currentCase.patient.appearance}
            </p>
          </div>
        </div>

        {/* Triage Note & Baseline Vitals */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50/50 to-slate-50 border border-blue-100 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              {t.triageNotes}
            </span>
            <span className="text-xs text-slate-500 font-medium">{t.arrivalVitals}</span>
          </div>
          <p className="text-sm text-slate-700 font-medium leading-relaxed">
            {triageNote}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">BP</span>
              <span className="text-sm sm:text-base font-black text-slate-900">{currentCase.vitals.bp}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">HR</span>
              <span className="text-sm sm:text-base font-black text-slate-900">{currentCase.vitals.hr} bpm</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">RR</span>
              <span className="text-sm sm:text-base font-black text-slate-900">{currentCase.vitals.rr} /min</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-sm">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">SpO2</span>
              <span className="text-sm sm:text-base font-black text-slate-900">{currentCase.vitals.spo2}%</span>
            </div>
          </div>
        </div>

        {/* Specific Candidate Tasks */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-ios-blue" />
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              {t.candidateTasks}
            </h3>
          </div>
          <div className="space-y-2">
            {tasks.map((task, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm"
              >
                <div className="w-6 h-6 rounded-full bg-blue-50 text-ios-blue text-xs font-black flex items-center justify-center shrink-0 mt-0.5 border border-blue-200">
                  {idx + 1}
                </div>
                <span className="text-sm text-slate-800 font-medium leading-relaxed">
                  {task}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Big Enter Station CTA Button with Safe Bottom Padding */}
        <div className="pt-4 space-y-2">
          {canAfford ? (
            <button
              onClick={() => {
                medicalAudio.playHapticTap();
                medicalAudio.playOSCEChime(false);
                onStartStation();
              }}
              className="w-full py-5 rounded-2xl bg-ios-blue hover:bg-blue-600 active:scale-[0.98] text-white font-black text-base sm:text-lg shadow-lg flex items-center justify-center gap-3 transition-all"
            >
              <span>{t.enterRoom}</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={() => {
                medicalAudio.playHapticTap();
                onOpenCreditsModal();
              }}
              className="w-full py-5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-black text-base sm:text-lg shadow-lg flex items-center justify-center gap-3 transition-all"
            >
              <span>{t.needCredits}</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          )}

          <p className="text-xs text-center text-slate-400">
            {t.timerNote}
          </p>
        </div>
      </div>
    </div>
  );
};
