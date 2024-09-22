import BoundingRectangle from "../Core/BoundingRectangle.js";
import Cartesian2 from "../Core/Cartesian2.js";
import Color from "../Core/Color.js";
import defaultValue from "../Core/defaultValue.js";
import defined from "../Core/defined.js";
import destroyObject from "../Core/destroyObject.js";
import DeveloperError from "../Core/DeveloperError.js";
import Matrix4 from "../Core/Matrix4.js";
import writeTextToCanvas from "../Core/writeTextToCanvas.js";
import bitmapSDF from "bitmap-sdf";
import BillboardCollection from "./BillboardCollection.js";
import BlendOption from "./BlendOption.js";
import { isHeightReferenceClamp } from "./HeightReference.js";
import HorizontalOrigin from "./HorizontalOrigin.js";
import Label from "./Label.js";
import LabelStyle from "./LabelStyle.js";
import SDFSettings from "./SDFSettings.js";
import TextureAtlas from "./TextureAtlas.js";
import VerticalOrigin from "./VerticalOrigin.js";
import GraphemeSplitter from "grapheme-splitter";

// A glyph represents a single character in a particular label.  It may or may
// not have a billboard, depending on whether the texture info has an index into
// the the label collection's texture atlas.  Invisible characters have no texture, and
// no billboard.  However, it always has a valid dimensions object.
function Glyph() {
  this.textureInfo = undefined;
  this.dimensions = undefined;
  this.billboard = undefined;
}

// GlyphTextureInfo represents a single character, drawn in a particular style,
// shared and reference counted across all labels.  It may or may not have an
// index into the label collection's texture atlas, depending on whether the character
// has both width and height, but it always has a valid dimensions object.
function GlyphTextureInfo(labelCollection, index, dimensions) {
  this.labelCollection = labelCollection;
  this.index = index;
  this.dimensions = dimensions;
}

// Traditionally, leading is %20 of the font size.
const defaultLineSpacingPercent = 1.2;
const whitePixelCanvasId = "ID_WHITE_PIXEL";
const whitePixelSize = new Cartesian2(4, 4);
const whitePixelBoundingRegion = new BoundingRectangle(1, 1, 1, 1);

function addWhitePixelCanvas(textureAtlas) {
  const canvas = document.createElement("canvas");
  canvas.width = whitePixelSize.x;
  canvas.height = whitePixelSize.y;

  const context2D = canvas.getContext("2d");
  context2D.fillStyle = "#fff";
  context2D.fillRect(0, 0, canvas.width, canvas.height);

  // Canvas operations take a frame to draw. Use the asynchronous add function which resolves a promise and allows the draw to complete,
  // but there's no need to wait on the promise before operation can continue
  return textureAtlas.addImage(whitePixelCanvasId, canvas);
}

// reusable object for calling writeTextToCanvas
const writeTextToCanvasParameters = {};
function createGlyphCanvas(
  character,
  font,
  fillColor,
  outlineColor,
  outlineWidth,
  style,
  verticalOrigin
) {
  writeTextToCanvasParameters.font = font;
  writeTextToCanvasParameters.fillColor = fillColor;
  writeTextToCanvasParameters.strokeColor = outlineColor;
  writeTextToCanvasParameters.strokeWidth = outlineWidth;
  // Setting the padding to something bigger is necessary to get enough space for the outlining.
  writeTextToCanvasParameters.padding = SDFSettings.PADDING;

  if (verticalOrigin === VerticalOrigin.CENTER) {
    writeTextToCanvasParameters.textBaseline = "middle";
  } else if (verticalOrigin === VerticalOrigin.TOP) {
    writeTextToCanvasParameters.textBaseline = "top";
  } else {
    // VerticalOrigin.BOTTOM and VerticalOrigin.BASELINE
    writeTextToCanvasParameters.textBaseline = "bottom";
  }

  writeTextToCanvasParameters.fill =
    style === LabelStyle.FILL || style === LabelStyle.FILL_AND_OUTLINE;
  writeTextToCanvasParameters.stroke =
    style === LabelStyle.OUTLINE || style === LabelStyle.FILL_AND_OUTLINE;
  writeTextToCanvasParameters.backgroundColor = Color.BLACK;

  return writeTextToCanvas(character, writeTextToCanvasParameters);
}

function unbindGlyph(labelCollection, glyph) {
  glyph.textureInfo = undefined;
  glyph.dimensions = undefined;

  const billboard = glyph.billboard;
  if (defined(billboard)) {
    billboard.show = false;
    billboard.image = undefined;
    if (defined(billboard._removeCallbackFunc)) {
      billboard._removeCallbackFunc();
      billboard._removeCallbackFunc = undefined;
    }
    labelCollection._spareBillboards.push(billboard);
    glyph.billboard = undefined;
  }
}

