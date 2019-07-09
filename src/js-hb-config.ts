import {Buffer} from 'buffer';
import { Type } from "@angular/core";
import { IFieldProcessor } from "./field-processor";
import { Stream } from "stream";
import { Observable } from 'rxjs';
import { NgJsHbDecorators } from './js-hb-decorators';
//import * as toBlob from 'stream-to-blob';

interface TypeProcessorEntry<T, TM> {type: Type<TM>, processor: IFieldProcessor<T>}

export interface FieldInfo {
	ownerType: Type<any>,
	fieldType: Type<any>,
	ownerValue: any,
    //gNode: GenericNode,
    fieldName: string
}

export interface CacheHandler {
    getFromCache(cacheKey: string): Observable<Stream>;
    removeFromCache(cacheKey: string): Observable<void>;
    putOnCache(cacheKey: string, stream: Stream): Observable<void>;
    clearCache(): Observable<void>;
}

export interface IJsHbConfig {
    // jsHbIdName: string;
    // jsHbIdRefName: string;
    // jsHbSignatureName: string;
    // jsHbIsLazyUninitializedName: string;
    // jsHbHibernateIdName: string;
	// jsHbIsComponentName: string;
	// jsHbIsAssociativeName: string;
	// jsHbIsLazyPropertyName: string;
    jsHbCreationIdName: string;
    jsHbMetadatasName: string;
    logLevel: JsHbLogLevel;
    maxLazyRefNotificationPerSecond: number;
    lazyRefNotificationTimeMeasurement: number;
    lazyRefNotificationCountMeasurement: number;
    attachPrefix: string;
    cacheStoragePrefix: string;
    cacheHandler: CacheHandler;
    // configJsHbIdName(jsHbIdName: string): IJsHbConfig;
    // configJsHbIdRefName(jsHbIdRefName: string): IJsHbConfig;
    // configJsHbSignatureName(jsHbSignatureName: string): IJsHbConfig;
    // configJsHbIsLazyUninitializedName(jsHbIsLazyUninitializedName: string): IJsHbConfig;
    // configJsHbHibernateIdName(jsHbHibernateIdName: string): IJsHbConfig;
    configJsHbCreationIdName(jsHbCreationIdName: string): IJsHbConfig;  
    configJsHbMetadatasName(jsHbMetadatasName: string): IJsHbConfig;
    configLogLevel(logLevel: JsHbLogLevel): IJsHbConfig;
    configMaxLazyRefNotificationPerSecond(maxLazyRefNotificationPerSecond: number): IJsHbConfig;
    configLazyRefNotificationTimeMeasurement(lazyRefNotificationTimeMeasurement: number): IJsHbConfig;
    configLazyRefNotificationCountMeasurement(lazyRefNotificationCountMeasurement: number): IJsHbConfig;
    configAddFieldProcessors(entries: TypeProcessorEntry<any, any>[]): IJsHbConfig;
    configCacheHandler(cacheHandler: CacheHandler): IJsHbConfig;
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
    getTypeProcessor<L,LM>(type: Type<LM>): IFieldProcessor<L>;
}

export enum JsHbLogLevel {
    Off = 9999,
    Trace = 50,
    Debug = 100,
    Info = 150,
    Warn = 200,
    Error = 250
}

// export const b64toBlob: (b64Data: string, contentType: string, sliceSize: number) => any = 
//     (b64Data, contentType = '', sliceSize = 512) => {
//     const byteCharacters = atob(b64Data);
//     const byteArrays = [];

//     for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
//         const slice = byteCharacters.slice(offset, offset + sliceSize);

//         const byteNumbers = new Array(slice.length);
//         for (let i = 0; i < slice.length; i++) {
//             byteNumbers[i] = slice.charCodeAt(i);
//         }

//         const byteArray = new Uint8Array(byteNumbers);
//         byteArrays.push(byteArray);
//     }

//     const blob = Buffer.from(byteArrays);
//     return blob;
// }

// export class JsHbConfigDefault implements IJsHbConfig {
//     constructor() {
//         this._fieldProcessorEntryMap.set(
//             Buffer,
//             {
//                 fromLiteralValue: (value, info) => {
//                     return (value? b64toBlob(value, 'application/octet-stream', 512) : null);
//                 },
//                 toLiteralValue: (value, info, onEndCallback) => {
//                     if (value) {
//                         const reader = new FileReader();
//                         reader.onloadend = (ev) => {
//                             let base64 = (reader.result as string).split(',')[1];
//                             onEndCallback(base64);
//                         };
//                         reader.readAsDataURL(value);
//                     } else {
//                         onEndCallback(null);
//                     }
//                 }
//             });
//     }

