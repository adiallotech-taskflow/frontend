import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MockBaseService, PaginationResult } from './mock-base.service';
import { Task, CreateTaskRequest } from '../../models';
import { MockDataGenerator } from './mock-data.generator';

@Injectable({
  providedIn: 'root'
})
export class TaskMockService extends MockBaseService<Task> {
  protected override storageKey = 'taskflow_mock_tasks';
  
  protected override defaultData: Task[] = this.generateDefaultTasks();

  /**
   * Récupère toutes les tâches avec pagination optionnelle
   */
  getTasks(page?: number, limit?: number): Observable<Task[] | PaginationResult<Task>> {
    return this.simulateError<Task[] | PaginationResult<Task>>().pipe(
      switchMap(() => this.getAllFromMockData(page, limit))
    );
  }

  /**
   * Récupère une tâche par ID
   */
  getTaskById(id: string): Observable<Task> {
    return this.simulateError<Task>().pipe(
      switchMap(() => this.getByIdFromMockData(id))
    );
  }

  /**
   * Crée une nouvelle tâche
   */
  createTask(taskData: CreateTaskRequest): Observable<Task> {
    const newTask: Omit<Task, 'id'> = {
      ...taskData,
      status: 'todo',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return this.simulateError<Task>().pipe(
      switchMap(() => this.addToMockData(newTask as Task))
    );
  }

  /**
   * Met à jour une tâche
   */
  updateTask(id: string, updates: Partial<Task>): Observable<Task> {
    const taskUpdates = {
      ...updates,
      updatedAt: new Date()
    };

    return this.simulateError<Task>().pipe(
      switchMap(() => this.updateInMockData(id, taskUpdates))
    );
  }

  /**
   * Supprime une tâche
   */
  deleteTask(id: string): Observable<boolean> {
    return this.simulateError<boolean>().pipe(
      switchMap(() => this.deleteFromMockData(id))
    );
  }

  /**
   * Recherche des tâches par terme
   */
  searchTasks(
    searchTerm: string, 
    page?: number, 
    limit?: number
  ): Observable<Task[] | PaginationResult<Task>> {
    return this.simulateError<Task[] | PaginationResult<Task>>().pipe(
      switchMap(() => this.searchInMockData(searchTerm, ['title', 'description'], page, limit))
    );
  }

  /**
   * Récupère les tâches par workspace
   */
  getTasksByWorkspace(
    workspaceId: string, 
    page?: number, 
    limit?: number
  ): Observable<Task[] | PaginationResult<Task>> {
    return this.simulateDelay().pipe(
      switchMap(() => {
        const data = this.getStoredData() || [];
        const filteredData = data.filter(task => task.workspaceId === workspaceId);

        if (page && limit) {
          return [this.paginateResults(filteredData, page, limit)];
        }

        return [filteredData];
      })
    );
  }

  /**
   * Récupère les tâches assignées à un utilisateur
   */
  getTasksByAssignee(
    assigneeId: string, 
    page?: number, 
    limit?: number
  ): Observable<Task[] | PaginationResult<Task>> {
    return this.simulateDelay().pipe(
      switchMap(() => {
        const data = this.getStoredData() || [];
        const filteredData = data.filter(task => task.assigneeId === assigneeId);

        if (page && limit) {
          return [this.paginateResults(filteredData, page, limit)];
        }

        return [filteredData];
      })
    );
  }

  /**
   * Change le statut d'une tâche
   */
  updateTaskStatus(id: string, status: Task['status']): Observable<Task> {
    return this.updateTask(id, { status });
  }

  /**
   * Change la priorité d'une tâche
   */
  updateTaskPriority(id: string, priority: Task['priority']): Observable<Task> {
    return this.updateTask(id, { priority });
  }

  /**
   * Generate default realistic tasks using the generator
   */
  private generateDefaultTasks(): Task[] {
    return MockDataGenerator.generateCohesiveDataset({
      userCount: 5,
      workspaceCount: 2,
      taskCount: 12,
      seed: 42 // Fixed seed for consistent default data
    }).tasks;
  }

  /**
   * Generate additional realistic tasks
   */
  generateRealisticTasks(count: number = 10): Task[] {
    const dataset = MockDataGenerator.generateCohesiveDataset({
      userCount: 8,
      workspaceCount: 3,
      taskCount: count,
      seed: Date.now() // Random seed for variety
    });
    return dataset.tasks;
  }

  /**
   * Load realistic demo data
   */
  loadRealisticDemoData(): void {
    const demoData = MockDataGenerator.generateCohesiveDataset({
      userCount: 15,
      workspaceCount: 4,
      taskCount: 30,
      seed: 123456
    });
    
    this.loadTestData(demoData.tasks);
    this.configService.logAction('Loaded realistic demo data', {
      tasks: demoData.tasks.length,
      users: demoData.users.length,
      workspaces: demoData.workspaces.length
    });
  }
}