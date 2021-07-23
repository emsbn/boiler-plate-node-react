var dataListener,
  storedProfile,
  storedLoginStudentList,
  storedAllStudentList,
  storedContentProgress,
  storedServerUrl,
  storedCameraRect,
  reservedVideoRecordMsg,
  notifyCallbacks = {},
  isInitialized = !1,
  isStartedVideoRecording = !1,
  isCameraReady = !1,
  UploadType = {
    INVALID: 0,
    BASE64: 1,
    IMG_FILE: 2,
    VIDEO_FILE: 3,
    AUDIO_FILE: 4,
  },
  curUploadType = UploadType.INVALID,
  canMoveContent = !0,
  reset = function () {
    (storedCameraRect =
      dataListener =
      reservedVideoRecordMsg =
      storedContentProgress =
        void 0),
      (isCameraReady = isStartedVideoRecording = !1);
  },
  checkReadyToStart = function () {
    isInitialized ||
      (storedProfile &&
        storedLoginStudentList &&
        storedAllStudentList &&
        notifyCallbacks.init &&
        (notifyCallbacks.init(), (isInitialized = !0)));
  },
  sendStartVideoRecordMsg = function () {
    window.parent.postMessage(
      { from: "content", type: "startVideoRecord" },
      "*"
    );
  },
  sendInitMsg = function () {
    window.parent.postMessage({ from: "content", type: "getServerHost" }, "*"),
      window.parent.postMessage(
        { from: "content", type: "loadContentProgress" },
        "*"
      ),
      window.parent.postMessage({ from: "content", type: "getMyProfile" }, "*"),
      window.parent.postMessage(
        { from: "content", type: "getLoginStudentsProfile" },
        "*"
      ),
      window.parent.postMessage(
        { from: "content", type: "getAllStudentsProfile" },
        "*"
      );
  };
