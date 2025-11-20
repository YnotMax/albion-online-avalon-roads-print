
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

const App: React.FC = () => {
  const { nodes, links, addConnection, clearGraph, setGraph, updateNodeName, updateNodeType } = useGraphData();
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isLogVisible, setIsLogVisible] = useState(false);
  const [pendingValidation, setPendingValidation] = useState<PendingValidation | null>(null);
  const [isKeySet, setIsKeySet] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (getApiKey()) {
      setIsKeySet(true);
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

  const saveMap = () => {
    try {
      // Clean links to ensure we save IDs, not circular node objects from ForceGraph
      const cleanLinks = links.map(link => ({
        ...link,
        source: typeof link.source === 'object' ? (link.source as any).id : link.source,
        target: typeof link.target === 'object' ? (link.target as any).id : link.target,
      }));

      const mapData = JSON.stringify({ nodes, links: cleanLinks });
      localStorage.setItem('avalonScribeMap', mapData);
      setToast({ message: 'Map saved successfully!', type: 'success' });
      logger.info('Map saved to localStorage.');
    } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        setToast({ message: 'Failed to save map.', type: 'error' });
        logger.error(`Failed to save map: ${error}`);
    }
  };

  const loadMap = () => {
    const savedMap = localStorage.getItem('avalonScribeMap');
    if (savedMap) {
      try {
        const { nodes: loadedNodes, links: loadedLinks } = JSON.parse(savedMap);
        const validatedLinks = loadedLinks.map((link: any) => ({
          ...link,
          expiration: new Date(link.expiration).getTime(),
        }));
        setGraph({ nodes: loadedNodes, links: validatedLinks });
        setToast({ message: 'Map loaded successfully!', type: 'success' });
        logger.info('Map loaded from localStorage.');
      } catch (e) {
        const error = e instanceof Error ? e.message : String(e);
        setToast({ message: 'Failed to load map data.', type: 'error'});
        logger.error(`Failed to parse map data from localStorage: ${error}`);
      }
    } else {
      setToast({ message: 'No saved map found.', type: 'error' });
      logger.warn('No saved map found in localStorage.');
    }
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

  const handleKeyReset = () => {
    clearApiKey();
    setIsKeySet(false);
  };

  if (!isKeySet) {
    return <ApiKeySetup onKeySet={() => setIsKeySet(true)} />;
  }

  return (
    <div className="flex flex-col h-screen bg-primary overflow-hidden">
      <Header 
        onClear={clearGraph} 
        onLoad={loadMap} 
        onSave={saveMap} 
        onUpload={triggerFileUpload}
        onToggleForm={() => setIsFormVisible(!isFormVisible)}
        isFormVisible={isFormVisible}
        onToggleLog={() => setIsLogVisible(!isLogVisible)}
        isLogVisible={isLogVisible}
        onToggleSettings={() => setIsSettingsVisible(true)}
      />
      
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
      
      {isSettingsVisible && (
        <SettingsModal 
          onClose={() => setIsSettingsVisible(false)}
          onKeyReset={handleKeyReset}
        />
      )}

      {pendingValidation && (
        <ValidationModal 
          data={pendingValidation}
          onConfirm={handleValidationConfirm}
          onCancel={handleValidationCancel}
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
