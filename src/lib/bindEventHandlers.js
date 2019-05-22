/**
 * Bind class event handlers to a 'this'
 * 
 * @param {Array<string>} handlerKeys the handler keys to bind
 * @param {Object} thisArg the this value to bind to 
 */
export default function bindEventHandlers(handlerKeys, thisArg) {
  handlerKeys.forEach(key => {
    thisArg[key] = thisArg[key].bind(thisArg);
  });
}