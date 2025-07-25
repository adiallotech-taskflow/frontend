import { Injectable, inject } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { MockBaseService } from './mock-base.service';
import { AuthMockService } from './auth-mock.service';
import { UserService } from '../user.service';
import {
  Workspace,
  WorkspaceMember,
  PaginationResult,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  InviteMemberRequest,
} from '../../models';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceMockService extends MockBaseService<Workspace> {
  protected override storageKey = 'taskflow_mock_workspaces';
  private authService = inject(AuthMockService);
  private userService = inject(UserService);

  protected override defaultData: Workspace[] = this.generateDefaultWorkspaces();

  getWorkspaces(page?: number, limit?: number): Observable<Workspace[] | PaginationResult<Workspace>> {
    return this.simulateError<Workspace[] | PaginationResult<Workspace>>().pipe(
      switchMap(() => this.getAllFromMockData(page, limit))
    );
  }

  getWorkspaceById(id: string): Observable<Workspace> {
    return this.simulateError<Workspace>().pipe(switchMap(() => this.getByIdFromMockData(id)));
  }

  createWorkspace(workspaceData: CreateWorkspaceRequest): Observable<Workspace> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('User must be authenticated to create a workspace'));
    }

    const newWorkspace: Omit<Workspace, 'id'> = {
      name: workspaceData.name,
      description: workspaceData.description,
      ownerId: currentUser.id,
      members: [
        {
          userId: currentUser.id,
          role: 'admin',
          joinedAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.simulateError<Workspace>().pipe(switchMap(() => this.addToMockData(newWorkspace as Workspace)));
  }

  updateWorkspace(id: string, updateData: UpdateWorkspaceRequest): Observable<Workspace> {
    const updates = {
      ...updateData,
      updatedAt: new Date(),
    };

    return this.simulateError<Workspace>().pipe(switchMap(() => this.updateInMockData(id, updates)));
  }

  deleteWorkspace(id: string): Observable<boolean> {
    return this.simulateError<boolean>().pipe(switchMap(() => this.deleteFromMockData(id)));
  }

  inviteMember(workspaceId: string, inviteData: InviteMemberRequest): Observable<WorkspaceMember> {
    return this.simulateError<WorkspaceMember>().pipe(
      switchMap(() => {
        return this.getByIdFromMockData(workspaceId).pipe(
          switchMap((workspace) => {
            // Get all users to find by email
            return this.userService.getUsers().pipe(
              switchMap((users) => {
                const user = users.find(u => u.email === inviteData.email);

                if (!user) {
                  return throwError(() => new Error('User not found'));
                }

                // Check if user is already a member
                const isAlreadyMember = workspace.members.some(m => m.userId === user.id);
                if (isAlreadyMember) {
                  return throwError(() => new Error('User is already a member of this workspace'));
                }

                const newMember: WorkspaceMember = {
                  userId: user.id,
                  role: inviteData.role,
                  joinedAt: new Date(),
                };

                const updatedMembers = [...workspace.members, newMember];
                return this.updateInMockData(workspaceId, {
                  members: updatedMembers,
                  updatedAt: new Date(),
                }).pipe(switchMap(() => this.simulateDelay().pipe(switchMap(() => [newMember]))));
              })
            );
          })
        );
      })
    );
  }

  removeMember(workspaceId: string, userId: string): Observable<boolean> {
    return this.simulateError<boolean>().pipe(
      switchMap(() => {
        return this.getByIdFromMockData(workspaceId).pipe(
          switchMap((workspace) => {
            const updatedMembers = workspace.members.filter((m) => m.userId !== userId);
            return this.updateInMockData(workspaceId, {
              members: updatedMembers,
              updatedAt: new Date(),
            }).pipe(switchMap(() => this.simulateDelay().pipe(switchMap(() => [true]))));
          })
        );
      })
    );
  }

  updateMemberRole(
    workspaceId: string,
    userId: string,
    role: 'admin' | 'member' | 'viewer'
  ): Observable<WorkspaceMember> {
    return this.simulateError<WorkspaceMember>().pipe(
      switchMap(() => {
        return this.getByIdFromMockData(workspaceId).pipe(
          switchMap((workspace) => {
            const updatedMembers = workspace.members.map((member) =>
              member.userId === userId ? { ...member, role } : member
            );
            const updatedMember = updatedMembers.find((m) => m.userId === userId);

            if (!updatedMember) {
              throw new Error(`Member with userId ${userId} not found`);
            }

            return this.updateInMockData(workspaceId, {
              members: updatedMembers,
              updatedAt: new Date(),
            }).pipe(switchMap(() => this.simulateDelay().pipe(switchMap(() => [updatedMember]))));
          })
        );
      })
    );
  }

  searchWorkspaces(query: string): Observable<Workspace[]> {
    return this.simulateError<Workspace[]>().pipe(
      switchMap(() => {
        const searchQuery = query.toLowerCase().trim();
        if (!searchQuery) {
          return of([]);
        }

        return this.getAllFromMockData().pipe(
          map((data) => {
            const workspaces = Array.isArray(data) ? data : (data as any).items || [];
            return workspaces.filter((workspace: Workspace) =>
              workspace.name.toLowerCase().includes(searchQuery) ||
              (workspace.description && workspace.description.toLowerCase().includes(searchQuery))
            );
          }),
          switchMap(results => this.simulateDelay().pipe(map(() => results)))
        );
      })
    );
  }

  private generateDefaultWorkspaces(): Workspace[] {
    // Note: Using a default user ID for initial mock data
    // Real user ID will be used when creating new workspaces
    const defaultUserId = 'user-1';
    const now = new Date();

    return [
      {
        id: 'workspace-1',
        name: 'Marketing Campaign',
        description: 'Q1 2024 marketing initiatives and campaigns',
        ownerId: defaultUserId,
        members: [
          { userId: defaultUserId, role: 'admin', joinedAt: now },
          { userId: 'user-2', role: 'member', joinedAt: now },
          { userId: 'user-3', role: 'member', joinedAt: now },
        ],
        createdAt: new Date('2024-01-15'),
        updatedAt: now,
      },
      {
        id: 'workspace-2',
        name: 'Product Development',
        description: 'New feature development and bug fixes',
        ownerId: defaultUserId,
        members: [
          { userId: defaultUserId, role: 'admin', joinedAt: now },
          { userId: 'user-4', role: 'member', joinedAt: now },
          { userId: 'user-5', role: 'viewer', joinedAt: now },
        ],
        createdAt: new Date('2024-02-01'),
        updatedAt: now,
      },
      {
        id: 'workspace-3',
        name: 'Design System',
        description: 'Building and maintaining the design system',
        ownerId: 'user-2',
        members: [
          { userId: 'user-2', role: 'admin', joinedAt: now },
          { userId: defaultUserId, role: 'member', joinedAt: now },
          { userId: 'user-6', role: 'member', joinedAt: now },
        ],
        createdAt: new Date('2024-01-20'),
        updatedAt: now,
      },
    ];
  }
}
