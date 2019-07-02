// From https://raw.githubusercontent.com/nikoskalogridis/deep-freeze/fb921b32064dce1645197be2bf975fe0385450b0/index.js
// which is sadly, no longer maintained

export function deepFreeze (o: any) {
  if (o) {
    Object.freeze(o);

    Object.getOwnPropertyNames(o).forEach(function (prop) {
      if (o.hasOwnProperty(prop)
        && o[prop] !== null
        && (typeof o[prop] === 'object' || typeof o[prop] === 'function')
        && (o[prop].constructor !== Buffer)
        && !Object.isFrozen(o[prop])) {
          deepFreeze(o[prop]);
        }
    });
  }

  return o;
};
