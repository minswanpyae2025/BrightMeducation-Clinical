import React, { useState, useRef, useEffect } from 'react';
import { OSCECase, ChatMessage, SpeechState } from '../types';
import {
  Mic,
  Send,
  User,
  HeartPulse,
  Activity,
  Smile,
  ShieldAlert,
  ChevronDown,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { medicalAudio } from '../utils/audioSimulator';

interface HistoryTakingViewProps {
  currentCase: OSCECase;
  messages: ChatMessage[];
  speechState: SpeechState;
  isPushToTalkActive: boolean;
  interimTranscript: string;
  isVoiceSynthesisEnabled: boolean;
  onToggleVoiceSynthesis: () => void;
  onStartPushToTalk: () => void;
  onStopPushToTalk: () => void;
  onSendMessage: (text: string) => void;
}

export const HistoryTakingView: React.FC<HistoryTakingViewProps> = ({
  currentCase,
  messages,
  speechState,
  isPushToTalkActive,
  interimTranscript,
  isVoiceSynthesisEnabled,
  onToggleVoiceSynthesis,
  onStartPushToTalk,
  onStopPushToTalk,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [activeCategory, setActiveCategory] = useState<'socrates' | 'ice' | 'pmh' | 'dh_sh' | 'red_flags'>('socrates');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, interimTranscript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    medicalAudio.playHapticTap();
    onSendMessage(inputText.trim());
    setInputText('');
  };

  // Structured High-Yield OSCE Questions by Category
  const socratesQuestions = [
    { label: 'Site: Where exactly is the pain?', text: 'Where exactly is the pain located?' },
    { label: 'Onset: How did it start?', text: 'When did it start, and was it sudden or gradual?' },
    { label: 'Character: Describe the sensation', text: 'What does the pain feel like? Can you describe it?' },
    { label: 'Radiation: Does it travel anywhere?', text: 'Does the pain radiate or travel anywhere, like your arm or jaw?' },
    { label: 'Associated: Sweating or nausea?', text: 'Do you feel sweaty, nauseous, or short of breath?' },
    { label: 'Timing: Constant or intermittent?', text: 'Has the pain been constant, or does it come and go?' },
    { label: 'Exacerbating: What makes it better or worse?', text: 'Does anything make the pain better or worse, like deep breaths or movement?' },
    { label: 'Severity: Score out of 10', text: 'On a scale of 1 to 10, how severe is the pain right now?' },
  ];

  const iceQuestions = [
    { label: 'Ideas: What do you think is going on?', text: 'What do you think might be causing this pain?' },
    { label: 'Concerns: What is your main fear?', text: 'What is your biggest worry or concern right now?' },
    { label: 'Empathy: Reassure the patient', text: 'I can see how much discomfort you are in, and we will take good care of you.' },
  ];

  const pmhQuestions = [
    { label: 'Past Medical: Any high BP or heart issues?', text: 'Do you have any past medical conditions like high blood pressure or diabetes?' },
    { label: 'Medications: What daily pills do you take?', text: 'What regular medications or prescriptions do you take?' },
    { label: 'Allergies: Any drug allergies?', text: 'Do you have any known allergies to medicines or foods?' },
  ];

  const shQuestions = [
    { label: 'Smoking: Do you smoke cigarettes?', text: 'Do you smoke cigarettes, and if so, how many a day?' },
    { label: 'Alcohol: Weekly alcohol intake?', text: 'How much alcohol do you drink in a typical week?' },
    { label: 'Family History: Heart attacks in family?', text: 'Is there any family history of heart attacks or sudden death at a young age?' },
  ];

  const redFlagQuestions = [
    { label: 'Aortic Dissection: Tearing back pain?', text: 'Is there any sharp tearing pain shooting through into your back?' },
    { label: 'PE: Calf pain or coughing blood?', text: 'Have you had any calf swelling or coughed up any blood?' },
    { label: 'Syncope: Any blackouts or fainting?', text: 'Did you feel lightheaded, dizzy, or lose consciousness?' },
  ];

  const getActiveQuestionSet = () => {
    switch (activeCategory) {
      case 'socrates':
        return socratesQuestions;
      case 'ice':
        return iceQuestions;
      case 'pmh':
        return pmhQuestions;
      case 'dh_sh':
        return shQuestions;
      case 'red_flags':
        return redFlagQuestions;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-ios-xl border border-slate-100 shadow-ios-md overflow-hidden">
      {/* Top Convo Header & Voice Toggle */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-ios-blue flex items-center justify-center font-bold text-xs">
            OSCE
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-800">
              Live Patient Consultation
            </h3>
            <p className="text-[11px] text-slate-500">
              Natural language speech & structured clinical questioning
            </p>
          </div>
        </div>

        {/* Voice Audio Toggle Button */}
        <button
          onClick={() => {
            medicalAudio.playHapticTap();
            onToggleVoiceSynthesis();
          }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-ios-pill text-xs font-semibold border transition-all ${
            isVoiceSynthesisEnabled
              ? 'bg-blue-50 text-ios-blue border-blue-200'
              : 'bg-slate-100 text-slate-500 border-slate-200'
          }`}
          title={isVoiceSynthesisEnabled ? 'Patient Voice Enabled' : 'Patient Voice Muted'}
        >
          {isVoiceSynthesisEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isVoiceSynthesisEnabled ? 'Voice On' : 'Voice Off'}</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={chatScrollRef}
        className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3.5 bg-gradient-to-b from-slate-50/40 via-white to-blue-50/10 min-h-[220px] max-h-[360px] sm:max-h-[420px]"
      >
        {messages.map((msg) => {
          const isCandidate = msg.sender === 'candidate';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isCandidate ? 'justify-end' : 'justify-start'}`}
            >
              {!isCandidate && (
                <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border border-sky-200">
                  {currentCase.patient.name.charAt(0)}
                </div>
              )}

              <div
                className={`max-w-[82%] sm:max-w-[75%] rounded-ios-lg p-3 sm:p-3.5 shadow-ios-sm transition-all ${
                  isCandidate
                    ? 'bg-ios-blue text-white rounded-br-sm'
                    : 'bg-white text-slate-800 border border-slate-100 rounded-bl-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider ${
                      isCandidate ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {isCandidate ? 'Doctor (You)' : currentCase.patient.name}
                  </span>
                  <span
                    className={`text-[10px] ${
                      isCandidate ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.text}
                </p>
              </div>

              {isCandidate && (
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Live speech transcription preview */}
        {(interimTranscript || isPushToTalkActive) && (
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-ios-lg p-3 bg-blue-50 text-ios-blue border border-blue-200 text-xs sm:text-sm animate-pulse">
              <span className="font-semibold text-[11px] block text-blue-400 uppercase tracking-wide">
                Candidate Speaking...
              </span>
              {interimTranscript || 'Listening to your speech... release button when done.'}
            </div>
          </div>
        )}
      </div>

      {/* Structured Category Question Filter Pills */}
      <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 overflow-x-auto no-scrollbar flex items-center gap-1.5">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
          Framework:
        </span>
        <button
          onClick={() => {
            medicalAudio.playHapticTap();
            setActiveCategory('socrates');
          }}
          className={`px-3 py-1 rounded-ios-pill text-xs font-semibold shrink-0 transition-all ${
            activeCategory === 'socrates'
              ? 'bg-ios-blue text-white shadow-ios-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          SOCRATES Pain
        </button>
        <button
          onClick={() => {
            medicalAudio.playHapticTap();
            setActiveCategory('ice');
          }}
          className={`px-3 py-1 rounded-ios-pill text-xs font-semibold shrink-0 transition-all ${
            activeCategory === 'ice'
              ? 'bg-ios-blue text-white shadow-ios-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          ICE & Empathy
        </button>
        <button
          onClick={() => {
            medicalAudio.playHapticTap();
            setActiveCategory('pmh');
          }}
          className={`px-3 py-1 rounded-ios-pill text-xs font-semibold shrink-0 transition-all ${
            activeCategory === 'pmh'
              ? 'bg-ios-blue text-white shadow-ios-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          PMH & Meds
        </button>
        <button
          onClick={() => {
            medicalAudio.playHapticTap();
            setActiveCategory('dh_sh');
          }}
          className={`px-3 py-1 rounded-ios-pill text-xs font-semibold shrink-0 transition-all ${
            activeCategory === 'dh_sh'
              ? 'bg-ios-blue text-white shadow-ios-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          Lifestyle & Family
        </button>
        <button
          onClick={() => {
            medicalAudio.playHapticTap();
            setActiveCategory('red_flags');
          }}
          className={`px-3 py-1 rounded-ios-pill text-xs font-semibold shrink-0 transition-all ${
            activeCategory === 'red_flags'
              ? 'bg-rose-500 text-white shadow-ios-sm'
              : 'bg-white text-rose-600 border border-rose-200 hover:bg-rose-50'
          }`}
        >
          Red Flags
        </button>
      </div>

      {/* Suggested Quick Tap Prompts */}
      <div className="px-3 py-2 bg-slate-50/70 border-t border-slate-100 max-h-24 overflow-y-auto no-scrollbar flex flex-wrap gap-1.5">
        {getActiveQuestionSet().map((q, idx) => (
          <button
            key={idx}
            onClick={() => {
              medicalAudio.playHapticTap();
              onSendMessage(q.text);
            }}
            className="text-left px-2.5 py-1 rounded-ios-pill bg-white hover:bg-blue-50 text-slate-700 hover:text-ios-blue border border-slate-200/80 text-[11px] font-medium active:scale-95 transition-all shadow-ios-sm"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* Bottom Live Interaction Bar: Push to Talk & Text Input */}
      <div className="p-3 bg-white border-t border-slate-100 space-y-2">
        {/* Push-to-Talk Big Tactile Pill Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onMouseDown={onStartPushToTalk}
            onMouseUp={onStopPushToTalk}
            onTouchStart={onStartPushToTalk}
            onTouchEnd={onStopPushToTalk}
            className={`flex-1 py-3 px-4 rounded-ios-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all select-none shadow-ios-sm ${
              isPushToTalkActive
                ? 'bg-rose-500 text-white scale-[0.98] ring-4 ring-rose-200 animate-pulse'
                : 'bg-blue-50 hover:bg-blue-100 text-ios-blue border border-blue-200 active:scale-95'
            }`}
          >
            <Mic className={`w-4 h-4 ${isPushToTalkActive ? 'animate-bounce text-white' : 'text-ios-blue'}`} />
            <span>
              {isPushToTalkActive ? 'RELEASE TO SEND AUDIO' : 'HOLD TO TALK (PUSH-TO-TALK)'}
            </span>
          </button>
        </div>

        {/* Text Input Row */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Or type clinical question..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-ios-lg px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ios-blue/20 focus:border-ios-blue transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="w-10 h-10 rounded-ios-lg bg-ios-blue text-white flex items-center justify-center hover:bg-blue-600 disabled:opacity-40 disabled:hover:bg-ios-blue active:scale-95 transition-all shadow-ios-sm"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
