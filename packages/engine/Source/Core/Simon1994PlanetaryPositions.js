import Cartesian3 from "./Cartesian3.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";
import JulianDate from "./JulianDate.js";
import CesiumMath from "./Math.js";
import Matrix3 from "./Matrix3.js";
import TimeConstants from "./TimeConstants.js";
import TimeStandard from "./TimeStandard.js";

/**
 * 包含用于查找地心惯性系中太阳和月球笛卡尔坐标的函数。
 *
 * @namespace Simon1994PlanetaryPositions
 */
const Simon1994PlanetaryPositions = {};

function computeTdbMinusTtSpice(daysSinceJ2000InTerrestrialTime) {
  /* STK 注释 ------------------------------------------------------
   * 此函数使用的常量旨在与
   * JPL 的 SPICE 工具包 N0051 版本（unitim.c）保持一致
   * M0 = 6.239996
   * M0Dot = 1.99096871e-7 rad/s = 0.01720197 rad/d
   * EARTH_ECC = 1.671e-2
   * TDB_AMPL = 1.657e-3 secs
   *--------------------------------------------------------------------*/

  //* 使用 STK 注释中指定的值，除了：0.01720197 rad/day = 1.99096871e-7 rad/sec
  //* 这里我们使用从 SPICE 值 1.99096871e-7 rad/sec 转换为 rad/day 的更精确值
  //* 所有其他常量与 SPICE 的 TDB 转换实现一致
  //* 除了我们这里将独立时间参数视为 TT 而不是 TDB。
  //* 这是一种近似，为了性能而做，因为 TT2TDB 的转换比 TDB2TT 更普遍，
  //* 以避免在转换为 TDB 以用于 JPL 星历表时必须迭代。
  //* 使用天而不是秒来提供数值精度的小幅改进。

  //* 更多信息参见：
  //* http://www.cv.nrao.edu/~rfisher/Ephemerides/times.html#TDB
  //* ftp://ssd.jpl.nasa.gov/pub/eph/planets/ioms/ExplSupplChap8.pdf

  const g = 6.239996 + 0.0172019696544 * daysSinceJ2000InTerrestrialTime;
  return 1.657e-3 * Math.sin(g + 1.671e-2 * Math.sin(g));
}

const TdtMinusTai = 32.184;
const J2000d = 2451545;
function taiToTdb(date, result) {
  //将 TAI 转换为 TT
  result = JulianDate.addSeconds(date, TdtMinusTai, result);

  //将 TT 转换为 TDB
  const days = JulianDate.totalDays(result) - J2000d;
  result = JulianDate.addSeconds(result, computeTdbMinusTtSpice(days), result);

  return result;
}

const epoch = new JulianDate(2451545, 0, TimeStandard.TAI); //实际上是 TDB（不是 TAI）
const MetersPerKilometer = 1000.0;
const RadiansPerDegree = CesiumMath.RADIANS_PER_DEGREE;
const RadiansPerArcSecond = CesiumMath.RADIANS_PER_ARCSECOND;
const MetersPerAstronomicalUnit = 1.4959787e11; // IAU 1976 值

