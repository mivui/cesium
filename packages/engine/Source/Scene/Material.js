import Cartesian2 from "../Core/Cartesian2.js";
import clone from "../Core/clone.js";
import Color from "../Core/Color.js";
import combine from "../Core/combine.js";
import createGuid from "../Core/createGuid.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import loadKTX2 from "../Core/loadKTX2.js";
import Matrix2 from "../Core/Matrix2.js";
import Matrix3 from "../Core/Matrix3.js";
import Matrix4 from "../Core/Matrix4.js";
import Resource from "../Core/Resource.js";
import CubeMap from "../Renderer/CubeMap.js";
import Texture from "../Renderer/Texture.js";
import AspectRampMaterial from "../Shaders/Materials/AspectRampMaterial.js";
import BumpMapMaterial from "../Shaders/Materials/BumpMapMaterial.js";
import CheckerboardMaterial from "../Shaders/Materials/CheckerboardMaterial.js";
import DotMaterial from "../Shaders/Materials/DotMaterial.js";
import ElevationBandMaterial from "../Shaders/Materials/ElevationBandMaterial.js";
import ElevationContourMaterial from "../Shaders/Materials/ElevationContourMaterial.js";
import ElevationRampMaterial from "../Shaders/Materials/ElevationRampMaterial.js";
import FadeMaterial from "../Shaders/Materials/FadeMaterial.js";
import GridMaterial from "../Shaders/Materials/GridMaterial.js";
import NormalMapMaterial from "../Shaders/Materials/NormalMapMaterial.js";
import PolylineArrowMaterial from "../Shaders/Materials/PolylineArrowMaterial.js";
import PolylineDashMaterial from "../Shaders/Materials/PolylineDashMaterial.js";
import PolylineGlowMaterial from "../Shaders/Materials/PolylineGlowMaterial.js";
import PolylineOutlineMaterial from "../Shaders/Materials/PolylineOutlineMaterial.js";
import RimLightingMaterial from "../Shaders/Materials/RimLightingMaterial.js";
import Sampler from "../Renderer/Sampler.js";
import SlopeRampMaterial from "../Shaders/Materials/SlopeRampMaterial.js";
import StripeMaterial from "../Shaders/Materials/StripeMaterial.js";
import TextureMagnificationFilter from "../Renderer/TextureMagnificationFilter.js";
import TextureMinificationFilter from "../Renderer/TextureMinificationFilter.js";
import WaterMaskMaterial from "../Shaders/Materials/WaterMaskMaterial.js";
import WaterMaterial from "../Shaders/Materials/Water.js";

