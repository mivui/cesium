import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import CesiumMath from "../Core/Math.js";
import Rectangle from "../Core/Rectangle.js";
import ImageryLayer from "./ImageryLayer.js";

/**
 * 用于在 {@link Globe} 或 {@link Cesium3DTileset} 上渲染栅格影像的有序影像图层集合。
 *
 * @alias ImageryLayerCollection
 * @constructor
 * @see {@link Scene#imageryLayers} 用于操作地球上的影像图层。
 * @see {@link Cesium3DTileset#imageryLayers} 用于操作 3D 瓦片集上的影像图层。
 * @demo {@link https://sandcastle.cesium.com/index.html?id=imagery-adjustment|Cesium Sandcastle Imagery Adjustment Demo}
 * @demo {@link https://sandcastle.cesium.com/index.html?id=imagery-layers-manipulation|Cesium Sandcastle Imagery Manipulation Demo}
 */
function ImageryLayerCollection() {
  this._layers = [];

  /**
   * 向集合添加图层时触发的事件。事件处理器被传递添加的图层
   * 以及添加的索引。
   * @type {Event}
   * @default Event()
   */
  this.layerAdded = new Event();

  /**
   * 从集合中移除图层时触发的事件。事件处理器被传递移除的图层
   * 以及移除的索引。
   * @type {Event}
   * @default Event()
   */
  this.layerRemoved = new Event();

  /**
   * 图层在集合中改变位置时触发的事件。事件处理器被传递移动的图层、
   * 移动后的新索引以及移动前的旧索引。
   * @type {Event}
   * @default Event()
   */
  this.layerMoved = new Event();

  /**
   * 通过设置 {@link ImageryLayer#show} 属性显示或隐藏图层时触发的事件。
   * 事件处理器被传递对此图层的引用、图层在集合中的索引，以及
   * 如果图层现在显示则为 true，如果图层现在隐藏则为 false 的标志。
   *
   * @type {Event}
   * @default Event()
   */
  this.layerShownOrHidden = new Event();
}

Object.defineProperties(ImageryLayerCollection.prototype, {
  /**
   * 获取此集合中图层的数量。
   * @memberof ImageryLayerCollection.prototype
   * @type {number}
   */
  length: {
    get: function () {
      return this._layers.length;
    },
  },
});

/**
 * 向集合添加图层。
 *
 * @param {ImageryLayer} layer 要添加的图层。
 * @param {number} [index] 添加图层的索引。如果省略，图层将
 *                         添加到所有现有图层之上。
 *
 * @exception {DeveloperError} index（如果提供）必须大于或等于零且小于或等于图层数量。
 *
 * @example
 * const imageryLayer = Cesium.ImageryLayer.fromWorldImagery();
 * scene.imageryLayers.add(imageryLayer);
 *
 * @example
 * const imageryLayer = Cesium.ImageryLayer.fromProviderAsync(Cesium.IonImageryProvider.fromAssetId(3812));
 * scene.imageryLayers.add(imageryLayer);
 */
ImageryLayerCollection.prototype.add = function (layer, index) {
  const hasIndex = defined(index);

  //>>includeStart('debug', pragmas.debug);
  if (!defined(layer)) {
    throw new DeveloperError("需要 layer。");
  }
  if (hasIndex) {
    if (index < 0) {
      throw new DeveloperError("index 必须大于或等于零。");
    } else if (index > this._layers.length) {
      throw new DeveloperError(
        "index 必须小于或等于图层数量。",
      );
    }
  }
  //>>includeEnd('debug');

  if (!hasIndex) {
    index = this._layers.length;
    this._layers.push(layer);
  } else {
    this._layers.splice(index, 0, layer);
  }

  this._update();
  this.layerAdded.raiseEvent(layer, index);
  const removeReadyEventListener = layer.readyEvent.addEventListener(() => {
    this.layerShownOrHidden.raiseEvent(layer, layer._layerIndex, layer.show);
    removeReadyEventListener();
  });
};

