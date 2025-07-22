import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MockBaseService } from './mock-base.service';
import { Task, CreateTaskRequest, PaginationResult, TaskFilters } from '../../models';
import { MockDataGenerator, MockGeneratorUtils, MockDataLists } from './mock-data.generator';

export type TaskStatus = Task['status'];

@Injectable({
  providedIn: 'root',
})
export class TaskMockService extends MockBaseService<Task> {
  protected override storageKey = 'taskflow_mock_tasks';

  protected override defaultData: Task[] = this.generateDefaultTasks();

  getTasks(page?: number, limit?: number): Observable<Task[] | PaginationResult<Task>> {
    return this.simulateError<Task[] | PaginationResult<Task>>().pipe(
      switchMap(() => this.getAllFromMockData(page, limit))
    );
  }

  getTaskById(id: string): Observable<Task> {
    return this.simulateError<Task>().pipe(switchMap(() => this.getByIdFromMockData(id)));
  }

  createTask(taskData: CreateTaskRequest): Observable<Task> {
    const newTask: Omit<Task, 'id'> = {
      ...taskData,
      status: 'todo',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.simulateError<Task>().pipe(switchMap(() => this.addToMockData(newTask as Task)));
  }

  updateTask(id: string, updates: Partial<Task>): Observable<Task> {
    const taskUpdates = {
      ...updates,
      updatedAt: new Date(),
    };

    return this.simulateError<Task>().pipe(switchMap(() => this.updateInMockData(id, taskUpdates)));
  }

  deleteTask(id: string): Observable<boolean> {
    return this.simulateError<boolean>().pipe(switchMap(() => this.deleteFromMockData(id)));
  }

  searchTasks(searchTerm: string, page?: number, limit?: number): Observable<Task[] | PaginationResult<Task>> {
    return this.simulateError<Task[] | PaginationResult<Task>>().pipe(
      switchMap(() => this.searchInMockData(searchTerm, ['title', 'description'], page, limit))
    );
  }

  getTasksByWorkspace(workspaceId: string, page?: number, limit?: number): Observable<Task[] | PaginationResult<Task>> {
    return this.simulateDelay().pipe(
      switchMap(() => {
        const data = this.getStoredData() || [];
        const filteredData = data.filter((task) => task.workspaceId === workspaceId);

        if (page && limit) {
          return [this.paginateResults(filteredData, page, limit)];
        }

        return [filteredData];
      })
    );
  }

  getByWorkspace(workspaceId: string): Observable<Task[]> {
    return this.simulateDelay().pipe(
      map(() => {
        const tasks = this.getStoredData() || [];
        return tasks.filter((task) => task.workspaceId === workspaceId);
      })
    );
  }

  getTasksByAssignee(assigneeId: string, page?: number, limit?: number): Observable<Task[] | PaginationResult<Task>> {
    return this.simulateDelay().pipe(
      switchMap(() => {
        const data = this.getStoredData() || [];
        const filteredData = data.filter((task) => task.assigneeId === assigneeId);

        if (page && limit) {
          return [this.paginateResults(filteredData, page, limit)];
        }

        return [filteredData];
      })
    );
  }

  getMyTasks(userId: string): Observable<Task[]> {
    return this.simulateDelay().pipe(
      map(() => {
        const tasks = this.getStoredData() || [];
        return tasks.filter((task) => task.assigneeId === userId);
      })
    );
  }

  updateTaskStatus(id: string, status: Task['status']): Observable<Task> {
    return this.updateTask(id, { status });
  }

  updateStatus(taskId: string, status: TaskStatus): Observable<Task> {
    return this.updateTask(taskId, { status });
  }

  updateTaskPriority(id: string, priority: Task['priority']): Observable<Task> {
    return this.updateTask(id, { priority });
  }

  filterTasks(filters: TaskFilters): Observable<Task[]> {
    return this.simulateDelay().pipe(
      map(() => {
        let tasks = this.getStoredData() || [];

        if (filters.status) {
          tasks = tasks.filter((task) => task.status === filters.status);
        }

        if (filters.priority) {
          tasks = tasks.filter((task) => task.priority === filters.priority);
        }

        if (filters.assigneeId) {
          tasks = tasks.filter((task) => task.assigneeId === filters.assigneeId);
        }

        if (filters.workspaceId) {
          tasks = tasks.filter((task) => task.workspaceId === filters.workspaceId);
        }

        if (filters.hasDueDate !== undefined) {
          tasks = tasks.filter((task) =>
            filters.hasDueDate ? task.dueDate !== undefined : task.dueDate === undefined
          );
        }

        if (filters.isOverdue) {
          const now = new Date();
          tasks = tasks.filter((task) => task.dueDate && new Date(task.dueDate) < now && task.status !== 'done');
        }

        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          tasks = tasks.filter(
            (task) =>
              task.title.toLowerCase().includes(searchLower) ||
              (task.description && task.description.toLowerCase().includes(searchLower))
          );
        }

        return tasks;
      })
    );
  }

