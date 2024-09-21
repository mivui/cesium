import Cartesian3 from "./Cartesian3.js";
import Cartographic from "./Cartographic.js";
import Check from "./Check.js";
import defaultValue from "./defaultValue.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import Ellipsoid from "./Ellipsoid.js";
import CesiumMath from "./Math.js";

function calculateM(ellipticity, major, latitude) {
  if (ellipticity === 0.0) {
    // sphere
    return major * latitude;
  }

  const e2 = ellipticity * ellipticity;
  const e4 = e2 * e2;
  const e6 = e4 * e2;
  const e8 = e6 * e2;
  const e10 = e8 * e2;
  const e12 = e10 * e2;
  const phi = latitude;
  const sin2Phi = Math.sin(2 * phi);
  const sin4Phi = Math.sin(4 * phi);
  const sin6Phi = Math.sin(6 * phi);
  const sin8Phi = Math.sin(8 * phi);
  const sin10Phi = Math.sin(10 * phi);
  const sin12Phi = Math.sin(12 * phi);

  return (
    major *
    ((1 -
      e2 / 4 -
      (3 * e4) / 64 -
      (5 * e6) / 256 -
      (175 * e8) / 16384 -
      (441 * e10) / 65536 -
      (4851 * e12) / 1048576) *
      phi -
      ((3 * e2) / 8 +
        (3 * e4) / 32 +
        (45 * e6) / 1024 +
        (105 * e8) / 4096 +
        (2205 * e10) / 131072 +
        (6237 * e12) / 524288) *
        sin2Phi +
      ((15 * e4) / 256 +
        (45 * e6) / 1024 +
        (525 * e8) / 16384 +
        (1575 * e10) / 65536 +
        (155925 * e12) / 8388608) *
        sin4Phi -
      ((35 * e6) / 3072 +
        (175 * e8) / 12288 +
        (3675 * e10) / 262144 +
        (13475 * e12) / 1048576) *
        sin6Phi +
      ((315 * e8) / 131072 + (2205 * e10) / 524288 + (43659 * e12) / 8388608) *
        sin8Phi -
      ((693 * e10) / 1310720 + (6237 * e12) / 5242880) * sin10Phi +
      ((1001 * e12) / 8388608) * sin12Phi)
  );
}

