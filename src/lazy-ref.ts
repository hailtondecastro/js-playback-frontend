//import { Observable } from 'rxjs/Observable';
import { Response } from '@angular/http';
import { Observable, Subscription, Subject, Subscriber } from 'rxjs';
import { PartialObserver } from 'rxjs/Observer';
import { GenericNode, GenericTokenizer } from './generic-tokenizer';
import { Type } from '@angular/core';
import { JsHbPlaybackAction, JsHbPlaybackActionType } from './js-hb-playback-action';
import { JsHbContants } from './js-hb-constants';
import { IJsHbSession } from './js-hb-session';
import { JsHbLogLevel } from './js-hb-config';

export class LazyRefMTO<L, I> extends Subject<L> {
    hbId: I;
    //lazyLoadedObj: L;
    signatureStr: String;
    /**
     * Diferente do subscribe comum, que deve ser executado toda vez que os dados
     * forem alterados, esse somente eh executado uma vez e dispara um next para
     * que todos as outras subscricoes (pipe async's por exemplo) sejam chamadas.
     * por isso nao retorna Subscription, afinal ele nao se inscreve permanentemente
     * na lista de observer's.
     * @param observerOrNext
     * @param error
     * @param complete
     */
    subscribeToChange(observer?: PartialObserver<L>): void;
    subscribeToChange(next?: (value: L) => void, error?: (error: any) => void, complete?: () => void): void;
    subscribeToChange(observerOrNext?: PartialObserver<L> | ((value: L) => void),
        error?: (error: any) => void,
        complete?: () => void): void{}
    /**
     * 
     * @param lazyLoadedObj 
     */
    setLazyObj(lazyLoadedObj: L): void{};
}

export declare type LazyRefOTM<L> = LazyRefMTO<L, undefined>;

export class LazyRefBase<L, I> extends LazyRefMTO<L, I> {
    private _hbId: I;
    private _lazyLoadedObj: L;
    private _signatureStr: String;
    private _respObs: Observable<Response>;
    private _flatMapCallback: (response: Response) => Observable<L>;
    private _refererObj: any;
    private _refererKey: string;
    private _session: IJsHbSession;

    constructor() {
        super();
        this._lazyLoadedObj = null;
    }

    private _isOnInternalSetLazyObjForCollection: boolean = false;

    public internalSetLazyObjForCollection(lazyLoadedObj: L): void {
        try {
            this._isOnInternalSetLazyObjForCollection = true;
            this.setLazyObj(lazyLoadedObj);
        } finally {
            this._isOnInternalSetLazyObjForCollection = false;
        }
    }

    public setLazyObj(lazyLoadedObj: L): void {
        //anulando os response.
        this.respObs = null;
        //Validando
        if (!this.refererObj || !this.refererKey) {
            throw new Error('The property \'' + this.refererKey + ' has no refererObj or refererKey');
        }
        let prpGenType: GenericNode = GenericTokenizer.resolveNode(this.refererObj, this.refererKey);
        if (prpGenType == null) {
            throw new Error('The property \'' + this.refererKey + ' from \'' + this.refererObj.constructor.name + '\' is not decorated with com \'@Reflect.metadata("design:generics", GenericTokenizer\'...');
        }
        if (prpGenType.gType !== LazyRefMTO) {
            throw new Error('The property \'' + this.refererKey + ' from \'' + this.refererObj.constructor.name + '\' is not LazyRef');
        }
        let lazyRefGenericParam: Type<any> = null;
        if (prpGenType.gParams.length > 0) {
            if (prpGenType.gParams[0] instanceof GenericNode) {
                lazyRefGenericParam = (prpGenType.gParams[0] as GenericNode).gType;
            } else {
                lazyRefGenericParam = (prpGenType.gParams[0] as Type<any>);
            }
        }
        if ((lazyRefGenericParam === Set || lazyRefGenericParam === Array) && !this._isOnInternalSetLazyObjForCollection) {
            throw new Error('The property \'' + this.refererKey + ' from \'' + this.refererObj.constructor.name + '\' can not be \'' + lazyRefGenericParam.name + '\'');
        }

        if (this.session.isRecording()){
            //gravando o playback
            let action: JsHbPlaybackAction = new JsHbPlaybackAction();
            action.fieldName = this.refererKey;
            action.actionType = JsHbPlaybackActionType.SetField;
            if (_.has(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbSignatureName)) {
                action.ownerSignatureStr = _.get(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbSignatureName) as string;
            } else if (_.has(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName)) {
                action.ownerCreationRefId = _.get(this.refererObj, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName) as number;
            } else if (!this._isOnInternalSetLazyObjForCollection) {
                throw new Error('The property \'' + this.refererKey + ' from \'' + this.refererObj.constructor.name + '\' has a not managed owner');
            }

            if (lazyLoadedObj != null) {
                if (_.has(lazyLoadedObj, this.session.jsHbManager.jsHbConfig.jsHbSignatureName)) {
                    action.settedSignatureStr = _.get(lazyLoadedObj, this.session.jsHbManager.jsHbConfig.jsHbSignatureName) as string;
                } else if (_.has(lazyLoadedObj, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName)) {
                    action.settedCreationRefId = _.get(lazyLoadedObj, this.session.jsHbManager.jsHbConfig.jsHbCreationIdName) as number;
                } else if (!this._isOnInternalSetLazyObjForCollection) {
                    throw new Error('The property \'' + this.refererKey + ' from \'' + this.refererObj.constructor.name + '\'.  lazyLoadedObj is not managed: \'' + lazyLoadedObj.constructor.name + '\'');
                }
            }

            this.session.addPlaybackAction(action);
        }        

        this.lazyLoadedObj = lazyLoadedObj;
        this.next(lazyLoadedObj);
    }

