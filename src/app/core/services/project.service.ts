import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';
import { CommunicationService } from './communication.service';

export type ProjectStatus =
  | 'PLANNING'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'CANCELLED'
  | 'COMPLETED';

export interface ProjectProduct {
  productId: string;
  quantity: number;
}

export interface ProjectItem {
  itemId: string;
  quantity: number;
  listedItem?: boolean;
  sellingPrice?: number | null;
}

export interface Project {
  _id: string;
  projectName: string;
  projectDescription?: string | null;
  contractorId: string | { _id: string; contractorName: string };
  status: ProjectStatus;
  startDate?: string | null;
  endDate?: string | null;
  totalUnitCost?: number; // visible for superAdmin only
  totalSellingCost: number;
  productsUsed?: ProjectProduct[];
  itemsUsed?: ProjectItem[];
  directItemsUsed?: ProjectItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectsResponse {
  success: boolean;
  data: {
    items: Project[];
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProjectResponse {
  success: boolean;
  data: {
    project: Project;
  };
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly DEFAULT_TIMEOUT = 30000;
  private readonly MAX_RETRIES = 2;

  constructor(private communicationService: CommunicationService) {}

  listProjects(page: number = 1, limit: number = 100, query?: string): Observable<Project[]> {
    const params: Record<string, string> = { page: String(page), limit: String(limit) };
    if (query && query.trim() !== '') params['q'] = query.trim();
    return this.communicationService
      .get<ProjectsResponse>('/projects', 'Loading projects...', { params })
      .pipe(
        timeout(this.DEFAULT_TIMEOUT),
        retry(this.MAX_RETRIES),
        map((resp: any) => {
          const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
          if (isWrapped && resp.success === false) throw new Error(resp.message || 'Failed to load projects');
          const payload = isWrapped ? resp.data : resp;
          const items = payload?.items;
          if (!Array.isArray(items)) throw new Error('Invalid projects response');
          return items as Project[];
        }),
        catchError((err) => throwError(() => err))
      );
  }

  listProjectsPaged(
    page: number = 1,
    limit: number = 10,
    query?: string
  ): Observable<{ items: Project[]; meta?: ProjectsResponse['meta'] }> {
    const params: Record<string, string> = { page: String(page), limit: String(limit) };
    if (query && query.trim() !== '') params['q'] = query.trim();
    return this.communicationService
      .get<ProjectsResponse>('/projects', 'Loading projects...', { params })
      .pipe(
        timeout(this.DEFAULT_TIMEOUT),
        retry(this.MAX_RETRIES),
        map((resp: any) => {
          const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
          if (isWrapped && resp.success === false) throw new Error(resp.message || 'Failed to load projects');
          const payload = isWrapped ? resp.data : resp;
          const items = payload?.items;
          const meta = isWrapped ? resp.meta : resp?.meta;
          if (!Array.isArray(items)) throw new Error('Invalid projects response');
          return { items, meta } as { items: Project[]; meta?: ProjectsResponse['meta'] };
        }),
        catchError((err) => throwError(() => err))
      );
  }

  getProject(id: string): Observable<Project> {
    return this.communicationService.get<ProjectResponse>(`/projects/${id}`, 'Loading project...').pipe(
      timeout(this.DEFAULT_TIMEOUT),
      retry(this.MAX_RETRIES),
      map((resp: any) => {
        const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
        if (isWrapped && resp.success === false) throw new Error(resp.message || 'Failed to load project');
        const payload = isWrapped ? resp.data : resp;
        // Handle both single project and array response formats
        const project = payload?.project ?? (Array.isArray(payload?.items) ? payload.items[0] : payload);
        if (!project || typeof project !== 'object') throw new Error('Invalid project response');
        return project as Project;
      }),
      catchError((err) => throwError(() => err))
    );
  }

  createProject(
    payload: Partial<Omit<Project, '_id' | 'createdAt' | 'updatedAt'>>
  ): Observable<Project> {
    return this.communicationService
      .post<ProjectResponse>('/projects', payload, 'Creating project...')
      .pipe(
        timeout(this.DEFAULT_TIMEOUT),
        map((resp: any) => {
          const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
          if (isWrapped && resp.success === false) throw new Error(resp.message || 'Failed to create project');
          const payload = isWrapped ? resp.data : resp;
          const project = payload?.project ?? payload;
          if (!project || typeof project !== 'object') throw new Error('Failed to create project');
          return project as Project;
        }),
        catchError((err) => throwError(() => err))
      );
  }

  updateProject(id: string, payload: Partial<Project>): Observable<Project> {
    return this.communicationService
      .put<ProjectResponse>(`/projects/${id}`, payload, 'Updating project...')
      .pipe(
        timeout(this.DEFAULT_TIMEOUT),
        map((resp: any) => {
          const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
          if (isWrapped && resp.success === false) throw new Error(resp.message || 'Failed to update project');
          const payload = isWrapped ? resp.data : resp;
          const project = payload?.project ?? payload;
          if (!project || typeof project !== 'object') throw new Error('Failed to update project');
          return project as Project;
        }),
        catchError((err) => throwError(() => err))
      );
  }

  deleteProject(id: string): Observable<void> {
    return this.communicationService
      .delete<{ success: boolean }>(`/projects/${id}`, 'Deleting project...')
      .pipe(
        timeout(this.DEFAULT_TIMEOUT),
        map((resp: any) => {
          const isWrapped = resp && typeof resp === 'object' && Object.prototype.hasOwnProperty.call(resp, 'success');
          if (isWrapped && !resp.success) throw new Error(resp.message || 'Failed to delete project');
          return void 0;
        }),
        catchError((err) => throwError(() => err))
      );
  }
}


