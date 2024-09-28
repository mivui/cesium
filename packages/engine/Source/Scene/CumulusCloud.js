import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Check from "../Core/Check.js";
import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";

/**
 * <div class="notice">
 * 创建一个云，并通过调用 {@link CloudCollection#add}.
 * and {@link CloudCollection#remove}. 不要直接调用构造函数。
 * </div>
 * 位于 3D 场景中的积云公告牌，使用 {@link CloudCollection}.
 * <br /><br />
 * <div align='center'>
 * <img src='Images/CumulusCloud.png' width='400' height='300' /><br />
 * 积云示例
 * </div>
 * @alias CumulusCloud
 *
 * @performance 类似于 {@link Billboard}，读取属性，例如 {@link CumulusCloud#show}，
 * 需要恒定的时间。分配给属性是恒定时间，但会导致
 * 调用 {@link CloudCollection#update} 时的 CPU 到 GPU 流量。 每个云的流量为
 * 无论更新了多少个属性，都是相同的。 如果集合中的大多数云需要
 * 已更新，使用 {@link CloudCollection#removeAll} 清除集合可能更有效
 * 并添加新的云，而不是修改每个云。
 *
 * @see CloudCollection
 * @see CloudCollection#add
 *
 * @internalConstructor
 * @class
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Cloud%20Parameters.html|Cesium Sandcastle Cloud Parameters Demo}
 */
function CumulusCloud(options, cloudCollection) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  this._show = defaultValue(options.show, true);

  this._position = Cartesian3.clone(
    defaultValue(options.position, Cartesian3.ZERO),
  );

  if (!defined(options.scale) && defined(options.maximumSize)) {
    this._maximumSize = Cartesian3.clone(options.maximumSize);
    this._scale = new Cartesian2(this._maximumSize.x, this._maximumSize.y);
  } else {
    this._scale = Cartesian2.clone(
      defaultValue(options.scale, new Cartesian2(20.0, 12.0)),
    );

    const defaultMaxSize = new Cartesian3(
      this._scale.x,
      this._scale.y,
      Math.min(this._scale.x, this._scale.y) / 1.5,
    );
    this._maximumSize = Cartesian3.clone(
      defaultValue(options.maximumSize, defaultMaxSize),
    );
  }

  this._slice = defaultValue(options.slice, -1.0);
  this._color = Color.clone(defaultValue(options.color, Color.WHITE));
  this._brightness = defaultValue(options.brightness, 1.0);
  this._cloudCollection = cloudCollection;
  this._index = -1; // Used by CloudCollection
}

const SHOW_INDEX = (CumulusCloud.SHOW_INDEX = 0);
const POSITION_INDEX = (CumulusCloud.POSITION_INDEX = 1);
const SCALE_INDEX = (CumulusCloud.SCALE_INDEX = 2);
const MAXIMUM_SIZE_INDEX = (CumulusCloud.MAXIMUM_SIZE_INDEX = 3);
const SLICE_INDEX = (CumulusCloud.SLICE_INDEX = 4);
const BRIGHTNESS_INDEX = (CumulusCloud.BRIGHTNESS_INDEX = 5);
const COLOR_INDEX = (CumulusCloud.COLOR_INDEX = 6);
CumulusCloud.NUMBER_OF_PROPERTIES = 7;

function makeDirty(cloud, propertyChanged) {
  const cloudCollection = cloud._cloudCollection;
  if (defined(cloudCollection)) {
    cloudCollection._updateCloud(cloud, propertyChanged);
    cloud._dirty = true;
  }
}

