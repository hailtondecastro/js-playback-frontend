import { IRecorderManager } from "./manager";
import { TypeLike } from "../typeslike";
import { Observable } from "rxjs";
import { Stream } from "stream";
import { ITape } from "./tape";


export interface EntityRef {
    iAmAnEntityRef: true;
    signatureStr?: string;
    creationId?: number;
}

export interface OriginalLiteralValueEntry {
    method: 'processResultEntity' | 'processResultEntityArray' | 'newEntityInstance' | 'lazyRef';
    reflectFunctionMetadataTypeKey?: string;
    ownerSignatureStr?: string;
    ownerFieldName?: string;
    literalResult?: {result: any};
    attachRefId?: string;
    ref?: EntityRef;
}

export interface SessionState {
    sessionId: string;
    nextCreationId: number;
    originalLiteralValueEntries: Array<OriginalLiteralValueEntry>
    latestPlaybackArrAsLiteral: Array<any>;
    currentTapeAsLiteral?: any;
}

/**
 * Contract
 */
export interface IRecorderSession {
    /**
     * Manager.
     */
    jsHbManager: IRecorderManager;
    /**
     * Process the response body literal object getted from backend.  
     * Body format: { result: any }.  
     * Creates all the {@link ./lazy-ref#LazyRef} and {@link ./lazy-ref#LazyRefOTM} for the L instance.  
     * it call {@link #storeOriginalLiteralEntry)} for a future {@link this#restoreEntireStateFromLiteral}.  
     * @param entityType - TypeLike<L>
     * @param literalResult a literal object with format { result: any }
     */
    processResultEntity<L>(entityType: TypeLike<L>, literalResult: {result: any}): Observable<L>;
    /**
     * Process the response body literal for each object getted from backend.  
     * Body format: \{ result: Array<any> \}.  
     * Creates all the {@link ./lazy-ref#LazyRef} and {@link ./lazy-ref#LazyRefOTM} for the L instance.  
     * It call {@link this#storeOriginalLiteralEntry} for a future {@link this#restoreEntireStateFromLiteral}.  
     *
     * @param entityType - TypeLike<L>
     * @param literalResult - \{result: any\}
     * @returns Array<L>
     */
    processResultEntityArray<L>(entityType: TypeLike<L>, literalResult: {result: any}): Observable<Array<L>>;
    /**
     * Generate a managed instance for type T.  
     * Creates all the {@link ./lazy-ref#LazyRef} and {@link ./lazy-ref#LazyRefOTM} for the T instance.
     * 
     * @param entityType - \{TypeLike<T>\} 
     * @returns T
     */
    newEntityInstance<T extends object>(entityType: TypeLike<T>): Observable<T>;
    /**
     * Start recording for all modifications on entity objects returned.  
     * See: {@link this#getLastRecordedTape}  
     * See: {@link this#getLastRecordedTapeAsLiteral}
     */
    startRecording(): void;
    /**
     * Stop recording for all modifications on entity objects returned.  
     * See: {@link this#getLastRecordedTape}  
     * See: {@link this#getLastRecordedTapeAsLiteral}
     */
    stopRecording(): void;
    /**
     * Generate recoverable JSONParsable literal object that can be used
     * on {@link this#restoreEntireStateFromLiteral} to restore the session
     * state including all cached entity instance and all modifications.
     *
     * @returns recoverable JSONParsable literal object
     */
    generateEntireStateAsLiteral(): Observable<any>;
    /**
     * Restore the session state using the object state generated by
     * {@link this#getEntireStateAsLiteral}.
     *
     * @param {*} literalState
     */
    restoreEntireStateFromLiteral(literalState: any):  Observable<void>;
    /**
     * Creates a recoverable JSONParsable literal object that can be used
     * after {@link this#restoreEntireStateFromLiteral} on
     * {@link this#getEntityInstanceFromLiteralRef}.
     *
     * @param realEntity - T
     */
    createLiteralRefForEntity<T>(realEntity: T): any;
    /**
     * Get the managed instance for literalRef  
     * 
     * See:  
     * {@link this#generateEntireStateAsLiteral}  
     * {@link this#restoreEntireStateFromLiteral}  
     * {@link this#createLiteralRefForEntity}  
     *
     * @param literalRef - any
     * @returns
     */
    getEntityInstanceFromLiteralRef<T>(literalRef: any): T;
    /**
     * Get all recorded modifications between last calls for {@link this#startRecording} 
     * and {@link this#stopRecording}.
     *
     * @returns {ITape}
     */
    getLastRecordedTape(): Observable<ITape>;
    getLastRecordedStreams(): Observable<Map<String, Stream>>;
    getLastRecordedTapeAndStreams(): Observable<{tape: ITape, streams: Map<String, Stream>}>;
    /**
     * Equivalent to {@link this#getLastRecordedTape} with recoverable
     * JSONParsable literal object return.
     *
     * @returns
     */
    getLastRecordedTapeAsLiteral(): Observable<any>;
    getLastRecordedTapeAsLiteralAndStreams(): Observable<{tapeLiteral: any, streams: Map<String, Stream>}>;
    /**
     * Record action equivalente to 'org.hibernate.Session.save()'.
     *
     * @param entity - 
     */
    recordSave(entity: any): void;
    /**
     * Record action equivalente to 'org.hibernate.Session.delete()'.
     *
     * @param entity -
     */
    recordDelete(entity: any): void;
    /**
     * Clear/release all data for the session including cached e modifications recorded.
     */
    clear(): void;
    /**
     * Switch off the the modifying notification for this entity.  
     * Each entity property set trigger {@link LazyRef#next} for all related 
     * {@link LazyRef}, so this can introduce some script over processing,
     * this method is a workaround for this problem.
     * 
     * @param entity 
     */
    switchOffNotifyAllLazyrefs(entity: object): void;
    /**
     * Switch on the the modifying notification for this entity.  
     * Calls {@link this#notifyAllLazyrefsAboutEntityModification}.  
     * See {@link this#switchOffNotifyAllLazyrefs}.
     * @param entity 
     */
    switchOnNotifyAllLazyrefs(entity: object): void;
    getLastRecordedAtaches(): Map<String, Stream>;
    /**
     * Generate an Observable for waiting all internal async task.  
     * Use it be notified about completion of all inernal async tasks.
     */
    createAsyncTasksWaiting(): Observable<void>;
    /**
     * Generate an Observable for waiting all internal async task.  
     * Each observable is just started after before.  
     * Use it be notified about completion of all inernal async tasks.
     */
    createSerialAsyncTasksWaiting(): Observable<void>;
}