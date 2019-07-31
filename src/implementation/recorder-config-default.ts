import { TypeLike } from '../typeslike';
import { IFieldProcessor } from "../api/field-processor";
import { RecorderDecorators } from "../api/recorder-decorators";
import { RecorderLogger, ConsoleLike, RecorderLogLevel, CacheHandler, TypeProcessorEntry, RecorderConfig } from "../api/recorder-config";

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

export class RecorderConfigDefault implements RecorderConfig {
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
    configLogLevel(logger: RecorderLogger, level: RecorderLogLevel, consoleLike?: ConsoleLike): RecorderConfig {
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

    private _attachPrefix: string = 'attachPrefix_';
    private _cacheStoragePrefix: string = 'cacheStoragePrefix_';
    configAttachPrefix(attachPrefix: string): RecorderConfig {
        this._attachPrefix = attachPrefix;
        return this;
    }
    configCacheStoragePrefix(cacheStoragePrefix: string): RecorderConfig {
        this._cacheStoragePrefix = cacheStoragePrefix;
        return this;
    }
	public get attachPrefix(): string {
		return this._attachPrefix;
	}
	public get cacheStoragePrefix(): string {
		return this._cacheStoragePrefix;
	}

    private _creationIdName: string                 = 'creationId';
    private _playerMetadatasName: string = '$metadatas$';
    private _maxLazyRefNotificationPerSecond: number    = 10;
    private _lazyRefNotificationTimeMeasurement: number = 5000;
    private _lazyRefNotificationCountMeasurement: number = 30;
    private _fieldProcessorEntryMap: Map<TypeLike<any>, IFieldProcessor<any>> = new Map();
    private _cacheHandler: CacheHandler;

	public get cacheHandler(): CacheHandler {
		return this._cacheHandler;
	}

	configCacheHandler(value: CacheHandler): RecorderConfig {
        this._cacheHandler = value;
        return this;
    }
    
    public configCreationIdName(creationIdName: string): RecorderConfig { this.creationIdName = creationIdName; return this; }
    public configMetadatasName(playerMetadatasName: string): RecorderConfig { this.playerMetadatasName = playerMetadatasName; return this; }

    public configMaxLazyRefNotificationPerSecond(maxLazyRefNotificationPerSecond: number): RecorderConfig { this.maxLazyRefNotificationPerSecond = maxLazyRefNotificationPerSecond; return this; }
    public configLazyRefNotificationTimeMeasurement(lazyRefNotificationTimeMeasurement: number): RecorderConfig { this.lazyRefNotificationTimeMeasurement = lazyRefNotificationTimeMeasurement; return this; }
    public configLazyRefNotificationCountMeasurement(value: number ): RecorderConfig { this._lazyRefNotificationCountMeasurement = value; return this;	}

	public get creationIdName(): string {
		return this._creationIdName;
	}

	public set creationIdName(value: string) {
		this._creationIdName = value;
	}
    
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
	public get playerMetadatasName(): string  {
		return this._playerMetadatasName;
	}
	public set playerMetadatasName(value: string ) {
		this._playerMetadatasName = value;
    }
    public get lazyRefNotificationCountMeasurement(): number  {
		return this._lazyRefNotificationCountMeasurement;
    }   
	public set lazyRefNotificationCountMeasurement(value: number ) {
		this._lazyRefNotificationCountMeasurement = value;
    }
    public configAddFieldProcessors(entries: TypeProcessorEntry<any, any>[]): RecorderConfig {
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