/**
 * 使用给定的 ImageryProvider 创建新图层并将其添加到集合中。
 *
 * @param {ImageryProvider} imageryProvider 为其创建新图层的影像提供者。
 * @param {number} [index] 添加图层的索引。如果省略，图层将
 *                         添加到所有现有图层之上。
 * @returns {ImageryLayer} 新创建的图层。
 *
 * @example
 * try {
 *    const provider = await Cesium.IonImageryProvider.fromAssetId(3812);
 *    scene.imageryLayers.addImageryProvider(provider);
 * } catch (error) {
 *   console.log(`创建影像图层时出错。${error}`)
 * }
 */
ImageryLayerCollection.prototype.addImageryProvider = function (
  imageryProvider,
  index,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(imageryProvider)) {
    throw new DeveloperError("需要 imageryProvider。");
  }
  //>>includeEnd('debug');

  const layer = new ImageryLayer(imageryProvider);
  this.add(layer, index);
  return layer;
};

/**
 * 从集合中移除图层（如果存在）。
 *
 * @param {ImageryLayer} layer 要移除的图层。
 * @param {boolean} [destroy=true] 是否除了移除图层外还销毁它们。
 * @returns {boolean} 如果图层在集合中并被移除则为 true，
 *                    如果图层不在集合中则为 false。
 */
ImageryLayerCollection.prototype.remove = function (layer, destroy) {
  destroy = destroy ?? true;

  const index = this._layers.indexOf(layer);
  if (index !== -1) {
    this._layers.splice(index, 1);

    this._update();

    this.layerRemoved.raiseEvent(layer, index);

    if (destroy) {
      layer.destroy();
    }

    return true;
  }

  return false;
};

/**
 * 从集合中移除所有图层。
 *
 * @param {boolean} [destroy=true] 是否除了移除图层外还销毁它们。
 */
ImageryLayerCollection.prototype.removeAll = function (destroy) {
  destroy = destroy ?? true;

  const layers = this._layers;
  for (let i = 0, len = layers.length; i < len; i++) {
    const layer = layers[i];
    this.layerRemoved.raiseEvent(layer, i);

    if (destroy) {
      layer.destroy();
    }
  }

  this._layers = [];
};

/**
 * 检查集合是否包含给定图层。
 *
 * @param {ImageryLayer} layer 要检查的图层。
 *
 * @returns {boolean} 如果集合包含该图层则为 true，否则为 false。
 */
ImageryLayerCollection.prototype.contains = function (layer) {
  return this.indexOf(layer) !== -1;
};

/**
 * 确定给定图层在集合中的索引。
 *
 * @param {ImageryLayer} layer 要查找索引的图层。
 *
 * @returns {number} 图层在集合中的索引，如果图层不存在于集合中则为 -1。
 */
ImageryLayerCollection.prototype.indexOf = function (layer) {
  return this._layers.indexOf(layer);
};

/**
 * 从集合中按索引获取图层。
 *
 * @param {number} index 要检索的索引。
 *
 * @returns {ImageryLayer} 给定索引处的影像图层。
 */
ImageryLayerCollection.prototype.get = function (index) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(index)) {
    throw new DeveloperError("需要 index。", "index");
  }
  //>>includeEnd('debug');

  return this._layers[index];
};

function getLayerIndex(layers, layer) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(layer)) {
    throw new DeveloperError("需要 layer。");
  }
  //>>includeEnd('debug');

  const index = layers.indexOf(layer);

  //>>includeStart('debug', pragmas.debug);
  if (index === -1) {
    throw new DeveloperError("layer 不在此集合中。");
  }
  //>>includeEnd('debug');

  return index;
}

function swapLayers(collection, i, j) {
  const arr = collection._layers;
  i = CesiumMath.clamp(i, 0, arr.length - 1);
  j = CesiumMath.clamp(j, 0, arr.length - 1);

  if (i === j) {
    return;
  }

  const temp = arr[i];
  arr[i] = arr[j];
  arr[j] = temp;

  collection._update();

  collection.layerMoved.raiseEvent(temp, j, i);
}

