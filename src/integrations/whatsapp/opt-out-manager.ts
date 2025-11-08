/**
 * WhatsApp Opt-Out Manager
 * Handles customer opt-out preferences for WhatsApp notifications
 */

import { supabase } from '../supabase/client';
import { encryptPhoneNumberSafe, decryptPhoneNumberSafe } from './phone-encryption';
import { validatePhoneNumber } from './phone-validator';

export interface OptOutRecord {
  id: string;
  customerPhone: string;
  optedOutAt: Date;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class OptOutManager {
  /**
   * Check if a phone number has opted out of notifications
   */
  async isOptedOut(phoneNumber: string): Promise<boolean> {
    try {
      // Validate and format phone number
      const validation = validatePhoneNumber(phoneNumber);
      if (!validation.isValid) {
        console.warn('Invalid phone number for opt-out check:', phoneNumber);
        return false;
      }

      // Encrypt phone number for lookup
      const encryptedPhone = await encryptPhoneNumberSafe(validation.formattedNumber!);

      // Check if phone number exists in opt-out table
      const { data, error } = await supabase
        .from('whatsapp_opt_outs')
        .select('id')
        .eq('customer_phone', encryptedPhone)
        .maybeSingle();

      if (error) {
        console.error('Error checking opt-out status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isOptedOut:', error);
      return false;
    }
  }

  /**
   * Add a phone number to the opt-out list
   */
  async optOut(phoneNumber: string, reason?: string): Promise<void> {
    try {
      // Validate and format phone number
      const validation = validatePhoneNumber(phoneNumber);
      if (!validation.isValid) {
        throw new Error(`Invalid phone number: ${validation.error}`);
      }

      // Encrypt phone number before storing
      const encryptedPhone = await encryptPhoneNumberSafe(validation.formattedNumber!);

      // Insert or update opt-out record
      const { error } = await supabase
        .from('whatsapp_opt_outs')
        .upsert({
          customer_phone: encryptedPhone,
          opted_out_at: new Date().toISOString(),
          reason: reason || null,
        }, {
          onConflict: 'customer_phone',
        });

      if (error) {
        console.error('Failed to add opt-out:', error);
        throw new Error(`Failed to opt out: ${error.message}`);
      }

      console.log('Customer opted out of WhatsApp notifications:', {
        phone: validation.formattedNumber,
        reason,
      });

      // Cancel any pending notifications for this phone number
      await this.cancelPendingNotifications(encryptedPhone);
    } catch (error) {
      console.error('Error in optOut:', error);
      throw error;
    }
  }

  /**
   * Remove a phone number from the opt-out list (opt back in)
   */
  async optIn(phoneNumber: string): Promise<void> {
    try {
      // Validate and format phone number
      const validation = validatePhoneNumber(phoneNumber);
      if (!validation.isValid) {
        throw new Error(`Invalid phone number: ${validation.error}`);
      }

      // Encrypt phone number for lookup
      const encryptedPhone = await encryptPhoneNumberSafe(validation.formattedNumber!);

      // Delete opt-out record
      const { error } = await supabase
        .from('whatsapp_opt_outs')
        .delete()
        .eq('customer_phone', encryptedPhone);

      if (error) {
        console.error('Failed to remove opt-out:', error);
        throw new Error(`Failed to opt in: ${error.message}`);
      }

      console.log('Customer opted back in to WhatsApp notifications:', {
        phone: validation.formattedNumber,
      });
    } catch (error) {
      console.error('Error in optIn:', error);
      throw error;
    }
  }

  /**
   * Get all opt-out records (for admin dashboard)
   */
  async getAllOptOuts(): Promise<OptOutRecord[]> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_opt_outs')
        .select('*')
        .order('opted_out_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch opt-outs:', error);
        return [];
      }

      // Decrypt phone numbers for display
      const optOuts = await Promise.all(
        (data || []).map(async (item) => ({
          id: item.id,
          customerPhone: await decryptPhoneNumberSafe(item.customer_phone),
          optedOutAt: new Date(item.opted_out_at),
          reason: item.reason,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
        }))
      );

      return optOuts;
    } catch (error) {
      console.error('Error fetching opt-outs:', error);
      return [];
    }
  }

  /**
   * Get opt-out statistics
   */
  async getOptOutStats(): Promise<{
    totalOptOuts: number;
    optOutsToday: number;
    optOutsThisWeek: number;
    optOutsThisMonth: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_opt_outs')
        .select('opted_out_at');

      if (error) {
        console.error('Failed to fetch opt-out stats:', error);
        return {
          totalOptOuts: 0,
          optOutsToday: 0,
          optOutsThisWeek: 0,
          optOutsThisMonth: 0,
        };
      }

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const optOuts = data || [];
      const totalOptOuts = optOuts.length;
      const optOutsToday = optOuts.filter(
        (o) => new Date(o.opted_out_at) >= today
      ).length;
      const optOutsThisWeek = optOuts.filter(
        (o) => new Date(o.opted_out_at) >= weekAgo
      ).length;
      const optOutsThisMonth = optOuts.filter(
        (o) => new Date(o.opted_out_at) >= monthAgo
      ).length;

      return {
        totalOptOuts,
        optOutsToday,
        optOutsThisWeek,
        optOutsThisMonth,
      };
    } catch (error) {
      console.error('Error calculating opt-out stats:', error);
      return {
        totalOptOuts: 0,
        optOutsToday: 0,
        optOutsThisWeek: 0,
        optOutsThisMonth: 0,
      };
    }
  }

  /**
   * Cancel pending notifications for an opted-out phone number
   */
  private async cancelPendingNotifications(encryptedPhone: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_notifications')
        .update({ status: 'cancelled' })
        .eq('customer_phone', encryptedPhone)
        .eq('status', 'pending');

      if (error) {
        console.error('Failed to cancel pending notifications:', error);
      } else {
        console.log('Cancelled pending notifications for opted-out customer');
      }
    } catch (error) {
      console.error('Error cancelling pending notifications:', error);
    }
  }
}

// Export singleton instance
export const optOutManager = new OptOutManager();