const perifocalToEquatorial = new Matrix3();
function elementsToCartesian(
  semimajorAxis,
  eccentricity,
  inclination,
  longitudeOfPerigee,
  longitudeOfNode,
  meanLongitude,
  result,
) {
  if (inclination < 0.0) {
    inclination = -inclination;
    longitudeOfNode += CesiumMath.PI;
  }

  //>>includeStart('debug', pragmas.debug);
  if (inclination < 0 || inclination > CesiumMath.PI) {
    throw new DeveloperError(
      "倾角超出范围。倾角必须大于或等于零且小于或等于 Pi 弧度。",
    );
  }
  //>>includeEnd('debug');

  const radiusOfPeriapsis = semimajorAxis * (1.0 - eccentricity);
  const argumentOfPeriapsis = longitudeOfPerigee - longitudeOfNode;
  const rightAscensionOfAscendingNode = longitudeOfNode;
  const trueAnomaly = meanAnomalyToTrueAnomaly(
    meanLongitude - longitudeOfPerigee,
    eccentricity,
  );
  const type = chooseOrbit(eccentricity, 0.0);

  //>>includeStart('debug', pragmas.debug);
  if (
    type === "Hyperbolic" &&
    Math.abs(CesiumMath.negativePiToPi(trueAnomaly)) >=
      Math.acos(-1.0 / eccentricity)
  ) {
    throw new DeveloperError(
      "双曲线轨道的真近点角超出双曲线范围。",
    );
  }
  //>>includeEnd('debug');

  perifocalToCartesianMatrix(
    argumentOfPeriapsis,
    inclination,
    rightAscensionOfAscendingNode,
    perifocalToEquatorial,
  );
  const semilatus = radiusOfPeriapsis * (1.0 + eccentricity);
  const costheta = Math.cos(trueAnomaly);
  const sintheta = Math.sin(trueAnomaly);

  const denom = 1.0 + eccentricity * costheta;

  //>>includeStart('debug', pragmas.debug);
  if (denom <= CesiumMath.Epsilon10) {
    throw new DeveloperError("无法将要素转换为笛卡尔坐标");
  }
  //>>includeEnd('debug');

  const radius = semilatus / denom;
  if (!defined(result)) {
    result = new Cartesian3(radius * costheta, radius * sintheta, 0.0);
  } else {
    result.x = radius * costheta;
    result.y = radius * sintheta;
    result.z = 0.0;
  }

  return Matrix3.multiplyByVector(perifocalToEquatorial, result, result);
}

function chooseOrbit(eccentricity, tolerance) {
  //>>includeStart('debug', pragmas.debug);
  if (eccentricity < 0) {
    throw new DeveloperError("偏心率不能为负。");
  }
  //>>includeEnd('debug');

  if (eccentricity <= tolerance) {
    return "Circular";
  } else if (eccentricity < 1.0 - tolerance) {
    return "Elliptical";
  } else if (eccentricity <= 1.0 + tolerance) {
    return "Parabolic";
  }
  return "Hyperbolic";
}

// 根据平均近点角和偏心率计算真近点角。
function meanAnomalyToTrueAnomaly(meanAnomaly, eccentricity) {
  //>>includeStart('debug', pragmas.debug);
  if (eccentricity < 0.0 || eccentricity >= 1.0) {
    throw new DeveloperError("偏心率超出范围。");
  }
  //>>includeEnd('debug');

  const eccentricAnomaly = meanAnomalyToEccentricAnomaly(
    meanAnomaly,
    eccentricity,
  );
  return eccentricAnomalyToTrueAnomaly(eccentricAnomaly, eccentricity);
}

const maxIterationCount = 50;
const keplerEqConvergence = CesiumMath.EPSILON8;
// 根据平均近点角和偏心率计算偏近点角。
function meanAnomalyToEccentricAnomaly(meanAnomaly, eccentricity) {
  //>>includeStart('debug', pragmas.debug);
  if (eccentricity < 0.0 || eccentricity >= 1.0) {
    throw new DeveloperError("偏心率超出范围。");
  }
  //>>includeEnd('debug');

  const revs = Math.floor(meanAnomaly / CesiumMath.TWO_PI);

  // 计算迭代序列的起始值
  let iterationValue =
    meanAnomaly +
    (eccentricity * Math.sin(meanAnomaly)) /
      (1.0 - Math.sin(meanAnomaly + eccentricity) + Math.sin(meanAnomaly));

  // 对开普勒方程执行牛顿-拉夫逊迭代
  let eccentricAnomaly = Number.MAX_VALUE;

  let count;
  for (
    count = 0;
    count < maxIterationCount &&
    Math.abs(eccentricAnomaly - iterationValue) > keplerEqConvergence;
    ++count
  ) {
    eccentricAnomaly = iterationValue;
    const NRfunction =
      eccentricAnomaly -
      eccentricity * Math.sin(eccentricAnomaly) -
      meanAnomaly;
    const dNRfunction = 1 - eccentricity * Math.cos(eccentricAnomaly);
    iterationValue = eccentricAnomaly - NRfunction / dNRfunction;
  }

  //>>includeStart('debug', pragmas.debug);
  if (count >= maxIterationCount) {
    throw new DeveloperError("开普勒方程未收敛");
    // STK Components 在开普勒方程未收敛时使用数值方法来查找偏近点角。
    // 我们预计这里不需要，因为使用的轨道都是合理的。
  }
  //>>includeEnd('debug');

  eccentricAnomaly = iterationValue + revs * CesiumMath.TWO_PI;
  return eccentricAnomaly;
}