/**
 * 将图层在集合中上移一个位置。
 *
 * @param {ImageryLayer} layer 要移动的图层。
 *
 * @exception {DeveloperError} layer 不在此集合中。
 * @exception {DeveloperError} 此对象已被销毁，即已调用 destroy()。
 */
ImageryLayerCollection.prototype.raise = function (layer) {
  const index = getLayerIndex(this._layers, layer);
  swapLayers(this, index, index + 1);
};

/**
 * 将图层在集合中下移一个位置。
 *
 * @param {ImageryLayer} layer 要移动的图层。
 *
 * @exception {DeveloperError} layer 不在此集合中。
 * @exception {DeveloperError} 此对象已被销毁，即已调用 destroy()。
 */
ImageryLayerCollection.prototype.lower = function (layer) {
  const index = getLayerIndex(this._layers, layer);
  swapLayers(this, index, index - 1);
};

/**
 * 将图层提升到集合的顶部。
 *
 * @param {ImageryLayer} layer 要移动的图层。
 *
 * @exception {DeveloperError} layer 不在此集合中。
 * @exception {DeveloperError} 此对象已被销毁，即已调用 destroy()。
 */
ImageryLayerCollection.prototype.raiseToTop = function (layer) {
  const index = getLayerIndex(this._layers, layer);
  if (index === this._layers.length - 1) {
    return;
  }
  this._layers.splice(index, 1);
  this._layers.push(layer);

  this._update();

  this.layerMoved.raiseEvent(layer, this._layers.length - 1, index);
};

/**
 * 将图层降低到集合的底部。
 *
 * @param {ImageryLayer} layer 要移动的图层。
 *
 * @exception {DeveloperError} layer 不在此集合中。
 * @exception {DeveloperError} 此对象已被销毁，即已调用 destroy()。
 */
ImageryLayerCollection.prototype.lowerToBottom = function (layer) {
  const index = getLayerIndex(this._layers, layer);
  if (index === 0) {
    return;
  }
  this._layers.splice(index, 1);
  this._layers.splice(0, 0, layer);

  this._update();

  this.layerMoved.raiseEvent(layer, 0, index);
};

const applicableRectangleScratch = new Rectangle();

function pickImageryHelper(scene, pickedLocation, pickFeatures, callback) {
  // Find the terrain tile containing the picked location.
  const tilesToRender = scene.globe._surface._tilesToRender;
  let pickedTile;

  for (
    let textureIndex = 0;
    !defined(pickedTile) && textureIndex < tilesToRender.length;
    ++textureIndex
  ) {
    const tile = tilesToRender[textureIndex];
    if (Rectangle.contains(tile.rectangle, pickedLocation)) {
      pickedTile = tile;
    }
  }

  if (!defined(pickedTile)) {
    return;
  }

  // Pick against all attached imagery tiles containing the pickedLocation.
  const imageryTiles = pickedTile.data.imagery;

  for (let i = imageryTiles.length - 1; i >= 0; --i) {
    const terrainImagery = imageryTiles[i];
    const imagery = terrainImagery.readyImagery;
    if (!defined(imagery)) {
      continue;
    }
    if (!imagery.imageryLayer.ready) {
      continue;
    }
    const provider = imagery.imageryLayer.imageryProvider;
    if (pickFeatures && !defined(provider.pickFeatures)) {
      continue;
    }

    if (!Rectangle.contains(imagery.rectangle, pickedLocation)) {
      continue;
    }

    // If this imagery came from a parent, it may not be applicable to its entire rectangle.
    // Check the textureCoordinateRectangle.
    const applicableRectangle = applicableRectangleScratch;

    const epsilon = 1 / 1024; // 1/4 of a pixel in a typical 256x256 tile.
    applicableRectangle.west = CesiumMath.lerp(
      pickedTile.rectangle.west,
      pickedTile.rectangle.east,
      terrainImagery.textureCoordinateRectangle.x - epsilon,
    );
    applicableRectangle.east = CesiumMath.lerp(
      pickedTile.rectangle.west,
      pickedTile.rectangle.east,
      terrainImagery.textureCoordinateRectangle.z + epsilon,
    );
    applicableRectangle.south = CesiumMath.lerp(
      pickedTile.rectangle.south,
      pickedTile.rectangle.north,
      terrainImagery.textureCoordinateRectangle.y - epsilon,
    );
    applicableRectangle.north = CesiumMath.lerp(
      pickedTile.rectangle.south,
      pickedTile.rectangle.north,
      terrainImagery.textureCoordinateRectangle.w + epsilon,
    );
    if (!Rectangle.contains(applicableRectangle, pickedLocation)) {
      continue;
    }

    callback(imagery);
  }
}