export class JsHbConfigDefault implements IJsHbConfig {
    constructor() {
        this.configAddFieldProcessors( NgJsHbDecorators.TypeProcessorEntries);
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

    // private _jsHbIdName: string                         = 'jsHbId';
    // private _jsHbIdRefName: string                      = 'jsHbIdRef';
    // private _jsHbSignatureName: string                  = 'jsHbSignature';
    // private _jsHbIsLazyUninitializedName: string        = 'jsHbIsLazyUninitialized';
    // private _jsHbHibernateIdName: string                = 'jsHbHibernateId';
	// private _jsHbIsComponentName: string                = 'jsHbIsComponent';
	// private _jsHbIsAssociativeName: string              = 'jsHbIsAssociative';
	// private _jsHbIsLazyPropertyName: string             = 'jsHbIsLazyProperty';
    private _jsHbCreationIdName: string                 = 'jsHbCreationId';
    private _jsHbMetadatasName: string = '$jsHbMetadatas$';
    private _maxLazyRefNotificationPerSecond: number    = 10;
    private _lazyRefNotificationTimeMeasurement: number = 5000;
    private _lazyRefNotificationCountMeasurement: number = 30;
    private _logLevel: JsHbLogLevel = JsHbLogLevel.Warn;
    private _fieldProcessorEntryMap: Map<Type<any>, IFieldProcessor<any>> = new Map();
    private _cacheHandler: CacheHandler;

	public get cacheHandler(): CacheHandler {
		return this._cacheHandler;
	}

	configCacheHandler(value: CacheHandler): IJsHbConfig {
        this._cacheHandler = value;
        return this;
    }
    
    // public configJsHbIdName(jsHbIdName: string): IJsHbConfig { this.jsHbIdName = jsHbIdName; return this; }
    // public configJsHbIdRefName(jsHbIdRefName: string): IJsHbConfig { this.jsHbIdRefName = jsHbIdRefName; return this; }
    // public configJsHbSignatureName(jsHbSignatureName: string): IJsHbConfig { this.jsHbSignatureName = jsHbSignatureName; return this; }
    // public configJsHbIsLazyUninitializedName(jsHbIsLazyUninitializedName: string): IJsHbConfig { this.jsHbIsLazyUninitializedName = jsHbIsLazyUninitializedName; return this; }
    // public configJsHbHibernateIdName(jsHbHibernateIdName: string): IJsHbConfig { this.jsHbHibernateIdName = jsHbHibernateIdName; return this; }
	// public configJsHbIsAssociativeName(value: string): IJsHbConfig { this._jsHbIsAssociativeName = value; return this; }
	// public configJsHbIsLazyPropertyName(value: string): IJsHbConfig { this._jsHbIsLazyPropertyName = value; return this; }
	// public configJsHbIsComponentName(value: string): IJsHbConfig { this._jsHbIsComponentName = value; return this; }
    public configJsHbCreationIdName(jsHbCreationIdName: string): IJsHbConfig { this.jsHbCreationIdName = jsHbCreationIdName; return this; }
    public configJsHbMetadatasName(jsHbMetadatasName: string): IJsHbConfig { this.jsHbMetadatasName = jsHbMetadatasName; return this; }

    public configLogLevel(logLevel: JsHbLogLevel): IJsHbConfig { this.logLevel = logLevel; return this; }
    public configMaxLazyRefNotificationPerSecond(maxLazyRefNotificationPerSecond: number): IJsHbConfig { this.maxLazyRefNotificationPerSecond = maxLazyRefNotificationPerSecond; return this; }
    public configLazyRefNotificationTimeMeasurement(lazyRefNotificationTimeMeasurement: number): IJsHbConfig { this.lazyRefNotificationTimeMeasurement = lazyRefNotificationTimeMeasurement; return this; }
    public configLazyRefNotificationCountMeasurement(value: number ): IJsHbConfig { this._lazyRefNotificationCountMeasurement = value; return this;	}

    // public get jsHbIdName(): string {
    //     return this._jsHbIdName;
    // }

    // public get jsHbIdRefName(): string {
    //     return this._jsHbIdRefName;
    // }

    // public get jsHbSignatureName(): string {
    //     return this._jsHbSignatureName;
    // }

    // public get jsHbIsLazyUninitializedName(): string {
    //     return this._jsHbIsLazyUninitializedName;
    // }

    // public get jsHbHibernateIdName(): string {
    //     return this._jsHbHibernateIdName;
    // }

    // public set jsHbIdName(value: string) {
    //     this._jsHbIdName = value;
    // }

    // public set jsHbIdRefName(value: string) {
    //     this._jsHbIdRefName = value;
    // }

    // public set jsHbSignatureName(value: string) {
    //     this._jsHbSignatureName = value;
    // }

    // public set jsHbIsLazyUninitializedName(value: string) {
    //     this._jsHbIsLazyUninitializedName = value;
    // }

    // public set jsHbHibernateIdName(value: string) {
    //     this._jsHbHibernateIdName = value;
    // }

	public get jsHbCreationIdName(): string {
		return this._jsHbCreationIdName;
	}

	public set jsHbCreationIdName(value: string) {
		this._jsHbCreationIdName = value;
	}

	public get logLevel(): JsHbLogLevel {
		return this._logLevel;
	}

	public set logLevel(value: JsHbLogLevel) {
		this._logLevel = value;
    }
    
    // public get jsHbIsAssociativeName(): string {
	// 	return this._jsHbIsAssociativeName;
	// }
	// public get jsHbIsLazyPropertyName(): string {
	// 	return this._jsHbIsLazyPropertyName;
	// }
	// public get jsHbIsComponentName(): string {
	// 	return this._jsHbIsComponentName;
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
    public getTypeProcessor<L, LM>(type: Type<LM>): IFieldProcessor<L> {
        if (this._fieldProcessorEntryMap.get(type)) {
            return this._fieldProcessorEntryMap.get(type);
        } else {
            return null;
        }
    }
}