import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Event from "../Core/Event.js";
import CesiumMath from "../Core/Math.js";
import Rectangle from "../Core/Rectangle.js";
import ImageryLayer from "./ImageryLayer.js";

/**
 * 影像图层的有序集合。
 *
 * @alias ImageryLayerCollection
 * @constructor
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Imagery%20Adjustment.html|Cesium Sandcastle Imagery Adjustment Demo}
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Imagery%20Layers%20Manipulation.html|Cesium Sandcastle Imagery Manipulation Demo}
 */
function ImageryLayerCollection() {
  this._layers = [];

  /**
   * 将图层添加到集合时引发的事件。 事件处理程序将传递给
   * 和添加它的索引。
   * @type {Event}
   * @default Event()
   */
  this.layerAdded = new Event();

  /**
   * 从集合中删除图层时引发的事件。 事件处理程序将传递给
   * 已删除，并从中删除了该索引。
   * @type {Event}
   * @default Event()
   */
  this.layerRemoved = new Event();

  /**
   * 当图层在集合中的位置发生变化时引发的事件。 事件处理程序将传递给
   * 已移动，移动后的新索引和移动前的旧索引。
   * @type {Event}
   * @default Event()
   */
  this.layerMoved = new Event();

  /**
   * 通过设置
   * {@link ImageryLayer#show} 属性。 事件处理程序将传递对此层的引用
   * 集合中层的索引，以及一个标志（如果层现在为 true）
   * 显示或 false（如果现在隐藏）。
   *
   * @type {Event}
   * @default Event()
   */
  this.layerShownOrHidden = new Event();
}

