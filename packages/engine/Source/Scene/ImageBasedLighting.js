import Cartesian2 from "../Core/Cartesian2.js";
import Check from "../Core/Check.js";
import defined from "../Core/defined.js";
import defaultValue from "../Core/defaultValue.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import SpecularEnvironmentCubeMap from "./SpecularEnvironmentCubeMap.js";

/**
 * 用于管理瓦片集和模型上基于图像的光照的属性。
 * 还管理必要的资源和纹理。
 * <p>
 * 如果使用镜面反射环境贴图，则必须调用 {@link ImageBasedLighting#destroy}
 * 当不再需要基于图像的照明来正确清理 GPU 资源时。
 * 如果模型或图块集创建 ImageBasedLighting 的实例，它将处理此事件。
 * 否则，应用程序负责调用 destroy()。
 *</p>
 *
 * @alias ImageBasedLighting
 * @constructor
 *
 * @param {Cartesian2} [options.imageBasedLightingFactor=Cartesian2(1.0, 1.0)] 缩放来自地球、天空、大气和星星天空盒的基于图像的漫反射和镜面反射照明。
 * @param {number} [options.luminanceAtZenith=0.2] 太阳在天顶的亮度，以千克坎德拉/平方米为单位，用于此模型的程序环境贴图。
 * @param {Cartesian3[]} [options.sphericalHarmonicCoefficients] 用于基于图像的照明的漫反射颜色的三阶球谐系数。
 * @param {string} [options.specularEnvironmentMaps] 一个指向 KTX2 文件的 URL，其中包含镜面反射照明的立方体贴图和复杂的镜面反射 mipmap。
 */
function ImageBasedLighting(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  const imageBasedLightingFactor = defined(options.imageBasedLightingFactor)
    ? Cartesian2.clone(options.imageBasedLightingFactor)
    : new Cartesian2(1.0, 1.0);

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object(
    "options.imageBasedLightingFactor",
    imageBasedLightingFactor
  );
  Check.typeOf.number.greaterThanOrEquals(
    "options.imageBasedLightingFactor.x",
    imageBasedLightingFactor.x,
    0.0
  );
  Check.typeOf.number.lessThanOrEquals(
    "options.imageBasedLightingFactor.x",
    imageBasedLightingFactor.x,
    1.0
  );
  Check.typeOf.number.greaterThanOrEquals(
    "options.imageBasedLightingFactor.y",
    imageBasedLightingFactor.y,
    0.0
  );
  Check.typeOf.number.lessThanOrEquals(
    "options.imageBasedLightingFactor.y",
    imageBasedLightingFactor.y,
    1.0
  );
  //>>includeEnd('debug');

  this._imageBasedLightingFactor = imageBasedLightingFactor;

  const luminanceAtZenith = defaultValue(options.luminanceAtZenith, 0.2);

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("options.luminanceAtZenith", luminanceAtZenith);
  //>>includeEnd('debug');

  this._luminanceAtZenith = luminanceAtZenith;

  const sphericalHarmonicCoefficients = options.sphericalHarmonicCoefficients;

  //>>includeStart('debug', pragmas.debug);
  if (
    defined(sphericalHarmonicCoefficients) &&
    (!Array.isArray(sphericalHarmonicCoefficients) ||
      sphericalHarmonicCoefficients.length !== 9)
  ) {
    throw new DeveloperError(
      "options.sphericalHarmonicCoefficients must be an array of 9 Cartesian3 values."
    );
  }
  //>>includeEnd('debug');
  this._sphericalHarmonicCoefficients = sphericalHarmonicCoefficients;

  // The specular environment map texture is created in update();
  this._specularEnvironmentMaps = options.specularEnvironmentMaps;
  this._specularEnvironmentCubeMap = undefined;
  this._specularEnvironmentCubeMapDirty = true;
  this._specularEnvironmentMapLoaded = false;
  this._previousSpecularEnvironmentMapLoaded = false;

  this._useDefaultSpecularMaps = false;
  this._useDefaultSphericalHarmonics = false;
  this._shouldRegenerateShaders = false;

  // Store the previous frame number to prevent redundant update calls
  this._previousFrameNumber = undefined;

  // Keeps track of the last values for use during update logic
  this._previousImageBasedLightingFactor = Cartesian2.clone(
    imageBasedLightingFactor
  );
  this._previousLuminanceAtZenith = luminanceAtZenith;
  this._previousSphericalHarmonicCoefficients = sphericalHarmonicCoefficients;
  this._removeErrorListener = undefined;
}

