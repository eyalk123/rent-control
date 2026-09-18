/**
 * The account's country, and the table of what each country does (mobile).
 *
 * The web app holds this in React Query; mobile has no query layer, so it lives in a
 * context alongside the app's other providers — the same shape as `LegalConsentContext`,
 * for the same reasons.
 *
 * Both halves are cached in AsyncStorage: the account's country so a returning user never
 * gets a blocking screen flashed at them on a cold start, and the country table because it
 * is static reference data that changes with a release, not within a session.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppAuth } from '@/src/core/auth/AuthContext';
import { setActiveFormat, setKnownCurrencies } from '@/src/shared/utils/money';
import {
  setActiveCapabilities,
  setOpenEndedTenancies,
  setRevenueBasisDefault,
} from '@/src/shared/utils/capabilities';
import { setActiveRegistryKeys } from '@/src/shared/utils/registryLabels';
import { setActiveDialCode } from '@/src/shared/utils/whatsapp';
import { getCountries, getMyCountry, setMyCountry, type Country } from './api/countries';
import {
  getCurrencies,
  getMyPreferences,
  setMyPreferences,
  type Currency,
  type Preferences,
} from './api/currencies';
import { resolveEffectiveCurrency } from './effectiveCurrency';

/**
 * Account-scoped, so it is cleared on sign-out — the same reason
 * `LEGAL_CONSENT_CACHE_KEY` is: leaving it on the device hands one account's setting to
 * whoever signs in next.
 */
export const COUNTRY_CACHE_KEY = 'country.mine.v1';

/** Not account-scoped: the country table is the same for everyone and survives sign-out. */
export const COUNTRY_TABLE_CACHE_KEY = 'country.table.v1';

/** Reference data like the country table, and cached the same way. */
export const CURRENCY_TABLE_CACHE_KEY = 'currency.table.v1';

/** Account-scoped, like the country: cleared on sign-out for the same reason. */
export const PREFERENCES_CACHE_KEY = 'country.preferences.v1';

interface CountryValue {
  /** The account's ISO code, or null if the gate has not been answered. */
  country: string | null;
  /** Whether the country gate should be covering the app right now. */
  blocked: boolean;
  /** The whole table, for the picker and the formatters. Empty until loaded. */
  countries: Country[];
  /** The config row for the account's country, once both halves are known. */
  config: Country | undefined;
  /** Stores the choice. Does **not** dismiss the gate — see `finish`. */
  choose: (countryCode: string) => Promise<void>;
  /** Dismisses the gate. Kept separate from `choose` so one decision lives in one place. */
  finish: (countryCode: string) => void;
  /** Every currency, for the signup and settings pickers. Empty until loaded. */
  currencies: Currency[];
  /** What the account chose. Nulls mean "never chose" — the defaults still apply. */
  preferences: Preferences;
  /** Stores either preference. Rejects a currency change once a property exists (409). */
  savePreferences: (patch: Partial<Preferences>) => Promise<void>;
}

const CountryContext = createContext<CountryValue | null>(null);

