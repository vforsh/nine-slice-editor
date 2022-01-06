declare module Phaser {
	
	interface Scene {
		texts?: texts.En
		sentry?: import("../SentryWrapper").SentryWrapper
		analytics?: import("../GameAnalyticsWrapper").GameAnalyticsWrapper
		audio?: import("../audio/HowlerWrapper").HowlerWrapper
		resize?(): void
	}
}


