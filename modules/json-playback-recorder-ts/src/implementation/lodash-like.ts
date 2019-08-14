import { Observable, of } from "rxjs";
import { tap, map, flatMap } from "rxjs/operators";
import { combineFirstSerial } from "./rxjs-util";
import { TypeLike } from "../typeslike";

export namespace LodashLike {
    export type AsyncMergeWithCustomizer = { bivariantHack(value: any, srcValue: any, key: string, object: any, source: any): Observable<any>; }["bivariantHack"];
    export type AsyncCustomSetter = { bivariantHack(object: any, key: string, value: any): Observable<void>; }["bivariantHack"];
    export type MergeWithCustomizer = { bivariantHack(value: any, srcValue: any, key: string, object: any, source: any): any; }["bivariantHack"];
    export function isObject(value: any, noObjects?: Set<TypeLike<any>>) {
        if (!noObjects) {
            noObjects = new Set();
        }
        const type = typeof value;
        return !isNil(value) != null &&
            (type == 'object' || type == 'function') &&
            (value.constructor && !noObjects.has(value.constructor));
    }
    export function isNil(value: any) {
        return value === null || value === undefined;
    }
    function asyncMergeWithDeep<TObject, TSource>(
            object: TObject,
            source: TSource,
            visitedMap: Map<any, any>,
            extraOptions?: 
                {
                    customizer?: AsyncMergeWithCustomizer,
                    noObjects?: Set<TypeLike<any>>,
                    asyncCustomSetter?: AsyncCustomSetter
                }): Observable<TObject> {
        return of(null).pipe(
            flatMap(() => {
                console.log(object.constructor.name);
                if (!extraOptions) {
                    extraOptions = {};
                }
                if (Array.isArray(source)) {
                    throw new Error('Not supported. source is array.');
                }
                if ((object as any) === (source as any)) {
                    return of(object);
                }
                const allObsArr: Observable<any>[] = [];
        
                for (const propt in source) {
                    let prpSourceValue = source[propt];
                    let prpObjectValue = !isNil(object) ? (object as any)[propt] : undefined;
        
                    let newValue$: Observable<any>;
        
                    if (isObject(prpSourceValue, extraOptions.noObjects)) {
                        if (!visitedMap.has(prpSourceValue)) {
                            if (extraOptions.customizer) {
                                newValue$ = extraOptions.customizer(prpObjectValue, prpSourceValue, propt, object, source);
                            } else {
                                newValue$ = asyncMergeWithDeep(prpObjectValue, prpSourceValue, visitedMap, extraOptions);
                            }
                            newValue$ = newValue$.pipe(
                                tap((newValue) => {
                                    visitedMap.set(prpSourceValue, newValue);
                                })
                            );
                        } else {
                            newValue$ = of(visitedMap.get(prpSourceValue));
                        }
                    } else {
                        if (extraOptions.customizer) {
                            newValue$ = extraOptions.customizer(prpObjectValue, prpSourceValue, propt, object, source);
                        } else {
                            newValue$ = asyncMergeWithDeep(prpObjectValue, prpSourceValue, visitedMap, extraOptions);
                        }
                    }

                    newValue$ = newValue$.pipe(
                        !extraOptions.asyncCustomSetter?
                            tap((newValue) => {
                                visitedMap.set(prpSourceValue, newValue);
                                set(object, propt, newValue);
                            }) :
                            flatMap((newValue) => {
                                visitedMap.set(prpSourceValue, newValue);
                                return extraOptions.asyncCustomSetter(object, propt, newValue);
                            })
                    )
                    allObsArr.push(newValue$);
                }
        
                return combineFirstSerial(allObsArr).pipe(
                    map(() => {
                        return object;
                    })
                );
            })
        );
    }

