import data from "./countries+states+cities.json";

type RawCity = string;
type RawState = { name: string; cities?: RawCity[] };
type RawCountry = {
  name: string;
  iso2: string;
  phone_code?: string;
  continent: string;
  emoji?: string;
  states?: RawState[];
};

const DATA = data as RawCountry[];

export type CountryOption = { name: string; continent: string };

export const COUNTRIES: CountryOption[] = DATA.map((c) => ({
  name: c.name,
  continent: c.continent,
})).sort((a, b) => a.name.localeCompare(b.name));

export const COUNTRY_CONTINENT: Record<string, string> = Object.fromEntries(
  COUNTRIES.map((c) => [c.name, c.continent]),
);

export function getStates(country: string): string[] {
  const c = DATA.find((x) => x.name === country);
  if (!c?.states) return [];
  return c.states.map((s) => s.name).sort((a, b) => a.localeCompare(b));
}

export function getCities(country: string, state: string): string[] {
  const c = DATA.find((x) => x.name === country);
  const s = c?.states?.find((x) => x.name === state);
  if (!s?.cities) return [];
  return [...s.cities].sort((a, b) => a.localeCompare(b));
}