// 根据偏近点角和偏心率计算真近点角。
function eccentricAnomalyToTrueAnomaly(eccentricAnomaly, eccentricity) {
  //>>includeStart('debug', pragmas.debug);
  if (eccentricity < 0.0 || eccentricity >= 1.0) {
    throw new DeveloperError("偏心率超出范围。");
  }
  //>>includeEnd('debug');

  // 计算前一个旋转的圈数
  const revs = Math.floor(eccentricAnomaly / CesiumMath.TWO_PI);

  // 查找当前旋转中的角度
  eccentricAnomaly -= revs * CesiumMath.TWO_PI;

  // 根据偏近点角计算真近点角
  const trueAnomalyX = Math.cos(eccentricAnomaly) - eccentricity;
  const trueAnomalyY =
    Math.sin(eccentricAnomaly) * Math.sqrt(1 - eccentricity * eccentricity);

  let trueAnomaly = Math.atan2(trueAnomalyY, trueAnomalyX);

  // 确保正确的象限
  trueAnomaly = CesiumMath.zeroToTwoPi(trueAnomaly);
  if (eccentricAnomaly < 0) {
    trueAnomaly -= CesiumMath.TWO_PI;
  }

  // 添加前一个旋转
  trueAnomaly += revs * CesiumMath.TWO_PI;

  return trueAnomaly;
}

// 计算从地心惯性系到固定参考系的变换矩阵。
function perifocalToCartesianMatrix(
  argumentOfPeriapsis,
  inclination,
  rightAscension,
  result,
) {
  //>>includeStart('debug', pragmas.debug);
  if (inclination < 0 || inclination > CesiumMath.PI) {
    throw new DeveloperError("倾角超出范围");
  }
  //>>includeEnd('debug');

  const cosap = Math.cos(argumentOfPeriapsis);
  const sinap = Math.sin(argumentOfPeriapsis);

  const cosi = Math.cos(inclination);
  const sini = Math.sin(inclination);

  const cosraan = Math.cos(rightAscension);
  const sinraan = Math.sin(rightAscension);
  if (!defined(result)) {
    result = new Matrix3(
      cosraan * cosap - sinraan * sinap * cosi,
      -cosraan * sinap - sinraan * cosap * cosi,
      sinraan * sini,

      sinraan * cosap + cosraan * sinap * cosi,
      -sinraan * sinap + cosraan * cosap * cosi,
      -cosraan * sini,

      sinap * sini,
      cosap * sini,
      cosi,
    );
  } else {
    result[0] = cosraan * cosap - sinraan * sinap * cosi;
    result[1] = sinraan * cosap + cosraan * sinap * cosi;
    result[2] = sinap * sini;
    result[3] = -cosraan * sinap - sinraan * cosap * cosi;
    result[4] = -sinraan * sinap + cosraan * cosap * cosi;
    result[5] = cosap * sini;
    result[6] = sinraan * sini;
    result[7] = -cosraan * sini;
    result[8] = cosi;
  }
  return result;
}

// 来自第 5.8 节
const semiMajorAxis0 = 1.0000010178 * MetersPerAstronomicalUnit;
const meanLongitude0 = 100.46645683 * RadiansPerDegree;
const meanLongitude1 = 1295977422.83429 * RadiansPerArcSecond;

// 来自表 6
const p1u = 16002;
const p2u = 21863;
const p3u = 32004;
const p4u = 10931;
const p5u = 14529;
const p6u = 16368;
const p7u = 15318;
const p8u = 32794;

