import defined from "../Core/defined.js";
import Event from "../Core/Event.js";
/**
 * 描述 KmlTour，它使用 KmlTourFlyTo 和 KmlTourWait 来
 * 在给定的时间间隔内将相机引导至指定的目的地。
 *
 * @alias KmlTour
 * @constructor
 *
 * @param {string} name 从 KML 解析的名称
 * @param {string} id 从 KML 解析的 id
 * @param {Array} playlist 数组，其中包含 KmlTourFlyTos 和 KmlTourWaitits
 *
 * @see KmlTourFlyTo
 * @see KmlTourWait
 *
 * @demo {@link https://sandcastle.cesium.com/?src=KML%20Tours.html|KML Tours}
 */
function KmlTour(name, id) {
  /**
   * kml gx：Tour 入口的 ID
   * @type {string}
   */
  this.id = id;
  /**
   * 旅游团名称
   * @type {string}
   */
  this.name = name;
  /**
   * 播放列表中当前条目的索引
   * @type {number}
   */
  this.playlistIndex = 0;
  /**
   * 播放列表条目数组
   * @type {Array}
   */
  this.playlist = [];
  /**
   * 巡演开始时将调用 Event，
   * 在任何播放列表条目开始播放之前。
   * @type Event
   */
  this.tourStart = new Event();
  /**
   * 当所有播放列表条目都
   * 已播放，或巡演播放被取消。
   *
   * 如果 tour 播放终止，则事件回调将
   * 使用 terminated=true 参数调用。
   * @type Event
   */
  this.tourEnd = new Event();
  /**
   * 当播放列表中的条目开始播放时，将调用 Event。
   *
   * 将调用 event callback，并将 curent entry 作为第一个参数。
   * @type Event
   */
  this.entryStart = new Event();
  /**
   * 当播放列表中的条目结束播放时，将调用 Event。
   *
   * 事件回调将使用以下参数调用：
   * 1.条目 - 条目
   * 2.terminated - 如果通过调用 {@link KmlTour#stop} 终止播放，则为 true。
   * @type Event
   */
  this.entryEnd = new Event();

  this._activeEntries = [];
}

/**
 * 将条目添加到此巡演播放列表中。
 *
 * @param {KmlTourFlyTo|KmlTourWait} entry 要添加到播放列表的条目。
 */
KmlTour.prototype.addPlaylistEntry = function (entry) {
  this.playlist.push(entry);
};

/**
 * 参加这次旅行。
 *
 * @param {CesiumWidget} widget 小部件。
 * @param {object} [cameraOptions] 这些选项将与 {@link Camera#flyTo} 合并
 * 选项。
 */
KmlTour.prototype.play = function (widget, cameraOptions) {
  this.tourStart.raiseEvent();

  const tour = this;
  playEntry.call(this, widget, cameraOptions, function (terminated) {
    tour.playlistIndex = 0;
    // Stop nonblocking entries
    if (!terminated) {
      cancelAllEntries(tour._activeEntries);
    }
    tour.tourEnd.raiseEvent(terminated);
  });
};

/**
 * 停止当前玩 tour。
 */
KmlTour.prototype.stop = function () {
  cancelAllEntries(this._activeEntries);
};

// Stop all activeEntries.
function cancelAllEntries(activeEntries) {
  for (
    let entry = activeEntries.pop();
    entry !== undefined;
    entry = activeEntries.pop()
  ) {
    entry.stop();
  }
}

// Play playlist entry.
// This function is called recursevly with playNext and iterates over all entries from playlist.
function playEntry(widget, cameraOptions, allDone) {
  const entry = this.playlist[this.playlistIndex];
  if (entry) {
    const _playNext = playNext.bind(this, widget, cameraOptions, allDone);
    this._activeEntries.push(entry);
    this.entryStart.raiseEvent(entry);
    if (entry.blocking) {
      entry.play(_playNext, widget.scene.camera, cameraOptions);
    } else {
      const tour = this;
      entry.play(function () {
        tour.entryEnd.raiseEvent(entry);
        const indx = tour._activeEntries.indexOf(entry);
        if (indx >= 0) {
          tour._activeEntries.splice(indx, 1);
        }
      });
      _playNext(widget, cameraOptions, allDone);
    }
  } else if (defined(allDone)) {
    allDone(false);
  }
}

// Increment playlistIndex and call playEntry if terminated isn't true.
function playNext(widget, cameraOptions, allDone, terminated) {
  const entry = this.playlist[this.playlistIndex];
  this.entryEnd.raiseEvent(entry, terminated);

  if (terminated) {
    allDone(terminated);
  } else {
    const indx = this._activeEntries.indexOf(entry);
    if (indx >= 0) {
      this._activeEntries.splice(indx, 1);
    }
    this.playlistIndex++;
    playEntry.call(this, widget, cameraOptions, allDone);
  }
}
export default KmlTour;
