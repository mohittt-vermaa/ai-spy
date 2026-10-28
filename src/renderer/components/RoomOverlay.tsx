/**
 * RoomOverlay - Shows room labels, agent status indicators, and activity badges
 */

import React, { useMemo } from 'react';
import { Agent, Room } from '../../shared/types';

interface RoomOverlayProps {
  rooms: Room[];
  agents: Agent[];
  scale: number;
}

export function RoomOverlay({ rooms, agents, scale }: RoomOverlayProps) {
  // Get agents in each room
  const agentsInRoom = useMemo(() => {
    const map = new Map<string, Agent[]>();
    agents.forEach(agent => {
      rooms.forEach(room => {
        if (
          agent.position.x >= room.bounds.x &&
          agent.position.x < room.bounds.x + room.bounds.width &&
          agent.position.y >= room.bounds.y &&
          agent.position.y < room.bounds.y + room.bounds.height
        ) {
          if (!map.has(room.id)) map.set(room.id, []);
          map.get(room.id)!.push(agent);
        }
      });
    });
    return map;
  }, [agents, rooms]);

  return (
    <div
      className="room-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 15,
      }}
    >
      {rooms.map(room => {
        const roomAgents = agentsInRoom.get(room.id) || [];
        const hasActivity = roomAgents.some(a => a.state === 'working' || a.state === 'meeting');
        const workingCount = roomAgents.filter(a => a.state === 'working').length;
        
        return (
          <div
            key={room.id}
            className="room-overlay-item"
            style={{
              position: 'absolute',
              left: room.bounds.x * scale,
              top: room.bounds.y * scale,
              width: room.bounds.width * scale,
              height: room.bounds.height * scale,
              border: `2px solid ${room.color}80`,
              borderRadius: '4px',
              background: hasActivity ? `${room.color}20` : 'transparent',
              transition: 'background 0.3s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              paddingTop: '4px',
            }}
          >
            {/* Room name */}
            <div
              className="room-name"
              style={{
                fontSize: `${10 * scale}px`,
                fontFamily: "'JetBrains Mono', monospace",
                color: room.color,
                fontWeight: 600,
                textShadow: '0 0 4px #000',
                whiteSpace: 'nowrap',
                pointerEvents: 'auto',
              }}
            >
              {room.name}
            </div>

            {/* Agent indicators in room */}
            {roomAgents.length > 0 && (
              <div
                className="room-agents"
                style={{
                  display: 'flex',
                  gap: '2px',
                  marginTop: '2px',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                {roomAgents.slice(0, 3).map(agent => (
                  <div
                    key={agent.id}
                    className="agent-indicator"
                    style={{
                      width: `${8 * scale}px`,
                      height: `${8 * scale}px`,
                      borderRadius: '50%',
                      background: agent.color,
                      boxShadow: `0 0 ${4 * scale}px ${agent.color}`,
                      border: `1px solid #fff`,
                      position: 'relative',
                    }}
                    title={`${agent.name} - ${agent.state}`}
                  >
                    {agent.state === 'working' && (
                      <div
                        className="working-pulse"
                        style={{
                          position: 'absolute',
                          top: '-2px',
                          left: '-2px',
                          right: '-2px',
                          bottom: '-2px',
                          borderRadius: '50%',
                          border: `2px solid ${agent.color}`,
                          animation: 'pulse 1s infinite',
                        }}
                      />
                    )}
                    {agent.state === 'meeting' && (
                      <div
                        className="meeting-icon"
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          fontSize: `${6 * scale}px`,
                        }}
                      >
                        👥
                      </div>
                    )}
                  </div>
                ))}
                {roomAgents.length > 3 && (
                  <div
                    className="more-agents"
                    style={{
                      width: `${8 * scale}px`,
                      height: `${8 * scale}px`,
                      borderRadius: '50%',
                      background: '#64748b',
                      color: '#fff',
                      fontSize: `${7 * scale}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    +{roomAgents.length - 3}
                  </div>
                )}
              </div>
            )}

            {/* Activity badge */}
            {workingCount > 0 && (
              <div
                className="activity-badge"
                style={{
                  position: 'absolute',
                  bottom: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#00ff88',
                  color: '#0a0f1a',
                  fontSize: `${8 * scale}px`,
                  fontFamily: "'JetBrains Mono', monospace",
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 0 8px #00ff88',
                }}
              >
                {workingCount} working
              </div>
            )}

            {/* Room type icon */}
            <div
              className="room-type-icon"
              style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                fontSize: `${12 * scale}px`,
                opacity: 0.5,
              }}
            >
              {getRoomIcon(room.type)}
            </div>
          </div>
        );
      })}
      
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function getRoomIcon(type: string): string {
  const icons: Record<string, string> = {
    desk: '💻',
    meeting: '🤝',
    lounge: '☕',
    kitchen: '🍕',
    server: '🖥️',
    whiteboard: '📋',
  };
  return icons[type] || '📍';
}