import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { Workspace } from '../../../core/models';
import { WorkspaceService } from '../../../core/services/workspace.service';

@Injectable({
  providedIn: 'root'
})
export class WorkspaceDetailResolver implements Resolve<Workspace | null> {
  constructor(
    private workspaceService: WorkspaceService,
    private router: Router
  ) {}

  resolve(route: ActivatedRouteSnapshot): Observable<Workspace | null> {
    const workspaceId = route.paramMap.get('id');
    
    if (!workspaceId) {
      this.router.navigate(['/workspaces']);
      return of(null);
    }

    return this.workspaceService.getById(workspaceId).pipe(
      map(workspace => workspace),
      catchError((error) => {
        console.error('Error resolving workspace:', error);
        this.router.navigate(['/workspaces']);
        return of(null);
      })
    );
  }
}