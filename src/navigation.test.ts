import {describe,it,expect} from 'vitest';
import {cities,ui} from './content';
describe('atlas content integrity',()=>{
 it('has three unique cities and nine unique places',()=>{expect(cities).toHaveLength(3);expect(new Set(cities.map(c=>c.id)).size).toBe(3);expect(cities.flatMap(c=>c.places)).toHaveLength(9);for(const c of cities)expect(new Set(c.places.map(p=>p.id)).size).toBe(3)});
 it('has complete English, Russian and Kazakh content',()=>{for(const c of cities)for(const lang of ['en','ru','kk'] as const){expect(c.name[lang].length).toBeGreaterThan(0);expect(c.subtitle[lang].length).toBeGreaterThan(0);expect(c.notes[lang].length).toBeGreaterThan(80);for(const p of c.places){expect(p.name[lang].length).toBeGreaterThan(0);expect(p.kind[lang].length).toBeGreaterThan(0);expect(p.paragraphs[lang].join(' ').length).toBeGreaterThan(200);expect(p.teaser[lang].length).toBeGreaterThan(0);expect(p.source.url).toMatch(/^https:\/\//)}}});
 it('keeps locale key parity',()=>{expect(Object.keys(ui.en).sort()).toEqual(Object.keys(ui.ru).sort());expect(Object.keys(ui.en).sort()).toEqual(Object.keys(ui.kk).sort());for(const l of Object.values(ui))for(const text of Object.values(l))expect(text.length).toBeGreaterThan(0)});
});
