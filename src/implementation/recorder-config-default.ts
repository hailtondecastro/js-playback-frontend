import { TypeLike } from '../typeslike';
import { IFieldProcessor } from "../api/field-processor";
import { RecorderDecorators } from "../api/decorators";
import { RecorderLogger, ConsoleLike, RecorderLogLevel, CacheHandler, TypeProcessorEntry, IConfig } from "../api/config";

export class ConsoleLikeBase implements ConsoleLike {
    constructor(private logger: RecorderLogger, private level: RecorderLogLevel) {}

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
    enabledFor(level: RecorderLogLevel): boolean {
        return level >= this.level;
    }
    getLevel(): RecorderLogLevel {
        return this.level;
    }
}

export class ConfigDefault implements IConfig {
    constructor() {
        this.configAddFieldProcessors( RecorderDecorators.TypeProcessorEntries);
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
    configLogLevel(logger: RecorderLogger, level: RecorderLogLevel, consoleLike?: ConsoleLike): IConfig {
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
                this._logLevelMap.set(logger, new ConsoleLikeBase(logger, RecorderLogLevel.Error));
            }
        }
        return this._logLevelMap.get(logger);
    }

    private _attachPrefix: string;
    private _cacheStoragePrefix: string = 'jsCacheStoragePrefix_';
    configAttachPrefix(attachPrefix: string): IConfig {
        this._attachPrefix = attachPrefix;
        return this;
    }
    configCacheStoragePrefix(cacheStoragePrefix: string): IConfig {
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

	configCacheHandler(value: CacheHandler): IConfig {
        this._cacheHandler = value;
        return this;
    }
    
    public configCreationIdName(jsHbCreationIdName: string): IConfig { this.jsHbCreationIdName = jsHbCreationIdName; return this; }
    public configMetadatasName(jsHbMetadatasName: string): IConfig { this.jsHbMetadatasName = jsHbMetadatasName; return this; }

    //public configLogLevel(logLevel: JsHbLogLevel): IConfig { this.logLevel = logLevel; return this; }
    public configMaxLazyRefNotificationPerSecond(maxLazyRefNotificationPerSecond: number): IConfig { this.maxLazyRefNotificationPerSecond = maxLazyRefNotificationPerSecond; return this; }
    public configLazyRefNotificationTimeMeasurement(lazyRefNotificationTimeMeasurement: number): IConfig { this.lazyRefNotificationTimeMeasurement = lazyRefNotificationTimeMeasurement; return this; }
    public configLazyRefNotificationCountMeasurement(value: number ): IConfig { this._lazyRefNotificationCountMeasurement = value; return this;	}

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
    public configAddFieldProcessors(entries: TypeProcessorEntry<any, any>[]): IConfig {
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