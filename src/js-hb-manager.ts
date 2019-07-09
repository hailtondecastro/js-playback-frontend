import { MergeWithCustomizer } from 'lodash';
import { Type, Inject, Injectable, Injector } from '@angular/core';
import { GenericNode } from './generic-tokenizer';
import { IJsHbConfig, JsHbLogLevel } from './js-hb-config';
import { LazyRefMTO, LazyRefBase } from './lazy-ref';
import { Observable } from 'rxjs/Observable';
import { Response } from '@angular/http';
import { IJsHbSession, JsHbSessionDefault } from './js-hb-session';
import { JsHbContants } from './js-hb-constants';
import { IJsHbHttpLazyObservableGen } from './js-hb-http-lazy-observable-gen';

export interface IJsHbManager {
	//mergeWithCustomizerPropertyReplection(jsHbSession: IJsHbSession, refMap: Map<Number, any>): MergeWithCustomizer;
    jsHbConfig: IJsHbConfig;
	//createLoadedLazyRef<L, I>(jsHbSession: IJsHbSession, genericNode: GenericNode, literalLazyObj: any): LazyRef<L, I>;
	//createNotLoadedLazyRef<L, I>(jsHbSession: IJsHbSession, genericNode: GenericNode, literalLazyObj: any): LazyRef<L, I>;
	createSession(): IJsHbSession;
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
	

	
    // public createLoadedLazyRef<L, I>(jsHbSession: IJsHbSession, genericNode: GenericNode, literalLazyObj: any): LazyRef<L, I> {
	// 	let signatureStr: String;
	// 	let originalObs: Observable<Response> = this.httpLazyObservableProvider.generateHttpObservable(signatureStr);
	// 	let lr: LazyRef<L, I> = new LazyRefBase<L, I>();
	// 	lr.signatureStr = signatureStr;
	// 	let jsHbHibernateIdLiteral: any = _.get(literalLazyObj, this.jsHbConfig.configJsHbHibernateIdName);
	// 	if (jsHbHibernateIdLiteral instanceof Object) {
	// 		let hbIdType: Type<any> = null;
	// 		if (genericNode.gParams[1] instanceof GenericNode) {
	// 			hbIdType = (<GenericNode>genericNode.gParams[1]).gType;
	// 		} else {
	// 			hbIdType = <Type<any>>genericNode.gParams[1];
	// 		}			
	// 		lr.hbId = new hbIdType();
	// 		let refMap: Map<Number, any> = new Map<Number, any>();
	// 		_.mergeWith(lr.hbId, jsHbHibernateIdLiteral, this.mergeWithCustomizerPropertyReplection(jsHbSession, refMap));
	// 	} else {
	// 		lr.hbId = jsHbHibernateIdLiteral;
	// 	}

	// 	let lazyLoadedObjType: Type<any> = null;
	// 	if (genericNode.gParams[0] instanceof GenericNode) {
	// 		lazyLoadedObjType = (<GenericNode>genericNode.gParams[0]).gType;
	// 	} else {
	// 		lazyLoadedObjType = <Type<any>>genericNode.gParams[0];
	// 	}

	// 	let n = new Number();

	// 	lr.lazyObjObs = this.httpLazyObservableProvider.generateHttpObservable(signatureStr)
	// 		.flatMap(response => {
	// 			if (lr.lazyLoadedObj == null) {
	// 				let refMap: Map<Number, any> = new Map<Number, any>();
	// 				let literalLazyObj: any = response.json();
	// 				//literal.result
	// 				if (genericNode.gType !== LazyRef) {
	// 					throw new Error('Tipo errado: ' + genericNode.gType);
	// 				}
	// 				let lazyLoadedObjType: Type<any> = null;
	// 				if (genericNode.gParams[1] instanceof GenericNode) {
	// 					lazyLoadedObjType = (<GenericNode>genericNode.gParams[1]).gType;
	// 				} else {
	// 					lazyLoadedObjType = <Type<any>>genericNode.gParams[1];
	// 				}
	// 				lr.lazyLoadedObj = new lazyLoadedObjType();
	// 				_.mergeWith(lr.lazyLoadedObj, literalLazyObj.result, this.mergeWithCustomizerPropertyReplection(jsHbSession, refMap));
	// 				//foi a unica forma que encontrei de desacoplar o Observable<L> do Observable<Response>
	// 				// O efeito colateral disso eh que qualquer *Map() chamado antes dessa troca fica
	// 				// desatachado do novo Observable.
	// 				lr.lazyObjObs = Observable.of(lr.lazyLoadedObj);
	// 			}
	// 			return Observable.of(lr.lazyLoadedObj);
	// 		});
    //     return lr;
    // }

