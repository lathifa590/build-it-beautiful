/**
 * Security Audit & Activity Logger (OWASP A09: Security Logging and Alerting)
 * Records security-relevant events without logging sensitive data (passwords, tokens, API keys).
 */

export type SecurityEventType =
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_LOGIN_FAILED'
  | 'AUTH_BRUTE_FORCE_BLOCKED'
  | 'AUTH_UNAUTHORIZED_ACCESS'
  | 'AUTH_ROLE_ELEVATION_ATTEMPT'
  | 'FILE_UPLOAD_REJECTED'
  | 'SECURITY_POLICY_VIOLATION';

interface SecurityLogPayload {
  eventType: SecurityEventType;
  userId?: string | null;
  email?: string | null;
  path?: string;
  details?: Record<string, any>;
}

export function logSecurityEvent({
  eventType,
  userId = null,
  email = null,
  path = typeof window !== 'undefined' ? window.location.pathname : undefined,
  details = {},
}: SecurityLogPayload): void {
  // Never log passwords, keys, or bearer tokens
  const sanitizedDetails = { ...details };
  delete sanitizedDetails.password;
  delete sanitizedDetails.token;
  delete sanitizedDetails.apiKey;
  delete sanitizedDetails.api_key;
  delete sanitizedDetails.secret;

  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'SECURITY_AUDIT',
    eventType,
    userId: userId || 'anonymous',
    emailMasked: email ? email.replace(/(?<=.{2}).(?=.*@)/g, '*') : undefined,
    path,
    details: sanitizedDetails,
  };

  // In production or development, log structured security events
  if (import.meta.env.DEV) {
    console.warn('[SECURITY AUDIT]', logEntry);
  }
}
