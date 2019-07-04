import { Observable } from 'rxjs/Observable';
import { HttpResponse } from '@angular/common/http';

export interface IJsHbHttpLazyObservableGen {
	generateHttpObservable(signatureStr: string): Observable<HttpResponse<Object>>;
}