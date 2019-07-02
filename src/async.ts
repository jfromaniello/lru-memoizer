import LRU from 'lru-cache';
import { EventEmitter } from 'events';
import cloneDeep from 'lodash.clonedeep';
import { deepFreeze } from './freeze';
import { syncMemoizer } from './sync';
import { INodeStyleCallBack, ResultBase, IParamsBase} from './util';

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
  const loading    = new Map();
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

  function del(...args: any[]) {
    const key = hash(...args);
    cache.del(key);
  }

  function emit(event: string, ...parameters: any[]) {
    emitter.emit(event, ...parameters);
  }

  const result : IMemoizableFunction<T1, T2, T3, T4, T5, T6, TResult> = function (
    ...args: any[]
  ) {
    const parameters = args.slice(0, -1);
    const callback   = args.slice(-1).pop();
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

  // @ts-ignore
  return Object.assign(result, defaultResult);
}

asyncMemoizer.sync = syncMemoizer;

export { asyncMemoizer };
