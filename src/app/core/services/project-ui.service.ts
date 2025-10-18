import { Injectable } from '@angular/core';
import { ProjectService, ProjectReturnEligibility } from './project.service';
import { Observable } from 'rxjs';

export interface ProjectWithReturnInfo {
  _id: string;
  projectName: string;
  projectDescription?: string | null;
  status: string;
  startDate?: string;
  endDate?: string | null;
  contractorId: string;
  totalUnitCost: number;
  totalSellingCost: number;
  createdAt: string;
  updatedAt?: string;
  returnEligibility: ProjectReturnEligibility | null;
  showReturnButton?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectUiService {

  constructor(private projectService: ProjectService) {}

  /**
   * Enhance project data with return button information
   */
  enhanceProjectWithReturnInfo(project: any): Observable<ProjectWithReturnInfo> {
    return new Observable(observer => {
      if (project.status === 'COMPLETED') {
        this.projectService.checkReturnEligibility(project._id).subscribe({
          next: (eligibility: ProjectReturnEligibility) => {
            const enhancedProject: ProjectWithReturnInfo = {
              ...project,
              returnEligibility: eligibility,
              showReturnButton: eligibility.isEligible
            };
            observer.next(enhancedProject);
            observer.complete();
          },
          error: (error: any) => {
            console.error('Error checking return eligibility:', error);
            const enhancedProject: ProjectWithReturnInfo = {
              ...project,
              returnEligibility: {
                isEligible: false,
                reason: 'Unable to check eligibility',
                submissionCount: 0,
                maxSubmissions: 3
              },
              showReturnButton: false
            };
            observer.next(enhancedProject);
            observer.complete();
          }
        });
      } else {
        const enhancedProject: ProjectWithReturnInfo = {
          ...project,
          returnEligibility: {
            isEligible: false,
            reason: 'Only completed projects can have items returned',
            submissionCount: 0,
            maxSubmissions: 3
          },
          showReturnButton: false
        };
        observer.next(enhancedProject);
        observer.complete();
      }
    });
  }

  /**
   * Enhance multiple projects with return button information
   * Now the server provides returnEligibility, so we just need to add showReturnButton
   */
  enhanceProjectsWithReturnInfo(projects: any[]): Observable<ProjectWithReturnInfo[]> {
    return new Observable(observer => {
      const enhancedProjects: ProjectWithReturnInfo[] = projects.map(project => ({
        ...project,
        showReturnButton: project.returnEligibility?.isEligible || false
      }));
      
      observer.next(enhancedProjects);
      observer.complete();
    });
  }

  /**
   * Get return button text based on eligibility
   */
  getReturnButtonText(eligibility: ProjectReturnEligibility): string {
    if (!eligibility.isEligible) {
      if (eligibility.submissionCount >= eligibility.maxSubmissions) {
        return 'Max Returns Reached';
      }
      if (eligibility.reason?.includes('30 days')) {
        return 'Return Period Expired';
      }
      return 'Not Eligible';
    }
    return 'Return Items';
  }

  /**
   * Get return button CSS classes based on eligibility
   */
  getReturnButtonClasses(eligibility: ProjectReturnEligibility): string {
    if (!eligibility.isEligible) {
      return 'btn btn-sm btn-outline-secondary disabled';
    }
    return 'btn btn-sm btn-warning';
  }

  /**
   * Check if return button should be disabled
   */
  isReturnButtonDisabled(eligibility: ProjectReturnEligibility): boolean {
    return !eligibility.isEligible;
  }
}
