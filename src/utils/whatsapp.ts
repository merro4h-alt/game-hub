export const DEFAULT_STORE_WHATSAPP_LOCAL = '07837814009';
export const DEFAULT_STORE_WHATSAPP_INTL = '9647837814009';

/**
 * Normalizes Iraqi (07xxxxxxxxx) and international phone numbers
 * into standard WhatsApp digits format (e.g. 9647837814009) without '+' or leading zeros.
 */
export function normalizeWhatsAppPhone(raw?: string | null): string {
  let cleaned = (raw || DEFAULT_STORE_WHATSAPP_LOCAL).replace(/[^\d]/g, '');

  if (cleaned.startsWith('00')) {
    cleaned = cleaned.slice(2);
  }

  // Iraqi mobile format: 07xxxxxxxxx (11 digits) -> 9647xxxxxxxxx
  if (cleaned.startsWith('07') && cleaned.length === 11) {
    cleaned = '964' + cleaned.slice(1);
  } else if (cleaned.startsWith('7') && cleaned.length === 10) {
    // Iraqi mobile without leading 0: 7xxxxxxxxx (10 digits) -> 9647xxxxxxxxx
    cleaned = '964' + cleaned;
  } else if (cleaned.startsWith('05') && cleaned.length === 10) {
    // Saudi mobile format: 05xxxxxxxx (10 digits) -> 9665xxxxxxxx
    cleaned = '966' + cleaned.slice(1);
  }

  return cleaned.length >= 8 ? cleaned : DEFAULT_STORE_WHATSAPP_INTL;
}

/**
 * Formats WhatsApp phone number for clear admin display.
 */
export function formatWhatsAppDisplay(rawPhone?: string | null): string {
  const intl = normalizeWhatsAppPhone(rawPhone);
  if (intl.startsWith('964') && intl.length === 13) {
    const local = '0' + intl.slice(3);
    return `${local} (+${intl})`;
  }
  return `+${intl}`;
}

/**
 * Opens an external URL safely via anchor click (avoids window.open issues in iframes).
 */
export function openExternalLink(url: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
