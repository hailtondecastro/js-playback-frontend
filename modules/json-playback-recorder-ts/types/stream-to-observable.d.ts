import { Observable } from "rxjs";
import { Stream } from "stream";

export = index;
export interface StreamToObservableOptions {
    await?: Promise<any>,
    endEvent?: String | false,
    errorEvent?: String | false,
    dataEvent?: String
}
declare function index<T>(stream: Stream, opts?: StreamToObservableOptions): Observable<T>;
