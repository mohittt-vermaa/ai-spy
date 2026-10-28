/**
 * AgentSprite - Pixel art agent character with walking animation
 */

import React, { useEffect, useRef, useState } from 'react';
import { Agent, Position } from '../../shared/types';

interface AgentSpriteProps {
  agent: Agent;
  position: Position;
  scale: number;
  officeMap: any;
}

const FRAME_DURATION = 150; // ms per frame
const WALK_FRAMES = 4;
const IDLE_FRAMES = 2;

export function AgentSprite({ agent, position, scale, officeMap }: AgentSpriteProps) {
  const [frame, setFrame] = useState(0);
  const [direction, setDirection] = useState<'front' | 'back' | 'left' | 'right'>('front');
  const lastPositionRef = useRef(position);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Determine movement direction
  useEffect(() => {
    const dx = position.x - lastPositionRef.current.x;
    const dy = position.y - lastPositionRef.current.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      setDirection(dx > 0 ? 'right' : 'left');
    } else if (Math.abs(dy) > 0.5) {
      setDirection(dy > 0 ? 'front' : 'back');
    }
    lastPositionRef.current = position;
  }, [position]);

  // Animation frame
  useEffect(() => {
    const isMoving = agent.state === 'walking';
    const interval = setInterval(() => {
      setFrame(prev => (prev + 1) % (isMoving ? WALK_FRAMES : IDLE_FRAMES));
    }, FRAME_DURATION);
    return () => clearInterval(interval);
  }, [agent.state]);

  // Draw pixel art agent
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pixelSize = 2 * scale;
    const spriteWidth = 16;
    const spriteHeight = 24;
    const width = spriteWidth * pixelSize;
    const height = spriteHeight * pixelSize;

    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${spriteWidth * scale}px`;
    canvas.style.height = `${spriteHeight * scale}px`;

    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, width, height);

    drawAgent(ctx, pixelSize, frame, direction, agent);
  }, [frame, direction, agent.state, agent.color, scale]);

  // Calculate screen position (centered on agent's feet)
  const screenX = position.x * scale - 8 * scale;
  const screenY = position.y * scale - 24 * scale;

  return (
    <canvas
      ref={canvasRef}
      className="agent-sprite"
      style={{
        position: 'absolute',
        left: screenX,
        top: screenY,
        pointerEvents: 'none',
        zIndex: 20,
        imageRendering: 'pixelated',
        filter: agent.state === 'error' ? 'hue-rotate(180deg) saturate(2)' : 'none',
        opacity: agent.state === 'break' ? 0.6 : 1,
      }}
      title={`${agent.name} (${agent.role}) - ${agent.state}`}
    />
  );
}

function drawAgent(
  ctx: CanvasRenderingContext2D,
  pixelSize: number,
  frame: number,
  direction: 'front' | 'back' | 'left' | 'right',
  agent: Agent
) {
  const color = agent.color;
  const darkColor = shadeColor(color, -40);
  const lightColor = shadeColor(color, 40);
  const skinColor = '#ffdbac';
  const skinDark = '#e8c5a0';

  const p = (x: number, y: number, w: number, h: number, fill: string) => {
    ctx.fillStyle = fill;
    ctx.fillRect(x * pixelSize, y * pixelSize, w * pixelSize, h * pixelSize);
  };

  // Body parts positions (16x24 canvas)
  // Head: 6x6 at (5, 0)
  // Torso: 8x8 at (4, 6)
  // Legs: 8x10 at (4, 14)

  const legOffset = frame % 2 === 0 ? 0 : 1; // Walking bob
  const armSwing = direction === 'left' || direction === 'right' ? (frame % 2 === 0 ? 1 : -1) : 0;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(5 * pixelSize, 22 * pixelSize, 6 * pixelSize, 2 * pixelSize);

  if (direction === 'front') {
    // Legs
    p(4, 14 + legOffset, 2, 8, darkColor);
    p(10, 14, 2, 8, darkColor);
    p(5, 20 + legOffset, 2, 2, color);
    p(10, 20, 2, 2, color);
    // Torso
    p(4, 6, 8, 8, color);
    p(5, 7, 6, 6, lightColor);
    // Arms
    p(2, 7, 2, 6, darkColor);
    p(12, 7 + armSwing, 2, 6, darkColor);
    p(3, 11, 2, 2, skinColor);
    p(11, 11 + armSwing, 2, 2, skinColor);
    // Head
    p(5, 0, 6, 6, skinColor);
    p(6, 1, 4, 4, skinDark);
    // Eyes
    const eyeOffset = agent.state === 'thinking' ? 1 : 0;
    p(7, 2 + eyeOffset, 1, 1, '#1a1a2e');
    p(10, 2 + eyeOffset, 1, 1, '#1a1a2e');
    // Hair indicator
    if (frame % 4 === 0 && agent.state === 'idle') {
      p(7, 0, 2, 1, darkColor);
    }
  } else if (direction === 'back') {
    // Legs
    p(4, 14 + legOffset, 2, 8, darkColor);
    p(10, 14, 2, 8, darkColor);
    p(5, 20 + legOffset, 2, 2, color);
    p(10, 20, 2, 2, color);
    // Torso
    p(4, 6, 8, 8, color);
    p(5, 7, 6, 6, darkColor);
    // Arms
    p(2, 7, 2, 6, color);
    p(12, 7 + armSwing, 2, 6, color);
    // Head
    p(5, 0, 6, 6, skinColor);
    p(6, 1, 4, 4, skinDark);
    // Hair
    p(6, 0, 4, 2, darkColor);
  } else if (direction === 'right') {
    // Legs (side view - one leg visible)
    p(8, 14 + legOffset, 3, 8, darkColor);
    p(9, 20 + legOffset, 2, 2, color);
    // Torso
    p(5, 6, 6, 8, color);
    p(6, 7, 4, 6, lightColor);
    // Arm
    p(3, 7 + armSwing, 2, 6, darkColor);
    p(3, 11 + armSwing, 2, 2, skinColor);
    // Head
    p(6, 0, 5, 6, skinColor);
    p(7, 1, 3, 4, skinDark);
    // Eye
    p(10, 2, 1, 1, '#1a1a2e');
    // Hair
    p(8, 0, 2, 2, darkColor);
  } else { // left
    // Legs
    p(5, 14 + legOffset, 3, 8, darkColor);
    p(5, 20 + legOffset, 2, 2, color);
    // Torso
    p(5, 6, 6, 8, color);
    p(6, 7, 4, 6, lightColor);
    // Arm
    p(11, 7 + armSwing, 2, 6, darkColor);
    p(11, 11 + armSwing, 2, 2, skinColor);
    // Head
    p(5, 0, 5, 6, skinColor);
    p(6, 1, 3, 4, skinDark);
    // Eye
    p(6, 2, 1, 1, '#1a1a2e');
    // Hair
    p(6, 0, 2, 2, darkColor);
  }

  // State indicators
  if (agent.state === 'working') {
    // Typing animation
    if (frame % 2 === 0) {
      ctx.fillStyle = '#00ff88';
      if (direction === 'front') {
        ctx.fillRect(2 * pixelSize, 9 * pixelSize, 2 * pixelSize, 1 * pixelSize);
        ctx.fillRect(12 * pixelSize, 9 * pixelSize, 2 * pixelSize, 1 * pixelSize);
      }
    }
  } else if (agent.state === 'thinking') {
    // Thought bubble indicator
    ctx.fillStyle = '#ffd700';
    const bubbleX = direction === 'right' ? 14 : direction === 'left' ? 0 : 8;
    ctx.beginPath();
    ctx.arc(bubbleX * pixelSize, -2 * pixelSize, 3 * pixelSize, 0, Math.PI * 2);
    ctx.fill();
  } else if (agent.state === 'meeting') {
    // Meeting indicator
    ctx.fillStyle = '#f8b500';
    ctx.beginPath();
    ctx.arc(8 * pixelSize, -4 * pixelSize, 4 * pixelSize, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000FF) + amt));
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}