function addGlyphToTextureAtlas(textureAtlas, id, canvas, glyphTextureInfo) {
  glyphTextureInfo.index = textureAtlas.addImageSync(id, canvas);
}

const splitter = new GraphemeSplitter();

function rebindAllGlyphs(labelCollection, label) {
  const text = label._renderedText;
  const graphemes = splitter.splitGraphemes(text);
  const textLength = graphemes.length;
  const glyphs = label._glyphs;
  const glyphsLength = glyphs.length;

  let glyph;
  let glyphIndex;
  let textIndex;

  // Compute a font size scale relative to the sdf font generated size.
  label._relativeSize = label._fontSize / SDFSettings.FONT_SIZE;

  // if we have more glyphs than needed, unbind the extras.
  if (textLength < glyphsLength) {
    for (glyphIndex = textLength; glyphIndex < glyphsLength; ++glyphIndex) {
      unbindGlyph(labelCollection, glyphs[glyphIndex]);
    }
  }

  // presize glyphs to match the new text length
  glyphs.length = textLength;

  const showBackground =
    label.show && label._showBackground && text.split("\n").join("").length > 0;
  let backgroundBillboard = label._backgroundBillboard;
  const backgroundBillboardCollection =
    labelCollection._backgroundBillboardCollection;
  if (!showBackground) {
    if (defined(backgroundBillboard)) {
      backgroundBillboardCollection.remove(backgroundBillboard);
      label._backgroundBillboard = backgroundBillboard = undefined;
    }
  } else {
    if (!defined(backgroundBillboard)) {
      backgroundBillboard = backgroundBillboardCollection.add({
        collection: labelCollection,
        image: whitePixelCanvasId,
        imageSubRegion: whitePixelBoundingRegion,
      });
      label._backgroundBillboard = backgroundBillboard;
    }

    backgroundBillboard.color = label._backgroundColor;
    backgroundBillboard.show = label._show;
    backgroundBillboard.position = label._position;
    backgroundBillboard.eyeOffset = label._eyeOffset;
    backgroundBillboard.pixelOffset = label._pixelOffset;
    backgroundBillboard.horizontalOrigin = HorizontalOrigin.LEFT;
    backgroundBillboard.verticalOrigin = label._verticalOrigin;
    backgroundBillboard.heightReference = label._heightReference;
    backgroundBillboard.scale = label.totalScale;
    backgroundBillboard.pickPrimitive = label;
    backgroundBillboard.id = label._id;
    backgroundBillboard.translucencyByDistance = label._translucencyByDistance;
    backgroundBillboard.pixelOffsetScaleByDistance =
      label._pixelOffsetScaleByDistance;
    backgroundBillboard.scaleByDistance = label._scaleByDistance;
    backgroundBillboard.distanceDisplayCondition =
      label._distanceDisplayCondition;
    backgroundBillboard.disableDepthTestDistance =
      label._disableDepthTestDistance;
    backgroundBillboard.clusterShow = label.clusterShow;
  }

  const glyphTextureCache = labelCollection._glyphTextureCache;

  // walk the text looking for new characters (creating new glyphs for each)
  // or changed characters (rebinding existing glyphs)
  for (textIndex = 0; textIndex < textLength; ++textIndex) {
    const character = graphemes[textIndex];
    const verticalOrigin = label._verticalOrigin;

    const id = JSON.stringify([
      character,
      label._fontFamily,
      label._fontStyle,
      label._fontWeight,
      +verticalOrigin,
    ]);

    let glyphTextureInfo = glyphTextureCache[id];
    if (!defined(glyphTextureInfo)) {
      const glyphFont = `${label._fontStyle} ${label._fontWeight} ${SDFSettings.FONT_SIZE}px ${label._fontFamily}`;

      const canvas = createGlyphCanvas(
        character,
        glyphFont,
        Color.WHITE,
        Color.WHITE,
        0.0,
        LabelStyle.FILL,
        verticalOrigin
      );

      glyphTextureInfo = new GlyphTextureInfo(
        labelCollection,
        -1,
        canvas.dimensions
      );
      glyphTextureCache[id] = glyphTextureInfo;

      if (canvas.width > 0 && canvas.height > 0) {
        const sdfValues = bitmapSDF(canvas, {
          cutoff: SDFSettings.CUTOFF,
          radius: SDFSettings.RADIUS,
        });

        // Context is originally created in writeTextToCanvas()
        const ctx = canvas.getContext("2d");
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const imgData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
        for (let i = 0; i < canvasWidth; i++) {
          for (let j = 0; j < canvasHeight; j++) {
            const baseIndex = j * canvasWidth + i;
            const alpha = sdfValues[baseIndex] * 255;
            const imageIndex = baseIndex * 4;
            imgData.data[imageIndex + 0] = alpha;
            imgData.data[imageIndex + 1] = alpha;
            imgData.data[imageIndex + 2] = alpha;
            imgData.data[imageIndex + 3] = alpha;
          }
        }
        ctx.putImageData(imgData, 0, 0);
        if (character !== " ") {
          addGlyphToTextureAtlas(
            labelCollection._textureAtlas,
            id,
            canvas,
            glyphTextureInfo
          );
        }
      }
    }

    glyph = glyphs[textIndex];

    if (defined(glyph)) {
      // clean up leftover information from the previous glyph
      if (glyphTextureInfo.index === -1) {
        // no texture, and therefore no billboard, for this glyph.
        // so, completely unbind glyph.
        unbindGlyph(labelCollection, glyph);
      } else if (defined(glyph.textureInfo)) {
        // we have a texture and billboard.  If we had one before, release
        // our reference to that texture info, but reuse the billboard.
        glyph.textureInfo = undefined;
      }
    } else {
      // create a glyph object
      glyph = new Glyph();
      glyphs[textIndex] = glyph;
    }

    glyph.textureInfo = glyphTextureInfo;
    glyph.dimensions = glyphTextureInfo.dimensions;

    // if we have a texture, configure the existing billboard, or obtain one
    if (glyphTextureInfo.index !== -1) {
      let billboard = glyph.billboard;
      const spareBillboards = labelCollection._spareBillboards;
      if (!defined(billboard)) {
        if (spareBillboards.length > 0) {
          billboard = spareBillboards.pop();
        } else {
          billboard = labelCollection._billboardCollection.add({
            collection: labelCollection,
          });
          billboard._labelDimensions = new Cartesian2();
          billboard._labelTranslate = new Cartesian2();
        }
        glyph.billboard = billboard;
      }

      billboard.show = label._show;
      billboard.position = label._position;
      billboard.eyeOffset = label._eyeOffset;
      billboard.pixelOffset = label._pixelOffset;
      billboard.horizontalOrigin = HorizontalOrigin.LEFT;
      billboard.verticalOrigin = label._verticalOrigin;
      billboard.heightReference = label._heightReference;
      billboard.scale = label.totalScale;
      billboard.pickPrimitive = label;
      billboard.id = label._id;
      billboard.image = id;
      billboard.translucencyByDistance = label._translucencyByDistance;
      billboard.pixelOffsetScaleByDistance = label._pixelOffsetScaleByDistance;
      billboard.scaleByDistance = label._scaleByDistance;
      billboard.distanceDisplayCondition = label._distanceDisplayCondition;
      billboard.disableDepthTestDistance = label._disableDepthTestDistance;
      billboard._batchIndex = label._batchIndex;
      billboard.outlineColor = label.outlineColor;
      if (label.style === LabelStyle.FILL_AND_OUTLINE) {
        billboard.color = label._fillColor;
        billboard.outlineWidth = label.outlineWidth;
      } else if (label.style === LabelStyle.FILL) {
        billboard.color = label._fillColor;
        billboard.outlineWidth = 0.0;
      } else if (label.style === LabelStyle.OUTLINE) {
        billboard.color = Color.TRANSPARENT;
        billboard.outlineWidth = label.outlineWidth;
      }
    }
  }

  // changing glyphs will cause the position of the
  // glyphs to change, since different characters have different widths
  label._repositionAllGlyphs = true;
}

