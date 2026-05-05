import DeveloperError from "./DeveloperError.js";

function returnTrue() {
  return true;
}

/**
 * 销毁一个对象。对象的每个函数（包括其原型中的函数）都将被替换为抛出
 * {@link DeveloperError} 的函数，除了对象的 <code>isDestroyed</code> 函数，
 * 该函数被设置为返回 <code>true</code> 的函数。对象的属性将通过 <code>delete</code> 移除。
 * <br /><br />
 * 此函数用于持有原生资源的对象（例如需要显式释放的WebGL资源）。
 * 客户端代码调用对象的 <code>destroy</code> 函数，该函数释放原生资源并调用
 * <code>destroyObject</code> 将自身置于已销毁状态。
 *
 * @function
 *
 * @param {object} object 要销毁的对象。
 * @param {string} [message] 如果调用已销毁对象的函数时抛出异常所包含的消息。
 *
 *
 * @example
 * // How a texture would destroy itself.
 * this.destroy = function () {
 *     _gl.deleteTexture(_texture);
 *     return Cesium.destroyObject(this);
 * };
 *
 * @see DeveloperError
 */
function destroyObject(object, message) {
  message = message ?? "This object was destroyed, i.e., destroy() was called.";

  function throwOnDestroyed() {
    //>>includeStart('debug', pragmas.debug);
    throw new DeveloperError(message);
    //>>includeEnd('debug');
  }

  for (const key in object) {
    if (typeof object[key] === "function") {
      object[key] = throwOnDestroyed;
    }
  }

  object.isDestroyed = returnTrue;

  return undefined;
}
export default destroyObject;
