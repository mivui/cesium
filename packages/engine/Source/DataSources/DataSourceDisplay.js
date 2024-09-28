import ApproximateTerrainHeights from "../Core/ApproximateTerrainHeights.js";
import BoundingSphere from "../Core/BoundingSphere.js";
import Check from "../Core/Check.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import EventHelper from "../Core/EventHelper.js";
import GroundPolylinePrimitive from "../Scene/GroundPolylinePrimitive.js";
import GroundPrimitive from "../Scene/GroundPrimitive.js";
import OrderedGroundPrimitiveCollection from "../Scene/OrderedGroundPrimitiveCollection.js";
import PrimitiveCollection from "../Scene/PrimitiveCollection.js";
import BillboardVisualizer from "./BillboardVisualizer.js";
import BoundingSphereState from "./BoundingSphereState.js";
import CustomDataSource from "./CustomDataSource.js";
import GeometryVisualizer from "./GeometryVisualizer.js";
import LabelVisualizer from "./LabelVisualizer.js";
import ModelVisualizer from "./ModelVisualizer.js";
import Cesium3DTilesetVisualizer from "./Cesium3DTilesetVisualizer.js";
import PathVisualizer from "./PathVisualizer.js";
import PointVisualizer from "./PointVisualizer.js";
import PolylineVisualizer from "./PolylineVisualizer.js";

/**
 * 可视化 {@link DataSource} 实例的集合。
 * @alias DataSourceDisplay
 * @constructor
 *
 * @param {object} options 对象，具有以下属性:
 * @param {Scene} options.scene 显示数据的场景。
 * @param {DataSourceCollection} options.dataSourceCollection 要显示的数据源。
 * @param {DataSourceDisplay.VisualizersCallback} [options.visualizersCallback=DataSourceDisplay.defaultVisualizersCallback]
 * 创建用于可视化的可视化工具数组的函数。
 * 如果未定义，则使用所有标准可视化工具。
 */
function DataSourceDisplay(options) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("options", options);
  Check.typeOf.object("options.scene", options.scene);
  Check.typeOf.object(
    "options.dataSourceCollection",
    options.dataSourceCollection,
  );
  //>>includeEnd('debug');

  GroundPrimitive.initializeTerrainHeights();
  GroundPolylinePrimitive.initializeTerrainHeights();

  const scene = options.scene;
  const dataSourceCollection = options.dataSourceCollection;

  this._eventHelper = new EventHelper();
  this._eventHelper.add(
    dataSourceCollection.dataSourceAdded,
    this._onDataSourceAdded,
    this,
  );
  this._eventHelper.add(
    dataSourceCollection.dataSourceRemoved,
    this._onDataSourceRemoved,
    this,
  );
  this._eventHelper.add(
    dataSourceCollection.dataSourceMoved,
    this._onDataSourceMoved,
    this,
  );
  this._eventHelper.add(scene.postRender, this._postRender, this);

  this._dataSourceCollection = dataSourceCollection;
  this._scene = scene;
  this._visualizersCallback = defaultValue(
    options.visualizersCallback,
    DataSourceDisplay.defaultVisualizersCallback,
  );

  let primitivesAdded = false;
  const primitives = new PrimitiveCollection();
  const groundPrimitives = new PrimitiveCollection();

  if (dataSourceCollection.length > 0) {
    scene.primitives.add(primitives);
    scene.groundPrimitives.add(groundPrimitives);
    primitivesAdded = true;
  }

  this._primitives = primitives;
  this._groundPrimitives = groundPrimitives;

  for (let i = 0, len = dataSourceCollection.length; i < len; i++) {
    this._onDataSourceAdded(dataSourceCollection, dataSourceCollection.get(i));
  }

  const defaultDataSource = new CustomDataSource();
  this._onDataSourceAdded(undefined, defaultDataSource);
  this._defaultDataSource = defaultDataSource;

  let removeDefaultDataSourceListener;
  let removeDataSourceCollectionListener;
  if (!primitivesAdded) {
    const that = this;
    const addPrimitives = function () {
      scene.primitives.add(primitives);
      scene.groundPrimitives.add(groundPrimitives);
      removeDefaultDataSourceListener();
      removeDataSourceCollectionListener();
      that._removeDefaultDataSourceListener = undefined;
      that._removeDataSourceCollectionListener = undefined;
    };
    removeDefaultDataSourceListener =
      defaultDataSource.entities.collectionChanged.addEventListener(
        addPrimitives,
      );
    removeDataSourceCollectionListener =
      dataSourceCollection.dataSourceAdded.addEventListener(addPrimitives);
  }

  this._removeDefaultDataSourceListener = removeDefaultDataSourceListener;
  this._removeDataSourceCollectionListener = removeDataSourceCollectionListener;

  this._ready = false;
}

