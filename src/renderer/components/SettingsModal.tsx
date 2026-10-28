/**
 * SettingsModal - Application settings (office theme, UI, Claude runtime)
 */

import React, { useState } from 'react';
import { AppConfig } from '../../shared/types';

interface SettingsModalProps {
  config: AppConfig | null;
  onClose: () => void;
  onSave: (updates: Partial<AppConfig>) => Promise<void>;
}

type Tab = 'office' | 'ui' | 'claude';

const THEMES = ['cyberpunk', 'modern', 'cozy', 'minimal'];

export function SettingsModal({ config, onClose, onSave }: SettingsModalProps) {
  const [tab, setTab] = useState<Tab>('office');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [office, setOffice] = useState({
    mapId: config?.office.mapId ?? 'default',
    theme: config?.office.theme ?? 'cyberpunk',
    highlightColor: config?.office.highlightColor ?? '#00ff88',
  });

  const [ui, setUi] = useState({
    pixelScale: config?.ui.pixelScale ?? 2,
    showGrid: config?.ui.showGrid ?? false,
    animationSpeed: config?.ui.animationSpeed ?? 1,
    theme: config?.ui.theme ?? 'dark',
  });

  const [claude, setClaude] = useState({
    executable: config?.claude.executable ?? 'claude',
    workspacePath: config?.claude.workspacePath ?? '',
    autoStart: config?.claude.autoStart ?? false,
    telemetryPort: config?.claude.telemetryPort ?? 8765,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ office, ui, claude });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '10px',
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: '6px',
    letterSpacing: '0.5px',
  };

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    background: '#0a0f1a',
    border: '1px solid #1e2a3a',
    borderRadius: '6px',
    color: '#e2e8f0',
    fontSize: '12px',
    fontFamily: "'JetBrains Mono', monospace",
    outline: 'none',
  };

  const rowStyle: React.CSSProperties = { marginBottom: '18px' };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '560px',
          maxWidth: '92vw',
          maxHeight: '86vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#0d1321',
          border: '1px solid #1e2a3a',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid #1e2a3a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#e2e8f0' }}>Settings</h2>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#64748b' }}>
              Office, interface and runtime configuration
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              background: '#111827',
              border: '1px solid #1e2a3a',
              borderRadius: '6px',
              color: '#94a3b8',
              fontSize: '16px',
              cursor: 'pointer',
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '4px', padding: '10px 20px 0' }}>
          {(['office', 'ui', 'claude'] as Tab[]).map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: '8px 14px',
                background: tab === key ? '#00ff8815' : 'transparent',
                border: '1px solid ' + (tab === key ? '#00ff88' : 'transparent'),
                borderRadius: '6px',
                color: tab === key ? '#00ff88' : '#64748b',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'capitalize',
                cursor: 'pointer',
              }}
            >
              {key === 'ui' ? 'Interface' : key === 'claude' ? 'Claude' : 'Office'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1 }}>
          {tab === 'office' && (
            <>
              <div style={rowStyle}>
                <label style={labelStyle}>Office Theme</label>
                <select
                  value={office.theme}
                  onChange={(e) => setOffice({ ...office, theme: e.target.value })}
                  style={fieldStyle}
                >
                  {THEMES.map((theme) => (
                    <option key={theme} value={theme}>{theme}</option>
                  ))}
                </select>
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>Office Map ID</label>
                <input
                  type="text"
                  value={office.mapId}
                  onChange={(e) => setOffice({ ...office, mapId: e.target.value })}
                  style={fieldStyle}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>Highlight Color</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={office.highlightColor}
                    onChange={(e) => setOffice({ ...office, highlightColor: e.target.value })}
                    style={{ width: '48px', height: '38px', padding: '2px', background: '#0a0f1a' }}
                  />
                  <input
                    type="text"
                    value={office.highlightColor}
                    onChange={(e) => setOffice({ ...office, highlightColor: e.target.value })}
                    style={fieldStyle}
                  />
                </div>
              </div>
            </>
          )}

          {tab === 'ui' && (
            <>
              <div style={rowStyle}>
                <label style={labelStyle}>Pixel Scale: {ui.pixelScale}x</label>
                <input
                  type="range"
                  min={1}
                  max={4}
                  step={1}
                  value={ui.pixelScale}
                  onChange={(e) => setUi({ ...ui, pixelScale: Number(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>Animation Speed: {ui.animationSpeed.toFixed(1)}x</label>
                <input
                  type="range"
                  min={0.25}
                  max={3}
                  step={0.25}
                  value={ui.animationSpeed}
                  onChange={(e) => setUi({ ...ui, animationSpeed: Number(e.target.value) })}
                  style={{ width: '100%' }}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>Theme</label>
                <select
                  value={ui.theme}
                  onChange={(e) => setUi({ ...ui, theme: e.target.value as AppConfig['ui']['theme'] })}
                  style={fieldStyle}
                >
                  <option value="dark">dark</option>
                  <option value="light">light</option>
                  <option value="auto">auto</option>
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '12px', color: '#e2e8f0' }}>
                <input
                  type="checkbox"
                  checked={ui.showGrid}
                  onChange={(e) => setUi({ ...ui, showGrid: e.target.checked })}
                />
                Show office grid
              </label>
            </>
          )}

          {tab === 'claude' && (
            <>
              <div style={rowStyle}>
                <label style={labelStyle}>Claude Executable</label>
                <input
                  type="text"
                  value={claude.executable}
                  onChange={(e) => setClaude({ ...claude, executable: e.target.value })}
                  placeholder="claude"
                  style={fieldStyle}
                />
                <div style={{ fontSize: '9px', color: '#64748b', marginTop: '4px' }}>
                  Command used to launch Claude Code (must be on your PATH).
                </div>
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>Default Workspace Path</label>
                <input
                  type="text"
                  value={claude.workspacePath}
                  onChange={(e) => setClaude({ ...claude, workspacePath: e.target.value })}
                  placeholder="/path/to/your/project"
                  style={fieldStyle}
                />
              </div>
              <div style={rowStyle}>
                <label style={labelStyle}>Telemetry Port</label>
                <input
                  type="number"
                  value={claude.telemetryPort}
                  onChange={(e) => setClaude({ ...claude, telemetryPort: Number(e.target.value) })}
                  style={fieldStyle}
                />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '12px', color: '#e2e8f0' }}>
                <input
                  type="checkbox"
                  checked={claude.autoStart}
                  onChange={(e) => setClaude({ ...claude, autoStart: e.target.checked })}
                />
                Start agents automatically on launch
              </label>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid #1e2a3a',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          background: '#0a0f1a',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '9px 16px',
              background: 'transparent',
              border: '1px solid #1e2a3a',
              borderRadius: '6px',
              color: '#94a3b8',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '9px 18px',
              background: saving ? '#1e2a3a' : '#00ff88',
              border: 'none',
              borderRadius: '6px',
              color: saving ? '#475569' : '#0a0f1a',
              fontSize: '11px',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
