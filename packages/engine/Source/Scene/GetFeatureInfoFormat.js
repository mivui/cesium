import Cartographic from "../Core/Cartographic.js";
import defined from "../Core/defined.js";
import DeveloperError from "../Core/DeveloperError.js";
import RuntimeError from "../Core/RuntimeError.js";
import ImageryLayerFeatureInfo from "./ImageryLayerFeatureInfo.js";

/**
 * 描述从 Web 地图服务 （WMS） 服务器请求 GetFeatureInfo 的格式。
 *
 * @alias GetFeatureInfoFormat
 * @constructor
 *
 * @param {string} type 期望从 GetFeatureInfo 请求获得的响应类型。 有效
 * 值为 'JSON'、'XML'、'HTML' 或 'text'。
 * @param {string} [format] 要从 WMS 服务器请求的信息格式。 这通常是一个
 * MIME 类型，例如 'application/json' 或 text/xml'。 如果未指定此参数，提供程序将请求 'json'
 * 使用 'application/json'，使用 'XML'，使用 'text/xml'，使用 'HTML'，使用 'text/html'，使用 'text/plain' 的 'text'。
 * @param {Function} [callback] 使用 WMS 服务器的 GetFeatureInfo 响应调用的函数
 * 以生成选取的 {@link ImageryLayerFeatureInfo} 实例的数组。 如果不指定该参数，
 * 使用响应类型的 default 函数。
 */
function GetFeatureInfoFormat(type, format, callback) {
  //>>includeStart('debug', pragmas.debug);
  if (!defined(type)) {
    throw new DeveloperError("type is required.");
  }
  //>>includeEnd('debug');

  this.type = type;

  if (!defined(format)) {
    if (type === "json") {
      format = "application/json";
    } else if (type === "xml") {
      format = "text/xml";
    } else if (type === "html") {
      format = "text/html";
    } else if (type === "text") {
      format = "text/plain";
    }
    //>>includeStart('debug', pragmas.debug);
    else {
      throw new DeveloperError(
        'format is required when type is not "json", "xml", "html", or "text".'
      );
    }
    //>>includeEnd('debug');
  }

  this.format = format;

  if (!defined(callback)) {
    if (type === "json") {
      callback = geoJsonToFeatureInfo;
    } else if (type === "xml") {
      callback = xmlToFeatureInfo;
    } else if (type === "html") {
      callback = textToFeatureInfo;
    } else if (type === "text") {
      callback = textToFeatureInfo;
    }
    //>>includeStart('debug', pragmas.debug);
    else {
      throw new DeveloperError(
        'callback is required when type is not "json", "xml", "html", or "text".'
      );
    }
    //>>includeEnd('debug');
  }

  this.callback = callback;
}

function geoJsonToFeatureInfo(json) {
  const result = [];

  const features = json.features;
  for (let i = 0; i < features.length; ++i) {
    const feature = features[i];

    const featureInfo = new ImageryLayerFeatureInfo();
    featureInfo.data = feature;
    featureInfo.properties = feature.properties;
    featureInfo.configureNameFromProperties(feature.properties);
    featureInfo.configureDescriptionFromProperties(feature.properties);

    // If this is a point feature, use the coordinates of the point.
    if (defined(feature.geometry) && feature.geometry.type === "Point") {
      const longitude = feature.geometry.coordinates[0];
      const latitude = feature.geometry.coordinates[1];
      featureInfo.position = Cartographic.fromDegrees(longitude, latitude);
    }

    result.push(featureInfo);
  }

  return result;
}

const mapInfoMxpNamespace = "http://www.mapinfo.com/mxp";
const esriWmsNamespace = "http://www.esri.com/wms";
const wfsNamespace = "http://www.opengis.net/wfs";
const gmlNamespace = "http://www.opengis.net/gml";