const ExtraVisualizers = [];
/**
 * 将提供的 Visualizer 添加到默认 Visualizers 回调（如果尚未包含）
 * @private
 * @param {Visualizer} visualizer 要添加的 Visualizer 类
 */
DataSourceDisplay.registerVisualizer = function (visualizer) {
  if (!ExtraVisualizers.includes(visualizer)) {
    ExtraVisualizers.push(visualizer);
  }
};

/**
 * 从默认 Visualizers 回调中删除提供的 Visualizer（如果已包含）
 * @private
 * @param {Visualizer} visualizer 要删除的 Visualizer 类
 */
DataSourceDisplay.unregisterVisualizer = function (visualizer) {
  if (ExtraVisualizers.includes(visualizer)) {
    const index = ExtraVisualizers.indexOf(visualizer);
    ExtraVisualizers.splice(index, 1);
  }
};

/**
 * 获取或设置default 函数，该函数创建用于可视化的可视化工具数组。
 * 默认情况下，此功能使用所有标准可视化工具。
 *
 * @type {DataSourceDisplay.VisualizersCallback}
 */
DataSourceDisplay.defaultVisualizersCallback = function (
  scene,
  entityCluster,
  dataSource,
) {
  const entities = dataSource.entities;
  return [
    new BillboardVisualizer(entityCluster, entities),
    new GeometryVisualizer(
      scene,
      entities,
      dataSource._primitives,
      dataSource._groundPrimitives,
    ),
    new LabelVisualizer(entityCluster, entities),
    new ModelVisualizer(scene, entities),
    new Cesium3DTilesetVisualizer(scene, entities),
    new PointVisualizer(entityCluster, entities),
    new PathVisualizer(scene, entities),
    new PolylineVisualizer(
      scene,
      entities,
      dataSource._primitives,
      dataSource._groundPrimitives,
    ),
    ...ExtraVisualizers.map(
      (VisualizerClass) => new VisualizerClass(scene, entities),
    ),
  ];
};

Object.defineProperties(DataSourceDisplay.prototype, {
  /**
   * 得到场景与此显示相关联。
   * @memberof DataSourceDisplay.prototype
   * @type {Scene}
   */
  scene: {
    get: function () {
      return this._scene;
    },
  },
  /**
   * 获取要显示的数据源的集合。
   * @memberof DataSourceDisplay.prototype
   * @type {DataSourceCollection}
   */
  dataSources: {
    get: function () {
      return this._dataSourceCollection;
    },
  },
  /**
   * 获取默认数据源实例，该实例可用于
   * 手动创建和可视化未绑定到的实体
   * 特定数据源。此实例始终可用
   * 中，并且不会显示在列表 dataSources 集合中。
   * @memberof DataSourceDisplay.prototype
   * @type {CustomDataSource}
   */
  defaultDataSource: {
    get: function () {
      return this._defaultDataSource;
    },
  },

  /**
   * 获取一个值，该值指示数据源中的所有实体是否都已准备就绪
   * @memberof DataSourceDisplay.prototype
   * @type {boolean}
   * @readonly
   */
  ready: {
    get: function () {
      return this._ready;
    },
  },
});

/**
 * 如果此对象已销毁，则返回 true;否则为 false。
 * <br /><br />
 * 如果此对象已销毁，则不应使用;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常.
 *
 * @returns {boolean} 如果此对象被销毁，则为 True;否则为 false。
 *
 * @see DataSourceDisplay#destroy
 */
DataSourceDisplay.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。 销毁对象允许确定性
 * 释放 WebGL 资源，而不是依赖垃圾回收器来销毁这个对象。
 * <br /><br />
 * 一旦对象被销毁，就不应该使用它;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。 因此
 * 将返回值 （<code>undefined</code>） 分配给对象，如示例中所示。
 *
 * @exception {DeveloperError} 此对象已销毁，即调用 destroy() 。
 *
 *
 * @example
 * dataSourceDisplay = dataSourceDisplay.destroy();
 *
 * @see DataSourceDisplay#isDestroyed
 */
