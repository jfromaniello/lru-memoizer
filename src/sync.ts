import LRU from 'lru-cache';
import { EventEmitter } from 'events';
import deepClone from 'lodash.clonedeep';
import { deepFreeze } from './freeze';

export type SyncLoadFunction<TPar1, TPar2, TPar3, TResult> =
  (() => TResult) |
  ((arg: TPar1) => TResult) |
  ((arg1: TPar1, arg2: TPar2) => TResult) |
  ((arg1: TPar1, arg2: TPar2, arg3: TPar3) => TResult);

export interface SyncParams<TPar1, TPar2, TPar3, TResult> extends LRU.Options<string, any> {
  /**
   * The function that loads the resource when is not in the cache.
   */
  load: SyncLoadFunction<TPar1, TPar2, TPar3, TResult>;

  /**
   * A function to generate the key of the cache.
   */
  hash: (arg1?: TPar1, arg2?: TPar2, arg3?: TPar3) => string;

  /**
   * Return true if the result should not be retrieved from the cache.
   */
  bypass?: (arg1?: TPar1, arg2?: TPar2, arg3?: TPar3) => boolean;

  /**
   * An optional function to indicate the maxAge of an specific item.
   */
  itemMaxAge: ((result: TResult) => number) |
        ((arg: TPar1, result: TResult) => number) |
        ((arg1: TPar1, arg2: TPar2, result: TResult) => number) |
        ((arg1: TPar1, arg2: TPar2, arg3: TPar3, result: TResult) => number);

  /**
   * Indicates if the resource should be freezed.
   */
  freeze?: boolean;

  /**
   * Indicates if the resource should be cloned before is returned.
   */
  clone?: boolean;

  /**
   * Disable the cache and executes the load logic directly.
   */
  disable?: boolean;
}

export function syncMemoizer<TPar1, TPar2, TPar3, TResult>(
    options: SyncParams<TPar1, TPar2, TPar3, TResult>
) : SyncLoadFunction<TPar1, TPar2, TPar3, TResult> {
  const cache      = new LRU(options);
  const load       = options.load;
  const hash       = options.hash;
  const bypass     = options.bypass;
  const itemMaxAge = options.itemMaxAge;
  const freeze     = options.freeze;
  const clone      = options.clone;
  const emitter    = new EventEmitter();

  if (options.disable) {
    return Object.assign(load, { del }, options);
  }

  function del(arg1?: TPar1, arg2?: TPar2, arg3?: TPar3) {
    // @ts-ignore
    const key = hash(...arguments);
    cache.del(key);
  }

  function emit(event: string, ...parameters: any[]) {
    emitter.emit(event, ...parameters);
  }

  const result : SyncLoadFunction<TPar1, TPar2, TPar3, TResult> = function (
    ...args: any[]
  ) {
    if (bypass && bypass(...args)) {
      emit('miss', ...args);
      // @ts-ignore
      return load(...arguments);
    }

    var key = hash(...args);

    var fromCache = cache.get(key);

    if (fromCache) {
      emit('hit', ...args);

      return fromCache;
    }

    emit('miss', ...args);
    //@ts-ignore
    const result = load(...args);
    if (freeze) { deepFreeze(result); }
    if (clone) { deepClone(result); }
    if (itemMaxAge) {
      // @ts-ignore
      cache.set(key, result, itemMaxAge(...args.concat([ result ])));
    } else {
      cache.set(key, result);
    }

    return result;
  };

  return Object.assign(result, {
    del,
    keys: cache.keys.bind(cache),
    on: emitter.on.bind(emitter),
    once: emitter.once.bind(emitter)
  }, options);
}
