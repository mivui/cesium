import BoundingSphere from "../Core/BoundingSphere.js";
import buildModuleUrl from "../Core/buildModuleUrl.js";
import Cartesian3 from "../Core/Cartesian3.js";
import Cartographic from "../Core/Cartographic.js";
import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Ellipsoid from "../Core/Ellipsoid.js";
import EllipsoidTerrainProvider from "../Core/EllipsoidTerrainProvider.js";
import Event from "../Core/Event.js";
import IntersectionTests from "../Core/IntersectionTests.js";
import NearFarScalar from "../Core/NearFarScalar.js";
import Ray from "../Core/Ray.js";
import Rectangle from "../Core/Rectangle.js";
import Resource from "../Core/Resource.js";
import ShaderSource from "../Renderer/ShaderSource.js";
import Texture from "../Renderer/Texture.js";
import GlobeFS from "../Shaders/GlobeFS.js";
import GlobeVS from "../Shaders/GlobeVS.js";
import AtmosphereCommon from "../Shaders/AtmosphereCommon.js";
import GroundAtmosphere from "../Shaders/GroundAtmosphere.js";
import GlobeSurfaceShaderSet from "./GlobeSurfaceShaderSet.js";
import GlobeSurfaceTileProvider from "./GlobeSurfaceTileProvider.js";
import GlobeTranslucency from "./GlobeTranslucency.js";
import ImageryLayerCollection from "./ImageryLayerCollection.js";
import QuadtreePrimitive from "./QuadtreePrimitive.js";
import SceneMode from "./SceneMode.js";
import ShadowMode from "./ShadowMode.js";
import CesiumMath from "../Core/Math.js";

/**
 * 场景中渲染的地球仪，包括其地形 （{@link Globe#terrainProvider}）
 * 和影像图层 （{@link Globe#imageryLayers}）。 使用 {@link Scene#globe} 访问 globe。
 *
 * @alias Globe
 * @constructor
 *
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 决定 的大小和形状
 * 球。
 */
