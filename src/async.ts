import { LRUCache } from 'lru-cache';
import { EventEmitter } from 'events';
import cloneDeep from 'lodash.clonedeep';
import { deepFreeze } from './freeze';
import { syncMemoizer } from './sync';
import {
  INodeStyleCallBack as CB,
  ResultBase,
  IParamsBase0,
  IParamsBase1,
  IParamsBase2,
  IParamsBase3,
  IParamsBase4,
  IParamsBase5,
  IParamsBase6,
  IParamsBasePlus,
} from './util';

type Callback = (err?: any, ...args: any[]) => void;

type PendingLoad = {
  queue: Callback[];
  expiresAt: number;
};

export interface IMemoized<T1, T2, T3, T4, T5, T6, TResult> extends ResultBase {
  (cb: CB<TResult>): void;
  (a1: T1, cb: CB<TResult>): void;
  (a1: T1, a2: T2, cb: CB<TResult>): void;
  (a1: T1, a2: T2, a3: T3, cb: CB<TResult>): void;
  (a1: T1, a2: T2, a3: T3, a4: T4, cb: CB<TResult>): void;
  (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, cb: CB<TResult>): void;
  (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, cb: CB<TResult>): void;
}

interface IMemoizableFunction0<TResult> {
  (cb: CB<TResult>): void;
}
interface IMemoizableFunction1<T1, TResult> {
  (a1: T1, cb: CB<TResult>): void;
}
interface IMemoizableFunction2<T1, T2, TResult> {
  (a1: T1, a2: T2, cb: CB<TResult>): void;
}
interface IMemoizableFunction3<T1, T2, T3, TResult> {
  (a1: T1, a2: T2, a3: T3, cb: CB<TResult>): void;
}
interface IMemoizableFunction4<T1, T2, T3, T4, TResult> {
  (a1: T1, a2: T2, a3: T3, a4: T4, cb: CB<TResult>): void;
}
interface IMemoizableFunction5<T1, T2, T3, T4, T5, TResult> {
  (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, cb: CB<TResult>): void;
}
interface IMemoizableFunction6<T1, T2, T3, T4, T5, T6, TResult> {
  (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6, cb: CB<TResult>): void;
}
interface IMemoizableFunctionPlus {
  (...rest: any[]): void;
}

type AsyncParamsPlus = IParamsBasePlus & {
  load: IMemoizableFunctionPlus;
}
type AsyncParams0<TResult> = IParamsBase0<TResult> & {
  load: IMemoizableFunction0<TResult>;
}
type AsyncParams1<T1, TResult> = IParamsBase1<T1, TResult> & {
  load: IMemoizableFunction1<T1, TResult>;
}
type AsyncParams2<T1, T2, TResult> = IParamsBase2<T1, T2, TResult> & {
  load: IMemoizableFunction2<T1, T2, TResult>;
}
type AsyncParams3<T1, T2, T3, TResult>
  = IParamsBase3<T1, T2, T3, TResult> & {
  load: IMemoizableFunction3<T1, T2, T3, TResult>;
}
type AsyncParams4<T1, T2, T3, T4, TResult>
  = IParamsBase4<T1, T2, T3, T4, TResult> & {
  load: IMemoizableFunction4<T1, T2, T3, T4, TResult>;
}
type AsyncParams5<T1, T2, T3, T4, T5, TResult>
  = IParamsBase5<T1, T2, T3, T4, T5, TResult> & {
  load: IMemoizableFunction5<T1, T2, T3, T4, T5, TResult>;
}
type AsyncParams6<T1, T2, T3, T4, T5, T6, TResult>
  = IParamsBase6<T1, T2, T3, T4, T5, T6, TResult> & {
  /**
   * The function that loads the resource when is not in the cache.
   */
  load: IMemoizableFunction6<T1, T2, T3, T4, T5, T6, TResult>;
}