function calculateInverseM(M, ellipticity, major) {
  const d = M / major;

  if (ellipticity === 0.0) {
    // sphere
    return d;
  }

  const d2 = d * d;
  const d3 = d2 * d;
  const d4 = d3 * d;
  const e = ellipticity;
  const e2 = e * e;
  const e4 = e2 * e2;
  const e6 = e4 * e2;
  const e8 = e6 * e2;
  const e10 = e8 * e2;
  const e12 = e10 * e2;
  const sin2D = Math.sin(2 * d);
  const cos2D = Math.cos(2 * d);
  const sin4D = Math.sin(4 * d);
  const cos4D = Math.cos(4 * d);
  const sin6D = Math.sin(6 * d);
  const cos6D = Math.cos(6 * d);
  const sin8D = Math.sin(8 * d);
  const cos8D = Math.cos(8 * d);
  const sin10D = Math.sin(10 * d);
  const cos10D = Math.cos(10 * d);
  const sin12D = Math.sin(12 * d);

  return (
    d +
    (d * e2) / 4 +
    (7 * d * e4) / 64 +
    (15 * d * e6) / 256 +
    (579 * d * e8) / 16384 +
    (1515 * d * e10) / 65536 +
    (16837 * d * e12) / 1048576 +
    ((3 * d * e4) / 16 +
      (45 * d * e6) / 256 -
      (d * (32 * d2 - 561) * e8) / 4096 -
      (d * (232 * d2 - 1677) * e10) / 16384 +
      (d * (399985 - 90560 * d2 + 512 * d4) * e12) / 5242880) *
      cos2D +
    ((21 * d * e6) / 256 +
      (483 * d * e8) / 4096 -
      (d * (224 * d2 - 1969) * e10) / 16384 -
      (d * (33152 * d2 - 112599) * e12) / 1048576) *
      cos4D +
    ((151 * d * e8) / 4096 +
      (4681 * d * e10) / 65536 +
      (1479 * d * e12) / 16384 -
      (453 * d3 * e12) / 32768) *
      cos6D +
    ((1097 * d * e10) / 65536 + (42783 * d * e12) / 1048576) * cos8D +
    ((8011 * d * e12) / 1048576) * cos10D +
    ((3 * e2) / 8 +
      (3 * e4) / 16 +
      (213 * e6) / 2048 -
      (3 * d2 * e6) / 64 +
      (255 * e8) / 4096 -
      (33 * d2 * e8) / 512 +
      (20861 * e10) / 524288 -
      (33 * d2 * e10) / 512 +
      (d4 * e10) / 1024 +
      (28273 * e12) / 1048576 -
      (471 * d2 * e12) / 8192 +
      (9 * d4 * e12) / 4096) *
      sin2D +
    ((21 * e4) / 256 +
      (21 * e6) / 256 +
      (533 * e8) / 8192 -
      (21 * d2 * e8) / 512 +
      (197 * e10) / 4096 -
      (315 * d2 * e10) / 4096 +
      (584039 * e12) / 16777216 -
      (12517 * d2 * e12) / 131072 +
      (7 * d4 * e12) / 2048) *
      sin4D +
    ((151 * e6) / 6144 +
      (151 * e8) / 4096 +
      (5019 * e10) / 131072 -
      (453 * d2 * e10) / 16384 +
      (26965 * e12) / 786432 -
      (8607 * d2 * e12) / 131072) *
      sin6D +
    ((1097 * e8) / 131072 +
      (1097 * e10) / 65536 +
      (225797 * e12) / 10485760 -
      (1097 * d2 * e12) / 65536) *
      sin8D +
    ((8011 * e10) / 2621440 + (8011 * e12) / 1048576) * sin10D +
    ((293393 * e12) / 251658240) * sin12D
  );
}

function calculateSigma(ellipticity, latitude) {
  if (ellipticity === 0.0) {
    // sphere
    return Math.log(Math.tan(0.5 * (CesiumMath.PI_OVER_TWO + latitude)));
  }

  const eSinL = ellipticity * Math.sin(latitude);
  return (
    Math.log(Math.tan(0.5 * (CesiumMath.PI_OVER_TWO + latitude))) -
    (ellipticity / 2.0) * Math.log((1 + eSinL) / (1 - eSinL))
  );
}

function calculateHeading(
  ellipsoidRhumbLine,
  firstLongitude,
  firstLatitude,
  secondLongitude,
  secondLatitude
) {
  const sigma1 = calculateSigma(ellipsoidRhumbLine._ellipticity, firstLatitude);
  const sigma2 = calculateSigma(
    ellipsoidRhumbLine._ellipticity,
    secondLatitude
  );
  return Math.atan2(
    CesiumMath.negativePiToPi(secondLongitude - firstLongitude),
    sigma2 - sigma1
  );
}

function calculateArcLength(
  ellipsoidRhumbLine,
  major,
  minor,
  firstLongitude,
  firstLatitude,
  secondLongitude,
  secondLatitude
) {
  const heading = ellipsoidRhumbLine._heading;
  const deltaLongitude = secondLongitude - firstLongitude;

  let distance = 0.0;

  //Check to see if the rhumb line has constant latitude
  //This equation will diverge if heading gets close to 90 degrees
  if (
    CesiumMath.equalsEpsilon(
      Math.abs(heading),
      CesiumMath.PI_OVER_TWO,
      CesiumMath.EPSILON8
    )
  ) {
    //If heading is close to 90 degrees
    if (major === minor) {
      distance =
        major *
        Math.cos(firstLatitude) *
        CesiumMath.negativePiToPi(deltaLongitude);
    } else {
      const sinPhi = Math.sin(firstLatitude);
      distance =
        (major *
          Math.cos(firstLatitude) *
          CesiumMath.negativePiToPi(deltaLongitude)) /
        Math.sqrt(1 - ellipsoidRhumbLine._ellipticitySquared * sinPhi * sinPhi);
    }
  } else {
    const M1 = calculateM(
      ellipsoidRhumbLine._ellipticity,
      major,
      firstLatitude
    );
    const M2 = calculateM(
      ellipsoidRhumbLine._ellipticity,
      major,
      secondLatitude
    );

    distance = (M2 - M1) / Math.cos(heading);
  }
  return Math.abs(distance);
}

