import Check from "../../Core/Check.js";
import defined from "../../Core/defined.js";

/**
 * <div class="notice">
 * 使用 {@link Model#getNode} 从加载的模型中获取节点。 不要直接调用构造函数。
 * </div>
 *
 * 具有可修改变换的模型节点，允许用户定义其
 * 自己的动画。虽然模型的资产可以包含以
 * 节点的 Transform，此类允许用户更改节点的 Transform
 *外部。这样，动画可以由另一个源驱动，而不是
 * 仅按模型的资产。
 *
 * @alias ModelNode
 * @internalConstructor
 * @class
 *
 * @example
 * const node = model.getNode("Hand");
 * node.matrix = Cesium.Matrix4.fromScale(new Cesium.Cartesian3(5.0, 1.0, 1.0), node.matrix);
 *
 * @see Model#getNode
 */
function ModelNode(model, runtimeNode) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.object("model", model);
  Check.typeOf.object("runtimeNode", runtimeNode);
  //>>includeEnd('debug')

  this._model = model;
  this._runtimeNode = runtimeNode;
}

Object.defineProperties(ModelNode.prototype, {
  /**
   * 此节点的 <code>name</code> 属性的值。
   *
   * @memberof ModelNode.prototype
   *
   * @type {string}
   * @readonly
   */
  name: {
    get: function () {
      return this._runtimeNode._name;
    },
  },

  /**
   * glTF 中节点的索引.
   *
   * @memberof ModelNode.prototype
   *
   * @type {number}
   * @readonly
   */
  id: {
    get: function () {
      return this._runtimeNode._id;
    },
  },

  /**
   * 确定是否显示此节点及其子节点。
   *
   * @memberof ModelNode.prototype
   * @type {boolean}
   *
   * @default true
   */
  show: {
    get: function () {
      return this._runtimeNode.show;
    },
    set: function (value) {
      this._runtimeNode.show = value;
    },
  },

  /**
   * 节点的 4x4 矩阵从其本地坐标转换为
   * 其父级的。将矩阵设置为 undefined 将恢复
   * 节点的原始变换，并允许通过
   * 再次在模型中添加任何动画。
   * <p>
   * 要使更改生效，必须将此属性分配给;
   * 设置矩阵的单个元素将不起作用。
   * </p>
   *
   * @memberof ModelNode.prototype
   * @type {Matrix4}
   */
  matrix: {
    get: function () {
      return this._runtimeNode.transform;
    },
    set: function (value) {
      if (defined(value)) {
        this._runtimeNode.transform = value;
        this._runtimeNode.userAnimated = true;
        this._model._userAnimationDirty = true;
      } else {
        this._runtimeNode.transform = this.originalMatrix;
        this._runtimeNode.userAnimated = false;
      }
    },
  },

  /**
   * 从节点的局部
   * 坐标转换为其父级的，没有任何节点变换
   * 或应用的发音。
   *
   * @memberof ModelNode.prototype
   * @type {Matrix4}
   */
  originalMatrix: {
    get: function () {
      return this._runtimeNode.originalTransform;
    },
  },
});

export default ModelNode;
