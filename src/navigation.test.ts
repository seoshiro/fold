import { describe, it, expect } from "vitest";
import { cities, ui } from "./content";
describe("atlas content integrity", () => {
  it("has three unique cities and nine unique places", () => {
    expect(cities).toHaveLength(3);
    expect(new Set(cities.map((c) => c.id)).size).toBe(3);
    expect(cities.flatMap((c) => c.places)).toHaveLength(9);
    for (const c of cities)
      expect(new Set(c.places.map((p) => p.id)).size).toBe(3);
  });
  it("has complete English, Russian and Kazakh content", () => {
    for (const c of cities)
      for (const lang of ["en", "ru", "kk"] as const) {
        expect(c.name[lang].length).toBeGreaterThan(0);
        expect(c.subtitle[lang].length).toBeGreaterThan(0);
        expect(c.notes[lang].length).toBeGreaterThan(80);
        for (const p of c.places) {
          expect(p.name[lang].length).toBeGreaterThan(0);
          expect(p.kind[lang].length).toBeGreaterThan(0);
          expect(p.paragraphs[lang].join(" ").length).toBeGreaterThan(200);
          expect(p.teaser[lang].length).toBeGreaterThan(0);
          expect(p.source.url).toMatch(/^https:\/\//);
        }
      }
  });
  it("keeps locale key parity", () => {
    expect(Object.keys(ui.en).sort()).toEqual(Object.keys(ui.ru).sort());
    expect(Object.keys(ui.en).sort()).toEqual(Object.keys(ui.kk).sort());
    for (const l of Object.values(ui))
      for (const text of Object.values(l))
        expect(text.length).toBeGreaterThan(0);
  });
});

import { afterEach, vi } from 'vitest';
import { initialNavigation, navigationUrl, readLanguage, readSaved, safeGet, safeSet } from './navigation';
afterEach(() => vi.unstubAllGlobals());
describe('navigation and resilient storage', () => {
  const address = (query = '') => vi.stubGlobal('location', new URL('https://seoshiro.github.io/fold/' + query));
  it('validates city and story pairs in deep links', () => {
    address('?city=kyoto&place=gion');
    expect(initialNavigation()).toEqual({city:'kyoto',place:'gion'});
    address('?city=kyoto&place=belem');
    expect(initialNavigation()).toEqual({city:'kyoto',place:null});
    address('?city=invalid&place=gion');
    expect(initialNavigation()).toEqual({city:null,place:null});
  });
  it('retains deployment path and unrelated diagnostics when returning home', () => {
    address('?city=kyoto&place=gion&qa=1');
    expect(navigationUrl({city:null,place:null})).toBe('/fold/?qa=1');
    expect(navigationUrl({city:'almaty',place:'bazaar'})).toBe('/fold/?qa=1&city=almaty&place=bazaar');
  });
  it('deduplicates and validates saved places', () => {
    vi.stubGlobal('localStorage',{getItem:()=>JSON.stringify(['kyoto/gion','kyoto/gion','invalid/place',42,'lisbon/belem'])});
    expect(readSaved()).toEqual(['kyoto/gion','lisbon/belem']);
  });
  it('survives blocked, malformed and full browser storage', () => {
    vi.stubGlobal('localStorage',{getItem:()=>'{',setItem:()=>{throw Error('quota');}});
    expect(readSaved()).toEqual([]); expect(readLanguage()).toBe('en'); expect(safeSet('a','b')).toBe(false);
    vi.stubGlobal('localStorage',{getItem:()=>{throw Error('blocked');}});
    expect(readSaved()).toEqual([]); expect(safeGet('x')).toBeNull();
  });
});