Object.defineProperties(ImageBasedLighting.prototype, {
  /**
   * Cesium 添加了来自地球、天空、大气层和星空盒的照明。
   * 此笛卡尔用于缩放最终的漫反射和镜面反射照明
   * 来自这些来源对最终颜色的贡献。值 0.0 将
   * 禁用这些光源。
   *
   * @memberof ImageBasedLighting.prototype
   *
   * @type {Cartesian2}
   * @default Cartesian2(1.0, 1.0)
   */
  imageBasedLightingFactor: {
    get: function () {
      return this._imageBasedLightingFactor;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.object("imageBasedLightingFactor", value);
      Check.typeOf.number.greaterThanOrEquals(
        "imageBasedLightingFactor.x",
        value.x,
        0.0
      );
      Check.typeOf.number.lessThanOrEquals(
        "imageBasedLightingFactor.x",
        value.x,
        1.0
      );
      Check.typeOf.number.greaterThanOrEquals(
        "imageBasedLightingFactor.y",
        value.y,
        0.0
      );
      Check.typeOf.number.lessThanOrEquals(
        "imageBasedLightingFactor.y",
        value.y,
        1.0
      );
      //>>includeEnd('debug');
      this._previousImageBasedLightingFactor = Cartesian2.clone(
        this._imageBasedLightingFactor,
        this._previousImageBasedLightingFactor
      );
      this._imageBasedLightingFactor = Cartesian2.clone(
        value,
        this._imageBasedLightingFactor
      );
    },
  },

  /**
   * 太阳在天顶的亮度，单位为千坎德拉/平方米
   * 用于此模型的程序环境贴图。这在以下情况下使用
   * {@link ImageBasedLighting#specularEnvironmentMaps} 和 {@link ImageBasedLighting#sphericalHarmonicCoefficients}
   * 未定义。
   *
   * @memberof ImageBasedLighting.prototype
   *
   * @type {number}
   * @default 0.2
   */
  luminanceAtZenith: {
    get: function () {
      return this._luminanceAtZenith;
    },
    set: function (value) {
      this._previousLuminanceAtZenith = this._luminanceAtZenith;
      this._luminanceAtZenith = value;
    },
  },

  /**
   * 用于基于图像的照明的漫反射色的三阶球谐系数。<code>如果未定义</code>，则 diffuse irradiance
   * 使用根据大气颜色计算的。
   * <p>
   * 有 9 个 <code>Cartesian3</code> 系数。
   * 系数的顺序为：L<sub>0,0</sub>、L<sub>1，-1</sub>、L<sub>1,0</sub>、L<sub>1,1</sub>、L<sub>2，-2</sub>、L<sub>2，-1</sub>、L<sub>2,0</sub>、L<sub>2,1</sub>、L<sub>2,2</sub>
   * </p>
   *
   * 这些值可以通过使用 <code>cmgen</code> 工具预处理环境贴图来获得
   * {@link https://github.com/google/filament/releases|Google 的 Filament 项目}。
   * 请务必使用 <code>cmgen</code> 中的 <code>--no-mirror</code> 选项。
   *
   * @memberof ImageBasedLighting.prototype
   *
   * @type {Cartesian3[]}
   * @demo {@link https://sandcastle.cesium.com/index.html?src=Image-Based Lighting.html|Sandcastle Image Based Lighting Demo}
   * @see {@link https://graphics.stanford.edu/papers/envmap/envmap.pdf|An Efficient Representation for Irradiance Environment Maps}
   */
  sphericalHarmonicCoefficients: {
    get: function () {
      return this._sphericalHarmonicCoefficients;
    },
    set: function (value) {
      //>>includeStart('debug', pragmas.debug);
      if (defined(value) && (!Array.isArray(value) || value.length !== 9)) {
        throw new DeveloperError(
          "sphericalHarmonicCoefficients must be an array of 9 Cartesian3 values."
        );
      }
      //>>includeEnd('debug');
      this._previousSphericalHarmonicCoefficients = this._sphericalHarmonicCoefficients;
      this._sphericalHarmonicCoefficients = value;
    },
  },

  /**
   * 一个指向 KTX2 文件的 URL，其中包含镜面反射照明的立方体贴图和复杂的镜面反射 mipmap。
   *
   * @memberof ImageBasedLighting.prototype
   * @demo {@link https://sandcastle.cesium.com/index.html?src=Image-Based Lighting.html|Sandcastle Image Based Lighting Demo}
   * @type {string}
   * @see ImageBasedLighting#sphericalHarmonicCoefficients
   */
  specularEnvironmentMaps: {
    get: function () {
      return this._specularEnvironmentMaps;
    },
    set: function (value) {
      if (value !== this._specularEnvironmentMaps) {
        this._specularEnvironmentCubeMapDirty =
          this._specularEnvironmentCubeMapDirty ||
          value !== this._specularEnvironmentMaps;
        this._specularEnvironmentMapLoaded = false;
      }
      this._specularEnvironmentMaps = value;
    },
  },

  /**
   * 是否启用基于图像的照明。
   *
   * @memberof ImageBasedLighting.prototype
   * @type {boolean}
   *
   * @private
   */
  enabled: {
    get: function () {
      return (
        this._imageBasedLightingFactor.x > 0.0 ||
        this._imageBasedLightingFactor.y > 0.0
      );
    },
  },

  /**
   * 使用此光照的模型是否应重新生成其着色器，
   * 根据属性和资源已更改。
   *
   * @memberof ImageBasedLighting.prototype
   * @type {boolean}
   *
   * @private
   */
  shouldRegenerateShaders: {
    get: function () {
      return this._shouldRegenerateShaders;
    },
  },

  /**
   * 是否使用默认的球谐系数。
   *
   * @memberof ImageBasedLighting.prototype
   * @type {boolean}
   *
   * @private
   */
  useDefaultSphericalHarmonics: {
    get: function () {
      return this._useDefaultSphericalHarmonics;
    },
  },

  /**
   * 基于图像的光照设置是否使用球谐系数。
   *
   * @memberof ImageBasedLighting.prototype
   * @type {boolean}
   *
   * @private
   */
  useSphericalHarmonicCoefficients: {
    get: function () {
      return (
        defined(this._sphericalHarmonicCoefficients) ||
        this._useDefaultSphericalHarmonics
      );
    },
  },

  /**
   * 镜面反射环境贴图的立方体贴图。
   *
   * @memberof ImageBasedLighting.prototype
   * @type {SpecularEnvironmentCubeMap}
   *
   * @private
   */
  specularEnvironmentCubeMap: {
    get: function () {
      return this._specularEnvironmentCubeMap;
    },
  },

  /**
   * 是否使用默认镜面反射环境贴图。
   *
   * @memberof ImageBasedLighting.prototype
   * @type {boolean}
   *
   * @private
   */
  useDefaultSpecularMaps: {
    get: function () {
      return this._useDefaultSpecularMaps;
    },
  },

  /**
   * 基于图像的照明设置是否使用镜面反射环境贴图。
   *
   * @memberof ImageBasedLighting.prototype
   * @type {boolean}
   *
   * @private
   */
  useSpecularEnvironmentMaps: {
    get: function () {
      return (
        (defined(this._specularEnvironmentCubeMap) &&
          this._specularEnvironmentCubeMap.ready) ||
        this._useDefaultSpecularMaps
      );
    },
  },
});

