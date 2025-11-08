/**
 * WhatsApp Terms of Service Compliance Checker
 * Ensures notifications comply with WhatsApp Business API policies
 */

export interface ComplianceCheckResult {
  isCompliant: boolean;
  violations: string[];
  warnings: string[];
}

export class WhatsAppComplianceChecker {
  // WhatsApp message content restrictions
  private static readonly PROHIBITED_CONTENT = [
    'spam',
    'phishing',
    'malware',
    'illegal',
    'adult content',
    'violence',
    'hate speech',
    'harassment',
  ];

  // Rate limiting thresholds (messages per hour)
  private static readonly RATE_LIMITS = {
    perCustomer: 10, // Max messages per customer per hour
    total: 1000, // Max total messages per hour
  };

  // Message length limits
  private static readonly MESSAGE_LIMITS = {
    maxLength: 4096, // WhatsApp text message limit
    recommendedLength: 1000, // Recommended for better delivery
  };

  /**
   * Check if a message complies with WhatsApp Terms of Service
   */
  static checkMessageCompliance(message: string): ComplianceCheckResult {
    const violations: string[] = [];
    const warnings: string[] = [];

    // Check message length
    if (message.length > this.MESSAGE_LIMITS.maxLength) {
      violations.push(
        `Message exceeds maximum length (${message.length}/${this.MESSAGE_LIMITS.maxLength} characters)`
      );
    } else if (message.length > this.MESSAGE_LIMITS.recommendedLength) {
      warnings.push(
        `Message is longer than recommended (${message.length}/${this.MESSAGE_LIMITS.recommendedLength} characters)`
      );
    }

    // Check for empty message
    if (!message || message.trim().length === 0) {
      violations.push('Message cannot be empty');
    }

    // Check for prohibited content patterns (basic check)
    const lowerMessage = message.toLowerCase();
    const foundProhibited = this.PROHIBITED_CONTENT.filter((term) =>
      lowerMessage.includes(term)
    );
    if (foundProhibited.length > 0) {
      warnings.push(
        `Message may contain prohibited content: ${foundProhibited.join(', ')}`
      );
    }

    // Check for excessive capitalization (spam indicator)
    const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
    if (capsRatio > 0.5 && message.length > 20) {
      warnings.push('Message contains excessive capitalization (may be flagged as spam)');
    }

    // Check for excessive punctuation (spam indicator)
    const punctuationRatio =
      (message.match(/[!?]{2,}/g) || []).length / message.length;
    if (punctuationRatio > 0.1) {
      warnings.push('Message contains excessive punctuation (may be flagged as spam)');
    }

    // Check for URLs (requires special handling in WhatsApp)
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const urls = message.match(urlPattern);
    if (urls && urls.length > 3) {
      warnings.push('Message contains multiple URLs (may affect delivery rate)');
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      warnings,
    };
  }

  /**
   * Check if notification type is allowed
   */
  static isNotificationTypeAllowed(notificationType: string): boolean {
    const allowedTypes = [
      'payment_confirmed',
      'preparing',
      'ready',
      'custom',
    ];
    return allowedTypes.includes(notificationType);
  }

  /**
   * Validate notification timing (avoid sending at inappropriate times)
   */
  static isAppropriateTime(): ComplianceCheckResult {
    const violations: string[] = [];
    const warnings: string[] = [];

    const now = new Date();
    const hour = now.getHours();

    // Avoid sending notifications late at night (10 PM - 8 AM)
    if (hour >= 22 || hour < 8) {
      warnings.push(
        'Sending notifications outside business hours (8 AM - 10 PM) may reduce engagement'
      );
    }

    return {
      isCompliant: true, // Not a hard violation, just a warning
      violations,
      warnings,
    };
  }

  /**
   * Check rate limiting compliance
   */
  static async checkRateLimits(
    customerPhone: string,
    supabase: any
  ): Promise<ComplianceCheckResult> {
    const violations: string[] = [];
    const warnings: string[] = [];

    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      // Check per-customer rate limit
      const { data: customerMessages, error: customerError } = await supabase
        .from('whatsapp_notifications')
        .select('id')
        .eq('customer_phone', customerPhone)
        .gte('created_at', oneHourAgo.toISOString());

      if (customerError) {
        console.error('Error checking customer rate limit:', customerError);
      } else if (customerMessages && customerMessages.length >= this.RATE_LIMITS.perCustomer) {
        violations.push(
          `Rate limit exceeded for customer (${customerMessages.length}/${this.RATE_LIMITS.perCustomer} per hour)`
        );
      } else if (
        customerMessages &&
        customerMessages.length >= this.RATE_LIMITS.perCustomer * 0.8
      ) {
        warnings.push(
          `Approaching rate limit for customer (${customerMessages.length}/${this.RATE_LIMITS.perCustomer} per hour)`
        );
      }

      // Check total rate limit
      const { data: totalMessages, error: totalError } = await supabase
        .from('whatsapp_notifications')
        .select('id')
        .gte('created_at', oneHourAgo.toISOString());

      if (totalError) {
        console.error('Error checking total rate limit:', totalError);
      } else if (totalMessages && totalMessages.length >= this.RATE_LIMITS.total) {
        violations.push(
          `Total rate limit exceeded (${totalMessages.length}/${this.RATE_LIMITS.total} per hour)`
        );
      } else if (totalMessages && totalMessages.length >= this.RATE_LIMITS.total * 0.8) {
        warnings.push(
          `Approaching total rate limit (${totalMessages.length}/${this.RATE_LIMITS.total} per hour)`
        );
      }
    } catch (error) {
      console.error('Error checking rate limits:', error);
      warnings.push('Unable to verify rate limits');
    }

    return {
      isCompliant: violations.length === 0,
      violations,
      warnings,
    };
  }

  /**
   * Comprehensive compliance check before sending notification
   */
  static async checkFullCompliance(
    message: string,
    notificationType: string,
    customerPhone: string,
    supabase: any
  ): Promise<ComplianceCheckResult> {
    const allViolations: string[] = [];
    const allWarnings: string[] = [];

    // Check message content
    const messageCheck = this.checkMessageCompliance(message);
    allViolations.push(...messageCheck.violations);
    allWarnings.push(...messageCheck.warnings);

    // Check notification type
    if (!this.isNotificationTypeAllowed(notificationType)) {
      allViolations.push(`Invalid notification type: ${notificationType}`);
    }

    // Check timing
    const timingCheck = this.isAppropriateTime();
    allWarnings.push(...timingCheck.warnings);

    // Check rate limits
    const rateLimitCheck = await this.checkRateLimits(customerPhone, supabase);
    allViolations.push(...rateLimitCheck.violations);
    allWarnings.push(...rateLimitCheck.warnings);

    return {
      isCompliant: allViolations.length === 0,
      violations: allViolations,
      warnings: allWarnings,
    };
  }

  /**
   * Get compliance guidelines for display
   */
  static getComplianceGuidelines(): string[] {
    return [
      'Messages must be transactional and related to customer orders',
      'Do not send promotional or marketing content',
      'Respect customer opt-out preferences',
      'Limit message frequency to avoid spam classification',
      'Keep messages concise and relevant',
      'Avoid excessive capitalization and punctuation',
      'Do not send messages late at night (10 PM - 8 AM)',
      'Include business name and contact information',
      'Provide clear opt-out instructions',
      'Comply with WhatsApp Business API Terms of Service',
    ];
  }
}

// Export singleton for convenience
export const complianceChecker = WhatsAppComplianceChecker;
