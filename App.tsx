
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GraphCanvas } from './components/GraphCanvas';
import { Header } from './components/Header';
import { Instructions } from './components/Instructions';
import { useGraphData } from './hooks/useGraphData';
import { extractConnectionFromImage } from './services/geminiService';
import { Toast } from './components/Toast';
import { ManualInputForm } from './components/ManualInputForm';
import { DebugLog } from './components/DebugLog';
import logger from './services/logger';
import { AlbionConnection, PendingValidation, ZoneType } from './types';
import { ValidationModal } from './components/ValidationModal';
import { getApiKey, clearApiKey } from './services/apiKeyService';
import { ApiKeySetup } from './components/ApiKeySetup';
import { SettingsModal } from './components/SettingsModal';
import { MapManagerModal } from './components/MapManagerModal';
import { MapStorage, SavedMap } from './types';

const MAPS_STORAGE_KEY = 'avalonScribeMaps';

const App: React.FC = () => {
  const { nodes, links, addConnection, clearGraph, setGraph, updateNodeName, updateNodeType, hasUnsavedChanges, markAsSaved } = useGraphData();
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isLogVisible, setIsLogVisible] = useState(false);
  const [pendingValidation, setPendingValidation] = useState<PendingValidation | null>(null);
  const [isKeySet, setIsKeySet] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const [isMapManagerVisible, setIsMapManagerVisible] = useState(false);
  const [currentMapName, setCurrentMapName] = useState<string>('Novo Mapa');
  const [maps, setMaps] = useState<MapStorage>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (getApiKey()) {
      setIsKeySet(true);
    }
    
    // Load maps from storage
    const stored = localStorage.getItem(MAPS_STORAGE_KEY);
    if (stored) {
      try {
        const parsedMaps: MapStorage = JSON.parse(stored);
        setMaps(parsedMaps);
        
        // Load last used map if available
        const lastMapName = localStorage.getItem('avalonScribeLastMap');
        if (lastMapName && parsedMaps[lastMapName]) {
          setGraph(parsedMaps[lastMapName].data);
          setCurrentMapName(lastMapName);
        }
      } catch (e) {
        console.error('Failed to load maps', e);
      }
    }
  }, []);

  // Reusable function to process an image file (from paste or upload)
  const processImageFile = useCallback(async (imageFile: File) => {
    logger.info('Processing image file...');
    setIsLoading(true);
    setToast(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onload = async () => {
        try {
          const base64ImageWithHeader = reader.result as string;
          const base64Image = base64ImageWithHeader.split(',')[1];
          const connectionData = await extractConnectionFromImage(base64Image);
          
          if (connectionData && connectionData.origem && connectionData.destino && connectionData.minutos_ate_fechar != null) {
            setPendingValidation({
              connection: connectionData,
              image: base64ImageWithHeader,
            });
          } else {
            throw new Error('Could not extract complete connection data from image.');
          }
        } catch (error) {
          console.error(error);
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
          setToast({ message: `AI Error: ${errorMessage}`, type: 'error' });
          logger.error(`AI processing failed: ${errorMessage}`);
        } finally {
          setIsLoading(false);
        }
      };
      reader.onerror = () => {
          setIsLoading(false);
          const errorMsg = 'Failed to read the image file.';
          setToast({ message: errorMsg, type: 'error' });
          logger.error(errorMsg);
      };
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred processing the image.';
      setToast({ message: errorMessage, type: 'error' });
      logger.error(`Image processing error: ${errorMessage}`);
    }
  }, []);
  
  const handlePaste = useCallback(async (event: ClipboardEvent) => {
    if (isLoading || pendingValidation) return;

    logger.info('Paste event detected.');
    const items = event.clipboardData?.items;
    if (!items) {
        logger.error('Clipboard data or items are null.');
        return;
    };

    let imageFile: File | null = null;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        imageFile = item.getAsFile();
        break;
      }
    }

    if (!imageFile) {
      // Only show toast if no image found IF we want to be strict, 
      // but normally we don't want to error on pasting text. 
      // However, logic stays consistent with original requirement to warn if no image.
      // setToast({ message: 'No image found on clipboard.', type: 'error' }); 
      logger.warn('No image file found on clipboard.');
      return;
    }

    await processImageFile(imageFile);

  }, [isLoading, pendingValidation, processImageFile]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);
  
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        processImageFile(file);
    }
    // Reset input so same file can be selected again if needed
    if (event.target) {
        event.target.value = '';
    }
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
        fileInputRef.current.click();
    }
  };

  const saveMap = (name?: string) => {
    const mapName = name || currentMapName;
    if (!mapName || mapName === 'Novo Mapa') {
      const newName = prompt('Digite um nome para este mapa:', currentMapName);
      if (!newName) return;
      setCurrentMapName(newName);
      saveMap(newName);
      return;
    }

    try {
      // Clean links to ensure we save IDs, not circular node objects from ForceGraph
      const cleanLinks = links.map(link => ({
        ...link,
        source: typeof link.source === 'object' ? (link.source as any).id : link.source,
        target: typeof link.target === 'object' ? (link.target as any).id : link.target,
      }));

      const mapData = { nodes, links: cleanLinks };
      const newMaps = { ...maps };
      
      newMaps[mapName] = {
        name: mapName,
        data: mapData,
        lastModified: Date.now()
      };

      setMaps(newMaps);
      localStorage.setItem(MAPS_STORAGE_KEY, JSON.stringify(newMaps));
      localStorage.setItem('avalonScribeLastMap', mapName);
      markAsSaved();
      setToast({ message: `Mapa "${mapName}" salvo com sucesso!`, type: 'success' });
      logger.info(`Map "${mapName}" saved to localStorage.`);
    } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        setToast({ message: 'Falha ao salvar mapa.', type: 'error' });
        logger.error(`Failed to save map: ${error}`);
    }
  };

  const handleLoadMap = (map: SavedMap) => {
    setGraph(map.data);
    setCurrentMapName(map.name);
    localStorage.setItem('avalonScribeLastMap', map.name);
    setIsMapManagerVisible(false);
    setToast({ message: `Mapa "${map.name}" carregado!`, type: 'success' });
  };

  const handleDeleteMap = (name: string) => {
    if (confirm(`Tem certeza que deseja excluir o mapa "${name}"?`)) {
      const newMaps = { ...maps };
      delete newMaps[name];
      setMaps(newMaps);
      localStorage.setItem(MAPS_STORAGE_KEY, JSON.stringify(newMaps));
      
      if (currentMapName === name) {
        setCurrentMapName('Novo Mapa');
        clearGraph();
      }
      
      setToast({ message: `Mapa "${name}" excluído.`, type: 'success' });
    }
  };

  const handleNewMap = () => {
    clearGraph();
    setCurrentMapName('Novo Mapa');
    setIsMapManagerVisible(false);
    setToast({ message: 'Novo mapa iniciado.', type: 'success' });
  };

  const handleNodeUpdate = (oldName: string, newName: string) => {
    const success = updateNodeName(oldName, newName);
    if (success) {
      setToast({ message: `Renamed "${oldName}" to "${newName}".`, type: 'success' });
      logger.info(`Node renamed from ${oldName} to ${newName}`);
    } else {
      setToast({ message: `Failed to rename. Zone "${newName}" might already exist.`, type: 'error' });
      logger.error(`Failed to rename node from ${oldName} to ${newName}.`);
    }
  };

  const handleNodeTypeUpdate = (nodeId: string, type: ZoneType) => {
    updateNodeType(nodeId, type);
  };

  const handleValidationConfirm = (validatedConnection: AlbionConnection) => {
    addConnection(validatedConnection);
    const successMsg = `Added: ${validatedConnection.origem} -> ${validatedConnection.destino}`;
    setToast({ message: successMsg, type: 'success' });
    logger.info(`User confirmed connection: ${successMsg}`);
    setPendingValidation(null);
  };

  const handleValidationCancel = () => {
    setToast({ message: 'Connection discarded.', type: 'error' });
    logger.warn('User discarded pending connection.');
    setPendingValidation(null);
  };

  return (
    <div className="flex flex-col h-screen bg-primary overflow-hidden">
      {!isKeySet && <ApiKeySetup onKeySet={() => setIsKeySet(true)} />}
      
      <Header 
        onClear={clearGraph} 
        onLoad={() => setIsMapManagerVisible(true)} 
        onSave={() => saveMap()} 
        onUpload={triggerFileUpload}
        onToggleForm={() => setIsFormVisible(!isFormVisible)}
        isFormVisible={isFormVisible}
        onToggleLog={() => setIsLogVisible(!isLogVisible)}
        isLogVisible={isLogVisible}
        onOpenSettings={() => setIsSettingsVisible(true)}
      />
      
      <div className="bg-tertiary/20 px-4 py-2 border-b border-border flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest leading-none mb-1">Mapa Atual</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-accent">{currentMapName}</span>
              {hasUnsavedChanges && (
                <span className="text-[9px] bg-danger/20 text-danger px-1.5 py-0.5 rounded-md font-bold animate-pulse border border-danger/30">
                  NÃO SALVO
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              const newName = prompt('Renomear mapa para:', currentMapName);
              if (newName && newName.trim()) {
                setCurrentMapName(newName.trim());
                setToast({ message: `Mapa renomeado para "${newName.trim()}". Lembre-se de salvar!`, type: 'success' });
              }
            }}
            className="px-3 py-1 text-[10px] bg-tertiary hover:bg-tertiary/80 text-text-primary rounded border border-border transition-colors uppercase font-bold"
          >
            Renomear
          </button>
          <button 
            onClick={() => {
              const newName = prompt('Salvar uma cópia como:', `${currentMapName} (Cópia)`);
              if (newName && newName.trim()) {
                saveMap(newName.trim());
              }
            }}
            className="px-3 py-1 text-[10px] bg-accent/10 hover:bg-accent/20 text-accent rounded border border-accent/30 transition-colors uppercase font-bold"
          >
            Salvar Como
          </button>
        </div>
      </div>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileUpload} 
      />
      
      {isFormVisible && (
        <ManualInputForm 
          onAddConnection={(conn) => {
            addConnection(conn);
            setToast({ message: `Manual connection added: ${conn.origem} -> ${conn.destino}`, type: 'success' });
          }} 
        />
      )}

      <main className="flex-grow relative">
        <GraphCanvas 
            nodes={nodes} 
            links={links} 
            onNodeUpdate={handleNodeUpdate} 
            onNodeTypeUpdate={handleNodeTypeUpdate}
        />
        {nodes.length === 0 && !isLoading && <Instructions />}
        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-20 space-y-4">
            <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="text-lg text-text-primary">Scribing the path... AI is thinking.</p>
            <p className="text-sm text-text-secondary">This may take a moment.</p>
          </div>
        )}
      </main>

      <DebugLog isVisible={isLogVisible} />

      {pendingValidation && (
        <ValidationModal 
          data={pendingValidation}
          onConfirm={handleValidationConfirm}
          onCancel={handleValidationCancel}
        />
      )}

      {isMapManagerVisible && (
        <MapManagerModal 
          onClose={() => setIsMapManagerVisible(false)}
          onLoadMap={handleLoadMap}
          onDeleteMap={handleDeleteMap}
          onNewMap={handleNewMap}
          currentMapName={currentMapName}
          hasUnsavedChanges={hasUnsavedChanges}
          maps={maps}
        />
      )}

      {isSettingsVisible && (
        <SettingsModal 
          onClose={() => setIsSettingsVisible(false)} 
          onKeyReset={() => {
            setIsKeySet(false);
            setToast({ message: 'API Key removed. Please set a new one.', type: 'error' });
          }}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default App;
