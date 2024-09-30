import { LRUCache } from 'lru-cache';
import { EventEmitter } from 'events';
import deepClone from 'lodash.clonedeep';
import { deepFreeze } from './freeze';
import {
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

interface IMemoizedSync<T1, T2, T3, T4, T5, T6, TResult> extends ResultBase {
  (arg1: T1): TResult;
  (arg1: T1, arg2: T2): TResult;
  (arg1: T1, arg2: T2, arg3: T3): TResult;
  (arg1: T1, arg2: T2, arg3: T3, arg4: T4): TResult;
  (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5): TResult;
  (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6): TResult;
}

interface IMemoizableFunctionSync0<TResult> {
  (): TResult;
}
interface IMemoizableFunctionSync1<T1, TResult> {
  (arg1: T1): TResult;
}
interface IMemoizableFunctionSync2<T1, T2, TResult> {
  (arg1: T1, arg2: T2): TResult;
}
interface IMemoizableFunctionSync3<T1, T2, T3, TResult> {
  (arg1: T1, arg2: T2, arg3: T3): TResult;
}
interface IMemoizableFunctionSync4<T1, T2, T3, T4, TResult> {
  (arg1: T1, arg2: T2, arg3: T3, arg4: T4): TResult;
}
interface IMemoizableFunctionSync5<T1, T2, T3, T4, T5, TResult> {
  (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5): TResult;
}
interface IMemoizableFunctionSync6<T1, T2, T3, T4, T5, T6, TResult> {
  (a1: T1, a2: T2, a3: T3, a4: T4, a5: T5, a6: T6): TResult;
}
interface IMemoizableFunctionSyncPlus<TResult> {
  (...args: any[]): TResult;
}

export type SyncParams0<TResult> = IParamsBase0<TResult> & {
  load: IMemoizableFunctionSync0<TResult>;
}
export type SyncParams1<T1, TResult> = IParamsBase1<T1, TResult> & {
  load: IMemoizableFunctionSync1<T1, TResult>;
}
export type SyncParams2<T1, T2, TResult>
  = IParamsBase2<T1, T2, TResult> & {
  load: IMemoizableFunctionSync2<T1, T2, TResult>;
}
export type SyncParams3<T1, T2, T3, TResult>
  = IParamsBase3<T1, T2, T3, TResult> & {
  load: IMemoizableFunctionSync3<T1, T2, T3, TResult>;
}
export type SyncParams4<T1, T2, T3, T4, TResult>
  = IParamsBase4<T1, T2, T3, T4, TResult> & {
  load: IMemoizableFunctionSync4<T1, T2, T3, T4, TResult>;
}
export type SyncParams5<T1, T2, T3, T4, T5, TResult>
  = IParamsBase5<T1, T2, T3, T4, T5, TResult> & {
  load: IMemoizableFunctionSync5<T1, T2, T3, T4, T5, TResult>;
}
export type SyncParams6<T1, T2, T3, T4, T5, T6, TResult>
  = IParamsBase6<T1, T2, T3, T4, T5, T6, TResult>  & {
  load: IMemoizableFunctionSync6<T1, T2, T3, T4, T5, T6, TResult>;
}
export type SyncParamsPlus<TResult> = IParamsBasePlus & {
  load: IMemoizableFunctionSyncPlus<TResult>;
}
export function syncMemoizer<TResult>(
  options: SyncParams0<TResult>
): IMemoizedSync<unknown, unknown, unknown, unknown, unknown, unknown, TResult>;
export function syncMemoizer<T1, TResult>(
  options: SyncParams1<T1, TResult>
): IMemoizedSync<T1, unknown, unknown, unknown, unknown, unknown, TResult>;
export function syncMemoizer<T1, T2, TResult>(
  options: SyncParams2<T1, T2, TResult>
): IMemoizedSync<T1, T2, unknown, unknown, unknown, unknown, TResult>;
export function syncMemoizer<T1, T2, T3, TResult>(
  options: SyncParams3<T1, T2, T3, TResult>
): IMemoizedSync<T1, T2, T3, unknown, unknown, unknown, TResult>;
export function syncMemoizer<T1, T2, T3, T4, TResult>(
  options: SyncParams4<T1, T2, T3, T4, TResult>
): IMemoizedSync<T1, T2, T3, T4, unknown, unknown, TResult>;
export function syncMemoizer<T1, T2, T3, T4, T5, TResult>(
  options: SyncParams5<T1, T2, T3, T4, T5, TResult>
): IMemoizedSync<T1, T2, T3, T4, T5, unknown, TResult>;
export function syncMemoizer<T1, T2, T3, T4, T5, T6, TResult>(
  options: SyncParams6<T1, T2, T3, T4, T5, T6, TResult>
): IMemoizedSync<T1, T2, T3, T4, T5, T6, TResult>;
export function syncMemoizer<T1, T2, T3, T4, T5, T6, TResult>(
  options: SyncParamsPlus<TResult>
): IMemoizedSync<T1, T2, T3, T4, T5, T6, TResult> {
  const cache      = new LRUCache(options);
  const load       = options.load;
  const hash       = options.hash;
  const bypass     = options.bypass;
  const itemMaxAge = options.itemMaxAge;
  const freeze     = options.freeze;
  const clone      = options.clone;
  const emitter    = new EventEmitter();

  const defaultResult = Object.assign({
    del,
    reset: () => cache.clear(),
    keys: () => [...cache.keys()],
    on: emitter.on.bind(emitter),
    once: emitter.once.bind(emitter),
  }, options);

  if (options.disable) {
    return Object.assign(load, defaultResult);
  }

  function del() {
    const key = hash(...arguments);
    cache.delete(key);
  }

  function emit(event: string, ...parameters: any[]) {
    emitter.emit(event, ...parameters);
  }

  function isPromise(result: any): boolean {
    // detect native, bluebird, A+ promises
    return result && result.then && typeof result.then === 'function';
  }

  function processResult(result: any) {
    let res = result;

    if (clone) {
      if (isPromise(res)) {
        res = res.then(deepClone);
      } else {
        res = deepClone(res);
      }
    }

    if (freeze) {
      if (isPromise(res)) {
        res = res.then(deepFreeze);
      } else {
        deepFreeze(res);
      }
    }

    return res;
  }

  const result: IMemoizableFunctionSync6<T1, T2, T3, T4, T5, T6, TResult> = function (
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
      cache.set(key, result, {ttl: itemMaxAge(...args.concat([ result ]))});
    } else {
      cache.set(key, result);
    }

    return processResult(result);
  };

  return Object.assign(result, defaultResult) as any;
}
