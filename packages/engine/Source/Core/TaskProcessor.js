import Uri from "urijs";
import buildModuleUrl from "./buildModuleUrl.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import destroyObject from "./destroyObject.js";
import DeveloperError from "./DeveloperError.js";
import Event from "./Event.js";
import FeatureDetection from "./FeatureDetection.js";
import isCrossOriginUrl from "./isCrossOriginUrl.js";
import Resource from "./Resource.js";
import RuntimeError from "./RuntimeError.js";

function canTransferArrayBuffer() {
  if (!defined(TaskProcessor._canTransferArrayBuffer)) {
    const worker = createWorker("transferTypedArrayTest");
    worker.postMessage = defaultValue(
      worker.webkitPostMessage,
      worker.postMessage,
    );

    const value = 99;
    const array = new Int8Array([value]);

    try {
      // postMessage might fail with a DataCloneError
      // if transferring array buffers is not supported.
      worker.postMessage(
        {
          array: array,
        },
        [array.buffer],
      );
    } catch (e) {
      TaskProcessor._canTransferArrayBuffer = false;
      return TaskProcessor._canTransferArrayBuffer;
    }

    TaskProcessor._canTransferArrayBuffer = new Promise((resolve) => {
      worker.onmessage = function (event) {
        const array = event.data.array;

        // some versions of Firefox silently fail to transfer typed arrays.
        // https://bugzilla.mozilla.org/show_bug.cgi?id=841904
        // Check to make sure the value round-trips successfully.
        const result = defined(array) && array[0] === value;
        resolve(result);

        worker.terminate();

        TaskProcessor._canTransferArrayBuffer = result;
      };
    });
  }

  return TaskProcessor._canTransferArrayBuffer;
}

const taskCompletedEvent = new Event();

function urlFromScript(script) {
  let blob;
  try {
    blob = new Blob([script], {
      type: "application/javascript",
    });
  } catch (e) {
    const BlobBuilder =
      window.BlobBuilder ||
      window.WebKitBlobBuilder ||
      window.MozBlobBuilder ||
      window.MSBlobBuilder;
    const blobBuilder = new BlobBuilder();
    blobBuilder.append(script);
    blob = blobBuilder.getBlob("application/javascript");
  }

  const URL = window.URL || window.webkitURL;
  return URL.createObjectURL(blob);
}

function createWorker(url) {
  const uri = new Uri(url);
  const isUri = uri.scheme().length !== 0 && uri.fragment().length === 0;
  const moduleID = url.replace(/\.js$/, "");

  const options = {};
  let workerPath;
  let crossOriginUrl;

  // If we are provided a fully resolved URL, check it is cross-origin
  // Or if provided a module ID, check the full absolute URL instead.
  if (isCrossOriginUrl(url)) {
    crossOriginUrl = url;
  } else if (!isUri) {
    const moduleAbsoluteUrl = buildModuleUrl(
      `${TaskProcessor._workerModulePrefix}/${moduleID}.js`,
    );

    if (isCrossOriginUrl(moduleAbsoluteUrl)) {
      crossOriginUrl = moduleAbsoluteUrl;
    }
  }

  if (crossOriginUrl) {
    // To load cross-origin, create a shim worker from a blob URL
    const script = `import "${crossOriginUrl}";`;
    workerPath = urlFromScript(script);
    options.type = "module";
    return new Worker(workerPath, options);
  }

  /* global CESIUM_WORKERS */
  if (!isUri && typeof CESIUM_WORKERS !== "undefined") {
    // If the workers are embedded, create a shim worker from the embedded script data
    const script = `
      importScripts("${urlFromScript(CESIUM_WORKERS)}");
      CesiumWorkers["${moduleID}"]();
    `;
    workerPath = urlFromScript(script);
    return new Worker(workerPath, options);
  }

  workerPath = url;

  if (!isUri) {
    workerPath = buildModuleUrl(
      `${TaskProcessor._workerModulePrefix + moduleID}.js`,
    );
  }

  if (!FeatureDetection.supportsEsmWebWorkers()) {
    throw new RuntimeError(
      "This browser is not supported. Please update your browser to continue.",
    );
  }

  options.type = "module";

  return new Worker(workerPath, options);
}

