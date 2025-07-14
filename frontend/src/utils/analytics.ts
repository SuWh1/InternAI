export function loadGoogleAnalytics(measurementId: string) {
  if (!measurementId) return;
  if ((window as any).gaLoaded) return; // prevent double load

  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.onload = () => {
    // Initialise dataLayer after script tag loaded
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: any[]) {
      (window as any).dataLayer.push(args);
    }
    (window as any).gtag = gtag;
    gtag('js', new Date());
    gtag('config', measurementId);
    (window as any).gaLoaded = true;
    // Fire initial pageview
    firePageView(window.location.pathname);
    // Debug
    console.log('[GA] Initialized and pageview sent:', window.location.pathname);
  };
  document.head.appendChild(script);
}

export function firePageView(path: string) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'page_view', { page_path: path });
    // Debug
    console.log('[GA] Pageview event sent:', path);
  }
}

export function hasCookieConsent(): boolean {
  return document.cookie.split('; ').some((c) => c.startsWith('cookie_consent=true'));
}

export function setCookieConsent(value: boolean) {
  const expireDays = 180;
  const date = new Date();
  date.setTime(date.getTime() + expireDays * 24 * 60 * 60 * 1000);
  document.cookie = `cookie_consent=${value}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
} 