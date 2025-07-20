import { Component, Input, OnInit, OnDestroy, ViewChild, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';
import { RouterLink } from '@angular/router';
import { TaskCardComponent, TaskFiltersComponent, TaskFilters } from '../../../../shared';
import { TaskSlideOverComponent, TaskSlideOverMode } from '../task-slide-over/task-slide-over.component';
import { ConfirmationDialogComponent, ConfirmationDialogData } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { FabButtonComponent } from '../../../dashboard/components/fab-button/fab-button';
import { TaskMockService, WorkspaceService } from '../../../../core/services';
import { Task, User, Workspace } from '../../../../core/models';

interface TaskGroup {
  status: Task['status'];
  label: string;
  tasks: Task[];
  count: number;
  bgColor: string;
  textColor: string;
}

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TaskCardComponent, TaskFiltersComponent, TaskSlideOverComponent, ConfirmationDialogComponent, FabButtonComponent],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css'],
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(50, [
            animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class TaskListComponent implements OnInit, OnDestroy {
  @Input() workspaceId?: string;
  @Input() users: User[] = [];
  @Input() currentUserId?: string;

  taskGroups: TaskGroup[] = [];
  isLoading = true;
  hasError = false;
  errorMessage = '';
  allTasks: Task[] = [];
  workspace: Workspace | null = null;
  taskSlideOverMode: TaskSlideOverMode = { type: 'create' };
  confirmationData: ConfirmationDialogData = {
    title: '',
    message: '',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger'
  };

  // Filters state
  currentFilters = signal<TaskFilters>({
    myTasks: false,
    status: [],
    priority: [],
    thisWeek: false,
    overdue: false
  });

  // Computed filtered tasks
  filteredTasks = computed(() => {
    let tasks = this.allTasks;
    const filters = this.currentFilters();

    // My tasks filter
    if (filters.myTasks && this.currentUserId) {
      tasks = tasks.filter(task => task.assigneeId === this.currentUserId);
    }

    // Status filter
    if (filters.status.length > 0) {
      tasks = tasks.filter(task => filters.status.includes(task.status));
    }

    // Priority filter
    if (filters.priority.length > 0) {
      tasks = tasks.filter(task => filters.priority.includes(task.priority));
    }

    // This week filter
    if (filters.thisWeek) {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const endOfWeek = new Date(now.setDate(startOfWeek.getDate() + 6));
      
      tasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return dueDate >= startOfWeek && dueDate <= endOfWeek;
      });
    }

    // Overdue filter
    if (filters.overdue) {
      const now = new Date();
      tasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        return new Date(task.dueDate) < now && task.status !== 'done';
      });
    }

    return tasks;
  });

  // Computed results count
  filteredTasksCount = computed(() => this.filteredTasks().length);

  @ViewChild('taskSlideOver') taskSlideOver!: TaskSlideOverComponent;
  @ViewChild('confirmationDialog') confirmationDialog!: ConfirmationDialogComponent;
  
  private taskToDelete: Task | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private taskService: TaskMockService,
    private workspaceService: WorkspaceService
  ) {}

  ngOnInit() {
    this.loadTasks();
    if (this.workspaceId) {
      this.loadWorkspace();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadWorkspace() {
    if (!this.workspaceId) return;
    
    this.workspaceService.getById(this.workspaceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (workspace) => {
          this.workspace = workspace;
        },
        error: (error) => {
          console.error('Error loading workspace:', error);
        }
      });
  }

  loadTasks() {
    this.isLoading = true;
    this.hasError = false;

    const taskObservable = this.workspaceId
      ? this.taskService.filterTasks({ workspaceId: this.workspaceId })
      : this.taskService.getTasks();

    taskObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.allTasks = Array.isArray(response) ? response : response.items;
          this.groupTasksByStatus();
          this.isLoading = false;
        },
        error: (error) => {
          this.hasError = true;
          this.errorMessage = 'Failed to load tasks. Please try again.';
          this.isLoading = false;
          console.error('Error loading tasks:', error);
        }
      });
  }

  private groupTasksByStatus() {
    const groups: TaskGroup[] = [
      {
        status: 'todo',
        label: 'To Do',
        tasks: [],
        count: 0,
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700'
      },
      {
        status: 'in-progress',
        label: 'In Progress',
        tasks: [],
        count: 0,
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700'
      },
      {
        status: 'done',
        label: 'Done',
        tasks: [],
        count: 0,
        bgColor: 'bg-green-50',
        textColor: 'text-green-700'
      }
    ];

    // Use filtered tasks instead of all tasks
    const tasksToGroup = this.filteredTasks();
    
    tasksToGroup.forEach(task => {
      const group = groups.find(g => g.status === task.status);
      if (group) {
        group.tasks.push(task);
        group.count++;
      }
    });

    groups.forEach(group => {
      group.tasks.sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;
        if (a.priority === 'medium' && b.priority === 'low') return -1;
        if (a.priority === 'low' && b.priority === 'medium') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    });

    this.taskGroups = groups;
  }

  get isEmpty(): boolean {
    return !this.isLoading && this.allTasks.length === 0;
  }

  get totalTaskCount(): number {
    return this.filteredTasks().length;
  }

  getSkeletonArray(count: number): number[] {
    return Array(count).fill(0);
  }

  openCreateTaskSlideOver() {
    this.taskSlideOverMode = {
      type: 'create',
      workspaceId: this.workspaceId
    };
    this.taskSlideOver.open();
  }

  openEditTaskSlideOver(task: Task) {
    this.taskSlideOverMode = {
      type: 'edit',
      task: task
    };
    this.taskSlideOver.open();
  }

  onTaskCreated(task: Task) {
    this.allTasks = [...this.allTasks, task];
    this.groupTasksByStatus();
  }

  onTaskUpdated(updatedTask: Task) {
    this.allTasks = this.allTasks.map(task =>
      task.id === updatedTask.id ? updatedTask : task
    );
    this.groupTasksByStatus();
  }

  onTaskSlideOverClosed() {
    // Handle slide-over closed if needed
  }

  getAssignedUser(assigneeId?: string): User | undefined {
    if (!assigneeId) return undefined;
    return this.users.find(user => user.id === assigneeId);
  }

  onTaskAction(event: { action: string; task: Task }) {
    switch (event.action) {
      case 'edit':
        this.openEditTaskSlideOver(event.task);
        break;
      case 'delete':
        this.deleteTask(event.task);
        break;
    }
  }

  private deleteTask(task: Task) {
    this.confirmationData = {
      title: 'Delete Task',
      message: `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    };
    
    this.confirmationDialog.open();
    
    // Store the task to delete for the confirmation handler
    this.taskToDelete = task;
  }

  onDeleteConfirmed() {
    if (this.taskToDelete) {
      this.taskService.deleteTask(this.taskToDelete.id).subscribe({
        next: () => {
          this.allTasks = this.allTasks.filter(t => t.id !== this.taskToDelete!.id);
          this.groupTasksByStatus();
          this.taskToDelete = null;
        },
        error: (error) => {
          console.error('Error deleting task:', error);
          this.taskToDelete = null;
        }
      });
    }
  }

  onDeleteCancelled() {
    this.taskToDelete = null;
  }

  onFiltersChanged(filters: TaskFilters) {
    this.currentFilters.set(filters);
    this.groupTasksByStatus();
  }
}
