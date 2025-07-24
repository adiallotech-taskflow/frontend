import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Workspace, User, Task, WorkspaceMemberWithUser } from '../../../../core/models';
import { WorkspaceService, AuthService, UserService } from '../../../../core/services';
import { TaskListComponent } from '../../../tasks/components/task-list/task-list.component';
import { TaskMockService } from '../../../../core/services';
import { WorkspaceHeaderComponent } from '../workspace-header/workspace-header.component';
import { WorkspaceTabsComponent, WorkspaceTab } from '../workspace-tabs/workspace-tabs.component';
import { WorkspaceOverviewComponent } from '../workspace-overview/workspace-overview.component';
import { WorkspaceMembersComponent } from '../workspace-members/workspace-members.component';
import { WorkspaceLoadingComponent } from '../workspace-loading/workspace-loading.component';
import { WorkspaceErrorComponent } from '../workspace-error/workspace-error.component';

@Component({
  selector: 'app-workspace-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TaskListComponent,
    WorkspaceHeaderComponent,
    WorkspaceTabsComponent,
    WorkspaceOverviewComponent,
    WorkspaceMembersComponent,
    WorkspaceLoadingComponent,
    WorkspaceErrorComponent
  ],
  templateUrl: './workspace-detail.component.html',
  styleUrls: ['./workspace-detail.component.css'],
})
export class WorkspaceDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  workspace = signal<Workspace | null>(null);
  activeTab = signal<WorkspaceTab>('overview');
  isLoading = signal(true);
  hasError = signal(false);
  errorMessage = signal('');

  currentUser = signal<User | null>(null);

  membersWithUsers = signal<WorkspaceMemberWithUser[]>([]);

  tasks = signal<Task[]>([]);

  canEdit = computed(() => {
    const user = this.currentUser();
    const ws = this.workspace();
    return user && ws && (ws.ownerId === user.id || user.role === 'admin');
  });

  taskStats = computed(() => {
    const allTasks = this.tasks();
    return {
      todo: allTasks.filter((t) => t.status === 'todo').length,
      inProgress: allTasks.filter((t) => t.status === 'in-progress').length,
      done: allTasks.filter((t) => t.status === 'done').length,
      total: allTasks.length,
    };
  });

  // Computed property for workspace users
  workspaceUsers = computed(() => {
    return this.membersWithUsers()
      .map(m => m.user)
      .filter((user): user is User => user !== undefined);
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workspaceService: WorkspaceService,
    private taskService: TaskMockService,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    // Initialize current user
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUser.set(user);
    }

    this.loadWorkspace();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadWorkspace() {
    const resolvedWorkspace = this.route.snapshot.data['workspace'];

    if (resolvedWorkspace) {
      this.workspace.set(resolvedWorkspace);
      this.loadMembersWithUserDetails(resolvedWorkspace);
      this.loadWorkspaceTasks(resolvedWorkspace.id);
      this.isLoading.set(false);
      return;
    }

    const workspaceId = this.route.snapshot.paramMap.get('id');
    if (!workspaceId) {
      this.router.navigate(['/workspaces']);
      return;
    }

    this.isLoading.set(true);
    this.hasError.set(false);

    this.workspaceService
      .getById(workspaceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (workspace) => {
          this.workspace.set(workspace);
          this.loadMembersWithUserDetails(workspace);
          this.loadWorkspaceTasks(workspace.id);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading workspace:', error);
          this.hasError.set(true);
          this.errorMessage.set('Failed to load workspace details');
          this.isLoading.set(false);
        },
      });
  }

  private loadMembersWithUserDetails(workspace: Workspace) {
    // First, get all users
    this.userService
      .getUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (allUsers) => {
          // Map workspace members to include user details
          const membersWithUsers: WorkspaceMemberWithUser[] = workspace.members.map((member) => {
            const user = allUsers.find(u => u.id === member.userId);
            return {
              ...member,
              user: user // This will be undefined if user not found, which is handled by workspaceUsers computed
            };
          });

          this.membersWithUsers.set(membersWithUsers);
        },
        error: (error) => {
          console.error('Error loading users:', error);
          // Set members without user details as fallback
          const membersWithoutUsers: WorkspaceMemberWithUser[] = workspace.members.map((member) => ({
            ...member,
            user: undefined
          }));
          this.membersWithUsers.set(membersWithoutUsers);
        },
      });
  }

  private loadWorkspaceTasks(workspaceId: string) {
    this.taskService
      .getByWorkspace(workspaceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tasks: Task[]) => {
          this.tasks.set(tasks);
        },
        error: (error: unknown) => {
          console.error('Error loading workspace tasks:', error);
        },
      });
  }

  setActiveTab(tab: WorkspaceTab) {
    this.activeTab.set(tab);
  }

  reloadWorkspace() {
    this.loadWorkspace();
  }

  onMembersAdded() {
    // Refresh the workspace to get updated member list
    const workspaceId = this.workspace()?.id;
    if (workspaceId) {
      this.workspaceService
        .getById(workspaceId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (workspace) => {
            this.workspace.set(workspace);
            this.loadMembersWithUserDetails(workspace);
          },
          error: (error) => {
            console.error('Error refreshing workspace:', error);
          },
        });
    }
  }

}