const scratchCart1 = new Cartesian3();
const scratchCart2 = new Cartesian3();

function computeProperties(ellipsoidRhumbLine, start, end, ellipsoid) {
  const firstCartesian = Cartesian3.normalize(
    ellipsoid.cartographicToCartesian(start, scratchCart2),
    scratchCart1
  );
  const lastCartesian = Cartesian3.normalize(
    ellipsoid.cartographicToCartesian(end, scratchCart2),
    scratchCart2
  );

  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number.greaterThanOrEquals(
    "value",
    Math.abs(
      Math.abs(Cartesian3.angleBetween(firstCartesian, lastCartesian)) - Math.PI
    ),
    0.0125
  );
  //>>includeEnd('debug');

  const major = ellipsoid.maximumRadius;
  const minor = ellipsoid.minimumRadius;
  const majorSquared = major * major;
  const minorSquared = minor * minor;
  ellipsoidRhumbLine._ellipticitySquared =
    (majorSquared - minorSquared) / majorSquared;
  ellipsoidRhumbLine._ellipticity = Math.sqrt(
    ellipsoidRhumbLine._ellipticitySquared
  );

  ellipsoidRhumbLine._start = Cartographic.clone(
    start,
    ellipsoidRhumbLine._start
  );
  ellipsoidRhumbLine._start.height = 0;

  ellipsoidRhumbLine._end = Cartographic.clone(end, ellipsoidRhumbLine._end);
  ellipsoidRhumbLine._end.height = 0;

  ellipsoidRhumbLine._heading = calculateHeading(
    ellipsoidRhumbLine,
    start.longitude,
    start.latitude,
    end.longitude,
    end.latitude
  );
  ellipsoidRhumbLine._distance = calculateArcLength(
    ellipsoidRhumbLine,
    ellipsoid.maximumRadius,
    ellipsoid.minimumRadius,
    start.longitude,
    start.latitude,
    end.longitude,
    end.latitude
  );
}

function interpolateUsingSurfaceDistance(
  start,
  heading,
  distance,
  major,
  ellipticity,
  result
) {
  if (distance === 0.0) {
    return Cartographic.clone(start, result);
  }

  const ellipticitySquared = ellipticity * ellipticity;

  let longitude;
  let latitude;
  let deltaLongitude;

  //Check to see if the rhumb line has constant latitude
  //This won't converge if heading is close to 90 degrees
  if (
    Math.abs(CesiumMath.PI_OVER_TWO - Math.abs(heading)) > CesiumMath.EPSILON8
  ) {
    //Calculate latitude of the second point
    const M1 = calculateM(ellipticity, major, start.latitude);
    const deltaM = distance * Math.cos(heading);
    const M2 = M1 + deltaM;
    latitude = calculateInverseM(M2, ellipticity, major);

    //Now find the longitude of the second point

    // Check to see if the rhumb line has constant longitude
    if (Math.abs(heading) < CesiumMath.EPSILON10) {
      longitude = CesiumMath.negativePiToPi(start.longitude);
    } else {
      const sigma1 = calculateSigma(ellipticity, start.latitude);
      const sigma2 = calculateSigma(ellipticity, latitude);
      deltaLongitude = Math.tan(heading) * (sigma2 - sigma1);
      longitude = CesiumMath.negativePiToPi(start.longitude + deltaLongitude);
    }
  } else {
    //If heading is close to 90 degrees
    latitude = start.latitude;
    let localRad;

    if (ellipticity === 0.0) {
      // sphere
      localRad = major * Math.cos(start.latitude);
    } else {
      const sinPhi = Math.sin(start.latitude);
      localRad =
        (major * Math.cos(start.latitude)) /
        Math.sqrt(1 - ellipticitySquared * sinPhi * sinPhi);
    }

    deltaLongitude = distance / localRad;
    if (heading > 0.0) {
      longitude = CesiumMath.negativePiToPi(start.longitude + deltaLongitude);
    } else {
      longitude = CesiumMath.negativePiToPi(start.longitude - deltaLongitude);
    }
  }

  if (defined(result)) {
    result.longitude = longitude;
    result.latitude = latitude;
    result.height = 0;

    return result;
  }

  return new Cartographic(longitude, latitude, 0);
}

