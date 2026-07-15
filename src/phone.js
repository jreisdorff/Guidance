// Phone sign-in data + formatting, shared by SignIn and CountryDropdown.

// Country dial codes for the phone sign-in dropdown. `dial` has no leading "+";
// `max` caps the national number length (used for masking and validation).
export const COUNTRIES = [
  { iso: 'US', name: 'United States', dial: '1', flag: '🇺🇸', max: 10 },
  { iso: 'CA', name: 'Canada', dial: '1', flag: '🇨🇦', max: 10 },
  { iso: 'GB', name: 'United Kingdom', dial: '44', flag: '🇬🇧', max: 10 },
  { iso: 'AU', name: 'Australia', dial: '61', flag: '🇦🇺', max: 9 },
  { iso: 'IN', name: 'India', dial: '91', flag: '🇮🇳', max: 10 },
  { iso: 'IE', name: 'Ireland', dial: '353', flag: '🇮🇪', max: 9 },
  { iso: 'DE', name: 'Germany', dial: '49', flag: '🇩🇪', max: 11 },
  { iso: 'FR', name: 'France', dial: '33', flag: '🇫🇷', max: 9 },
  { iso: 'ES', name: 'Spain', dial: '34', flag: '🇪🇸', max: 9 },
  { iso: 'IT', name: 'Italy', dial: '39', flag: '🇮🇹', max: 10 },
  { iso: 'NL', name: 'Netherlands', dial: '31', flag: '🇳🇱', max: 9 },
  { iso: 'MX', name: 'Mexico', dial: '52', flag: '🇲🇽', max: 10 },
  { iso: 'BR', name: 'Brazil', dial: '55', flag: '🇧🇷', max: 11 },
  { iso: 'JP', name: 'Japan', dial: '81', flag: '🇯🇵', max: 10 },
  { iso: 'KR', name: 'South Korea', dial: '82', flag: '🇰🇷', max: 10 },
  { iso: 'NZ', name: 'New Zealand', dial: '64', flag: '🇳🇿', max: 9 },
  { iso: 'SG', name: 'Singapore', dial: '65', flag: '🇸🇬', max: 8 },
  { iso: 'AE', name: 'United Arab Emirates', dial: '971', flag: '🇦🇪', max: 9 },
]

// Progressive display mask. NANP (+1) numbers get "(XXX) XXX-XXXX"; everything
// else is grouped into threes. Input is digits only.
export function formatPhone(digits, dial) {
  const d = digits.replace(/\D/g, '')
  if (dial === '1') {
    if (d.length > 6) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`
    if (d.length > 3) return `(${d.slice(0, 3)}) ${d.slice(3)}`
    if (d.length > 0) return `(${d}`
    return ''
  }
  return d.replace(/(.{3})(?=.)/g, '$1 ').trim()
}