const Ca1 = 64 * 1e-7 * MetersPerAstronomicalUnit;
const Ca2 = -152 * 1e-7 * MetersPerAstronomicalUnit;
const Ca3 = 62 * 1e-7 * MetersPerAstronomicalUnit;
const Ca4 = -8 * 1e-7 * MetersPerAstronomicalUnit;
const Ca5 = 32 * 1e-7 * MetersPerAstronomicalUnit;
const Ca6 = -41 * 1e-7 * MetersPerAstronomicalUnit;
const Ca7 = 19 * 1e-7 * MetersPerAstronomicalUnit;
const Ca8 = -11 * 1e-7 * MetersPerAstronomicalUnit;

const Sa1 = -150 * 1e-7 * MetersPerAstronomicalUnit;
const Sa2 = -46 * 1e-7 * MetersPerAstronomicalUnit;
const Sa3 = 68 * 1e-7 * MetersPerAstronomicalUnit;
const Sa4 = 54 * 1e-7 * MetersPerAstronomicalUnit;
const Sa5 = 14 * 1e-7 * MetersPerAstronomicalUnit;
const Sa6 = 24 * 1e-7 * MetersPerAstronomicalUnit;
const Sa7 = -28 * 1e-7 * MetersPerAstronomicalUnit;
const Sa8 = 22 * 1e-7 * MetersPerAstronomicalUnit;

const q1u = 10;
const q2u = 16002;
const q3u = 21863;
const q4u = 10931;
const q5u = 1473;
const q6u = 32004;
const q7u = 4387;
const q8u = 73;

const Cl1 = -325 * 1e-7;
const Cl2 = -322 * 1e-7;
const Cl3 = -79 * 1e-7;
const Cl4 = 232 * 1e-7;
const Cl5 = -52 * 1e-7;
const Cl6 = 97 * 1e-7;
const Cl7 = 55 * 1e-7;
const Cl8 = -41 * 1e-7;

const Sl1 = -105 * 1e-7;
const Sl2 = -137 * 1e-7;
const Sl3 = 258 * 1e-7;
const Sl4 = 35 * 1e-7;
const Sl5 = -116 * 1e-7;
const Sl6 = -88 * 1e-7;
const Sl7 = -112 * 1e-7;
const Sl8 = -80 * 1e-7;

const scratchDate = new JulianDate(0, 0.0, TimeStandard.TAI);
// 获取根据第 6 节所述方程描述的地月系统质心的点。
function computeSimonEarthMoonBarycenter(date, result) {
  // t 是从 J2000 TDB 开始的千年数
  taiToTdb(date, scratchDate);
  const x =
    scratchDate.dayNumber -
    epoch.dayNumber +
    (scratchDate.secondsOfDay - epoch.secondsOfDay) /
      TimeConstants.SECONDS_PER_DAY;
  const t = x / (TimeConstants.DAYS_PER_JULIAN_CENTURY * 10.0);

  const u = 0.3595362 * t;
  const semimajorAxis =
    semiMajorAxis0 +
    Ca1 * Math.cos(p1u * u) +
    Sa1 * Math.sin(p1u * u) +
    Ca2 * Math.cos(p2u * u) +
    Sa2 * Math.sin(p2u * u) +
    Ca3 * Math.cos(p3u * u) +
    Sa3 * Math.sin(p3u * u) +
    Ca4 * Math.cos(p4u * u) +
    Sa4 * Math.sin(p4u * u) +
    Ca5 * Math.cos(p5u * u) +
    Sa5 * Math.sin(p5u * u) +
    Ca6 * Math.cos(p6u * u) +
    Sa6 * Math.sin(p6u * u) +
    Ca7 * Math.cos(p7u * u) +
    Sa7 * Math.sin(p7u * u) +
    Ca8 * Math.cos(p8u * u) +
    Sa8 * Math.sin(p8u * u);
  const meanLongitude =
    meanLongitude0 +
    meanLongitude1 * t +
    Cl1 * Math.cos(q1u * u) +
    Sl1 * Math.sin(q1u * u) +
    Cl2 * Math.cos(q2u * u) +
    Sl2 * Math.sin(q2u * u) +
    Cl3 * Math.cos(q3u * u) +
    Sl3 * Math.sin(q3u * u) +
    Cl4 * Math.cos(q4u * u) +
    Sl4 * Math.sin(q4u * u) +
    Cl5 * Math.cos(q5u * u) +
    Sl5 * Math.sin(q5u * u) +
    Cl6 * Math.cos(q6u * u) +
    Sl6 * Math.sin(q6u * u) +
    Cl7 * Math.cos(q7u * u) +
    Sl7 * Math.sin(q7u * u) +
    Cl8 * Math.cos(q8u * u) +
    Sl8 * Math.sin(q8u * u);

  // 本节的所有常量来自第 5.8 节
  const eccentricity = 0.0167086342 - 0.0004203654 * t;
  const longitudeOfPerigee =
    102.93734808 * RadiansPerDegree + 11612.3529 * RadiansPerArcSecond * t;
  const inclination = 469.97289 * RadiansPerArcSecond * t;
  const longitudeOfNode =
    174.87317577 * RadiansPerDegree - 8679.27034 * RadiansPerArcSecond * t;

  return elementsToCartesian(
    semimajorAxis,
    eccentricity,
    inclination,
    longitudeOfPerigee,
    longitudeOfNode,
    meanLongitude,
    result,
  );
}

