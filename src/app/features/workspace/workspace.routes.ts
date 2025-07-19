import { Routes } from '@angular/router';

export const workspaceRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/workspace-list/workspace-list.component').then(c => c.WorkspaceListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./components/workspace-detail/workspace-detail.component').then(c => c.WorkspaceDetailComponent)
  }
];