import React, { useState, useEffect } from 'react';
import { OSCE_CASES } from './data/cases';
import {
  OSCECase,
  OSCEStationPhase,
  AvatarGesture,
  PhysicalExamPoint,
  Language,
} from './types';
import { supabaseService, UserProfile } from './lib/supabase';
import { stationsService } from './lib/stationsService';
import { Header } from './components/Header';
import { CategoryHub } from './components/CategoryHub';
import { CaseBriefing } from './components/CaseBriefing';
import { HistoryStationView } from './components/HistoryStationView';
import { PhysicalExamStationView } from './components/PhysicalExamStationView';
import { PostExamFeedback } from './components/PostExamFeedback';
import { AuthModal } from './components/AuthModal';
import { useVoiceConvo } from './hooks/useVoiceConvo';
import { medicalAudio } from './utils/audioSimulator';

export const App: React.FC = () => {
  // Default to Burmese ('my') as requested: "all language should be burmese"
  const [language, setLanguage] = useState<Language>('my');
  const [stationPhase, setStationPhase] = useState<OSCEStationPhase>('hub');
  const [stations, setStations] = useState<OSCECase[]>(OSCE_CASES);
  const [currentCase, setCurrentCase] = useState<OSCECase>(OSCE_CASES[0]);
  const [currentGesture, setCurrentGesture] = useState<AvatarGesture>(
    OSCE_CASES[0].patient.defaultGesture
  );
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // User Profile & Credits
  const [userProfile, setUserProfile] = useState<UserProfile>(
    supabaseService.getProfile()
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Fetch dynamic stations from Supabase (with offline template fallback)
  useEffect(() => {
    let isMounted = true;
    stationsService.getStations().then((loaded) => {
      if (isMounted && loaded && loaded.length > 0) {
        setStations(loaded);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Listen to profile / credits updates
  useEffect(() => {
    const unsubscribe = supabaseService.subscribe((profile) => {
      setUserProfile(profile);
    });
    return () => unsubscribe();
  }, []);

  // Rubric score callback
  const handleRubricItemScored = (rubricId: string) => {
    setCurrentCase((prev) => {
      const updatedRubric = prev.rubric.map((item) => {
        if (item.id === rubricId && !item.completed) {
          return { ...item, completed: true, score: item.weight };
        }
        return item;
      });
      return { ...prev, rubric: updatedRubric };
    });
  };

  // Voice convo engine with bilingual support and Google Cloud integration
  const {
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
  } = useVoiceConvo({
    currentCase,
    language,
    onRubricItemScored: handleRubricItemScored,
    onGestureChange: setCurrentGesture,
  });

  // Physical exam point revealed
  const handleExamPointRevealed = (point: PhysicalExamPoint) => {
    setCurrentCase((prev) => {
      const updatedSystems = prev.physicalExamSystems.map((sys) => ({
        ...sys,
        points: sys.points.map((p) => (p.id === point.id ? { ...p, revealed: true } : p)),
      }));

      const updatedRubric = prev.rubric.map((r) => {
        if (r.domain === 'Physical Exam' && !r.completed) {
          return { ...r, completed: true, score: r.weight };
        }
        return r;
      });

      return {
        ...prev,
        physicalExamSystems: updatedSystems,
        rubric: updatedRubric,
      };
    });

    if (point.gestureOnAction) {
      setCurrentGesture(point.gestureOnAction);
    }
  };

  // Select station from Hub
  const handleSelectStationFromHub = (selectedStation: OSCECase) => {
    const cloned: OSCECase = JSON.parse(JSON.stringify(selectedStation));
    setCurrentCase(cloned);
    setCurrentGesture(cloned.patient.defaultGesture);
    resetConversation();
    setStationPhase('briefing');
  };

  // Enter room and start consultation (deducts 20 credits)
  const handleStartStation = async () => {
    const deduction = await supabaseService.deductStationCredits(currentCase.id, 20);
    if (!deduction.success) {
      setIsAuthModalOpen(true);
      return;
    }

    setStationPhase('consultation');
    setIsTimerRunning(true);
  };

  // Finish station and show feedback
  const handleFinishStation = () => {
    setIsTimerRunning(false);
    setStationPhase('feedback');
    medicalAudio.playOSCEChime(false);

    // Save attempt to Supabase
    const totalWeight = currentCase.rubric.reduce((acc, item) => acc + item.weight, 0);
    const earnedScore = currentCase.rubric.reduce(
      (acc, item) => acc + (item.completed ? item.weight : 0),
      0
    );
    const scorePercent = Math.round((earnedScore / (totalWeight || 1)) * 100);

    supabaseService.saveStationAttempt({
      stationId: currentCase.id,
      category: currentCase.mainCategory,
      subcategory: currentCase.subCategory,
      score: scorePercent,
      rubricCompleted: currentCase.rubric.filter((r) => r.completed).length,
      rubricTotal: currentCase.rubric.length,
      transcript: messages,
    });
  };

  // Repeat current station
  const handleRestartStation = () => {
    const found = stations.find((c) => c.id === currentCase.id) || stations[0];
    const cloned: OSCECase = JSON.parse(JSON.stringify(found));
    setCurrentCase(cloned);
    setCurrentGesture(cloned.patient.defaultGesture);
    resetConversation();
    setStationPhase('briefing');
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'my' ? 'en' : 'my'));
  };

  return (
    <div className="min-h-dvh bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-ios-blue selection:text-white antialiased">
      {/* Top iOS Header */}
      <Header
        currentCase={stationPhase === 'hub' ? null : currentCase}
        stationPhase={stationPhase}
        userProfile={userProfile}
        language={language}
        onToggleLanguage={toggleLanguage}
        isTimerRunning={isTimerRunning}
        onTimeExpired={handleFinishStation}
        onFinishStation={handleFinishStation}
        onToggleTimer={() => setIsTimerRunning((prev) => !prev)}
        onGoToHub={() => {
          setIsTimerRunning(false);
          setStationPhase('hub');
        }}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Responsive Body with Android Viewport Safety */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col">
        {/* SCREEN 1: CATEGORY HUB (History Taking vs Physical Exam -> CVS, Respi, Abdomen, CNS) */}
        {stationPhase === 'hub' && (
          <CategoryHub
            cases={stations}
            userCredits={userProfile.credits}
            language={language}
            onSelectStation={handleSelectStationFromHub}
            onOpenCreditsModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* SCREEN 2: CASE BRIEFING SCREEN */}
        {stationPhase === 'briefing' && (
          <CaseBriefing
            currentCase={currentCase}
            userCredits={userProfile.credits}
            language={language}
            onStartStation={handleStartStation}
            onGoBack={() => setStationPhase('hub')}
            onOpenCreditsModal={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* SCREEN 3: ACTIVE STATION CONSULTATION */}
        {stationPhase === 'consultation' && (
          <>
            {currentCase.mainCategory === 'history_taking' ? (
              <HistoryStationView
                currentCase={currentCase}
                messages={messages}
                speechState={speechState}
                currentGesture={currentGesture}
                language={language}
                isPushToTalkActive={isPushToTalkActive}
                interimTranscript={interimTranscript}
                isVoiceSynthesisEnabled={isVoiceSynthesisEnabled}
                onToggleVoiceSynthesis={() => setIsVoiceSynthesisEnabled((prev) => !prev)}
                onStartPushToTalk={startPushToTalk}
                onStopPushToTalk={stopPushToTalk}
                onSendMessage={handleCandidateUtterance}
                onManualGestureChange={setCurrentGesture}
              />
            ) : (
              <PhysicalExamStationView
                currentCase={currentCase}
                speechState={speechState}
                currentGesture={currentGesture}
                language={language}
                onExamPointRevealed={handleExamPointRevealed}
                onPatientSpokenResponse={playPatientVoice}
                onManualGestureChange={setCurrentGesture}
              />
            )}
          </>
        )}

        {/* SCREEN 4: POST-EXAM TRANSCRIPT & FEEDBACK */}
        {stationPhase === 'feedback' && (
          <PostExamFeedback
            currentCase={currentCase}
            messages={messages}
            rubric={currentCase.rubric}
            language={language}
            onRestartStation={handleRestartStation}
            onReturnToHub={() => setStationPhase('hub')}
          />
        )}
      </main>

      {/* Auth, Google Sign-in & Credits Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        userProfile={userProfile}
        language={language}
      />
    </div>
  );
};

export default App;
