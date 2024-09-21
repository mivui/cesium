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
  EllipsoidOutlineGeometry_default
} from "./chunk-D4GQTGNL.js";
import "./chunk-FV3MLJGP.js";
import "./chunk-ZBDGDBK2.js";
import "./chunk-JP6ZPURS.js";
import "./chunk-U66FIYYG.js";
import "./chunk-HGWGFEVB.js";
import "./chunk-SN5T47LR.js";
import "./chunk-KW2OIKTQ.js";
import "./chunk-FYRHILCW.js";
import "./chunk-5ABJKTVM.js";
import "./chunk-Z4V7FT2G.js";
import "./chunk-RZNWFFNM.js";
import "./chunk-UUQR5ZCE.js";
import "./chunk-ECSJ7KHH.js";
import {
  defined_default
} from "./chunk-PEGK2HPW.js";

// packages/engine/Source/Workers/createEllipsoidOutlineGeometry.js
function createEllipsoidOutlineGeometry(ellipsoidGeometry, offset) {
  if (defined_default(ellipsoidGeometry.buffer, offset)) {
    ellipsoidGeometry = EllipsoidOutlineGeometry_default.unpack(
      ellipsoidGeometry,
      offset
    );
  }
  return EllipsoidOutlineGeometry_default.createGeometry(ellipsoidGeometry);
}
var createEllipsoidOutlineGeometry_default = createEllipsoidOutlineGeometry;
export {
  createEllipsoidOutlineGeometry_default as default
};
