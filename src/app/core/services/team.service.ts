import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { TeamMockService } from './mock/team-mock.service';
import { TeamModel, Task } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  constructor(
    private apiService: ApiService,
    private mockService: TeamMockService
  ) {}

  private get useMockService(): boolean {
    return !environment.production;
  }

  create(name: string, workspaceId: string): Observable<TeamModel> {
    const request$ = this.useMockService
      ? this.mockService.create(name, workspaceId)
      : this.apiService.post<TeamModel>('/teams', { name, workspaceId });

    return request$.pipe(
      catchError((error) => throwError(() => error))
    );
  }

  getMyTeams(userId: string): Observable<TeamModel[]> {
    const request$ = this.useMockService
      ? this.mockService.getMyTeams(userId)
      : this.apiService.get<TeamModel[]>(`/teams/my-teams`);

    return request$.pipe(
      catchError((error) => throwError(() => error))
    );
  }

  addMember(teamId: string, userId: string): Observable<TeamModel> {
    const request$ = this.useMockService
      ? this.mockService.addMember(teamId, userId)
      : this.apiService.post<TeamModel>(`/teams/${teamId}/members`, { userId });

    return request$.pipe(
      catchError((error) => throwError(() => error))
    );
  }

  removeMember(teamId: string, userId: string): Observable<TeamModel> {
    const request$ = this.useMockService
      ? this.mockService.removeMember(teamId, userId)
      : this.apiService.delete<TeamModel>(`/teams/${teamId}/members/${userId}`);

    return request$.pipe(
      catchError((error) => throwError(() => error))
    );
  }

  getTeamTasks(teamId: string): Observable<Task[]> {
    const request$ = this.useMockService
      ? this.mockService.getTeamTasks(teamId)
      : this.apiService.get<Task[]>(`/teams/${teamId}/tasks`);

    return request$.pipe(
      catchError((error) => throwError(() => error))
    );
  }

  getByWorkspace(workspaceId: string): Observable<TeamModel[]> {
    const request$ = this.useMockService
      ? this.mockService.getByWorkspace(workspaceId)
      : this.apiService.get<TeamModel[]>(`/workspaces/${workspaceId}/teams`);

    return request$.pipe(
      catchError((error) => throwError(() => error))
    );
  }
}