import React, { useEffect } from 'react';
import { OSCECase, ChatMessage, RubricItem, Language } from '../types';
import { translations } from '../locales/i18n';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  FileText,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  ShieldCheck,
} from 'lucide-react';
import { medicalAudio } from '../utils/audioSimulator';

interface PostExamFeedbackProps {
  currentCase: OSCECase;
  messages: ChatMessage[];
  rubric: RubricItem[];
  language: Language;
  onRestartStation: () => void;
  onReturnToHub: () => void;
}

export const PostExamFeedback: React.FC<PostExamFeedbackProps> = ({
  currentCase,
  messages,
  rubric,
  language,
  onRestartStation,
  onReturnToHub,
}) => {
  const t = translations[language];

  const totalWeight = rubric.reduce((acc, item) => acc + item.weight, 0);
  const earnedScore = rubric.reduce(
    (acc, item) => acc + (item.completed ? item.weight : 0),
    0
  );
  const scorePercent = Math.round((earnedScore / (totalWeight || 1)) * 100);

  const isPass = scorePercent >= 60;
  const isDistinction = scorePercent >= 85;

  useEffect(() => {
    if (isPass) {
      try {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.55 },
          colors: ['#007AFF', '#38B6FF', '#34C759', '#F1F5F9'],
        });
      } catch {}
    }
  }, [isPass]);

  const stationTitle = language === 'my' ? currentCase.title_my : currentCase.title;
  const patientName = language === 'my' ? currentCase.patient.name_my : currentCase.patient.name;

  return (
    <div className="w-full max-w-4xl mx-auto px-1 sm:px-4 py-4 sm:py-12 space-y-6 sm:space-y-8 select-none pb-safe-bottom overflow-x-hidden min-w-0">
      {/* Top Banner Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-12 border border-slate-200/90 shadow-xl text-center relative overflow-hidden space-y-4 sm:space-y-6 min-w-0">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-ios-blue text-xs sm:text-sm font-bold border border-blue-200 shadow-sm">
          <Award className="w-4 h-4" />
          <span>{t.examinerReport}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          {t.stationResults}
        </h1>
        <p className="text-sm sm:text-base text-slate-500 max-w-lg mx-auto">
          {stationTitle}
        </p>

        {/* Big Apple Fitness-Style Score Display */}
        <div className="py-4 flex flex-col items-center justify-center">
          <div className="text-6xl sm:text-8xl font-black text-slate-900 tracking-tight">
            {scorePercent}%
          </div>
          <span className="text-sm font-bold text-slate-400 mt-2">
            {earnedScore} of {totalWeight} {t.totalPoints}
          </span>

          <div className="mt-4">
            <span
              className={`px-5 py-2 rounded-full text-base font-extrabold shadow-sm inline-flex items-center gap-2 ${
                isDistinction
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : isPass
                  ? 'bg-blue-100 text-ios-blue border border-blue-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {isDistinction ? (
                <>
                  <ShieldCheck className="w-5 h-5" /> {t.passDistinction}
                </>
              ) : isPass ? (
                <>
                  <CheckCircle2 className="w-5 h-5" /> {t.stationPassed}
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5" /> {t.needsRevision}
                </>
              )}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={() => {
              medicalAudio.playHapticTap();
              onRestartStation();
            }}
            className="px-6 py-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 shadow-sm text-slate-800 text-sm font-black active:scale-95 transition-all flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.repeatStation}</span>
          </button>

          <button
            onClick={() => {
              medicalAudio.playHapticTap();
              onReturnToHub();
            }}
            className="px-8 py-4 rounded-2xl bg-ios-blue hover:bg-blue-600 text-white text-sm font-black shadow-md active:scale-95 transition-all flex items-center gap-2"
          >
            <span>{t.returnToHub}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid: Rubric Items & SBAR Note */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Rubric Breakdown (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-md space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <ClipboardList className="w-5 h-5 text-ios-blue" />
            <h2 className="text-lg font-black text-slate-900">
              {t.rubricCriteria}
            </h2>
          </div>

          <div className="space-y-3">
            {rubric.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all flex items-start gap-3 ${
                  item.completed
                    ? 'bg-emerald-50/40 border-emerald-200 text-slate-900'
                    : 'bg-slate-50/60 border-slate-200 text-slate-600'
                }`}
              >
                {item.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900">
                      {language === 'my' ? (item.title_my || item.title) : item.title}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {item.completed ? `+${item.weight} pts` : `0 pts`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {language === 'my' ? (item.criteria_my || item.criteria) : item.criteria}
                  </p>
                  {!item.completed && (
                    <p className="text-xs text-rose-600 mt-1 font-semibold bg-rose-50 p-2 rounded-xl">
                      {t.examinerTip} {language === 'my' ? (item.missedFeedback_my || item.missedFeedback) : item.missedFeedback}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnosis & SBAR Handover (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-md border-l-8 border-l-ios-blue space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              {t.workingDiagnosis}
            </span>
            <h3 className="text-xl font-black text-slate-900 leading-snug">
              {language === 'my' ? currentCase.modelSummary.primaryDiagnosis_my : currentCase.modelSummary.primaryDiagnosis}
            </h3>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 block mb-1">
                {t.differentials}
              </span>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
                {(language === 'my' ? currentCase.modelSummary.differentialDiagnoses_my : currentCase.modelSummary.differentialDiagnoses).map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* SBAR Handover Note */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-md space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-4 h-4 text-ios-blue" />
              <h3 className="text-sm font-black text-slate-900">
                {t.sbarHandover}
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl">
                <strong className="text-ios-blue uppercase text-[10px] block">Situation</strong>
                <p className="text-slate-700 mt-0.5">{currentCase.modelSummary.sbar.situation}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl">
                <strong className="text-ios-blue uppercase text-[10px] block">Background</strong>
                <p className="text-slate-700 mt-0.5">{currentCase.modelSummary.sbar.background}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl">
                <strong className="text-ios-blue uppercase text-[10px] block">Assessment</strong>
                <p className="text-slate-700 mt-0.5">{currentCase.modelSummary.sbar.assessment}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl">
                <strong className="text-ios-blue uppercase text-[10px] block">Recommendation</strong>
                <p className="text-slate-700 mt-0.5">{currentCase.modelSummary.sbar.recommendation}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript Review */}
      {messages.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">
              {t.consultationTranscript}
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {messages.length} {t.exchanges}
            </span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {messages.map((m, idx) => {
              const isCandidate = m.sender === 'candidate';

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed border ${
                    isCandidate
                      ? 'bg-blue-50/70 border-blue-100 ml-6'
                      : 'bg-white border-slate-200 mr-6 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1">
                    <span className={isCandidate ? 'text-ios-blue' : 'text-slate-800'}>
                      {isCandidate ? (language === 'my' ? 'ဆရာဝန်' : 'Candidate') : patientName}
                    </span>
                    <span>{m.timestamp}</span>
                  </div>
                  <p className="text-slate-800 font-medium">{m.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
