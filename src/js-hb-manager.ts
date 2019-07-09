import { IJsHbManager } from './js-hb-manager';
import { Injectable, Injector, Type } from '@angular/core';
import { IJsHbConfig, JsHbLogLevel, FieldInfo, ConsoleLike, JsHbLogger } from './js-hb-config';
import { IJsHbSession, JsHbSessionDefault } from './js-hb-session';
import { JsHbContants } from './js-hb-constants';
import { IJsHbHttpLazyObservableGen } from './js-hb-http-lazy-observable-gen';
import { IFieldProcessor } from './field-processor';
import { GenericNode, GenericTokenizer } from './generic-tokenizer';
import { NgJsHbDecorators } from './js-hb-decorators';
import { LazyRef, LazyRefPrpMarker } from './lazy-ref';
import { FieldEtc, IFieldProcessorCaller } from './field-etc';

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

export class JsHbManagerDefault implements IJsHbManager{
	private consoleLike: ConsoleLike;
	private consoleLikeLogRxOpr: ConsoleLike;
	private consoleLikeMerge: ConsoleLike;
    constructor(
			private _jsHbConfig: IJsHbConfig,
			private _httpLazyObservableGen: IJsHbHttpLazyObservableGen) {
		const thisLocal = this;
		if (!this._httpLazyObservableGen) {
			throw new Error('_httpLazyObservableGen can not be null');
		}
		if (!this._jsHbConfig) {
			throw new Error('_jsHbConfig can not be null');
		}
		thisLocal.consoleLike = this.jsHbConfig.getConsole(JsHbLogger.JsHbManagerDefault);

		if (thisLocal.consoleLike.enabledFor(JsHbLogLevel.Debug)) {
			thisLocal.consoleLike.group('JsHbManagerDefault.constructor()');
			thisLocal.consoleLike.debug(this._httpLazyObservableGen as any); thisLocal.consoleLike.debug(this._jsHbConfig as any as string);
			thisLocal.consoleLike.groupEnd();
		}
	}	
	
	public createSession(): IJsHbSession {
		const thisLocal = this;
		let result = new JsHbSessionDefault(this);
		if (thisLocal.consoleLike.enabledFor(JsHbLogLevel.Debug)) {
			thisLocal.consoleLike.group('JsHbManagerDefault.createSession():');
			thisLocal.consoleLike.debug(result as any as string);
			thisLocal.consoleLike.groupEnd();
		}
		return result;
	}

	public get httpLazyObservableGen(): IJsHbHttpLazyObservableGen {
		return this._httpLazyObservableGen;
	}

	public set httpLazyObservableProvider(value: IJsHbHttpLazyObservableGen) {
		this._httpLazyObservableGen = value;
	}

	public get jsHbConfig(): IJsHbConfig {
		return this._jsHbConfig;
	}

	public set jsHbConfig(value: IJsHbConfig) {
		const thisLocal = this;
		if (thisLocal.consoleLike.enabledFor(JsHbLogLevel.Debug)) {
			thisLocal.consoleLike.group('JsHbManagerDefault.jsHbConfig() set: ' + value);
			thisLocal.consoleLike.debug(value as any as string);
			thisLocal.consoleLike.groupEnd();
		}
		this._jsHbConfig = value;
	}

