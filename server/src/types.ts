export type Language = 'my' | 'en';

export type AvatarGesture =
  | 'resting'
  | 'clutch_chest'
  | 'short_of_breath'
  | 'wincing'
  | 'cough'
  | 'holding_abdomen'
  | 'rub_temple'
  | 'nodding'
  | 'thinking'
  | 'relieved'
  | 'speaking';

export interface StationTemplate {
  stationId: string;
  mainCategory: 'history_taking' | 'physical_examination';
  subCategory: 'cvs' | 'respi' | 'abdomen' | 'cns';
  title: string;
  title_my: string;
  patientName: string;
  patientName_my: string;
  age: number;
  gender: 'male' | 'female';
  occupation?: string;
  appearance?: string;
  chiefComplaint: string;
  chiefComplaint_my: string;
  defaultGesture: AvatarGesture;
  setting: string;
  situation: string;
  triageNote?: string;
  vitals: {
    bp: string;
    hr: number;
    rr: number;
    spo2: number;
    temp: number;
    painScore: number;
  };
  scriptTriggers?: Array<{
    triggers: string[];
    response: string;
    response_my: string;
    gesture?: AvatarGesture;
    rubricId?: string;
  }>;
  modelSummary: {
    primaryDiagnosis: string;
    primaryDiagnosis_my: string;
    sbarSituation: string;
    sbarBackground: string;
    sbarAssessment: string;
    sbarRecommendation: string;
  };
}

export type ClientMessage =
  | {
      type: 'init';
      token: string;
      stationId: string;
      language: Language;
      stationTemplate: StationTemplate;
    }
  | {
      type: 'candidate_text';
      text: string;
    }
  | {
      type: 'audio_chunk';
      audioBase64: string;
      mimeType?: string;
    }
  | {
      type: 'audio_end';
    }
  | {
      type: 'ping';
    };

export type ServerMessage =
  | {
      type: 'init_ack';
      authenticated: boolean;
      userId: string;
      remainingCredits: number;
      sessionId: string;
      durationMinutes: number;
    }
  | {
      type: 'candidate_transcript';
      text: string;
      isFinal: boolean;
    }
  | {
      type: 'patient_token';
      token: string;
    }
  | {
      type: 'audio_chunk';
      chunkIndex: number;
      audioBase64: string;
      mimeType: string;
      isFinal: boolean;
      textSegment: string;
    }
  | {
      type: 'gesture';
      gesture: AvatarGesture;
    }
  | {
      type: 'rubric_scored';
      rubricId: string;
    }
  | {
      type: 'turn_complete';
      fullText: string;
      fullTextBurmese?: string;
      gesture: AvatarGesture;
    }
  | {
      type: 'session_warning';
      minutesRemaining: number;
      message: string;
    }
  | {
      type: 'session_expired';
      reason: string;
    }
  | {
      type: 'pong';
    }
  | {
      type: 'error';
      code: string;
      message: string;
    };