/**
 * 材质通过漫反射、镜面反射、
 * Normal、Emission 和 Alpha 组件。这些值是使用
 * 名为 Fabric 的 JSON 架构，它被解析并组装成 glsl 着色器代码
 * 幕后花絮。查看 {@link https://github.com/CesiumGS/cesium/wiki/Fabric|wiki 页面}
 * 了解有关 Fabric 的更多详细信息。
 * <br /><br />
 * <style type="text/css">
 *  #materialDescriptions code {
 *      font-weight: normal;
 *      font-family: Consolas, 'Lucida Console', Monaco, monospace;
 *      color: #A35A00;
 *  }
 *  #materialDescriptions ul, #materialDescriptions ul ul {
 *      list-style-type: none;
 *  }
 *  #materialDescriptions ul ul {
 *      margin-bottom: 10px;
 *  }
 *  #materialDescriptions ul ul li {
 *      font-weight: normal;
 *      color: #000000;
 *      text-indent: -2em;
 *      margin-left: 2em;
 *  }
 *  #materialDescriptions ul li {
 *      font-weight: bold;
 *      color: #0053CF;
 *  }
 * </style>
 *
 * 基础材料类型及其制服：
 * <div id='materialDescriptions'>
 * <ul>
 *  <li>Color</li>
 *  <ul>
 *      <li><code>color</code>:  RGBA color 对象。</li>
 *  </ul>
 *  <li>Image</li>
 *  <ul>
 *      <li><code>image</code>:  图像路径。</li>
 *      <li><code>repeat</code>:  具有 x 和 y 值的对象，用于指定重复图像的次数。</li>
 *  </ul>
 *  <li>DiffuseMap</li>
 *  <ul>
 *      <li><code>image</code>:  图像路径。</li>
 *      <li><code>channels</code>:  包含 r、g、b 和 a 的任意组合的三个字符串，用于选择所需的图像通道。</li>
 *      <li><code>repeat</code>:  具有 x 和 y 值的对象，用于指定重复图像的次数。</li>
 *  </ul>
 *  <li>AlphaMap</li>
 *  <ul>
 *      <li><code>image</code>:  图像路径。</li>
 *      <li><code>channel</code>:  一个包含 r、g、b 或 a 的字符串，用于选择所需的图像通道。 </li>
 *      <li><code>repeat</code>:  具有 x 和 y 值的对象，用于指定重复图像的次数。</li>
 *  </ul>
 *  <li>SpecularMap</li>
 *  <ul>
 *      <li><code>image</code>: 图像路径。</li>
 *      <li><code>channel</code>: 一个包含 r、g、b 或 a 的字符串，用于选择所需的图像通道。 </li>
 *      <li><code>repeat</code>: 具有 x 和 y 值的对象，用于指定重复图像的次数。</li>
 *  </ul>
 *  <li>EmissionMap</li>
 *  <ul>
 *      <li><code>image</code>:  图像路径。</li>
 *      <li><code>channels</code>:  包含 r、g、b 和 a 的任意组合的三个字符串，用于选择所需的图像通道。 </li>
 *      <li><code>repeat</code>:  具有 x 和 y 值的对象，用于指定重复图像的次数。</li>
 *  </ul>
 *  <li>BumpMap</li>
 *  <ul>
 *      <li><code>image</code>:  图像路径。</li>
 *      <li><code>channel</code>:  一个包含 r、g、b 或 a 的字符串，用于选择所需的图像通道。 </li>
 *      <li><code>repeat</code>:  具有 x 和 y 值的对象，用于指定重复图像的次数。</li>
 *      <li><code>strength</code>:  “凹凸强度”（Bump strength）值介于 0.0 和 1.0 之间，其中 0.0 是小凹凸，1.0 是大凹凸。</li>
 *  </ul>
 *  <li>NormalMap</li>
 *  <ul>
 *      <li><code>image</code>: 图像路径。</li>
 *      <li><code>channels</code>:  包含 r、g、b 和 a 的任意组合的三个字符串，用于选择所需的图像通道。 </li>
 *      <li><code>repeat</code>:  具有 x 和 y 值的对象，用于指定重复图像的次数。</li>
 *      <li><code>strength</code>:  “凹凸强度”（Bump strength）值介于 0.0 和 1.0 之间，其中 0.0 表示小凹凸，1.0 表示大凹凸.</li>
 *  </ul>
 *  <li>Grid</li>
 *  <ul>
 * <li><code>color</code>：整个材质的 RGBA 颜色对象。</li>
 * <li><code>cellAlpha</code>：网格线之间单元格的 Alpha 值。 这将与 color.alpha 结合使用。</li>
 * <li><code>lineCount</code>：具有 x 和 y 值的对象，分别指定列数和行数。</li>
 * <li><code>lineThickness</code>：具有 x 和 y 值的对象，用于指定网格线的粗细（如果可用，则以像素为单位）。</li>
 * <li><code>lineOffset</code>：具有 x 和 y 值的对象，指定网格线的偏移量（范围为 0 到 1）。</li>
 *  </ul>
 *  <li>Stripe</li>
 *  <ul>
 * <li><code>horizontal</code>：确定条带是水平还是垂直的布尔值。</li>
 * <li><code>evenColor</code>：条带的第一种颜色的 rgba 颜色对象。</li>
 * <li><code>oddColor</code>：条带的第二种颜色的 rgba 颜色对象。</li>
 * <li><code>offset</code>：控制在图案中的哪个点开始绘制的数字;0.0 是偶数颜色的开始，1.0 是奇数颜色的开始，2.0 是偶数颜色，任何倍数或分数值介于两者之间。</li>
 * <li><code>repeat</code>：控制条纹总数的数字，一半是浅色，一半是深色。</li>
 *  </ul>
 *  <li>Checkerboard</li>
 *  <ul>
 * <li><code>lightColor</code>：棋盘格的光交替颜色的 rgba 颜色对象。</li>
 * <li><code>darkColor</code>：棋盘格的深色交替颜色的 rgba 颜色对象。</li>
 * <li><code>repeat</code>：具有 x 和 y 值的对象，分别指定列数和行数。</li>
 *  </ul>
 *  <li>Dot</li>
 *  <ul>
 * <li><code>lightColor</code>：点颜色的 rgba 颜色对象。</li>
 * <li><code>darkColor</code>：背景色的 rgba 颜色对象。</li>
 * <li><code>repeat</code>：具有 x 和 y 值的对象，分别指定点的列数和行数。</li>
 *  </ul>
 *  <li>Water</li>
 * <ul>
 * <li><code>baseWaterColor</code>：rgba 颜色对象水的底色。</li>
 * <li><code>blendColor</code>：从水区域混合到非水区域时使用的 rgba 颜色对象。</li>
 * <li><code>specularMap</code>：用于指示水区域的单通道纹理。</li>
 * <li><code>normalMap</code>：水法线扰动的法线贴图。</li>
 * <li><code>frequency</code>：控制波数的数字。</li>
 * <li><code>animationSpeed</code>：控制水的动画速度的数字。</li>
 * <li><code>amplitude</code>：控制水波振幅的数字。</li>
 * <li><code>specularIntensity</code>：控制镜面反射强度的数字。</li>
 * </ul>
 * <li>RimLighting （边缘照明）</li>
 * <ul>
 * <li><code>颜色</code>：漫反射颜色和 Alpha。</li>
 *  <li><code>rimColor</code>：轮辋的漫反射颜色和 Alpha。</li>
 * <li><code>width</code>：确定轮辋宽度的数字。</li>
 * </ul>
 * <li>淡化</li>
 * <ul>
 * <li><code>fadeInColor</code>：漫反射颜色和 Alpha <code>时间</code></li>
 * <li><code>fadeOutColor</code>：从<code>时间</code>开始的 <code>maximumDistance</code> 处漫反射颜色和 Alpha</li>
 * <li><code>maximumDistance</code>：介于 0.0 和 1.0 之间的数字，其中 <code>fadeInColor</code> 变为 <code>fadeOutColor</code>。值为 0.0 时，整个材质的颜色为 <code>fadeOutColor</code>，值为 1.0 时，整个材质的颜色为 <code>fadeInColor</code></li>
 * <li><code>repeat</code>： 如果淡入淡出应该包裹在纹理坐标周围，则为 true。</li>
 * <li><code>fadeDirection</code>：具有 x 和 y 值的对象，用于指定淡化是否应在 x 和 y 方向上。</li>
 * <li><code>time</code>：x 和 y 值介于 <code>fadeInColor</code> 位置的 0.0 和 1.0 之间的对象</li>
 * </ul>
 * <li>PolylineArrow</li>
 * <ul>
 * <li><code>颜色</code>：漫反射颜色和 Alpha。</li>
 * </ul>
 * <li>多段线短划线</li>
 * <ul>
 * <li><code>color</code>：线条的颜色。</li>
 * <li><code>gapColor</code>：线条中间隙的颜色。</li>
 * <li><code>dashLength</code>：虚线长度（以像素为单位）。</li>
 * <li><code>dashPattern</code>：线条的 16 位点画模式..</li>
 * </ul>
 * <li>PolylineGlow</li>
 * <ul>
 * <li><code>color</code>：线上发光的颜色和最大 Alpha。</li>
 * <li><code>glowPower</code>：发光的强度，占总线宽的百分比（小于 1.0）。</li>
 * <li><code>TaperPower</code>：锥度效应的强度，占总线长的百分比。 如果为 1.0 或更高，则不使用锥化效果。</li>
 * </ul>
 * <li>PolylineOutline</li>
 * <ul>
 * <li><code>color</code>：线条内部的漫反射颜色和 Alpha。</li>
 * <li><code>outlineColor</code>：轮廓的漫反射颜色和 Alpha。</li>
 * <li><code>outlineWidth</code>：轮廓的宽度（以像素为单位）。</li>
 * </ul>
 * <li>ElevationContour</li>
 * <ul>
 * <li><code>color</code>：等值线的颜色和 Alpha。</li>
 * <li><code>spacing</code>：等值线的间距，以米为单位。</li>
 * <li><code>width</code>：指定网格线宽度（以像素为单位）的数字。</li>
 * </ul>
 * <li>ElevationRamp</li>
 * <ul>
 * <li><code>image</code>：用于为地形着色的 Color Ramp 图像。</li>
 * <li><code>minimumHeight</code>：渐变的最小高度。</li>
 * <li><code>maximumHeight</code>：渐变的最大高度。</li>
 * </ul>
 * <li>SlopeRamp 坡道</li>
 * <ul>
 * <li><code>image</code>：用于按坡度为地形着色的 Color Ramp 图像。</li>
 * </ul>
 * <li>AspectRamp</li>
 * <ul>
 * <li><code>image</code>：用于按坡向对地形进行着色的 Color Ramp 图像。</li>
 * </ul>
 * <li>ElevationBand （高程带）</li>
 * <ul>
 * <li><code>heights</code>：从最低到最高排序的高度图像。</li>
 * <li><code>colors</code>：相应高度的颜色图像。</li>
 * </ul>
 * <li>水面罩</li>
 * <ul>
 * <li><code>waterColor</code>：水覆盖区域的漫反射颜色和 Alpha。</li>
 * <li><code>landColor</code>：土地覆盖区域的漫反射颜色和 Alpha。</li>
 * </ul>
 * </ul>
 * </ul>
 * </div>
 *
 * @alias Material
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {boolean} [options.strict=false] 为通常会被忽略的问题抛出错误，包括未使用的 uniform 或材质。
 * @param {boolean|Function} [options.translucent=true] 当为 <code>true</code> 或返回 <code>true</code> 的函数时，几何体
 * 使用此材料时，预期呈现半透明。
 * @param {TextureMinificationFilter} [options.minificationFilter=TextureMinificationFilter.LINEAR] 要应用于此材质的纹理的 {@link TextureMinificationFilter}。
 * @param {TextureMagnificationFilter} [options.magnificationFilter=TextureMagnificationFilter.LINEAR] 要应用于该材质的纹理的 {@link TextureMagnificationFilter}。
 * @param {object} options.fabric 用于生成材质的织物 JSON。
 *
 * @exception {DeveloperError} fabric: uniform has invalid type.
 * @exception {DeveloperError} fabric: uniforms and materials cannot share the same property.
 * @exception {DeveloperError} fabric: cannot have source and components in the same部分。
 * @exception {DeveloperError} fabric: property name is not valid. It should be 'type', 'materials', 'uniforms', 'components', or 'source'.
 * @exception {DeveloperError} fabric: property name is not valid. It should be 'diffuse', 'specular', 'shininess', 'normal', 'emission', or 'alpha'.
 * @exception {DeveloperError} strict: shader source does not use string.
 * @exception {DeveloperError} strict: shader source does not use uniform.
 * @exception {DeveloperError} strict: shader source does not use material.
 *
 * @see {@link https://github.com/CesiumGS/cesium/wiki/Fabric|Fabric wiki page} for a more detailed options of Fabric.
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Materials.html|Cesium Sandcastle Materials Demo}
 *
 * @example
 * // Create a color material with fromType:
 * polygon.material = Cesium.Material.fromType('Color');
 * polygon.material.uniforms.color = new Cesium.Color(1.0, 1.0, 0.0, 1.0);
 *
 * // Create the default material:
 * polygon.material = new Cesium.Material();
 *
 * // Create a color material with full Fabric notation:
 * polygon.material = new Cesium.Material({
 *   fabric: {
 *     type: 'Color',
 *     uniforms: {
 *       color: new Cesium.Color(1.0, 1.0, 0.0, 1.0)
 *     }
 *   }
 * });
 */
