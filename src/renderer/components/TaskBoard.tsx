/**
 * TaskBoard - Kanban-style task board for project management
 */

import React, { useState } from 'react';
import { Task, Agent, Project, TaskStatus } from '../../shared/types';

interface TaskBoardProps {
  project: Project | null;
  agents: Agent[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onMoveTask: (taskId: string, status: TaskStatus) => void;
  onAssignTask: (taskId: string, agentId: string | null) => void;
}

export function TaskBoard({ project, agents, onAddTask, onUpdateTask, onMoveTask, onAssignTask }: TaskBoardProps) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium');

  const columns: { id: TaskStatus; title: string; color: string }[] = [
    { id: 'todo', title: 'To Do', color: '#64748b' },
    { id: 'in-progress', title: 'In Progress', color: '#00ff88' },
    { id: 'review', title: 'Review', color: '#f8b500' },
    { id: 'done', title: 'Done', color: '#00d9ff' },
    { id: 'blocked', title: 'Blocked', color: '#ff4757' },
  ];

  const tasksByStatus = columns.reduce((acc, col) => {
    acc[col.id] = project?.tasks.filter(t => t.status === col.id) || [];
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('task-id', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('task-id');
    if (taskId) {
      onMoveTask(taskId, status);
    }
  };

  if (!project) {
    return (
      <div className="task-board-empty" style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b',
        padding: '20px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
        <h3 style={{ margin: '0 0 8px', color: '#94a3b8' }}>No Project Selected</h3>
        <p style={{ margin: 0, fontSize: '13px', maxWidth: '300px' }}>
          Select or create a project to manage tasks
        </p>
      </div>
    );
  }

  return (
    <div className="task-board" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0d1321',
      borderRadius: '8px',
      border: '1px solid #1e2a3a',
      overflow: 'hidden',
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {/* Header */}
      <div className="board-header" style={{
        padding: '12px 16px',
        background: '#0a0f1a',
        borderBottom: '1px solid #1e2a3a',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h3 style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#e2e8f0', textTransform: 'uppercase' }}>
          {project.name} - Tasks
        </h3>
        <button
          onClick={() => setShowAddTask(true)}
          style={{
            padding: '6px 12px',
            background: '#00ff88',
            border: 'none',
            borderRadius: '6px',
            color: '#0a0f1a',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          + Add Task
        </button>
      </div>

      {/* Columns */}
      <div className="board-columns" style={{
        flex: 1,
        display: 'flex',
        overflowX: 'auto',
        padding: '16px',
        gap: '12px',
        minHeight: 0,
      }}>
        {columns.map(column => (
          <TaskColumn
            key={column.id}
            column={column}
            tasks={tasksByStatus[column.id]}
            agents={agents}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onMoveTask={onMoveTask}
            onAssignTask={onAssignTask}
            onUpdateTask={onUpdateTask}
          />
        ))}
      </div>
    </div>
  );
}

function TaskColumn({ 
  column, 
  tasks, 
  agents, 
  onDragStart, 
  onDragOver, 
  onDrop, 
  onMoveTask, 
  onAssignTask, 
  onUpdateTask 
}: { 
  column: { id: TaskStatus; title: string; color: string };
  tasks: Task[];
  agents: Agent[];
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: TaskStatus) => void;
  onMoveTask: (taskId: string, status: TaskStatus) => void;
  onAssignTask: (taskId: string, agentId: string | null) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}) {
  return (
    <div
      className="task-column"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, column.id)}
      style={{
        flex: '0 0 280px',
        minWidth: '280px',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#111827',
        borderRadius: '8px',
        border: `1px solid ${column.color}40`,
        overflow: 'hidden',
      }}
    >
      <div className="column-header" style={{
        padding: '10px 12px',
        background: column.color + '15',
        borderBottom: '1px solid ' + column.color + '40',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h4 style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: column.color, textTransform: 'uppercase' }}>
          {column.title}
        </h4>
        <span style={{
          padding: '1px 6px',
          borderRadius: '8px',
          fontSize: '9px',
          fontWeight: 600,
          background: column.color,
          color: '#0a0f1a',
        }}>
          {tasks.length}
        </span>
      </div>

      <div className="column-tasks" style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {tasks.length === 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#334155',
            fontSize: '11px',
            padding: '20px',
            textAlign: 'center',
          }}>
            {column.id === 'todo' ? '📥' : column.id === 'done' ? '✅' : '📦'}
            <div style={{ marginTop: '8px' }}>Drop tasks here</div>
          </div>
        )}
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            agents={agents}
            columnColor={column.color}
            onDragStart={onDragStart}
            onAssignTask={onAssignTask}
            onUpdateTask={onUpdateTask}
          />
        ))}
      </div>
    </div>
  );
}

function TaskCard({ 
  task, 
  agents, 
  columnColor, 
  onDragStart, 
  onAssignTask, 
  onUpdateTask 
}: { 
  task: Task;
  agents: Agent[];
  columnColor: string;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onAssignTask: (taskId: string, agentId: string | null) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}) {
  const [showAssignee, setShowAssignee] = useState(false);
  const assignee = agents.find(a => a.id === task.assignee);

  const priorityColors = {
    low: '#64748b',
    medium: '#f8b500',
    high: '#fd79a8',
    critical: '#ff4757',
  };

  return (
    <div
      className="task-card"
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      style={{
        padding: '12px',
        background: '#0d1321',
        borderRadius: '6px',
        border: `1px solid ${priorityColors[task.priority]}40`,
        borderLeft: `3px solid ${priorityColors[task.priority]}`,
        cursor: 'grab',
        transition: 'transform 0.1s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(2px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ 
          fontSize: '11px', 
          fontWeight: 600, 
          padding: '1px 5px',
          borderRadius: '3px',
          background: priorityColors[task.priority] + '20',
          color: priorityColors[task.priority],
        }}>
          {task.priority}
        </span>
        {assignee && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: assignee.color,
            }} />
            <span style={{ fontSize: '9px', color: assignee.color, fontWeight: 500 }}>
              {assignee.name}
            </span>
          </div>
        )}
      </div>
      
      <h5 style={{ margin: '0 0 6px', fontSize: '12px', color: '#e2e8f0', fontWeight: 500 }}>
        {task.title}
      </h5>
      
      {task.description && (
        <p style={{ margin: '0 0 8px', fontSize: '10px', color: '#94a3b8', lineHeight: 1.4 }}>
          {task.description}
        </p>
      )}

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {task.tags.map(tag => (
          <span key={tag} style={{
            fontSize: '8px',
            padding: '1px 4px',
            borderRadius: '3px',
            background: '#1e2a3a',
            color: '#64748b',
          }}>
            #{tag}
          </span>
        ))}
      </div>

      {assignee && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #1e2a3a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#64748b' }}>Assigned to</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAssignTask(task.id, null);
              }}
              style={{
                padding: '2px 6px',
                fontSize: '9px',
                background: '#ff475720',
                border: '1px solid #ff4757',
                borderRadius: '3px',
                color: '#ff4757',
                cursor: 'pointer',
              }}
            >
              Unassign
            </button>
          </div>
        </div>
      )}
    </div>
  );
}