import { Component, Input, OnInit, OnDestroy, ViewChild, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { TaskCardComponent } from '../../../../shared';
import { SearchFilterComponent } from '../../../../shared';
import { TaskSlideOverComponent } from '../task-slide-over/task-slide-over.component';
import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { FabButtonComponent } from '../../../dashboard/components/fab-button/fab-button';
import { TaskService, WorkspaceService, AuthService, UserService, TeamService } from '../../../../core/services';
import {
  Task,
  User,
  Workspace,
  TaskSlideOverMode,
  TaskGroup,
  TaskFilterOptions,
  ConfirmationDialogData,
  TeamModel,
} from '../../../../core/models';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TaskCardComponent,
    SearchFilterComponent,
    TaskSlideOverComponent,
    ConfirmationDialogComponent,
    FabButtonComponent,
  ],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css'],
  animations: [
    trigger('listAnimation', [
      transition('* => *', [
        query(
          ':enter',
          [
            style({ opacity: 0, transform: 'translateY(20px)' }),
            stagger(50, [animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))]),
          ],
          { optional: true }
        ),
      ]),
    ]),
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0 }), animate('200ms ease-in', style({ opacity: 1 }))])]),
  ],
})
export class TaskListComponent implements OnInit, OnDestroy {
  @Input() workspaceId?: string;
  @Input() users: User[] = [];
  @Input() currentUserId?: string;
  @Input() teams: TeamModel[] = [];

  taskGroups = computed(() => {
    const groups: TaskGroup[] = [
      {
        status: 'todo',
        label: 'To Do',
        tasks: [],
        count: 0,
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700',
      },
      {
        status: 'in-progress',
        label: 'In Progress',
        tasks: [],
        count: 0,
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-700',
      },
      {
        status: 'done',
        label: 'Done',
        tasks: [],
        count: 0,
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
      },
    ];

    const tasksToGroup = this.filteredTasks();

    tasksToGroup.forEach((task) => {
      const group = groups.find((g) => g.status === task.status);
      if (group) {
        group.tasks.push(task);
        group.count++;
      }
    });

    groups.forEach((group) => {
      group.tasks.sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') {
          return -1;
        }
        if (a.priority !== 'high' && b.priority === 'high') {
          return 1;
        }
        if (a.priority === 'medium' && b.priority === 'low') {
          return -1;
        }
        if (a.priority === 'low' && b.priority === 'medium') {
          return 1;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    });

    return groups;
  });
  isLoading = true;
  hasError = false;
  errorMessage = '';
  allTasks = signal<Task[]>([]);
  workspace: Workspace | null = null;
  taskSlideOverMode: TaskSlideOverMode = { type: 'create' };
  confirmationData: ConfirmationDialogData = {
    title: '',
    message: '',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: 'danger',
  };

  currentFilters = signal<TaskFilterOptions>({
    myTasks: false,
    status: [],
    priority: [],
    thisWeek: false,
    overdue: false,
    teamIds: [],
  });

  filteredTasks = computed(() => {
    let tasks = this.allTasks();
    const filters = this.currentFilters();

    if (filters.myTasks && this.currentUserId) {
      tasks = tasks.filter((task) => task.assigneeId === this.currentUserId);
    }

    if (filters.status.length > 0) {
      tasks = tasks.filter((task) => filters.status.includes(task.status));
    }

    if (filters.priority.length > 0) {
      tasks = tasks.filter((task) => filters.priority.includes(task.priority));
    }

    if (filters.teamIds.length > 0) {
      tasks = tasks.filter((task) => task.teamId && filters.teamIds.includes(task.teamId));
    }

    if (filters.thisWeek) {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const endOfWeek = new Date(now.setDate(startOfWeek.getDate() + 6));

      tasks = tasks.filter((task) => {
        if (!task.dueDate) {
          return false;
        }
        const dueDate = new Date(task.dueDate);
        return dueDate >= startOfWeek && dueDate <= endOfWeek;
      });
    }

    if (filters.overdue) {
      const now = new Date();
      tasks = tasks.filter((task) => {
        if (!task.dueDate) {
          return false;
        }
        return new Date(task.dueDate) < now && task.status !== 'done';
      });
    }

    return tasks;
  });

  filteredTasksCount = computed(() => this.filteredTasks().length);

  get taskGroupsList(): TaskGroup[] {
    return this.taskGroups();
  }

  @ViewChild('taskSlideOver') taskSlideOver!: TaskSlideOverComponent;
  @ViewChild('confirmationDialog') confirmationDialog!: ConfirmationDialogComponent;

  private taskToDelete: Task | null = null;
  isRefreshing = signal(false);

  private destroy$ = new Subject<void>();

