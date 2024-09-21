import { defaultValue, defined, DeveloperError, Event } from "@cesium/engine";
import knockout from "./ThirdParty/knockout.js";

/**
 * 从给定的函数创建命令，用于ViewModels。
 *
 * 命令是一个函数，它带有一个额外的 <code>canExecute</code> observable属性来判断
 * 命令是否能执行。执行时，Command函数将检查
 *  <code>canExecute</code> 并抛出如果false。它还提供了何时的事件
 * 命令已执行或即将执行。
 *
 * @function
 *
 * @param {Function} func 要执行的函数。
 * @param {boolean} [canExecute=true] 一个布尔值，指示当前是否可以执行函数。
 */
function createCommand(func, canExecute) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(func)) {
    throw new DeveloperError("func is required.");
  }
  //>>includeEnd('debug');

  canExecute = defaultValue(canExecute, true);

  const beforeExecute = new Event();
  const afterExecute = new Event();

  function command() {
    //>>includeStart('debug', pragmas.debug);
    if (!command.canExecute) {
      throw new DeveloperError("Cannot execute command, canExecute is false.");
    }
    //>>includeEnd('debug');

    const commandInfo = {
      args: arguments,
      cancel: false,
    };

    let result;
    beforeExecute.raiseEvent(commandInfo);
    if (!commandInfo.cancel) {
      result = func.apply(null, arguments);
      afterExecute.raiseEvent(result);
    }
    return result;
  }

  command.canExecute = canExecute;
  knockout.track(command, ["canExecute"]);

  Object.defineProperties(command, {
    beforeExecute: {
      value: beforeExecute,
    },
    afterExecute: {
      value: afterExecute,
    },
  });

  return command;
}
export default createCommand;
