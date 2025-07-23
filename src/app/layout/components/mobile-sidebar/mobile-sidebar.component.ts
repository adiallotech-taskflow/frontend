import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationMenuComponent } from '../navigation-menu/navigation-menu.component';
import { NavigationItem, Team, TeamModel } from '../../../core/models';

@Component({
  selector: 'app-mobile-sidebar',
  imports: [CommonModule, NavigationMenuComponent],
  templateUrl: './mobile-sidebar.component.html',
})
export class MobileSidebarComponent {
  @Input() isOpen = false;
  @Input() navigationItems: NavigationItem[] = [];
  @Input() teams: Team[] = [];
  @Input() userTeams: TeamModel[] = [];
  @Input() isTeamLeader: (team: TeamModel) => boolean = () => false;
  @Input() navigateToTeamTasks: (teamId: string) => void = () => {};
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }
}
