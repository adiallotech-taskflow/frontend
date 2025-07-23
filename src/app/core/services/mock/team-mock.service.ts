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
        workspaceId: 'workspace-1',
        leaderId: currentUserId,
        memberIds: [currentUserId, 'user-2', 'user-3'],
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        teamId: 'team-2',
        name: 'Backend Team',
        workspaceId: 'workspace-1',
        leaderId: 'user-2',
        memberIds: ['user-2', currentUserId, 'user-4'],
        createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        teamId: 'team-3',
        name: 'Design Team',
        workspaceId: 'workspace-2',
        leaderId: 'user-3',
        memberIds: ['user-3', 'user-4', currentUserId],
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];
  }

  create(name: string, workspaceId: string): Observable<TeamModel> {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      return throwError(() => new Error('User must be authenticated to create a team'));
    }

    const newTeam: Omit<TeamModel, 'teamId'> = {
      name,
      workspaceId,
      leaderId: currentUser.id,
      memberIds: [currentUser.id],
      createdAt: new Date().toISOString(),
    };

    return this.simulateError<TeamModel>().pipe(
      switchMap(() => this.addToMockData(newTeam as TeamModel))
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
        return this.getByIdFromMockData(teamId).pipe(
          switchMap((team) => {
            if (team.memberIds.includes(userId)) {
              return throwError(() => new Error('User is already a member of this team'));
            }

            const updatedMemberIds = [...team.memberIds, userId];
            return this.updateInMockData(teamId, {
              memberIds: updatedMemberIds,
            });
          })
        );
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

  getByWorkspace(workspaceId: string): Observable<TeamModel[]> {
    return this.simulateError<TeamModel[]>().pipe(
      switchMap(() => this.getAllFromMockData()),
      map((result) => {
        const teams = Array.isArray(result) ? result : result.items;
        return teams.filter((team: TeamModel) => team.workspaceId === workspaceId);
      })
    );
  }

  removeMember(teamId: string, userId: string): Observable<TeamModel> {
    return this.simulateError<TeamModel>().pipe(
      switchMap(() => {
        return this.getByIdFromMockData(teamId).pipe(
          switchMap((team) => {
            if (team.leaderId === userId) {
              return throwError(() => new Error('Cannot remove team leader'));
            }

            const updatedMemberIds = team.memberIds.filter((id) => id !== userId);
            return this.updateInMockData(teamId, {
              memberIds: updatedMemberIds,
            });
          })
        );
      })
    );
  }

  getTeamById(teamId: string): Observable<TeamModel> {
    return this.simulateError<TeamModel>().pipe(
      switchMap(() => this.getByIdFromMockData(teamId))
    );
  }

  updateTeam(teamId: string, updates: Partial<TeamModel>): Observable<TeamModel> {
    return this.simulateError<TeamModel>().pipe(
      switchMap(() => this.updateInMockData(teamId, updates))
    );
  }

  deleteTeam(teamId: string): Observable<boolean> {
    return this.simulateError<boolean>().pipe(
      switchMap(() => this.deleteFromMockData(teamId))
    );
  }
}