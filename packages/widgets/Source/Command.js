import { DeveloperError } from "@cesium/engine";

/**
 * Command 是一个带有额外 <code>canExecute</code> 可观察属性的函数，用于确定
 * 命令是否可以执行。当执行时，Command 函数将检查 <code>canExecute</code> 的值，
 * 如果为 false 则抛出异常。
 *
 * 此类型描述了一个接口，不应直接实例化。
 * 参见 {@link createCommand} 从函数创建命令。
 *
 * @alias Command
 * @constructor
 */
function Command() {
  /**
   * 获取此命令当前是否可以执行。此属性可被观察。
   * @type {boolean}
   * @default undefined
   */
  this.canExecute = undefined;

  /**
   * 获取在命令执行前触发的事件，该事件会传递一个包含两个属性的对象：<code>cancel</code> 属性，
   * 如果监听器将其设置为 false 将阻止命令执行；以及 <code>args</code> 属性，
   * 即传递给命令的参数数组。
   * @type {Event}
   * @default undefined
   */
  this.beforeExecute = undefined;

  /**
   * 获取在命令执行后触发的事件，该事件会传递命令的返回值作为唯一参数。
   * @type {Event}
   * @default undefined
   */
  this.afterExecute = undefined;

  DeveloperError.throwInstantiationError();
}
export default Command;
