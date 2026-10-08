import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface AuthResult {
  success: boolean;
  userId?: string;
  credits?: number;
  error?: string;
  errorCode?: string;
}

export class AuthService {
  private supabase: SupabaseClient | null = null;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && serviceRoleKey) {
      this.supabase = createClient(supabaseUrl, serviceRoleKey);
    }
  }

  /**
   * Authenticate WebSocket handshake and verify 20 credits quota
   */
  async authenticateAndDeductCredits(
    token: string | undefined,
    stationId: string
  ): Promise<AuthResult> {
    // If Supabase is not configured yet (e.g. initial dev preview before env vars set),
    // allow guest access with simulated 100 credits for non-breaking local testing
    if (!this.supabase) {
      return {
        success: true,
        userId: 'dev-guest-user',
        credits: 100,
      };
    }

    // 1. Verify user JWT token with Supabase Auth
    let userId: string | null = null;
    if (token && token.trim().length > 10) {
      try {
        const {
          data: { user },
          error,
        } = await this.supabase.auth.getUser(token);

        if (!error && user) {
          userId = user.id;
        }
      } catch (err) {
        console.warn('[AuthService] Token verification warning:', err);
      }
    }

    // Fallback: If no token provided or guest session, look up or assign a guest id
    if (!userId) {
      if (token === 'guest' || !token) {
        return {
          success: true,
          userId: 'guest-session',
          credits: 80,
        };
      }
      return {
        success: false,
        errorCode: 'INVALID_TOKEN',
        error: 'Authentication failed. Please sign in with Google or your account.',
      };
    }

    // 2. Query user profile credits
    try {
      const { data: profile, error: profileErr } = await this.supabase
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (profileErr || !profile) {
        // If profile doesn't exist, try creating welcome record with 100 credits
        const { data: newProfile, error: insertErr } = await this.supabase
          .from('profiles')
          .insert({ id: userId, credits: 100 })
          .select('credits')
          .single();

        if (insertErr || !newProfile) {
          return {
            success: false,
            errorCode: 'PROFILE_NOT_FOUND',
            error: 'User profile could not be loaded.',
          };
        }

        // Deduct 20 credits
        await this.deductCredits(userId, stationId, 20);
        return {
          success: true,
          userId,
          credits: 80,
        };
      }

      if (profile.credits < 20) {
        return {
          success: false,
          errorCode: 'INSUFFICIENT_CREDITS',
          error: `Insufficient credits (${profile.credits} available). 20 credits required per OSCE station.`,
          credits: profile.credits,
        };
      }

      // 3. Deduct 20 credits via atomic RPC or table update
      const remaining = await this.deductCredits(userId, stationId, 20);

      return {
        success: true,
        userId,
        credits: remaining,
      };
    } catch (err: any) {
      console.error('[AuthService] Database error during credit check:', err);
      return {
        success: false,
        errorCode: 'DATABASE_ERROR',
        error: err.message || 'Database error verifying credits',
      };
    }
  }

  private async deductCredits(
    userId: string,
    stationId: string,
    amount: number
  ): Promise<number> {
    if (!this.supabase) return 80;

    // Try RPC deduct_station_credits
    try {
      const { data, error } = await this.supabase.rpc('deduct_station_credits', {
        p_station_id: stationId,
        p_amount: amount,
      });

      if (!error && typeof data?.remaining_credits === 'number') {
        return data.remaining_credits;
      }
    } catch {}

    // Fallback direct update
    const { data: current } = await this.supabase
      .from('profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    const newCredits = Math.max(0, (current?.credits || 100) - amount);
    await this.supabase.from('profiles').update({ credits: newCredits }).eq('id', userId);
    return newCredits;
  }
}
