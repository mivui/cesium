import BoundingRectangle from "../Core/BoundingRectangle.js";
import Cartesian2 from "../Core/Cartesian2.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartesian4 from "../Core/Cartesian4.js";
import Cartographic from "../Core/Cartographic.js";
import Check from "../Core/Check.js";
import Color from "../Core/Color.js";
import createGuid from "../Core/createGuid.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import DistanceDisplayCondition from "../Core/DistanceDisplayCondition.js";
import Ellipsoid from "../Core/Ellipsoid.js";
import Matrix4 from "../Core/Matrix4.js";
import NearFarScalar from "../Core/NearFarScalar.js";
import Resource from "../Core/Resource.js";
import HeightReference, {
  isHeightReferenceRelative,
} from "./HeightReference.js";
import HorizontalOrigin from "./HorizontalOrigin.js";
import SceneMode from "./SceneMode.js";
import SceneTransforms from "./SceneTransforms.js";
import VerticalOrigin from "./VerticalOrigin.js";
import SplitDirection from "./SplitDirection.js";

/**
 * @typedef {object} Billboard.ConstructorOptions
 *
 * Billboard 构造函数的第一个参数的初始化选项
 *
 * @property {Cartesian3} position 广告牌的笛卡尔位置。
 * @property {*} [id] 使用 {@link Scene#pick} 选取公告牌时返回的用户定义对象。
 * @property {boolean} [show=true] 确定是否显示此公告板。
 * @property {string |HTMLCanvasElement} [image] 一个加载的 HTMLImageElement、ImageData 或用于广告牌的图像的 URL。
 * @property {number} [scale=1.0] 一个数字，用于指定均匀缩放比例，该比例乘以公告牌的图像大小（以像素为单位）。
 * @property {Cartesian2} [pixelOffset=Cartesian2.ZERO] A {@link Cartesian2} 指定屏幕空间中与此广告牌原点的像素偏移量。
 * @property {Cartesian3} [eyeOffset=Cartesian3.ZERO] A {@link Cartesian3} 指定在眼坐标中应用于此广告牌的 3D 笛卡尔偏移量。
 * @property {HorizontalOrigin} [horizontalOrigin=HorizontalOrigin.CENTER] A {@link HorizontalOrigin} 指定此广告牌的水平原点。
 * @property {VerticalOrigin} [verticalOrigin=VerticalOrigin.CENTER] A {@link VerticalOrigin} 指定此广告牌的垂直原点。
 * @property {HeightReference} [heightReference=HeightReference.NONE] A {@link HeightReference} 指定此公告牌的高度参考。
 * @property {Color} [color=Color.WHITE] A {@link Color} 指定与公告牌纹理相乘的颜色。
 * @property {number} [rotation=0] 一个数字，指定以弧度为单位的旋转角度。
 * @property {Cartesian3} [alignedAxis=Cartesian3.ZERO] A {@link Cartesian3} 指定世界空间中对齐的轴。
 * @property {boolean} [sizeInMeters] 一个布尔值，指定广告牌的大小是以米为单位还是以像素为单位。
 * @property {number} [width] 指定公告牌宽度的数字。如果未定义，则将使用图像宽度。
 * @property {number} [height] 指定公告牌高度的数字。如果未定义，则将使用图像高度。
 * @property {NearFarScalar} [scaleByDistance] A {@link NearFarScalar} 根据公告牌与摄像机的距离指定公告牌的近距和远距缩放属性。
 * @property {NearFarScalar} [translucencyByDistance] A {@link NearFarScalar} 根据公告牌与摄像机的距离指定公告牌的近距和远距半透明属性。
 * @property {NearFarScalar} [pixelOffsetScaleByDistance] A {@link NearFarScalar} 根据公告牌与摄像机的距离指定公告牌的近距和远距像素偏移缩放属性。
 * @property {BoundingRectangle} [imageSubRegion] A {@link BoundingRectangle} 指定要用于公告牌的图像子区域，而不是整个图像。
 * @property {DistanceDisplayCondition} [distanceDisplayCondition] A {@link DistanceDisplayCondition} 指定显示此公告牌的摄像机的距离。
 * @property {number} [disableDepthTestDistance] 一个数字，用于指定与摄像机的距离，在该距离处禁用深度测试，例如，防止针对地形进行裁剪。
 * @property {SplitDirection} [splitDirection] A {@link SplitDirection} 指定公告牌的 split 属性。
 */

/**
 * <div class="notice">
 * 将创建一个公告板，其初始
 * 属性通过调用{@link BillboardCollection#add}. 不要直接调用构造函数。
 * </div>
 * 位于 3D 场景中的与视口对齐的图像，该图像是创建的
 * 并使用 {@link BillboardCollection} 进行渲染。
 * <br /><br />
 * <div align='center'>
 * <img src='Images/Billboard.png' width='400' height='300' /><br />
 * 广告牌示例
 * </div>
 *
 * @alias Billboard
 *
 * @performance 读取属性（例如 {@link Billboard#show}）是恒定时间。
 * 分配给属性是恒定时间，但会导致
 * 调用 {@link BillboardCollection#update} 时的 CPU 到 GPU 流量。 每个公告牌的流量为
 * 无论更新了多少个属性，都是相同的。 如果集合中的大多数广告牌都需要
 * 更新，使用 {@link BillboardCollection#removeAll} 清除收藏可能会更有效。
 * 并添加新的广告牌，而不是修改每个广告牌。
 *
 * @exception {DeveloperError} scaleByDistance.far must be greater than scaleByDistance.near
 * @exception {DeveloperError} translucencyByDistance.far must be greater than translucencyByDistance.near
 * @exception {DeveloperError} pixelOffsetScaleByDistance.far must be greater than pixelOffsetScaleByDistance.near
 * @exception {DeveloperError} distanceDisplayCondition.far must be greater than distanceDisplayCondition.near
 *
 * @see BillboardCollection
 * @see BillboardCollection#add
 * @see Label
 *
 * @internalConstructor
 * @class
 *
 * @param {Billboard.ConstructorOptions} options 描述初始化选项的对象
 * @param {BillboardCollection} billboardCollection Instance of BillboardCollection
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Billboards.html|Cesium Sandcastle Billboard Demo}
 */