DataSourceDisplay.prototype.destroy = function () {
  this._eventHelper.removeAll();

  const dataSourceCollection = this._dataSourceCollection;
  for (let i = 0, length = dataSourceCollection.length; i < length; ++i) {
    this._onDataSourceRemoved(
      this._dataSourceCollection,
      dataSourceCollection.get(i),
    );
  }
  this._onDataSourceRemoved(undefined, this._defaultDataSource);

  if (defined(this._removeDefaultDataSourceListener)) {
    this._removeDefaultDataSourceListener();
    this._removeDataSourceCollectionListener();
  } else {
    this._scene.primitives.remove(this._primitives);
    this._scene.groundPrimitives.remove(this._groundPrimitives);
  }

  return destroyObject(this);
};

/**
 * 将显示更新为提供的时间。
 *
 * @param {JulianDate} time 模拟时间。
 * @returns {boolean} 如果所有数据源都已准备好显示，则为 True，否则为 false。
 */
DataSourceDisplay.prototype.update = function (time) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("time", time);
  //>>includeEnd('debug');

  if (!ApproximateTerrainHeights.initialized) {
    this._ready = false;
    return false;
  }

  let result = true;

  let i;
  let x;
  let visualizers;
  let vLength;
  const dataSources = this._dataSourceCollection;
  const length = dataSources.length;
  for (i = 0; i < length; i++) {
    const dataSource = dataSources.get(i);
    if (defined(dataSource.update)) {
      result = dataSource.update(time) && result;
    }

    visualizers = dataSource._visualizers;
    vLength = visualizers.length;
    for (x = 0; x < vLength; x++) {
      result = visualizers[x].update(time) && result;
    }
  }

  visualizers = this._defaultDataSource._visualizers;
  vLength = visualizers.length;
  for (x = 0; x < vLength; x++) {
    result = visualizers[x].update(time) && result;
  }

  // Request a rendering of the scene when the data source
  // becomes 'ready' for the first time
  if (!this._ready && result) {
    this._scene.requestRender();
  }
  this._ready = result;

  return result;
};

DataSourceDisplay.prototype._postRender = function () {
  // Adds credits for all datasources
  const frameState = this._scene.frameState;
  const dataSources = this._dataSourceCollection;
  const length = dataSources.length;
  for (let i = 0; i < length; i++) {
    const dataSource = dataSources.get(i);

    const credit = dataSource.credit;
    if (defined(credit)) {
      frameState.creditDisplay.addCreditToNextFrame(credit);
    }

    // Credits from the resource that the user can't remove
    const credits = dataSource._resourceCredits;
    if (defined(credits)) {
      const creditCount = credits.length;
      for (let c = 0; c < creditCount; c++) {
        frameState.creditDisplay.addCreditToNextFrame(credits[c]);
      }
    }
  }
};

const getBoundingSphereArrayScratch = [];
const getBoundingSphereBoundingSphereScratch = new BoundingSphere();

/**
 * 计算一个边界球体，该球体包含为指定实体生成的可视化效果。
 * 边界球体位于场景地球的固定帧中。
 *
 * @param {Entity} entity 要计算其边界球体的实体。
 * @param {boolean} allowPartial 如果为 true，则忽略待处理的边界球体，并将从当前可用数据中返回答案。
 * 如果为 false，则函数将停止并在任何边界球体处于 pending 状态时返回 pending。
 * @param {BoundingSphere} result 要存储结果的边界球体。
 * @returns {BoundingSphereState} BoundingSphereState.DONE（如果结果包含边界球体），
 * BoundingSphereState.PENDING（如果结果仍在计算中），或者
 * BoundingSphereState.FAILED，如果实体在当前场景中没有可视化效果。
 * @private
 */
