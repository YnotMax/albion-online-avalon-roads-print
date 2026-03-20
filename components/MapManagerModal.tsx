
import React, { useState, useEffect } from 'react';
import { SavedMap, MapStorage, GraphData } from '../types';
import { TrashIcon, PlusIcon, XIcon } from './icons';

interface MapManagerModalProps {
  onClose: () => void;
  onLoadMap: (map: SavedMap) => void;
  onDeleteMap: (name: string) => void;
  onNewMap: () => void;
  currentMapName: string;
  hasUnsavedChanges: boolean;
  maps: MapStorage;
}

export const MapManagerModal: React.FC<MapManagerModalProps> = ({ 
  onClose, 
  onLoadMap, 
  onDeleteMap, 
  onNewMap,
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
          <button 
            onClick={() => handleAction('new')}
            className="w-full flex items-center justify-center gap-2 p-3 bg-accent/10 border border-accent/20 hover:bg-accent/20 text-accent rounded-lg transition-all font-semibold"
          >
            <PlusIcon /> Novo Mapa
          </button>

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
                  
                  <button 
                    onClick={() => onDeleteMap(map.name)}
                    className="p-2 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                    title="Excluir mapa"
                  >
                    <TrashIcon />
                  </button>
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