function calculateWidthOffset(lineWidth, horizontalOrigin, backgroundPadding) {
  if (horizontalOrigin === HorizontalOrigin.CENTER) {
    return -lineWidth / 2;
  } else if (horizontalOrigin === HorizontalOrigin.RIGHT) {
    return -(lineWidth + backgroundPadding.x);
  }
  return backgroundPadding.x;
}

// reusable Cartesian2 instances
const glyphPixelOffset = new Cartesian2();
const scratchBackgroundPadding = new Cartesian2();

function repositionAllGlyphs(label) {
  const glyphs = label._glyphs;
  const text = label._renderedText;
  let glyph;
  let dimensions;
  let lastLineWidth = 0;
  let maxLineWidth = 0;
  const lineWidths = [];
  let maxGlyphDescent = Number.NEGATIVE_INFINITY;
  let maxGlyphY = 0;
  let numberOfLines = 1;
  let glyphIndex;
  const glyphLength = glyphs.length;

  const backgroundBillboard = label._backgroundBillboard;
  const backgroundPadding = Cartesian2.clone(
    defined(backgroundBillboard) ? label._backgroundPadding : Cartesian2.ZERO,
    scratchBackgroundPadding
  );

  // We need to scale the background padding, which is specified in pixels by the inverse of the relative size so it is scaled properly.
  backgroundPadding.x /= label._relativeSize;
  backgroundPadding.y /= label._relativeSize;

  for (glyphIndex = 0; glyphIndex < glyphLength; ++glyphIndex) {
    if (text.charAt(glyphIndex) === "\n") {
      lineWidths.push(lastLineWidth);
      ++numberOfLines;
      lastLineWidth = 0;
    } else {
      glyph = glyphs[glyphIndex];
      dimensions = glyph.dimensions;
      maxGlyphY = Math.max(maxGlyphY, dimensions.height - dimensions.descent);
      maxGlyphDescent = Math.max(maxGlyphDescent, dimensions.descent);

      //Computing the line width must also account for the kerning that occurs between letters.
      lastLineWidth += dimensions.width - dimensions.minx;
      if (glyphIndex < glyphLength - 1) {
        lastLineWidth += glyphs[glyphIndex + 1].dimensions.minx;
      }
      maxLineWidth = Math.max(maxLineWidth, lastLineWidth);
    }
  }
  lineWidths.push(lastLineWidth);
  const maxLineHeight = maxGlyphY + maxGlyphDescent;

  const scale = label.totalScale;
  const horizontalOrigin = label._horizontalOrigin;
  const verticalOrigin = label._verticalOrigin;
  let lineIndex = 0;
  let lineWidth = lineWidths[lineIndex];
  let widthOffset = calculateWidthOffset(
    lineWidth,
    horizontalOrigin,
    backgroundPadding
  );
  const lineSpacing =
    (defined(label._lineHeight)
      ? label._lineHeight
      : defaultLineSpacingPercent * label._fontSize) / label._relativeSize;
  const otherLinesHeight = lineSpacing * (numberOfLines - 1);
  let totalLineWidth = maxLineWidth;
  let totalLineHeight = maxLineHeight + otherLinesHeight;

  if (defined(backgroundBillboard)) {
    totalLineWidth += backgroundPadding.x * 2;
    totalLineHeight += backgroundPadding.y * 2;
    backgroundBillboard._labelHorizontalOrigin = horizontalOrigin;
  }

  glyphPixelOffset.x = widthOffset * scale;
  glyphPixelOffset.y = 0;

  let firstCharOfLine = true;

  let lineOffsetY = 0;
  for (glyphIndex = 0; glyphIndex < glyphLength; ++glyphIndex) {
    if (text.charAt(glyphIndex) === "\n") {
      ++lineIndex;
      lineOffsetY += lineSpacing;
      lineWidth = lineWidths[lineIndex];
      widthOffset = calculateWidthOffset(
        lineWidth,
        horizontalOrigin,
        backgroundPadding
      );
      glyphPixelOffset.x = widthOffset * scale;
      firstCharOfLine = true;
    } else {
      glyph = glyphs[glyphIndex];
      dimensions = glyph.dimensions;

      if (verticalOrigin === VerticalOrigin.TOP) {
        glyphPixelOffset.y =
          dimensions.height - maxGlyphY - backgroundPadding.y;
        glyphPixelOffset.y += SDFSettings.PADDING;
      } else if (verticalOrigin === VerticalOrigin.CENTER) {
        glyphPixelOffset.y =
          (otherLinesHeight + dimensions.height - maxGlyphY) / 2;
      } else if (verticalOrigin === VerticalOrigin.BASELINE) {
        glyphPixelOffset.y = otherLinesHeight;
        glyphPixelOffset.y -= SDFSettings.PADDING;
      } else {
        // VerticalOrigin.BOTTOM
        glyphPixelOffset.y =
          otherLinesHeight + maxGlyphDescent + backgroundPadding.y;
        glyphPixelOffset.y -= SDFSettings.PADDING;
      }
      glyphPixelOffset.y =
        (glyphPixelOffset.y - dimensions.descent - lineOffsetY) * scale;

      // Handle any offsets for the first character of the line since the bounds might not be right on the bottom left pixel.
      if (firstCharOfLine) {
        glyphPixelOffset.x -= SDFSettings.PADDING * scale;
        firstCharOfLine = false;
      }

      if (defined(glyph.billboard)) {
        glyph.billboard._setTranslate(glyphPixelOffset);
        glyph.billboard._labelDimensions.x = totalLineWidth;
        glyph.billboard._labelDimensions.y = totalLineHeight;
        glyph.billboard._labelHorizontalOrigin = horizontalOrigin;
      }

      //Compute the next x offset taking into account the kerning performed
      //on both the current letter as well as the next letter to be drawn
      //as well as any applied scale.
      if (glyphIndex < glyphLength - 1) {
        const nextGlyph = glyphs[glyphIndex + 1];
        glyphPixelOffset.x +=
          (dimensions.width - dimensions.minx + nextGlyph.dimensions.minx) *
          scale;
      }
    }
  }

  if (defined(backgroundBillboard) && text.split("\n").join("").length > 0) {
    if (horizontalOrigin === HorizontalOrigin.CENTER) {
      widthOffset = -maxLineWidth / 2 - backgroundPadding.x;
    } else if (horizontalOrigin === HorizontalOrigin.RIGHT) {
      widthOffset = -(maxLineWidth + backgroundPadding.x * 2);
    } else {
      widthOffset = 0;
    }
    glyphPixelOffset.x = widthOffset * scale;

    if (verticalOrigin === VerticalOrigin.TOP) {
      glyphPixelOffset.y = maxLineHeight - maxGlyphY - maxGlyphDescent;
    } else if (verticalOrigin === VerticalOrigin.CENTER) {
      glyphPixelOffset.y = (maxLineHeight - maxGlyphY) / 2 - maxGlyphDescent;
    } else if (verticalOrigin === VerticalOrigin.BASELINE) {
      glyphPixelOffset.y = -backgroundPadding.y - maxGlyphDescent;
    } else {
      // VerticalOrigin.BOTTOM
      glyphPixelOffset.y = 0;
    }
    glyphPixelOffset.y = glyphPixelOffset.y * scale;

    backgroundBillboard.width = totalLineWidth;
    backgroundBillboard.height = totalLineHeight;
    backgroundBillboard._setTranslate(glyphPixelOffset);
    backgroundBillboard._labelTranslate = Cartesian2.clone(
      glyphPixelOffset,
      backgroundBillboard._labelTranslate
    );
  }

  if (isHeightReferenceClamp(label.heightReference)) {
    for (glyphIndex = 0; glyphIndex < glyphLength; ++glyphIndex) {
      glyph = glyphs[glyphIndex];
      const billboard = glyph.billboard;
      if (defined(billboard)) {
        billboard._labelTranslate = Cartesian2.clone(
          glyphPixelOffset,
          billboard._labelTranslate
        );
      }
    }
  }
}

