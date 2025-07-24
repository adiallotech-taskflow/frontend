import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { User } from '../../models';
import { MOCK_USERS } from './mock-users.data';

@Injectable({
  providedIn: 'root',
})
export class UserMockService {
  private mockUsers: User[] = MOCK_USERS;

  getUsers(): Observable<User[]> {
    return of(this.mockUsers).pipe(delay(300));
  }
}
