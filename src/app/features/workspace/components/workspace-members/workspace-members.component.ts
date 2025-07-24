import { Component, input, output, ViewChild } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Workspace, WorkspaceMemberWithUser, User, WorkspaceMember } from '../../../../core/models';
import { AddMemberSlideOverComponent } from '../add-member-slide-over/add-member-slide-over.component';

@Component({
  selector: 'app-workspace-members',
  standalone: true,
  imports: [CommonModule, TitleCasePipe, AddMemberSlideOverComponent],
  templateUrl: './workspace-members.component.html',
  styleUrls: ['./workspace-members.component.css'],
})
export class WorkspaceMembersComponent {
  @ViewChild(AddMemberSlideOverComponent) addMemberSlideOver!: AddMemberSlideOverComponent;
  
  workspace = input.required<Workspace>();
  membersWithUsers = input.required<WorkspaceMemberWithUser[]>();
  canEdit = input<boolean>(false);
  
  membersAdded = output<WorkspaceMember[]>();
  
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
  
  openAddMemberSlideOver() {
    this.addMemberSlideOver?.open();
  }
  
  onMembersAdded(members: WorkspaceMember[]) {
    this.membersAdded.emit(members);
  }
}