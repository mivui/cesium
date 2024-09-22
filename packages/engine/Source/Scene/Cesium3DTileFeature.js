import Color from "../Core/Color.js";
import defined from "../Core/defined.js";

/**
 * {@link Cesium3DTileset} 的一个功能。
 * <p>
 * 还提供对存储在切片的批处理表中的要素属性的访问
 * 作为显示/隐藏特征并通过以下方式更改其高亮颜色的能力
 * {@link Cesium3DTileFeature#show} 和 {@link Cesium3DTileFeature#color}。
 * </p>
 * <p>
 * 对 <code>Cesium3DTileFeature</code> 对象的修改具有瓦片的
 *内容。 如果图块的内容已卸载，例如，由于它超出视图并需要
 * 要在缓存中为可见切片释放空间，请监听 {@link Cesium3DTileset#tileUnload} 事件以保存任何
 *修改。此外，侦听 {@link Cesium3DTileset#tileVisible} 事件以重新应用任何修改。
 * </p>
 * <p>
 * 不要直接构造它。 通过 {@link Cesium3DTileContent#getFeature} 访问它
 * 或使用 {@link Scene#pick} 进行挑选。
 * </p>
 *
 * @alias Cesium3DTileFeature
 * @constructor
 *
 * @example
 * // On mouse over, display all the properties for a feature in the console log.
 * handler.setInputAction(function(movement) {
 *     const feature = scene.pick(movement.endPosition);
 *     if (feature instanceof Cesium.Cesium3DTileFeature) {
 *         const propertyIds = feature.getPropertyIds();
 *         const length = propertyIds.length;
 *         for (let i = 0; i < length; ++i) {
 *             const propertyId = propertyIds[i];
 *             console.log(`{propertyId}: ${feature.getProperty(propertyId)}`);
 *         }
 *     }
 * }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
 */
function Cesium3DTileFeature(content, batchId) {
  this._content = content;
  this._batchId = batchId;
  this._color = undefined; // for calling getColor
}

Object.defineProperties(Cesium3DTileFeature.prototype, {
  /**
   * 获取或设置是否功能。这是为所有功能设置的
   * 评估样式的显示时。
   *
   * @memberof Cesium3DTileFeature.prototype
   *
   * @type {boolean}
   *
   * @default true
   */
  show: {
    get: function () {
      return this._content.batchTable.getShow(this._batchId);
    },
    set: function (value) {
      this._content.batchTable.setShow(this._batchId, value);
    },
  },

  /**
   * 获取或设置高亮颜色 （highlight color） 与特征颜色相乘。 什么时候
   * 这是白色的，特征的颜色不会改变。这是为所有功能设置的
   * 当评估样式的颜色时。
   *
   * @memberof Cesium3DTileFeature.prototype
   *
   * @type {Color}
   *
   * @default {@link Color.WHITE}
   */
  color: {
    get: function () {
      if (!defined(this._color)) {
        this._color = new Color();
      }
      return this._content.batchTable.getColor(this._batchId, this._color);
    },
    set: function (value) {
      this._content.batchTable.setColor(this._batchId, value);
    },
  },

  /**
   * 获取包含折线的 ECEF 位置的类型化数组。
   * 如果 {@link Cesium3DTileset#vectorKeepDecodedPositions} 为 false，则返回 undefined
   * 或特征不是矢量切片中的折线。
   *
   * @memberof Cesium3DTileFeature.prototype
   *
   * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范并非最终版本，并且可能会在没有 Cesium 标准弃用政策的情况下进行更改。
   *
   * @type {Float64Array}
   */
  polylinePositions: {
    get: function () {
      if (!defined(this._content.getPolylinePositions)) {
        return undefined;
      }

      return this._content.getPolylinePositions(this._batchId);
    },
  },

  /**
   * 获取包含该功能的磁贴的内容。
   *
   * @memberof Cesium3DTileFeature.prototype
   *
   * @type {Cesium3DTileContent}
   *
   * @readonly
   * @private
   */
  content: {
    get: function () {
      return this._content;
    },
  },

  /**
   * 获取包含特征的图块集。
   *
   * @memberof Cesium3DTileFeature.prototype
   *
   * @type {Cesium3DTileset}
   *
   * @readonly
   */
  tileset: {
    get: function () {
      return this._content.tileset;
    },
  },

  /**
   * {@link Scene#pick} 返回的所有对象都具有 <code>primitive</code> 属性。这将返回
   * 包含特征的瓦片集。
   *
   * @memberof Cesium3DTileFeature.prototype
   *
   * @type {Cesium3DTileset}
   *
   * @readonly
   */
  primitive: {
    get: function () {
      return this._content.tileset;
    },
  },

  /**
   * 获取与此功能关联的功能 ID。对于 3D 瓦片 1.0，
   * 返回批处理 ID。对于EXT_mesh_features，这是
   * 所选特征 ID 集。
   *
   * @memberof Cesium3DTileFeature.prototype
   *
   * @type {number}
   *
   * @readonly
   * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范不是最终版本，并且可能会在没有 Cesium 标准弃用策略的情况下进行更改。
   */
  featureId: {
    get: function () {
      return this._batchId;
    },
  },

  /**
   * @private
   */
  pickId: {
    get: function () {
      return this._content.batchTable.getPickColor(this._batchId);
    },
  },
});