// 获取根据第 4 节所述方程描述的月球位置。
function computeSimonMoon(date, result) {
  taiToTdb(date, scratchDate);
  const x =
    scratchDate.dayNumber -
    epoch.dayNumber +
    (scratchDate.secondsOfDay - epoch.secondsOfDay) /
      TimeConstants.SECONDS_PER_DAY;
  const t = x / TimeConstants.DAYS_PER_JULIAN_CENTURY;
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;

  // 第 3.4 节 (b.1) 中的项
  let semimajorAxis = 383397.7725 + 0.004 * t;
  let eccentricity = 0.055545526 - 0.000000016 * t;
  const inclinationConstant = 5.15668983 * RadiansPerDegree;
  let inclinationSecPart =
    -0.00008 * t + 0.02966 * t2 - 0.000042 * t3 - 0.00000013 * t4;
  const longitudeOfPerigeeConstant = 83.35324312 * RadiansPerDegree;
  let longitudeOfPerigeeSecPart =
    14643420.2669 * t - 38.2702 * t2 - 0.045047 * t3 + 0.00021301 * t4;
  const longitudeOfNodeConstant = 125.04455501 * RadiansPerDegree;
  let longitudeOfNodeSecPart =
    -6967919.3631 * t + 6.3602 * t2 + 0.007625 * t3 - 0.00003586 * t4;
  const meanLongitudeConstant = 218.31664563 * RadiansPerDegree;
  let meanLongitudeSecPart =
    1732559343.4847 * t - 6.391 * t2 + 0.006588 * t3 - 0.00003169 * t4;

  // 第 3.5 b 节中的德拉奈参数
  const D =
    297.85019547 * RadiansPerDegree +
    RadiansPerArcSecond *
      (1602961601.209 * t - 6.3706 * t2 + 0.006593 * t3 - 0.00003169 * t4);
  const F =
    93.27209062 * RadiansPerDegree +
    RadiansPerArcSecond *
      (1739527262.8478 * t - 12.7512 * t2 - 0.001037 * t3 + 0.00000417 * t4);
  const l =
    134.96340251 * RadiansPerDegree +
    RadiansPerArcSecond *
      (1717915923.2178 * t + 31.8792 * t2 + 0.051635 * t3 - 0.0002447 * t4);
  const lprime =
    357.52910918 * RadiansPerDegree +
    RadiansPerArcSecond *
      (129596581.0481 * t - 0.5532 * t2 + 0.000136 * t3 - 0.00001149 * t4);
  const psi =
    310.17137918 * RadiansPerDegree -
    RadiansPerArcSecond *
      (6967051.436 * t + 6.2068 * t2 + 0.007618 * t3 - 0.00003219 * t4);

  // 添加表 4 中的项
  const twoD = 2.0 * D;
  const fourD = 4.0 * D;
  const sixD = 6.0 * D;
  const twol = 2.0 * l;
  const threel = 3.0 * l;
  const fourl = 4.0 * l;
  const twoF = 2.0 * F;
  semimajorAxis +=
    3400.4 * Math.cos(twoD) -
    635.6 * Math.cos(twoD - l) -
    235.6 * Math.cos(l) +
    218.1 * Math.cos(twoD - lprime) +
    181.0 * Math.cos(twoD + l);
  eccentricity +=
    0.014216 * Math.cos(twoD - l) +
    0.008551 * Math.cos(twoD - twol) -
    0.001383 * Math.cos(l) +
    0.001356 * Math.cos(twoD + l) -
    0.001147 * Math.cos(fourD - threel) -
    0.000914 * Math.cos(fourD - twol) +
    0.000869 * Math.cos(twoD - lprime - l) -
    0.000627 * Math.cos(twoD) -
    0.000394 * Math.cos(fourD - fourl) +
    0.000282 * Math.cos(twoD - lprime - twol) -
    0.000279 * Math.cos(D - l) -
    0.000236 * Math.cos(twol) +
    0.000231 * Math.cos(fourD) +
    0.000229 * Math.cos(sixD - fourl) -
    0.000201 * Math.cos(twol - twoF);
  inclinationSecPart +=
    486.26 * Math.cos(twoD - twoF) -
    40.13 * Math.cos(twoD) +
    37.51 * Math.cos(twoF) +
    25.73 * Math.cos(twol - twoF) +
    19.97 * Math.cos(twoD - lprime - twoF);
  longitudeOfPerigeeSecPart +=
    -55609 * Math.sin(twoD - l) -
    34711 * Math.sin(twoD - twol) -
    9792 * Math.sin(l) +
    9385 * Math.sin(fourD - threel) +
    7505 * Math.sin(fourD - twol) +
    5318 * Math.sin(twoD + l) +
    3484 * Math.sin(fourD - fourl) -
    3417 * Math.sin(twoD - lprime - l) -
    2530 * Math.sin(sixD - fourl) -
    2376 * Math.sin(twoD) -
    2075 * Math.sin(twoD - threel) -
    1883 * Math.sin(twol) -
    1736 * Math.sin(sixD - threel);
  longitudeOfNodeSecPart +=
    -5392 * Math.sin(twoD - twoF) -
    540 * Math.sin(lprime) -
    441 * Math.sin(twoD) +
    423 * Math.sin(twoF) -
    288 * Math.sin(twol - twoF);
  meanLongitudeSecPart +=
    -3332.9 * Math.sin(twoD) +
    1197.4 * Math.sin(twoD - l) -
    662.5 * Math.sin(lprime) +
    396.3 * Math.sin(l) -
    218.0 * Math.sin(twoD - lprime);

  // 添加表 5 中的项
  const twoPsi = 2.0 * psi;
  const threePsi = 3.0 * psi;
  inclinationSecPart +=
    46.997 * Math.cos(psi) * t -
    0.614 * Math.cos(twoD - twoF + psi) * t +
    0.614 * Math.cos(twoD - twoF - psi) * t -
    0.0297 * Math.cos(twoPsi) * t2 -
    0.0335 * Math.cos(psi) * t2 +
    0.0012 * Math.cos(twoD - twoF + twoPsi) * t2 -
    0.00016 * Math.cos(psi) * t3 +
    0.00004 * Math.cos(threePsi) * t3 +
    0.00004 * Math.cos(twoPsi) * t3;

  const perigeeAndMean =
    2.116 * Math.sin(psi) * t -
    0.111 * Math.sin(twoD - twoF - psi) * t -
    0.0015 * Math.sin(psi) * t2;
  longitudeOfPerigeeSecPart += perigeeAndMean;
  meanLongitudeSecPart += perigeeAndMean;
  longitudeOfNodeSecPart +=
    -520.77 * Math.sin(psi) * t +
    13.66 * Math.sin(twoD - twoF + psi) * t +
    1.12 * Math.sin(twoD - psi) * t -
    1.06 * Math.sin(twoF - psi) * t +
    0.66 * Math.sin(twoPsi) * t2 +
    0.371 * Math.sin(psi) * t2 -
    0.035 * Math.sin(twoD - twoF + twoPsi) * t2 -
    0.015 * Math.sin(twoD - twoF + psi) * t2 +
    0.0014 * Math.sin(psi) * t3 -
    0.0011 * Math.sin(threePsi) * t3 -
    0.0009 * Math.sin(twoPsi) * t3;

  // 添加常量并转换单位
  semimajorAxis *= MetersPerKilometer;
  const inclination =
    inclinationConstant + inclinationSecPart * RadiansPerArcSecond;
  const longitudeOfPerigee =
    longitudeOfPerigeeConstant +
    longitudeOfPerigeeSecPart * RadiansPerArcSecond;
  const meanLongitude =
    meanLongitudeConstant + meanLongitudeSecPart * RadiansPerArcSecond;
  const longitudeOfNode =
    longitudeOfNodeConstant + longitudeOfNodeSecPart * RadiansPerArcSecond;

  return elementsToCartesian(
    semimajorAxis,
    eccentricity,
    inclination,
    longitudeOfPerigee,
    longitudeOfNode,
    meanLongitude,
    result,
  );
}

