import { Stream } from "stream";
import { Observable } from 'rxjs';
import { NgJsHbDecorators } from './js-hb-decorators';
import { TypeLike } from '../typeslike';
import { IFieldProcessor } from "../api/field-processor";
import { JsonPlaybackDecorators } from "../api/decorators";
import { RecorderLogger } from "../api/config";

interface TypeProcessorEntry<T, TM> {type: TypeLike<TM>, processor: IFieldProcessor<T>}

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

export interface IJsHbConfig {
    jsHbCreationIdName: string;
    jsHbMetadatasName: string;
    //logLevel: JsHbLogLevel;
    maxLazyRefNotificationPerSecond: number;
    lazyRefNotificationTimeMeasurement: number;
    lazyRefNotificationCountMeasurement: number;
    attachPrefix: string;
    cacheStoragePrefix: string;
    cacheHandler: CacheHandler;
    configJsHbCreationIdName(jsHbCreationIdName: string): IJsHbConfig;  
    configJsHbMetadatasName(jsHbMetadatasName: string): IJsHbConfig;
    configMaxLazyRefNotificationPerSecond(maxLazyRefNotificationPerSecond: number): IJsHbConfig;
    configLazyRefNotificationTimeMeasurement(lazyRefNotificationTimeMeasurement: number): IJsHbConfig;
    configLazyRefNotificationCountMeasurement(lazyRefNotificationCountMeasurement: number): IJsHbConfig;
    configAddFieldProcessors(entries: TypeProcessorEntry<any, any>[]): IJsHbConfig;
    configCacheHandler(cacheHandler: CacheHandler): IJsHbConfig;
    configLogLevel(logger: RecorderLogger, level: JsHbLogLevel, consoleLike?: ConsoleLike): IJsHbConfig;
    getConsole(logger: RecorderLogger): ConsoleLike;
    /**
     * Default: "jsHbAttachPrefix_"
     * @param attachPrefix 
     */
    configAttachPrefix(attachPrefix: string): IJsHbConfig;
    /**
     * Default: "jsCacheStoragePrefix_"
     * @param cacheStoragePrefix 
     */
    configCacheStoragePrefix(cacheStoragePrefix: string): IJsHbConfig;
    configAttachPrefix(attachPrefix: string): IJsHbConfig;
    getTypeProcessor<L,LM>(type: TypeLike<LM>): IFieldProcessor<L>;
}

export enum JsHbLogLevel {
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
    enabledFor(level: JsHbLogLevel): boolean;
    getLevel(): JsHbLogLevel;
}

class ConsoleLikeBase implements ConsoleLike {
    constructor(private logger: RecorderLogger, private level: JsHbLogLevel) {}

    group(...label: any[]): void {
        let labelNew = [...label];
        if (labelNew.length > 0) {
            labelNew[0] = '[' + this.logger + '] '+labelNew[0];
        }
        console.group(...labelNew);
    }
    groupEnd(): void {
        console.groupEnd();
    }
    error(message?: any, ...optionalParams: any[]): void {
        console.error('[' + this.logger + '] '+(message && message.toString ? message.toString() : ''), ...optionalParams);
    }
    warn(message?: any, ...optionalParams: any[]): void {
        console.warn('[' + this.logger + '] '+(message && message.toString ? message.toString() : ''), ...optionalParams);
    }
    log(message?: any, ...optionalParams: any[]): void {
        console.log('[' + this.logger + '] '+(message && message.toString ? message.toString() : ''), ...optionalParams);
    }
    debug(message?: any, ...optionalParams: any[]): void {
        console.debug('[' + this.logger + '] '+(message && message.toString ? message.toString() : ''), ...optionalParams);
    }
    info(message?: any, ...optionalParams: any[]): void {
        console.info('[' + this.logger + '] '+(message && message.toString ? message.toString() : ''), ...optionalParams);
    }
    enabledFor(level: JsHbLogLevel): boolean {
        return level >= this.level;
    }
    getLevel(): JsHbLogLevel {
        return this.level;
    }
}

export class JsHbConfigDefault implements IJsHbConfig {
    constructor() {
        this.configAddFieldProcessors( JsonPlaybackDecorators.TypeProcessorEntries);
        this.configCacheHandler(
            {
                clearCache: () => {
                    throw new Error('CacheHandler not defined!');
                },
                getFromCache: () => {
                    throw new Error('CacheHandler not defined!');
                },
                putOnCache:  () => {
                    throw new Error('CacheHandler not defined!');
                },
                removeFromCache: () => {
                    throw new Error('CacheHandler not defined!');
                }
            });
    }