function destroyLabel(labelCollection, label) {
  const glyphs = label._glyphs;
  for (let i = 0, len = glyphs.length; i < len; ++i) {
    unbindGlyph(labelCollection, glyphs[i]);
  }
  if (defined(label._backgroundBillboard)) {
    labelCollection._backgroundBillboardCollection.remove(
      label._backgroundBillboard
    );
    label._backgroundBillboard = undefined;
  }
  label._labelCollection = undefined;

  if (defined(label._removeCallbackFunc)) {
    label._removeCallbackFunc();
  }

  destroyObject(label);
}

/**
 * 标签的可渲染集合。 标签是位于 3D 场景中的视区对齐文本。
 * 每个标签可以有不同的字体、颜色、比例等。
 * <br /><br />
 * <div align='center'>
 * <img src='Images/Label.png' width='400' height='300' /><br />
 * 示例标签
 * </div>
 * <br /><br />
 * 使用 在集合中添加和删除标签 {@link LabelCollection#add}
 * 和 {@link LabelCollection#remove}.
 *
 * @alias LabelCollection
 * @constructor
 *
 * @param {object} [options] 对象，具有以下属性:
 * @param {Matrix4} [options.modelMatrix=Matrix4.IDENTITY] 将每个标签从模型转换为世界坐标的 4x4 变换矩阵。
 * @param {boolean} [options.debugShowBoundingVolume=false] 仅用于调试。确定是否显示此基本体的命令的边界球体。
 * @param {Scene} [options.scene] 必须为使用高度引用属性的标签传入，否则将针对地球进行深度测试。
 * @param {BlendOption} [options.blendOption=BlendOption.OPAQUE_AND_TRANSLUCENT] 标签混合选项。默认的
 * 用于渲染不透明和半透明标签。但是，如果所有标签都完全不透明或全部完全半透明，
 * 将技术设置为 BlendOption.OPAQUE 或 BlendOption.TRANSLUCENT 可以将性能提高多达 2 倍。
 * @param {boolean} [options.show=true] 确定是否显示集合中的标签。
 *
 * @performance 为了获得最佳性能，请首选几个集合（每个集合都有许多标签）到
 * 许多集合，每个集合只有几个标签。 避免使用某些
 * 标签每帧都会更改，而其他标签则不会;相反，请创建一个或多个集合
 * 表示静态标签，一个或多个集合表示动态标签。
 *
 * @see LabelCollection#add
 * @see LabelCollection#remove
 * @see Label
 * @see BillboardCollection
 *
 * @demo {@link https://sandcastle.cesium.com/index.html?src=Labels.html|Cesium Sandcastle Labels Demo}
 *
 * @example
 * // Create a label collection with two labels
 * const labels = scene.primitives.add(new Cesium.LabelCollection());
 * labels.add({
 *   position : new Cesium.Cartesian3(1.0, 2.0, 3.0),
 *   text : 'A label'
 * });
 * labels.add({
 *   position : new Cesium.Cartesian3(4.0, 5.0, 6.0),
 *   text : 'Another label'
 * });
 */