/**
 * 返回功能是否包含此属性。这包括此功能的
 * 类和继承的类。
 *
 * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_batch_table_hierarchy}
 *
 * @param {string} name 属性的区分大小写的名称。
 * @returns {boolean} 特征是否包含此属性。
 */
Cesium3DTileFeature.prototype.hasProperty = function (name) {
  return this._content.batchTable.hasProperty(this._batchId, name);
};

/**
 * 返回功能的属性 ID 数组。这包括此功能的
 * 类和继承的类。
 *
 * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_batch_table_hierarchy}
 *
 * @param {string[]} [results] 存储结果的数组。
 * @returns {string[]} 功能属性的 ID。
 */
Cesium3DTileFeature.prototype.getPropertyIds = function (results) {
  return this._content.batchTable.getPropertyIds(this._batchId, results);
};

/**
 * 返回具有给定名称的功能属性的值的副本。这包括此功能的
 * 类和继承的类。
 *
 * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_batch_table_hierarchy}
 *
 * @param {string} name 属性的区分大小写的名称。
 * @returns {*} 属性的值，如果特征没有此属性，<code>则为 undefined</code>。
 *
 * @example
 * // Display all the properties for a feature in the console log.
 * const propertyIds = feature.getPropertyIds();
 * const length = propertyIds.length;
 * for (let i = 0; i < length; ++i) {
 *     const propertyId = propertyIds[i];
 *     console.log(`{propertyId}: ${feature.getProperty(propertyId)}`);
 * }
 */
Cesium3DTileFeature.prototype.getProperty = function (name) {
  return this._content.batchTable.getProperty(this._batchId, name);
};

/**
 * 返回具有给定名称的功能属性的副本，检查所有
 * 来自 3D Tiles 1.0 格式的元数据、EXT_structural_metadata 和旧版
 * EXT_feature_metadata glTF 扩展，元数据位于
 * 图块集 JSON （3D Tiles 1.1） 或在 3DTILES_metadata 3D Tiles 扩展中。
 * 根据名称从最具体到最通用的顺序检查元数据，并且
 * 返回第一个匹配项。元数据按以下顺序检查：
 *
 * <ol>
 * <li>按语义划分的批处理表（结构元数据）属性</li>
 * <li>按属性 ID 的批处理表（结构元数据）属性</li>
 * <li>语义的内容元数据属性</li>
 * <li>按属性划分的内容元数据属性</li>
 * <li>按语义划分的平铺元数据属性</li>
 * <li>按属性 ID 划分的平铺元数据属性</li>
 * <li>按语义划分的子树元数据属性</li>
 * <li>按属性 ID 划分的子树元数据属性</li>
 * <li>按语义对元数据属性进行分组</li>
 * <li>按属性 ID 对元数据属性进行分组</li>
 * <li>按语义划分的 Tileset 元数据属性</li>
 * <li>按属性 ID 划分的瓦片集元数据属性</li>
 * <li>否则，返回 undefined</li>
 * </ol>
 * <p>
 * 对于 3D Tiles Next 详细信息， 请参阅 {@link https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_metadata|3DTILES_metadata Extension}
 * 用于 3D 瓦片，以及 {@link https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_structural_metadata|EXT_structural_metadata Extension}
 * 表示 glTF。对于旧版 glTF 扩展， 请参阅 {@link https://github.com/CesiumGS/glTF/tree/3d-tiles-next/extensions/2.0/Vendor/EXT_feature_metadata|EXT_feature_metadata Extension}
 * </p>
 *
 * @param {Cesium3DTileContent} content 用于访问元数据的内容
 * @param {number} batchId 要获取其属性的特征的批处理 ID（或特征 ID）
 * @param {string} name 特征的语义或属性 ID。在每个元数据粒度中，在属性 ID 之前检查语义。
 * @return {*} 属性的值，如果功能没有此属性，<code>则为 undefined</code>。
 *
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范并非最终版本，并且可能会在没有 Cesium 标准弃用政策的情况下进行更改。
 */
