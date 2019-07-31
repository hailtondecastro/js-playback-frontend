import { RecorderConfig, RecorderLogLevel, FieldInfo, ConsoleLike, RecorderLogger } from '../api/recorder-config';
import { RecorderSessionDefault } from './recorder-session-default';
import { RecorderConstants } from './recorder-constants';
import { LazyRef, LazyRefPrpMarker } from '../api/lazy-ref';
import { FieldEtc, IFieldProcessorCaller } from './field-etc';
import { TypeLike } from '../typeslike';
import { RecorderSession } from '../api/session';
import { LazyObservableProvider } from '../api/lazy-observable-provider';
import { GenericNode } from '../api/generic-tokenizer';
import { IFieldProcessor } from '../api/field-processor';
import { GenericTokenizer } from '../api/generic-tokenizer';
import { RecorderDecorators } from '../api/recorder-decorators';
import { RecorderManager } from '../api/recorder-manager';

export class RecorderManagerDefault implements RecorderManager {
	private consoleLike: ConsoleLike;
	private consoleLikeLogRxOpr: ConsoleLike;
	private consoleLikeMerge: ConsoleLike;
    constructor(
			private _config: RecorderConfig,
			private _httpLazyObservableGen: LazyObservableProvider) {
		const thisLocal = this;
		if (!this._httpLazyObservableGen) {
			throw new Error('_httpLazyObservableGen can not be null');
		}
		if (!this._config) {
			throw new Error('_config can not be null');
		}
		thisLocal.consoleLike = this.config.getConsole(RecorderLogger.RecorderManagerDefault);

		if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Debug)) {
			thisLocal.consoleLike.group('RecorderManagerDefault.constructor()');
			thisLocal.consoleLike.debug(this._httpLazyObservableGen as any); thisLocal.consoleLike.debug(this._config as any as string);
			thisLocal.consoleLike.groupEnd();
		}
	}	
	
	public createSession(): RecorderSession {
		const thisLocal = this;
		let result = new RecorderSessionDefault(this);
		if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Debug)) {
			thisLocal.consoleLike.group('RecorderManagerDefault.createSession():');
			thisLocal.consoleLike.debug(result as any as string);
			thisLocal.consoleLike.groupEnd();
		}
		return result;
	}

	public get httpLazyObservableGen(): LazyObservableProvider {
		return this._httpLazyObservableGen;
	}

	public set httpLazyObservableProvider(value: LazyObservableProvider) {
		this._httpLazyObservableGen = value;
	}

	public get config(): RecorderConfig {
		return this._config;
	}

	public set config(value: RecorderConfig) {
		const thisLocal = this;
		if (thisLocal.consoleLike.enabledFor(RecorderLogLevel.Debug)) {
			thisLocal.consoleLike.group('RecorderManagerDefault.config() set: ' + value);
			thisLocal.consoleLike.debug(value as any as string);
			thisLocal.consoleLike.groupEnd();
		}
		this._config = value;
	}

	public static resolveFieldProcessorPropOptsEtc<P, GP>(
			fielEtcCacheMap: Map<Object, Map<String, FieldEtc<any, any>>>,
			owner: any,
			fieldName: string,
			config: RecorderConfig): 
			FieldEtc<P, GP> {
		if (!fielEtcCacheMap.has(owner)) {
			fielEtcCacheMap.set(owner, new Map());
		}

		if (!fielEtcCacheMap.get(owner).has(fieldName)) {
			let prpType: TypeLike<any> = Reflect.getMetadata('design:type', owner, fieldName);
			let prpGenType: GenericNode = GenericTokenizer.resolveNode(owner, fieldName);
			let lazyLoadedObjType: TypeLike<any> = null;
			let propertyOptions: RecorderDecorators.PropertyOptions<any> = 
				Reflect.getMetadata(RecorderConstants.REFLECT_METADATA_PLAYER_OBJECT_PROPERTY_OPTIONS, owner, fieldName);
			let lazyRefGenericParam: TypeLike<any> = null;
			let fieldProcessor: IFieldProcessor<P> = {};
			if (propertyOptions && propertyOptions.fieldProcessorResolver) {
				fieldProcessor = propertyOptions.fieldProcessorResolver();
			} else {
				fieldProcessor = config.getTypeProcessor(prpType);
			}

			if (prpGenType) {
				if (prpGenType.gParams[0] instanceof GenericNode) {
					lazyLoadedObjType = (<GenericNode>prpGenType.gParams[0]).gType;
				} else {
					lazyLoadedObjType = <TypeLike<any>>prpGenType.gParams[0];
				}

				if (prpGenType.gType === LazyRef || prpGenType.gType === LazyRefPrpMarker) {
					if (prpGenType.gParams.length > 0) {
						if (prpGenType.gParams[0] instanceof GenericNode) {
							lazyRefGenericParam = (prpGenType.gParams[0] as GenericNode).gType;
						} else {
							lazyRefGenericParam = (prpGenType.gParams[0] as TypeLike<any>);
						}
					}
					if (prpGenType.gType === LazyRefPrpMarker) {
						if (propertyOptions.fieldProcessorResolver) {
							fieldProcessor = propertyOptions.fieldProcessorResolver();
						} else {
							fieldProcessor = config.getTypeProcessor(lazyRefGenericParam);
						}
					}
				}
			}
	
			let info: FieldInfo = {
				fieldName: fieldName,
				fieldType: prpType,
				ownerType: owner.constructor as TypeLike<any>,
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
							callFromRecordedLiteralValue:
									!fieldProcessor || !fieldProcessor.fromRecordedLiteralValue?
									null:
									(value, info) => {
										let fromRecordedLiteralValue$ = fieldProcessorConst.fromRecordedLiteralValue(value, info);
										//console.log(propertyOptionsConst);
										if (propertyOptionsConst.fieldProcessorEvents
												&& propertyOptionsConst.fieldProcessorEvents.onFromLiteralValue) {
											fromRecordedLiteralValue$ = propertyOptionsConst.fieldProcessorEvents.onFromRecordedLiteralValue(value, info, fromRecordedLiteralValue$);
										}
										return fromRecordedLiteralValue$;
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
								!fieldProcessor || !fieldProcessor.toLiteralValue?
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
								!fieldProcessor || !fieldProcessor.toDirectRaw?
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
