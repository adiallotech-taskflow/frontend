import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MockBaseService, PaginationResult } from './mock-base.service';
import { Task, CreateTaskRequest } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class TaskMockService extends MockBaseService<Task> {
  protected override storageKey = 'taskflow_mock_tasks';
  
  protected override defaultData: Task[] = [
    {
      id: '1',
      title: 'Design new user interface',
      description: 'Create mockups and wireframes for the new dashboard',
      status: 'in-progress',
      priority: 'high',
      assigneeId: 'user1',
      workspaceId: '1',
      dueDate: new Date('2024-12-25'),
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date()
    },
    {
      id: '2',
      title: 'Implement authentication system',
      description: 'Set up JWT tokens and user sessions',
      status: 'todo',
      priority: 'medium',
      assigneeId: 'user2',
      workspaceId: '1',
      dueDate: new Date('2024-12-30'),
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date()
    },
    {
      id: '3',
      title: 'Write unit tests',
      description: 'Add comprehensive test coverage for core components',
      status: 'done',
      priority: 'low',
      assigneeId: 'user1',
      workspaceId: '2',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date()
    }
  ];

  /**
   * Récupère toutes les tâches avec pagination optionnelle
   */
  getTasks(page?: number, limit?: number): Observable<Task[] | PaginationResult<Task>> {
    return this.simulateError<Task[] | PaginationResult<Task>>(0.05).pipe(
      switchMap(() => this.getAllFromMockData(page, limit))
    );
  }

  /**
   * Récupère une tâche par ID
   */
  getTaskById(id: string): Observable<Task> {
    return this.simulateError<Task>(0.05).pipe(
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

    return this.simulateError<Task>(0.05).pipe(
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

    return this.simulateError<Task>(0.05).pipe(
      switchMap(() => this.updateInMockData(id, taskUpdates))
    );
  }

  /**
   * Supprime une tâche
   */
  deleteTask(id: string): Observable<boolean> {
    return this.simulateError<boolean>(0.05).pipe(
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
    return this.simulateError<Task[] | PaginationResult<Task>>(0.05).pipe(
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
}