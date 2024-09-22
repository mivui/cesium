import BoundingSphere from "../Core/BoundingSphere.js";
import Check from "../Core/Check.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import GroundPrimitive from "../Scene/GroundPrimitive.js";
import MaterialAppearance from "../Scene/MaterialAppearance.js";
import PerInstanceColorAppearance from "../Scene/PerInstanceColorAppearance.js";
import Primitive from "../Scene/Primitive.js";
import BoundingSphereState from "./BoundingSphereState.js";
import ColorMaterialProperty from "./ColorMaterialProperty.js";
import MaterialProperty from "./MaterialProperty.js";
import Property from "./Property.js";

/**
 * 定义动态几何图形更新程序的接口。 一个 DynamicGeometryUpdater
 * 负责处理特定类型几何体的可视化
 * 需要根据仿真时间重新计算。
 * 此对象从不由客户端代码直接使用，而是由
 * {@link GeometryUpdater} 实现。
 *
 * 此类型定义接口，不能直接实例化。
 *
 * @alias DynamicGeometryUpdater
 * @constructor
 * @private
 * @abstract
 */
function DynamicGeometryUpdater(
  geometryUpdater,
  primitives,
  orderedGroundPrimitives
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("geometryUpdater", geometryUpdater);
  Check.defined("primitives", primitives);
  Check.defined("orderedGroundPrimitives", orderedGroundPrimitives);
  //>>includeEnd('debug');

  this._primitives = primitives;
  this._orderedGroundPrimitives = orderedGroundPrimitives;
  this._primitive = undefined;
  this._outlinePrimitive = undefined;
  this._geometryUpdater = geometryUpdater;
  this._options = geometryUpdater._options;
  this._entity = geometryUpdater._entity;
  this._material = undefined;
}

DynamicGeometryUpdater.prototype._isHidden = function (entity, geometry, time) {
  return (
    !entity.isShowing ||
    !entity.isAvailable(time) ||
    !Property.getValueOrDefault(geometry.show, time, true)
  );
};

DynamicGeometryUpdater.prototype._setOptions =
  DeveloperError.throwInstantiationError;

/**
 * 将几何图形更新到指定时间。
 * @memberof DynamicGeometryUpdater
 * @function
 *
 * @param {JulianDate} time 当前时间。
 */
DynamicGeometryUpdater.prototype.update = function (time) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("time", time);
  //>>includeEnd('debug');

  const geometryUpdater = this._geometryUpdater;
  const onTerrain = geometryUpdater._onTerrain;

  const primitives = this._primitives;
  const orderedGroundPrimitives = this._orderedGroundPrimitives;
  if (onTerrain) {
    orderedGroundPrimitives.remove(this._primitive);
  } else {
    primitives.removeAndDestroy(this._primitive);
    primitives.removeAndDestroy(this._outlinePrimitive);
    this._outlinePrimitive = undefined;
  }
  this._primitive = undefined;

  const entity = this._entity;
  const geometry = entity[this._geometryUpdater._geometryPropertyName];
  this._setOptions(entity, geometry, time);
  if (this._isHidden(entity, geometry, time)) {
    return;
  }

  const shadows = this._geometryUpdater.shadowsProperty.getValue(time);
  const options = this._options;
  if (!defined(geometry.fill) || geometry.fill.getValue(time)) {
    const fillMaterialProperty = geometryUpdater.fillMaterialProperty;
    const isColorAppearance =
      fillMaterialProperty instanceof ColorMaterialProperty;
    let appearance;
    const closed = geometryUpdater._getIsClosed(options);
    if (isColorAppearance) {
      appearance = new PerInstanceColorAppearance({
        closed: closed,
        flat:
          onTerrain && !geometryUpdater._supportsMaterialsforEntitiesOnTerrain,
      });
    } else {
      const material = MaterialProperty.getValue(
        time,
        fillMaterialProperty,
        this._material
      );
      this._material = material;
      appearance = new MaterialAppearance({
        material: material,
        translucent: material.isTranslucent(),
        closed: closed,
      });
    }

    if (onTerrain) {
      options.vertexFormat = PerInstanceColorAppearance.VERTEX_FORMAT;
      this._primitive = orderedGroundPrimitives.add(
        new GroundPrimitive({
          geometryInstances: this._geometryUpdater.createFillGeometryInstance(
            time
          ),
          appearance: appearance,
          asynchronous: false,
          shadows: shadows,
          classificationType: this._geometryUpdater.classificationTypeProperty.getValue(
            time
          ),
        }),
        Property.getValueOrUndefined(this._geometryUpdater.zIndex, time)
      );
    } else {
      options.vertexFormat = appearance.vertexFormat;

      const fillInstance = this._geometryUpdater.createFillGeometryInstance(
        time
      );

      if (isColorAppearance) {
        appearance.translucent = fillInstance.attributes.color.value[3] !== 255;
      }

      this._primitive = primitives.add(
        new Primitive({
          geometryInstances: fillInstance,
          appearance: appearance,
          asynchronous: false,
          shadows: shadows,
        })
      );
    }
  }

  if (
    !onTerrain &&
    defined(geometry.outline) &&
    geometry.outline.getValue(time)
  ) {
    const outlineInstance = this._geometryUpdater.createOutlineGeometryInstance(
      time
    );
    const outlineWidth = Property.getValueOrDefault(
      geometry.outlineWidth,
      time,
      1.0
    );

    this._outlinePrimitive = primitives.add(
      new Primitive({
        geometryInstances: outlineInstance,
        appearance: new PerInstanceColorAppearance({
          flat: true,
          translucent: outlineInstance.attributes.color.value[3] !== 255,
          renderState: {
            lineWidth: geometryUpdater._scene.clampLineWidth(outlineWidth),
          },
        }),
        asynchronous: false,
        shadows: shadows,
      })
    );
  }
};

