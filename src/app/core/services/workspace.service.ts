import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, map, tap, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { WorkspaceMockService } from './mock';
import {
  Workspace,
  WorkspaceMember,
  WorkspaceStats,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  InviteMemberRequest,
} from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceService {
  private workspacesSubject = new BehaviorSubject<Workspace[]>([]);
  private currentWorkspaceSubject = new BehaviorSubject<Workspace | null>(null);

  constructor(
    private apiService: ApiService,
    private mockService: WorkspaceMockService
  ) {}

  private get useMockService(): boolean {
    return !environment.production;
  }

  create(workspaceData: CreateWorkspaceRequest): Observable<Workspace> {
    const request$ = this.useMockService
      ? this.mockService.createWorkspace(workspaceData)
      : this.apiService.post<Workspace>('/workspaces', workspaceData);

    return request$.pipe(
      tap((newWorkspace) => {
        const currentWorkspaces = this.workspacesSubject.value;
        this.workspacesSubject.next([...currentWorkspaces, newWorkspace]);
      }),
      catchError((error) => throwError(() => error))
    );
  }

  list(): Observable<Workspace[]> {
    const request$ = this.useMockService
      ? this.mockService.getWorkspaces()
      : this.apiService.get<Workspace[]>('/workspaces');

    return request$.pipe(
      map((result) => (Array.isArray(result) ? result : result.items)),
      tap((workspaces) => this.workspacesSubject.next(workspaces)),
      catchError((error) => throwError(() => error))
    );
  }

  getById(workspaceId: string): Observable<Workspace> {
    const request$ = this.useMockService
      ? this.mockService.getWorkspaceById(workspaceId)
      : this.apiService.get<Workspace>(`/workspaces/${workspaceId}`);

    return request$.pipe(
      tap((workspace) => {
        const currentWorkspaces = this.workspacesSubject.value;
        const index = currentWorkspaces.findIndex((w) => w.id === workspaceId);
        if (index !== -1) {
          const updatedWorkspaces = [...currentWorkspaces];
          updatedWorkspaces[index] = workspace;
          this.workspacesSubject.next(updatedWorkspaces);
        }
      }),
      catchError((error) => throwError(() => error))
    );
  }

  update(workspaceId: string, updateData: UpdateWorkspaceRequest): Observable<Workspace> {
    return this.apiService.put<Workspace>(`/workspaces/${workspaceId}`, updateData).pipe(
      tap((updatedWorkspace) => {
        const currentWorkspaces = this.workspacesSubject.value;
        const index = currentWorkspaces.findIndex((w) => w.id === workspaceId);
        if (index !== -1) {
          const updatedWorkspaces = [...currentWorkspaces];
          updatedWorkspaces[index] = updatedWorkspace;
          this.workspacesSubject.next(updatedWorkspaces);
        }

        const currentWorkspace = this.currentWorkspaceSubject.value;
        if (currentWorkspace && currentWorkspace.id === workspaceId) {
          this.currentWorkspaceSubject.next(updatedWorkspace);
        }
      }),
      catchError((error) => throwError(() => error))
    );
  }

  delete(workspaceId: string): Observable<void> {
    return this.apiService.delete<void>(`/workspaces/${workspaceId}`).pipe(
      tap(() => {
        const currentWorkspaces = this.workspacesSubject.value;
        const filteredWorkspaces = currentWorkspaces.filter((w) => w.id !== workspaceId);
        this.workspacesSubject.next(filteredWorkspaces);

        const currentWorkspace = this.currentWorkspaceSubject.value;
        if (currentWorkspace && currentWorkspace.id === workspaceId) {
          this.currentWorkspaceSubject.next(null);
        }
      }),
      catchError((error) => throwError(() => error))
    );
  }

  inviteMember(workspaceId: string, inviteData: InviteMemberRequest): Observable<WorkspaceMember> {
    const request$ = this.useMockService
      ? this.mockService.inviteMember(workspaceId, inviteData)
      : this.apiService.post<WorkspaceMember>(`/workspaces/${workspaceId}/members`, inviteData);

    return request$.pipe(
      tap((newMember) => {
        const currentWorkspaces = this.workspacesSubject.value;
        const workspaceIndex = currentWorkspaces.findIndex((w) => w.id === workspaceId);
        if (workspaceIndex !== -1) {
          const updatedWorkspaces = [...currentWorkspaces];
          updatedWorkspaces[workspaceIndex] = {
            ...updatedWorkspaces[workspaceIndex],
            members: [...updatedWorkspaces[workspaceIndex].members, newMember],
          };
          this.workspacesSubject.next(updatedWorkspaces);
        }

        const currentWorkspace = this.currentWorkspaceSubject.value;
        if (currentWorkspace && currentWorkspace.id === workspaceId) {
          this.currentWorkspaceSubject.next({
            ...currentWorkspace,
            members: [...currentWorkspace.members, newMember],
          });
        }
      }),
      catchError((error) => throwError(() => error))
    );
  }

  getMembers(workspaceId: string): Observable<WorkspaceMember[]> {
    return this.apiService
      .get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`)
      .pipe(catchError((error) => throwError(() => error)));
  }

  removeMember(workspaceId: string, userId: string): Observable<void> {
    const request$ = this.useMockService
      ? this.mockService.removeMember(workspaceId, userId).pipe(map(() => undefined))
      : this.apiService.delete<void>(`/workspaces/${workspaceId}/members/${userId}`);

    return request$.pipe(
      tap(() => {
        const currentWorkspaces = this.workspacesSubject.value;
        const workspaceIndex = currentWorkspaces.findIndex((w) => w.id === workspaceId);
        if (workspaceIndex !== -1) {
          const updatedWorkspaces = [...currentWorkspaces];
          updatedWorkspaces[workspaceIndex] = {
            ...updatedWorkspaces[workspaceIndex],
            members: updatedWorkspaces[workspaceIndex].members.filter((m) => m.userId !== userId),
          };
          this.workspacesSubject.next(updatedWorkspaces);
        }

        const currentWorkspace = this.currentWorkspaceSubject.value;
        if (currentWorkspace && currentWorkspace.id === workspaceId) {
          this.currentWorkspaceSubject.next({
            ...currentWorkspace,
            members: currentWorkspace.members.filter((m) => m.userId !== userId),
          });
        }
      }),
      catchError((error) => throwError(() => error))
    );
  }

  updateMemberRole(
    workspaceId: string,
    userId: string,
    role: 'admin' | 'member' | 'viewer'
  ): Observable<WorkspaceMember> {
    const request$ = this.useMockService
      ? this.mockService.updateMemberRole(workspaceId, userId, role)
      : this.apiService.patch<WorkspaceMember>(`/workspaces/${workspaceId}/members/${userId}`, { role });

    return request$.pipe(
      tap((updatedMember) => {
        const currentWorkspaces = this.workspacesSubject.value;
        const workspaceIndex = currentWorkspaces.findIndex((w) => w.id === workspaceId);
        if (workspaceIndex !== -1) {
          const updatedWorkspaces = [...currentWorkspaces];
          const memberIndex = updatedWorkspaces[workspaceIndex].members.findIndex((m) => m.userId === userId);
          if (memberIndex !== -1) {
            updatedWorkspaces[workspaceIndex].members[memberIndex] = updatedMember;
            this.workspacesSubject.next(updatedWorkspaces);
          }
        }

        const currentWorkspace = this.currentWorkspaceSubject.value;
        if (currentWorkspace && currentWorkspace.id === workspaceId) {
          const memberIndex = currentWorkspace.members.findIndex((m) => m.userId === userId);
          if (memberIndex !== -1) {
            const updatedMembers = [...currentWorkspace.members];
            updatedMembers[memberIndex] = updatedMember;
            this.currentWorkspaceSubject.next({
              ...currentWorkspace,
              members: updatedMembers,
            });
          }
        }
      }),
      catchError((error) => throwError(() => error))
    );
  }

  getStats(workspaceId: string): Observable<WorkspaceStats> {
    return this.apiService
      .get<WorkspaceStats>(`/workspaces/${workspaceId}/stats`)
      .pipe(catchError((error) => throwError(() => error)));
  }

  setCurrentWorkspace(workspace: Workspace | null): void {
    this.currentWorkspaceSubject.next(workspace);
  }

  getCurrentWorkspace(): Workspace | null {
    return this.currentWorkspaceSubject.value;
  }

  refreshWorkspaces(): Observable<Workspace[]> {
    return this.list();
  }

  getCachedWorkspaces(): Workspace[] {
    return this.workspacesSubject.value;
  }

  clearCache(): void {
    this.workspacesSubject.next([]);
    this.currentWorkspaceSubject.next(null);
  }
}
