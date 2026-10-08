import React, { useState } from 'react';
import { MainCategory, SubCategory, OSCECase, Language } from '../types';
import { translations } from '../locales/i18n';
import {
  Heart,
  Wind,
  Activity,
  Brain,
  MessageSquare,
  Stethoscope,
  Clock,
  ArrowRight,
  ShieldCheck,
  Coins,
} from 'lucide-react';
import { medicalAudio } from '../utils/audioSimulator';

interface CategoryHubProps {
  cases: OSCECase[];
  userCredits: number;
  language: Language;
  onSelectStation: (station: OSCECase) => void;
  onOpenCreditsModal: () => void;
}

export const CategoryHub: React.FC<CategoryHubProps> = ({
  cases,
  userCredits,
  language,
  onSelectStation,
  onOpenCreditsModal,
}) => {
  const [selectedMainCategory, setSelectedMainCategory] =
    useState<MainCategory>('history_taking');
  const [selectedSubCategory, setSelectedSubCategory] =
    useState<SubCategory>('cvs');

  const t = translations[language];

  // Filter stations by Main Category & Sub Category
  const filteredCases = cases.filter(
    (c) =>
      c.mainCategory === selectedMainCategory &&
      c.subCategory === selectedSubCategory
  );

  const subCategories: { id: SubCategory; label: string; fullLabel: string; icon: React.ReactNode }[] = [
    {
      id: 'cvs',
      label: t.cvsTitle,
      fullLabel: t.cvsSub,
      icon: <Heart className="w-5 h-5 text-rose-500" />,
    },
    {
      id: 'respi',
      label: t.respiTitle,
      fullLabel: t.respiSub,
      icon: <Wind className="w-5 h-5 text-sky-500" />,
    },
    {
      id: 'abdomen',
      label: t.abdoTitle,
      fullLabel: t.abdoSub,
      icon: <Activity className="w-5 h-5 text-emerald-500" />,
    },
    {
      id: 'cns',
      label: t.cnsTitle,
      fullLabel: t.cnsSub,
      icon: <Brain className="w-5 h-5 text-purple-500" />,
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-1 sm:px-4 py-4 sm:py-8 space-y-6 sm:space-y-8 select-none pb-safe-bottom overflow-x-hidden min-w-0">
      {/* Big Apple-Style Hero Header */}
      <div className="text-center space-y-2 px-1 max-w-full">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-ios-blue text-xs sm:text-sm font-bold border border-blue-200 shadow-xs max-w-full truncate">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{t.appSubtitle}</span>
        </div>
        <h1 className="text-xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-snug break-words px-1">
          {t.selectClinicalStation}
        </h1>
        <p className="text-xs sm:text-base text-slate-500 max-w-2xl mx-auto font-normal leading-relaxed px-1 break-words">
          {t.categoryHeroSubtitle}
        </p>
      </div>

      {/* 1. BIG TWO-CATEGORY SWITCHER (History Taking vs Physical Examination) */}
      <div className="w-full bg-slate-100/90 p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl grid grid-cols-2 gap-1.5 sm:gap-2.5 border border-slate-200/60 shadow-inner max-w-2xl mx-auto">
        <button
          onClick={() => {
            medicalAudio.playHapticTap();
            setSelectedMainCategory('history_taking');
          }}
          className={`min-w-0 w-full py-2.5 sm:py-4 px-2 sm:px-6 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 transition-all duration-200 overflow-hidden ${
            selectedMainCategory === 'history_taking'
              ? 'bg-white text-ios-blue shadow-md font-extrabold border border-slate-100 scale-[1.01]'
              : 'text-slate-600 hover:text-slate-900 font-semibold'
          }`}
        >
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
            selectedMainCategory === 'history_taking' ? 'bg-blue-50 text-ios-blue' : 'bg-slate-200/60 text-slate-600'
          }`}>
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          </div>
          <div className="text-center sm:text-left min-w-0 w-full">
            <span className="text-xs sm:text-base font-bold block leading-tight break-words text-center sm:text-left">
              {t.historyTaking}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-normal hidden sm:block truncate">
              {t.historyTakingSub}
            </span>
          </div>
        </button>

        <button
          onClick={() => {
            medicalAudio.playHapticTap();
            setSelectedMainCategory('physical_examination');
          }}
          className={`min-w-0 w-full py-2.5 sm:py-4 px-2 sm:px-6 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 transition-all duration-200 overflow-hidden ${
            selectedMainCategory === 'physical_examination'
              ? 'bg-white text-ios-blue shadow-md font-extrabold border border-slate-100 scale-[1.01]'
              : 'text-slate-600 hover:text-slate-900 font-semibold'
          }`}
        >
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
            selectedMainCategory === 'physical_examination' ? 'bg-blue-50 text-ios-blue' : 'bg-slate-200/60 text-slate-600'
          }`}>
            <Stethoscope className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          </div>
          <div className="text-center sm:text-left min-w-0 w-full">
            <span className="text-xs sm:text-base font-bold block leading-tight break-words text-center sm:text-left">
              {t.physicalExam}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 font-normal hidden sm:block truncate">
              {t.physicalExamSub}
            </span>
          </div>
        </button>
      </div>

      {/* 2. BIG SUB-CATEGORY SELECTOR: CVS, Respi, Abdomen, CNS */}
      <div className="w-full">
        <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 text-center mb-2.5 sm:mb-3">
          {t.selectClinicalSystem}
        </div>
        <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-3xl mx-auto">
          {subCategories.map((sub) => {
            const isSelected = selectedSubCategory === sub.id;

            return (
              <button
                key={sub.id}
                onClick={() => {
                  medicalAudio.playHapticTap();
                  setSelectedSubCategory(sub.id);
                }}
                className={`min-w-0 w-full p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border text-center transition-all duration-200 flex flex-col items-center justify-center gap-1 sm:gap-2 overflow-hidden ${
                  isSelected
                    ? 'bg-white border-ios-blue ring-2 ring-ios-blue/20 shadow-md scale-[1.02]'
                    : 'bg-white/90 hover:bg-white border-slate-200/80 shadow-sm'
                }`}
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${
                  isSelected ? 'bg-blue-50' : 'bg-slate-50'
                }`}>
                  {sub.icon}
                </div>
                <div className="w-full min-w-0 text-center">
                  <span className={`text-xs sm:text-base font-extrabold block truncate leading-tight ${
                    isSelected ? 'text-ios-blue' : 'text-slate-800'
                  }`}>
                    {sub.label}
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-500 font-medium truncate block mt-0.5">
                    {sub.fullLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. BIG STATION CARDS */}
      <div className="w-full space-y-3 sm:space-y-4 max-w-3xl mx-auto min-w-0">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t.availableStations} ({filteredCases.length})
          </span>
          <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-600 font-semibold bg-white px-2.5 py-1 rounded-full border border-slate-200 shadow-sm shrink-0">
            <span>{t.creditsPerStation}</span>
          </div>
        </div>

        {filteredCases.length === 0 ? (
          <div className="p-8 sm:p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500">
            {t.noStationsFound}
          </div>
        ) : (
          filteredCases.map((c) => {
            const canAfford = userCredits >= c.creditsCost;
            const stationTitle = language === 'my' ? c.title_my : c.title;
            const stationSubtitle = language === 'my' ? c.subtitle_my : c.subtitle;
            const patientName = language === 'my' ? c.patient.name_my : c.patient.name;
            const chiefComplaint = language === 'my' ? c.patient.chiefComplaint_my : c.patient.chiefComplaint;

            return (
              <div
                key={c.id}
                className="w-full bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200/90 shadow-md hover:shadow-lg transition-all space-y-3 sm:space-y-4 overflow-hidden min-w-0"
              >
                {/* Station Top Badges */}
                <div className="flex items-start justify-between gap-2 sm:gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-blue-50 text-ios-blue text-[11px] sm:text-xs font-bold border border-blue-100">
                        {c.subCategory.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] sm:text-xs font-medium">
                        {c.difficulty}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-2xl font-black text-slate-900 pt-0.5 sm:pt-1 leading-snug break-words">
                      {stationTitle}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2 sm:line-clamp-none break-words">
                      {stationSubtitle}
                    </p>
                  </div>

                  {/* Credits Badge */}
                  <div className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-xl sm:rounded-2xl bg-amber-50 text-amber-800 text-[11px] sm:text-xs font-extrabold border border-amber-200 flex items-center gap-1 sm:gap-1.5 shrink-0 shadow-sm">
                    <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{c.creditsCost} {t.credits}</span>
                  </div>
                </div>

                {/* Patient Preview Quote */}
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 text-ios-blue flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
                    {patientName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-800 block truncate">
                      {patientName} ({c.patient.age} {t.yearsOld})
                    </span>
                    <p className="text-[11px] sm:text-xs text-slate-600 italic truncate font-medium">
                      {chiefComplaint}
                    </p>
                  </div>
                </div>

                {/* Station Footer & CTA Button */}
                <div className="pt-1 sm:pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 shrink-0" />
                    <span>{c.durationMinutes} {t.minutes} {t.stationDuration}</span>
                  </div>

                  {canAfford ? (
                    <button
                      onClick={() => {
                        medicalAudio.playHapticTap();
                        onSelectStation(c);
                      }}
                      className="w-full sm:w-auto px-5 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-ios-blue hover:bg-blue-600 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all"
                    >
                      <span>{t.startStation} ({c.creditsCost} {t.credits})</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        medicalAudio.playHapticTap();
                        onOpenCreditsModal();
                      }}
                      className="w-full sm:w-auto px-5 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all"
                    >
                      <span>{t.needCredits}</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
