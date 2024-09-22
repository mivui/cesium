import BoundingRectangle from "../Core/BoundingRectangle.js";
import Color from "../Core/Color.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Pass from "../Renderer/Pass.js";
import RenderState from "../Renderer/RenderState.js";
import ShaderSource from "../Renderer/ShaderSource.js";
import ViewportQuadFS from "../Shaders/ViewportQuadFS.js";
import BlendingState from "./BlendingState.js";
import Material from "./Material.js";

/**
 * 视口对齐的四边形。
 *
 * @alias ViewportQuad
 * @constructor
 *
 * @param {BoundingRectangle} [rectangle] 定义四边形在视区中位置的 {@link BoundingRectangle}。
 * @param {Material} [material] 定义四边形视口表面外观的 {@link Material}。
 *
 * @example
 * const viewportQuad = new Cesium.ViewportQuad(new Cesium.BoundingRectangle(0, 0, 80, 40));
 * viewportQuad.material.uniforms.color = new Cesium.Color(1.0, 0.0, 0.0, 1.0);
 */
function ViewportQuad(rectangle, material) {
  /**
   * 确定是否显示视口四边形基元。
   *
   * @type {boolean}
   * @default true
   */
  this.show = true;

  if (!defined(rectangle)) {
    rectangle = new BoundingRectangle();
  }

  /**
   * 定义四边形在视区中的位置的 BoundingRectangle。
   *
   * @type {BoundingRectangle}
   *
   * @example
   * viewportQuad.rectangle = new Cesium.BoundingRectangle(0, 0, 80, 40);
   */
  this.rectangle = BoundingRectangle.clone(rectangle);

  if (!defined(material)) {
    material = Material.fromType(Material.ColorType, {
      color: new Color(1.0, 1.0, 1.0, 1.0),
    });
  }

  /**
   * 四边形视区的曲面外观。 这可以是几个内置 {@link Material} 对象之一，也可以是自定义材质，脚本中使用
   * {@link https://github.com/CesiumGS/cesium/wiki/Fabric|Fabric} 的 Fabric。
   * <p>
   * 默认材质为 <code>Material.ColorType</code>。
   * </p>
   *
   * @type Material
   *
   * @example
   * // 1. Change the color of the default material to yellow
   * viewportQuad.material.uniforms.color = new Cesium.Color(1.0, 1.0, 0.0, 1.0);
   *
   * // 2. Change material to horizontal stripes
   * viewportQuad.material = Cesium.Material.fromType(Cesium.Material.StripeType);
   *
   * @see {@link https://github.com/CesiumGS/cesium/wiki/Fabric|Fabric}
   */
  this.material = material;
  this._material = undefined;

  this._overlayCommand = undefined;
  this._rs = undefined;
}

/**
 * 当 {@link Viewer} 或 {@link CesiumWidget} 将场景渲染到
 * 获取渲染此基元所需的绘制命令。
 * <p>
 * 请勿直接调用此函数。 这记录下来只是为了
 * 列出渲染场景时可能传播的异常：
 * </p>
 *
 * @exception {DeveloperError} this.material must be defined.
 * @exception {DeveloperError} this.rectangle must be defined.
 */
ViewportQuad.prototype.update = function (frameState) {
  if (!this.show) {
    return;
  }

  //>>includeStart('debug', pragmas.debug);
  if (!defined(this.material)) {
    throw new DeveloperError("this.material must be defined.");
  }
  if (!defined(this.rectangle)) {
    throw new DeveloperError("this.rectangle must be defined.");
  }
  //>>includeEnd('debug');

  const rs = this._rs;
  if (!defined(rs) || !BoundingRectangle.equals(rs.viewport, this.rectangle)) {
    this._rs = RenderState.fromCache({
      blending: BlendingState.ALPHA_BLEND,
      viewport: this.rectangle,
    });
  }

  const pass = frameState.passes;
  if (pass.render) {
    const context = frameState.context;

    if (this._material !== this.material || !defined(this._overlayCommand)) {
      // Recompile shader when material changes
      this._material = this.material;

      if (defined(this._overlayCommand)) {
        this._overlayCommand.shaderProgram.destroy();
      }

      const fs = new ShaderSource({
        sources: [this._material.shaderSource, ViewportQuadFS],
      });
      this._overlayCommand = context.createViewportQuadCommand(fs, {
        renderState: this._rs,
        uniformMap: this._material._uniforms,
        owner: this,
      });
      this._overlayCommand.pass = Pass.OVERLAY;
    }

    this._material.update(context);

    this._overlayCommand.renderState = this._rs;
    this._overlayCommand.uniformMap = this._material._uniforms;
    frameState.commandList.push(this._overlayCommand);
  }
};

/**
* 如果此对象已销毁，则返回 true;否则为 false。
 * <br /><br />
 * 如果此对象已销毁，则不应使用;调用
 <code>* isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果此对象被销毁，则为 True;否则为 false。
 *
 * @see ViewportQuad#destroy
 */
ViewportQuad.prototype.isDestroyed = function () {
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
 * quad = quad && quad.destroy();
 *
 * @see ViewportQuad#isDestroyed
 */
ViewportQuad.prototype.destroy = function () {
  if (defined(this._overlayCommand)) {
    this._overlayCommand.shaderProgram =
      this._overlayCommand.shaderProgram &&
      this._overlayCommand.shaderProgram.destroy();
  }
  return destroyObject(this);
};
export default ViewportQuad;