DataSourceDisplay.prototype.getBoundingSphere = function (
  entity,
  allowPartial,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("entity", entity);
  Check.typeOf.bool("allowPartial", allowPartial);
  Check.defined("result", result);
  //>>includeEnd('debug');

  if (!this._ready) {
    return BoundingSphereState.PENDING;
  }

  let i;
  let length;
  let dataSource = this._defaultDataSource;
  if (!dataSource.entities.contains(entity)) {
    dataSource = undefined;

    const dataSources = this._dataSourceCollection;
    length = dataSources.length;
    for (i = 0; i < length; i++) {
      const d = dataSources.get(i);
      if (d.entities.contains(entity)) {
        dataSource = d;
        break;
      }
    }
  }

  if (!defined(dataSource)) {
    return BoundingSphereState.FAILED;
  }

  const boundingSpheres = getBoundingSphereArrayScratch;
  const tmp = getBoundingSphereBoundingSphereScratch;

  let count = 0;
  let state = BoundingSphereState.DONE;
  const visualizers = dataSource._visualizers;
  const visualizersLength = visualizers.length;

  for (i = 0; i < visualizersLength; i++) {
    const visualizer = visualizers[i];
    if (defined(visualizer.getBoundingSphere)) {
      state = visualizers[i].getBoundingSphere(entity, tmp);
      if (!allowPartial && state === BoundingSphereState.PENDING) {
        return BoundingSphereState.PENDING;
      } else if (state === BoundingSphereState.DONE) {
        boundingSpheres[count] = BoundingSphere.clone(
          tmp,
          boundingSpheres[count],
        );
        count++;
      }
    }
  }

  if (count === 0) {
    return BoundingSphereState.FAILED;
  }

  boundingSpheres.length = count;
  BoundingSphere.fromBoundingSpheres(boundingSpheres, result);
  return BoundingSphereState.DONE;
};

DataSourceDisplay.prototype._onDataSourceAdded = function (
  dataSourceCollection,
  dataSource,
) {
  const scene = this._scene;

  const displayPrimitives = this._primitives;
  const displayGroundPrimitives = this._groundPrimitives;

  const primitives = displayPrimitives.add(new PrimitiveCollection());
  const groundPrimitives = displayGroundPrimitives.add(
    new OrderedGroundPrimitiveCollection(),
  );

  dataSource._primitives = primitives;
  dataSource._groundPrimitives = groundPrimitives;

  const entityCluster = dataSource.clustering;
  entityCluster._initialize(scene);

  primitives.add(entityCluster);

  dataSource._visualizers = this._visualizersCallback(
    scene,
    entityCluster,
    dataSource,
  );
};

DataSourceDisplay.prototype._onDataSourceRemoved = function (
  dataSourceCollection,
  dataSource,
) {
  const displayPrimitives = this._primitives;
  const displayGroundPrimitives = this._groundPrimitives;

  const primitives = dataSource._primitives;
  const groundPrimitives = dataSource._groundPrimitives;

  const entityCluster = dataSource.clustering;
  primitives.remove(entityCluster);

  const visualizers = dataSource._visualizers;
  const length = visualizers.length;
  for (let i = 0; i < length; i++) {
    visualizers[i].destroy();
  }

  displayPrimitives.remove(primitives);
  displayGroundPrimitives.remove(groundPrimitives);

  dataSource._visualizers = undefined;
};

DataSourceDisplay.prototype._onDataSourceMoved = function (
  dataSource,
  newIndex,
  oldIndex,
) {
  const displayPrimitives = this._primitives;
  const displayGroundPrimitives = this._groundPrimitives;

  const primitives = dataSource._primitives;
  const groundPrimitives = dataSource._groundPrimitives;

  if (newIndex === oldIndex + 1) {
    displayPrimitives.raise(primitives);
    displayGroundPrimitives.raise(groundPrimitives);
  } else if (newIndex === oldIndex - 1) {
    displayPrimitives.lower(primitives);
    displayGroundPrimitives.lower(groundPrimitives);
  } else if (newIndex === 0) {
    displayPrimitives.lowerToBottom(primitives);
    displayGroundPrimitives.lowerToBottom(groundPrimitives);
    displayPrimitives.raise(primitives); // keep defaultDataSource primitives at index 0 since it's not in the collection
    displayGroundPrimitives.raise(groundPrimitives);
  } else {
    displayPrimitives.raiseToTop(primitives);
    displayGroundPrimitives.raiseToTop(groundPrimitives);
  }
};

/**
 * 创建用于可视化的可视化工具数组的函数。
 * @callback DataSourceDisplay.VisualizersCallback
 *
 * @param {Scene} scene 要为其创建可视化工具的场景。
 * @param {EntityCluster} entityCluster 要为其创建可视化工具的实体集群。
 * @param {DataSource} dataSource 要为其创建可视化工具的数据源。
 * @returns {Visualizer[]} 用于可视化的可视化器数组。
 *
 * @example
 * function createVisualizers(scene, entityCluster, dataSource) {
 *     return [new Cesium.BillboardVisualizer(entityCluster, dataSource.entities)];
 * }
 */
export default DataSourceDisplay;