function xmlToFeatureInfo(xml) {
  const documentElement = xml.documentElement;
  if (
    documentElement.localName === "MultiFeatureCollection" &&
    documentElement.namespaceURI === mapInfoMxpNamespace
  ) {
    // This looks like a MapInfo MXP response
    return mapInfoXmlToFeatureInfo(xml);
  } else if (
    documentElement.localName === "FeatureInfoResponse" &&
    documentElement.namespaceURI === esriWmsNamespace
  ) {
    // This looks like an Esri WMS response
    return esriXmlToFeatureInfo(xml);
  } else if (
    documentElement.localName === "FeatureCollection" &&
    documentElement.namespaceURI === wfsNamespace
  ) {
    // This looks like a WFS/GML response.
    return gmlToFeatureInfo(xml);
  } else if (documentElement.localName === "ServiceExceptionReport") {
    // This looks like a WMS server error, so no features picked.
    throw new RuntimeError(
      new XMLSerializer().serializeToString(documentElement)
    );
  } else if (documentElement.localName === "msGMLOutput") {
    return msGmlToFeatureInfo(xml);
  } else {
    // Unknown response type, so just dump the XML itself into the description.
    return unknownXmlToFeatureInfo(xml);
  }
}

function mapInfoXmlToFeatureInfo(xml) {
  const result = [];

  const multiFeatureCollection = xml.documentElement;

  const features = multiFeatureCollection.getElementsByTagNameNS(
    mapInfoMxpNamespace,
    "Feature"
  );
  for (let featureIndex = 0; featureIndex < features.length; ++featureIndex) {
    const feature = features[featureIndex];

    const properties = {};

    const propertyElements = feature.getElementsByTagNameNS(
      mapInfoMxpNamespace,
      "Val"
    );
    for (
      let propertyIndex = 0;
      propertyIndex < propertyElements.length;
      ++propertyIndex
    ) {
      const propertyElement = propertyElements[propertyIndex];
      if (propertyElement.hasAttribute("ref")) {
        const name = propertyElement.getAttribute("ref");
        const value = propertyElement.textContent.trim();
        properties[name] = value;
      }
    }

    const featureInfo = new ImageryLayerFeatureInfo();
    featureInfo.data = feature;
    featureInfo.properties = properties;
    featureInfo.configureNameFromProperties(properties);
    featureInfo.configureDescriptionFromProperties(properties);
    result.push(featureInfo);
  }

  return result;
}

function esriXmlToFeatureInfo(xml) {
  const featureInfoResponse = xml.documentElement;
  const result = [];
  let properties;

  const features = featureInfoResponse.getElementsByTagNameNS("*", "FIELDS");
  if (features.length > 0) {
    // Standard esri format
    for (let featureIndex = 0; featureIndex < features.length; ++featureIndex) {
      const feature = features[featureIndex];

      properties = {};

      const propertyAttributes = feature.attributes;
      for (
        let attributeIndex = 0;
        attributeIndex < propertyAttributes.length;
        ++attributeIndex
      ) {
        const attribute = propertyAttributes[attributeIndex];
        properties[attribute.name] = attribute.value;
      }

      result.push(
        imageryLayerFeatureInfoFromDataAndProperties(feature, properties)
      );
    }
  } else {
    // Thredds format -- looks like esri, but instead of containing FIELDS, contains FeatureInfo element
    const featureInfoElements = featureInfoResponse.getElementsByTagNameNS(
      "*",
      "FeatureInfo"
    );
    for (
      let featureInfoElementIndex = 0;
      featureInfoElementIndex < featureInfoElements.length;
      ++featureInfoElementIndex
    ) {
      const featureInfoElement = featureInfoElements[featureInfoElementIndex];

      properties = {};

      // node.children is not supported in IE9-11, so use childNodes and check that child.nodeType is an element
      const featureInfoChildren = featureInfoElement.childNodes;
      for (
        let childIndex = 0;
        childIndex < featureInfoChildren.length;
        ++childIndex
      ) {
        const child = featureInfoChildren[childIndex];
        if (child.nodeType === Node.ELEMENT_NODE) {
          properties[child.localName] = child.textContent;
        }
      }

      result.push(
        imageryLayerFeatureInfoFromDataAndProperties(
          featureInfoElement,
          properties
        )
      );
    }
  }

  return result;
}

