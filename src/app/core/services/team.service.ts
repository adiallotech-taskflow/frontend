import { Injectable } from '@angular/core';
import { Observable, catchError, throwError, Subject, tap } from 'rxjs';
import { ApiService } from './api.service';
import { TeamMockService } from './mock';
import { TeamModel, Task } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  private teamUpdated = new Subject<void>();
  teamUpdated$ = this.teamUpdated.asObservable();

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
      tap(() => this.teamUpdated.next()),
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
      tap(() => this.teamUpdated.next()),
      catchError((error) => throwError(() => error))
    );
  }

  removeMember(teamId: string, userId: string): Observable<TeamModel> {
    const request$ = this.useMockService
      ? this.mockService.removeMember(teamId, userId)
      : this.apiService.delete<TeamModel>(`/teams/${teamId}/members/${userId}`);

    return request$.pipe(
      tap(() => this.teamUpdated.next()),
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

  deleteTeam(teamId: string): Observable<boolean> {
    const request$ = this.useMockService
      ? this.mockService.deleteTeam(teamId)
      : this.apiService.delete<boolean>(`/teams/${teamId}`);

    return request$.pipe(
      tap(() => this.teamUpdated.next()),
      catchError((error) => throwError(() => error))
    );
  }

  updateTeam(teamId: string, updates: Partial<TeamModel>): Observable<TeamModel> {
    const request$ = this.useMockService
      ? this.mockService.updateTeam(teamId, updates)
      : this.apiService.patch<TeamModel>(`/teams/${teamId}`, updates);

    return request$.pipe(
      tap(() => this.teamUpdated.next()),
      catchError((error) => throwError(() => error))
    );
  }
}