function Globe(ellipsoid) {
  ellipsoid = defaultValue(ellipsoid, Ellipsoid.default);
  const terrainProvider = new EllipsoidTerrainProvider({
    ellipsoid: ellipsoid,
  });
  const imageryLayerCollection = new ImageryLayerCollection();

  this._ellipsoid = ellipsoid;
  this._imageryLayerCollection = imageryLayerCollection;

  this._surfaceShaderSet = new GlobeSurfaceShaderSet();
  this._material = undefined;

  this._surface = new QuadtreePrimitive({
    tileProvider: new GlobeSurfaceTileProvider({
      terrainProvider: terrainProvider,
      imageryLayers: imageryLayerCollection,
      surfaceShaderSet: this._surfaceShaderSet,
    }),
  });

  this._terrainProvider = terrainProvider;
  this._terrainProviderChanged = new Event();

  this._undergroundColor = Color.clone(Color.BLACK);
  this._undergroundColorAlphaByDistance = new NearFarScalar(
    ellipsoid.maximumRadius / 1000.0,
    0.0,
    ellipsoid.maximumRadius / 5.0,
    1.0
  );

  this._translucency = new GlobeTranslucency();

  makeShadersDirty(this);

  /**
   * 确定是否显示地球仪。
   *
   * @type {boolean}
   * @default true
   */
  this.show = true;

  this._oceanNormalMapResourceDirty = true;
  this._oceanNormalMapResource = new Resource({
    url: buildModuleUrl("Assets/Textures/waterNormalsSmall.jpg"),
  });

  /**
   * 用于驱动细节层次优化的最大屏幕空间误差。 高等
   * 值将提供更好的性能，但会降低视觉质量。
   *
   * @type {number}
   * @default 2
   */
  this.maximumScreenSpaceError = 2;

  /**
   * 地形瓦片缓存的大小，以瓦片数表示。 任何其他
   * 超出此数字的瓦片将被释放，只要它们不是渲染所必需的
   * 这个框架。 数字越大，消耗的内存越多，但显示细节的速度越快
   * 例如，缩小然后重新缩小时。
   *
   * @type {number}
   * @default 100
   */
  this.tileCacheSize = 100;

  /**
   * 获取或设置被视为“太多”的加载后代瓦片的数量。
   * 如果瓦片具有太多加载后代，则该瓦片将在任何
   * 加载并渲染其后代。 这意味着用户会有更多的反馈
   * 的发生是以更长的总体加载时间为代价的。 将此设置为 0 将导致每个
   * 连续加载瓦片级别，显著增加加载时间。 将其设置为较大的
   * 数字（例如 1000）将最大限度地减少加载但往往会使
   * 经过漫长的等待后，细节一下子全部出现。
   * @type {number}
   * @default 20
   */
  this.loadingDescendantLimit = 20;

  /**
   * 获取或设置一个值，该值指示是否应预加载呈现的图块的上级。
   * 将此项设置为 true 可优化缩小体验，并在
   * 平移时新曝光的区域。缺点是它需要加载更多的图块。
   * @type {boolean}
   * @default true
   */
  this.preloadAncestors = true;

  /**
   * 获取或设置一个值，该值指示是否应预加载呈现的磁贴的同级。
   * 将此项设置为 true 会导致加载与渲染瓦片具有相同父级的瓦片，甚至
   * 如果他们被淘汰。将此设置为 true 可能会在
   * 加载更多图块的成本。
   * @type {boolean}
   * @default false
   */
  this.preloadSiblings = false;

  /**
   * 用于高亮显示地形填充图块的颜色。如果未定义，则填充平铺不会
   * 完全突出显示。alpha 值用于与图块的
   * 实际颜色。由于 terrain fill 平铺不表示实际的 terrain 表面，因此
   * 在某些应用程序中，直观地表明它们不值得信任可能很有用。
   * @type {Color}
   * @default undefined
   */
  this.fillHighlightColor = undefined;

  /**
   * 启用使用场景的光源照亮地球。
   *
   * @type {boolean}
   * @default false
   */
  this.enableLighting = false;

  /**
   * 用于调整地形朗伯光照的乘数。
   * 此数字乘以 GlobeFS.glsl 中 <code>czm_getLambertDiffuse</code> 的结果。
   * 仅当 <code>enableLighting</code> 为 <code>true</code> 时，此选项才会生效。
   *
   * @type {number}
   * @default 0.9
   */
  this.lambertDiffuseMultiplier = 0.9;

  /**
   * 在大气和雾气上启用动态照明效果。这只会生效
   * 当 <code>enableLighting</code> 为 <code>true</code> 时。
   *
   * @type {boolean}
   * @default true
   */
  this.dynamicAtmosphereLighting = true;

  /**
   * 动态氛围照明是否使用太阳方向而不是场景的方向
   * 灯光方向。这仅在 <code>enableLighting</code> 和
   * <code>dynamicAtmosphereLighting</code> 为 <code>true</code>。
   *
   * @type {boolean}
   * @default false
   */
  this.dynamicAtmosphereLightingFromSun = false;

  /**
   * 启用地面大气，当从 <code>lightingFadeInDistance</code> 和 <code>lightingFadeOutDistance</code> 之间的距离查看时，将绘制地球上。
   *
   * @type {boolean}
   * @default true 使用 WGS84 椭球体时，否则为 false
   */
  this.showGroundAtmosphere = Ellipsoid.WGS84.equals(ellipsoid);

  /**
   * 用于计算地面大气颜色的光的强度。
   *
   * @type {number}
   * @default 10.0
   */
  this.atmosphereLightIntensity = 10.0;

  /**
   * 地面大气的大气散射方程中使用的瑞利散射系数。
   *
   * @type {Cartesian3}
   * @default Cartesian3(5.5e-6, 13.0e-6, 28.4e-6)
   */
  this.atmosphereRayleighCoefficient = new Cartesian3(5.5e-6, 13.0e-6, 28.4e-6);

  /**
   * 地面大气的大气散射方程中使用的 Mie 散射系数。
   *
   * @type {Cartesian3}
   * @default Cartesian3(21e-6, 21e-6, 21e-6)
   */
  this.atmosphereMieCoefficient = new Cartesian3(21e-6, 21e-6, 21e-6);

  /**
   * 地面大气大气散射方程中使用的瑞利标尺高度，以米为单位。
   *
   * @type {number}
   * @default 10000.0
   */
  this.atmosphereRayleighScaleHeight = 10000.0;

  /**
   * 地面大气的大气散射方程中使用的米氏标尺高度，以米为单位。
   *
   * @type {number}
   * @default 3200.0
   */
  this.atmosphereMieScaleHeight = 3200.0;

  /**
   * 米氏散射要考虑的介质的各向异性。
   * <p>
   * 有效值介于 -1.0 和 1.0 之间。
   * </p>
   * @type {number}
   * @default 0.9
   */
  this.atmosphereMieAnisotropy = 0.9;

  /**
   * 所有东西都亮起的距离。这只会生效
   * 当 <code>enableLighting</code> 或 <code>showGroundAtmosphere</code> 为 <code>true</code> 时。
   *
   * @type {number}
   * @default 1/2 * pi * ellipsoid.minimumRadius
   */
  this.lightingFadeOutDistance =
    CesiumMath.PI_OVER_TWO * ellipsoid.minimumRadius;

  /**
   * 恢复照明的距离。这只会生效
   * 当 <code>enableLighting</code> 或 <code>showGroundAtmosphere</code> 为 <code>true</code> 时。
   *
   * @type {number}
   * @default pi * ellipsoid.minimumRadius
   */
  this.lightingFadeInDistance = CesiumMath.PI * ellipsoid.minimumRadius;

  /**
   * 夜晚的黑暗从地面大气中淡出到被照亮的地面大气的距离。
   * 仅当 <code>showGroundAtmosphere</code>、<code>enableLighting</code> 和
   * <code>dynamicAtmosphereLighting</code> 为 <code>true</code>。
   *
   * @type {number}
   * @default 1/2 * pi * ellipsoid.minimumRadius
   */
  this.nightFadeOutDistance = CesiumMath.PI_OVER_TWO * ellipsoid.minimumRadius;

  /**
   * 夜晚的黑暗与地面大气层淡入未点亮的地面大气的距离。
   * 仅当 <code>showGroundAtmosphere</code>、<code>enableLighting</code> 和
   * <code>dynamicAtmosphereLighting</code> 为 <code>true</code>。
   *
   * @type {number}
   * @default 5/2 * pi * ellipsoid.minimumRadius
   */
  this.nightFadeInDistance =
    5.0 * CesiumMath.PI_OVER_TWO * ellipsoid.minimumRadius;

  /**
   * 如果动画波形效果应显示在地球的某些区域，则为 True。
   * 被水覆盖;否则为 false。 如果
   * <code>terrainProvider</code> 不提供水遮罩。
   *
   * @type {boolean}
   * @default true
   */
  this.showWaterEffect = true;

  /**
   * 如果应对 billboard、polylines、labels 等基元进行深度测试，则为 True。
   * 针对地形表面，如果此类基元应始终绘制在顶部，则为 false
   * 的地形，除非它们位于地球的另一侧。 深度的缺点
   * 根据地形测试基元是轻微的数值噪声或地形细节级别
   * switched 有时会使本应位于表面上的基元在其下方消失。
   *
   * @type {boolean}
   * @default false
   *
   */
  this.depthTestAgainstTerrain = false;

  /**
   * 确定地球是投射还是接收来自光源的阴影。设置地球仪
   * 投射阴影可能会影响性能，因为地形会再次从光源的角度渲染。
   * 当前，只有视野中的地形会投射阴影。默认情况下，地球不会投射阴影。
   *
   * @type {ShadowMode}
   * @default ShadowMode.RECEIVE_ONLY
   */
  this.shadows = ShadowMode.RECEIVE_ONLY;

  /**
   * 应用于大气的色相偏移。默认为 0.0（无偏移）。
   * 色相偏移 1.0 表示可用色相完全旋转。
   * @type {number}
   * @default 0.0
   */
  this.atmosphereHueShift = 0.0;

  /**
   * 应用于大气的饱和度偏移。默认为 0.0（无偏移）。
   * -1.0 的饱和度偏移为单色。
   * @type {number}
   * @default 0.0
   */
  this.atmosphereSaturationShift = 0.0;

  /**
   * 应用于大气的亮度偏移。默认为 0.0（无偏移）。
   * -1.0 的亮度偏移是完全黑暗的，这将使空间透出。
   * @type {number}
   * @default 0.0
   */
  this.atmosphereBrightnessShift = 0.0;

  /**
   * 是否显示地形裙边。地形裙边是从图块边缘向下延伸的几何体，用于隐藏相邻图块之间的接缝。
   * 当摄像机位于地下或启用半透明时，裙边始终处于隐藏状态。
   *
   * @type {boolean}
   * @default true
   */
  this.showSkirts = true;

  /**
   * 是否剔除背面的地形。当摄像机位于地下或启用半透明时，不会剔除背面。
   *
   * @type {boolean}
   * @default true
   */
  this.backFaceCulling = true;

  this._oceanNormalMap = undefined;
  this._zoomedOutOceanSpecularIntensity = undefined;

  /**
   * 确定顶点阴影的暗度。
   * 仅当 <code>enableLighting</code> 为 <code>true</code> 时，此选项才会生效。
   *
   * @type {number}
   * @default 0.3
   */
  this.vertexShadowDarkness = 0.3;
}