/**
 * 确定与拾取射线相交的影像图层。要从屏幕上的位置计算拾取射线，
 * 请使用 {@link Camera.getPickRay}。
 *
 * @param {Ray} ray 要测试相交的射线。
 * @param {Scene} scene 场景。
 * @return {ImageryLayer[]|undefined} 包含所有与给定拾取射线相交的图层的数组。
 *                                 如果没有选择任何图层则为 undefined。
 *
 */
ImageryLayerCollection.prototype.pickImageryLayers = function (ray, scene) {
  // 在地球上查找拾取的位置。
  const pickedPosition = scene.globe.pick(ray, scene);
  if (!defined(pickedPosition)) {
    return;
  }

  const pickedLocation =
    scene.ellipsoid.cartesianToCartographic(pickedPosition);

  const imageryLayers = [];

  pickImageryHelper(scene, pickedLocation, false, function (imagery) {
    imageryLayers.push(imagery.imageryLayer);
  });

  if (imageryLayers.length === 0) {
    return undefined;
  }

  return imageryLayers;
};

/**
 * 异步确定与拾取射线相交的影像图层要素。通过为拾取射线相交的
 * 每个影像图层瓦片调用 {@link ImageryProvider#pickFeatures} 来查找相交的影像图层要素。
 * 要从屏幕上的位置计算拾取射线，请使用 {@link Camera.getPickRay}。
 *
 * @param {Ray} ray 要测试相交的射线。
 * @param {Scene} scene 场景。
 * @return {Promise<ImageryLayerFeatureInfo[]>|undefined} 解析为拾取射线相交的要素数组的 Promise。
 *                                             如果可以快速确定没有要素相交（例如，
 *                                             因为没有活动的影像提供者支持 {@link ImageryProvider#pickFeatures}
 *                                             或因为拾取射线不与表面相交），此函数将
 *                                             返回 undefined。
 *
 * @example
 * const pickRay = viewer.camera.getPickRay(windowPosition);
 * const featuresPromise = viewer.imageryLayers.pickImageryLayerFeatures(pickRay, viewer.scene);
 * if (!Cesium.defined(featuresPromise)) {
 *     console.log('未拾取到要素。');
 * } else {
 *     Promise.resolve(featuresPromise).then(function(features) {
 *         // 此函数在拾取要素列表可用时异步调用。
 *         console.log(`要素数量：${features.length}`);
 *         if (features.length > 0) {
 *             console.log(`第一个要素名称：${features[0].name}`);
 *         }
 *     });
 * }
 */
