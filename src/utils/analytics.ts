type EventParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    gtag?: (command: string, eventName: string, params?: EventParams) => void;
    dataLayer?: Array<Record<string, unknown>>;
  }
}

function isBrowser() {
  return typeof window !== 'undefined';
}

export function trackEvent(eventName: string, params: EventParams = {}) {
  if (!isBrowser()) return;

  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
    return;
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: eventName, ...params });
  }
}

export function trackPageView(path: string) {
  trackEvent('page_view', {
    page_path: path,
    page_location: isBrowser() ? window.location.href : path,
  });
}