Object.defineProperties(Globe.prototype, {
  /**
   * 获取描述此地球形状的椭球体。
   * @memberof Globe.prototype
   * @type {Ellipsoid}
   */
  ellipsoid: {
    get: function () {
      return this._ellipsoid;
    },
  },
  /**
   * 获取将在此地球上渲染的图像图层的集合。
   * @memberof Globe.prototype
   * @type {ImageryLayerCollection}
   */
  imageryLayers: {
    get: function () {
      return this._imageryLayerCollection;
    },
  },
  /**
   * 获取在添加、显示、隐藏、移动或移除影像图层时引发的事件。
   *
   * @memberof Globe.prototype
   * @type {Event}
   * @readonly
   */
  imageryLayersUpdatedEvent: {
    get: function () {
      return this._surface.tileProvider.imageryLayersUpdatedEvent;
    },
  },
  /**
   * 当瓦片加载队列为空时返回 <code>true</code>，<code>否则返回 false</code>。 当加载队列为空时，
   * 当前视图的所有地形和影像均已加载。
   * @memberof Globe.prototype
   * @type {boolean}
   * @readonly
   */
  tilesLoaded: {
    get: function () {
      if (!defined(this._surface)) {
        return true;
      }
      return (
        this._surface._tileLoadQueueHigh.length === 0 &&
        this._surface._tileLoadQueueMedium.length === 0 &&
        this._surface._tileLoadQueueLow.length === 0
      );
    },
  },
  /**
   * 获取或设置color of the globe when no imagery is available.
   * @memberof Globe.prototype
   * @type {Color}
   */
  baseColor: {
    get: function () {
      return this._surface.tileProvider.baseColor;
    },
    set: function (value) {
      this._surface.tileProvider.baseColor = value;
    },
  },
  /**
   * 一个属性，用于指定 {@link ClippingPlaneCollection}，用于选择性地禁用每个平面外部的渲染。
   *
   * @memberof Globe.prototype
   * @type {ClippingPlaneCollection}
   */
  clippingPlanes: {
    get: function () {
      return this._surface.tileProvider.clippingPlanes;
    },
    set: function (value) {
      this._surface.tileProvider.clippingPlanes = value;
    },
  },
  /**
   * 一个属性，用于指定 {@link ClippingPolygonCollection}，用于选择性地禁用多边形列表内部或外部的渲染。
   *
   * @memberof Globe.prototype
   * @type {ClippingPolygonCollection}
   */
  clippingPolygons: {
    get: function () {
      return this._surface.tileProvider.clippingPolygons;
    },
    set: function (value) {
      this._surface.tileProvider.clippingPolygons = value;
    },
  },
  /**
   * 指定 {@link Rectangle} 的属性，用于将 globe 渲染限制为制图区域。
   * 默认为制图坐标的最大范围。
   *
   * @memberof Globe.prototype
   * @type {Rectangle}
   * @default {@link Rectangle.MAX_VALUE}
   */
  cartographicLimitRectangle: {
    get: function () {
      return this._surface.tileProvider.cartographicLimitRectangle;
    },
    set: function (value) {
      if (!defined(value)) {
        value = Rectangle.clone(Rectangle.MAX_VALUE);
      }
      this._surface.tileProvider.cartographicLimitRectangle = value;
    },
  },
  /**
   * 用于渲染海洋中波浪的法线贴图。 设置此属性将
   * 仅在配置的 terrain 提供程序包含水遮罩时有效。
   * @memberof Globe.prototype
   * @type {string}
   * @default buildModuleUrl('Assets/Textures/waterNormalsSmall.jpg')
   */
  oceanNormalMapUrl: {
    get: function () {
      return this._oceanNormalMapResource.url;
    },
    set: function (value) {
      this._oceanNormalMapResource.url = value;
      this._oceanNormalMapResourceDirty = true;
    },
  },
  /**
   * 为此地球提供表面几何图形的 terrain 提供程序。
   * @type {TerrainProvider}
   *
   * @memberof Globe.prototype
   * @type {TerrainProvider}
   *
   */
  terrainProvider: {
    get: function () {
      return this._terrainProvider;
    },
    set: function (value) {
      if (value !== this._terrainProvider) {
        this._terrainProvider = value;
        this._terrainProviderChanged.raiseEvent(value);
        if (defined(this._material)) {
          makeShadersDirty(this);
        }
      }
    },
  },
  /**
   * 获取在更改地形提供程序时引发的事件
   *
   * @memberof Globe.prototype
   * @type {Event}
   * @readonly
   */
  terrainProviderChanged: {
    get: function () {
      return this._terrainProviderChanged;
    },
  },
  /**
   * 获取一个事件，该事件在图块加载队列的长度自上一个渲染帧以来发生变化时引发。 当加载队列为空时，
   * 当前视图的所有地形和影像均已加载。 该事件传递磁贴加载队列的新长度。
   *
   * @memberof Globe.prototype
   * @type {Event}
   */
  tileLoadProgressEvent: {
    get: function () {
      return this._surface.tileLoadProgressEvent;
    },
  },

  /**
   * 获取或设置material appearance of the Globe.  This can be one of several built-in {@link Material} objects or a custom material, scripted with
   * {@link https://github.com/CesiumGS/cesium/wiki/Fabric|Fabric}.
   * @memberof Globe.prototype
   * @type {Material | undefined}
   */
  material: {
    get: function () {
      return this._material;
    },
    set: function (material) {
      if (this._material !== material) {
        this._material = material;
        makeShadersDirty(this);
      }
    },
  },

  /**
   * 当摄像机位于地下或地球仪为半透明时，用于渲染地球仪背面的颜色，
   * 根据照相机的距离与地球颜色混合。
   * <br /><br />
   * 要禁用 underground 着色，请将 <code>undergroundColor</code> 设置为 <code>undefined</code>。
   *
   * @memberof Globe.prototype
   * @type {Color}
   * @default {@link Color.BLACK}
   *
   * @see Globe#undergroundColorAlphaByDistance
   */
  undergroundColor: {
    get: function () {
      return this._undergroundColor;
    },
    set: function (value) {
      this._undergroundColor = Color.clone(value, this._undergroundColor);
    },
  },

  /**
   * 获取或设置near and far distance for blending {@link Globe#undergroundColor} with the globe color.
   * The alpha will interpolate between the {@link NearFarScalar#nearValue} and
   * {@link NearFarScalar#farValue} while the camera distance falls within the lower and upper bounds
   * of the specified {@link NearFarScalar#near} and {@link NearFarScalar#far}.
   * Outside of these ranges the alpha remains clamped to the nearest bound. If undefined,
   * the underground color will not be blended with the globe color.
   * <br /> <br />
   * When the camera is above the ellipsoid the distance is computed from the nearest
   * point on the ellipsoid instead of the camera's position.
   *
   * @memberof Globe.prototype
   * @type {NearFarScalar}
   *
   * @see Globe#undergroundColor
   *
   */
  undergroundColorAlphaByDistance: {
    get: function () {
      return this._undergroundColorAlphaByDistance;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value) && value.far < value.near) {
        throw new DeveloperError(
          "far distance must be greater than near distance."
        );
      }
      //>>includeEnd('debug');
      this._undergroundColorAlphaByDistance = NearFarScalar.clone(
        value,
        this._undergroundColorAlphaByDistance
      );
    },
  },

  /**
   * 用于控制地球半透明的属性。
   *
   * @memberof Globe.prototype
   * @type {GlobeTranslucency}
   */
  translucency: {
    get: function () {
      return this._translucency;
    },
  },
});

