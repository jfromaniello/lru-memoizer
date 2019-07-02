import LRU from 'lru-cache';
import { EventEmitter } from 'events';
import cloneDeep from 'lodash.clonedeep';
import { deepFreeze } from './freeze';
import { syncMemoizer } from './sync';

export type LoadFunction<TPar1, TPar2, TPar3, TCallback> =
  ((callback: TCallback) => void) |
  ((arg: TPar1, callback: TCallback) => void) |
  ((arg1: TPar1, arg2: TPar2, callback: TCallback) => void) |
  ((arg1: TPar1, arg2: TPar2, arg3: TPar3, callback: TCallback) => void);

export interface AsyncParams1<TPar1, TPar2, TPar3, TCallback> extends LRU.Options<string, any> {
  /**
   * The function that loads the resource when is not in the cache.
   */
  load: LoadFunction<TPar1, TPar2, TPar3, TCallback>;

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
  itemMaxAge: ((...results: any[]) => number) |
        ((arg: TPar1, ...results: any[]) => number) |
        ((arg1: TPar1, arg2: TPar2, ...results: any[]) => number) |
        ((arg1: TPar1, arg2: TPar2, arg3: TPar3, ...results: any[]) => number);

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

function asyncMemoizer<TPar1, TPar2, TPar3, TCallback>(
    options: AsyncParams1<TPar1, TPar2, TPar3, TCallback>
) : LoadFunction<TPar1,TPar2,TPar3,TCallback> {
  const cache      = new LRU(options);
  const load       = options.load;
  const hash       = options.hash;
  const bypass     = options.bypass;
  const itemMaxAge = options.itemMaxAge;
  const freeze     = options.freeze;
  const clone      = options.clone;
  const loading    = new Map();
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

  const result : LoadFunction<TPar1, TPar2, TPar3, TCallback> = function (
    ...args: any[]
  ) {
    const parameters = args.slice(0, -1);
    const callback   = args.slice(-1).pop();
    let key: string;

    if (bypass && bypass(...parameters)) {
      emit('miss', ...parameters);
      // @ts-ignore
      return load(...args);
    }

    if (parameters.length === 0 && !hash) {
      //the load function only receives callback.
      key = '_';
    } else {
      key = hash(...parameters);
    }

    var fromCache = cache.get(key);

    if (fromCache) {
      emit('hit', ...parameters);

      if (clone) {
        return callback(...[null].concat(fromCache).map(cloneDeep));
      }
      return callback(...[null].concat(fromCache));
    }

    if (!loading.get(key)) {
      emit('miss', ...parameters);

      loading.set(key, []);

      // @ts-ignore
      load(...parameters.concat((...args: any[]) => {
        const err = args[0];
        //we store the result only if the load didn't fail.
        if (!err) {
          const result = args.slice(1);
          if (freeze) {
            args.forEach(deepFreeze);
          }
          if (itemMaxAge) {
            // @ts-ignore
            cache.set(key, result, itemMaxAge(...parameters.concat(result)));
          } else {
            cache.set(key, result);
          }
        }

        //immediately call every other callback waiting
        const waiting = loading.get(key).concat(callback);
        loading.delete(key);
        waiting.forEach(function (callback: Function) {
          if (clone) {
            return callback(...args.map(cloneDeep));
          }
          callback(...args);
        });
        /////////

      }));
    } else {
      emit('queue', ...parameters);

      loading.get(key).push(callback);
    }
  };

  return Object.assign(result, {
    del,
    keys: cache.keys.bind(cache),
    on: emitter.on.bind(emitter),
    once: emitter.once.bind(emitter)
  }, options);
}

asyncMemoizer.sync = syncMemoizer;

export { asyncMemoizer };
