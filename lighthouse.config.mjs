export const lighthouseLab = Object.freeze({
  viewport: { width: 360, height: 640, deviceScaleFactor: 2.625, mobile: true, disabled: false },
  throttling: {
    rttMs: 150,
    throughputKbps: 1638.4,
    requestLatencyMs: 150,
    downloadThroughputKbps: 1638.4,
    uploadThroughputKbps: 750,
    cpuSlowdownMultiplier: 4,
  },
  runs: 3,
  budgets: { performance: 0.9, lcpMs: 2500, cls: 0.1, tbtMs: 200 },
});

export function createLighthouseConfig(extraHeaders = {}) {
  return {
    extends: "lighthouse:default",
    settings: {
      onlyCategories: ["performance"],
      formFactor: "mobile",
      screenEmulation: lighthouseLab.viewport,
      throttling: lighthouseLab.throttling,
      throttlingMethod: "simulate",
      disableStorageReset: false,
      extraHeaders,
    },
  };
}