function Material(options) {
  /**
   * 材质类型。可以是现有类型或新类型。如果未在 fabric 中指定 type，则 type 为 GUID。
   * @type {string}
   * @default undefined
   */
  this.type = undefined;

  /**
   * 此材质的 glsl 着色器源。
   * @type {string}
   * @default undefined
   */
  this.shaderSource = undefined;

  /**
   * 将子材质名称映射到材质对象。
   * @type {object}
   * @default undefined
   */
  this.materials = undefined;

  /**
   * 将 uniform 名称映射到其值。
   * @type {object}
   * @default undefined
   */
  this.uniforms = undefined;
  this._uniforms = undefined;

  /**
   * 当 <code>true</code> 或返回 <code>true</code> 的函数时，
   * 几何体应显示为半透明。
   * @type {boolean|Function}
   * @default undefined
   */
  this.translucent = undefined;

  this._minificationFilter = defaultValue(
    options.minificationFilter,
    TextureMinificationFilter.LINEAR,
  );
  this._magnificationFilter = defaultValue(
    options.magnificationFilter,
    TextureMagnificationFilter.LINEAR,
  );

  this._strict = undefined;
  this._template = undefined;
  this._count = undefined;

  this._texturePaths = {};
  this._loadedImages = [];
  this._loadedCubeMaps = [];

  this._textures = {};

  this._updateFunctions = [];

  this._defaultTexture = undefined;

  initializeMaterial(options, this);
  Object.defineProperties(this, {
    type: {
      value: this.type,
      writable: false,
    },
  });

  if (!defined(Material._uniformList[this.type])) {
    Material._uniformList[this.type] = Object.keys(this._uniforms);
  }
}

// Cached list of combined uniform names indexed by type.
// Used to get the list of uniforms in the same order.
Material._uniformList = {};

/**
 * 使用现有材质类型创建新材质。
 * <br /><br />
 * 简写： new Material({fabric : {type : type}});
 *
 * @param {string} type 基础材质类型。
 * @param {object} [uniforms] 默认 uniform 的覆盖。
 * @returns {Material} 新的材质对象。
 *
 * @exception {DeveloperError} material with that type does not exist.
 *
 * @example
 * const material = Cesium.Material.fromType('Color', {
 *   color: new Cesium.Color(1.0, 0.0, 0.0, 1.0)
 * });
 */
Material.fromType = function (type, uniforms) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(Material._materialCache.getMaterial(type))) {
    throw new DeveloperError(`material with type '${type}' does not exist.`);
  }
  //>>includeEnd('debug');

  const material = new Material({
    fabric: {
      type: type,
    },
  });

  if (defined(uniforms)) {
    for (const name in uniforms) {
      if (uniforms.hasOwnProperty(name)) {
        material.uniforms[name] = uniforms[name];
      }
    }
  }

  return material;
};

/**
 * 获取是否 这种材料是半透明的。
 * @returns {boolean} 如果此材质是半透明的，则为 <code>true</code>，否则为<code> false</code>。
 */
Material.prototype.isTranslucent = function () {
  if (defined(this.translucent)) {
    if (typeof this.translucent === "function") {
      return this.translucent();
    }

    return this.translucent;
  }

  let translucent = true;
  const funcs = this._translucentFunctions;
  const length = funcs.length;
  for (let i = 0; i < length; ++i) {
    const func = funcs[i];
    if (typeof func === "function") {
      translucent = translucent && func();
    } else {
      translucent = translucent && func;
    }

    if (!translucent) {
      break;
    }
  }
  return translucent;
};

/**
 * @private
 */
