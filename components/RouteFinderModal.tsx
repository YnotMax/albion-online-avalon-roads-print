import React, { useState } from 'react';
import { ALL_ZONES, getZoneType } from '../data/zoneNames';
import { findShortestPathToType, PathResult } from '../services/pathfinding';
import { getZoneConnections, MAP_CONNECTIONS, updateMapConnections } from '../data/mapConnections';
import { CustomLink } from '../types';

interface RouteFinderModalProps {
  onClose: () => void;
  connections: CustomLink[];
  onRouteFound?: (path: string[] | null) => void;
}

export const RouteFinderModal: React.FC<RouteFinderModalProps> = ({ onClose, connections, onRouteFound }) => {
  const [startZone, setStartZone] = useState('');
  const [targetType, setTargetType] = useState<'portal' | 'royal'>('portal');
  const [result, setResult] = useState<PathResult | null | undefined>(undefined);
  const [searched, setSearched] = useState(false);
  
  const [apiUrl, setApiUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ message: string; error: boolean } | null>(null);

  const handleSearch = () => {
    if (!startZone) return;
    const path = findShortestPathToType(startZone.trim(), targetType, connections);
    setResult(path);
    if (onRouteFound) {
      onRouteFound(path ? path.path : null);
    }
    setSearched(true);
  };

  const handleClose = () => {
    if (onRouteFound) onRouteFound(null);
    onClose();
  };

  const handleSyncApi = async () => {
    if (!apiUrl.trim()) return;
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Falha ao acessar a API');
      const data = await response.json();
      
      if (typeof data === 'object' && !Array.isArray(data)) {
        updateMapConnections(data);
        setSyncStatus({ message: 'Conexões atualizadas com sucesso!', error: false });
      } else {
        throw new Error('Formato de dados inválido. Esperado um objeto JSON: { "MapaA": ["MapaB", "MapaC"] }');
      }
    } catch (e: any) {
      setSyncStatus({ message: e.message || 'Erro de conexão.', error: true });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        updateMapConnections(data);
        setSyncStatus({ message: 'Arquivo carregado com sucesso!', error: false });
      } catch (err) {
        setSyncStatus({ message: 'Erro ao processar o arquivo JSON.', error: true });
      }
    };
    reader.readAsText(file);
  };

  // Autocomplete suggestion logic
  const suggestions = startZone 
    ? Array.from(ALL_ZONES).filter(z => z.toLowerCase().includes(startZone.toLowerCase())).slice(0, 5)
    : [];

  const graphSize = Object.keys(MAP_CONNECTIONS).length;

  return (
    <div className="fixed inset-0 bg-primary z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-secondary border border-border rounded-lg shadow-2xl max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-text-primary">Calculadora de Rotas (Distância)</h2>
          <button onClick={handleClose} className="text-text-secondary hover:text-text-primary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 text-text-secondary text-sm">
          <p className="mb-2">
            ⚠️ <strong>Grafo de Conexões:</strong> Atualmente temos <strong>{graphSize}</strong> mapas registrados.
          </p>
          {graphSize === 0 && (
            <p className="text-danger mb-4">
              Como não existem APIs comunitárias oficiais confiáveis mantendo este grafo atualizado, você precisará importar um arquivo JSON com as conexões (ex: <code>&#123; "ARTHUR'S REST": ["MAPA B"] &#125;</code>) ou informar uma API de terceiros.
            </p>
          )}
        </div>

        {graphSize === 0 && (
          <div className="mb-6 p-4 bg-primary border border-border rounded-md">
            <h3 className="font-bold mb-2">Importar Conexões (Comunidade / JSON)</h3>
            
            <div className="flex flex-col md:flex-row gap-2 mb-4">
              <input
                type="text"
                placeholder="URL da API da Comunidade (ex: https://...)"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="flex-1 bg-secondary border border-border rounded-md p-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                onClick={handleSyncApi}
                disabled={isSyncing || !apiUrl.trim()}
                className="bg-accent hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-md shadow-sm transition-colors duration-200 disabled:opacity-50"
              >
                {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
              </button>
            </div>
            
            <div className="text-center text-text-secondary my-2">ou</div>
            
            <label className="block w-full bg-tertiary hover:bg-tertiary/80 border border-border text-center font-bold py-2 px-4 rounded-md shadow-sm transition-colors duration-200 cursor-pointer">
              Fazer Upload de arquivo JSON
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>

            {syncStatus && (
              <p className={`mt-2 text-sm ${syncStatus.error ? 'text-danger' : 'text-success'}`}>
                {syncStatus.message}
              </p>
            )}
          </div>
        )}

        <div className="space-y-4 bg-primary p-4 rounded-md border border-border">
          <div>
            <label className="block text-text-secondary text-sm font-bold mb-2">
              Mapa de Origem (Ex: ZONA PRETA)
            </label>
            <input
              type="text"
              value={startZone}
              onChange={(e) => { 
                setStartZone(e.target.value); 
                setSearched(false); 
                if (onRouteFound) onRouteFound(null);
              }}
              placeholder="Digite o nome do mapa..."
              className="w-full bg-secondary border border-border rounded-md p-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent uppercase"
            />
            {suggestions.length > 0 && startZone && !suggestions.includes(startZone.toUpperCase()) && (
              <div className="mt-1 bg-secondary border border-border rounded-md max-h-32 overflow-y-auto">
                {suggestions.map(s => (
                  <div 
                    key={s} 
                    className="p-2 hover:bg-tertiary cursor-pointer text-sm"
                    onClick={() => { 
                      setStartZone(s); 
                      setSearched(false); 
                      if (onRouteFound) onRouteFound(null);
                    }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-text-secondary text-sm font-bold mb-2">
              Destino Desejado
            </label>
            <select
              value={targetType}
              onChange={(e) => { 
                setTargetType(e.target.value as 'portal' | 'royal'); 
                setSearched(false); 
                if (onRouteFound) onRouteFound(null);
              }}
              className="w-full bg-secondary border border-border rounded-md p-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="portal">Portal (Zona Preta)</option>
              <option value="royal">Zona Segura (Royal Continent)</option>
            </select>
          </div>

          <button
            onClick={handleSearch}
            disabled={graphSize === 0}
            className="w-full bg-accent hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-md shadow-sm transition-colors duration-200 disabled:bg-tertiary disabled:cursor-not-allowed"
          >
            Calcular Rota
          </button>
        </div>

        {searched && (
          <div className="mt-6 pt-4 border-t border-border">
            <h3 className="font-bold text-lg mb-2">Resultado:</h3>
            {result ? (
              <div className="bg-success/10 border border-success/30 rounded-md p-4 text-text-primary">
                <p className="font-bold text-success mb-2">Rota encontrada em {result.distance} mapas de distância!</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {result.path.map((zone, index) => (
                    <React.Fragment key={zone + index}>
                      <span className="px-2 py-1 bg-tertiary rounded text-sm border border-border">{zone}</span>
                      {index < result.path.length - 1 && <span className="text-text-secondary">➔</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-danger/10 border border-danger/30 rounded-md p-4 text-text-primary">
                <p className="text-danger">Nenhuma rota encontrada.</p>
                <p className="text-sm text-text-secondary mt-1">Verifique se o mapa de origem possui conexões cadastradas até o destino.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
