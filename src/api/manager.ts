import { IConfig, ConsoleLike, RecorderLogLevel, RecorderLogger } from "./config";
import { IRecorderSession } from "./session";
import { IHttpResponseLazyObservableGen } from "./js-hb-http-lazy-observable-gen";

/**
 * Contract.
 */
export interface IRecorderManager {
	/**
	 * Configuration.
	 */
	config: IConfig;
	/**
	 * Creates a new session.
	 */
	createSession(): IRecorderSession;
	/**
	 * Adapter for your application.
	 */
	httpLazyObservableGen: IHttpResponseLazyObservableGen;
}
