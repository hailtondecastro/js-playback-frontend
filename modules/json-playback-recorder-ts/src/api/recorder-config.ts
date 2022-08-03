import { IFieldProcessor } from "./field-processor";
import { Observable } from 'rxjs';
import { TypeLike } from "../typeslike";
import { LazyObservableProvider } from "./lazy-observable-provider";
import { BlobOrStream } from "./lazy-ref";

export interface TypeProcessorEntry<T, TM> {type: TypeLike<TM>, processor: IFieldProcessor<T>}
export interface FieldInfo {
	ownerType: TypeLike<any>,
	fieldType: TypeLike<any>,
	ownerValue: any,
    fieldName: string
}

export interface CacheHandlerWithInterceptor extends CacheHandler {
    callback: (operation: 'getFromCache' | 'removeFromCache' | 'putOnCache' | 'clearCache', cacheKey?: string, stream?: BlobOrStream) => void
}
export interface CacheHandler {
    getFromCache(cacheKey: string): Observable<BlobOrStream>;
    removeFromCache(cacheKey: string): Observable<void>;
    putOnCache(cacheKey: string, stream: BlobOrStream): Observable<void>;
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
    trace(message?: any, ...optionalParams: any[]): void;
    info(message?: any, ...optionalParams: any[]): void;
    enabledFor(level: RecorderLogLevel): boolean;
    getLevel(): RecorderLogLevel;
}

export interface RecorderConfig {
    creationIdName: string;
    playerMetadatasName: string;
    maxLazyRefNotificationPerSecond: number;
    lazyRefNotificationTimeMeasurement: number;
    lazyRefNotificationCountMeasurement: number;
    attachPrefix: string;
    cacheStoragePrefix: string;
    cacheHandler: CacheHandler;
    lazyObservableProvider: LazyObservableProvider;
    maxJsonStringifyForDiagnostic: number;
    readonly tryReduceLazyRefSubescribersRerun: boolean;
    configCreationIdName(creationIdName: string): RecorderConfig;  
    configMetadatasName(playerMetadatasName: string): RecorderConfig;
    configMaxLazyRefNotificationPerSecond(maxLazyRefNotificationPerSecond: number): RecorderConfig;
    configLazyRefNotificationTimeMeasurement(lazyRefNotificationTimeMeasurement: number): RecorderConfig;
    configLazyRefNotificationCountMeasurement(lazyRefNotificationCountMeasurement: number): RecorderConfig;
    configAddFieldProcessors(entries: TypeProcessorEntry<any, any>[]): RecorderConfig;
    configCacheHandler(cacheHandler: CacheHandler): RecorderConfig;
    configLazyObservableProvider(provider: LazyObservableProvider): RecorderConfig;
    /**
     * Max size of JSON.stringfy for error and log purpose. Default: 300.
     * @param maxJsonStringifyForDiagnostic 
     */
    configMaxJsonStringifyForDiagnostic(maxJsonStringifyForDiagnostic: number): RecorderConfig;
    configLogLevel(logger: RecorderLogger, level: RecorderLogLevel, consoleLike?: ConsoleLike): RecorderConfig;
    getConsole(logger: RecorderLogger): ConsoleLike;
    /**
     * Default: "attachPrefix_"
     * @param attachPrefix 
     */
    configAttachPrefix(attachPrefix: string): RecorderConfig;
    /**
     * Default: "jsCacheStoragePrefix_"
     * @param cacheStoragePrefix 
     */
    configCacheStoragePrefix(cacheStoragePrefix: string): RecorderConfig;
    configAttachPrefix(attachPrefix: string): RecorderConfig;
    /**
     * Experimental. If you have problems with not executed subscribe may you need  
     * set is to false.  
     * Default: true.  
     * @param tryReduce 
     */
    configTryReduceLazyRefSubescribersRerun(tryReduce: boolean): RecorderConfig;
    getTypeProcessor<L,LM>(type: TypeLike<LM>): IFieldProcessor<L>;
}

export enum RecorderLogger {
    All = 'All',
    RecorderManagerDefault = 'RecorderManagerDefault',
    RecorderSessionDefault = 'RecorderSessionDefault',
    RecorderSessionDefaultLogRxOpr = 'RecorderSessionDefault.logRxOpr',
    RecorderSessionDefaultMergeWithCustomizerPropertyReplection = 'RecorderSessionDefault.mergeWithCustomizerPropertyReplection',
    RecorderSessionDefaultRestoreState = 'RecorderSessionDefault.restoreEntireState',
    RecorderDecorators = 'RecorderDecorators',
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