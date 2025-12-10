'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CurrencyConfig, getCurrencyForCountry, currencies, DEFAULT_CURRENCY } from '@/lib/currency';

interface CurrencyContextType {
    currency: CurrencyConfig;
    isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType>({
    currency: currencies[DEFAULT_CURRENCY],
    isLoading: true,
});

export function useCurrency() {
    return useContext(CurrencyContext);
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const [currency, setCurrency] = useState<CurrencyConfig>(currencies[DEFAULT_CURRENCY]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function detectCurrency() {
            try {
                // Try to get country from IP using a free geolocation API
                const response = await fetch('https://ipapi.co/json/', {
                    signal: AbortSignal.timeout(3000), // 3 second timeout
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.country_code) {
                        setCurrency(getCurrencyForCountry(data.country_code));
                    }
                }
            } catch {
                // If geolocation fails, try browser locale
                const browserLocale = navigator.language || 'en-GB';
                const countryCode = browserLocale.split('-')[1] || 'GB';
                setCurrency(getCurrencyForCountry(countryCode));
            } finally {
                setIsLoading(false);
            }
        }

        detectCurrency();
    }, []);

    return (
        <CurrencyContext.Provider value={{ currency, isLoading }}>
            {children}
        </CurrencyContext.Provider>
    );
}
