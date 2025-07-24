import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { TeamMockService } from './mock';
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

  create(name: string, description?: string): Observable<TeamModel> {
    const request$ = this.useMockService
      ? this.mockService.create(name, description)
      : this.apiService.post<TeamModel>('/teams', { name, description });

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

  getAllTeams(): Observable<TeamModel[]> {
    const request$ = this.useMockService
      ? this.mockService.getAllTeams()
      : this.apiService.get<TeamModel[]>(`/teams`);

    return request$.pipe(
      catchError((error) => throwError(() => error))
    );
  }

  getTeamById(teamId: string): Observable<TeamModel> {
    const request$ = this.useMockService
      ? this.mockService.getTeamById(teamId)
      : this.apiService.get<TeamModel>(`/teams/${teamId}`);

    return request$.pipe(
      catchError((error) => throwError(() => error))
    );
  }
}
