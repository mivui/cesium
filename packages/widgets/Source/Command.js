import { DeveloperError } from "@cesium/engine";

/**
 * 命令是一个函数，它带有一个额外的<code>canExecute</code> observable属性来判断
 * 命令是否能执行。执行时，Command函数将检查
 *  <code>canExecute</code>并抛出如果false。
 * 
 * 这个类型描述了一个接口，不打算被直接实例化。
 * 参见 {@link createCommand} 从函数创建命令。
 *
 * @alias Command
 * @constructor
 */
function Command() {
  /**
   * 获取当前是否可以执行此命令。这个属性是可观察的。
   * @type {boolean}
   * @default undefined
   */
  this.canExecute = undefined;

  /**
   * 获取在命令执行之前引发的事件，即事件
   * 由一个包含两个属性的对象引发:<code>cancel</code>属性;
   * 如果侦听器将其设置为false，将阻止命令执行，并且
   * 一个<code>args</code>属性，它是传递给命令的参数数组。
   * @type {Event}
   * @default undefined
   */
  this.beforeExecute = undefined;

  /**
   * 获取在命令执行后引发的事件，即事件
   * 将命令的返回值作为其唯一参数引发。
   * @type {Event}
   * @default undefined
   */
  this.afterExecute = undefined;

  DeveloperError.throwInstantiationError();
}
export default Command;
