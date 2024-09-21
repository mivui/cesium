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
  PrimitivePipeline_default
} from "./chunk-OY2PM6KD.js";
import {
  createTaskProcessorWorker_default
} from "./chunk-MQTBSVWA.js";
import "./chunk-BMTWTAIJ.js";
import "./chunk-IMC23SHO.js";
import "./chunk-L2BCZNTG.js";
import "./chunk-ENYZ6UGV.js";
import "./chunk-LGB3RS4A.js";
import "./chunk-OUFMM5XG.js";
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
import "./chunk-PEGK2HPW.js";

// packages/engine/Source/Workers/combineGeometry.js
function combineGeometry(packedParameters, transferableObjects) {
  const parameters = PrimitivePipeline_default.unpackCombineGeometryParameters(
    packedParameters
  );
  const results = PrimitivePipeline_default.combineGeometry(parameters);
  return PrimitivePipeline_default.packCombineGeometryResults(
    results,
    transferableObjects
  );
}
var combineGeometry_default = createTaskProcessorWorker_default(combineGeometry);
export {
  combineGeometry_default as default
};
