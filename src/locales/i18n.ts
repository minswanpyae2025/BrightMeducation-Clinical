export type Language = 'en' | 'my';

export interface Translations {
  // Brand & Header
  appTitle: string;
  brandName: string;
  brandEdition: string;
  appSubtitle: string;
  stationsHub: string;
  credits: string;
  creditsPerStation: string;
  costBadge: string;
  changeStation: string;

  // Categories
  selectClinicalStation: string;
  categoryHeroSubtitle: string;
  historyTaking: string;
  historyTakingSub: string;
  physicalExam: string;
  physicalExamSub: string;
  selectClinicalSystem: string;
  availableStations: string;
  noStationsFound: string;
  startStation: string;
  needCredits: string;
  stationDuration: string;
  minutes: string;

  // Systems
  cvsTitle: string;
  cvsSub: string;
  respiTitle: string;
  respiSub: string;
  abdoTitle: string;
  abdoSub: string;
  cnsTitle: string;
  cnsSub: string;

  // Briefing
  candidateInstructions: string;
  clinicalSetting: string;
  patientProfile: string;
  triageNotes: string;
  arrivalVitals: string;
  candidateTasks: string;
  enterRoom: string;
  timerNote: string;
  yearsOld: string;

  // History & Voice Convo
  liveDialogue: string;
  voiceOn: string;
  voiceOff: string;
  candidateSpeaking: string;
  patientResponding: string;
  listeningYou: string;
  holdToSpeak: string;
  releaseToSend: string;
  typeQuestionPlaceholder: string;
  prompts: string;
  patientPosture: string;
  audioFrequency: string;

  // Physical Exam
  systemExam: string;
  bedsideManeuvers: string;
  selectLandmark: string;
  clinicalFinding: string;
  replayAudio: string;
  examined: string;
  patientResponse: string;

  // Post Exam & Rubric
  stationResults: string;
  examinerReport: string;
  totalPoints: string;
  passDistinction: string;
  stationPassed: string;
  needsRevision: string;
  repeatStation: string;
  returnToHub: string;
  rubricCriteria: string;
  examinerTip: string;
  workingDiagnosis: string;
  differentials: string;
  sbarHandover: string;
  consultationTranscript: string;
  exchanges: string;

  // Auth & Profile
  accountTitle: string;
  signInGoogle: string;
  signInEmail: string;
  sendLink: string;
  signOut: string;
  loggedIn: string;
  guest: string;
  creditsBalance: string;
  creditsExplanation: string;
  contactAdminForCredits: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appTitle: 'Bright Meducation Clinical',
    brandName: 'Bright Meducation',
    brandEdition: 'Clinical Edition',
    appSubtitle: 'AI OSCE Clinical Simulation Platform',
    stationsHub: 'Stations Hub',
    credits: 'Credits',
    creditsPerStation: '20 Credits per station',
    costBadge: '20 Credits',
    changeStation: 'Change Station',

    selectClinicalStation: 'Select Clinical Station',
    categoryHeroSubtitle: 'Practice interactive history taking and physical examination with real-time AI patient dialogue in Burmese and English.',
    historyTaking: 'History Taking',
    historyTakingSub: 'Voice dialogue & SOCRATES',
    physicalExam: 'Physical Examination',
    physicalExamSub: 'Auscultation, palpation & signs',
    selectClinicalSystem: 'Select Clinical System',
    availableStations: 'Available Stations',
    noStationsFound: 'No stations found for this system yet. Add more cases in Supabase.',
    startStation: 'Start Station',
    needCredits: 'Insufficient Credits (20 Required)',
    stationDuration: 'Station Duration',
    minutes: 'Minutes',

    cvsTitle: 'CVS',
    cvsSub: 'Cardiovascular',
    respiTitle: 'Respi',
    respiSub: 'Respiratory',
    abdoTitle: 'Abdomen',
    abdoSub: 'Gastrointestinal',
    cnsTitle: 'CNS',
    cnsSub: 'Neurological',

