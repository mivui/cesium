import {
  CzmlDataSource,
  defaultValue,
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
 * 一个添加默认拖放支持CZML文件到Viewer小部件的mixin。
 * 不是直接调用，这个函数通常作为
 * {@link Viewer#extend} 的参数，如下例所示。
 * @function viewerDragDropMixin

 * @param {Viewer} viewer 查看器实例。
 * @param {object} [options] 对象，具有以下属性:
 * @param {Element|string} [options.dropTarget=viewer.container] 作为拖放目标的DOM元素。
 * @param {boolean} [options.clearOnDrop=true] 当为true时，删除文件将首先清除所有现有数据源，当为false时，将在现有数据源之后加载新数据源。
 * @param {boolean} [options.flyToOnDrop=true] 如果为true，则加载数据源后，删除文件将飞到数据源。
 * @param {boolean} [options.clampToGround=true] 如果为true，则数据源被限制在地面上。
 * @param {Proxy} [options.proxy] 要用于KML网络链接的代理。
 *
 * @exception {DeveloperError}  具有id的元素 <options.dropTarget> 在文档中不存在。
 * @exception {DeveloperError} dropTarget已经被另一个mixin定义了。
 * @exception {DeveloperError} dropEnabled已经被另一个mixin定义了。
 * @exception {DeveloperError} dropError已经被另一个mixin定义了
 * @exception {DeveloperError} clearOnDrop 已经被另一个mixin定义了
 *
 * @example
 * // Add basic drag and drop support and pop up an alert window on error.
 * const viewer = new Cesium.Viewer('cesiumContainer');
 * viewer.extend(Cesium.viewerDragDropMixin);
 * viewer.dropError.addEventListener(function(viewerArg, source, error) {
 *     window.alert('Error processing ' + source + ':' + error);
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

  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //Local variables to be closed over by defineProperties.
  let dropEnabled = true;
  let flyToOnDrop = defaultValue(options.flyToOnDrop, true);
  const dropError = new Event();
  let clearOnDrop = defaultValue(options.clearOnDrop, true);
  let dropTarget = defaultValue(options.dropTarget, viewer.container);
  let clampToGround = defaultValue(options.clampToGround, true);
  let proxy = options.proxy;

  dropTarget = getElement(dropTarget);

  Object.defineProperties(viewer, {
    /**
     * 获取或设置element to serve as the drop target.
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
     * 获取或设置一个值，该值指示是否启用了拖放支持。
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
     * 获取在删除处理过程中遇到错误时将引发的事件。
     * @memberof viewerDragDropMixin.prototype
     * @type {Event}
     */
    dropError: {
      get: function () {
        return dropError;
      },
    },

    /**
     * 获取或设置一个值，该值指示在添加新删除的数据源之前是否应清除现有数据源。
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
     * 获取或设置一个值，该值指示摄像机在加载后是否应飞到数据源。
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
     * 获取或设置用于KML的代理。
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
     * 获取或设置一个值，该值指示是否应将数据源固定在地面上
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