function Billboard(options, billboardCollection) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  //>>includeStart('debug', pragmas.debug);
  if (
    defined(options.disableDepthTestDistance) &&
    options.disableDepthTestDistance < 0.0
  ) {
    throw new DeveloperError(
      "disableDepthTestDistance must be greater than or equal to 0.0.",
    );
  }
  //>>includeEnd('debug');

  let translucencyByDistance = options.translucencyByDistance;
  let pixelOffsetScaleByDistance = options.pixelOffsetScaleByDistance;
  let scaleByDistance = options.scaleByDistance;
  let distanceDisplayCondition = options.distanceDisplayCondition;
  if (defined(translucencyByDistance)) {
    //>>includeStart('debug', pragmas.debug);
    if (translucencyByDistance.far <= translucencyByDistance.near) {
      throw new DeveloperError(
        "translucencyByDistance.far must be greater than translucencyByDistance.near.",
      );
    }
    //>>includeEnd('debug');
    translucencyByDistance = NearFarScalar.clone(translucencyByDistance);
  }
  if (defined(pixelOffsetScaleByDistance)) {
    //>>includeStart('debug', pragmas.debug);
    if (pixelOffsetScaleByDistance.far <= pixelOffsetScaleByDistance.near) {
      throw new DeveloperError(
        "pixelOffsetScaleByDistance.far must be greater than pixelOffsetScaleByDistance.near.",
      );
    }
    //>>includeEnd('debug');
    pixelOffsetScaleByDistance = NearFarScalar.clone(
      pixelOffsetScaleByDistance,
    );
  }
  if (defined(scaleByDistance)) {
    //>>includeStart('debug', pragmas.debug);
    if (scaleByDistance.far <= scaleByDistance.near) {
      throw new DeveloperError(
        "scaleByDistance.far must be greater than scaleByDistance.near.",
      );
    }
    //>>includeEnd('debug');
    scaleByDistance = NearFarScalar.clone(scaleByDistance);
  }
  if (defined(distanceDisplayCondition)) {
    //>>includeStart('debug', pragmas.debug);
    if (distanceDisplayCondition.far <= distanceDisplayCondition.near) {
      throw new DeveloperError(
        "distanceDisplayCondition.far must be greater than distanceDisplayCondition.near.",
      );
    }
    //>>includeEnd('debug');
    distanceDisplayCondition = DistanceDisplayCondition.clone(
      distanceDisplayCondition,
    );
  }

  this._show = defaultValue(options.show, true);
  this._position = Cartesian3.clone(
    defaultValue(options.position, Cartesian3.ZERO),
  );
  this._actualPosition = Cartesian3.clone(this._position); // For columbus view and 2D
  this._pixelOffset = Cartesian2.clone(
    defaultValue(options.pixelOffset, Cartesian2.ZERO),
  );
  this._translate = new Cartesian2(0.0, 0.0); // used by labels for glyph vertex translation
  this._eyeOffset = Cartesian3.clone(
    defaultValue(options.eyeOffset, Cartesian3.ZERO),
  );
  this._heightReference = defaultValue(
    options.heightReference,
    HeightReference.NONE,
  );
  this._verticalOrigin = defaultValue(
    options.verticalOrigin,
    VerticalOrigin.CENTER,
  );
  this._horizontalOrigin = defaultValue(
    options.horizontalOrigin,
    HorizontalOrigin.CENTER,
  );
  this._scale = defaultValue(options.scale, 1.0);
  this._color = Color.clone(defaultValue(options.color, Color.WHITE));
  this._rotation = defaultValue(options.rotation, 0.0);
  this._alignedAxis = Cartesian3.clone(
    defaultValue(options.alignedAxis, Cartesian3.ZERO),
  );
  this._width = options.width;
  this._height = options.height;
  this._scaleByDistance = scaleByDistance;
  this._translucencyByDistance = translucencyByDistance;
  this._pixelOffsetScaleByDistance = pixelOffsetScaleByDistance;
  this._sizeInMeters = defaultValue(options.sizeInMeters, false);
  this._distanceDisplayCondition = distanceDisplayCondition;
  this._disableDepthTestDistance = options.disableDepthTestDistance;
  this._id = options.id;
  this._collection = defaultValue(options.collection, billboardCollection);

  this._pickId = undefined;
  this._pickPrimitive = defaultValue(options._pickPrimitive, this);
  this._billboardCollection = billboardCollection;
  this._dirty = false;
  this._index = -1; //Used only by BillboardCollection
  this._batchIndex = undefined; // Used only by Vector3DTilePoints and BillboardCollection

  this._imageIndex = -1;
  this._imageIndexPromise = undefined;
  this._imageId = undefined;
  this._image = undefined;
  this._imageSubRegion = undefined;
  this._imageWidth = undefined;
  this._imageHeight = undefined;

  this._labelDimensions = undefined;
  this._labelHorizontalOrigin = undefined;
  this._labelTranslate = undefined;

  const image = options.image;
  let imageId = options.imageId;
  if (defined(image)) {
    if (!defined(imageId)) {
      if (typeof image === "string") {
        imageId = image;
      } else if (defined(image.src)) {
        imageId = image.src;
      } else {
        imageId = createGuid();
      }
    }

    this._imageId = imageId;
    this._image = image;
  }

  if (defined(options.imageSubRegion)) {
    this._imageId = imageId;
    this._imageSubRegion = options.imageSubRegion;
  }

  if (defined(this._billboardCollection._textureAtlas)) {
    this._loadImage();
  }

  this._actualClampedPosition = undefined;
  this._removeCallbackFunc = undefined;
  this._mode = SceneMode.SCENE3D;

  this._clusterShow = true;
  this._outlineColor = Color.clone(
    defaultValue(options.outlineColor, Color.BLACK),
  );
  this._outlineWidth = defaultValue(options.outlineWidth, 0.0);

  this._updateClamping();

  this._splitDirection = defaultValue(
    options.splitDirection,
    SplitDirection.NONE,
  );
}

const SHOW_INDEX = (Billboard.SHOW_INDEX = 0);
const POSITION_INDEX = (Billboard.POSITION_INDEX = 1);
const PIXEL_OFFSET_INDEX = (Billboard.PIXEL_OFFSET_INDEX = 2);
const EYE_OFFSET_INDEX = (Billboard.EYE_OFFSET_INDEX = 3);
const HORIZONTAL_ORIGIN_INDEX = (Billboard.HORIZONTAL_ORIGIN_INDEX = 4);
const VERTICAL_ORIGIN_INDEX = (Billboard.VERTICAL_ORIGIN_INDEX = 5);
const SCALE_INDEX = (Billboard.SCALE_INDEX = 6);
const IMAGE_INDEX_INDEX = (Billboard.IMAGE_INDEX_INDEX = 7);
const COLOR_INDEX = (Billboard.COLOR_INDEX = 8);
const ROTATION_INDEX = (Billboard.ROTATION_INDEX = 9);
const ALIGNED_AXIS_INDEX = (Billboard.ALIGNED_AXIS_INDEX = 10);
const SCALE_BY_DISTANCE_INDEX = (Billboard.SCALE_BY_DISTANCE_INDEX = 11);
const TRANSLUCENCY_BY_DISTANCE_INDEX =
  (Billboard.TRANSLUCENCY_BY_DISTANCE_INDEX = 12);