// 获取地球的运动。此点使用月球点和
// 表 2 中的 1992 年 μ 值（月球与地球质量比）来确定
// 地月系统质心相对的地球位置。
const moonEarthMassRatio = 0.012300034; // 来自表 2 中的 1992 μ 值
const factor = (moonEarthMassRatio / (moonEarthMassRatio + 1.0)) * -1;
function computeSimonEarth(date, result) {
  result = computeSimonMoon(date, result);
  return Cartesian3.multiplyByScalar(result, factor, result);
}

// 用于旋转的 <code>axesTransformation</code> 值是使用 STK Components
// 对太阳质心和地球 J2000 坐标系的变换得到的。

const axesTransformation = new Matrix3(
  1.0000000000000002,
  5.619723173785822e-16,
  4.690511510146299e-19,
  -5.154129427414611e-16,
  0.9174820620691819,
  -0.39777715593191376,
  -2.23970096136568e-16,
  0.39777715593191376,
  0.9174820620691819,
);
let translation = new Cartesian3();

/**
 * 计算地心惯性系中太阳的位置
 *
 * @param {JulianDate} [julianDate] 计算太阳位置的时间，如果未提供则使用当前系统时间。
 * @param {Cartesian3} [result] 用于存储结果的对象。
 * @returns {Cartesian3} 计算出的太阳位置
 */
