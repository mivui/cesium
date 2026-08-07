import Color from "./Color.js";
import Frozen from "./Frozen.js";
import defined from "./defined.js";
import DeveloperError from "./DeveloperError.js";

/**
 * 根据当前画布状态计算文本的尺寸。
 *
 * 将指标（不包括宽度）四舍五入到整数像素。这纯粹是为了在迁移到浏览器内的 measureText() 时最小化渲染差异，并可能在将来进行修改。参见：github.com/CesiumGS/cesium/pull/13081
 * @ignore
 */
function measureText(context2D, textString) {
  const metrics = context2D.measureText(textString);
  const isSpace = !/\S/.test(textString);

  if (isSpace) {
    return {
      width: metrics.width,
      height: 0,
      ascent: 0,
      descent: 0,
      minx: 0,
    };
  }

  // 基线对齐需要 `height = ascent + descent`。四舍五入（如有）
  // 必须在求和之前完成，否则像 "ij" 这样的字形对可能会错位。
  const ascent = Math.round(metrics.actualBoundingBoxAscent);
  const descent = Math.round(metrics.actualBoundingBoxDescent);

  // 某些字符如 "_" 在某些尺寸下 height 可能小于 0.5，不要四舍五入为零。
  const height = Math.max(ascent + descent, 1);

  return {
    width: metrics.width,
    height,
    ascent,
    descent,
    minx: -Math.round(metrics.actualBoundingBoxLeft),
  };
}

let imageSmoothingEnabledName;

/**
 * 将给定文本写入新的画布。画布将调整大小以适应文本。
 * 如果文本为空，则返回 undefined。
 *
 * @param {string} text 要写入的文本。
 * @param {object} [options] 包含以下属性的对象：
 * @param {string} [options.font='10px sans-serif'] 要使用的 CSS 字体。
 * @param {boolean} [options.fill=true] 是否填充文本。
 * @param {boolean} [options.stroke=false] 是否描边文本。
 * @param {Color} [options.fillColor=Color.WHITE] 填充颜色。
 * @param {Color} [options.strokeColor=Color.BLACK] 描边颜色。
 * @param {number} [options.strokeWidth=1] 描边宽度。
 * @param {Color} [options.backgroundColor=Color.TRANSPARENT] 画布的背景颜色。
 * @param {number} [options.padding=0] 要在文本周围添加的填充像素大小。
 * @returns {HTMLCanvasElement|undefined} 一个绘制了给定文本的新画布。来自 measureText 的尺寸对象
 *                   也将添加到返回的画布上。如果文本为空，则返回 undefined。
 * @function writeTextToCanvas
 */
function writeTextToCanvas(text, options) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(text)) {
    throw new DeveloperError("text is required.");
  }
  //>>includeEnd('debug');
  if (text === "") {
    return undefined;
  }

  options = options ?? Frozen.EMPTY_OBJECT;
  const font = options.font ?? "10px sans-serif";
  const stroke = options.stroke ?? false;
  const fill = options.fill ?? true;
  const strokeWidth = options.strokeWidth ?? 1;
  const backgroundColor = options.backgroundColor ?? Color.TRANSPARENT;
  const padding = options.padding ?? 0;
  const doublePadding = padding * 2.0;

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  canvas.style.font = font;
  // Since multiple read-back operations are expected for labels, use the willReadFrequently option – See https://html.spec.whatwg.org/multipage/canvas.html#concept-canvas-will-read-frequently
  const context2D = canvas.getContext("2d", { willReadFrequently: true });

  if (!defined(imageSmoothingEnabledName)) {
    if (defined(context2D.imageSmoothingEnabled)) {
      imageSmoothingEnabledName = "imageSmoothingEnabled";
    } else if (defined(context2D.mozImageSmoothingEnabled)) {
      imageSmoothingEnabledName = "mozImageSmoothingEnabled";
    } else if (defined(context2D.webkitImageSmoothingEnabled)) {
      imageSmoothingEnabledName = "webkitImageSmoothingEnabled";
    } else if (defined(context2D.msImageSmoothingEnabled)) {
      imageSmoothingEnabledName = "msImageSmoothingEnabled";
    }
  }

  context2D.font = font;
  context2D.lineJoin = "round";
  context2D.lineWidth = strokeWidth;
  context2D[imageSmoothingEnabledName] = false;

  // in order for measureText to calculate style, the canvas has to be
  // (temporarily) added to the DOM.
  canvas.style.visibility = "hidden";
  document.body.appendChild(canvas);

  const dimensions = measureText(context2D, text);

  // Set canvas.dimensions to be accessed in LabelCollection. LabelCollection
  // hard-codes strokeWidth=0, so dimensions should not include stroke padding.
  canvas.dimensions = dimensions;

  document.body.removeChild(canvas);
  canvas.style.visibility = "";

  // measureText does not account for stroke width, added here. LabelCollection
  // calls writeTextToCanvas with hard-coded strokeWidth=0, so stroke padding
  // matters only when calling `writeTextToCanvas` directly.
  const isSpace = !/\S/.test(text);
  const strokePadding = stroke && !isSpace ? Math.ceil(strokeWidth / 2) : 0;
  const doubleStrokePadding = strokePadding * 2;

  // Some characters, such as the letter j, have a non-zero starting position.
  // This value is used for kerning later, but we need to take it into account
  // now in order to draw the text completely on the canvas
  const x = -dimensions.minx + strokePadding;

  // Expand the width to include the starting position.
  const width = Math.ceil(dimensions.width) + x + doublePadding + strokePadding;

  // While the height of the letter is correct, we need to adjust
  // where we start drawing it so that letters like j and y properly dip
  // below the line.

  const height = dimensions.height + doublePadding + doubleStrokePadding;
  const y = dimensions.ascent + padding + strokePadding;

  canvas.width = width;
  canvas.height = height;

  // Properties must be explicitly set again after changing width and height
  context2D.font = font;
  context2D.lineJoin = "round";
  context2D.lineWidth = strokeWidth;
  context2D[imageSmoothingEnabledName] = false;

  // Draw background
  if (backgroundColor !== Color.TRANSPARENT) {
    context2D.fillStyle = backgroundColor.toCssColorString();
    context2D.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (stroke) {
    const strokeColor = options.strokeColor ?? Color.BLACK;
    context2D.strokeStyle = strokeColor.toCssColorString();
    context2D.strokeText(text, x + padding, y);
  }

  if (fill) {
    const fillColor = options.fillColor ?? Color.WHITE;
    context2D.fillStyle = fillColor.toCssColorString();
    context2D.fillText(text, x + padding, y);
  }

  return canvas;
}
export default writeTextToCanvas;
