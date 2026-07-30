
import React, { useState, useEffect } from 'react';
import { SavedMap, MapStorage, GraphData } from '../types';
import { TrashIcon, PlusIcon, XIcon } from './icons';

interface MapManagerModalProps {
  onClose: () => void;
  onLoadMap: (map: SavedMap) => void;
  onDeleteMap: (name: string) => void;
  onNewMap: () => void;
  onImportMap: (map: SavedMap) => void;
  currentMapName: string;
  hasUnsavedChanges: boolean;
  maps: MapStorage;
}

export const MapManagerModal: React.FC<MapManagerModalProps> = ({ 
  onClose, 
  onLoadMap, 
  onDeleteMap, 
  onNewMap,
  onImportMap,
  currentMapName,
  hasUnsavedChanges,
  maps
}) => {
  const [showConfirm, setShowConfirm] = useState<{ type: 'load' | 'new' | 'delete', target?: string } | null>(null);

  const handleAction = (type: 'load' | 'new', target?: string) => {
    if (hasUnsavedChanges) {
      setShowConfirm({ type, target });
    } else {
      if (type === 'load' && target) {
        onLoadMap(maps[target]);
      } else if (type === 'new') {
        onNewMap();
      }
    }
  };

  const confirmAction = () => {
    if (!showConfirm) return;

    if (showConfirm.type === 'load' && showConfirm.target) {
      onLoadMap(maps[showConfirm.target]);
    } else if (showConfirm.type === 'new') {
      onNewMap();
    }
    setShowConfirm(null);
  };

  const sortedMaps = (Object.values(maps) as SavedMap[]).sort((a, b) => b.lastModified - a.lastModified);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-secondary border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
        <div className="p-4 border-b border-border flex justify-between items-center bg-tertiary/30">
          <h2 className="text-xl font-bold text-accent">Gerenciador de Mapas</h2>
          <button onClick={onClose} className="p-1 hover:bg-tertiary rounded-md transition-colors">
            <XIcon />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <button 
              onClick={() => handleAction('new')}
              className="flex-1 flex items-center justify-center gap-2 p-3 bg-accent/10 border border-accent/20 hover:bg-accent/20 text-accent rounded-lg transition-all font-semibold"
            >
              <PlusIcon /> Novo Mapa
            </button>
            <label className="flex-1 flex items-center justify-center gap-2 p-3 bg-tertiary border border-border hover:bg-tertiary/80 text-text-primary rounded-lg transition-all font-semibold cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Importar JSON
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const data = JSON.parse(event.target?.result as string);
                      if (data.name && data.data && data.data.nodes && data.data.links) {
                        onImportMap(data as SavedMap);
                      } else {
                        alert('Arquivo JSON inválido para mapa.');
                      }
                    } catch (err) {
                      alert('Erro ao processar arquivo JSON.');
                    }
                  };
                  reader.readAsText(file);
                  // Reset input
                  e.target.value = '';
                }}
              />
            </label>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            {sortedMaps.length === 0 ? (
              <p className="text-center text-text-secondary py-8 italic">Nenhum mapa salvo ainda.</p>
            ) : (
              sortedMaps.map((map: SavedMap) => (
                <div 
                  key={map.name}
                  className={`group flex items-center justify-between p-3 rounded-lg border transition-all ${
                    currentMapName === map.name 
                      ? 'bg-accent/5 border-accent/30' 
                      : 'bg-tertiary/20 border-border hover:border-accent/40'
                  }`}
                >
                  <div 
                    className="flex-grow cursor-pointer"
                    onClick={() => handleAction('load', map.name)}
                  >
                    <h3 className={`font-bold ${currentMapName === map.name ? 'text-accent' : 'text-text-primary'}`}>
                      {map.name}
                    </h3>
                    <p className="text-xs text-text-secondary">
                      Modificado em: {new Date(map.lastModified).toLocaleString()}
                    </p>
                  </div>
                  
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(map, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${map.name}.json`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }}
                      className="group/export relative p-2 text-text-secondary hover:text-accent hover:bg-accent/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                      aria-label="Exportar mapa"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      <span className="pointer-events-none absolute bottom-full mb-2 right-0 whitespace-nowrap rounded bg-[#0D1117] border border-[#30363D] px-2 py-1 text-xs text-[#C9D1D9] opacity-0 transition-opacity group-hover/export:opacity-100 z-50">
                        Exportar mapa
                      </span>
                    </button>
                    
                    <button 
                      onClick={() => onDeleteMap(map.name)}
                      className="group/del relative p-2 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                      aria-label="Excluir mapa"
                    >
                      <TrashIcon />
                      <span className="pointer-events-none absolute bottom-full mb-2 right-0 whitespace-nowrap rounded bg-[#0D1117] border border-[#30363D] px-2 py-1 text-xs text-[#C9D1D9] opacity-0 transition-opacity group-hover/del:opacity-100 z-50">
                        Excluir mapa
                      </span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {showConfirm && (
          <div className="absolute inset-0 bg-secondary/95 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <h3 className="text-xl font-bold text-danger mb-2">Alterações não salvas!</h3>
            <p className="text-text-secondary mb-6">
              O mapa atual possui alterações que serão perdidas. Deseja continuar mesmo assim?
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setShowConfirm(null)}
                className="flex-1 p-2 bg-tertiary hover:bg-tertiary/80 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmAction}
                className="flex-1 p-2 bg-danger hover:bg-danger/80 text-white rounded-lg transition-colors font-bold"
              >
                Continuar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
