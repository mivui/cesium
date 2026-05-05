import buildModuleUrl from "../Core/buildModuleUrl.js";
import CubeMapPanorama from "./CubeMapPanorama.js";
import SceneMode from "./SceneMode.js";
import destroyObject from "../Core/destroyObject.js";

/**
 * 围绕场景的用于绘制星星的天空盒。天空盒使用真赤道平均春分点（TEME）轴定义。
 * <p>
 * 仅支持 3D。当过渡到 2D 或 Columbus 视图时，天空盒会逐渐消失。
 * 天空盒的大小不能超过 {@link Scene#maximumCubeMapSize}。
 * </p>
 *
 * @alias SkyBox
 * @constructor
 *
 * @param {object} options 包含以下属性的对象:
 * @param {object} [options.sources] 六个立方体贴图面的源 URL 或 <code>Image</code> 对象。请参阅下面的示例。
 * @param {boolean} [options.show=true] 确定是否显示此图元。
 *
 *
 * @example
 * scene.skyBox = new Cesium.SkyBox({
 *   sources : {
 *     positiveX : 'skybox_px.png',
 *     negativeX : 'skybox_nx.png',
 *     positiveY : 'skybox_py.png',
 *     negativeY : 'skybox_ny.png',
 *     positiveZ : 'skybox_pz.png',
 *     negativeZ : 'skybox_nz.png'
 *   }
 * });
 *
 * @see Scene#skyBox
 * @see Transforms.computeTemeToPseudoFixedMatrix
 */
function SkyBox(options) {
  this._sources = options.sources;
  this._show = options.show ?? true;
  this._panorama = new CubeMapPanorama({
    sources: this._sources,
    show: this._show,
    returnCommand: true,
  });
}

Object.defineProperties(SkyBox.prototype, {
  /**
   * 获取或设置图元对象。
   * @memberof SkyBox.prototype
   * @type {object}
   */
  sources: {
    get: function () {
      return this._panorama.sources;
    },
    set: function (value) {
      this._panorama.sources = value;
    },
  },

  /**
   * 确定是否显示天空盒。
   * @memberof SkyBox.prototype
   * @type {boolean}
   * @default true
   */

  show: {
    get: function () {
      return this._panorama.show;
    },
    set: function (value) {
      this._panorama.show = value;
    },
  },
});

/**
 * 当 {@link Viewer} 或 {@link CesiumWidget} 渲染场景时调用，
 * 以获取渲染此图元所需的绘制命令。
 * <p>
 * 不要直接调用此函数。此处记录只是为了列出场景渲染时可能传播的异常：
 * </p>
 *
 * @exception {DeveloperError} 需要 this.sources，并且必须具有 positiveX、negativeX、positiveY、negativeY、positiveZ 和 negativeZ 属性。
 * @exception {DeveloperError} this.sources 属性必须都是相同类型。
 */
SkyBox.prototype.update = function (frameState, useHdr) {
  const { mode, passes } = frameState;

  if (mode !== SceneMode.SCENE3D && mode !== SceneMode.MORPHING) {
    return;
  }

  if (!passes.render) {
    return;
  }

  // 完全委托
  return this._panorama.update(frameState, useHdr);
};

/**
 * 如果此对象已被销毁则返回 true；否则返回 false。
 * <br /><br />
 * 如果此对象已被销毁，则不应使用它；调用除
 * <code>isDestroyed</code> 之外的任何函数都将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果此对象已被销毁则为 <code>true</code>；否则为 <code>false</code>。
 *
 * @see SkyBox#destroy
 */
SkyBox.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁此对象持有的 WebGL 资源。销毁对象允许确定性释放 WebGL 资源，
 * 而不是依赖垃圾回收器来销毁此对象。
 * <br /><br />
 * 一旦对象被销毁，就不应使用它；调用除
 * <code>isDestroyed</code> 之外的任何函数都将导致 {@link DeveloperError} 异常。因此，
 * 如示例中所示，将返回值（<code>undefined</code>）赋给该对象。
 *
 * @exception {DeveloperError} 此对象已被销毁，即已调用 destroy()。
 *
 *
 * @example
 * skyBox = skyBox && skyBox.destroy();
 *
 * @see SkyBox#isDestroyed
 */
SkyBox.prototype.destroy = function () {
  this._panorama = this._panorama && this._panorama.destroy();
  return destroyObject(this);
};

function getDefaultSkyBoxUrl(suffix) {
  return buildModuleUrl(`Assets/Textures/SkyBox/tycho2t3_80_${suffix}.jpg`);
}

/**
 * 使用地球的默认星图创建天空盒实例。
 * @return {SkyBox} 地球的默认天空盒
 *
 * @example
 * viewer.scene.skyBox = Cesium.SkyBox.createEarthSkyBox();
 */
SkyBox.createEarthSkyBox = function () {
  return new SkyBox({
    sources: {
      positiveX: getDefaultSkyBoxUrl("px"),
      negativeX: getDefaultSkyBoxUrl("mx"),
      positiveY: getDefaultSkyBoxUrl("py"),
      negativeY: getDefaultSkyBoxUrl("my"),
      positiveZ: getDefaultSkyBoxUrl("pz"),
      negativeZ: getDefaultSkyBoxUrl("mz"),
    },
  });
};

export default SkyBox;
