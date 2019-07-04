export interface IJsHbConfig {
    jsHbIdName: String;
    jsHbIdRefName: String;
    jsHbSignatureName: String;
    jsHbIsLazyUninitializedName: String;
    jsHbHibernateIdName: String;
    jsHbCreationIdName: String;
    logLevel: JsHbLogLevel;
    configJsHbIdName(jsHbIdName: String): IJsHbConfig;
    configJsHbIdRefName(jsHbIdRefName: String): IJsHbConfig;
    configJsHbSignatureName(jsHbSignatureName: String): IJsHbConfig;
    configJsHbIsLazyUninitializedName(jsHbIsLazyUninitializedName: String): IJsHbConfig;
    configJsHbHibernateIdName(jsHbHibernateIdName: String): IJsHbConfig;
    configJsHbCreationIdName(jsHbCreationIdName: String): IJsHbConfig;    
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
    private _jsHbIdName: String                        = 'jsHbId';
    private _jsHbIdRefName: String                     = 'jsHbIdRef'; 
    private _jsHbSignatureName: String                 = 'jsHbSignature';     
    private _jsHbIsLazyUninitializedName: String       = 'jsHbIsLazyUninitialized';               
    private _jsHbHibernateIdName: String               = 'jsHbHibernateId';          
    private _jsHbCreationIdName: String                = 'jsHbCreationId';
    private _logLevel: JsHbLogLevel = JsHbLogLevel.Trace;

    public configJsHbIdName(jsHbIdName: String): IJsHbConfig { this.jsHbIdName = jsHbIdName; return this; }
    public configJsHbIdRefName(jsHbIdRefName: String): IJsHbConfig { this.jsHbIdRefName = jsHbIdRefName; return this; }
    public configJsHbSignatureName(jsHbSignatureName: String): IJsHbConfig { this.jsHbSignatureName = jsHbSignatureName; return this; }
    public configJsHbIsLazyUninitializedName(jsHbIsLazyUninitializedName: String): IJsHbConfig { this.jsHbIsLazyUninitializedName = jsHbIsLazyUninitializedName; return this; }
    public configJsHbHibernateIdName(jsHbHibernateIdName: String): IJsHbConfig { this.jsHbHibernateIdName = jsHbHibernateIdName; return this; }
    public configJsHbCreationIdName(jsHbCreationIdName: String): IJsHbConfig { this.jsHbCreationIdName = jsHbCreationIdName; return this; }
    public configLogLevel(logLevel: JsHbLogLevel): IJsHbConfig { this.logLevel = logLevel; return this; }

    /**
     * Getter jsHbIdName
     * @return {String}
     */
    public get jsHbIdName(): String {
        return this._jsHbIdName;
    }

    /**
     * Getter jsHbIdRefName
     * @return {String}
     */
    public get jsHbIdRefName(): String {
        return this._jsHbIdRefName;
    }

    /**
     * Getter jsHbSignatureName
     * @return {String}
     */
    public get jsHbSignatureName(): String {
        return this._jsHbSignatureName;
    }

    /**
     * Getter jsHbIsLazyUninitializedName
     * @return {String}
     */
    public get jsHbIsLazyUninitializedName(): String {
        return this._jsHbIsLazyUninitializedName;
    }

    /**
     * Getter jsHbHibernateIdName
     * @return {String}
     */
    public get jsHbHibernateIdName(): String {
        return this._jsHbHibernateIdName;
    }

    /**
     * Setter jsHbIdName
     * @param {String} value
     */
    public set jsHbIdName(value: String) {
        this._jsHbIdName = value;
    }

    /**
     * Setter jsHbIdRefName
     * @param {String} value
     */
    public set jsHbIdRefName(value: String) {
        this._jsHbIdRefName = value;
    }

    /**
     * Setter jsHbSignatureName
     * @param {String} value
     */
    public set jsHbSignatureName(value: String) {
        this._jsHbSignatureName = value;
    }

    /**
     * Setter jsHbIsLazyUninitializedName
     * @param {String} value
     */
    public set jsHbIsLazyUninitializedName(value: String) {
        this._jsHbIsLazyUninitializedName = value;
    }

    /**
     * Setter jsHbHibernateIdName
     * @param {String} value
     */
    public set jsHbHibernateIdName(value: String) {
        this._jsHbHibernateIdName = value;
    }


    /**
     * Getter jsHbCreationIdName
     * @return {String                }
     */
	public get jsHbCreationIdName(): String                 {
		return this._jsHbCreationIdName;
	}

    /**
     * Setter jsHbCreationIdName
     * @param {String                } value
     */
	public set jsHbCreationIdName(value: String                ) {
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