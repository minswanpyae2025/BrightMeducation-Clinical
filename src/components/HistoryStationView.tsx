import React, { useState, useRef, useEffect } from 'react';
import { OSCECase, ChatMessage, SpeechState, AvatarGesture, Language } from '../types';
import { AnimatedPatient } from './AnimatedPatient';
import { AudioWaveform } from './AudioWaveform';
import { PushToTalkButton } from './PushToTalkButton';
import { translations } from '../locales/i18n';
import {
  Send,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { medicalAudio } from '../utils/audioSimulator';

interface HistoryStationViewProps {
  currentCase: OSCECase;
  messages: ChatMessage[];
  speechState: SpeechState;
  currentGesture: AvatarGesture;
  language: Language;
  isPushToTalkActive: boolean;
  interimTranscript: string;
  isVoiceSynthesisEnabled: boolean;
  isStreamingLive?: boolean;
  onToggleVoiceSynthesis: () => void;
  onStartPushToTalk: () => void;
  onStopPushToTalk: () => void;
  onSendMessage: (text: string) => void;
  onManualGestureChange: (gesture: AvatarGesture) => void;
}

export const HistoryStationView: React.FC<HistoryStationViewProps> = ({
  currentCase,
  messages,
  speechState,
  currentGesture,
  language,
  isPushToTalkActive,
  interimTranscript,
  isVoiceSynthesisEnabled,
  isStreamingLive = false,
  onToggleVoiceSynthesis,
  onStartPushToTalk,
  onStopPushToTalk,
  onSendMessage,
  onManualGestureChange,
}) => {
  const [inputText, setInputText] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const t = translations[language];

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

  // High Yield Clinical Prompts in Burmese & English
  const quickPrompts = language === 'my' ? [
    { label: 'နေရာ: ဘယ်နားက စအောင့်တာလဲ?', text: 'အောင့်တဲ့နေရာက အတိအကျ ဘယ်နားကလဲ ခင်ဗျာ?' },
    { label: 'စဖြစ်ချိန်: ဘယ်တုန်းက စတာလဲ?', text: 'ဘယ်အချိန်လောက်က စပြီး အောင့်တာပါလဲ? ရုတ်တရက်လား ဖြည်းဖြည်းချင်းလား?' },
    { label: 'နာကျင်မှုပုံစံ: ဘယ်လို ခံစားရလဲ?', text: 'အောင့်တာက ဘယ်လိုပုံစံမျိုး ခံစားရလဲခင်ဗျာ? ဖိထားသလိုလား၊ ထိုးစူးတာလား?' },
    { label: 'ဖြာထွက်မှု: လက်မောင်း/မေးစေ့ ရောက်လား?', text: 'နာကျင်မှုက လက်မောင်း၊ မေးစေ့ ဒါမှမဟုတ် ကျောဘက်ဆီ ဖြာထွက်တာမျိုး ရှိလားခင်ဗျာ?' },
    { label: 'တွဲဖက်လက္ခဏာ: ချွေးစေးထွက်/ပျို့အန်လား?', text: 'ချွေးစေးထွက်တာ၊ ပျို့အန်တာ ဒါမှမဟုတ် မောတာမျိုးရော ရှိပါသလား?' },
    { label: 'နာကျင်မှုပြင်းအား: ၁ မှ ၁၀ အထိ?', text: '၁ မှ ၁၀ အထိ နာကျင်မှုအတိုင်းအတာမှာ အခု ဘယ်လောက်လောက် ပြင်းထန်ပါသလဲ?' },
    { label: 'စိုးရိမ်မှု (ICE): ဘာကို အဓိက စိုးရိမ်ပါသလဲ?', text: 'ဘာရောဂါဖြစ်မှာကို အဓိက စိုးရိမ်ပူပန်နေပါသလဲခင်ဗျာ?' },
    { label: 'နှစ်သိမ့်မှု: စိတ်အေးအေးထားပါ', text: 'စိတ်မပူပါနဲ့ခင်ဗျာ၊ ကျွန်တော်တို့ အကောင်းဆုံး စမ်းသပ်ကုသပေးပါ့မယ်။' },
    { label: 'ရောဂါဟောင်း: သွေးတိုး/ဆီးချို ရှိလား?', text: 'အရင်က သွေးတိုး၊ ဆီးချို ဒါမှမဟုတ် နှလုံးရောဂါအခံ ရှိဖူးပါသလား?' },
    { label: 'မျိုးရိုး: မိသားစုမှာ နှလုံးရောဂါ ရှိလား?', text: 'မိသားစုမျိုးရိုးထဲမှာ အသက်ငယ်ငယ်နဲ့ နှလုံးဖောက်ဆုံးပါးဖူးသူ ရှိပါသလား?' },
  ] : [
    { label: 'Site: Where is the pain?', text: 'Where exactly is the pain located?' },
    { label: 'Onset: When did it start?', text: 'When did it start, and was it sudden or gradual?' },
    { label: 'Character: Describe sensation', text: 'Can you describe the pain? What does it feel like?' },
    { label: 'Radiation: Travels to arm/jaw?', text: 'Does the pain radiate anywhere, like your arm, back, or jaw?' },
    { label: 'Associated: Sweating/nausea?', text: 'Do you feel sweaty, nauseous, or short of breath?' },
    { label: 'Severity: Score out of 10', text: 'On a scale of 1 to 10, how bad is the pain right now?' },
    { label: 'ICE: What are you worried about?', text: 'What is your main concern or worry about what this is?' },
    { label: 'Empathy: Reassure patient', text: 'I understand this is very distressing, and we are going to take good care of you.' },
    { label: 'Past Medical: Conditions?', text: 'Do you have any past medical conditions like high blood pressure or diabetes?' },
    { label: 'Family History: Cardiac events?', text: 'Has anyone in your immediate family had heart problems or passed away young?' },
  ];

  const patientName = language === 'my' ? currentCase.patient.name_my : currentCase.patient.name;

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
          isPushToTalkActive={isPushToTalkActive}
        />

        {/* Gesture Manual Bar */}
        <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-2">
          <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            {t.patientPosture}
          </span>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'clutch_chest', label: language === 'my' ? 'ရင်ဘတ်' : 'Chest' },
              { id: 'short_of_breath', label: language === 'my' ? 'မော' : 'Breath' },
              { id: 'wincing', label: language === 'my' ? 'နာကျင်' : 'Wince' },
              { id: 'holding_abdomen', label: language === 'my' ? 'ဗိုက်' : 'Abdo' },
              { id: 'rub_temple', label: language === 'my' ? 'ခေါင်း' : 'Head' },
              { id: 'nodding', label: language === 'my' ? 'ခေါင်းညိတ်' : 'Nod' },
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => {
                  medicalAudio.playHapticTap();
                  onManualGestureChange(g.id as AvatarGesture);
                }}
                className={`px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold transition-all shrink-0 ${
                  currentGesture === g.id
                    ? 'bg-ios-blue text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: CLEAN CONVERSATION & PUSH TO TALK (7 Cols on iPad/Desktop) */}
      <div className="md:col-span-7 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-md flex flex-col h-[520px] sm:h-[600px] md:h-[calc(100dvh-7rem)] overflow-hidden w-full min-w-0">
        {/* Top Chat Bar */}
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900">
                {t.liveDialogue}
              </h3>
              {isStreamingLive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  ⚡ Live Stream
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-ios-blue text-[10px] font-bold border border-blue-100">
                  ⚡ Cloud Voice
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {t.listeningYou}
            </p>
          </div>

          <button
            onClick={() => {
              medicalAudio.playHapticTap();
              onToggleVoiceSynthesis();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
              isVoiceSynthesisEnabled
                ? 'bg-blue-50 text-ios-blue border-blue-200 shadow-sm'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            {isVoiceSynthesisEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{isVoiceSynthesisEnabled ? t.voiceOn : t.voiceOff}</span>
          </button>
        </div>

        {/* Message Stream */}
        <div
          ref={chatScrollRef}
          className="flex-1 min-h-0 p-3 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4 bg-gradient-to-b from-slate-50/30 to-white"
        >
          {messages.map((msg) => {
            const isCandidate = msg.sender === 'candidate';

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  isCandidate ? 'justify-end' : 'justify-start'
                }`}
              >
                {!isCandidate && (
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-ios-blue font-bold text-sm flex items-center justify-center shrink-0 border border-blue-200 shadow-sm mt-0.5">
                    {patientName.charAt(0)}
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-3xl p-4 sm:p-5 shadow-sm transition-all ${
                    isCandidate
                      ? 'bg-ios-blue text-white rounded-br-md'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-md'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider ${
                        isCandidate ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {isCandidate ? (language === 'my' ? 'ဆရာဝန် (သင်)' : 'Candidate (You)') : patientName}
                    </span>
                    <span
                      className={`text-[11px] font-medium ${
                        isCandidate ? 'text-blue-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>

                  <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-medium">
                    {msg.text}
                  </p>
                </div>

                {isCandidate && (
                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Live speech preview */}
          {(interimTranscript || isPushToTalkActive) && (
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-2xl p-4 bg-blue-50 text-ios-blue border border-blue-200 text-sm animate-pulse">
                <span className="font-bold text-xs block text-blue-400 uppercase tracking-wide mb-1">
                  {t.candidateSpeaking}
                </span>
                {interimTranscript || (language === 'my' ? 'စကားသံကို နားထောင်နေပါသည်... ခလုတ်ကို လွှတ်လိုက်ပါ' : 'Listening... release button to send')}
              </div>
            </div>
          )}
        </div>

        {/* Quick Clinical Questions Bar */}
        <div className="px-4 sm:px-5 py-3 bg-slate-50 border-t border-slate-100 overflow-x-auto no-scrollbar flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0">
            {t.prompts}
          </span>
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                medicalAudio.playHapticTap();
                onSendMessage(q.text);
              }}
              className="px-3.5 py-1.5 rounded-full bg-white hover:bg-blue-50 text-slate-700 hover:text-ios-blue border border-slate-200 text-xs font-semibold shrink-0 active:scale-95 transition-all shadow-sm"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Big Push-to-Talk & Keyboard Input Bar */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200/80 space-y-3 pb-6 sm:pb-5">
          <PushToTalkButton
            isPushToTalkActive={isPushToTalkActive}
            onStart={onStartPushToTalk}
            onStop={onStopPushToTalk}
          />

          {/* Text Input Row */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t.typeQuestionPlaceholder}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ios-blue/20 focus:border-ios-blue transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="w-12 h-12 rounded-2xl bg-ios-blue text-white flex items-center justify-center hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-40 shadow-sm shrink-0"
              title="Send"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
