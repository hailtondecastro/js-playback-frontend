import { IFieldProcessor } from "./field-processor";
import { Stream } from "stream";
import { Observable } from 'rxjs';
import { TypeLike } from "../typeslike";

export interface TypeProcessorEntry<T, TM> {type: TypeLike<TM>, processor: IFieldProcessor<T>}
export interface FieldInfo {
	ownerType: TypeLike<any>,
	fieldType: TypeLike<any>,
	ownerValue: any,
    fieldName: string
}

export interface CacheHandler {
    getFromCache(cacheKey: string): Observable<Stream>;
    removeFromCache(cacheKey: string): Observable<void>;
    putOnCache(cacheKey: string, stream: Stream): Observable<void>;
    clearCache(): Observable<void>;
}
export enum RecorderLogLevel {
    Off = 9999,
    Trace = 50,
    Debug = 100,
    Info = 150,
    Warn = 200,
    Error = 250
}

export interface ConsoleLike {
    group(...label: any[]): void;
    groupEnd(): void;
    error(message?: any, ...optionalParams: any[]): void;
    warn(message?: any, ...optionalParams: any[]): void;
    log(message?: any, ...optionalParams: any[]): void;
    debug(message?: any, ...optionalParams: any[]): void;
    info(message?: any, ...optionalParams: any[]): void;
    enabledFor(level: RecorderLogLevel): boolean;
    getLevel(): RecorderLogLevel;
}

export interface IConfig {
    jsHbCreationIdName: string;
    jsHbMetadatasName: string;
    //logLevel: JsHbLogLevel;
    maxLazyRefNotificationPerSecond: number;
    lazyRefNotificationTimeMeasurement: number;
    lazyRefNotificationCountMeasurement: number;
    attachPrefix: string;
    cacheStoragePrefix: string;
    cacheHandler: CacheHandler;
    configCreationIdName(jsHbCreationIdName: string): IConfig;  
    configMetadatasName(jsHbMetadatasName: string): IConfig;
    configMaxLazyRefNotificationPerSecond(maxLazyRefNotificationPerSecond: number): IConfig;
    configLazyRefNotificationTimeMeasurement(lazyRefNotificationTimeMeasurement: number): IConfig;
    configLazyRefNotificationCountMeasurement(lazyRefNotificationCountMeasurement: number): IConfig;
    configAddFieldProcessors(entries: TypeProcessorEntry<any, any>[]): IConfig;
    configCacheHandler(cacheHandler: CacheHandler): IConfig;
    configLogLevel(logger: RecorderLogger, level: RecorderLogLevel, consoleLike?: ConsoleLike): IConfig;
    getConsole(logger: RecorderLogger): ConsoleLike;
    /**
     * Default: "jsHbAttachPrefix_"
     * @param attachPrefix 
     */
    configAttachPrefix(attachPrefix: string): IConfig;
    /**
     * Default: "jsCacheStoragePrefix_"
     * @param cacheStoragePrefix 
     */
    configCacheStoragePrefix(cacheStoragePrefix: string): IConfig;
    configAttachPrefix(attachPrefix: string): IConfig;
    getTypeProcessor<L,LM>(type: TypeLike<LM>): IFieldProcessor<L>;
}

export enum RecorderLogger {
    All = 'All',
    RecorderManagerDefault = 'RecorderManagerDefault',
    RecorderSessionDefault = 'RecorderSessionDefault',
    RecorderSessionDefaultLogRxOpr = 'RecorderSessionDefault.logRxOpr',
    RecorderSessionDefaultMergeWithCustomizerPropertyReplection = 'RecorderSessionDefault.mergeWithCustomizerPropertyReplection',
    RecorderSessionDefaultRestoreState = 'RecorderSessionDefault.restoreEntireStateFromLiteral',
    JsonPlaybackDecorators = 'JsonPlaybackDecorators',
    LazyRef = 'LazyRef',
    LazyRefSubscribe = 'LazyRef.subscribe',
    LazyRefBaseProcessResponse = 'LazyRefBase.processResponse',
    SetCreator = 'SetCreator'
}

export interface ConsoleLike {
    group(...label: any[]): void;
    groupEnd(): void;
    error(message?: any, ...optionalParams: any[]): void;
    warn(message?: any, ...optionalParams: any[]): void;
    log(message?: any, ...optionalParams: any[]): void;
    debug(message?: any, ...optionalParams: any[]): void;
    info(message?: any, ...optionalParams: any[]): void;
    enabledFor(level: RecorderLogLevel): boolean;
    getLevel(): RecorderLogLevel;
}