    subscribe(observerOrNext?: PartialObserver<L> | ((value: L) => void),
        error?: (error: any) => void,
        complete?: () => void): Subscription {
        const thisLocal = this;
        let resultSubs: Subscription = null;
        //aqui sobrescreve mas nao vai acontecer nada pois aindanao fizemos o next
        if (observerOrNext instanceof Subscriber) {
            resultSubs = super.subscribe(observerOrNext);
        } else {
            resultSubs = super.subscribe(<(value: L) => void>observerOrNext, error, complete);
        }

        let nextOriginal: (value: L) => void = null;
        if (thisLocal.lazyLoadedObj == null) {
            if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                console.debug(
                    '(thisLocal.lazyLoadedObj == null)\n'
                    +'It may mean that we have not subscribed yet in the Observable of Response');
            }
            if (this.respObs == null) {
                if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                    console.debug(
                        '(this.respObs == null)\n'
                        +'Means that we already subscribed to an earlier moment in the Observable of Reponse.\n'
                        +'We will simply call the super.subscribe');
                }
            } else if (this.session.getCachedBySignature(this.signatureStr)) {
                if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                    console.debug(
                        '(this.lazyLoadedObj == null && this.respObs != null && this.session.getCachedBySignature(this.signatureStr)\n'
                        +'Means that we already loaded this object by signature with another lazyRef.\n'
                        +'We will get from session signature cache call next()');
                }
                thisLocal.respObs = null;
                thisLocal.lazyLoadedObj = <L> this.session.getCachedBySignature(this.signatureStr);
                thisLocal.next(thisLocal.lazyLoadedObj);
            } else {
                if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                    console.debug(
                        '(thisLocal.respObs != null)\n'
                        +'Means that we are not subscribed yet in the Observable of Reponse.\n'
                        +'this.respObs will be null after subscription, so we mark that '
                        +'there is already an inscription in the Response Observable, and we '+
                        'will not make two trips to the server');
                }
                let localObs: Observable<L> = thisLocal.respObs.flatMap(thisLocal.flatMapCallback);
                //assim marcaremos que ja ouve inscricao no Observable de response, e nao faremos duas idas ao servidor.
                thisLocal.respObs = null;

                let observerOrNextNew: PartialObserver<L> | ((value: L) => void) = null;
                if (observerOrNext instanceof Subscriber) {
                    observerOrNextNew = observerOrNext;
                    nextOriginal = (<Subscriber<L>>observerOrNext).next;
                    (<Subscriber<L>>observerOrNext).next = (value: L) => {
                        thisLocal.lazyLoadedObj = value;
                        if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                            console.group('(Asynchronous) LazyRef.subscribe() => modifiedNext (thisLocal.respObs != null)');
                            console.debug('calling nextOriginal()'); console.debug('this.next()'); console.debug(thisLocal.lazyLoadedObj);
                            console.groupEnd();
                        }
                        nextOriginal(thisLocal.lazyLoadedObj);
                        //aqui o metodo original sera chamado
                        thisLocal.next(thisLocal.lazyLoadedObj);
                    };

                    //o retorno disso nunca mais sera usado
                    if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                        console.group('(thisLocal.respObs != null)');
                        console.debug('localObs.subscribe() <-- The Subscription returned here will never be used again.'); console.debug(observerOrNextNew);
                        console.groupEnd();
                    }
                    localObs.subscribe(observerOrNextNew);
                } else {
                    nextOriginal = <(value: L) => void>observerOrNext;
                    observerOrNextNew = (value: L) => {
                        if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                            console.group('(Asynchronous) LazyRef.subscribe() => observerOrNextNew, (thisLocal.respObs != null)');
                            console.debug('calling nextOriginal()'); console.debug('this.next()'); console.debug(thisLocal.lazyLoadedObj);
                            console.groupEnd();
                        }

                        thisLocal.lazyLoadedObj = value;
                        nextOriginal(thisLocal.lazyLoadedObj);
                        //aqui o metodo original sera chamado
                        thisLocal.next(thisLocal.lazyLoadedObj);
                    };


                    //o retorno disso nunca mais sera usado
                    if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                        console.group('(thisLocal.respObs != null)');
                        console.debug('localObs.subscribe() <-- The Subscription returned here will never be used again.'); console.debug(observerOrNextNew); console.debug(error); console.debug(complete);
                        console.groupEnd();
                    }
                    localObs.subscribe(<(value: L) => void>observerOrNextNew, error, complete);
                }
            }
        } else {
            if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                console.debug(
                    '(thisLocal.lazyLoadedObj != null)\n'
                    +'It may mean that we already have subscribed yet in the Observable of Response\n '
                    +'or this was created with lazyLoadedObj already loaded.');
            }
            let observerOrNextNovo: PartialObserver<L> | ((value: L) => void) = null;
            if (observerOrNext instanceof Subscriber) {
                nextOriginal = (<Subscriber<L>>observerOrNext).next;
                (<Subscriber<L>>observerOrNext).next = (value: L) => {
                    nextOriginal(thisLocal.lazyLoadedObj);
                };
                observerOrNextNovo = observerOrNext;

                thisLocal.next(thisLocal.lazyLoadedObj);
            } else {
                nextOriginal = <(value: L) => void>observerOrNext;
                observerOrNextNovo = (value: L) => {
                    nextOriginal(thisLocal.lazyLoadedObj);
                };

                thisLocal.next(thisLocal.lazyLoadedObj);
            }
        }

        return resultSubs;
    }

    private subscriptionToChange: Subscription;

    subscribeToChange(observerOrNext?: PartialObserver<L> | ((value: L) => void),
        error?: (error: any) => void,
        complete?: () => void) {
        const thisLocal = this;

        let nextOriginal: (value: L) => void = null;

        let observerOrNextNovo: PartialObserver<L> | ((value: L) => void) = null;
        if (thisLocal.respObs != null || this.lazyLoadedObj == null) { //isso sim significa que ainda nao foi carregado.
            //AAAAASINCRONO!!!
            if (observerOrNext instanceof Subscriber) {
                observerOrNextNovo = observerOrNext;
                nextOriginal = (<Subscriber<L>>observerOrNext).next;
                (<Subscriber<L>>observerOrNext).next = (value: L) => {
                    if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                        console.group('(Asynchronous) LazyRef.subscribeToChange() => modifiedNext, (thisLocal.respObs != null)');
                        console.debug('calling nextOriginal()'); console.debug('this.subscriptionToChange.unsubscribe()'); console.debug('this.next()'); console.debug(thisLocal.lazyLoadedObj);
                        console.groupEnd();
                    }
                    thisLocal.lazyLoadedObj = value;
                    //chamada que ira alterar os dados Asincronamente
                    nextOriginal(thisLocal.lazyLoadedObj);
                    //isso garante que o comando de alteracao nao sera chamado duas vezes.
                    thisLocal.subscriptionToChange.unsubscribe();
                    //aqui todos os outros subscribes anteriores serao chamados. Os pipe async's por exemplo
                    thisLocal.next(thisLocal.lazyLoadedObj);
                };
                if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                    console.debug('Keeping Subscription from this.subscribe(observerOrNextNovo) on this.subscriptionToChange to make an unsubscribe() at the end of modifiedNext callback');
                }
                this.subscriptionToChange = this.subscribe(observerOrNextNovo);
            } else {
                nextOriginal = <(value: L) => void>observerOrNext;
                observerOrNextNovo = (value: L) => {
                    thisLocal.lazyLoadedObj = value;
                    //chamada que ira alterar os dados Asincronamente
                    nextOriginal(thisLocal.lazyLoadedObj);
                    //isso garante que o comando de alteracao nao sera chamado duas vezes.
                    thisLocal.subscriptionToChange.unsubscribe();
                    //aqui todos os outros subscribes anteriores serao chamados. Os pipe async's por exemplo
                    thisLocal.next(thisLocal.lazyLoadedObj);
                };
                this.subscriptionToChange = this.subscribe(<(value: L) => void>observerOrNextNovo, error, complete);
            }
        } else {
            //SSSSSINCRONO!!!
            if (JsHbLogLevel.Trace >= this.session.jsHbManager.jsHbConfig.logLevel) {
                console.group('(Synchronous) LazyRef.subscribeToChange()');
                console.debug('calling nextOriginal()'); console.debug('this.next()');;
                console.groupEnd();
            }
            if (observerOrNext instanceof Subscriber) {
                observerOrNextNovo = observerOrNext;
                nextOriginal = (<Subscriber<L>>observerOrNext).next;
                //chamada que ira alterar os dados Sincronamente
                nextOriginal(thisLocal.lazyLoadedObj);
                //aqui todos os outros observer's anteriores serao chamados. Os pipe async's por exemplo
                thisLocal.next(thisLocal.lazyLoadedObj);
            } else {
                nextOriginal = <(value: L) => void>observerOrNext;
                //chamada que ira alterar os dados Sincronamente
                nextOriginal(thisLocal.lazyLoadedObj);
                //aqui todos os outros observer's anteriores serao chamados. Os pipe async's por exemplo
                thisLocal.next(thisLocal.lazyLoadedObj);
            }
        }
    }

    // public subscribeAOriginal: () => Subscription;
    // public subscribeBOriginal: (observer: PartialObserver<L>) => Subscription;
    // public subscribeCOriginal: (next?: (value: L) => void, error?: (error: any) => void, complete?: () => void) => Subscription;

    // private subscribeA(): Subscription {
    //     return null;
    // }
    // private subscribeB(observer: PartialObserver<L>): Subscription {
    //     return null;
    // }
    // private subscribeC(next?: (value: L) => void, error?: (error: any) => void, complete?: () => void): Subscription {
    //     if (this.lazyLoadedObj == null) {
    //         next(this.lazyLoadedObj);
    //     } else {
    //         this.
    //     }
    //     return null;
    // }

    /**
      * Getter hbId
      * @return {I}
      */
    public get hbId(): I {
        return this._hbId;
    }

    /**
     * Getter lazyLoadedObj
     * @return {L}
     */
    public get lazyLoadedObj(): L {
        return this._lazyLoadedObj;
    }

    /**
     * Getter signatureStr
     * @return {String}
     */
    public get signatureStr(): String {
        return this._signatureStr;
    }

    /**
     * Getter respObs
     * @return {Observable<Response>}
     */
    public get respObs(): Observable<Response> {
        return this._respObs;
    }

    /**
     * Setter hbId
     * @param {I} value
     */
    public set hbId(value: I) {
        this._hbId = value;
    }

    /**
     * Setter lazyLoadedObj
     * @param {L} value
     */
    public set lazyLoadedObj(value: L) {
        this._lazyLoadedObj = value;
    }

    /**
     * Setter signatureStr
     * @param {String} value
     */
    public set signatureStr(value: String) {
        this._signatureStr = value;
    }

    /**
     * Setter respObs
     * @param {Observable<Response>} value
     */
    public set respObs(value: Observable<Response>) {
        this._respObs = value;
    }

    public set flatMapCallback(value: (response: Response) => Observable<L>) {
        this._flatMapCallback = value;
    }

    public get flatMapCallback(): (response: Response) => Observable<L> {
        return this._flatMapCallback;
    }


    /**
     * Getter refererObj
     * @return {any}
     */
	public get refererObj(): any {
		return this._refererObj;
	}

    /**
     * Setter refererObj
     * @param {any} value
     */
	public set refererObj(value: any) {
		this._refererObj = value;
	}

    /**
     * Getter refererKey
     * @return {string}
     */
	public get refererKey(): string {
		return this._refererKey;
	}

    /**
     * Setter refererKey
     * @param {string} value
     */
	public set refererKey(value: string) {
		this._refererKey = value;
    }
    

    /**
     * Getter session
     * @return {IJsHbSession}
     */
	public get session(): IJsHbSession {
		return this._session;
	}

    /**
     * Setter session
     * @param {IJsHbSession} value
     */
	public set session(value: IJsHbSession) {
		this._session = value;
	}

}