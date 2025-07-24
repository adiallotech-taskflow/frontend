import { Routes } from '@angular/router';
import { TeamPageComponent } from './components/team-page';
import { TeamDetailComponent } from './components/team-detail/team-detail.component';

export const TEAM_ROUTES: Routes = [
  {
    path: '',
    component: TeamPageComponent,
  },
  {
    path: ':id',
    component: TeamDetailComponent,
  },
];