sendInitMsg();
var ContentAPI = {};
function convertFilePath(e) {
  var t = e;
  return (
    -1 !== e.indexOf("[") &&
      (t = e.replace(/\[\"/gi, "").replace(/\"\]/gi, "")),
    t
  );
}
function handleRecvMsgTypeData(e) {
  void 0 !== dataListener && dataListener(e);
}
function handleRecvMsgTypeMsg(e) {
  for (
    var t = e.parameter || [],
      o = e.name.split("."),
      n = window,
      i = o.pop(),
      s = 0;
    s < o.length;
    s += 1
  )
    n = n[o[s]];
  n[i] && "function" == typeof n[i]
    ? n[i].apply(null, t)
    : console.info("message handler not exists :", e.name);
}
function handleRecvMsg(e) {
  "data" === e.type
    ? handleRecvMsgTypeData(e.data)
    : "msg" === e.type
    ? handleRecvMsgTypeMsg(e)
    : console.error("invalid network message type!:", e.type);
}
function handlePostMessage(e) {
  var t = {
      notifyStartContent: function (e) {
        console.info("recv notifyStartContent:", e), checkReadyToStart();
      },
      notifyReceiveMsg: function (e) {
        console.info("recv notifyReceiveMsg:", e), handleRecvMsg(e);
      },
      notifyMyProfile: function (e) {
        console.info("recv notifyMyProfileResult:", e),
          (storedProfile = {
            id: e.id,
            display_name: e.name,
            thumbnail:
              0 < e.defaultThumbnail.length
                ? e.defaultThumbnail
                : e.profileThumbnail,
          }),
          checkReadyToStart();
      },
      notifyAllStudentsProfile: function (e) {
        console.info("recv notifyAllStudentsProfile:", e),
          (storedAllStudentList = e.map(function (e) {
            return {
              id: e.id,
              display_name: e.name,
              thumbnail: e.defaultThumbnail,
            };
          })),
          checkReadyToStart();
      },
      notifyLoginStudentsProfile: function (e) {
        console.info("recv notifyLoginStudentsProfile:", e),
          (storedLoginStudentList = e.map(function (e) {
            return {
              id: e.id,
              display_name: e.name,
              thumbnail: e.defaultThumbnail,
            };
          })),
          console.info("storedLoginStudentList:", storedLoginStudentList),
          checkReadyToStart();
      },
      notifyContentProgress: function (e) {
        console.info("recv notifyTakePicture msg:", e),
          (storedContentProgress = e);
      },
      notifyTakePicture: function (e) {
        console.info("recv notifyTakePicture msg:", e),
          "success" === e.result
            ? notifyCallbacks.takePicture("image/jpg;base64," + e.src)
            : console.error("takePicture Error:", e);
      },
      notifyVideoRecordResult: function (e) {
        console.info("recv notifyVideoRecordResult", e),
          "success" === e.result
            ? notifyCallbacks.videoRecord
              ? notifyCallbacks.videoRecord(e.url)
              : (reservedVideoRecordMsg = e)
            : console.error("videoRecord Error:", e);
      },
      notifyDecibel: function (e) {
        console.info("recv notifyDecibel", e), notifyCallbacks.decibel(e.val);
      },
      notifyUploadToServerResult: function (e) {
        console.info(
          "recv notifyUploadToServerResult:",
          e,
          "curUploadType:",
          curUploadType
        );
        var t = curUploadType;
        if (((curUploadType = UploadType.INVALID), "success" === e.result)) {
          var o = e.url.split("8443")[1];
          t === UploadType.BASE64
            ? notifyCallbacks.uploadImage &&
              notifyCallbacks.uploadImage({ result: "succeeded", url: o })
            : t === UploadType.VIDEO_FILE
            ? notifyCallbacks.uploadVideoFile &&
              notifyCallbacks.uploadVideoFile({
                result: "succeed",
                url: JSON.stringify([o]),
              })
            : t === UploadType.AUDIO_FILE &&
              notifyCallbacks.uploadAudioFile &&
              notifyCallbacks.uploadAudioFile({
                result: "succeed",
                url: JSON.stringify([o]),
              });
        } else
          t === UploadType.BASE64
            ? notifyCallbacks.uploadImage &&
              notifyCallbacks.uploadImage({ result: "failed" })
            : t === UploadType.VIDEO_FILE
            ? notifyCallbacks.uploadVideoFile &&
              notifyCallbacks.uploadVideoFile({ result: "failed" })
            : t === UploadType.AUDIO_FILE &&
              notifyCallbacks.uploadAudioFile &&
              notifyCallbacks.uploadAudioFile({ result: "failed" }),
            console.error("uploadToServer Error:", e);
      },
      notifyVoiceRecordResult: function (e) {
        console.info("recv notifyVoiceRecordResult:", e),
          "success" === e.result
            ? notifyCallbacks.audioRecord && notifyCallbacks.audioRecord(e.url)
            : console.error("voiceRecord Error:", e);
      },
      notifyTTPickerResult: function (e) {
        console.info("recv notifyTTPickerResult:", e);
      },
      notifyTTMakeGroupResult: function (e) {
        console.info("recv notifyTTMakeGroupResult:", e);
      },
      notifyStudentLogin: function (e) {
        console.info("recv notifyStudentLogin:", e),
          window.parent.postMessage(
            { from: "content", type: "getLoginStudentsProfile" },
            "*"
          );
      },
      notifyStudentLogout: function (e) {
        console.info("recv notifyStudentLogout:", e),
          window.parent.postMessage(
            { from: "content", type: "getLoginStudentsProfile" },
            "*"
          );
      },
      notifyServerHost: function (e) {
        console.info("recv notifyServerHost:", e), (storedServerUrl = e.host);
      },
      notifyDeviceOrientationResult: function (e) {
        console.info("recv notifyDeviceOrientationResult:", e);
      },
      notifyStartCamera: function (e) {
        (isCameraReady = !0),
          isStartedVideoRecording && sendStartVideoRecordMsg();
      },
    },
    o = e.data;
  t[o.type] && t[o.type](o.msg);
}
(ContentAPI.init = function (e) {
  console.info("ContentAPI init"),
    reset(),
    (notifyCallbacks.init = e),
    setTimeout(function () {
      window.parent.postMessage({ from: "content", type: "init" }, "*");
    }, 500);
}),
  (ContentAPI.moveNextContent = function () {
    canMoveContent &&
      ((canMoveContent = !1),
      console.info("ContentAPI moveNextContent"),
      reset(),
      window.parent.postMessage(
        { from: "content", type: "moveNextContent" },
        "*"
      ));
  }),
  (ContentAPI.movePrevContent = function () {
    canMoveContent &&
      ((canMoveContent = !1),
      console.info("ContentAPI movePrevContent"),
      reset(),
      window.parent.postMessage(
        { from: "content", type: "movePrevContent" },
        "*"
      ));
  }),
  (ContentAPI.finishContent = function () {}),
  (ContentAPI.sendDataToTeacher = function (e) {
    console.info("ContentAPI sendDataToTeacher"),
      window.parent.postMessage(
        {
          from: "content",
          type: "sendMsgToTeacher",
          msg: { type: "data", data: e },
        },
        "*"
      );
  }),
  (ContentAPI.broadcastDataToStudent = function (e) {
    console.info("ContentAPI broadcastDataToStudent data:", e),
      window.parent.postMessage(
        {
          from: "content",
          type: "broadcastMsgToStudents",
          msg: { type: "data", data: e },
        },
        "*"
      );
  }),
  (ContentAPI.broadcastDataToAll = function (e) {
    console.info("ContentAPI broadcastDataToAll"),
      ContentAPI.sendDataToTeacher(e),
      ContentAPI.broadcastDataToStudent(e);
  }),
  (ContentAPI.sendDataToStudent = function (e, t) {
    console.info("ContentAPI sendDataToStudent"),
      window.parent.postMessage(
        {
          from: "content",
          type: "sendMsgToStudent",
          msg: { id: e, data: { type: "data", data: t } },
        },
        "*"
      );
  }),
  (ContentAPI.setDataListener = function (e) {
    console.info("setDataListener"), (dataListener = e);
  }),
  (ContentAPI.dispatchData = function (e) {
    console.info("ContentAPI dispatchData"),
      void 0 !== dataListener && dataListener(e);
  }),
  (ContentAPI.sendMsgToTeacher = function (e, t) {
    console.info("ContentAPI sendMsgToTeacher:", e),
      window.parent.postMessage(
        {
          from: "content",
          type: "sendMsgToTeacher",
          msg: { type: "msg", name: e, parameter: t },
        },
        "*"
      );
  }),
  (ContentAPI.broadcastMsgToStudent = function (e, t) {
    console.info("ContentAPI broadcastMsgToStudent ", e),
      window.parent.postMessage(
        {
          from: "content",
          type: "broadcastMsgToStudents",
          msg: { type: "msg", name: e, parameter: t },
        },
        "*"
      );
  }),
  (ContentAPI.sendMsgToStudent = function (e, t, o) {
    console.info("ContentAPI sendMsgToStudent ", e, t),
      window.parent.postMessage(
        {
          from: "content",
          type: "sendMsgToStudent",
          msg: { id: e, data: { type: "msg", name: t, parameter: o } },
        },
        "*"
      );
  }),
  (ContentAPI.getLoginStudentCount = function () {
    return (
      console.info("ContentAPI getLoginStudentCount"),
      storedLoginStudentList ||
        console.error("not exist storedLoginStudentList!"),
      storedLoginStudentList.length
    );
  }),
  (ContentAPI.getLoginStudentList = function () {
    return (
      console.info("ContentAPI getLoginStudentList:", storedLoginStudentList),
      storedLoginStudentList ||
        console.error("not exist storedLoginStudentList!"),
      storedLoginStudentList
    );
  }),
  (ContentAPI.getAllStudentList = function () {
    return (
      console.info("ContentAPI getAllStudentList"),
      storedAllStudentList || console.error("not exist storedAllStudentList!"),
      storedAllStudentList
    );
  }),
  (ContentAPI.getMyInfo = function () {
    return (
      console.info("ContentAPI getMyInfo:", storedProfile),
      storedProfile || console.error("not exist storedProfile!"),
      storedProfile
    );
  }),
  (ContentAPI.reportStudyResult = function (e, t) {
    console.error("reportStudyResult studentId:", e, "datas:", t);
    for (var o = [], n = 0; n < t.length; n += 1)
      if (-1 !== t[n].indexOf("/asset/")) {
        var i = convertFilePath(t[n]);
        o.push(i);
      } else console.error("wings text study result:", t[n]);
    var s = [{ studentId: e, files: o }];
    window.parent.postMessage(
      { from: "content", type: "uploadInclassReport", msg: s },
      "*"
    );
  }),
  (ContentAPI.saveContentProgress = function (e) {
    console.info("ContentAPI saveContentProgress", e),
      window.parent.postMessage(
        { from: "content", type: "saveContentProgress", msg: e },
        "*"
      );
  }),
  (ContentAPI.loadContentProgress = function () {
    return (
      console.info("ContentAPI loadContentProgress :", storedContentProgress),
      storedContentProgress
    );
  }),
  (ContentAPI.startCamera = function (e, t, o, n) {
    console.info("ContentAPI startCamera", e, t, o, n),
      (storedCameraRect = { top: t, left: e, width: o, height: n }),
      delete notifyCallbacks.takePicture,
      window.parent.postMessage({ from: "content", type: "startCamera" }, "*");
  }),
  (ContentAPI.stopCamera = function () {
    console.info("ContentAPI stopCamera"),
      window.parent.postMessage({ from: "content", type: "stopCamera" }, "*");
  }),
  (ContentAPI.switchPictureCamera = function () {
    console.info("ContentAPI switchPictureCameraSwitch"),
      window.parent.postMessage({ from: "content", type: "switchCamera" }, "*");
  }),
  (ContentAPI.takePicture = function (e) {
    console.info("ContentAPI takePicture"),
      (notifyCallbacks.takePicture = e),
      window.parent.postMessage(
        {
          from: "content",
          type: "takePicture",
          msg: {
            top: storedCameraRect.top,
            left: storedCameraRect.left,
            width: storedCameraRect.width,
            height: storedCameraRect.height,
          },
        },
        "*"
      );
  }),
  (ContentAPI.prepareVideoRecord = function () {
    console.info("ContentAPI prepareVideoRecord"),
      (isCameraReady = !1),
      window.parent.postMessage({ from: "content", type: "startCamera" }, "*");
  }),
  (ContentAPI.startVideoRecord = function () {
    console.info("ContentAPI startVideoRecord"),
      (isStartedVideoRecording = !0),
      isCameraReady && sendStartVideoRecordMsg();
  }),
  (ContentAPI.stopVideoRecord = function () {
    console.info("ContentAPI stopVideoRecord"),
      isStartedVideoRecording &&
        ((isStartedVideoRecording = !1),
        window.parent.postMessage(
          { from: "content", type: "stopVideoRecord" },
          "*"
        ));
  }),
  (ContentAPI.switchVideoCamera = function () {
    console.info("ContentAPI switchVideoCamera"),
      window.parent.postMessage({ from: "content", type: "switchCamera" }, "*");
  }),
  (ContentAPI.finishVideoRecord = function (e) {
    console.info("ContentAPI finishVideoRecord"),
      isStartedVideoRecording && ContentAPI.stopVideoRecord(),
      window.parent.postMessage({ from: "content", type: "stopCamera" }, "*"),
      (notifyCallbacks.videoRecord = e),
      reservedVideoRecordMsg &&
        (notifyCallbacks.videoRecord(reservedVideoRecordMsg.url),
        (reservedVideoRecordMsg = void 0));
  }),
  (ContentAPI.startDetectAudioDecibel = function (e) {
    console.info("ContentAPI startDetectAudioDecibel"),
      (notifyCallbacks.decibel = e),
      window.parent.postMessage(
        { from: "content", type: "startDecibelCheck" },
        "*"
      );
  }),
  (ContentAPI.stopDetectAudioDecibel = function () {
    console.info("ContentAPI stopDetectAudioDecibel"),
      window.parent.postMessage(
        { from: "content", type: "stopDecibelCheck" },
        "*"
      ),
      delete notifyCallbacks.decibel;
  }),
  (ContentAPI.uploadImageToServer = function (e, t) {
    console.info("ContentAPI uploadImageToServer"),
      (notifyCallbacks.uploadImage = t),
      (curUploadType = UploadType.BASE64),
      window.parent.postMessage(
        { from: "content", type: "uploadImageToServer", msg: { src: e } },
        "*"
      );
  }),
  (ContentAPI.getServerUrl = function () {
    return (
      console.info("ContentAPI getServerUrl:", storedServerUrl), storedServerUrl
    );
  }),
  (ContentAPI.uploadVideoFile = function (e, t) {
    console.info("ContentAPI uploadVideoFile:", e),
      (notifyCallbacks.uploadVideoFile = t),
      (curUploadType = UploadType.VIDEO_FILE),
      window.parent.postMessage(
        { from: "content", type: "uploadFileToServer", msg: { url: e } },
        "*"
      );
  }),
  (ContentAPI.startAudioRecord = function () {
    console.info("ContentAPI startAudioRecord"),
      window.parent.postMessage(
        { from: "content", type: "startVoiceRecord" },
        "*"
      );
  }),
  (ContentAPI.stopAudioRecord = function (e) {
    console.info("ContentAPI finishAudioRecord"),
      (notifyCallbacks.audioRecord = e),
      window.parent.postMessage(
        { from: "content", type: "stopVoiceRecord" },
        "*"
      );
  }),
  (ContentAPI._onNotifyAudioRecordResult = function (e) {
    console.info("ContentAPI _onNotifyAudioRecordResult:", e),
      void 0 !== notifyCallbacks.audioRecord && notifyCallbacks.audioRecord(e);
  }),
  (ContentAPI.uploadAudioFile = function (e, t) {
    console.info("ContentAPI uploadAudioFile:", e),
      (notifyCallbacks.uploadAudioFile = t),
      (curUploadType = UploadType.AUDIO_FILE),
      window.parent.postMessage(
        { from: "content", type: "uploadFileToServer", msg: { url: e } },
        "*"
      );
  }),
  window.addEventListener("message", handlePostMessage),
  (window.ContentAPI = ContentAPI);
var Launcher = { Util: {} };
(Launcher.Util.convertThumbnailURL = function (e) {
  return (
    console.info("url", e),
    console.info("storedServerUrl:", storedServerUrl),
    "/data" === e.slice(0, 5) ? storedServerUrl + e : e
  );
}),
  (Launcher.ContentView = {}),
  (Launcher.ContentView.broadcastMsgToStudent = function (e, t) {
    ContentAPI.broadcastMsgToStudent(e, t);
  });
