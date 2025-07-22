import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavigationItem, Team } from '../../../core/models';
import { MockDevToolsComponent } from '../../../core/services';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-navigation-menu',
  imports: [CommonModule, RouterLink, RouterLinkActive, MockDevToolsComponent],
  templateUrl: './navigation-menu.component.html',
})
export class NavigationMenuComponent {
  @Input() navigationItems: NavigationItem[] = [];
  @Input() teams: Team[] = [];

  showDevTools = signal(!environment.production);
  showMockPanel = signal(false);

  toggleMockPanel() {
    this.showMockPanel.set(!this.showMockPanel());
  }
}
