
import React, { useEffect, useState, useRef, useMemo } from 'react';
import ForceGraph2D, { NodeObject } from 'react-force-graph-2d';
import { GraphData, CustomNode, ZoneType } from '../types';
import { EditIcon } from './icons';

interface GraphCanvasProps {
  nodes: GraphData['nodes'];
  links: GraphData['links'];
  onNodeUpdate: (oldName: string, newName: string) => void;
}

interface ForceGraphInstance {
  zoomToFit: (duration?: number, padding?: number) => void;
  centerAt: (x: number, y: number, duration?: number) => void;
  zoom: (k: number, duration?: number) => void;
}

const ZONE_TYPE_COLORS: Record<ZoneType, string> = {
  royal: '#58A6FF',   // Accent Blue
  black: '#E0E0E0',   // High-contrast light grey (for black zones on dark bg)
  avalon: '#FFC700',  // Gold
  unknown: '#8B949E', // Grey
};

const formatTime = (ms: number): string => {
  if (ms <= 0) return "Expired";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
};

export const GraphCanvas: React.FC<GraphCanvasProps> = ({ nodes, links, onNodeUpdate }) => {
  const fgRef = useRef<ForceGraphInstance | null>(null);
  const [graphData, setGraphData] = useState({ nodes, links });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [, setTicker] = useState(0); // Used to force re-render for timer updates
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingNode, setIsEditingNode] = useState(false);
  const [editedNodeName, setEditedNodeName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) as CustomNode | undefined,
    [nodes, selectedNodeId]
  );

  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
        return { nodes, links };
    }

    const matchingNodes = nodes.filter(node => (node.name as string).toLowerCase().includes(term));
    const matchingNodeIds = new Set(matchingNodes.map(n => n.id));

    if (matchingNodeIds.size === 0) {
        return { nodes: [], links: [] };
    }

    const filteredLinks = links.filter(link => 
        matchingNodeIds.has(link.source as string) || matchingNodeIds.has(link.target as string)
    );
    
    const connectedNodeIds = new Set<string>();
    filteredLinks.forEach(link => {
        connectedNodeIds.add(link.source as string);
        connectedNodeIds.add(link.target as string);
    });
    
    matchingNodeIds.forEach(id => connectedNodeIds.add(id as string));
    
    const filteredNodes = nodes.filter(node => connectedNodeIds.has(node.id as string));

    return { nodes: filteredNodes, links: filteredLinks };
  }, [nodes, links, searchTerm]);

  useEffect(() => {
    setGraphData(filteredData);
    fgRef.current?.zoomToFit(400, 100);
  }, [filteredData]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTicker(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    if (isEditingNode && nameInputRef.current) {
        nameInputRef.current.focus();
        nameInputRef.current.select();
    }
  }, [isEditingNode]);

  const handleNodeClick = (node: NodeObject) => {
    setSelectedNodeId(node.id as string);
    setIsEditingNode(false);
    if (node && typeof node.x === 'number' && typeof node.y === 'number' && fgRef.current) {
        fgRef.current.centerAt(node.x, node.y, 1000);
        fgRef.current.zoom(2.5, 500);
    }
  };

  const handleBackgroundClick = () => {
    setSelectedNodeId(null);
    setIsEditingNode(false);
    fgRef.current?.zoomToFit(400, 100);
  };
  
  const handleConfirmEdit = () => {
    if (selectedNode && editedNodeName.trim() && editedNodeName.trim() !== selectedNode.name) {
        const oldName = selectedNode.name;
        const newName = editedNodeName.trim();
        onNodeUpdate(oldName, newName);
        setSelectedNodeId(newName);
    }
    setIsEditingNode(false);
  };

  const connections = selectedNode
    ? links
        .filter(link => link.source === selectedNode.id || link.target === selectedNode.id)
        .map(link => {
            const targetId = link.source === selectedNode.id ? link.target : link.source;
            return nodes.find(n => n.id === targetId)?.name || targetId;
        })
    : [];

  const nodeCanvasObject = (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const label = node.name;
    const fontSize = 14 / globalScale;
    ctx.font = `${fontSize}px Sans-Serif`;
    const textWidth = ctx.measureText(label).width;
    const padding = 8 / globalScale;
    const bgWidth = textWidth + 2 * padding;
    const bgHeight = fontSize + 2 * padding;
    const nodeType: ZoneType = node.type || 'unknown';
    const nodeColor = ZONE_TYPE_COLORS[nodeType];

    ctx.fillStyle = 'rgba(22, 27, 34, 0.9)';
    ctx.fillRect(node.x - bgWidth / 2, node.y - bgHeight / 2, bgWidth, bgHeight);
    
    ctx.strokeStyle = nodeColor;
    ctx.lineWidth = 1.5 / globalScale;
    ctx.strokeRect(node.x - bgWidth / 2, node.y - bgHeight / 2, bgWidth, bgHeight);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#C9D1D9';
    ctx.fillText(label, node.x, node.y);
  };

  const linkCanvasObject = (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const start = link.source;
    const end = link.target;

    if (typeof start !== 'object' || typeof end !== 'object' || !start || !end) return;
    
    const remainingTime = link.expiration - Date.now();
    const tenMinutes = 10 * 60 * 1000;
    const twoMinutes = 2 * 60 * 1000;

    let linkColor = '#58A6FF'; // Default accent color
    if (remainingTime > 0 && remainingTime <= twoMinutes) {
        linkColor = '#F85149'; // Danger red
    } else if (remainingTime > 0 && remainingTime <= tenMinutes) {
        linkColor = '#E3B341'; // Warning yellow
    } else if (remainingTime <= 0) {
        linkColor = '#8B949E'; // Expired grey
    }

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = linkColor;
    ctx.lineWidth = 1.5 / globalScale;
    ctx.stroke();

    const timeLabel = formatTime(remainingTime);
    const fontSize = 12 / globalScale;
    ctx.font = `bold ${fontSize}px Sans-Serif`;

    const textWidth = ctx.measureText(timeLabel).width;
    const padding = 4 / globalScale;
    const labelX = start.x + (end.x - start.x) * 0.5;
    const labelY = start.y + (end.y - start.y) * 0.5;
    
    ctx.fillStyle = 'rgba(13, 17, 23, 0.85)';
    ctx.fillRect(labelX - textWidth / 2 - padding, labelY - fontSize / 2 - padding, textWidth + 2 * padding, fontSize + 2 * padding);
    
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = remainingTime > 0 ? '#C9D1D9' : '#F85149';
    ctx.fillText(timeLabel, labelX, labelY);
  };


  return (
    <>
      <div className="absolute top-4 left-4 z-10">
          <input
              type="text"
              placeholder="Search zones..."
              aria-label="Search zones"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 bg-secondary p-2 border border-border rounded-md text-text-primary shadow-lg focus:outline-none focus:ring-2 focus:ring-accent"
          />
      </div>
      <ForceGraph2D
        ref={fgRef as any}
        graphData={graphData}
        nodeId="id"
        nodeVal={10}
        nodeRelSize={10}
        nodeCanvasObject={nodeCanvasObject}
        linkSource="source"
        linkTarget="target"
        linkCanvasObject={linkCanvasObject}
        backgroundColor="#0D1117"
        cooldownTicks={100}
        onEngineStop={() => fgRef.current?.zoomToFit(400, 100)}
        d3AlphaDecay={0.05}
        onNodeClick={handleNodeClick}
        onBackgroundClick={handleBackgroundClick}
      />
      {selectedNode && (
        <div className="absolute top-4 right-4 bg-secondary border border-border rounded-lg shadow-lg p-4 w-64 max-w-xs z-10 text-text-primary animate-fade-in-right">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-lg text-accent">Node Details</h3>
            <button
              onClick={() => setSelectedNodeId(null)}
              className="text-2xl text-text-secondary hover:text-text-primary leading-none"
              aria-label="Close node details"
            >
              &times;
            </button>
          </div>
          <div>
            {isEditingNode ? (
                <div className="flex items-center gap-2">
                    <label htmlFor="node-name-input" className="font-semibold text-text-secondary">Name:</label>
                    <input
                        id="node-name-input"
                        ref={nameInputRef}
                        type="text"
                        value={editedNodeName}
                        onChange={(e) => setEditedNodeName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleConfirmEdit();
                            if (e.key === 'Escape') setIsEditingNode(false);
                        }}
                        onBlur={handleConfirmEdit}
                        className="flex-grow bg-primary border border-border rounded-md py-1 px-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                    />
                </div>
            ) : (
                <div className="flex justify-between items-center">
                    <p><span className="font-semibold text-text-secondary">Name:</span> {selectedNode.name}</p>
                    <button
                        onClick={() => { setIsEditingNode(true); setEditedNodeName(selectedNode.name); }}
                        className="p-1 text-text-secondary hover:text-accent rounded-md"
                        aria-label="Edit node name"
                    >
                        <EditIcon />
                    </button>
                </div>
            )}
          </div>
          <div className="capitalize mt-2">
            <p>
                <span className="font-semibold text-text-secondary">Type: </span>
                <span style={{ color: ZONE_TYPE_COLORS[selectedNode.type] || ZONE_TYPE_COLORS.unknown, fontWeight: 'bold' }}>
                    {selectedNode.type}
                </span>
            </p>
          </div>
          {connections.length > 0 && (
            <div className="mt-4 pt-3 border-t border-border">
              <h4 className="font-semibold text-text-secondary mb-2">Connections ({connections.length}):</h4>
              <ul className="text-sm space-y-1 max-h-48 overflow-y-auto pr-2">
                {connections.map((connName, index) => (
                  <li key={index}>{connName as string}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  );
};