Material.prototype.update = function (context) {
  this._defaultTexture = context.defaultTexture;

  let i;
  let uniformId;

  const loadedImages = this._loadedImages;
  let length = loadedImages.length;
  for (i = 0; i < length; ++i) {
    const loadedImage = loadedImages[i];
    uniformId = loadedImage.id;
    let image = loadedImage.image;

    // Images transcoded from KTX2 can contain multiple mip levels:
    // https://github.khronos.org/KTX-Specification/#_mip_level_array
    let mipLevels;
    if (Array.isArray(image)) {
      // highest detail mip should be level 0
      mipLevels = image.slice(1, image.length).map(function (mipLevel) {
        return mipLevel.bufferView;
      });
      image = image[0];
    }

    const sampler = new Sampler({
      minificationFilter: this._minificationFilter,
      magnificationFilter: this._magnificationFilter,
    });

    let texture;
    if (defined(image.internalFormat)) {
      texture = new Texture({
        context: context,
        pixelFormat: image.internalFormat,
        width: image.width,
        height: image.height,
        source: {
          arrayBufferView: image.bufferView,
          mipLevels: mipLevels,
        },
        sampler: sampler,
      });
    } else {
      texture = new Texture({
        context: context,
        source: image,
        sampler: sampler,
      });
    }

    // The material destroys its old texture only after the new one has been loaded.
    // This will ensure a smooth swap of textures and prevent the default texture
    // from appearing for a few frames.
    const oldTexture = this._textures[uniformId];
    if (defined(oldTexture) && oldTexture !== this._defaultTexture) {
      oldTexture.destroy();
    }

    this._textures[uniformId] = texture;

    const uniformDimensionsName = `${uniformId}Dimensions`;
    if (this.uniforms.hasOwnProperty(uniformDimensionsName)) {
      const uniformDimensions = this.uniforms[uniformDimensionsName];
      uniformDimensions.x = texture._width;
      uniformDimensions.y = texture._height;
    }
  }

  loadedImages.length = 0;

  const loadedCubeMaps = this._loadedCubeMaps;
  length = loadedCubeMaps.length;

  for (i = 0; i < length; ++i) {
    const loadedCubeMap = loadedCubeMaps[i];
    uniformId = loadedCubeMap.id;
    const images = loadedCubeMap.images;

    const cubeMap = new CubeMap({
      context: context,
      source: {
        positiveX: images[0],
        negativeX: images[1],
        positiveY: images[2],
        negativeY: images[3],
        positiveZ: images[4],
        negativeZ: images[5],
      },
      sampler: new Sampler({
        minificationFilter: this._minificationFilter,
        magnificationFilter: this._magnificationFilter,
      }),
    });

    this._textures[uniformId] = cubeMap;
  }

  loadedCubeMaps.length = 0;

  const updateFunctions = this._updateFunctions;
  length = updateFunctions.length;
  for (i = 0; i < length; ++i) {
    updateFunctions[i](this, context);
  }

  const subMaterials = this.materials;
  for (const name in subMaterials) {
    if (subMaterials.hasOwnProperty(name)) {
      subMaterials[name].update(context);
    }
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
 * @see Material#destroy
 */
Material.prototype.isDestroyed = function () {
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
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 *
 * @example
 * material = material && material.destroy();
 *
 * @see Material#isDestroyed
 */
Material.prototype.destroy = function () {
  const textures = this._textures;
  for (const texture in textures) {
    if (textures.hasOwnProperty(texture)) {
      const instance = textures[texture];
      if (instance !== this._defaultTexture) {
        instance.destroy();
      }
    }
  }

  const materials = this.materials;
  for (const material in materials) {
    if (materials.hasOwnProperty(material)) {
      materials[material].destroy();
    }
  }
  return destroyObject(this);
};

function initializeMaterial(options, result) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);
  result._strict = defaultValue(options.strict, false);
  result._count = defaultValue(options.count, 0);
  result._template = clone(
    defaultValue(options.fabric, defaultValue.EMPTY_OBJECT),
  );
  result._template.uniforms = clone(
    defaultValue(result._template.uniforms, defaultValue.EMPTY_OBJECT),
  );
  result._template.materials = clone(
    defaultValue(result._template.materials, defaultValue.EMPTY_OBJECT),
  );

  result.type = defined(result._template.type)
    ? result._template.type
    : createGuid();

  result.shaderSource = "";
  result.materials = {};
  result.uniforms = {};
  result._uniforms = {};
  result._translucentFunctions = [];

  let translucent;

  // If the cache contains this material type, build the material template off of the stored template.
  const cachedMaterial = Material._materialCache.getMaterial(result.type);
  if (defined(cachedMaterial)) {
    const template = clone(cachedMaterial.fabric, true);
    result._template = combine(result._template, template, true);
    translucent = cachedMaterial.translucent;
  }

  // Make sure the template has no obvious errors. More error checking happens later.
  checkForTemplateErrors(result);

  // If the material has a new type, add it to the cache.
  if (!defined(cachedMaterial)) {
    Material._materialCache.addMaterial(result.type, result);
  }

  createMethodDefinition(result);
  createUniforms(result);
  createSubMaterials(result);

  const defaultTranslucent =
    result._translucentFunctions.length === 0 ? true : undefined;
  translucent = defaultValue(translucent, defaultTranslucent);
  translucent = defaultValue(options.translucent, translucent);

  if (defined(translucent)) {
    if (typeof translucent === "function") {
      const wrappedTranslucent = function () {
        return translucent(result);
      };
      result._translucentFunctions.push(wrappedTranslucent);
    } else {
      result._translucentFunctions.push(translucent);
    }
  }
}

function checkForValidProperties(object, properties, result, throwNotFound) {
  if (defined(object)) {
    for (const property in object) {
      if (object.hasOwnProperty(property)) {
        const hasProperty = properties.indexOf(property) !== -1;
        if (
          (throwNotFound && !hasProperty) ||
          (!throwNotFound && hasProperty)
        ) {
          result(property, properties);
        }
      }
    }
  }
}

function invalidNameError(property, properties) {
  //>>includeStart('debug', pragmas.debug);
  let errorString = `fabric: property name '${property}' is not valid. It should be `;
  for (let i = 0; i < properties.length; i++) {
    const propertyName = `'${properties[i]}'`;
    errorString +=
      i === properties.length - 1 ? `or ${propertyName}.` : `${propertyName}, `;
  }
  throw new DeveloperError(errorString);
  //>>includeEnd('debug');
}

function duplicateNameError(property, properties) {
  //>>includeStart('debug', pragmas.debug);
  const errorString = `fabric: uniforms and materials cannot share the same property '${property}'`;
  throw new DeveloperError(errorString);
  //>>includeEnd('debug');
}

const templateProperties = [
  "type",
  "materials",
  "uniforms",
  "components",
  "source",
];
const componentProperties = [
  "diffuse",
  "specular",
  "shininess",
  "normal",
  "emission",
  "alpha",
];

function checkForTemplateErrors(material) {
  const template = material._template;
  const uniforms = template.uniforms;
  const materials = template.materials;
  const components = template.components;

  // Make sure source and components do not exist in the same template.
  //>>includeStart('debug', pragmas.debug);
  if (defined(components) && defined(template.source)) {
    throw new DeveloperError(
      "fabric: cannot have source and components in the same template.",
    );
  }
  //>>includeEnd('debug');

  // Make sure all template and components properties are valid.
  checkForValidProperties(template, templateProperties, invalidNameError, true);
  checkForValidProperties(
    components,
    componentProperties,
    invalidNameError,
    true,
  );

  // Make sure uniforms and materials do not share any of the same names.
  const materialNames = [];
  for (const property in materials) {
    if (materials.hasOwnProperty(property)) {
      materialNames.push(property);
    }
  }
  checkForValidProperties(uniforms, materialNames, duplicateNameError, false);
}

function isMaterialFused(shaderComponent, material) {
  const materials = material._template.materials;
  for (const subMaterialId in materials) {
    if (materials.hasOwnProperty(subMaterialId)) {
      if (shaderComponent.indexOf(subMaterialId) > -1) {
        return true;
      }
    }
  }

  return false;
}

// Create the czm_getMaterial method body using source or components.
function createMethodDefinition(material) {
  const components = material._template.components;
  const source = material._template.source;
  if (defined(source)) {
    material.shaderSource += `${source}\n`;
  } else {
    material.shaderSource +=
      "czm_material czm_getMaterial(czm_materialInput materialInput)\n{\n";
    material.shaderSource +=
      "czm_material material = czm_getDefaultMaterial(materialInput);\n";
    if (defined(components)) {
      const isMultiMaterial =
        Object.keys(material._template.materials).length > 0;
      for (const component in components) {
        if (components.hasOwnProperty(component)) {
          if (component === "diffuse" || component === "emission") {
            const isFusion =
              isMultiMaterial &&
              isMaterialFused(components[component], material);
            const componentSource = isFusion
              ? components[component]
              : `czm_gammaCorrect(${components[component]})`;
            material.shaderSource += `material.${component} = ${componentSource}; \n`;
          } else if (component === "alpha") {
            material.shaderSource += `material.alpha = ${components.alpha}; \n`;
          } else {
            material.shaderSource += `material.${component} = ${components[component]};\n`;
          }
        }
      }
    }
    material.shaderSource += "return material;\n}\n";
  }
}

const matrixMap = {
  mat2: Matrix2,
  mat3: Matrix3,
  mat4: Matrix4,
};

const ktx2Regex = /\.ktx2$/i;

function createTexture2DUpdateFunction(uniformId) {
  let oldUniformValue;
  return function (material, context) {
    const uniforms = material.uniforms;
    const uniformValue = uniforms[uniformId];
    const uniformChanged = oldUniformValue !== uniformValue;
    const uniformValueIsDefaultImage =
      !defined(uniformValue) || uniformValue === Material.DefaultImageId;
    oldUniformValue = uniformValue;

    let texture = material._textures[uniformId];
    let uniformDimensionsName;
    let uniformDimensions;

    if (uniformValue instanceof HTMLVideoElement) {
      // HTMLVideoElement.readyState >=2 means we have enough data for the current frame.
      // See: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/readyState
      if (uniformValue.readyState >= 2) {
        if (uniformChanged && defined(texture)) {
          if (texture !== context.defaultTexture) {
            texture.destroy();
          }
          texture = undefined;
        }

        if (!defined(texture) || texture === context.defaultTexture) {
          const sampler = new Sampler({
            minificationFilter: material._minificationFilter,
            magnificationFilter: material._magnificationFilter,
          });
          texture = new Texture({
            context: context,
            source: uniformValue,
            sampler: sampler,
          });
          material._textures[uniformId] = texture;
          return;
        }

        texture.copyFrom({
          source: uniformValue,
        });
      } else if (!defined(texture)) {
        material._textures[uniformId] = context.defaultTexture;
      }
      return;
    }

    if (uniformValue instanceof Texture && uniformValue !== texture) {
      material._texturePaths[uniformId] = undefined;
      const tmp = material._textures[uniformId];
      if (defined(tmp) && tmp !== material._defaultTexture) {
        tmp.destroy();
      }
      material._textures[uniformId] = uniformValue;

      uniformDimensionsName = `${uniformId}Dimensions`;
      if (uniforms.hasOwnProperty(uniformDimensionsName)) {
        uniformDimensions = uniforms[uniformDimensionsName];
        uniformDimensions.x = uniformValue._width;
        uniformDimensions.y = uniformValue._height;
      }

      return;
    }

    if (uniformChanged && defined(texture) && uniformValueIsDefaultImage) {
      // If the newly-assigned texture is the default texture,
      // we don't need to wait for a new image to load before destroying
      // the old texture.
      if (texture !== material._defaultTexture) {
        texture.destroy();
      }
      texture = undefined;
    }

    if (!defined(texture)) {
      material._texturePaths[uniformId] = undefined;
      texture = material._textures[uniformId] = material._defaultTexture;

      uniformDimensionsName = `${uniformId}Dimensions`;
      if (uniforms.hasOwnProperty(uniformDimensionsName)) {
        uniformDimensions = uniforms[uniformDimensionsName];
        uniformDimensions.x = texture._width;
        uniformDimensions.y = texture._height;
      }
    }

    if (uniformValueIsDefaultImage) {
      return;
    }

    // When using the entity layer, the Resource objects get recreated on getValue because
    //  they are clonable. That's why we check the url property for Resources
    //  because the instances aren't the same and we keep trying to load the same
    //  image if it fails to load.
    const isResource = uniformValue instanceof Resource;
    if (
      !defined(material._texturePaths[uniformId]) ||
      (isResource &&
        uniformValue.url !== material._texturePaths[uniformId].url) ||
      (!isResource && uniformValue !== material._texturePaths[uniformId])
    ) {
      if (typeof uniformValue === "string" || isResource) {
        const resource = isResource
          ? uniformValue
          : Resource.createIfNeeded(uniformValue);

        let promise;
        if (ktx2Regex.test(resource.url)) {
          promise = loadKTX2(resource.url);
        } else {
          promise = resource.fetchImage();
        }

        Promise.resolve(promise)
          .then(function (image) {
            material._loadedImages.push({
              id: uniformId,
              image: image,
            });
          })
          .catch(function () {
            if (defined(texture) && texture !== material._defaultTexture) {
              texture.destroy();
            }
            material._textures[uniformId] = material._defaultTexture;
          });
      } else if (
        uniformValue instanceof HTMLCanvasElement ||
        uniformValue instanceof HTMLImageElement
      ) {
        material._loadedImages.push({
          id: uniformId,
          image: uniformValue,
        });
      }

      material._texturePaths[uniformId] = uniformValue;
    }
  };
}

function createCubeMapUpdateFunction(uniformId) {
  return function (material, context) {
    const uniformValue = material.uniforms[uniformId];

    if (uniformValue instanceof CubeMap) {
      const tmp = material._textures[uniformId];
      if (tmp !== material._defaultTexture) {
        tmp.destroy();
      }
      material._texturePaths[uniformId] = undefined;
      material._textures[uniformId] = uniformValue;
      return;
    }

    if (!defined(material._textures[uniformId])) {
      material._texturePaths[uniformId] = undefined;
      material._textures[uniformId] = context.defaultCubeMap;
    }

    if (uniformValue === Material.DefaultCubeMapId) {
      return;
    }

    const path =
      uniformValue.positiveX +
      uniformValue.negativeX +
      uniformValue.positiveY +
      uniformValue.negativeY +
      uniformValue.positiveZ +
      uniformValue.negativeZ;

    if (path !== material._texturePaths[uniformId]) {
      const promises = [
        Resource.createIfNeeded(uniformValue.positiveX).fetchImage(),
        Resource.createIfNeeded(uniformValue.negativeX).fetchImage(),
        Resource.createIfNeeded(uniformValue.positiveY).fetchImage(),
        Resource.createIfNeeded(uniformValue.negativeY).fetchImage(),
        Resource.createIfNeeded(uniformValue.positiveZ).fetchImage(),
        Resource.createIfNeeded(uniformValue.negativeZ).fetchImage(),
      ];

      Promise.all(promises).then(function (images) {
        material._loadedCubeMaps.push({
          id: uniformId,
          images: images,
        });
      });

      material._texturePaths[uniformId] = path;
    }
  };
}

function createUniforms(material) {
  const uniforms = material._template.uniforms;
  for (const uniformId in uniforms) {
    if (uniforms.hasOwnProperty(uniformId)) {
      createUniform(material, uniformId);
    }
  }
}

// Writes uniform declarations to the shader file and connects uniform values with
// corresponding material properties through the returnUniforms function.
function createUniform(material, uniformId) {
  const strict = material._strict;
  const materialUniforms = material._template.uniforms;
  const uniformValue = materialUniforms[uniformId];
  const uniformType = getUniformType(uniformValue);

  //>>includeStart('debug', pragmas.debug);
  if (!defined(uniformType)) {
    throw new DeveloperError(
      `fabric: uniform '${uniformId}' has invalid type.`,
    );
  }
  //>>includeEnd('debug');

  let replacedTokenCount;
  if (uniformType === "channels") {
    replacedTokenCount = replaceToken(material, uniformId, uniformValue, false);
    //>>includeStart('debug', pragmas.debug);
    if (replacedTokenCount === 0 && strict) {
      throw new DeveloperError(
        `strict: shader source does not use channels '${uniformId}'.`,
      );
    }
    //>>includeEnd('debug');
  } else {
    // Since webgl doesn't allow texture dimension queries in glsl, create a uniform to do it.
    // Check if the shader source actually uses texture dimensions before creating the uniform.
    if (uniformType === "sampler2D") {
      const imageDimensionsUniformName = `${uniformId}Dimensions`;
      if (getNumberOfTokens(material, imageDimensionsUniformName) > 0) {
        materialUniforms[imageDimensionsUniformName] = {
          type: "ivec3",
          x: 1,
          y: 1,
        };
        createUniform(material, imageDimensionsUniformName);
      }
    }

    // Add uniform declaration to source code.
    const uniformDeclarationRegex = new RegExp(
      `uniform\\s+${uniformType}\\s+${uniformId}\\s*;`,
    );
    if (!uniformDeclarationRegex.test(material.shaderSource)) {
      const uniformDeclaration = `uniform ${uniformType} ${uniformId};`;
      material.shaderSource = uniformDeclaration + material.shaderSource;
    }

    const newUniformId = `${uniformId}_${material._count++}`;
    replacedTokenCount = replaceToken(material, uniformId, newUniformId);
    //>>includeStart('debug', pragmas.debug);
    if (replacedTokenCount === 1 && strict) {
      throw new DeveloperError(
        `strict: shader source does not use uniform '${uniformId}'.`,
      );
    }
    //>>includeEnd('debug');

    // Set uniform value
    material.uniforms[uniformId] = uniformValue;

    if (uniformType === "sampler2D") {
      material._uniforms[newUniformId] = function () {
        return material._textures[uniformId];
      };
      material._updateFunctions.push(createTexture2DUpdateFunction(uniformId));
    } else if (uniformType === "samplerCube") {
      material._uniforms[newUniformId] = function () {
        return material._textures[uniformId];
      };
      material._updateFunctions.push(createCubeMapUpdateFunction(uniformId));
    } else if (uniformType.indexOf("mat") !== -1) {
      const scratchMatrix = new matrixMap[uniformType]();
      material._uniforms[newUniformId] = function () {
        return matrixMap[uniformType].fromColumnMajorArray(
          material.uniforms[uniformId],
          scratchMatrix,
        );
      };
    } else {
      material._uniforms[newUniformId] = function () {
        return material.uniforms[uniformId];
      };
    }
  }
}

// Determines the uniform type based on the uniform in the template.
function getUniformType(uniformValue) {
  let uniformType = uniformValue.type;
  if (!defined(uniformType)) {
    const type = typeof uniformValue;
    if (type === "number") {
      uniformType = "float";
    } else if (type === "boolean") {
      uniformType = "bool";
    } else if (
      type === "string" ||
      uniformValue instanceof Resource ||
      uniformValue instanceof HTMLCanvasElement ||
      uniformValue instanceof HTMLImageElement
    ) {
      if (/^([rgba]){1,4}$/i.test(uniformValue)) {
        uniformType = "channels";
      } else if (uniformValue === Material.DefaultCubeMapId) {
        uniformType = "samplerCube";
      } else {
        uniformType = "sampler2D";
      }
    } else if (type === "object") {
      if (Array.isArray(uniformValue)) {
        if (
          uniformValue.length === 4 ||
          uniformValue.length === 9 ||
          uniformValue.length === 16
        ) {
          uniformType = `mat${Math.sqrt(uniformValue.length)}`;
        }
      } else {
        let numAttributes = 0;
        for (const attribute in uniformValue) {
          if (uniformValue.hasOwnProperty(attribute)) {
            numAttributes += 1;
          }
        }
        if (numAttributes >= 2 && numAttributes <= 4) {
          uniformType = `vec${numAttributes}`;
        } else if (numAttributes === 6) {
          uniformType = "samplerCube";
        }
      }
    }
  }
  return uniformType;
}

// Create all sub-materials by combining source and uniforms together.
function createSubMaterials(material) {
  const strict = material._strict;
  const subMaterialTemplates = material._template.materials;
  for (const subMaterialId in subMaterialTemplates) {
    if (subMaterialTemplates.hasOwnProperty(subMaterialId)) {
      // Construct the sub-material.
      const subMaterial = new Material({
        strict: strict,
        fabric: subMaterialTemplates[subMaterialId],
        count: material._count,
      });

      material._count = subMaterial._count;
      material._uniforms = combine(
        material._uniforms,
        subMaterial._uniforms,
        true,
      );
      material.materials[subMaterialId] = subMaterial;
      material._translucentFunctions = material._translucentFunctions.concat(
        subMaterial._translucentFunctions,
      );

      // Make the material's czm_getMaterial unique by appending the sub-material type.
      const originalMethodName = "czm_getMaterial";
      const newMethodName = `${originalMethodName}_${material._count++}`;
      replaceToken(subMaterial, originalMethodName, newMethodName);
      material.shaderSource = subMaterial.shaderSource + material.shaderSource;

      // Replace each material id with an czm_getMaterial method call.
      const materialMethodCall = `${newMethodName}(materialInput)`;
      const tokensReplacedCount = replaceToken(
        material,
        subMaterialId,
        materialMethodCall,
      );
      //>>includeStart('debug', pragmas.debug);
      if (tokensReplacedCount === 0 && strict) {
        throw new DeveloperError(
          `strict: shader source does not use material '${subMaterialId}'.`,
        );
      }
      //>>includeEnd('debug');
    }
  }
}

// Used for searching or replacing a token in a material's shader source with something else.
// If excludePeriod is true, do not accept tokens that are preceded by periods.
// http://stackoverflow.com/questions/641407/javascript-negative-lookbehind-equivalent
function replaceToken(material, token, newToken, excludePeriod) {
  excludePeriod = defaultValue(excludePeriod, true);
  let count = 0;
  const suffixChars = "([\\w])?";
  const prefixChars = `([\\w${excludePeriod ? "." : ""}])?`;
  const regExp = new RegExp(prefixChars + token + suffixChars, "g");
  material.shaderSource = material.shaderSource.replace(
    regExp,
    function ($0, $1, $2) {
      if ($1 || $2) {
        return $0;
      }
      count += 1;
      return newToken;
    },
  );
  return count;
}

function getNumberOfTokens(material, token, excludePeriod) {
  return replaceToken(material, token, token, excludePeriod);
}

Material._materialCache = {
  _materials: {},
  addMaterial: function (type, materialTemplate) {
    this._materials[type] = materialTemplate;
  },
  getMaterial: function (type) {
    return this._materials[type];
  },
};

/**
 * 获取或设置Default texture uniform 值。
 * @type {string}
 */
Material.DefaultImageId = "czm_defaultImage";

/**
 * 获取或设置默认 Cube Map Texture Uniform 值。
 * @type {string}
 */
Material.DefaultCubeMapId = "czm_defaultCubeMap";

/**
 * 获取颜色材质的名称。
 * @type {string}
 * @readonly
 */
Material.ColorType = "Color";
Material._materialCache.addMaterial(Material.ColorType, {
  fabric: {
    type: Material.ColorType,
    uniforms: {
      color: new Color(1.0, 0.0, 0.0, 0.5),
    },
    components: {
      diffuse: "color.rgb",
      alpha: "color.a",
    },
  },
  translucent: function (material) {
    return material.uniforms.color.alpha < 1.0;
  },
});

/**
 * 获取图像素材的名称。
 * @type {string}
 * @readonly
 */
Material.ImageType = "Image";
Material._materialCache.addMaterial(Material.ImageType, {
  fabric: {
    type: Material.ImageType,
    uniforms: {
      image: Material.DefaultImageId,
      repeat: new Cartesian2(1.0, 1.0),
      color: new Color(1.0, 1.0, 1.0, 1.0),
    },
    components: {
      diffuse:
        "texture(image, fract(repeat * materialInput.st)).rgb * color.rgb",
      alpha: "texture(image, fract(repeat * materialInput.st)).a * color.a",
    },
  },
  translucent: function (material) {
    return material.uniforms.color.alpha < 1.0;
  },
});

/**
 * 获取 diffuce 贴图材质的名称。
 * @type {string}
 * @readonly
 */
Material.DiffuseMapType = "DiffuseMap";
Material._materialCache.addMaterial(Material.DiffuseMapType, {
  fabric: {
    type: Material.DiffuseMapType,
    uniforms: {
      image: Material.DefaultImageId,
      channels: "rgb",
      repeat: new Cartesian2(1.0, 1.0),
    },
    components: {
      diffuse: "texture(image, fract(repeat * materialInput.st)).channels",
    },
  },
  translucent: false,
});

/**
 * 获取 Alpha 贴图材质的名称。
 * @type {string}
 * @readonly
 */
Material.AlphaMapType = "AlphaMap";
Material._materialCache.addMaterial(Material.AlphaMapType, {
  fabric: {
    type: Material.AlphaMapType,
    uniforms: {
      image: Material.DefaultImageId,
      channel: "a",
      repeat: new Cartesian2(1.0, 1.0),
    },
    components: {
      alpha: "texture(image, fract(repeat * materialInput.st)).channel",
    },
  },
  translucent: true,
});

/**
 * 获取镜面反射贴图材质的名称。
 * @type {string}
 * @readonly
 */
Material.SpecularMapType = "SpecularMap";
Material._materialCache.addMaterial(Material.SpecularMapType, {
  fabric: {
    type: Material.SpecularMapType,
    uniforms: {
      image: Material.DefaultImageId,
      channel: "r",
      repeat: new Cartesian2(1.0, 1.0),
    },
    components: {
      specular: "texture(image, fract(repeat * materialInput.st)).channel",
    },
  },
  translucent: false,
});

/**
 * 获取 emmision 贴图材质的名称。
 * @type {string}
 * @readonly
 */
Material.EmissionMapType = "EmissionMap";
Material._materialCache.addMaterial(Material.EmissionMapType, {
  fabric: {
    type: Material.EmissionMapType,
    uniforms: {
      image: Material.DefaultImageId,
      channels: "rgb",
      repeat: new Cartesian2(1.0, 1.0),
    },
    components: {
      emission: "texture(image, fract(repeat * materialInput.st)).channels",
    },
  },
  translucent: false,
});

/**
 * 获取凹凸贴图材质的名称。
 * @type {string}
 * @readonly
 */
Material.BumpMapType = "BumpMap";
Material._materialCache.addMaterial(Material.BumpMapType, {
  fabric: {
    type: Material.BumpMapType,
    uniforms: {
      image: Material.DefaultImageId,
      channel: "r",
      strength: 0.8,
      repeat: new Cartesian2(1.0, 1.0),
    },
    source: BumpMapMaterial,
  },
  translucent: false,
});

/**
 * 获取法线贴图材质的名称。
 * @type {string}
 * @readonly
 */
Material.NormalMapType = "NormalMap";
Material._materialCache.addMaterial(Material.NormalMapType, {
  fabric: {
    type: Material.NormalMapType,
    uniforms: {
      image: Material.DefaultImageId,
      channels: "rgb",
      strength: 0.8,
      repeat: new Cartesian2(1.0, 1.0),
    },
    source: NormalMapMaterial,
  },
  translucent: false,
});

/**
 * 获取栅格材质的名称。
 * @type {string}
 * @readonly
 */
Material.GridType = "Grid";
Material._materialCache.addMaterial(Material.GridType, {
  fabric: {
    type: Material.GridType,
    uniforms: {
      color: new Color(0.0, 1.0, 0.0, 1.0),
      cellAlpha: 0.1,
      lineCount: new Cartesian2(8.0, 8.0),
      lineThickness: new Cartesian2(1.0, 1.0),
      lineOffset: new Cartesian2(0.0, 0.0),
    },
    source: GridMaterial,
  },
  translucent: function (material) {
    const uniforms = material.uniforms;
    return uniforms.color.alpha < 1.0 || uniforms.cellAlpha < 1.0;
  },
});

/**
 * 获取条带材料的名称。
 * @type {string}
 * @readonly
 */
Material.StripeType = "Stripe";
Material._materialCache.addMaterial(Material.StripeType, {
  fabric: {
    type: Material.StripeType,
    uniforms: {
      horizontal: true,
      evenColor: new Color(1.0, 1.0, 1.0, 0.5),
      oddColor: new Color(0.0, 0.0, 1.0, 0.5),
      offset: 0.0,
      repeat: 5.0,
    },
    source: StripeMaterial,
  },
  translucent: function (material) {
    const uniforms = material.uniforms;
    return uniforms.evenColor.alpha < 1.0 || uniforms.oddColor.alpha < 1.0;
  },
});

/**
 * 获取棋盘材质的名称。
 * @type {string}
 * @readonly
 */
Material.CheckerboardType = "Checkerboard";
Material._materialCache.addMaterial(Material.CheckerboardType, {
  fabric: {
    type: Material.CheckerboardType,
    uniforms: {
      lightColor: new Color(1.0, 1.0, 1.0, 0.5),
      darkColor: new Color(0.0, 0.0, 0.0, 0.5),
      repeat: new Cartesian2(5.0, 5.0),
    },
    source: CheckerboardMaterial,
  },
  translucent: function (material) {
    const uniforms = material.uniforms;
    return uniforms.lightColor.alpha < 1.0 || uniforms.darkColor.alpha < 1.0;
  },
});

/**
 * 获取点材质的名称。
 * @type {string}
 * @readonly
 */
Material.DotType = "Dot";
Material._materialCache.addMaterial(Material.DotType, {
  fabric: {
    type: Material.DotType,
    uniforms: {
      lightColor: new Color(1.0, 1.0, 0.0, 0.75),
      darkColor: new Color(0.0, 1.0, 1.0, 0.75),
      repeat: new Cartesian2(5.0, 5.0),
    },
    source: DotMaterial,
  },
  translucent: function (material) {
    const uniforms = material.uniforms;
    return uniforms.lightColor.alpha < 1.0 || uniforms.darkColor.alpha < 1.0;
  },
});

/**
 * 获取水材质的名称。
 * @type {string}
 * @readonly
 */
Material.WaterType = "Water";
Material._materialCache.addMaterial(Material.WaterType, {
  fabric: {
    type: Material.WaterType,
    uniforms: {
      baseWaterColor: new Color(0.2, 0.3, 0.6, 1.0),
      blendColor: new Color(0.0, 1.0, 0.699, 1.0),
      specularMap: Material.DefaultImageId,
      normalMap: Material.DefaultImageId,
      frequency: 10.0,
      animationSpeed: 0.01,
      amplitude: 1.0,
      specularIntensity: 0.5,
      fadeFactor: 1.0,
    },
    source: WaterMaterial,
  },
  translucent: function (material) {
    const uniforms = material.uniforms;
    return (
      uniforms.baseWaterColor.alpha < 1.0 || uniforms.blendColor.alpha < 1.0
    );
  },
});

/**
 * 获取 rim lighting 材质的名称。
 * @type {string}
 * @readonly
 */
Material.RimLightingType = "RimLighting";
Material._materialCache.addMaterial(Material.RimLightingType, {
  fabric: {
    type: Material.RimLightingType,
    uniforms: {
      color: new Color(1.0, 0.0, 0.0, 0.7),
      rimColor: new Color(1.0, 1.0, 1.0, 0.4),
      width: 0.3,
    },
    source: RimLightingMaterial,
  },
  translucent: function (material) {
    const uniforms = material.uniforms;
    return uniforms.color.alpha < 1.0 || uniforms.rimColor.alpha < 1.0;
  },
});

/**
 * 获取淡化材质的名称。
 * @type {string}
 * @readonly
 */
Material.FadeType = "Fade";
Material._materialCache.addMaterial(Material.FadeType, {
  fabric: {
    type: Material.FadeType,
    uniforms: {
      fadeInColor: new Color(1.0, 0.0, 0.0, 1.0),
      fadeOutColor: new Color(0.0, 0.0, 0.0, 0.0),
      maximumDistance: 0.5,
      repeat: true,
      fadeDirection: {
        x: true,
        y: true,
      },
      time: new Cartesian2(0.5, 0.5),
    },
    source: FadeMaterial,
  },
  translucent: function (material) {
    const uniforms = material.uniforms;
    return (
      uniforms.fadeInColor.alpha < 1.0 || uniforms.fadeOutColor.alpha < 1.0
    );
  },
});

/**
 * 获取多段线箭头材质的名称。
 * @type {string}
 * @readonly
 */
Material.PolylineArrowType = "PolylineArrow";
Material._materialCache.addMaterial(Material.PolylineArrowType, {
  fabric: {
    type: Material.PolylineArrowType,
    uniforms: {
      color: new Color(1.0, 1.0, 1.0, 1.0),
    },
    source: PolylineArrowMaterial,
  },
  translucent: true,
});

/**
 * 获取多段线发光材质的名称。
 * @type {string}
 * @readonly
 */
Material.PolylineDashType = "PolylineDash";
Material._materialCache.addMaterial(Material.PolylineDashType, {
  fabric: {
    type: Material.PolylineDashType,
    uniforms: {
      color: new Color(1.0, 0.0, 1.0, 1.0),
      gapColor: new Color(0.0, 0.0, 0.0, 0.0),
      dashLength: 16.0,
      dashPattern: 255.0,
    },
    source: PolylineDashMaterial,
  },
  translucent: true,
});

/**
 * 获取多段线发光材质的名称。
 * @type {string}
 * @readonly
 */
Material.PolylineGlowType = "PolylineGlow";
Material._materialCache.addMaterial(Material.PolylineGlowType, {
  fabric: {
    type: Material.PolylineGlowType,
    uniforms: {
      color: new Color(0.0, 0.5, 1.0, 1.0),
      glowPower: 0.25,
      taperPower: 1.0,
    },
    source: PolylineGlowMaterial,
  },
  translucent: true,
});

/**
 * 获取多段线轮廓材质的名称。
 * @type {string}
 * @readonly
 */
Material.PolylineOutlineType = "PolylineOutline";
Material._materialCache.addMaterial(Material.PolylineOutlineType, {
  fabric: {
    type: Material.PolylineOutlineType,
    uniforms: {
      color: new Color(1.0, 1.0, 1.0, 1.0),
      outlineColor: new Color(1.0, 0.0, 0.0, 1.0),
      outlineWidth: 1.0,
    },
    source: PolylineOutlineMaterial,
  },
  translucent: function (material) {
    const uniforms = material.uniforms;
    return uniforms.color.alpha < 1.0 || uniforms.outlineColor.alpha < 1.0;
  },
});

/**
 * 获取高程等值线材质的名称。
 * @type {string}
 * @readonly
 */
Material.ElevationContourType = "ElevationContour";
Material._materialCache.addMaterial(Material.ElevationContourType, {
  fabric: {
    type: Material.ElevationContourType,
    uniforms: {
      spacing: 100.0,
      color: new Color(1.0, 0.0, 0.0, 1.0),
      width: 1.0,
    },
    source: ElevationContourMaterial,
  },
  translucent: false,
});

/**
 * 获取高程等值线材质的名称。
 * @type {string}
 * @readonly
 */
Material.ElevationRampType = "ElevationRamp";
Material._materialCache.addMaterial(Material.ElevationRampType, {
  fabric: {
    type: Material.ElevationRampType,
    uniforms: {
      image: Material.DefaultImageId,
      minimumHeight: 0.0,
      maximumHeight: 10000.0,
    },
    source: ElevationRampMaterial,
  },
  translucent: false,
});

/**
 * 获取坡度坡度材质的名称。
 * @type {string}
 * @readonly
 */
Material.SlopeRampMaterialType = "SlopeRamp";
Material._materialCache.addMaterial(Material.SlopeRampMaterialType, {
  fabric: {
    type: Material.SlopeRampMaterialType,
    uniforms: {
      image: Material.DefaultImageId,
    },
    source: SlopeRampMaterial,
  },
  translucent: false,
});

/**
 * 获取坡向渐变材质的名称。
 * @type {string}
 * @readonly
 */
Material.AspectRampMaterialType = "AspectRamp";
Material._materialCache.addMaterial(Material.AspectRampMaterialType, {
  fabric: {
    type: Material.AspectRampMaterialType,
    uniforms: {
      image: Material.DefaultImageId,
    },
    source: AspectRampMaterial,
  },
  translucent: false,
});

/**
 * 获取标高带材质的名称。
 * @type {string}
 * @readonly
 */
Material.ElevationBandType = "ElevationBand";
Material._materialCache.addMaterial(Material.ElevationBandType, {
  fabric: {
    type: Material.ElevationBandType,
    uniforms: {
      heights: Material.DefaultImageId,
      colors: Material.DefaultImageId,
    },
    source: ElevationBandMaterial,
  },
  translucent: true,
});

/**
 * 获取水遮罩材质的名称。
 * @type {string}
 * @readonly
 */
Material.WaterMaskType = "WaterMask";
Material._materialCache.addMaterial(Material.WaterMaskType, {
  fabric: {
    type: Material.WaterMaskType,
    source: WaterMaskMaterial,
    uniforms: {
      waterColor: new Color(1.0, 1.0, 1.0, 1.0),
      landColor: new Color(0.0, 0.0, 0.0, 0.0),
    },
  },
  translucent: false,
});

export default Material;