  constructor(
    private taskService: TaskService,
    private workspaceService: WorkspaceService,
    private authService: AuthService,
    private userService: UserService,
    private teamService: TeamService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Set current user if not provided
    if (!this.currentUserId) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser) {
        this.currentUserId = currentUser.id;
      }
    }

    // Load users if not provided
    if (!this.users || this.users.length === 0) {
      this.loadAllUsers();
    }

    // Load teams if not provided
    if (!this.teams || this.teams.length === 0) {
      this.loadTeams();
    }

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      // Handle teamId parameter
      if (params['teamId']) {
        this.currentFilters.update(filters => ({
          ...filters,
          teamIds: [params['teamId']]
        }));
      }

      // Handle edit parameter - open slide-over to edit task
      if (params['edit']) {
        this.openEditTaskSlideOver(params['edit']);
      }
    });

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
    if (!this.workspaceId) {
      return;
    }

    this.workspaceService
      .getById(this.workspaceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (workspace) => {
          this.workspace = workspace;
        },
        error: (error) => {
          console.error('Error loading workspace:', error);
        },
      });
  }

  private loadAllUsers() {
    this.userService
      .getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users: User[]) => {
          this.users = users;
        },
        error: (error: any) => {
          console.error('Error loading users:', error);
        },
      });
  }

  private loadTeams() {
    this.teamService
      .getAllTeams()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (teams) => {
          this.teams = teams;
        },
        error: (error) => {
          console.error('Error loading teams:', error);
        },
      });
  }

  loadTasks() {
    this.isLoading = true;
    this.hasError = false;

    const taskObservable = this.workspaceId
      ? this.taskService.list({ workspaceId: this.workspaceId })
      : this.taskService.list();

    taskObservable.pipe(takeUntil(this.destroy$)).subscribe({
      next: (tasks: Task[]) => {
        this.allTasks.set(tasks);
        this.isLoading = false;
      },
      error: (error) => {
        this.hasError = true;
        this.errorMessage = 'Failed to load tasks. Please try again.';
        this.isLoading = false;
        console.error('Error loading tasks:', error);
      },
    });
  }


  get isEmpty(): boolean {
    return !this.isLoading && this.allTasks().length === 0;
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
      workspaceId: this.workspaceId,
    };
    this.taskSlideOver.open();
  }

  openEditTaskSlideOver(taskOrId: Task | string) {
    // If it's a string ID, we need to find the task first
    if (typeof taskOrId === 'string') {
      const task = this.allTasks().find(t => t.id === taskOrId);
      if (task) {
        this.taskSlideOverMode = {
          type: 'edit',
          task: task,
        };
        this.taskSlideOver.open();
      } else {
        // If task not found in current list, try to load it
        this.taskService.getById(taskOrId).subscribe({
          next: (task) => {
            this.taskSlideOverMode = {
              type: 'edit',
              task: task,
            };
            this.taskSlideOver.open();
          },
          error: (error) => {
            console.error('Error loading task:', error);
          }
        });
      }
    } else {
      // It's already a Task object
      this.taskSlideOverMode = {
        type: 'edit',
        task: taskOrId,
      };
      this.taskSlideOver.open();
    }
  }

  onTaskCreated(task: Task) {
    this.allTasks.update(tasks => [...tasks, task]);
  }

  onTaskUpdated(updatedTask: Task) {
    this.allTasks.update(tasks => tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
  }

  getAssignedUser(assigneeId?: string): User | undefined {
    if (!assigneeId) {
      return undefined;
    }
    return this.users.find((user) => user.id === assigneeId);
  }

  getAssignedTeam(teamId?: string): TeamModel | undefined {
    if (!teamId) {
      return undefined;
    }
    return this.teams.find((team) => team.teamId === teamId);
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
      type: 'danger',
    };

    this.confirmationDialog.open();

    this.taskToDelete = task;
  }

  onDeleteConfirmed() {
    if (this.taskToDelete) {
      this.isRefreshing.set(true);
      this.taskService.delete(this.taskToDelete.id).subscribe({
        next: () => {
          this.allTasks.update(tasks => tasks.filter((t) => t.id !== this.taskToDelete!.id));
          this.taskToDelete = null;
          // Simulate a small delay to show the loading state
          setTimeout(() => {
            this.isRefreshing.set(false);
          }, 300);
        },
        error: (error) => {
          console.error('Error deleting task:', error);
          this.taskToDelete = null;
          this.isRefreshing.set(false);
        },
      });
    }
  }

  onDeleteCancelled() {
    this.taskToDelete = null;
  }

  onFiltersChanged(filters: TaskFilterOptions) {
    this.currentFilters.set(filters);
  }
}
