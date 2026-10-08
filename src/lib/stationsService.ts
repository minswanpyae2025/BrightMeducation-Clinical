import { OSCECase } from '../types';
import { OSCE_CASES } from '../data/cases';
import { supabaseService } from './supabase';

export class StationsService {
  private cachedStations: OSCECase[] = OSCE_CASES;

  // Fetch dynamic station templates from Supabase
  public async getStations(): Promise<OSCECase[]> {
    const client = (supabaseService as any).client;

    if (client) {
      try {
        const { data, error } = await client
          .from('stations')
          .select('*')
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          // Map Supabase rows to OSCECase templates
          const mapped: OSCECase[] = data.map((row: any) => {
            const fallback = OSCE_CASES.find((c) => c.id === row.id) || OSCE_CASES[0];

            return {
              id: row.id,
              mainCategory: row.category || fallback.mainCategory,
              subCategory: row.subcategory || fallback.subCategory,
              title: row.title || fallback.title,
              title_my: row.title_my || fallback.title_my,
              subtitle: row.subtitle || fallback.subtitle,
              subtitle_my: row.subtitle_my || fallback.subtitle_my,
              creditsCost: row.credits_cost || 20,
              difficulty: row.difficulty || fallback.difficulty,
              durationMinutes: row.duration_minutes || 8,
              patient: {
                name: row.patient_name || fallback.patient.name,
                name_my: row.patient_name_my || fallback.patient.name_my,
                age: row.patient_age || fallback.patient.age,
                gender: row.patient_gender || fallback.patient.gender,
                occupation: row.patient_occupation || fallback.patient.occupation,
                occupation_my: row.patient_occupation_my || fallback.patient.occupation_my,
                appearance: row.patient_appearance || fallback.patient.appearance,
                appearance_my: row.patient_appearance_my || fallback.patient.appearance_my,
                chiefComplaint: row.chief_complaint || fallback.patient.chiefComplaint,
                chiefComplaint_my: row.chief_complaint_my || fallback.patient.chiefComplaint_my,
                voicePitch: row.voice_pitch || fallback.patient.voicePitch,
                voiceRate: row.voice_rate || fallback.patient.voiceRate,
                defaultGesture: row.default_gesture || fallback.patient.defaultGesture,
              },
              candidateBrief: row.candidate_brief || fallback.candidateBrief,
              vitals: row.vitals || fallback.vitals,
              scriptTriggers: row.script_triggers || fallback.scriptTriggers,
              physicalExamSystems: row.physical_exam_systems || fallback.physicalExamSystems,
              investigations: row.investigations || fallback.investigations,
              rubric: row.rubric || fallback.rubric,
              modelSummary: row.model_summary || fallback.modelSummary,
            };
          });

          this.cachedStations = mapped;
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase dynamic stations fetch notice:', err);
      }
    }

    return this.cachedStations;
  }

  // Get single station template
  public async getStationById(id: string): Promise<OSCECase | null> {
    const stations = await this.getStations();
    return stations.find((s) => s.id === id) || null;
  }
}

export const stationsService = new StationsService();
