import Cartographic from "../Core/Cartographic.js";
import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import Cesium3DTileFeature from "./Cesium3DTileFeature.js";
import createBillboardPointCallback from "./createBillboardPointCallback.js";

/**
 * {@link Cesium3DTileset} 的点特征。
 * <p>
 * 还提供对存储在切片的批处理表中的要素属性的访问
 * 作为显示/隐藏特征和更改其点属性的能力
 * </p>
 * <p>
 * 对 <code>Cesium3DTilePointFeature</code> 对象的修改具有瓦片的
 *内容。 如果图块的内容已卸载，例如，由于它超出视图并需要
 * 要在缓存中为可见切片释放空间，请监听 {@link Cesium3DTileset#tileUnload} 事件以保存任何
 *修改。此外，侦听 {@link Cesium3DTileset#tileVisible} 事件以重新应用任何修改。
 * </p>
 * <p>
 * 不要直接构造它。 通过 {@link Cesium3DTileContent#getFeature} 访问它
 * 或使用 {@link Scene#pick} 和 {@link Scene#pickPosition} 进行挑选。
 * </p>
 *
 * @alias Cesium3DTilePointFeature
 * @constructor
 *
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范不是最终版本，并且可能会在没有 Cesium 标准弃用策略的情况下进行更改。
 *
 * @example
 * // On mouse over, display all the properties for a feature in the console log.
 * handler.setInputAction(function(movement) {
 *     const feature = scene.pick(movement.endPosition);
 *     if (feature instanceof Cesium.Cesium3DTilePointFeature) {
 *         const propertyIds = feature.getPropertyIds();
 *         const length = propertyIds.length;
 *         for (let i = 0; i < length; ++i) {
 *             const propertyId = propertyIds[i];
 *             console.log(`{propertyId}: ${feature.getProperty(propertyId)}`);
 *         }
 *     }
 * }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
 */
function Cesium3DTilePointFeature(
  content,
  batchId,
  billboard,
  label,
  polyline,
) {
  this._content = content;
  this._billboard = billboard;
  this._label = label;
  this._polyline = polyline;

  this._batchId = batchId;
  this._billboardImage = undefined;
  this._billboardColor = undefined;
  this._billboardOutlineColor = undefined;
  this._billboardOutlineWidth = undefined;
  this._billboardSize = undefined;
  this._pointSize = undefined;
  this._color = undefined;
  this._pointSize = undefined;
  this._pointOutlineColor = undefined;
  this._pointOutlineWidth = undefined;
  this._heightOffset = undefined;

  this._pickIds = new Array(3);

  setBillboardImage(this);
}

const scratchCartographic = new Cartographic();

