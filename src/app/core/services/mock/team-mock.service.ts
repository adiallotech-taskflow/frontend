import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { MockBaseService } from './mock-base.service';
import { TeamModel, Task } from '../../models';
import { AuthMockService } from './auth-mock.service';
import { TaskMockService } from './task-mock.service';

@Injectable({
  providedIn: 'root',
})
export class TeamMockService extends MockBaseService<TeamModel> {
  protected override storageKey = 'taskflow_mock_teams';
  private authService = inject(AuthMockService);
  private taskService = inject(TaskMockService);

  protected override defaultData: TeamModel[] = this.generateDefaultTeams();

  private generateDefaultTeams(): TeamModel[] {
    const currentUserId = 'current-user-id';
    const now = new Date();

    return [
      {
        teamId: 'team-1',
        name: 'Frontend Team',
        description: 'Responsible for building and maintaining user interfaces',
        leaderId: currentUserId,
        memberIds: [currentUserId, 'user-2', 'user-3'],
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        teamId: 'team-2',
        name: 'Backend Team',
        description: 'Manages server-side development and API architecture',
        leaderId: 'user-2',
        memberIds: ['user-2', currentUserId, 'user-4'],
        createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        teamId: 'team-3',
        name: 'Design Team',
        description: 'Creates user experience and visual design',
        leaderId: 'user-3',
        memberIds: ['user-3', 'user-4', currentUserId],
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  create(name: string, description?: string): Observable<TeamModel> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('User must be authenticated to create a team'));
    }

    const newTeam: Omit<TeamModel, 'teamId'> = {
      name,
      description,
      leaderId: currentUser.id,
      memberIds: [currentUser.id],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.simulateError<TeamModel>().pipe(
      switchMap(() => {
        const teamWithId: TeamModel = {
          ...newTeam,
          teamId: this.generateId(),
        } as TeamModel;
        const teams = this.getStoredData() || [];
        teams.push(teamWithId);
        this.saveToStorage(teams);
        return this.simulateDelay().pipe(map(() => teamWithId));
      })
    );
  }

  getMyTeams(userId: string): Observable<TeamModel[]> {
    return this.simulateError<TeamModel[]>().pipe(
      switchMap(() => this.getAllFromMockData()),
      map((result) => {
        const teams = Array.isArray(result) ? result : result.items;
        return teams.filter((team: TeamModel) => team.memberIds.includes(userId));
      })
    );
  }

  addMember(teamId: string, userId: string): Observable<TeamModel> {
    return this.simulateError<TeamModel>().pipe(
      switchMap(() => {
        const teams = this.getStoredData() || this.defaultData;
        const team = teams.find(t => t.teamId === teamId);
        
        if (!team) {
          return throwError(() => new Error(`Team with id ${teamId} not found`));
        }
        
        if (team.memberIds.includes(userId)) {
          return throwError(() => new Error('User is already a member of this team'));
        }

        const updatedTeam = {
          ...team,
          memberIds: [...team.memberIds, userId],
          updatedAt: new Date().toISOString()
        };
        
        const index = teams.findIndex(t => t.teamId === teamId);
        teams[index] = updatedTeam;
        this.saveToStorage(teams);
        
        return this.simulateDelay().pipe(map(() => updatedTeam));
      })
    );
  }

  getTeamTasks(teamId: string): Observable<Task[]> {
    return this.simulateError<Task[]>().pipe(
      switchMap(() => this.taskService.getTasks()),
      map((result) => {
        const tasks = Array.isArray(result) ? result : result.items;
        return tasks.filter((task: Task) => task.teamId === teamId);
      })
    );
  }

  getAllTeams(): Observable<TeamModel[]> {
    return this.simulateError<TeamModel[]>().pipe(
      switchMap(() => this.getAllFromMockData()),
      map((result) => {
        return Array.isArray(result) ? result : result.items;
      })
    );
  }

  removeMember(teamId: string, userId: string): Observable<TeamModel> {
    return this.simulateError<TeamModel>().pipe(
      switchMap(() => {
        const teams = this.getStoredData() || this.defaultData;
        const team = teams.find(t => t.teamId === teamId);
        
        if (!team) {
          return throwError(() => new Error(`Team with id ${teamId} not found`));
        }
        
        if (team.leaderId === userId) {
          return throwError(() => new Error('Cannot remove team leader'));
        }

        const updatedTeam = {
          ...team,
          memberIds: team.memberIds.filter((id) => id !== userId),
          updatedAt: new Date().toISOString()
        };
        
        const index = teams.findIndex(t => t.teamId === teamId);
        teams[index] = updatedTeam;
        this.saveToStorage(teams);
        
        return this.simulateDelay().pipe(map(() => updatedTeam));
      })
    );
  }

  getTeamById(teamId: string): Observable<TeamModel> {
    return this.simulateError<TeamModel>().pipe(
      switchMap(() => {
        const teams = this.getStoredData() || this.defaultData;
        const team = teams.find(t => t.teamId === teamId);
        if (!team) {
          throw new Error(`Team with id ${teamId} not found`);
        }
        return this.simulateDelay().pipe(map(() => team));
      })
    );
  }

  updateTeam(teamId: string, updates: Partial<TeamModel>): Observable<TeamModel> {
    return this.simulateError<TeamModel>().pipe(
      switchMap(() => {
        const teams = this.getStoredData() || this.defaultData;
        const index = teams.findIndex(t => t.teamId === teamId);
        if (index === -1) {
          throw new Error(`Team with id ${teamId} not found`);
        }
        teams[index] = { ...teams[index], ...updates, updatedAt: new Date().toISOString() };
        this.saveToStorage(teams);
        return this.simulateDelay().pipe(map(() => teams[index]));
      })
    );
  }

  deleteTeam(teamId: string): Observable<boolean> {
    return this.simulateError<boolean>().pipe(
      switchMap(() => {
        const teams = this.getStoredData() || this.defaultData;
        const filteredTeams = teams.filter(t => t.teamId !== teamId);
        if (filteredTeams.length === teams.length) {
          throw new Error(`Team with id ${teamId} not found`);
        }
        this.saveToStorage(filteredTeams);
        return this.simulateDelay().pipe(map(() => true));
      })
    );
  }
}