    // public createNotLoadedLazyRef<L, I>(jsHbSession: IJsHbSession, genericNode: GenericNode, literalLazyObj: any): LazyRef<L, I> {
	// 	let refMap: Map<Number, any> = new Map<Number, any>();
	// 	let signatureStr: String = _.get(literalLazyObj, this.jsHbConfig.jsHbSignatureName);
	// 	let originalObs: Observable<Response> = this.httpLazyObservableProvider.generateHttpObservable(signatureStr);
	// 	let lr: LazyRef<L, I> = new LazyRefBase<L, I>();
	// 	lr.signatureStr = signatureStr;
	// 	let jsHbHibernateIdLiteral: any = _.get(literalLazyObj, this.jsHbConfig.configJsHbHibernateIdName);
	// 	if (jsHbHibernateIdLiteral instanceof Object) {
	// 		let hbIdType: Type<any> = null;
	// 		if (genericNode.gParams[1] instanceof GenericNode) {
	// 			hbIdType = (<GenericNode>genericNode.gParams[0]).gType;
	// 		} else {
	// 			hbIdType = <Type<any>>genericNode.gParams[0];
	// 		}			
	// 		lr.hbId = new hbIdType();
	// 		_.mergeWith(lr.hbId, jsHbHibernateIdLiteral, this.mergeWithCustomizerPropertyReplection(jsHbSession, refMap));
	// 	} else {
	// 		lr.hbId = jsHbHibernateIdLiteral;
	// 	}

	// 	lr.lazyObjObs = this.httpLazyObservableProvider.generateHttpObservable(signatureStr)
	// 		.flatMap(response => {
	// 			if (lr.lazyLoadedObj == null) {
	// 				let literalLazyObj: any = response.json();
	// 				//literal.result
	// 				if (genericNode.gType !== LazyRef) {
	// 					throw new Error('Tipo errado: ' + genericNode.gType);
	// 				}
	// 				let lazyLoadedObjType: Type<any> = null;
	// 				if (genericNode.gParams[0] instanceof GenericNode) {
	// 					lazyLoadedObjType = (<GenericNode>genericNode.gParams[0]).gType;
	// 				} else {
	// 					lazyLoadedObjType = <Type<any>>genericNode.gParams[0];
	// 				}
	// 				lr.lazyLoadedObj = new lazyLoadedObjType();
	// 				_.mergeWith(lr.lazyLoadedObj, literalLazyObj.result, this.mergeWithCustomizerPropertyReplection(jsHbSession, refMap));
	// 				//foi a unica forma que encontrei de desacoplar o Observable<L> do Observable<Response>
	// 				// O efeito colateral disso eh que qualquer *Map() chamado antes dessa troca fica
	// 				// desatachado do novo Observable.
	// 				lr.lazyObjObs = Observable.of(lr.lazyLoadedObj);
	// 			}
	// 			return Observable.of(lr.lazyLoadedObj);
	// 		});
    //     return lr;
    // }

    // public mergeWithCustomizerPropertyReplection(jsHbSession: IJsHbSession, refMap: Map<Number, any>): MergeWithCustomizer {
	// 	let thisLocal: IJsHbManager = this;
    //     return function(value: any, srcValue: any, key?: string, object?: Object, source?: Object) {
	// 		let prpType: Type<any> = Reflect.getMetadata("design:type", object, key);
	// 		let correctSrcValue = source;
	// 		if (_.has(source, thisLocal.jsHbConfig.jsHbIdName && refMap.get(_.get(source, thisLocal.jsHbConfig.jsHbIdName)))) {
	// 			return refMap.get(_.get(source, thisLocal.jsHbConfig.jsHbIdName));
	// 		} else if (prpType) {
	// 			let prpGenType: GenericNode = GenericTokenizer.resolveNode(object, key);
	// 			if (prpGenType) {
	// 				if (prpGenType.gType === Array) {
	// 					let correctSrcValueArr = [];
	// 					for (let index = 0; index < srcValue.length; index++) {
	// 						let arrType: Type<any> = <Type<any>>prpGenType.gParams[0];
	// 						let correctSrcValueArrItem = new arrType();
	// 						_.mergeWith(correctSrcValueArrItem, srcValue[index], this.mergeWithCustomizerPropertyReplection(jsHbSession, refMap));
	// 						correctSrcValueArr.push(correctSrcValueArrItem);
	// 					}
	// 					correctSrcValue = correctSrcValueArr;
	// 					//nada por enquanto
	// 				} else if (prpGenType.gType === LazyRef) {
	// 					if(!_.has(source, thisLocal.jsHbConfig.jsHbIsLazyUninitializedName)) {
	// 						throw new Error('Aqui deveria existir \'' + thisLocal.jsHbConfig.jsHbIsLazyUninitializedName + '\'. ' + JSON.stringify(source));
	// 					}
	// 					if (_.get(source, thisLocal.jsHbConfig.jsHbIsLazyUninitializedName)) {
	// 						jsHbSession.loadLazyRef(prpGenType)
	// 					}
	// 				}
	// 				} else {
	// 					throw new Error('Isso nao era pra acontecer');
	// 				}
	// 			} else {
	// 				correctSrcValue = new prpType();
	// 				_.mergeWith(correctSrcValue, srcValue, this.mergeWithCustomizerPropertyReplection());
	// 			}
	// 		} else {
	// 			//nada
	// 		}
	// 		return correctSrcValue;
    //     }
    // }
}