function makeShadersDirty(globe) {
  const defines = [];

  const requireNormals =
    defined(globe._material) &&
    (defined(globe._material.shaderSource.match(/slope/)) ||
      defined(globe._material.shaderSource.match("normalEC")));

  const fragmentSources = [AtmosphereCommon, GroundAtmosphere];
  if (
    defined(globe._material) &&
    (!requireNormals || globe._terrainProvider.requestVertexNormals)
  ) {
    fragmentSources.push(globe._material.shaderSource);
    defines.push("APPLY_MATERIAL");
    globe._surface._tileProvider.materialUniformMap = globe._material._uniforms;
  } else {
    globe._surface._tileProvider.materialUniformMap = undefined;
  }
  fragmentSources.push(GlobeFS);

  globe._surfaceShaderSet.baseVertexShaderSource = new ShaderSource({
    sources: [AtmosphereCommon, GroundAtmosphere, GlobeVS],
    defines: defines,
  });

  globe._surfaceShaderSet.baseFragmentShaderSource = new ShaderSource({
    sources: fragmentSources,
    defines: defines,
  });
  globe._surfaceShaderSet.material = globe._material;
}

function createComparePickTileFunction(rayOrigin) {
  return function (a, b) {
    const aDist = BoundingSphere.distanceSquaredTo(
      a.pickBoundingSphere,
      rayOrigin
    );
    const bDist = BoundingSphere.distanceSquaredTo(
      b.pickBoundingSphere,
      rayOrigin
    );

    return aDist - bDist;
  };
}

