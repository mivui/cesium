import {
  CzmlDataSource,
  Frozen,
  defined,
  DeveloperError,
  Event,
  GeoJsonDataSource,
  getElement,
  GpxDataSource,
  KmlDataSource,
  wrapFunction,
} from "@cesium/engine";
/**
 * 为 Viewer 控件添加默认的 CZML 文件拖放支持的 mixin。
 * 此函数通常不直接调用，而是作为参数传递给 {@link Viewer#extend}，如下面的示例所示。
 * @function viewerDragDropMixin

 * @param {Viewer} viewer Viewer 实例。
 * @param {object} [options] 具有以下属性的对象：
 * @param {Element|string} [options.dropTarget=viewer.container] 将作为放置目标的 DOM 元素。
 * @param {boolean} [options.clearOnDrop=true] 当为 true 时，放置文件将先清除所有现有数据源；当为 false 时，新数据源将加载到现有数据源之后。
 * @param {boolean} [options.flyToOnDrop=true] 当为 true 时，放置文件将在数据源加载后飞行到该数据源。
 * @param {boolean} [options.clampToGround=true] 当为 true 时，数据源将贴地显示。
 * @param {Proxy} [options.proxy] 用于 KML 网络链接的代理。
 *
 * @exception {DeveloperError} 文档中不存在 id 为 <options.dropTarget> 的元素。
 * @exception {DeveloperError} dropTarget 已被其他 mixin 定义。
 * @exception {DeveloperError} dropEnabled 已被其他 mixin 定义。
 * @exception {DeveloperError} dropError 已被其他 mixin 定义。
 * @exception {DeveloperError} clearOnDrop 已被其他 mixin 定义。
 *
 * @example
 * // 添加基本的拖放支持并在遇到错误时弹出警告窗口。
 * const viewer = new Cesium.Viewer('cesiumContainer');
 * viewer.extend(Cesium.viewerDragDropMixin);
 * viewer.dropError.addEventListener(function(viewerArg, source, error) {
 *     window.alert('处理 ' + source + ' 时出错: ' + error);
 * });
 */
function viewerDragDropMixin(viewer, options) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(viewer)) {
    throw new DeveloperError("viewer is required.");
  }
  if (viewer.hasOwnProperty("dropTarget")) {
    throw new DeveloperError("dropTarget is already defined by another mixin.");
  }
  if (viewer.hasOwnProperty("dropEnabled")) {
    throw new DeveloperError(
      "dropEnabled is already defined by another mixin.",
    );
  }
  if (viewer.hasOwnProperty("dropError")) {
    throw new DeveloperError("dropError is already defined by another mixin.");
  }
  if (viewer.hasOwnProperty("clearOnDrop")) {
    throw new DeveloperError(
      "clearOnDrop is already defined by another mixin.",
    );
  }
  if (viewer.hasOwnProperty("flyToOnDrop")) {
    throw new DeveloperError(
      "flyToOnDrop is already defined by another mixin.",
    );
  }
  //>>includeEnd('debug');

  options = options ?? Frozen.EMPTY_OBJECT;

  //Local variables to be closed over by defineProperties.
  let dropEnabled = true;
  let flyToOnDrop = options.flyToOnDrop ?? true;
  const dropError = new Event();
  let clearOnDrop = options.clearOnDrop ?? true;
  let dropTarget = options.dropTarget ?? viewer.container;
  let clampToGround = options.clampToGround ?? true;
  let proxy = options.proxy;

  dropTarget = getElement(dropTarget);

  Object.defineProperties(viewer, {
    /**
     * 获取或设置作为放置目标的元素。
     * @memberof viewerDragDropMixin.prototype
     * @type {Element}
     */
    dropTarget: {
      //TODO See https://github.com/CesiumGS/cesium/issues/832
      get: function () {
        return dropTarget;
      },
      set: function (value) {
        //>>includeStart('debug', pragmas.debug);
        if (!defined(value)) {
          throw new DeveloperError("value is required.");
        }
        //>>includeEnd('debug');

        unsubscribe(dropTarget, handleDrop);
        dropTarget = value;
        subscribe(dropTarget, handleDrop);
      },
    },

    /**
     * 获取或设置一个值，指示是否启用拖放支持。
     * @memberof viewerDragDropMixin.prototype
     * @type {Element}
     */
    dropEnabled: {
      get: function () {
        return dropEnabled;
      },
      set: function (value) {
        if (value !== dropEnabled) {
          if (value) {
            subscribe(dropTarget, handleDrop);
          } else {
            unsubscribe(dropTarget, handleDrop);
          }
          dropEnabled = value;
        }
      },
    },

    /**
     * 获取在放置处理过程中遇到错误时触发的事件。
     * @memberof viewerDragDropMixin.prototype
     * @type {Event}
     */
    dropError: {
      get: function () {
        return dropError;
      },
    },

    /**
     * 获取或设置一个值，指示在添加新放置的数据源之前是否应清除现有数据源。
     * @memberof viewerDragDropMixin.prototype
     * @type {boolean}
     */
    clearOnDrop: {
      get: function () {
        return clearOnDrop;
      },
      set: function (value) {
        clearOnDrop = value;
      },
    },

    /**
     * 获取或设置一个值，指示加载数据源后相机是否应飞行到该数据源。
     * @memberof viewerDragDropMixin.prototype
     * @type {boolean}
     */
    flyToOnDrop: {
      get: function () {
        return flyToOnDrop;
      },
      set: function (value) {
        flyToOnDrop = value;
      },
    },

    /**
     * 获取或设置用于 KML 的代理。
     * @memberof viewerDragDropMixin.prototype
     * @type {Proxy}
     */
    proxy: {
      get: function () {
        return proxy;
      },
      set: function (value) {
        proxy = value;
      },
    },

    /**
     * 获取或设置一个值，指示数据源是否应贴地显示。
     * @memberof viewerDragDropMixin.prototype
     * @type {boolean}
     */
    clampToGround: {
      get: function () {
        return clampToGround;
      },
      set: function (value) {
        clampToGround = value;
      },
    },
  });

  function handleDrop(event) {
    stop(event);

    if (clearOnDrop) {
      viewer.entities.removeAll();
      viewer.dataSources.removeAll();
    }

    const files = event.dataTransfer.files;
    const length = files.length;
    for (let i = 0; i < length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = createOnLoadCallback(viewer, file, proxy, clampToGround);
      reader.onerror = createDropErrorCallback(viewer, file);
      reader.readAsText(file);
    }
  }

  //Enable drop by default;
  subscribe(dropTarget, handleDrop);

  //Wrap the destroy function to make sure all events are unsubscribed from
  viewer.destroy = wrapFunction(viewer, viewer.destroy, function () {
    viewer.dropEnabled = false;
  });

  //Specs need access to handleDrop
  viewer._handleDrop = handleDrop;
}