const PIXEL_OFFSET_SCALE_BY_DISTANCE_INDEX =
  (Billboard.PIXEL_OFFSET_SCALE_BY_DISTANCE_INDEX = 13);
const DISTANCE_DISPLAY_CONDITION = (Billboard.DISTANCE_DISPLAY_CONDITION = 14);
const DISABLE_DEPTH_DISTANCE = (Billboard.DISABLE_DEPTH_DISTANCE = 15);
Billboard.TEXTURE_COORDINATE_BOUNDS = 16;
const SDF_INDEX = (Billboard.SDF_INDEX = 17);
const SPLIT_DIRECTION_INDEX = (Billboard.SPLIT_DIRECTION_INDEX = 18);
Billboard.NUMBER_OF_PROPERTIES = 19;

function makeDirty(billboard, propertyChanged) {
  const billboardCollection = billboard._billboardCollection;
  if (defined(billboardCollection)) {
    billboardCollection._updateBillboard(billboard, propertyChanged);
    billboard._dirty = true;
  }
}

Object.defineProperties(Billboard.prototype, {
  /**
   * 确定是否显示此公告牌。 使用它来隐藏或显示公告牌
   * 将其删除并重新添加到集合中。
   * @memberof Billboard.prototype
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
   * 获取或设置此广告牌的笛卡尔位置。
   * @memberof Billboard.prototype
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
        Cartesian3.clone(value, this._actualPosition);
        this._updateClamping();
        makeDirty(this, POSITION_INDEX);
      }
    },
  },

  /**
   * 获取或设置高度参考。
   * @memberof Billboard.prototype
   * @type {HeightReference}
   * @default HeightReference.NONE
   */
  heightReference: {
    get: function () {
      return this._heightReference;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug)
      Check.typeOf.number("value", value);
      //>>includeEnd('debug');

      const heightReference = this._heightReference;
      if (value !== heightReference) {
        this._heightReference = value;
        this._updateClamping();
        makeDirty(this, POSITION_INDEX);
      }
    },
  },

  /**
   * 获取或设置屏幕空间中与此公告牌原点的像素偏移。 这是常用的
   * 将多个广告牌和标签对齐在同一位置，例如，图像和文本。 这
   * 屏幕空间原点是画布的左上角;<code>x</code> 从
   * 从左到右，<code>y</code> 从上到下增加。
   * <br /><br />
   * <div align='center'>
   * <table border='0' cellpadding='5'><tr>
   * <td align='center'><code>default</code><br/><img src='Images/Billboard.setPixelOffset.default.png' width='250' height='188' /></td>
   * <td align='center'><code>b.pixeloffset = new Cartesian2(50, 25);</code><br/><img src='Images/Billboard.setPixelOffset.x50y-25.png' width='250' height='188' /></td>
   * </tr></table>
   *  公告牌的原点由黄点表示。
   * </div>
   * @memberof Billboard.prototype
   * @type {Cartesian2}
   */
  pixelOffset: {
    get: function () {
      return this._pixelOffset;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.object("value", value);
      //>>includeEnd('debug');

      const pixelOffset = this._pixelOffset;
      if (!Cartesian2.equals(pixelOffset, value)) {
        Cartesian2.clone(value, pixelOffset);
        makeDirty(this, PIXEL_OFFSET_INDEX);
      }
    },
  },

  /**
   * 根据公告板与摄像机的距离获取或设置公告牌的近距和远距缩放属性。
   * 公告牌的比例将在 {@link NearFarScalar#nearValue} 和
   * {@link NearFarScalar#farValue} 当摄像机距离落在下限和上限内时
   * 指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的。
   * 在这些范围之外，公告牌的刻度仍会限制在最近的边界上。 如果未定义，则
   * scaleByDistance 将被禁用。
   * @memberof Billboard.prototype
   * @type {NearFarScalar}
   *
   * @example
   * // Example 1.
   * // Set a billboard's scaleByDistance to scale by 1.5 when the
   * // camera is 1500 meters from the billboard and disappear as
   * // the camera distance approaches 8.0e6 meters.
   * b.scaleByDistance = new Cesium.NearFarScalar(1.5e2, 1.5, 8.0e6, 0.0);
   *
   * @example
   * // Example 2.
   * // disable scaling by distance
   * b.scaleByDistance = undefined;
   */
  scaleByDistance: {
    get: function () {
      return this._scaleByDistance;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value)) {
        Check.typeOf.object("value", value);
        if (value.far <= value.near) {
          throw new DeveloperError(
            "far distance must be greater than near distance.",
          );
        }
      }
      //>>includeEnd('debug');

      const scaleByDistance = this._scaleByDistance;
      if (!NearFarScalar.equals(scaleByDistance, value)) {
        this._scaleByDistance = NearFarScalar.clone(value, scaleByDistance);
        makeDirty(this, SCALE_BY_DISTANCE_INDEX);
      }
    },
  },

  /**
   * 根据公告板与摄像机的距离获取或设置公告牌的近距和远距半透明属性。
   * 公告牌的半透明性将在 {@link NearFarScalar#nearValue} 和 之间插值
   * {@link NearFarScalar#farValue} 当摄像机距离落在下限和上限内时
   * 指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的 。
   * 在这些范围之外，公告牌的半透明性仍然被限制在最近的边界上。 如果未定义，则
   * translucencyByDistance 将被禁用。
   * @memberof Billboard.prototype
   * @type {NearFarScalar}
   *
   * @example
   * // Example 1.
   * // Set a billboard's translucency to 1.0 when the
   * // camera is 1500 meters from the billboard and disappear as
   * // the camera distance approaches 8.0e6 meters.
   * b.translucencyByDistance = new Cesium.NearFarScalar(1.5e2, 1.0, 8.0e6, 0.0);
   *
   * @example
   * // Example 2.
   * // disable translucency by distance
   * b.translucencyByDistance = undefined;
   */
  translucencyByDistance: {
    get: function () {
      return this._translucencyByDistance;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value)) {
        Check.typeOf.object("value", value);
        if (value.far <= value.near) {
          throw new DeveloperError(
            "far distance must be greater than near distance.",
          );
        }
      }
      //>>includeEnd('debug');

      const translucencyByDistance = this._translucencyByDistance;
      if (!NearFarScalar.equals(translucencyByDistance, value)) {
        this._translucencyByDistance = NearFarScalar.clone(
          value,
          translucencyByDistance,
        );
        makeDirty(this, TRANSLUCENCY_BY_DISTANCE_INDEX);
      }
    },
  },

  /**
   * 根据公告板与摄像机的距离获取或设置公告牌的近像素偏移和远像素偏移缩放属性。
   * 公告牌的像素偏移将在 {@link NearFarScalar#nearValue} 和
   * {@link NearFarScalar#farValue} 当摄像机距离落在下限和上限内时
   * 指定的 {@link NearFarScalar#near} 和 {@link NearFarScalar#far} 的 。
   * 超出这些范围时，公告牌的像素偏移比例将保持限制在最近的边界上。 如果未定义，则
   * pixelOffsetScaleByDistance 将被禁用。
   * @memberof Billboard.prototype
   * @type {NearFarScalar}
   *
   * @example
   * // Example 1.
   * // Set a billboard's pixel offset scale to 0.0 when the
   * // camera is 1500 meters from the billboard and scale pixel offset to 10.0 pixels
   * // in the y direction the camera distance approaches 8.0e6 meters.
   * b.pixelOffset = new Cesium.Cartesian2(0.0, 1.0);
   * b.pixelOffsetScaleByDistance = new Cesium.NearFarScalar(1.5e2, 0.0, 8.0e6, 10.0);
   *
   * @example
   * // Example 2.
   * // disable pixel offset by distance
   * b.pixelOffsetScaleByDistance = undefined;
   */
  pixelOffsetScaleByDistance: {
    get: function () {
      return this._pixelOffsetScaleByDistance;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value)) {
        Check.typeOf.object("value", value);
        if (value.far <= value.near) {
          throw new DeveloperError(
            "far distance must be greater than near distance.",
          );
        }
      }
      //>>includeEnd('debug');

      const pixelOffsetScaleByDistance = this._pixelOffsetScaleByDistance;
      if (!NearFarScalar.equals(pixelOffsetScaleByDistance, value)) {
        this._pixelOffsetScaleByDistance = NearFarScalar.clone(
          value,
          pixelOffsetScaleByDistance,
        );
        makeDirty(this, PIXEL_OFFSET_SCALE_BY_DISTANCE_INDEX);
      }
    },
  },

  /**
   * 获取或设置在眼睛坐标中应用于此广告牌的 3D 笛卡尔偏移。 眼睛坐标是左撇子
   * 坐标系，其中 <code>x</code> 指向查看器的右侧，<code>y</code> 指向上方，并且
   * <code>z</code> 指向屏幕。 眼睛坐标使用与世界和模型坐标相同的比例。
   * 通常为 meters。
   * <br /><br />
   * 眼动偏移通常用于将多个广告牌或对象排列在同一位置，例如，将
   * 在其相应的 3D 模型上方布置广告牌。
   * <br /><br />
   * 在下面，广告牌位于地球的中心，但眼睛偏移使其始终
   * 显示在地球顶部，无论观看者或地球的方向如何。
   * <br /><br />
   * <div align='center'>
   * <table border='0' cellpadding='5'><tr>
   * <td align='center'><img src='Images/Billboard.setEyeOffset.one.png' width='250' height='188' /></td>
   * <td align='center'><img src='Images/Billboard.setEyeOffset.two.png' width='250' height='188' /></td>
   * </tr></table>
   * <code>b.eyeOffset = new Cartesian3(0.0, 8000000.0, 0.0);</code><br /><br />
   * </div>
   * @memberof Billboard.prototype
   * @type {Cartesian3}
   */
  eyeOffset: {
    get: function () {
      return this._eyeOffset;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.object("value", value);
      //>>includeEnd('debug');

      const eyeOffset = this._eyeOffset;
      if (!Cartesian3.equals(eyeOffset, value)) {
        Cartesian3.clone(value, eyeOffset);
        makeDirty(this, EYE_OFFSET_INDEX);
      }
    },
  },

  /**
   * 获取或设置此公告板的水平原点，用于确定公告板是否为
   * 拖动到其锚点位置的左侧、中间或右侧。
   * <br /><br />
   * <div align='center'>
   * <img src='Images/Billboard.setHorizontalOrigin.png' width='648' height='196' /><br />
   * </div>
   * @memberof Billboard.prototype
   * @type {HorizontalOrigin}
   * @example
   * // Use a bottom, left origin
   * b.horizontalOrigin = Cesium.HorizontalOrigin.LEFT;
   * b.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
   */
  horizontalOrigin: {
    get: function () {
      return this._horizontalOrigin;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number("value", value);
      //>>includeEnd('debug');

      if (this._horizontalOrigin !== value) {
        this._horizontalOrigin = value;
        makeDirty(this, HORIZONTAL_ORIGIN_INDEX);
      }
    },
  },

  /**
   * 获取或设置此公告板的垂直原点，用于确定公告板是否为
   * 拖动到其锚点位置的上方、下方或中心。
   * <br /><br />
   * <div align='center'>
   * <img src='Images/Billboard.setVerticalOrigin.png' width='695' height='175' /><br />
   * </div>
   * @memberof Billboard.prototype
   * @type {VerticalOrigin}
   * @example
   * // Use a bottom, left origin
   * b.horizontalOrigin = Cesium.HorizontalOrigin.LEFT;
   * b.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
   */
  verticalOrigin: {
    get: function () {
      return this._verticalOrigin;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number("value", value);
      //>>includeEnd('debug');

      if (this._verticalOrigin !== value) {
        this._verticalOrigin = value;
        makeDirty(this, VERTICAL_ORIGIN_INDEX);
      }
    },
  },

  /**
   * 获取或设置Uniform Scale （均匀缩放），乘以公告牌的图像大小（以像素为单位）。
   * <code>1.0</code> 的比例不会改变广告牌的大小;大于
   * <code>1.0</code> 放大广告牌;小于 <code>1.0</code> 的正比例会收缩
   * 广告牌。
   * <br /><br />
   * <div align='center'>
   * <img src='Images/Billboard.setScale.png' width='400' height='300' /><br/>
   * 在上图中，比例尺从左到右依次为 <code>0.5</code>, <code>1.0</code>,
   * 和 <code>2.0</code>.
   * </div>
   * @memberof Billboard.prototype
   * @type {number}
   */
  scale: {
    get: function () {
      return this._scale;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number("value", value);
      //>>includeEnd('debug');

      if (this._scale !== value) {
        this._scale = value;
        makeDirty(this, SCALE_INDEX);
      }
    },
  },

  /**
   * 获取或设置与 Billboard 的纹理相乘的颜色。 这有两个常见的用例。 第一
   * 相同的白色纹理可以被许多不同的广告牌使用，每个广告牌都有不同的颜色，以创建
   * 彩色广告牌。 其次，颜色的 Alpha 分量可用于使公告牌半透明，如下所示。
   * Alpha 值为 <code>0.0</code> 时，广告牌透明，<code>Alpha 值为 1.0</code> 时，广告牌不透明。
   * <br /><br />
   * <div align='center'>
   * <table border='0' cellpadding='5'><tr>
   * <td align='center'><code>default</code><br/><img src='Images/Billboard.setColor.Alpha255.png' width='250' height='188' /></td>
   * <td align='center'><code>alpha : 0.5</code><br/><img src='Images/Billboard.setColor.Alpha127.png' width='250' height='188' /></td>
   * </tr></table>
   * </div>
   * <br />
   * 红色、绿色、蓝色和 alpha 值由<code>值的</code> <code>red</code>、<code>green</code>、
   * <code>blue</code> 和 <code>alpha</code> 属性，如示例 1 所示。 这些组件的范围从 <code>0.0</code>
   *（无强度）到 <code>1.0</code>（全强度）。
   * @memberof Billboard.prototype
   * @type {Color}
   *
   * @example
   * // Example 1. Assign yellow.
   * b.color = Cesium.Color.YELLOW;
   *
   * @example
   * // Example 2. Make a billboard 50% translucent.
   * b.color = new Cesium.Color(1.0, 1.0, 1.0, 0.5);
   */
  color: {
    get: function () {
      return this._color;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
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
   * 获取或设置旋转角度（以弧度为单位）。
   * @memberof Billboard.prototype
   * @type {number}
   */
  rotation: {
    get: function () {
      return this._rotation;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.number("value", value);
      //>>includeEnd('debug');

      if (this._rotation !== value) {
        this._rotation = value;
        makeDirty(this, ROTATION_INDEX);
      }
    },
  },

  /**
   * 获取或设置世界空间中的 aligned axis （对齐轴）。对齐轴是公告牌向上矢量指向的单位向量。
   * 默认值为零矢量，这意味着公告牌与屏幕向上矢量对齐。
   * @memberof Billboard.prototype
   * @type {Cartesian3}
   * @example
   * // Example 1.
   * // Have the billboard up vector point north
   * billboard.alignedAxis = Cesium.Cartesian3.UNIT_Z;
   *
   * @example
   * // Example 2.
   * // Have the billboard point east.
   * billboard.alignedAxis = Cesium.Cartesian3.UNIT_Z;
   * billboard.rotation = -Cesium.Math.PI_OVER_TWO;
   *
   * @example
   * // Example 3.
   * // Reset the aligned axis
   * billboard.alignedAxis = Cesium.Cartesian3.ZERO;
   */
  alignedAxis: {
    get: function () {
      return this._alignedAxis;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.object("value", value);
      //>>includeEnd('debug');

      const alignedAxis = this._alignedAxis;
      if (!Cartesian3.equals(alignedAxis, value)) {
        Cartesian3.clone(value, alignedAxis);
        makeDirty(this, ALIGNED_AXIS_INDEX);
      }
    },
  },

  /**
   * 获取或设置公告板的宽度。如果未定义，则将使用图像宽度。
   * @memberof Billboard.prototype
   * @type {number}
   */
  width: {
    get: function () {
      return defaultValue(this._width, this._imageWidth);
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value)) {
        Check.typeOf.number("value", value);
      }
      //>>includeEnd('debug');
      if (this._width !== value) {
        this._width = value;
        makeDirty(this, IMAGE_INDEX_INDEX);
      }
    },
  },

  /**
   * 获取或设置公告板的高度。如果未定义，则将使用图像高度。
   * @memberof Billboard.prototype
   * @type {number}
   */
  height: {
    get: function () {
      return defaultValue(this._height, this._imageHeight);
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value)) {
        Check.typeOf.number("value", value);
      }
      //>>includeEnd('debug');
      if (this._height !== value) {
        this._height = value;
        makeDirty(this, IMAGE_INDEX_INDEX);
      }
    },
  },

  /**
   * 获取或设置是否公告牌大小以米或像素为单位。<code>true</code> 以米为单位调整广告牌的大小;
   * 否则，大小以像素为单位。
   * @memberof Billboard.prototype
   * @type {boolean}
   * @default false
   */
  sizeInMeters: {
    get: function () {
      return this._sizeInMeters;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.bool("value", value);
      //>>includeEnd('debug');
      if (this._sizeInMeters !== value) {
        this._sizeInMeters = value;
        makeDirty(this, COLOR_INDEX);
      }
    },
  },

  /**
   * 获取或设置条件 指定此公告牌将在距离摄像机多远处显示。
   * @memberof Billboard.prototype
   * @type {DistanceDisplayCondition}
   * @default undefined
   */
  distanceDisplayCondition: {
    get: function () {
      return this._distanceDisplayCondition;
    },
    set: function (value) {
      if (
        !DistanceDisplayCondition.equals(value, this._distanceDisplayCondition)
      ) {
        //>>includeStart('debug', pragmas.debug);
        if (defined(value)) {
          Check.typeOf.object("value", value);
          if (value.far <= value.near) {
            throw new DeveloperError(
              "far distance must be greater than near distance.",
            );
          }
        }
        //>>includeEnd('debug');
        this._distanceDisplayCondition = DistanceDisplayCondition.clone(
          value,
          this._distanceDisplayCondition,
        );
        makeDirty(this, DISTANCE_DISPLAY_CONDITION);
      }
    },
  },

  /**
   * 获取或设置与摄像机的距离，以禁用深度测试，以防止根据地形进行裁剪。
   * 当设置为零时，始终应用深度测试。设置为 Number.POSITIVE_INFINITY 时，从不应用深度测试。
   * @memberof Billboard.prototype
   * @type {number}
   */
  disableDepthTestDistance: {
    get: function () {
      return this._disableDepthTestDistance;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value)) {
        Check.typeOf.number("value", value);
        if (value < 0.0) {
          throw new DeveloperError(
            "disableDepthTestDistance must be greater than or equal to 0.0.",
          );
        }
      }
      //>>includeEnd('debug');
      if (this._disableDepthTestDistance !== value) {
        this._disableDepthTestDistance = value;
        makeDirty(this, DISABLE_DEPTH_DISTANCE);
      }
    },
  },

  /**
   * 获取或设置选取 Billboard 时返回的 User-defined 对象。
   * @memberof Billboard.prototype
   * @type {*}
   */
  id: {
    get: function () {
      return this._id;
    },
    set: function (value) {
      this._id = value;
      if (defined(this._pickId)) {
        this._pickId.object.id = value;
      }
    },
  },

  /**
   * 拾取此公告板时要返回的基元。
   * @memberof Billboard.prototype
   * @private
   */
  pickPrimitive: {
    get: function () {
      return this._pickPrimitive;
    },
    set: function (value) {
      this._pickPrimitive = value;
      if (defined(this._pickId)) {
        this._pickId.object.primitive = value;
      }
    },
  },

  /**
   * @private
   */
  pickId: {
    get: function () {
      return this._pickId;
    },
  },

  /**
   * <p>
   * 获取或设置图像。 如果已为
   * 给定图像，则使用现有纹理。
   * </p>
   * <p>
   * 此属性可以设置为加载的 Image，该 URL 将自动加载为 Image，
   * 画布或其他 Billboard 的图像属性（来自同一 Billboard 集合）。
   * </p>
   *
   * @memberof Billboard.prototype
   * @type {string}
   * @example
   * // load an image from a URL
   * b.image = 'some/image/url.png';
   *
   * // assuming b1 and b2 are billboards in the same billboard collection,
   * // use the same image for both billboards.
   * b2.image = b1.image;
   */
  image: {
    get: function () {
      return this._imageId;
    },
    set: function (value) {
      if (!defined(value)) {
        this._imageIndex = -1;
        this._imageSubRegion = undefined;
        this._imageId = undefined;
        this._image = undefined;
        this._imageIndexPromise = undefined;
        makeDirty(this, IMAGE_INDEX_INDEX);
      } else if (typeof value === "string") {
        this.setImage(value, value);
      } else if (value instanceof Resource) {
        this.setImage(value.url, value);
      } else if (defined(value.src)) {
        this.setImage(value.src, value);
      } else {
        this.setImage(createGuid(), value);
      }
    },
  },

  /**
   * 如果<code>为 true</code>，则此公告牌已准备好进行渲染，即图像
   * 已下载，并且 WebGL 资源已创建。
   *
   * @memberof Billboard.prototype
   *
   * @type {boolean}
   * @readonly
   *
   * @default false
   */
  ready: {
    get: function () {
      return this._imageIndex !== -1;
    },
  },

  /**
   * 根据高度参考跟踪公告板的位置。
   * @memberof Billboard.prototype
   * @type {Cartesian3}
   * @private
   */
  _clampedPosition: {
    get: function () {
      return this._actualClampedPosition;
    },
    set: function (value) {
      this._actualClampedPosition = Cartesian3.clone(
        value,
        this._actualClampedPosition,
      );
      makeDirty(this, POSITION_INDEX);
    },
  },

  /**
   * 确定此公告板是显示还是隐藏，因为它是群集的。
   * @memberof Billboard.prototype
   * @type {boolean}
   * @private
   */
  clusterShow: {
    get: function () {
      return this._clusterShow;
    },
    set: function (value) {
      if (this._clusterShow !== value) {
        this._clusterShow = value;
        makeDirty(this, SHOW_INDEX);
      }
    },
  },

  /**
   * 此公告牌的轮廓颜色。 仅对 SDF 广告牌（如标签字形）有效。
   * @memberof Billboard.prototype
   * @type {Color}
   * @private
   */
  outlineColor: {
    get: function () {
      return this._outlineColor;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (!defined(value)) {
        throw new DeveloperError("value is required.");
      }
      //>>includeEnd('debug');

      const outlineColor = this._outlineColor;
      if (!Color.equals(outlineColor, value)) {
        Color.clone(value, outlineColor);
        makeDirty(this, SDF_INDEX);
      }
    },
  },

  /**
   * 此公告牌的轮廓宽度（以像素为单位）。 仅对 SDF 广告牌（如标签字形）有效。
   * @memberof Billboard.prototype
   * @type {number}
   * @private
   */
  outlineWidth: {
    get: function () {
      return this._outlineWidth;
    },
    set: function (value) {
      if (this._outlineWidth !== value) {
        this._outlineWidth = value;
        makeDirty(this, SDF_INDEX);
      }
    },
  },

  /**
   * 获取或设置{@link SplitDirection}这个广告牌。
   * @memberof Billboard.prototype
   * @type {SplitDirection}
   * @default {@link SplitDirection.NONE}
   */
  splitDirection: {
    get: function () {
      return this._splitDirection;
    },
    set: function (value) {
      if (this._splitDirection !== value) {
        this._splitDirection = value;
        makeDirty(this, SPLIT_DIRECTION_INDEX);
      }
    },
  },
});

