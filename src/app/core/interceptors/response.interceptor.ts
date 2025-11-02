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
          const apiBody = body as any;
          const data = apiBody.data;
          const meta = apiBody.meta;
          
          // Handle different response formats
          let nextBody: any;
          
          // Special handling for categories API where data is an array directly
          if (req.url.includes('/categories') && Array.isArray(data)) {
            // For categories: transform { data: [...], meta: {...} } to { items: [...], meta: {...} }
            nextBody = { items: data, meta };
          } else if (Array.isArray(data)) {
            // For other APIs that return arrays in data, wrap as items
            nextBody = meta ? { items: data, meta } : { items: data };
          } else {
            // For APIs where data is an object, unwrap it and preserve meta
            nextBody = meta ? { ...data, meta } : data;
          }

          return response.clone({
            body: nextBody
          });
        }
      }
      
      return response;
    })
  );
};
