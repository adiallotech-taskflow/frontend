import { Component, OnInit, signal, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TeamService, AuthService, UserService } from '../../../../core/services';
import { TeamModel, User } from '../../../../core/models';
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
  private userService = inject(UserService);
  private router = inject(Router);

  teams$ = signal<TeamModel[]>([]);
  users$ = signal<User[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

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

    // Load users first
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users$.set(users);

        // Then load teams
        this.teamService.getMyTeams(currentUser.id).subscribe({
          next: (teams) => {
            this.teams$.set(teams);
            this.loading.set(false);
          },
          error: () => {
            this.error.set('Failed to load teams. Please try again.');
            this.loading.set(false);
          },
        });
      },
      error: () => {
        this.error.set('Failed to load users. Please try again.');
        this.loading.set(false);
      },
    });
  }

  getTeamMembers(memberIds: string[]): User[] {
    const users = this.users$();
    return memberIds
      .map(id => users.find(user => user.id === id))
      .filter((user): user is User => user !== undefined);
  }

  getTeamLeader(leaderId: string): User | undefined {
    return this.users$().find(user => user.id === leaderId);
  }

  isLeader(team: TeamModel): boolean {
    const currentUser = this.authService.getCurrentUser();
    return currentUser ? team.leaderId === currentUser.id : false;
  }

  getUserInitials(user: User): string {
    if (!user.firstName && !user.lastName) {
      return user.email.charAt(0).toUpperCase();
    }
    const firstInitial = user.firstName?.charAt(0) || '';
    const lastInitial = user.lastName?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase();
  }

  getUserDisplayName(user: User): string {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email;
  }

  openCreateDialog() {
    this.slideOver.open();
  }

  onTeamCreated() {
    this.loadTeams();
  }

  navigateToTeamDetails(teamId: string) {
    if (!teamId) {
      console.error('Team ID is undefined');
      return;
    }
    this.router.navigate(['/teams', teamId]);
  }

  deleteTeam(teamId: string) {
    // TODO: Implement team deletion
    alert('Team deletion coming soon!');
  }
}