Billboard.prototype.getPickId = function (context) {
  if (!defined(this._pickId)) {
    this._pickId = context.createPickId({
      primitive: this._pickPrimitive,
      collection: this._collection,
      id: this._id,
    });
  }

  return this._pickId;
};

Billboard.prototype._updateClamping = function () {
  Billboard._updateClamping(this._billboardCollection, this);
};

const scratchCartographic = new Cartographic();
Billboard._updateClamping = function (collection, owner) {
  const scene = collection._scene;
  if (!defined(scene)) {
    //>>includeStart('debug', pragmas.debug);
    if (owner._heightReference !== HeightReference.NONE) {
      throw new DeveloperError(
        "Height reference is not supported without a scene.",
      );
    }
    //>>includeEnd('debug');
    return;
  }

  const ellipsoid = defaultValue(scene.ellipsoid, Ellipsoid.default);

  const mode = scene.frameState.mode;

  const modeChanged = mode !== owner._mode;
  owner._mode = mode;

  if (
    (owner._heightReference === HeightReference.NONE || modeChanged) &&
    defined(owner._removeCallbackFunc)
  ) {
    owner._removeCallbackFunc();
    owner._removeCallbackFunc = undefined;
    owner._clampedPosition = undefined;
  }

  if (
    owner._heightReference === HeightReference.NONE ||
    !defined(owner._position)
  ) {
    return;
  }

  if (defined(owner._removeCallbackFunc)) {
    owner._removeCallbackFunc();
  }

  const position = ellipsoid.cartesianToCartographic(owner._position);
  if (!defined(position)) {
    owner._actualClampedPosition = undefined;
    return;
  }

  function updateFunction(clampedPosition) {
    const updatedClampedPosition = ellipsoid.cartographicToCartesian(
      clampedPosition,
      owner._clampedPosition,
    );

    if (isHeightReferenceRelative(owner._heightReference)) {
      if (owner._mode === SceneMode.SCENE3D) {
        clampedPosition.height += position.height;
        ellipsoid.cartographicToCartesian(
          clampedPosition,
          updatedClampedPosition,
        );
      } else {
        updatedClampedPosition.x += position.height;
      }
    }

    owner._clampedPosition = updatedClampedPosition;
  }

  owner._removeCallbackFunc = scene.updateHeight(
    position,
    updateFunction,
    owner._heightReference,
  );

  Cartographic.clone(position, scratchCartographic);
  const height = scene.getHeight(position, owner._heightReference);
  if (defined(height)) {
    scratchCartographic.height = height;
  }

  updateFunction(scratchCartographic);
};