function stop(event) {
  event.stopPropagation();
  event.preventDefault();
}

function unsubscribe(dropTarget, handleDrop) {
  const currentTarget = dropTarget;
  if (defined(currentTarget)) {
    currentTarget.removeEventListener("drop", handleDrop, false);
    currentTarget.removeEventListener("dragenter", stop, false);
    currentTarget.removeEventListener("dragover", stop, false);
    currentTarget.removeEventListener("dragexit", stop, false);
  }
}

function subscribe(dropTarget, handleDrop) {
  dropTarget.addEventListener("drop", handleDrop, false);
  dropTarget.addEventListener("dragenter", stop, false);
  dropTarget.addEventListener("dragover", stop, false);
  dropTarget.addEventListener("dragexit", stop, false);
}

function createOnLoadCallback(viewer, file, proxy, clampToGround) {
  const scene = viewer.scene;
  return function (evt) {
    const fileName = file.name;
    try {
      let loadPromise;

      if (/\.czml$/i.test(fileName)) {
        loadPromise = CzmlDataSource.load(JSON.parse(evt.target.result), {
          sourceUri: fileName,
        });
      } else if (
        /\.geojson$/i.test(fileName) ||
        /\.json$/i.test(fileName) ||
        /\.topojson$/i.test(fileName)
      ) {
        loadPromise = GeoJsonDataSource.load(JSON.parse(evt.target.result), {
          sourceUri: fileName,
          clampToGround: clampToGround,
        });
      } else if (/\.(kml|kmz)$/i.test(fileName)) {
        loadPromise = KmlDataSource.load(file, {
          sourceUri: fileName,
          proxy: proxy,
          camera: scene.camera,
          canvas: scene.canvas,
          clampToGround: clampToGround,
          screenOverlayContainer: viewer.container,
        });
      } else if (/\.gpx$/i.test(fileName)) {
        loadPromise = GpxDataSource.load(file, {
          sourceUri: fileName,
          proxy: proxy,
        });
      } else {
        viewer.dropError.raiseEvent(
          viewer,
          fileName,
          `Unrecognized file: ${fileName}`,
        );
        return;
      }

      if (defined(loadPromise)) {
        viewer.dataSources
          .add(loadPromise)
          .then(function (dataSource) {
            if (viewer.flyToOnDrop) {
              viewer.flyTo(dataSource);
            }
          })
          .catch(function (error) {
            viewer.dropError.raiseEvent(viewer, fileName, error);
          });
      }
    } catch (error) {
      viewer.dropError.raiseEvent(viewer, fileName, error);
    }
  };
}

function createDropErrorCallback(viewer, file) {
  return function (evt) {
    viewer.dropError.raiseEvent(viewer, file.name, evt.target.error);
  };
}
export default viewerDragDropMixin;