ImageryLayerCollection.prototype.pickImageryLayerFeatures = function (
  ray,
  scene,
) {
  // 在地球上查找拾取的位置。
  const pickedPosition = scene.globe.pick(ray, scene);
  if (!defined(pickedPosition)) {
    return;
  }

  const pickedLocation =
    scene.ellipsoid.cartesianToCartographic(pickedPosition);

  const promises = [];
  const imageryLayers = [];

  pickImageryHelper(scene, pickedLocation, true, function (imagery) {
    if (!imagery.imageryLayer.ready) {
      return undefined;
    }
    const provider = imagery.imageryLayer.imageryProvider;
    const promise = provider.pickFeatures(
      imagery.x,
      imagery.y,
      imagery.level,
      pickedLocation.longitude,
      pickedLocation.latitude,
    );
    if (defined(promise)) {
      promises.push(promise);
      imageryLayers.push(imagery.imageryLayer);
    }
  });

  if (promises.length === 0) {
    return undefined;
  }
  return Promise.all(promises).then(function (results) {
    const features = [];
    for (let resultIndex = 0; resultIndex < results.length; ++resultIndex) {
      const result = results[resultIndex];
      const image = imageryLayers[resultIndex];
      if (defined(result) && result.length > 0) {
        for (
          let featureIndex = 0;
          featureIndex < result.length;
          ++featureIndex
        ) {
          const feature = result[featureIndex];
          feature.imageryLayer = image;
          // 对于没有位置的要素，使用拾取的位置。
          if (!defined(feature.position)) {
            feature.position = pickedLocation;
          }
          features.push(feature);
        }
      }
    }
    return features;
  });
};

/**
 * 更新帧状态以执行任何排队的纹理重新投影。
 *
 * @private
 *
 * @param {FrameState} frameState 帧状态。
 */
ImageryLayerCollection.prototype.queueReprojectionCommands = function (
  frameState,
) {
  const layers = this._layers;
  for (let i = 0, len = layers.length; i < len; ++i) {
    layers[i].queueReprojectionCommands(frameState);
  }
};

/**
 * 取消为下一帧排队的重新投影命令。
 *
 * @private
 */
ImageryLayerCollection.prototype.cancelReprojections = function () {
  const layers = this._layers;
  for (let i = 0, len = layers.length; i < len; ++i) {
    layers[i].cancelReprojections();
  }
};

/**
 * 如果此对象已被销毁则返回 true；否则返回 false。
 * <br /><br />
 * 如果此对象已被销毁，则不应使用它；调用除
 * <code>isDestroyed</code> 之外的任何函数都将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果此对象已被销毁则为 true；否则为 false。
 *
 * @see ImageryLayerCollection#destroy
 */
ImageryLayerCollection.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此集合中所有图层持有的 WebGL 资源。显式销毁此对象
 * 允许确定性释放 WebGL 资源，而不是依赖垃圾回收器。
 * <br /><br />
 * 一旦此对象被销毁，就不应使用它；调用除
 * <code>isDestroyed</code> 之外的任何函数都将导致 {@link DeveloperError} 异常。因此，
 * 如示例中所示，将返回值（<code>undefined</code>）赋给该对象。
 *
 * @exception {DeveloperError} 此对象已被销毁，即已调用 destroy()。
 *
 *
 * @example
 * layerCollection = layerCollection && layerCollection.destroy();
 *
 * @see ImageryLayerCollection#isDestroyed
 */
ImageryLayerCollection.prototype.destroy = function () {
  this.removeAll(true);
  return destroyObject(this);
};

ImageryLayerCollection.prototype._update = function () {
  let isBaseLayer = true;
  const layers = this._layers;
  let layersShownOrHidden;
  let layer;
  let i, len;
  for (i = 0, len = layers.length; i < len; ++i) {
    layer = layers[i];

    layer._layerIndex = i;

    if (layer.show) {
      layer._isBaseLayer = isBaseLayer;
      isBaseLayer = false;
    } else {
      layer._isBaseLayer = false;
    }

    if (layer.show !== layer._show) {
      if (defined(layer._show)) {
        if (!defined(layersShownOrHidden)) {
          layersShownOrHidden = [];
        }
        layersShownOrHidden.push(layer);
      }
      layer._show = layer.show;
    }
  }

  if (defined(layersShownOrHidden)) {
    for (i = 0, len = layersShownOrHidden.length; i < len; ++i) {
      layer = layersShownOrHidden[i];
      this.layerShownOrHidden.raiseEvent(layer, layer._layerIndex, layer.show);
    }
  }
};
export default ImageryLayerCollection;
