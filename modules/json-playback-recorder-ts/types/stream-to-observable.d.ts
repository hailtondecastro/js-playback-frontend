import { Observable } from "rxjs";

export = index;
export interface StreamToObservableOptions {
    await?: Promise<any>,
    endEvent?: String | false,
    errorEvent?: String | false,
    dataEvent?: String
}
declare function index<T>(stream: NodeJS.ReadableStream, opts?: StreamToObservableOptions): Observable<T>;
