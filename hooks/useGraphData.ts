
import { useState, useCallback, useEffect } from 'react';
import { AlbionConnection, CustomNode, CustomLink, GraphData, ZoneType } from '../types';
import logger from '../services/logger';
import { getZoneType } from '../data/zoneNames';

export const useGraphData = () => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });

  // Helper to normalize strings to uppercase to avoid case sensitivity issues
  // This is the single source of truth for ID generation
  const normalizeId = (id: string) => (id || '').trim().toUpperCase();

  const addConnection = useCallback((connection: AlbionConnection) => {
    if (!connection.origem || !connection.destino || connection.minutos_ate_fechar === null) {
      logger.warn('Attempted to add an invalid connection.', connection);
      return;
    }

    // Normalize to Uppercase immediately to prevent "Zone A" vs "ZONE A"
    const origemRaw = normalizeId(connection.origem);
    const destinoRaw = normalizeId(connection.destino);
    
    if (origemRaw === destinoRaw) {
        logger.warn('Ignored self-loop connection.');
        return;
    }

    logger.info(`Adding connection: ${origemRaw} -> ${destinoRaw}`);

    setGraphData(prevData => {
      const newNodes = [...prevData.nodes];
      const newLinks = [...prevData.links];

      // Add nodes if they don't exist
      if (!newNodes.find(node => node.id === origemRaw)) {
        newNodes.push({ id: origemRaw, name: origemRaw, type: getZoneType(origemRaw) });
      }
      if (!newNodes.find(node => node.id === destinoRaw)) {
        newNodes.push({ id: destinoRaw, name: destinoRaw, type: getZoneType(destinoRaw) });
      }

      const expiration = Date.now() + connection.minutos_ate_fechar! * 60 * 1000;

      // Check for existing link and update it, otherwise add new one
      const existingLinkIndex = newLinks.findIndex(link => {
        // Robustly get ID whether it's string or object (ForceGraph mutation handling)
        const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
        const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;
        
        return (sourceId === origemRaw && targetId === destinoRaw) || 
               (sourceId === destinoRaw && targetId === origemRaw);
      });

      if (existingLinkIndex !== -1) {
        // Update expiration (create new object to ensure state change detection)
        newLinks[existingLinkIndex] = { ...newLinks[existingLinkIndex], expiration };
        logger.debug(`Updated expiration for link: ${origemRaw} <-> ${destinoRaw}`);
      } else {
        newLinks.push({ source: origemRaw, target: destinoRaw, expiration });
      }

      return { nodes: newNodes, links: newLinks };
    });
  }, []);
  
  const updateNodeName = useCallback((oldName: string, newName: string): boolean => {
    if (!newName || newName.trim() === '') {
        logger.warn('Attempted to update node with empty name.');
        return false;
    }

    const normalizedOldId = normalizeId(oldName);
    const normalizedNewId = normalizeId(newName);

    // Check if the new name already exists as a DIFFERENT node
    if (graphData.nodes.some(node => node.id === normalizedNewId && node.id !== normalizedOldId)) {
        logger.warn(`Attempted to rename node to an existing name: ${normalizedNewId}`);
        return false;
    }

    logger.info(`Updating node name from "${normalizedOldId}" to "${normalizedNewId}"`);

    setGraphData(prevData => {
        const newNodes = prevData.nodes.map(node => {
            if (node.id === normalizedOldId) {
                // Update ID and Name, re-evaluate type based on new name defaults, 
                // but usually user will manually set type if it's special.
                // We preserve the existing type if the name change implies the same category, 
                // but re-calculating is safer if they rename "Black Zone" to "Royal City".
                return { ...node, id: normalizedNewId, name: normalizedNewId, type: getZoneType(normalizedNewId) };
            }
            return node;
        });

        const newLinks = prevData.links.map(link => {
            const newLink = { ...link };
            const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
            const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;

            // Update source/target references to the new ID
            // IMPORTANT: We reset them to strings to ensure ForceGraph re-calculates the topology
            if (sourceId === normalizedOldId) {
                newLink.source = normalizedNewId;
            } else {
                newLink.source = sourceId; 
            }

            if (targetId === normalizedOldId) {
                newLink.target = normalizedNewId;
            } else {
                newLink.target = targetId;
            }
            return newLink;
        });
        
        return { nodes: newNodes, links: newLinks };
    });
    return true;
  }, [graphData.nodes]);

  const updateNodeType = useCallback((nodeId: string, newType: ZoneType) => {
    const normalizedId = normalizeId(nodeId);
    logger.info(`Updating node type for "${normalizedId}" to "${newType}"`);
    
    setGraphData(prevData => {
        const newNodes = prevData.nodes.map(node => {
            if (node.id === normalizedId) {
                return { ...node, type: newType };
            }
            return node;
        });
        // We don't need to change links, but we return a new state object to trigger re-render
        return { ...prevData, nodes: newNodes };
    });
  }, []);

  const clearGraph = useCallback(() => {
    logger.info('Graph cleared.');
    setGraphData({ nodes: [], links: [] });
  }, []);

  const setGraph = useCallback((data: GraphData) => {
    logger.info(`Loading graph with ${data.nodes.length} nodes and ${data.links.length} links.`);
    
    // Sanitize Data: Ensure all IDs are uppercase to fix "Zone a" vs "ZONE A" bug from dirty storage
    const sanitizedNodes: CustomNode[] = [];
    const nodeIds = new Set<string>();
    
    // Map to track "Old Bad ID" -> "New Good ID"
    const idRemap = new Map<string, string>();

    // 1. Process Nodes
    data.nodes.forEach(node => {
        const oldId = node.id;
        const newId = normalizeId(oldId);
        
        idRemap.set(oldId, newId);

        // If we haven't added this normalized ID yet, add it
        if (!nodeIds.has(newId)) {
            sanitizedNodes.push({
                ...node,
                id: newId,
                name: newId, // Enforce name matches ID for consistency
                type: node.type || getZoneType(newId)
            });
            nodeIds.add(newId);
        } else {
            // If we already have "ZONE A", and we encounter "Zone a", we basically skip adding "Zone a"
            // but we recorded in `idRemap` that "Zone a" -> "ZONE A" so we can fix links.
            logger.debug(`Merged duplicate node "${oldId}" into "${newId}" during load.`);
        }
    });

    // 2. Process Links
    const sanitizedLinks: CustomLink[] = [];
    data.links.forEach(link => {
        // Handle cases where link.source might be an object (if passed from a live graph state) or string
        const rawSource = typeof link.source === 'object' ? (link.source as any).id : link.source;
        const rawTarget = typeof link.target === 'object' ? (link.target as any).id : link.target;
        
        // Remap to strict Uppercase ID
        const sourceId = idRemap.get(rawSource) || normalizeId(rawSource);
        const targetId = idRemap.get(rawTarget) || normalizeId(rawTarget);

        // Only add link if both nodes actually exist in our sanitized set
        if (nodeIds.has(sourceId) && nodeIds.has(targetId)) {
            // Prevent duplicating links if merging nodes caused start==end
            if (sourceId !== targetId) {
                sanitizedLinks.push({
                    ...link,
                    source: sourceId,
                    target: targetId
                });
            }
        }
    });
    
    if (sanitizedNodes.length !== data.nodes.length) {
        logger.warn(`Sanitization optimized graph: ${data.nodes.length} -> ${sanitizedNodes.length} nodes.`);
    }

    setGraphData({ nodes: sanitizedNodes, links: sanitizedLinks });
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
          const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
          const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;
          connectedNodeIds.add(sourceId);
          connectedNodeIds.add(targetId);
        });

        const activeNodes = prevData.nodes.filter(node => connectedNodeIds.has(node.id as string));
        
        return { nodes: activeNodes, links: activeLinks };
      });
    }, 5000); // Check for expired links every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return { ...graphData, addConnection, clearGraph, setGraph, updateNodeName, updateNodeType };
};
