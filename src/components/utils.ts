/**
 * @typedef {Object} ChainData
 * @property {Object} data - data that will be passed to the success or fallback
 * @property {Function} function - function's that must be called asynchronically
 */
interface ChainData {
  data: any;
  function: (...args: any[]) => any;
}

/**
 * Codex Editor Util
 */
export default class Util {
  /**
   * Custom logger
   *
   * @param {string} msg  - message
   * @param {string} type - logging type 'log'|'warn'|'error'|'info'
   * @param {*} args      - argument to log with a message
   */
  public static log(msg: string, type: string = 'log', args?: any): void {

    if (!args) {
      if (['time', 'timeEnd'].includes(type)) {
        msg = `[codex-editor]: ${msg}`;
      } else {
        args = msg || 'undefined';
        msg = '[codex-editor]: %o';
      }
    } else {
      msg  = '[codex-editor]: ' + msg;
    }

    try {
      if ( 'console' in window && window.console[ type ] ) {
        if ( args ) { window.console[ type ]( msg, args ); } else { window.console[ type ]( msg ); }
      }
    } catch (e) {
      // do nothing
    }
  }

  /**
   * Returns basic keycodes as constants
   * @return {{}}
   */
  static get keyCodes(): object {
    return {
      BACKSPACE: 8,
      TAB: 9,
      ENTER: 13,
      SHIFT: 16,
      CTRL: 17,
      ALT: 18,
      ESC: 27,
      SPACE: 32,
      LEFT: 37,
      UP: 38,
      DOWN: 40,
      RIGHT: 39,
      DELETE: 46,
      META: 91,
    };
  }

  /**
   * Fires a promise sequence asyncronically
   *
   * @param {ChainData[]} chains - list or ChainData's
   * @param {Function} success - success callback
   * @param {Function} fallback - callback that fires in case of errors
   *
   * @return {Promise}
   */
  public static sequence(chains: ChainData[], success = () => {}, fallback = () => {}): Promise<void> {
    return new Promise((resolve) => {
      /**
       * pluck each element from queue
       * First, send resolved Promise as previous value
       * Each plugins "prepare" method returns a Promise, that's why
       * reduce current element will not be able to continue while can't get
       * a resolved Promise
       */
      chains.reduce((previousValue, currentValue, iteration) => {
        return previousValue
          .then(() => waitNextBlock(currentValue, success, fallback))
          .then(() => {
            // finished
            if (iteration === chains.length - 1) {
              resolve();
            }
          });
      }, Promise.resolve());
    });

    /**
     * Decorator
     *
     * @param {ChainData} chainData
     *
     * @param {Function} successCallback
     * @param {Function} fallbackCallback
     *
     * @return {Promise}
     */
    function waitNextBlock(
      chainData: ChainData,
      successCallback: (data: any) => void,
      fallbackCallback: (data: any) => void,
    ): Promise<void> {
      return new Promise((resolve) => {
        chainData.function()
          .then(() => {
            successCallback(chainData.data || {});
          })
          .then(resolve)
          .catch(() => {
            fallbackCallback(chainData.data || {});

            // anyway, go ahead even it falls
            resolve();
          });
      });
    }
  }

  /**
   * Make array from array-like collection
   *
   * @param {ArrayLike} collection
   *
   * @return {Array}
   */
  public static array(collection: ArrayLike<any>): any[] {
    return Array.prototype.slice.call(collection);
  }

  /**
   * Check if passed variable is a function
   * @param {*} fn
   * @return {boolean}
   */
  public static isFunction(fn: any): boolean {
    return typeof fn === 'function';
  }

  /**
   * Check if passed function is a class
   * @param {function} fn
   * @return {boolean}
   */
  public static isClass(fn: any): boolean {
    return typeof fn === 'function' && /^\s*class\s+/.test(fn.toString());
  }

  /**
   * Checks if object is empty
   *
   * @param {Object} object
   * @return {boolean}
   */
  public static isEmpty(object: object): boolean {
    return Object.keys(object).length === 0 && object.constructor === Object;
  }

  /**
   * Check if passed object is a Promise
   * @param  {*}  object - object to check
   * @return {Boolean}
   */
  public static isPromise(object: any): boolean {
    return Promise.resolve(object) === object;
  }

  /**
   * Check if passed element is contenteditable
   * @param {HTMLElement} element
   * @return {boolean}
   */
  public static isContentEditable(element: HTMLElement): boolean {
    return element.contentEditable === 'true';
  }

  /**
   * Delays method execution
   *
   * @param {Function} method
   * @param {Number} timeout
   */
  public static delay(method: (...args: any[]) => any, timeout: number) {
    return function() {
      const context = this,
        args = arguments;

      window.setTimeout(() => method.apply(context, args), timeout);
    };
  }
}
