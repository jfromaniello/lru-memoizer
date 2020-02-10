import LRU from 'lru-cache';
import { EventEmitter } from 'events';
import cloneDeep from 'lodash.clonedeep';
import { deepFreeze } from './freeze';
import { syncMemoizer } from './sync';
import { INodeStyleCallBack, ResultBase, IParamsBase} from './util';

type Callback = (err?: any, ...args: any[]) => void;

type PendingLoad = {
  queue: Callback[];
  expiresAt: number;
}

interface IMemoized<T1, T2, T3, T4, T5, T6, TResult> extends ResultBase {
  (arg1: T1, cb: INodeStyleCallBack<TResult>): void;
  (arg1: T1, arg2: T2, cb: INodeStyleCallBack<TResult>): void;
  (arg1: T1, arg2: T2, arg3: T3, cb: INodeStyleCallBack<TResult>): void;
  (arg1: T1, arg2: T2, arg3: T3, arg4: T4, cb: INodeStyleCallBack<TResult>): void;
  (
      arg1: T1,
      arg2: T2,
      arg3: T3,
      arg4: T4,
      arg5: T5,
      cb: INodeStyleCallBack<TResult>
  ): void;
  (
      arg1: T1,
      arg2: T2,
      arg3: T3,
      arg4: T4,
      arg5: T5,
      arg6: T6,
      cb: INodeStyleCallBack<TResult>
  ): void;
}

interface IMemoizableFunction<T1, T2, T3, T4, T5, T6, TResult> {
  (cb: INodeStyleCallBack<TResult>): void;
  (arg1: T1, cb: INodeStyleCallBack<TResult>): void;
  (arg1: T1, arg2: T2, cb: INodeStyleCallBack<TResult>): void;
  (
      arg1: T1,
      arg2: T2,
      arg3: T3,
      cb: INodeStyleCallBack<TResult>
  ): void;
  (
      arg1: T1,
      arg2: T2,
      arg3: T3,
      arg4: T4,
      cb: INodeStyleCallBack<TResult>
  ): void;
  (
      arg1: T1,
      arg2: T2,
      arg3: T3,
      arg4: T4,
      arg5: T5,
      cb: INodeStyleCallBack<TResult>
  ): void;
  (
      arg1: T1,
      arg2: T2,
      arg3: T3,
      arg4: T4,
      arg5: T5,
      arg6: T6,
      cb: INodeStyleCallBack<TResult>
  ): void;
  (...rest: any[]): void;
}

interface AsyncParams<T1, T2, T3, T4, T5, T6, TResult> extends IParamsBase<T1, T2, T3, T4, T5, T6, TResult> {
  /**
   * The function that loads the resource when is not in the cache.
   */
  load: IMemoizableFunction<T1, T2, T3, T4, T5, T6, TResult>;
}

function asyncMemoizer<T1, T2, T3, T4, T5, T6, TResult>(
    options: AsyncParams<T1, T2, T3, T4, T5, T6, TResult>
) : IMemoized<T1, T2, T3, T4, T5, T6, TResult> {
  const cache      = new LRU(options);
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
    reset: () => cache.reset(),
    keys: cache.keys.bind(cache),
    on: emitter.on.bind(emitter),
    once: emitter.once.bind(emitter)
  }, options);

  if (options.disable) {
    return Object.assign(load, memoizerMethods);
  }

  function del(...args: any[]) {
    const key = hash(...args);
    cache.del(key);
  }

  function add(key: string, parameters: any[], result: any[]) {
    if (freeze) {
      result.forEach(deepFreeze);
    }

    if (itemMaxAge) {
      cache.set(key, result, itemMaxAge(...parameters.concat(result)));
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

    // no pending request or not resolved before expiration
    // create a new queue and invoke load
    const queue = [ callback ];
    loading.set(key, {
      queue,
      expiresAt: Date.now() + queueMaxAge
    });

    const started = Date.now();
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