async function getWebAssemblyLoaderConfig(processor, wasmOptions) {
  const config = {
    modulePath: undefined,
    wasmBinaryFile: undefined,
    wasmBinary: undefined,
  };

  // Web assembly not supported, use fallback js module if provided
  if (!FeatureDetection.supportsWebAssembly()) {
    if (!defined(wasmOptions.fallbackModulePath)) {
      throw new RuntimeError(
        `This browser does not support Web Assembly, and no backup module was provided for ${processor._workerPath}`,
      );
    }

    config.modulePath = buildModuleUrl(wasmOptions.fallbackModulePath);
    return config;
  }

  config.wasmBinaryFile = buildModuleUrl(wasmOptions.wasmBinaryFile);

  const arrayBuffer = await Resource.fetchArrayBuffer({
    url: config.wasmBinaryFile,
  });

  config.wasmBinary = arrayBuffer;
  return config;
}

/**
 * Web Worker 的包装器，允许为给定 worker 调度任务，
 * 通过 Promise 异步返回结果。
 *
 * 在计划任务之前，不会构造 Worker。
 *
 * @alias TaskProcessor
 * @constructor
 *
 * @param {string} workerPath 工作线程的 URL。这可以是绝对路径，也可以是相对于 Cesium Workers 文件夹的路径。
 * @param {number} [maximumActiveTasks=Number.POSITIVE_INFINITY] 活动任务的最大数量。 一旦超过，
 * scheduleTask 不会再将任何任务排队，因此允许
 * 工作将在未来的帧中重新安排。
 */
function TaskProcessor(workerPath, maximumActiveTasks) {
  this._workerPath = workerPath;
  this._maximumActiveTasks = defaultValue(
    maximumActiveTasks,
    Number.POSITIVE_INFINITY,
  );
  this._activeTasks = 0;
  this._nextID = 0;
  this._webAssemblyPromise = undefined;
}

const createOnmessageHandler = (worker, id, resolve, reject) => {
  const listener = ({ data }) => {
    if (data.id !== id) {
      return;
    }

    if (defined(data.error)) {
      let error = data.error;
      if (error.name === "RuntimeError") {
        error = new RuntimeError(data.error.message);
        error.stack = data.error.stack;
      } else if (error.name === "DeveloperError") {
        error = new DeveloperError(data.error.message);
        error.stack = data.error.stack;
      } else if (error.name === "Error") {
        error = new Error(data.error.message);
        error.stack = data.error.stack;
      }
      taskCompletedEvent.raiseEvent(error);
      reject(error);
    } else {
      taskCompletedEvent.raiseEvent();
      resolve(data.result);
    }

    worker.removeEventListener("message", listener);
  };

  return listener;
};

const emptyTransferableObjectArray = [];
async function runTask(processor, parameters, transferableObjects) {
  const canTransfer = await Promise.resolve(canTransferArrayBuffer());
  if (!defined(transferableObjects)) {
    transferableObjects = emptyTransferableObjectArray;
  } else if (!canTransfer) {
    transferableObjects.length = 0;
  }

  const id = processor._nextID++;
  const promise = new Promise((resolve, reject) => {
    processor._worker.addEventListener(
      "message",
      createOnmessageHandler(processor._worker, id, resolve, reject),
    );
  });

  processor._worker.postMessage(
    {
      id: id,
      baseUrl: buildModuleUrl.getCesiumBaseUrl().url,
      parameters: parameters,
      canTransferArrayBuffer: canTransfer,
    },
    transferableObjects,
  );

  return promise;
}

async function scheduleTask(processor, parameters, transferableObjects) {
  ++processor._activeTasks;

  try {
    const result = await runTask(processor, parameters, transferableObjects);
    --processor._activeTasks;
    return result;
  } catch (error) {
    --processor._activeTasks;
    throw error;
  }
}