    private _logLevelMap: Map<RecorderLogger, ConsoleLike> = new Map();
    configLogLevel(logger: RecorderLogger, level: JsHbLogLevel, consoleLike?: ConsoleLike): IJsHbConfig {
        if (!consoleLike) {
            consoleLike = new ConsoleLikeBase(logger, level);
        }
        this._logLevelMap.set(logger, consoleLike);

        return this;
    }
    getConsole(logger: RecorderLogger): ConsoleLike {
        if (!this._logLevelMap.has(logger)) {
            if (this._logLevelMap.has(RecorderLogger.All)) {
                let consoleAll = this._logLevelMap.get(RecorderLogger.All);
                this._logLevelMap.set(logger, new ConsoleLikeBase(logger, consoleAll.getLevel()));
            } else {
                this._logLevelMap.set(logger, new ConsoleLikeBase(logger, JsHbLogLevel.Error));
            }
        }
        return this._logLevelMap.get(logger);
    }

    private _attachPrefix: string;
    private _cacheStoragePrefix: string = 'jsCacheStoragePrefix_';
    configAttachPrefix(attachPrefix: string): IJsHbConfig {
        this._attachPrefix = attachPrefix;
        return this;
    }
    configCacheStoragePrefix(cacheStoragePrefix: string): IJsHbConfig {
        this._cacheStoragePrefix = cacheStoragePrefix;
        return this;
    }
	public get attachPrefix(): string {
		return this._attachPrefix;
	}
	public get cacheStoragePrefix(): string {
		return this._cacheStoragePrefix;
	}

    private _jsHbCreationIdName: string                 = 'jsHbCreationId';
    private _jsHbMetadatasName: string = '$jsHbMetadatas$';
    private _maxLazyRefNotificationPerSecond: number    = 10;
    private _lazyRefNotificationTimeMeasurement: number = 5000;
    private _lazyRefNotificationCountMeasurement: number = 30;
    //private _logLevel: JsHbLogLevel = JsHbLogLevel.Warn;
    private _fieldProcessorEntryMap: Map<TypeLike<any>, IFieldProcessor<any>> = new Map();
    private _cacheHandler: CacheHandler;

	public get cacheHandler(): CacheHandler {
		return this._cacheHandler;
	}

	configCacheHandler(value: CacheHandler): IJsHbConfig {
        this._cacheHandler = value;
        return this;
    }
    
    public configJsHbCreationIdName(jsHbCreationIdName: string): IJsHbConfig { this.jsHbCreationIdName = jsHbCreationIdName; return this; }
    public configJsHbMetadatasName(jsHbMetadatasName: string): IJsHbConfig { this.jsHbMetadatasName = jsHbMetadatasName; return this; }

    //public configLogLevel(logLevel: JsHbLogLevel): IJsHbConfig { this.logLevel = logLevel; return this; }
    public configMaxLazyRefNotificationPerSecond(maxLazyRefNotificationPerSecond: number): IJsHbConfig { this.maxLazyRefNotificationPerSecond = maxLazyRefNotificationPerSecond; return this; }
    public configLazyRefNotificationTimeMeasurement(lazyRefNotificationTimeMeasurement: number): IJsHbConfig { this.lazyRefNotificationTimeMeasurement = lazyRefNotificationTimeMeasurement; return this; }
    public configLazyRefNotificationCountMeasurement(value: number ): IJsHbConfig { this._lazyRefNotificationCountMeasurement = value; return this;	}

	public get jsHbCreationIdName(): string {
		return this._jsHbCreationIdName;
	}

	public set jsHbCreationIdName(value: string) {
		this._jsHbCreationIdName = value;
	}

	// public get logLevel(): JsHbLogLevel {
	// 	return this._logLevel;
	// }

	// public set logLevel(value: JsHbLogLevel) {
	// 	this._logLevel = value;
    // }
    
	public get maxLazyRefNotificationPerSecond(): number{
		return this._maxLazyRefNotificationPerSecond;
    }
	public get lazyRefNotificationTimeMeasurement(): number  {
		return this._lazyRefNotificationTimeMeasurement;
	}
	public set lazyRefNotificationTimeMeasurement(value: number ) {
		this._lazyRefNotificationTimeMeasurement = value;
	}
	public set maxLazyRefNotificationPerSecond(value: number) {
		this._maxLazyRefNotificationPerSecond = value;
    }
	public get jsHbMetadatasName(): string  {
		return this._jsHbMetadatasName;
	}
	public set jsHbMetadatasName(value: string ) {
		this._jsHbMetadatasName = value;
    }
    public get lazyRefNotificationCountMeasurement(): number  {
		return this._lazyRefNotificationCountMeasurement;
    }   
	public set lazyRefNotificationCountMeasurement(value: number ) {
		this._lazyRefNotificationCountMeasurement = value;
    }
    public configAddFieldProcessors(entries: TypeProcessorEntry<any, any>[]): IJsHbConfig {
        for (const entry of entries) {
            this._fieldProcessorEntryMap.set(entry.type, entry.processor);
        }
        this._fieldProcessorEntryMap;
        return this;
    }
    public getTypeProcessor<L, LM>(type: TypeLike<LM>): IFieldProcessor<L> {
        if (this._fieldProcessorEntryMap.get(type)) {
            return this._fieldProcessorEntryMap.get(type);
        } else {
            return null;
        }
    }
}