import React, { useState } from 'react';
import { supabaseService, UserProfile } from '../lib/supabase';
import { Language } from '../types';
import { translations } from '../locales/i18n';
import {
  X,
  Coins,
  ShieldCheck,
  Zap,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { medicalAudio } from '../utils/audioSimulator';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  language: Language;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  language,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const t = translations[language];

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    medicalAudio.playHapticTap();
    setIsSubmitting(true);
    await supabaseService.signInWithGoogle();
    setIsSubmitting(false);
    onClose();
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    medicalAudio.playHapticTap();
    setIsSubmitting(true);
    await supabaseService.signInWithEmail(emailInput.trim());
    setIsSubmitting(false);
    onClose();
  };

  const handleSyncCredits = async () => {
    medicalAudio.playHapticTap();
    setIsSyncing(true);
    try {
      await supabaseService.refreshProfile();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 2500);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-white rounded-3xl max-w-md w-full border border-slate-100 shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-blue-50/40 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-ios-blue flex items-center justify-center font-bold border border-blue-100 shadow-sm">
              <Zap className="w-5 h-5 text-ios-blue" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {t.accountTitle}
              </h3>
              <p className="text-xs text-slate-500">
                {t.creditsExplanation}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              medicalAudio.playHapticTap();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* User Profile Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/50 to-slate-50 border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-ios-blue text-white flex items-center justify-center font-extrabold text-lg shadow-md">
                {userProfile.full_name?.charAt(0) || 'D'}
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {userProfile.full_name}
                </h4>
                <p className="text-xs text-slate-500">{userProfile.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {userProfile.is_logged_in ? t.loggedIn : t.guest}
                  </span>
                  <span className="text-xs font-semibold text-slate-600">
                    {userProfile.credits} {t.credits}
                  </span>
                </div>
              </div>
            </div>

            {userProfile.is_logged_in && (
              <button
                onClick={() => {
                  medicalAudio.playHapticTap();
                  supabaseService.signOut();
                }}
                className="text-xs text-slate-500 hover:text-rose-600 font-medium underline"
              >
                {t.signOut}
              </button>
            )}
          </div>

          {/* Credits Balance Showcase (Strictly Supabase Managed) */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-50 to-sky-100/40 border border-blue-200/60 text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              {t.creditsBalance}
            </span>
            <div className="text-5xl font-black text-ios-blue">
              {userProfile.credits}
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-blue-200 text-[11px] font-bold text-slate-700 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-ios-blue" />
              <span>{language === 'my' ? 'Supabase မှ တိုက်ရိုက်ထိန်းချုပ်ထားသည် (၁ ခန်း ၂၀ Credits)' : 'Verified by Supabase (20 Credits / station)'}</span>
            </div>
            <p className="text-xs text-slate-600">
              {t.creditsExplanation}
            </p>
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={handleSyncCredits}
                disabled={isSyncing}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 shadow-sm flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {syncSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-700">{language === 'my' ? 'ချိတ်ဆက်ပြီးပါပြီ' : 'Synced'}</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className={`w-3.5 h-3.5 text-ios-blue ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{language === 'my' ? 'Supabase မှ အမှတ်စစ်ဆေးမည်' : 'Sync Supabase Balance'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Google Sign In */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full py-4 px-4 rounded-2xl bg-white hover:bg-slate-50 active:scale-[0.98] border border-slate-200 shadow-sm text-slate-800 font-bold text-sm flex items-center justify-center gap-3 transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{t.signInGoogle}</span>
            </button>

            <form onSubmit={handleEmailSignIn} className="space-y-2 pt-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="candidate@hospital.com"
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ios-blue/20 focus:border-ios-blue transition-all"
              />
              <button
                type="submit"
                disabled={!emailInput.trim() || isSubmitting}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-bold text-xs shadow-sm transition-all disabled:opacity-40"
              >
                {t.sendLink}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
