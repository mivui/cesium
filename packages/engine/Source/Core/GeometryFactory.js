import DeveloperError from "../Core/DeveloperError.js";

/**
 * 所有可传递给 {@link GeometryInstance} 的几何图形创建实用程序类的基类
 * 用于异步几何体创建。
 *
 * @constructor
 * @class
 * @abstract
 */
function GeometryFactory() {
  DeveloperError.throwInstantiationError();
}

/**
 * 返回几何图形。
 *
 * @param {GeometryFactory} geometryFactory 圆的描述。
 * @returns {Geometry|undefined} 计算的顶点和索引。
 */
GeometryFactory.createGeometry = function (geometryFactory) {
  DeveloperError.throwInstantiationError();
};

export default GeometryFactory;
