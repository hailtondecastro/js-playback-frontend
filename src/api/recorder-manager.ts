import { RecorderConfig, ConsoleLike, RecorderLogLevel, RecorderLogger } from "./recorder-config";
import { RecorderSession } from "./session";
import { LazyObservableProvider } from "./lazy-observable-provider";

/**
 * Contract.
 */
export interface RecorderManager {
	/**
	 * Configuration.
	 */
	config: RecorderConfig;
	/**
	 * Creates a new session.
	 */
	createSession(): RecorderSession;
	/**
	 * Adapter for your application.
	 */
	httpLazyObservableGen: LazyObservableProvider;
}
