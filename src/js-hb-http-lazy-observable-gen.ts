import { Observable } from 'rxjs/Observable';
import { HttpResponse } from '@angular/common/http';

/**
 * Adapter for your application.
 */
export interface IJsHbHttpLazyObservableGen {
	generateHttpObservable(signatureStr: string): Observable<HttpResponse<Object>>;
}