const scratchArray = [];
const scratchSphereIntersectionResult = {
  start: 0.0,
  stop: 0.0,
};

/**
 * 查找光线与渲染的地球表面之间的交集。射线必须以世界坐标给出。
 *
 * @param {Ray} ray 用于测试交集的射线。
 * @param {Scene} scene 场景。
 * @param {boolean} [cullBackFaces=true] 设置为 true 将不拾取背面。
 * @param {Cartesian3} [result] 要在其上存储结果的对象。
 * @returns {Cartesian3|undefined} 交集或 <code>undefined</code>（如果未找到）。 返回的位置位于 2D 和 Columbus View 的投影坐标中。
 *
 * @private
 */
Globe.prototype.pickWorldCoordinates = function (
  ray,
  scene,
  cullBackFaces,
  result
) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(ray)) {
    throw new DeveloperError("ray is required");
  }
  if (!defined(scene)) {
    throw new DeveloperError("scene is required");
  }
  //>>includeEnd('debug');

  cullBackFaces = defaultValue(cullBackFaces, true);

  const mode = scene.mode;
  const projection = scene.mapProjection;

  const sphereIntersections = scratchArray;
  sphereIntersections.length = 0;

  const tilesToRender = this._surface._tilesToRender;
  let length = tilesToRender.length;

  let tile;
  let i;

  for (i = 0; i < length; ++i) {
    tile = tilesToRender[i];
    const surfaceTile = tile.data;

    if (!defined(surfaceTile)) {
      continue;
    }

    let boundingVolume = surfaceTile.pickBoundingSphere;
    if (mode !== SceneMode.SCENE3D) {
      surfaceTile.pickBoundingSphere = boundingVolume = BoundingSphere.fromRectangleWithHeights2D(
        tile.rectangle,
        projection,
        surfaceTile.tileBoundingRegion.minimumHeight,
        surfaceTile.tileBoundingRegion.maximumHeight,
        boundingVolume
      );
      Cartesian3.fromElements(
        boundingVolume.center.z,
        boundingVolume.center.x,
        boundingVolume.center.y,
        boundingVolume.center
      );
    } else if (defined(surfaceTile.renderedMesh)) {
      BoundingSphere.clone(
        surfaceTile.tileBoundingRegion.boundingSphere,
        boundingVolume
      );
    } else {
      // So wait how did we render this thing then? It shouldn't be possible to get here.
      continue;
    }

    const boundingSphereIntersection = IntersectionTests.raySphere(
      ray,
      boundingVolume,
      scratchSphereIntersectionResult
    );
    if (defined(boundingSphereIntersection)) {
      sphereIntersections.push(surfaceTile);
    }
  }

  sphereIntersections.sort(createComparePickTileFunction(ray.origin));

  let intersection;
  length = sphereIntersections.length;
  for (i = 0; i < length; ++i) {
    intersection = sphereIntersections[i].pick(
      ray,
      scene.mode,
      scene.mapProjection,
      cullBackFaces,
      result
    );
    if (defined(intersection)) {
      break;
    }
  }

  return intersection;
};

