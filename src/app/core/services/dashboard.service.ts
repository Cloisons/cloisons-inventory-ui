import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CommunicationService } from './communication.service';

export interface ProjectStats {
  totalProjects: number;
  completedProjects: number;
  planningProjects: number;
  onHoldProjects?: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private communicationService: CommunicationService) {}

  getProjectStats(): Observable<ProjectStats> {
    return this.communicationService
      .get<any>('/dashboard/project-stats', 'Loading dashboard...')
      .pipe(
        map((resp: any) => {
          const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
          if (isWrapped && resp.success === false) throw new Error(resp.message || 'Failed to load dashboard stats');
          const payload = isWrapped ? resp.data : resp;
          if (!payload) throw new Error('Invalid dashboard stats response');
          return {
            totalProjects: Number(payload.totalProjects ?? 0),
            completedProjects: Number(payload.completedProjects ?? 0),
            planningProjects: Number(payload.planningProjects ?? 0),
            onHoldProjects: payload.onHoldProjects != null ? Number(payload.onHoldProjects) : undefined
          } as ProjectStats;
        }),
        catchError((err) => throwError(() => err))
      );
  }
}