/**
 * 计算一个边界球体，该球体包含为指定实体生成的可视化效果。
 * 边界球体位于场景地球的固定帧中。
 * @function
 *
 * @param {BoundingSphere} result 要存储结果的边界球体。
 * @returns {BoundingSphereState} BoundingSphereState.DONE（如果结果包含边界球体），
 * BoundingSphereState.PENDING（如果结果仍在计算中），或者
 * BoundingSphereState.FAILED，如果实体在当前场景中没有可视化效果。
 * @private
 */
DynamicGeometryUpdater.prototype.getBoundingSphere = function (result) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(result)) {
    throw new DeveloperError("result is required.");
  }
  //>>includeEnd('debug');
  const entity = this._entity;
  const primitive = this._primitive;
  const outlinePrimitive = this._outlinePrimitive;

  let attributes;

  //Outline and Fill geometries have the same bounding sphere, so just use whichever one is defined and ready
  if (defined(primitive) && primitive.show && primitive.ready) {
    attributes = primitive.getGeometryInstanceAttributes(entity);
    if (defined(attributes) && defined(attributes.boundingSphere)) {
      BoundingSphere.clone(attributes.boundingSphere, result);
      return BoundingSphereState.DONE;
    }
  }

  if (
    defined(outlinePrimitive) &&
    outlinePrimitive.show &&
    outlinePrimitive.ready
  ) {
    attributes = outlinePrimitive.getGeometryInstanceAttributes(entity);
    if (defined(attributes) && defined(attributes.boundingSphere)) {
      BoundingSphere.clone(attributes.boundingSphere, result);
      return BoundingSphereState.DONE;
    }
  }

  if (
    (defined(primitive) && !primitive.ready) ||
    (defined(outlinePrimitive) && !outlinePrimitive.ready)
  ) {
    return BoundingSphereState.PENDING;
  }

  return BoundingSphereState.FAILED;
};

/**
 * 如果此对象已销毁，则返回 true;否则为 false。
 * @memberof DynamicGeometryUpdater
 * @function
 *
 * @returns {boolean} 如果此对象被销毁，则为 True;否则为 false。
 */
DynamicGeometryUpdater.prototype.isDestroyed = function () {
  return false;
};

/**
 * 销毁对象使用的资源。 一旦对象被销毁，就不应该使用它。
 * @memberof DynamicGeometryUpdater
 * @function
 *
 * @exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
 */
DynamicGeometryUpdater.prototype.destroy = function () {
  const primitives = this._primitives;
  const orderedGroundPrimitives = this._orderedGroundPrimitives;
  if (this._geometryUpdater._onTerrain) {
    orderedGroundPrimitives.remove(this._primitive);
  } else {
    primitives.removeAndDestroy(this._primitive);
  }
  primitives.removeAndDestroy(this._outlinePrimitive);
  destroyObject(this);
};
export default DynamicGeometryUpdater;
