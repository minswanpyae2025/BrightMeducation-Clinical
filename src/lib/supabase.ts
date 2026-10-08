import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  credits: number;
  is_logged_in: boolean;
  provider: 'google' | 'email' | 'demo';
}

const STORAGE_KEY_PROFILE = 'osce_live_user_profile';

const DEFAULT_PRODUCTION_PROFILE: UserProfile = {
  id: 'cand-001',
  email: 'candidate@oscelive.med',
  full_name: 'Dr. Medical Candidate',
  avatar_url: '',
  credits: 100, // 5 free stations
  is_logged_in: true,
  provider: 'demo',
};

class ProductionSupabaseService {
  private client: SupabaseClient | null = null;
  private currentProfile: UserProfile = DEFAULT_PRODUCTION_PROFILE;
  private listeners: Array<(profile: UserProfile) => void> = [];

  constructor() {
    this.initSupabaseClient();
    this.loadProfile();
  }

  private initSupabaseClient() {
    const url = (import.meta as any).env?.VITE_SUPABASE_URL || '';
    const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

    if (url && anonKey) {
      try {
        this.client = createClient(url, anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
        });

        // Listen for Google OAuth callback session
        this.client.auth.onAuthStateChange(async (event, session) => {
          if (session?.user) {
            await this.syncProfileFromSupabase(session.user);
          }
        });
      } catch (err) {
        console.warn('Production Supabase init:', err);
        this.client = null;
      }
    } else {
      this.client = null;
    }
  }

  private loadProfile() {
    const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (saved) {
      try {
        this.currentProfile = JSON.parse(saved);
      } catch {
        this.currentProfile = DEFAULT_PRODUCTION_PROFILE;
      }
    } else {
      this.currentProfile = DEFAULT_PRODUCTION_PROFILE;
      this.saveLocalProfile(this.currentProfile);
    }
  }

  private saveLocalProfile(profile: UserProfile) {
    this.currentProfile = profile;
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb(this.currentProfile));
  }

  public subscribe(callback: (profile: UserProfile) => void) {
    this.listeners.push(callback);
    callback(this.currentProfile);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public getProfile(): UserProfile {
    return this.currentProfile;
  }

  // Google OAuth Sign-In (Production)
  public async signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
    if (this.client) {
      try {
        const { error } = await this.client.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    } else {
      // Local preview fallback state
      const profile: UserProfile = {
        id: 'google-user-' + Math.floor(Math.random() * 10000),
        email: 'doctor.google@oscelive.med',
        full_name: 'Dr. Medical Candidate',
        avatar_url: '',
        credits: 100,
        is_logged_in: true,
        provider: 'google',
      };
      this.saveLocalProfile(profile);
      return { success: true };
    }
  }

  // Email Magic Link Sign In
  public async signInWithEmail(email: string): Promise<{ success: boolean; error?: string }> {
    if (this.client) {
      try {
        const { error } = await this.client.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    } else {
      const profile: UserProfile = {
        id: 'email-user-' + Date.now(),
        email: email,
        full_name: email.split('@')[0].toUpperCase(),
        credits: 100,
        is_logged_in: true,
        provider: 'email',
      };
      this.saveLocalProfile(profile);
      return { success: true };
    }
  }

  // Sign Out
  public async signOut() {
    if (this.client) {
      await this.client.auth.signOut();
    }
    const guestProfile: UserProfile = {
      ...DEFAULT_PRODUCTION_PROFILE,
      credits: 40,
      is_logged_in: false,
    };
    this.saveLocalProfile(guestProfile);
  }

  // Deduct 20 credits per station attempt
  public async deductStationCredits(stationId: string, amount: number = 20): Promise<{ success: boolean; newCredits: number; error?: string }> {
    if (this.currentProfile.credits < amount) {
      return {
        success: false,
        newCredits: this.currentProfile.credits,
        error: `Insufficient credits. This station requires ${amount} credits, but you have ${this.currentProfile.credits}.`,
      };
    }

    if (this.client) {
      try {
        const { data, error } = await this.client.rpc('deduct_station_credits', {
          user_uuid: this.currentProfile.id,
          station_identifier: stationId,
          cost: amount,
        });

        if (!error && data?.success) {
          const updated: UserProfile = {
            ...this.currentProfile,
            credits: data.new_balance,
          };
          this.saveLocalProfile(updated);
          return { success: true, newCredits: data.new_balance };
        }
      } catch (err) {
        console.warn('Supabase credit deduction fallback:', err);
      }
    }

    // Atomic local balance update
    const newBalance = Math.max(0, this.currentProfile.credits - amount);
    const updated: UserProfile = {
      ...this.currentProfile,
      credits: newBalance,
    };
    this.saveLocalProfile(updated);
    return { success: true, newCredits: newBalance };
  }

  // Refill credits
  public addCredits(amount: number = 100) {
    const newBalance = this.currentProfile.credits + amount;
    const updated: UserProfile = {
      ...this.currentProfile,
      credits: newBalance,
    };
    this.saveLocalProfile(updated);
    return newBalance;
  }

  // Public method to refresh and sync balance from Supabase
  public async refreshProfile(): Promise<{ success: boolean; credits: number; message?: string }> {
    if (this.client) {
      try {
        const { data: { session } } = await this.client.auth.getSession();
        const userId = session?.user?.id || this.currentProfile.id;

        const { data, error } = await this.client
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (!error && data) {
          const profile: UserProfile = {
            id: data.id,
            email: data.email || this.currentProfile.email,
            full_name: data.full_name || this.currentProfile.full_name,
            avatar_url: data.avatar_url || '',
            credits: data.credits ?? this.currentProfile.credits,
            is_logged_in: !!session?.user,
            provider: (session?.user?.app_metadata?.provider as any) || this.currentProfile.provider,
          };
          this.saveLocalProfile(profile);
          return { success: true, credits: profile.credits };
        }
      } catch (err: any) {
        console.warn('Refresh profile error:', err);
      }
    }
    return { success: true, credits: this.currentProfile.credits };
  }

  private async syncProfileFromSupabase(user: User) {
    if (!this.client) return;

    try {
      const { data, error } = await this.client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        const profile: UserProfile = {
          id: data.id,
          email: data.email,
          full_name: data.full_name || user.email?.split('@')[0] || 'Candidate',
          avatar_url: data.avatar_url || '',
          credits: data.credits ?? 100,
          is_logged_in: true,
          provider: 'google',
        };
        this.saveLocalProfile(profile);
      }
    } catch (err) {
      console.warn('Profile sync:', err);
    }
  }

  // Save station attempt result
  public async saveStationAttempt(attempt: {
    stationId: string;
    category: string;
    subcategory: string;
    score: number;
    rubricCompleted: number;
    rubricTotal: number;
    transcript: any[];
  }) {
    if (this.client) {
      try {
        await this.client.from('station_attempts').insert({
          user_id: this.currentProfile.id,
          station_id: attempt.stationId,
          category: attempt.category,
          subcategory: attempt.subcategory,
          score_percentage: attempt.score,
          rubric_completed: attempt.rubricCompleted,
          rubric_total: attempt.rubricTotal,
          credits_deducted: 20,
          transcript: attempt.transcript,
        });
      } catch (err) {
        console.warn('Save attempt error:', err);
      }
    }
  }
}

export const supabaseService = new ProductionSupabaseService();
