/**
 * TopBar - Application header with project switcher and global actions
 */

import React, { useState } from 'react';
import { Project, AppConfig } from '../../shared/types';

interface TopBarProps {
  config: AppConfig | null;
  currentProject: Project | null;
  onNewProject: () => void;
  onSettings: () => void;
  onToggleSidebar: () => void;
}

export function TopBar({ config, currentProject, onNewProject, onSettings, onToggleSidebar }: TopBarProps) {
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  return (
    <header className="top-bar" style={{
      height: '56px',
      background: '#0a0f1a',
      borderBottom: '1px solid #1e2a3a',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: '16px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Menu Toggle */}
      <button
        onClick={onToggleSidebar}
        className="menu-toggle"
        style={{
          width: '40px',
          height: '40px',
          border: 'none',
          background: '#111827',
          borderRadius: '8px',
          color: '#e2e8f0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          transition: 'background 0.2s',
        }}
        title="Toggle Sidebar"
      >
        ☰
      </button>

      {/* App Title */}
      <div className="app-title" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flex: 1,
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #00ff88, #00d9ff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
        }}>
          🤖
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>
            Mission Control
          </h1>
          {config && (
            <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>
              {config.office.theme} office
            </span>
          )}
        </div>
      </div>

      {/* Project Switcher */}
      <div className="project-switcher" style={{ position: 'relative' }}>
        <button
          onClick={() => setShowProjectDropdown(!showProjectDropdown)}
          className="project-button"
          style={{
            padding: '8px 12px',
            background: '#111827',
            border: '1px solid #1e2a3a',
            borderRadius: '8px',
            color: '#e2e8f0',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minWidth: '200px',
            justifyContent: 'space-between',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentProject ? currentProject.name : 'No Project Selected'}
          </span>
          <span style={{ 
            transition: 'transform 0.2s',
            transform: showProjectDropdown ? 'rotate(180deg)' : 'rotate(0)',
            fontSize: '10px',
            color: '#64748b',
          }}>
            ▼
          </span>
        </button>

        {showProjectDropdown && (
          <div className="project-dropdown" style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#0d1321',
            border: '1px solid #1e2a3a',
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            zIndex: 200,
            overflow: 'hidden',
            minWidth: '280px',
          }}>
            <div style={{ padding: '8px', borderBottom: '1px solid #1e2a3a' }}>
              <button
                onClick={onNewProject}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'transparent',
                  border: '1px dashed #1e2a3a',
                  borderRadius: '6px',
                  color: '#00ff88',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: "'JetBrains Mono', monospace",
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  justifyContent: 'center',
                }}
              >
                + New Project
              </button>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {projects.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                  No projects yet
                </div>
              ) : (
                projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => setShowProjectDropdown(false)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: currentProject?.id === project.id ? '#00ff8815' : 'transparent',
                      border: 'none',
                      borderBottom: '1px solid #1e2a3a',
                      color: '#e2e8f0',
                      fontSize: '12px',
                      fontFamily: "'JetBrains Mono', monospace",
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{project.name}</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>{project.path}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Global Actions */}
      <div className="global-actions" style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onSettings}
          className="icon-button"
          style={{
            width: '40px',
            height: '40px',
            border: 'none',
            background: '#111827',
            borderRadius: '8px',
            color: '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            transition: 'all 0.2s',
          }}
          title="Settings"
        >
          ⚙
        </button>

        {/* Connection Status */}
        <div className="connection-status" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          background: '#111827',
          borderRadius: '16px',
          border: '1px solid #1e2a3a',
        }}>
          <span className="status-dot" style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#00ff88',
            boxShadow: '0 0 8px #00ff88',
            animation: 'pulse 2s infinite',
          }} />
          <span style={{ fontSize: '11px', color: '#00ff88', fontWeight: 500, fontFamily: "'JetBrains Mono', monospace" }}>
            Connected
          </span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </header>
  );
}