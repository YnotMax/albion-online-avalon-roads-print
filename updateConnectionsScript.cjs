const fs = require('fs');

const data = fs.readFileSync('extracted_connections.json', 'utf8');

const content = `// Grafo de conexões extraído para cálculo de rotas no Albion Online
// As conexões são bidirecionais.

export let MAP_CONNECTIONS: Record<string, string[]> = ${data};

export function updateMapConnections(newData: Record<string, string[]>) {
    MAP_CONNECTIONS = newData;
}

// Helper function to get connections for a zone
export function getZoneConnections(zoneName: string): string[] {
  const upperZone = zoneName.toUpperCase();
  return MAP_CONNECTIONS[upperZone] || [];
}
`;

fs.writeFileSync('data/mapConnections.ts', content);
console.log('Successfully wrote data/mapConnections.ts');