Billboard.prototype._loadImage = function () {
  const atlas = this._billboardCollection._textureAtlas;

  const imageId = this._imageId;
  const image = this._image;
  const imageSubRegion = this._imageSubRegion;
  let imageIndexPromise;

  const that = this;
  function completeImageLoad(index) {
    if (
      that._imageId !== imageId ||
      that._image !== image ||
      !BoundingRectangle.equals(that._imageSubRegion, imageSubRegion)
    ) {
      // another load occurred before this one finished, ignore the index
      return;
    }

    // fill in imageWidth and imageHeight
    const textureCoordinates = atlas.textureCoordinates[index];
    that._imageWidth = atlas.texture.width * textureCoordinates.width;
    that._imageHeight = atlas.texture.height * textureCoordinates.height;

    that._imageIndex = index;
    that._ready = true;
    that._image = undefined;
    that._imageIndexPromise = undefined;
    makeDirty(that, IMAGE_INDEX_INDEX);

    const scene = that._billboardCollection._scene;
    if (!defined(scene)) {
      return;
    }
    // Request a new render in request render mode
    scene.frameState.afterRender.push(() => true);
  }

  if (defined(image)) {
    imageIndexPromise = atlas.addImage(imageId, image);
  }
  if (defined(imageSubRegion)) {
    imageIndexPromise = atlas.addSubRegion(imageId, imageSubRegion);
  }

  this._imageIndexPromise = imageIndexPromise;

  if (!defined(imageIndexPromise)) {
    return;
  }

  // If the promise has already successfully resolved, we can return immediately without waiting a frame
  const index = atlas.getImageIndex(imageId);
  if (defined(index) && !defined(imageSubRegion)) {
    completeImageLoad(index);
    return;
  }

  imageIndexPromise.then(completeImageLoad).catch(function (error) {
    console.error(`Error loading image for billboard: ${error}`);
    that._imageIndexPromise = undefined;
  });
};

