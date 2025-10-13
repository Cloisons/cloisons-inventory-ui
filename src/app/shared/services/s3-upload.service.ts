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
          const headers = new HttpHeaders({ 'Content-Type': file.type });
          return this.rawHttp
            .put(res.data.url, file, { headers, responseType: 'text' })
            .pipe(map(() => res.data.cloudFrontUrl));
        })
      );
  }
}


