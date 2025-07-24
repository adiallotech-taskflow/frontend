import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, map, tap, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { TaskMockService } from './mock';
import { Task, TaskStatus, TaskPriority, CreateTaskRequest, UpdateTaskRequest, TaskFilters } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private tasksSubject = new BehaviorSubject<Task[]>([]);

  constructor(
    private apiService: ApiService,
    private mockService: TaskMockService
  ) {}

  private get useMockService(): boolean {
    return !environment.production;
  }

  create(taskData: CreateTaskRequest): Observable<Task> {
    const request$ = this.useMockService
      ? this.mockService.createTask(taskData)
      : this.apiService.post<Task>('/tasks', taskData);

    return request$.pipe(
      tap((newTask) => {
        const currentTasks = this.tasksSubject.value;
        this.tasksSubject.next([...currentTasks, newTask]);
      }),
      catchError((error) => throwError(() => error))
    );
  }

  list(filters?: TaskFilters): Observable<Task[]> {
    const request$ = this.useMockService
      ? filters
        ? this.mockService.filterTasks(filters)
        : this.mockService.getTasks()
      : this.apiService.get<Task[]>('/tasks');

    return request$.pipe(
      map((result) => (Array.isArray(result) ? result : (result as { items?: Task[] }).items || [])),
      tap((tasks) => this.tasksSubject.next(tasks)),
      catchError((error) => throwError(() => error))
    );
  }

  getById(taskId: string): Observable<Task> {
    const request$ = this.useMockService
      ? this.mockService.getTaskById(taskId)
      : this.apiService.get<Task>(`/tasks/${taskId}`);

    return request$.pipe(
      tap((task) => {
        const currentTasks = this.tasksSubject.value;
        const index = currentTasks.findIndex((t) => t.id === taskId);
        if (index !== -1) {
          const updatedTasks = [...currentTasks];
          updatedTasks[index] = task;
          this.tasksSubject.next(updatedTasks);
        }
      }),
      catchError((error) => throwError(() => error))
    );
  }

  update(taskId: string, updateData: UpdateTaskRequest): Observable<Task> {
    const request$ = this.useMockService
      ? this.mockService.updateTask(taskId, updateData)
      : this.apiService.put<Task>(`/tasks/${taskId}`, updateData);

    return request$.pipe(
      tap((updatedTask) => {
        const currentTasks = this.tasksSubject.value;
        const index = currentTasks.findIndex((t) => t.id === taskId);
        if (index !== -1) {
          const updatedTasks = [...currentTasks];
          updatedTasks[index] = updatedTask;
          this.tasksSubject.next(updatedTasks);
        }
      }),
      catchError((error) => throwError(() => error))
    );
  }

  updateStatus(taskId: string, status: TaskStatus): Observable<Task> {
    const request$ = this.useMockService
      ? this.mockService.updateTaskStatus(taskId, status)
      : this.apiService.patch<Task>(`/tasks/${taskId}`, { status });

    return request$.pipe(
      tap((updatedTask) => {
        const currentTasks = this.tasksSubject.value;
        const index = currentTasks.findIndex((t) => t.id === taskId);
        if (index !== -1) {
          const updatedTasks = [...currentTasks];
          updatedTasks[index] = updatedTask;
          this.tasksSubject.next(updatedTasks);
        }
      }),
      catchError((error) => throwError(() => error))
    );
  }

  updatePriority(taskId: string, priority: TaskPriority): Observable<Task> {
    const request$ = this.useMockService
      ? this.mockService.updateTaskPriority(taskId, priority)
      : this.apiService.patch<Task>(`/tasks/${taskId}`, { priority });

    return request$.pipe(
      tap((updatedTask) => {
        const currentTasks = this.tasksSubject.value;
        const index = currentTasks.findIndex((t) => t.id === taskId);
        if (index !== -1) {
          const updatedTasks = [...currentTasks];
          updatedTasks[index] = updatedTask;
          this.tasksSubject.next(updatedTasks);
        }
      }),
      catchError((error) => throwError(() => error))
    );
  }

  delete(taskId: string): Observable<void> {
    const request$ = this.useMockService
      ? this.mockService.deleteTask(taskId).pipe(map(() => undefined as void))
      : this.apiService.delete<void>(`/tasks/${taskId}`);

    return request$.pipe(
      tap(() => {
        const currentTasks = this.tasksSubject.value;
        const filteredTasks = currentTasks.filter((t) => t.id !== taskId);
        this.tasksSubject.next(filteredTasks);
      }),
      catchError((error) => throwError(() => error))
    );
  }

  search(query: string): Observable<Task[]> {
    const request$ = this.useMockService
      ? this.mockService.filterTasks({ search: query })
      : this.apiService.get<Task[]>('/tasks/search');

    return request$.pipe(
      map((result) => (Array.isArray(result) ? result : (result as { items?: Task[] }).items || [])),
      catchError((error) => throwError(() => error))
    );
  }

  getByWorkspace(workspaceId: string): Observable<Task[]> {
    return this.list({ workspaceId });
  }

  getByAssignee(assigneeId: string): Observable<Task[]> {
    return this.list({ assigneeId });
  }

  getByTeam(teamId: string): Observable<Task[]> {
    return this.list({ teamId });
  }

  refreshTasks(filters?: TaskFilters): Observable<Task[]> {
    return this.list(filters);
  }

  getCachedTasks(): Task[] {
    return this.tasksSubject.value;
  }

  clearCache(): void {
    this.tasksSubject.next([]);
  }
}
