import { defined, DeveloperError, Event } from "@cesium/engine";
import knockout from "./ThirdParty/knockout.js";

/**
 * 从给定函数创建 Command，供 ViewModel 使用。
 *
 * Command 是一个带有额外 <code>canExecute</code> 可观察属性的函数，用于确定
 * 命令是否可以执行。当执行时，Command 函数将检查 <code>canExecute</code> 的值，
 * 如果为 false 则抛出异常。它还提供命令即将执行和已执行的事件。
 *
 * @function
 *
 * @param {Function} func 要执行的函数。
 * @param {boolean} [canExecute=true] 布尔值，表示函数当前是否可以执行。
 */
function createCommand(func, canExecute) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(func)) {
    throw new DeveloperError("func is required.");
  }
  //>>includeEnd('debug');

  canExecute = canExecute ?? true;

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