Simon1994PlanetaryPositions.computeSunPositionInEarthInertialFrame = function (
  julianDate,
  result,
) {
  if (!defined(julianDate)) {
    julianDate = JulianDate.now();
  }

  if (!defined(result)) {
    result = new Cartesian3();
  }

  //第一个前向变换
  translation = computeSimonEarthMoonBarycenter(julianDate, translation);
  result = Cartesian3.negate(translation, result);

  //第二个前向变换
  computeSimonEarth(julianDate, translation);

  Cartesian3.subtract(result, translation, result);
  Matrix3.multiplyByVector(axesTransformation, result, result);

  return result;
};

/**
 * 计算地心惯性系中月球的位置
 *
 * @param {JulianDate} [julianDate] 计算月球位置的时间，如果未提供则使用当前系统时间。
 * @param {Cartesian3} [result] 用于存储结果的对象。
 * @returns {Cartesian3} 计算出的月球位置
 */
Simon1994PlanetaryPositions.computeMoonPositionInEarthInertialFrame = function (
  julianDate,
  result,
) {
  if (!defined(julianDate)) {
    julianDate = JulianDate.now();
  }

  result = computeSimonMoon(julianDate, result);
  Matrix3.multiplyByVector(axesTransformation, result, result);

  return result;
};

export default Simon1994PlanetaryPositions;
