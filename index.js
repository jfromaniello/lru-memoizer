const LRU        = require('lru-cache');
const _          = require('lodash');
const events    = require('events');
const lru_params = [ 'max', 'maxAge', 'length', 'dispose', 'stale' ];
const deepFreeze = require('./lib/freeze');
const vfs        = require('very-fast-args');

module.exports = function (options) {
  const cache      = new LRU(_.pick(options, lru_params));
  const load       = options.load;
  const hash       = options.hash;
  const bypass     = options.bypass;
  const itemMaxAge = options.itemMaxAge;
  const freeze     = options.freeze;
  const clone      = options.clone;
  const loading    = new Map();
  const emitter    = new events.EventEmitter();

  if (options.disable) {
      _.extend(load, { del }, options);
    return load;
  }

  function del() {
    const key = hash.apply(this, arguments);
    cache.del(key);
  }

  function emit(event, parameters) {
    emitter.emit.apply(emitter, [event].concat(parameters))
  }

  const result = function () {
    const args       = vfs.apply(null, arguments);
    const parameters = args.slice(0, -1);
    const callback   = args.slice(-1).pop();
    const self       = this;

    var key;

    if (bypass && bypass.apply(self, parameters)) {
      emit('miss', parameters);

      return load.apply(self, args);
    }

    if (parameters.length === 0 && !hash) {
      //the load function only receives callback.
      key = '_';
    } else {
      key = hash.apply(self, parameters);
    }

    var fromCache = cache.get(key);

    if (fromCache) {
      emit('hit', parameters);

      if (clone) {
        return callback.apply(null, [null].concat(fromCache).map(_.cloneDeep));
      }
      return callback.apply(null, [null].concat(fromCache));
    }

    if (!loading.get(key)) {
      emit('miss', parameters);

      loading.set(key, []);

      load.apply(self, parameters.concat(function (err) {
        const args = vfs.apply(null, arguments);

        //we store the result only if the load didn't fail.
        if (!err) {
          const result = args.slice(1);
          if (freeze) {
            args.forEach(deepFreeze);
          }
          if (itemMaxAge) {
            cache.set(key, result, itemMaxAge.apply(self, parameters.concat(result)));
          } else {
            cache.set(key, result);
          }
        }

        //immediately call every other callback waiting
        const waiting = loading.get(key).concat(callback);
        loading.delete(key);
        waiting.forEach(function (callback) {
          if (clone) {
            return callback.apply(null, args.map(_.cloneDeep));
          }
          callback.apply(null, args);
        });
        /////////

      }));
    } else {
      emit('queue', parameters);

      loading.get(key).push(callback);
    }
  };

  result.keys = cache.keys.bind(cache);
  result.on = emitter.on.bind(emitter);

  _.extend(result, { del }, options);

  return result;
};


module.exports.sync = function (options) {
  const cache = new LRU(_.pick(options, lru_params));
  const load = options.load;
  const hash = options.hash;
  const disable = options.disable;
  const bypass = options.bypass;
  const self = this;
  const itemMaxAge = options.itemMaxAge;
  const emitter = new events.EventEmitter();

  if (disable) {
    return load;
  }

  function emit(event, parameters) {
    emitter.emit.apply(emitter, [event].concat(parameters))
  }

  const result = function () {
    var args = _.toArray(arguments);

    if (bypass && bypass.apply(self, arguments)) {
      emit('miss', args);

      return load.apply(self, arguments);
    }

    var key = hash.apply(self, args);

    var fromCache = cache.get(key);

    if (fromCache) {
      emit('hit', args);

      return fromCache;
    }

    emit('miss', args);

    const result = load.apply(self, args);
    if (itemMaxAge) {
      cache.set(key, result, itemMaxAge.apply(self, args.concat([ result ])));
    } else {
      cache.set(key, result);
    }

    return result;
  };

  result.keys = cache.keys.bind(cache);
  result.on = emitter.on.bind(emitter);

  return result;
};
