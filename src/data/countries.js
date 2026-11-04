export const COUNTRIES = [
  { code: 'GH', name: 'Ghana', currency: 'GHS', symbol: '₵' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', symbol: '₦' },
  { code: 'KE', name: 'Kenya', currency: 'KES', symbol: 'KSh' },
  { code: 'TZ', name: 'Tanzania', currency: 'TZS', symbol: 'TSh' },
  { code: 'UG', name: 'Uganda', currency: 'UGX', symbol: 'USh' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', symbol: 'R' },
  { code: 'EG', name: 'Egypt', currency: 'EGP', symbol: 'E£' },
  { code: 'MA', name: 'Morocco', currency: 'MAD', symbol: 'MAD' },
  { code: 'ET', name: 'Ethiopia', currency: 'ETB', symbol: 'Br' },
  { code: 'RW', name: 'Rwanda', currency: 'RWF', symbol: 'RF' },
  { code: 'ZM', name: 'Zambia', currency: 'ZMW', symbol: 'K' },
  { code: 'ZW', name: 'Zimbabwe', currency: 'ZWL', symbol: 'Z$' },
  { code: 'CI', name: "Côte d'Ivoire", currency: 'XOF', symbol: 'CFA' },
  { code: 'SN', name: 'Senegal', currency: 'XOF', symbol: 'CFA' },
  { code: 'BF', name: 'Burkina Faso', currency: 'XOF', symbol: 'CFA' },
  { code: 'CM', name: 'Cameroon', currency: 'XAF', symbol: 'CFA' },
  { code: 'CD', name: 'DR Congo', currency: 'CDF', symbol: 'FC' },
  { code: 'MG', name: 'Madagascar', currency: 'MGA', symbol: 'Ar' },
]

export const DEFAULT_COUNTRY = 'GH'

export function getCountry(countryCode) {
  return COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0]
}

export function currencyForCountry(countryCode) {
  return getCountry(countryCode).currency
}

export const CURRENCIES = [
  ...new Map(COUNTRIES.map((c) => [c.currency, { code: c.currency, symbol: c.symbol }])).values(),
]
