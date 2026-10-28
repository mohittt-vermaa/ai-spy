/**
 * ProjectManager - Handles project creation, loading, and management
 */

import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { ConfigManager } from './ConfigManager.js';
import { Project, Task, TaskStatus, TaskPriority } from '../../shared/types.js';

export class ProjectManager {
  private configManager: ConfigManager;
  private projectsPath: string;
  private currentProject: Project | null = null;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
    const userDataPath = join(configManager.getConfigPath(), '..');
    this.projectsPath = join(userDataPath, 'projects');
  }

  async initialize(): Promise<void> {
    if (!existsSync(this.projectsPath)) {
      await mkdir(this.projectsPath, { recursive: true });
    }
  }

  async createProject(name: string, path: string, description: string = ''): Promise<Project> {
    const project: Project = {
      id: uuidv4(),
      name,
      path,
      description,
      agents: this.configManager.getConfig().agents.map((a) => a.id),
      tasks: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.saveProject(project);
    this.currentProject = project;
    return project;
  }

  async loadProject(projectId: string): Promise<Project | null> {
    const projectPath = join(this.projectsPath, `${projectId}.json`);
    if (!existsSync(projectPath)) {
      return null;
    }

    try {
      const data = await readFile(projectPath, 'utf-8');
      const project = JSON.parse(data) as Project;
      this.currentProject = project;
      return project;
    } catch (error) {
      console.error('Failed to load project:', error);
      return null;
    }
  }

  async saveProject(project: Project): Promise<void> {
    project.updatedAt = Date.now();
    const projectPath = join(this.projectsPath, `${project.id}.json`);
    await writeFile(projectPath, JSON.stringify(project, null, 2), 'utf-8');
  }

  async getAllProjects(): Promise<Project[]> {
    try {
      const files = await readdir(this.projectsPath);
      const projects: Project[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await readFile(join(this.projectsPath, file), 'utf-8');
          projects.push(JSON.parse(data));
        }
      }

      return projects.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      console.error('Failed to get projects:', error);
      return [];
    }
  }

  async deleteProject(projectId: string): Promise<void> {
    const projectPath = join(this.projectsPath, `${projectId}.json`);
    if (existsSync(projectPath)) {
      await import('fs').then((fs) => fs.promises.unlink(projectPath));
    }
    if (this.currentProject?.id === projectId) {
      this.currentProject = null;
    }
  }

  getCurrentProject(): Project | null {
    return this.currentProject;
  }

  setCurrentProject(project: Project | null): void {
    this.currentProject = project;
  }

  // Task management
  async addTask(projectId: string, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const project = await this.loadProject(projectId);
    if (!project) throw new Error('Project not found');

    const newTask: Task = {
      ...task,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    project.tasks.push(newTask);
    await this.saveProject(project);
    return newTask;
  }

  async updateTask(projectId: string, taskId: string, updates: Partial<Task>): Promise<Task | null> {
    const project = await this.loadProject(projectId);
    if (!project) return null;

    const index = project.tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return null;

    project.tasks[index] = { ...project.tasks[index], ...updates, updatedAt: Date.now() };
    await this.saveProject(project);
    return project.tasks[index];
  }

  async deleteTask(projectId: string, taskId: string): Promise<boolean> {
    const project = await this.loadProject(projectId);
    if (!project) return false;

    const initialLength = project.tasks.length;
    project.tasks = project.tasks.filter((t) => t.id !== taskId);
    
    if (project.tasks.length === initialLength) return false;
    
    await this.saveProject(project);
    return true;
  }

  async moveTask(projectId: string, taskId: string, status: TaskStatus): Promise<Task | null> {
    return this.updateTask(projectId, taskId, { status });
  }

  async assignTask(projectId: string, taskId: string, agentId: string | null): Promise<Task | null> {
    return this.updateTask(projectId, taskId, { assignee: agentId });
  }

  getProjectsPath(): string {
    return this.projectsPath;
  }
}