    candidateInstructions: 'Candidate Instructions',
    clinicalSetting: 'Clinical Setting',
    patientProfile: 'Patient Profile',
    triageNotes: 'Triage Note & Baseline Vitals',
    arrivalVitals: 'Recorded on arrival',
    candidateTasks: 'Specific Instructions to Candidate:',
    enterRoom: 'Enter Room & Begin Station (20 Credits)',
    timerNote: 'Station timer (8:00) starts immediately on entering. 2-minute warning bell will sound.',
    yearsOld: 'years old',

    liveDialogue: 'Live Consultation Dialogue',
    voiceOn: 'Voice On',
    voiceOff: 'Voice Off',
    candidateSpeaking: 'Candidate Speaking...',
    patientResponding: 'Patient Speaking...',
    listeningYou: 'LISTENING TO YOU...',
    holdToSpeak: 'HOLD TO SPEAK',
    releaseToSend: 'RELEASE TO SEND VOICE',
    typeQuestionPlaceholder: 'Or type clinical question...',
    prompts: 'Prompts:',
    patientPosture: 'Patient Posture:',
    audioFrequency: 'Audio Frequency Stream',

    systemExam: 'Active System Examination',
    bedsideManeuvers: 'Bedside Maneuvers',
    selectLandmark: 'Select Anatomical Landmark to Examine',
    clinicalFinding: 'Bedside Clinical Finding:',
    replayAudio: 'Replay Stethoscope Audio',
    examined: 'Examined',
    patientResponse: 'Patient Response:',

    stationResults: 'Station Results',
    examinerReport: 'Examiner Performance Assessment',
    totalPoints: 'Total Weighted Points',
    passDistinction: 'Pass with Distinction',
    stationPassed: 'Station Passed',
    needsRevision: 'Borderline / Needs Revision',
    repeatStation: 'Repeat Station (20 Credits)',
    returnToHub: 'Back to Stations Hub',
    rubricCriteria: 'Checklist Marking Criteria',
    examinerTip: 'Examiner tip:',
    workingDiagnosis: 'Primary Working Diagnosis',
    differentials: 'Differentials to Exclude:',
    sbarHandover: 'SBAR Handover Summary',
    consultationTranscript: 'Verbatim Consultation Transcript',
    exchanges: 'exchanges',