function asyncMemoizer<TResult>(
  options: AsyncParams0<TResult>
): IMemoized<unknown, unknown, unknown, unknown, unknown, unknown, TResult>;
function asyncMemoizer<T1, TResult>(
  options: AsyncParams1<T1, TResult>
): IMemoized<T1, unknown, unknown, unknown, unknown, unknown, TResult>;
function asyncMemoizer<T1, T2, TResult>(
  options: AsyncParams2<T1, T2, TResult>
): IMemoized<T1, T2, unknown, unknown, unknown, unknown, TResult>;
function asyncMemoizer<T1, T2, T3, TResult>(
  options: AsyncParams3<T1, T2, T3, TResult>
): IMemoized<T1, T2, T3, unknown, unknown, unknown, TResult>;
function asyncMemoizer<T1, T2, T3, T4, TResult>(
  options: AsyncParams4<T1, T2, T3, T4, TResult>
): IMemoized<T1, T2, T3, T4, unknown, unknown, TResult>;
function asyncMemoizer<T1, T2, T3, T4, T5, TResult>(
  options: AsyncParams5<T1, T2, T3, T4, T5, TResult>
): IMemoized<T1, T2, T3, T4, T5, unknown, TResult>;
function asyncMemoizer<T1, T2, T3, T4, T5, T6, TResult>(
  options: AsyncParams6<T1, T2, T3, T4, T5, T6, TResult>
): IMemoized<T1, T2, T3, T4, T5, T6, TResult>;
function asyncMemoizer<T1, T2, T3, T4, T5, T6, TResult>(
  options: AsyncParamsPlus
): IMemoized<T1, T2, T3, T4, T5, T6, TResult> {
  const cache      = new LRUCache(options);
  const load       = options.load;
  const hash       = options.hash;
  const bypass     = options.bypass;
  const itemMaxAge = options.itemMaxAge;
  const freeze     = options.freeze;
  const clone      = options.clone;
  const queueMaxAge = options.queueMaxAge || 1000;
  const loading    = new Map<string, PendingLoad>();
  const emitter    = new EventEmitter();

  const memoizerMethods = Object.assign({
    del,
    reset: () => cache.clear(),
    keys: () => [...cache.keys()],
    on: emitter.on.bind(emitter),
    once: emitter.once.bind(emitter)
  }, options);

  if (options.disable) {
    return Object.assign(load, memoizerMethods);
  }

  function del(...args: any[]) {
    const key = hash(...args);
    cache.delete(key);
  }

  function add(key: string, parameters: any[], result: any[]) {
    if (freeze) {
      result.forEach(deepFreeze);
    }

    if (itemMaxAge) {
      cache.set(key, result, {ttl: itemMaxAge(...parameters.concat(result))});
    } else {
      cache.set(key, result);
    }
  }

  function runCallbacks(callbacks: Callback[], args: any[]) {
    for (const callback of callbacks) {
      // Simulate async call when returning from cache
      // and yield between callback resolution
      if (clone) {
        setImmediate(callback, ...args.map(cloneDeep));
      } else {
        setImmediate(callback, ...args);
      }
    }
  }

  function emit(event: string, ...parameters: any[]) {
    emitter.emit(event, ...parameters);
  }

  function memoizedFunction(...args: any[]) {
    const parameters = args.slice(0, -1);
    const callback: Callback = args.slice(-1).pop();
    let key: string;

    if (bypass && bypass(...parameters)) {
      emit('miss', ...parameters);
      return load(...args);
    }

    if (parameters.length === 0 && !hash) {
      //the load function only receives callback.
      key = '_';
    } else {
      key = hash(...parameters);
    }

    const fromCache = cache.get(key);
    if (fromCache) {
      emit('hit', ...parameters);
      // found, invoke callback
      return runCallbacks([callback], [null].concat(fromCache));
    }

    const pendingLoad = loading.get(key);
    if (pendingLoad && pendingLoad.expiresAt > Date.now()) {
      // request already in progress, queue and return
      pendingLoad.queue.push(callback);
      emit('queue', ...parameters);
      return;
    }

    emit('miss', ...parameters);

    const started = Date.now();

    // no pending request or not resolved before expiration
    // create a new queue and invoke load
    const queue = [ callback ];
    loading.set(key, {
      queue,
      expiresAt: started + queueMaxAge
    });

    const loadHandler = (...args: any[]) => {
      const err = args[0];
      if (!err) {
        add(key, parameters, args.slice(1));
      }

      // this can potentially delete a different queue than `queue` if
      // this callback was called after expiration.
      // that will only cause a new call to be performed and a new queue to be
      // created
      loading.delete(key);

      emit('loaded', Date.now() - started, ...parameters);
      runCallbacks(queue, args);
    };

    load(...parameters, loadHandler);
  };

  return Object.assign(memoizedFunction, memoizerMethods);
}

asyncMemoizer.sync = syncMemoizer;

export { asyncMemoizer };
