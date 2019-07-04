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
}

export enum JsHbLogLevel {
    Off = 9999,
    Trace = 50,
    Debug = 100,
    Info = 150,
    Warn = 200,
    Error = 250
}

export class JsHbConfigDefault implements IJsHbConfig {
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
    private _logLevel: JsHbLogLevel = JsHbLogLevel.Trace;

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
}