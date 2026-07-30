import fs from 'fs';
import { MAP_CONNECTIONS } from './data/mapConnections';

const royal = JSON.parse(fs.readFileSync('royal_zones.json', 'utf8'));
const black = JSON.parse(fs.readFileSync('black_zones.json', 'utf8'));

// The remaining zones in our Map graph that are neither
const allKnown = Object.keys(MAP_CONNECTIONS);
const otherZones = allKnown.filter(z => !royal.includes(z) && !black.includes(z));

const content = `// A comprehensive list of known zone names in Albion Online.
// Generated dynamically from the connection graph.

export const ROYAL_ZONES: ReadonlySet<string> = new Set(${JSON.stringify(royal, null, 2)});

export const BLACK_ZONES: ReadonlySet<string> = new Set(${JSON.stringify(black, null, 2)});

export const OTHER_ZONES: ReadonlySet<string> = new Set(${JSON.stringify(otherZones, null, 2)});

export const ALL_ZONES: ReadonlySet<string> = new Set([
  ...ROYAL_ZONES,
  ...BLACK_ZONES,
  ...OTHER_ZONES
]);

export type ZoneType = 'royal' | 'black' | 'avalon' | 'unknown';

export function getZoneType(zoneName: string): ZoneType {
    const upperCaseName = zoneName.toUpperCase();
    
    if (ROYAL_ZONES.has(upperCaseName)) return 'royal';
    if (BLACK_ZONES.has(upperCaseName)) return 'black';
    
    // Heuristics for Avalonian Roads (e.g. XASES-ATRAGLOS, TIR-NA-LIA)
    if (/^[A-Z]{3,7}-[A-Z]{3,8}(-[A-Z]{3,8})?$/.test(upperCaseName)) {
        return 'avalon';
    }
    if (upperCaseName.includes("BRECILIEN")) return 'avalon';
    
    return 'unknown';
}
`;

fs.writeFileSync('data/zoneNames.ts', content);
console.log('Updated data/zoneNames.ts');