    accountTitle: 'Account & Credits',
    signInGoogle: 'Continue with Google',
    signInEmail: 'Sign in with Medical Email',
    sendLink: 'Send Magic Link',
    signOut: 'Sign Out',
    loggedIn: 'Signed In',
    guest: 'Medical Candidate Account',
    creditsBalance: 'Active Station Credit Balance',
    creditsExplanation: 'Each clinical OSCE station costs 20 credits, verified securely in Supabase.',
    contactAdminForCredits: 'Credits are managed via Supabase. Contact your Bright Meducation Admin to add credits.',
  },

  my: {
    appTitle: 'Bright Meducation Clinical',
    brandName: 'Bright Meducation',
    brandEdition: 'Clinical Edition',
    appSubtitle: 'လက်တွေ့ ဆေးဘက်ဆိုင်ရာ AI စမ်းသပ်မှုစနစ်',
    stationsHub: 'ဘူတာများသို့ ပြန်သွားမည်',
    credits: 'ခရက်ဒစ်',
    creditsPerStation: '၁ ခုလျှင် ၂၀ ခရက်ဒစ်',
    costBadge: '၂၀ ခရက်ဒစ်',
    changeStation: 'ဘူတာပြောင်းမည်',

    selectClinicalStation: 'စစ်ဆေးလိုသည့် ဘူတာကို ရွေးချယ်ပါ',
    categoryHeroSubtitle: 'မြန်မာဘာသာဖြင့် တိုက်ရိုက် အသံဖြင့် လူနာနှင့် ရောဂါရာဇဝင်မေးမြန်းခြင်းနှင့် ခန္ဓာကိုယ်စမ်းသပ်စစ်ဆေးခြင်းများကို လက်တွေ့လေ့ကျင့်ပါ။',
    historyTaking: 'ရောဂါရာဇဝင် မေးမြန်းခြင်း',
    historyTakingSub: 'အသံဖြင့်မေးမြန်းမှုနှင့် SOCRATES စနစ်',
    physicalExam: 'ခန္ဓာကိုယ် စမ်းသပ်စစ်ဆေးခြင်း',
    physicalExamSub: 'နားထောင်ခြင်း၊ စမ်းသပ်ခြင်းနှင့် လက္ခဏာများ',
    selectClinicalSystem: 'ဆေးဘက်ဆိုင်ရာ စနစ် ရွေးချယ်ပါ',
    availableStations: 'လေ့ကျင့်နိုင်သော ဘူတာများ',
    noStationsFound: 'ဤစနစ်အတွက် ဘူတာများ မရှိသေးပါ။ Supabase တွင် အသစ်ထပ်ထည့်နိုင်ပါသည်။',
    startStation: 'ဘူတာ စတင်မည်',
    needCredits: 'ခရက်ဒစ် မလုံလောက်ပါ (၂၀ ခရက်ဒစ် လိုအပ်ပါသည်)',
    stationDuration: 'ကြာချိန်',
    minutes: 'မိနစ်',

    cvsTitle: 'CVS',
    cvsSub: 'နှလုံးနှင့် သွေးကြောစနစ်',
    respiTitle: 'Respi',
    respiSub: 'အသက်ရှူလမ်းကြောင်းစနစ်',
    abdoTitle: 'Abdomen',
    abdoSub: 'ဝမ်းဗိုက်နှင့် အစာခြေစနစ်',
    cnsTitle: 'CNS',
    cnsSub: 'အာရုံကြောစနစ်',

    candidateInstructions: 'ဆရာဝန်လောင်းများအတွက် လမ်းညွှန်ချက်',
    clinicalSetting: 'ဆေးကုသမှု နေရာ',
    patientProfile: 'လူနာအချက်အလက်',
    triageNotes: 'အရေးပေါ်မှတ်တမ်းနှင့် အခြေခံ အသက်ဆိုင်ရာ လက္ခဏာများ',
    arrivalVitals: 'စတင်ရောက်ရှိချိန် မှတ်တမ်း',
    candidateTasks: 'လုပ်ဆောင်ရမည့် သီးသန့်တာဝန်များ:',
    enterRoom: 'အခန်းတွင်းဝင်ရောက်၍ စတင်စစ်ဆေးမည် (၂၀ ခရက်ဒစ်)',
    timerNote: 'အခန်းထဲဝင်သည်နှင့် ၈ မိနစ် အချိန်စတင်မှတ်သားမည်ဖြစ်ပြီး ၂ မိနစ်အလိုတွင် သတိပေးခေါင်းလောင်း မြည်ပါမည်။',
    yearsOld: 'နှစ်',

    liveDialogue: 'လူနာနှင့် တိုက်ရိုက်ဆွေးနွေးမှု (မြန်မာစကားပြော)',
    voiceOn: 'အသံ ဖွင့်ထားသည်',
    voiceOff: 'အသံ ပိတ်ထားသည်',
    candidateSpeaking: 'ဆရာဝန် စကားပြောနေပါသည်...',
    patientResponding: 'လူနာ ပြန်လည်ဖြေကြားနေပါသည်...',
    listeningYou: 'နားထောင်နေပါသည်...',
    holdToSpeak: 'ဖိထားပြီး မေးမြန်းပါ',
    releaseToSend: 'လွှတ်လိုက်ပါ (အသံပို့မည်)',
    typeQuestionPlaceholder: 'သို့မဟုတ် မေးခွန်းကို ရိုက်ထည့်ပါ...',
    prompts: 'မေးခွန်း အကြံပြုချက်များ:',
    patientPosture: 'လူနာ၏ အမူအရာ:',
    audioFrequency: 'အသံလှိုင်း စနစ်',

    systemExam: 'လက်ရှိ စမ်းသပ်စစ်ဆေးမှု စနစ်',
    bedsideManeuvers: 'ကုတင်ဘေး စမ်းသပ်မှု နည်းလမ်းများ',
    selectLandmark: 'စမ်းသပ်လိုသည့် ခန္ဓာကိုယ် အစိတ်အပိုင်းကို ရွေးချယ်ပါ',
    clinicalFinding: 'တွေ့ရှိရသော ဆေးဘက်ဆိုင်ရာ လက္ခဏာ:',
    replayAudio: 'စတက်သိုစကုတ် အသံ ပြန်နားထောင်မည်',
    examined: 'စမ်းသပ်ပြီး',
    patientResponse: 'လူနာ၏ တုံ့ပြန်မှု:',

    stationResults: 'ဘူတာ စစ်ဆေးမှု ရလဒ်များ',
    examinerReport: 'စာမေးပွဲစစ်ဆေးသူ၏ အကဲဖြတ်ချက်',
    totalPoints: 'စုစုပေါင်း ရမှတ်',
    passDistinction: 'ဂုဏ်ထူးဖြင့် အောင်မြင်ပါသည်',
    stationPassed: 'အောင်မြင်ပါသည်',
    needsRevision: 'ထပ်မံလေ့ကျင့်ရန် လိုအပ်ပါသည်',
    repeatStation: 'ဤဘူတာကို ပြန်လည်လေ့ကျင့်မည် (၂၀ ခရက်ဒစ်)',
    returnToHub: 'ပင်မဘူတာများသို့ ပြန်သွားမည်',
    rubricCriteria: 'စစ်ဆေးမှု သတ်မှတ်ချက် အမှတ်စာရင်း',
    examinerTip: 'စာမေးပွဲ အကြံပြုချက်:',
    workingDiagnosis: 'ကနဦး ရောဂါသတ်မှတ်ချက်',
    differentials: 'ခွဲခြားရမည့် အခြားရောဂါများ:',
    sbarHandover: 'SBAR လွှဲပြောင်းမှတ်တမ်း',
    consultationTranscript: 'တိုက်ရိုက်ဆွေးနွေးမှု မှတ်တမ်းအပြည့်အစုံ',
    exchanges: 'ကြိမ် ဆွေးနွေးခဲ့သည်',

    accountTitle: 'အကောင့်နှင့် ခရက်ဒစ်',
    signInGoogle: 'Google ဖြင့် ဆက်လက်လုပ်ဆောင်မည်',
    signInEmail: 'အီးမေးလ်ဖြင့် ဝင်ရောက်မည်',
    sendLink: 'လင့်ခ် ပို့မည်',
    signOut: 'အကောင့်မှ ထွက်မည်',
    loggedIn: 'ဝင်ရောက်ထားသည်',
    guest: 'လေ့ကျင့်သူ အကောင့်',
    creditsBalance: 'လက်ကျန် ခရက်ဒစ် ပမာဏ',
    creditsExplanation: 'ဘူတာတစ်ခု စစ်ဆေးတိုင်း ၂၀ ခရက်ဒစ် အသုံးပြုပါမည် (Supabase စနစ်မှ တိုက်ရိုက်စစ်ဆေးသည်)။',
    contactAdminForCredits: 'ခရက်ဒစ်များကို Supabase စနစ်မှ စီမံခန့်ခွဲပါသည်။ ထပ်မံဖြည့်သွင်းလိုပါက Bright Meducation အက်မင်ထံ ဆက်သွယ်ပါ။',
  },
};