/**
 * <p>
 * 设置用于此公告牌的图像。 如果已为
 * 给定 id，则使用现有纹理。
 * </p>
 * <p>
 * 此功能可用于动态创建在多个公告牌之间共享的纹理。
 * 只有第一个公告牌会实际调用该函数并创建纹理，而后续的
 * 使用相同 ID 创建的公告板将简单地重复使用现有纹理。
 * </p>
 * <p>
 * 要从 URL 加载图像，设置 {@link Billboard#image} 属性会更方便。
 * </p>
 *
 * @param {string} id 图像的 ID。 这可以是唯一标识图像的任何字符串。
 * @param {HTMLImageElement|HTMLCanvasElement|string|Resource|Billboard.CreateImageCallback} image 要加载的图像。 此参数
 * 可以是加载的 Image 或 Canvas，一个将自动作为 Image 加载的 URL，
 * 或将调用该函数来创建图像（如果尚未加载）。
 * @example
 * // create a billboard image dynamically
 * function drawImage(id) {
 *   // create and draw an image using a canvas
 *   const canvas = document.createElement('canvas');
 *   const context2D = canvas.getContext('2d');
 *   // ... draw image
 *   return canvas;
 * }
 * // drawImage will be called to create the texture
 * b.setImage('myImage', drawImage);
 *
 * // subsequent billboards created in the same collection using the same id will use the existing
 * // texture, without the need to create the canvas or draw the image
 * b2.setImage('myImage', drawImage);
 */
