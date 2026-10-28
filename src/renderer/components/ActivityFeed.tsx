/**
 * ActivityFeed - Real-time activity log with filtering and search
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AgentActivity, Agent } from '../../shared/types';
import { useElectronAPI } from '../hooks/useElectronAPI';

interface ActivityFeedProps {
  activities: AgentActivity[];
  agents: Agent[];
  maxItems?: number;
}

export function ActivityFeed({ activities, agents, maxItems = 100 }: ActivityFeedProps) {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [autoScroll, setAutoScroll] = useState(true);
  const feedRef = useRef<HTMLDivElement>(null);

  const agentMap = useMemo(() => 
    new Map(agents.map(a => [a.id, a])), 
    [agents]
  );

  const filteredActivities = useMemo(() => {
    let result = [...activities].reverse(); // Newest first
    
    if (filter !== 'all') {
      result = result.filter(a => a.type === filter);
    }
    
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(a => 
        a.message.toLowerCase().includes(term) ||
        agentMap.get(a.agentId)?.name.toLowerCase().includes(term)
      );
    }
    
    return result.slice(0, maxItems);
  }, [activities, filter, search, agentMap, maxItems]);

  // Auto-scroll to bottom when new activities arrive
  useEffect(() => {
    if (autoScroll && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [activities.length, autoScroll]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getActivityIcon = (type: string) => {
    const icons: Record<string, string> = {
      'started-task': '▶',
      'completed-task': '✓',
      'moved-to-room': '🚶',
      'started-break': '☕',
      'ended-break': '⚡',
      'error': '✗',
      'message': '💬',
      'meeting-start': '🤝',
      'meeting-end': '👋',
      'code-commit': '📝',
      'test-run': '🧪',
      'deploy': '🚀',
    };
    return icons[type] || '●';
  };

  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      'started-task': '#00ff88',
      'completed-task': '#00d9ff',
      'moved-to-room': '#f8b500',
      'started-break': '#6c5ce7',
      'ended-break': '#00ff88',
      'error': '#ff4757',
      'message': '#74b9ff',
      'meeting-start': '#e84393',
      'meeting-end': '#a29bfe',
      'code-commit': '#fd79a8',
      'test-run': '#00cec9',
      'deploy': '#ffeaa7',
    };
    return colors[type] || '#74b9ff';
  };

  const activityTypes = useMemo(() => 
    Array.from(new Set(activities.map(a => a.type))).sort(),
    [activities]
  );

  return (
    <div className="activity-feed" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      background: '#0d1321',
      borderRadius: '8px',
      border: '1px solid #1e2a3a',
      overflow: 'hidden',
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {/* Header */}
      <div className="feed-header" style={{
        padding: '12px 16px',
        borderBottom: '1px solid #1e2a3a',
        background: '#0a0f1a',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '13px', 
          fontWeight: 600, 
          color: '#e2e8f0',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}>
          Activity Feed
        </h3>
        
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            placeholder="Search activities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
              background: '#111827',
              border: '1px solid #1e2a3a',
              borderRadius: '4px',
              color: '#e2e8f0',
              fontSize: '11px',
              fontFamily: "'JetBrains Mono', monospace",
              outline: 'none',
            }}
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '6px 10px',
            background: '#111827',
            border: '1px solid #1e2a3a',
            borderRadius: '4px',
            color: '#e2e8f0',
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="all">All Types</option>
          {activityTypes.map(type => (
            <option key={type} value={type}>
              {getActivityIcon(type)} {type.replace(/-/g, ' ')}
            </option>
          ))}
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#94a3b8', fontSize: '11px' }}>
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
            style={{ accentColor: '#00ff88', width: '14px', height: '14px' }}
          />
          Auto-scroll
        </label>

        <span className="activity-count" style={{
          color: '#64748b',
          fontSize: '11px',
          padding: '2px 8px',
          background: '#111827',
          borderRadius: '4px',
        }}>
          {filteredActivities.length} / {activities.length}
        </span>
      </div>

      {/* Feed List */}
      <div
        ref={feedRef}
        className="feed-list"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
          maxHeight: 'calc(100% - 60px)',
        }}
        onScroll={(e) => {
          const target = e.target as HTMLDivElement;
          const atBottom = target.scrollHeight - target.scrollTop === target.clientHeight;
          setAutoScroll(atBottom);
        }}
      >
        {filteredActivities.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#475569',
            fontSize: '12px',
            gap: '8px',
          }}>
            <div style={{ fontSize: '24px' }}>📋</div>
            <div>No activities yet</div>
            <div style={{ fontSize: '10px', color: '#334155' }}>
              {filter !== 'all' || search ? 'Try adjusting filters' : 'Agents will appear here when they start working'}
            </div>
          </div>
        ) : (
          filteredActivities.map((activity, index) => {
            const agent = agentMap.get(activity.agentId);
            return (
              <ActivityItem
                key={`${activity.id}-${index}`}
                activity={activity}
                agent={agent}
                formatTime={formatTime}
                getActivityIcon={getActivityIcon}
                getActivityColor={getActivityColor}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

interface ActivityItemProps {
  activity: AgentActivity;
  agent: Agent | undefined;
  formatTime: (ts: number) => string;
  getActivityIcon: (type: string) => string;
  getActivityColor: (type: string) => string;
}

function ActivityItem({ activity, agent, formatTime, getActivityIcon, getActivityColor }: ActivityItemProps) {
  const color = getActivityColor(activity.type);
  const icon = getActivityIcon(activity.type);
  
  return (
    <div className="activity-item" style={{
      display: 'flex',
      gap: '10px',
      padding: '8px 10px',
      marginBottom: '4px',
      background: '#111827',
      borderRadius: '6px',
      borderLeft: `3px solid ${color}`,
      transition: 'background 0.2s, transform 0.1s',
      animation: 'slideIn 0.3s ease-out',
    }}>
      <div className="activity-time" style={{
        color: '#64748b',
        fontSize: '10px',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        marginTop: '2px',
      }}>
        {formatTime(activity.timestamp)}
      </div>
      
      <div className="activity-icon" style={{
        color: color,
        fontSize: '12px',
        flexShrink: 0,
        marginTop: '1px',
      }}>
        {icon}
      </div>
      
      <div className="activity-content" style={{ flex: 1, minWidth: 0 }}>
        <div className="activity-agent" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '2px',
        }}>
          {agent && (
            <span className="agent-name" style={{
              color: agent.color,
              fontWeight: 600,
              fontSize: '11px',
              textShadow: `0 0 4px ${agent.color}`,
            }}>
              {agent.name}
            </span>
          )}
          <span className="activity-type" style={{
            color: '#94a3b8',
            fontSize: '10px',
            textTransform: 'capitalize',
          }}>
            {activity.type.replace(/-/g, ' ')}
          </span>
        </div>
        
        <div className="activity-message" style={{
          color: '#cbd5e1',
          fontSize: '11px',
          lineHeight: 1.4,
          wordBreak: 'break-word',
        }}>
          {activity.message}
        </div>
        
        {activity.metadata && (
          <div className="activity-meta" style={{
            marginTop: '4px',
            fontSize: '9px',
            color: '#475569',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {Object.entries(activity.metadata).map(([k, v]) => (
              <span key={k} style={{ marginRight: '8px' }}>
                {k}: {String(v)}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}