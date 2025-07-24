import { Component, signal, output, input, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../../../../core/models';

@Component({
  selector: 'app-add-member-slide-over',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-member-slide-over.component.html',
  styleUrl: './add-member-slide-over.component.css',
})
export class AddMemberSlideOverComponent {
  isOpen = signal(false);
  selectedUserIds: Set<string> = new Set();
  
  availableUsers = input<User[]>([]);
  
  membersAdded = output<string[]>();
  closed = output<void>();

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.isOpen()) {
      this.close();
    }
  }

  open() {
    this.isOpen.set(true);
    this.selectedUserIds.clear();
  }

  close() {
    this.isOpen.set(false);
    this.closed.emit();
  }

  toggleUserSelection(userId: string) {
    if (this.selectedUserIds.has(userId)) {
      this.selectedUserIds.delete(userId);
    } else {
      this.selectedUserIds.add(userId);
    }
  }

  isUserSelected(userId: string): boolean {
    return this.selectedUserIds.has(userId);
  }

  addMembers() {
    if (this.selectedUserIds.size > 0) {
      this.membersAdded.emit(Array.from(this.selectedUserIds));
      this.close();
    }
  }

  getUserInitials(user: User): string {
    if (!user.firstName && !user.lastName) {
      return user.email.charAt(0).toUpperCase();
    }
    const firstInitial = user.firstName?.charAt(0) || '';
    const lastInitial = user.lastName?.charAt(0) || '';
    return (firstInitial + lastInitial).toUpperCase();
  }

  getUserDisplayName(user: User): string {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return user.email;
  }
}