Cesium3DTileFeature.getPropertyInherited = function (content, batchId, name) {
  const batchTable = content.batchTable;
  if (defined(batchTable)) {
    if (batchTable.hasPropertyBySemantic(batchId, name)) {
      return batchTable.getPropertyBySemantic(batchId, name);
    }

    if (batchTable.hasProperty(batchId, name)) {
      return batchTable.getProperty(batchId, name);
    }
  }

  const contentMetadata = content.metadata;
  if (defined(contentMetadata)) {
    if (contentMetadata.hasPropertyBySemantic(name)) {
      return contentMetadata.getPropertyBySemantic(name);
    }

    if (contentMetadata.hasProperty(name)) {
      return contentMetadata.getProperty(name);
    }
  }

  const tile = content.tile;
  const tileMetadata = tile.metadata;
  if (defined(tileMetadata)) {
    if (tileMetadata.hasPropertyBySemantic(name)) {
      return tileMetadata.getPropertyBySemantic(name);
    }

    if (tileMetadata.hasProperty(name)) {
      return tileMetadata.getProperty(name);
    }
  }

  let subtreeMetadata;
  if (defined(tile.implicitSubtree)) {
    subtreeMetadata = tile.implicitSubtree.metadata;
  }

  if (defined(subtreeMetadata)) {
    if (subtreeMetadata.hasPropertyBySemantic(name)) {
      return subtreeMetadata.getPropertyBySemantic(name);
    }

    if (subtreeMetadata.hasProperty(name)) {
      return subtreeMetadata.getProperty(name);
    }
  }

  const groupMetadata = defined(content.group)
    ? content.group.metadata
    : undefined;
  if (defined(groupMetadata)) {
    if (groupMetadata.hasPropertyBySemantic(name)) {
      return groupMetadata.getPropertyBySemantic(name);
    }

    if (groupMetadata.hasProperty(name)) {
      return groupMetadata.getProperty(name);
    }
  }

  const tilesetMetadata = content.tileset.metadata;
  if (defined(tilesetMetadata)) {
    if (tilesetMetadata.hasPropertyBySemantic(name)) {
      return tilesetMetadata.getPropertyBySemantic(name);
    }

    if (tilesetMetadata.hasProperty(name)) {
      return tilesetMetadata.getProperty(name);
    }
  }

  return undefined;
};

/**
 * 返回具有给定名称的功能属性的值的副本。
 * 如果要素包含在具有元数据的瓦片集中 （3D Tiles 1.1）
 * 或使用 <code>3DTILES_metadata</code> 扩展、图块集、组和瓦片
 * 元数据是继承的。
 * <p>
 * 为了解决名称冲突，此方法将名称从最具体解析为
 * 按元数据粒度顺序最不具体：feature、tile、group、
 * 图块集。在每个粒度中，首先解析语义，然后解析其他
 *性能。
 * </p>
 * @param {string} name 属性的区分大小写的名称。
 * @returns {*} 属性的值，如果特征没有此属性，<code>则为 undefined</code>。
 * @private
 */
Cesium3DTileFeature.prototype.getPropertyInherited = function (name) {
  return Cesium3DTileFeature.getPropertyInherited(
    this._content,
    this._batchId,
    name
  );
};

/**
 * 使用给定名称设置功能属性的值。
 * <p>
 * 如果具有给定名称的属性不存在，则会创建该属性。
 * </p>
 *
 * @param {string} name 属性的区分大小写的名称。
 * @param {*} value 将要复制的属性的值。
 *
 * @exception {DeveloperError} 继承的批处理表层次结构属性是只读的。
 *
 * @example
 * const height = feature.getProperty('Height'); // e.g., the height of a building
 *
 * @example
 * const name = 'clicked';
 * if (feature.getProperty(name)) {
 *     console.log('already clicked');
 * } else {
 *     feature.setProperty(name, true);
 *     console.log('first click');
 * }
 */
Cesium3DTileFeature.prototype.setProperty = function (name, value) {
  this._content.batchTable.setProperty(this._batchId, name, value);

  // PERFORMANCE_IDEA: Probably overkill, but maybe only mark the tile dirty if the
  // property is in one of the style's expressions or - if it can be done quickly -
  // if the new property value changed the result of an expression.
  this._content.featurePropertiesDirty = true;
};

/**
 * 返回功能的类名是否等于 <code>className</code>。与 {@link Cesium3DTileFeature#isClass} 不同
 * 此函数仅检查功能的确切类，而不检查继承的类。
 * <p>
 * 如果不存在批处理表层次结构，则此函数返回 <code>false</code>。
 * </p>
 *
 * @param {string} className 要检查的名称。
 * @returns {boolean} 特征的类名是否等于 <code>className</code>
 *
 * @private
 */
Cesium3DTileFeature.prototype.isExactClass = function (className) {
  return this._content.batchTable.isExactClass(this._batchId, className);
};

/**
 * 返回功能的类或任何继承的类是否命名为 <code>className</code>。
 * <p>
 * 如果不存在批处理表层次结构，则此函数返回 <code>false</code>。
 * </p>
 *
 * @param {string} className 要检查的名称。
 * @returns {boolean} 功能的类或继承的类是否命名为 <code>className</code>
 *
 * @private
 */
Cesium3DTileFeature.prototype.isClass = function (className) {
  return this._content.batchTable.isClass(this._batchId, className);
};

/**
 * 返回功能的类名。
 * <p>
 * 如果不存在批处理表层次结构，则此函数返回 <code>undefined</code>。
 * </p>
 *
 * @returns {string} 功能的类名。
 *
 * @private
 */
Cesium3DTileFeature.prototype.getExactClassName = function () {
  return this._content.batchTable.getExactClassName(this._batchId);
};
export default Cesium3DTileFeature;