Object.defineProperties(Cesium3DTilePointFeature.prototype, {
  /**
   * 获取或设置是否功能。这是为所有功能设置的
   * 评估样式的显示时。
   *
   * @memberof Cesium3DTilePointFeature.prototype
   *
   * @type {boolean}
   *
   * @default true
   */
  show: {
    get: function () {
      return this._label.show;
    },
    set: function (value) {
      this._label.show = value;
      this._billboard.show = value;
      this._polyline.show = value;
    },
  },

  /**
   * 获取或设置此特征的点的颜色。
   * <p>
   * 仅在<code>图像未定义</code>时应用。<code></code>
   * </p>
   *
   * @memberof Cesium3DTilePointFeature.prototype
   *
   * @type {Color}
   */
  color: {
    get: function () {
      return this._color;
    },
    set: function (value) {
      this._color = Color.clone(value, this._color);
      setBillboardImage(this);
    },
  },

  /**
   * 获取或设置磅值。
   * <p>
   * 仅在<code>图像未定义</code>时应用。<code></code>
   * </p>
   *
   * @memberof Cesium3DTilePointFeature.prototype
   *
   * @type {number}
   */
  pointSize: {
    get: function () {
      return this._pointSize;
    },
    set: function (value) {
      this._pointSize = value;
      setBillboardImage(this);
    },
  },

  /**
   * 获取或设置点轮廓颜色。
   * <p>
   * 仅在<code>图像未定义</code>时应用。<code></code>
   * </p>
   *
   * @memberof Cesium3DTilePointFeature.prototype
   *
   * @type {Color}
   */
  pointOutlineColor: {
    get: function () {
      return this._pointOutlineColor;
    },
    set: function (value) {
      this._pointOutlineColor = Color.clone(value, this._pointOutlineColor);
      setBillboardImage(this);
    },
  },

  /**
   * 获取或设置点轮廓宽度（以像素为单位）。
   * <p>
   * 仅在<code>图像未定义</code>时应用。<code></code>
   * </p>
   *
   * @memberof Cesium3DTilePointFeature.prototype
   *
   * @type {number}
   */
  pointOutlineWidth: {
    get: function () {
      return this._pointOutlineWidth;
    },
    set: function (value) {
      this._pointOutlineWidth = value;
      setBillboardImage(this);
    },
  },

  /**
   * 获取或设置标签颜色。
   * <p>
   * 如果定义了 <code>labelText</code>，则颜色将应用于标签。
   * </p>
   *
   * @memberof Cesium3DTilePointFeature.prototype
   *
   * @type {Color}
   */
  labelColor: {
    get: function () {
      return this._label.fillColor;
    },
    set: function (value) {
      this._label.fillColor = value;
      this._polyline.show = this._label.show && value.alpha > 0.0;
    },
  },

  /**
   * 获取或设置标签轮廓颜色。
   * <p>
   * 如果定义了 <code>labelText</code>，则轮廓颜色将应用于标签。
   * </p>
   *
   * @memberof Cesium3DTilePointFeature.prototype
   *
   * @type {Color}
   */
  labelOutlineColor: {
    get: function () {
      return this._label.outlineColor;
    },
    set: function (value) {
      this._label.outlineColor = value;
    },
  },

  /**
   * 获取或设置轮廓宽度（以像素为单位）。
   * <p>
   * 如果定义了 <code>labelText</code>，则轮廓宽度将应用于该点。
   * </p>
   *
   * @memberof Cesium3DTilePointFeature.prototype
   *
   * @type {number}
   */
  labelOutlineWidth: {
    get: function () {
      return this._label.outlineWidth;
    },
    set: function (value) {
      this._label.outlineWidth = value;
    },
  },

  /**
   * 获取或设置字体。
   * <p>
   * 仅在定义 <code>labelText</code> 时应用。
   * </p>
   *
   * @memberof Cesium3DTilePointFeature.prototype
   *
   * @type {string}
   */
  font: {
    get: function () {
      return this._label.font;
    },
    set: function (value) {
      this._label.font = value;
    },
  },

  /**
   * 获取或设置fill 和轮廓样式。
   * <p>
   * 仅在定义 <code>labelText</code> 时应用。
   * </p>
   *
   * @memberof Cesium3DTilePointFeature.prototype
   *
   * @type {LabelStyle}
   */
  labelStyle: {
    get: function () {
      return this._label.style;
    },
    set: function (value) {
      this._label.style = value;
    },
  },

  /**
   * 获取或设置text 来描述此功能。
   *
   * @memberof Cesium3DTilePointFeature.prototype
   *
   * @type {string}
   */
  labelText: {
    get: function () {
      return this._label.text;
    },
    set: function (value) {
      if (!defined(value)) {
        value = "";
      }
      this._label.text = value;
    },
  },

  /**
   * 获取或设置此功能的文本的背景颜色。
   * <p>
   * 仅在定义 <code>labelText</code> 时应用。
   * </p>
   *
   * @memberof Cesium3DTilePointFeature.prototype
   *
   * @type {Color}
   */
  backgroundColor: {
    get: function () {
      return this._label.backgroundColor;
    },
    set: function (value) {
      this._label.backgroundColor = value;
    },
  },

  /**
   * 获取或设置此功能的文本的背景填充。
   * <p>
   * 仅在定义 <code>labelText</code> 时应用。
   * </p>
   *
   * @memberof Cesium3DTilePointFeature.prototype
   *
   * @type {Cartesian2}
   */
  backgroundPadding: {
    get: function () {
      return this._label.backgroundPadding;
    },
    set: function (value) {
      this._label.backgroundPadding = value;
    },
  },

  /**
   * 获取或设置是否显示此功能的文本背景。
   * <p>
   * 仅在定义 <code>labelText</code> 时应用。
   * </p>
   *
   * @memberof Cesium3DTilePointFeature.prototype
   *
   * @type {boolean}
   */
  backgroundEnabled: {
    get: function () {
      return this._label.showBackground;
    },
    set: function (value) {
      this._label.showBackground = value;
    },
  },

  /**
   * 获取或设置near 和 far 缩放属性。
   *
   * @memberof Cesium3DTilePointFeature.prototype
   *
   * @type {NearFarScalar}
   */
  scaleByDistance: {
    get: function () {
      return this._label.scaleByDistance;
    },
    set: function (value) {
      this._label.scaleByDistance = value;
      this._billboard.scaleByDistance = value;
    },
  },

  /**
   * 获取或设置near 和 far 半透明属性。
   *
   * @memberof Cesium3DTilePointFeature.prototype
   *
   * @type {NearFarScalar}
   */
  translucencyByDistance: {
    get: function () {
      return this._label.translucencyByDistance;
    },
    set: function (value) {
      this._label.translucencyByDistance = value;
      this._billboard.translucencyByDistance = value;
    },
  },

  /**
   * 获取或设置条件 指定在距相机多远处显示此功能。
   *
   * @memberof Cesium3DTilePointFeature.prototype
   *
   * @type {DistanceDisplayCondition}
   */
  distanceDisplayCondition: {
    get: function () {
      return this._label.distanceDisplayCondition;
    },
    set: function (value) {
      this._label.distanceDisplayCondition = value;
      this._polyline.distanceDisplayCondition = value;
      this._billboard.distanceDisplayCondition = value;
    },
  },

  /**
   * 获取或设置此特征的高度偏移量（以米为单位）。
   *
   * @memberof Cesium3DTilePointFeature.prototype
   *
   * @type {number}
   */
  heightOffset: {
    get: function () {
      return this._heightOffset;
    },
    set: function (value) {
      const offset = defaultValue(this._heightOffset, 0.0);

      const ellipsoid = this._content.tileset.ellipsoid;
      const cart = ellipsoid.cartesianToCartographic(
        this._billboard.position,
        scratchCartographic,
      );
      cart.height = cart.height - offset + value;
      const newPosition = ellipsoid.cartographicToCartesian(cart);

      this._billboard.position = newPosition;
      this._label.position = this._billboard.position;
      this._polyline.positions = [this._polyline.positions[0], newPosition];

      this._heightOffset = value;
    },
  },

  /**
   * 获取或设置是否显示锚点线。
   * <p>
   * 仅在定义 <code>heightOffset</code> 时应用。
   * </p>
   *
   * @memberof Cesium3DTilePointFeature.prototype
   *
   * @type {boolean}
   */
  anchorLineEnabled: {
    get: function () {
      return this._polyline.show;
    },
    set: function (value) {
      this._polyline.show = value;
    },
  },

  /**
   * 获取或设置anchor line 的颜色。
   * <p>
   * 仅在定义 <code>heightOffset</code> 时应用。
   * </p>
   *
   * @memberof Cesium3DTilePointFeature.prototype
   *
   * @type {Color}
   */
  anchorLineColor: {
    get: function () {
      return this._polyline.material.uniforms.color;
    },
    set: function (value) {
      this._polyline.material.uniforms.color = Color.clone(
        value,
        this._polyline.material.uniforms.color,
      );
    },
  },

  /**
   * 获取或设置此功能的图像。
   *
   * @memberof Cesium3DTilePointFeature.prototype
   *
   * @type {string}
   */
  image: {
    get: function () {
      return this._billboardImage;
    },
    set: function (value) {
      const imageChanged = this._billboardImage !== value;
      this._billboardImage = value;
      if (imageChanged) {
        setBillboardImage(this);
      }
    },
  },

  /**
   * 获取或设置距离，深度测试将被禁用。
   *
   * @memberof Cesium3DTilePointFeature.prototype
   *
   * @type {number}
   */
  disableDepthTestDistance: {
    get: function () {
      return this._label.disableDepthTestDistance;
    },
    set: function (value) {
      this._label.disableDepthTestDistance = value;
      this._billboard.disableDepthTestDistance = value;
    },
  },

  /**
   * 获取或设置此点的水平原点，用于确定该点是否为
   * 拖动到其锚点位置的左侧、中间或右侧。
   *
   * @memberof Cesium3DTilePointFeature.prototype
   *
   * @type {HorizontalOrigin}
   */
  horizontalOrigin: {
    get: function () {
      return this._billboard.horizontalOrigin;
    },
    set: function (value) {
      this._billboard.horizontalOrigin = value;
    },
  },

  /**
   * 获取或设置此点的垂直原点，用于确定该点是否为
   * 拖动到其锚点位置的底部、中心或顶部。
   *
   * @memberof Cesium3DTilePointFeature.prototype
   *
   * @type {VerticalOrigin}
   */
  verticalOrigin: {
    get: function () {
      return this._billboard.verticalOrigin;
    },
    set: function (value) {
      this._billboard.verticalOrigin = value;
    },
  },

  /**
   * 获取或设置此点的文本的水平原点，用于确定该点的文本是否为
   * 拖动到其锚点位置的左侧、中间或右侧。
   *
   * @memberof Cesium3DTilePointFeature.prototype
   *
   * @type {HorizontalOrigin}
   */
  labelHorizontalOrigin: {
    get: function () {
      return this._label.horizontalOrigin;
    },
    set: function (value) {
      this._label.horizontalOrigin = value;
    },
  },

  /**
   * 获取或设置此点文本的垂直原点，这决定了该点的文本是否为
   * 拖动到其锚点的底部、中心、顶部或基线。
   *
   * @memberof Cesium3DTilePointFeature.prototype
   *
   * @type {VerticalOrigin}
   */
  labelVerticalOrigin: {
    get: function () {
      return this._label.verticalOrigin;
    },
    set: function (value) {
      this._label.verticalOrigin = value;
    },
  },

  /**
   * 获取包含该功能的磁贴的内容。
   *
   * @memberof Cesium3DTilePointFeature.prototype
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
   * @memberof Cesium3DTilePointFeature.prototype
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
   * @memberof Cesium3DTilePointFeature.prototype
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
   * @private
   */
  pickIds: {
    get: function () {
      const ids = this._pickIds;
      ids[0] = this._billboard.pickId;
      ids[1] = this._label.pickId;
      ids[2] = this._polyline.pickId;
      return ids;
    },
  },
});