function createSpecularEnvironmentCubeMap(imageBasedLighting, context) {
  if (!SpecularEnvironmentCubeMap.isSupported(context)) {
    return;
  }

  imageBasedLighting._specularEnvironmentCubeMap =
    imageBasedLighting._specularEnvironmentCubeMap &&
    imageBasedLighting._specularEnvironmentCubeMap.destroy();

  if (defined(imageBasedLighting._specularEnvironmentMaps)) {
    const cubeMap = new SpecularEnvironmentCubeMap(
      imageBasedLighting._specularEnvironmentMaps
    );
    imageBasedLighting._specularEnvironmentCubeMap = cubeMap;

    imageBasedLighting._removeErrorListener = cubeMap.errorEvent.addEventListener(
      (error) => {
        console.error(`Error loading specularEnvironmentMaps: ${error}`);
      }
    );
  }

  // Regenerate shaders so they do not use an environment map.
  // Will be set to true again if there was a new environment map and it is ready.
  imageBasedLighting._shouldRegenerateShaders = true;
}

ImageBasedLighting.prototype.update = function (frameState) {
  if (frameState.frameNumber === this._previousFrameNumber) {
    return;
  }

  this._previousFrameNumber = frameState.frameNumber;
  const context = frameState.context;

  frameState.brdfLutGenerator.update(frameState);
  this._shouldRegenerateShaders = false;

  const iblFactor = this._imageBasedLightingFactor;
  const previousIBLFactor = this._previousImageBasedLightingFactor;
  if (!Cartesian2.equals(iblFactor, previousIBLFactor)) {
    this._shouldRegenerateShaders =
      (iblFactor.x > 0.0 && previousIBLFactor.x === 0.0) ||
      (iblFactor.x === 0.0 && previousIBLFactor.x > 0.0);
    this._shouldRegenerateShaders =
      this._shouldRegenerateShaders ||
      (iblFactor.y > 0.0 && previousIBLFactor.y === 0.0) ||
      (iblFactor.y === 0.0 && previousIBLFactor.y > 0.0);

    this._previousImageBasedLightingFactor = Cartesian2.clone(
      this._imageBasedLightingFactor,
      this._previousImageBasedLightingFactor
    );
  }

  if (this._luminanceAtZenith !== this._previousLuminanceAtZenith) {
    this._shouldRegenerateShaders =
      this._shouldRegenerateShaders ||
      defined(this._luminanceAtZenith) !==
        defined(this._previousLuminanceAtZenith);

    this._previousLuminanceAtZenith = this._luminanceAtZenith;
  }

  if (
    this._previousSphericalHarmonicCoefficients !==
    this._sphericalHarmonicCoefficients
  ) {
    this._shouldRegenerateShaders =
      this._shouldRegenerateShaders ||
      defined(this._previousSphericalHarmonicCoefficients) !==
        defined(this._sphericalHarmonicCoefficients);

    this._previousSphericalHarmonicCoefficients = this._sphericalHarmonicCoefficients;
  }

  this._shouldRegenerateShaders =
    this._shouldRegenerateShaders ||
    this._previousSpecularEnvironmentMapLoaded !==
      this._specularEnvironmentMapLoaded;

  this._previousSpecularEnvironmentMapLoaded = this._specularEnvironmentMapLoaded;

  if (this._specularEnvironmentCubeMapDirty) {
    createSpecularEnvironmentCubeMap(this, context);
    this._specularEnvironmentCubeMapDirty = false;
  }

  if (defined(this._specularEnvironmentCubeMap)) {
    this._specularEnvironmentCubeMap.update(frameState);
    if (this._specularEnvironmentCubeMap.ready) {
      this._specularEnvironmentMapLoaded = true;
    }
  }

  const recompileWithDefaultCubeMap =
    !defined(this._specularEnvironmentCubeMap) &&
    defined(frameState.specularEnvironmentMaps) &&
    !this._useDefaultSpecularMaps;
  const recompileWithoutDefaultCubeMap =
    !defined(frameState.specularEnvironmentMaps) &&
    this._useDefaultSpecularMaps;

  const recompileWithDefaultSHCoeffs =
    !defined(this._sphericalHarmonicCoefficients) &&
    defined(frameState.sphericalHarmonicCoefficients) &&
    !this._useDefaultSphericalHarmonics;
  const recompileWithoutDefaultSHCoeffs =
    !defined(frameState.sphericalHarmonicCoefficients) &&
    this._useDefaultSphericalHarmonics;

  this._shouldRegenerateShaders =
    this._shouldRegenerateShaders ||
    recompileWithDefaultCubeMap ||
    recompileWithoutDefaultCubeMap ||
    recompileWithDefaultSHCoeffs ||
    recompileWithoutDefaultSHCoeffs;

  this._useDefaultSpecularMaps =
    !defined(this._specularEnvironmentCubeMap) &&
    defined(frameState.specularEnvironmentMaps);
  this._useDefaultSphericalHarmonics =
    !defined(this._sphericalHarmonicCoefficients) &&
    defined(frameState.sphericalHarmonicCoefficients);
};

/**
 * 如果此对象已销毁，则返回 true;否则为 false。
 * <br /><br />
 * 如果此对象已销毁，则不应使用;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果此对象被销毁，则为 True;否则为 false。
 *
 * @see ImageBasedLighting#destroy
 * @private
 */
ImageBasedLighting.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。 销毁对象允许确定性
 * 释放 WebGL 资源，而不是依赖垃圾回收器来销毁这个对象。
 * <br /><br />
 * 一旦对象被销毁，就不应该使用它;调用
 *  <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。 因此
 * 将返回值 （<code>undefined</code>） 分配给对象，如示例中所示。
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 * @example
 * imageBasedLighting = imageBasedLighting && imageBasedLighting.destroy();
 *
 * @see ImageBasedLighting#isDestroyed
 * @private
 */
ImageBasedLighting.prototype.destroy = function () {
  this._specularEnvironmentCubeMap =
    this._specularEnvironmentCubeMap &&
    this._specularEnvironmentCubeMap.destroy();
  this._removeErrorListener =
    this._removeErrorListener && this._removeErrorListener();
  return destroyObject(this);
};

export default ImageBasedLighting;
