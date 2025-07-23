import { Component, OnInit, signal, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TeamService, AuthService } from '../../../../core/services';
import { TeamModel } from '../../../../core/models';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TeamSlideOverComponent } from '../team-slide-over';

@Component({
  selector: 'app-team-page',
  standalone: true,
  imports: [CommonModule, TeamSlideOverComponent],
  templateUrl: './team-page.component.html',
  styleUrls: ['./team-page.component.css'],
})
export class TeamPageComponent implements OnInit {
  private teamService = inject(TeamService);
  private authService = inject(AuthService);
  private router = inject(Router);

  teams$ = signal<TeamModel[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  teamTaskCounts = signal<Record<string, number>>({});

  @ViewChild(TeamSlideOverComponent) slideOver!: TeamSlideOverComponent;

  ngOnInit() {
    this.loadTeams();
  }

  loadTeams() {
    this.loading.set(true);
    this.error.set(null);

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.error.set('User not authenticated');
      this.loading.set(false);
      return;
    }

    this.teamService.getMyTeams(currentUser.id).subscribe({
      next: (teams) => {
        this.teams$.set(teams);
        this.loadTaskCounts(teams);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load teams. Please try again.');
        this.loading.set(false);
      },
    });
  }

  private loadTaskCounts(teams: TeamModel[]) {
    const taskCountRequests = teams.map(team =>
      this.teamService.getTeamTasks(team.teamId).pipe(
        map(tasks => ({ teamId: team.teamId, count: tasks.length })),
        catchError(() => of({ teamId: team.teamId, count: 0 }))
      )
    );

    if (taskCountRequests.length === 0) return;

    forkJoin(taskCountRequests).subscribe(counts => {
      const countMap = counts.reduce((acc, { teamId, count }) => {
        acc[teamId] = count;
        return acc;
      }, {} as Record<string, number>);
      this.teamTaskCounts.set(countMap);
    });
  }

  isLeader(team: TeamModel): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser ? team.leaderId === currentUser.id : false;
  }

  getTaskCount(teamId: string): number {
    return this.teamTaskCounts()[teamId] || 0;
  }

  openCreateDialog() {
    this.slideOver.open();
  }

  onTeamCreated() {
    this.loadTeams();
  }

  navigateToTeamTasks(teamId: string) {
    this.router.navigate(['/tasks'], { queryParams: { teamId } });
  }

  deleteTeam(teamId: string) {
    // TODO: Implement team deletion
    alert('Team deletion coming soon!');
  }
}