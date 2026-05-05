import Uri from "urijs";
import buildModuleUrl from "./buildModuleUrl.js";
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
    worker.postMessage = worker.webkitPostMessage ?? worker.postMessage;

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
 * 围绕Web Worker的包装器，允许为给定Worker调度任务，
 * 通过Promise异步返回结果。
 *
 * Worker直到任务被调度时才被构造。
 *
 * @alias TaskProcessor
 * @constructor
 *
 * @param {string} workerPath Worker的URL。这可以是绝对路径或相对于Cesium Workers文件夹的路径。
 * @param {number} [maximumActiveTasks=Number.POSITIVE_INFINITY] 最大活动任务数。一旦超过，
 *                                        scheduleTask将不再排队更多任务，允许
 *                                        在未来的帧中重新调度工作。
 */
function TaskProcessor(workerPath, maximumActiveTasks) {
  this._workerPath = workerPath;
  this._maximumActiveTasks = maximumActiveTasks ?? Number.POSITIVE_INFINITY;
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
 * 调度一个任务，由Web Worker异步处理。如果当前活动任务数
 * 超过构造函数设置的最大值，将立即返回undefined。
 * 否则，返回一个Promise，当Worker完成时将解析为Worker返回的结果。
 *
 * @param {object} parameters 将发布到Worker的任何输入数据。
 * @param {object[]} [transferableObjects] 包含在parameters中的对象数组，应该
 *                                      转移到Worker而不是复制。
 * @returns {Promise<object>|undefined} 当结果可用时将解析为结果的Promise，或者如果活动任务过多则返回undefined，
 *
 * @example
 * const taskProcessor = new Cesium.TaskProcessor('myWorkerPath');
 * const promise = taskProcessor.scheduleTask({
 *     someParameter : true,
 *     another : 'hello'
 * });
 * if (!Cesium.defined(promise)) {
 *     // 活动任务过多 - 稍后重试
 * } else {
 *     promise.then(function(result) {
 *         // 使用任务的结果
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
 * 向Web Worker发送消息，配置初始化加载和
 * 异步编译WebAssembly模块，以及一个可选的
 * 如果WebAssembly不受支持时使用的备用JavaScript模块。
 *
 * @param {object} [webAssemblyOptions] 具有以下属性的对象：
 * @param {string} [webAssemblyOptions.modulePath] WebAssembly JavaScript包装模块的路径。
 * @param {string} [webAssemblyOptions.wasmBinaryFile] WebAssembly二进制文件的路径。
 * @param {string} [webAssemblyOptions.fallbackModulePath] 如果WebAssembly不受支持时使用的备用JavaScript模块路径。
 * @returns {Promise<*>} 当Web Worker已加载并编译WebAssembly模块并准备好处理任务时解析为结果的Promise。
 *
 * @exception {RuntimeError} 此浏览器不支持WebAssembly，且未提供备用模块
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
 * 如果此对象已被销毁则返回true；否则返回false。
 * <br /><br />
 * 如果此对象已被销毁，则不应再使用它；调用除
 * <code>isDestroyed</code>以外的任何函数都将导致{@link DeveloperError}异常。
 *
 * @returns {boolean} 如果此对象已被销毁则为true；否则为false。
 *
 * @see TaskProcessor#destroy
 */
TaskProcessor.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象。这将立即终止Worker。
 * <br /><br />
 * 对象一旦被销毁，就不应再使用；调用除
 * <code>isDestroyed</code>以外的任何函数都将导致{@link DeveloperError}异常。
 */
TaskProcessor.prototype.destroy = function () {
  if (defined(this._worker)) {
    this._worker.terminate();
  }
  return destroyObject(this);
};

/**
 * 任务成功完成时引发的事件。任务失败时，事件处理程序会接收错误对象。
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
