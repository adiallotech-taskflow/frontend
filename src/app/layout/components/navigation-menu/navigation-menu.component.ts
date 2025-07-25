import { Component, Input, signal, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavigationItem, Team, TeamModel } from '../../../core/models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-navigation-menu',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navigation-menu.component.html',
})
export class NavigationMenuComponent {
  @Input() navigationItems: NavigationItem[] = [];
  @Input() teams: Team[] = [];
  @Input() userTeams: TeamModel[] = [];
  @Input() isTeamLeader: (team: TeamModel) => boolean = () => false;

  @Output() teamClick = new EventEmitter<string>();

  showDevTools = signal(!environment.production);

  onTeamClick(teamId: string, event: Event) {
    event.preventDefault();
    this.teamClick.emit(teamId);
  }
}