Cesium3DTilePointFeature.defaultColor = Color.WHITE;
Cesium3DTilePointFeature.defaultPointOutlineColor = Color.BLACK;
Cesium3DTilePointFeature.defaultPointOutlineWidth = 0.0;
Cesium3DTilePointFeature.defaultPointSize = 8.0;

function setBillboardImage(feature) {
  const b = feature._billboard;
  if (defined(feature._billboardImage) && feature._billboardImage !== b.image) {
    b.image = feature._billboardImage;
    return;
  }

  if (defined(feature._billboardImage)) {
    return;
  }

  const newColor = defaultValue(
    feature._color,
    Cesium3DTilePointFeature.defaultColor,
  );
  const newOutlineColor = defaultValue(
    feature._pointOutlineColor,
    Cesium3DTilePointFeature.defaultPointOutlineColor,
  );
  const newOutlineWidth = defaultValue(
    feature._pointOutlineWidth,
    Cesium3DTilePointFeature.defaultPointOutlineWidth,
  );
  const newPointSize = defaultValue(
    feature._pointSize,
    Cesium3DTilePointFeature.defaultPointSize,
  );

  const currentColor = feature._billboardColor;
  const currentOutlineColor = feature._billboardOutlineColor;
  const currentOutlineWidth = feature._billboardOutlineWidth;
  const currentPointSize = feature._billboardSize;

  if (
    Color.equals(newColor, currentColor) &&
    Color.equals(newOutlineColor, currentOutlineColor) &&
    newOutlineWidth === currentOutlineWidth &&
    newPointSize === currentPointSize
  ) {
    return;
  }

  feature._billboardColor = Color.clone(newColor, feature._billboardColor);
  feature._billboardOutlineColor = Color.clone(
    newOutlineColor,
    feature._billboardOutlineColor,
  );
  feature._billboardOutlineWidth = newOutlineWidth;
  feature._billboardSize = newPointSize;

  const centerAlpha = newColor.alpha;
  const cssColor = newColor.toCssColorString();
  const cssOutlineColor = newOutlineColor.toCssColorString();
  const textureId = JSON.stringify([
    cssColor,
    newPointSize,
    cssOutlineColor,
    newOutlineWidth,
  ]);

  b.setImage(
    textureId,
    createBillboardPointCallback(
      centerAlpha,
      cssColor,
      cssOutlineColor,
      newOutlineWidth,
      newPointSize,
    ),
  );
}

