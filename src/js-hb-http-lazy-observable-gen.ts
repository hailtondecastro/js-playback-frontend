import { Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
//import { Observable } from 'rxjs/Observable';

export interface IJsHbHttpLazyObservableGen {
	generateHttpObservable(signatureStr: String): Observable<Response>;
}