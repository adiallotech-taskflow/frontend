import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout.component').then((c) => c.MainLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then((r) => r.dashboardRoutes),
      },
      {
        path: 'workspaces',
        loadChildren: () => import('./features/workspace/workspace.routes').then((r) => r.workspaceRoutes),
      },
      {
        path: 'tasks',
        loadChildren: () => import('./features/tasks/tasks.routes').then((r) => r.tasksRoutes),
      },
      {
        path: 'board',
        loadChildren: () => import('./features/kanban/kanban.routes').then((r) => r.kanbanRoutes),
      },
      {
        path: 'calendar',
        loadChildren: () => import('./features/calendar/calendar.routes').then((r) => r.CALENDAR_ROUTES),
      },
      {
        path: 'team',
        loadChildren: () => import('./features/team/team.routes').then((r) => r.TEAM_ROUTES),
      },
      {
        path: 'analytics',
        loadChildren: () => import('./features/analytics/analytics.routes').then((r) => r.ANALYTICS_ROUTES),
      },
    ],
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((r) => r.authRoutes),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