Billboard.prototype.setImage = function (id, image) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(id)) {
    throw new DeveloperError("id is required.");
  }
  if (!defined(image)) {
    throw new DeveloperError("image is required.");
  }
  //>>includeEnd('debug');

  if (this._imageId === id) {
    return;
  }

  this._imageIndex = -1;
  this._imageSubRegion = undefined;
  this._imageId = id;
  this._image = image;

  if (defined(this._billboardCollection._textureAtlas)) {
    this._loadImage();
  }
};

/**
 * 使用具有给定 id 的图像子区域作为此公告牌的图像，
 * 以左下角的像素为单位。
 *
 * @param {string} id 要使用的图像的 ID。
 * @param {BoundingRectangle} subRegion 图像的子区域。
 *
 * @exception {RuntimeError} image with id must be in the atlas
 */
Billboard.prototype.setImageSubRegion = function (id, subRegion) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(id)) {
    throw new DeveloperError("id is required.");
  }
  if (!defined(subRegion)) {
    throw new DeveloperError("subRegion is required.");
  }
  //>>includeEnd('debug');

  if (
    this._imageId === id &&
    BoundingRectangle.equals(this._imageSubRegion, subRegion)
  ) {
    return;
  }

  this._imageIndex = -1;
  this._imageId = id;
  this._imageSubRegion = BoundingRectangle.clone(subRegion);

  if (defined(this._billboardCollection._textureAtlas)) {
    this._loadImage();
  }
};

Billboard.prototype._setTranslate = function (value) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(value)) {
    throw new DeveloperError("value is required.");
  }
  //>>includeEnd('debug');

  const translate = this._translate;
  if (!Cartesian2.equals(translate, value)) {
    Cartesian2.clone(value, translate);
    makeDirty(this, PIXEL_OFFSET_INDEX);
  }
};

Billboard.prototype._getActualPosition = function () {
  return defined(this._clampedPosition)
    ? this._clampedPosition
    : this._actualPosition;
};

Billboard.prototype._setActualPosition = function (value) {
  if (!defined(this._clampedPosition)) {
    Cartesian3.clone(value, this._actualPosition);
  }
  makeDirty(this, POSITION_INDEX);
};

const tempCartesian3 = new Cartesian4();
Billboard._computeActualPosition = function (
  billboard,
  position,
  frameState,
  modelMatrix,
) {
  if (defined(billboard._clampedPosition)) {
    if (frameState.mode !== billboard._mode) {
      billboard._updateClamping();
    }
    return billboard._clampedPosition;
  } else if (frameState.mode === SceneMode.SCENE3D) {
    return position;
  }

  Matrix4.multiplyByPoint(modelMatrix, position, tempCartesian3);
  return SceneTransforms.computeActualEllipsoidPosition(
    frameState,
    tempCartesian3,
  );
};

const scratchCartesian3 = new Cartesian3();

