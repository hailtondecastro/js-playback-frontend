export declare interface HeadersLike {
    has(name: string): boolean;
    get(name: string): string | null;
    keys(): string[];
    getAll(name: string): string[] | null;
}

export interface ResponseLike<T> {
	body: T | null;
	headers?: HeadersLike;
}
export interface ResponseLike<T> {
	body: T | null;
	headers?: HeadersLike;
}

export const TypeLike = Function;

export function isType(v: any): v is TypeLike<any> {
  return typeof v === 'function';
}

export interface TypeLike<T> extends Function { new (...args: any[]): T; }