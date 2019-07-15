import { IConfig, ConsoleLike, RecorderLogLevel, RecorderLogger } from "./config";
import { IRecorderSession } from "./session";
import { LazyObservableProvider } from "./lazy-observable-provider";

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
	httpLazyObservableGen: LazyObservableProvider;
}