/**
 * 返回功能是否包含此属性。这包括此功能的
 * 类和继承的类。
 *
 * @see {@link https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_batch_table_hierarchy}
 *
 * @param {string} name 属性的区分大小写的名称。
 * @returns {boolean} 特征是否包含此属性。
 */
Cesium3DTilePointFeature.prototype.hasProperty = function (name) {
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
Cesium3DTilePointFeature.prototype.getPropertyIds = function (results) {
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
 *     console.log(`{propertyId} : ${feature.getProperty(propertyId)}`);
 * }
 */
Cesium3DTilePointFeature.prototype.getProperty = function (name) {
  return this._content.batchTable.getProperty(this._batchId, name);
};

/**
 * 返回具有给定名称的功能属性的值的副本。
 * 如果要素包含在具有元数据的瓦片集中 （3D Tiles 1.1）
 * 或使用<code>3DTILES_metadata</code>扩展、tileset、group 和 tile 元数据是
 *继承。
 * <p>
 * 为了解决名称冲突，此方法将名称从最具体解析为
 * 按元数据粒度顺序最不具体：feature、tile、group、
 * 图块集。在每个粒度中，首先解析语义，然后解析其他
 *性能。
 * </p>
 * @param {string} name 属性的区分大小写的名称。
 * @returns {*} 属性的值，如果特征没有此属性，<code>则为 undefined</code>。
 * @private
 * @experimental 此功能使用的是 3D Tiles 规范的一部分，该规范并非最终版本，并且可能会在没有 Cesium 标准弃用政策的情况下进行更改。
 */
Cesium3DTilePointFeature.prototype.getPropertyInherited = function (name) {
  return Cesium3DTileFeature.getPropertyInherited(
    this._content,
    this._batchId,
    name,
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
 * @exception {DeveloperError} Inherited batch table hierarchy property is read only.
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
Cesium3DTilePointFeature.prototype.setProperty = function (name, value) {
  this._content.batchTable.setProperty(this._batchId, name, value);

  // PERFORMANCE_IDEA: Probably overkill, but maybe only mark the tile dirty if the
  // property is in one of the style's expressions or - if it can be done quickly -
  // if the new property value changed the result of an expression.
  this._content.featurePropertiesDirty = true;
};

/**
 * 返回功能的类名是否等于 <code>className</code>。与 {@link Cesium3DTilePointFeature#isClass} 不同
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
Cesium3DTilePointFeature.prototype.isExactClass = function (className) {
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
Cesium3DTilePointFeature.prototype.isClass = function (className) {
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
Cesium3DTilePointFeature.prototype.getExactClassName = function () {
  return this._content.batchTable.getExactClassName(this._batchId);
};
export default Cesium3DTilePointFeature;
