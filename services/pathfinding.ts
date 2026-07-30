import { getZoneConnections } from '../data/mapConnections';
import { getZoneType, ZoneType } from '../data/zoneNames';
import { CustomLink } from '../types';

export interface PathResult {
  distance: number;
  path: string[]; // List of zone names from start to target
  targetZone: string;
}

/**
 * Finds the shortest path from a starting zone to a target zone type (e.g. 'black' portal, 'royal')
 * Uses Breadth-First Search (BFS) to find the shortest distance in maps (hops).
 */
export function findShortestPathToType(startZone: string, targetType: ZoneType | 'portal', customConnections: CustomLink[] = []): PathResult | null {
  const startUpper = startZone.toUpperCase();
  
  // Build a custom adjacency map for user-drawn connections
  const customAdjacency: Record<string, string[]> = {};
  customConnections.forEach(c => {
      const src = c.source as any;
      const tgt = c.target as any;
      if (!src || !tgt) return;
      
      // Handle force-graph object links or string links
      const sourceId = (typeof src === 'object' && src.id) ? src.id : src;
      const targetId = (typeof tgt === 'object' && tgt.id) ? tgt.id : tgt;
      
      const uFrom = String(sourceId).toUpperCase();
      const uTo = String(targetId).toUpperCase();
      if (!customAdjacency[uFrom]) customAdjacency[uFrom] = [];
      if (!customAdjacency[uTo]) customAdjacency[uTo] = [];
      customAdjacency[uFrom].push(uTo);
      customAdjacency[uTo].push(uFrom);
  });

  // Queue for BFS: stores [currentZone, pathTaken]
  const queue: [string, string[]][] = [[startUpper, [startUpper]]];
  const visited = new Set<string>();
  visited.add(startUpper);

  while (queue.length > 0) {
    const [currentZone, path] = queue.shift()!;

    // Check if the current zone matches the target criteria
    // (excluding the start zone itself if we want distance > 0, 
    // but if start is already the target, distance is 0)
    if (path.length > 1) {
       const type = getZoneType(currentZone);
       if (targetType === 'portal') {
           if (type === 'black' && currentZone.includes('PORTAL')) {
               return { distance: path.length - 1, path, targetZone: currentZone };
           }
       } else if (type === targetType) {
           return { distance: path.length - 1, path, targetZone: currentZone };
       }
    }

    // Get neighbors: NATIVE + CUSTOM
    const nativeNeighbors = getZoneConnections(currentZone);
    const customNeighbors = customAdjacency[currentZone] || [];
    
    // Combine and deduplicate
    const allNeighbors = Array.from(new Set([...nativeNeighbors, ...customNeighbors]));
    
    for (const neighbor of allNeighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([neighbor, [...path, neighbor]]);
      }
    }
  }

  return null; // No path found
}
