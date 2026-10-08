import React from 'react';
import { ClinicalTab } from '../types';
import {
  MessageSquare,
  Stethoscope,
  Activity,
  ClipboardCheck,
} from 'lucide-react';
import { medicalAudio } from '../utils/audioSimulator';

interface TabBarProps {
  activeTab: ClinicalTab;
  onSelectTab: (tab: ClinicalTab) => void;
  investigationsPendingCount: number;
}

export const TabBar: React.FC<TabBarProps> = ({
  activeTab,
  onSelectTab,
  investigationsPendingCount,
}) => {
  const tabs: { id: ClinicalTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'history',
      label: 'History Taking',
      icon: <MessageSquare className="w-4 h-4" />,
    },
    {
      id: 'exam',
      label: 'Physical Exam',
      icon: <Stethoscope className="w-4 h-4" />,
    },
    {
      id: 'investigations',
      label: 'Investigations',
      icon: <Activity className="w-4 h-4" />,
    },
    {
      id: 'transcript',
      label: 'Scorecard & Rubric',
      icon: <ClipboardCheck className="w-4 h-4" />,
    },
  ];

  return (
    <div className="w-full bg-white/90 backdrop-blur-md border-b sm:border border-slate-200/80 sm:rounded-ios-xl p-1.5 shadow-ios-sm select-none">
      <div className="grid grid-cols-4 gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                medicalAudio.playHapticTap();
                onSelectTab(tab.id);
              }}
              className={`py-2 px-1 sm:px-3 rounded-ios-lg text-xs font-semibold flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all duration-200 relative ${
                isActive
                  ? 'bg-blue-50 text-ios-blue shadow-ios-sm font-bold border border-blue-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span className={isActive ? 'text-ios-blue' : 'text-slate-500'}>
                {tab.icon}
              </span>
              <span className="text-[11px] sm:text-xs truncate">{tab.label}</span>

              {/* Badge on investigations if new results */}
              {tab.id === 'investigations' && investigationsPendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
