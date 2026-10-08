import React from 'react';
import { RubricItem } from '../types';
import { CheckCircle2, Circle, ClipboardList, ShieldAlert } from 'lucide-react';

interface LiveScorecardProps {
  rubric: RubricItem[];
  onToggleRubricItem?: (id: string) => void;
}

export const LiveScorecard: React.FC<LiveScorecardProps> = ({ rubric }) => {
  const total = rubric.length;
  const completedCount = rubric.filter((r) => r.completed).length;
  const percent = Math.round((completedCount / (total || 1)) * 100);

  return (
    <div className="flex flex-col h-full bg-white rounded-ios-xl border border-slate-100 shadow-ios-md overflow-hidden">
      {/* Top Header */}
      <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-ios-blue flex items-center justify-center font-bold">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Live Station Checklist & Rubric
            </h3>
            <p className="text-[11px] text-slate-500">
              Auto-tracked as you elicit clinical history and signs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700 font-mono">
            {completedCount} / {total} Completed ({percent}%)
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-1.5">
        <div
          className="bg-ios-blue h-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Rubric List */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {rubric.map((item) => (
          <div
            key={item.id}
            className={`p-3.5 rounded-ios-lg border transition-all flex items-start gap-3 ${
              item.completed
                ? 'bg-emerald-50/40 border-emerald-200'
                : 'bg-white border-slate-100 hover:border-slate-200'
            }`}
          >
            {item.completed ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <Circle className="w-5 h-5 text-slate-300 shrink-0 mt-0.5" />
            )}

            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900">
                  {item.title}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-ios-pill bg-slate-100 text-slate-600">
                  {item.domain}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {item.criteria}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