// This function is basically a stripped-down JavaScript version of BillboardCollectionVS.glsl
Billboard._computeScreenSpacePosition = function (
  modelMatrix,
  position,
  eyeOffset,
  pixelOffset,
  scene,
  result,
) {
  // Model to world coordinates
  const positionWorld = Matrix4.multiplyByPoint(
    modelMatrix,
    position,
    scratchCartesian3,
  );

  // World to window coordinates
  const positionWC = SceneTransforms.worldWithEyeOffsetToWindowCoordinates(
    scene,
    positionWorld,
    eyeOffset,
    result,
  );
  if (!defined(positionWC)) {
    return undefined;
  }

  // Apply pixel offset
  Cartesian2.add(positionWC, pixelOffset, positionWC);

  return positionWC;
};

const scratchPixelOffset = new Cartesian2(0.0, 0.0);

/**
 * 计算公告牌原点的屏幕空间位置，同时考虑眼睛和像素偏移。
 * 屏幕空间原点是画布的左上角;<code>x</code> 从
 * 从左到右，<code>y</code> 从上到下增加。
 *
 * @param {Scene} scene 场景。
 * @param {Cartesian2} [result] 要在其上存储结果的对象。
 * @returns {Cartesian2} 公告牌的屏幕空间位置。
 *
 * @exception {DeveloperError} Billboard must be in a collection.
 *
 * @example
 * console.log(b.computeScreenSpacePosition(scene).toString());
 *
 * @see Billboard#eyeOffset
 * @see Billboard#pixelOffset
 */
Billboard.prototype.computeScreenSpacePosition = function (scene, result) {
  const billboardCollection = this._billboardCollection;
  if (!defined(result)) {
    result = new Cartesian2();
  }

  //>>includeStart('debug', pragmas.debug);
  if (!defined(billboardCollection)) {
    throw new DeveloperError(
      "Billboard must be in a collection.  Was it removed?",
    );
  }
  if (!defined(scene)) {
    throw new DeveloperError("scene is required.");
  }
  //>>includeEnd('debug');

  // pixel offset for screen space computation is the pixelOffset + screen space translate
  Cartesian2.clone(this._pixelOffset, scratchPixelOffset);
  Cartesian2.add(scratchPixelOffset, this._translate, scratchPixelOffset);

  let modelMatrix = billboardCollection.modelMatrix;
  let position = this._position;
  if (defined(this._clampedPosition)) {
    position = this._clampedPosition;
    if (scene.mode !== SceneMode.SCENE3D) {
      // position needs to be in world coordinates
      const projection = scene.mapProjection;
      const ellipsoid = projection.ellipsoid;
      const cart = projection.unproject(position, scratchCartographic);
      position = ellipsoid.cartographicToCartesian(cart, scratchCartesian3);
      modelMatrix = Matrix4.IDENTITY;
    }
  }

  const windowCoordinates = Billboard._computeScreenSpacePosition(
    modelMatrix,
    position,
    this._eyeOffset,
    scratchPixelOffset,
    scene,
    result,
  );
  return windowCoordinates;
};

/**
 * 获取以 screenSpacePosition 为中心的公告牌的屏幕空间边界框。
 * @param {Billboard} billboard 要获取其屏幕空间边界框的公告牌。
 * @param {Cartesian2} screenSpacePosition 标签的屏幕空间中心。
 * @param {BoundingRectangle} [result] 要在其上存储结果的对象。
 * @returns {BoundingRectangle} 屏幕空间边界框。
 *
 * @private
 */
Billboard.getScreenSpaceBoundingBox = function (
  billboard,
  screenSpacePosition,
  result,
) {
  let width = billboard.width;
  let height = billboard.height;

  const scale = billboard.scale;
  width *= scale;
  height *= scale;

  let x = screenSpacePosition.x;
  if (billboard.horizontalOrigin === HorizontalOrigin.RIGHT) {
    x -= width;
  } else if (billboard.horizontalOrigin === HorizontalOrigin.CENTER) {
    x -= width * 0.5;
  }

  let y = screenSpacePosition.y;
  if (
    billboard.verticalOrigin === VerticalOrigin.BOTTOM ||
    billboard.verticalOrigin === VerticalOrigin.BASELINE
  ) {
    y -= height;
  } else if (billboard.verticalOrigin === VerticalOrigin.CENTER) {
    y -= height * 0.5;
  }

  if (!defined(result)) {
    result = new BoundingRectangle();
  }

  result.x = x;
  result.y = y;
  result.width = width;
  result.height = height;

  return result;
};

/**
 * 确定此公告牌是否等于另一个公告牌。 如果广告牌都是平等的ties
 * 相等。 不同集合中的广告牌可以相等。
 *
 * @param {Billboard} other 要比较相等性的广告牌。
 * 如果广告牌相等，则@returns {boolean} <code>true</code>;否则为 <code>false</code>。
 */
Billboard.prototype.equals = function (other) {
  return (
    this === other ||
    (defined(other) &&
      this._id === other._id &&
      Cartesian3.equals(this._position, other._position) &&
      this._imageId === other._imageId &&
      this._show === other._show &&
      this._scale === other._scale &&
      this._verticalOrigin === other._verticalOrigin &&
      this._horizontalOrigin === other._horizontalOrigin &&
      this._heightReference === other._heightReference &&
      BoundingRectangle.equals(this._imageSubRegion, other._imageSubRegion) &&
      Color.equals(this._color, other._color) &&
      Cartesian2.equals(this._pixelOffset, other._pixelOffset) &&
      Cartesian2.equals(this._translate, other._translate) &&
      Cartesian3.equals(this._eyeOffset, other._eyeOffset) &&
      NearFarScalar.equals(this._scaleByDistance, other._scaleByDistance) &&
      NearFarScalar.equals(
        this._translucencyByDistance,
        other._translucencyByDistance,
      ) &&
      NearFarScalar.equals(
        this._pixelOffsetScaleByDistance,
        other._pixelOffsetScaleByDistance,
      ) &&
      DistanceDisplayCondition.equals(
        this._distanceDisplayCondition,
        other._distanceDisplayCondition,
      ) &&
      this._disableDepthTestDistance === other._disableDepthTestDistance &&
      this._splitDirection === other._splitDirection)
  );
};

Billboard.prototype._destroy = function () {
  if (defined(this._customData)) {
    this._billboardCollection._scene.globe._surface.removeTileCustomData(
      this._customData,
    );
    this._customData = undefined;
  }

  if (defined(this._removeCallbackFunc)) {
    this._removeCallbackFunc();
    this._removeCallbackFunc = undefined;
  }

  this.image = undefined;
  this._pickId = this._pickId && this._pickId.destroy();
  this._billboardCollection = undefined;
};

/**
 * 创建图像的函数。
 * @callback Billboard.CreateImageCallback
 * @param {string} id 要加载的图像的标识符。
 * @returns {HTMLImageElement|HTMLCanvasElement|Promise<HTMLImageElement|HTMLCanvasElement>} 镜像或将解析为镜像的 Promise。
 */
export default Billboard;
