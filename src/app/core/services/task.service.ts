import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, map, tap, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { TaskMockService, TaskFilters } from './mock/task-mock.service';
import { Task, TaskStatus, TaskPriority, CreateTaskRequest } from '../models';
import { environment } from '../../../environments/environment';

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: Date;
}


@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  
  public tasks$ = this.tasksSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private mockService: TaskMockService
  ) {}

  /**
   * Determines whether to use mock service based on environment
   */
  private get useMockService(): boolean {
    return !environment.production;
  }

  /**
   * Create a new task
   */
  create(taskData: CreateTaskRequest): Observable<Task> {
    const request$ = this.useMockService 
      ? this.mockService.createTask(taskData)
      : this.apiService.post<Task>('/tasks', taskData);

    return request$.pipe(
      tap(newTask => {
        const currentTasks = this.tasksSubject.value;
        this.tasksSubject.next([...currentTasks, newTask]);
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get all tasks with optional filters
   */
  list(filters?: TaskFilters): Observable<Task[]> {
    const request$ = this.useMockService 
      ? (filters ? this.mockService.filterTasks(filters) : this.mockService.getTasks())
      : this.apiService.get<Task[]>('/tasks');

    return request$.pipe(
      map(result => Array.isArray(result) ? result : (result as any).items || []),
      tap(tasks => this.tasksSubject.next(tasks)),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get a specific task by ID
   */
  getById(taskId: string): Observable<Task> {
    const request$ = this.useMockService 
      ? this.mockService.getTaskById(taskId)
      : this.apiService.get<Task>(`/tasks/${taskId}`);

    return request$.pipe(
      tap(task => {
        const currentTasks = this.tasksSubject.value;
        const index = currentTasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
          const updatedTasks = [...currentTasks];
          updatedTasks[index] = task;
          this.tasksSubject.next(updatedTasks);
        }
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Update a task
   */
  update(taskId: string, updateData: UpdateTaskRequest): Observable<Task> {
    const request$ = this.useMockService 
      ? this.mockService.updateTask(taskId, updateData)
      : this.apiService.put<Task>(`/tasks/${taskId}`, updateData);

    return request$.pipe(
      tap(updatedTask => {
        const currentTasks = this.tasksSubject.value;
        const index = currentTasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
          const updatedTasks = [...currentTasks];
          updatedTasks[index] = updatedTask;
          this.tasksSubject.next(updatedTasks);
        }
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Update task status
   */
  updateStatus(taskId: string, status: TaskStatus): Observable<Task> {
    const request$ = this.useMockService 
      ? this.mockService.updateTaskStatus(taskId, status)
      : this.apiService.patch<Task>(`/tasks/${taskId}`, { status });

    return request$.pipe(
      tap(updatedTask => {
        const currentTasks = this.tasksSubject.value;
        const index = currentTasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
          const updatedTasks = [...currentTasks];
          updatedTasks[index] = updatedTask;
          this.tasksSubject.next(updatedTasks);
        }
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Update task priority
   */
  updatePriority(taskId: string, priority: TaskPriority): Observable<Task> {
    const request$ = this.useMockService 
      ? this.mockService.updateTaskPriority(taskId, priority)
      : this.apiService.patch<Task>(`/tasks/${taskId}`, { priority });

    return request$.pipe(
      tap(updatedTask => {
        const currentTasks = this.tasksSubject.value;
        const index = currentTasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
          const updatedTasks = [...currentTasks];
          updatedTasks[index] = updatedTask;
          this.tasksSubject.next(updatedTasks);
        }
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Delete a task
   */
  delete(taskId: string): Observable<void> {
    const request$ = this.useMockService 
      ? this.mockService.deleteTask(taskId).pipe(map(() => undefined as void))
      : this.apiService.delete<void>(`/tasks/${taskId}`);

    return request$.pipe(
      tap(() => {
        const currentTasks = this.tasksSubject.value;
        const filteredTasks = currentTasks.filter(t => t.id !== taskId);
        this.tasksSubject.next(filteredTasks);
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Search tasks
   */
  search(query: string): Observable<Task[]> {
    const request$ = this.useMockService 
      ? this.mockService.filterTasks({ search: query })
      : this.apiService.get<Task[]>('/tasks/search');

    return request$.pipe(
      map(result => Array.isArray(result) ? result : (result as any).items || []),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get tasks for a specific workspace
   */
  getByWorkspace(workspaceId: string): Observable<Task[]> {
    return this.list({ workspaceId });
  }

  /**
   * Get tasks assigned to a specific user
   */
  getByAssignee(assigneeId: string): Observable<Task[]> {
    return this.list({ assigneeId });
  }

  /**
   * Refresh tasks from the server
   */
  refreshTasks(filters?: TaskFilters): Observable<Task[]> {
    return this.list(filters);
  }

  /**
   * Get cached tasks without making an API call
   */
  getCachedTasks(): Task[] {
    return this.tasksSubject.value;
  }

  /**
   * Clear the task cache
   */
  clearCache(): void {
    this.tasksSubject.next([]);
  }
}