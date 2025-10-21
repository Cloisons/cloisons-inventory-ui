import { Injectable } from '@angular/core';
import { HttpBackend, HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { CommunicationService } from '../../core/services/communication.service';

interface PresignResponse {
  success: boolean;
  data: { url: string; cloudFrontUrl: string };
}

@Injectable({ providedIn: 'root' })
export class S3UploadService {
  private rawHttp: HttpClient;

  constructor(
    http: HttpClient,
    handler: HttpBackend,
    private communicationService: CommunicationService
  ) {
    this.rawHttp = new HttpClient(handler);
  }

  uploadFile(file: File, path = ''): Observable<string> {
    return this.communicationService
      .post<PresignResponse>(
        '/s3/presigned-url',
        { fileName: file.name, fileType: file.type, path },
        'Uploading image...'
      )
      .pipe(
        switchMap((res) => {
          console.log('S3UploadService: Full response:', res);
          console.log('S3UploadService: Response type:', typeof res);
          console.log('S3UploadService: Response keys:', Object.keys(res || {}));
          
          // Handle both wrapped and unwrapped responses
          const data = res.data || res;
          console.log('S3UploadService: Data:', data);
          
          if (!data || !data.url) {
            throw new Error('Invalid response from presigned URL endpoint');
          }
          
          const headers = new HttpHeaders({ 'Content-Type': file.type });
          return this.rawHttp
            .put(data.url, file, { headers, responseType: 'text' })
            .pipe(map(() => data.cloudFrontUrl));
        })
      );
  }
}


