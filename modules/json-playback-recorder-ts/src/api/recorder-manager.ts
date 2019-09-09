import { RecorderConfig } from "./recorder-config";
import { RecorderSession } from "./recorder-session";

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
}