function gmlToFeatureInfo(xml) {
  const result = [];

  const featureCollection = xml.documentElement;

  const featureMembers = featureCollection.getElementsByTagNameNS(
    gmlNamespace,
    "featureMember"
  );
  for (
    let featureIndex = 0;
    featureIndex < featureMembers.length;
    ++featureIndex
  ) {
    const featureMember = featureMembers[featureIndex];

    const properties = {};
    getGmlPropertiesRecursively(featureMember, properties);
    result.push(
      imageryLayerFeatureInfoFromDataAndProperties(featureMember, properties)
    );
  }

  return result;
}

// msGmlToFeatureInfo is similar to gmlToFeatureInfo, but assumes different XML structure
// eg. <msGMLOutput> <ABC_layer> <ABC_feature> <foo>bar</foo> ... </ABC_feature> </ABC_layer> </msGMLOutput>

function msGmlToFeatureInfo(xml) {
  const result = [];

  // Find the first child. Except for IE, this would work:
  // const layer = xml.documentElement.children[0];
  let layer;
  const children = xml.documentElement.childNodes;
  for (let i = 0; i < children.length; i++) {
    if (children[i].nodeType === Node.ELEMENT_NODE) {
      layer = children[i];
      break;
    }
  }
  if (!defined(layer)) {
    throw new RuntimeError(
      "Unable to find first child of the feature info xml document"
    );
  }
  const featureMembers = layer.childNodes;
  for (
    let featureIndex = 0;
    featureIndex < featureMembers.length;
    ++featureIndex
  ) {
    const featureMember = featureMembers[featureIndex];
    if (featureMember.nodeType === Node.ELEMENT_NODE) {
      const properties = {};
      getGmlPropertiesRecursively(featureMember, properties);
      result.push(
        imageryLayerFeatureInfoFromDataAndProperties(featureMember, properties)
      );
    }
  }

  return result;
}

function getGmlPropertiesRecursively(gmlNode, properties) {
  let isSingleValue = true;

  for (let i = 0; i < gmlNode.childNodes.length; ++i) {
    const child = gmlNode.childNodes[i];

    if (child.nodeType === Node.ELEMENT_NODE) {
      isSingleValue = false;
    }

    if (
      child.localName === "Point" ||
      child.localName === "LineString" ||
      child.localName === "Polygon" ||
      child.localName === "boundedBy"
    ) {
      continue;
    }

    if (
      child.hasChildNodes() &&
      getGmlPropertiesRecursively(child, properties)
    ) {
      properties[child.localName] = child.textContent;
    }
  }

  return isSingleValue;
}

function imageryLayerFeatureInfoFromDataAndProperties(data, properties) {
  const featureInfo = new ImageryLayerFeatureInfo();
  featureInfo.data = data;
  featureInfo.properties = properties;
  featureInfo.configureNameFromProperties(properties);
  featureInfo.configureDescriptionFromProperties(properties);
  return featureInfo;
}

function unknownXmlToFeatureInfo(xml) {
  const xmlText = new XMLSerializer().serializeToString(xml);

  const element = document.createElement("div");
  const pre = document.createElement("pre");
  pre.textContent = xmlText;
  element.appendChild(pre);

  const featureInfo = new ImageryLayerFeatureInfo();
  featureInfo.data = xml;
  featureInfo.description = element.innerHTML;
  return [featureInfo];
}

const emptyBodyRegex = /<body>\s*<\/body>/im;
const wmsServiceExceptionReportRegex = /<ServiceExceptionReport([\s\S]*)<\/ServiceExceptionReport>/im;
const titleRegex = /<title>([\s\S]*)<\/title>/im;

function textToFeatureInfo(text) {
  // If the text is HTML and it has an empty body tag, assume it means no features were found.
  if (emptyBodyRegex.test(text)) {
    return undefined;
  }

  // If this is a WMS exception report, treat it as "no features found" rather than showing
  // bogus feature info.
  if (wmsServiceExceptionReportRegex.test(text)) {
    return undefined;
  }

  // If the text has a <title> element, use it as the name.
  let name;
  const title = titleRegex.exec(text);
  if (title && title.length > 1) {
    name = title[1];
  }

  const featureInfo = new ImageryLayerFeatureInfo();
  featureInfo.name = name;
  featureInfo.description = text;
  featureInfo.data = text;
  return [featureInfo];
}
export default GetFeatureInfoFormat;