Object.defineProperties(ImageryLayerCollection.prototype, {
  /**
   * 获取此集合中的层数。
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
 * @param {number} [index] 要添加层的索引。 如果省略，图层将
 * 添加到所有现有图层的顶部。
 *
 * @exception {DeveloperError} 索引（如果提供）必须大于或等于零且小于或等于层数。
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
    throw new DeveloperError("layer is required.");
  }
  if (hasIndex) {
    if (index < 0) {
      throw new DeveloperError("index must be greater than or equal to zero.");
    } else if (index > this._layers.length) {
      throw new DeveloperError(
        "index must be less than or equal to the number of layers.",
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
 * 使用给定的 ImageryProvider 创建新图层，并将其添加到集合中。
 *
 * @param {ImageryProvider} imageryProvider 为其创建新图层的图像提供程序。
 * @param {number} [index] 要添加层的索引。 如果省略，图层将
 * 添加到所有现有图层的顶部。
 * @returns {ImageryLayer} 新创建的图层。
 *
 * @example
 * try {
 *    const provider = await Cesium.IonImageryProvider.fromAssetId(3812);
 *    scene.imageryLayers.addImageryProvider(provider);
 * } catch (error) {
 *   console.log(`There was an error creating the imagery layer. ${error}`)
 * }
 */
ImageryLayerCollection.prototype.addImageryProvider = function (
  imageryProvider,
  index,
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(imageryProvider)) {
    throw new DeveloperError("imageryProvider is required.");
  }
  //>>includeEnd('debug');

  const layer = new ImageryLayer(imageryProvider);
  this.add(layer, index);
  return layer;
};

/**
 * 从此集合中删除图层（如果存在）。
 *
 * @param {ImageryLayer} layer 要删除的图层。
 * @param {boolean} [destroy=true] 是否除了删除图层之外还要销毁图层。
 * @returns {boolean} true，如果图层位于集合中并被删除，
 * 如果图层不在集合中，则为 false。
 */
ImageryLayerCollection.prototype.remove = function (layer, destroy) {
  destroy = defaultValue(destroy, true);

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
 * 从此集合中删除所有图层。
 *
 * @param {boolean} [destroy=true] 是否除了删除图层之外还要销毁图层。
 */
ImageryLayerCollection.prototype.removeAll = function (destroy) {
  destroy = defaultValue(destroy, true);

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
 * @param {ImageryLayer} layer 指定要检查的图层。
 *
 * @returns {boolean} true（如果集合包含图层），否则为 false，。
 */
ImageryLayerCollection.prototype.contains = function (layer) {
  return this.indexOf(layer) !== -1;
};

/**
 * 确定集合中给定图层的索引。
 *
 * @param {ImageryLayer} layer 要查找其索引的图层。
 *
 * @returns {number} 集合中图层的索引，如果集合中不存在该图层，则为 -1。
 */
ImageryLayerCollection.prototype.indexOf = function (layer) {
  return this._layers.indexOf(layer);
};

/**
 * 从集合中按索引获取层。
 *
 * @param {number} index 要检索的索引。
 *
 * @returns {ImageryLayer} 位于给定索引处的影像图层。
 */
ImageryLayerCollection.prototype.get = function (index) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(index)) {
    throw new DeveloperError("index is required.", "index");
  }
  //>>includeEnd('debug');

  return this._layers[index];
};

function getLayerIndex(layers, layer) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(layer)) {
    throw new DeveloperError("layer is required.");
  }
  //>>includeEnd('debug');

  const index = layers.indexOf(layer);

  //>>includeStart('debug', pragmas.debug);
  if (index === -1) {
    throw new DeveloperError("layer is not in this collection.");
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
 * 将图层在集合中提升一个位置。
 *
 * @param {ImageryLayer} layer 指定要移动的图层。
 *
 * @exception {DeveloperError} 层不在此集合中。
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 */
ImageryLayerCollection.prototype.raise = function (layer) {
  const index = getLayerIndex(this._layers, layer);
  swapLayers(this, index, index + 1);
};

/**
 * 将图层在集合中降低一个位置。
 *
 * @param {ImageryLayer} layer 指定要移动的图层。
 *
 * @exception {DeveloperError} 层不在此集合中。
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 */
ImageryLayerCollection.prototype.lower = function (layer) {
  const index = getLayerIndex(this._layers, layer);
  swapLayers(this, index, index - 1);
};

/**
 * 将图层提升到集合的顶部。
 *
 * @param {ImageryLayer} layer 指定要移动的图层。
 *
 * @exception {DeveloperError} 层不在此集合中。
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
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
 * @param {ImageryLayer} layer 指定要移动的图层。
 *
 * @exception {DeveloperError} 层不在此集合中。
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
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
 * 确定与拾取光线相交的图像图层。要从
 * location，请使用 {@link Camera.getPickRay}。
 *
 * @param {Ray} ray 用于测试交集的射线。
 * @param {Scene} scene 场景。
 * @return {ImageryLayer[]|undefined} 一个包含所有
 * 与给定拾取光线相交的图层。未定义的 if
 * 未选择任何图层。
 *
 */
ImageryLayerCollection.prototype.pickImageryLayers = function (ray, scene) {
  // Find the picked location on the globe.
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
 * 异步确定与拾取光线相交的影像图层要素。 相交的影像
 * 通过为每个相交的影像图层切片调用 {@link ImageryProvider#pickFeatures} 来查找图层要素
 * 通过选取射线。 要从屏幕上的某个位置计算拾取光线，请使用 {@link Camera.getPickRay}。
 *
 * @param {Ray} ray 用于测试交集的射线。
 * @param {Scene} scene 场景。
 * @return {Promise<ImageryLayerFeatureInfo[]>|undefined} 一个 Promise，它解析为与拾取光线相交的特征数组。
 * 如果可以快速确定没有要素相交（例如，
 * 因为没有活动图像提供程序支持 {@link ImageryProvider#pickFeatures}
 * 或因为拾取光线不与曲面相交），此函数将
 * 返回 undefined。
 *
 * @example
 * const pickRay = viewer.camera.getPickRay(windowPosition);
 * const featuresPromise = viewer.imageryLayers.pickImageryLayerFeatures(pickRay, viewer.scene);
 * if (!Cesium.defined(featuresPromise)) {
 *     console.log('No features picked.');
 * } else {
 *     Promise.resolve(featuresPromise).then(function(features) {
 *         // This function is called asynchronously when the list if picked features is available.
 *         console.log(`Number of features: ${features.length}`);
 *         if (features.length > 0) {
 *             console.log(`First feature name: ${features[0].name}`);
 *         }
 *     });
 * }
 */
ImageryLayerCollection.prototype.pickImageryLayerFeatures = function (
  ray,
  scene,
) {
  // Find the picked location on the globe.
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
          // For features without a position, use the picked location.
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
 * @param {FrameState} frameState The frameState.
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
 * 取消排队等待下一帧的重新投影命令。
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
 * 如果此对象已销毁，则返回 true;否则为 false。
 * <br /><br />
 * 如果此对象已销毁，则不应使用;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} true，如果此对象被销毁;否则为 false。
 *
 * @see ImageryLayerCollection#destroy
 */
ImageryLayerCollection.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此集合中所有层所持有的 WebGL 资源。 显式销毁此
 * 对象允许确定性地释放 WebGL 资源，而不是依赖垃圾
 * 收藏家。
 * <br /><br />
 * 此对象一旦被销毁，就不应使用;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。 因此
 * 将返回值 （<code>undefined</code>） 分配给对象，如示例中所示。
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
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
