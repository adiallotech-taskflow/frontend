import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, switchMap, catchError } from 'rxjs/operators';

import { Workspace, User, WorkspaceMember } from '../../../../core/models';
import { WorkspaceService } from '../../../../core/services/workspace.service';
import { TaskListComponent } from '../../../tasks/components/task-list/task-list.component';

// Extended interface for members with user details
interface WorkspaceMemberWithUser extends WorkspaceMember {
  user?: User;
}

@Component({
  selector: 'app-workspace-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, TaskListComponent, TitleCasePipe],
  templateUrl: './workspace-detail.component.html',
  styleUrls: ['./workspace-detail.component.css']
})
export class WorkspaceDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  workspace = signal<Workspace | null>(null);
  activeTab = signal<'tasks' | 'members' | 'settings'>('tasks');
  isLoading = signal(true);
  hasError = signal(false);
  errorMessage = signal('');

  // Current user for permissions
  currentUser = signal<User | null>(null);
  
  // Members with user details
  membersWithUsers = signal<WorkspaceMemberWithUser[]>([]);

  // Computed values
  canEdit = computed(() => {
    const user = this.currentUser();
    const ws = this.workspace();
    return user && ws && (ws.ownerId === user.id || user.role === 'admin');
  });

  taskStats = computed(() => {
    // For now, we'll use mock stats since tasks are not part of workspace model
    // In a real app, this would come from a task service or workspace stats
    return { todo: 5, inProgress: 3, done: 12, total: 20 };
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workspaceService: WorkspaceService
  ) {}

  ngOnInit() {
    this.loadWorkspace();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadWorkspace() {
    // Try to get workspace from route resolver first
    const resolvedWorkspace = this.route.snapshot.data['workspace'];
    
    if (resolvedWorkspace) {
      this.workspace.set(resolvedWorkspace);
      this.loadMembersWithUserDetails(resolvedWorkspace);
      this.isLoading.set(false);
      return;
    }

    // Fallback to manual loading if resolver failed
    const workspaceId = this.route.snapshot.paramMap.get('id');
    if (!workspaceId) {
      this.router.navigate(['/workspaces']);
      return;
    }

    this.isLoading.set(true);
    this.hasError.set(false);

    this.workspaceService.getById(workspaceId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (workspace) => {
          this.workspace.set(workspace);
          this.loadMembersWithUserDetails(workspace);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading workspace:', error);
          this.hasError.set(true);
          this.errorMessage.set('Failed to load workspace details');
          this.isLoading.set(false);
        }
      });
  }

  private loadMembersWithUserDetails(workspace: Workspace) {
    // For mock purposes, create mock user data for members
    const membersWithUsers: WorkspaceMemberWithUser[] = workspace.members.map(member => ({
      ...member,
      user: {
        id: member.userId,
        email: `user${member.userId.slice(-1)}@example.com`,
        firstName: `User`,
        lastName: member.userId.slice(-1),
        role: member.role,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }));
    
    this.membersWithUsers.set(membersWithUsers);
  }

  setActiveTab(tab: 'tasks' | 'members' | 'settings') {
    this.activeTab.set(tab);
  }

  onEditWorkspace() {
    // TODO: Implement edit workspace functionality
    console.log('Edit workspace functionality to be implemented');
  }

  onDeleteWorkspace() {
    // TODO: Implement delete workspace functionality
    console.log('Delete workspace functionality to be implemented');
  }

  onInviteMember() {
    // TODO: Implement invite member functionality
    console.log('Invite member functionality to be implemented');
  }

  navigateBack() {
    this.router.navigate(['/dashboard']);
  }

  reloadWorkspace() {
    this.loadWorkspace();
  }
}