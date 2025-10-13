import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CommunicationService } from './communication.service';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data?: {
    user: UserProfile;
  };
}

// Response after interceptor unwrapping
export interface UnwrappedProfileResponse {
  user: UserProfile;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly API_BASE_URL = '/auth';

  constructor(private communicationService: CommunicationService) {}

  /**
   * Get current user's profile
   */
  getProfile(): Observable<UnwrappedProfileResponse> {
    return this.communicationService.get<UnwrappedProfileResponse>(
      `${this.API_BASE_URL}/me`,
      'Loading profile...'
    );
  }

  /**
   * Update current user's profile
   */
  updateProfile(profileData: UpdateProfileRequest): Observable<UnwrappedProfileResponse> {
    return this.communicationService.put<UnwrappedProfileResponse>(
      `${this.API_BASE_URL}/me`,
      profileData,
      'Updating profile...'
    );
  }

  /**
   * Change current user's password
   */
  changePassword(passwordData: ChangePasswordRequest): Observable<any> {
    return this.communicationService.put<any>(
      `${this.API_BASE_URL}/me/password`,
      passwordData,
      'Changing password...'
    );
  }
}
