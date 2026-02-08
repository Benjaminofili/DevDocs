// src/lib/admin/config.ts

/**
 * Admin configuration
 * 
 * Add your email to ADMIN_EMAILS to access /admin dashboard.
 * In production, consider moving this to environment variables.
 */

// Add your email(s) here
const ADMIN_EMAILS_ENV = process.env.ADMIN_EMAILS || '';

export const ADMIN_EMAILS: string[] = [
  // Add your email directly here as fallback
  // 'your-email@example.com',
  ...ADMIN_EMAILS_ENV.split(',').map(e => e.trim()).filter(Boolean),
];

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.some(
    adminEmail => adminEmail.toLowerCase() === email.toLowerCase()
  );
}

// Add to .env.local:
// ADMIN_EMAILS=your-email@gmail.com,another-admin@gmail.com