import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationMenuComponent } from '../navigation-menu/navigation-menu.component';
import { NavigationItem, Team, TeamModel } from '../../../core/models';

@Component({
  selector: 'app-desktop-sidebar',
  imports: [CommonModule, NavigationMenuComponent],
  templateUrl: './desktop-sidebar.component.html',
})
export class DesktopSidebarComponent {
  @Input() navigationItems: NavigationItem[] = [];
  @Input() teams: Team[] = [];
  @Input() userTeams: TeamModel[] = [];
  @Input() isTeamLeader: (team: TeamModel) => boolean = () => false;
  @Input() navigateToTeamTasks: (teamId: string) => void = () => {};
}