/**
 * 在连接两个提供的行星点的椭球体上初始化一条恒向线。
 *
 * @alias EllipsoidRhumbLine
 * @constructor
 *
 * @param {Cartographic} [start] 路径上的初始行星点。
 * @param {Cartographic} [end] 路径上的最后一个行星点。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 恒向线所在的椭球体。
 *
 * @exception {DeveloperError} angle between start and end must be at least 0.0125 radians.
 */
function EllipsoidRhumbLine(start, end, ellipsoid) {
  const e = defaultValue(ellipsoid, Ellipsoid.default);
  this._ellipsoid = e;
  this._start = new Cartographic();
  this._end = new Cartographic();

  this._heading = undefined;
  this._distance = undefined;
  this._ellipticity = undefined;
  this._ellipticitySquared = undefined;

  if (defined(start) && defined(end)) {
    computeProperties(this, start, end, e);
  }
}

Object.defineProperties(EllipsoidRhumbLine.prototype, {
  /**
   * 获取椭球体。
   * @memberof EllipsoidRhumbLine.prototype
   * @type {Ellipsoid}
   * @readonly
   */
  ellipsoid: {
    get: function () {
      return this._ellipsoid;
    },
  },

  /**
   * 获取起点和终点之间的曲面距离
   * @memberof EllipsoidRhumbLine.prototype
   * @type {number}
   * @readonly
   */
  surfaceDistance: {
    get: function () {
      //>>includeStart('debug', pragmas.debug);
      Check.defined("distance", this._distance);
      //>>includeEnd('debug');

      return this._distance;
    },
  },

  /**
   * 获取路径上的初始 planetodetic 点。
   * @memberof EllipsoidRhumbLine.prototype
   * @type {Cartographic}
   * @readonly
   */
  start: {
    get: function () {
      return this._start;
    },
  },

  /**
   * 获取路径上的最后一个 planetodetic 点。
   * @memberof EllipsoidRhumbLine.prototype
   * @type {Cartographic}
   * @readonly
   */
  end: {
    get: function () {
      return this._end;
    },
  },

  /**
   * 获取从起点到终点的航向。
   * @memberof EllipsoidRhumbLine.prototype
   * @type {number}
   * @readonly
   */
  heading: {
    get: function () {
      //>>includeStart('debug', pragmas.debug);
      Check.defined("distance", this._distance);
      //>>includeEnd('debug');

      return this._heading;
    },
  },
});

/**
 * 使用带有航向和距离的初始位置创建恒向线。
 *
 * @param {Cartographic} start 路径上的初始行星点。
 * @param {number} heading 以弧度为单位的标题。
 * @param {number} distance 起点和终点之间的恒向线距离。
 * @param {Ellipsoid} [ellipsoid=Ellipsoid.default] 恒向线所在的椭球体。
 * @param {EllipsoidRhumbLine} [result] 用于存储结果的对象。
 * @returns {EllipsoidRhumbLine} EllipsoidRhumbLine 对象。
 */
EllipsoidRhumbLine.fromStartHeadingDistance = function (
  start,
  heading,
  distance,
  ellipsoid,
  result
) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("start", start);
  Check.defined("heading", heading);
  Check.defined("distance", distance);
  Check.typeOf.number.greaterThan("distance", distance, 0.0);
  //>>includeEnd('debug');

  const e = defaultValue(ellipsoid, Ellipsoid.default);
  const major = e.maximumRadius;
  const minor = e.minimumRadius;
  const majorSquared = major * major;
  const minorSquared = minor * minor;
  const ellipticity = Math.sqrt((majorSquared - minorSquared) / majorSquared);

  heading = CesiumMath.negativePiToPi(heading);
  const end = interpolateUsingSurfaceDistance(
    start,
    heading,
    distance,
    e.maximumRadius,
    ellipticity
  );

  if (
    !defined(result) ||
    (defined(ellipsoid) && !ellipsoid.equals(result.ellipsoid))
  ) {
    return new EllipsoidRhumbLine(start, end, e);
  }

  result.setEndPoints(start, end);
  return result;
};