Object.defineProperties(CumulusCloud.prototype, {
  /**
   * 确定是否显示此积云。 使用它来隐藏或显示云
   * 将其删除并重新添加到集合中。
   * @memberof CumulusCloud.prototype
   * @type {boolean}
   * @default true
   */
  show: {
    get: function () {
      return this._show;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.bool("value", value);
      //>>includeEnd('debug');

      if (this._show !== value) {
        this._show = value;
        makeDirty(this, SHOW_INDEX);
      }
    },
  },

  /**
   * 获取或设置这个积云的笛卡尔位置。
   * @memberof CumulusCloud.prototype
   * @type {Cartesian3}
   */
  position: {
    get: function () {
      return this._position;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug)
      Check.typeOf.object("value", value);
      //>>includeEnd('debug');

      const position = this._position;
      if (!Cartesian3.equals(position, value)) {
        Cartesian3.clone(value, position);
        makeDirty(this, POSITION_INDEX);
      }
    },
  },

  /**
   * <p>获取或设置积云公告牌的比例（以米为单位）。
   * <code>scale</code> 属性会影响公告板的大小，
   * 但不是云的实际外观。</p>
   * <div align='center'>
   * <table border='0' cellpadding='5'><tr>
   * <td align='center'>
   *   <code>cloud.scale = new Cesium.Cartesian2(12, 8);</code><br/>
   *   <img src='Images/CumulusCloud.scalex12y8.png' width='250' height='158' />
   * </td>
   * <td align='center'>
   *   <code>cloud.scale = new Cesium.Cartesian2(24, 10);</code><br/>
   *   <img src='Images/CumulusCloud.scalex24y10.png' width='250' height='158' />
   * </td>
   * </tr></table>
   * </div>
   *
   * <p>要修改云的外观，请修改其 <code>maximumSize</code>
   * 和 <code>slice</code> 属性。</p>
   * @memberof CumulusCloud.prototype
   * @type {Cartesian2}
   *
   * @see CumulusCloud#maximumSize
   * @see CumulusCloud#slice
   */
  scale: {
    get: function () {
      return this._scale;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug)
      Check.typeOf.object("value", value);
      //>>includeEnd('debug');

      const scale = this._scale;
      if (!Cartesian2.equals(scale, value)) {
        Cartesian2.clone(value, scale);
        makeDirty(this, SCALE_INDEX);
      }
    },
  },

  /**
   * <p>获取或设置在公告牌上渲染的积云的最大大小。
   * 这定义了云可以出现在其中的最大椭球体体积。
   * 这并不是保证特定大小，而是为
   * 云，更改它会影响云的形状。</p>
   * <p>更改 <code>maximumSize</code> 的 z 值具有最显著的效果
   * 在云的外观上，因为它会改变云的深度，从而改变
   * 对云形成纹理进行采样的位置。</p>
   * <div align='center'>
   * <table border='0' cellpadding='5'>
   * <tr>
   *   <td align='center'>
   *     <code>cloud.maximumSize = new Cesium.Cartesian3(14, 9, 10);</code><br/>
   *     <img src='Images/CumulusCloud.maximumSizex14y9z10.png' width='250' height='158' />
   *   </td>
   *   <td align='center'>
   *     <code>cloud.maximumSize.x = 25;</code><br/>
   *     <img src='Images/CumulusCloud.maximumSizex25.png' width='250' height='158' />
   *   </td>
   * </tr>
   * <tr>
   *   <td align='center'>
   *     <code>cloud.maximumSize.y = 5;</code><br/>
   *     <img src='Images/CumulusCloud.maximumSizey5.png' width='250' height='158' />
   *   </td>
   *   <td align='center'>
   *     <code>cloud.maximumSize.z = 17;</code><br/>
   *     <img src='Images/CumulusCloud.maximumSizez17.png' width='250' height='158' />
   *   </td>
   * </tr>
   * </table>
   * </div>
   *
   * <p>要修改公告板的实际大小，请修改云的 <code>scale</code> 属性。</p>
   * @memberof CumulusCloud.prototype
   * @type {Cartesian3}
   *
   * @see CumulusCloud#scale
   */
  maximumSize: {
    get: function () {
      return this._maximumSize;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug)
      Check.typeOf.object("value", value);
      //>>includeEnd('debug');

      const maximumSize = this._maximumSize;
      if (!Cartesian3.equals(maximumSize, value)) {
        Cartesian3.clone(value, maximumSize);
        makeDirty(this, MAXIMUM_SIZE_INDEX);
      }
    },
  },
  /**
   * 设置云的颜色
   * @memberof CumulusCloud.prototype
   * @type {Color}
   * @default Color.WHITE
   */
  color: {
    get: function () {
      return this._color;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug)
      Check.typeOf.object("value", value);
      //>>includeEnd('debug');

      const color = this._color;
      if (!Color.equals(color, value)) {
        Color.clone(value, color);
        makeDirty(this, COLOR_INDEX);
      }
    },
  },
  /**
   * <p>获取或设置在公告牌上渲染的云的 “切片”，即
   * 为 Billboard 的外观选择的云的特定横截面。
   * 给定一个介于 0 和 1 之间的值，该切片指定在云中的深度
   * 以根据其在 z 方向上的最大大小相交。</p>
   * <div align='center'>
   * <table border='0' cellpadding='5'><tr>
   * <td align='center'><code>cloud.slice = 0.32;</code><br/><img src='Images/CumulusCloud.slice0.32.png' width='250' height='158' /></td>
   * <td align='center'><code>cloud.slice = 0.5;</code><br/><img src='Images/CumulusCloud.slice0.5.png' width='250' height='158' /></td>
   * <td align='center'><code>cloud.slice = 0.6;</code><br/><img src='Images/CumulusCloud.slice0.6.png' width='250' height='158' /></td>
   * </tr></table>
   * </div>
   *
   * <br />
   * <p>Due to the nature in which this slice is calculated,
   * values below <code>0.2</code> may result in cross-sections that are too small,
   * and the edge of the ellipsoid will be visible. Similarly, values above <code>0.7</code>
   * will cause the cloud to appear smaller. Values outside the range <code>[0.1, 0.9]</code>
   * should be avoided entirely because they do not produce desirable results.</p>
   *
   * <div align='center'>
   * <table border='0' cellpadding='5'><tr>
   * <td align='center'><code>cloud.slice = 0.08;</code><br/><img src='Images/CumulusCloud.slice0.08.png' width='250' height='158' /></td>
   * <td align='center'><code>cloud.slice = 0.8;</code><br/><img src='Images/CumulusCloud.slice0.8.png' width='250' height='158' /></td>
   * </tr></table>
   * </div>
   *
   *<p>如果 <code>slice</code> 设置为负数，则云将不会渲染横截面。
   * 相反，它将呈现可见的椭球体外部。对于具有
   * 较小的 'maximumSize.z' 值，这可以产生好看的结果，但对于较大的
   * 云，这可能会导致云意外地扭曲到椭球体体积。</p>
   *
   * <div align='center'>
   * <table border='0' cellpadding='5'><tr>
   * <td align='center'>
   *  <code>cloud.slice = -1.0;<br/>cloud.maximumSize.z = 18;</code><br/>
   *  <img src='Images/CumulusCloud.slice-1z18.png' width='250' height='158' />
   * </td>
   * <td align='center'>
   *   <code>cloud.slice = -1.0;<br/>cloud.maximumSize.z = 30;</code><br/>
   *   <img src='Images/CumulusCloud.slice-1z30.png' width='250' height='158' /></td>
   * </tr></table>
   * </div>
   *
   * @memberof CumulusCloud.prototype
   * @type {number}
   * @default -1.0
   */
  slice: {
    get: function () {
      return this._slice;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug)
      Check.typeOf.number("value", value);
      //>>includeEnd('debug');

      const slice = this._slice;
      if (slice !== value) {
        this._slice = value;
        makeDirty(this, SLICE_INDEX);
      }
    },
  },

  /**
   * 获取或设置云的亮度。这可用于提供 cloud
   * 外观更暗、更灰。
   * <br /><br />
   * <div align='center'>
   * <table border='0' cellpadding='5'><tr>
   * <td align='center'><code>cloud.brightness = 1.0;</code><br/><img src='Images/CumulusCloud.brightness1.png' width='250' height='158' /></td>
   * <td align='center'><code>cloud.brightness = 0.6;</code><br/><img src='Images/CumulusCloud.brightness0.6.png' width='250' height='158' /></td>
   * <td align='center'><code>cloud.brightness = 0.0;</code><br/><img src='Images/CumulusCloud.brightness0.png' width='250' height='158' /></td>
   * </tr></table>
   * </div>
   * @memberof CumulusCloud.prototype
   * @type {number}
   * @default 1.0
   */
  brightness: {
    get: function () {
      return this._brightness;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug)
      Check.typeOf.number("value", value);
      //>>includeEnd('debug');

      const brightness = this._brightness;
      if (brightness !== value) {
        this._brightness = value;
        makeDirty(this, BRIGHTNESS_INDEX);
      }
    },
  },
});

CumulusCloud.prototype._destroy = function () {
  this._cloudCollection = undefined;
};

export default CumulusCloud;
