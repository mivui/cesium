import defaultValue from "./defaultValue.js";
import DeveloperError from "./DeveloperError.js";

function returnTrue() {
  return true;
}

/**
 * 销毁对象。 对象的每个函数（包括其原型中的函数
 * 替换为抛出 {@link DeveloperError} 的函数，但对象的
 * <code>isDestroyed</code> 函数，该函数设置为返回 <code>true</code> 的函数。
 * 对象的属性将通过 <code>delete</code> 删除。
 * <br /><br />
 * 此函数由持有原生资源的对象使用，例如 WebGL 资源，其
 * 需要明确发布。 客户端代码调用对象的 <code>destroy</code> 函数
 * 然后释放本机资源并调用 <code>destroyObject</code> 将自身
 * 处于已销毁状态。
 *
 * @function
 *
 * @param {object} object 要销毁的对象。
 * @param {string} [message] 要包含在抛出的异常中的消息
 * 调用已销毁对象的函数。
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
  message = defaultValue(message, "这个物体被摧毁了,destroy().");

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