/**
 * 设置 rhumb 线的起点和终点。
 *
 * @param {Cartographic} start 路径上的初始行星点。
 * @param {Cartographic} end 路径上的最后一个行星点。
 */
EllipsoidRhumbLine.prototype.setEndPoints = function (start, end) {
  //>>includeStart('debug', pragmas.debug);
  Check.defined("start", start);
  Check.defined("end", end);
  //>>includeEnd('debug');

  computeProperties(this, start, end, this._ellipsoid);
};

/**
 * 提供沿恒向线指示部分的点的位置。
 *
 * @param {number} fraction 初始点和最终点之间的距离部分。
 * @param {Cartographic} [result] 存储结果的对象。
 * @returns {Cartographic} 点沿恒向线的位置。
 */
EllipsoidRhumbLine.prototype.interpolateUsingFraction = function (
  fraction,
  result
) {
  return this.interpolateUsingSurfaceDistance(
    fraction * this._distance,
    result
  );
};

/**
 * 提供沿恒向线的指示距离处的点的位置。
 *
 * @param {number} distance 沿 rhumbLine 从初始点到目标点的距离。
 * @param {Cartographic} [result] 存储结果的对象。
 * @returns {Cartographic} 点沿恒向线的位置。
 *
 * @exception {DeveloperError} start and end must be set before calling function interpolateUsingSurfaceDistance
 */
EllipsoidRhumbLine.prototype.interpolateUsingSurfaceDistance = function (
  distance,
  result
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("distance", distance);
  if (!defined(this._distance) || this._distance === 0.0) {
    throw new DeveloperError(
      "EllipsoidRhumbLine must have distinct start and end set."
    );
  }
  //>>includeEnd('debug');

  return interpolateUsingSurfaceDistance(
    this._start,
    this._heading,
    distance,
    this._ellipsoid.maximumRadius,
    this._ellipticity,
    result
  );
};

/**
 * 提供沿恒向线在指示经度处的点的位置。
 * 如果经度超出起点和终点的范围，则返回从起点到航向方向的经度的第一个交点。这遵循恒向线的螺旋属性。
 *
 * @param {number} intersectionLongitude 经度，以弧度为单位，在该位置使用标题从起点找到交点。
 * @param {Cartographic} [result] 存储结果的对象。
 * @returns {Cartographic} 沿恒向线的交点位置，如果没有交点或无限交点，则未定义。
 *
 * @exception {DeveloperError} start and end must be set before calling function findIntersectionWithLongitude.
 */