function LabelCollection(options) {
  options = defaultValue(options, defaultValue.EMPTY_OBJECT);

  this._scene = options.scene;
  this._batchTable = options.batchTable;

  this._textureAtlas = undefined;
  this._backgroundTextureAtlas = undefined;

  this._backgroundBillboardCollection = new BillboardCollection({
    scene: this._scene,
  });
  this._backgroundBillboardCollection.destroyTextureAtlas = false;

  this._billboardCollection = new BillboardCollection({
    scene: this._scene,
    batchTable: this._batchTable,
  });
  this._billboardCollection.destroyTextureAtlas = false;
  this._billboardCollection._sdf = true;

  this._spareBillboards = [];
  this._glyphTextureCache = {};
  this._labels = [];
  this._labelsToUpdate = [];
  this._totalGlyphCount = 0;

  this._highlightColor = Color.clone(Color.WHITE); // Only used by Vector3DTilePoints

  /**
   * Determines if labels in this collection will be shown.
   *
   * @type {boolean}
   * @default true
   */
  this.show = defaultValue(options.show, true);

  /**
   * 4x4 转换矩阵，用于将此集合中的每个标签从模型转换为世界坐标。
   * 当这是单位矩阵时，标签以世界坐标（即地球的 WGS84 坐标）绘制。
   * 可以通过提供不同的转换矩阵来使用本地参考帧，就像返回的矩阵一样
   * 由 {@link Transforms.eastNorthUpToFixedFrame} 提供。
   *
   * @type Matrix4
   * @default {@link Matrix4.IDENTITY}
   *
   * @example
   * const center = Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883);
   * labels.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);
   * labels.add({
   *   position : new Cesium.Cartesian3(0.0, 0.0, 0.0),
   *   text     : 'Center'
   * });
   * labels.add({
   *   position : new Cesium.Cartesian3(1000000.0, 0.0, 0.0),
   *   text     : 'East'
   * });
   * labels.add({
   *   position : new Cesium.Cartesian3(0.0, 1000000.0, 0.0),
   *   text     : 'North'
   * });
   * labels.add({
   *   position : new Cesium.Cartesian3(0.0, 0.0, 1000000.0),
   *   text     : 'Up'
   * });
   */
  this.modelMatrix = Matrix4.clone(
    defaultValue(options.modelMatrix, Matrix4.IDENTITY)
  );

  /**
   * 此属性仅用于调试;它不用于生产用途，也未进行优化。
   * <p>
   * 为基元中的每个绘制命令绘制边界球体。
   * </p>
   *
   * @type {boolean}
   *
   * @default false
   */
  this.debugShowBoundingVolume = defaultValue(
    options.debugShowBoundingVolume,
    false
  );

  /**
   * 标签混合选项。默认值用于渲染不透明和半透明标签。
   * 但是，如果所有标签都是完全不透明的，或者所有标签都是完全半透明的，
   * 将技术设置为 BlendOption.OPAQUE 或 BlendOption.TRANSLUCENT 可以提高
   * 性能提升高达 2 倍。
   * @type {BlendOption}
   * @default BlendOption.OPAQUE_AND_TRANSLUCENT
   */
  this.blendOption = defaultValue(
    options.blendOption,
    BlendOption.OPAQUE_AND_TRANSLUCENT
  );
}

