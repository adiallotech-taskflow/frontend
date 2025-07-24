import { Component, input } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Workspace, WorkspaceMemberWithUser, User } from '../../../../core/models';

@Component({
  selector: 'app-workspace-members',
  standalone: true,
  imports: [CommonModule, TitleCasePipe],
  templateUrl: './workspace-members.component.html',
  styleUrls: ['./workspace-members.component.css'],
})
export class WorkspaceMembersComponent {
  workspace = input.required<Workspace>();
  membersWithUsers = input.required<WorkspaceMemberWithUser[]>();
  
  getUserInitial(user?: User | null): string {
    if (!user || !user.firstName) {
      return 'U';
    }
    return user.firstName.charAt(0).toUpperCase();
  }

  getUserFullName(user?: User | null): string {
    if (!user) {
      return 'Unknown User';
    }
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown User';
  }
}