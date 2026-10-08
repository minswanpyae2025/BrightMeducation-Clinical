import { useState, useEffect, useRef, useCallback } from 'react';
import { OSCECase, ChatMessage, AvatarGesture, SpeechState, Language } from '../types';
import { medicalAudio } from '../utils/audioSimulator';

interface UseVoiceConvoProps {
  currentCase: OSCECase;
  language: Language;
  onRubricItemScored: (rubricId: string) => void;
  onGestureChange: (gesture: AvatarGesture) => void;
}

export const useVoiceConvo = ({
  currentCase,
  language,
  onRubricItemScored,
  onGestureChange,
}: UseVoiceConvoProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [speechState, setSpeechState] = useState<SpeechState>('idle');
  const [isPushToTalkActive, setIsPushToTalkActive] = useState(false);
  const [isVoiceSynthesisEnabled, setIsVoiceSynthesisEnabled] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [audioStreamUri, setAudioStreamUri] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Initialize SpeechSynthesis and SpeechRecognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis || null;

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        // Support Burmese and English input
        recognition.lang = language === 'my' ? 'my-MM' : 'en-US';

        recognition.onstart = () => {
          setSpeechState('listening');
        };

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              handleCandidateUtterance(transcript);
              setInterimTranscript('');
            } else {
              currentInterim += transcript;
            }
          }
          setInterimTranscript(currentInterim);
        };

        recognition.onerror = () => {
          setIsPushToTalkActive(false);
          setSpeechState('idle');
        };

        recognition.onend = () => {
          setIsPushToTalkActive(false);
          setSpeechState((prev) => (prev === 'speaking' ? 'speaking' : 'idle'));
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, [language]);

  // Play Audio from Google Cloud TTS endpoint or Browser Speech Synthesis
  const playPatientVoice = useCallback(
    async (text: string, gesture?: AvatarGesture) => {
      if (!isVoiceSynthesisEnabled) {
        setSpeechState('idle');
        if (gesture) onGestureChange(gesture);
        return;
      }

      setSpeechState('speaking');
      if (gesture) onGestureChange(gesture);

      // 1. Try on-demand Google Cloud TTS endpoint
      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            languageCode: language === 'my' ? 'my-MM' : 'en-US',
            gender: currentCase.patient.gender === 'female' ? 'FEMALE' : 'MALE',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.audioUri) {
            if (audioPlayerRef.current) {
              audioPlayerRef.current.pause();
            }
            const audio = new Audio(data.audioUri);
            audioPlayerRef.current = audio;
            audio.onended = () => {
              setSpeechState('idle');
              onGestureChange(currentCase.patient.defaultGesture);
            };
            audio.onerror = () => {
              fallbackBrowserSpeak(text, gesture);
            };
            await audio.play();
            return;
          }
        }
      } catch {
        // Fall through to browser synthesis
      }

      // 2. Fallback Browser Speech Synthesis
      fallbackBrowserSpeak(text, gesture);
    },
    [currentCase, isVoiceSynthesisEnabled, language, onGestureChange]
  );

  const fallbackBrowserSpeak = (text: string, gesture?: AvatarGesture) => {
    if (!synthRef.current) {
      setSpeechState('idle');
      return;
    }

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'my' ? 'my-MM' : 'en-US';
    utterance.pitch = currentCase.patient.voicePitch || 1.0;
    utterance.rate = currentCase.patient.voiceRate || 0.95;

    utterance.onstart = () => {
      setSpeechState('speaking');
      if (gesture) onGestureChange(gesture);
    };

    utterance.onend = () => {
      setSpeechState('idle');
      onGestureChange(currentCase.patient.defaultGesture);
    };

    utterance.onerror = () => {
      setSpeechState('idle');
      onGestureChange(currentCase.patient.defaultGesture);
    };

    synthRef.current.speak(utterance);
  };

  // Process candidate utterance through Google Cloud Gemini Flash Brain
  const handleCandidateUtterance = useCallback(
    async (candidateText: string) => {
      const clean = candidateText.trim();
      if (!clean) return;

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      // 1. Add Candidate Message
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}-cand`,
        sender: 'candidate',
        text: clean,
        timestamp: timeStr,
      };

      setMessages((prev) => [...prev, userMsg]);
      setSpeechState('processing');

      // Prepare strict case template for zero-hallucination ground truth
      const stationTemplate = {
        patientName: currentCase.patient.name,
        patientName_my: currentCase.patient.name_my,
        age: currentCase.patient.age,
        chiefComplaint: currentCase.patient.chiefComplaint,
        chiefComplaint_my: currentCase.patient.chiefComplaint_my,
        socrates: currentCase.scriptTriggers.reduce((acc: any, trig) => {
          acc[trig.triggers[0]] = { en: trig.response, my: trig.response_my, gesture: trig.gesture };
          return acc;
        }, {}),
        pmh: { en: 'Hypertension and dyslipidemia', my: 'သွေးတိုးနှင့် သွေးတွင်းအဆီဓာတ်များ' },
        medications: { en: 'Amlodipine 5mg', my: 'Amlodipine ၅ မီလီဂရမ်' },
        allergies: { en: 'No known drug allergies', my: 'ဓာတ်မတည့်သည့် ဆေးဝါးမရှိ' },
        familyHistory: { en: 'Father died of MI at 52', my: 'ဖခင် အသက် ၅၂ တွင် နှလုံးဖောက်ဆုံးပါး' },
        lifestyle: { en: 'Smokes 15 cigarettes/day for 30 years', my: 'ဆေးလိပ် ၁၅ လိပ် အနှစ် ၃၀ သောက်' },
        ice: { en: 'Fears fatal heart attack like his father', my: 'ဖခင်ကဲ့သို့ နှလုံးဖောက်သေဆုံးမည်ကို ကြောက်ရွံ့' },
        redFlags: { en: 'No tearing back pain, no hemoptysis', my: 'ကျောဘက်ထိုးအောင့်ခြင်းမရှိ၊ သွေးအန်ခြင်းမရှိ' },
      };

      try {
        // Call Google Cloud Gemini Flash Edge Serverless Function
        const response = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateText: clean,
            language,
            stationId: currentCase.id,
            stationTemplate,
            history: messages.map((m) => ({ sender: m.sender, text: m.text })),
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const replyText = language === 'my' ? result.replyBurmese : result.replyEnglish;
          const replyGesture = result.gesture || currentCase.patient.defaultGesture;

          if (result.rubricMatched) {
            onRubricItemScored(result.rubricMatched);
          }

          const patientMsg: ChatMessage = {
            id: `msg-${Date.now()}-patient`,
            sender: 'patient',
            text: replyText,
            textBurmese: result.replyBurmese,
            timestamp: timeStr,
            gesture: replyGesture,
          };

          setMessages((prev) => [...prev, patientMsg]);
          playPatientVoice(replyText, replyGesture);
          return;
        }
      } catch (err) {
        console.warn('API chat fallback:', err);
      }

      // Local Deterministic Fallback if serverless API is offline
      const matchedTrigger = currentCase.scriptTriggers.find((t) =>
        t.triggers.some((k) => clean.toLowerCase().includes(k.toLowerCase()))
      );

      const fallbackBurmese = matchedTrigger
        ? matchedTrigger.response_my
        : 'ဆရာ... ကျွန်တော့် ရင်ဘတ်က အောင့်ပြီး တင်းကျပ်နေတာ မသက်သာသေးဘူး...';
      const fallbackEnglish = matchedTrigger
        ? matchedTrigger.response
        : 'Doctor, my chest tightness is still very painful...';
      const fallbackGesture = matchedTrigger?.gesture || currentCase.patient.defaultGesture;

      if (matchedTrigger?.rubricId) {
        onRubricItemScored(matchedTrigger.rubricId);
      }

      const displayText = language === 'my' ? fallbackBurmese : fallbackEnglish;

      setTimeout(() => {
        const patientMsg: ChatMessage = {
          id: `msg-${Date.now()}-patient`,
          sender: 'patient',
          text: displayText,
          textBurmese: fallbackBurmese,
          timestamp: timeStr,
          gesture: fallbackGesture,
        };

        setMessages((prev) => [...prev, patientMsg]);
        playPatientVoice(displayText, fallbackGesture);
      }, 400);
    },
    [currentCase, language, messages, onRubricItemScored, playPatientVoice]
  );

  // Push to talk triggers
  const startPushToTalk = useCallback(() => {
    medicalAudio.playHapticTap();
    if (synthRef.current && synthRef.current.speaking) {
      synthRef.current.cancel();
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }

    setIsPushToTalkActive(true);
    setSpeechState('listening');

    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = language === 'my' ? 'my-MM' : 'en-US';
        recognitionRef.current.start();
      } catch {}
    }
  }, [language]);

  const stopPushToTalk = useCallback(() => {
    medicalAudio.playHapticTap();
    setIsPushToTalkActive(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
  }, []);

  // Reset conversation
  const resetConversation = useCallback(() => {
    const initialText =
      language === 'my'
        ? currentCase.patient.chiefComplaint_my
        : currentCase.patient.chiefComplaint;

    setMessages([
      {
        id: 'msg-initial',
        sender: 'patient',
        text: initialText,
        textBurmese: currentCase.patient.chiefComplaint_my,
        timestamp: '00:00',
        gesture: currentCase.patient.defaultGesture,
      },
    ]);
    setSpeechState('idle');
    setInterimTranscript('');
    if (synthRef.current) synthRef.current.cancel();
    if (audioPlayerRef.current) audioPlayerRef.current.pause();
  }, [currentCase, language]);

  useEffect(() => {
    resetConversation();
  }, [currentCase.id, resetConversation]);

  return {
    messages,
    speechState,
    isPushToTalkActive,
    interimTranscript,
    isVoiceSynthesisEnabled,
    setIsVoiceSynthesisEnabled,
    startPushToTalk,
    stopPushToTalk,
    handleCandidateUtterance,
    playPatientVoice,
    resetConversation,
  };
};