Object.defineProperties(LabelCollection.prototype, {
  /**
   * 返回此集合中的标签数。 这通常与
   * {@link LabelCollection#get} 遍历所有标签
   * 在集合中。
   * @memberof LabelCollection.prototype
   * @type {number}
   */
  length: {
    get: function () {
      return this._labels.length;
    },
  },
});

/**
 * 创建具有指定初始属性的标签并将其添加到集合中。
 * 将返回添加的标签，以便以后可以对其进行修改或从集合中删除。
 *
 * @param {Label.ConstructorOptions} [options] 描述标签属性的模板，如示例 1 所示。
 * @returns {Label} 添加到集合中的标签。
 *
 * @performance 调用 <code>add</code> 是预期的常数时间。 但是，集合的顶点缓冲区
 * 被重写;此操作为 <code>O(n)</code> 并且还会
 * CPU 到 GPU 的开销。 为了获得最佳性能，请在之前添加尽可能多的广告牌
 * 调用 <code>Update</code>。
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 *
 * @example
 * // Example 1:  Add a label, specifying all the default values.
 * const l = labels.add({
 *   show : true,
 *   position : Cesium.Cartesian3.ZERO,
 *   text : '',
 *   font : '30px sans-serif',
 *   fillColor : Cesium.Color.WHITE,
 *   outlineColor : Cesium.Color.BLACK,
 *   outlineWidth : 1.0,
 *   showBackground : false,
 *   backgroundColor : new Cesium.Color(0.165, 0.165, 0.165, 0.8),
 *   backgroundPadding : new Cesium.Cartesian2(7, 5),
 *   style : Cesium.LabelStyle.FILL,
 *   pixelOffset : Cesium.Cartesian2.ZERO,
 *   eyeOffset : Cesium.Cartesian3.ZERO,
 *   horizontalOrigin : Cesium.HorizontalOrigin.LEFT,
 *   verticalOrigin : Cesium.VerticalOrigin.BASELINE,
 *   scale : 1.0,
 *   translucencyByDistance : undefined,
 *   pixelOffsetScaleByDistance : undefined,
 *   heightReference : HeightReference.NONE,
 *   distanceDisplayCondition : undefined
 * });
 *
 * @example
 * // Example 2:  Specify only the label's cartographic position,
 * // text, and font.
 * const l = labels.add({
 *   position : Cesium.Cartesian3.fromRadians(longitude, latitude, height),
 *   text : 'Hello World',
 *   font : '24px Helvetica',
 * });
 *
 *
 * @see LabelCollection#remove
 * @see LabelCollection#removeAll
 */
