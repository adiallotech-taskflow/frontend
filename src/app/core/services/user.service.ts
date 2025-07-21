import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';
import { UserMockService } from './mock/user-mock.service';
import { User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiService = inject(ApiService);
  private mockService = inject(UserMockService);

  private get useMockService(): boolean {
    return !environment.production;
  }

  getUsers(): Observable<User[]> {
    if (this.useMockService) {
      return this.mockService.getUsers();
    }
    return this.apiService.get<User[]>('/users');
  }

  getUserById(id: string): Observable<User> {
    if (this.useMockService) {
      return this.mockService.getUserById(id);
    }
    return this.apiService.get<User>(`/users/${id}`);
  }
}