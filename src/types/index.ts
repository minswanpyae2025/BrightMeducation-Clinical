export type MainCategory = 'history_taking' | 'physical_examination';

export type SubCategory = 'cvs' | 'respi' | 'abdomen' | 'cns';

export type ClinicalTab = 'history' | 'exam' | 'investigations' | 'transcript';

export type Language = 'en' | 'my';

export type AvatarGesture =
  | 'idle'
  | 'speaking'
  | 'clutch_chest'
  | 'rub_temple'
  | 'holding_abdomen'
  | 'cough'
  | 'wincing'
  | 'nodding'
  | 'thinking'
  | 'short_of_breath'
  | 'relieved';

export type SpeechState = 'idle' | 'listening' | 'processing' | 'speaking';

export type OSCEStationPhase = 'hub' | 'briefing' | 'consultation' | 'feedback';

export type ExamTechnique = 'inspection' | 'palpation' | 'percussion' | 'auscultation';

export interface ChatMessage {
  id: string;
  sender: 'candidate' | 'patient' | 'system';
  text: string;
  textBurmese?: string;
  timestamp: string;
  category?: 'socrates' | 'ice' | 'pmh' | 'dh' | 'sh' | 'fh' | 'ros' | 'general' | 'exam';
  gesture?: AvatarGesture;
}

export interface Vitals {
  bp: string;
  hr: number;
  rr: number;
  spo2: number;
  temp: number;
  gcs: string;
  painScore: number;
}

export interface PhysicalExamPoint {
  id: string;
  name: string;
  name_my?: string;
  technique: ExamTechnique;
  anatomicalArea: 'chest' | 'abdomen' | 'head_neck' | 'limbs';
  coords: { x: number; y: number };
  actionLabel: string;
  actionLabel_my?: string;
  finding: string;
  finding_my?: string;
  soundType?: 'heart_normal' | 'heart_murmur' | 'lung_vesicular' | 'lung_crackles' | 'lung_wheeze' | 'bowel_active';
  patientReaction: string;
  patientReaction_my?: string;
  gestureOnAction?: AvatarGesture;
  isKeyFinding: boolean;
  revealed: boolean;
}

export interface PhysicalExamSystem {
  id: string;
  name: string;
  name_my?: string;
  iconName: string;
  summary: string;
  summary_my?: string;
  points: PhysicalExamPoint[];
}

export interface Investigation {
  id: string;
  name: string;
  category: 'ecg' | 'imaging' | 'blood' | 'bedside';
  ordered: boolean;
  timeToResultMs: number;
  status: 'pending' | 'ready';
  criticalFinding: boolean;
  title: string;
  resultReport: string;
  resultReport_my?: string;
  dataPoints?: { label: string; value: string; unit?: string; normalRange?: string; isAbnormal?: boolean }[];
  visualType?: 'ecg_strip' | 'cxr' | 'troponin_curve';
}

export interface RubricItem {
  id: string;
  domain: 'Communication & Empathy' | 'History Taking' | 'Physical Exam' | 'Clinical Reasoning' | 'Patient Safety';
  title: string;
  title_my?: string;
  criteria: string;
  criteria_my?: string;
  weight: number;
  score: number;
  completed: boolean;
  missedFeedback: string;
  missedFeedback_my?: string;
}

export interface ClinicalTrigger {
  triggers: string[];
  response: string;
  response_my: string; // Mandatory Burmese clinical response
  gesture?: AvatarGesture;
  rubricId?: string;
  category?: ChatMessage['category'];
}

export interface OSCECase {
  id: string;
  mainCategory: MainCategory;
  subCategory: SubCategory;
  title: string;
  title_my: string;
  subtitle: string;
  subtitle_my: string;
  creditsCost: number; // 20 credits
  difficulty: 'Foundation (FY1)' | 'Core Medical' | 'Advanced Specialist';
  durationMinutes: number;
  patient: {
    name: string;
    name_my: string;
    age: number;
    gender: 'male' | 'female';
    occupation: string;
    occupation_my: string;
    appearance: string;
    appearance_my: string;
    chiefComplaint: string;
    chiefComplaint_my: string;
    voicePitch: number;
    voiceRate: number;
    defaultGesture: AvatarGesture;
  };
  candidateBrief: {
    setting: string;
    setting_my: string;
    situation: string;
    situation_my: string;
    triageNote: string;
    triageNote_my: string;
    tasks: string[];
    tasks_my: string[];
  };
  vitals: Vitals;
  scriptTriggers: ClinicalTrigger[];
  physicalExamSystems: PhysicalExamSystem[];
  investigations: Investigation[];
  rubric: RubricItem[];
  modelSummary: {
    primaryDiagnosis: string;
    primaryDiagnosis_my: string;
    differentialDiagnoses: string[];
    differentialDiagnoses_my: string[];
    immediateManagement: string[];
    immediateManagement_my: string[];
    sbar: {
      situation: string;
      background: string;
      assessment: string;
      recommendation: string;
    };
  };
}
