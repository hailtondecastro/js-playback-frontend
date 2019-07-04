export interface IJsHbConfig {
    jsHbIdName: string;
    jsHbIdRefName: string;
    jsHbSignatureName: string;
    jsHbIsLazyUninitializedName: string;
    jsHbHibernateIdName: string;
    jsHbCreationIdName: string;
    logLevel: JsHbLogLevel;
    configJsHbIdName(jsHbIdName: string): IJsHbConfig;
    configJsHbIdRefName(jsHbIdRefName: string): IJsHbConfig;
    configJsHbSignatureName(jsHbSignatureName: string): IJsHbConfig;
    configJsHbIsLazyUninitializedName(jsHbIsLazyUninitializedName: string): IJsHbConfig;
    configJsHbHibernateIdName(jsHbHibernateIdName: string): IJsHbConfig;
    configJsHbCreationIdName(jsHbCreationIdName: string): IJsHbConfig;    
    configLogLevel(logLevel: JsHbLogLevel): IJsHbConfig;
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
    private _jsHbIdName: string                        = 'jsHbId';
    private _jsHbIdRefName: string                     = 'jsHbIdRef'; 
    private _jsHbSignatureName: string                 = 'jsHbSignature';     
    private _jsHbIsLazyUninitializedName: string       = 'jsHbIsLazyUninitialized';               
    private _jsHbHibernateIdName: string               = 'jsHbHibernateId';          
    private _jsHbCreationIdName: string                = 'jsHbCreationId';
    private _logLevel: JsHbLogLevel = JsHbLogLevel.Trace;

    public configJsHbIdName(jsHbIdName: string): IJsHbConfig { this.jsHbIdName = jsHbIdName; return this; }
    public configJsHbIdRefName(jsHbIdRefName: string): IJsHbConfig { this.jsHbIdRefName = jsHbIdRefName; return this; }
    public configJsHbSignatureName(jsHbSignatureName: string): IJsHbConfig { this.jsHbSignatureName = jsHbSignatureName; return this; }
    public configJsHbIsLazyUninitializedName(jsHbIsLazyUninitializedName: string): IJsHbConfig { this.jsHbIsLazyUninitializedName = jsHbIsLazyUninitializedName; return this; }
    public configJsHbHibernateIdName(jsHbHibernateIdName: string): IJsHbConfig { this.jsHbHibernateIdName = jsHbHibernateIdName; return this; }
    public configJsHbCreationIdName(jsHbCreationIdName: string): IJsHbConfig { this.jsHbCreationIdName = jsHbCreationIdName; return this; }
    public configLogLevel(logLevel: JsHbLogLevel): IJsHbConfig { this.logLevel = logLevel; return this; }

    /**
     * Getter jsHbIdName
     * @return {string}
     */
    public get jsHbIdName(): string {
        return this._jsHbIdName;
    }

    /**
     * Getter jsHbIdRefName
     * @return {string}
     */
    public get jsHbIdRefName(): string {
        return this._jsHbIdRefName;
    }

    /**
     * Getter jsHbSignatureName
     * @return {string}
     */
    public get jsHbSignatureName(): string {
        return this._jsHbSignatureName;
    }

    /**
     * Getter jsHbIsLazyUninitializedName
     * @return {string}
     */
    public get jsHbIsLazyUninitializedName(): string {
        return this._jsHbIsLazyUninitializedName;
    }

    /**
     * Getter jsHbHibernateIdName
     * @return {string}
     */
    public get jsHbHibernateIdName(): string {
        return this._jsHbHibernateIdName;
    }

    /**
     * Setter jsHbIdName
     * @param {string} value
     */
    public set jsHbIdName(value: string) {
        this._jsHbIdName = value;
    }

    /**
     * Setter jsHbIdRefName
     * @param {string} value
     */
    public set jsHbIdRefName(value: string) {
        this._jsHbIdRefName = value;
    }

    /**
     * Setter jsHbSignatureName
     * @param {string} value
     */
    public set jsHbSignatureName(value: string) {
        this._jsHbSignatureName = value;
    }

    /**
     * Setter jsHbIsLazyUninitializedName
     * @param {string} value
     */
    public set jsHbIsLazyUninitializedName(value: string) {
        this._jsHbIsLazyUninitializedName = value;
    }

    /**
     * Setter jsHbHibernateIdName
     * @param {string} value
     */
    public set jsHbHibernateIdName(value: string) {
        this._jsHbHibernateIdName = value;
    }


    /**
     * Getter jsHbCreationIdName
     * @return {string                }
     */
	public get jsHbCreationIdName(): string                 {
		return this._jsHbCreationIdName;
	}

    /**
     * Setter jsHbCreationIdName
     * @param {string                } value
     */
	public set jsHbCreationIdName(value: string                ) {
		this._jsHbCreationIdName = value;
	}

    /**
     * Getter logLevel
     * @return {JsHbLogLevel}
     */
	public get logLevel(): JsHbLogLevel {
		return this._logLevel;
	}

    /**
     * Setter logLevel
     * @param {JsHbLogLevel} value
     */
	public set logLevel(value: JsHbLogLevel) {
		this._logLevel = value;
	}

}