    function mergeWithDeep<TObject, TSource>(
            object: TObject,
            source: TSource,
            customizer: MergeWithCustomizer,
            visitedMap: Map<any, any>,
            noObjects?: Set<TypeLike<any>>): TObject {
        if (Array.isArray(source)) {
            throw new Error('Not supported. source is array.');
        }
        if ((object as any) === (source as any)) {
            return object;
        }
        //const allObsArr: Observable<any>[] = [];

        for (const propt in source) {
            let prpSourceValue = source[propt];
            let prpObjectValue = (object as any)[propt];
            let newValue = prpSourceValue;
            if (isObject(prpSourceValue, noObjects)) {
                if (!visitedMap.has(prpSourceValue)) {
                    if (customizer) {
                        newValue = customizer(prpObjectValue, prpSourceValue, propt, object, source);
                    } else {
                        newValue = mergeWithDeep(prpObjectValue, prpSourceValue, customizer, visitedMap, noObjects);
                    }
                    visitedMap.set(prpSourceValue, newValue);
                } else {
                    newValue = visitedMap.get(prpSourceValue);
                }
            } else {
                if (customizer) {
                    newValue = customizer(prpObjectValue, prpSourceValue, propt, object, source);
                } else {
                    newValue = mergeWithDeep(prpObjectValue, prpSourceValue, customizer, visitedMap, noObjects);
                }
            }
            set(object, propt, newValue);
        }

        return object;
        // return thisLocal.combineFirstSerialPreserveAllFlags(allObsArr).pipe(
        //     map(() => {
        //     })
        // );
    }


    export function mergeWith<TObject, TSource>(object: TObject, source: TSource, customizer: MergeWithCustomizer, noObjects?: Set<TypeLike<any>>): TObject {
        return mergeWithDeep(object, source, customizer, new Map());
    }
    export function asyncMergeWith<TObject, TSource>(
        object: TObject,
        source: TSource,
        extraOptions?: 
            {
                customizer?: AsyncMergeWithCustomizer,
                noObjects?: Set<TypeLike<any>>,
                asyncCustomSetter?: AsyncCustomSetter
            }): Observable<TObject> {
        return asyncMergeWithDeep(object, source, new Map(), extraOptions);
    }

    export function has(obj: any, prop: string): boolean {
        if (!isNil(obj)) {
            var proto = obj.__proto__ || obj.constructor.prototype;
            return isObject(obj) && (prop in obj) &&
                (!(prop in proto) || proto[prop] !== obj[prop]);
        } else {
            return false;
        }
    }

    export function get<T>(obj: any, prop: string): T {
        return !isNil(obj)? obj[prop] : undefined;
    }

    export function set(obj: any, prop: string, value: any) {
        if (!isNil(obj)) {
            obj[prop] = value;
        }
    }

    export function clone(source: any, noObjects?: Set<TypeLike<any>>) {
        let result = null;
        if (!isNil(source)) {
            if (isObject)
                result = Object.assign({}, source);
        }
        return result;
    }

    export function keys(object: any) {
        return isArrayLike(object)
            ? arrayLikeKeys(object)
            : Object.keys(Object(object))
    }

    export function isArrayLike(value: any) {
        return !isNil(value) && typeof value != 'function' && isLength(value.length)
    }

    function isLength(value: any) {
        return typeof value == 'number' &&
            value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER
    }

    const hasOwnProperty = Object.prototype.hasOwnProperty;
    function arrayLikeKeys(value: any, inherited?: boolean): Array<string> {
        const isArr = Array.isArray(value);
        const isArg = !isArr && isArguments(value);
        //const isBuff = !isArr && !isArg && isBuffer(value);
        //const isType = !isArr && !isArg && !isBuff && isTypedArray(value)
        //const skipIndexes = isArr || isArg || isBuff || isType
        const skipIndexes = isArr || isArg;
        const length = value.length
        const result = new Array(skipIndexes ? length : 0)
        let index = skipIndexes ? -1 : length
        while (++index < length) {
            result[index] = `${index}`
        }
        for (const key in value) {
            if ((inherited || hasOwnProperty.call(value, key)) &&
                !(skipIndexes && (
                    // Safari 9 has enumerable `arguments.length` in strict mode.
                    (key == 'length' ||
                        // Skip index properties.
                        isIndex(key, length))
                ))) {
                result.push(key);
            }
        }
        return result;
    }
    function isArguments(value: any) {
        return isObject(value) && getTag(value) == '[object Arguments]';
    }

    function getTag(value: string) {
        if (value == null) {
            return value === undefined ? '[object Undefined]' : '[object Null]';
        }
        return toString.call(value);
    }

    const MAX_SAFE_INTEGER = 9007199254740991;
    const reIsUint = /^(?:0|[1-9]\d*)$/;
    function isIndex(value: any, length: number) {
        const type = typeof value;
        length = length == null ? MAX_SAFE_INTEGER : length;

        return !!length &&
            (type == 'number' ||
                (type != 'symbol' && reIsUint.test(value))) &&
            (value > -1 && value % 1 == 0 && value < length);
    }
}