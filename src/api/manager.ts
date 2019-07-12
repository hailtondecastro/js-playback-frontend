import { IConfig, ConsoleLike, JsHbLogLevel, RecorderLogger } from "./config";
import { ISession } from "./session";
import { IJsHbHttpLazyObservableGen } from "./js-hb-http-lazy-observable-gen";

/**
 * Contract.
 */
export interface IManager {
	/**
	 * Configuration.
	 */
	config: IConfig;
	/**
	 * Creates a new session.
	 */
	createSession(): ISession;
	/**
	 * Adapter for your application.
	 */
	httpLazyObservableGen: IJsHbHttpLazyObservableGen;
}