	public static resolveFieldProcessorPropOptsEtc<P, GP>(
			fielEtcCacheMap: Map<Object, Map<String, FieldEtc<any, any>>>,
			owner: any,
			fieldName: string,
			jsHbConfig: IJsHbConfig): 
			FieldEtc<P, GP> {
		if (!fielEtcCacheMap.has(owner)) {
			fielEtcCacheMap.set(owner, new Map());
		}

		if (!fielEtcCacheMap.get(owner).has(fieldName)) {
			let prpType: Type<any> = Reflect.getMetadata('design:type', owner, fieldName);
			let prpGenType: GenericNode = GenericTokenizer.resolveNode(owner, fieldName);
			let lazyLoadedObjType: Type<any> = null;
			let propertyOptions: NgJsHbDecorators.PropertyOptions<any> = 
				Reflect.getMetadata(JsHbContants.JSHB_REFLECT_METADATA_HIBERNATE_PROPERTY_OPTIONS, owner, fieldName);
			let lazyRefGenericParam: Type<any> = null;
			let fieldProcessor: IFieldProcessor<P> = {};
			if (propertyOptions && propertyOptions.fieldProcessorResolver) {
				fieldProcessor = propertyOptions.fieldProcessorResolver();
			} else {
				fieldProcessor = jsHbConfig.getTypeProcessor(prpType);
			}

			if (prpGenType) {
				if (prpGenType.gParams[0] instanceof GenericNode) {
					lazyLoadedObjType = (<GenericNode>prpGenType.gParams[0]).gType;
				} else {
					lazyLoadedObjType = <Type<any>>prpGenType.gParams[0];
				}

				if (prpGenType.gType === LazyRef || prpGenType.gType === LazyRefPrpMarker) {
					if (prpGenType.gParams.length > 0) {
						if (prpGenType.gParams[0] instanceof GenericNode) {
							lazyRefGenericParam = (prpGenType.gParams[0] as GenericNode).gType;
						} else {
							lazyRefGenericParam = (prpGenType.gParams[0] as Type<any>);
						}
					}
					if (prpGenType.gType === LazyRefPrpMarker) {
						if (propertyOptions.fieldProcessorResolver) {
							fieldProcessor = propertyOptions.fieldProcessorResolver();
						} else {
							fieldProcessor = jsHbConfig.getTypeProcessor(lazyRefGenericParam);
						}
					}
				}
			}
	
			let info: FieldInfo = {
				fieldName: fieldName,
				fieldType: prpType,
				ownerType: owner.constructor as Type<any>,
				ownerValue: owner
			}
	
			const fieldProcessorConst = fieldProcessor;
			const propertyOptionsConst = propertyOptions;
			fielEtcCacheMap.get(owner).set(
				fieldName,
				{
					prpType: prpType,
					prpGenType: prpGenType,
					lazyLoadedObjType: lazyLoadedObjType,
					propertyOptions: propertyOptions,
					fieldProcessorCaller: 
						{
							callFromLiteralValue: 
								!fieldProcessor || !fieldProcessor.fromLiteralValue?
									null:
									(value, info) => {
										let fromLiteralValue$ = fieldProcessorConst.fromLiteralValue(value, info);
										//console.log(propertyOptionsConst);
										if (propertyOptionsConst.fieldProcessorEvents
												&& propertyOptionsConst.fieldProcessorEvents.onFromLiteralValue) {
											fromLiteralValue$ = propertyOptionsConst.fieldProcessorEvents.onFromLiteralValue(value, info, fromLiteralValue$);
										}
										return fromLiteralValue$;
									},
							callFromDirectRaw:
								!fieldProcessor || !fieldProcessor.fromDirectRaw?
									null:
									(rawResponse, info) => {
										let fromDirectRaw$ = fieldProcessorConst.fromDirectRaw(rawResponse, info);
										if (propertyOptionsConst.fieldProcessorEvents
											&& propertyOptionsConst.fieldProcessorEvents.onFromDirectRaw) {
											fromDirectRaw$ = propertyOptionsConst.fieldProcessorEvents.onFromDirectRaw(rawResponse, info, fromDirectRaw$);
										}
										return fromDirectRaw$;
									},
							callToLiteralValue: 
								!fieldProcessor || !fieldProcessor.fromDirectRaw?
									null:
									(value, info) => {
										let toLiteralValue$ = fieldProcessorConst.toLiteralValue(value, info);
										if (propertyOptionsConst.fieldProcessorEvents
											&& propertyOptionsConst.fieldProcessorEvents.onToLiteralValue) {
											toLiteralValue$ = propertyOptionsConst.fieldProcessorEvents.onToLiteralValue(value, info, toLiteralValue$);
										}
										return toLiteralValue$;
									},
							callToDirectRaw:
								!fieldProcessor || !fieldProcessor.fromDirectRaw?
								null:
								(value, info) => {
									let toDirectRaw$ = fieldProcessorConst.toDirectRaw(value, info);
									if (propertyOptionsConst.fieldProcessorEvents 
										&& propertyOptionsConst.fieldProcessorEvents.onToDirectRaw) {
										toDirectRaw$ = propertyOptionsConst.fieldProcessorEvents.onToDirectRaw(value, info, toDirectRaw$);
									}
									return toDirectRaw$;
								}
						},
						lazyRefGenericParam: lazyRefGenericParam,
						fieldInfo: info
				}
			);
		}

		return fielEtcCacheMap.get(owner).get(fieldName) as FieldEtc<P, GP>;
	}
}