  private generateDefaultTasks(): Task[] {
    const dataset = MockDataGenerator.generateCohesiveDataset({
      userCount: 10,
      workspaceCount: 5,
      taskCount: 30,
      seed: 12345,
    });

    const rng = MockGeneratorUtils.getRng();
    const tasks: Task[] = [];

    const taskTitles = [
      'Configure CI/CD pipeline',
      'Review mobile mockups',
      'Implement authentication JWT',
      'Optimize database queries',
      'Create unit tests for API',
      'Refactor caching system',
      'Deploy to production environment',
      'Update project documentation',
      'Implement payment gateway',
      'Fix security vulnerabilities',
      'Improve frontend performance',
      'Setup monitoring alerts',
      'Develop push notifications',
      'Optimize production build',
      'Create logging system',
      'Implement Redis cache',
      'Configure Docker deployment',
      'Develop REST API endpoints',
      'Update dependencies',
      'Create reusable components',
      'Optimize images and assets',
      'Implement full-text search',
      'Configure load balancer',
      'Develop CSV import/export',
      'Setup security audit',
      'Migrate to Angular 20',
      'Configure Kubernetes cluster',
      'Implement GraphQL API',
      'Setup automated backups',
      'Create admin dashboard',
    ];

    taskTitles.forEach((title, index) => {
      const workspace = rng.pick(dataset.workspaces);
      const hasAssignee = rng.next() < 0.75;
      const assigneeId = hasAssignee && workspace.members.length > 0 ? rng.pick(workspace.members).userId : undefined;

      const statusDistribution = [
        { item: 'todo' as const, weight: 40 },
        { item: 'in-progress' as const, weight: 35 },
        { item: 'done' as const, weight: 25 },
      ];

      const status = MockGeneratorUtils.randomEnum(statusDistribution);
      const priority = MockGeneratorUtils.randomEnum(MockDataLists.TASK_PRIORITIES);

      const createdAt = MockGeneratorUtils.generateCreationDate();
      const updatedAt = status !== 'todo' ? MockGeneratorUtils.generateUpdateDate(createdAt) : createdAt;

      const hasDueDate = rng.next() < 0.3;
      let dueDate: Date | undefined;

      if (hasDueDate) {
        const now = new Date();
        const isOverdue = rng.next() < 0.3 && status !== 'done';

        if (isOverdue) {
          const pastDate = new Date(now);
          pastDate.setDate(now.getDate() - rng.int(1, 10));
          dueDate = pastDate;
        } else {
          dueDate = MockGeneratorUtils.generateDueDate();
        }
      }

      const descriptions = [
        `${title} - This task requires thorough analysis and detailed technical design.`,
        `Objective: ${title}. Code review and comprehensive testing required before delivery.`,
        `${title} following development best practices with up-to-date documentation.`,
        `Critical task: ${title}. Team coordination and client validation required.`,
        `${title} - Progressive implementation with testing environment deployment.`,
        `Implementation of ${title} with focus on performance and scalability.`,
        `${title} ensuring security compliance and code quality standards.`,
      ];

      const task: Task = {
        id: `task-${index + 1}`,
        title,
        description: rng.pick(descriptions),
        status,
        priority,
        assigneeId,
        workspaceId: workspace.id,
        dueDate,
        createdAt,
        updatedAt,
      };

      tasks.push(task);
    });

    return tasks;
  }

  generateRealisticTasks(count: number = 10): Task[] {
    const dataset = MockDataGenerator.generateCohesiveDataset({
      userCount: 8,
      workspaceCount: 3,
      taskCount: count,
      seed: Date.now(),
    });
    return dataset.tasks;
  }

  loadRealisticDemoData(): void {
    const demoData = MockDataGenerator.generateCohesiveDataset({
      userCount: 15,
      workspaceCount: 4,
      taskCount: 30,
      seed: 123456,
    });

    this.loadTestData(demoData.tasks);
  }
}