export function CountryProvider({ children }: PropsWithChildren) {
  const { isSignedIn, isLoaded } = useAppAuth();
  const [country, setCountry] = useState<string | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  // Nothing blocks until the server has actually answered. This is the fail-open switch: a
  // slow or broken endpoint leaves `checked` false and the app usable, and the question is
  // asked again next launch. Only an explicit `country: null` gates anyone.
  const [checked, setChecked] = useState(false);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [preferences, setPreferences] = useState<Preferences>({ currency: null, language: null });

  // Hydrate both halves from cache first, so an existing user never sees the gate flash.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [mine, table, currencyTable, prefs] = await AsyncStorage.multiGet([
          COUNTRY_CACHE_KEY,
          COUNTRY_TABLE_CACHE_KEY,
          CURRENCY_TABLE_CACHE_KEY,
          PREFERENCES_CACHE_KEY,
        ]);
        if (cancelled) return;
        if (mine[1]) {
          setCountry(mine[1]);
          setChecked(true);
        }
        if (table[1]) setCountries(JSON.parse(table[1]) as Country[]);
        if (currencyTable[1]) setCurrencies(JSON.parse(currencyTable[1]) as Currency[]);
        if (prefs[1]) setPreferences(JSON.parse(prefs[1]) as Preferences);
      } catch {
        // A cache miss or a corrupt blob is not worth surfacing; the server is the truth.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Signing out drops the account's country but keeps the table. Gated on `isLoaded`
  // because Firebase reports "signed out" while it is still restoring the session, and
  // clearing on that would wipe the setting of the user who is about to be restored.
  useEffect(() => {
    if (!isLoaded || isSignedIn) return;
    setCountry(null);
    setChecked(false);
    setPreferences({ currency: null, language: null });
    AsyncStorage.multiRemove([COUNTRY_CACHE_KEY, PREFERENCES_CACHE_KEY]).catch(() => {});
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const server = await getMyCountry();
        if (cancelled) return;
        setCountry(server);
        setChecked(true);
        if (server) AsyncStorage.setItem(COUNTRY_CACHE_KEY, server).catch(() => {});

        const prefs = await getMyPreferences();
        if (cancelled) return;
        setPreferences(prefs);
        AsyncStorage.setItem(PREFERENCES_CACHE_KEY, JSON.stringify(prefs)).catch(() => {});
      } catch {
        // Offline, or the endpoint is down. Keep whatever the cache gave us rather than
        // putting a blocking screen in front of someone's own portfolio.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  // The table is public reference data, so it is fetched regardless of sign-in state.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [table, currencyTable] = await Promise.all([getCountries(), getCurrencies()]);
        if (cancelled) return;
        setCountries(table);
        setCurrencies(currencyTable);
        AsyncStorage.setItem(COUNTRY_TABLE_CACHE_KEY, JSON.stringify(table)).catch(() => {});
        AsyncStorage.setItem(CURRENCY_TABLE_CACHE_KEY, JSON.stringify(currencyTable)).catch(() => {});
      } catch {
        // Cached copy, or an empty picker with a retry. Not fatal.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const choose = useCallback(async (countryCode: string) => {
    await setMyCountry(countryCode);
    AsyncStorage.setItem(COUNTRY_CACHE_KEY, countryCode).catch(() => {});
  }, []);

  // Deliberately separate from `choose`: setting `country` is what lifts the gate, so the
  // gate stays the one thing that decides when it goes away rather than that being a side
  // effect of the write landing. Web's `useFinishCountrySetup` splits it the same way.
  const finish = useCallback((countryCode: string) => {
    setCountry(countryCode);
    setChecked(true);
  }, []);

  /**
   * Stores the currency and/or language. Throws on failure — a currency change is
   * refused with 409 once the account has a property, and that is an answer the caller
   * has to show rather than a transient error to swallow.
   */
  const savePreferences = useCallback(async (patch: Partial<Preferences>) => {
    const next = await setMyPreferences(patch);
    setPreferences(next);
    AsyncStorage.setItem(PREFERENCES_CACHE_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const config = useMemo(
    () => (country ? countries.find((c) => c.countryCode === country) : undefined),
    [country, countries],
  );

  // Publish the account's formats to the shared money/date/number helpers. Module state
  // rather than context because `formatMoney` is called from ~100 places, most of them deep
  // inside render functions where threading a config through would mean touching every
  // component in the chain. Until this resolves the helpers use their Israeli default,
  // which is what the app did before any of this existed — so there is no wrong-currency
  // flash, only the old behaviour for a moment.
  useEffect(() => {
    if (currencies.length) setKnownCurrencies(currencies);
  }, [currencies]);

  useEffect(() => {
    if (!config) return;
    setActiveCapabilities(config.capabilities);
    setOpenEndedTenancies(config.openEndedTenancies);
    setRevenueBasisDefault(config.revenueBasisDefault);
    setActiveRegistryKeys(config.registryKey1, config.registryKey2);
    setActiveDialCode(config.dialCode, config.countryCode);

    // The chosen currency where there is one, the country's own otherwise. The rule
    // lives in `effectiveCurrency.ts` so the formatter stays a formatter, and so this
    // app and the web app answer it identically.
    const currency = resolveEffectiveCurrency(config, currencies, preferences.currency);

    setActiveFormat({
      currency: currency?.code ?? config.currency,
      currencySymbol: currency?.symbol ?? config.currencySymbol,
      currencySymbolPosition: currency?.symbolPosition ?? config.currencySymbolPosition,
      // Spacing stays the country's even when the currency is one the country does not use:
      // it is how this reader writes money, not a property of the money. A German account
      // holding dollars still writes the symbol away from the number.
      currencySymbolSpaced: config.currencySymbolSpaced,
      currencyDecimals: currency?.decimals ?? 2,
      numberFormat: config.numberFormat,
      dateFormat: config.dateFormat,
      areaUnit: config.areaUnit,
    });
  }, [config, currencies, preferences.currency]);

  const value = useMemo(
    () => ({
      country,
      blocked: isSignedIn && checked && country == null,
      countries,
      config,
      choose,
      finish,
      currencies,
      preferences,
      savePreferences,
    }),
    [
      isSignedIn,
      checked,
      country,
      countries,
      config,
      choose,
      finish,
      currencies,
      preferences,
      savePreferences,
    ],
  );

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
}

export function useCountry(): CountryValue {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error('useCountry must be used within a CountryProvider');
  return ctx;
}
