var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/contrib.js
var KEY = "items-v1";
var MAX = 3e3;
var J = /* @__PURE__ */ __name((o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } }), "J");
var ID = /^[a-z]{2,16}$/;
var ARCH = ["push", "dive", "poke", "fight", "protect", "split", "counter", "pick", ""];
var clean = /* @__PURE__ */ __name((s, n) => String(s || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, n), "clean");
async function load(env) {
  return await env.CONTRIB.get(KEY, "json") || [];
}
__name(load, "load");
async function limited(env, ip, kind, max) {
  const k = `rl:${kind}:${ip}:${Math.floor(Date.now() / 6e5)}`;
  const n = +await env.CONTRIB.get(k) || 0;
  if (n >= max) return true;
  await env.CONTRIB.put(k, String(n + 1), { expirationTtl: 900 });
  return false;
}
__name(limited, "limited");
async function onGet(env) {
  if (!env.CONTRIB) return J({ error: "nokv" }, 503);
  const items = await load(env);
  return J({ items: items.filter((x) => x.up - x.down > -3).map(({ voters, ...x }) => x) });
}
__name(onGet, "onGet");
async function onPost(request, env) {
  if (!env.CONTRIB) return J({ error: "nokv" }, 503);
  let b;
  try {
    b = await request.json();
  } catch {
    return J({ error: "bad json" }, 400);
  }
  const ip = request.headers.get("cf-connecting-ip") || "x";
  const dev = clean(b.dev, 40) || ip;
  const items = await load(env);
  if (b.action === "vote") {
    if (await limited(env, ip, "v", 60)) return J({ error: "B\u1EA1n b\xECnh ch\u1ECDn nhanh qu\xE1, th\u1EED l\u1EA1i sau \xEDt ph\xFAt" }, 429);
    const it = items.find((x) => x.id === b.id);
    if (!it) return J({ error: "not found" }, 404);
    it.voters = it.voters || {};
    const old = it.voters[dev] || 0, v = b.v > 0 ? 1 : b.v < 0 ? -1 : 0;
    if (old === 1) it.up--;
    if (old === -1) it.down--;
    if (v === 1) it.up++;
    if (v === -1) it.down++;
    if (v) it.voters[dev] = v;
    else delete it.voters[dev];
    await env.CONTRIB.put(KEY, JSON.stringify(items));
    return J({ ok: true, up: it.up, down: it.down, my: v });
  }
  if (b.action === "add") {
    if (await limited(env, ip, "a", 8)) return J({ error: "B\u1EA1n g\u1EEDi nhi\u1EC1u qu\xE1, ngh\u1EC9 10 ph\xFAt r\u1ED3i g\u1EEDi ti\u1EBFp nh\xE9" }, 429);
    const type = b.type, text = clean(b.text, 280), nick = clean(b.nick, 24);
    const it = { id: crypto.randomUUID().slice(0, 8), type, text, nick, up: 1, down: 0, ts: Date.now(), voters: { [dev]: 1 } };
    if (type === "counter" || type === "combo") {
      if (!ID.test(b.a) || !ID.test(b.b) || b.a === b.b) return J({ error: "Ch\u1ECDn \u0111\u1EE7 2 t\u01B0\u1EDBng kh\xE1c nhau" }, 400);
      it.a = b.a;
      it.b = b.b;
      if (type === "combo" && it.a > it.b) [it.a, it.b] = [it.b, it.a];
      const dup = items.find((x) => x.type === type && x.a === it.a && x.b === it.b && x.text.toLowerCase() === text.toLowerCase());
      if (dup) return J({ error: "G\xF3p \xFD n\xE0y \u0111\xE3 c\xF3 \u2014 h\xE3y b\u1EA5m \u{1F44D} cho n\xF3" }, 409);
    } else if (type === "comp") {
      const hs = [...new Set((b.heroes || []).filter((h) => ID.test(h)))].slice(0, 5);
      if (hs.length < 2) return J({ error: "B\xE0i \u0111\xE1nh c\u1EA7n \xEDt nh\u1EA5t 2 t\u01B0\u1EDBng" }, 400);
      it.heroes = hs;
      it.arch = ARCH.includes(b.arch) ? b.arch : "";
    } else return J({ error: "Lo\u1EA1i g\xF3p \xFD kh\xF4ng h\u1EE3p l\u1EC7" }, 400);
    if (text.length < 8) return J({ error: "Vi\u1EBFt l\xFD do/c\xE1ch \u0111\xE1nh d\xE0i h\u01A1n ch\xFAt (\xEDt nh\u1EA5t 8 k\xFD t\u1EF1)" }, 400);
    items.unshift(it);
    if (items.length > MAX) items.sort((x, y) => y.up - y.down - (x.up - x.down) || y.ts - x.ts).length = MAX;
    await env.CONTRIB.put(KEY, JSON.stringify(items));
    const { voters, ...pub } = it;
    return J({ ok: true, item: pub });
  }
  return J({ error: "unknown action" }, 400);
}
__name(onPost, "onPost");
var contrib_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/contrib") {
      try {
        if (request.method === "GET") return await onGet(env);
        if (request.method === "POST") return await onPost(request, env);
        return J({ error: "method" }, 405);
      } catch (e) {
        return J({ error: "L\u1ED7i m\xE1y ch\u1EE7: " + e.message }, 500);
      }
    }
    return env.ASSETS.fetch(request);
  }
};

// ../../../tmp/wt/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../tmp/wt/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-Sgfiwo/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = contrib_default;

// ../../../tmp/wt/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-Sgfiwo/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=contrib.js.map
