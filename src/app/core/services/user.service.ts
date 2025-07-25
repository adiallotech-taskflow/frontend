import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';
import { UserMockService } from './mock';
import { User } from '../models';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiService = inject(ApiService);
  private mockService = inject(UserMockService);
  private usersSubject = new BehaviorSubject<User[]>([]);

  private get useMockService(): boolean {
    return !environment.production;
  }

  getUsers(): Observable<User[]> {
    const request$ = this.useMockService
      ? this.mockService.getUsers()
      : this.apiService.get<User[]>('/users');

    return request$.pipe(
      tap(users => this.usersSubject.next(users))
    );
  }

  getCachedUsers(): User[] {
    return this.usersSubject.value;
  }
}