const cartoScratch = new Cartographic();
/**
 * 查找光线与渲染的地球表面之间的交集。射线必须以世界坐标给出。
 *
 * @param {Ray} ray 用于测试交集的射线。
 * @param {Scene} scene 场景。
 * @param {Cartesian3} [result] 要在其上存储结果的对象。
 * @returns {Cartesian3|undefined} 交集或 <code>undefined</code>（如果未找到）。
 *
 * @example
 * // 求穿过像素的光线与地球的交点
 * const ray = viewer.camera.getPickRay（windowCoordinates）;
 * const 交集 = globe.pick（ray， scene）;
 */
Globe.prototype.pick = function (ray, scene, result) {
  result = this.pickWorldCoordinates(ray, scene, true, result);
  if (defined(result) && scene.mode !== SceneMode.SCENE3D) {
    result = Cartesian3.fromElements(result.y, result.z, result.x, result);
    const carto = scene.mapProjection.unproject(result, cartoScratch);
    result = this._ellipsoid.cartographicToCartesian(carto, result);
  }

  return result;
};

const scratchGetHeightCartesian = new Cartesian3();
const scratchGetHeightIntersection = new Cartesian3();
const scratchGetHeightCartographic = new Cartographic();
const scratchGetHeightRay = new Ray();

function tileIfContainsCartographic(tile, cartographic) {
  return defined(tile) && Rectangle.contains(tile.rectangle, cartographic)
    ? tile
    : undefined;
}

/**
 * 获取给定制图处的表面高度。
 *
 * @param {Cartographic} cartographic 要为其查找高度的制图。
 * @returns {number|undefined} 制图的高度，如果找不到，则为 undefined。
 */
