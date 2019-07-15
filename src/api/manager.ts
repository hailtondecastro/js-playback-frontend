import { RecorderConfig, ConsoleLike, RecorderLogLevel, RecorderLogger } from "./recorder-config";
import { IRecorderSession } from "./session";
import { LazyObservableProvider } from "./lazy-observable-provider";

/**
 * Contract.
 */
export interface IRecorderManager {
	/**
	 * Configuration.
	 */
	config: RecorderConfig;
	/**
	 * Creates a new session.
	 */
	createSession(): IRecorderSession;
	/**
	 * Adapter for your application.
	 */
	httpLazyObservableGen: LazyObservableProvider;
}
