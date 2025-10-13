import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

export const responseInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    map((response) => {
      // Only process successful responses
      if (response instanceof HttpResponse) {
        const body = response.body;
        
        // Check if the response has the standard API structure with data property
        if (body && typeof body === 'object' && 'data' in body && 'success' in body) {
          // Unwrap the data from the response, but preserve meta if present (e.g., paginated lists)
          const unwrapped = (body && typeof body === 'object') ? (body as any).data : body;
          const hasMeta = body && typeof body === 'object' && 'meta' in (body as any);

          // If meta exists, attach it back to the unwrapped payload to avoid losing pagination info
          const nextBody = hasMeta ? { ...(unwrapped as any), meta: (body as any).meta } : unwrapped;

          return response.clone({
            body: nextBody
          });
        }
      }
      
      return response;
    })
  );
};