Globe.prototype.getHeight = function (cartographic) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(cartographic)) {
    throw new DeveloperError("cartographic is required");
  }
  //>>includeEnd('debug');

  const levelZeroTiles = this._surface._levelZeroTiles;
  if (!defined(levelZeroTiles)) {
    return;
  }

  let tile;
  let i;

  const length = levelZeroTiles.length;
  for (i = 0; i < length; ++i) {
    tile = levelZeroTiles[i];
    if (Rectangle.contains(tile.rectangle, cartographic)) {
      break;
    }
  }

  if (i >= length) {
    return undefined;
  }

  let tileWithMesh = tile;

  while (defined(tile)) {
    tile =
      tileIfContainsCartographic(tile._southwestChild, cartographic) ||
      tileIfContainsCartographic(tile._southeastChild, cartographic) ||
      tileIfContainsCartographic(tile._northwestChild, cartographic) ||
      tile._northeastChild;

    if (
      defined(tile) &&
      defined(tile.data) &&
      defined(tile.data.renderedMesh)
    ) {
      tileWithMesh = tile;
    }
  }

  tile = tileWithMesh;

  // This tile was either rendered or culled.
  // It is sometimes useful to get a height from a culled tile,
  // e.g. when we're getting a height in order to place a billboard
  // on terrain, and the camera is looking at that same billboard.
  // The culled tile must have a valid mesh, though.
  if (
    !defined(tile) ||
    !defined(tile.data) ||
    !defined(tile.data.renderedMesh)
  ) {
    // Tile was not rendered (culled).
    return undefined;
  }

  const projection = this._surface._tileProvider.tilingScheme.projection;
  const ellipsoid = this._surface._tileProvider.tilingScheme.ellipsoid;

  //cartesian has to be on the ellipsoid surface for `ellipsoid.geodeticSurfaceNormal`
  const cartesian = Cartesian3.fromRadians(
    cartographic.longitude,
    cartographic.latitude,
    0.0,
    ellipsoid,
    scratchGetHeightCartesian
  );

  const ray = scratchGetHeightRay;
  const surfaceNormal = ellipsoid.geodeticSurfaceNormal(
    cartesian,
    ray.direction
  );

  // Try to find the intersection point between the surface normal and z-axis.
  // minimum height (-11500.0) for the terrain set, need to get this information from the terrain provider
  const rayOrigin = ellipsoid.getSurfaceNormalIntersectionWithZAxis(
    cartesian,
    11500.0,
    ray.origin
  );

  // Theoretically, not with Earth datums, the intersection point can be outside the ellipsoid
  if (!defined(rayOrigin)) {
    // intersection point is outside the ellipsoid, try other value
    // minimum height (-11500.0) for the terrain set, need to get this information from the terrain provider
    let minimumHeight;
    if (defined(tile.data.tileBoundingRegion)) {
      minimumHeight = tile.data.tileBoundingRegion.minimumHeight;
    }
    const magnitude = Math.min(defaultValue(minimumHeight, 0.0), -11500.0);

    // multiply by the *positive* value of the magnitude
    const vectorToMinimumPoint = Cartesian3.multiplyByScalar(
      surfaceNormal,
      Math.abs(magnitude) + 1,
      scratchGetHeightIntersection
    );
    Cartesian3.subtract(cartesian, vectorToMinimumPoint, ray.origin);
  }

  const intersection = tile.data.pick(
    ray,
    undefined,
    projection,
    false,
    scratchGetHeightIntersection
  );
  if (!defined(intersection)) {
    return undefined;
  }

  return ellipsoid.cartesianToCartographic(
    intersection,
    scratchGetHeightCartographic
  ).height;
};

/**
 * @private
 */
Globe.prototype.update = function (frameState) {
  if (!this.show) {
    return;
  }

  if (frameState.passes.render) {
    this._surface.update(frameState);
  }
};

/**
 * @private
 */
