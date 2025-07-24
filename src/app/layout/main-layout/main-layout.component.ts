import { Component, signal, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { MobileSidebarComponent } from '../components/mobile-sidebar/mobile-sidebar.component';
import { DesktopSidebarComponent } from '../components/desktop-sidebar/desktop-sidebar.component';
import { TopNavigationComponent } from '../components/top-navigation/top-navigation.component';
import { NotificationComponent } from '../../shared/components/notification/notification.component';
import { NavigationItem, Team, TeamModel } from '../../core/models';
import { TeamService, AuthService } from '../../core/services';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  imports: [CommonModule, RouterOutlet, MobileSidebarComponent, DesktopSidebarComponent, TopNavigationComponent, NotificationComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private teamService = inject(TeamService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  isMobileSidenavOpen = signal(false);
  isUserMenuOpen = signal(false);
  userTeams = signal<TeamModel[]>([]);

  ngOnInit() {
    this.loadUserTeams();
    
    // Subscribe to team updates
    this.teamService.teamUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadUserTeams();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserTeams() {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.teamService.getMyTeams(currentUser.id).subscribe({
        next: (teams) => {
          // Get only the 3 most recent teams
          const recentTeams = teams
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 3);
          this.userTeams.set(recentTeams);
        },
        error: () => {
          // Silently fail, teams won't be shown
          this.userTeams.set([]);
        }
      });
    }
  }

  isTeamLeader = (team: TeamModel): boolean => {
    const currentUser = this.authService.getCurrentUser();
    return currentUser ? team.leaderId === currentUser.id : false;
  }

  navigateToTeamTasks(teamId: string) {
    this.router.navigate(['/tasks'], { queryParams: { teamId } });
  }

  toggleMobileSidenav() {
    this.isMobileSidenavOpen.update((value) => !value);
  }

  closeMobileSidenav() {
    this.isMobileSidenavOpen.set(false);
  }

  toggleUserMenu() {
    this.isUserMenuOpen.update((value) => !value);
  }

  navigationItems: NavigationItem[] = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      current: true,
      svgPath:
        'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z',
    },
    {
      path: '/workspaces',
      label: 'Workspaces',
      current: false,
      svgPath:
        'M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z',
    },
    {
      path: '/tasks',
      label: 'All Tasks',
      current: false,
      svgPath: 'M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    },
    {
      path: '/board',
      label: 'Kanban Board',
      current: false,
      svgPath:
        'M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.875c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H3.375Z',
    },
    {
      path: '/calendar',
      label: 'Calendar',
      current: false,
      svgPath:
        'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m0-9.75v2.25A2.25 2.25 0 0 1 18.75 15H5.25A2.25 2.25 0 0 1 3 12.75V11.25m18 0V9M3 9v2.25',
    },
    {
      path: '/teams',
      label: 'Your Teams',
      current: false,
      svgPath:
        'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z',
    },
    {
      path: '/analytics',
      label: 'Analytics',
      current: false,
      svgPath:
        'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z',
    },
  ];

  get teams(): Team[] {
    return this.userTeams().map(team => ({
      name: team.name,
      initial: team.name.charAt(0).toUpperCase()
    }));
  }
}
