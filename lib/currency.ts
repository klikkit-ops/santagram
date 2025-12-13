// Currency configuration with approximate conversion rates from GBP
// Base price: £2.99

export interface CurrencyConfig {
    code: string;
    symbol: string;
    price: number; // Price in cents/pence
    displayPrice: string;
}

// Predefined prices for major currencies (rounded to x.99)
export const currencies: Record<string, CurrencyConfig> = {
    GBP: { code: 'GBP', symbol: '£', price: 299, displayPrice: '£2.99' },
    USD: { code: 'USD', symbol: 'US$', price: 399, displayPrice: 'US$3.99' },
    EUR: { code: 'EUR', symbol: '€', price: 349, displayPrice: '€3.49' },
    CAD: { code: 'CAD', symbol: 'CA$', price: 599, displayPrice: 'CA$5.99' },
    AUD: { code: 'AUD', symbol: 'A$', price: 599, displayPrice: 'A$5.99' },
    NZD: { code: 'NZD', symbol: 'NZ$', price: 649, displayPrice: 'NZ$6.49' },
    CHF: { code: 'CHF', symbol: 'CHF', price: 349, displayPrice: 'CHF 3.49' },
    SEK: { code: 'SEK', symbol: 'kr', price: 3999, displayPrice: '39.99 kr' },
    NOK: { code: 'NOK', symbol: 'kr', price: 3999, displayPrice: '39.99 kr' },
    DKK: { code: 'DKK', symbol: 'kr', price: 2499, displayPrice: '24.99 kr' },
    PLN: { code: 'PLN', symbol: 'zł', price: 1499, displayPrice: '14.99 zł' },
    INR: { code: 'INR', symbol: '₹', price: 29900, displayPrice: '₹299' },
    JPY: { code: 'JPY', symbol: '¥', price: 599, displayPrice: '¥599' },
    SGD: { code: 'SGD', symbol: 'S$', price: 499, displayPrice: 'S$4.99' },
    HKD: { code: 'HKD', symbol: 'HK$', price: 2999, displayPrice: 'HK$29.99' },
    MXN: { code: 'MXN', symbol: 'MX$', price: 6999, displayPrice: 'MX$69.99' },
    BRL: { code: 'BRL', symbol: 'R$', price: 1999, displayPrice: 'R$19.99' },
    ZAR: { code: 'ZAR', symbol: 'R', price: 6999, displayPrice: 'R69.99' },
};

// Country to currency mapping
export const countryToCurrency: Record<string, string> = {
    GB: 'GBP', UK: 'GBP',
    US: 'USD',
    DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', IE: 'EUR', PT: 'EUR', FI: 'EUR', GR: 'EUR',
    CA: 'CAD',
    AU: 'AUD',
    NZ: 'NZD',
    CH: 'CHF',
    SE: 'SEK',
    NO: 'NOK',
    DK: 'DKK',
    PL: 'PLN',
    IN: 'INR',
    JP: 'JPY',
    SG: 'SGD',
    HK: 'HKD',
    MX: 'MXN',
    BR: 'BRL',
    ZA: 'ZAR',
};

// Default currency if country not detected
export const DEFAULT_CURRENCY = 'GBP';

export function getCurrencyForCountry(countryCode: string): CurrencyConfig {
    const currencyCode = countryToCurrency[countryCode.toUpperCase()] || DEFAULT_CURRENCY;
    return currencies[currencyCode] || currencies[DEFAULT_CURRENCY];
}

export function getCurrencyByCode(code: string): CurrencyConfig {
    return currencies[code.toUpperCase()] || currencies[DEFAULT_CURRENCY];
}