/**
 * 安排一个任务，由 Web Worker 异步处理。 如果目前有更多
 * 活动任务超过构造函数设置的最大值，将立即返回 undefined。
 * 否则，返回一个 Promise，该 Promise 将解析为 worker 发回的结果，当
 *完成。
 *
 * @param {object} parameters 将发布到 worker 的任何输入数据。
 * @param {Object[]} [transferableObjects] 参数中包含的对象数组，该数组应为
 * 已传输给 worker 而不是 copied。
 * @returns {Promise<object>|undefined} 一个在可用时将解析为结果的 Promise，或者 undefined
 * 如果活动任务太多，
 *
 * @example
 * const taskProcessor = new Cesium.TaskProcessor('myWorkerPath');
 * const promise = taskProcessor.scheduleTask({
 *     someParameter : true,
 *     another : 'hello'
 * });
 * if (!Cesium.defined(promise)) {
 *     // too many active tasks - try again later
 * } else {
 *     promise.then(function(result) {
 *         // use the result of the task
 *     });
 * }
 */
TaskProcessor.prototype.scheduleTask = function (
  parameters,
  transferableObjects,
) {
  if (!defined(this._worker)) {
    this._worker = createWorker(this._workerPath);
  }

  if (this._activeTasks >= this._maximumActiveTasks) {
    return undefined;
  }

  return scheduleTask(this, parameters, transferableObjects);
};

/**
 * 向 Web Worker 发布消息，并配置以初始化加载
 * 并异步编译一个 Web 汇编模块，以及一个可选的
 * 在不支持 Web Assembly 时使用的回退 JavaScript 模块。
 *
 * @param {object} [webAssemblyOptions] 对象，具有以下属性：
 * @param {string} [webAssemblyOptions.modulePath] Web 程序集 JavaScript 包装器模块的路径。
 * @param {string} [webAssemblyOptions.wasmBinaryFile] Web 程序集二进制文件的路径。
 * @param {string} [webAssemblyOptions.fallbackModulePath] 如果不支持 Web 程序集，要使用的回退 JavaScript 模块的路径。
 * @returns {Promise<*>} 当 Web Worker 已经加载并编译了 Web 汇编模块并准备好处理任务时，它解析为结果的 Promise。
 *
 * @exception {RuntimeError} 此浏览器不支持 Web Assembly，并且未提供备份模块
 */
TaskProcessor.prototype.initWebAssemblyModule = async function (
  webAssemblyOptions,
) {
  if (defined(this._webAssemblyPromise)) {
    return this._webAssemblyPromise;
  }

  const init = async () => {
    const worker = (this._worker = createWorker(this._workerPath));
    const wasmConfig = await getWebAssemblyLoaderConfig(
      this,
      webAssemblyOptions,
    );
    const canTransfer = await Promise.resolve(canTransferArrayBuffer());
    let transferableObjects;
    const binary = wasmConfig.wasmBinary;
    if (defined(binary) && canTransfer) {
      transferableObjects = [binary];
    }

    const promise = new Promise((resolve, reject) => {
      worker.onmessage = function ({ data }) {
        if (defined(data)) {
          resolve(data.result);
        } else {
          reject(new RuntimeError("Could not configure wasm module"));
        }
      };
    });

    worker.postMessage(
      {
        canTransferArrayBuffer: canTransfer,
        parameters: { webAssemblyConfig: wasmConfig },
      },
      transferableObjects,
    );

    return promise;
  };

  this._webAssemblyPromise = init();
  return this._webAssemblyPromise;
};

/**
 * 如果此对象已销毁，则返回 true;否则为 false。
 * <br /><br />
 * 如果此对象已销毁，则不应使用;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果此对象被销毁，则为 True;否则为 false。
 *
 * @see TaskProcessor#destroy
 */
TaskProcessor.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象。 这将立即终止 Worker。
 * <br /><br />
 * 一旦对象被销毁，就不应该使用它;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 */
TaskProcessor.prototype.destroy = function () {
  if (defined(this._worker)) {
    this._worker.terminate();
  }
  return destroyObject(this);
};

/**
 * 成功完成任务时引发的事件。 传递事件处理程序
 * 错误对象是任务失败。
 *
 * @type {Event}
 *
 * @private
 */
TaskProcessor.taskCompletedEvent = taskCompletedEvent;

// exposed for testing purposes
TaskProcessor._defaultWorkerModulePrefix = "Workers/";
TaskProcessor._workerModulePrefix = TaskProcessor._defaultWorkerModulePrefix;
TaskProcessor._canTransferArrayBuffer = undefined;
export default TaskProcessor;