EllipsoidRhumbLine.prototype.findIntersectionWithLongitude = function (
  intersectionLongitude,
  result
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("intersectionLongitude", intersectionLongitude);
  if (!defined(this._distance) || this._distance === 0.0) {
    throw new DeveloperError(
      "EllipsoidRhumbLine must have distinct start and end set."
    );
  }
  //>>includeEnd('debug');

  const ellipticity = this._ellipticity;
  const heading = this._heading;
  const absHeading = Math.abs(heading);
  const start = this._start;

  intersectionLongitude = CesiumMath.negativePiToPi(intersectionLongitude);

  if (
    CesiumMath.equalsEpsilon(
      Math.abs(intersectionLongitude),
      Math.PI,
      CesiumMath.EPSILON14
    )
  ) {
    intersectionLongitude = CesiumMath.sign(start.longitude) * Math.PI;
  }

  if (!defined(result)) {
    result = new Cartographic();
  }

  // If heading is -PI/2 or PI/2, this is an E-W rhumb line
  // If heading is 0 or PI, this is an N-S rhumb line
  if (Math.abs(CesiumMath.PI_OVER_TWO - absHeading) <= CesiumMath.EPSILON8) {
    result.longitude = intersectionLongitude;
    result.latitude = start.latitude;
    result.height = 0;
    return result;
  } else if (
    CesiumMath.equalsEpsilon(
      Math.abs(CesiumMath.PI_OVER_TWO - absHeading),
      CesiumMath.PI_OVER_TWO,
      CesiumMath.EPSILON8
    )
  ) {
    if (
      CesiumMath.equalsEpsilon(
        intersectionLongitude,
        start.longitude,
        CesiumMath.EPSILON12
      )
    ) {
      return undefined;
    }

    result.longitude = intersectionLongitude;
    result.latitude =
      CesiumMath.PI_OVER_TWO *
      CesiumMath.sign(CesiumMath.PI_OVER_TWO - heading);
    result.height = 0;
    return result;
  }

  // Use iterative solver from Equation 9 from http://edwilliams.org/ellipsoid/ellipsoid.pdf
  const phi1 = start.latitude;
  const eSinPhi1 = ellipticity * Math.sin(phi1);
  const leftComponent =
    Math.tan(0.5 * (CesiumMath.PI_OVER_TWO + phi1)) *
    Math.exp((intersectionLongitude - start.longitude) / Math.tan(heading));
  const denominator = (1 + eSinPhi1) / (1 - eSinPhi1);

  let newPhi = start.latitude;
  let phi;
  do {
    phi = newPhi;
    const eSinPhi = ellipticity * Math.sin(phi);
    const numerator = (1 + eSinPhi) / (1 - eSinPhi);
    newPhi =
      2 *
        Math.atan(
          leftComponent * Math.pow(numerator / denominator, ellipticity / 2)
        ) -
      CesiumMath.PI_OVER_TWO;
  } while (!CesiumMath.equalsEpsilon(newPhi, phi, CesiumMath.EPSILON12));

  result.longitude = intersectionLongitude;
  result.latitude = newPhi;
  result.height = 0;
  return result;
};

/**
 * 提供沿恒向线在指示纬度处的点的位置。
 * 如果纬度超出起点和终点的范围，则返回从该起点到航向方向的纬度的第一个交点。这遵循恒向线的螺旋属性。
 *
 * @param {number} intersectionLatitude 纬度，以弧度为单位，在该位置使用标题从起点找到交点。
 * @param {Cartographic} [result] 存储结果的对象。
 * @returns {Cartographic} 沿恒向线的交点位置，如果没有交点或无限交点，则未定义。
 *
 * @exception {DeveloperError} start and end must be set before calling function findIntersectionWithLongitude.
 */
EllipsoidRhumbLine.prototype.findIntersectionWithLatitude = function (
  intersectionLatitude,
  result
) {
  //>>includeStart('debug', pragmas.debug);
  Check.typeOf.number("intersectionLatitude", intersectionLatitude);
  if (!defined(this._distance) || this._distance === 0.0) {
    throw new DeveloperError(
      "EllipsoidRhumbLine must have distinct start and end set."
    );
  }
  //>>includeEnd('debug');

  const ellipticity = this._ellipticity;
  const heading = this._heading;
  const start = this._start;

  // If start and end have same latitude, return undefined since it's either no intersection or infinite intersections
  if (
    CesiumMath.equalsEpsilon(
      Math.abs(heading),
      CesiumMath.PI_OVER_TWO,
      CesiumMath.EPSILON8
    )
  ) {
    return;
  }

  // Can be solved using the same equations from interpolateUsingSurfaceDistance
  const sigma1 = calculateSigma(ellipticity, start.latitude);
  const sigma2 = calculateSigma(ellipticity, intersectionLatitude);
  const deltaLongitude = Math.tan(heading) * (sigma2 - sigma1);
  const longitude = CesiumMath.negativePiToPi(start.longitude + deltaLongitude);

  if (defined(result)) {
    result.longitude = longitude;
    result.latitude = intersectionLatitude;
    result.height = 0;

    return result;
  }

  return new Cartographic(longitude, intersectionLatitude, 0);
};
export default EllipsoidRhumbLine;