LabelCollection.prototype.add = function (options) {
  const label = new Label(options, this);

  this._labels.push(label);
  this._labelsToUpdate.push(label);

  return label;
};

/**
 * 从集合中删除标签。 删除后，标签将不再可用。
 *
 * @param {Label} label 要删除的标签。
 * @returns {boolean} <code>true</code>（如果标签被删除）;<code>false</code> 如果在集合中找不到标签。
 *
 * @performance 调用 <code>remove</code> 是预期的常数时间。 但是，集合的顶点缓冲区
 * 被重写 - 一个<code>O(n)</code> 操作，也会产生 CPU 到 GPU 的开销。 为
 * 最佳性能，在调用 <code>update</code> 之前删除尽可能多的标签。
 * 如果您打算暂时隐藏标签，通常调用
 * {@link Label#show} 而不是删除并重新添加标签。
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 *
 * @example
 * const l = labels.add(...);
 * labels.remove(l);  // Returns true
 *
 * @see LabelCollection#add
 * @see LabelCollection#removeAll
 * @see Label#show
 */
LabelCollection.prototype.remove = function (label) {
  if (defined(label) && label._labelCollection === this) {
    const index = this._labels.indexOf(label);
    if (index !== -1) {
      this._labels.splice(index, 1);
      destroyLabel(this, label);
      return true;
    }
  }
  return false;
};

/**
 * 从集合中删除所有标签。
 *
 * @performance <code>O(n)</code> 删除所有标签更有效
 * 从集合中，然后添加新的集合，而不是完全创建一个新集合。
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 *
 * @example
 * labels.add(...);
 * labels.add(...);
 * labels.removeAll();
 *
 * @see LabelCollection#add
 * @see LabelCollection#remove
 */
LabelCollection.prototype.removeAll = function () {
  const labels = this._labels;

  for (let i = 0, len = labels.length; i < len; ++i) {
    destroyLabel(this, labels[i]);
  }

  labels.length = 0;
};

/**
 * 检查此集合是否包含给定的标签。
 *
 * @param {Label} label 要检查的标签。
 * @returns {boolean} （如果此集合包含标签）则为 true，否则为 false。
 *
 * @see LabelCollection#get
 *
 */
