import { Injectable, inject } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
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

  protected override defaultData: TeamModel[] = [];

  constructor() {
    super();
    // Initialize default data on first access
    this.initializeDefaultData();
  }

  public override resetMockData(): void {
    // Generate fresh teams with current users
    const newTeams = this.generateDefaultTeams();
    this.saveToStorage(newTeams);
  }

  private initializeDefaultData(): void {
    const stored = this.getStoredData();
    if (!stored || stored.length === 0) {
      const defaultTeams = this.generateDefaultTeams();
      this.saveToStorage(defaultTeams);
    }
  }

  private generateDefaultTeams(): TeamModel[] {
    // Get all available users
    const users = this.authService.getStoredData() || [];
    if (users.length === 0) {
      return [];
    }

    // Get the current logged-in user
    const currentUser = this.authService.getCurrentUser();
    const currentUserId = currentUser ? currentUser.id : users[0].id;
    const now = new Date();

    // Create teams with realistic user assignments
    const teams: TeamModel[] = [
      {
        teamId: 'team-1',
        name: 'Frontend Team',
        description: 'Responsible for building and maintaining user interfaces',
        leaderId: currentUserId,
        memberIds: [currentUserId, ...users.filter(u => u.id !== currentUserId).slice(0, 3).map(u => u.id)],
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];

    if (users.length > 2) {
      teams.push({
        teamId: 'team-2',
        name: 'Backend Team',
        description: 'Manages server-side development and API architecture',
        leaderId: users[1].id,
        memberIds: [users[1].id, currentUserId, ...users.filter(u => u.id !== currentUserId && u.id !== users[1].id).slice(0, 2).map(u => u.id)],
        createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    if (users.length > 3) {
      teams.push({
        teamId: 'team-3',
        name: 'Design Team',
        description: 'Creates user experience and visual design',
        leaderId: users[2].id,
        memberIds: [users[2].id, users[3].id, currentUserId],
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    return teams;
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
      switchMap(() => {
        // Ensure we have some default data if none exists
        let currentData = this.getStoredData();
        if (!currentData || currentData.length === 0) {
          this.resetMockData();
          currentData = this.getStoredData();
        }
        
        // If still no teams, return empty array
        if (!currentData || currentData.length === 0) {
          return of([]);
        }
        
        return of(currentData);
      }),
      map((teams) => {
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
