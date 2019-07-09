import { MergeWithCustomizer } from 'lodash';
import { Type, Inject, Injectable, Injector } from '@angular/core';
import { GenericNode } from './generic-tokenizer';
import { IJsHbConfig, JsHbLogLevel } from './js-hb-config';
import { LazyRef, LazyRefDefault } from './lazy-ref';
import { Observable } from 'rxjs/Observable';
import { Response } from '@angular/http';
import { IJsHbSession, JsHbSessionDefault } from './js-hb-session';
import { JsHbContants } from './js-hb-constants';
import { IJsHbHttpLazyObservableGen } from './js-hb-http-lazy-observable-gen';

/**
 * Contract.
 */
export interface IJsHbManager {
	/**
	 * Configuration.
	 */
	jsHbConfig: IJsHbConfig;
	/**
	 * Creates a new session.
	 */
	createSession(): IJsHbSession;
	/**
	 * Adapter for your application.
	 */
	httpLazyObservableGen: IJsHbHttpLazyObservableGen;
}

@Injectable()
export class JsHbManagerDefault implements IJsHbManager{
	private _httpLazyObservableGen: IJsHbHttpLazyObservableGen;
	private _jsHbConfig: IJsHbConfig;
    constructor(private _injector: Injector) {
		this._jsHbConfig = this._injector.get(JsHbContants.I_JSHB_CONFIG_IMPLE);
		this._httpLazyObservableGen = this._injector.get(JsHbContants.I_JSHB_HTTP_LAZY_OBSERVABLE_GEN_IMPLE);

		if (!this._httpLazyObservableGen) {
			throw new Error('_httpLazyObservableGen can not be null');
		}
		if (!this._jsHbConfig) {
			throw new Error('_jsHbConfig can not be null');
		}

		if (JsHbLogLevel.Debug >= this._jsHbConfig.logLevel) {
			console.group('JsHbManagerDefault.constructor()');
			console.debug(this._httpLazyObservableGen as any); console.debug(this._jsHbConfig as any as string);
			console.groupEnd();
		}
	}	
	
	public createSession(): IJsHbSession {
		let result = new JsHbSessionDefault(this);
		if (JsHbLogLevel.Debug >= this.jsHbConfig.logLevel) {
			console.group('JsHbManagerDefault.createSession():');
			console.debug(result as any as string);
			console.groupEnd();
		}
		return result;
	}

    /**
     * Getter httpLazyObservableProvider
     * @return {IJsHbHttpLazyObservableProvider}
     */
	public get httpLazyObservableGen(): IJsHbHttpLazyObservableGen {
		return this._httpLazyObservableGen;
	}

    /**
     * Setter httpLazyObservableProvider
     * @param {IJsHbHttpLazyObservableProvider} value
     */
	public set httpLazyObservableProvider(value: IJsHbHttpLazyObservableGen) {
		this._httpLazyObservableGen = value;
	}

    /**
     * Getter jsHbConfig
     * @return {IJsHbConfig}
     */
	public get jsHbConfig(): IJsHbConfig {
		return this._jsHbConfig;
	}

    /**
     * Setter jsHbConfig
     * @param {IJsHbConfig} value
     */
	public set jsHbConfig(value: IJsHbConfig) {
		if (JsHbLogLevel.Debug >= this.jsHbConfig.logLevel) {
			console.group('JsHbManagerDefault.jsHbConfig() set: ' + value);
			console.debug(value as any as string);
			console.groupEnd();
		}
		this._jsHbConfig = value;
	}
}