/**
 * ISO 3166-1 alpha-2 code → country name, for admin displays.
 * Geo APIs store bare codes ("IN"); the UI shows full names ("India").
 * Unknown codes fall back to the raw value so nothing ever renders blank.
 */
const COUNTRY_NAMES: Record<string, string> = {
  AE: 'United Arab Emirates', AF: 'Afghanistan', AL: 'Albania', AM: 'Armenia', AR: 'Argentina',
  AT: 'Austria', AU: 'Australia', AZ: 'Azerbaijan', BA: 'Bosnia & Herzegovina', BD: 'Bangladesh',
  BE: 'Belgium', BG: 'Bulgaria', BH: 'Bahrain', BN: 'Brunei', BO: 'Bolivia', BR: 'Brazil',
  BY: 'Belarus', CA: 'Canada', CH: 'Switzerland', CL: 'Chile', CN: 'China', CO: 'Colombia',
  CR: 'Costa Rica', CY: 'Cyprus', CZ: 'Czechia', DE: 'Germany', DK: 'Denmark', DO: 'Dominican Republic',
  DZ: 'Algeria', EC: 'Ecuador', EE: 'Estonia', EG: 'Egypt', ES: 'Spain', ET: 'Ethiopia',
  FI: 'Finland', FR: 'France', GB: 'United Kingdom', GE: 'Georgia', GH: 'Ghana', GR: 'Greece',
  HK: 'Hong Kong', HR: 'Croatia', HU: 'Hungary', ID: 'Indonesia', IE: 'Ireland', IL: 'Israel',
  IN: 'India', IQ: 'Iraq', IR: 'Iran', IS: 'Iceland', IT: 'Italy', JM: 'Jamaica', JO: 'Jordan',
  JP: 'Japan', KE: 'Kenya', KH: 'Cambodia', KR: 'South Korea', KW: 'Kuwait', KZ: 'Kazakhstan',
  LB: 'Lebanon', LK: 'Sri Lanka', LT: 'Lithuania', LU: 'Luxembourg', LV: 'Latvia', LY: 'Libya',
  MA: 'Morocco', MD: 'Moldova', ME: 'Montenegro', MK: 'North Macedonia', MM: 'Myanmar', MN: 'Mongolia',
  MT: 'Malta', MV: 'Maldives', MX: 'Mexico', MY: 'Malaysia', NG: 'Nigeria', NL: 'Netherlands',
  NO: 'Norway', NP: 'Nepal', NZ: 'New Zealand', OM: 'Oman', PE: 'Peru', PH: 'Philippines',
  PK: 'Pakistan', PL: 'Poland', PT: 'Portugal', QA: 'Qatar', RO: 'Romania', RS: 'Serbia',
  RU: 'Russia', SA: 'Saudi Arabia', SD: 'Sudan', SE: 'Sweden', SG: 'Singapore', SI: 'Slovenia',
  SK: 'Slovakia', SN: 'Senegal', TH: 'Thailand', TN: 'Tunisia', TR: 'Turkey', TW: 'Taiwan',
  UA: 'Ukraine', UK: 'United Kingdom', US: 'United States', UY: 'Uruguay', UZ: 'Uzbekistan',
  VE: 'Venezuela', VN: 'Vietnam', YE: 'Yemen', ZA: 'South Africa', ZW: 'Zimbabwe',
};

export function countryName(code?: string | null): string {
  if (!code) return '';
  return COUNTRY_NAMES[code.trim().toUpperCase()] ?? code;
}
