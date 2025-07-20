import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, map, tap, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { WorkspaceMockService } from './mock/workspace-mock.service';
import { Workspace, WorkspaceMember, WorkspaceStats } from '../models';
import { environment } from '../../../environments/environment';

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
}

export interface InviteMemberRequest {
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

@Injectable({
  providedIn: 'root'
})
export class WorkspaceService {
  private workspacesSubject = new BehaviorSubject<Workspace[]>([]);
  private currentWorkspaceSubject = new BehaviorSubject<Workspace | null>(null);

  public workspaces$ = this.workspacesSubject.asObservable();
  public currentWorkspace$ = this.currentWorkspaceSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private mockService: WorkspaceMockService
  ) {}

  /**
   * Determines whether to use mock service based on environment
   */
  private get useMockService(): boolean {
    return !environment.production;
  }

  /**
   * Create a new workspace
   */
  create(workspaceData: CreateWorkspaceRequest): Observable<Workspace> {
    const request$ = this.useMockService 
      ? this.mockService.createWorkspace(workspaceData)
      : this.apiService.post<Workspace>('/workspaces', workspaceData);

    return request$.pipe(
      tap(newWorkspace => {
        const currentWorkspaces = this.workspacesSubject.value;
        this.workspacesSubject.next([...currentWorkspaces, newWorkspace]);
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get all workspaces for the current user
   */
  list(): Observable<Workspace[]> {
    const request$ = this.useMockService 
      ? this.mockService.getWorkspaces()
      : this.apiService.get<Workspace[]>('/workspaces');

    return request$.pipe(
      map(result => Array.isArray(result) ? result : result.items), // Handle pagination result
      tap(workspaces => this.workspacesSubject.next(workspaces)),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get a specific workspace by ID
   */
  getById(workspaceId: string): Observable<Workspace> {
    const request$ = this.useMockService 
      ? this.mockService.getWorkspaceById(workspaceId)
      : this.apiService.get<Workspace>(`/workspaces/${workspaceId}`);

    return request$.pipe(
      tap(workspace => {
        const currentWorkspaces = this.workspacesSubject.value;
        const index = currentWorkspaces.findIndex(w => w.id === workspaceId);
        if (index !== -1) {
          const updatedWorkspaces = [...currentWorkspaces];
          updatedWorkspaces[index] = workspace;
          this.workspacesSubject.next(updatedWorkspaces);
        }
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Update a workspace
   */
  update(workspaceId: string, updateData: UpdateWorkspaceRequest): Observable<Workspace> {
    return this.apiService.put<Workspace>(`/workspaces/${workspaceId}`, updateData).pipe(
      tap(updatedWorkspace => {
        const currentWorkspaces = this.workspacesSubject.value;
        const index = currentWorkspaces.findIndex(w => w.id === workspaceId);
        if (index !== -1) {
          const updatedWorkspaces = [...currentWorkspaces];
          updatedWorkspaces[index] = updatedWorkspace;
          this.workspacesSubject.next(updatedWorkspaces);
        }

        // Update current workspace if it's the one being updated
        const currentWorkspace = this.currentWorkspaceSubject.value;
        if (currentWorkspace && currentWorkspace.id === workspaceId) {
          this.currentWorkspaceSubject.next(updatedWorkspace);
        }
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Delete a workspace
   */
  delete(workspaceId: string): Observable<void> {
    return this.apiService.delete<void>(`/workspaces/${workspaceId}`).pipe(
      tap(() => {
        const currentWorkspaces = this.workspacesSubject.value;
        const filteredWorkspaces = currentWorkspaces.filter(w => w.id !== workspaceId);
        this.workspacesSubject.next(filteredWorkspaces);

        // Clear current workspace if it's the one being deleted
        const currentWorkspace = this.currentWorkspaceSubject.value;
        if (currentWorkspace && currentWorkspace.id === workspaceId) {
          this.currentWorkspaceSubject.next(null);
        }
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Invite a member to a workspace
   */
  inviteMember(workspaceId: string, inviteData: InviteMemberRequest): Observable<WorkspaceMember> {
    return this.apiService.post<WorkspaceMember>(`/workspaces/${workspaceId}/members`, inviteData).pipe(
      tap(newMember => {
        const currentWorkspaces = this.workspacesSubject.value;
        const workspaceIndex = currentWorkspaces.findIndex(w => w.id === workspaceId);
        if (workspaceIndex !== -1) {
          const updatedWorkspaces = [...currentWorkspaces];
          updatedWorkspaces[workspaceIndex] = {
            ...updatedWorkspaces[workspaceIndex],
            members: [...updatedWorkspaces[workspaceIndex].members, newMember]
          };
          this.workspacesSubject.next(updatedWorkspaces);
        }

        // Update current workspace if it's the one being updated
        const currentWorkspace = this.currentWorkspaceSubject.value;
        if (currentWorkspace && currentWorkspace.id === workspaceId) {
          this.currentWorkspaceSubject.next({
            ...currentWorkspace,
            members: [...currentWorkspace.members, newMember]
          });
        }
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get members of a workspace
   */
  getMembers(workspaceId: string): Observable<WorkspaceMember[]> {
    return this.apiService.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Remove a member from a workspace
   */
  removeMember(workspaceId: string, userId: string): Observable<void> {
    return this.apiService.delete<void>(`/workspaces/${workspaceId}/members/${userId}`).pipe(
      tap(() => {
        const currentWorkspaces = this.workspacesSubject.value;
        const workspaceIndex = currentWorkspaces.findIndex(w => w.id === workspaceId);
        if (workspaceIndex !== -1) {
          const updatedWorkspaces = [...currentWorkspaces];
          updatedWorkspaces[workspaceIndex] = {
            ...updatedWorkspaces[workspaceIndex],
            members: updatedWorkspaces[workspaceIndex].members.filter(m => m.userId !== userId)
          };
          this.workspacesSubject.next(updatedWorkspaces);
        }

        // Update current workspace if it's the one being updated
        const currentWorkspace = this.currentWorkspaceSubject.value;
        if (currentWorkspace && currentWorkspace.id === workspaceId) {
          this.currentWorkspaceSubject.next({
            ...currentWorkspace,
            members: currentWorkspace.members.filter(m => m.userId !== userId)
          });
        }
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Update a member's role in a workspace
   */
  updateMemberRole(workspaceId: string, userId: string, role: 'admin' | 'member' | 'viewer'): Observable<WorkspaceMember> {
    return this.apiService.patch<WorkspaceMember>(`/workspaces/${workspaceId}/members/${userId}`, { role }).pipe(
      tap(updatedMember => {
        const currentWorkspaces = this.workspacesSubject.value;
        const workspaceIndex = currentWorkspaces.findIndex(w => w.id === workspaceId);
        if (workspaceIndex !== -1) {
          const updatedWorkspaces = [...currentWorkspaces];
          const memberIndex = updatedWorkspaces[workspaceIndex].members.findIndex(m => m.userId === userId);
          if (memberIndex !== -1) {
            updatedWorkspaces[workspaceIndex].members[memberIndex] = updatedMember;
            this.workspacesSubject.next(updatedWorkspaces);
          }
        }

        // Update current workspace if it's the one being updated
        const currentWorkspace = this.currentWorkspaceSubject.value;
        if (currentWorkspace && currentWorkspace.id === workspaceId) {
          const memberIndex = currentWorkspace.members.findIndex(m => m.userId === userId);
          if (memberIndex !== -1) {
            const updatedMembers = [...currentWorkspace.members];
            updatedMembers[memberIndex] = updatedMember;
            this.currentWorkspaceSubject.next({
              ...currentWorkspace,
              members: updatedMembers
            });
          }
        }
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get workspace statistics
   */
  getStats(workspaceId: string): Observable<WorkspaceStats> {
    return this.apiService.get<WorkspaceStats>(`/workspaces/${workspaceId}/stats`).pipe(
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Set the current active workspace
   */
  setCurrentWorkspace(workspace: Workspace | null): void {
    this.currentWorkspaceSubject.next(workspace);
  }

  /**
   * Get the current active workspace
   */
  getCurrentWorkspace(): Workspace | null {
    return this.currentWorkspaceSubject.value;
  }

  /**
   * Refresh workspaces from the server
   */
  refreshWorkspaces(): Observable<Workspace[]> {
    return this.list();
  }

  /**
   * Get cached workspaces without making an API call
   */
  getCachedWorkspaces(): Workspace[] {
    return this.workspacesSubject.value;
  }

  /**
   * Clear the workspace cache
   */
  clearCache(): void {
    this.workspacesSubject.next([]);
    this.currentWorkspaceSubject.next(null);
  }
}