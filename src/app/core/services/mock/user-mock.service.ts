import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class UserMockService {
  private mockUsers: User[] = [
    {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      role: 'admin',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      role: 'member',
      createdAt: new Date('2023-02-01'),
      updatedAt: new Date('2024-01-15')
    },
    {
      id: '3',
      firstName: 'Bob',
      lastName: 'Wilson',
      email: 'bob.wilson@example.com',
      avatar: 'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      role: 'member',
      createdAt: new Date('2023-03-01'),
      updatedAt: new Date('2024-01-20')
    },
    {
      id: '4',
      firstName: 'Sarah',
      lastName: 'Davis',
      email: 'sarah.davis@example.com',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      role: 'viewer',
      createdAt: new Date('2023-04-01'),
      updatedAt: new Date('2024-01-25')
    }
  ];

  getUsers(): Observable<User[]> {
    return of(this.mockUsers).pipe(delay(300));
  }

  getUserById(id: string): Observable<User> {
    const user = this.mockUsers.find(u => u.id === id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    return of(user).pipe(delay(300));
  }
}