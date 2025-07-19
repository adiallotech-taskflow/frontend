import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { MockBaseService, PaginationResult } from './mock-base.service';
import { Workspace, WorkspaceMember, WorkspaceStats } from '../../models';

interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
}

interface InviteMemberRequest {
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

@Injectable({
  providedIn: 'root'
})
export class WorkspaceMockService extends MockBaseService<Workspace> {
  protected override storageKey = 'taskflow_mock_workspaces';
  
  protected override defaultData: Workspace[] = this.generateDefaultWorkspaces();

  /**
   * Récupère tous les workspaces avec pagination optionnelle
   */
  getWorkspaces(page?: number, limit?: number): Observable<Workspace[] | PaginationResult<Workspace>> {
    return this.simulateError<Workspace[] | PaginationResult<Workspace>>().pipe(
      switchMap(() => this.getAllFromMockData(page, limit))
    );
  }

  /**
   * Récupère un workspace par ID
   */
  getWorkspaceById(id: string): Observable<Workspace> {
    return this.simulateError<Workspace>().pipe(
      switchMap(() => this.getByIdFromMockData(id))
    );
  }

  /**
   * Crée un nouveau workspace
   */
  createWorkspace(workspaceData: CreateWorkspaceRequest): Observable<Workspace> {
    const currentUser = 'current-user-id'; // TODO: Get from auth service
    
    const newWorkspace: Omit<Workspace, 'id'> = {
      name: workspaceData.name,
      description: workspaceData.description,
      ownerId: currentUser,
      members: [
        {
          userId: currentUser,
          role: 'admin',
          joinedAt: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return this.simulateError<Workspace>().pipe(
      switchMap(() => this.addToMockData(newWorkspace as Workspace))
    );
  }

  /**
   * Met à jour un workspace
   */
  updateWorkspace(id: string, updateData: UpdateWorkspaceRequest): Observable<Workspace> {
    const updates = {
      ...updateData,
      updatedAt: new Date()
    };

    return this.simulateError<Workspace>().pipe(
      switchMap(() => this.updateInMockData(id, updates))
    );
  }

  /**
   * Supprime un workspace
   */
  deleteWorkspace(id: string): Observable<boolean> {
    return this.simulateError<boolean>().pipe(
      switchMap(() => this.deleteFromMockData(id))
    );
  }

  /**
   * Invite un membre dans un workspace
   */
  inviteMember(workspaceId: string, inviteData: InviteMemberRequest): Observable<WorkspaceMember> {
    const newMember: WorkspaceMember = {
      userId: this.generateId(), // Mock user ID
      role: inviteData.role,
      joinedAt: new Date()
    };

    return this.simulateError<WorkspaceMember>().pipe(
      switchMap(() => {
        return this.getByIdFromMockData(workspaceId).pipe(
          switchMap((workspace) => {
            const updatedMembers = [...workspace.members, newMember];
            return this.updateInMockData(workspaceId, { 
              members: updatedMembers,
              updatedAt: new Date()
            }).pipe(
              switchMap(() => this.simulateDelay().pipe(
                switchMap(() => [newMember])
              ))
            );
          })
        );
      })
    );
  }

  /**
   * Récupère les membres d'un workspace
   */
  getWorkspaceMembers(workspaceId: string): Observable<WorkspaceMember[]> {
    return this.simulateError<WorkspaceMember[]>().pipe(
      switchMap(() => {
        return this.getByIdFromMockData(workspaceId).pipe(
          switchMap((workspace) => this.simulateDelay().pipe(
            switchMap(() => [workspace.members])
          ))
        );
      })
    );
  }

  /**
   * Supprime un membre d'un workspace
   */
  removeMember(workspaceId: string, userId: string): Observable<boolean> {
    return this.simulateError<boolean>().pipe(
      switchMap(() => {
        return this.getByIdFromMockData(workspaceId).pipe(
          switchMap((workspace) => {
            const updatedMembers = workspace.members.filter(m => m.userId !== userId);
            return this.updateInMockData(workspaceId, { 
              members: updatedMembers,
              updatedAt: new Date()
            }).pipe(
              switchMap(() => this.simulateDelay().pipe(
                switchMap(() => [true])
              ))
            );
          })
        );
      })
    );
  }

  /**
   * Met à jour le rôle d'un membre
   */
  updateMemberRole(workspaceId: string, userId: string, role: 'admin' | 'member' | 'viewer'): Observable<WorkspaceMember> {
    return this.simulateError<WorkspaceMember>().pipe(
      switchMap(() => {
        return this.getByIdFromMockData(workspaceId).pipe(
          switchMap((workspace) => {
            const updatedMembers = workspace.members.map(member => 
              member.userId === userId ? { ...member, role } : member
            );
            const updatedMember = updatedMembers.find(m => m.userId === userId);
            
            if (!updatedMember) {
              throw new Error(`Member with userId ${userId} not found`);
            }

            return this.updateInMockData(workspaceId, { 
              members: updatedMembers,
              updatedAt: new Date()
            }).pipe(
              switchMap(() => this.simulateDelay().pipe(
                switchMap(() => [updatedMember])
              ))
            );
          })
        );
      })
    );
  }

  /**
   * Récupère les statistiques d'un workspace
   */
  getWorkspaceStats(workspaceId: string): Observable<WorkspaceStats> {
    return this.simulateError<WorkspaceStats>().pipe(
      switchMap(() => {
        return this.getByIdFromMockData(workspaceId).pipe(
          switchMap((workspace) => {
            // Mock statistics
            const stats: WorkspaceStats = {
              totalTasks: Math.floor(Math.random() * 20) + 5,
              completedTasks: Math.floor(Math.random() * 10) + 2,
              inProgressTasks: Math.floor(Math.random() * 8) + 1,
              totalMembers: workspace.members.length
            };
            
            return this.simulateDelay().pipe(
              switchMap(() => [stats])
            );
          })
        );
      })
    );
  }

  /**
   * Recherche dans les workspaces
   */
  searchWorkspaces(
    searchTerm: string, 
    page?: number, 
    limit?: number
  ): Observable<Workspace[] | PaginationResult<Workspace>> {
    return this.simulateError<Workspace[] | PaginationResult<Workspace>>().pipe(
      switchMap(() => this.searchInMockData(searchTerm, ['name', 'description'], page, limit))
    );
  }

  /**
   * Génère des workspaces par défaut pour les tests
   */
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
          { userId: 'user-3', role: 'member', joinedAt: now }
        ],
        createdAt: new Date('2024-01-15'),
        updatedAt: now
      },
      {
        id: 'workspace-2',
        name: 'Product Development',
        description: 'New feature development and bug fixes',
        ownerId: currentUser,
        members: [
          { userId: currentUser, role: 'admin', joinedAt: now },
          { userId: 'user-4', role: 'member', joinedAt: now },
          { userId: 'user-5', role: 'viewer', joinedAt: now }
        ],
        createdAt: new Date('2024-02-01'),
        updatedAt: now
      },
      {
        id: 'workspace-3',
        name: 'Design System',
        description: 'Building and maintaining the design system',
        ownerId: 'user-2',
        members: [
          { userId: 'user-2', role: 'admin', joinedAt: now },
          { userId: currentUser, role: 'member', joinedAt: now },
          { userId: 'user-6', role: 'member', joinedAt: now }
        ],
        createdAt: new Date('2024-01-20'),
        updatedAt: now
      }
    ];
  }
}