LabelCollection.prototype.contains = function (label) {
  return defined(label) && label._labelCollection === this;
};

/**
 * 返回集合中指定索引处的标签。 索引从 0 开始
 * 并随着标签的添加而增加。 删除标签会在
 * 它向左移动，更改其索引。 此功能通常用于
 * {@link LabelCollection#length} 遍历所有标签
 * 在集合中。
 *
 * @param {number} index 公告牌的从零开始的索引。
 *
 * @returns {Label} 指定索引处的标签。
 *
 * @performance 预期恒定时间。 如果从集合中删除了标签，并且
 * {@link Scene#render} 未调用，则隐式 <code>O（n）</code>
 * 执行操作。
 *
 * @exception {DeveloperError} 这个物体被摧毁了,destroy().
 *
 *
 * @example
 * // Toggle the show property of every label in the collection
 * const len = labels.length;
 * for (let i = 0; i < len; ++i) {
 *   const l = billboards.get(i);
 *   l.show = !l.show;
 * }
 *
 * @see LabelCollection#length
 */
LabelCollection.prototype.get = function (index) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(index)) {
    throw new DeveloperError("index is required.");
  }
  //>>includeEnd('debug');

  return this._labels[index];
};

/**
 * @private
 *
 */
LabelCollection.prototype.update = function (frameState) {
  if (!this.show) {
    return;
  }

  const billboardCollection = this._billboardCollection;
  const backgroundBillboardCollection = this._backgroundBillboardCollection;

  billboardCollection.modelMatrix = this.modelMatrix;
  billboardCollection.debugShowBoundingVolume = this.debugShowBoundingVolume;
  backgroundBillboardCollection.modelMatrix = this.modelMatrix;
  backgroundBillboardCollection.debugShowBoundingVolume = this.debugShowBoundingVolume;

  const context = frameState.context;

  if (!defined(this._textureAtlas)) {
    this._textureAtlas = new TextureAtlas({
      context: context,
    });
    billboardCollection.textureAtlas = this._textureAtlas;
  }

  if (!defined(this._backgroundTextureAtlas)) {
    this._backgroundTextureAtlas = new TextureAtlas({
      context: context,
      initialSize: whitePixelSize,
    });
    backgroundBillboardCollection.textureAtlas = this._backgroundTextureAtlas;

    // Request a new render in request render mode after the next frame renders
    addWhitePixelCanvas(this._backgroundTextureAtlas);
  }

  const len = this._labelsToUpdate.length;
  for (let i = 0; i < len; ++i) {
    const label = this._labelsToUpdate[i];
    if (label.isDestroyed()) {
      continue;
    }

    const preUpdateGlyphCount = label._glyphs.length;

    if (label._rebindAllGlyphs) {
      rebindAllGlyphs(this, label);
      label._rebindAllGlyphs = false;
    }

    if (label._repositionAllGlyphs) {
      repositionAllGlyphs(label);
      label._repositionAllGlyphs = false;
    }

    const glyphCountDifference = label._glyphs.length - preUpdateGlyphCount;
    this._totalGlyphCount += glyphCountDifference;
  }

  const blendOption =
    backgroundBillboardCollection.length > 0
      ? BlendOption.TRANSLUCENT
      : this.blendOption;
  billboardCollection.blendOption = blendOption;
  backgroundBillboardCollection.blendOption = blendOption;

  billboardCollection._highlightColor = this._highlightColor;
  backgroundBillboardCollection._highlightColor = this._highlightColor;

  this._labelsToUpdate.length = 0;
  backgroundBillboardCollection.update(frameState);
  billboardCollection.update(frameState);
};

/**
 * 如果此对象已销毁，则返回 true;否则为 false。
 * <br /><br />
 * 如果此对象已销毁，则不应使用;调用
 * <code>isDestroyed</code> 将导致 {@link DeveloperError} 异常。
 *
 * @returns {boolean} 如果此对象被销毁，则为 True;否则为 false。
 *
 * @see LabelCollection#destroy
 */
LabelCollection.prototype.isDestroyed = function () {
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
 * labels = labels && labels.destroy();
 *
 * @see LabelCollection#isDestroyed
 */
LabelCollection.prototype.destroy = function () {
  this.removeAll();
  this._billboardCollection = this._billboardCollection.destroy();
  this._textureAtlas = this._textureAtlas && this._textureAtlas.destroy();
  this._backgroundBillboardCollection = this._backgroundBillboardCollection.destroy();
  this._backgroundTextureAtlas =
    this._backgroundTextureAtlas && this._backgroundTextureAtlas.destroy();

  return destroyObject(this);
};
export default LabelCollection;
