/**
 * TelemetryServer - WebSocket server for real-time agent telemetry
 */

import { WebSocketServer, WebSocket } from 'ws';
import { EventEmitter } from 'events';
import { AgentOrchestrator } from './AgentOrchestrator.js';
import { TelemetryEvent, AgentState } from '../../shared/types.js';

interface ConnectedClient {
  ws: WebSocket;
  agentId?: string;
  authenticated: boolean;
}

export class TelemetryServer extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private orchestrator: AgentOrchestrator;
  private clients: Set<ConnectedClient> = new Set();
  private port: number = 0;

  constructor(orchestrator: AgentOrchestrator) {
    super();
    this.orchestrator = orchestrator;
    this.setupOrchestratorListeners();
  }

  private setupOrchestratorListeners(): void {
    this.orchestrator.on('agent-update', (agent) => {
      this.broadcast({
        type: 'agent-update',
        payload: agent,
      });
    });

    this.orchestrator.on('activity', (activity) => {
      this.broadcast({
        type: 'activity',
        payload: activity,
      });
    });

    this.orchestrator.on('telemetry', (event: TelemetryEvent) => {
      this.broadcast({
        type: 'telemetry',
        payload: event,
      });
    });
  }

  async start(port: number): Promise<void> {
    this.port = port;
    
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocketServer({ port });

        this.wss.on('listening', () => {
          console.log(`Telemetry server listening on port ${port}`);
          resolve();
        });

        this.wss.on('connection', (ws: WebSocket, req) => {
          this.handleConnection(ws, req);
        });

        this.wss.on('error', (error) => {
          console.error('WebSocket server error:', error);
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    if (this.wss) {
      // Close all client connections
      for (const client of this.clients) {
        client.ws.close(1001, 'Server shutting down');
      }
      this.clients.clear();

      // Close server
      return new Promise((resolve) => {
        this.wss!.close(() => {
          console.log('Telemetry server stopped');
          resolve();
        });
      });
    }
  }

  private handleConnection(ws: WebSocket, req: any): void {
    const client: ConnectedClient = {
      ws,
      authenticated: false,
    };

    this.clients.add(client);
    console.log(`Client connected: ${this.clients.size} total`);

    ws.on('message', (data: Buffer) => {
      this.handleMessage(client, data);
    });

    ws.on('close', (code, reason) => {
      this.clients.delete(client);
      console.log(`Client disconnected: ${code} ${reason}, ${this.clients.size} remaining`);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.clients.delete(client);
    });

    // Send welcome message
    this.send(client, {
      type: 'welcome',
      payload: {
        message: 'Connected to Agent Mission Control telemetry server',
        agents: this.orchestrator.getAllAgents(),
      },
    });
  }

  private handleMessage(client: ConnectedClient, data: Buffer): void {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'auth':
          this.handleAuth(client, message.payload);
          break;
        case 'agent-status':
          this.handleAgentStatus(client, message.payload);
          break;
        case 'heartbeat':
          this.handleHeartbeat(client);
          break;
        case 'subscribe':
          // Client wants to subscribe to specific agent updates
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }

  private handleAuth(client: ConnectedClient, payload: any): void {
    // Simple authentication - in production, use proper tokens
    if (payload.agentId && payload.token === `agent-${payload.agentId}`) {
      client.agentId = payload.agentId;
      client.authenticated = true;
      console.log(`Agent authenticated: ${payload.agentId}`);
      this.send(client, { type: 'auth-success', payload: { agentId: payload.agentId } });
    } else {
      this.send(client, { type: 'auth-failed', payload: { reason: 'Invalid credentials' } });
      client.ws.close(4001, 'Authentication failed');
    }
  }

  private handleAgentStatus(client: ConnectedClient, payload: any): void {
    if (!client.authenticated || !client.agentId) return;

    const { state, position, currentTask, taskProgress } = payload;
    
    if (state) {
      this.orchestrator.updateAgentState(client.agentId, state as AgentState);
    }
    if (position) {
      this.orchestrator.updateAgentPosition(client.agentId, position);
    }
    if (currentTask !== undefined) {
      this.orchestrator.updateAgentTask(client.agentId, currentTask);
    }
    if (taskProgress !== undefined) {
      this.orchestrator.updateAgentProgress(client.agentId, taskProgress);
    }
  }

  private handleHeartbeat(client: ConnectedClient): void {
    this.send(client, { type: 'heartbeat-ack', payload: { timestamp: Date.now() } });
  }

  private send(client: ConnectedClient, message: any): void {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  private broadcast(message: any): void {
    const data = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(data);
      }
    }
  }

  getConnectedClients(): number {
    return this.clients.size;
  }

  getPort(): number {
    return this.port;
  }
}