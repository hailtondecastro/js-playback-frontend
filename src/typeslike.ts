import { HttpHeaders, HttpResponse } from "@angular/common/http";
import { Type } from "@angular/core";

export declare class HeadersLike extends HttpHeaders {
}
export interface ResponseLike<T> {
	body: T | null;
	headers?: HeadersLike;
}

export const TypeLike = Type;
export function isType(v: any): v is TypeLike<any> {
	return typeof v === 'function';
  }
export interface TypeLike<T> extends Type<T> {
}