import LRU from 'lru-cache';
import { EventEmitter } from 'events';
import deepClone from 'lodash.clonedeep';
import { deepFreeze } from './freeze';
import { ResultBase, IParamsBase} from './util';

interface IMemoizedSync<T1, T2, T3, T4, T5, T6, TResult> extends ResultBase {
  (arg1: T1): TResult;
  (arg1: T1, arg2: T2): TResult;
  (arg1: T1, arg2: T2, arg3: T3): TResult;
  (arg1: T1, arg2: T2, arg3: T3, arg4: T4): TResult;
  (
      arg1: T1,
      arg2: T2,
      arg3: T3,
      arg4: T4,
      arg5: T5
  ): TResult;
  (
      arg1: T1,
      arg2: T2,
      arg3: T3,
      arg4: T4,
      arg5: T5,
      arg6: T6
  ): TResult;
}


interface IMemoizableFunctionSync<T1, T2, T3, T4, T5, T6, TResult> {
  (): TResult;
  (arg1: T1): TResult;
  (arg1: T1, arg2: T2): TResult;
  (arg1: T1, arg2: T2, arg3: T3): TResult;
  (arg1: T1, arg2: T2, arg3: T3, arg4: T4): TResult;
  (
      arg1: T1,
      arg2: T2,
      arg3: T3,
      arg4: T4,
      arg5: T5
  ): TResult;
  (
      arg1: T1,
      arg2: T2,
      arg3: T3,
      arg4: T4,
      arg5: T5,
      arg6: T6
  ): TResult;
  ( ...args: any[] ): TResult;
}

export interface SyncParams<T1, T2, T3, T4, T5, T6, TResult> extends IParamsBase<T1, T2, T3, T4, T5, T6, TResult> {
  /**
   * The function that loads the resource when is not in the cache.
   */
  load: IMemoizableFunctionSync<T1, T2, T3, T4, T5, T6, TResult>;
}

export function syncMemoizer<T1, T2, T3, T4, T5, T6, TResult>(
    options: SyncParams<T1, T2, T3, T4, T5, T6, TResult>
) : IMemoizedSync<T1, T2, T3, T4, T5, T6, TResult> {
  const cache      = new LRU(options);
  const load       = options.load;
  const hash       = options.hash;
  const bypass     = options.bypass;
  const itemMaxAge = options.itemMaxAge;
  const freeze     = options.freeze;
  const clone      = options.clone;
  const emitter    = new EventEmitter();

  const defaultResult = Object.assign({
    del,
    reset: () => cache.reset(),
    keys: cache.keys.bind(cache),
    on: emitter.on.bind(emitter),
    once: emitter.once.bind(emitter)
  }, options);

  if (options.disable) {
    return Object.assign(load, defaultResult);
  }

  function del() {
    const key = hash(...arguments);
    cache.del(key);
  }

  function emit(event: string, ...parameters: any[]) {
    emitter.emit(event, ...parameters);
  }

  function processResult(result: any) {
    let res = result;

    if (clone) {
      if (res instanceof Promise) {
        res = res.then(deepClone);
      } else {
        res = deepClone(res);
      }
    }

    if (freeze) {
      if (res instanceof Promise) {
        res = res.then(deepFreeze);
      } else {
        deepFreeze(res);
      }
    }

    return res;
  }

  const result : IMemoizableFunctionSync<T1, T2, T3, T4, T5, T6, TResult> = function (
    ...args: any[]
  ) {

    if (bypass && bypass(...args)) {
      emit('miss', ...args);
      return load(...args);
    }

    var key = hash(...args);

    var fromCache = cache.get(key);

    if (fromCache) {
      emit('hit', ...args);

      return processResult(fromCache);
    }

    emit('miss', ...args);
    const result = load(...args);

    if (itemMaxAge) {
      // @ts-ignore
      cache.set(key, result, itemMaxAge(...args.concat([ result ])));
    } else {
      cache.set(key, result);
    }

    return processResult(result);
  };

  return Object.assign(result, defaultResult);
}
