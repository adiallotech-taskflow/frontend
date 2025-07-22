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
        loadComponent: () =>
          import('./features/tasks/components/kanban-board/kanban-board').then((c) => c.KanbanBoardComponent),
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
