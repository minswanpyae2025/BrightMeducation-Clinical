import React from 'react';
import { Investigation } from '../types';
import {
  FileText,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Layers,
} from 'lucide-react';
import { medicalAudio } from '../utils/audioSimulator';

interface InvestigationsViewProps {
  investigations: Investigation[];
  onOrderInvestigation: (id: string) => void;
}

export const InvestigationsView: React.FC<InvestigationsViewProps> = ({
  investigations,
  onOrderInvestigation,
}) => {
  return (
    <div className="flex flex-col h-full bg-white rounded-ios-xl border border-slate-100 shadow-ios-md overflow-hidden">
      {/* Top Header */}
      <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-ios-blue flex items-center justify-center font-bold">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Diagnostic Investigations Pad
            </h3>
            <p className="text-[11px] text-slate-500">
              Request emergency ECG, laboratory biomarkers, and bedside imaging
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-ios-pill bg-blue-50 text-ios-blue text-xs font-semibold border border-blue-200 shadow-ios-sm">
          {investigations.filter((i) => i.ordered && i.status === 'ready').length} / {investigations.length} Ready
        </span>
      </div>

      {/* Main Investigations List */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {investigations.map((inv) => {
            return (
              <div
                key={inv.id}
                className={`p-4 rounded-ios-lg border transition-all ${
                  inv.ordered
                    ? inv.status === 'ready'
                      ? 'bg-white border-blue-200/80 shadow-ios-md'
                      : 'bg-slate-50/70 border-slate-200'
                    : 'bg-slate-50/40 border-slate-100 hover:border-slate-300'
                }`}
              >
                {/* Header & Order Button */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {inv.category.toUpperCase()}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      {inv.name}
                    </h4>
                  </div>

                  {!inv.ordered ? (
                    <button
                      onClick={() => {
                        medicalAudio.playHapticTap();
                        onOrderInvestigation(inv.id);
                      }}
                      className="px-3 py-1.5 rounded-ios-pill bg-ios-blue hover:bg-blue-600 text-white text-xs font-semibold active:scale-95 transition-all shadow-ios-sm shrink-0"
                    >
                      Request
                    </button>
                  ) : inv.status === 'pending' ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-ios-pill bg-amber-50 text-amber-700 text-xs font-medium border border-amber-200 animate-pulse shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-ios-pill bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Report Ready</span>
                    </div>
                  )}
                </div>

                {/* Report Content when ready */}
                {inv.ordered && inv.status === 'ready' && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5 animate-fadeIn">
                    {/* Visual ECG Rhythm Strip Preview if ECG */}
                    {inv.visualType === 'ecg_strip' && (
                      <div className="bg-red-50/60 p-2.5 rounded-ios-md border border-red-100 text-red-900 font-mono text-xs">
                        <div className="flex items-center justify-between text-[10px] font-bold text-red-700 mb-1">
                          <span>LEAD II RHYTHM TRACE</span>
                          <span>25mm/s | 10mm/mV</span>
                        </div>
                        {/* SVG ECG Waveform Line */}
                        <svg viewBox="0 0 300 40" className="w-full h-10 text-red-600 stroke-current fill-none">
                          <path
                            d="M 0,20 L 25,20 L 30,17 L 35,23 L 40,20 L 50,20 L 53,24 L 56,2 L 60,34 L 64,12 L 67,20 L 75,20 L 85,15 L 95,20 L 125,20 L 130,17 L 135,23 L 140,20 L 150,20 L 153,24 L 156,2 L 160,34 L 164,12 L 167,20 L 175,20 L 185,15 L 195,20 L 225,20 L 230,17 L 235,23 L 240,20 L 250,20 L 253,24 L 256,2 L 260,34 L 264,12 L 267,20 L 275,20 L 285,15 L 295,20 L 300,20"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-[10px] text-red-600 font-bold block mt-1">
                          CRITICAL: ST Elevation &gt; 3.5mm in Leads II, III, aVF
                        </span>
                      </div>
                    )}

                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-ios-md border border-slate-100">
                      {inv.resultReport}
                    </p>

                    {/* Numerical Data Points Table */}
                    {inv.dataPoints && inv.dataPoints.length > 0 && (
                      <div className="space-y-1">
                        {inv.dataPoints.map((dp, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center justify-between px-2.5 py-1 rounded text-xs ${
                              dp.isAbnormal
                                ? 'bg-rose-50 text-rose-700 font-bold border border-rose-100'
                                : 'bg-slate-50 text-slate-700'
                            }`}
                          >
                            <span>{dp.label}</span>
                            <span className="font-mono">
                              {dp.value} {dp.unit || ''} {dp.normalRange && `(Ref: ${dp.normalRange})`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
