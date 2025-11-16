
import { useState, useCallback, useEffect } from 'react';
import { AlbionConnection, CustomNode, CustomLink, GraphData } from '../types';
import logger from '../services/logger';

export const useGraphData = () => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });

  const addConnection = useCallback((connection: AlbionConnection) => {
    if (!connection.origem || !connection.destino || connection.minutos_ate_fechar === null) {
      logger.warn('Attempted to add an invalid connection.', connection);
      return;
    }

    logger.info(`Adding connection: ${connection.origem} -> ${connection.destino}`);

    setGraphData(prevData => {
      const newNodes = [...prevData.nodes];
      const newLinks = [...prevData.links];
      const { origem, destino, minutos_ate_fechar } = connection;

      // Add nodes if they don't exist
      if (!newNodes.find(node => node.id === origem)) {
        newNodes.push({ id: origem, name: origem });
      }
      if (!newNodes.find(node => node.id === destino)) {
        newNodes.push({ id: destino, name: destino });
      }

      const expiration = Date.now() + minutos_ate_fechar * 60 * 1000;

      // Check for existing link and update it, otherwise add new one
      const existingLinkIndex = newLinks.findIndex(
        link => (link.source === origem && link.target === destino) || (link.source === destino && link.target === origem)
      );

      if (existingLinkIndex !== -1) {
        newLinks[existingLinkIndex].expiration = expiration;
        logger.debug(`Updated expiration for link: ${origem} <-> ${destino}`);
      } else {
        newLinks.push({ source: origem, target: destino, expiration });
      }

      return { nodes: newNodes, links: newLinks };
    });
  }, []);
  
  const clearGraph = useCallback(() => {
    logger.info('Graph cleared.');
    setGraphData({ nodes: [], links: [] });
  }, []);

  const setGraph = useCallback((data: GraphData) => {
    logger.info(`Loading graph with ${data.nodes.length} nodes and ${data.links.length} links.`);
    setGraphData(data);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setGraphData(prevData => {
        const now = Date.now();
        const activeLinks = prevData.links.filter(link => link.expiration > now);

        if (activeLinks.length === prevData.links.length) {
          return prevData; // No changes needed
        }

        const removedCount = prevData.links.length - activeLinks.length;
        if (removedCount > 0) {
            logger.info(`Removed ${removedCount} expired link(s).`);
        }

        const connectedNodeIds = new Set<string>();
        activeLinks.forEach(link => {
          connectedNodeIds.add(link.source as string);
          connectedNodeIds.add(link.target as string);
        });

        const activeNodes = prevData.nodes.filter(node => connectedNodeIds.has(node.id as string));
        
        const removedNodeCount = prevData.nodes.length - activeNodes.length;
        if (removedNodeCount > 0) {
            logger.info(`Removed ${removedNodeCount} orphaned node(s).`);
        }

        return { nodes: activeNodes, links: activeLinks };
      });
    }, 5000); // Check for expired links every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return { ...graphData, addConnection, clearGraph, setGraph };
};