Globe.prototype.beginFrame = function (frameState) {
  const surface = this._surface;
  const tileProvider = surface.tileProvider;
  const terrainProvider = this.terrainProvider;
  const hasWaterMask =
    defined(terrainProvider) &&
    terrainProvider.hasWaterMask &&
    terrainProvider.hasWaterMask;

  if (hasWaterMask && this._oceanNormalMapResourceDirty) {
    // url changed, load new normal map asynchronously
    this._oceanNormalMapResourceDirty = false;
    const oceanNormalMapResource = this._oceanNormalMapResource;
    const oceanNormalMapUrl = oceanNormalMapResource.url;
    if (defined(oceanNormalMapUrl)) {
      const that = this;
      oceanNormalMapResource.fetchImage().then(function (image) {
        if (oceanNormalMapUrl !== that._oceanNormalMapResource.url) {
          // url changed while we were loading
          return;
        }

        that._oceanNormalMap =
          that._oceanNormalMap && that._oceanNormalMap.destroy();
        that._oceanNormalMap = new Texture({
          context: frameState.context,
          source: image,
        });
      });
    } else {
      this._oceanNormalMap =
        this._oceanNormalMap && this._oceanNormalMap.destroy();
    }
  }

  const pass = frameState.passes;
  const mode = frameState.mode;

  if (pass.render) {
    if (this.showGroundAtmosphere) {
      this._zoomedOutOceanSpecularIntensity = 0.4;
    } else {
      this._zoomedOutOceanSpecularIntensity = 0.5;
    }

    surface.maximumScreenSpaceError = this.maximumScreenSpaceError;
    surface.tileCacheSize = this.tileCacheSize;
    surface.loadingDescendantLimit = this.loadingDescendantLimit;
    surface.preloadAncestors = this.preloadAncestors;
    surface.preloadSiblings = this.preloadSiblings;

    tileProvider.terrainProvider = this.terrainProvider;
    tileProvider.lightingFadeOutDistance = this.lightingFadeOutDistance;
    tileProvider.lightingFadeInDistance = this.lightingFadeInDistance;
    tileProvider.nightFadeOutDistance = this.nightFadeOutDistance;
    tileProvider.nightFadeInDistance = this.nightFadeInDistance;
    tileProvider.zoomedOutOceanSpecularIntensity =
      mode === SceneMode.SCENE3D ? this._zoomedOutOceanSpecularIntensity : 0.0;
    tileProvider.hasWaterMask = hasWaterMask;
    tileProvider.showWaterEffect = this.showWaterEffect;
    tileProvider.oceanNormalMap = this._oceanNormalMap;
    tileProvider.enableLighting = this.enableLighting;
    tileProvider.dynamicAtmosphereLighting = this.dynamicAtmosphereLighting;
    tileProvider.dynamicAtmosphereLightingFromSun = this.dynamicAtmosphereLightingFromSun;
    tileProvider.showGroundAtmosphere = this.showGroundAtmosphere;
    tileProvider.atmosphereLightIntensity = this.atmosphereLightIntensity;
    tileProvider.atmosphereRayleighCoefficient = this.atmosphereRayleighCoefficient;
    tileProvider.atmosphereMieCoefficient = this.atmosphereMieCoefficient;
    tileProvider.atmosphereRayleighScaleHeight = this.atmosphereRayleighScaleHeight;
    tileProvider.atmosphereMieScaleHeight = this.atmosphereMieScaleHeight;
    tileProvider.atmosphereMieAnisotropy = this.atmosphereMieAnisotropy;
    tileProvider.shadows = this.shadows;
    tileProvider.hueShift = this.atmosphereHueShift;
    tileProvider.saturationShift = this.atmosphereSaturationShift;
    tileProvider.brightnessShift = this.atmosphereBrightnessShift;
    tileProvider.fillHighlightColor = this.fillHighlightColor;
    tileProvider.showSkirts = this.showSkirts;
    tileProvider.backFaceCulling = this.backFaceCulling;
    tileProvider.vertexShadowDarkness = this.vertexShadowDarkness;
    tileProvider.undergroundColor = this._undergroundColor;
    tileProvider.undergroundColorAlphaByDistance = this._undergroundColorAlphaByDistance;
    tileProvider.lambertDiffuseMultiplier = this.lambertDiffuseMultiplier;

    surface.beginFrame(frameState);
  }
};

/**
 * @private
 */
Globe.prototype.render = function (frameState) {
  if (!this.show) {
    return;
  }

  if (defined(this._material)) {
    this._material.update(frameState.context);
  }

  this._surface.render(frameState);
};

/**
 * @private
 */
Globe.prototype.endFrame = function (frameState) {
  if (!this.show) {
    return;
  }

  if (frameState.passes.render) {
    this._surface.endFrame(frameState);
  }
};

/**
 * 如果此对象已销毁，则返回 true;否则为 false。
 * <br /><br />
 * 如果此对象已销毁，则不应使用;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果此对象被销毁，则为 True;否则为 false。
 *
 * @see Globe#destroy
 */
Globe.prototype.isDestroyed = function () {
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
 * @exception {DeveloperError} 这个物体被摧毁了，destroy（）。
 *
 *
 * @example
 * globe = globe & globe.destroy（）;
 *
 * @see Globe#isDestroyed
 */
Globe.prototype.destroy = function () {
  this._surfaceShaderSet =
    this._surfaceShaderSet && this._surfaceShaderSet.destroy();
  this._surface = this._surface && this._surface.destroy();
  this._oceanNormalMap = this._oceanNormalMap && this._oceanNormalMap.destroy();
  return destroyObject(this);
};
export default Globe;
