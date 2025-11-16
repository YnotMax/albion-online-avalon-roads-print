
import React, { useState, useEffect, useCallback } from 'react';
import { GraphCanvas } from './components/GraphCanvas';
import { Header } from './components/Header';
import { Instructions } from './components/Instructions';
import { useGraphData } from './hooks/useGraphData';
import { extractConnectionFromImage } from './services/geminiService';
import { Toast } from './components/Toast';
import { ManualInputForm } from './components/ManualInputForm';
import { DebugLog } from './components/DebugLog';
import logger from './services/logger';

const App: React.FC = () => {
  const { nodes, links, addConnection, clearGraph, setGraph } = useGraphData();
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isLogVisible, setIsLogVisible] = useState(false);

  const handlePaste = useCallback(async (event: ClipboardEvent) => {
    if (isLoading) return;

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
      setToast({ message: 'No image found on clipboard.', type: 'error' });
      logger.warn('No image file found on clipboard.');
      return;
    }

    logger.info('Image found on clipboard, starting processing.');
    setIsLoading(true);
    setToast(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onload = async () => {
        try {
          const base64Image = (reader.result as string).split(',')[1];
          const connectionData = await extractConnectionFromImage(base64Image);
          
          if (connectionData && connectionData.origem && connectionData.destino && connectionData.minutos_ate_fechar) {
            addConnection(connectionData);
            const successMsg = `AI added: ${connectionData.origem} -> ${connectionData.destino}`;
            setToast({ message: successMsg, type: 'success' });
            logger.info(successMsg);
          } else {
            throw new Error('Could not extract connection data from image.');
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
          const errorMsg = 'Failed to read the image from clipboard.';
          setToast({ message: errorMsg, type: 'error' });
          logger.error(errorMsg);
      };
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred processing the image.';
      setToast({ message: errorMessage, type: 'error' });
      logger.error(`Image processing error: ${errorMessage}`);
    }
  }, [addConnection, isLoading]);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);
  
  const saveMap = () => {
    try {
      const mapData = JSON.stringify({ nodes, links });
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

  return (
    <div className="flex flex-col h-screen bg-primary overflow-hidden">
      <Header 
        onClear={clearGraph} 
        onLoad={loadMap} 
        onSave={saveMap} 
        onToggleForm={() => setIsFormVisible(!isFormVisible)}
        isFormVisible={isFormVisible}
        onToggleLog={() => setIsLogVisible(!isLogVisible)}
        isLogVisible={isLogVisible}
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
        <GraphCanvas nodes={nodes} links={links} />
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
