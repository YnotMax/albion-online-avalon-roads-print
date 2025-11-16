import React, { useEffect, useState, useRef } from 'react';
import ForceGraph2D, { NodeObject } from 'react-force-graph-2d';
import { GraphData, CustomNode } from '../types';

interface GraphCanvasProps {
  nodes: GraphData['nodes'];
  links: GraphData['links'];
}

// Minimal type for the force graph instance to satisfy TypeScript
interface ForceGraphInstance {
  zoomToFit: (duration?: number, padding?: number) => void;
  centerAt: (x: number, y: number, duration?: number) => void;
  zoom: (k: number, duration?: number) => void;
}

const formatTime = (ms: number): string => {
  if (ms <= 0) return "Expired";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
};

export const GraphCanvas: React.FC<GraphCanvasProps> = ({ nodes, links }) => {
  const fgRef = useRef<ForceGraphInstance>();
  const [graphData, setGraphData] = useState({ nodes, links });
  const [selectedNode, setSelectedNode] = useState<CustomNode | null>(null);
  const [, setTicker] = useState(0); // Used to force re-render for timer updates

  useEffect(() => {
    setGraphData({ nodes, links });
    fgRef.current?.zoomToFit(400, 100);
  }, [nodes, links]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTicker(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleNodeClick = (node: NodeObject) => {
    const fullNode = nodes.find(n => n.id === node.id);
    if (fullNode) {
      setSelectedNode(fullNode);
    }
     // Zoom in on the clicked node
    if (node && typeof node.x === 'number' && typeof node.y === 'number' && fgRef.current) {
        fgRef.current.centerAt(node.x, node.y, 1000);
        fgRef.current.zoom(2.5, 500);
    }
  };

  const handleBackgroundClick = () => {
    setSelectedNode(null);
    // Reset zoom to fit all nodes
    fgRef.current?.zoomToFit(400, 100);
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

    ctx.fillStyle = 'rgba(22, 27, 34, 0.9)';
    ctx.fillRect(node.x - bgWidth / 2, node.y - bgHeight / 2, bgWidth, bgHeight);
    
    ctx.strokeStyle = '#30363D';
    ctx.lineWidth = 1 / globalScale;
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
    
    // Draw link line
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = '#58A6FF';
    ctx.lineWidth = 1.5 / globalScale;
    ctx.stroke();

    // Draw timer
    const remainingTime = link.expiration - Date.now();
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
              onClick={() => setSelectedNode(null)}
              className="text-2xl text-text-secondary hover:text-text-primary leading-none"
              aria-label="Close node details"
            >
              &times;
            </button>
          </div>
          <div>
            <p><span className="font-semibold text-text-secondary">Name:</span> {selectedNode.name}</p>
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