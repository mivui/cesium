/**
 * @license
 * Cesium - https://github.com/CesiumGS/cesium
 * Version 1.121.1
 *
 * Copyright 2011-2022 Cesium Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Columbus View (Pat. Pend.)
 *
 * Portions licensed separately.
 * See https://github.com/CesiumGS/cesium/blob/main/LICENSE.md for full licensing details.
 */

import {
  EllipseOutlineGeometry_default
} from "./chunk-GD7L4FKA.js";
import "./chunk-DV3Y3SIG.js";
import "./chunk-FV3MLJGP.js";
import "./chunk-ZBDGDBK2.js";
import "./chunk-JP6ZPURS.js";
import "./chunk-U66FIYYG.js";
import "./chunk-HGWGFEVB.js";
import "./chunk-SN5T47LR.js";
import "./chunk-KW2OIKTQ.js";
import {
  Cartesian3_default,
  Ellipsoid_default
} from "./chunk-FYRHILCW.js";
import "./chunk-5ABJKTVM.js";
import "./chunk-Z4V7FT2G.js";
import "./chunk-RZNWFFNM.js";
import "./chunk-UUQR5ZCE.js";
import "./chunk-ECSJ7KHH.js";
import {
  defined_default
} from "./chunk-PEGK2HPW.js";

// packages/engine/Source/Workers/createEllipseOutlineGeometry.js
function createEllipseOutlineGeometry(ellipseGeometry, offset) {
  if (defined_default(offset)) {
    ellipseGeometry = EllipseOutlineGeometry_default.unpack(ellipseGeometry, offset);
  }
  ellipseGeometry._center = Cartesian3_default.clone(ellipseGeometry._center);
  ellipseGeometry._ellipsoid = Ellipsoid_default.clone(ellipseGeometry._ellipsoid);
  return EllipseOutlineGeometry_default.createGeometry(ellipseGeometry);
}
var createEllipseOutlineGeometry_default = createEllipseOutlineGeometry;
export {
  createEllipseOutlineGeometry_default as default
};
