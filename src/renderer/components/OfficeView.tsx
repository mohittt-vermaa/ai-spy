/**
 * OfficeView - Main pixel art office visualization with walking agents
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Agent, Position } from '../../shared/types';
import { AgentSprite } from './AgentSprite';
import { RoomOverlay } from './RoomOverlay';

interface OfficeViewProps {
  agents: Agent[];
  config: any;
  currentProject: any;
}

export function OfficeView({ agents, config, currentProject }: OfficeViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [officeMap, setOfficeMap] = useState<any>(null);
  const [animationFrame, setAnimationFrame] = useState(0);
  const [interpolatedPositions, setInterpolatedPositions] = useState<Map<string, Position>>(new Map());

  // Office dimensions (virtual coordinates)
  const OFFICE_WIDTH = 1200;
  const OFFICE_HEIGHT = 600;

  // Load office map
  useEffect(() => {
    // In production, load from config/office map file
    const defaultMap = {
      width: OFFICE_WIDTH,
      height: OFFICE_HEIGHT,
      rooms: [
        { id: 'desk-pm', name: 'PM Desk', bounds: { x: 80, y: 120, width: 80, height: 80 }, type: 'desk', color: '#ff6b6b', assignedAgents: ['pm-1'] },
        { id: 'desk-se', name: 'SE Desk', bounds: { x: 280, y: 120, width: 80, height: 80 }, type: 'desk', color: '#4ecdc4', assignedAgents: ['se-1'] },
        { id: 'desk-ux', name: 'UX Desk', bounds: { x: 480, y: 120, width: 80, height: 80 }, type: 'desk', color: '#ffe66d', assignedAgents: ['ux-1'] },
        { id: 'desk-qa', name: 'QA Desk', bounds: { x: 680, y: 120, width: 80, height: 80 }, type: 'desk', color: '#95e1d3', assignedAgents: ['qa-1'] },
        { id: 'desk-po', name: 'PO Desk', bounds: { x: 880, y: 120, width: 80, height: 80 }, type: 'desk', color: '#dda0dd', assignedAgents: ['po-1'] },
        { id: 'meeting', name: 'Meeting Room', bounds: { x: 450, y: 250, width: 300, height: 120 }, type: 'meeting', color: '#f8b500', assignedAgents: [] },
        { id: 'lounge', name: 'Break Room', bounds: { x: 400, y: 420, width: 400, height: 100 }, type: 'lounge', color: '#6c5ce7', assignedAgents: [] },
        { id: 'server', name: 'Server Room', bounds: { x: 50, y: 450, width: 150, height: 80 }, type: 'server', color: '#e17055', assignedAgents: [] },
        { id: 'whiteboard', name: 'Whiteboard', bounds: { x: 1000, y: 450, width: 150, height: 80 }, type: 'whiteboard', color: '#00cec9', assignedAgents: [] },
      ],
      walkableAreas: [
        { x: 0, y: 220, width: 1200, height: 380 }, // Main floor
        { x: 0, y: 120, width: 1200, height: 100 }, // Desk row
      ],
      spawnPoints: [
        { x: 600, y: 550 }, // Main entrance
      ],
    };
    setOfficeMap(defaultMap);
  }, []);

  // Animate agent movement
  useEffect(() => {
    let frameId: number;
    const animate = () => {
      setAnimationFrame(prev => prev + 1);
      
      // Interpolate agent positions toward target
      setInterpolatedPositions(prev => {
        const next = new Map(prev);
        agents.forEach(agent => {
          const current = next.get(agent.id) || agent.position;
          const target = agent.targetPosition || agent.position;
          
          if (Math.abs(current.x - target.x) > 0.5 || Math.abs(current.y - target.y) > 0.5) {
            const lerp = 0.1 * (config?.ui?.animationSpeed || 1);
            next.set(agent.id, {
              x: current.x + (target.x - current.x) * lerp,
              y: current.y + (target.y - current.y) * lerp,
            });
          } else {
            next.set(agent.id, { ...target });
          }
        });
        return next;
      });
      
      frameId = requestAnimationFrame(animate);
    };
    
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [agents, config?.ui?.animationSpeed]);

  // Draw office background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !officeMap) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const pixelScale = config?.ui?.pixelScale || 2;
    const width = officeMap.width * pixelScale;
    const height = officeMap.height * pixelScale;
    
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${officeMap.width}px`;
    canvas.style.height = `${officeMap.height}px`;
    
    ctx.imageSmoothingEnabled = false;
    
    const drawBackground = () => {
      // Clear
      ctx.fillStyle = '#0a0f1a';
      ctx.fillRect(0, 0, width, height);
      
      // Grid
      if (config?.ui?.showGrid) {
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < width; x += 16 * pixelScale) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += 16 * pixelScale) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }
      
      // Draw walkable areas (subtle floor pattern)
      ctx.fillStyle = '#111827';
      officeMap.walkableAreas.forEach((area: any) => {
        ctx.fillRect(
          area.x * pixelScale,
          area.y * pixelScale,
          area.width * pixelScale,
          area.height * pixelScale
        );
      });
      
      // Draw rooms
      officeMap.rooms.forEach((room: any) => {
        const alpha = room.type === 'desk' ? 0.15 : 0.1;
        ctx.fillStyle = room.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fillRect(
          room.bounds.x * pixelScale,
          room.bounds.y * pixelScale,
          room.bounds.width * pixelScale,
          room.bounds.height * pixelScale
        );
        
        // Room border
        ctx.strokeStyle = room.color + '80';
        ctx.lineWidth = 2 * pixelScale;
        ctx.strokeRect(
          room.bounds.x * pixelScale,
          room.bounds.y * pixelScale,
          room.bounds.width * pixelScale,
          room.bounds.height * pixelScale
        );
        
        // Room label
        ctx.fillStyle = '#64748b';
        ctx.font = `${10 * pixelScale}px 'JetBrains Mono'`;
        ctx.textAlign = 'center';
        ctx.fillText(
          room.name,
          (room.bounds.x + room.bounds.width / 2) * pixelScale,
          (room.bounds.y - 4) * pixelScale
        );
      });
      
      // Draw decorative elements
      drawDecorations(ctx, pixelScale);
    };
    
    drawBackground();
  }, [officeMap, config?.ui?.pixelScale, config?.ui?.showGrid]);

  const drawDecorations = (ctx: CanvasRenderingContext2D, scale: number) => {
    // Draw some pixel art decorations
    ctx.fillStyle = '#1e2a3a';
    
    // Plants
    const plants = [
      { x: 20, y: 20, size: 20 },
      { x: 1160, y: 20, size: 20 },
      { x: 20, y: 560, size: 16 },
      { x: 1160, y: 560, size: 16 },
    ];
    
    plants.forEach(p => {
      ctx.fillRect(p.x * scale, p.y * scale, p.size * scale, p.size * scale);
      ctx.fillStyle = '#00ff88';
      ctx.fillRect((p.x + 4) * scale, (p.y + 4) * scale, (p.size - 8) * scale, (p.size - 8) * scale);
      ctx.fillStyle = '#1e2a3a';
    });
    
    // Water cooler
    ctx.fillStyle = '#00aaff';
    ctx.fillRect(1000 * scale, 380 * scale, 20 * scale, 40 * scale);
    ctx.fillStyle = '#0088cc';
    ctx.fillRect(1004 * scale, 384 * scale, 12 * scale, 32 * scale);
  };

  // Calculate canvas display size
  const containerWidth = 900; // Will be constrained by parent
  const scale = Math.min(1, containerWidth / OFFICE_WIDTH);
  const displayWidth = OFFICE_WIDTH * scale;
  const displayHeight = OFFICE_HEIGHT * scale;

  return (
    <div className="office-view" style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '20px', overflow: 'auto', background: '#0a0f1a' }}>
      <div className="office-container" style={{ position: 'relative', width: OFFICE_WIDTH, height: OFFICE_HEIGHT }}>
        <canvas
          ref={canvasRef}
          className="office-canvas"
          width={OFFICE_WIDTH * (config?.ui?.pixelScale || 2)}
          height={OFFICE_HEIGHT * (config?.ui?.pixelScale || 2)}
          style={{
            width: OFFICE_WIDTH,
            height: OFFICE_HEIGHT,
            imageRendering: 'pixelated',
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            background: '#0a0f1a',
          }}
        />
        
        {/* Agent Sprites Layer */}
        <div
          className="agents-layer"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: OFFICE_WIDTH,
            height: OFFICE_HEIGHT,
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {agents.map(agent => {
            const pos = interpolatedPositions.get(agent.id) || agent.position;
            return (
              <AgentSprite
                key={agent.id}
                agent={agent}
                position={pos}
                scale={1}
                officeMap={officeMap}
              />
            );
          })}
        </div>
        
        {/* Room Overlays */}
        {officeMap && (
          <RoomOverlay
            rooms={officeMap.rooms}
            agents={agents}
            scale={1}
          />
        )}
      </div>
    </div>
  );
}