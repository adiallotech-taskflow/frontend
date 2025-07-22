import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MockBaseService } from './mock-base.service';
import {
  Workspace,
  WorkspaceMember,
  WorkspaceStats,
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
    const currentUser = 'current-user-id';

    const newWorkspace: Omit<Workspace, 'id'> = {
      name: workspaceData.name,
      description: workspaceData.description,
      ownerId: currentUser,
      members: [
        {
          userId: currentUser,
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
    const newMember: WorkspaceMember = {
      userId: this.generateId(),
      role: inviteData.role,
      joinedAt: new Date(),
    };

    return this.simulateError<WorkspaceMember>().pipe(
      switchMap(() => {
        return this.getByIdFromMockData(workspaceId).pipe(
          switchMap((workspace) => {
            const updatedMembers = [...workspace.members, newMember];
            return this.updateInMockData(workspaceId, {
              members: updatedMembers,
              updatedAt: new Date(),
            }).pipe(switchMap(() => this.simulateDelay().pipe(switchMap(() => [newMember]))));
          })
        );
      })
    );
  }

  getWorkspaceMembers(workspaceId: string): Observable<WorkspaceMember[]> {
    return this.simulateError<WorkspaceMember[]>().pipe(
      switchMap(() => {
        return this.getByIdFromMockData(workspaceId).pipe(
          switchMap((workspace) => this.simulateDelay().pipe(switchMap(() => [workspace.members])))
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

  getWorkspaceStats(workspaceId: string): Observable<WorkspaceStats> {
    return this.simulateError<WorkspaceStats>().pipe(
      switchMap(() => {
        return this.getByIdFromMockData(workspaceId).pipe(
          switchMap((workspace) => {
            const stats: WorkspaceStats = {
              totalTasks: Math.floor(Math.random() * 20) + 5,
              completedTasks: Math.floor(Math.random() * 10) + 2,
              inProgressTasks: Math.floor(Math.random() * 8) + 1,
              totalMembers: workspace.members.length,
            };

            return this.simulateDelay().pipe(switchMap(() => [stats]));
          })
        );
      })
    );
  }

  searchWorkspaces(
    searchTerm: string,
    page?: number,
    limit?: number
  ): Observable<Workspace[] | PaginationResult<Workspace>> {
    return this.simulateError<Workspace[] | PaginationResult<Workspace>>().pipe(
      switchMap(() => this.searchInMockData(searchTerm, ['name', 'description'], page, limit))
    );
  }

  private generateDefaultWorkspaces(): Workspace[] {
    const currentUser = 'current-user-id';
    const now = new Date();

    return [
      {
        id: 'workspace-1',
        name: 'Marketing Campaign',
        description: 'Q1 2024 marketing initiatives and campaigns',
        ownerId: currentUser,
        members: [
          { userId: currentUser, role: 'admin', joinedAt: now },
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
        ownerId: currentUser,
        members: [
          { userId: currentUser, role: 'admin', joinedAt: now },
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
          { userId: currentUser, role: 'member', joinedAt: now },
          { userId: 'user-6', role: 'member', joinedAt: now },
        ],
        createdAt: new Date('2024-01-20'),
        updatedAt: now,
      },
    ];
  }
}
