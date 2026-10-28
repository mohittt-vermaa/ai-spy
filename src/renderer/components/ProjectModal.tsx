/**
 * ProjectModal - Create/Edit project modal
 */

import React, { useState, useEffect } from 'react';
import { Project } from '../../shared/types';

interface ProjectModalProps {
  onClose: () => void;
  onCreate: (name: string, path: string, description: string) => void;
  projects: Project[];
}

export function ProjectModal({ onClose, onCreate, projects }: ProjectModalProps) {
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    if (!path.trim()) {
      setError('Project path is required');
      return;
    }

    setLoading(true);
    try {
      await onCreate(name.trim(), path.trim(), description.trim());
    } catch (err: any) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      animation: 'fadeIn 0.2s ease',
    }}
      onClick={onClose}
    >
      <div className="modal" style={{
        width: '100%',
        maxWidth: '500px',
        background: '#0d1321',
        border: '1px solid #1e2a3a',
        borderRadius: '12px',
        overflow: 'hidden',
        animation: 'slideUp 0.3s ease',
      }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{
          padding: '16px 20px',
          background: '#0a0f1a',
          borderBottom: '1px solid #1e2a3a',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>
            Create New Project
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              background: 'transparent',
              color: '#64748b',
              cursor: 'pointer',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>
              Project Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Project"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#111827',
                border: '1px solid #1e2a3a',
                borderRadius: '6px',
                color: '#e2e8f0',
                fontSize: '13px',
                fontFamily: "'JetBrains Mono', monospace",
                outline: 'none',
                boxSizing: 'border-box',
              }}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>
              Project Path
            </label>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/home/user/projects/my-awesome-project"
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#111827',
                border: '1px solid #1e2a3a',
                borderRadius: '6px',
                color: '#e2e8f0',
                fontSize: '13px',
                fontFamily: "'JetBrains Mono', monospace",
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ fontSize: '10px', color: '#475569', marginTop: '4px' }}>
              Absolute path to project directory
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the project..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#111827',
                border: '1px solid #1e2a3a',
                borderRadius: '6px',
                color: '#e2e8f0',
                fontSize: '13px',
                fontFamily: "'JetBrains Mono', monospace",
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 12px',
              background: '#ff475720',
              border: '1px solid #ff4757',
              borderRadius: '6px',
              color: '#ff4757',
              fontSize: '11px',
              marginBottom: '16px',
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: '#111827',
                border: '1px solid #1e2a3a',
                borderRadius: '6px',
                color: '#94a3b8',
                fontSize: '12px',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !path.trim()}
              style={{
                padding: '10px 20px',
                background: '#00ff88',
                border: 'none',
                borderRadius: '6px',
                color: '#0a0f1a',
                fontSize: '12px',
                fontWeight: 600,
                cursor: loading || !name.trim() || !path.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !name.trim() || !path.trim() ? 0.5 : 1,
              }}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>

        {projects.length > 0 && (
          <div className="recent-projects" style={{
            padding: '0 20px 20px',
            borderTop: '1px solid #1e2a3a',
            marginTop: 'auto',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>
              Recent Projects
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
              {projects.slice(0, 5).map(project => (
                <button
                  key={project.id}
                  onClick={() => {
                    // This would load the project - handled by parent
                    onClose();
                  }}
                  style={{
                    padding: '10px 12px',
                    background: '#111827',
                    border: '1px solid #1e2a3a',
                    borderRadius: '6px',
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
              ))}
            </div>
          </div>
        )}

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    </div>
  );
}