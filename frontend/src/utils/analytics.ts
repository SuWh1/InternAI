export function hasCookieConsent(): boolean {
  return document.cookie.split('; ').some((c) => c.startsWith('cookie_consent=true'));
}

export function setCookieConsent(value: boolean) {
  const expireDays = value ? 180 : -1; // Set expire days to -1 to clear the cookie if value is false
  const date = new Date();
  date.setTime(date.getTime() + expireDays * 24 * 60 * 60 * 1000);
  document.cookie = `cookie_consent=${value}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
} 