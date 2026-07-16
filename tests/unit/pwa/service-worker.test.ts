import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

import { describe, expect, it } from "vitest";

type FetchListener = (event: {
  request: { method: string; mode: string; url: string };
  respondWith: (response: Promise<FakeResponse>) => void;
}) => void;

type FakeResponse = Readonly<{
  ok: boolean;
  clone: () => FakeResponse;
}>;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe("Service Worker", () => {
  it("lädt versionierte Next-Assets zuerst aus dem Netzwerk", async () => {
    const source = readFileSync("public/sw.js", "utf8");
    const listeners = new Map<string, (event: never) => void>();
    const cachedResponse: FakeResponse = { ok: true, clone: () => cachedResponse };
    const networkResponse: FakeResponse = { ok: true, clone: () => networkResponse };
    let fetchCalls = 0;
    let responsePromise: Promise<FakeResponse> | undefined;

    runInNewContext(source, {
      URL,
      caches: {
        match: () => Promise.resolve(cachedResponse),
        open: () => Promise.resolve({ put: () => Promise.resolve() }),
      },
      fetch: () => {
        fetchCalls += 1;
        return Promise.resolve(networkResponse);
      },
      self: {
        addEventListener: (type: string, listener: (event: never) => void) => {
          listeners.set(type, listener);
        },
        location: { origin: "https://app.test" },
      },
    });

    const fetchListener = listeners.get("fetch") as FetchListener | undefined;
    fetchListener!({
      request: {
        method: "GET",
        mode: "no-cors",
        url: "https://app.test/_next/static/app.css",
      },
      respondWith: (value) => {
        responsePromise = value;
      },
    });

    expect(await responsePromise).toBe(networkResponse);
    expect(fetchCalls).toBe(1);
  });

  it("klont öffentliche Netzwerkantworten, bevor der Browser ihren Body verwendet", async () => {
    const source = readFileSync("public/sw.js", "utf8");
    const listeners = new Map<string, (event: never) => void>();
    const cacheOpening = deferred<{ put: () => Promise<void> }>();
    let responsePromise: Promise<FakeResponse> | undefined;
    let responseBodyUsed = false;
    let clonedAfterUse = false;

    const response: FakeResponse = {
      ok: true,
      clone: () => {
        clonedAfterUse = responseBodyUsed;
        return response;
      },
    };

    runInNewContext(source, {
      URL,
      caches: {
        match: () => Promise.resolve(undefined),
        open: () => cacheOpening.promise,
      },
      fetch: () => Promise.resolve(response),
      self: {
        addEventListener: (type: string, listener: (event: never) => void) => {
          listeners.set(type, listener);
        },
        location: { origin: "https://app.test" },
      },
    });

    const fetchListener = listeners.get("fetch") as FetchListener | undefined;
    expect(fetchListener).toBeDefined();
    fetchListener!({
      request: {
        method: "GET",
        mode: "no-cors",
        url: "https://app.test/_next/static/app.js",
      },
      respondWith: (value) => {
        responsePromise = value;
      },
    });

    expect(responsePromise).toBeDefined();
    void responsePromise!.then(() => {
      responseBodyUsed = true;
    });
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    cacheOpening.resolve({ put: () => Promise.resolve() });
    await responsePromise;
    await Promise.resolve();

    expect(clonedAfterUse).toBe(false);
  });
});
