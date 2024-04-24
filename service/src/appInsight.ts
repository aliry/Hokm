import * as appInsights from 'applicationinsights';

let aiClient: appInsights.TelemetryClient | undefined;

if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
  const isDevMode = process.env.NODE_ENV === 'development';
  appInsights
    .setup()
    .setAutoCollectRequests(true)
    .setAutoCollectExceptions(true)
    .setAutoCollectPerformance(false, false)
    .setAutoCollectConsole(true, true)
    .setUseDiskRetryCaching(true)
    .setSendLiveMetrics(isDevMode)
    //.setInternalLogging(isDevMode, isDevMode)
    .start();

  aiClient = appInsights.defaultClient;
}

process.on('uncaughtException', (error: Error) => {
  aiClient?.trackException({ exception: error });
});

process.on('unhandledRejection', (reason: any) => {
  aiClient?.trackException({ exception: reason });
});

export { aiClient };
