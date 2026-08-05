// This code implements the `-sMODULARIZE` settings by taking the generated
// JS program code (INNER_JS_CODE) and wrapping it in a factory function.

// Single threaded MINIMAL_RUNTIME programs do not need access to
// document.currentScript, so a simple export declaration is enough.
var SlateCoreModule = (() => {
  // When MODULARIZE this JS may be executed later,
  // after document.currentScript is gone, so we save it.
  // In EXPORT_ES6 mode we can just use 'import.meta.url'.
  var _scriptName = globalThis.document?.currentScript?.src;
  return async function(moduleArg = {}) {
    var Module = moduleArg;
// include: shell.js
// include: minimum_runtime_check.js
// end include: minimum_runtime_check.js
// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(moduleArg) => Promise<Module>
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

// Attempt to auto-detect the environment
var ENVIRONMENT_IS_WEB = !!globalThis.window;
var ENVIRONMENT_IS_WORKER = !!globalThis.WorkerGlobalScope;
// N.b. Electron.js environment is simultaneously a NODE-environment, but
// also a web environment.
var ENVIRONMENT_IS_NODE = globalThis.process?.versions?.node && globalThis.process?.type != 'renderer';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)
// include: C:\Users\defes\AppData\Local\Temp\tmp97pmakpo.js

  if (!Module['expectedDataFileDownloads']) Module['expectedDataFileDownloads'] = 0;
  Module['expectedDataFileDownloads']++;
  (() => {
    // Do not attempt to redownload the virtual filesystem data when in a pthread or a Wasm Worker context.
    var isPthread = typeof ENVIRONMENT_IS_PTHREAD != 'undefined' && ENVIRONMENT_IS_PTHREAD;
    var isWasmWorker = typeof ENVIRONMENT_IS_WASM_WORKER != 'undefined' && ENVIRONMENT_IS_WASM_WORKER;
    if (isPthread || isWasmWorker) return;
    var isNode = globalThis.process && globalThis.process.versions && globalThis.process.versions.node && globalThis.process.type != 'renderer';
    async function loadPackage(metadata) {

      var PACKAGE_PATH = '';
      if (typeof window === 'object') {
        PACKAGE_PATH = window['encodeURIComponent'](window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/')) + '/');
      } else if (typeof process === 'undefined' && typeof location !== 'undefined') {
        // web worker
        PACKAGE_PATH = encodeURIComponent(location.pathname.substring(0, location.pathname.lastIndexOf('/')) + '/');
      }
      var PACKAGE_NAME = 'D:/Projects/ImGuiStudio/slate-wasm/web/studio-probe.data';
      var REMOTE_PACKAGE_BASE = 'studio-probe.data';
      var REMOTE_PACKAGE_NAME = Module['locateFile'] ? Module['locateFile'](REMOTE_PACKAGE_BASE, '') : REMOTE_PACKAGE_BASE;
      var REMOTE_PACKAGE_SIZE = metadata['remote_package_size'];

      async function fetchRemotePackage(packageName, packageSize) {
        if (isNode) {
          var contents = require('fs').readFileSync(packageName);
          return new Uint8Array(contents).buffer;
        }
        if (!Module['dataFileDownloads']) Module['dataFileDownloads'] = {};
        try {
          var response = await fetch(packageName);
        } catch (e) {
          throw new Error(`Network Error: ${packageName}`, {e});
        }
        if (!response.ok) {
          throw new Error(`${response.status}: ${response.url}`);
        }

        const chunks = [];
        const headers = response.headers;
        const total = Number(headers.get('Content-Length') || packageSize);
        let loaded = 0;

        Module['setStatus'] && Module['setStatus']('Downloading data...');
        const reader = response.body.getReader();

        while (1) {
          var {done, value} = await reader.read();
          if (done) break;
          chunks.push(value);
          loaded += value.length;
          Module['dataFileDownloads'][packageName] = {loaded, total};

          let totalLoaded = 0;
          let totalSize = 0;

          for (const download of Object.values(Module['dataFileDownloads'])) {
            totalLoaded += download.loaded;
            totalSize += download.total;
          }

          Module['setStatus'] && Module['setStatus'](`Downloading data... (${totalLoaded}/${totalSize})`);
        }

        const packageData = new Uint8Array(chunks.map((c) => c.length).reduce((a, b) => a + b, 0));
        let offset = 0;
        for (const chunk of chunks) {
          packageData.set(chunk, offset);
          offset += chunk.length;
        }
        return packageData.buffer;
      }

      var fetchPromise;
      var fetched = Module['getPreloadedPackage'] && Module['getPreloadedPackage'](REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE);

      if (!fetched) {
        // Note that we don't use await here because we want to execute the
        // the rest of this function immediately.
        fetchPromise = fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE);
      }

    async function runWithFS(Module) {

      function assert(check, msg) {
        if (!check) throw new Error(msg);
      }
Module['FS_createPath']("/", "Engine", true, true);
Module['FS_createPath']("/Engine", "Content", true, true);
Module['FS_createPath']("/Engine/Content", "Slate", true, true);
Module['FS_createPath']("/Engine/Content/Slate", "Automation", true, true);
Module['FS_createPath']("/Engine/Content/Slate", "Common", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Common", "Window", true, true);
Module['FS_createPath']("/Engine/Content/Slate", "CrashTracker", true, true);
Module['FS_createPath']("/Engine/Content/Slate", "Cursor", true, true);
Module['FS_createPath']("/Engine/Content/Slate", "Docking", true, true);
Module['FS_createPath']("/Engine/Content/Slate", "Fonts", true, true);
Module['FS_createPath']("/Engine/Content/Slate", "Icons", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Icons", "Edit", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Icons", "Navigation", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Icons", "PIEWindow", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Icons", "Profiler", true, true);
Module['FS_createPath']("/Engine/Content/Slate", "Launcher", true, true);
Module['FS_createPath']("/Engine/Content/Slate", "MessageLog", true, true);
Module['FS_createPath']("/Engine/Content/Slate", "Old", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Old", "Tiles", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Old/Tiles", "Outer", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Old/Tiles", "pin", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Old/Tiles", "selectionbar", true, true);
Module['FS_createPath']("/Engine/Content/Slate", "Starship", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Starship", "Common", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Starship", "CoreWidgets", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Starship/CoreWidgets", "CheckBox", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Starship/CoreWidgets", "ComboBox", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Starship/CoreWidgets", "FilterBar", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Starship/CoreWidgets", "NumericEntryBox", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Starship/CoreWidgets", "ProgressBar", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Starship/CoreWidgets", "SegmentedBox", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Starship/CoreWidgets", "TableView", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Starship/CoreWidgets", "Window", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Starship", "Docking", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Starship", "Insights", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Starship/Insights", "TraceTools", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Starship", "Launcher", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Starship", "Notifications", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Starship", "SourceControl", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Starship/SourceControl", "Status", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Starship", "StaticMeshEditor", true, true);
Module['FS_createPath']("/Engine/Content/Slate/Starship", "StatusBar", true, true);
Module['FS_createPath']("/Engine/Content/Slate", "Testing", true, true);
Module['FS_createPath']("/Engine/Content/Slate", "Tutorials", true, true);
Module['FS_createPath']("/Engine", "Shaders", true, true);
Module['FS_createPath']("/Engine/Shaders", "StandaloneRenderer", true, true);
Module['FS_createPath']("/Engine/Shaders/StandaloneRenderer", "OpenGL", true, true);

      async function processPackageData(arrayBuffer) {
        assert(arrayBuffer, 'Loading data file failed.');
        assert(arrayBuffer.constructor.name === ArrayBuffer.name, 'bad input to processPackageData ' + arrayBuffer.constructor.name);
        var byteArray = new Uint8Array(arrayBuffer);
        var curr;
        // Reuse the bytearray from the XHR as the source for file reads.
          for (var file of metadata['files']) {
            var name = file['filename'];
            var data = byteArray.subarray(file['start'], file['end']);
            // canOwn this data in the filesystem, it is a slice into the heap that will never change
        Module['FS_createDataFile'](name, null, data, true, true, true);
          }
          Module['removeRunDependency']('datafile_D:/Projects/ImGuiStudio/slate-wasm/web/studio-probe.data');
      }
      Module['addRunDependency']('datafile_D:/Projects/ImGuiStudio/slate-wasm/web/studio-probe.data');

      if (!Module['preloadResults']) Module['preloadResults'] = {};

      Module['preloadResults'][PACKAGE_NAME] = {fromCache: false};
      if (!fetched) {
        fetched = await fetchPromise;
      }
      await processPackageData(fetched);

    }
    // Detect whether the module JS file has already been loaded.
    if (Module['FS_createPath']) {
      runWithFS(Module);
    } else {
      if (!Module['preRun']) Module['preRun'] = [];
      Module['preRun'].push(runWithFS); // FS is not initialized yet, wait for it
    }

    }
    loadPackage({"files": [{"filename": "/Engine/Content/Slate/Automation/DeveloperDirectoryContent.png", "start": 0, "end": 5870}, {"filename": "/Engine/Content/Slate/Automation/EditorGroupBorder.png", "start": 5870, "end": 9092}, {"filename": "/Engine/Content/Slate/Automation/ErrorFilter.png", "start": 9092, "end": 15855}, {"filename": "/Engine/Content/Slate/Automation/ExcludedTestsFilter.png", "start": 15855, "end": 35688}, {"filename": "/Engine/Content/Slate/Automation/Fail.png", "start": 35688, "end": 53927}, {"filename": "/Engine/Content/Slate/Automation/GameGroupBorder.png", "start": 53927, "end": 57186}, {"filename": "/Engine/Content/Slate/Automation/Groups.png", "start": 57186, "end": 97222}, {"filename": "/Engine/Content/Slate/Automation/InProcess.png", "start": 97222, "end": 100735}, {"filename": "/Engine/Content/Slate/Automation/NoSessionWarning.png", "start": 100735, "end": 103699}, {"filename": "/Engine/Content/Slate/Automation/NotEnoughParticipants.png", "start": 103699, "end": 107032}, {"filename": "/Engine/Content/Slate/Automation/NotRun.png", "start": 107032, "end": 109878}, {"filename": "/Engine/Content/Slate/Automation/Participant.png", "start": 109878, "end": 113314}, {"filename": "/Engine/Content/Slate/Automation/ParticipantsWarning.png", "start": 113314, "end": 116647}, {"filename": "/Engine/Content/Slate/Automation/RefreshTests.png", "start": 116647, "end": 122389}, {"filename": "/Engine/Content/Slate/Automation/RefreshWorkers.png", "start": 122389, "end": 128759}, {"filename": "/Engine/Content/Slate/Automation/RunTests.png", "start": 128759, "end": 133377}, {"filename": "/Engine/Content/Slate/Automation/SmokeTest.png", "start": 133377, "end": 136565}, {"filename": "/Engine/Content/Slate/Automation/SmokeTestFilter.png", "start": 136565, "end": 143029}, {"filename": "/Engine/Content/Slate/Automation/SmokeTestParent.png", "start": 143029, "end": 146009}, {"filename": "/Engine/Content/Slate/Automation/StopTests.png", "start": 146009, "end": 150540}, {"filename": "/Engine/Content/Slate/Automation/Success.png", "start": 150540, "end": 168740}, {"filename": "/Engine/Content/Slate/Automation/TrackTestHistory.png", "start": 168740, "end": 177969}, {"filename": "/Engine/Content/Slate/Automation/VisualCommandlet.png", "start": 177969, "end": 183607}, {"filename": "/Engine/Content/Slate/Automation/Warning.png", "start": 183607, "end": 201719}, {"filename": "/Engine/Content/Slate/Automation/WarningFilter.png", "start": 201719, "end": 208425}, {"filename": "/Engine/Content/Slate/Checkerboard.png", "start": 208425, "end": 208769}, {"filename": "/Engine/Content/Slate/Common/BoxShadow.png", "start": 208769, "end": 209900}, {"filename": "/Engine/Content/Slate/Common/Button.png", "start": 209900, "end": 210383}, {"filename": "/Engine/Content/Slate/Common/Button_Disabled.png", "start": 210383, "end": 210895}, {"filename": "/Engine/Content/Slate/Common/Button_Hovered.png", "start": 210895, "end": 214247}, {"filename": "/Engine/Content/Slate/Common/Button_Pressed.png", "start": 214247, "end": 217242}, {"filename": "/Engine/Content/Slate/Common/Check.png", "start": 217242, "end": 217699}, {"filename": "/Engine/Content/Slate/Common/CheckBox.png", "start": 217699, "end": 218100}, {"filename": "/Engine/Content/Slate/Common/CheckBox_Checked.png", "start": 218100, "end": 218600}, {"filename": "/Engine/Content/Slate/Common/CheckBox_Checked_Hovered.png", "start": 218600, "end": 219110}, {"filename": "/Engine/Content/Slate/Common/CheckBox_Hovered.png", "start": 219110, "end": 219500}, {"filename": "/Engine/Content/Slate/Common/CheckBox_Undetermined.png", "start": 219500, "end": 219914}, {"filename": "/Engine/Content/Slate/Common/CheckBox_Undetermined_Hovered.png", "start": 219914, "end": 220332}, {"filename": "/Engine/Content/Slate/Common/Checker.png", "start": 220332, "end": 220692}, {"filename": "/Engine/Content/Slate/Common/Circle.png", "start": 220692, "end": 221065}, {"filename": "/Engine/Content/Slate/Common/ColorGradingWheel.png", "start": 221065, "end": 256291}, {"filename": "/Engine/Content/Slate/Common/ColorPicker_Mode_16x.png", "start": 256291, "end": 257234}, {"filename": "/Engine/Content/Slate/Common/ColorPicker_Separator.png", "start": 257234, "end": 257393}, {"filename": "/Engine/Content/Slate/Common/ColorPicker_SliderHandle.png", "start": 257393, "end": 257575}, {"filename": "/Engine/Content/Slate/Common/ColorSpectrum.png", "start": 257575, "end": 524408}, {"filename": "/Engine/Content/Slate/Common/ColorSpectrum_20x.png", "start": 524408, "end": 524940}, {"filename": "/Engine/Content/Slate/Common/ColorWheel.png", "start": 524940, "end": 596757}, {"filename": "/Engine/Content/Slate/Common/ColorWheel_20x.png", "start": 596757, "end": 597721}, {"filename": "/Engine/Content/Slate/Common/ColumnHeader.png", "start": 597721, "end": 598090}, {"filename": "/Engine/Content/Slate/Common/ColumnHeaderMenuButton_Hovered.png", "start": 598090, "end": 599889}, {"filename": "/Engine/Content/Slate/Common/ColumnHeaderMenuButton_Normal.png", "start": 599889, "end": 600239}, {"filename": "/Engine/Content/Slate/Common/ColumnHeader_Arrow.png", "start": 600239, "end": 600430}, {"filename": "/Engine/Content/Slate/Common/ColumnHeader_Hovered.png", "start": 600430, "end": 602155}, {"filename": "/Engine/Content/Slate/Common/ComboArrow.png", "start": 602155, "end": 602516}, {"filename": "/Engine/Content/Slate/Common/CursorPing.png", "start": 602516, "end": 605712}, {"filename": "/Engine/Content/Slate/Common/DarkGroupBorder.png", "start": 605712, "end": 606122}, {"filename": "/Engine/Content/Slate/Common/DebugBorder.png", "start": 606122, "end": 606496}, {"filename": "/Engine/Content/Slate/Common/Delimiter.png", "start": 606496, "end": 606899}, {"filename": "/Engine/Content/Slate/Common/DownArrow.png", "start": 606899, "end": 607260}, {"filename": "/Engine/Content/Slate/Common/DropZoneIndicator_Above.png", "start": 607260, "end": 622926}, {"filename": "/Engine/Content/Slate/Common/DropZoneIndicator_Below.png", "start": 622926, "end": 638396}, {"filename": "/Engine/Content/Slate/Common/DropZoneIndicator_Onto.png", "start": 638396, "end": 653995}, {"filename": "/Engine/Content/Slate/Common/EditableTextSelectionBackground.png", "start": 653995, "end": 654349}, {"filename": "/Engine/Content/Slate/Common/EventMessage_Default.png", "start": 654349, "end": 655002}, {"filename": "/Engine/Content/Slate/Common/ExpansionButton_CloseOverlay.png", "start": 655002, "end": 655470}, {"filename": "/Engine/Content/Slate/Common/GroupBorder.png", "start": 655470, "end": 655881}, {"filename": "/Engine/Content/Slate/Common/GroupBorder_Shape.png", "start": 655881, "end": 656051}, {"filename": "/Engine/Content/Slate/Common/HeaderSplitterGrip.png", "start": 656051, "end": 656398}, {"filename": "/Engine/Content/Slate/Common/LastColumnHeader_Hovered.png", "start": 656398, "end": 658093}, {"filename": "/Engine/Content/Slate/Common/LeftArrow.png", "start": 658093, "end": 660916}, {"filename": "/Engine/Content/Slate/Common/LightGroupBorder.png", "start": 660916, "end": 661361}, {"filename": "/Engine/Content/Slate/Common/NoiseBackground.png", "start": 661361, "end": 663597}, {"filename": "/Engine/Content/Slate/Common/PlainBorder.png", "start": 663597, "end": 663759}, {"filename": "/Engine/Content/Slate/Common/ProfileVisualizer_Mono.png", "start": 663759, "end": 666630}, {"filename": "/Engine/Content/Slate/Common/ProfileVisualizer_Normal.png", "start": 666630, "end": 669539}, {"filename": "/Engine/Content/Slate/Common/ProfileVisualizer_Selected.png", "start": 669539, "end": 672442}, {"filename": "/Engine/Content/Slate/Common/ProgressBar_Background.png", "start": 672442, "end": 672914}, {"filename": "/Engine/Content/Slate/Common/ProgressBar_Fill.png", "start": 672914, "end": 673335}, {"filename": "/Engine/Content/Slate/Common/ProgressBar_Marquee.png", "start": 673335, "end": 673923}, {"filename": "/Engine/Content/Slate/Common/RadioButton_SelectedBack_16x.png", "start": 673923, "end": 676954}, {"filename": "/Engine/Content/Slate/Common/RadioButton_Selected_16x.png", "start": 676954, "end": 677587}, {"filename": "/Engine/Content/Slate/Common/RadioButton_Unselected_16x.png", "start": 677587, "end": 694454}, {"filename": "/Engine/Content/Slate/Common/RoundedSelection_16x.png", "start": 694454, "end": 694832}, {"filename": "/Engine/Content/Slate/Common/ScrollBorderShadowBottom.png", "start": 694832, "end": 695316}, {"filename": "/Engine/Content/Slate/Common/ScrollBorderShadowTop.png", "start": 695316, "end": 695805}, {"filename": "/Engine/Content/Slate/Common/ScrollBoxShadowBottom.png", "start": 695805, "end": 696289}, {"filename": "/Engine/Content/Slate/Common/ScrollBoxShadowLeft.png", "start": 696289, "end": 696780}, {"filename": "/Engine/Content/Slate/Common/ScrollBoxShadowRight.png", "start": 696780, "end": 697271}, {"filename": "/Engine/Content/Slate/Common/ScrollBoxShadowTop.png", "start": 697271, "end": 697760}, {"filename": "/Engine/Content/Slate/Common/Scrollbar_Background_Horizontal.png", "start": 697760, "end": 698110}, {"filename": "/Engine/Content/Slate/Common/Scrollbar_Background_Vertical.png", "start": 698110, "end": 698455}, {"filename": "/Engine/Content/Slate/Common/Scrollbar_Thumb.png", "start": 698455, "end": 698852}, {"filename": "/Engine/Content/Slate/Common/SearchGlass.png", "start": 698852, "end": 699392}, {"filename": "/Engine/Content/Slate/Common/Selection.png", "start": 699392, "end": 699725}, {"filename": "/Engine/Content/Slate/Common/Selector.png", "start": 699725, "end": 700086}, {"filename": "/Engine/Content/Slate/Common/Separator.png", "start": 700086, "end": 700440}, {"filename": "/Engine/Content/Slate/Common/SmallCheck.png", "start": 700440, "end": 700897}, {"filename": "/Engine/Content/Slate/Common/SmallCheckBox.png", "start": 700897, "end": 701266}, {"filename": "/Engine/Content/Slate/Common/SmallCheckBox_Checked.png", "start": 701266, "end": 701755}, {"filename": "/Engine/Content/Slate/Common/SmallCheckBox_Checked_Hovered.png", "start": 701755, "end": 702220}, {"filename": "/Engine/Content/Slate/Common/SmallCheckBox_Hovered.png", "start": 702220, "end": 702590}, {"filename": "/Engine/Content/Slate/Common/SmallCheckBox_Undetermined.png", "start": 702590, "end": 705448}, {"filename": "/Engine/Content/Slate/Common/SmallCheckBox_Undetermined_Hovered.png", "start": 705448, "end": 708302}, {"filename": "/Engine/Content/Slate/Common/SortDownArrow.png", "start": 708302, "end": 708668}, {"filename": "/Engine/Content/Slate/Common/SortDownArrows.png", "start": 708668, "end": 709885}, {"filename": "/Engine/Content/Slate/Common/SortUpArrow.png", "start": 709885, "end": 710251}, {"filename": "/Engine/Content/Slate/Common/SortUpArrows.png", "start": 710251, "end": 711471}, {"filename": "/Engine/Content/Slate/Common/SpinArrows.png", "start": 711471, "end": 711891}, {"filename": "/Engine/Content/Slate/Common/Spinbox.png", "start": 711891, "end": 712295}, {"filename": "/Engine/Content/Slate/Common/Spinbox_Fill.png", "start": 712295, "end": 712781}, {"filename": "/Engine/Content/Slate/Common/Spinbox_Fill_Dark.png", "start": 712781, "end": 713313}, {"filename": "/Engine/Content/Slate/Common/Spinbox_Fill_Hovered.png", "start": 713313, "end": 713826}, {"filename": "/Engine/Content/Slate/Common/Spinbox_Fill_Hovered_Dark.png", "start": 713826, "end": 714375}, {"filename": "/Engine/Content/Slate/Common/Spinbox_Hovered.png", "start": 714375, "end": 714826}, {"filename": "/Engine/Content/Slate/Common/SplitterHandleHighlight.png", "start": 714826, "end": 715166}, {"filename": "/Engine/Content/Slate/Common/SubmenuArrow.png", "start": 715166, "end": 715538}, {"filename": "/Engine/Content/Slate/Common/TableViewHeader.png", "start": 715538, "end": 716064}, {"filename": "/Engine/Content/Slate/Common/TableViewMajorColumn.png", "start": 716064, "end": 716384}, {"filename": "/Engine/Content/Slate/Common/TextBlockHighlightShape.png", "start": 716384, "end": 716753}, {"filename": "/Engine/Content/Slate/Common/TextBlockHighlightShape_Empty.png", "start": 716753, "end": 717132}, {"filename": "/Engine/Content/Slate/Common/TextBox.png", "start": 717132, "end": 717537}, {"filename": "/Engine/Content/Slate/Common/TextBoxLabelBorder.png", "start": 717537, "end": 717936}, {"filename": "/Engine/Content/Slate/Common/TextBox_Dark.png", "start": 717936, "end": 718381}, {"filename": "/Engine/Content/Slate/Common/TextBox_Hovered.png", "start": 718381, "end": 718791}, {"filename": "/Engine/Content/Slate/Common/TextBox_Hovered_Dark.png", "start": 718791, "end": 719253}, {"filename": "/Engine/Content/Slate/Common/TextBox_ReadOnly.png", "start": 719253, "end": 719624}, {"filename": "/Engine/Content/Slate/Common/TextBox_Special.png", "start": 719624, "end": 720031}, {"filename": "/Engine/Content/Slate/Common/TextBox_Special_Hovered.png", "start": 720031, "end": 720505}, {"filename": "/Engine/Content/Slate/Common/Throbber_Piece.png", "start": 720505, "end": 720955}, {"filename": "/Engine/Content/Slate/Common/TreeArrow_Collapsed.png", "start": 720955, "end": 721327}, {"filename": "/Engine/Content/Slate/Common/TreeArrow_Collapsed_Hovered.png", "start": 721327, "end": 721696}, {"filename": "/Engine/Content/Slate/Common/TreeArrow_Expanded.png", "start": 721696, "end": 722063}, {"filename": "/Engine/Content/Slate/Common/TreeArrow_Expanded_Hovered.png", "start": 722063, "end": 722437}, {"filename": "/Engine/Content/Slate/Common/UpArrow.png", "start": 722437, "end": 722801}, {"filename": "/Engine/Content/Slate/Common/VerticalBoxDragIndicator.png", "start": 722801, "end": 723038}, {"filename": "/Engine/Content/Slate/Common/VerticalBoxDragIndicatorShort.png", "start": 723038, "end": 723386}, {"filename": "/Engine/Content/Slate/Common/VolumeControl_High.png", "start": 723386, "end": 723931}, {"filename": "/Engine/Content/Slate/Common/VolumeControl_Low.png", "start": 723931, "end": 724435}, {"filename": "/Engine/Content/Slate/Common/VolumeControl_Mid.png", "start": 724435, "end": 724962}, {"filename": "/Engine/Content/Slate/Common/VolumeControl_Muted.png", "start": 724962, "end": 725637}, {"filename": "/Engine/Content/Slate/Common/VolumeControl_Off.png", "start": 725637, "end": 726099}, {"filename": "/Engine/Content/Slate/Common/WhiteGroupBorder.png", "start": 726099, "end": 726530}, {"filename": "/Engine/Content/Slate/Common/Window/WindowBackground.png", "start": 726530, "end": 727027}, {"filename": "/Engine/Content/Slate/Common/Window/WindowBorder.png", "start": 727027, "end": 742472}, {"filename": "/Engine/Content/Slate/Common/Window/WindowButton_Close_Hovered.png", "start": 742472, "end": 743651}, {"filename": "/Engine/Content/Slate/Common/Window/WindowButton_Close_Normal.png", "start": 743651, "end": 744437}, {"filename": "/Engine/Content/Slate/Common/Window/WindowButton_Close_Pressed.png", "start": 744437, "end": 745202}, {"filename": "/Engine/Content/Slate/Common/Window/WindowButton_Maximize_Disabled.png", "start": 745202, "end": 748302}, {"filename": "/Engine/Content/Slate/Common/Window/WindowButton_Maximize_Hovered.png", "start": 748302, "end": 748884}, {"filename": "/Engine/Content/Slate/Common/Window/WindowButton_Maximize_Normal.png", "start": 748884, "end": 749278}, {"filename": "/Engine/Content/Slate/Common/Window/WindowButton_Maximize_Pressed.png", "start": 749278, "end": 749667}, {"filename": "/Engine/Content/Slate/Common/Window/WindowButton_Minimize_Disabled.png", "start": 749667, "end": 752743}, {"filename": "/Engine/Content/Slate/Common/Window/WindowButton_Minimize_Hovered.png", "start": 752743, "end": 753308}, {"filename": "/Engine/Content/Slate/Common/Window/WindowButton_Minimize_Normal.png", "start": 753308, "end": 753675}, {"filename": "/Engine/Content/Slate/Common/Window/WindowButton_Minimize_Pressed.png", "start": 753675, "end": 754030}, {"filename": "/Engine/Content/Slate/Common/Window/WindowButton_Restore_Hovered.png", "start": 754030, "end": 754668}, {"filename": "/Engine/Content/Slate/Common/Window/WindowButton_Restore_Normal.png", "start": 754668, "end": 755148}, {"filename": "/Engine/Content/Slate/Common/Window/WindowButton_Restore_Pressed.png", "start": 755148, "end": 755618}, {"filename": "/Engine/Content/Slate/Common/Window/WindowOutline.png", "start": 755618, "end": 756010}, {"filename": "/Engine/Content/Slate/Common/Window/WindowTitle.png", "start": 756010, "end": 756449}, {"filename": "/Engine/Content/Slate/Common/Window/WindowTitle_Flashing.png", "start": 756449, "end": 756865}, {"filename": "/Engine/Content/Slate/Common/Window/WindowTitle_Inactive.png", "start": 756865, "end": 757221}, {"filename": "/Engine/Content/Slate/Common/X.png", "start": 757221, "end": 757686}, {"filename": "/Engine/Content/Slate/Common/menu.svg", "start": 757686, "end": 758089}, {"filename": "/Engine/Content/Slate/CrashTracker/MouseCursor.png", "start": 758089, "end": 758407}, {"filename": "/Engine/Content/Slate/CrashTracker/Record.png", "start": 758407, "end": 760407}, {"filename": "/Engine/Content/Slate/Cursor/invisible.cur", "start": 760407, "end": 760733}, {"filename": "/Engine/Content/Slate/Docking/AppTabContentArea.png", "start": 760733, "end": 761102}, {"filename": "/Engine/Content/Slate/Docking/AppTabWellSeparator.png", "start": 761102, "end": 763901}, {"filename": "/Engine/Content/Slate/Docking/AppTab_Active.png", "start": 763901, "end": 767450}, {"filename": "/Engine/Content/Slate/Docking/AppTab_ColorOverlay.png", "start": 767450, "end": 768146}, {"filename": "/Engine/Content/Slate/Docking/AppTab_ColorOverlayIcon.png", "start": 768146, "end": 772176}, {"filename": "/Engine/Content/Slate/Docking/AppTab_Foreground.png", "start": 772176, "end": 773005}, {"filename": "/Engine/Content/Slate/Docking/AppTab_Hovered.png", "start": 773005, "end": 773769}, {"filename": "/Engine/Content/Slate/Docking/AppTab_Inactive.png", "start": 773769, "end": 774534}, {"filename": "/Engine/Content/Slate/Docking/CloseApp_Hovered.png", "start": 774534, "end": 775112}, {"filename": "/Engine/Content/Slate/Docking/CloseApp_Normal.png", "start": 775112, "end": 775541}, {"filename": "/Engine/Content/Slate/Docking/CloseApp_Pressed.png", "start": 775541, "end": 776070}, {"filename": "/Engine/Content/Slate/Docking/DockingIndicator_Center.png", "start": 776070, "end": 777152}, {"filename": "/Engine/Content/Slate/Docking/OuterDockingIndicator.png", "start": 777152, "end": 792745}, {"filename": "/Engine/Content/Slate/Docking/ShowTabwellButton_Hovered.png", "start": 792745, "end": 793133}, {"filename": "/Engine/Content/Slate/Docking/ShowTabwellButton_Normal.png", "start": 793133, "end": 793522}, {"filename": "/Engine/Content/Slate/Docking/ShowTabwellButton_Pressed.png", "start": 793522, "end": 793980}, {"filename": "/Engine/Content/Slate/Docking/TabContentArea.png", "start": 793980, "end": 796806}, {"filename": "/Engine/Content/Slate/Docking/TabWellSeparator.png", "start": 796806, "end": 799608}, {"filename": "/Engine/Content/Slate/Docking/Tab_Active.png", "start": 799608, "end": 802474}, {"filename": "/Engine/Content/Slate/Docking/Tab_ColorOverlay.png", "start": 802474, "end": 802951}, {"filename": "/Engine/Content/Slate/Docking/Tab_ColorOverlayIcon.png", "start": 802951, "end": 806981}, {"filename": "/Engine/Content/Slate/Docking/Tab_Foreground.png", "start": 806981, "end": 809813}, {"filename": "/Engine/Content/Slate/Docking/Tab_Hovered.png", "start": 809813, "end": 812651}, {"filename": "/Engine/Content/Slate/Docking/Tab_Inactive.png", "start": 812651, "end": 815489}, {"filename": "/Engine/Content/Slate/Docking/Tab_Shape.png", "start": 815489, "end": 815619}, {"filename": "/Engine/Content/Slate/Fonts/DroidSansMono.ttf", "start": 815619, "end": 893915}, {"filename": "/Engine/Content/Slate/Fonts/Roboto-Black.ttf", "start": 893915, "end": 1058851}, {"filename": "/Engine/Content/Slate/Fonts/Roboto-Bold.ttf", "start": 1058851, "end": 1222299}, {"filename": "/Engine/Content/Slate/Fonts/Roboto-BoldItalic.ttf", "start": 1222299, "end": 1388163}, {"filename": "/Engine/Content/Slate/Fonts/Roboto-Italic.ttf", "start": 1388163, "end": 1548899}, {"filename": "/Engine/Content/Slate/Fonts/Roboto-Light.ttf", "start": 1548899, "end": 1719319}, {"filename": "/Engine/Content/Slate/Fonts/Roboto-Medium.ttf", "start": 1719319, "end": 1890975}, {"filename": "/Engine/Content/Slate/Fonts/Roboto-Regular.ttf", "start": 1890975, "end": 2049579}, {"filename": "/Engine/Content/Slate/Icons/BackIcon.png", "start": 2049579, "end": 2050162}, {"filename": "/Engine/Content/Slate/Icons/Cross_12x.png", "start": 2050162, "end": 2050584}, {"filename": "/Engine/Content/Slate/Icons/DefaultAppIcon.png", "start": 2050584, "end": 2052073}, {"filename": "/Engine/Content/Slate/Icons/Edit/icon_Edit_Copy_16x.png", "start": 2052073, "end": 2062429}, {"filename": "/Engine/Content/Slate/Icons/Edit/icon_Edit_Cut_16x.png", "start": 2062429, "end": 2072711}, {"filename": "/Engine/Content/Slate/Icons/Edit/icon_Edit_Delete_16x.png", "start": 2072711, "end": 2083117}, {"filename": "/Engine/Content/Slate/Icons/Edit/icon_Edit_Duplicate_16x.png", "start": 2083117, "end": 2084612}, {"filename": "/Engine/Content/Slate/Icons/Edit/icon_Edit_Paste_16x.png", "start": 2084612, "end": 2094611}, {"filename": "/Engine/Content/Slate/Icons/Edit/icon_Edit_Rename_16x.png", "start": 2094611, "end": 2106436}, {"filename": "/Engine/Content/Slate/Icons/Empty_14x.png", "start": 2106436, "end": 2106787}, {"filename": "/Engine/Content/Slate/Icons/Navigation/candidate-arrow-down.svg", "start": 2106787, "end": 2107548}, {"filename": "/Engine/Content/Slate/Icons/Navigation/candidate-arrow-left.svg", "start": 2107548, "end": 2108312}, {"filename": "/Engine/Content/Slate/Icons/Navigation/candidate-arrow-right.svg", "start": 2108312, "end": 2109055}, {"filename": "/Engine/Content/Slate/Icons/Navigation/candidate-arrow-up.svg", "start": 2109055, "end": 2109760}, {"filename": "/Engine/Content/Slate/Icons/Navigation/focus-arrow-down.svg", "start": 2109760, "end": 2110441}, {"filename": "/Engine/Content/Slate/Icons/Navigation/focus-arrow-left.svg", "start": 2110441, "end": 2111127}, {"filename": "/Engine/Content/Slate/Icons/Navigation/focus-arrow-right.svg", "start": 2111127, "end": 2111793}, {"filename": "/Engine/Content/Slate/Icons/Navigation/focus-arrow-up.svg", "start": 2111793, "end": 2112449}, {"filename": "/Engine/Content/Slate/Icons/Navigation/target-arrow-down.svg", "start": 2112449, "end": 2113710}, {"filename": "/Engine/Content/Slate/Icons/Navigation/target-arrow-left.svg", "start": 2113710, "end": 2114914}, {"filename": "/Engine/Content/Slate/Icons/Navigation/target-arrow-right.svg", "start": 2114914, "end": 2116177}, {"filename": "/Engine/Content/Slate/Icons/Navigation/target-arrow-up.svg", "start": 2116177, "end": 2117413}, {"filename": "/Engine/Content/Slate/Icons/NextIcon.png", "start": 2117413, "end": 2117994}, {"filename": "/Engine/Content/Slate/Icons/PIEWindow/SmallRoundedButton.png", "start": 2117994, "end": 2121102}, {"filename": "/Engine/Content/Slate/Icons/PIEWindow/SmallRoundedButtonBottom.png", "start": 2121102, "end": 2124064}, {"filename": "/Engine/Content/Slate/Icons/PIEWindow/SmallRoundedButtonCentre.png", "start": 2124064, "end": 2124351}, {"filename": "/Engine/Content/Slate/Icons/PIEWindow/SmallRoundedButtonLeft.png", "start": 2124351, "end": 2127342}, {"filename": "/Engine/Content/Slate/Icons/PIEWindow/SmallRoundedButtonRight.png", "start": 2127342, "end": 2130330}, {"filename": "/Engine/Content/Slate/Icons/PIEWindow/SmallRoundedButtonTop.png", "start": 2130330, "end": 2133291}, {"filename": "/Engine/Content/Slate/Icons/PIEWindow/WindowButton_025x_Hovered.png", "start": 2133291, "end": 2137141}, {"filename": "/Engine/Content/Slate/Icons/PIEWindow/WindowButton_025x_Normal.png", "start": 2137141, "end": 2140721}, {"filename": "/Engine/Content/Slate/Icons/PIEWindow/WindowButton_025x_Pressed.png", "start": 2140721, "end": 2144252}, {"filename": "/Engine/Content/Slate/Icons/PIEWindow/WindowButton_05x_Hovered.png", "start": 2144252, "end": 2148136}, {"filename": "/Engine/Content/Slate/Icons/PIEWindow/WindowButton_05x_Normal.png", "start": 2148136, "end": 2151614}, {"filename": "/Engine/Content/Slate/Icons/PIEWindow/WindowButton_05x_Pressed.png", "start": 2151614, "end": 2155163}, {"filename": "/Engine/Content/Slate/Icons/PIEWindow/WindowButton_1x_Hovered.png", "start": 2155163, "end": 2158795}, {"filename": "/Engine/Content/Slate/Icons/PIEWindow/WindowButton_1x_Normal.png", "start": 2158795, "end": 2162131}, {"filename": "/Engine/Content/Slate/Icons/PIEWindow/WindowButton_1x_Pressed.png", "start": 2162131, "end": 2165452}, {"filename": "/Engine/Content/Slate/Icons/PIEWindow/WindowButton_Screen_Rotation_Hovered.png", "start": 2165452, "end": 2169781}, {"filename": "/Engine/Content/Slate/Icons/PIEWindow/WindowButton_Screen_Rotation_Normal.png", "start": 2169781, "end": 2174019}, {"filename": "/Engine/Content/Slate/Icons/PIEWindow/WindowButton_Screen_Rotation_Pressed.png", "start": 2174019, "end": 2178244}, {"filename": "/Engine/Content/Slate/Icons/PlusSymbol_12x.png", "start": 2178244, "end": 2178632}, {"filename": "/Engine/Content/Slate/Icons/Profiler/GroupBorder-16Gray.png", "start": 2178632, "end": 2181520}, {"filename": "/Engine/Content/Slate/Icons/Profiler/Profiler_Average_Event_Graph_16x.png", "start": 2181520, "end": 2185349}, {"filename": "/Engine/Content/Slate/Icons/Profiler/Profiler_Border_L_16x.png", "start": 2185349, "end": 2188198}, {"filename": "/Engine/Content/Slate/Icons/Profiler/Profiler_Border_R_16x.png", "start": 2188198, "end": 2191049}, {"filename": "/Engine/Content/Slate/Icons/Profiler/Profiler_Border_TB_16x.png", "start": 2191049, "end": 2193892}, {"filename": "/Engine/Content/Slate/Icons/Profiler/Profiler_Cull_Events_16x.png", "start": 2193892, "end": 2197721}, {"filename": "/Engine/Content/Slate/Icons/Profiler/Profiler_Culled_12x.png", "start": 2197721, "end": 2201098}, {"filename": "/Engine/Content/Slate/Icons/Profiler/Profiler_Custom_Tooltip_12x.png", "start": 2201098, "end": 2204475}, {"filename": "/Engine/Content/Slate/Icons/Profiler/Profiler_Data_Capture_40x.png", "start": 2204475, "end": 2213704}, {"filename": "/Engine/Content/Slate/Icons/Profiler/Profiler_Events_Flat_16x.png", "start": 2213704, "end": 2217533}, {"filename": "/Engine/Content/Slate/Icons/Profiler/Profiler_Events_Flat_Coalesced_16x.png", "start": 2217533, "end": 2221362}, {"filename": "/Engine/Content/Slate/Icons/Profiler/Profiler_Events_Hierarchial_16x.png", "start": 2221362, "end": 2225191}, {"filename": "/Engine/Content/Slate/Icons/Profiler/Profiler_FPS_Chart_40x.png", "start": 2225191, "end": 2234420}, {"filename": "/Engine/Content/Slate/Icons/Profiler/Profiler_Filter_Events_16x.png", "start": 2234420, "end": 2238249}, {"filename": "/Engine/Content/Slate/Icons/Profiler/Profiler_Filter_Presets_Tab_16x.png", "start": 2238249, "end": 2242078}, {"filename": "/Engine/Content/Slate/Icons/Profiler/Profiler_Filtered_12x.png", "start": 2242078, "end": 2245455}, {"filename": "/Engine/Content/Slate/Icons/Profiler/Profiler_Graph_View_Tab_16x.png", "start": 2245455, "end": 2249284}, {"filename": "/Engine/Content/Slate/Icons/Profiler/Profiler_Has_Culled_Children_12x.png", "start": 2249284, "end": 2252661}, {"filename": "/Engine/Content/Slate/Icons/Profiler/Profiler_History_Back_16x.png", "start": 2252661, "end": 2256490}, {"filename": "/Engine/Content/Slate/Icons/Profiler/Profiler_History_Fwd_16x.png", "start": 2256490, "end": 2260319}, {"filename": "/Engine/Content/Slate/Icons/Profiler/Profiler_LoadMultiple_Profiler_40x.png", "start": 2260319, "end": 2266276}, {"filename": "/Engine/Content/Slate/Icons/Profiler/Profiler_Load_Profiler_40x.png", "start": 2266276, "end": 2275505}, {"filename": "/Engine/Content/Slate/Icons/Profiler/Profiler_Max_Event_Graph_16x.png", "start": 2275505, "end": 2279334}, {"filename": "/Engine/Content/Slate/Icons/Profiler/Profiler_Settings_40x.png", "start": 2279334, "end": 2288563}, {"filename": "/Engine/Content/Slate/Icons/Profiler/Profiler_Tab_16x.png", "start": 2288563, "end": 2292392}, {"filename": "/Engine/Content/Slate/Icons/Profiler/Profiler_ThreadView_SampleBorder_16x.png", "start": 2292392, "end": 2292553}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_Calls_32x.png", "start": 2292553, "end": 2297398}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_CollapseAll_32x.png", "start": 2297398, "end": 2300582}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_CollapseSelection_32x.png", "start": 2300582, "end": 2303810}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_CollapseThread_32x.png", "start": 2303810, "end": 2308072}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_CopyToClipboard_32x.png", "start": 2308072, "end": 2312824}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_CulledEvents_12x.png", "start": 2312824, "end": 2315803}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_Disconnect_32x.png", "start": 2315803, "end": 2320625}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_Event_32x.png", "start": 2320625, "end": 2324639}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_ExpandAll_32x.png", "start": 2324639, "end": 2327800}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_ExpandHotPath_32x.png", "start": 2327800, "end": 2331886}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_ExpandSelection_32x.png", "start": 2331886, "end": 2335079}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_ExpandThread_32x.png", "start": 2335079, "end": 2339434}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_GameThread_32x.png", "start": 2339434, "end": 2344294}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_GenericFilter_32x.png", "start": 2344294, "end": 2348961}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_GenericGroup_32x.png", "start": 2348961, "end": 2353407}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_HotPath_32x.png", "start": 2353407, "end": 2357471}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_Memory_32x.png", "start": 2357471, "end": 2361800}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_Number_32x.png", "start": 2361800, "end": 2365988}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_OpenEventGraph_32x.png", "start": 2365988, "end": 2370852}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_RenderThread_32x.png", "start": 2370852, "end": 2375496}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_ResetColumn_32x.png", "start": 2375496, "end": 2380133}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_ResetToDefault_32x.png", "start": 2380133, "end": 2384300}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_SelectStack_32x.png", "start": 2384300, "end": 2389218}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_SetRoot_32x.png", "start": 2389218, "end": 2393827}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_ShowGraphData_32x.png", "start": 2393827, "end": 2397741}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_SortAscending_32x.png", "start": 2397741, "end": 2402167}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_SortBy_32x.png", "start": 2402167, "end": 2406995}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_SortDescending_32x.png", "start": 2406995, "end": 2411302}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_ViewColumn_32x.png", "start": 2411302, "end": 2416508}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_mem_40x.png", "start": 2416508, "end": 2422275}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_stats_40x.png", "start": 2422275, "end": 2427610}, {"filename": "/Engine/Content/Slate/Icons/Profiler/profiler_sync_40x.png", "start": 2427610, "end": 2433900}, {"filename": "/Engine/Content/Slate/Icons/TrashCan.png", "start": 2433900, "end": 2435992}, {"filename": "/Engine/Content/Slate/Icons/TrashCan_Small.png", "start": 2435992, "end": 2436706}, {"filename": "/Engine/Content/Slate/Icons/cursor_cardinal_cross.png", "start": 2436706, "end": 2437106}, {"filename": "/Engine/Content/Slate/Icons/cursor_grab.png", "start": 2437106, "end": 2437511}, {"filename": "/Engine/Content/Slate/Icons/denied_16x.png", "start": 2437511, "end": 2438036}, {"filename": "/Engine/Content/Slate/Icons/ellipsis_12x.png", "start": 2438036, "end": 2438403}, {"filename": "/Engine/Content/Slate/Icons/eyedropper_16px.png", "start": 2438403, "end": 2438808}, {"filename": "/Engine/Content/Slate/Icons/icon_Downloads_16x.png", "start": 2438808, "end": 2439330}, {"filename": "/Engine/Content/Slate/Icons/icon_error_16x.png", "start": 2439330, "end": 2440698}, {"filename": "/Engine/Content/Slate/Icons/icon_generic_toolbar.png", "start": 2440698, "end": 2444409}, {"filename": "/Engine/Content/Slate/Icons/icon_help_16x.png", "start": 2444409, "end": 2444844}, {"filename": "/Engine/Content/Slate/Icons/icon_info_16x.png", "start": 2444844, "end": 2445563}, {"filename": "/Engine/Content/Slate/Icons/icon_redo_16px.png", "start": 2445563, "end": 2446070}, {"filename": "/Engine/Content/Slate/Icons/icon_tab_Tools_16x.png", "start": 2446070, "end": 2447455}, {"filename": "/Engine/Content/Slate/Icons/icon_tab_WidgetReflector_16x.png", "start": 2447455, "end": 2448717}, {"filename": "/Engine/Content/Slate/Icons/icon_tab_WidgetReflector_40x.png", "start": 2448717, "end": 2451909}, {"filename": "/Engine/Content/Slate/Icons/icon_tab_toolbar_16px.png", "start": 2451909, "end": 2452590}, {"filename": "/Engine/Content/Slate/Icons/icon_undo_16px.png", "start": 2452590, "end": 2453102}, {"filename": "/Engine/Content/Slate/Icons/icon_warning_16x.png", "start": 2453102, "end": 2453835}, {"filename": "/Engine/Content/Slate/Icons/notificationlist_fail.png", "start": 2453835, "end": 2454109}, {"filename": "/Engine/Content/Slate/Icons/notificationlist_success.png", "start": 2454109, "end": 2454672}, {"filename": "/Engine/Content/Slate/Icons/toolbar_expand_16x.png", "start": 2454672, "end": 2455117}, {"filename": "/Engine/Content/Slate/Launcher/All_Platforms_128x.png", "start": 2455117, "end": 2523575}, {"filename": "/Engine/Content/Slate/Launcher/All_Platforms_24x.png", "start": 2523575, "end": 2528692}, {"filename": "/Engine/Content/Slate/Launcher/Instance_Commandlet.png", "start": 2528692, "end": 2529053}, {"filename": "/Engine/Content/Slate/Launcher/Instance_Editor.png", "start": 2529053, "end": 2530541}, {"filename": "/Engine/Content/Slate/Launcher/Instance_Game.png", "start": 2530541, "end": 2531604}, {"filename": "/Engine/Content/Slate/Launcher/Instance_Other.png", "start": 2531604, "end": 2532382}, {"filename": "/Engine/Content/Slate/Launcher/Instance_Server.png", "start": 2532382, "end": 2533319}, {"filename": "/Engine/Content/Slate/Launcher/Instance_Unknown.png", "start": 2533319, "end": 2534875}, {"filename": "/Engine/Content/Slate/Launcher/Launcher_Advanced.png", "start": 2534875, "end": 2538281}, {"filename": "/Engine/Content/Slate/Launcher/Launcher_Back.png", "start": 2538281, "end": 2540012}, {"filename": "/Engine/Content/Slate/Launcher/Launcher_Build.png", "start": 2540012, "end": 2542832}, {"filename": "/Engine/Content/Slate/Launcher/Launcher_Delete.png", "start": 2542832, "end": 2545778}, {"filename": "/Engine/Content/Slate/Launcher/Launcher_Deploy.png", "start": 2545778, "end": 2548804}, {"filename": "/Engine/Content/Slate/Launcher/Launcher_EditSettings.png", "start": 2548804, "end": 2552713}, {"filename": "/Engine/Content/Slate/Launcher/Launcher_Launch.png", "start": 2552713, "end": 2557558}, {"filename": "/Engine/Content/Slate/Launcher/Launcher_Run.png", "start": 2557558, "end": 2561622}, {"filename": "/Engine/Content/Slate/MessageLog/Log_Error.png", "start": 2561622, "end": 2562604}, {"filename": "/Engine/Content/Slate/MessageLog/Log_Note.png", "start": 2562604, "end": 2563081}, {"filename": "/Engine/Content/Slate/MessageLog/Log_Warning.png", "start": 2563081, "end": 2563672}, {"filename": "/Engine/Content/Slate/Old/Border.png", "start": 2563672, "end": 2564091}, {"filename": "/Engine/Content/Slate/Old/Button.png", "start": 2564091, "end": 2564565}, {"filename": "/Engine/Content/Slate/Old/DashedBorder.png", "start": 2564565, "end": 2565020}, {"filename": "/Engine/Content/Slate/Old/HyperlinkDotted.png", "start": 2565020, "end": 2565365}, {"filename": "/Engine/Content/Slate/Old/HyperlinkUnderline.png", "start": 2565365, "end": 2565710}, {"filename": "/Engine/Content/Slate/Old/Menu_Background.png", "start": 2565710, "end": 2566119}, {"filename": "/Engine/Content/Slate/Old/Menu_Background_Inverted_Border_Bold.png", "start": 2566119, "end": 2566469}, {"filename": "/Engine/Content/Slate/Old/Notification_Border_Flash.png", "start": 2566469, "end": 2581486}, {"filename": "/Engine/Content/Slate/Old/Tiles/ActionMenuButtonBG.png", "start": 2581486, "end": 2583211}, {"filename": "/Engine/Content/Slate/Old/Tiles/ArrowBox.png", "start": 2583211, "end": 2589241}, {"filename": "/Engine/Content/Slate/Old/Tiles/ArrowLeft.png", "start": 2589241, "end": 2595548}, {"filename": "/Engine/Content/Slate/Old/Tiles/Arrow_D.png", "start": 2595548, "end": 2604415}, {"filename": "/Engine/Content/Slate/Old/Tiles/Arrow_L.png", "start": 2604415, "end": 2613291}, {"filename": "/Engine/Content/Slate/Old/Tiles/Arrow_R.png", "start": 2613291, "end": 2622149}, {"filename": "/Engine/Content/Slate/Old/Tiles/Arrow_U.png", "start": 2622149, "end": 2631018}, {"filename": "/Engine/Content/Slate/Old/Tiles/BoxEdgeHighlight.png", "start": 2631018, "end": 2633956}, {"filename": "/Engine/Content/Slate/Old/Tiles/CalloutBox.png", "start": 2633956, "end": 2639815}, {"filename": "/Engine/Content/Slate/Old/Tiles/CalloutBox2.png", "start": 2639815, "end": 2645894}, {"filename": "/Engine/Content/Slate/Old/Tiles/CalloutBox3.png", "start": 2645894, "end": 2651915}, {"filename": "/Engine/Content/Slate/Old/Tiles/Callout_Background.png", "start": 2651915, "end": 2652288}, {"filename": "/Engine/Content/Slate/Old/Tiles/Callout_Glow.png", "start": 2652288, "end": 2652732}, {"filename": "/Engine/Content/Slate/Old/Tiles/Callout_Outline.png", "start": 2652732, "end": 2654424}, {"filename": "/Engine/Content/Slate/Old/Tiles/CircleBox.png", "start": 2654424, "end": 2663192}, {"filename": "/Engine/Content/Slate/Old/Tiles/CircleBox2.png", "start": 2663192, "end": 2667403}, {"filename": "/Engine/Content/Slate/Old/Tiles/CodeBlock_Background.png", "start": 2667403, "end": 2667554}, {"filename": "/Engine/Content/Slate/Old/Tiles/CodeBlock_Glow.png", "start": 2667554, "end": 2667971}, {"filename": "/Engine/Content/Slate/Old/Tiles/CodeBlock_Outline.png", "start": 2667971, "end": 2669422}, {"filename": "/Engine/Content/Slate/Old/Tiles/DiamondBox.png", "start": 2669422, "end": 2675458}, {"filename": "/Engine/Content/Slate/Old/Tiles/DiamondBox_B.png", "start": 2675458, "end": 2681358}, {"filename": "/Engine/Content/Slate/Old/Tiles/DiamondBox_T.png", "start": 2681358, "end": 2687476}, {"filename": "/Engine/Content/Slate/Old/Tiles/DottedCircleBox_L.png", "start": 2687476, "end": 2695926}, {"filename": "/Engine/Content/Slate/Old/Tiles/DottedCircleBox_LR.png", "start": 2695926, "end": 2704533}, {"filename": "/Engine/Content/Slate/Old/Tiles/DottedCircleBox_LR_E.png", "start": 2704533, "end": 2712977}, {"filename": "/Engine/Content/Slate/Old/Tiles/DottedCircleBox_L_E.png", "start": 2712977, "end": 2721131}, {"filename": "/Engine/Content/Slate/Old/Tiles/DottedCircleBox_R.png", "start": 2721131, "end": 2729854}, {"filename": "/Engine/Content/Slate/Old/Tiles/DottedCircleBox_R_E.png", "start": 2729854, "end": 2738309}, {"filename": "/Engine/Content/Slate/Old/Tiles/DottedSquareBox_L.png", "start": 2738309, "end": 2746390}, {"filename": "/Engine/Content/Slate/Old/Tiles/DottedSquareBox_LR.png", "start": 2746390, "end": 2754529}, {"filename": "/Engine/Content/Slate/Old/Tiles/DottedSquareBox_LR_E.png", "start": 2754529, "end": 2762796}, {"filename": "/Engine/Content/Slate/Old/Tiles/DottedSquareBox_R.png", "start": 2762796, "end": 2770884}, {"filename": "/Engine/Content/Slate/Old/Tiles/DottedSquareBox_R_E.png", "start": 2770884, "end": 2779049}, {"filename": "/Engine/Content/Slate/Old/Tiles/Hat.png", "start": 2779049, "end": 2779562}, {"filename": "/Engine/Content/Slate/Old/Tiles/Outer/alertOutline.png", "start": 2779562, "end": 2779885}, {"filename": "/Engine/Content/Slate/Old/Tiles/Outer/alertSolid.png", "start": 2779885, "end": 2780139}, {"filename": "/Engine/Content/Slate/Old/Tiles/PrePost_RoundedBox.png", "start": 2780139, "end": 2784384}, {"filename": "/Engine/Content/Slate/Old/Tiles/PrePost_RoundedBox_B.png", "start": 2784384, "end": 2788629}, {"filename": "/Engine/Content/Slate/Old/Tiles/PrePost_RoundedBox_T.png", "start": 2788629, "end": 2792874}, {"filename": "/Engine/Content/Slate/Old/Tiles/QMark.png", "start": 2792874, "end": 2793505}, {"filename": "/Engine/Content/Slate/Old/Tiles/RoundedBoxBorder.png", "start": 2793505, "end": 2797393}, {"filename": "/Engine/Content/Slate/Old/Tiles/RoundedTileFaded.png", "start": 2797393, "end": 2802117}, {"filename": "/Engine/Content/Slate/Old/Tiles/RoundedTile_Background.png", "start": 2802117, "end": 2802527}, {"filename": "/Engine/Content/Slate/Old/Tiles/RoundedTile_Glow.png", "start": 2802527, "end": 2804592}, {"filename": "/Engine/Content/Slate/Old/Tiles/RoundedTile_Outline.png", "start": 2804592, "end": 2805082}, {"filename": "/Engine/Content/Slate/Old/Tiles/SolidWhite.png", "start": 2805082, "end": 2807382}, {"filename": "/Engine/Content/Slate/Old/Tiles/SquareBox.png", "start": 2807382, "end": 2813108}, {"filename": "/Engine/Content/Slate/Old/Tiles/SquareBox_Solid_L.png", "start": 2813108, "end": 2818913}, {"filename": "/Engine/Content/Slate/Old/Tiles/SquigglyBox.png", "start": 2818913, "end": 2824736}, {"filename": "/Engine/Content/Slate/Old/Tiles/Tile_Highlight.png", "start": 2824736, "end": 2826892}, {"filename": "/Engine/Content/Slate/Old/Tiles/Underline.png", "start": 2826892, "end": 2828493}, {"filename": "/Engine/Content/Slate/Old/Tiles/bigdot.png", "start": 2828493, "end": 2830606}, {"filename": "/Engine/Content/Slate/Old/Tiles/blank.png", "start": 2830606, "end": 2833679}, {"filename": "/Engine/Content/Slate/Old/Tiles/pin/pin.png", "start": 2833679, "end": 2839531}, {"filename": "/Engine/Content/Slate/Old/Tiles/pin/pin_glow.png", "start": 2839531, "end": 2843973}, {"filename": "/Engine/Content/Slate/Old/Tiles/pin/pin_head.png", "start": 2843973, "end": 2846710}, {"filename": "/Engine/Content/Slate/Old/Tiles/pin/pin_head_glow.png", "start": 2846710, "end": 2850043}, {"filename": "/Engine/Content/Slate/Old/Tiles/pin/pin_highlight.png", "start": 2850043, "end": 2853006}, {"filename": "/Engine/Content/Slate/Old/Tiles/pin/pin_shadow.png", "start": 2853006, "end": 2856403}, {"filename": "/Engine/Content/Slate/Old/Tiles/pin/pin_stick.png", "start": 2856403, "end": 2859499}, {"filename": "/Engine/Content/Slate/Old/Tiles/pin/ping.png", "start": 2859499, "end": 2868485}, {"filename": "/Engine/Content/Slate/Old/Tiles/selectionbar/selectionbar_0.png", "start": 2868485, "end": 2871850}, {"filename": "/Engine/Content/Slate/Old/Tiles/selectionbar/selectionbar_1.png", "start": 2871850, "end": 2875155}, {"filename": "/Engine/Content/Slate/Old/Tiles/selectionbar/selectionbar_2.png", "start": 2875155, "end": 2878406}, {"filename": "/Engine/Content/Slate/Old/Tiles/smalldot.png", "start": 2878406, "end": 2880309}, {"filename": "/Engine/Content/Slate/Old/ToolBar_Background.png", "start": 2880309, "end": 2883326}, {"filename": "/Engine/Content/Slate/Old/ToolTip_Background.png", "start": 2883326, "end": 2883948}, {"filename": "/Engine/Content/Slate/Old/ToolTip_BrightBackground.png", "start": 2883948, "end": 2885060}, {"filename": "/Engine/Content/Slate/Old/White.png", "start": 2885060, "end": 2885391}, {"filename": "/Engine/Content/Slate/Starship/Common/Advanced.svg", "start": 2885391, "end": 2889349}, {"filename": "/Engine/Content/Slate/Starship/Common/AllSavedAssets.svg", "start": 2889349, "end": 2890846}, {"filename": "/Engine/Content/Slate/Starship/Common/AutomationTools.svg", "start": 2890846, "end": 2892865}, {"filename": "/Engine/Content/Slate/Starship/Common/CPP.svg", "start": 2892865, "end": 2894871}, {"filename": "/Engine/Content/Slate/Starship/Common/Calendar.svg", "start": 2894871, "end": 2896537}, {"filename": "/Engine/Content/Slate/Starship/Common/ColorThemesOff_20.svg", "start": 2896537, "end": 2898127}, {"filename": "/Engine/Content/Slate/Starship/Common/ColorThemes_16.svg", "start": 2898127, "end": 2899363}, {"filename": "/Engine/Content/Slate/Starship/Common/ColorThemes_20.svg", "start": 2899363, "end": 2900731}, {"filename": "/Engine/Content/Slate/Starship/Common/Console.svg", "start": 2900731, "end": 2901090}, {"filename": "/Engine/Content/Slate/Starship/Common/Copy.svg", "start": 2901090, "end": 2901416}, {"filename": "/Engine/Content/Slate/Starship/Common/Cut.svg", "start": 2901416, "end": 2901644}, {"filename": "/Engine/Content/Slate/Starship/Common/Dash_Horizontal.png", "start": 2901644, "end": 2903479}, {"filename": "/Engine/Content/Slate/Starship/Common/Dash_Vertical.png", "start": 2903479, "end": 2905317}, {"filename": "/Engine/Content/Slate/Starship/Common/Delete.svg", "start": 2905317, "end": 2906514}, {"filename": "/Engine/Content/Slate/Starship/Common/Developer.svg", "start": 2906514, "end": 2906978}, {"filename": "/Engine/Content/Slate/Starship/Common/DropTargetBackground.png", "start": 2906978, "end": 2910914}, {"filename": "/Engine/Content/Slate/Starship/Common/Duplicate.svg", "start": 2910914, "end": 2911148}, {"filename": "/Engine/Content/Slate/Starship/Common/EditToolbar.svg", "start": 2911148, "end": 2912550}, {"filename": "/Engine/Content/Slate/Starship/Common/EyeDropper.svg", "start": 2912550, "end": 2913536}, {"filename": "/Engine/Content/Slate/Starship/Common/EyeDropper_20.svg", "start": 2913536, "end": 2914758}, {"filename": "/Engine/Content/Slate/Starship/Common/Favorite.svg", "start": 2914758, "end": 2915058}, {"filename": "/Engine/Content/Slate/Starship/Common/FavoriteOutline.svg", "start": 2915058, "end": 2915534}, {"filename": "/Engine/Content/Slate/Starship/Common/FilterAuto.svg", "start": 2915534, "end": 2916517}, {"filename": "/Engine/Content/Slate/Starship/Common/FlipHorizontal.svg", "start": 2916517, "end": 2916921}, {"filename": "/Engine/Content/Slate/Starship/Common/FlipVertical.svg", "start": 2916921, "end": 2917317}, {"filename": "/Engine/Content/Slate/Starship/Common/Group_20.svg", "start": 2917317, "end": 2919158}, {"filename": "/Engine/Content/Slate/Starship/Common/HiddenInGame.svg", "start": 2919158, "end": 2920012}, {"filename": "/Engine/Content/Slate/Starship/Common/Info.svg", "start": 2920012, "end": 2920538}, {"filename": "/Engine/Content/Slate/Starship/Common/Layout.svg", "start": 2920538, "end": 2920802}, {"filename": "/Engine/Content/Slate/Starship/Common/Linked.svg", "start": 2920802, "end": 2922082}, {"filename": "/Engine/Content/Slate/Starship/Common/LookAt.svg", "start": 2922082, "end": 2922928}, {"filename": "/Engine/Content/Slate/Starship/Common/Merge.svg", "start": 2922928, "end": 2923205}, {"filename": "/Engine/Content/Slate/Starship/Common/Monitor.svg", "start": 2923205, "end": 2923612}, {"filename": "/Engine/Content/Slate/Starship/Common/OutputLog.svg", "start": 2923612, "end": 2923994}, {"filename": "/Engine/Content/Slate/Starship/Common/ParentHierarchy.svg", "start": 2923994, "end": 2924305}, {"filename": "/Engine/Content/Slate/Starship/Common/Paste.svg", "start": 2924305, "end": 2924513}, {"filename": "/Engine/Content/Slate/Starship/Common/PlayerController.svg", "start": 2924513, "end": 2925700}, {"filename": "/Engine/Content/Slate/Starship/Common/Preferences.svg", "start": 2925700, "end": 2927270}, {"filename": "/Engine/Content/Slate/Starship/Common/ProjectLauncher.svg", "start": 2927270, "end": 2929283}, {"filename": "/Engine/Content/Slate/Starship/Common/Recent.svg", "start": 2929283, "end": 2929800}, {"filename": "/Engine/Content/Slate/Starship/Common/Redo.svg", "start": 2929800, "end": 2930206}, {"filename": "/Engine/Content/Slate/Starship/Common/Rename.svg", "start": 2930206, "end": 2930508}, {"filename": "/Engine/Content/Slate/Starship/Common/ResetToDefault.svg", "start": 2930508, "end": 2931612}, {"filename": "/Engine/Content/Slate/Starship/Common/Role.svg", "start": 2931612, "end": 2932781}, {"filename": "/Engine/Content/Slate/Starship/Common/Rotate180.svg", "start": 2932781, "end": 2933664}, {"filename": "/Engine/Content/Slate/Starship/Common/Rotate90Clockwise.svg", "start": 2933664, "end": 2934347}, {"filename": "/Engine/Content/Slate/Starship/Common/Rotate90Counterclockwise.svg", "start": 2934347, "end": 2935036}, {"filename": "/Engine/Content/Slate/Starship/Common/Search_20.svg", "start": 2935036, "end": 2935756}, {"filename": "/Engine/Content/Slate/Starship/Common/SelectAll_16.svg", "start": 2935756, "end": 2936594}, {"filename": "/Engine/Content/Slate/Starship/Common/SessionFrontend.svg", "start": 2936594, "end": 2937986}, {"filename": "/Engine/Content/Slate/Starship/Common/SortDown.svg", "start": 2937986, "end": 2938581}, {"filename": "/Engine/Content/Slate/Starship/Common/SortUp.svg", "start": 2938581, "end": 2939173}, {"filename": "/Engine/Content/Slate/Starship/Common/TagCollection_16.svg", "start": 2939173, "end": 2940437}, {"filename": "/Engine/Content/Slate/Starship/Common/TagSimple_16.svg", "start": 2940437, "end": 2941124}, {"filename": "/Engine/Content/Slate/Starship/Common/Test.svg", "start": 2941124, "end": 2941939}, {"filename": "/Engine/Content/Slate/Starship/Common/TokenTextBox_16.svg", "start": 2941939, "end": 2945047}, {"filename": "/Engine/Content/Slate/Starship/Common/TranslationPicker.svg", "start": 2945047, "end": 2945741}, {"filename": "/Engine/Content/Slate/Starship/Common/UELogo.png", "start": 2945741, "end": 2950480}, {"filename": "/Engine/Content/Slate/Starship/Common/UELogo.svg", "start": 2950480, "end": 2961407}, {"filename": "/Engine/Content/Slate/Starship/Common/Undo.svg", "start": 2961407, "end": 2961856}, {"filename": "/Engine/Content/Slate/Starship/Common/UndoHistory.svg", "start": 2961856, "end": 2962481}, {"filename": "/Engine/Content/Slate/Starship/Common/Unlinked.svg", "start": 2962481, "end": 2963496}, {"filename": "/Engine/Content/Slate/Starship/Common/UnsavedAssets.svg", "start": 2963496, "end": 2964045}, {"filename": "/Engine/Content/Slate/Starship/Common/UnsavedAssetsWarning.svg", "start": 2964045, "end": 2966700}, {"filename": "/Engine/Content/Slate/Starship/Common/Update.svg", "start": 2966700, "end": 2967918}, {"filename": "/Engine/Content/Slate/Starship/Common/VisibleInGame.svg", "start": 2967918, "end": 2968476}, {"filename": "/Engine/Content/Slate/Starship/Common/Visualizer.svg", "start": 2968476, "end": 2969299}, {"filename": "/Engine/Content/Slate/Starship/Common/add-circle.svg", "start": 2969299, "end": 2969813}, {"filename": "/Engine/Content/Slate/Starship/Common/alert-circle.svg", "start": 2969813, "end": 2970438}, {"filename": "/Engine/Content/Slate/Starship/Common/alert-triangle-64.svg", "start": 2970438, "end": 2974494}, {"filename": "/Engine/Content/Slate/Starship/Common/alert-triangle-badge.svg", "start": 2974494, "end": 2976480}, {"filename": "/Engine/Content/Slate/Starship/Common/alert-triangle-large.svg", "start": 2976480, "end": 2977452}, {"filename": "/Engine/Content/Slate/Starship/Common/alert-triangle-red-outlined.svg", "start": 2977452, "end": 2978601}, {"filename": "/Engine/Content/Slate/Starship/Common/alert-triangle.svg", "start": 2978601, "end": 2979244}, {"filename": "/Engine/Content/Slate/Starship/Common/arrow-down.svg", "start": 2979244, "end": 2979562}, {"filename": "/Engine/Content/Slate/Starship/Common/arrow-left.svg", "start": 2979562, "end": 2979879}, {"filename": "/Engine/Content/Slate/Starship/Common/arrow-leftright.svg", "start": 2979879, "end": 2980322}, {"filename": "/Engine/Content/Slate/Starship/Common/arrow-right.svg", "start": 2980322, "end": 2980640}, {"filename": "/Engine/Content/Slate/Starship/Common/arrow-up.svg", "start": 2980640, "end": 2980957}, {"filename": "/Engine/Content/Slate/Starship/Common/badge-modified.svg", "start": 2980957, "end": 2981115}, {"filename": "/Engine/Content/Slate/Starship/Common/badge.svg", "start": 2981115, "end": 2981540}, {"filename": "/Engine/Content/Slate/Starship/Common/blueprint.svg", "start": 2981540, "end": 2982174}, {"filename": "/Engine/Content/Slate/Starship/Common/box-perspective.svg", "start": 2982174, "end": 2982902}, {"filename": "/Engine/Content/Slate/Starship/Common/bullet-point.svg", "start": 2982902, "end": 2983047}, {"filename": "/Engine/Content/Slate/Starship/Common/bullet-point16.svg", "start": 2983047, "end": 2983197}, {"filename": "/Engine/Content/Slate/Starship/Common/caret-down.svg", "start": 2983197, "end": 2983961}, {"filename": "/Engine/Content/Slate/Starship/Common/caret-right.svg", "start": 2983961, "end": 2984724}, {"filename": "/Engine/Content/Slate/Starship/Common/check-circle-large.svg", "start": 2984724, "end": 2985453}, {"filename": "/Engine/Content/Slate/Starship/Common/check-circle-solid.svg", "start": 2985453, "end": 2985842}, {"filename": "/Engine/Content/Slate/Starship/Common/check-circle.svg", "start": 2985842, "end": 2986272}, {"filename": "/Engine/Content/Slate/Starship/Common/check.svg", "start": 2986272, "end": 2986518}, {"filename": "/Engine/Content/Slate/Starship/Common/checker.png", "start": 2986518, "end": 2988161}, {"filename": "/Engine/Content/Slate/Starship/Common/chevron-down.svg", "start": 2988161, "end": 2988372}, {"filename": "/Engine/Content/Slate/Starship/Common/chevron-left.svg", "start": 2988372, "end": 2988584}, {"filename": "/Engine/Content/Slate/Starship/Common/chevron-right.svg", "start": 2988584, "end": 2988795}, {"filename": "/Engine/Content/Slate/Starship/Common/chevron-up.svg", "start": 2988795, "end": 2989007}, {"filename": "/Engine/Content/Slate/Starship/Common/circle-arrow-down.svg", "start": 2989007, "end": 2989424}, {"filename": "/Engine/Content/Slate/Starship/Common/circle-arrow-left.svg", "start": 2989424, "end": 2989839}, {"filename": "/Engine/Content/Slate/Starship/Common/circle-arrow-right.svg", "start": 2989839, "end": 2990254}, {"filename": "/Engine/Content/Slate/Starship/Common/circle-arrow-up.svg", "start": 2990254, "end": 2990671}, {"filename": "/Engine/Content/Slate/Starship/Common/close-circle.svg", "start": 2990671, "end": 2992105}, {"filename": "/Engine/Content/Slate/Starship/Common/close-small.svg", "start": 2992105, "end": 2992369}, {"filename": "/Engine/Content/Slate/Starship/Common/close.svg", "start": 2992369, "end": 2992678}, {"filename": "/Engine/Content/Slate/Starship/Common/color-grading-cross.svg", "start": 2992678, "end": 2992957}, {"filename": "/Engine/Content/Slate/Starship/Common/color-grading-selector.svg", "start": 2992957, "end": 2993143}, {"filename": "/Engine/Content/Slate/Starship/Common/color-grading-spinbox-selector-v.png", "start": 2993143, "end": 2993270}, {"filename": "/Engine/Content/Slate/Starship/Common/color-grading-spinbox-selector.png", "start": 2993270, "end": 2993348}, {"filename": "/Engine/Content/Slate/Starship/Common/curve-editor-append-key-20.svg", "start": 2993348, "end": 2994075}, {"filename": "/Engine/Content/Slate/Starship/Common/cylinder.svg", "start": 2994075, "end": 2994614}, {"filename": "/Engine/Content/Slate/Starship/Common/delete-outline.svg", "start": 2994614, "end": 2995097}, {"filename": "/Engine/Content/Slate/Starship/Common/drag-handle.svg", "start": 2995097, "end": 2996308}, {"filename": "/Engine/Content/Slate/Starship/Common/edit.svg", "start": 2996308, "end": 2996766}, {"filename": "/Engine/Content/Slate/Starship/Common/ellipsis-horizontal-narrow.svg", "start": 2996766, "end": 2997015}, {"filename": "/Engine/Content/Slate/Starship/Common/ellipsis-vertical-narrow.svg", "start": 2997015, "end": 2997262}, {"filename": "/Engine/Content/Slate/Starship/Common/export.svg", "start": 2997262, "end": 2998089}, {"filename": "/Engine/Content/Slate/Starship/Common/export_20.svg", "start": 2998089, "end": 2999280}, {"filename": "/Engine/Content/Slate/Starship/Common/favorites-category.svg", "start": 2999280, "end": 2999572}, {"filename": "/Engine/Content/Slate/Starship/Common/fieldnotify_off.svg", "start": 2999572, "end": 3000182}, {"filename": "/Engine/Content/Slate/Starship/Common/fieldnotify_on.svg", "start": 3000182, "end": 3000592}, {"filename": "/Engine/Content/Slate/Starship/Common/file-tree-open.svg", "start": 3000592, "end": 3001904}, {"filename": "/Engine/Content/Slate/Starship/Common/file-tree.svg", "start": 3001904, "end": 3003128}, {"filename": "/Engine/Content/Slate/Starship/Common/file.svg", "start": 3003128, "end": 3003377}, {"filename": "/Engine/Content/Slate/Starship/Common/filled-circle.svg", "start": 3003377, "end": 3003799}, {"filename": "/Engine/Content/Slate/Starship/Common/filter.svg", "start": 3003799, "end": 3004213}, {"filename": "/Engine/Content/Slate/Starship/Common/folder-cleanup.svg", "start": 3004213, "end": 3004804}, {"filename": "/Engine/Content/Slate/Starship/Common/folder-closed.svg", "start": 3004804, "end": 3005123}, {"filename": "/Engine/Content/Slate/Starship/Common/folder-open.svg", "start": 3005123, "end": 3005490}, {"filename": "/Engine/Content/Slate/Starship/Common/folder-plus.svg", "start": 3005490, "end": 3005859}, {"filename": "/Engine/Content/Slate/Starship/Common/folder-virtual-closed.svg", "start": 3005859, "end": 3006321}, {"filename": "/Engine/Content/Slate/Starship/Common/folder-virtual-open.svg", "start": 3006321, "end": 3007034}, {"filename": "/Engine/Content/Slate/Starship/Common/help-solid.svg", "start": 3007034, "end": 3007678}, {"filename": "/Engine/Content/Slate/Starship/Common/help.svg", "start": 3007678, "end": 3008403}, {"filename": "/Engine/Content/Slate/Starship/Common/hidden.svg", "start": 3008403, "end": 3009135}, {"filename": "/Engine/Content/Slate/Starship/Common/import.svg", "start": 3009135, "end": 3009852}, {"filename": "/Engine/Content/Slate/Starship/Common/import_20.svg", "start": 3009852, "end": 3010951}, {"filename": "/Engine/Content/Slate/Starship/Common/info-circle-solid.svg", "start": 3010951, "end": 3011423}, {"filename": "/Engine/Content/Slate/Starship/Common/layout-header-body.svg", "start": 3011423, "end": 3011682}, {"filename": "/Engine/Content/Slate/Starship/Common/layout-spreadsheet.svg", "start": 3011682, "end": 3011983}, {"filename": "/Engine/Content/Slate/Starship/Common/lock-unlocked.svg", "start": 3011983, "end": 3013450}, {"filename": "/Engine/Content/Slate/Starship/Common/lock.svg", "start": 3013450, "end": 3014916}, {"filename": "/Engine/Content/Slate/Starship/Common/menu.svg", "start": 3014916, "end": 3015319}, {"filename": "/Engine/Content/Slate/Starship/Common/minus-circle.svg", "start": 3015319, "end": 3015734}, {"filename": "/Engine/Content/Slate/Starship/Common/minus.svg", "start": 3015734, "end": 3015938}, {"filename": "/Engine/Content/Slate/Starship/Common/normalize.svg", "start": 3015938, "end": 3016518}, {"filename": "/Engine/Content/Slate/Starship/Common/play.svg", "start": 3016518, "end": 3016760}, {"filename": "/Engine/Content/Slate/Starship/Common/plus-circle.svg", "start": 3016760, "end": 3017193}, {"filename": "/Engine/Content/Slate/Starship/Common/plus.svg", "start": 3017193, "end": 3017496}, {"filename": "/Engine/Content/Slate/Starship/Common/preview-default.svg", "start": 3017496, "end": 3018117}, {"filename": "/Engine/Content/Slate/Starship/Common/pyriamid.svg", "start": 3018117, "end": 3018692}, {"filename": "/Engine/Content/Slate/Starship/Common/refresh.svg", "start": 3018692, "end": 3019063}, {"filename": "/Engine/Content/Slate/Starship/Common/reimport.svg", "start": 3019063, "end": 3020058}, {"filename": "/Engine/Content/Slate/Starship/Common/reject.svg", "start": 3020058, "end": 3020461}, {"filename": "/Engine/Content/Slate/Starship/Common/save-modified.svg", "start": 3020461, "end": 3021144}, {"filename": "/Engine/Content/Slate/Starship/Common/save.svg", "start": 3021144, "end": 3021414}, {"filename": "/Engine/Content/Slate/Starship/Common/search.svg", "start": 3021414, "end": 3021885}, {"filename": "/Engine/Content/Slate/Starship/Common/server.svg", "start": 3021885, "end": 3022504}, {"filename": "/Engine/Content/Slate/Starship/Common/settings.svg", "start": 3022504, "end": 3024198}, {"filename": "/Engine/Content/Slate/Starship/Common/sphere.svg", "start": 3024198, "end": 3024846}, {"filename": "/Engine/Content/Slate/Starship/Common/stop.svg", "start": 3024846, "end": 3024994}, {"filename": "/Engine/Content/Slate/Starship/Common/tile.svg", "start": 3024994, "end": 3025277}, {"filename": "/Engine/Content/Slate/Starship/Common/unreal-circle-thick.svg", "start": 3025277, "end": 3026546}, {"filename": "/Engine/Content/Slate/Starship/Common/unreal-circle-thin.svg", "start": 3026546, "end": 3027794}, {"filename": "/Engine/Content/Slate/Starship/Common/unreal-small.svg", "start": 3027794, "end": 3038737}, {"filename": "/Engine/Content/Slate/Starship/Common/visible.svg", "start": 3038737, "end": 3039175}, {"filename": "/Engine/Content/Slate/Starship/Common/world.svg", "start": 3039175, "end": 3040799}, {"filename": "/Engine/Content/Slate/Starship/Common/x-circle.svg", "start": 3040799, "end": 3042078}, {"filename": "/Engine/Content/Slate/Starship/CoreWidgets/CheckBox/CheckBoxIndeterminate_12.svg", "start": 3042078, "end": 3042262}, {"filename": "/Engine/Content/Slate/Starship/CoreWidgets/CheckBox/CheckBoxIndeterminate_14.svg", "start": 3042262, "end": 3042454}, {"filename": "/Engine/Content/Slate/Starship/CoreWidgets/CheckBox/check.svg", "start": 3042454, "end": 3042700}, {"filename": "/Engine/Content/Slate/Starship/CoreWidgets/CheckBox/indeterminate.svg", "start": 3042700, "end": 3042885}, {"filename": "/Engine/Content/Slate/Starship/CoreWidgets/CheckBox/radio-off.svg", "start": 3042885, "end": 3043188}, {"filename": "/Engine/Content/Slate/Starship/CoreWidgets/CheckBox/radio-on.svg", "start": 3043188, "end": 3043706}, {"filename": "/Engine/Content/Slate/Starship/CoreWidgets/ComboBox/corner-dropdown.svg", "start": 3043706, "end": 3043910}, {"filename": "/Engine/Content/Slate/Starship/CoreWidgets/ComboBox/wide-chevron-down.svg", "start": 3043910, "end": 3044124}, {"filename": "/Engine/Content/Slate/Starship/CoreWidgets/FilterBar/FilterColorSegment.svg", "start": 3044124, "end": 3044318}, {"filename": "/Engine/Content/Slate/Starship/CoreWidgets/NumericEntryBox/NarrowDecorator.svg", "start": 3044318, "end": 3044556}, {"filename": "/Engine/Content/Slate/Starship/CoreWidgets/ProgressBar/ProgressMarquee.png", "start": 3044556, "end": 3044833}, {"filename": "/Engine/Content/Slate/Starship/CoreWidgets/SegmentedBox/left.png", "start": 3044833, "end": 3045026}, {"filename": "/Engine/Content/Slate/Starship/CoreWidgets/SegmentedBox/left.svg", "start": 3045026, "end": 3045223}, {"filename": "/Engine/Content/Slate/Starship/CoreWidgets/SegmentedBox/right.png", "start": 3045223, "end": 3045400}, {"filename": "/Engine/Content/Slate/Starship/CoreWidgets/SegmentedBox/right.svg", "start": 3045400, "end": 3045601}, {"filename": "/Engine/Content/Slate/Starship/CoreWidgets/TableView/PinnedItemShadow.png", "start": 3045601, "end": 3045948}, {"filename": "/Engine/Content/Slate/Starship/CoreWidgets/TableView/sort-down-arrow.svg", "start": 3045948, "end": 3046263}, {"filename": "/Engine/Content/Slate/Starship/CoreWidgets/TableView/sort-down-arrows.svg", "start": 3046263, "end": 3046810}, {"filename": "/Engine/Content/Slate/Starship/CoreWidgets/TableView/sort-up-arrow.svg", "start": 3046810, "end": 3047127}, {"filename": "/Engine/Content/Slate/Starship/CoreWidgets/TableView/sort-up-arrows.svg", "start": 3047127, "end": 3047685}, {"filename": "/Engine/Content/Slate/Starship/CoreWidgets/Window/close.svg", "start": 3047685, "end": 3047899}, {"filename": "/Engine/Content/Slate/Starship/CoreWidgets/Window/enter_fullscreen.svg", "start": 3047899, "end": 3048256}, {"filename": "/Engine/Content/Slate/Starship/CoreWidgets/Window/exit_fullscreen.svg", "start": 3048256, "end": 3048617}, {"filename": "/Engine/Content/Slate/Starship/CoreWidgets/Window/maximize.svg", "start": 3048617, "end": 3048784}, {"filename": "/Engine/Content/Slate/Starship/CoreWidgets/Window/minimize.svg", "start": 3048784, "end": 3048949}, {"filename": "/Engine/Content/Slate/Starship/CoreWidgets/Window/restore.svg", "start": 3048949, "end": 3049244}, {"filename": "/Engine/Content/Slate/Starship/Docking/DockTab_Active.png", "start": 3049244, "end": 3049383}, {"filename": "/Engine/Content/Slate/Starship/Docking/DockTab_Foreground.png", "start": 3049383, "end": 3049568}, {"filename": "/Engine/Content/Slate/Starship/Docking/DockTab_Hover.png", "start": 3049568, "end": 3049752}, {"filename": "/Engine/Content/Slate/Starship/Docking/Dock_Tab_Active.png", "start": 3049752, "end": 3049887}, {"filename": "/Engine/Content/Slate/Starship/Docking/OpenTabInWindow.svg", "start": 3049887, "end": 3050498}, {"filename": "/Engine/Content/Slate/Starship/Docking/drawer-shadow.png", "start": 3050498, "end": 3052610}, {"filename": "/Engine/Content/Slate/Starship/Docking/pin.svg", "start": 3052610, "end": 3053364}, {"filename": "/Engine/Content/Slate/Starship/Docking/show-tab-well.svg", "start": 3053364, "end": 3053518}, {"filename": "/Engine/Content/Slate/Starship/Insights/AllTracks_20.svg", "start": 3053518, "end": 3055053}, {"filename": "/Engine/Content/Slate/Starship/Insights/Annotation.svg", "start": 3055053, "end": 3055210}, {"filename": "/Engine/Content/Slate/Starship/Insights/Annotation_20.svg", "start": 3055210, "end": 3055389}, {"filename": "/Engine/Content/Slate/Starship/Insights/AutoScrollDown_20.svg", "start": 3055389, "end": 3055788}, {"filename": "/Engine/Content/Slate/Starship/Insights/AutoScrollRight_20.svg", "start": 3055788, "end": 3056214}, {"filename": "/Engine/Content/Slate/Starship/Insights/BudgetSettings.svg", "start": 3056214, "end": 3056732}, {"filename": "/Engine/Content/Slate/Starship/Insights/Callees.svg", "start": 3056732, "end": 3057259}, {"filename": "/Engine/Content/Slate/Starship/Insights/Callees_20.svg", "start": 3057259, "end": 3057737}, {"filename": "/Engine/Content/Slate/Starship/Insights/Callers.svg", "start": 3057737, "end": 3058139}, {"filename": "/Engine/Content/Slate/Starship/Insights/Callers_20.svg", "start": 3058139, "end": 3058606}, {"filename": "/Engine/Content/Slate/Starship/Insights/Connection.svg", "start": 3058606, "end": 3059595}, {"filename": "/Engine/Content/Slate/Starship/Insights/ControlsFirst.svg", "start": 3059595, "end": 3059913}, {"filename": "/Engine/Content/Slate/Starship/Insights/ControlsLast.svg", "start": 3059913, "end": 3060242}, {"filename": "/Engine/Content/Slate/Starship/Insights/ControlsNext.svg", "start": 3060242, "end": 3060471}, {"filename": "/Engine/Content/Slate/Starship/Insights/ControlsPrevious.svg", "start": 3060471, "end": 3060690}, {"filename": "/Engine/Content/Slate/Starship/Insights/Counter.svg", "start": 3060690, "end": 3060891}, {"filename": "/Engine/Content/Slate/Starship/Insights/Counter_20.svg", "start": 3060891, "end": 3061116}, {"filename": "/Engine/Content/Slate/Starship/Insights/CpuGpuTracks_20.svg", "start": 3061116, "end": 3061537}, {"filename": "/Engine/Content/Slate/Starship/Insights/Filter.svg", "start": 3061537, "end": 3061710}, {"filename": "/Engine/Content/Slate/Starship/Insights/FilterConfig.svg", "start": 3061710, "end": 3063818}, {"filename": "/Engine/Content/Slate/Starship/Insights/Frames.svg", "start": 3063818, "end": 3064165}, {"filename": "/Engine/Content/Slate/Starship/Insights/Frames_20.svg", "start": 3064165, "end": 3064515}, {"filename": "/Engine/Content/Slate/Starship/Insights/Function.svg", "start": 3064515, "end": 3065751}, {"filename": "/Engine/Content/Slate/Starship/Insights/HotPath_12.svg", "start": 3065751, "end": 3066902}, {"filename": "/Engine/Content/Slate/Starship/Insights/InfoTag_12.svg", "start": 3066902, "end": 3067619}, {"filename": "/Engine/Content/Slate/Starship/Insights/Log.svg", "start": 3067619, "end": 3068005}, {"filename": "/Engine/Content/Slate/Starship/Insights/Log_20.svg", "start": 3068005, "end": 3069229}, {"filename": "/Engine/Content/Slate/Starship/Insights/MemAllocTable.svg", "start": 3069229, "end": 3069742}, {"filename": "/Engine/Content/Slate/Starship/Insights/MemInvestigation.svg", "start": 3069742, "end": 3070613}, {"filename": "/Engine/Content/Slate/Starship/Insights/MemInvestigation_20.svg", "start": 3070613, "end": 3071350}, {"filename": "/Engine/Content/Slate/Starship/Insights/MemTagSet_AssetClasses.svg", "start": 3071350, "end": 3073615}, {"filename": "/Engine/Content/Slate/Starship/Insights/MemTagSet_Assets.svg", "start": 3073615, "end": 3074495}, {"filename": "/Engine/Content/Slate/Starship/Insights/MemTagSet_Systems.svg", "start": 3074495, "end": 3080288}, {"filename": "/Engine/Content/Slate/Starship/Insights/MemTag_Asset_12.svg", "start": 3080288, "end": 3081106}, {"filename": "/Engine/Content/Slate/Starship/Insights/MemTag_Class_12.svg", "start": 3081106, "end": 3083277}, {"filename": "/Engine/Content/Slate/Starship/Insights/MemTag_System_12.svg", "start": 3083277, "end": 3086287}, {"filename": "/Engine/Content/Slate/Starship/Insights/MemTags.svg", "start": 3086287, "end": 3087837}, {"filename": "/Engine/Content/Slate/Starship/Insights/MemTags_20.svg", "start": 3087837, "end": 3089748}, {"filename": "/Engine/Content/Slate/Starship/Insights/Memory.svg", "start": 3089748, "end": 3090410}, {"filename": "/Engine/Content/Slate/Starship/Insights/MemoryAnalysisSnapshot_16.svg", "start": 3090410, "end": 3092044}, {"filename": "/Engine/Content/Slate/Starship/Insights/MemoryAnalysis_16.svg", "start": 3092044, "end": 3092907}, {"filename": "/Engine/Content/Slate/Starship/Insights/NetStats.svg", "start": 3092907, "end": 3095181}, {"filename": "/Engine/Content/Slate/Starship/Insights/NetStats_20.svg", "start": 3095181, "end": 3098279}, {"filename": "/Engine/Content/Slate/Starship/Insights/Networking.svg", "start": 3098279, "end": 3100369}, {"filename": "/Engine/Content/Slate/Starship/Insights/Object.svg", "start": 3100369, "end": 3100887}, {"filename": "/Engine/Content/Slate/Starship/Insights/PacketContent.svg", "start": 3100887, "end": 3102484}, {"filename": "/Engine/Content/Slate/Starship/Insights/PacketContent_20.svg", "start": 3102484, "end": 3104225}, {"filename": "/Engine/Content/Slate/Starship/Insights/Packets.svg", "start": 3104225, "end": 3104780}, {"filename": "/Engine/Content/Slate/Starship/Insights/Packets_20.svg", "start": 3104780, "end": 3105415}, {"filename": "/Engine/Content/Slate/Starship/Insights/PluginTracks_20.svg", "start": 3105415, "end": 3105754}, {"filename": "/Engine/Content/Slate/Starship/Insights/RoundedBullet.svg", "start": 3105754, "end": 3105918}, {"filename": "/Engine/Content/Slate/Starship/Insights/Session.svg", "start": 3105918, "end": 3108003}, {"filename": "/Engine/Content/Slate/Starship/Insights/SizeLarge.svg", "start": 3108003, "end": 3108271}, {"filename": "/Engine/Content/Slate/Starship/Insights/SizeLarge_20.svg", "start": 3108271, "end": 3108539}, {"filename": "/Engine/Content/Slate/Starship/Insights/SizeMedium.svg", "start": 3108539, "end": 3108807}, {"filename": "/Engine/Content/Slate/Starship/Insights/SizeMedium_20.svg", "start": 3108807, "end": 3109075}, {"filename": "/Engine/Content/Slate/Starship/Insights/SizeSmall.svg", "start": 3109075, "end": 3109340}, {"filename": "/Engine/Content/Slate/Starship/Insights/SizeSmall_20.svg", "start": 3109340, "end": 3109608}, {"filename": "/Engine/Content/Slate/Starship/Insights/SpecialTracks_20.svg", "start": 3109608, "end": 3110127}, {"filename": "/Engine/Content/Slate/Starship/Insights/Tasks.svg", "start": 3110127, "end": 3111143}, {"filename": "/Engine/Content/Slate/Starship/Insights/Tasks_20.svg", "start": 3111143, "end": 3112108}, {"filename": "/Engine/Content/Slate/Starship/Insights/TimeMarkerSettings.svg", "start": 3112108, "end": 3112504}, {"filename": "/Engine/Content/Slate/Starship/Insights/Timer.svg", "start": 3112504, "end": 3114653}, {"filename": "/Engine/Content/Slate/Starship/Insights/Timer_20.svg", "start": 3114653, "end": 3119103}, {"filename": "/Engine/Content/Slate/Starship/Insights/Timing.svg", "start": 3119103, "end": 3119891}, {"filename": "/Engine/Content/Slate/Starship/Insights/Timing_20.svg", "start": 3119891, "end": 3121584}, {"filename": "/Engine/Content/Slate/Starship/Insights/TraceStore.svg", "start": 3121584, "end": 3122072}, {"filename": "/Engine/Content/Slate/Starship/Insights/TraceStore_20.svg", "start": 3122072, "end": 3122582}, {"filename": "/Engine/Content/Slate/Starship/Insights/TraceTools/RecordTraceCenter.svg", "start": 3122582, "end": 3122913}, {"filename": "/Engine/Content/Slate/Starship/Insights/TraceTools/RecordTraceOutline.svg", "start": 3122913, "end": 3123083}, {"filename": "/Engine/Content/Slate/Starship/Insights/TraceTools/RecordTraceRecording.svg", "start": 3123083, "end": 3123479}, {"filename": "/Engine/Content/Slate/Starship/Insights/TraceTools/TracePause.svg", "start": 3123479, "end": 3123683}, {"filename": "/Engine/Content/Slate/Starship/Insights/TraceTools/TraceResume.svg", "start": 3123683, "end": 3123925}, {"filename": "/Engine/Content/Slate/Starship/Insights/TraceTools/TraceSnapshot.svg", "start": 3123925, "end": 3124875}, {"filename": "/Engine/Content/Slate/Starship/Insights/TraceTools/TraceStart.svg", "start": 3124875, "end": 3125285}, {"filename": "/Engine/Content/Slate/Starship/Insights/TraceTools/TraceStop.svg", "start": 3125285, "end": 3125537}, {"filename": "/Engine/Content/Slate/Starship/Insights/UObject.svg", "start": 3125537, "end": 3128007}, {"filename": "/Engine/Content/Slate/Starship/Insights/UObject_12.svg", "start": 3128007, "end": 3130393}, {"filename": "/Engine/Content/Slate/Starship/Insights/UTrace.svg", "start": 3130393, "end": 3131259}, {"filename": "/Engine/Content/Slate/Starship/Insights/UnrealInsights.svg", "start": 3131259, "end": 3132667}, {"filename": "/Engine/Content/Slate/Starship/Insights/ViewMode_20.svg", "start": 3132667, "end": 3133743}, {"filename": "/Engine/Content/Slate/Starship/Insights/ZeroCountFilter.svg", "start": 3133743, "end": 3135014}, {"filename": "/Engine/Content/Slate/Starship/Launcher/PaperAirplane.svg", "start": 3135014, "end": 3135347}, {"filename": "/Engine/Content/Slate/Starship/Notifications/Throbber.png", "start": 3135347, "end": 3136349}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_Added.svg", "start": 3136349, "end": 3136652}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_Branch.svg", "start": 3136652, "end": 3137129}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_BranchCircle_Branch.svg", "start": 3137129, "end": 3137812}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_BranchCircle_Circle.svg", "start": 3137812, "end": 3138603}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_BranchExplorer.svg", "start": 3138603, "end": 3139080}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_BranchModifiedBadge.svg", "start": 3139080, "end": 3139634}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_CheckCircleLine_Check.svg", "start": 3139634, "end": 3139886}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_CheckCircleLine_Circle.svg", "start": 3139886, "end": 3140494}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_CheckIn.svg", "start": 3140494, "end": 3140874}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_CheckInAvailable.svg", "start": 3140874, "end": 3142134}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_CheckInAvailableRewound.svg", "start": 3142134, "end": 3143332}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_CheckedBranch.svg", "start": 3143332, "end": 3143919}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_CheckedBranchBadge.svg", "start": 3143919, "end": 3144351}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_CheckedOther.svg", "start": 3144351, "end": 3145819}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_CheckedOtherBadge.svg", "start": 3145819, "end": 3146252}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_ConflictResolution_Clear.svg", "start": 3146252, "end": 3146645}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_ConflictResolution_OpenExternal.svg", "start": 3146645, "end": 3147249}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_Conflicted.svg", "start": 3147249, "end": 3147848}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_ConflictedState.svg", "start": 3147848, "end": 3148599}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_Diff.svg", "start": 3148599, "end": 3149586}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_DiskSize.svg", "start": 3149586, "end": 3150693}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_File.svg", "start": 3150693, "end": 3152867}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_LineCircle.svg", "start": 3152867, "end": 3153891}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_MarkedForAdd.svg", "start": 3153891, "end": 3154198}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_Merged.svg", "start": 3154198, "end": 3154478}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_Modified.svg", "start": 3154478, "end": 3154864}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_ModifiedLocally.svg", "start": 3154864, "end": 3155345}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_NewBranch.svg", "start": 3155345, "end": 3155832}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_NewerVersion.svg", "start": 3155832, "end": 3156283}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_Promote.svg", "start": 3156283, "end": 3158692}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_Promote_Large.svg", "start": 3158692, "end": 3160815}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_Removed.svg", "start": 3160815, "end": 3161357}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_Rewind.svg", "start": 3161357, "end": 3162595}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_Rewound.svg", "start": 3162595, "end": 3163425}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_StatusLocalUpToDate.svg", "start": 3163425, "end": 3164301}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_StatusLocalUpload.svg", "start": 3164301, "end": 3164968}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_StatusRemoteDownload.svg", "start": 3164968, "end": 3165419}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_StatusRemoteUpToDate.svg", "start": 3165419, "end": 3166281}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_Sync.svg", "start": 3166281, "end": 3166663}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_SyncAndCheckOut.svg", "start": 3166663, "end": 3167103}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_VerticalLine.svg", "start": 3167103, "end": 3167268}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_VerticalLineDashed.svg", "start": 3167268, "end": 3167753}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_VerticalLineEnd.svg", "start": 3167753, "end": 3168337}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/RC_VerticalLineStart.svg", "start": 3168337, "end": 3168580}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/SCC_Action_Diff.svg", "start": 3168580, "end": 3168794}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/SCC_Action_Integrate.svg", "start": 3168794, "end": 3169111}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/SCC_Branched.svg", "start": 3169111, "end": 3169743}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/SCC_Changelist.svg", "start": 3169743, "end": 3169892}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/SCC_CheckedOut.svg", "start": 3169892, "end": 3170116}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/SCC_ContentAdd.svg", "start": 3170116, "end": 3170411}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/SCC_DlgCheckedOutOther.svg", "start": 3170411, "end": 3171222}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/SCC_DlgNotCurrent.svg", "start": 3171222, "end": 3171883}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/SCC_DlgReadOnly.svg", "start": 3171883, "end": 3173406}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/SCC_Lock.svg", "start": 3173406, "end": 3176338}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/SCC_MarkedForDelete.svg", "start": 3176338, "end": 3177026}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/SCC_ModifiedOtherBranch.svg", "start": 3177026, "end": 3177907}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/SCC_NotInDepot.svg", "start": 3177907, "end": 3179208}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/SCC_Shelved.svg", "start": 3179208, "end": 3179622}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/SourceControl.svg", "start": 3179622, "end": 3180463}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/Status/RevisionControl.svg", "start": 3180463, "end": 3181317}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/Status/RevisionControlBadgeConnected.svg", "start": 3181317, "end": 3182765}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/Status/RevisionControlBadgeWarning.svg", "start": 3182765, "end": 3184751}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/icon_SCC_Change_Source_Control_Settings.svg", "start": 3184751, "end": 3186248}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/icon_SCC_History.svg", "start": 3186248, "end": 3187609}, {"filename": "/Engine/Content/Slate/Starship/SourceControl/icon_SCC_Revert.svg", "start": 3187609, "end": 3187963}, {"filename": "/Engine/Content/Slate/Starship/StaticMeshEditor/DisabledOverlay_x16.png", "start": 3187963, "end": 3188146}, {"filename": "/Engine/Content/Slate/Starship/StatusBar/drawer-shadow-bottom.png", "start": 3188146, "end": 3190570}, {"filename": "/Engine/Content/Slate/Testing/BrushWireframe.png", "start": 3190570, "end": 3193852}, {"filename": "/Engine/Content/Slate/Testing/DefaultPawn_16px.png", "start": 3193852, "end": 3231222}, {"filename": "/Engine/Content/Slate/Testing/FlatColorSquare.png", "start": 3231222, "end": 3234013}, {"filename": "/Engine/Content/Slate/Testing/Hyperlink.png", "start": 3234013, "end": 3234316}, {"filename": "/Engine/Content/Slate/Testing/Lit.png", "start": 3234316, "end": 3237803}, {"filename": "/Engine/Content/Slate/Testing/NewLevelBlank.png", "start": 3237803, "end": 3241336}, {"filename": "/Engine/Content/Slate/Testing/TestRotation.png", "start": 3241336, "end": 3242190}, {"filename": "/Engine/Content/Slate/Testing/Unlit.png", "start": 3242190, "end": 3245630}, {"filename": "/Engine/Content/Slate/Testing/Wireframe.png", "start": 3245630, "end": 3248998}, {"filename": "/Engine/Content/Slate/Tutorials/TutorialBorder.png", "start": 3248998, "end": 3250287}, {"filename": "/Engine/Content/Slate/Tutorials/TutorialShadow.png", "start": 3250287, "end": 3251244}, {"filename": "/Engine/Shaders/StandaloneRenderer/OpenGL/SlateElementPixelShader.glsl", "start": 3251244, "end": 3263185}, {"filename": "/Engine/Shaders/StandaloneRenderer/OpenGL/SlateVertexShader.glsl", "start": 3263185, "end": 3264430}, {"filename": "/Engine/Shaders/StandaloneRenderer/OpenGL/SplashFragmentShader.glsl", "start": 3264430, "end": 3264860}, {"filename": "/Engine/Shaders/StandaloneRenderer/OpenGL/SplashVertexShader.glsl", "start": 3264860, "end": 3265107}], "remote_package_size": 3265107});

  })();

// end include: C:\Users\defes\AppData\Local\Temp\tmp97pmakpo.js


var programArgs = [];
var thisProgram = './this.program';
var quit_ = (status, toThrow) => {
  throw toThrow;
};

if (typeof __filename != 'undefined') { // Node
  _scriptName = __filename;
} else
if (ENVIRONMENT_IS_WORKER) {
  _scriptName = self.location.href;
}

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var readAsync, readBinary;

if (ENVIRONMENT_IS_NODE) {

  // These modules will usually be used on Node.js. Load them eagerly to avoid
  // the complexity of lazy-loading.
  var fs = require('node:fs');

  scriptDirectory = __dirname + '/';

// include: node_shell_read.js
readBinary = (filename) => {
  // We need to re-wrap `file://` strings to URLs.
  filename = isFileURI(filename) ? new URL(filename) : filename;
  var ret = fs.readFileSync(filename);
  return ret;
};

readAsync = async (filename, binary = true) => {
  // See the comment in the `readBinary` function.
  filename = isFileURI(filename) ? new URL(filename) : filename;
  var ret = fs.readFileSync(filename, binary ? undefined : 'utf8');
  return ret;
};
// end include: node_shell_read.js
  if (process.argv.length > 1) {
    thisProgram = process.argv[1].replace(/\\/g, '/');
  }

  programArgs = process.argv.slice(2);

  quit_ = (status, toThrow) => {
    process.exitCode = status;
    throw toThrow;
  };

} else

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  try {
    scriptDirectory = new URL('.', _scriptName).href; // includes trailing slash
  } catch {
    // Must be a `blob:` or `data:` URL (e.g. `blob:http://site.com/etc/etc`), we cannot
    // infer anything from them.
  }

  {
// include: web_or_worker_shell_read.js
if (ENVIRONMENT_IS_WORKER) {
    readBinary = (url) => {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.responseType = 'arraybuffer';
      xhr.send(null);
      return new Uint8Array(/** @type{!ArrayBuffer} */(xhr.response));
    };
  }

  readAsync = async (url) => {
    // Fetch has some additional restrictions over XHR, like it can't be used on a file:// url.
    // See https://github.com/github/fetch/pull/92#issuecomment-140665932
    // Cordova or Electron apps are typically loaded from a file:// url.
    // So use XHR on webview if URL is a file URL.
    if (isFileURI(url)) {
      return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = () => {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            resolve(xhr.response);
            return;
          }
          reject(xhr.status);
        };
        xhr.onerror = reject;
        xhr.send(null);
      });
    }
    var response = await fetch(url, { credentials: 'same-origin' });
    if (response.ok) {
      return response.arrayBuffer();
    }
    throw new Error(response.status + ' : ' + response.url);
  };
// end include: web_or_worker_shell_read.js
  }
} else
{
}

var out = console.log.bind(console);
var err = console.error.bind(console);

// end include: shell.js

// include: preamble.js
// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

var wasmBinary;

// Wasm globals

//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

// In STRICT mode, we only define assert() when ASSERTIONS is set.  i.e. we
// don't define it at all in release modes.  This matches the behaviour of
// MINIMAL_RUNTIME.
// TODO(sbc): Make this the default even without STRICT enabled.
/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    // This build was created without ASSERTIONS defined.  `assert()` should not
    // ever be called in this configuration but in case there are callers in
    // the wild leave this simple abort() implementation here for now.
    abort(text);
  }
}

/**
 * Indicates whether filename is delivered via file protocol (as opposed to http/https)
 * @noinline
 */
var isFileURI = (filename) => filename.startsWith('file://');

// include: runtime_common.js
// include: runtime_exceptions.js
// Base Emscripten EH error class
class EmscriptenEH {}

class EmscriptenSjLj extends EmscriptenEH {}

// end include: runtime_exceptions.js
// include: runtime_debug.js
// end include: runtime_debug.js
// Memory management

var runtimeInitialized = false;



// When ALLOW_MEMORY_GROWTH is enabled, the conversion from Wasm
// memory to ArrayBuffer requires some additional logic.
function getMemoryBuffer() {
  return wasmMemory.buffer;
}

function updateMemoryViews() {
  // If we already have a heap that is resizeable/growable buffer we don't
  // need to do anything in updateMemoryViews.
  if (HEAP8?.buffer?.resizable) return;
  var b = getMemoryBuffer();
  HEAP8 = new Int8Array(b);
  HEAP16 = new Int16Array(b);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(b);
  HEAPU16 = new Uint16Array(b);
  HEAP32 = new Int32Array(b);
  HEAPU32 = new Uint32Array(b);
  HEAPF32 = new Float32Array(b);
  HEAPF64 = new Float64Array(b);
  HEAP64 = new BigInt64Array(b);
  HEAPU64 = new BigUint64Array(b);
}

// include: memoryprofiler.js
// end include: memoryprofiler.js
// end include: runtime_common.js
function preRun() {
  var preRun = Module['preRun'];
  if (preRun) {
    if (typeof preRun == 'function') preRun = [preRun];
    onPreRuns.push(...preRun);
  }
  // Begin ATPRERUNS hooks
  callRuntimeCallbacks(onPreRuns);
  // End ATPRERUNS hooks
}

function initRuntime() {
  runtimeInitialized = true;

  // Begin ATINITS hooks
  if (!Module['noFSInit'] && !FS.initialized) FS.init();
TTY.init();
  // End ATINITS hooks

  wasmExports['__wasm_call_ctors']();

  // Begin ATPOSTCTORS hooks
  FS.ignorePermissions = false;
  // End ATPOSTCTORS hooks

}

function postRun() {

  var postRun = Module['postRun'];
  if (postRun) {
    if (typeof postRun == 'function') postRun = [postRun];
    onPostRuns.push(...postRun);
  }

  // Begin ATPOSTRUNS hooks
  callRuntimeCallbacks(onPostRuns);
  // End ATPOSTRUNS hooks
}

/**
 * @param {string|number=} what
 */
function abort(what) {
  Module['onAbort']?.(what);

  what = `Aborted(${what})`;
  // TODO(sbc): Should we remove printing and leave it up to whoever
  // catches the exception?
  err(what);

  ABORT = true;

  what += '. Build with -sASSERTIONS for more info.';

  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  // FIXME This approach does not work in Wasm EH because it currently does not assume
  // all RuntimeErrors are from traps; it decides whether a RuntimeError is from
  // a trap or not based on a hidden field within the object. So at the moment
  // we don't have a way of throwing a wasm trap from JS. TODO Make a JS API that
  // allows this in the wasm spec.

  // Suppress closure compiler warning here. Closure compiler's builtin extern
  // definition for WebAssembly.RuntimeError claims it takes no arguments even
  // though it can.
  // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure gets fixed.
  /** @suppress {checkTypes} */
  var e = new WebAssembly.RuntimeError(what);

  // Throw the error whether or not MODULARIZE is set because abort is used
  // in code paths apart from instantiation where an exception is expected
  // to be thrown when abort is called.
  throw e;
}

var wasmBinaryFile;

function findWasmBinary() {
  return locateFile('studio-probe.wasm');
}

function getBinarySync(file) {
  if (readBinary) {
    return readBinary(file);
  }
  // Throwing a plain string here, even though it not normally advisable since
  // this gets turning into an `abort` in instantiateArrayBuffer.
  throw 'both async and sync fetching of the wasm failed';
}

async function getWasmBinary(binaryFile) {
  // If we don't have the binary yet, load it asynchronously using readAsync.
  if (!wasmBinary) {
    // Fetch the binary using readAsync
    try {
      var response = await readAsync(binaryFile);
      return new Uint8Array(response);
    } catch {
      // Fall back to getBinarySync below;
    }
  }

  // Otherwise, getBinarySync should be able to get it synchronously
  return getBinarySync(binaryFile);
}

async function instantiateArrayBuffer(binaryFile, imports) {
  try {
    var binary = await getWasmBinary(binaryFile);
    var instance = await WebAssembly.instantiate(binary, imports);
    return instance;
  } catch (reason) {
    err(`failed to asynchronously prepare wasm: ${reason}`);

    abort(reason);
  }
}

async function instantiateAsync(binary, binaryFile, imports) {
  if (!binary
      // Don't use streaming for file:// delivered objects in a webview, fetch them synchronously.
      && !isFileURI(binaryFile)
      // Avoid instantiateStreaming() on Node.js environment for now, as while
      // Node.js v18.1.0 implements it, it does not have a full fetch()
      // implementation yet.
      //
      // Reference:
      //   https://github.com/emscripten-core/emscripten/pull/16917
      && !ENVIRONMENT_IS_NODE
     ) {
    try {
      var response = fetch(binaryFile, { credentials: 'same-origin' });
      var instantiationResult = await WebAssembly.instantiateStreaming(response, imports);
      return instantiationResult;
    } catch (reason) {
      // We expect the most common failure cause to be a bad MIME type for the binary,
      // in which case falling back to ArrayBuffer instantiation should work.
      err(`wasm streaming compile failed: ${reason}`);
      err('falling back to ArrayBuffer instantiation');
      // fall back of instantiateArrayBuffer below
    };
  }
  return instantiateArrayBuffer(binaryFile, imports);
}

function getWasmImports() {
  // prepare imports
  var imports = {
    'env': wasmImports,
    'wasi_snapshot_preview1': wasmImports,
  };
  return imports;
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
async function createWasm() {
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  function receiveInstance(instance) {
    wasmExports = instance.exports;

    wasmExports = applySignatureConversions(wasmExports);

    assignWasmExports(wasmExports);

    updateMemoryViews();

    return wasmExports;
  }

  // Prefer streaming instantiation if available.
  function receiveInstantiationResult(result) {
    // 'result' is a ResultObject object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
    // When the regression is fixed, can restore the above PTHREADS-enabled path.
    return receiveInstance(result['instance']);
  }

  var info = getWasmImports();

  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to
  // run the instantiation parallel to any other async startup actions they are
  // performing.
  // Also pthreads and wasm workers initialize the wasm instance through this
  // path.
  var instantiateWasm = Module['instantiateWasm'];
  if (instantiateWasm) {
    return new Promise((resolve) => {
        instantiateWasm(info, (inst) => resolve(receiveInstance(inst)));
    });
  }

  wasmBinaryFile ??= findWasmBinary();
  var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
  var exports = receiveInstantiationResult(result);
  return exports;
}

// end include: preamble.js

// Begin JS library code


  class ExitStatus {
      name = 'ExitStatus';
      constructor(status) {
        this.message = `Program terminated with exit(${status})`;
        this.status = status;
      }
    }

  /** @type {!Int8Array} */
  var HEAP8;

  var callRuntimeCallbacks = (callbacks) => {
      while (callbacks.length > 0) {
        // Pass the module as the first argument.
        callbacks.shift()(Module);
      }
    };
  var onPostRuns = [];
  var addOnPostRun = (cb) => onPostRuns.push(cb);

  var onPreRuns = [];
  var addOnPreRun = (cb) => onPreRuns.push(cb);


  var noExitRuntime = true;

  var stackRestore = (val) => __emscripten_stack_restore(val);

  var stackSave = () => _emscripten_stack_get_current();

  

  function __Z10StaticEnumI13EUINavigationEP5UEnumv(...args
  ) {
  abort('missing function: _Z10StaticEnumI13EUINavigationEP5UEnumv');
  }
  __Z10StaticEnumI13EUINavigationEP5UEnumv.stub = true;

  function __Z10StaticEnumI18ENavigationGenesisEP5UEnumv(...args
  ) {
  abort('missing function: _Z10StaticEnumI18ENavigationGenesisEP5UEnumv');
  }
  __Z10StaticEnumI18ENavigationGenesisEP5UEnumv.stub = true;

  function __Z10StaticEnumI25ESlateDebuggingFocusEventEP5UEnumv(...args
  ) {
  abort('missing function: _Z10StaticEnumI25ESlateDebuggingFocusEventEP5UEnumv');
  }
  __Z10StaticEnumI25ESlateDebuggingFocusEventEP5UEnumv.stub = true;

  function __Z10StaticEnumI25ESlateDebuggingInputEventEP5UEnumv(...args
  ) {
  abort('missing function: _Z10StaticEnumI25ESlateDebuggingInputEventEP5UEnumv');
  }
  __Z10StaticEnumI25ESlateDebuggingInputEventEP5UEnumv.stub = true;

  function __Z10StaticEnumI28EOverriddenPropertyOperationEP5UEnumv(...args
  ) {
  abort('missing function: _Z10StaticEnumI28EOverriddenPropertyOperationEP5UEnumv');
  }
  __Z10StaticEnumI28EOverriddenPropertyOperationEP5UEnumv.stub = true;

  function __Z10StaticEnumI31ESlateDebuggingNavigationMethodEP5UEnumv(...args
  ) {
  abort('missing function: _Z10StaticEnumI31ESlateDebuggingNavigationMethodEP5UEnumv');
  }
  __Z10StaticEnumI31ESlateDebuggingNavigationMethodEP5UEnumv.stub = true;

  function __Z10StaticEnumIN12EMouseCursor4TypeEEP5UEnumv(...args
  ) {
  abort('missing function: _Z10StaticEnumIN12EMouseCursor4TypeEEP5UEnumv');
  }
  __Z10StaticEnumIN12EMouseCursor4TypeEEP5UEnumv.stub = true;

  function __Z42Z_Construct_UScriptStruct_FInstancedStruct19ETypeConstructPhase(...args
  ) {
  abort('missing function: _Z42Z_Construct_UScriptStruct_FInstancedStruct19ETypeConstructPhase');
  }
  __Z42Z_Construct_UScriptStruct_FInstancedStruct19ETypeConstructPhase.stub = true;

  function __Z43Z_Construct_UScriptStruct_FNavigationMethod19ETypeConstructPhase(...args
  ) {
  abort('missing function: _Z43Z_Construct_UScriptStruct_FNavigationMethod19ETypeConstructPhase');
  }
  __Z43Z_Construct_UScriptStruct_FNavigationMethod19ETypeConstructPhase.stub = true;

  function __Z67Z_Construct_UScriptStruct_FTestUninitializedScriptStructMembersTest19ETypeConstructPhase(...args
  ) {
  abort('missing function: _Z67Z_Construct_UScriptStruct_FTestUninitializedScriptStructMembersTest19ETypeConstructPhase');
  }
  __Z67Z_Construct_UScriptStruct_FTestUninitializedScriptStructMembersTest19ETypeConstructPhase.stub = true;

  function __ZN10SLinkedBox9ConstructERKNS_10FArgumentsE10TSharedRefI17FLinkedBoxManagerL7ESPMode1EE(...args
  ) {
  abort('missing function: _ZN10SLinkedBox9ConstructERKNS_10FArgumentsE10TSharedRefI17FLinkedBoxManagerL7ESPMode1EE');
  }
  __ZN10SLinkedBox9ConstructERKNS_10FArgumentsE10TSharedRefI17FLinkedBoxManagerL7ESPMode1EE.stub = true;

  function __ZN10SLinkedBoxC1Ev(...args
  ) {
  abort('missing function: _ZN10SLinkedBoxC1Ev');
  }
  __ZN10SLinkedBoxC1Ev.stub = true;

  function __ZN10SLinkedBoxD1Ev(...args
  ) {
  abort('missing function: _ZN10SLinkedBoxD1Ev');
  }
  __ZN10SLinkedBoxD1Ev.stub = true;

  function __ZN10UInterfaceC1ERK18FObjectInitializer(...args
  ) {
  abort('missing function: _ZN10UInterfaceC1ERK18FObjectInitializer');
  }
  __ZN10UInterfaceC1ERK18FObjectInitializer.stub = true;

  function __ZN14IPluginManager3GetEv(...args
  ) {
  abort('missing function: _ZN14IPluginManager3GetEv');
  }
  __ZN14IPluginManager3GetEv.stub = true;

  function __ZN17FLinkedBoxManagerC1Ev(...args
  ) {
  abort('missing function: _ZN17FLinkedBoxManagerC1Ev');
  }
  __ZN17FLinkedBoxManagerC1Ev.stub = true;

  function __ZN17FLinkedBoxManagerD1Ev(...args
  ) {
  abort('missing function: _ZN17FLinkedBoxManagerD1Ev');
  }
  __ZN17FLinkedBoxManagerD1Ev.stub = true;

  function __ZN21FOodleDataCompression10DecompressEPvxPKvx(...args
  ) {
  abort('missing function: _ZN21FOodleDataCompression10DecompressEPvxPKvx');
  }
  __ZN21FOodleDataCompression10DecompressEPvxPKvx.stub = true;

  function __ZN21FOodleDataCompression39CompressionFormatInitOnFirstUseFromLockEv(...args
  ) {
  abort('missing function: _ZN21FOodleDataCompression39CompressionFormatInitOnFirstUseFromLockEv');
  }
  __ZN21FOodleDataCompression39CompressionFormatInitOnFirstUseFromLockEv.stub = true;

  function __ZN28FEmscriptenPlatformStackWalk27CaptureThreadStackBackTraceEyPyjPv(...args
  ) {
  abort('missing function: _ZN28FEmscriptenPlatformStackWalk27CaptureThreadStackBackTraceEyPyjPv');
  }
  __ZN28FEmscriptenPlatformStackWalk27CaptureThreadStackBackTraceEyPyjPv.stub = true;

  function __ZN2UE13PluginManager7Private27SetCoreUObjectPluginManagerERNS1_25ICoreUObjectPluginManagerE(...args
  ) {
  abort('missing function: _ZN2UE13PluginManager7Private27SetCoreUObjectPluginManagerERNS1_25ICoreUObjectPluginManagerE');
  }
  __ZN2UE13PluginManager7Private27SetCoreUObjectPluginManagerERNS1_25ICoreUObjectPluginManagerE.stub = true;

  function __ZN2UE13PreciseFPHashEd(...args
  ) {
  abort('missing function: _ZN2UE13PreciseFPHashEd');
  }
  __ZN2UE13PreciseFPHashEd.stub = true;

  function __ZN2UE13PreciseFPHashEf(...args
  ) {
  abort('missing function: _ZN2UE13PreciseFPHashEf');
  }
  __ZN2UE13PreciseFPHashEf.stub = true;

  function __ZN2UE14PreciseFPEqualEdd(...args
  ) {
  abort('missing function: _ZN2UE14PreciseFPEqualEdd');
  }
  __ZN2UE14PreciseFPEqualEdd.stub = true;

  function __ZN2UE14PreciseFPEqualEff(...args
  ) {
  abort('missing function: _ZN2UE14PreciseFPEqualEff');
  }
  __ZN2UE14PreciseFPEqualEff.stub = true;

  function __ZN2UE5SlatelsER8FArchiveRNS0_25FPreprocessedFontGeometryE(...args
  ) {
  abort('missing function: _ZN2UE5SlatelsER8FArchiveRNS0_25FPreprocessedFontGeometryE');
  }
  __ZN2UE5SlatelsER8FArchiveRNS0_25FPreprocessedFontGeometryE.stub = true;

  function __ZN4FApp24GetEpicProductIdentifierEv(...args
  ) {
  abort('missing function: _ZN4FApp24GetEpicProductIdentifierEv');
  }
  __ZN4FApp24GetEpicProductIdentifierEv.stub = true;

  function __ZN9UFunctionD0Ev(...args
  ) {
  abort('missing function: _ZN9UFunctionD0Ev');
  }
  __ZN9UFunctionD0Ev.stub = true;

  function __ZN9UFunctionD1Ev(...args
  ) {
  abort('missing function: _ZN9UFunctionD1Ev');
  }
  __ZN9UFunctionD1Ev.stub = true;

  function __ZNK2UE5Slate25FPreprocessedFontGeometry16GetAllocatedSizeEv(...args
  ) {
  abort('missing function: _ZNK2UE5Slate25FPreprocessedFontGeometry16GetAllocatedSizeEv');
  }
  __ZNK2UE5Slate25FPreprocessedFontGeometry16GetAllocatedSizeEv.stub = true;

  var INT53_MAX = 9007199254740992;
  
  var INT53_MIN = -9007199254740992;
  var bigintToI53Checked = (num) => (num < INT53_MIN || num > INT53_MAX) ? NaN : Number(num);
  
  var wasmTableMirror = [];
  
  
  var getWasmTableEntry = (funcPtr) => {
      // Function pointers should show up as numbers, even under wasm64, but
      // we still have some places where bigint values can flow here.
      // https://github.com/emscripten-core/emscripten/issues/18200
      funcPtr = Number(funcPtr);
      var func = wasmTableMirror[funcPtr];
      if (!func) {
        /** @suppress {checkTypes} */
        wasmTableMirror[funcPtr] = func = wasmTable.get(BigInt(funcPtr));
      }
      return func;
    };
  function ___call_sighandler(fp, sig) {
    fp = bigintToI53Checked(fp);
  
  return getWasmTableEntry(fp)(sig);
  }

  var PATH = {
  isAbs:(path) => path.charAt(0) === '/',
  splitPath:(filename) => {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },
  normalizeArray:(parts, allowAboveRoot) => {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up; up--) {
            parts.unshift('..');
          }
        }
        return parts;
      },
  normalize:(path) => {
        var isAbsolute = PATH.isAbs(path),
            trailingSlash = path.slice(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter((p) => !!p), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },
  dirname:(path) => {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.slice(0, -1);
        }
        return root + dir;
      },
  basename:(path) => path && path.match(/([^\/]+|\/)\/*$/)[1],
join:(...paths) => PATH.normalize(paths.join('/')),
join2:(l, r) => PATH.normalize(l + '/' + r),
};

var initRandomFill = () => {

    return (view) => (crypto.getRandomValues(view), 0);
  };
var randomFill = (view) => (randomFill = initRandomFill())(view);



var PATH_FS = {
resolve:(...args) => {
      var resolvedPath = '',
        resolvedAbsolute = false;
      for (var i = args.length - 1; i >= -1 && !resolvedAbsolute; i--) {
        var path = (i >= 0) ? args[i] : FS.cwd();
        // Skip empty and invalid entries
        if (typeof path != 'string') {
          throw new TypeError('Arguments to path.resolve must be strings');
        } else if (!path) {
          return ''; // an invalid portion invalidates the whole thing
        }
        resolvedPath = path + '/' + resolvedPath;
        resolvedAbsolute = PATH.isAbs(path);
      }
      // At this point the path should be resolved to a full absolute path, but
      // handle relative paths to be safe (might happen when process.cwd() fails)
      resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter((p) => !!p), !resolvedAbsolute).join('/');
      return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
    },
relative:(from, to) => {
      from = PATH_FS.resolve(from).slice(1);
      to = PATH_FS.resolve(to).slice(1);
      function trim(arr) {
        var start = 0;
        for (; start < arr.length; start++) {
          if (arr[start] !== '') break;
        }
        var end = arr.length - 1;
        for (; end >= 0; end--) {
          if (arr[end] !== '') break;
        }
        if (start > end) return [];
        return arr.slice(start, end - start + 1);
      }
      var fromParts = trim(from.split('/'));
      var toParts = trim(to.split('/'));
      var length = Math.min(fromParts.length, toParts.length);
      var samePartsLength = length;
      for (var i = 0; i < length; i++) {
        if (fromParts[i] !== toParts[i]) {
          samePartsLength = i;
          break;
        }
      }
      var outputParts = [];
      for (var i = samePartsLength; i < fromParts.length; i++) {
        outputParts.push('..');
      }
      outputParts = outputParts.concat(toParts.slice(samePartsLength));
      return outputParts.join('/');
    },
};


var UTF8Decoder = globalThis.TextDecoder && new TextDecoder();


  /**
   * heapOrArray is either a regular array, or a JavaScript typed array view.
   * @param {number} idx
   * @param {number=} maxBytesToRead
   * @param {boolean=} ignoreNul
   * @return {number}
   */
  var findStringEnd = (heapOrArray, idx, maxBytesToRead, ignoreNul) => {
      var maxIdx = idx + maxBytesToRead;
      if (ignoreNul) return maxIdx;
      // TextDecoder needs to know the byte length in advance, it doesn't stop on
      // null terminator by itself.
      // As a tiny code save trick, compare idx against maxIdx using a negation,
      // so that maxBytesToRead=undefined/NaN means Infinity.
      while (heapOrArray[idx] && !(idx >= maxIdx)) ++idx;
      return idx;
    };
  
    /**
   * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
   * array that contains uint8 values, returns a copy of that string as a
   * Javascript String object.
   * heapOrArray is either a regular array, or a JavaScript typed array view.
   * @param {number=} idx
   * @param {number=} maxBytesToRead
   * @param {boolean=} ignoreNul - If true, the function will not stop on a NUL character.
   * @return {string}
   */
  var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead, ignoreNul) => {
  
      var endPtr = findStringEnd(heapOrArray, idx, maxBytesToRead, ignoreNul);
  
      // When using conditional TextDecoder, skip it for short strings as the overhead of the native call is not worth it.
      if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
        return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
      }
      var str = '';
      while (idx < endPtr) {
        // For UTF8 byte structure, see:
        // http://en.wikipedia.org/wiki/UTF-8#Description
        // https://www.ietf.org/rfc/rfc2279.txt
        // https://tools.ietf.org/html/rfc3629
        var u0 = heapOrArray[idx++];
        if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
        var u1 = heapOrArray[idx++] & 63;
        if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
        var u2 = heapOrArray[idx++] & 63;
        if ((u0 & 0xF0) == 0xE0) {
          u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
        } else {
          u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
        }
  
        if (u0 < 0x10000) {
          str += String.fromCharCode(u0);
        } else {
          var ch = u0 - 0x10000;
          str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
        }
      }
      return str;
    };
  
  var FS_stdin_getChar_buffer = [];
  
  var lengthBytesUTF8 = (str) => {
      var len = 0;
      for (var i = 0; i < str.length; ++i) {
        // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
        // unit, not a Unicode code point of the character! So decode
        // UTF16->UTF32->UTF8.
        // See http://unicode.org/faq/utf_bom.html#utf16-3
        var c = str.charCodeAt(i); // possibly a lead surrogate
        if (c <= 0x7F) {
          len++;
        } else if (c <= 0x7FF) {
          len += 2;
        } else if (c >= 0xD800 && c <= 0xDFFF) {
          len += 4; ++i;
        } else {
          len += 3;
        }
      }
      return len;
    };
  
  var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
      // Parameter maxBytesToWrite is not optional. Negative values, 0, null,
      // undefined and false each don't write out any bytes.
      if (!(maxBytesToWrite > 0))
        return 0;
  
      var startIdx = outIdx;
      var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
      for (var i = 0; i < str.length; ++i) {
        // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description
        // and https://www.ietf.org/rfc/rfc2279.txt
        // and https://tools.ietf.org/html/rfc3629
        var u = str.codePointAt(i);
        if (u <= 0x7F) {
          if (outIdx >= endIdx) break;
          heap[outIdx++] = u;
        } else if (u <= 0x7FF) {
          if (outIdx + 1 >= endIdx) break;
          heap[outIdx++] = 0xC0 | (u >> 6);
          heap[outIdx++] = 0x80 | (u & 63);
        } else if (u <= 0xFFFF) {
          if (outIdx + 2 >= endIdx) break;
          heap[outIdx++] = 0xE0 | (u >> 12);
          heap[outIdx++] = 0x80 | ((u >> 6) & 63);
          heap[outIdx++] = 0x80 | (u & 63);
        } else {
          if (outIdx + 3 >= endIdx) break;
          heap[outIdx++] = 0xF0 | (u >> 18);
          heap[outIdx++] = 0x80 | ((u >> 12) & 63);
          heap[outIdx++] = 0x80 | ((u >> 6) & 63);
          heap[outIdx++] = 0x80 | (u & 63);
          // Gotcha: if codePoint is over 0xFFFF, it is represented as a surrogate pair in UTF-16.
          // We need to manually skip over the second code unit for correct iteration.
          i++;
        }
      }
      // Null-terminate the pointer to the buffer.
      heap[outIdx] = 0;
      return outIdx - startIdx;
    };
  /** @type {function(string, boolean=, number=)} */
  var intArrayFromString = (stringy, dontAddNull, length) => {
      var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
      var u8array = new Array(len);
      var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
      if (dontAddNull) u8array.length = numBytesWritten;
      return u8array;
    };
  var FS_stdin_getChar = () => {
      if (!FS_stdin_getChar_buffer.length) {
        var result = null;
        if (ENVIRONMENT_IS_NODE) {
          // we will read data by chunks of BUFSIZE
          var BUFSIZE = 256;
          var buf = Buffer.alloc(BUFSIZE);
          var bytesRead = 0;
  
          // For some reason we must suppress a closure warning here, even though
          // fd definitely exists on process.stdin, and is even the proper way to
          // get the fd of stdin,
          // https://github.com/nodejs/help/issues/2136#issuecomment-523649904
          // This started to happen after moving this logic out of library_tty.js,
          // so it is related to the surrounding code in some unclear manner.
          /** @suppress {missingProperties} */
          var fd = process.stdin.fd;
  
          try {
            bytesRead = fs.readSync(fd, buf, 0, BUFSIZE);
          } catch(e) {
            // Cross-platform differences: on Windows, reading EOF throws an
            // exception, but on other OSes, reading EOF returns 0. Uniformize
            // behavior by treating the EOF exception to return 0.
            if (e.toString().includes('EOF')) bytesRead = 0;
            else throw e;
          }
  
          if (bytesRead > 0) {
            result = buf.slice(0, bytesRead).toString('utf-8');
          }
        } else
        if (globalThis.window?.prompt) {
          // Browser.
          result = window.prompt('Input: ');  // returns null on cancel
          if (result !== null) {
            result += '\n';
          }
        } else
        {}
        if (!result) {
          return null;
        }
        FS_stdin_getChar_buffer = intArrayFromString(result, true);
      }
      return FS_stdin_getChar_buffer.shift();
    };
  var TTY = {
  ttys:[],
  init() {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process.stdin.setEncoding('utf8');
        // }
      },
  shutdown() {
        // https://github.com/emscripten-core/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process.stdin.pause();
        // }
      },
  register(dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },
  stream_ops:{
  open(stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(43);
          }
          stream.tty = tty;
          stream.seekable = false;
        },
  close(stream) {
          // flush any pending line data
          stream.tty.ops.fsync(stream.tty);
        },
  fsync(stream) {
          stream.tty.ops.fsync(stream.tty);
        },
  read(stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(60);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(29);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(6);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.atime = Date.now();
          }
          return bytesRead;
        },
  write(stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(60);
          }
          try {
            for (var i = 0; i < length; i++) {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            }
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
          if (length) {
            stream.node.mtime = stream.node.ctime = Date.now();
          }
          return i;
        },
  },
  default_tty_ops:{
  get_char(tty) {
          return FS_stdin_getChar();
        },
  put_char(tty, val) {
          if (val === null || val === 10) {
            out(UTF8ArrayToString(tty.output));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val); // val == 0 would cut text output off in the middle.
          }
        },
  fsync(tty) {
          if (tty.output?.length > 0) {
            out(UTF8ArrayToString(tty.output));
            tty.output = [];
          }
        },
  ioctl_tcgets(tty) {
          // typical setting
          return {
            c_iflag: 25856,
            c_oflag: 5,
            c_cflag: 191,
            c_lflag: 35387,
            c_cc: [
              0x03, 0x1c, 0x7f, 0x15, 0x04, 0x00, 0x01, 0x00, 0x11, 0x13, 0x1a, 0x00,
              0x12, 0x0f, 0x17, 0x16, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
              0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
            ]
          };
        },
  ioctl_tcsets(tty, optional_actions, data) {
          // currently just ignore
          return 0;
        },
  ioctl_tiocgwinsz(tty) {
          return [24, 80];
        },
  },
  default_tty1_ops:{
  put_char(tty, val) {
          if (val === null || val === 10) {
            err(UTF8ArrayToString(tty.output));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },
  fsync(tty) {
          if (tty.output?.length > 0) {
            err(UTF8ArrayToString(tty.output));
            tty.output = [];
          }
        },
  },
  };
  
  
  /** @type {!Uint8Array} */
  var HEAPU8;
  var zeroMemory = (ptr, size) => HEAPU8.fill(0, ptr, ptr + size);
  
  var alignMemory = (size, alignment) => {
      return Math.ceil(size / alignment) * alignment;
    };
  var mmapAlloc = (size) => {
      size = alignMemory(size, 65536);
      var ptr = _emscripten_builtin_memalign(65536, size);
      if (ptr) zeroMemory(ptr, size);
      return ptr;
    };
  
  var MEMFS = {
  ops_table:null,
  mount(mount) {
        return MEMFS.createNode(null, '/', 16895, 0);
      },
  createNode(parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // not supported
          throw new FS.ErrnoError(63);
        }
        MEMFS.ops_table ||= {
          dir: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr,
              lookup: MEMFS.node_ops.lookup,
              mknod: MEMFS.node_ops.mknod,
              rename: MEMFS.node_ops.rename,
              unlink: MEMFS.node_ops.unlink,
              rmdir: MEMFS.node_ops.rmdir,
              readdir: MEMFS.node_ops.readdir,
              symlink: MEMFS.node_ops.symlink
            },
            stream: {
              llseek: MEMFS.stream_ops.llseek
            }
          },
          file: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr
            },
            stream: {
              llseek: MEMFS.stream_ops.llseek,
              read: MEMFS.stream_ops.read,
              write: MEMFS.stream_ops.write,
              mmap: MEMFS.stream_ops.mmap,
              msync: MEMFS.stream_ops.msync
            }
          },
          link: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr,
              readlink: MEMFS.node_ops.readlink
            },
            stream: {}
          },
          chrdev: {
            node: {
              getattr: MEMFS.node_ops.getattr,
              setattr: MEMFS.node_ops.setattr
            },
            stream: FS.chrdev_stream_ops
          }
        };
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          // The actual number of bytes used in the typed array, as opposed to
          // contents.length which gives the whole capacity.
          node.usedBytes = 0;
          // The byte data of the file is stored in a typed array.
          // Note: typed arrays are not resizable like normal JS arrays are, so
          // there is a small penalty involved for appending file writes that
          // continuously grow a file similar to std::vector capacity vs used.
          node.contents = MEMFS.emptyFileContents ??= new Uint8Array(0);
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.atime = node.mtime = node.ctime = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
          parent.atime = parent.mtime = parent.ctime = node.atime;
        }
        return node;
      },
  getFileDataAsTypedArray(node) {
        return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
      },
  expandFileStorage(node, newCapacity) {
        var prevCapacity = node.contents.length;
        if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
        // Don't expand strictly to the given requested limit if it's only a very
        // small increase, but instead geometrically grow capacity.
        // For small filesizes (<1MB), perform size*2 geometric increase, but for
        // large sizes, do a much more conservative size*1.125 increase to avoid
        // overshooting the allocation cap by a very large margin.
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) >>> 0);
        if (prevCapacity) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
        var oldContents = MEMFS.getFileDataAsTypedArray(node);
        node.contents = new Uint8Array(newCapacity); // Allocate new storage.
        node.contents.set(oldContents);
      },
  resizeFileStorage(node, newSize) {
        if (node.usedBytes == newSize) return;
        var oldContents = node.contents;
        node.contents = new Uint8Array(newSize); // Allocate new storage.
        node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
        node.usedBytes = newSize;
      },
  node_ops:{
  getattr(node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.atime);
          attr.mtime = new Date(node.mtime);
          attr.ctime = new Date(node.ctime);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },
  setattr(node, attr) {
          for (const key of ['mode', 'atime', 'mtime', 'ctime']) {
            if (attr[key] != null) {
              node[key] = attr[key];
            }
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        },
  lookup(parent, name) {
          // This error may happen quite a bit. To avoid overhead we reuse it (and
          // suffer a lack of stack info).
          if (!MEMFS.doesNotExistError) {
            MEMFS.doesNotExistError = new FS.ErrnoError(44);
            /** @suppress {checkTypes} */
            MEMFS.doesNotExistError.stack = '<generic error, no stack>';
          }
          throw MEMFS.doesNotExistError;
        },
  mknod(parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },
  rename(old_node, new_dir, new_name) {
          var new_node;
          try {
            new_node = FS.lookupNode(new_dir, new_name);
          } catch (e) {}
          if (new_node) {
            if (FS.isDir(old_node.mode)) {
              // if we're overwriting a directory at new_name, make sure it's empty.
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(55);
              }
            }
            FS.hashRemoveNode(new_node);
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          new_dir.contents[new_name] = old_node;
          old_node.name = new_name;
          new_dir.ctime = new_dir.mtime = old_node.parent.ctime = old_node.parent.mtime = Date.now();
        },
  unlink(parent, name) {
          delete parent.contents[name];
          parent.ctime = parent.mtime = Date.now();
        },
  rmdir(parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(55);
          }
          delete parent.contents[name];
          parent.ctime = parent.mtime = Date.now();
        },
  readdir(node) {
          return ['.', '..', ...Object.keys(node.contents)];
        },
  symlink(parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 0o777 | 40960, 0);
          node.link = oldpath;
          return node;
        },
  readlink(node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(28);
          }
          return node.link;
        },
  },
  stream_ops:{
  read(stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          buffer.set(contents.subarray(position, position + size), offset);
          return size;
        },
  write(stream, buffer, offset, length, position, canOwn) {
          // If the buffer is located in main memory (HEAP), and if
          // memory can grow, we can't hold on to references of the
          // memory buffer, as they may get invalidated. That means we
          // need to copy its contents.
          if (buffer.buffer === HEAP8.buffer) {
            canOwn = false;
          }
  
          if (!length) return 0;
          var node = stream.node;
          node.mtime = node.ctime = Date.now();
  
          if (canOwn) {
            node.contents = buffer.subarray(offset, offset + length);
            node.usedBytes = length;
          } else if (node.usedBytes === 0 && position === 0) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
            node.contents = buffer.slice(offset, offset + length);
            node.usedBytes = length;
          } else {
            MEMFS.expandFileStorage(node, position+length);
            // Use typed array write which is available.
            node.contents.set(buffer.subarray(offset, offset + length), position);
            node.usedBytes = Math.max(node.usedBytes, position + length);
          }
          return length;
        },
  llseek(stream, offset, whence) {
          var position = offset;
          if (whence === 1) {
            position += stream.position;
          } else if (whence === 2) {
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(28);
          }
          return position;
        },
  mmap(stream, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if (!(flags & 2) && contents.buffer === HEAP8.buffer) {
            // We can't emulate MAP_SHARED when the file is not backed by the
            // buffer we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            allocated = true;
            ptr = mmapAlloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(48);
            }
            if (contents) {
              // Try to avoid unnecessary slices.
              if (position > 0 || position + length < contents.length) {
                if (contents.subarray) {
                  contents = contents.subarray(position, position + length);
                } else {
                  contents = Array.prototype.slice.call(contents, position, position + length);
                }
              }
              HEAP8.set(contents, ptr);
            }
          }
          return { ptr, allocated };
        },
  msync(stream, buffer, offset, length, mmapFlags) {
          MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
          // should we check if bytesWritten and length are the same?
          return 0;
        },
  },
  };
  
  var FS_modeStringToFlags = (str) => {
      if (typeof str != 'string') return str;
      var flagModes = {
        'r': 0,
        'r+': 2,
        'w': 512 | 64 | 1,
        'w+': 512 | 64 | 2,
        'a': 1024 | 64 | 1,
        'a+': 1024 | 64 | 2,
      };
      var flags = flagModes[str];
      if (typeof flags == 'undefined') {
        throw new Error(`Unknown file open mode: ${str}`);
      }
      return flags;
    };
  
  var FS_fileDataToTypedArray = (data) => {
      if (typeof data == 'string') {
        data = intArrayFromString(data, true);
      }
      if (!data.subarray) {
        data = new Uint8Array(data);
      }
      return data;
    };
  
  var FS_getMode = (canRead, canWrite) => {
      var mode = 0;
      if (canRead) mode |= 292 | 73;
      if (canWrite) mode |= 146;
      return mode;
    };
  
  
  var asyncLoad = async (url) => {
      var arrayBuffer = await readAsync(url);
      return new Uint8Array(arrayBuffer);
    };
  
  
  var FS_createDataFile = (...args) => FS.createDataFile(...args);
  
  var getUniqueRunDependency = (id) => {
      return id;
    };
  
  var dependenciesPromise = null;
  var resolveRunDependencies = async () => dependenciesPromise;
  var runDependencies = 0;
  
  
  var dependenciesPromiseResolve = null;
  var removeRunDependency = (id) => {
      runDependencies--;
  
      Module['monitorRunDependencies']?.(runDependencies);
  
      if (!runDependencies) {
        dependenciesPromiseResolve();
      }
    };
  
  
  var addRunDependency = (id) => {
      if (!runDependencies) {
        dependenciesPromise = new Promise((resolve) => dependenciesPromiseResolve = resolve);
      }
      runDependencies++;
  
      Module['monitorRunDependencies']?.(runDependencies);
  
    };
  
  
  var preloadPlugins = [];
  var FS_handledByPreloadPlugin = async (byteArray, fullname) => {
      // Ensure plugins are ready.
      if (typeof Browser != 'undefined') Browser.init();
  
      for (var plugin of preloadPlugins) {
        if (plugin['canHandle'](fullname)) {
          return plugin['handle'](byteArray, fullname);
        }
      }
      // If no plugin handled this file then return the original/unmodified
      // byteArray.
      return byteArray;
    };
  var FS_preloadFile = async (parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish) => {
      // TODO we should allow people to just pass in a complete filename instead
      // of parent and name being that we just join them anyways
      var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
      var dep = getUniqueRunDependency(`cp ${fullname}`); // might have several active requests for the same fullname
      addRunDependency(dep);
  
      try {
        var byteArray = url;
        if (typeof url == 'string') {
          byteArray = await asyncLoad(url);
        }
  
        byteArray = await FS_handledByPreloadPlugin(byteArray, fullname);
        preFinish?.();
        if (!dontCreateFile) {
          FS_createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
        }
      } finally {
        removeRunDependency(dep);
      }
    };
  var FS_createPreloadedFile = (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
      FS_preloadFile(parent, name, url, canRead, canWrite, dontCreateFile, canOwn, preFinish).then(onload).catch(onerror);
    };
  
  var FS = {
  root:null,
  mounts:[],
  devices:{
  },
  streams:[],
  nextInode:1,
  nameTable:null,
  currentPath:"/",
  initialized:false,
  ignorePermissions:true,
  filesystems:null,
  syncFSRequests:0,
  ErrnoError:class {
        name = 'ErrnoError';
        // We set the `name` property to be able to identify `FS.ErrnoError`
        // - the `name` is a standard ECMA-262 property of error objects. Kind of good to have it anyway.
        // - when using PROXYFS, an error can come from an underlying FS
        // as different FS objects have their own FS.ErrnoError each,
        // the test `err instanceof FS.ErrnoError` won't detect an error coming from another filesystem, causing bugs.
        // we'll use the reliable test `err.name == "ErrnoError"` instead
        constructor(errno) {
          this.errno = errno;
        }
      },
  FSStream:class {
        shared = {};
        get object() {
          return this.node;
        }
        set object(val) {
          this.node = val;
        }
        get isRead() {
          return (this.flags & 2097155) !== 1;
        }
        get isWrite() {
          return (this.flags & 2097155) !== 0;
        }
        get isAppend() {
          return (this.flags & 1024);
        }
        get flags() {
          return this.shared.flags;
        }
        set flags(val) {
          this.shared.flags = val;
        }
        get position() {
          return this.shared.position;
        }
        set position(val) {
          this.shared.position = val;
        }
      },
  FSNode:class {
        node_ops = {};
        stream_ops = {};
        readMode = 292 | 73;
        writeMode = 146;
        mounted = null;
        constructor(parent, name, mode, rdev) {
          if (!parent) {
            parent = this;  // root node sets parent to itself
          }
          this.parent = parent;
          this.mount = parent.mount;
          this.id = FS.nextInode++;
          this.name = name;
          this.mode = mode;
          this.rdev = rdev;
          this.atime = this.mtime = this.ctime = Date.now();
        }
        get read() {
          return (this.mode & this.readMode) === this.readMode;
        }
        set read(val) {
          val ? this.mode |= this.readMode : this.mode &= ~this.readMode;
        }
        get write() {
          return (this.mode & this.writeMode) === this.writeMode;
        }
        set write(val) {
          val ? this.mode |= this.writeMode : this.mode &= ~this.writeMode;
        }
        get isFolder() {
          return FS.isDir(this.mode);
        }
        get isDevice() {
          return FS.isChrdev(this.mode);
        }
        // The per-inode readiness wait-queue. The node carries a Set of listener
        // entries {cb}; producers (SOCKFS, PIPEFS) call notifyListeners on a
        // readiness transition, and poll()/epoll consume it. It lives on the node
        // (not the fd) so dup'd fds share one queue. Only nodes that derive real
        // readiness (sockets, pipes, and an epoll's own node) ever use this -
        // always-ready types (regular files, ttys) never register or notify.
        addListener(cb, exclusive = false) {
          var entry = {cb, exclusive};
          var listeners = (this.listeners ??= new Set());
          listeners.add(entry);
          return {listeners, entry};
        }
        notifyListeners(flags) {
          // Iterates the set without copying, which is safe ONLY under a
          // load-bearing contract that every internal listener must honour:
          //   1. A listener must not run user code synchronously (a poll waiter only
          //      resolves a Promise; an epoll registration only re-lists +
          //      re-notifies; the epoll callback only schedules a tick). User code
          //      runs on a later tick, never inside this loop.
          //   2. A listener may delete entries only from ITS OWN waiter, never from
          //      a sibling node's set that may be mid-iteration. (Deleting an entry
          //      of the set being iterated here is fine - a Set tolerates removal of
          //      a not-yet-visited entry mid-iteration; mutating a *different* node's
          //      set is fine because that set is not being iterated.)
          // Violating either gives silently skipped wakeups that are near-impossible
          // to reproduce. Any new producer/listener must preserve it.
          if (!this.listeners) return;
          // Fire every non-exclusive listener. Among EPOLLEXCLUSIVE registrations
          // (one fd watched by several epolls) wake only one, rotating round-robin
          // per node, to avoid a thundering herd. (Only epoll registrations are ever
          // exclusive; poll waiters and a node's own consumers are not.)
          var excl;
          for (var entry of this.listeners) {
            if (entry.exclusive) (excl ||= []).push(entry);
            else entry.cb(flags);
          }
          if (excl) {
            var i = (this.exclTurn || 0) % excl.length;
            this.exclTurn = i + 1;
            excl[i].cb(flags);
          }
        }
      },
  lookupPath(path, opts = {}) {
        if (!path) {
          throw new FS.ErrnoError(44);
        }
        opts.follow_mount ??= true
  
        if (!PATH.isAbs(path)) {
          path = FS.cwd() + '/' + path;
        }
  
        // limit max consecutive symlinks to SYMLOOP_MAX.
        linkloop: for (var nlinks = 0; nlinks < 40; nlinks++) {
          // split the absolute path
          var parts = path.split('/').filter((p) => !!p);
  
          // start at the root
          var current = FS.root;
          var current_path = '/';
  
          for (var i = 0; i < parts.length; i++) {
            var islast = (i === parts.length-1);
            if (islast && opts.parent) {
              // stop resolving
              break;
            }
  
            if (parts[i] === '.') {
              continue;
            }
  
            if (parts[i] === '..') {
              current_path = PATH.dirname(current_path);
              if (FS.isRoot(current)) {
                path = current_path + '/' + parts.slice(i + 1).join('/');
                // We're making progress here, don't let many consecutive ..'s
                // lead to ELOOP
                nlinks--;
                continue linkloop;
              } else {
                current = current.parent;
              }
              continue;
            }
  
            current_path = PATH.join2(current_path, parts[i]);
            try {
              current = FS.lookupNode(current, parts[i]);
            } catch (e) {
              // if noent_okay is true, suppress a ENOENT in the last component
              // and return an object with an undefined node. This is needed for
              // resolving symlinks in the path when creating a file.
              if ((e?.errno === 44) && islast && opts.noent_okay) {
                return { path: current_path };
              }
              throw e;
            }
  
            // jump to the mount's root node if this is a mountpoint
            if (FS.isMountpoint(current) && (!islast || opts.follow_mount)) {
              current = current.mounted.root;
            }
  
            // by default, lookupPath will not follow a symlink if it is the final path component.
            // setting opts.follow = true will override this behavior.
            if (FS.isLink(current.mode) && (!islast || opts.follow)) {
              if (!current.node_ops.readlink) {
                throw new FS.ErrnoError(52);
              }
              var link = current.node_ops.readlink(current);
              if (!PATH.isAbs(link)) {
                link = PATH.dirname(current_path) + '/' + link;
              }
              path = link + '/' + parts.slice(i + 1).join('/');
              continue linkloop;
            }
          }
          return { path: current_path, node: current };
        }
        throw new FS.ErrnoError(32);
      },
  getPath(node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? `${mount}/${path}` : mount + path;
          }
          path = path ? `${node.name}/${path}` : node.name;
          node = node.parent;
        }
      },
  hashName(parentid, name) {
        var hash = 0;
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },
  hashAddNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },
  hashRemoveNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },
  lookupNode(parent, name) {
        var errCode = FS.mayLookup(parent);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },
  createNode(parent, name, mode, rdev) {
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },
  destroyNode(node) {
        FS.hashRemoveNode(node);
      },
  isRoot(node) {
        return node === node.parent;
      },
  isMountpoint(node) {
        return !!node.mounted;
      },
  isFile(mode) {
        return (mode & 61440) === 32768;
      },
  isDir(mode) {
        return (mode & 61440) === 16384;
      },
  isLink(mode) {
        return (mode & 61440) === 40960;
      },
  isChrdev(mode) {
        return (mode & 61440) === 8192;
      },
  isBlkdev(mode) {
        return (mode & 61440) === 24576;
      },
  isFIFO(mode) {
        return (mode & 61440) === 4096;
      },
  isSocket(mode) {
        return (mode & 49152) === 49152;
      },
  flagsToPermissionString(flag) {
        var perms = ['r', 'w', 'rw'][flag & 3];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },
  nodePermissions(node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.includes('r') && !(node.mode & 292)) {
          return 2;
        }
        if (perms.includes('w') && !(node.mode & 146)) {
          return 2;
        }
        if (perms.includes('x') && !(node.mode & 73)) {
          return 2;
        }
        return 0;
      },
  mayLookup(dir) {
        if (!FS.isDir(dir.mode)) return 54;
        var errCode = FS.nodePermissions(dir, 'x');
        if (errCode) return errCode;
        if (!dir.node_ops.lookup) return 2;
        return 0;
      },
  mayCreate(dir, name) {
        if (!FS.isDir(dir.mode)) {
          return 54;
        }
        try {
          var node = FS.lookupNode(dir, name);
          return 20;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },
  mayDelete(dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var errCode = FS.nodePermissions(dir, 'wx');
        if (errCode) {
          return errCode;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return 54;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return 10;
          }
        } else if (FS.isDir(node.mode)) {
          return 31;
        }
        return 0;
      },
  mayOpen(node, flags) {
        if (!node) {
          return 44;
        }
        if (FS.isLink(node.mode)) {
          return 32;
        }
        var mode = FS.flagsToPermissionString(flags);
        if (FS.isDir(node.mode)) {
          // opening for write
          // TODO: check for O_SEARCH? (== search for dir only)
          if (mode !== 'r' || (flags & (512 | 64))) {
            return 31;
          }
        }
        return FS.nodePermissions(node, mode);
      },
  checkOpExists(op, err) {
        if (!op) {
          throw new FS.ErrnoError(err);
        }
        return op;
      },
  MAX_OPEN_FDS:4096,
  nextfd() {
        for (var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(33);
      },
  getStreamChecked(fd) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(8);
        }
        return stream;
      },
  getStream:(fd) => FS.streams[fd],
  createStream(stream, fd = -1) {
  
        // clone it, so we can return an instance of FSStream
        stream = Object.assign(new FS.FSStream(), stream);
        if (fd == -1) {
          fd = FS.nextfd();
        }
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },
  closeStream(fd) {
        FS.streams[fd] = null;
      },
  dupStream(origStream, fd = -1) {
        var stream = FS.createStream(origStream, fd);
        stream.stream_ops?.dup?.(stream);
        return stream;
      },
  doSetAttr(stream, node, attr) {
        var setattr = stream?.stream_ops.setattr;
        var arg = setattr ? stream : node;
        setattr ??= node.node_ops.setattr;
        FS.checkOpExists(setattr, 63)
        try {
          setattr(arg, attr);
        } catch (e) {
          if (e instanceof RangeError) {
            throw new FS.ErrnoError(22);
          }
          throw e;
        }
      },
  chrdev_stream_ops:{
  open(stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          stream.stream_ops.open?.(stream);
        },
  llseek() {
          throw new FS.ErrnoError(70);
        },
  },
  major:(dev) => ((dev) >> 8),
  minor:(dev) => ((dev) & 0xff),
  makedev:(ma, mi) => ((ma) << 8 | (mi)),
  registerDevice(dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },
  getDevice:(dev) => FS.devices[dev],
  getMounts(mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push(...m.mounts);
        }
  
        return mounts;
      },
  syncfs(populate, callback) {
        if (typeof populate == 'function') {
          callback = populate;
          populate = false;
        }
  
        FS.syncFSRequests++;
  
        if (FS.syncFSRequests > 1) {
          err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`);
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function doCallback(errCode) {
          FS.syncFSRequests--;
          return callback(errCode);
        }
  
        function done(errCode) {
          if (errCode) {
            if (!done.errored) {
              done.errored = true;
              return doCallback(errCode);
            }
            return;
          }
          if (++completed >= mounts.length) {
            doCallback(null);
          }
        };
  
        // sync all mounts
        for (var mount of mounts) {
          if (mount.type.syncfs) {
            mount.type.syncfs(mount, populate, done);
          } else {
            done(null);
          }
        }
      },
  mount(type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(10);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54);
          }
        }
  
        var mount = {
          type,
          opts,
          mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },
  unmount(mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(28);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        for (var [hash, current] of Object.entries(FS.nameTable)) {
          while (current) {
            var next = current.name_next;
  
            if (mounts.includes(current.mount)) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        }
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        node.mount.mounts.splice(idx, 1);
      },
  lookup(parent, name) {
        return parent.node_ops.lookup(parent, name);
      },
  mknod(path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name) {
          throw new FS.ErrnoError(28);
        }
        if (name === '.' || name === '..') {
          throw new FS.ErrnoError(20);
        }
        var errCode = FS.mayCreate(parent, name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },
  statfs(path) {
        return FS.statfsNode(FS.lookupPath(path, {follow: true}).node);
      },
  statfsStream(stream) {
        // We keep a separate statfsStream function because noderawfs overrides
        // it. In noderawfs, stream.node is sometimes null. Instead, we need to
        // look at stream.path.
        return FS.statfsNode(stream.node);
      },
  statfsNode(node) {
        // NOTE: None of the defaults here are true. We're just returning safe and
        //       sane values. Currently nodefs and rawfs replace these defaults,
        //       other file systems leave them alone.
        var rtn = {
          bsize: 4096,
          frsize: 4096,
          blocks: 1e6,
          bfree: 5e5,
          bavail: 5e5,
          files: FS.nextInode,
          ffree: FS.nextInode - 1,
          fsid: 42,
          flags: 2,
          namelen: 255,
        };
  
        if (node.node_ops.statfs) {
          Object.assign(rtn, node.node_ops.statfs(node.mount.opts.root));
        }
        return rtn;
      },
  create(path, mode = 0o666) {
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },
  mkdir(path, mode = 0o777) {
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },
  mkdirTree(path, mode) {
        var dirs = path.split('/');
        var d = '';
        for (var dir of dirs) {
          if (!dir) continue;
          if (d || PATH.isAbs(path)) d += '/';
          d += dir;
          try {
            FS.mkdir(d, mode);
          } catch(e) {
            if (e.errno != 20) throw e;
          }
        }
      },
  mkdev(path, mode, dev) {
        if (typeof dev == 'undefined') {
          dev = mode;
          mode = 0o666;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },
  symlink(oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
          throw new FS.ErrnoError(44);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(63);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },
  link(oldpath, newpath, flags) {
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        // Hardlinks are only supported by filesystem backends that provide a
        // `link` node op (e.g. NODERAWFS backed by the host). NODEFS omits it:
        // a host hardlink cannot be confined to the mount root.
        if (!parent.node_ops.link) {
          throw new FS.ErrnoError(34);
        }
        return parent.node_ops.link(parent, newname, oldpath, flags);
      },
  rename(old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
  
        // let the errors from non existent directories percolate up
        lookup = FS.lookupPath(old_path, { parent: true });
        old_dir = lookup.node;
        lookup = FS.lookupPath(new_path, { parent: true });
        new_dir = lookup.node;
  
        if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(75);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(28);
        }
        // new path should not be an ancestor of the old path
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(55);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        errCode = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(10);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          errCode = FS.nodePermissions(old_dir, 'w');
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
          // update old node (we do this here to avoid each backend
          // needing to)
          old_node.parent = new_dir;
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
      },
  rmdir(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, true);
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
      },
  readdir(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        var readdir = FS.checkOpExists(node.node_ops.readdir, 54);
        return readdir(node);
      },
  unlink(path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(44);
        }
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, false);
        if (errCode) {
          // According to POSIX, we should map EISDIR to EPERM, but
          // we instead do what Linux does (and we must, as we use
          // the musl linux libc).
          throw new FS.ErrnoError(errCode);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(63);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(10);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
      },
  readlink(path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(44);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(28);
        }
        return link.node_ops.readlink(link);
      },
  stat(path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        var getattr = FS.checkOpExists(node.node_ops.getattr, 63);
        return getattr(node);
      },
  fstat(fd) {
        var stream = FS.getStreamChecked(fd);
        var node = stream.node;
        var getattr = stream.stream_ops.getattr;
        var arg = getattr ? stream : node;
        getattr ??= node.node_ops.getattr;
        FS.checkOpExists(getattr, 63)
        return getattr(arg);
      },
  lstat(path) {
        return FS.stat(path, true);
      },
  doChmod(stream, node, mode, dontFollow) {
        FS.doSetAttr(stream, node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          ctime: Date.now(),
          dontFollow
        });
      },
  chmod(path, mode, dontFollow) {
        var node;
        if (typeof path == 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        FS.doChmod(null, node, mode, dontFollow);
      },
  lchmod(path, mode) {
        FS.chmod(path, mode, true);
      },
  fchmod(fd, mode) {
        var stream = FS.getStreamChecked(fd);
        FS.doChmod(stream, stream.node, mode, false);
      },
  doChown(stream, node, dontFollow) {
        FS.doSetAttr(stream, node, {
          timestamp: Date.now(),
          dontFollow
          // we ignore the uid / gid for now
        });
      },
  chown(path, uid, gid, dontFollow) {
        var node;
        if (typeof path == 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        FS.doChown(null, node, dontFollow);
      },
  lchown(path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },
  fchown(fd, uid, gid) {
        var stream = FS.getStreamChecked(fd);
        FS.doChown(stream, stream.node, false);
      },
  doTruncate(stream, node, len) {
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(28);
        }
        var errCode = FS.nodePermissions(node, 'w');
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        FS.doSetAttr(stream, node, {
          size: len,
          timestamp: Date.now()
        });
      },
  truncate(path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(28);
        }
        var node;
        if (typeof path == 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        FS.doTruncate(null, node, len);
      },
  ftruncate(fd, len) {
        var stream = FS.getStreamChecked(fd);
        if (len < 0 || (stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(28);
        }
        FS.doTruncate(stream, stream.node, len);
      },
  utime(path, atime, mtime, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        FS.doSetAttr(null, lookup.node, {
          atime: atime,
          mtime: mtime,
          dontFollow
        });
      },
  open(path, flags, mode = 0o666) {
        if (path === '') {
          throw new FS.ErrnoError(44);
        }
        flags = FS_modeStringToFlags(flags);
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        var isDirPath;
        if (typeof path == 'object') {
          node = path;
        } else {
          isDirPath = path.endsWith('/');
          // noent_okay makes it so that if the final component of the path
          // doesn't exist, lookupPath returns `node: undefined`. `path` will be
          // updated to point to the target of all symlinks.
          var lookup = FS.lookupPath(path, {
            follow: !(flags & 131072),
            noent_okay: true
          });
          node = lookup.node;
          path = lookup.path;
        }
        // perhaps we need to create the node
        var created = false;
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(20);
            }
          } else if (isDirPath) {
            throw new FS.ErrnoError(31);
          } else {
            // node doesn't exist, try to create it
            // Ignore the permission bits here to ensure we can `open` this new
            // file below. We use chmod below to apply the permissions once the
            // file is open.
            node = FS.mknod(path, mode | 0o777, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(44);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // if asked only for a directory, then this must be one
        if ((flags & 65536) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(54);
        }
        // check permissions, if this is not a file we just created now (it is ok to
        // create and write to a file with read-only permissions; it is read-only
        // for later use)
        if (!created) {
          var errCode = FS.mayOpen(node, flags);
          if (errCode) {
            throw new FS.ErrnoError(errCode);
          }
        }
        // do truncation if necessary
        if ((flags & 512) && !created) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512 | 131072);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        });
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (created) {
          FS.chmod(node, mode & 0o777);
        }
        return stream;
      },
  close(stream) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (stream.getdents) stream.getdents = null; // free readdir state
        // The fd is going away: wake anything waiting on it (poll/epoll) with
        // POLLNVAL so a blocking wait unblocks and an epoll registration is evicted
        // on its next derive. Only sockets/pipes/epoll ever carry a wait-queue, so
        // for every other stream (incl. nodeless noderawfs stdio) this is a no-op.
        stream.node?.notifyListeners(32);
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
        stream.fd = null;
      },
  isClosed(stream) {
        return stream.fd === null;
      },
  llseek(stream, offset, whence) {
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(70);
        }
        if (whence != 0 && whence != 1 && whence != 2) {
          throw new FS.ErrnoError(28);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
      },
  read(stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(28);
        }
        var seeking = typeof position != 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },
  write(stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(28);
        }
        if (FS.isClosed(stream)) {
          throw new FS.ErrnoError(8);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(8);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(31);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(28);
        }
        if (stream.seekable && stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var seeking = typeof position != 'undefined';
        if (!seeking) {
          position = stream.position;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(70);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        return bytesWritten;
      },
  mmap(stream, length, position, prot, flags) {
        // User requests writing to file (prot & PROT_WRITE != 0).
        // Checking if we have permissions to write to the file unless
        // MAP_PRIVATE flag is set. According to POSIX spec it is possible
        // to write to file opened in read-only mode with MAP_PRIVATE flag,
        // as all modifications will be visible only in the memory of
        // the current process.
        if ((prot & 2) !== 0
            && (flags & 2) === 0
            && (stream.flags & 2097155) !== 2) {
          throw new FS.ErrnoError(2);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(2);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(43);
        }
        if (!length) {
          throw new FS.ErrnoError(28);
        }
        return stream.stream_ops.mmap(stream, length, position, prot, flags);
      },
  msync(stream, buffer, offset, length, mmapFlags) {
        if (!stream.stream_ops.msync) {
          return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
      },
  ioctl(stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(59);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },
  readFile(path, opts = {}) {
        opts.flags = opts.flags ?? 0;
        opts.encoding = opts.encoding ?? 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          abort(`Invalid encoding type "${opts.encoding}"`);
        }
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          buf = UTF8ArrayToString(buf);
        }
        FS.close(stream);
        return buf;
      },
  writeFile(path, data, opts = {}) {
        opts.flags = opts.flags ?? 577;
        var stream = FS.open(path, opts.flags, opts.mode);
        data = FS_fileDataToTypedArray(data);
        FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn);
        FS.close(stream);
      },
  cwd:() => FS.currentPath,
  chdir(path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (lookup.node === null) {
          throw new FS.ErrnoError(44);
        }
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(54);
        }
        var errCode = FS.nodePermissions(lookup.node, 'x');
        if (errCode) {
          throw new FS.ErrnoError(errCode);
        }
        FS.currentPath = lookup.path;
      },
  createDefaultDirectories() {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
      },
  createDefaultDevices() {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: () => 0,
          write: (stream, buffer, offset, length, pos) => length,
          llseek: () => 0,
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using err() rather than out()
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // setup /dev/[u]random
        // use a buffer to avoid overhead of individual crypto calls per byte
        var randomBuffer = new Uint8Array(1024), randomLeft = 0;
        var randomByte = () => {
          if (randomLeft === 0) {
            randomFill(randomBuffer);
            randomLeft = randomBuffer.byteLength;
          }
          return randomBuffer[--randomLeft];
        };
        FS.createDevice('/dev', 'random', randomByte);
        FS.createDevice('/dev', 'urandom', randomByte);
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },
  createSpecialDirectories() {
        // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the
        // name of the stream for fd 6 (see test_unistd_ttyname)
        FS.mkdir('/proc');
        var proc_self = FS.mkdir('/proc/self');
        FS.mkdir('/proc/self/fd');
        FS.mount({
          mount() {
            var node = FS.createNode(proc_self, 'fd', 16895, 73);
            node.stream_ops = {
              llseek: MEMFS.stream_ops.llseek,
            };
            node.node_ops = {
              lookup(parent, name) {
                var fd = +name;
                var stream = FS.getStreamChecked(fd);
                var ret = {
                  parent: null,
                  mount: { mountpoint: 'fake' },
                  node_ops: { readlink: () => stream.path },
                  id: fd + 1,
                };
                ret.parent = ret; // make it look like a simple root node
                return ret;
              },
              readdir() {
                return Array.from(FS.streams.entries())
                  .filter(([k, v]) => v)
                  .map(([k, v]) => k.toString());
              }
            };
            return node;
          }
        }, {}, '/proc/self/fd');
      },
  createStandardStreams(input, output, error) {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (input) {
          FS.createDevice('/dev', 'stdin', input);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (output) {
          FS.createDevice('/dev', 'stdout', null, output);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (error) {
          FS.createDevice('/dev', 'stderr', null, error);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 0);
        var stdout = FS.open('/dev/stdout', 1);
        var stderr = FS.open('/dev/stderr', 1);
      },
  staticInit() {
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
  
        FS.filesystems = {
          'MEMFS': MEMFS,
        };
      },
  init(input, output, error) {
        FS.initialized = true;
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        input ??= Module['stdin'];
        output ??= Module['stdout'];
        error ??= Module['stderr'];
  
        FS.createStandardStreams(input, output, error);
      },
  quit() {
        FS.initialized = false;
        // force-flush all streams, so we get musl std streams printed out
        // close all of our streams
        for (var stream of FS.streams) {
          if (stream) {
            FS.close(stream);
          }
        }
      },
  findObject(path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (!ret.exists) {
          return null;
        }
        return ret.object;
      },
  analyzePath(path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },
  createPath(parent, path, canRead, canWrite) {
        parent = typeof parent == 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            if (e.errno != 20) throw e;
          }
          parent = current;
        }
        return current;
      },
  createFile(parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent == 'string' ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(canRead, canWrite);
        return FS.create(path, mode);
      },
  createDataFile(parent, name, data, canRead, canWrite, canOwn) {
        var path = name;
        if (parent) {
          parent = typeof parent == 'string' ? parent : FS.getPath(parent);
          path = name ? PATH.join2(parent, name) : parent;
        }
        var mode = FS_getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          data = FS_fileDataToTypedArray(data);
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 577);
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
      },
  createDevice(parent, name, input, output) {
        var path = PATH.join2(typeof parent == 'string' ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(!!input, !!output);
        FS.createDevice.major ??= 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open(stream) {
            stream.seekable = false;
          },
          close(stream) {
            // flush any pending line data
            if (output?.buffer?.length) {
              output(10);
            }
          },
          read(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(6);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.atime = Date.now();
            }
            return bytesRead;
          },
          write(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(29);
              }
            }
            if (length) {
              stream.node.mtime = stream.node.ctime = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },
  forceLoadFile(obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        if (globalThis.XMLHttpRequest) {
          abort('Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.');
        } else { // Command-line.
          try {
            obj.contents = readBinary(obj.url);
          } catch (e) {
            throw new FS.ErrnoError(29);
          }
        }
      },
  createLazyFile(parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array).
        // Actual getting is abstracted away for eventual reuse.
        class LazyUint8Array {
          lengthKnown = false;
          chunks = []; // Loaded chunks. Index is the chunk number
          get(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = (idx / this.chunkSize)|0;
            return this.getter(chunkNum)[chunkOffset];
          }
          setDataGetter(getter) {
            this.getter = getter;
          }
          cacheLength() {
            // Find length
            var xhr = new XMLHttpRequest();
            xhr.open('HEAD', url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) abort(`Couldn't load ${url}. Status: ${xhr.status}`);
            var datalength = Number(xhr.getResponseHeader('Content-length'));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader('Accept-Ranges')) && header === 'bytes';
            var usesGzip = (header = xhr.getResponseHeader('Content-Encoding')) && header === 'gzip';
  
            var chunkSize = 1024*1024; // Chunk size in bytes
  
            if (!hasByteServing) chunkSize = datalength;
  
            // Function to get a range from the remote URL.
            var doXHR = (from, to) => {
              if (from > to) abort(`invalid range (${from}, ${to}) or no bytes requested!`);
              if (to > datalength-1) abort(`only ${datalength} bytes available! programmer error!`);
  
              // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
              var xhr = new XMLHttpRequest();
              xhr.open('GET', url, false);
              if (datalength !== chunkSize) xhr.setRequestHeader('Range', `bytes=${from}-${to}`);
  
              // Some hints to the browser that we want binary data.
              xhr.responseType = 'arraybuffer';
              if (xhr.overrideMimeType) {
                xhr.overrideMimeType('text/plain; charset=x-user-defined');
              }
  
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) abort(`Couldn't load ${url}. Status: ${xhr.status}`);
              if (xhr.response !== undefined) {
                return new Uint8Array(/** @type{Array<number>} */(xhr.response || []));
              }
              return intArrayFromString(xhr.responseText ?? '', true);
            };
            var lazyArray = this;
            lazyArray.setDataGetter((chunkNum) => {
              var start = chunkNum * chunkSize;
              var end = (chunkNum+1) * chunkSize - 1; // including this byte
              end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
              if (typeof lazyArray.chunks[chunkNum] == 'undefined') {
                lazyArray.chunks[chunkNum] = doXHR(start, end);
              }
              if (typeof lazyArray.chunks[chunkNum] == 'undefined') abort('doXHR failed!');
              return lazyArray.chunks[chunkNum];
            });
  
            if (usesGzip || !datalength) {
              // if the server uses gzip or doesn't supply the length, we have to download the whole file to get the (uncompressed) length
              chunkSize = datalength = 1; // this will force getter(0)/doXHR do download the whole file
              datalength = this.getter(0).length;
              chunkSize = datalength;
              out('LazyFiles on gzip forces download of the whole file when length is accessed');
            }
  
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true;
          }
          get length() {
            if (!this.lengthKnown) {
              this.cacheLength();
            }
            return this._length;
          }
          get chunkSize() {
            if (!this.lengthKnown) {
              this.cacheLength();
            }
            return this._chunkSize;
          }
        }
  
        if (globalThis.XMLHttpRequest) {
          if (!ENVIRONMENT_IS_WORKER) abort('Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc');
          var lazyArray = new LazyUint8Array();
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // Add a function that defers querying the file size until it is asked the first time.
        Object.defineProperties(node, {
          usedBytes: {
            get: function() { return this.contents.length; }
          }
        });
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        for (const [key, fn] of Object.entries(node.stream_ops)) {
          stream_ops[key] = (...args) => {
            FS.forceLoadFile(node);
            return fn(...args);
          };
        }
        function writeChunks(stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        }
        // use a custom read function
        stream_ops.read = (stream, buffer, offset, length, position) => {
          FS.forceLoadFile(node);
          return writeChunks(stream, buffer, offset, length, position)
        };
        // use a custom mmap function
        stream_ops.mmap = (stream, length, position, prot, flags) => {
          FS.forceLoadFile(node);
          var ptr = mmapAlloc(length);
          if (!ptr) {
            throw new FS.ErrnoError(48);
          }
          writeChunks(stream, HEAP8, ptr, length, position);
          return { ptr, allocated: true };
        };
        node.stream_ops = stream_ops;
        return node;
      },
  };
  
  
  
    /**
   * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
   * emscripten HEAP, returns a copy of that string as a Javascript String object.
   *
   * @param {number} ptr
   * @param {number=} maxBytesToRead - An optional length that specifies the
   *   maximum number of bytes to read. You can omit this parameter to scan the
   *   string until the first 0 byte. If maxBytesToRead is passed, and the string
   *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
   *   string will cut short at that byte index.
   * @param {boolean=} ignoreNul - If true, the function will not stop on a NUL character.
   * @return {string}
   */
  var UTF8ToString = (ptr, maxBytesToRead, ignoreNul) => {
      return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead, ignoreNul) : '';
    };
  
  
  /** @type {!Int32Array} */
  var HEAP32;
  
  /** @type {!Uint32Array} */
  var HEAPU32;
  
  /** not-@type {!BigInt64Array} */
  var HEAP64;
  
  /** not-@type {!BigUint64Array} */
  var HEAPU64;
  var SYSCALLS = {
  currentUmask:18,
  calculateAt(dirfd, path, allowEmpty) {
        if (PATH.isAbs(path)) {
          return path;
        }
        // relative path
        var dir;
        if (dirfd === -100) {
          dir = FS.cwd();
        } else {
          var dirstream = SYSCALLS.getStreamFromFD(dirfd);
          dir = dirstream.path;
        }
        if (path.length == 0) {
          if (!allowEmpty) {
            throw new FS.ErrnoError(44);;
          }
          return dir;
        }
        return dir + '/' + path;
      },
  writeStat(buf, stat) {
        HEAPU32[((buf)/4)] = stat.dev;
        HEAPU32[(((buf)+(4))/4)] = stat.mode;
        HEAPU64[(((buf)+(8))/8)] = BigInt(stat.nlink);
        HEAPU32[(((buf)+(16))/4)] = stat.uid;
        HEAPU32[(((buf)+(20))/4)] = stat.gid;
        HEAPU32[(((buf)+(24))/4)] = stat.rdev;
        HEAP64[(((buf)+(32))/8)] = BigInt(stat.size);
        HEAP32[(((buf)+(40))/4)] = 4096;
        HEAP32[(((buf)+(44))/4)] = stat.blocks;
        var atime = stat.atime.getTime();
        var mtime = stat.mtime.getTime();
        var ctime = stat.ctime.getTime();
        HEAP64[(((buf)+(48))/8)] = BigInt(Math.floor(atime / 1000));
        HEAPU64[(((buf)+(56))/8)] = BigInt((atime % 1000) * 1000 * 1000);
        HEAP64[(((buf)+(64))/8)] = BigInt(Math.floor(mtime / 1000));
        HEAPU64[(((buf)+(72))/8)] = BigInt((mtime % 1000) * 1000 * 1000);
        HEAP64[(((buf)+(80))/8)] = BigInt(Math.floor(ctime / 1000));
        HEAPU64[(((buf)+(88))/8)] = BigInt((ctime % 1000) * 1000 * 1000);
        HEAP64[(((buf)+(96))/8)] = BigInt(stat.ino);
        return 0;
      },
  writeStatFs(buf, stats) {
        HEAPU32[(((buf)+(8))/4)] = stats.bsize;
        HEAPU32[(((buf)+(72))/4)] = stats.bsize;
        HEAP64[(((buf)+(16))/8)] = BigInt(stats.blocks);
        HEAP64[(((buf)+(24))/8)] = BigInt(stats.bfree);
        HEAP64[(((buf)+(32))/8)] = BigInt(stats.bavail);
        HEAP64[(((buf)+(40))/8)] = BigInt(stats.files);
        HEAP64[(((buf)+(48))/8)] = BigInt(stats.ffree);
        HEAPU32[(((buf)+(56))/4)] = stats.fsid;
        HEAPU32[(((buf)+(80))/4)] = stats.flags;  // ST_NOSUID
        HEAPU32[(((buf)+(64))/4)] = stats.namelen;
      },
  doMsync(addr, stream, len, flags, offset) {
        if (!FS.isFile(stream.node.mode)) {
          throw new FS.ErrnoError(43);
        }
        if (flags & 2) {
          // MAP_PRIVATE calls need not to be synced back to underlying fs
          return 0;
        }
        var buffer = HEAPU8.subarray(addr, addr + len);
        FS.msync(stream, buffer, offset, len, flags);
      },
  getStreamFromFD(fd) {
        var stream = FS.getStreamChecked(fd);
        return stream;
      },
  varargs:undefined,
  getStr(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
      },
  };
  
  function ___syscall_chmod(path, mode) {
    path = bigintToI53Checked(path);
  
  
  try {
  
      path = SYSCALLS.getStr(path);
      FS.chmod(path, mode);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  }

  
  function ___syscall_faccessat(dirfd, path, amode, flags) {
    path = bigintToI53Checked(path);
  
  
  try {
  
      path = SYSCALLS.getStr(path);
      path = SYSCALLS.calculateAt(dirfd, path);
      if (amode & ~7) {
        // need a valid mode
        return -28;
      }
      var lookup = FS.lookupPath(path, { follow: true });
      var node = lookup.node;
      if (!node) {
        return -44;
      }
      var perms = '';
      if (amode & 4) perms += 'r';
      if (amode & 2) perms += 'w';
      if (amode & 1) perms += 'x';
      if (perms /* otherwise, they've just passed F_OK */ && FS.nodePermissions(node, perms)) {
        return -2;
      }
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  }

  var syscallGetVarargP = () => {
      var ret = Number(HEAPU64[((SYSCALLS.varargs)/8)]);
      SYSCALLS.varargs += 8;
      return ret;
    };
  
  var syscallGetVarargI = () => {
      // the `+` prepended here is necessary to convince the JSCompiler that varargs is indeed a number.
      var ret = HEAP32[((+SYSCALLS.varargs)/4)];
      SYSCALLS.varargs += 4;
      return ret;
    };
  
  
  
  /** @type {!Int16Array} */
  var HEAP16;
  function ___syscall_fcntl64(fd, cmd, varargs) {
    varargs = bigintToI53Checked(varargs);
  
  
  SYSCALLS.varargs = varargs;
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      switch (cmd) {
        case 0: {
          var arg = syscallGetVarargI();
          if (arg < 0) {
            return -28;
          }
          while (FS.streams[arg]) {
            arg++;
          }
          var newStream;
          newStream = FS.dupStream(stream, arg);
          return newStream.fd;
        }
        case 1:
        case 2:
          return 0;  // FD_CLOEXEC makes no sense for a single process.
        case 3:
          return stream.flags;
        case 4: {
          var arg = syscallGetVarargI();
          var mask = 289792;
          stream.flags = (stream.flags & ~mask) | (arg & mask);
          return 0;
        }
        case 5: {
          var arg = syscallGetVarargP();
          var offset = 0;
          // We're always unlocked.
          HEAP16[(((arg)+(offset))/2)] = 2;
          return 0;
        }
        case 6:
        case 7:
          // Pretend that the locking is successful. These are process-level locks,
          // and Emscripten programs are a single process. If we supported linking a
          // filesystem between programs, we'd need to do more here.
          // See https://github.com/emscripten-core/emscripten/issues/23697
          return 0;
      }
      return -28;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  }

  function ___syscall_fdatasync(fd) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      return 0; // we can't do anything synchronously; the in-memory FS is already synced to
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  }
  

  
  function ___syscall_fstat64(fd, buf) {
    buf = bigintToI53Checked(buf);
  
  
  try {
  
      return SYSCALLS.writeStat(buf, FS.fstat(fd));
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  }

  function ___syscall_ftruncate64(fd, length) {
    length = bigintToI53Checked(length);
  
  
  try {
  
      if (isNaN(length)) return -22;
      FS.ftruncate(fd, length);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  }

  
  var stringToUTF8 = (str, outPtr, maxBytesToWrite) => {
      return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
    };
  
  
  
  
  
  function ___syscall_getdents64(fd, dirp, count) {
    dirp = bigintToI53Checked(dirp);
    count = bigintToI53Checked(count);
  
  
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd)
      stream.getdents ||= FS.readdir(stream.path);
  
      var struct_size = 280;
      var pos = 0;
      var off = FS.llseek(stream, 0, 1);
  
      var startIdx = Math.floor(off / struct_size);
      var endIdx = Math.min(stream.getdents.length, startIdx + Math.floor(count/struct_size))
      for (var idx = startIdx; idx < endIdx; idx++) {
        var id;
        var type;
        var name = stream.getdents[idx];
        if (name === '.') {
          id = stream.node.id;
          type = 4;
        }
        else if (name === '..') {
          var lookup = FS.lookupPath(stream.path, { parent: true });
          id = lookup.node.id;
          type = 4;
        }
        else {
          var child;
          try {
            child = FS.lookupNode(stream.node, name);
          } catch (e) {
            // If the entry is not a directory, file, or symlink, nodefs
            // lookupNode will raise EINVAL. Skip these and continue.
            if (e?.errno === 28) {
              continue;
            }
            throw e;
          }
          id = child.id;
          type = FS.isChrdev(child.mode) ? 2 : // character device.
                 FS.isDir(child.mode) ? 4 :    // directory
                 FS.isLink(child.mode) ? 10 :   // symbolic link.
                 8;                            // regular file.
        }
        HEAP64[((dirp + pos)/8)] = BigInt(id);
        HEAP64[(((dirp + pos)+(8))/8)] = BigInt((idx + 1) * struct_size);
        HEAP16[(((dirp + pos)+(16))/2)] = 280;
        HEAP8[(dirp + pos)+(18)] = type;
        stringToUTF8(name, dirp + pos + 19, 256);
        pos += struct_size;
      }
      FS.llseek(stream, idx * struct_size, 0);
      return pos;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  }

  
  
  
  
  
  function ___syscall_ioctl(fd, op, varargs) {
    varargs = bigintToI53Checked(varargs);
  
  
  SYSCALLS.varargs = varargs;
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      switch (op) {
        case 21509: {
          if (!stream.tty) return -59;
          return 0;
        }
        case 21505: {
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tcgets) {
            var termios = stream.tty.ops.ioctl_tcgets(stream);
            var argp = syscallGetVarargP();
            HEAP32[((argp)/4)] = termios.c_iflag || 0;
            HEAP32[(((argp)+(4))/4)] = termios.c_oflag || 0;
            HEAP32[(((argp)+(8))/4)] = termios.c_cflag || 0;
            HEAP32[(((argp)+(12))/4)] = termios.c_lflag || 0;
            for (var i = 0; i < 32; i++) {
              HEAP8[(argp + i)+(17)] = termios.c_cc[i] || 0;
            }
            return 0;
          }
          return 0;
        }
        case 21510:
        case 21511:
        case 21512: {
          if (!stream.tty) return -59;
          return 0; // no-op, not actually adjusting terminal settings
        }
        case 21506:
        case 21507:
        case 21508: {
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tcsets) {
            var argp = syscallGetVarargP();
            var c_iflag = HEAP32[((argp)/4)];
            var c_oflag = HEAP32[(((argp)+(4))/4)];
            var c_cflag = HEAP32[(((argp)+(8))/4)];
            var c_lflag = HEAP32[(((argp)+(12))/4)];
            var c_cc = []
            for (var i = 0; i < 32; i++) {
              c_cc.push(HEAP8[(argp + i)+(17)]);
            }
            return stream.tty.ops.ioctl_tcsets(stream.tty, op, { c_iflag, c_oflag, c_cflag, c_lflag, c_cc });
          }
          return 0; // no-op, not actually adjusting terminal settings
        }
        case 21519: {
          if (!stream.tty) return -59;
          var argp = syscallGetVarargP();
          HEAP32[((argp)/4)] = 0;
          return 0;
        }
        case 21520: {
          if (!stream.tty) return -59;
          return -28; // not supported
        }
        case 21537:
        case 21531: {
          var argp = syscallGetVarargP();
          return FS.ioctl(stream, op, argp);
        }
        case 21523: {
          // TODO: in theory we should write to the winsize struct that gets
          // passed in, but for now musl doesn't read anything on it
          if (!stream.tty) return -59;
          if (stream.tty.ops.ioctl_tiocgwinsz) {
            var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
            var argp = syscallGetVarargP();
            HEAP16[((argp)/2)] = winsize[0];
            HEAP16[(((argp)+(2))/2)] = winsize[1];
          }
          return 0;
        }
        case 21524: {
          // TODO: technically, this ioctl call should change the window size.
          // but, since emscripten doesn't have any concept of a terminal window
          // yet, we'll just silently throw it away as we do TIOCGWINSZ
          if (!stream.tty) return -59;
          return 0;
        }
        case 21515: {
          if (!stream.tty) return -59;
          return 0;
        }
        default: return -28; // not supported
      }
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  }

  
  function ___syscall_lstat64(path, buf) {
    path = bigintToI53Checked(path);
    buf = bigintToI53Checked(buf);
  
  
  try {
  
      path = SYSCALLS.getStr(path);
      return SYSCALLS.writeStat(buf, FS.lstat(path));
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  }

  
  function ___syscall_mkdirat(dirfd, path, mode) {
    path = bigintToI53Checked(path);
  
  
  try {
  
      path = SYSCALLS.getStr(path);
      path = SYSCALLS.calculateAt(dirfd, path);
      mode &= ~SYSCALLS.currentUmask;
      FS.mkdir(path, mode, 0);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  }

  
  function ___syscall_newfstatat(dirfd, path, buf, flags) {
    path = bigintToI53Checked(path);
    buf = bigintToI53Checked(buf);
  
  
  try {
  
      path = SYSCALLS.getStr(path);
      var nofollow = flags & 256;
      var allowEmpty = flags & 4096;
      flags = flags & (~6400);
      path = SYSCALLS.calculateAt(dirfd, path, allowEmpty);
      return SYSCALLS.writeStat(buf, nofollow ? FS.lstat(path) : FS.stat(path));
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  }

  
  
  function ___syscall_openat(dirfd, path, flags, varargs) {
    path = bigintToI53Checked(path);
    varargs = bigintToI53Checked(varargs);
  
  
  SYSCALLS.varargs = varargs;
  try {
  
      path = SYSCALLS.getStr(path);
      path = SYSCALLS.calculateAt(dirfd, path);
      var mode = varargs ? syscallGetVarargI() : 0;
      if (flags & 64) {
        mode &= ~SYSCALLS.currentUmask;
      }
      return FS.open(path, flags, mode).fd;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  }

  var pollOne = (fd, events) => {
      var stream = FS.getStream(fd);
      if (!stream) return 32;
      // Streams without a poll handler (regular files, incl. NODERAWFS/NODEFS
      // which leave stream_ops unset) are treated as always readable+writable.
      var flags = stream.stream_ops?.poll
        ? stream.stream_ops.poll(stream)
        : 5;
      return flags & (events | 8 | 16 | 32);
    };
  
  
  var doPollSync = (fds, nfds) => {
      var count = 0;
      for (var i = 0, pollfd = fds; i < nfds; i++, pollfd += 8) {
        var revents = pollOne(
          HEAP32[((pollfd)/4)],
          HEAP16[(((pollfd)+(4))/2)]);
        if (revents) count++;
        HEAP16[(((pollfd)+(6))/2)] = revents;
      }
      return count;
    };
  
  function ___syscall_poll(fds, nfds, timeout) {
    fds = bigintToI53Checked(fds);
  
  
  try {
  
      var count = doPollSync(fds, nfds);
      return count;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  }

  
  function ___syscall_renameat(olddirfd, oldpath, newdirfd, newpath) {
    oldpath = bigintToI53Checked(oldpath);
    newpath = bigintToI53Checked(newpath);
  
  
  try {
  
      oldpath = SYSCALLS.getStr(oldpath);
      newpath = SYSCALLS.getStr(newpath);
      oldpath = SYSCALLS.calculateAt(olddirfd, oldpath);
      newpath = SYSCALLS.calculateAt(newdirfd, newpath);
      FS.rename(oldpath, newpath);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  }

  
  function ___syscall_rmdir(path) {
    path = bigintToI53Checked(path);
  
  
  try {
  
      path = SYSCALLS.getStr(path);
      FS.rmdir(path);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  }

  
  function ___syscall_stat64(path, buf) {
    path = bigintToI53Checked(path);
    buf = bigintToI53Checked(buf);
  
  
  try {
  
      path = SYSCALLS.getStr(path);
      return SYSCALLS.writeStat(buf, FS.stat(path));
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  }

  
  function ___syscall_unlinkat(dirfd, path, flags) {
    path = bigintToI53Checked(path);
  
  
  try {
  
      path = SYSCALLS.getStr(path);
      path = SYSCALLS.calculateAt(dirfd, path);
      if (!flags) {
        FS.unlink(path);
      } else if (flags === 512) {
        FS.rmdir(path);
      } else {
        return -28;
      }
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  }

  
  var readI53FromI64 = (ptr) => {
      return HEAPU32[((ptr)/4)] + HEAP32[(((ptr)+(4))/4)] * 4294967296;
    };
  
  
  
  function ___syscall_utimensat(dirfd, path, times, flags) {
    path = bigintToI53Checked(path);
    times = bigintToI53Checked(times);
  
  
  try {
  
      var nofollow = flags & 256;
      path = SYSCALLS.getStr(path);
      path = SYSCALLS.calculateAt(dirfd, path, true);
      var now = Date.now(), atime, mtime;
      if (!times) {
        atime = now;
        mtime = now;
      } else {
        var seconds = readI53FromI64(times);
        var nanoseconds = HEAP32[(((times)+(8))/4)];
        if (nanoseconds == 1073741823) {
          atime = now;
        } else if (nanoseconds == 1073741822) {
          atime = null;
        } else {
          atime = (seconds*1000) + (nanoseconds/(1000*1000));
        }
        times += 16;
        seconds = readI53FromI64(times);
        nanoseconds = HEAP32[(((times)+(8))/4)];
        if (nanoseconds == 1073741823) {
          mtime = now;
        } else if (nanoseconds == 1073741822) {
          mtime = null;
        } else {
          mtime = (seconds*1000) + (nanoseconds/(1000*1000));
        }
      }
      // null here means UTIME_OMIT was passed. If both were set to UTIME_OMIT then
      // we can skip the call completely.
      if ((mtime ?? atime) !== null) {
        FS.utime(path, atime, mtime, nofollow);
      }
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  }

  var __abort_js = () =>
      abort('');

  var jsStackTrace = () => new Error().stack.toString();
  /** @param {number=} flags */
  var getCallstack = (flags) => {
      var callstack = jsStackTrace();
  
      // Process all lines:
      var lines = callstack.split('\n');
      callstack = '';
      // Extract components of form:
      // '       Object._main@http://server.com:4324:12'
      var firefoxRe = new RegExp('\\s*(.*?)@(.*?):([0-9]+):([0-9]+)');
      // Extract components of form:
      // '    at Object._main (http://server.com/file.html:4324:12)'
      var chromeRe = new RegExp('\\s*at (.*?) \\\((.*):(.*):(.*)\\\)');
  
      for (var line of lines) {
        var symbolName = '';
        var file = '';
        var lineno = 0;
        var column = 0;
  
        var parts = chromeRe.exec(line);
        if (parts?.length == 5) {
          symbolName = parts[1];
          file = parts[2];
          lineno = parts[3];
          column = parts[4];
        } else {
          parts = firefoxRe.exec(line);
          if (parts?.length >= 4) {
            symbolName = parts[1];
            file = parts[2];
            lineno = parts[3];
            // Old Firefox doesn't carry column information, but in new FF30, it
            // is present. See https://bugzil.la/762556
            column = parts[4]|0;
          } else {
            // Was not able to extract this line for demangling/sourcemapping
            // purposes. Output it as-is.
            callstack += line + '\n';
            continue;
          }
        }
  
        // Find the symbols in the callstack that corresponds to the functions that
        // report callstack information, and remove everything up to these from the
        // output.
        if (symbolName == '_emscripten_log' || symbolName == '_emscripten_get_callstack') {
          callstack = '';
          continue;
        }
  
        if ((flags & 24)) {
          if (flags & 64) {
            file = file.substring(file.replace(/\\/g, '/').lastIndexOf('/')+1);
          }
          callstack += `    at ${symbolName} (${file}:${lineno}:${column})\n`;
        }
      }
      // Trim extra whitespace at the end of the output.
      callstack = callstack.replace(/\s+$/, '');
      return callstack;
    };
  
  
  function __emscripten_log_formatted(flags, str) {
    str = bigintToI53Checked(str);
  
  
      str = UTF8ToString(str);
  
      if (flags & 24) {
        str = str.replace(/\s+$/, ''); // Ensure the message and the callstack are joined cleanly with exactly one newline.
        str += (str.length > 0 ? '\n' : '') + getCallstack(flags);
      }
  
      if (flags & 1) {
        if (flags & 4) {
          console.error(str);
        } else if (flags & 2) {
          console.warn(str);
        } else if (flags & 512) {
          console.info(str);
        } else if (flags & 256) {
          console.debug(str);
        } else {
          console.log(str);
        }
      } else if (flags & 6) {
        err(str);
      } else {
        out(str);
      }
    ;
  }

  var runtimeKeepaliveCounter = 0;
  var __emscripten_runtime_keepalive_clear = () => {
      noExitRuntime = false;
      runtimeKeepaliveCounter = 0;
    };

  var __emscripten_throw_longjmp = () => {
      throw new EmscriptenSjLj;
    };

  
  function __gmtime_js(time, tmPtr) {
    time = bigintToI53Checked(time);
    tmPtr = bigintToI53Checked(tmPtr);
  
  
      var date = new Date(time * 1000);
      if (isNaN(date.getTime())) {
        return 1;
      }
      HEAP32[((tmPtr)/4)] = date.getUTCSeconds();
      HEAP32[(((tmPtr)+(4))/4)] = date.getUTCMinutes();
      HEAP32[(((tmPtr)+(8))/4)] = date.getUTCHours();
      HEAP32[(((tmPtr)+(12))/4)] = date.getUTCDate();
      HEAP32[(((tmPtr)+(16))/4)] = date.getUTCMonth();
      HEAP32[(((tmPtr)+(20))/4)] = date.getUTCFullYear()-1900;
      HEAP32[(((tmPtr)+(24))/4)] = date.getUTCDay();
      var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
      var yday = ((date.getTime() - start) / (1000 * 60 * 60 * 24))|0;
      HEAP32[(((tmPtr)+(28))/4)] = yday;
      return 0;
    ;
  }

  var isLeapYear = (year) => year%4 === 0 && (year%100 !== 0 || year%400 === 0);
  
  var MONTH_DAYS_LEAP_CUMULATIVE = [0,31,60,91,121,152,182,213,244,274,305,335];
  
  var MONTH_DAYS_REGULAR_CUMULATIVE = [0,31,59,90,120,151,181,212,243,273,304,334];
  var ydayFromDate = (date) => {
      var leap = isLeapYear(date.getFullYear());
      var monthDaysCumulative = (leap ? MONTH_DAYS_LEAP_CUMULATIVE : MONTH_DAYS_REGULAR_CUMULATIVE);
      var yday = monthDaysCumulative[date.getMonth()] + date.getDate() - 1; // -1 since it's days since Jan 1
  
      return yday;
    };
  
  
  
  function __localtime_js(time, tmPtr) {
    time = bigintToI53Checked(time);
    tmPtr = bigintToI53Checked(tmPtr);
  
  
      var date = new Date(time*1000);
      if (isNaN(date.getTime())) {
        return 1;
      }
      HEAP32[((tmPtr)/4)] = date.getSeconds();
      HEAP32[(((tmPtr)+(4))/4)] = date.getMinutes();
      HEAP32[(((tmPtr)+(8))/4)] = date.getHours();
      HEAP32[(((tmPtr)+(12))/4)] = date.getDate();
      HEAP32[(((tmPtr)+(16))/4)] = date.getMonth();
      HEAP32[(((tmPtr)+(20))/4)] = date.getFullYear()-1900;
      HEAP32[(((tmPtr)+(24))/4)] = date.getDay();
  
      var yday = ydayFromDate(date)|0;
      HEAP32[(((tmPtr)+(28))/4)] = yday;
      HEAP64[(((tmPtr)+(40))/8)] = BigInt(-(date.getTimezoneOffset() * 60));
  
      // Attention: DST is in December in South, and some regions don't have DST at all.
      var start = new Date(date.getFullYear(), 0, 1);
      var summerOffset = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
      var winterOffset = start.getTimezoneOffset();
      var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset))|0;
      HEAP32[(((tmPtr)+(32))/4)] = dst;
      return 0;
    ;
  }

  
  
  
  
  
  
  
  function __mmap_js(len, prot, flags, fd, offset, allocated, addr) {
    len = bigintToI53Checked(len);
    offset = bigintToI53Checked(offset);
    allocated = bigintToI53Checked(allocated);
    addr = bigintToI53Checked(addr);
  
  
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var res = FS.mmap(stream, len, offset, prot, flags);
      var ptr = res.ptr;
      HEAP32[((allocated)/4)] = res.allocated;
      HEAPU64[((addr)/8)] = BigInt(ptr);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  }

  
  function __munmap_js(addr, len, prot, flags, fd, offset) {
    addr = bigintToI53Checked(addr);
    len = bigintToI53Checked(len);
    offset = bigintToI53Checked(offset);
  
  
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      if (prot & 2) {
        SYSCALLS.doMsync(addr, stream, len, flags, offset);
      }
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return -e.errno;
  }
  ;
  }

  
  
  
  var __tzset_js = function(timezone, daylight, std_name, dst_name) {
    timezone = bigintToI53Checked(timezone);
    daylight = bigintToI53Checked(daylight);
    std_name = bigintToI53Checked(std_name);
    dst_name = bigintToI53Checked(dst_name);
  
  
      // TODO: Use (malleable) environment variables instead of system settings.
      var currentYear = new Date().getFullYear();
      var winter = new Date(currentYear, 0, 1);
      var summer = new Date(currentYear, 6, 1);
      var winterOffset = winter.getTimezoneOffset();
      var summerOffset = summer.getTimezoneOffset();
  
      // Local standard timezone offset. Local standard time is not adjusted for
      // daylight savings.  This code uses the fact that getTimezoneOffset returns
      // a greater value during Standard Time versus Daylight Saving Time (DST).
      // Thus it determines the expected output during Standard Time, and it
      // compares whether the output of the given date the same (Standard) or less
      // (DST).
      var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
  
      // timezone is specified as seconds west of UTC ("The external variable
      // `timezone` shall be set to the difference, in seconds, between
      // Coordinated Universal Time (UTC) and local standard time."), the same
      // as returned by stdTimezoneOffset.
      // See http://pubs.opengroup.org/onlinepubs/009695399/functions/tzset.html
      HEAPU64[((timezone)/8)] = BigInt(stdTimezoneOffset * 60);
  
      HEAP32[((daylight)/4)] = Number(winterOffset != summerOffset);
  
      var extractZone = (timezoneOffset) => {
        // Why inverse sign?
        // Read here https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
        var sign = timezoneOffset >= 0 ? '-' : '+';
  
        var absOffset = Math.abs(timezoneOffset)
        var hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
        var minutes = String(absOffset % 60).padStart(2, '0');
  
        return `UTC${sign}${hours}${minutes}`;
      }
  
      var winterName = extractZone(winterOffset);
      var summerName = extractZone(summerOffset);
      if (summerOffset < winterOffset) {
        // Northern hemisphere
        stringToUTF8(winterName, std_name, 17);
        stringToUTF8(summerName, dst_name, 17);
      } else {
        stringToUTF8(winterName, dst_name, 17);
        stringToUTF8(summerName, std_name, 17);
      }
    ;
  };

  var _emscripten_get_now = () => performance.now();
  
  var _emscripten_date_now = () => Date.now();
  
  var nowIsMonotonic = 1;
  
  var checkWasiClock = (clock_id) => clock_id >= 0 && clock_id <= 3;
  
  
  function _clock_time_get(clk_id, ignored_precision, ptime) {
    ignored_precision = bigintToI53Checked(ignored_precision);
    ptime = bigintToI53Checked(ptime);
  
  
      if (!checkWasiClock(clk_id)) {
        return 28;
      }
      var now;
      // all wasi clocks but realtime are monotonic
      if (clk_id === 0) {
        now = _emscripten_date_now();
      } else if (nowIsMonotonic) {
        now = _emscripten_get_now();
      } else {
        return 52;
      }
      // "now" is in ms, and wasi times are in ns.
      var nsec = Math.round(now * 1000 * 1000);
      HEAP64[((ptime)/8)] = BigInt(nsec);
      return 0;
    ;
  }

  var handleException = (e) => {
      // Certain exception types we do not treat as errors since they are used for
      // internal control flow.
      // 1. ExitStatus, which is thrown by exit()
      // 2. "unwind", which is thrown by emscripten_unwind_to_js_event_loop() and others
      //    that wish to return to JS event loop.
      if (e instanceof ExitStatus || e == 'unwind') {
        return EXITSTATUS;
      }
      quit_(1, e);
    };
  
  
  var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;
  var _proc_exit = (code) => {
      EXITSTATUS = code;
      if (!keepRuntimeAlive()) {
        Module['onExit']?.(code);
        ABORT = true;
      }
      quit_(code, new ExitStatus(code));
    };
  /** @param {boolean|number=} implicit */
  var exitJS = (status, implicit) => {
      EXITSTATUS = status;
  
      _proc_exit(status);
    };
  var _exit = exitJS;
  
  
  var maybeExit = () => {
      if (!keepRuntimeAlive()) {
        try {
          _exit(EXITSTATUS);
        } catch (e) {
          handleException(e);
        }
      }
    };
  var callUserCallback = (func) => {
      if (ABORT) {
        return;
      }
      try {
        return func();
      } catch (e) {
        handleException(e);
      } finally {
        maybeExit();
      }
    };
  
  function getFullscreenElement() {
      return document.fullscreenElement
             ;
    }
  
  /** @param {number=} timeout */
  var safeSetTimeout = (func, timeout) => {
      
      return setTimeout(() => {
        
        callUserCallback(func);
      }, timeout);
    };
  
  var warnOnce = (text) => {
      warnOnce.shown ||= {};
      if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        if (ENVIRONMENT_IS_NODE) text = 'warning: ' + text;
        err(text);
      }
    };
  
  
  
  
  var Browser = {
  useWebGL:false,
  isFullscreen:false,
  pointerLock:false,
  moduleContextCreatedCallbacks:[],
  preloadedImages:{
  },
  preloadedAudios:{
  },
  getCanvas:() => Module['canvas'],
  init() {
        if (Browser.initted) return;
        Browser.initted = true;
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = (name) => {
          return !Module['noImageDecoding'] && /\.(jpg|jpeg|png|bmp|webp)$/i.test(name);
        };
        imagePlugin['handle'] = async (byteArray, name) => {
          var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
          if (b.size !== byteArray.length) { // Safari bug #118630
            // Safari's Blob can only take an ArrayBuffer
            b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
          }
          var url = URL.createObjectURL(b);
          return new Promise((resolve, reject) => {
            var img = new Image();
            img.onload = () => {
              var canvas = /** @type {!HTMLCanvasElement} */ (document.createElement('canvas'));
              canvas.width = img.width;
              canvas.height = img.height;
              var ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              Browser.preloadedImages[name] = canvas;
              URL.revokeObjectURL(url);
              resolve(byteArray);
            };
            img.onerror = (event) => {
              err(`Image ${url} could not be decoded`);
              reject();
            };
            img.src = url;
          });
        };
        preloadPlugins.push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = (name) => {
          return !Module['noAudioDecoding'] && name.slice(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = async (byteArray, name) => {
          return new Promise((resolve, reject) => {
            var done = false;
            function finish(audio) {
              if (done) return;
              done = true;
              Browser.preloadedAudios[name] = audio;
              resolve(byteArray);
            }
            var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            var url = URL.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', () => finish(audio)); // use addEventListener due to chromium bug 124926
            audio.onerror = (event) => {
              if (done) return;
              err(`warning: browser could not fully decode audio ${name}, trying slower base64 approach`);
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.slice(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            safeSetTimeout(() => {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          });
        };
        preloadPlugins.push(audioPlugin);
  
        // Canvas event setup
  
        function pointerLockChange() {
          var canvas = Browser.getCanvas();
          Browser.pointerLock = document.pointerLockElement === canvas;
        }
        var canvas = Browser.getCanvas();
        if (canvas) {
          // forced aspect ratio can be enabled by defining 'forcedAspectRatio' on Module
          // Module['forcedAspectRatio'] = 4 / 3;
  
          document.addEventListener('pointerlockchange', pointerLockChange);
  
          if (Module['elementPointerLock']) {
            canvas.addEventListener('click', (ev) => {
              if (!Browser.pointerLock && Browser.getCanvas().requestPointerLock) {
                Browser.getCanvas().requestPointerLock();
                ev.preventDefault();
              }
            });
          }
        }
      },
  createContext(/** @type {HTMLCanvasElement} */ canvas, useWebGL, setInModule, webGLContextAttributes) {
        if (useWebGL && Module['ctx'] && canvas == Browser.getCanvas()) return Module['ctx']; // no need to recreate GL context if it's already been created for this canvas.
  
        var ctx;
        var contextHandle;
        if (useWebGL) {
          // For GLES2/desktop GL compatibility, adjust a few defaults to be different to WebGL defaults, so that they align better with the desktop defaults.
          var contextAttributes = {
            antialias: false,
            alpha: false,
            majorVersion: 2,
          };
  
          if (webGLContextAttributes) {
            for (var attribute in webGLContextAttributes) {
              contextAttributes[attribute] = webGLContextAttributes[attribute];
            }
          }
  
          // This check of existence of GL is here to satisfy Closure compiler, which yells if variable GL is referenced below but GL object is not
          // actually compiled in because application is not doing any GL operations. TODO: Ideally if GL is not being used, this function
          // Browser.createContext() should not even be emitted.
          if (typeof GL != 'undefined') {
            contextHandle = GL.createContext(canvas, contextAttributes);
            if (contextHandle) {
              ctx = GL.getContext(contextHandle).GLctx;
            }
          }
        } else {
          ctx = canvas.getContext('2d');
        }
  
        if (!ctx) return null;
  
        if (setInModule) {
          Module['ctx'] = ctx;
          if (useWebGL) GL.makeContextCurrent(contextHandle);
          Browser.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach((callback) => callback());
          Browser.init();
        }
        return ctx;
      },
  fullscreenHandlersInstalled:false,
  lockPointer:undefined,
  resizeCanvas:undefined,
  requestFullscreen(lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer == 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas == 'undefined') Browser.resizeCanvas = false;
  
        var canvas = Browser.getCanvas();
        function fullscreenChange() {
          Browser.isFullscreen = false;
          var canvasContainer = canvas.parentNode;
          if (getFullscreenElement() === canvasContainer) {
            canvas.exitFullscreen = Browser.exitFullscreen;
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullscreen = true;
            if (Browser.resizeCanvas) {
              Browser.setFullscreenCanvasSize();
            } else {
              Browser.updateCanvasDimensions(canvas);
            }
          } else {
            // remove the full screen specific parent of the canvas again to restore the HTML structure from before going full screen
            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
            canvasContainer.parentNode.removeChild(canvasContainer);
  
            if (Browser.resizeCanvas) {
              Browser.setWindowedCanvasSize();
            } else {
              Browser.updateCanvasDimensions(canvas);
            }
          }
        }
  
        if (!Browser.fullscreenHandlersInstalled) {
          Browser.fullscreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullscreenChange);
          document.addEventListener('webkitfullscreenchange', fullscreenChange);
        }
  
        // create a new parent to ensure the canvas has no siblings. this allows browsers to optimize full screen performance when its parent is the full screen root
        var canvasContainer = document.createElement('div');
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
  
        // use parent of canvas as full screen root to allow aspect ratio correction (Firefox stretches the root to screen size)
        canvasContainer.requestFullscreen();
      },
  exitFullscreen() {
        // This is workaround for chrome. Trying to exit from fullscreen
        // not in fullscreen state will cause 'TypeError: Document not active'
        // in chrome. See https://github.com/emscripten-core/emscripten/pull/8236
        if (!Browser.isFullscreen) {
          return false;
        }
  
        document.exitFullscreen();
        return true;
      },
  safeSetTimeout(func, timeout) {
        // Legacy function, this is used by the SDL2 port so we need to keep it
        // around at least until that is updated.
        // See https://github.com/libsdl-org/SDL/pull/6304
        return safeSetTimeout(func, timeout);
      },
  getMimetype(name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.slice(name.lastIndexOf('.')+1)];
      },
  getUserMedia(func) {
        return navigator.mediaDevices.getUserMedia(func);
      },
  getMouseWheelDelta(event) {
        var delta = 0;
        switch (event.type) {
          case 'DOMMouseScroll':
            // 3 lines make up a step
            delta = event.detail / 3;
            break;
          case 'mousewheel':
            // 120 units make up a step
            delta = event.wheelDelta / 120;
            break;
          case 'wheel':
            delta = event.deltaY
            switch (event.deltaMode) {
              case 0:
                // DOM_DELTA_PIXEL: 100 pixels make up a step
                delta /= 100;
                break;
              case 1:
                // DOM_DELTA_LINE: 3 lines make up a step
                delta /= 3;
                break;
              case 2:
                // DOM_DELTA_PAGE: A page makes up 80 steps
                delta *= 80;
                break;
              default:
                abort('unrecognized mouse wheel delta mode: ' + event.deltaMode);
            }
            break;
          default:
            abort('unrecognized mouse wheel event: ' + event.type);
        }
        return delta;
      },
  mouseX:0,
  mouseY:0,
  mouseMovementX:0,
  mouseMovementY:0,
  touches:{
  },
  lastTouches:{
  },
  calculateMouseCoords(pageX, pageY) {
        // Calculate the movement based on the changes
        // in the coordinates.
        var canvas = Browser.getCanvas();
        var rect = canvas.getBoundingClientRect();
  
        var adjustedX = pageX - (window.scrollX + rect.left);
        var adjustedY = pageY - (window.scrollY + rect.top);
  
        // the canvas might be CSS-scaled compared to its backbuffer;
        // SDL-using content will want mouse coordinates in terms
        // of backbuffer units.
        adjustedX = adjustedX * (canvas.width / rect.width);
        adjustedY = adjustedY * (canvas.height / rect.height);
  
        return { x: adjustedX, y: adjustedY };
      },
  setMouseCoords(pageX, pageY) {
        const {x, y} = Browser.calculateMouseCoords(pageX, pageY);
        Browser.mouseMovementX = x - Browser.mouseX;
        Browser.mouseMovementY = y - Browser.mouseY;
        Browser.mouseX = x;
        Browser.mouseY = y;
      },
  calculateMouseEvent(event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          Browser.mouseMovementX = event.movementX;
          Browser.mouseMovementY = event.movementY;
  
          // add the mouse delta to the current absolute mouse position
          Browser.mouseX += Browser.mouseMovementX;
          Browser.mouseY += Browser.mouseMovementY;
        } else {
          if (event.type === 'touchstart' || event.type === 'touchend' || event.type === 'touchmove') {
            var touch = event.touch;
            if (touch === undefined) {
              return; // the 'touch' property is only defined in SDL
  
            }
            var coords = Browser.calculateMouseCoords(touch.pageX, touch.pageY);
  
            if (event.type === 'touchstart') {
              Browser.lastTouches[touch.identifier] = coords;
              Browser.touches[touch.identifier] = coords;
            } else if (event.type === 'touchend' || event.type === 'touchmove') {
              var last = Browser.touches[touch.identifier];
              last ||= coords;
              Browser.lastTouches[touch.identifier] = last;
              Browser.touches[touch.identifier] = coords;
            }
            return;
          }
  
          Browser.setMouseCoords(event.pageX, event.pageY);
        }
      },
  resizeListeners:[],
  updateResizeListeners() {
        var canvas = Browser.getCanvas();
        Browser.resizeListeners.forEach((listener) => listener(canvas.width, canvas.height));
      },
  setCanvasSize(width, height, noUpdates) {
        var canvas = Browser.getCanvas();
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
      },
  windowedWidth:0,
  windowedHeight:0,
  setFullscreenCanvasSize() {
        // check if SDL is available
        if (typeof SDL != 'undefined') {
          var flags = HEAPU32[((SDL.screen)/4)];
          flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
          HEAP32[((SDL.screen)/4)] = flags;
        }
        Browser.updateCanvasDimensions(Browser.getCanvas());
        Browser.updateResizeListeners();
      },
  setWindowedCanvasSize() {
        // check if SDL is available
        if (typeof SDL != 'undefined') {
          var flags = HEAPU32[((SDL.screen)/4)];
          flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
          HEAP32[((SDL.screen)/4)] = flags;
        }
        Browser.updateCanvasDimensions(Browser.getCanvas());
        Browser.updateResizeListeners();
      },
  updateCanvasDimensions(canvas, wNative, hNative) {
        if (wNative && hNative) {
          canvas.widthNative = wNative;
          canvas.heightNative = hNative;
        } else {
          wNative = canvas.widthNative;
          hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if ((getFullscreenElement() === canvas.parentNode) && (typeof screen != 'undefined')) {
           var factor = Math.min(screen.width / w, screen.height / h);
           w = Math.round(w * factor);
           h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
          if (canvas.width  != w) canvas.width  = w;
          if (canvas.height != h) canvas.height = h;
          if (typeof canvas.style != 'undefined') {
            canvas.style.removeProperty( 'width');
            canvas.style.removeProperty('height');
          }
        } else {
          if (canvas.width  != wNative) canvas.width  = wNative;
          if (canvas.height != hNative) canvas.height = hNative;
          if (typeof canvas.style != 'undefined') {
            if (w != wNative || h != hNative) {
              canvas.style.setProperty( 'width', w + 'px', 'important');
              canvas.style.setProperty('height', h + 'px', 'important');
            } else {
              canvas.style.removeProperty( 'width');
              canvas.style.removeProperty('height');
            }
          }
        }
      },
  };
  
  
  
  var EGL = {
  errorCode:12288,
  defaultDisplayInitialized:false,
  currentContext:0,
  currentReadSurface:0,
  currentDrawSurface:0,
  contextAttributes:{
  alpha:false,
  depth:false,
  stencil:false,
  antialias:false,
  },
  stringCache:{
  },
  setErrorCode(code) {
        EGL.errorCode = code;
      },
  chooseConfig(display, attribList, config, config_size, numConfigs) {
        if (display != 62000) {
          EGL.setErrorCode(0x3008 /* EGL_BAD_DISPLAY */);
          return 0;
        }
  
        if (attribList) {
          // read attribList if it is non-null
          for (;;) {
            var param = HEAP32[((attribList)/4)];
            if (param == 0x3021 /*EGL_ALPHA_SIZE*/) {
              var alphaSize = HEAP32[(((attribList)+(4))/4)];
              EGL.contextAttributes.alpha = (alphaSize > 0);
            } else if (param == 0x3025 /*EGL_DEPTH_SIZE*/) {
              var depthSize = HEAP32[(((attribList)+(4))/4)];
              EGL.contextAttributes.depth = (depthSize > 0);
            } else if (param == 0x3026 /*EGL_STENCIL_SIZE*/) {
              var stencilSize = HEAP32[(((attribList)+(4))/4)];
              EGL.contextAttributes.stencil = (stencilSize > 0);
            } else if (param == 0x3031 /*EGL_SAMPLES*/) {
              var samples = HEAP32[(((attribList)+(4))/4)];
              EGL.contextAttributes.antialias = (samples > 0);
            } else if (param == 0x3032 /*EGL_SAMPLE_BUFFERS*/) {
              var samples = HEAP32[(((attribList)+(4))/4)];
              EGL.contextAttributes.antialias = (samples == 1);
            } else if (param == 0x3100 /*EGL_CONTEXT_PRIORITY_LEVEL_IMG*/) {
              var requestedPriority = HEAP32[(((attribList)+(4))/4)];
              EGL.contextAttributes.lowLatency = (requestedPriority != 0x3103 /*EGL_CONTEXT_PRIORITY_LOW_IMG*/);
            } else if (param == 0x3038 /*EGL_NONE*/) {
                break;
            }
            attribList += 8;
          }
        }
  
        if ((!config || !config_size) && !numConfigs) {
          EGL.setErrorCode(0x300C /* EGL_BAD_PARAMETER */);
          return 0;
        }
        if (numConfigs) {
          HEAP32[((numConfigs)/4)] = 1; // Total number of supported configs: 1.
        }
        if (config && config_size > 0) {
          HEAPU64[((config)/8)] = 62002n;
        }
  
        EGL.setErrorCode(0x3000 /* EGL_SUCCESS */);
        return 1;
      },
  };
  var _eglBindAPI = (api) => {
      if (api == 0x30A0 /* EGL_OPENGL_ES_API */) {
        EGL.setErrorCode(0x3000 /* EGL_SUCCESS */);
        return 1;
      }
      // if (api == 0x30A1 /* EGL_OPENVG_API */ || api == 0x30A2 /* EGL_OPENGL_API */) {
      EGL.setErrorCode(0x300C /* EGL_BAD_PARAMETER */);
      return 0;
    };

  
  function _eglChooseConfig(display, attrib_list, configs, config_size, numConfigs) {
    display = bigintToI53Checked(display);
    attrib_list = bigintToI53Checked(attrib_list);
    configs = bigintToI53Checked(configs);
    numConfigs = bigintToI53Checked(numConfigs);
  
  return EGL.chooseConfig(display, attrib_list, configs, config_size, numConfigs);
  }

  var GLctx;
  
  var webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance = (ctx) =>
      // Closure is expected to be allowed to minify the '.dibvbi' property, so not accessing it quoted.
      !!(ctx.dibvbi = ctx.getExtension('WEBGL_draw_instanced_base_vertex_base_instance'));
  
  var webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance = (ctx) => {
      // Closure is expected to be allowed to minify the '.mdibvbi' property, so not accessing it quoted.
      return !!(ctx.mdibvbi = ctx.getExtension('WEBGL_multi_draw_instanced_base_vertex_base_instance'));
    };
  
  var webgl_enable_EXT_polygon_offset_clamp = (ctx) =>
      !!(ctx.extPolygonOffsetClamp = ctx.getExtension('EXT_polygon_offset_clamp'));
  
  var webgl_enable_EXT_clip_control = (ctx) =>
      !!(ctx.extClipControl = ctx.getExtension('EXT_clip_control'));
  
  var webgl_enable_WEBGL_polygon_mode = (ctx) =>
      !!(ctx.webglPolygonMode = ctx.getExtension('WEBGL_polygon_mode'));
  
  var webgl_enable_WEBGL_multi_draw = (ctx) =>
      // Closure is expected to be allowed to minify the '.multiDrawWebgl' property, so not accessing it quoted.
      !!(ctx.multiDrawWebgl = ctx.getExtension('WEBGL_multi_draw'));
  
  var getEmscriptenSupportedExtensions = (ctx) => {
      // Restrict the list of advertised extensions to those that we actually
      // support.
      var supportedExtensions = [
        // WebGL 2 extensions
        'EXT_color_buffer_float',
        'EXT_conservative_depth',
        'EXT_disjoint_timer_query_webgl2',
        'EXT_texture_norm16',
        'NV_shader_noperspective_interpolation',
        'WEBGL_clip_cull_distance',
        // WebGL 1 and WebGL 2 extensions
        'EXT_clip_control',
        'EXT_color_buffer_half_float',
        'EXT_depth_clamp',
        'EXT_float_blend',
        'EXT_polygon_offset_clamp',
        'EXT_texture_compression_bptc',
        'EXT_texture_compression_rgtc',
        'EXT_texture_filter_anisotropic',
        'KHR_parallel_shader_compile',
        'OES_texture_float_linear',
        'WEBGL_blend_func_extended',
        'WEBGL_compressed_texture_astc',
        'WEBGL_compressed_texture_etc',
        'WEBGL_compressed_texture_etc1',
        'WEBGL_compressed_texture_s3tc',
        'WEBGL_compressed_texture_s3tc_srgb',
        'WEBGL_debug_renderer_info',
        'WEBGL_debug_shaders',
        'WEBGL_lose_context',
        'WEBGL_multi_draw',
        'WEBGL_polygon_mode'
      ];
      // .getSupportedExtensions() can return null if context is lost, so coerce to empty array.
      return ctx.getSupportedExtensions()?.filter(ext => supportedExtensions.includes(ext)) ?? [];
    };
  
  
  
  
  var GL = {
  counter:1,
  buffers:[],
  programs:[],
  framebuffers:[],
  renderbuffers:[],
  textures:[],
  shaders:[],
  vaos:[],
  contexts:[],
  offscreenCanvases:{
  },
  queries:[],
  samplers:[],
  transformFeedbacks:[],
  syncs:[],
  stringCache:{
  },
  stringiCache:{
  },
  unpackAlignment:4,
  unpackRowLength:0,
  recordError:(errorCode) => {
        if (!GL.lastError) {
          GL.lastError = errorCode;
        }
      },
  getNewId:(table) => {
        var ret = GL.counter++;
        for (var i = table.length; i < ret; i++) {
          table[i] = null;
        }
        return ret;
      },
  genObject:(n, buffers, createFunction, objectTable
        ) => {
        for (var i = 0; i < n; i++) {
          var buffer = GLctx[createFunction]();
          var id = buffer && GL.getNewId(objectTable);
          if (buffer) {
            buffer.name = id;
            objectTable[id] = buffer;
          } else {
            GL.recordError(0x502 /* GL_INVALID_OPERATION */);
          }
          HEAP32[(((buffers)+(i*4))/4)] = id;
        }
      },
  getSource:(shader, count, string, length) => {
        var source = '';
        for (var i = 0; i < count; ++i) {
          var len = length ? Number(HEAPU64[(((length)+(i*8))/8)]) : undefined;
          source += UTF8ToString(Number(HEAPU64[(((string)+(i*8))/8)]), len);
        }
        return source;
      },
  createContext:(/** @type {HTMLCanvasElement} */ canvas, webGLContextAttributes) => {
  
        var ctx = canvas.getContext('webgl2', webGLContextAttributes);
  
        if (!ctx) return 0;
  
        var handle = GL.registerContext(ctx, webGLContextAttributes);
  
        return handle;
      },
  registerContext:(ctx, webGLContextAttributes) => {
        // without pthreads a context is just an integer ID
        var handle = GL.getNewId(GL.contexts);
  
        var context = {
          handle,
          attributes: webGLContextAttributes,
          version: webGLContextAttributes.majorVersion,
          GLctx: ctx
        };
  
        // Store the created context object so that we can access the context
        // given a canvas without having to pass the parameters again.
        if (ctx.canvas) ctx.canvas.GLctxObject = context;
        GL.contexts[handle] = context;
        if (typeof webGLContextAttributes.enableExtensionsByDefault == 'undefined' || webGLContextAttributes.enableExtensionsByDefault) {
          GL.initExtensions(context);
        }
  
        return handle;
      },
  makeContextCurrent:(contextHandle) => {
  
        // Active Emscripten GL layer context object.
        GL.currentContext = GL.contexts[contextHandle];
        // Active WebGL context object.
        Module['ctx'] = GLctx = GL.currentContext?.GLctx;
        return !(contextHandle && !GLctx);
      },
  getContext:(contextHandle) => {
        return GL.contexts[contextHandle];
      },
  deleteContext:(contextHandle) => {
        if (GL.currentContext === GL.contexts[contextHandle]) {
          GL.currentContext = null;
        }
        if (typeof JSEvents == 'object') {
          // Release all JS event handlers on the DOM element that the GL context is
          // associated with since the context is now deleted.
          JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas);
        }
        // Make sure the canvas object no longer refers to the context object so
        // there are no GC surprises.
        if (GL.contexts[contextHandle]?.GLctx.canvas) {
          GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
        }
        GL.contexts[contextHandle] = null;
      },
  initExtensions:(context) => {
        // If this function is called without a specific context object, init the
        // extensions of the currently active context.
        context ||= GL.currentContext;
  
        if (context.initExtensionsDone) return;
        context.initExtensionsDone = true;
  
        var GLctx = context.GLctx;
  
        // Detect the presence of a few extensions manually, since the GL interop
        // layer itself will need to know if they exist.
  
        // Extensions that are available in both WebGL 1 and WebGL 2
        webgl_enable_WEBGL_multi_draw(GLctx);
        webgl_enable_EXT_polygon_offset_clamp(GLctx);
        webgl_enable_EXT_clip_control(GLctx);
        webgl_enable_WEBGL_polygon_mode(GLctx);
        // Extensions that are available from WebGL >= 2 (no-op if called on a WebGL 1 context active)
        webgl_enable_WEBGL_draw_instanced_base_vertex_base_instance(GLctx);
        webgl_enable_WEBGL_multi_draw_instanced_base_vertex_base_instance(GLctx);
  
        // On WebGL 2, EXT_disjoint_timer_query is replaced with an alternative
        // that's based on core APIs, and exposes only the queryCounterEXT()
        // entrypoint.
        if (context.version >= 2) {
          GLctx.disjointTimerQueryExt = GLctx.getExtension('EXT_disjoint_timer_query_webgl2');
        }
  
        // However, Firefox exposes the WebGL 1 version on WebGL 2 as well and
        // thus we look for the WebGL 1 version again if the WebGL 2 version
        // isn't present. https://bugzil.la/1328882
        if (context.version < 2 || !GLctx.disjointTimerQueryExt)
        {
          GLctx.disjointTimerQueryExt = GLctx.getExtension('EXT_disjoint_timer_query');
        }
  
        for (var ext of getEmscriptenSupportedExtensions(GLctx)) {
          // WEBGL_lose_context, WEBGL_debug_renderer_info and WEBGL_debug_shaders
          // are not enabled by default.
          if (!ext.includes('lose_context') && !ext.includes('debug')) {
            // Call .getExtension() to enable that extension permanently.
            GLctx.getExtension(ext);
          }
        }
      },
  };
  
  
  
  var _eglCreateContext = function(display, config, hmm, contextAttribs) {
    display = bigintToI53Checked(display);
    config = bigintToI53Checked(config);
    hmm = bigintToI53Checked(hmm);
    contextAttribs = bigintToI53Checked(contextAttribs);
  
  var ret = (() => { 
      if (display != 62000) {
        EGL.setErrorCode(0x3008 /* EGL_BAD_DISPLAY */);
        return 0;
      }
  
      // EGL 1.4 spec says default EGL_CONTEXT_CLIENT_VERSION is GLES1, but this is not supported by Emscripten.
      // So user must pass EGL_CONTEXT_CLIENT_VERSION == 2 to initialize EGL.
      var glesContextVersion = 1;
      for (;;) {
        var param = HEAP32[((contextAttribs)/4)];
        if (param == 0x3098 /*EGL_CONTEXT_CLIENT_VERSION*/) {
          glesContextVersion = HEAP32[(((contextAttribs)+(4))/4)];
        } else if (param == 0x3038 /*EGL_NONE*/) {
          break;
        } else {
          /* EGL1.4 specifies only EGL_CONTEXT_CLIENT_VERSION as supported attribute */
          EGL.setErrorCode(0x3004 /*EGL_BAD_ATTRIBUTE*/);
          return 0;
        }
        contextAttribs += 8;
      }
      if (glesContextVersion < 2 || glesContextVersion > 3) {
        EGL.setErrorCode(0x3005 /* EGL_BAD_CONFIG */);
        return 0; /* EGL_NO_CONTEXT */
      }
  
      EGL.contextAttributes.majorVersion = glesContextVersion - 1; // WebGL 1 is GLES 2, WebGL2 is GLES3
      EGL.contextAttributes.minorVersion = 0;
  
      EGL.context = GL.createContext(Browser.getCanvas(), EGL.contextAttributes);
  
      if (EGL.context != 0) {
        EGL.setErrorCode(0x3000 /* EGL_SUCCESS */);
  
        // Run callbacks so that GL emulation works
        GL.makeContextCurrent(EGL.context);
        Browser.useWebGL = true;
        Browser.moduleContextCreatedCallbacks.forEach((callback) => callback());
  
        // Note: This function only creates a context, but it shall not make it active.
        GL.makeContextCurrent(null);
        return 62004;
      } else {
        EGL.setErrorCode(0x3009 /* EGL_BAD_MATCH */); // By the EGL 1.4 spec, an implementation that does not support GLES2 (WebGL in this case), this error code is set.
        return 0; /* EGL_NO_CONTEXT */
      }
     })();
  return BigInt(ret);
  };

  
  var _eglCreateWindowSurface = function(display, config, win, attrib_list) {
    display = bigintToI53Checked(display);
    config = bigintToI53Checked(config);
    attrib_list = bigintToI53Checked(attrib_list);
  
  var ret = (() => { 
      if (display != 62000) {
        EGL.setErrorCode(0x3008 /* EGL_BAD_DISPLAY */);
        return 0;
      }
      if (config != 62002) {
        EGL.setErrorCode(0x3005 /* EGL_BAD_CONFIG */);
        return 0;
      }
      // TODO: Examine attrib_list! Parameters that can be present there are:
      // - EGL_RENDER_BUFFER (must be EGL_BACK_BUFFER)
      // - EGL_VG_COLORSPACE (can't be set)
      // - EGL_VG_ALPHA_FORMAT (can't be set)
      EGL.setErrorCode(0x3000 /* EGL_SUCCESS */);
      return 62006; /* Magic ID for Emscripten 'default surface' */
     })();
  return BigInt(ret);
  };

  
  
  function _eglDestroyContext(display, context) {
    display = bigintToI53Checked(display);
    context = bigintToI53Checked(context);
  
  
      if (display != 62000) {
        EGL.setErrorCode(0x3008 /* EGL_BAD_DISPLAY */);
        return 0;
      }
      if (context != 62004) {
        EGL.setErrorCode(0x3006 /* EGL_BAD_CONTEXT */);
        return 0;
      }
  
      GL.deleteContext(EGL.context);
      EGL.setErrorCode(0x3000 /* EGL_SUCCESS */);
      if (EGL.currentContext == context) {
        EGL.currentContext = 0;
      }
      return 1 /* EGL_TRUE */;
    ;
  }

  
  function _eglDestroySurface(display, surface) {
    display = bigintToI53Checked(display);
    surface = bigintToI53Checked(surface);
  
  
      if (display != 62000) {
        EGL.setErrorCode(0x3008 /* EGL_BAD_DISPLAY */);
        return 0;
      }
      if (surface != 62006 /* Magic ID for the only EGLSurface supported by Emscripten */) {
        EGL.setErrorCode(0x300D /* EGL_BAD_SURFACE */);
        return 1;
      }
      if (EGL.currentReadSurface == surface) {
        EGL.currentReadSurface = 0;
      }
      if (EGL.currentDrawSurface == surface) {
        EGL.currentDrawSurface = 0;
      }
      EGL.setErrorCode(0x3000 /* EGL_SUCCESS */);
      return 1; /* Magic ID for Emscripten 'default surface' */
    ;
  }

  
  
  function _eglGetConfigAttrib(display, config, attribute, value) {
    display = bigintToI53Checked(display);
    config = bigintToI53Checked(config);
    value = bigintToI53Checked(value);
  
  
      if (display != 62000) {
        EGL.setErrorCode(0x3008 /* EGL_BAD_DISPLAY */);
        return 0;
      }
      if (config != 62002) {
        EGL.setErrorCode(0x3005 /* EGL_BAD_CONFIG */);
        return 0;
      }
      if (!value) {
        EGL.setErrorCode(0x300C /* EGL_BAD_PARAMETER */);
        return 0;
      }
      EGL.setErrorCode(0x3000 /* EGL_SUCCESS */);
      switch (attribute) {
      case 0x3020: // EGL_BUFFER_SIZE
        HEAP32[((value)/4)] = EGL.contextAttributes.alpha ? 32 : 24;
        return 1;
      case 0x3021: // EGL_ALPHA_SIZE
        HEAP32[((value)/4)] = EGL.contextAttributes.alpha ? 8 : 0;
        return 1;
      case 0x3022: // EGL_BLUE_SIZE
        HEAP32[((value)/4)] = 8;
        return 1;
      case 0x3023: // EGL_GREEN_SIZE
        HEAP32[((value)/4)] = 8;
        return 1;
      case 0x3024: // EGL_RED_SIZE
        HEAP32[((value)/4)] = 8;
        return 1;
      case 0x3025: // EGL_DEPTH_SIZE
        HEAP32[((value)/4)] = EGL.contextAttributes.depth ? 24 : 0;
        return 1;
      case 0x3026: // EGL_STENCIL_SIZE
        HEAP32[((value)/4)] = EGL.contextAttributes.stencil ? 8 : 0;
        return 1;
      case 0x3027: // EGL_CONFIG_CAVEAT
        // We can return here one of EGL_NONE (0x3038), EGL_SLOW_CONFIG (0x3050) or EGL_NON_CONFORMANT_CONFIG (0x3051).
        HEAP32[((value)/4)] = 0x3038;
        return 1;
      case 0x3028: // EGL_CONFIG_ID
        HEAP32[((value)/4)] = 62002;
        return 1;
      case 0x3029: // EGL_LEVEL
        HEAP32[((value)/4)] = 0;
        return 1;
      case 0x302A: // EGL_MAX_PBUFFER_HEIGHT
        HEAP32[((value)/4)] = 4096;
        return 1;
      case 0x302B: // EGL_MAX_PBUFFER_PIXELS
        HEAP32[((value)/4)] = 16777216;
        return 1;
      case 0x302C: // EGL_MAX_PBUFFER_WIDTH
        HEAP32[((value)/4)] = 4096;
        return 1;
      case 0x302D: // EGL_NATIVE_RENDERABLE
        HEAP32[((value)/4)] = 0;
        return 1;
      case 0x302E: // EGL_NATIVE_VISUAL_ID
        HEAP32[((value)/4)] = 0;
        return 1;
      case 0x302F: // EGL_NATIVE_VISUAL_TYPE
        HEAP32[((value)/4)] = 0x3038;
        return 1;
      case 0x3031: // EGL_SAMPLES
        HEAP32[((value)/4)] = EGL.contextAttributes.antialias ? 4 : 0;
        return 1;
      case 0x3032: // EGL_SAMPLE_BUFFERS
        HEAP32[((value)/4)] = EGL.contextAttributes.antialias ? 1 : 0;
        return 1;
      case 0x3033: // EGL_SURFACE_TYPE
        HEAP32[((value)/4)] = 0x4;
        return 1;
      case 0x3034: // EGL_TRANSPARENT_TYPE
        // If this returns EGL_TRANSPARENT_RGB (0x3052), transparency is used through color-keying. No such thing applies to Emscripten canvas.
        HEAP32[((value)/4)] = 0x3038;
        return 1;
      case 0x3035: // EGL_TRANSPARENT_BLUE_VALUE
      case 0x3036: // EGL_TRANSPARENT_GREEN_VALUE
      case 0x3037: // EGL_TRANSPARENT_RED_VALUE
        // "If EGL_TRANSPARENT_TYPE is EGL_NONE, then the values for EGL_TRANSPARENT_RED_VALUE, EGL_TRANSPARENT_GREEN_VALUE, and EGL_TRANSPARENT_BLUE_VALUE are undefined."
        HEAP32[((value)/4)] = -1;
        return 1;
      case 0x3039: // EGL_BIND_TO_TEXTURE_RGB
      case 0x303A: // EGL_BIND_TO_TEXTURE_RGBA
        HEAP32[((value)/4)] = 0;
        return 1;
      case 0x303B: // EGL_MIN_SWAP_INTERVAL
        HEAP32[((value)/4)] = 0;
        return 1;
      case 0x303C: // EGL_MAX_SWAP_INTERVAL
        HEAP32[((value)/4)] = 1;
        return 1;
      case 0x303D: // EGL_LUMINANCE_SIZE
      case 0x303E: // EGL_ALPHA_MASK_SIZE
        HEAP32[((value)/4)] = 0;
        return 1;
      case 0x303F: // EGL_COLOR_BUFFER_TYPE
        // EGL has two types of buffers: EGL_RGB_BUFFER and EGL_LUMINANCE_BUFFER.
        HEAP32[((value)/4)] = 0x308E;
        return 1;
      case 0x3040: // EGL_RENDERABLE_TYPE
        // A bit combination of EGL_OPENGL_ES_BIT,EGL_OPENVG_BIT,EGL_OPENGL_ES2_BIT and EGL_OPENGL_BIT.
        HEAP32[((value)/4)] = 0x4;
        return 1;
      case 0x3042: // EGL_CONFORMANT
        // "EGL_CONFORMANT is a mask indicating if a client API context created with respect to the corresponding EGLConfig will pass the required conformance tests for that API."
        HEAP32[((value)/4)] = 0;
        return 1;
      default:
        EGL.setErrorCode(0x3004 /* EGL_BAD_ATTRIBUTE */);
        return 0;
      }
    ;
  }

  
  var _eglGetDisplay = function(nativeDisplayType) {
    nativeDisplayType = bigintToI53Checked(nativeDisplayType);
  
  var ret = (() => { 
      EGL.setErrorCode(0x3000 /* EGL_SUCCESS */);
      // Emscripten EGL implementation "emulates" X11, and eglGetDisplay is
      // expected to accept/receive a pointer to an X11 Display object (or
      // EGL_DEFAULT_DISPLAY).
      if (nativeDisplayType != 0 /* EGL_DEFAULT_DISPLAY */ && nativeDisplayType != 1 /* see library_xlib.js */) {
        return 0; // EGL_NO_DISPLAY
      }
      return 62000;
     })();
  return BigInt(ret);
  };

  var _eglGetError = () => EGL.errorCode;

  
  
  function _eglInitialize(display, majorVersion, minorVersion) {
    display = bigintToI53Checked(display);
    majorVersion = bigintToI53Checked(majorVersion);
    minorVersion = bigintToI53Checked(minorVersion);
  
  
      if (display != 62000) {
        EGL.setErrorCode(0x3008 /* EGL_BAD_DISPLAY */);
        return 0;
      }
      if (majorVersion) {
        HEAP32[((majorVersion)/4)] = 1; // Advertise EGL Major version: '1'
      }
      if (minorVersion) {
        HEAP32[((minorVersion)/4)] = 4; // Advertise EGL Minor version: '4'
      }
      EGL.defaultDisplayInitialized = true;
      EGL.setErrorCode(0x3000 /* EGL_SUCCESS */);
      return 1;
    ;
  }

  
  
  function _eglMakeCurrent(display, draw, read, context) {
    display = bigintToI53Checked(display);
    draw = bigintToI53Checked(draw);
    read = bigintToI53Checked(read);
    context = bigintToI53Checked(context);
  
  
      if (display != 62000) {
        EGL.setErrorCode(0x3008 /* EGL_BAD_DISPLAY */);
        return 0 /* EGL_FALSE */;
      }
      //\todo An EGL_NOT_INITIALIZED error is generated if EGL is not initialized for dpy.
      if (context != 0 && context != 62004) {
        EGL.setErrorCode(0x3006 /* EGL_BAD_CONTEXT */);
        return 0;
      }
      if ((read != 0 && read != 62006) || (draw != 0 && draw != 62006 /* Magic ID for Emscripten 'default surface' */)) {
        EGL.setErrorCode(0x300D /* EGL_BAD_SURFACE */);
        return 0;
      }
  
      GL.makeContextCurrent(context ? EGL.context : null);
  
      EGL.currentContext = context;
      EGL.currentDrawSurface = draw;
      EGL.currentReadSurface = read;
      EGL.setErrorCode(0x3000 /* EGL_SUCCESS */);
      return 1 /* EGL_TRUE */;
    ;
  }

  
  
  var stringToNewUTF8 = (str) => {
      var size = lengthBytesUTF8(str) + 1;
      var ret = _malloc(size);
      if (ret) stringToUTF8(str, ret, size);
      return ret;
    };
  
  
  var _eglQueryString = function(display, name) {
    display = bigintToI53Checked(display);
  
  var ret = (() => { 
      if (display != 62000) {
        EGL.setErrorCode(0x3008 /* EGL_BAD_DISPLAY */);
        return 0;
      }
      //\todo An EGL_NOT_INITIALIZED error is generated if EGL is not initialized for dpy.
      EGL.setErrorCode(0x3000 /* EGL_SUCCESS */);
      if (EGL.stringCache[name]) return EGL.stringCache[name];
      var ret;
      switch (name) {
        case 0x3053 /* EGL_VENDOR */: ret = stringToNewUTF8('Emscripten'); break;
        case 0x3054 /* EGL_VERSION */: ret = stringToNewUTF8('1.4 Emscripten EGL'); break;
        case 0x3055 /* EGL_EXTENSIONS */:  ret = stringToNewUTF8(''); break; // Currently not supporting any EGL extensions.
        case 0x308D /* EGL_CLIENT_APIS */: ret = stringToNewUTF8('OpenGL_ES'); break;
        default:
          EGL.setErrorCode(0x300C /* EGL_BAD_PARAMETER */);
          return 0;
      }
      EGL.stringCache[name] = ret;
      return ret;
     })();
  return BigInt(ret);
  };

  
  
  function _eglSwapBuffers(dpy, surface) {
    dpy = bigintToI53Checked(dpy);
    surface = bigintToI53Checked(surface);
  
  
      if (!EGL.defaultDisplayInitialized) {
        EGL.setErrorCode(0x3001 /* EGL_NOT_INITIALIZED */);
      } else if (!GLctx) {
        EGL.setErrorCode(0x3002 /* EGL_BAD_ACCESS */);
      } else if (GLctx.isContextLost()) {
        EGL.setErrorCode(0x300E /* EGL_CONTEXT_LOST */);
      } else {
        // According to documentation this does an implicit flush.
        // Due to discussion at https://github.com/emscripten-core/emscripten/pull/1871
        // the flush was removed since this _may_ result in slowing code down.
        //_glFlush();
        EGL.setErrorCode(0x3000 /* EGL_SUCCESS */);
        return 1 /* EGL_TRUE */;
      }
      return 0 /* EGL_FALSE */;
    ;
  }

  
  
  
  
    /**
   * @param {number=} arg
   * @param {boolean=} noSetTiming
   */
  var setMainLoop = (iterFunc, fps, simulateInfiniteLoop, arg, noSetTiming) => {
      MainLoop.func = iterFunc;
      MainLoop.arg = arg;
  
      var thisMainLoopId = MainLoop.currentlyRunningMainloop;
      function checkIsRunning() {
        if (thisMainLoopId < MainLoop.currentlyRunningMainloop) {
          
          maybeExit();
          return false;
        }
        return true;
      }
  
      // We create the loop runner here but it is not actually running until
      // _emscripten_set_main_loop_timing is called (which might happen at a
      // later time).  This member signifies that the current runner has not
      // yet been started so that we can call runtimeKeepalivePush when it
      // gets its timing set for the first time.
      MainLoop.running = false;
      MainLoop.runner = function MainLoop_runner() {
        if (ABORT) return;
        if (MainLoop.queue.length > 0) {
          var start = Date.now();
          var blocker = MainLoop.queue.shift();
          blocker.func(blocker.arg);
          if (MainLoop.remainingBlockers) {
            var remaining = MainLoop.remainingBlockers;
            var next = remaining%1 == 0 ? remaining-1 : Math.floor(remaining);
            if (blocker.counted) {
              MainLoop.remainingBlockers = next;
            } else {
              // not counted, but move the progress along a tiny bit
              next = next + 0.5; // do not steal all the next one's progress
              MainLoop.remainingBlockers = (8*remaining + next)/9;
            }
          }
          MainLoop.updateStatus();
  
          // catches pause/resume main loop from blocker execution
          if (!checkIsRunning()) return;
  
          setTimeout(MainLoop.runner, 0);
          return;
        }
  
        // catch pauses from non-main loop sources
        if (!checkIsRunning()) return;
  
        // Implement very basic swap interval control
        MainLoop.currentFrameNumber = MainLoop.currentFrameNumber + 1 | 0;
        if (MainLoop.timingMode == 1 && MainLoop.timingValue > 1 && MainLoop.currentFrameNumber % MainLoop.timingValue != 0) {
          // Not the scheduled time to render this frame - skip.
          MainLoop.scheduler();
          return;
        } else if (MainLoop.timingMode == 0) {
          MainLoop.tickStartTime = _emscripten_get_now();
        }
  
        MainLoop.runIter(iterFunc);
  
        // catch pauses from the main loop itself
        if (!checkIsRunning()) return;
  
        MainLoop.scheduler();
      }
  
      if (!noSetTiming) {
        if (fps > 0) {
          _emscripten_set_main_loop_timing(0, 1000.0 / fps);
        } else {
          // Do rAF by rendering each frame (no decimating)
          _emscripten_set_main_loop_timing(1, 1);
        }
  
        MainLoop.scheduler();
      }
  
      if (simulateInfiniteLoop) {
        throw 'unwind';
      }
    };
  
  
  var MainLoop = {
  running:false,
  scheduler:null,
  currentlyRunningMainloop:0,
  func:null,
  arg:0,
  timingMode:0,
  timingValue:0,
  currentFrameNumber:0,
  queue:[],
  preMainLoop:[],
  postMainLoop:[],
  pause() {
        MainLoop.scheduler = null;
        // Incrementing this signals the previous main loop that it's now become old, and it must return.
        MainLoop.currentlyRunningMainloop++;
      },
  resume() {
        MainLoop.currentlyRunningMainloop++;
        var timingMode = MainLoop.timingMode;
        var timingValue = MainLoop.timingValue;
        var func = MainLoop.func;
        MainLoop.func = null;
        // do not set timing and call scheduler, we will do it on the next lines
        setMainLoop(func, 0, false, MainLoop.arg, true);
        _emscripten_set_main_loop_timing(timingMode, timingValue);
        MainLoop.scheduler();
      },
  updateStatus() {
        if (Module['setStatus']) {
          var message = Module['statusMessage'] || 'Please wait...';
          var remaining = MainLoop.remainingBlockers ?? 0;
          var expected = MainLoop.expectedBlockers ?? 0;
          if (remaining) {
            if (remaining < expected) {
              Module['setStatus'](`{message} ({expected - remaining}/{expected})`);
            } else {
              Module['setStatus'](message);
            }
          } else {
            Module['setStatus']('');
          }
        }
      },
  init() {
      },
  runIter(func) {
        if (ABORT) return;
        for (var pre of MainLoop.preMainLoop) {
          if (pre() === false) {
            return; // |return false| skips a frame
          }
        }
        callUserCallback(func);
        for (var post of MainLoop.postMainLoop) {
          post();
        }
      },
  nextRAF:0,
  fakeRequestAnimationFrame(func) {
        // try to keep 60fps between calls to here
        var now = Date.now();
        if (MainLoop.nextRAF === 0) {
          MainLoop.nextRAF = now + 1000/60;
        } else {
          while (now + 2 >= MainLoop.nextRAF) { // fudge a little, to avoid timer jitter causing us to do lots of delay:0
            MainLoop.nextRAF += 1000/60;
          }
        }
        var delay = Math.max(MainLoop.nextRAF - now, 0);
        setTimeout(func, delay);
      },
  requestAnimationFrame(func) {
        if (globalThis.requestAnimationFrame) {
          requestAnimationFrame(func);
        } else {
          MainLoop.fakeRequestAnimationFrame(func);
        }
      },
  };
  var _emscripten_set_main_loop_timing = (mode, value) => {
      MainLoop.timingMode = mode;
      MainLoop.timingValue = value;
  
      if (!MainLoop.func) {
        return 1; // Return non-zero on failure, can't set timing mode when there is no main loop.
      }
  
      if (!MainLoop.running) {
        
        MainLoop.running = true;
      }
      if (mode == 0) {
        MainLoop.scheduler = function MainLoop_scheduler_setTimeout() {
          var timeUntilNextTick = Math.max(0, MainLoop.tickStartTime + value - _emscripten_get_now())|0;
          setTimeout(MainLoop.runner, timeUntilNextTick); // doing this each time means that on exception, we stop
        };
      } else if (mode == 1) {
        MainLoop.scheduler = function MainLoop_scheduler_rAF() {
          MainLoop.requestAnimationFrame(MainLoop.runner);
        };
      } else {
        if (!MainLoop.setImmediate) {
          if (globalThis.scheduler) {
            // Some modern browsers implement scheduler.postTask, but not all.
            MainLoop.setImmediate = scheduler.postTask.bind(scheduler);
          } else if (globalThis.setImmediate) {
            MainLoop.setImmediate = setImmediate;
          } else {
            // Emulate setImmediate. (note: not a complete polyfill, we don't emulate clearImmediate() to keep code size to minimum, since not needed)
            var setImmediates = [];
            var emscriptenMainLoopMessageId = 'setimmediate';
            /** @param {Event} event */
            var MainLoop_setImmediate_messageHandler = (event) => {
              if (event.data === emscriptenMainLoopMessageId) {
                event.stopPropagation();
                setImmediates.shift()();
              }
            };
            addEventListener('message', MainLoop_setImmediate_messageHandler, true);
            MainLoop.setImmediate = /** @type{function(function(): ?, ...?): number} */((func) => {
              setImmediates.push(func);
              if (ENVIRONMENT_IS_WORKER) {
                // The postMessge API in a Worker, sends message to the main
                // thread and does not support the `targetOrigin` (*) argument.
                postMessage(emscriptenMainLoopMessageId);
              } else {
                postMessage(emscriptenMainLoopMessageId, '*');
              }
            });
          }
        }
        MainLoop.scheduler = function MainLoop_scheduler_setImmediate() {
          MainLoop.setImmediate(MainLoop.runner);
        };
      }
      return 0;
    };
  
  
  function _eglSwapInterval(display, interval) {
    display = bigintToI53Checked(display);
  
  
      if (display != 62000) {
        EGL.setErrorCode(0x3008 /* EGL_BAD_DISPLAY */);
        return 0;
      }
      if (interval == 0) _emscripten_set_main_loop_timing(0, 0);
      else _emscripten_set_main_loop_timing(1, interval);
  
      EGL.setErrorCode(0x3000 /* EGL_SUCCESS */);
      return 1;
    ;
  }

  
  function _eglTerminate(display) {
    display = bigintToI53Checked(display);
  
  
      if (display != 62000) {
        EGL.setErrorCode(0x3008 /* EGL_BAD_DISPLAY */);
        return 0;
      }
      EGL.currentContext = 0;
      EGL.currentReadSurface = 0;
      EGL.currentDrawSurface = 0;
      EGL.defaultDisplayInitialized = false;
      EGL.setErrorCode(0x3000 /* EGL_SUCCESS */);
      return 1;
    ;
  }

  
  var _eglWaitClient = () => {
      EGL.setErrorCode(0x3000 /* EGL_SUCCESS */);
      return 1;
    };
  var _eglWaitGL = _eglWaitClient;

  var _eglWaitNative = (nativeEngineId) => {
      EGL.setErrorCode(0x3000 /* EGL_SUCCESS */);
      return 1;
    };

  var readEmAsmArgsArray = [];
  
  
  
  /** @type {!Float64Array} */
  var HEAPF64;
  
  
  var readEmAsmArgs = (sigPtr, buf) => {
      readEmAsmArgsArray.length = 0;
      var ch;
      // Most arguments are i32s, so shift the buffer pointer so it is a plain
      // index into HEAP32.
      while (ch = HEAPU8[sigPtr++]) {
        // Floats are always passed as doubles, so all types except for 'i'
        // are 8 bytes and require alignment.
        var wide = (ch != 105);
        buf += wide && (buf % 8) ? 4 : 0;
        readEmAsmArgsArray.push(
          // Special case for pointers under wasm64 or CAN_ADDRESS_2GB mode.
          ch == 112 ? Number(HEAPU64[((buf)/8)]) :
          ch == 106 ? HEAP64[((buf)/8)] :
          ch == 105 ?
            HEAP32[((buf)/4)] :
            HEAPF64[((buf)/8)]
        );
        buf += wide ? 8 : 4;
      }
      return readEmAsmArgsArray;
    };
  var runEmAsmFunction = (code, sigPtr, argbuf) => {
      var args = readEmAsmArgs(sigPtr, argbuf);
      return ASM_CONSTS[code](...args);
    };
  
  function _emscripten_asm_const_int(code, sigPtr, argbuf) {
    code = bigintToI53Checked(code);
    sigPtr = bigintToI53Checked(sigPtr);
    argbuf = bigintToI53Checked(argbuf);
  
  
      return runEmAsmFunction(code, sigPtr, argbuf);
    ;
  }

  var runMainThreadEmAsm = (emAsmAddr, sigPtr, argbuf, sync) => {
      var args = readEmAsmArgs(sigPtr, argbuf);
      return ASM_CONSTS[emAsmAddr](...args);
    };
  
  function _emscripten_asm_const_int_sync_on_main_thread(emAsmAddr, sigPtr, argbuf) {
    emAsmAddr = bigintToI53Checked(emAsmAddr);
    sigPtr = bigintToI53Checked(sigPtr);
    argbuf = bigintToI53Checked(argbuf);
  
  return runMainThreadEmAsm(emAsmAddr, sigPtr, argbuf, 1);
  }

  
  var _emscripten_asm_const_ptr_sync_on_main_thread = (emAsmAddr, sigPtr, argbuf) => {
    emAsmAddr = bigintToI53Checked(emAsmAddr);
    sigPtr = bigintToI53Checked(sigPtr);
    argbuf = bigintToI53Checked(argbuf);
  
  return BigInt(runMainThreadEmAsm(emAsmAddr, sigPtr, argbuf, 1));
  };


  var onExits = [];
  var addOnExit = (cb) => onExits.push(cb);
  var JSEvents = {
  removeAllEventListeners() {
        while (JSEvents.eventHandlers.length) {
          JSEvents._removeHandler(JSEvents.eventHandlers.length - 1);
        }
        JSEvents.deferredCalls = [];
      },
  inEventHandler:0,
  deferredCalls:[],
  deferCall(targetFunction, precedence, argsList) {
        function arraysHaveEqualContent(arrA, arrB) {
          if (arrA.length != arrB.length) return false;
  
          for (var i in arrA) {
            if (arrA[i] != arrB[i]) return false;
          }
          return true;
        }
        // Test if the given call was already queued, and if so, don't add it again.
        for (var call of JSEvents.deferredCalls) {
          if (call.targetFunction == targetFunction && arraysHaveEqualContent(call.argsList, argsList)) {
            return;
          }
        }
        JSEvents.deferredCalls.push({
          targetFunction,
          precedence,
          argsList
        });
  
        JSEvents.deferredCalls.sort((x,y) => x.precedence - y.precedence);
      },
  removeDeferredCalls(targetFunction) {
        JSEvents.deferredCalls = JSEvents.deferredCalls.filter((call) => call.targetFunction != targetFunction);
      },
  canPerformEventHandlerRequests() {
        // Browsers that support navigator.userActivation.isActive: https://developer.mozilla.org/en-US/docs/Web/API/UserActivation/isActive
        // We are targeting modern browsers where navigator.userActivation.isActive is unconditionally supported.
        return navigator.userActivation.isActive;
      },
  runDeferredCalls() {
        if (!JSEvents.canPerformEventHandlerRequests()) {
          return;
        }
        var deferredCalls = JSEvents.deferredCalls;
        JSEvents.deferredCalls = [];
        for (var call of deferredCalls) {
          call.targetFunction(...call.argsList);
        }
      },
  eventHandlers:[],
  removeAllHandlersOnTarget:(target, eventTypeString) => {
        for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
          if (JSEvents.eventHandlers[i].target == target &&
            (!eventTypeString || eventTypeString == JSEvents.eventHandlers[i].eventTypeString)) {
             JSEvents._removeHandler(i--);
           }
        }
      },
  _removeHandler(i) {
        var h = JSEvents.eventHandlers[i];
        h.target.removeEventListener(h.eventTypeString, h.eventListenerFunc, h.useCapture);
        JSEvents.eventHandlers.splice(i, 1);
      },
  registerOrRemoveHandler(eventHandler) {
        if (!eventHandler.target) {
          return -4;
        }
        if (eventHandler.callbackfunc) {
          eventHandler.eventListenerFunc = function(event) {
            // Increment nesting count for the event handler.
            ++JSEvents.inEventHandler;
            JSEvents.currentEventHandler = eventHandler;
            // Process any old deferred calls the user has placed.
            JSEvents.runDeferredCalls();
            // Process the actual event, calls back to user C code handler.
            eventHandler.handlerFunc(event);
            // Process any new deferred calls that were placed right now from this event handler.
            JSEvents.runDeferredCalls();
            // Out of event handler - restore nesting count.
            --JSEvents.inEventHandler;
          };
  
          eventHandler.target.addEventListener(eventHandler.eventTypeString,
                                               eventHandler.eventListenerFunc,
                                               eventHandler.useCapture);
          JSEvents.eventHandlers.push(eventHandler);
        } else {
          for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
            if (JSEvents.eventHandlers[i].target == eventHandler.target
             && JSEvents.eventHandlers[i].eventTypeString == eventHandler.eventTypeString) {
               JSEvents._removeHandler(i--);
             }
          }
        }
        return 0;
      },
  removeSingleHandler(eventHandler) {
        let success = false;
        for (let i = 0; i < JSEvents.eventHandlers.length; ++i) {
          const handler = JSEvents.eventHandlers[i];
          if (handler.target === eventHandler.target
            && handler.eventTypeId === eventHandler.eventTypeId
            && handler.callbackfunc === eventHandler.callbackfunc
            && handler.userData === eventHandler.userData) {
            // in some very rare cases (ex: Safari / fullscreen events), there is more than 1 handler (eventTypeString is different)
            JSEvents._removeHandler(i--);
            success = true;
          }
        }
        return success ? 0 : -5;
      },
  getNodeNameForTarget(target) {
        if (target == window) return '#window';
        if (target == screen) return '#screen';
        return target?.nodeName ?? '';
      },
  fullscreenEnabled() {
        return document.fullscreenEnabled
         ;
      },
  };
  
  /** @type {Object} */
  var specialHTMLTargets = [0, globalThis.document ?? 0, globalThis.window ?? 0];
  
  
  var maybeCStringToJsString = (cString) => {
      // 'cString > 2' checks if the input is a number, and isn't of the special
      // values we accept here, EMSCRIPTEN_EVENT_TARGET_* (which map to 0, 1, 2).
      // In other words, if cString > 2 then it's a pointer to a valid place in
      // memory, and points to a C string.
      return cString > 2 ? UTF8ToString(cString) : cString;
    };
  
  var findEventTarget = (target) => {
      target = maybeCStringToJsString(target);
      var domElement = specialHTMLTargets[target] || globalThis.document?.querySelector(target);
      return domElement;
    };
  var findCanvasEventTarget = findEventTarget;
  
  
  function _emscripten_get_canvas_element_size(target, width, height) {
    target = bigintToI53Checked(target);
    width = bigintToI53Checked(width);
    height = bigintToI53Checked(height);
  
  
      var canvas = findCanvasEventTarget(target);
      if (!canvas) return -4;
      HEAP32[((width)/4)] = canvas.width;
      HEAP32[((height)/4)] = canvas.height;
    ;
  }
  
  
  
  
  
  var stackAlloc = (sz) => __emscripten_stack_alloc(sz);
  var stringToUTF8OnStack = (str) => {
      var size = lengthBytesUTF8(str) + 1;
      var ret = stackAlloc(size);
      stringToUTF8(str, ret, size);
      return ret;
    };
  
  var getCanvasElementSize = (target) => {
      var sp = stackSave();
      var w = stackAlloc(8);
      var h = w + 4;
  
      var targetInt = stringToUTF8OnStack(target.id);
      var ret = _emscripten_get_canvas_element_size(targetInt, w, h);
      var size = [HEAP32[((w)/4)], HEAP32[((h)/4)]];
      stackRestore(sp);
      return size;
    };
  
  
  function _emscripten_set_canvas_element_size(target, width, height) {
    target = bigintToI53Checked(target);
  
  
      var canvas = findCanvasEventTarget(target);
      if (!canvas) return -4;
      canvas.width = width;
      canvas.height = height;
      return 0;
    ;
  }
  
  
  
  var setCanvasElementSize = (target, width, height) => {
      if (!target.controlTransferredOffscreen) {
        target.width = width;
        target.height = height;
      } else {
        // This function is being called from high-level JavaScript code instead of asm.js/Wasm,
        // and it needs to synchronously proxy over to another thread, so marshal the string onto the heap to do the call.
        var sp = stackSave();
        var targetInt = stringToUTF8OnStack(target.id);
        _emscripten_set_canvas_element_size(targetInt, width, height);
        stackRestore(sp);
      }
    };
  
  var currentFullscreenStrategy = 0;
  
  var callCanvasResizedCallback = (strategy) => {
      if (strategy.canvasResizedCallback) {
        ((a1, a2, a3) => getWasmTableEntry(strategy.canvasResizedCallback).call(null, a1, BigInt(a2), BigInt(a3)))(37, 0, strategy.canvasResizedCallbackUserData);
      }
    };
  var registerRestoreOldStyle = (canvas) => {
      var canvasSize = getCanvasElementSize(canvas);
      var oldWidth = canvasSize[0];
      var oldHeight = canvasSize[1];
      var oldCssWidth = canvas.style.width;
      var oldCssHeight = canvas.style.height;
      var oldBackgroundColor = canvas.style.backgroundColor; // Chrome reads color from here.
      var oldDocumentBackgroundColor = document.body.style.backgroundColor; // IE11 reads color from here.
      // Firefox always has black background color.
      var oldPaddingLeft = canvas.style.paddingLeft; // Chrome, FF, Safari
      var oldPaddingRight = canvas.style.paddingRight;
      var oldPaddingTop = canvas.style.paddingTop;
      var oldPaddingBottom = canvas.style.paddingBottom;
      var oldMarginLeft = canvas.style.marginLeft; // IE11
      var oldMarginRight = canvas.style.marginRight;
      var oldMarginTop = canvas.style.marginTop;
      var oldMarginBottom = canvas.style.marginBottom;
      var oldDocumentBodyMargin = document.body.style.margin;
      var oldDocumentOverflow = document.documentElement.style.overflow; // Chrome, Firefox
      var oldDocumentScroll = document.body.scroll; // IE
      var oldImageRendering = canvas.style.imageRendering;
  
      function restoreOldStyle() {
        if (!getFullscreenElement()) {
          document.removeEventListener('fullscreenchange', restoreOldStyle);
  
          setCanvasElementSize(canvas, oldWidth, oldHeight);
  
          canvas.style.width = oldCssWidth;
          canvas.style.height = oldCssHeight;
          canvas.style.backgroundColor = oldBackgroundColor; // Chrome
          // IE11 hack: assigning 'undefined' or an empty string to document.body.style.backgroundColor has no effect, so first assign back the default color
          // before setting the undefined value. Setting undefined value is also important, or otherwise we would later treat that as something that the user
          // had explicitly set so subsequent fullscreen transitions would not set background color properly.
          if (!oldDocumentBackgroundColor) document.body.style.backgroundColor = 'white';
          document.body.style.backgroundColor = oldDocumentBackgroundColor; // IE11
          canvas.style.paddingLeft = oldPaddingLeft; // Chrome, FF, Safari
          canvas.style.paddingRight = oldPaddingRight;
          canvas.style.paddingTop = oldPaddingTop;
          canvas.style.paddingBottom = oldPaddingBottom;
          canvas.style.marginLeft = oldMarginLeft; // IE11
          canvas.style.marginRight = oldMarginRight;
          canvas.style.marginTop = oldMarginTop;
          canvas.style.marginBottom = oldMarginBottom;
          document.body.style.margin = oldDocumentBodyMargin;
          document.documentElement.style.overflow = oldDocumentOverflow; // Chrome, Firefox
          document.body.scroll = oldDocumentScroll; // IE
          canvas.style.imageRendering = oldImageRendering;
          if (canvas.GLctxObject) canvas.GLctxObject.GLctx.viewport(0, 0, oldWidth, oldHeight);
  
          callCanvasResizedCallback(currentFullscreenStrategy);
        }
      }
      document.addEventListener('fullscreenchange', restoreOldStyle);
      return restoreOldStyle;
    };
  
  
  var setLetterbox = (element, topBottom, leftRight) => {
      // Cannot use margin to specify letterboxes in FF or Chrome, since those ignore margins in fullscreen mode.
      element.style.paddingLeft = element.style.paddingRight = leftRight + 'px';
      element.style.paddingTop = element.style.paddingBottom = topBottom + 'px';
    };
  
  
  var getBoundingClientRect = (e) => specialHTMLTargets.indexOf(e) < 0 ? e.getBoundingClientRect() : {'left':0,'top':0};
  var JSEvents_resizeCanvasForFullscreen = (target, strategy) => {
      var restoreOldStyle = registerRestoreOldStyle(target);
      var cssWidth = strategy.softFullscreen ? innerWidth : screen.width;
      var cssHeight = strategy.softFullscreen ? innerHeight : screen.height;
      var rect = getBoundingClientRect(target);
      var windowedCssWidth = rect.width;
      var windowedCssHeight = rect.height;
      var canvasSize = getCanvasElementSize(target);
      var windowedRttWidth = canvasSize[0];
      var windowedRttHeight = canvasSize[1];
  
      if (strategy.scaleMode == 3) {
        setLetterbox(target, (cssHeight - windowedCssHeight) / 2, (cssWidth - windowedCssWidth) / 2);
        cssWidth = windowedCssWidth;
        cssHeight = windowedCssHeight;
      } else if (strategy.scaleMode == 2) {
        if (cssWidth*windowedRttHeight < windowedRttWidth*cssHeight) {
          var desiredCssHeight = windowedRttHeight * cssWidth / windowedRttWidth;
          setLetterbox(target, (cssHeight - desiredCssHeight) / 2, 0);
          cssHeight = desiredCssHeight;
        } else {
          var desiredCssWidth = windowedRttWidth * cssHeight / windowedRttHeight;
          setLetterbox(target, 0, (cssWidth - desiredCssWidth) / 2);
          cssWidth = desiredCssWidth;
        }
      }
  
      // If we are adding padding, must choose a background color or otherwise Chrome will give the
      // padding a default white color. Do it only if user has not customized their own background color.
      target.style.backgroundColor ||= 'black';
      // IE11 does the same, but requires the color to be set in the document body.
      document.body.style.backgroundColor ||= 'black'; // IE11
      // Firefox always shows black letterboxes independent of style color.
  
      target.style.width = cssWidth + 'px';
      target.style.height = cssHeight + 'px';
  
      if (strategy.filteringMode == 1) {
        target.style.imageRendering = 'optimizeSpeed';
        target.style.imageRendering = '-moz-crisp-edges';
        target.style.imageRendering = '-o-crisp-edges';
        target.style.imageRendering = '-webkit-optimize-contrast';
        target.style.imageRendering = 'optimize-contrast';
        target.style.imageRendering = 'crisp-edges';
        target.style.imageRendering = 'pixelated';
      }
  
      var dpiScale = (strategy.canvasResolutionScaleMode == 2) ? devicePixelRatio : 1;
      if (strategy.canvasResolutionScaleMode != 0) {
        var newWidth = (cssWidth * dpiScale)|0;
        var newHeight = (cssHeight * dpiScale)|0;
        setCanvasElementSize(target, newWidth, newHeight);
        if (target.GLctxObject) target.GLctxObject.GLctx.viewport(0, 0, newWidth, newHeight);
      }
      return restoreOldStyle;
    };
  
  var JSEvents_requestFullscreen = (target, strategy) => {
      // EMSCRIPTEN_FULLSCREEN_SCALE_DEFAULT + EMSCRIPTEN_FULLSCREEN_CANVAS_SCALE_NONE is a mode where no extra logic is performed to the DOM elements.
      if (strategy.scaleMode != 0 || strategy.canvasResolutionScaleMode != 0) {
        JSEvents_resizeCanvasForFullscreen(target, strategy);
      }
  
      if (target.requestFullscreen) {
        target.requestFullscreen();
      } else {
        return JSEvents.fullscreenEnabled() ? -3 : -1;
      }
  
      currentFullscreenStrategy = strategy;
      callCanvasResizedCallback(strategy);
      return 0;
    };
  var _emscripten_exit_fullscreen = () => {
      if (!JSEvents.fullscreenEnabled()) return -1;
      // Make sure no queued up calls will fire after this.
      JSEvents.removeDeferredCalls(JSEvents_requestFullscreen);
  
      var d = specialHTMLTargets[1];
      if (d.exitFullscreen) {
        d.fullscreenElement && d.exitFullscreen();
      } else {
        return -1;
      }
  
      return 0;
    };

  
  var requestPointerLock = (target) => {
      if (target.requestPointerLock) {
        target.requestPointerLock();
      } else {
        // document.body is known to accept pointer lock, so use that to differentiate if the user passed a bad element,
        // or if the whole browser just doesn't support the feature.
        if (document.body.requestPointerLock) {
          return -3;
        }
        return -1;
      }
      return 0;
    };
  var _emscripten_exit_pointerlock = () => {
      // Make sure no queued up calls will fire after this.
      JSEvents.removeDeferredCalls(requestPointerLock);
      if (!document.exitPointerLock) return -1;
      document.exitPointerLock();
      return 0;
    };

  
  var _emscripten_force_exit = (status) => {
      __emscripten_runtime_keepalive_clear();
      _exit(status);
    };

  
  
  
  function _emscripten_get_callstack(flags, str, maxbytes) {
    str = bigintToI53Checked(str);
  
  
      var callstack = getCallstack(flags);
      // User can query the required amount of bytes to hold the callstack.
      if (!str || maxbytes <= 0) {
        return lengthBytesUTF8(callstack)+1;
      }
      // Output callstack string as C string to HEAP.
      var bytesWrittenExcludingNull = stringToUTF8(callstack, str, maxbytes);
  
      // Return number of bytes written, including null.
      return bytesWrittenExcludingNull+1;
    ;
  }

  var _emscripten_get_device_pixel_ratio = () => {
      return globalThis.devicePixelRatio ?? 1.0;
    };

  
  
  
  function _emscripten_get_element_css_size(target, width, height) {
    target = bigintToI53Checked(target);
    width = bigintToI53Checked(width);
    height = bigintToI53Checked(height);
  
  
      target = findEventTarget(target);
      if (!target) return -4;
  
      var rect = getBoundingClientRect(target);
      HEAPF64[((width)/8)] = rect.width;
      HEAPF64[((height)/8)] = rect.height;
  
      return 0;
    ;
  }

  
  
  
  
  var fillGamepadEventData = (eventStruct, e) => {
      HEAPF64[((eventStruct)/8)] = e.timestamp;
      for (var i = 0; i < e.axes.length; ++i) {
        HEAPF64[(((eventStruct+i*8)+(16))/8)] = e.axes[i];
      }
      for (var i = 0; i < e.buttons.length; ++i) {
        HEAP8[(eventStruct+i)+(1040)] = e.buttons[i].pressed;
        HEAPF64[(((eventStruct+i*8)+(528))/8)] = e.buttons[i].value;
      }
      HEAP8[(eventStruct)+(1104)] = e.connected;
      HEAP32[(((eventStruct)+(1108))/4)] = e.index;
      HEAP32[(((eventStruct)+(8))/4)] = e.axes.length;
      HEAP32[(((eventStruct)+(12))/4)] = e.buttons.length;
      stringToUTF8(e.id, eventStruct + 1112, 64);
      stringToUTF8(e.mapping, eventStruct + 1176, 64);
    };
  
  function _emscripten_get_gamepad_status(index, gamepadState) {
    gamepadState = bigintToI53Checked(gamepadState);
  
  
      // INVALID_PARAM is returned on a Gamepad index that never was there.
      if (index < 0 || index >= JSEvents.lastGamepadState.length) return -5;
  
      // NO_DATA is returned on a Gamepad index that was removed.
      // For previously disconnected gamepads there should be an empty slot (null/undefined/false) at the index.
      // This is because gamepads must keep their original position in the array.
      // For example, removing the first of two gamepads produces [null/undefined/false, gamepad].
      if (!JSEvents.lastGamepadState[index]) return -7;
  
      fillGamepadEventData(gamepadState, JSEvents.lastGamepadState[index]);
      return 0;
    ;
  }

  var getHeapMax = () =>
      2147483648;
  
  var _emscripten_get_heap_max = () => BigInt(getHeapMax());;


  var _emscripten_get_num_gamepads = () => {
      // N.B. Do not call emscripten_get_num_gamepads() unless having first called emscripten_sample_gamepad_data(), and that has returned EMSCRIPTEN_RESULT_SUCCESS.
      // Otherwise the following line will throw an exception.
      return JSEvents.lastGamepadState.length;
    };

  
  
  function _emscripten_get_screen_size(width, height) {
    width = bigintToI53Checked(width);
    height = bigintToI53Checked(height);
  
  
      HEAP32[((width)/4)] = screen.width;
      HEAP32[((height)/4)] = screen.height;
    ;
  }

  var _emscripten_glActiveTexture = (x0) => GLctx.activeTexture(x0);

  var _emscripten_glAttachShader = (program, shader) => {
      GLctx.attachShader(GL.programs[program], GL.shaders[shader]);
    };

  var _emscripten_glBeginQuery = (target, id) => {
      GLctx.beginQuery(target, GL.queries[id]);
    };

  var _emscripten_glBeginQueryEXT = (target, id) => {
      GLctx.disjointTimerQueryExt['beginQueryEXT'](target, GL.queries[id]);
    };

  var _emscripten_glBeginTransformFeedback = (x0) => GLctx.beginTransformFeedback(x0);

  
  
  function _emscripten_glBindAttribLocation(program, index, name) {
    name = bigintToI53Checked(name);
  
  
      GLctx.bindAttribLocation(GL.programs[program], index, UTF8ToString(name));
    ;
  }

  var _emscripten_glBindBuffer = (target, buffer) => {
  
      if (target == 0x88EB /*GL_PIXEL_PACK_BUFFER*/) {
        // In WebGL 2 glReadPixels entry point, we need to use a different WebGL 2
        // API function call when a buffer is bound to
        // GL_PIXEL_PACK_BUFFER_BINDING point, so must keep track whether that
        // binding point is non-null to know what is the proper API function to
        // call.
        GLctx.currentPixelPackBufferBinding = buffer;
      } else if (target == 0x88EC /*GL_PIXEL_UNPACK_BUFFER*/) {
        // In WebGL 2 gl(Compressed)Tex(Sub)Image[23]D entry points, we need to
        // use a different WebGL 2 API function call when a buffer is bound to
        // GL_PIXEL_UNPACK_BUFFER_BINDING point, so must keep track whether that
        // binding point is non-null to know what is the proper API function to
        // call.
        GLctx.currentPixelUnpackBufferBinding = buffer;
      }
      GLctx.bindBuffer(target, GL.buffers[buffer]);
    };

  var _emscripten_glBindBufferBase = (target, index, buffer) => {
      GLctx.bindBufferBase(target, index, GL.buffers[buffer]);
    };

  function _emscripten_glBindBufferRange(target, index, buffer, offset, ptrsize) {
    offset = bigintToI53Checked(offset);
    ptrsize = bigintToI53Checked(ptrsize);
  
  
      GLctx.bindBufferRange(target, index, GL.buffers[buffer], offset, ptrsize);
    ;
  }

  var _emscripten_glBindFramebuffer = (target, framebuffer) => {
  
      GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer]);
  
    };

  var _emscripten_glBindRenderbuffer = (target, renderbuffer) => {
      GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer]);
    };

  var _emscripten_glBindSampler = (unit, sampler) => {
      GLctx.bindSampler(unit, GL.samplers[sampler]);
    };

  var _emscripten_glBindTexture = (target, texture) => {
      GLctx.bindTexture(target, GL.textures[texture]);
    };

  var _emscripten_glBindTransformFeedback = (target, id) => {
      GLctx.bindTransformFeedback(target, GL.transformFeedbacks[id]);
    };

  var _emscripten_glBindVertexArray = (vao) => {
      GLctx.bindVertexArray(GL.vaos[vao]);
    };

  
  var _glBindVertexArray = _emscripten_glBindVertexArray;
  var _emscripten_glBindVertexArrayOES = _glBindVertexArray;

  var _emscripten_glBlendColor = (x0, x1, x2, x3) => GLctx.blendColor(x0, x1, x2, x3);

  var _emscripten_glBlendEquation = (x0) => GLctx.blendEquation(x0);

  var _emscripten_glBlendEquationSeparate = (x0, x1) => GLctx.blendEquationSeparate(x0, x1);

  var _emscripten_glBlendFunc = (x0, x1) => GLctx.blendFunc(x0, x1);

  var _emscripten_glBlendFuncSeparate = (x0, x1, x2, x3) => GLctx.blendFuncSeparate(x0, x1, x2, x3);

  var _emscripten_glBlitFramebuffer = (x0, x1, x2, x3, x4, x5, x6, x7, x8, x9) => GLctx.blitFramebuffer(x0, x1, x2, x3, x4, x5, x6, x7, x8, x9);

  
  
  function _emscripten_glBufferData(target, size, data, usage) {
    size = bigintToI53Checked(size);
    data = bigintToI53Checked(data);
  
  
  
      if (true) {
        // If size is zero, WebGL would interpret uploading the whole input
        // arraybuffer (starting from given offset), which would not make sense in
        // WebAssembly, so avoid uploading if size is zero. However we must still
        // call bufferData to establish a backing storage of zero bytes.
        if (data && size) {
          GLctx.bufferData(target, HEAPU8, usage, data, size);
        } else {
          GLctx.bufferData(target, size, usage);
        }
        return;
      }
    ;
  }

  
  var webglBufferSubData = (target, offset, size, data, src = HEAPU8) => {
      if (true) {
        size && GLctx.bufferSubData(target, offset, src, data, size);
        return;
      }
    };
  
  
  function _emscripten_glBufferSubData(target, offset, size, data) {
    offset = bigintToI53Checked(offset);
    size = bigintToI53Checked(size);
    data = bigintToI53Checked(data);
  
  return webglBufferSubData(target, offset, size, data);
  }

  var _emscripten_glCheckFramebufferStatus = (x0) => GLctx.checkFramebufferStatus(x0);

  var _emscripten_glClear = (x0) => GLctx.clear(x0);

  var _emscripten_glClearBufferfi = (x0, x1, x2, x3) => GLctx.clearBufferfi(x0, x1, x2, x3);

  
  /** @type {!Float32Array} */
  var HEAPF32;
  function _emscripten_glClearBufferfv(buffer, drawbuffer, value) {
    value = bigintToI53Checked(value);
  
  
  
      GLctx.clearBufferfv(buffer, drawbuffer, HEAPF32, ((value)/4));
    ;
  }

  
  function _emscripten_glClearBufferiv(buffer, drawbuffer, value) {
    value = bigintToI53Checked(value);
  
  
  
      GLctx.clearBufferiv(buffer, drawbuffer, HEAP32, ((value)/4));
    ;
  }

  
  function _emscripten_glClearBufferuiv(buffer, drawbuffer, value) {
    value = bigintToI53Checked(value);
  
  
  
      GLctx.clearBufferuiv(buffer, drawbuffer, HEAPU32, ((value)/4));
    ;
  }

  var _emscripten_glClearColor = (x0, x1, x2, x3) => GLctx.clearColor(x0, x1, x2, x3);

  var _emscripten_glClearDepthf = (x0) => GLctx.clearDepth(x0);

  var _emscripten_glClearStencil = (x0) => GLctx.clearStencil(x0);

  function _emscripten_glClientWaitSync(sync, flags, timeout) {
    sync = bigintToI53Checked(sync);
  
  
      // WebGL2 vs GLES3 differences: in GLES3, the timeout parameter is a uint64, where 0xFFFFFFFFFFFFFFFFULL means GL_TIMEOUT_IGNORED.
      // In JS, there's no 64-bit value types, so instead timeout is taken to be signed, and GL_TIMEOUT_IGNORED is given value -1.
      // Inherently the value accepted in the timeout is lossy, and can't take in arbitrary u64 bit pattern (but most likely doesn't matter)
      // See https://www.khronos.org/registry/webgl/specs/latest/2.0/#5.15
      timeout = Number(timeout);
      return GLctx.clientWaitSync(GL.syncs[sync], flags, timeout);
    ;
  }

  var _emscripten_glClipControlEXT = (origin, depth) => {
      GLctx.extClipControl['clipControlEXT'](origin, depth);
    };

  var _emscripten_glColorMask = (red, green, blue, alpha) => {
      GLctx.colorMask(!!red, !!green, !!blue, !!alpha);
    };

  var _emscripten_glCompileShader = (shader) => {
      GLctx.compileShader(GL.shaders[shader]);
    };

  
  
  function _emscripten_glCompressedTexImage2D(target, level, internalFormat, width, height, border, imageSize, data) {
    data = bigintToI53Checked(data);
  
  
      // `data` may be null here, which means "allocate uninitialized space but
      // don't upload" in GLES parlance, but `compressedTexImage2D` requires the
      // final data parameter, so we simply pass a heap view starting at zero
      // effectively uploading whatever happens to be near address zero.  See
      // https://github.com/emscripten-core/emscripten/issues/19300.
      if (true) {
        if (GLctx.currentPixelUnpackBufferBinding || !imageSize) {
          GLctx.compressedTexImage2D(target, level, internalFormat, width, height, border, imageSize, data);
          return;
        }
        GLctx.compressedTexImage2D(target, level, internalFormat, width, height, border, HEAPU8, data, imageSize);
        return;
      }
    ;
  }

  
  function _emscripten_glCompressedTexImage3D(target, level, internalFormat, width, height, depth, border, imageSize, data) {
    data = bigintToI53Checked(data);
  
  
      if (GLctx.currentPixelUnpackBufferBinding) {
        GLctx.compressedTexImage3D(target, level, internalFormat, width, height, depth, border, imageSize, data);
      } else {
        GLctx.compressedTexImage3D(target, level, internalFormat, width, height, depth, border, HEAPU8, data, imageSize);
      }
    ;
  }

  
  
  function _emscripten_glCompressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, imageSize, data) {
    data = bigintToI53Checked(data);
  
  
      if (true) {
        if (GLctx.currentPixelUnpackBufferBinding || !imageSize) {
          GLctx.compressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, imageSize, data);
          return;
        }
        GLctx.compressedTexSubImage2D(target, level, xoffset, yoffset, width, height, format, HEAPU8, data, imageSize);
        return;
      }
    ;
  }

  
  function _emscripten_glCompressedTexSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, imageSize, data) {
    data = bigintToI53Checked(data);
  
  
      if (GLctx.currentPixelUnpackBufferBinding) {
        GLctx.compressedTexSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, imageSize, data);
      } else {
        GLctx.compressedTexSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, HEAPU8, data, imageSize);
      }
    ;
  }

  function _emscripten_glCopyBufferSubData(x0, x1, x2, x3, x4) {
    x2 = bigintToI53Checked(x2);
    x3 = bigintToI53Checked(x3);
    x4 = bigintToI53Checked(x4);
  
  return GLctx.copyBufferSubData(x0, x1, x2, x3, x4);
  }

  var _emscripten_glCopyTexImage2D = (x0, x1, x2, x3, x4, x5, x6, x7) => GLctx.copyTexImage2D(x0, x1, x2, x3, x4, x5, x6, x7);

  var _emscripten_glCopyTexSubImage2D = (x0, x1, x2, x3, x4, x5, x6, x7) => GLctx.copyTexSubImage2D(x0, x1, x2, x3, x4, x5, x6, x7);

  var _emscripten_glCopyTexSubImage3D = (x0, x1, x2, x3, x4, x5, x6, x7, x8) => GLctx.copyTexSubImage3D(x0, x1, x2, x3, x4, x5, x6, x7, x8);

  var _emscripten_glCreateProgram = () => {
      var id = GL.getNewId(GL.programs);
      var program = GLctx.createProgram();
      // Store additional information needed for each shader program:
      program.name = id;
      // Lazy cache results of
      // glGetProgramiv(GL_ACTIVE_UNIFORM_MAX_LENGTH/GL_ACTIVE_ATTRIBUTE_MAX_LENGTH/GL_ACTIVE_UNIFORM_BLOCK_MAX_NAME_LENGTH)
      program.maxUniformLength = program.maxAttributeLength = program.maxUniformBlockNameLength = 0;
      program.uniformIdCounter = 1;
      GL.programs[id] = program;
      return id;
    };

  var _emscripten_glCreateShader = (shaderType) => {
      var id = GL.getNewId(GL.shaders);
      GL.shaders[id] = GLctx.createShader(shaderType);
  
      return id;
    };

  var _emscripten_glCullFace = (x0) => GLctx.cullFace(x0);

  
  
  function _emscripten_glDeleteBuffers(n, buffers) {
    buffers = bigintToI53Checked(buffers);
  
  
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((buffers)+(i*4))/4)];
        var buffer = GL.buffers[id];
  
        // From spec: "glDeleteBuffers silently ignores 0's and names that do not
        // correspond to existing buffer objects."
        if (!buffer) continue;
  
        GLctx.deleteBuffer(buffer);
        buffer.name = 0;
        GL.buffers[id] = null;
  
        if (id == GLctx.currentPixelPackBufferBinding) GLctx.currentPixelPackBufferBinding = 0;
        if (id == GLctx.currentPixelUnpackBufferBinding) GLctx.currentPixelUnpackBufferBinding = 0;
      }
    ;
  }

  
  
  function _emscripten_glDeleteFramebuffers(n, framebuffers) {
    framebuffers = bigintToI53Checked(framebuffers);
  
  
      for (var i = 0; i < n; ++i) {
        var id = HEAP32[(((framebuffers)+(i*4))/4)];
        var framebuffer = GL.framebuffers[id];
        if (!framebuffer) continue; // GL spec: "glDeleteFramebuffers silently ignores 0s and names that do not correspond to existing framebuffer objects".
        GLctx.deleteFramebuffer(framebuffer);
        framebuffer.name = 0;
        GL.framebuffers[id] = null;
      }
    ;
  }

  var _emscripten_glDeleteProgram = (id) => {
      if (!id) return;
      var program = GL.programs[id];
      if (!program) {
        // glDeleteProgram actually signals an error when deleting a nonexisting
        // object, unlike some other GL delete functions.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      GLctx.deleteProgram(program);
      program.name = 0;
      GL.programs[id] = null;
    };

  
  function _emscripten_glDeleteQueries(n, ids) {
    ids = bigintToI53Checked(ids);
  
  
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((ids)+(i*4))/4)];
        var query = GL.queries[id];
        if (!query) continue; // GL spec: "unused names in ids are ignored, as is the name zero."
        GLctx.deleteQuery(query);
        GL.queries[id] = null;
      }
    ;
  }

  
  
  function _emscripten_glDeleteQueriesEXT(n, ids) {
    ids = bigintToI53Checked(ids);
  
  
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((ids)+(i*4))/4)];
        var query = GL.queries[id];
        if (!query) continue; // GL spec: "unused names in ids are ignored, as is the name zero."
        GLctx.disjointTimerQueryExt['deleteQueryEXT'](query);
        GL.queries[id] = null;
      }
    ;
  }

  
  
  function _emscripten_glDeleteRenderbuffers(n, renderbuffers) {
    renderbuffers = bigintToI53Checked(renderbuffers);
  
  
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((renderbuffers)+(i*4))/4)];
        var renderbuffer = GL.renderbuffers[id];
        if (!renderbuffer) continue; // GL spec: "glDeleteRenderbuffers silently ignores 0s and names that do not correspond to existing renderbuffer objects".
        GLctx.deleteRenderbuffer(renderbuffer);
        renderbuffer.name = 0;
        GL.renderbuffers[id] = null;
      }
    ;
  }

  
  function _emscripten_glDeleteSamplers(n, samplers) {
    samplers = bigintToI53Checked(samplers);
  
  
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((samplers)+(i*4))/4)];
        var sampler = GL.samplers[id];
        if (!sampler) continue;
        GLctx.deleteSampler(sampler);
        sampler.name = 0;
        GL.samplers[id] = null;
      }
    ;
  }

  var _emscripten_glDeleteShader = (id) => {
      if (!id) return;
      var shader = GL.shaders[id];
      if (!shader) {
        // glDeleteShader actually signals an error when deleting a nonexisting
        // object, unlike some other GL delete functions.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      GLctx.deleteShader(shader);
      GL.shaders[id] = null;
    };

  function _emscripten_glDeleteSync(id) {
    id = bigintToI53Checked(id);
  
  
      if (!id) return;
      var sync = GL.syncs[id];
      if (!sync) { // glDeleteSync signals an error when deleting a nonexisting object, unlike some other GL delete functions.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      GLctx.deleteSync(sync);
      sync.name = 0;
      GL.syncs[id] = null;
    ;
  }

  
  
  function _emscripten_glDeleteTextures(n, textures) {
    textures = bigintToI53Checked(textures);
  
  
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((textures)+(i*4))/4)];
        var texture = GL.textures[id];
        // GL spec: "glDeleteTextures silently ignores 0s and names that do not
        // correspond to existing textures".
        if (!texture) continue;
        GLctx.deleteTexture(texture);
        texture.name = 0;
        GL.textures[id] = null;
      }
    ;
  }

  
  function _emscripten_glDeleteTransformFeedbacks(n, ids) {
    ids = bigintToI53Checked(ids);
  
  
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((ids)+(i*4))/4)];
        var transformFeedback = GL.transformFeedbacks[id];
        if (!transformFeedback) continue; // GL spec: "unused names in ids are ignored, as is the name zero."
        GLctx.deleteTransformFeedback(transformFeedback);
        transformFeedback.name = 0;
        GL.transformFeedbacks[id] = null;
      }
    ;
  }

  
  
  function _emscripten_glDeleteVertexArrays(n, vaos) {
    vaos = bigintToI53Checked(vaos);
  
  
      for (var i = 0; i < n; i++) {
        var id = HEAP32[(((vaos)+(i*4))/4)];
        GLctx.deleteVertexArray(GL.vaos[id]);
        GL.vaos[id] = null;
      }
    ;
  }

  
  var _glDeleteVertexArrays = _emscripten_glDeleteVertexArrays;
  var _emscripten_glDeleteVertexArraysOES = _glDeleteVertexArrays;

  var _emscripten_glDepthFunc = (x0) => GLctx.depthFunc(x0);

  var _emscripten_glDepthMask = (flag) => {
      GLctx.depthMask(!!flag);
    };

  var _emscripten_glDepthRangef = (x0, x1) => GLctx.depthRange(x0, x1);

  var _emscripten_glDetachShader = (program, shader) => {
      GLctx.detachShader(GL.programs[program], GL.shaders[shader]);
    };

  var _emscripten_glDisable = (x0) => GLctx.disable(x0);

  var _emscripten_glDisableVertexAttribArray = (index) => {
      GLctx.disableVertexAttribArray(index);
    };

  var _emscripten_glDrawArrays = (mode, first, count) => {
  
      GLctx.drawArrays(mode, first, count);
  
    };

  var _emscripten_glDrawArraysInstanced = (mode, first, count, primcount) => {
      GLctx.drawArraysInstanced(mode, first, count, primcount);
    };

  
  var _glDrawArraysInstanced = _emscripten_glDrawArraysInstanced;
  var _emscripten_glDrawArraysInstancedANGLE = _glDrawArraysInstanced;

  
  var _emscripten_glDrawArraysInstancedARB = _glDrawArraysInstanced;

  
  var _emscripten_glDrawArraysInstancedEXT = _glDrawArraysInstanced;

  
  var _emscripten_glDrawArraysInstancedNV = _glDrawArraysInstanced;

  var tempFixedLengthArray = [];
  
  
  
  function _emscripten_glDrawBuffers(n, bufs) {
    bufs = bigintToI53Checked(bufs);
  
  
  
      var bufArray = tempFixedLengthArray[n];
      for (var i = 0; i < n; i++) {
        bufArray[i] = HEAP32[(((bufs)+(i*4))/4)];
      }
  
      GLctx.drawBuffers(bufArray);
    ;
  }

  
  var _glDrawBuffers = _emscripten_glDrawBuffers;
  var _emscripten_glDrawBuffersEXT = _glDrawBuffers;

  
  var _emscripten_glDrawBuffersWEBGL = _glDrawBuffers;

  
  
  function _emscripten_glDrawElements(mode, count, type, indices) {
    indices = bigintToI53Checked(indices);
  
  
  
      GLctx.drawElements(mode, count, type, indices);
  
    ;
  }

  
  function _emscripten_glDrawElementsInstanced(mode, count, type, indices, primcount) {
    indices = bigintToI53Checked(indices);
  
  
      GLctx.drawElementsInstanced(mode, count, type, indices, primcount);
    ;
  }

  
  var _glDrawElementsInstanced = _emscripten_glDrawElementsInstanced;
  var _emscripten_glDrawElementsInstancedANGLE = _glDrawElementsInstanced;

  
  var _emscripten_glDrawElementsInstancedARB = _glDrawElementsInstanced;

  
  var _emscripten_glDrawElementsInstancedEXT = _glDrawElementsInstanced;

  
  var _emscripten_glDrawElementsInstancedNV = _glDrawElementsInstanced;

  var _glDrawElements = _emscripten_glDrawElements;
  
  function _emscripten_glDrawRangeElements(mode, start, end, count, type, indices) {
    indices = bigintToI53Checked(indices);
  
  
      // TODO: This should be a trivial pass-through function registered at the bottom of this page as
      // glFuncs[6][1] += ' drawRangeElements';
      // but due to https://bugzil.la/1202427,
      // we work around by ignoring the range.
      _glDrawElements(mode, count, type, indices);
    ;
  }

  var _emscripten_glEnable = (x0) => GLctx.enable(x0);

  var _emscripten_glEnableVertexAttribArray = (index) => {
      GLctx.enableVertexAttribArray(index);
    };

  var _emscripten_glEndQuery = (x0) => GLctx.endQuery(x0);

  var _emscripten_glEndQueryEXT = (target) => {
      GLctx.disjointTimerQueryExt['endQueryEXT'](target);
    };

  var _emscripten_glEndTransformFeedback = () => GLctx.endTransformFeedback();

  var _emscripten_glFenceSync = function(condition, flags) {
  
  var ret = (() => { 
      var sync = GLctx.fenceSync(condition, flags);
      if (sync) {
        var id = GL.getNewId(GL.syncs);
        sync.name = id;
        GL.syncs[id] = sync;
        return id;
      }
      return 0; // Failed to create a sync object
     })();
  return BigInt(ret);
  };

  var _emscripten_glFinish = () => GLctx.finish();

  var _emscripten_glFlush = () => GLctx.flush();

  var _emscripten_glFramebufferRenderbuffer = (target, attachment, renderbuffertarget, renderbuffer) => {
      GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget,
                                         GL.renderbuffers[renderbuffer]);
    };

  var _emscripten_glFramebufferTexture2D = (target, attachment, textarget, texture, level) => {
      GLctx.framebufferTexture2D(target, attachment, textarget,
                                      GL.textures[texture], level);
    };

  var _emscripten_glFramebufferTextureLayer = (target, attachment, texture, level, layer) => {
      GLctx.framebufferTextureLayer(target, attachment, GL.textures[texture], level, layer);
    };

  var _emscripten_glFrontFace = (x0) => GLctx.frontFace(x0);

  
  function _emscripten_glGenBuffers(n, buffers) {
    buffers = bigintToI53Checked(buffers);
  
  
      GL.genObject(n, buffers, 'createBuffer', GL.buffers
        );
    ;
  }

  
  function _emscripten_glGenFramebuffers(n, ids) {
    ids = bigintToI53Checked(ids);
  
  
      GL.genObject(n, ids, 'createFramebuffer', GL.framebuffers
        );
    ;
  }

  function _emscripten_glGenQueries(n, ids) {
    ids = bigintToI53Checked(ids);
  
  
      GL.genObject(n, ids, 'createQuery', GL.queries
        );
    ;
  }

  
  
  function _emscripten_glGenQueriesEXT(n, ids) {
    ids = bigintToI53Checked(ids);
  
  
      for (var i = 0; i < n; i++) {
        var query = GLctx.disjointTimerQueryExt['createQueryEXT']();
        if (!query) {
          GL.recordError(0x502 /* GL_INVALID_OPERATION */);
          while (i < n) HEAP32[(((ids)+(i++*4))/4)] = 0;
          return;
        }
        var id = GL.getNewId(GL.queries);
        query.name = id;
        GL.queries[id] = query;
        HEAP32[(((ids)+(i*4))/4)] = id;
      }
    ;
  }

  
  function _emscripten_glGenRenderbuffers(n, renderbuffers) {
    renderbuffers = bigintToI53Checked(renderbuffers);
  
  
      GL.genObject(n, renderbuffers, 'createRenderbuffer', GL.renderbuffers
        );
    ;
  }

  function _emscripten_glGenSamplers(n, samplers) {
    samplers = bigintToI53Checked(samplers);
  
  
      GL.genObject(n, samplers, 'createSampler', GL.samplers
        );
    ;
  }

  
  function _emscripten_glGenTextures(n, textures) {
    textures = bigintToI53Checked(textures);
  
  
      GL.genObject(n, textures, 'createTexture', GL.textures
        );
    ;
  }

  function _emscripten_glGenTransformFeedbacks(n, ids) {
    ids = bigintToI53Checked(ids);
  
  
      GL.genObject(n, ids, 'createTransformFeedback', GL.transformFeedbacks
        );
    ;
  }

  
  function _emscripten_glGenVertexArrays(n, arrays) {
    arrays = bigintToI53Checked(arrays);
  
  
      GL.genObject(n, arrays, 'createVertexArray', GL.vaos
        );
    ;
  }

  
  var _glGenVertexArrays = _emscripten_glGenVertexArrays;
  var _emscripten_glGenVertexArraysOES = _glGenVertexArrays;

  var _emscripten_glGenerateMipmap = (x0) => GLctx.generateMipmap(x0);

  
  
  var __glGetActiveAttribOrUniform = (funcName, program, index, bufSize, length, size, type, name) => {
      program = GL.programs[program];
      var info = GLctx[funcName](program, index);
      if (info) {
        // If an error occurs, nothing will be written to length, size and type and name.
        var numBytesWrittenExclNull = name && stringToUTF8(info.name, name, bufSize);
        if (length) HEAP32[((length)/4)] = numBytesWrittenExclNull;
        if (size) HEAP32[((size)/4)] = info.size;
        if (type) HEAP32[((type)/4)] = info.type;
      }
    };
  
  
  function _emscripten_glGetActiveAttrib(program, index, bufSize, length, size, type, name) {
    length = bigintToI53Checked(length);
    size = bigintToI53Checked(size);
    type = bigintToI53Checked(type);
    name = bigintToI53Checked(name);
  
  return __glGetActiveAttribOrUniform('getActiveAttrib', program, index, bufSize, length, size, type, name);
  }

  
  
  function _emscripten_glGetActiveUniform(program, index, bufSize, length, size, type, name) {
    length = bigintToI53Checked(length);
    size = bigintToI53Checked(size);
    type = bigintToI53Checked(type);
    name = bigintToI53Checked(name);
  
  return __glGetActiveAttribOrUniform('getActiveUniform', program, index, bufSize, length, size, type, name);
  }

  
  function _emscripten_glGetActiveUniformBlockName(program, uniformBlockIndex, bufSize, length, uniformBlockName) {
    length = bigintToI53Checked(length);
    uniformBlockName = bigintToI53Checked(uniformBlockName);
  
  
      program = GL.programs[program];
  
      var result = GLctx.getActiveUniformBlockName(program, uniformBlockIndex);
      if (!result) return; // If an error occurs, nothing will be written to uniformBlockName or length.
      if (uniformBlockName && bufSize > 0) {
        var numBytesWrittenExclNull = stringToUTF8(result, uniformBlockName, bufSize);
        if (length) HEAP32[((length)/4)] = numBytesWrittenExclNull;
      } else {
        if (length) HEAP32[((length)/4)] = 0;
      }
    ;
  }

  
  function _emscripten_glGetActiveUniformBlockiv(program, uniformBlockIndex, pname, params) {
    params = bigintToI53Checked(params);
  
  
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if params == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      program = GL.programs[program];
  
      if (pname == 0x8A41 /* GL_UNIFORM_BLOCK_NAME_LENGTH */) {
        var name = GLctx.getActiveUniformBlockName(program, uniformBlockIndex);
        HEAP32[((params)/4)] = name.length+1;
        return;
      }
  
      var result = GLctx.getActiveUniformBlockParameter(program, uniformBlockIndex, pname);
      if (result === null) return; // If an error occurs, nothing should be written to params.
      if (pname == 0x8A43 /*GL_UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES*/) {
        for (var i = 0; i < result.length; i++) {
          HEAP32[(((params)+(i*4))/4)] = result[i];
        }
      } else {
        HEAP32[((params)/4)] = result;
      }
    ;
  }

  
  function _emscripten_glGetActiveUniformsiv(program, uniformCount, uniformIndices, pname, params) {
    uniformIndices = bigintToI53Checked(uniformIndices);
    params = bigintToI53Checked(params);
  
  
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if params == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      if (uniformCount > 0 && uniformIndices == 0) {
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      program = GL.programs[program];
      var ids = [];
      for (var i = 0; i < uniformCount; i++) {
        ids.push(HEAP32[(((uniformIndices)+(i*4))/4)]);
      }
  
      var result = GLctx.getActiveUniforms(program, ids, pname);
      if (!result) return; // GL spec: If an error is generated, nothing is written out to params.
  
      var len = result.length;
      for (var i = 0; i < len; i++) {
        HEAP32[(((params)+(i*4))/4)] = result[i];
      }
    ;
  }

  
  
  function _emscripten_glGetAttachedShaders(program, maxCount, count, shaders) {
    count = bigintToI53Checked(count);
    shaders = bigintToI53Checked(shaders);
  
  
      var result = GLctx.getAttachedShaders(GL.programs[program]);
      var len = result.length;
      if (len > maxCount) {
        len = maxCount;
      }
      HEAP32[((count)/4)] = len;
      for (var i = 0; i < len; ++i) {
        var id = GL.shaders.indexOf(result[i]);
        HEAP32[(((shaders)+(i*4))/4)] = id;
      }
    ;
  }

  
  
  function _emscripten_glGetAttribLocation(program, name) {
    name = bigintToI53Checked(name);
  
  return GLctx.getAttribLocation(GL.programs[program], UTF8ToString(name));
  }

  var writeI53ToI64 = (ptr, num) => {
      HEAPU32[((ptr)/4)] = num;
      var lower = HEAPU32[((ptr)/4)];
      HEAPU32[(((ptr)+(4))/4)] = (num - lower)/4294967296;
    };
  
  
  var webglGetExtensions = () => {
      var exts = getEmscriptenSupportedExtensions(GLctx);
      exts = exts.concat(exts.map((e) => 'GL_' + e));
      return exts;
    };
  
  
  
  
  var emscriptenWebGLGet = (name_, p, type) => {
      // Guard against user passing a null pointer.
      // Note that GLES2 spec does not say anything about how passing a null
      // pointer should be treated.  Testing on desktop core GL 3, the application
      // crashes on glGetIntegerv to a null pointer, but better to report an error
      // instead of doing anything random.
      if (!p) {
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      var ret = undefined;
      switch (name_) { // Handle a few trivial GLES values
        case 0x8DFA: // GL_SHADER_COMPILER
          ret = 1;
          break;
        case 0x8DF8: // GL_SHADER_BINARY_FORMATS
          if (type != 0 && type != 1) {
            GL.recordError(0x500); // GL_INVALID_ENUM
          }
          // Do not write anything to the out pointer, since no binary formats are
          // supported.
          return;
        case 0x87FE: // GL_NUM_PROGRAM_BINARY_FORMATS
        case 0x8DF9: // GL_NUM_SHADER_BINARY_FORMATS
          ret = 0;
          break;
        case 0x86A2: // GL_NUM_COMPRESSED_TEXTURE_FORMATS
          // WebGL doesn't have GL_NUM_COMPRESSED_TEXTURE_FORMATS (it's obsolete
          // since GL_COMPRESSED_TEXTURE_FORMATS returns a JS array that can be
          // queried for length), so implement it ourselves to allow C++ GLES2
          // code to get the length.
          var formats = GLctx.getParameter(0x86A3 /*GL_COMPRESSED_TEXTURE_FORMATS*/);
          ret = formats ? formats.length : 0;
          break;
  
        case 0x821D: // GL_NUM_EXTENSIONS
          if (GL.currentContext.version < 2) {
            // Calling GLES3/WebGL2 function with a GLES2/WebGL1 context
            GL.recordError(0x502 /* GL_INVALID_OPERATION */);
            return;
          }
          ret = webglGetExtensions().length;
          break;
        case 0x821B: // GL_MAJOR_VERSION
        case 0x821C: // GL_MINOR_VERSION
          if (GL.currentContext.version < 2) {
            GL.recordError(0x500); // GL_INVALID_ENUM
            return;
          }
          ret = name_ == 0x821B ? 3 : 0; // return version 3.0
          break;
      }
  
      if (ret === undefined) {
        var result = GLctx.getParameter(name_);
        switch (typeof result) {
          case 'number':
            ret = result;
            break;
          case 'boolean':
            ret = result ? 1 : 0;
            break;
          case 'string':
            GL.recordError(0x500); // GL_INVALID_ENUM
            return;
          case 'object':
            if (result === null) {
              // null is a valid result for some (e.g., which buffer is bound -
              // perhaps nothing is bound), but otherwise can mean an invalid
              // name_, which we need to report as an error
              switch (name_) {
                case 0x8894: // ARRAY_BUFFER_BINDING
                case 0x8B8D: // CURRENT_PROGRAM
                case 0x8895: // ELEMENT_ARRAY_BUFFER_BINDING
                case 0x8CA6: // FRAMEBUFFER_BINDING or DRAW_FRAMEBUFFER_BINDING
                case 0x8CA7: // RENDERBUFFER_BINDING
                case 0x8069: // TEXTURE_BINDING_2D
                case 0x85B5: // WebGL 2 GL_VERTEX_ARRAY_BINDING, or WebGL 1 extension OES_vertex_array_object GL_VERTEX_ARRAY_BINDING_OES
                case 0x8F36: // COPY_READ_BUFFER_BINDING or COPY_READ_BUFFER
                case 0x8F37: // COPY_WRITE_BUFFER_BINDING or COPY_WRITE_BUFFER
                case 0x88ED: // PIXEL_PACK_BUFFER_BINDING
                case 0x88EF: // PIXEL_UNPACK_BUFFER_BINDING
                case 0x8CAA: // READ_FRAMEBUFFER_BINDING
                case 0x8919: // SAMPLER_BINDING
                case 0x8C1D: // TEXTURE_BINDING_2D_ARRAY
                case 0x806A: // TEXTURE_BINDING_3D
                case 0x8E25: // TRANSFORM_FEEDBACK_BINDING
                case 0x8C8F: // TRANSFORM_FEEDBACK_BUFFER_BINDING
                case 0x8A28: // UNIFORM_BUFFER_BINDING
                case 0x8514: { // TEXTURE_BINDING_CUBE_MAP
                  ret = 0;
                  break;
                }
                default: {
                  GL.recordError(0x500); // GL_INVALID_ENUM
                  return;
                }
              }
            } else if (result instanceof Float32Array ||
                       result instanceof Uint32Array ||
                       result instanceof Int32Array ||
                       result instanceof Array) {
              for (var i = 0; i < result.length; ++i) {
                switch (type) {
                  case 0: HEAP32[(((p)+(i*4))/4)] = result[i]; break;
                  case 2: HEAPF32[(((p)+(i*4))/4)] = result[i]; break;
                  case 4: HEAP8[(p)+(i)] = result[i] ? 1 : 0; break;
                }
              }
              return;
            } else {
              try {
                ret = result.name | 0;
              } catch(e) {
                GL.recordError(0x500); // GL_INVALID_ENUM
                err(`GL_INVALID_ENUM in glGet${type}v: Unknown object returned from WebGL getParameter(${name_})! (error: ${e})`);
                return;
              }
            }
            break;
          default:
            GL.recordError(0x500); // GL_INVALID_ENUM
            err(`GL_INVALID_ENUM in glGet${type}v: Native code calling glGet${type}v(${name_}) and it returns ${result} of type ${typeof(result)}!`);
            return;
        }
      }
  
      switch (type) {
        case 1: writeI53ToI64(p, ret); break;
        case 0: HEAP32[((p)/4)] = ret; break;
        case 2:   HEAPF32[((p)/4)] = ret; break;
        case 4: HEAP8[p] = ret ? 1 : 0; break;
      }
    };
  
  
  function _emscripten_glGetBooleanv(name_, p) {
    p = bigintToI53Checked(p);
  
  return emscriptenWebGLGet(name_, p, 4);
  }

  
  function _emscripten_glGetBufferParameteri64v(target, value, data) {
    data = bigintToI53Checked(data);
  
  
      if (!data) {
        // GLES2 specification does not specify how to behave if data is a null pointer. Since calling this function does not make sense
        // if data == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      writeI53ToI64(data, GLctx.getBufferParameter(target, value));
    ;
  }

  
  
  function _emscripten_glGetBufferParameteriv(target, value, data) {
    data = bigintToI53Checked(data);
  
  
      if (!data) {
        // GLES2 specification does not specify how to behave if data is a null
        // pointer. Since calling this function does not make sense if data ==
        // null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      HEAP32[((data)/4)] = GLctx.getBufferParameter(target, value);
    ;
  }

  var _emscripten_glGetError = () => {
      var error = GLctx.getError() || GL.lastError;
      GL.lastError = 0/*GL_NO_ERROR*/;
      return error;
    };

  
  
  function _emscripten_glGetFloatv(name_, p) {
    p = bigintToI53Checked(p);
  
  return emscriptenWebGLGet(name_, p, 2);
  }

  
  function _emscripten_glGetFragDataLocation(program, name) {
    name = bigintToI53Checked(name);
  
  
      return GLctx.getFragDataLocation(GL.programs[program], UTF8ToString(name));
    ;
  }

  
  
  function _emscripten_glGetFramebufferAttachmentParameteriv(target, attachment, pname, params) {
    params = bigintToI53Checked(params);
  
  
      var result = GLctx.getFramebufferAttachmentParameter(target, attachment, pname);
      if (result instanceof WebGLRenderbuffer ||
          result instanceof WebGLTexture) {
        result = result.name | 0;
      }
      HEAP32[((params)/4)] = result;
    ;
  }

  
  
  
  var emscriptenWebGLGetIndexed = (target, index, data, type) => {
      if (!data) {
        // GLES2 specification does not specify how to behave if data is a null pointer. Since calling this function does not make sense
        // if data == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      var result = GLctx.getIndexedParameter(target, index);
      var ret;
      switch (typeof result) {
        case 'boolean':
          ret = result ? 1 : 0;
          break;
        case 'number':
          ret = result;
          break;
        case 'object':
          if (result === null) {
            switch (target) {
              case 0x8C8F: // TRANSFORM_FEEDBACK_BUFFER_BINDING
              case 0x8A28: // UNIFORM_BUFFER_BINDING
                ret = 0;
                break;
              default: {
                GL.recordError(0x500); // GL_INVALID_ENUM
                return;
              }
            }
          } else if (result instanceof WebGLBuffer) {
            ret = result.name | 0;
          } else {
            GL.recordError(0x500); // GL_INVALID_ENUM
            return;
          }
          break;
        default:
          GL.recordError(0x500); // GL_INVALID_ENUM
          return;
      }
  
      switch (type) {
        case 1: writeI53ToI64(data, ret); break;
        case 0: HEAP32[((data)/4)] = ret; break;
        case 2: HEAPF32[((data)/4)] = ret; break;
        case 4: HEAP8[data] = ret ? 1 : 0; break;
        default: abort('internal emscriptenWebGLGetIndexed() error, bad type: ' + type);
      }
    };
  
  function _emscripten_glGetInteger64i_v(target, index, data) {
    data = bigintToI53Checked(data);
  
  return emscriptenWebGLGetIndexed(target, index, data, 1);
  }

  
  function _emscripten_glGetInteger64v(name_, p) {
    p = bigintToI53Checked(p);
  
  
      emscriptenWebGLGet(name_, p, 1);
    ;
  }

  
  function _emscripten_glGetIntegeri_v(target, index, data) {
    data = bigintToI53Checked(data);
  
  return emscriptenWebGLGetIndexed(target, index, data, 0);
  }

  
  
  function _emscripten_glGetIntegerv(name_, p) {
    p = bigintToI53Checked(p);
  
  return emscriptenWebGLGet(name_, p, 0);
  }

  
  function _emscripten_glGetInternalformativ(target, internalformat, pname, bufSize, params) {
    params = bigintToI53Checked(params);
  
  
      if (bufSize < 0) {
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      if (!params) {
        // GLES3 specification does not specify how to behave if values is a null pointer. Since calling this function does not make sense
        // if values == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      var ret = GLctx.getInternalformatParameter(target, internalformat, pname);
      if (ret === null) return;
      for (var i = 0; i < ret.length && i < bufSize; ++i) {
        HEAP32[(((params)+(i*4))/4)] = ret[i];
      }
    ;
  }

  function _emscripten_glGetProgramBinary(program, bufSize, length, binaryFormat, binary) {
    length = bigintToI53Checked(length);
    binaryFormat = bigintToI53Checked(binaryFormat);
    binary = bigintToI53Checked(binary);
  
  
      GL.recordError(0x502/*GL_INVALID_OPERATION*/);
    ;
  }

  
  
  function _emscripten_glGetProgramInfoLog(program, maxLength, length, infoLog) {
    length = bigintToI53Checked(length);
    infoLog = bigintToI53Checked(infoLog);
  
  
      var log = GLctx.getProgramInfoLog(GL.programs[program]);
      if (log === null) log = '(unknown error)';
      var numBytesWrittenExclNull = (maxLength > 0 && infoLog) ? stringToUTF8(log, infoLog, maxLength) : 0;
      if (length) HEAP32[((length)/4)] = numBytesWrittenExclNull;
    ;
  }

  
  
  function _emscripten_glGetProgramiv(program, pname, p) {
    p = bigintToI53Checked(p);
  
  
      if (!p) {
        // GLES2 specification does not specify how to behave if p is a null
        // pointer. Since calling this function does not make sense if p == null,
        // issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
  
      if (program >= GL.counter) {
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
  
      program = GL.programs[program];
  
      if (pname == 0x8B84) { // GL_INFO_LOG_LENGTH
        var log = GLctx.getProgramInfoLog(program);
        if (log === null) log = '(unknown error)';
        HEAP32[((p)/4)] = log.length + 1;
      } else if (pname == 0x8B87 /* GL_ACTIVE_UNIFORM_MAX_LENGTH */) {
        if (!program.maxUniformLength) {
          var numActiveUniforms = GLctx.getProgramParameter(program, 0x8B86/*GL_ACTIVE_UNIFORMS*/);
          for (var i = 0; i < numActiveUniforms; ++i) {
            program.maxUniformLength = Math.max(program.maxUniformLength, GLctx.getActiveUniform(program, i).name.length+1);
          }
        }
        HEAP32[((p)/4)] = program.maxUniformLength;
      } else if (pname == 0x8B8A /* GL_ACTIVE_ATTRIBUTE_MAX_LENGTH */) {
        if (!program.maxAttributeLength) {
          var numActiveAttributes = GLctx.getProgramParameter(program, 0x8B89/*GL_ACTIVE_ATTRIBUTES*/);
          for (var i = 0; i < numActiveAttributes; ++i) {
            program.maxAttributeLength = Math.max(program.maxAttributeLength, GLctx.getActiveAttrib(program, i).name.length+1);
          }
        }
        HEAP32[((p)/4)] = program.maxAttributeLength;
      } else if (pname == 0x8A35 /* GL_ACTIVE_UNIFORM_BLOCK_MAX_NAME_LENGTH */) {
        if (!program.maxUniformBlockNameLength) {
          var numActiveUniformBlocks = GLctx.getProgramParameter(program, 0x8A36/*GL_ACTIVE_UNIFORM_BLOCKS*/);
          for (var i = 0; i < numActiveUniformBlocks; ++i) {
            program.maxUniformBlockNameLength = Math.max(program.maxUniformBlockNameLength, GLctx.getActiveUniformBlockName(program, i).length+1);
          }
        }
        HEAP32[((p)/4)] = program.maxUniformBlockNameLength;
      } else {
        HEAP32[((p)/4)] = GLctx.getProgramParameter(program, pname);
      }
    ;
  }

  
  
  function _emscripten_glGetQueryObjecti64vEXT(id, pname, params) {
    params = bigintToI53Checked(params);
  
  
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if p == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      var query = GL.queries[id];
      var param;
      if (GL.currentContext.version < 2)
      {
        param = GLctx.disjointTimerQueryExt['getQueryObjectEXT'](query, pname);
      }
      else {
        param = GLctx.getQueryParameter(query, pname);
      }
      var ret;
      if (typeof param == 'boolean') {
        ret = param ? 1 : 0;
      } else {
        ret = param;
      }
      writeI53ToI64(params, ret);
    ;
  }

  
  
  function _emscripten_glGetQueryObjectivEXT(id, pname, params) {
    params = bigintToI53Checked(params);
  
  
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if p == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      var query = GL.queries[id];
      var param = GLctx.disjointTimerQueryExt['getQueryObjectEXT'](query, pname);
      var ret;
      if (typeof param == 'boolean') {
        ret = param ? 1 : 0;
      } else {
        ret = param;
      }
      HEAP32[((params)/4)] = ret;
    ;
  }

  
  var _glGetQueryObjecti64vEXT = _emscripten_glGetQueryObjecti64vEXT;
  var _emscripten_glGetQueryObjectui64vEXT = _glGetQueryObjecti64vEXT;

  
  function _emscripten_glGetQueryObjectuiv(id, pname, params) {
    params = bigintToI53Checked(params);
  
  
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if p == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      var query = GL.queries[id];
      var param = GLctx.getQueryParameter(query, pname);
      var ret;
      if (typeof param == 'boolean') {
        ret = param ? 1 : 0;
      } else {
        ret = param;
      }
      HEAP32[((params)/4)] = ret;
    ;
  }

  
  var _glGetQueryObjectivEXT = _emscripten_glGetQueryObjectivEXT;
  var _emscripten_glGetQueryObjectuivEXT = _glGetQueryObjectivEXT;

  
  function _emscripten_glGetQueryiv(target, pname, params) {
    params = bigintToI53Checked(params);
  
  
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if p == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      HEAP32[((params)/4)] = GLctx.getQuery(target, pname);
    ;
  }

  
  
  function _emscripten_glGetQueryivEXT(target, pname, params) {
    params = bigintToI53Checked(params);
  
  
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if p == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      HEAP32[((params)/4)] = GLctx.disjointTimerQueryExt['getQueryEXT'](target, pname);
    ;
  }

  
  
  function _emscripten_glGetRenderbufferParameteriv(target, pname, params) {
    params = bigintToI53Checked(params);
  
  
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if params == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      HEAP32[((params)/4)] = GLctx.getRenderbufferParameter(target, pname);
    ;
  }

  
  function _emscripten_glGetSamplerParameterfv(sampler, pname, params) {
    params = bigintToI53Checked(params);
  
  
      if (!params) {
        // GLES3 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if p == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      HEAPF32[((params)/4)] = GLctx.getSamplerParameter(GL.samplers[sampler], pname);
    ;
  }

  
  function _emscripten_glGetSamplerParameteriv(sampler, pname, params) {
    params = bigintToI53Checked(params);
  
  
      if (!params) {
        // GLES3 specification does not specify how to behave if params is a null pointer. Since calling this function does not make sense
        // if p == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      HEAP32[((params)/4)] = GLctx.getSamplerParameter(GL.samplers[sampler], pname);
    ;
  }

  
  
  
  function _emscripten_glGetShaderInfoLog(shader, maxLength, length, infoLog) {
    length = bigintToI53Checked(length);
    infoLog = bigintToI53Checked(infoLog);
  
  
      var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
      if (log === null) log = '(unknown error)';
      var numBytesWrittenExclNull = (maxLength > 0 && infoLog) ? stringToUTF8(log, infoLog, maxLength) : 0;
      if (length) HEAP32[((length)/4)] = numBytesWrittenExclNull;
    ;
  }

  
  
  function _emscripten_glGetShaderPrecisionFormat(shaderType, precisionType, range, precision) {
    range = bigintToI53Checked(range);
    precision = bigintToI53Checked(precision);
  
  
      var result = GLctx.getShaderPrecisionFormat(shaderType, precisionType);
      HEAP32[((range)/4)] = result.rangeMin;
      HEAP32[(((range)+(4))/4)] = result.rangeMax;
      HEAP32[((precision)/4)] = result.precision;
    ;
  }

  
  
  function _emscripten_glGetShaderSource(shader, bufSize, length, source) {
    length = bigintToI53Checked(length);
    source = bigintToI53Checked(source);
  
  
      var result = GLctx.getShaderSource(GL.shaders[shader]);
      if (!result) return; // If an error occurs, nothing will be written to length or source.
      var numBytesWrittenExclNull = (bufSize > 0 && source) ? stringToUTF8(result, source, bufSize) : 0;
      if (length) HEAP32[((length)/4)] = numBytesWrittenExclNull;
    ;
  }

  
  
  function _emscripten_glGetShaderiv(shader, pname, p) {
    p = bigintToI53Checked(p);
  
  
      if (!p) {
        // GLES2 specification does not specify how to behave if p is a null
        // pointer. Since calling this function does not make sense if p == null,
        // issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      if (pname == 0x8B84) { // GL_INFO_LOG_LENGTH
        var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
        if (log === null) log = '(unknown error)';
        // The GLES2 specification says that if the shader has an empty info log,
        // a value of 0 is returned. Otherwise the log has a null char appended.
        // (An empty string is falsey, so we can just check that instead of
        // looking at log.length.)
        var logLength = log ? log.length + 1 : 0;
        HEAP32[((p)/4)] = logLength;
      } else if (pname == 0x8B88) { // GL_SHADER_SOURCE_LENGTH
        var source = GLctx.getShaderSource(GL.shaders[shader]);
        // source may be a null, or the empty string, both of which are falsey
        // values that we report a 0 length for.
        var sourceLength = source ? source.length + 1 : 0;
        HEAP32[((p)/4)] = sourceLength;
      } else {
        HEAP32[((p)/4)] = GLctx.getShaderParameter(GL.shaders[shader], pname);
      }
    ;
  }

  
  
  
  var _emscripten_glGetString = function(name_) {
  
  var ret = (() => { 
      var ret = GL.stringCache[name_];
      if (!ret) {
        switch (name_) {
          case 0x1F03 /* GL_EXTENSIONS */:
            ret = stringToNewUTF8(webglGetExtensions().join(' '));
            break;
          case 0x1F00 /* GL_VENDOR */:
          case 0x1F01 /* GL_RENDERER */:
          case 0x9245 /* UNMASKED_VENDOR_WEBGL */:
          case 0x9246 /* UNMASKED_RENDERER_WEBGL */:
            var s = GLctx.getParameter(name_);
            if (!s) {
              GL.recordError(0x500/*GL_INVALID_ENUM*/);
            }
            ret = s ? stringToNewUTF8(s) : 0;
            break;
  
          case 0x1F02 /* GL_VERSION */:
            var webGLVersion = GLctx.getParameter(0x1F02 /*GL_VERSION*/);
            // return GLES version string corresponding to the version of the WebGL context
            var glVersion = `OpenGL ES 2.0 (${webGLVersion})`;
            if (true) glVersion = `OpenGL ES 3.0 (${webGLVersion})`;
            ret = stringToNewUTF8(glVersion);
            break;
          case 0x8B8C /* GL_SHADING_LANGUAGE_VERSION */:
            var glslVersion = GLctx.getParameter(0x8B8C /*GL_SHADING_LANGUAGE_VERSION*/);
            // extract the version number 'N.M' from the string 'WebGL GLSL ES N.M ...'
            var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
            var ver_num = glslVersion.match(ver_re);
            if (ver_num !== null) {
              if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + '0'; // ensure minor version has 2 digits
              glslVersion = `OpenGL ES GLSL ES ${ver_num[1]} (${glslVersion})`;
            }
            ret = stringToNewUTF8(glslVersion);
            break;
          default:
            GL.recordError(0x500/*GL_INVALID_ENUM*/);
            // fall through
        }
        GL.stringCache[name_] = ret;
      }
      return ret;
     })();
  return BigInt(ret);
  };

  
  
  var _emscripten_glGetStringi = function(name, index) {
  
  var ret = (() => { 
      if (GL.currentContext.version < 2) {
        GL.recordError(0x502 /* GL_INVALID_OPERATION */); // Calling GLES3/WebGL2 function with a GLES2/WebGL1 context
        return 0;
      }
      var stringiCache = GL.stringiCache[name];
      if (stringiCache) {
        if (index < 0 || index >= stringiCache.length) {
          GL.recordError(0x501/*GL_INVALID_VALUE*/);
          return 0;
        }
        return stringiCache[index];
      }
      switch (name) {
        case 0x1F03 /* GL_EXTENSIONS */:
          var exts = webglGetExtensions().map(stringToNewUTF8);
          stringiCache = GL.stringiCache[name] = exts;
          if (index < 0 || index >= stringiCache.length) {
            GL.recordError(0x501/*GL_INVALID_VALUE*/);
            return 0;
          }
          return stringiCache[index];
        default:
          GL.recordError(0x500/*GL_INVALID_ENUM*/);
          return 0;
      }
     })();
  return BigInt(ret);
  };

  
  function _emscripten_glGetSynciv(sync, pname, bufSize, length, values) {
    sync = bigintToI53Checked(sync);
    length = bigintToI53Checked(length);
    values = bigintToI53Checked(values);
  
  
      if (bufSize < 0) {
        // GLES3 specification does not specify how to behave if bufSize < 0, however in the spec wording for glGetInternalformativ, it does say that GL_INVALID_VALUE should be raised,
        // so raise GL_INVALID_VALUE here as well.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      if (!values) {
        // GLES3 specification does not specify how to behave if values is a null pointer. Since calling this function does not make sense
        // if values == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      var ret = GLctx.getSyncParameter(GL.syncs[sync], pname);
      if (ret !== null) {
        HEAP32[((values)/4)] = ret;
        if (length) HEAP32[((length)/4)] = 1; // Report a single value outputted.
      }
    ;
  }

  
  
  function _emscripten_glGetTexParameterfv(target, pname, params) {
    params = bigintToI53Checked(params);
  
  
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null
        // pointer. Since calling this function does not make sense if p == null,
        // issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      HEAPF32[((params)/4)] = GLctx.getTexParameter(target, pname);
    ;
  }

  
  
  function _emscripten_glGetTexParameteriv(target, pname, params) {
    params = bigintToI53Checked(params);
  
  
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null
        // pointer. Since calling this function does not make sense if p == null,
        // issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      HEAP32[((params)/4)] = GLctx.getTexParameter(target, pname);
    ;
  }

  
  function _emscripten_glGetTransformFeedbackVarying(program, index, bufSize, length, size, type, name) {
    length = bigintToI53Checked(length);
    size = bigintToI53Checked(size);
    type = bigintToI53Checked(type);
    name = bigintToI53Checked(name);
  
  
      program = GL.programs[program];
      var info = GLctx.getTransformFeedbackVarying(program, index);
      if (!info) return; // If an error occurred, the return parameters length, size, type and name will be unmodified.
  
      if (name && bufSize > 0) {
        var numBytesWrittenExclNull = stringToUTF8(info.name, name, bufSize);
        if (length) HEAP32[((length)/4)] = numBytesWrittenExclNull;
      } else {
        if (length) HEAP32[((length)/4)] = 0;
      }
  
      if (size) HEAP32[((size)/4)] = info.size;
      if (type) HEAP32[((type)/4)] = info.type;
    ;
  }

  
  function _emscripten_glGetUniformBlockIndex(program, uniformBlockName) {
    uniformBlockName = bigintToI53Checked(uniformBlockName);
  
  
      return GLctx.getUniformBlockIndex(GL.programs[program], UTF8ToString(uniformBlockName));
    ;
  }

  
  
  
  function _emscripten_glGetUniformIndices(program, uniformCount, uniformNames, uniformIndices) {
    uniformNames = bigintToI53Checked(uniformNames);
    uniformIndices = bigintToI53Checked(uniformIndices);
  
  
      if (!uniformIndices) {
        // GLES2 specification does not specify how to behave if uniformIndices is a null pointer. Since calling this function does not make sense
        // if uniformIndices == null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      if (uniformCount > 0 && (uniformNames == 0 || uniformIndices == 0)) {
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      program = GL.programs[program];
      var names = [];
      for (var i = 0; i < uniformCount; i++)
        names.push(UTF8ToString(Number(HEAPU64[(((uniformNames)+(i*8))/8)])));
  
      var result = GLctx.getUniformIndices(program, names);
      if (!result) return; // GL spec: If an error is generated, nothing is written out to uniformIndices.
  
      var len = result.length;
      for (var i = 0; i < len; i++) {
        HEAP32[(((uniformIndices)+(i*4))/4)] = result[i];
      }
    ;
  }

  /** @suppress {checkTypes} */
  var jstoi_q = (str) => parseInt(str);
  
  /** @noinline */
  var webglGetLeftBracePos = (name) => name.slice(-1) == ']' && name.lastIndexOf('[');
  
  var webglPrepareUniformLocationsBeforeFirstUse = (program) => {
      var uniformLocsById = program.uniformLocsById, // Maps GLuint -> WebGLUniformLocation
        uniformSizeAndIdsByName = program.uniformSizeAndIdsByName, // Maps name -> [uniform array length, GLuint]
        i, j;
  
      // On the first time invocation of glGetUniformLocation on this shader program:
      // initialize cache data structures and discover which uniforms are arrays.
      if (!uniformLocsById) {
        // maps GLint integer locations to WebGLUniformLocations
        program.uniformLocsById = uniformLocsById = {};
        // maps integer locations back to uniform name strings, so that we can lazily fetch uniform array locations
        program.uniformArrayNamesById = {};
  
        var numActiveUniforms = GLctx.getProgramParameter(program, 0x8B86/*GL_ACTIVE_UNIFORMS*/);
        for (i = 0; i < numActiveUniforms; ++i) {
          var u = GLctx.getActiveUniform(program, i);
          var nm = u.name;
          var sz = u.size;
          var lb = webglGetLeftBracePos(nm);
          var arrayName = lb > 0 ? nm.slice(0, lb) : nm;
  
          // Assign a new location.
          var id = program.uniformIdCounter;
          program.uniformIdCounter += sz;
          // Eagerly get the location of the uniformArray[0] base element.
          // The remaining indices >0 will be left for lazy evaluation to
          // improve performance. Those may never be needed to fetch, if the
          // application fills arrays always in full starting from the first
          // element of the array.
          uniformSizeAndIdsByName[arrayName] = [sz, id];
  
          // Store placeholder integers in place that highlight that these
          // >0 index locations are array indices pending population.
          for (j = 0; j < sz; ++j) {
            uniformLocsById[id] = j;
            program.uniformArrayNamesById[id++] = arrayName;
          }
        }
      }
    };
  
  
  
  
  function _emscripten_glGetUniformLocation(program, name) {
    name = bigintToI53Checked(name);
  
  
  
      name = UTF8ToString(name);
  
      if (program = GL.programs[program]) {
        webglPrepareUniformLocationsBeforeFirstUse(program);
        var uniformLocsById = program.uniformLocsById; // Maps GLuint -> WebGLUniformLocation
        var arrayIndex = 0;
        var uniformBaseName = name;
  
        // Invariant: when populating integer IDs for uniform locations, we must
        // maintain the precondition that arrays reside in contiguous addresses,
        // i.e. for a 'vec4 colors[10];', colors[4] must be at location
        // colors[0]+4.  However, user might call glGetUniformLocation(program,
        // "colors") for an array, so we cannot discover based on the user input
        // arguments whether the uniform we are dealing with is an array. The only
        // way to discover which uniforms are arrays is to enumerate over all the
        // active uniforms in the program.
        var leftBrace = webglGetLeftBracePos(name);
  
        // If user passed an array accessor "[index]", parse the array index off the accessor.
        if (leftBrace > 0) {
          arrayIndex = jstoi_q(name.slice(leftBrace + 1)) >>> 0; // "index]", coerce parseInt(']') with >>>0 to treat "foo[]" as "foo[0]" and foo[-1] as unsigned out-of-bounds.
          uniformBaseName = name.slice(0, leftBrace);
        }
  
        // Have we cached the location of this uniform before?
        // A pair [array length, GLint of the uniform location]
        var sizeAndId = program.uniformSizeAndIdsByName[uniformBaseName];
  
        // If a uniform with this name exists, and if its index is within the
        // array limits (if it's even an array), query the WebGLlocation, or
        // return an existing cached location.
        if (sizeAndId && arrayIndex < sizeAndId[0]) {
          arrayIndex += sizeAndId[1]; // Add the base location of the uniform to the array index offset.
          if ((uniformLocsById[arrayIndex] = uniformLocsById[arrayIndex] || GLctx.getUniformLocation(program, name))) {
            return arrayIndex;
          }
        }
      }
      else {
        // N.b. we are currently unable to distinguish between GL program IDs that
        // never existed vs GL program IDs that have been deleted, so report
        // GL_INVALID_VALUE in both cases.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
      }
      return -1;
    ;
  }

  
  var webglGetProgramUniformLocation = (program, location) => {
  
      if (program) {
        var webglLoc = program.uniformLocsById[location];
        // program.uniformLocsById[location] stores either an integer, or a
        // WebGLUniformLocation.
        // If an integer, we have not yet bound the location, so do it now. The
        // integer value specifies the array index we should bind to.
        if (typeof webglLoc == 'number') {
          program.uniformLocsById[location] = webglLoc = GLctx.getUniformLocation(program, program.uniformArrayNamesById[location] + (webglLoc > 0 ? `[${webglLoc}]` : ''));
        }
        // Else an already cached WebGLUniformLocation, return it.
        return webglLoc;
      } else {
        GL.recordError(0x502/*GL_INVALID_OPERATION*/);
      }
    };
  
  
  
  
  /** @suppress{checkTypes} */
  var emscriptenWebGLGetUniform = (program, location, params, type) => {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null
        // pointer. Since calling this function does not make sense if params ==
        // null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      program = GL.programs[program];
      webglPrepareUniformLocationsBeforeFirstUse(program);
      var data = GLctx.getUniform(program, webglGetProgramUniformLocation(program, location));
      if (typeof data == 'number' || typeof data == 'boolean') {
        switch (type) {
          case 0: HEAP32[((params)/4)] = data; break;
          case 2: HEAPF32[((params)/4)] = data; break;
        }
      } else {
        for (var i = 0; i < data.length; i++) {
          switch (type) {
            case 0: HEAP32[(((params)+(i*4))/4)] = data[i]; break;
            case 2: HEAPF32[(((params)+(i*4))/4)] = data[i]; break;
          }
        }
      }
    };
  
  
  function _emscripten_glGetUniformfv(program, location, params) {
    params = bigintToI53Checked(params);
  
  
      emscriptenWebGLGetUniform(program, location, params, 2);
    ;
  }

  
  
  function _emscripten_glGetUniformiv(program, location, params) {
    params = bigintToI53Checked(params);
  
  
      emscriptenWebGLGetUniform(program, location, params, 0);
    ;
  }

  
  function _emscripten_glGetUniformuiv(program, location, params) {
    params = bigintToI53Checked(params);
  
  return emscriptenWebGLGetUniform(program, location, params, 0);
  }

  
  
  /** @suppress{checkTypes} */
  var emscriptenWebGLGetVertexAttrib = (index, pname, params, type) => {
      if (!params) {
        // GLES2 specification does not specify how to behave if params is a null
        // pointer. Since calling this function does not make sense if params ==
        // null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      var data = GLctx.getVertexAttrib(index, pname);
      if (pname == 0x889F/*VERTEX_ATTRIB_ARRAY_BUFFER_BINDING*/) {
        HEAP32[((params)/4)] = data && data["name"];
      } else if (typeof data == 'number' || typeof data == 'boolean') {
        switch (type) {
          case 0: HEAP32[((params)/4)] = data; break;
          case 2: HEAPF32[((params)/4)] = data; break;
          case 5: HEAP32[((params)/4)] = Math.fround(data); break;
        }
      } else {
        for (var i = 0; i < data.length; i++) {
          switch (type) {
            case 0: HEAP32[(((params)+(i*4))/4)] = data[i]; break;
            case 2: HEAPF32[(((params)+(i*4))/4)] = data[i]; break;
            case 5: HEAP32[(((params)+(i*4))/4)] = Math.fround(data[i]); break;
          }
        }
      }
    };
  
  function _emscripten_glGetVertexAttribIiv(index, pname, params) {
    params = bigintToI53Checked(params);
  
  
      // N.B. This function may only be called if the vertex attribute was specified using the function glVertexAttribI4iv(),
      // otherwise the results are undefined. (GLES3 spec 6.1.12)
      emscriptenWebGLGetVertexAttrib(index, pname, params, 0);
    ;
  }

  
  var _glGetVertexAttribIiv = _emscripten_glGetVertexAttribIiv;
  var _emscripten_glGetVertexAttribIuiv = _glGetVertexAttribIiv;

  
  
  function _emscripten_glGetVertexAttribPointerv(index, pname, pointer) {
    pointer = bigintToI53Checked(pointer);
  
  
      if (!pointer) {
        // GLES2 specification does not specify how to behave if pointer is a null
        // pointer. Since calling this function does not make sense if pointer ==
        // null, issue a GL error to notify user about it.
        GL.recordError(0x501 /* GL_INVALID_VALUE */);
        return;
      }
      HEAP32[((pointer)/4)] = GLctx.getVertexAttribOffset(index, pname);
    ;
  }

  
  
  function _emscripten_glGetVertexAttribfv(index, pname, params) {
    params = bigintToI53Checked(params);
  
  
      // N.B. This function may only be called if the vertex attribute was
      // specified using the function glVertexAttrib*f(), otherwise the results
      // are undefined. (GLES3 spec 6.1.12)
      emscriptenWebGLGetVertexAttrib(index, pname, params, 2);
    ;
  }

  
  
  function _emscripten_glGetVertexAttribiv(index, pname, params) {
    params = bigintToI53Checked(params);
  
  
      // N.B. This function may only be called if the vertex attribute was
      // specified using the function glVertexAttrib*f(), otherwise the results
      // are undefined. (GLES3 spec 6.1.12)
      emscriptenWebGLGetVertexAttrib(index, pname, params, 5);
    ;
  }

  var _emscripten_glHint = (x0, x1) => GLctx.hint(x0, x1);

  
  
  function _emscripten_glInvalidateFramebuffer(target, numAttachments, attachments) {
    attachments = bigintToI53Checked(attachments);
  
  
      var list = tempFixedLengthArray[numAttachments];
      for (var i = 0; i < numAttachments; i++) {
        list[i] = HEAP32[(((attachments)+(i*4))/4)];
      }
  
      GLctx.invalidateFramebuffer(target, list);
    ;
  }

  
  
  function _emscripten_glInvalidateSubFramebuffer(target, numAttachments, attachments, x, y, width, height) {
    attachments = bigintToI53Checked(attachments);
  
  
      var list = tempFixedLengthArray[numAttachments];
      for (var i = 0; i < numAttachments; i++) {
        list[i] = HEAP32[(((attachments)+(i*4))/4)];
      }
  
      GLctx.invalidateSubFramebuffer(target, list, x, y, width, height);
    ;
  }

  var _emscripten_glIsBuffer = (buffer) => {
      var b = GL.buffers[buffer];
      if (!b) return 0;
      return GLctx.isBuffer(b);
    };

  var _emscripten_glIsEnabled = (x0) => GLctx.isEnabled(x0);

  var _emscripten_glIsFramebuffer = (framebuffer) => {
      var fb = GL.framebuffers[framebuffer];
      if (!fb) return 0;
      return GLctx.isFramebuffer(fb);
    };

  var _emscripten_glIsProgram = (program) => {
      program = GL.programs[program];
      if (!program) return 0;
      return GLctx.isProgram(program);
    };

  var _emscripten_glIsQuery = (id) => {
      var query = GL.queries[id];
      if (!query) return 0;
      return GLctx.isQuery(query);
    };

  var _emscripten_glIsQueryEXT = (id) => {
      var query = GL.queries[id];
      if (!query) return 0;
      return GLctx.disjointTimerQueryExt['isQueryEXT'](query);
    };

  var _emscripten_glIsRenderbuffer = (renderbuffer) => {
      var rb = GL.renderbuffers[renderbuffer];
      if (!rb) return 0;
      return GLctx.isRenderbuffer(rb);
    };

  var _emscripten_glIsSampler = (id) => {
      var sampler = GL.samplers[id];
      if (!sampler) return 0;
      return GLctx.isSampler(sampler);
    };

  var _emscripten_glIsShader = (shader) => {
      var s = GL.shaders[shader];
      if (!s) return 0;
      return GLctx.isShader(s);
    };

  function _emscripten_glIsSync(sync) {
    sync = bigintToI53Checked(sync);
  
  return GLctx.isSync(GL.syncs[sync]);
  }

  var _emscripten_glIsTexture = (id) => {
      var texture = GL.textures[id];
      if (!texture) return 0;
      return GLctx.isTexture(texture);
    };

  var _emscripten_glIsTransformFeedback = (id) => GLctx.isTransformFeedback(GL.transformFeedbacks[id]);

  var _emscripten_glIsVertexArray = (array) => {
  
      var vao = GL.vaos[array];
      if (!vao) return 0;
      return GLctx.isVertexArray(vao);
    };

  
  var _glIsVertexArray = _emscripten_glIsVertexArray;
  var _emscripten_glIsVertexArrayOES = _glIsVertexArray;

  var _emscripten_glLineWidth = (x0) => GLctx.lineWidth(x0);

  var _emscripten_glLinkProgram = (program) => {
      program = GL.programs[program];
      GLctx.linkProgram(program);
      // Invalidate earlier computed uniform->ID mappings, those have now become stale
      program.uniformLocsById = 0; // Mark as null-like so that glGetUniformLocation() knows to populate this again.
      program.uniformSizeAndIdsByName = {};
  
    };

  var _emscripten_glPauseTransformFeedback = () => GLctx.pauseTransformFeedback();

  var _emscripten_glPixelStorei = (pname, param) => {
      if (pname == 3317) {
        GL.unpackAlignment = param;
      } else if (pname == 3314) {
        GL.unpackRowLength = param;
      }
      GLctx.pixelStorei(pname, param);
    };

  var _emscripten_glPolygonModeWEBGL = (face, mode) => {
      GLctx.webglPolygonMode['polygonModeWEBGL'](face, mode);
    };

  var _emscripten_glPolygonOffset = (x0, x1) => GLctx.polygonOffset(x0, x1);

  var _emscripten_glPolygonOffsetClampEXT = (factor, units, clamp) => {
      GLctx.extPolygonOffsetClamp['polygonOffsetClampEXT'](factor, units, clamp);
    };

  function _emscripten_glProgramBinary(program, binaryFormat, binary, length) {
    binary = bigintToI53Checked(binary);
  
  
      GL.recordError(0x500/*GL_INVALID_ENUM*/);
    ;
  }

  var _emscripten_glProgramParameteri = (program, pname, value) => {
      GL.recordError(0x500/*GL_INVALID_ENUM*/);
    };

  var _emscripten_glQueryCounterEXT = (id, target) => {
      GLctx.disjointTimerQueryExt['queryCounterEXT'](GL.queries[id], target);
    };

  var _emscripten_glReadBuffer = (x0) => GLctx.readBuffer(x0);

  
  
  
  
  /** @type {!Uint16Array} */
  var HEAPU16;
  
  
  
  var heapObjectForWebGLType = (type) => {
      // Micro-optimization for size: Subtract lowest GL enum number (0x1400/* GL_BYTE */) from type to compare
      // smaller values for the heap, for shorter generated code size.
      // Also the type HEAPU16 is not tested for explicitly, but any unrecognized type will return out HEAPU16.
      // (since most types are HEAPU16)
      type -= 0x1400;
      if (type == 0) return HEAP8;
  
      if (type == 1) return HEAPU8;
  
      if (type == 2) return HEAP16;
  
      if (type == 4) return HEAP32;
  
      if (type == 6) return HEAPF32;
  
      if (type == 5
        || type == 28922
        || type == 28520
        || type == 30779
        || type == 30782
        )
        return HEAPU32;
  
      return HEAPU16;
    };
  
  var toTypedArrayIndex = (pointer, heap) =>
      pointer / heap.BYTES_PER_ELEMENT;
  
  
  function _emscripten_glReadPixels(x, y, width, height, format, type, pixels) {
    pixels = bigintToI53Checked(pixels);
  
  
      if (true) {
        if (GLctx.currentPixelPackBufferBinding) {
          GLctx.readPixels(x, y, width, height, format, type, pixels);
          return;
        }
        var heap = heapObjectForWebGLType(type);
        var target = toTypedArrayIndex(pixels, heap);
        GLctx.readPixels(x, y, width, height, format, type, heap, target);
        return;
      }
    ;
  }

  var _emscripten_glReleaseShaderCompiler = () => {
      // NOP (as allowed by GLES 2.0 spec)
    };

  var _emscripten_glRenderbufferStorage = (x0, x1, x2, x3) => GLctx.renderbufferStorage(x0, x1, x2, x3);

  var _emscripten_glRenderbufferStorageMultisample = (x0, x1, x2, x3, x4) => GLctx.renderbufferStorageMultisample(x0, x1, x2, x3, x4);

  var _emscripten_glResumeTransformFeedback = () => GLctx.resumeTransformFeedback();

  var _emscripten_glSampleCoverage = (value, invert) => {
      GLctx.sampleCoverage(value, !!invert);
    };

  var _emscripten_glSamplerParameterf = (sampler, pname, param) => {
      GLctx.samplerParameterf(GL.samplers[sampler], pname, param);
    };

  
  function _emscripten_glSamplerParameterfv(sampler, pname, params) {
    params = bigintToI53Checked(params);
  
  
      var param = HEAPF32[((params)/4)];
      GLctx.samplerParameterf(GL.samplers[sampler], pname, param);
    ;
  }

  var _emscripten_glSamplerParameteri = (sampler, pname, param) => {
      GLctx.samplerParameteri(GL.samplers[sampler], pname, param);
    };

  
  function _emscripten_glSamplerParameteriv(sampler, pname, params) {
    params = bigintToI53Checked(params);
  
  
      var param = HEAP32[((params)/4)];
      GLctx.samplerParameteri(GL.samplers[sampler], pname, param);
    ;
  }

  var _emscripten_glScissor = (x0, x1, x2, x3) => GLctx.scissor(x0, x1, x2, x3);

  
  function _emscripten_glShaderBinary(count, shaders, binaryformat, binary, length) {
    shaders = bigintToI53Checked(shaders);
    binary = bigintToI53Checked(binary);
  
  
      GL.recordError(0x500/*GL_INVALID_ENUM*/);
    ;
  }

  
  function _emscripten_glShaderSource(shader, count, string, length) {
    string = bigintToI53Checked(string);
    length = bigintToI53Checked(length);
  
  
      var source = GL.getSource(shader, count, string, length);
  
      GLctx.shaderSource(GL.shaders[shader], source);
    ;
  }

  var _emscripten_glStencilFunc = (x0, x1, x2) => GLctx.stencilFunc(x0, x1, x2);

  var _emscripten_glStencilFuncSeparate = (x0, x1, x2, x3) => GLctx.stencilFuncSeparate(x0, x1, x2, x3);

  var _emscripten_glStencilMask = (x0) => GLctx.stencilMask(x0);

  var _emscripten_glStencilMaskSeparate = (x0, x1) => GLctx.stencilMaskSeparate(x0, x1);

  var _emscripten_glStencilOp = (x0, x1, x2) => GLctx.stencilOp(x0, x1, x2);

  var _emscripten_glStencilOpSeparate = (x0, x1, x2, x3) => GLctx.stencilOpSeparate(x0, x1, x2, x3);

  var computeUnpackAlignedImageSize = (width, height, sizePerPixel) => {
      function roundedToNextMultipleOf(x, y) {
        return (x + y - 1) & -y;
      }
      var plainRowSize = (GL.unpackRowLength || width) * sizePerPixel;
      var alignedRowSize = roundedToNextMultipleOf(plainRowSize, GL.unpackAlignment);
      return height * alignedRowSize;
    };
  
  var colorChannelsInGlTextureFormat = (format) => {
      // Micro-optimizations for size: map format to size by subtracting smallest
      // enum value (0x1902) from all values first.  Also omit the most common
      // size value (1) from the list, which is assumed by formats not on the
      // list.
      var colorChannels = {
        // 0x1902 /* GL_DEPTH_COMPONENT */ - 0x1902: 1,
        // 0x1906 /* GL_ALPHA */ - 0x1902: 1,
        5: 3,
        6: 4,
        // 0x1909 /* GL_LUMINANCE */ - 0x1902: 1,
        8: 2,
        29502: 3,
        29504: 4,
        // 0x1903 /* GL_RED */ - 0x1902: 1,
        26917: 2,
        26918: 2,
        // 0x8D94 /* GL_RED_INTEGER */ - 0x1902: 1,
        29846: 3,
        29847: 4
      };
      return colorChannels[format - 0x1902]||1;
    };
  
  
  
  var emscriptenWebGLGetTexPixelData = (type, format, width, height, pixels) => {
      var heap = heapObjectForWebGLType(type);
      var sizePerPixel = colorChannelsInGlTextureFormat(format) * heap.BYTES_PER_ELEMENT;
      var bytes = computeUnpackAlignedImageSize(width, height, sizePerPixel);
      return heap.subarray(toTypedArrayIndex(pixels, heap), toTypedArrayIndex(pixels + bytes, heap));
    };
  
  
  
  
  function _emscripten_glTexImage2D(target, level, internalFormat, width, height, border, format, type, pixels) {
    pixels = bigintToI53Checked(pixels);
  
  
      if (true) {
        if (GLctx.currentPixelUnpackBufferBinding) {
          GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels);
          return;
        }
        if (pixels) {
          var heap = heapObjectForWebGLType(type);
          var index = toTypedArrayIndex(pixels, heap);
          GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, heap, index);
          return;
        }
      }
      var pixelData = pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels) : null;
      GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixelData);
    ;
  }

  
  
  function _emscripten_glTexImage3D(target, level, internalFormat, width, height, depth, border, format, type, pixels) {
    pixels = bigintToI53Checked(pixels);
  
  
      if (GLctx.currentPixelUnpackBufferBinding) {
        GLctx.texImage3D(target, level, internalFormat, width, height, depth, border, format, type, pixels);
      } else if (pixels) {
        var heap = heapObjectForWebGLType(type);
        GLctx.texImage3D(target, level, internalFormat, width, height, depth, border, format, type, heap, toTypedArrayIndex(pixels, heap));
      } else {
        GLctx.texImage3D(target, level, internalFormat, width, height, depth, border, format, type, null);
      }
    ;
  }

  var _emscripten_glTexParameterf = (x0, x1, x2) => GLctx.texParameterf(x0, x1, x2);

  
  
  function _emscripten_glTexParameterfv(target, pname, params) {
    params = bigintToI53Checked(params);
  
  
      var param = HEAPF32[((params)/4)];
      GLctx.texParameterf(target, pname, param);
    ;
  }

  var _emscripten_glTexParameteri = (x0, x1, x2) => GLctx.texParameteri(x0, x1, x2);

  
  
  function _emscripten_glTexParameteriv(target, pname, params) {
    params = bigintToI53Checked(params);
  
  
      var param = HEAP32[((params)/4)];
      GLctx.texParameteri(target, pname, param);
    ;
  }

  var _emscripten_glTexStorage2D = (x0, x1, x2, x3, x4) => GLctx.texStorage2D(x0, x1, x2, x3, x4);

  var _emscripten_glTexStorage3D = (x0, x1, x2, x3, x4, x5) => GLctx.texStorage3D(x0, x1, x2, x3, x4, x5);

  
  
  
  
  function _emscripten_glTexSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels) {
    pixels = bigintToI53Checked(pixels);
  
  
      if (true) {
        if (GLctx.currentPixelUnpackBufferBinding) {
          GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixels);
          return;
        }
        if (pixels) {
          var heap = heapObjectForWebGLType(type);
          GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, heap, toTypedArrayIndex(pixels, heap));
          return;
        }
      }
      var pixelData = pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels) : null;
      GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData);
    ;
  }

  
  
  function _emscripten_glTexSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, pixels) {
    pixels = bigintToI53Checked(pixels);
  
  
      if (GLctx.currentPixelUnpackBufferBinding) {
        GLctx.texSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, pixels);
      } else if (pixels) {
        var heap = heapObjectForWebGLType(type);
        GLctx.texSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, heap, toTypedArrayIndex(pixels, heap));
      } else {
        GLctx.texSubImage3D(target, level, xoffset, yoffset, zoffset, width, height, depth, format, type, null);
      }
    ;
  }

  
  
  function _emscripten_glTransformFeedbackVaryings(program, count, varyings, bufferMode) {
    varyings = bigintToI53Checked(varyings);
  
  
      program = GL.programs[program];
      var vars = [];
      for (var i = 0; i < count; i++)
        vars.push(UTF8ToString(Number(HEAPU64[(((varyings)+(i*8))/8)])));
  
      GLctx.transformFeedbackVaryings(program, vars, bufferMode);
    ;
  }

  
  var webglGetUniformLocation = (location) => {
  
      return webglGetProgramUniformLocation(GLctx.currentProgram, location);
    };
  
  var _emscripten_glUniform1f = (location, v0) => {
      GLctx.uniform1f(webglGetUniformLocation(location), v0);
    };

  
  
  
  function _emscripten_glUniform1fv(location, count, value) {
    value = bigintToI53Checked(value);
  
  
  
      count && GLctx.uniform1fv(webglGetUniformLocation(location), HEAPF32, ((value)/4), count);
    ;
  }

  
  var _emscripten_glUniform1i = (location, v0) => {
      GLctx.uniform1i(webglGetUniformLocation(location), v0);
    };

  
  
  
  function _emscripten_glUniform1iv(location, count, value) {
    value = bigintToI53Checked(value);
  
  
  
      count && GLctx.uniform1iv(webglGetUniformLocation(location), HEAP32, ((value)/4), count);
    ;
  }

  var _emscripten_glUniform1ui = (location, v0) => {
      GLctx.uniform1ui(webglGetUniformLocation(location), v0);
    };

  
  
  function _emscripten_glUniform1uiv(location, count, value) {
    value = bigintToI53Checked(value);
  
  
      count && GLctx.uniform1uiv(webglGetUniformLocation(location), HEAPU32, ((value)/4), count);
    ;
  }

  
  var _emscripten_glUniform2f = (location, v0, v1) => {
      GLctx.uniform2f(webglGetUniformLocation(location), v0, v1);
    };

  
  
  
  function _emscripten_glUniform2fv(location, count, value) {
    value = bigintToI53Checked(value);
  
  
  
      count && GLctx.uniform2fv(webglGetUniformLocation(location), HEAPF32, ((value)/4), count*2);
    ;
  }

  
  var _emscripten_glUniform2i = (location, v0, v1) => {
      GLctx.uniform2i(webglGetUniformLocation(location), v0, v1);
    };

  
  
  
  function _emscripten_glUniform2iv(location, count, value) {
    value = bigintToI53Checked(value);
  
  
  
      count && GLctx.uniform2iv(webglGetUniformLocation(location), HEAP32, ((value)/4), count*2);
    ;
  }

  var _emscripten_glUniform2ui = (location, v0, v1) => {
      GLctx.uniform2ui(webglGetUniformLocation(location), v0, v1);
    };

  
  
  function _emscripten_glUniform2uiv(location, count, value) {
    value = bigintToI53Checked(value);
  
  
      count && GLctx.uniform2uiv(webglGetUniformLocation(location), HEAPU32, ((value)/4), count*2);
    ;
  }

  
  var _emscripten_glUniform3f = (location, v0, v1, v2) => {
      GLctx.uniform3f(webglGetUniformLocation(location), v0, v1, v2);
    };

  
  
  
  function _emscripten_glUniform3fv(location, count, value) {
    value = bigintToI53Checked(value);
  
  
  
      count && GLctx.uniform3fv(webglGetUniformLocation(location), HEAPF32, ((value)/4), count*3);
    ;
  }

  
  var _emscripten_glUniform3i = (location, v0, v1, v2) => {
      GLctx.uniform3i(webglGetUniformLocation(location), v0, v1, v2);
    };

  
  
  
  function _emscripten_glUniform3iv(location, count, value) {
    value = bigintToI53Checked(value);
  
  
  
      count && GLctx.uniform3iv(webglGetUniformLocation(location), HEAP32, ((value)/4), count*3);
    ;
  }

  var _emscripten_glUniform3ui = (location, v0, v1, v2) => {
      GLctx.uniform3ui(webglGetUniformLocation(location), v0, v1, v2);
    };

  
  
  function _emscripten_glUniform3uiv(location, count, value) {
    value = bigintToI53Checked(value);
  
  
      count && GLctx.uniform3uiv(webglGetUniformLocation(location), HEAPU32, ((value)/4), count*3);
    ;
  }

  
  var _emscripten_glUniform4f = (location, v0, v1, v2, v3) => {
      GLctx.uniform4f(webglGetUniformLocation(location), v0, v1, v2, v3);
    };

  
  
  
  function _emscripten_glUniform4fv(location, count, value) {
    value = bigintToI53Checked(value);
  
  
  
      count && GLctx.uniform4fv(webglGetUniformLocation(location), HEAPF32, ((value)/4), count*4);
    ;
  }

  
  var _emscripten_glUniform4i = (location, v0, v1, v2, v3) => {
      GLctx.uniform4i(webglGetUniformLocation(location), v0, v1, v2, v3);
    };

  
  
  
  function _emscripten_glUniform4iv(location, count, value) {
    value = bigintToI53Checked(value);
  
  
  
      count && GLctx.uniform4iv(webglGetUniformLocation(location), HEAP32, ((value)/4), count*4);
    ;
  }

  var _emscripten_glUniform4ui = (location, v0, v1, v2, v3) => {
      GLctx.uniform4ui(webglGetUniformLocation(location), v0, v1, v2, v3);
    };

  
  
  function _emscripten_glUniform4uiv(location, count, value) {
    value = bigintToI53Checked(value);
  
  
      count && GLctx.uniform4uiv(webglGetUniformLocation(location), HEAPU32, ((value)/4), count*4);
    ;
  }

  var _emscripten_glUniformBlockBinding = (program, uniformBlockIndex, uniformBlockBinding) => {
      program = GL.programs[program];
  
      GLctx.uniformBlockBinding(program, uniformBlockIndex, uniformBlockBinding);
    };

  
  
  
  function _emscripten_glUniformMatrix2fv(location, count, transpose, value) {
    value = bigintToI53Checked(value);
  
  
  
      count && GLctx.uniformMatrix2fv(webglGetUniformLocation(location), !!transpose, HEAPF32, ((value)/4), count*4);
    ;
  }

  
  
  function _emscripten_glUniformMatrix2x3fv(location, count, transpose, value) {
    value = bigintToI53Checked(value);
  
  
      count && GLctx.uniformMatrix2x3fv(webglGetUniformLocation(location), !!transpose, HEAPF32, ((value)/4), count*6);
    ;
  }

  
  
  function _emscripten_glUniformMatrix2x4fv(location, count, transpose, value) {
    value = bigintToI53Checked(value);
  
  
      count && GLctx.uniformMatrix2x4fv(webglGetUniformLocation(location), !!transpose, HEAPF32, ((value)/4), count*8);
    ;
  }

  
  
  
  function _emscripten_glUniformMatrix3fv(location, count, transpose, value) {
    value = bigintToI53Checked(value);
  
  
  
      count && GLctx.uniformMatrix3fv(webglGetUniformLocation(location), !!transpose, HEAPF32, ((value)/4), count*9);
    ;
  }

  
  
  function _emscripten_glUniformMatrix3x2fv(location, count, transpose, value) {
    value = bigintToI53Checked(value);
  
  
      count && GLctx.uniformMatrix3x2fv(webglGetUniformLocation(location), !!transpose, HEAPF32, ((value)/4), count*6);
    ;
  }

  
  
  function _emscripten_glUniformMatrix3x4fv(location, count, transpose, value) {
    value = bigintToI53Checked(value);
  
  
      count && GLctx.uniformMatrix3x4fv(webglGetUniformLocation(location), !!transpose, HEAPF32, ((value)/4), count*12);
    ;
  }

  
  
  
  function _emscripten_glUniformMatrix4fv(location, count, transpose, value) {
    value = bigintToI53Checked(value);
  
  
  
      count && GLctx.uniformMatrix4fv(webglGetUniformLocation(location), !!transpose, HEAPF32, ((value)/4), count*16);
    ;
  }

  
  
  function _emscripten_glUniformMatrix4x2fv(location, count, transpose, value) {
    value = bigintToI53Checked(value);
  
  
      count && GLctx.uniformMatrix4x2fv(webglGetUniformLocation(location), !!transpose, HEAPF32, ((value)/4), count*8);
    ;
  }

  
  
  function _emscripten_glUniformMatrix4x3fv(location, count, transpose, value) {
    value = bigintToI53Checked(value);
  
  
      count && GLctx.uniformMatrix4x3fv(webglGetUniformLocation(location), !!transpose, HEAPF32, ((value)/4), count*12);
    ;
  }

  var _emscripten_glUseProgram = (program) => {
      program = GL.programs[program];
      GLctx.useProgram(program);
      // Record the currently active program so that we can access the uniform
      // mapping table of that program.
      GLctx.currentProgram = program;
    };

  var _emscripten_glValidateProgram = (program) => {
      GLctx.validateProgram(GL.programs[program]);
    };

  var _emscripten_glVertexAttrib1f = (x0, x1) => GLctx.vertexAttrib1f(x0, x1);

  
  
  function _emscripten_glVertexAttrib1fv(index, v) {
    v = bigintToI53Checked(v);
  
  
  
      GLctx.vertexAttrib1f(index, HEAPF32[v>>2]);
    ;
  }

  var _emscripten_glVertexAttrib2f = (x0, x1, x2) => GLctx.vertexAttrib2f(x0, x1, x2);

  
  
  function _emscripten_glVertexAttrib2fv(index, v) {
    v = bigintToI53Checked(v);
  
  
  
      GLctx.vertexAttrib2f(index, HEAPF32[v>>2], HEAPF32[v+4>>2]);
    ;
  }

  var _emscripten_glVertexAttrib3f = (x0, x1, x2, x3) => GLctx.vertexAttrib3f(x0, x1, x2, x3);

  
  
  function _emscripten_glVertexAttrib3fv(index, v) {
    v = bigintToI53Checked(v);
  
  
  
      GLctx.vertexAttrib3f(index, HEAPF32[v>>2], HEAPF32[v+4>>2], HEAPF32[v+8>>2]);
    ;
  }

  var _emscripten_glVertexAttrib4f = (x0, x1, x2, x3, x4) => GLctx.vertexAttrib4f(x0, x1, x2, x3, x4);

  
  
  function _emscripten_glVertexAttrib4fv(index, v) {
    v = bigintToI53Checked(v);
  
  
  
      GLctx.vertexAttrib4f(index, HEAPF32[v>>2], HEAPF32[v+4>>2], HEAPF32[v+8>>2], HEAPF32[v+12>>2]);
    ;
  }

  var _emscripten_glVertexAttribDivisor = (index, divisor) => {
      GLctx.vertexAttribDivisor(index, divisor);
    };

  
  var _glVertexAttribDivisor = _emscripten_glVertexAttribDivisor;
  var _emscripten_glVertexAttribDivisorANGLE = _glVertexAttribDivisor;

  
  var _emscripten_glVertexAttribDivisorARB = _glVertexAttribDivisor;

  
  var _emscripten_glVertexAttribDivisorEXT = _glVertexAttribDivisor;

  
  var _emscripten_glVertexAttribDivisorNV = _glVertexAttribDivisor;

  var _emscripten_glVertexAttribI4i = (x0, x1, x2, x3, x4) => GLctx.vertexAttribI4i(x0, x1, x2, x3, x4);

  
  function _emscripten_glVertexAttribI4iv(index, v) {
    v = bigintToI53Checked(v);
  
  
      GLctx.vertexAttribI4i(index, HEAP32[v>>2], HEAP32[v+4>>2], HEAP32[v+8>>2], HEAP32[v+12>>2]);
    ;
  }

  var _emscripten_glVertexAttribI4ui = (x0, x1, x2, x3, x4) => GLctx.vertexAttribI4ui(x0, x1, x2, x3, x4);

  
  function _emscripten_glVertexAttribI4uiv(index, v) {
    v = bigintToI53Checked(v);
  
  
      GLctx.vertexAttribI4ui(index, HEAPU32[v>>2], HEAPU32[v+4>>2], HEAPU32[v+8>>2], HEAPU32[v+12>>2]);
    ;
  }

  function _emscripten_glVertexAttribIPointer(index, size, type, stride, ptr) {
    ptr = bigintToI53Checked(ptr);
  
  
      GLctx.vertexAttribIPointer(index, size, type, stride, ptr);
    ;
  }

  
  function _emscripten_glVertexAttribPointer(index, size, type, normalized, stride, ptr) {
    ptr = bigintToI53Checked(ptr);
  
  
      GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr);
    ;
  }

  var _emscripten_glViewport = (x0, x1, x2, x3) => GLctx.viewport(x0, x1, x2, x3);

  function _emscripten_glWaitSync(sync, flags, timeout) {
    sync = bigintToI53Checked(sync);
  
  
      // See WebGL2 vs GLES3 difference on GL_TIMEOUT_IGNORED above (https://www.khronos.org/registry/webgl/specs/latest/2.0/#5.15)
      timeout = Number(timeout);
      GLctx.waitSync(GL.syncs[sync], flags, timeout);
    ;
  }

  var _emscripten_has_asyncify = () => 0;

  
  
  var doRequestFullscreen = (target, strategy) => {
      if (!JSEvents.fullscreenEnabled()) return -1;
      target = findEventTarget(target);
      if (!target) return -4;
  
      if (!target.requestFullscreen
        ) {
        return -3;
      }
  
      // Queue this function call if we're not currently in an event handler and
      // the user saw it appropriate to do so.
      if (!JSEvents.canPerformEventHandlerRequests()) {
        if (strategy.deferUntilInEventHandler) {
          JSEvents.deferCall(JSEvents_requestFullscreen, 1 /* priority over pointer lock */, [target, strategy]);
          return 1;
        }
        return -2;
      }
  
      return JSEvents_requestFullscreen(target, strategy);
    };
  
  
  function _emscripten_request_fullscreen_strategy(target, deferUntilInEventHandler, fullscreenStrategy) {
    target = bigintToI53Checked(target);
    fullscreenStrategy = bigintToI53Checked(fullscreenStrategy);
  
  
      var strategy = {
        scaleMode: HEAP32[((fullscreenStrategy)/4)],
        canvasResolutionScaleMode: HEAP32[(((fullscreenStrategy)+(4))/4)],
        filteringMode: HEAP32[(((fullscreenStrategy)+(8))/4)],
        deferUntilInEventHandler,
        canvasResizedCallback: HEAP32[(((fullscreenStrategy)+(16))/4)],
        canvasResizedCallbackUserData: HEAP32[(((fullscreenStrategy)+(24))/4)]
      };
  
      return doRequestFullscreen(target, strategy);
    ;
  }

  
  
  
  function _emscripten_request_pointerlock(target, deferUntilInEventHandler) {
    target = bigintToI53Checked(target);
  
  
      target = findEventTarget(target);
      if (!target) return -4;
      if (!target.requestPointerLock) {
        return -1;
      }
  
      // Queue this function call if we're not currently in an event handler and
      // the user saw it appropriate to do so.
      if (!JSEvents.canPerformEventHandlerRequests()) {
        if (deferUntilInEventHandler) {
          JSEvents.deferCall(requestPointerLock, 2 /* priority below fullscreen */, [target]);
          return 1;
        }
        return -2;
      }
  
      return requestPointerLock(target);
    ;
  }

  
  
  var growMemory = (size) => {
      var oldHeapSize = wasmMemory.buffer.byteLength;
      var pages = ((size - oldHeapSize + 65535) / 65536) | 0;
      try {
        // round size grow request up to wasm page size (fixed 64KB per spec)
        wasmMemory.grow(BigInt(pages)); // .grow() takes a delta compared to the previous size
        updateMemoryViews();
        return 1 /*success*/;
      } catch(e) {
      }
      // implicit 0 return to save code size (caller will cast 'undefined' into 0
      // anyhow)
    };
  
  
  function _emscripten_resize_heap(requestedSize) {
    requestedSize = bigintToI53Checked(requestedSize);
  
  
      var oldSize = HEAPU8.length;
      // With multithreaded builds, races can happen (another thread might increase the size
      // in between), so return a failure, and let the caller retry.
  
      // Memory resize rules:
      // 1.  Always increase heap size to at least the requested size, rounded up
      //     to next page multiple.
      // 2a. If MEMORY_GROWTH_LINEAR_STEP == -1, excessively resize the heap
      //     geometrically: increase the heap size according to
      //     MEMORY_GROWTH_GEOMETRIC_STEP factor (default +20%), At most
      //     overreserve by MEMORY_GROWTH_GEOMETRIC_CAP bytes (default 96MB).
      // 2b. If MEMORY_GROWTH_LINEAR_STEP != -1, excessively resize the heap
      //     linearly: increase the heap size by at least
      //     MEMORY_GROWTH_LINEAR_STEP bytes.
      // 3.  Max size for the heap is capped at 2048MB-WASM_PAGE_SIZE, or by
      //     MAXIMUM_MEMORY, or by ASAN limit, depending on which is smallest
      // 4.  If we were unable to allocate as much memory, it may be due to
      //     over-eager decision to excessively reserve due to (3) above.
      //     Hence if an allocation fails, cut down on the amount of excess
      //     growth, in an attempt to succeed to perform a smaller allocation.
  
      // A limit is set for how much we can grow. We should not exceed that
      // (the wasm binary specifies it, so if we tried, we'd fail anyhow).
      var maxHeapSize = getHeapMax();
      if (requestedSize > maxHeapSize) {
        return false;
      }
  
      // Loop through potential heap size increases. If we attempt a too eager
      // reservation that fails, cut down on the attempted size and reserve a
      // smaller bump instead. (max 3 times, chosen somewhat arbitrarily)
      for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown); // ensure geometric growth
        // but limit overreserving (default to capping at +96MB overgrowth at most)
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296 );
  
        var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
  
        var replacement = growMemory(newSize);
        if (replacement) {
  
          return true;
        }
      }
      return false;
    ;
  }

  /** @returns {number} */
  var convertFrameToPC = (frame) => {
      var match;
  
      if (match = /\bwasm-function\[\d+\]:(0x[0-9a-f]+)/.exec(frame)) {
        // Wasm engines give the binary offset directly, so we use that as return address
        return +match[1];
      } else if (match = /:(\d+):\d+(?:\)|$)/.exec(frame)) {
        // If we are in js, we can use the js line number as the "return address".
        // This should work for wasm2js.  We tag the high bit to distinguish this
        // from wasm addresses.
        return 0x80000000 | +match[1];
      }
      // return 0 if we can't find any
      return 0;
    };
  
  
  var _emscripten_return_address = function(level) {
  
  var ret = (() => { 
      var callstack = jsStackTrace().split('\n');
      if (callstack[0] == 'Error') {
        callstack.shift();
      }
      // skip this function and the caller to get caller's return address
      // MEMORY64 injects an extra wrapper within emscripten_return_address
      // to handle BigInt conversions.
      var caller = callstack[level + 4];
      return convertFrameToPC(caller);
     })();
  return BigInt(ret);
  };

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  var _emscripten_run_script_string = function(ptr) {
    ptr = bigintToI53Checked(ptr);
  
  var ret = (() => { 
      var s = eval(UTF8ToString(ptr));
      if (s == null) {
        return 0;
      }
      s += '';
      var me = _emscripten_run_script_string;
      me.bufferSize = lengthBytesUTF8(s) + 1;
      me.buffer = _realloc(me.buffer ?? 0, me.bufferSize)
      stringToUTF8(s, me.buffer, me.bufferSize);
      return me.buffer;
     })();
  return BigInt(ret);
  };

  /** @suppress {checkTypes} */
  var _emscripten_sample_gamepad_data = () => {
      try {
        if (navigator.getGamepads) return (JSEvents.lastGamepadState = navigator.getGamepads())
          ? 0 : -1;
      } catch(e) {
        navigator.getGamepads = null; // Disable getGamepads() so that it won't be attempted to be used again.
      }
      return -1;
    };

  
  
  
  var registerBeforeUnloadEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString) => {
      var beforeUnloadEventHandlerFunc = (e) => {
        // Note: This is always called on the main browser thread, since it needs synchronously return a value!
        var confirmationMessage = ((a1, a2, a3) => Number(getWasmTableEntry(callbackfunc).call(null, a1, BigInt(a2), BigInt(a3))))(eventTypeId, 0, userData);
  
        if (confirmationMessage) {
          confirmationMessage = UTF8ToString(confirmationMessage);
        }
        if (confirmationMessage) {
          e.preventDefault();
          e.returnValue = confirmationMessage;
          return confirmationMessage;
        }
      };
  
      var eventHandler = {
        target: findEventTarget(target),
        eventTypeString,
        eventTypeId,
        userData,
        callbackfunc,
        handlerFunc: beforeUnloadEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  
  function _emscripten_set_beforeunload_callback_on_thread(userData, callbackfunc, targetThread) {
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  
      if (typeof onbeforeunload == 'undefined') return -1;
      // beforeunload callback can only be registered on the main browser thread, because the page will go away immediately after returning from the handler,
      // and there is no time to start proxying it anywhere.
      if (targetThread !== 1) return -5;
      return registerBeforeUnloadEventCallback(2, userData, true, callbackfunc, 28, 'beforeunload');
    ;
  }

  
  
  
  
  var registerFocusEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      var eventSize = 256;
      JSEvents.focusEvent ||= _malloc(eventSize);
  
      var focusEventHandlerFunc = (e) => {
        var nodeName = JSEvents.getNodeNameForTarget(e.target);
        var id = e.target.id ?? '';
  
        var focusEvent = JSEvents.focusEvent;
        stringToUTF8(nodeName, focusEvent + 0, 128);
        stringToUTF8(id, focusEvent + 128, 128);
  
        if (((a1, a2, a3) => getWasmTableEntry(callbackfunc).call(null, a1, BigInt(a2), BigInt(a3)))(eventTypeId, focusEvent, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target: findEventTarget(target),
        eventTypeString,
        eventTypeId,
        userData,
        callbackfunc,
        handlerFunc: focusEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  
  function _emscripten_set_blur_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    target = bigintToI53Checked(target);
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  return registerFocusEventCallback(target, userData, useCapture, callbackfunc, 12, 'blur', targetThread);
  }


  
  function _emscripten_set_element_css_size(target, width, height) {
    target = bigintToI53Checked(target);
  
  
      target = findEventTarget(target);
      if (!target) return -4;
  
      target.style.width = width + 'px';
      target.style.height = height + 'px';
  
      return 0;
    ;
  }

  
  function _emscripten_set_focus_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    target = bigintToI53Checked(target);
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  return registerFocusEventCallback(target, userData, useCapture, callbackfunc, 13, 'focus', targetThread);
  }

  
  
  
  
  
  
  var fillFullscreenChangeEventData = (eventStruct) => {
      var fullscreenElement = getFullscreenElement();
      var isFullscreen = !!fullscreenElement;
      // Assigning a boolean to HEAP32 with expected type coercion.
      /** @suppress{checkTypes} */
      HEAP8[eventStruct] = isFullscreen;
      HEAP8[(eventStruct)+(1)] = JSEvents.fullscreenEnabled();
      // If transitioning to fullscreen, report info about the element that is now fullscreen.
      // If transitioning to windowed mode, report info about the element that just was fullscreen.
      var reportedElement = isFullscreen ? fullscreenElement : JSEvents.previousFullscreenElement;
      var nodeName = JSEvents.getNodeNameForTarget(reportedElement);
      var id = reportedElement?.id ?? '';
      stringToUTF8(nodeName, eventStruct + 2, 128);
      stringToUTF8(id, eventStruct + 130, 128);
      HEAP32[(((eventStruct)+(260))/4)] = reportedElement?.clientWidth ?? 0;
      HEAP32[(((eventStruct)+(264))/4)] = reportedElement?.clientHeight ?? 0;
      HEAP32[(((eventStruct)+(268))/4)] = screen.width;
      HEAP32[(((eventStruct)+(272))/4)] = screen.height;
      if (isFullscreen) {
        JSEvents.previousFullscreenElement = fullscreenElement;
      }
    };
  
  
  var registerFullscreenChangeEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      var eventSize = 276;
      JSEvents.fullscreenChangeEvent ||= _malloc(eventSize);
  
      var fullscreenChangeEventHandlerFunc = (e) => {
        var fullscreenChangeEvent = JSEvents.fullscreenChangeEvent;
        fillFullscreenChangeEventData(fullscreenChangeEvent);
  
        if (((a1, a2, a3) => getWasmTableEntry(callbackfunc).call(null, a1, BigInt(a2), BigInt(a3)))(eventTypeId, fullscreenChangeEvent, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target,
        eventTypeString,
        eventTypeId,
        userData,
        callbackfunc,
        handlerFunc: fullscreenChangeEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  
  
  function _emscripten_set_fullscreenchange_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    target = bigintToI53Checked(target);
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  
      if (!JSEvents.fullscreenEnabled()) return -1;
      target = findEventTarget(target);
      if (!target) return -4;
  
      return registerFullscreenChangeEventCallback(target, userData, useCapture, callbackfunc, 19, 'fullscreenchange', targetThread);
    ;
  }

  
  
  
  
  var registerGamepadEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      var eventSize = 1240;
      JSEvents.gamepadEvent ||= _malloc(eventSize);
  
      var gamepadEventHandlerFunc = (e) => {
        var gamepadEvent = JSEvents.gamepadEvent;
        fillGamepadEventData(gamepadEvent, e['gamepad']);
  
        if (((a1, a2, a3) => getWasmTableEntry(callbackfunc).call(null, a1, BigInt(a2), BigInt(a3)))(eventTypeId, gamepadEvent, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target: findEventTarget(target),
        allowsDeferredCalls: true,
        eventTypeString,
        eventTypeId,
        userData,
        callbackfunc,
        handlerFunc: gamepadEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  
  
  function _emscripten_set_gamepadconnected_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  
      if (_emscripten_sample_gamepad_data()) return -1;
      return registerGamepadEventCallback(2, userData, useCapture, callbackfunc, 26, 'gamepadconnected', targetThread);
    ;
  }

  
  
  function _emscripten_set_gamepaddisconnected_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  
      if (_emscripten_sample_gamepad_data()) return -1;
      return registerGamepadEventCallback(2, userData, useCapture, callbackfunc, 27, 'gamepaddisconnected', targetThread);
    ;
  }

  
  
  
  
  
  
  
  var registerKeyEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      var eventSize = 160;
      JSEvents.keyEvent ||= _malloc(eventSize);
  
      var keyEventHandlerFunc = (e) => {
  
        var keyEventData = JSEvents.keyEvent;
        HEAPF64[((keyEventData)/8)] = e.timeStamp;
  
        var idx = ((keyEventData)/4);
  
        HEAP32[idx + 2] = e.location;
        HEAP8[keyEventData + 12] = e.ctrlKey;
        HEAP8[keyEventData + 13] = e.shiftKey;
        HEAP8[keyEventData + 14] = e.altKey;
        HEAP8[keyEventData + 15] = e.metaKey;
        HEAP8[keyEventData + 16] = e.repeat;
        HEAP32[idx + 5] = e.charCode;
        HEAP32[idx + 6] = e.keyCode;
        HEAP32[idx + 7] = e.which;
        stringToUTF8(e.key ?? '', keyEventData + 32, 32);
        stringToUTF8(e.code ?? '', keyEventData + 64, 32);
        stringToUTF8(e.char ?? '', keyEventData + 96, 32);
        stringToUTF8(e.locale ?? '', keyEventData + 128, 32);
  
        if (((a1, a2, a3) => getWasmTableEntry(callbackfunc).call(null, a1, BigInt(a2), BigInt(a3)))(eventTypeId, keyEventData, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target: findEventTarget(target),
        eventTypeString,
        eventTypeId,
        userData,
        callbackfunc,
        handlerFunc: keyEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  
  function _emscripten_set_keydown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    target = bigintToI53Checked(target);
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  return registerKeyEventCallback(target, userData, useCapture, callbackfunc, 2, 'keydown', targetThread);
  }

  
  function _emscripten_set_keypress_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    target = bigintToI53Checked(target);
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  return registerKeyEventCallback(target, userData, useCapture, callbackfunc, 1, 'keypress', targetThread);
  }

  
  function _emscripten_set_keyup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    target = bigintToI53Checked(target);
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  return registerKeyEventCallback(target, userData, useCapture, callbackfunc, 3, 'keyup', targetThread);
  }

  
  
  function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop) {
    func = bigintToI53Checked(func);
  
  
      var iterFunc = getWasmTableEntry(func);
      setMainLoop(iterFunc, fps, simulateInfiniteLoop);
    ;
  }

  
  
  
  
  
  var fillMouseEventData = (eventStruct, e, target) => {
      HEAPF64[((eventStruct)/8)] = e.timeStamp;
      var idx = ((eventStruct)/4);
      HEAP32[idx + 2] = e.screenX;
      HEAP32[idx + 3] = e.screenY;
      HEAP32[idx + 4] = e.clientX;
      HEAP32[idx + 5] = e.clientY;
      HEAP8[eventStruct + 24] = e.ctrlKey;
      HEAP8[eventStruct + 25] = e.shiftKey;
      HEAP8[eventStruct + 26] = e.altKey;
      HEAP8[eventStruct + 27] = e.metaKey;
      HEAP16[idx*2 + 14] = e.button;
      HEAP16[idx*2 + 15] = e.buttons;
      HEAP32[idx + 8] = e.movementX;
      HEAP32[idx + 9] = e.movementY;
  
      // Note: rect contains doubles (truncated to placate SAFE_HEAP, which is the same behaviour when writing to HEAP32 anyway)
      var rect = getBoundingClientRect(target);
      HEAP32[idx + 10] = e.clientX - (rect.left | 0);
      HEAP32[idx + 11] = e.clientY - (rect.top  | 0);
    };
  
  
  
  var registerMouseEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      var eventSize = 64;
      JSEvents.mouseEvent ||= _malloc(eventSize);
      target = findEventTarget(target);
  
      var mouseEventHandlerFunc = (e) => {
        // TODO: Make this access thread safe, or this could update live while app is reading it.
        fillMouseEventData(JSEvents.mouseEvent, e, target);
  
        if (((a1, a2, a3) => getWasmTableEntry(callbackfunc).call(null, a1, BigInt(a2), BigInt(a3)))(eventTypeId, JSEvents.mouseEvent, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target,
        allowsDeferredCalls: eventTypeString != 'mousemove' && eventTypeString != 'mouseenter' && eventTypeString != 'mouseleave', // Mouse move events do not allow fullscreen/pointer lock requests to be handled in them!
        eventTypeString,
        eventTypeId,
        userData,
        callbackfunc,
        handlerFunc: mouseEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  
  function _emscripten_set_mousedown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    target = bigintToI53Checked(target);
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 5, 'mousedown', targetThread);
  }

  
  function _emscripten_set_mouseenter_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    target = bigintToI53Checked(target);
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 33, 'mouseenter', targetThread);
  }

  
  function _emscripten_set_mouseleave_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    target = bigintToI53Checked(target);
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 34, 'mouseleave', targetThread);
  }

  
  function _emscripten_set_mousemove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    target = bigintToI53Checked(target);
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 8, 'mousemove', targetThread);
  }

  
  function _emscripten_set_mouseup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    target = bigintToI53Checked(target);
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  return registerMouseEventCallback(target, userData, useCapture, callbackfunc, 6, 'mouseup', targetThread);
  }

  
  
  
  
  var fillPointerlockChangeEventData = (eventStruct) => {
      var pointerLockElement = document.pointerLockElement;
      var isPointerlocked = !!pointerLockElement;
      // Assigning a boolean to HEAP32 with expected type coercion.
      /** @suppress{checkTypes} */
      HEAP8[eventStruct] = isPointerlocked;
      var nodeName = JSEvents.getNodeNameForTarget(pointerLockElement);
      var id = pointerLockElement?.id ?? '';
      stringToUTF8(nodeName, eventStruct + 1, 128);
      stringToUTF8(id, eventStruct + 129, 128);
    };
  
  
  var registerPointerlockChangeEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      var eventSize = 257;
      JSEvents.pointerlockChangeEvent ||= _malloc(eventSize);
  
      var pointerlockChangeEventHandlerFunc = (e) => {
        var pointerlockChangeEvent = JSEvents.pointerlockChangeEvent;
        fillPointerlockChangeEventData(pointerlockChangeEvent);
  
        if (((a1, a2, a3) => getWasmTableEntry(callbackfunc).call(null, a1, BigInt(a2), BigInt(a3)))(eventTypeId, pointerlockChangeEvent, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target,
        eventTypeString,
        eventTypeId,
        userData,
        callbackfunc,
        handlerFunc: pointerlockChangeEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  
  
  function _emscripten_set_pointerlockchange_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    target = bigintToI53Checked(target);
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  
      if (!document.body?.requestPointerLock) {
        return -1;
      }
  
      target = findEventTarget(target);
      if (!target) return -4;
      return registerPointerlockChangeEventCallback(target, userData, useCapture, callbackfunc, 20, 'pointerlockchange', targetThread);
    ;
  }

  
  
  
  
  var registerUiEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      var eventSize = 36;
      JSEvents.uiEvent ||= _malloc(eventSize);
  
      target = findEventTarget(target);
  
      var uiEventHandlerFunc = (e) => {
        if (e.target != target) {
          // Never take ui events such as scroll via a 'bubbled' route, but always from the direct element that
          // was targeted. Otherwise e.g. if app logs a message in response to a page scroll, the Emscripten log
          // message box could cause to scroll, generating a new (bubbled) scroll message, causing a new log print,
          // causing a new scroll, etc..
          return;
        }
        var b = document.body; // Take document.body to a variable, Closure compiler does not outline access to it on its own.
        if (!b) {
          // During a page unload 'body' can be null, with "Cannot read property 'clientWidth' of null" being thrown
          return;
        }
        var uiEvent = JSEvents.uiEvent;
        HEAP32[((uiEvent)/4)] = 0; // always zero for resize and scroll
        HEAP32[(((uiEvent)+(4))/4)] = b.clientWidth;
        HEAP32[(((uiEvent)+(8))/4)] = b.clientHeight;
        HEAP32[(((uiEvent)+(12))/4)] = innerWidth;
        HEAP32[(((uiEvent)+(16))/4)] = innerHeight;
        HEAP32[(((uiEvent)+(20))/4)] = outerWidth;
        HEAP32[(((uiEvent)+(24))/4)] = outerHeight;
        HEAP32[(((uiEvent)+(28))/4)] = pageXOffset | 0; // scroll offsets are float
        HEAP32[(((uiEvent)+(32))/4)] = pageYOffset | 0;
        if (((a1, a2, a3) => getWasmTableEntry(callbackfunc).call(null, a1, BigInt(a2), BigInt(a3)))(eventTypeId, uiEvent, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target,
        eventTypeString,
        eventTypeId,
        userData,
        callbackfunc,
        handlerFunc: uiEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  
  function _emscripten_set_resize_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    target = bigintToI53Checked(target);
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  return registerUiEventCallback(target, userData, useCapture, callbackfunc, 10, 'resize', targetThread);
  }

  
  
  
  
  
  
  
  var registerTouchEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      var eventSize = 1552;
      JSEvents.touchEvent ||= _malloc(eventSize);
  
      target = findEventTarget(target);
  
      var touchEventHandlerFunc = (e) => {
        var t, touches = {}, et = e.touches;
        // To ease marshalling different kinds of touches that browser reports (all touches are listed in e.touches,
        // only changed touches in e.changedTouches, and touches on target at a.targetTouches), mark a boolean in
        // each Touch object so that we can later loop only once over all touches we see to marshall over to Wasm.
  
        for (let t of et) {
          // Browser might recycle the generated Touch objects between each frame (Firefox on Android), so reset any
          // changed/target states we may have set from previous frame.
          t.isChanged = t.onTarget = 0;
          touches[t.identifier] = t;
        }
        // Mark which touches are part of the changedTouches list.
        for (let t of e.changedTouches) {
          t.isChanged = 1;
          touches[t.identifier] = t;
        }
        // Mark which touches are part of the targetTouches list.
        for (let t of e.targetTouches) {
          touches[t.identifier].onTarget = 1;
        }
  
        var touchEvent = JSEvents.touchEvent;
        HEAPF64[((touchEvent)/8)] = e.timeStamp;
        HEAP8[touchEvent + 12] = e.ctrlKey;
        HEAP8[touchEvent + 13] = e.shiftKey;
        HEAP8[touchEvent + 14] = e.altKey;
        HEAP8[touchEvent + 15] = e.metaKey;
        var idx = touchEvent + 16;
        var targetRect = getBoundingClientRect(target);
        var numTouches = 0;
        for (let t of Object.values(touches)) {
          var idx32 = ((idx)/4); // Pre-shift the ptr to index to HEAP32 to save code size
          HEAP32[idx32 + 0] = t.identifier;
          HEAP32[idx32 + 1] = t.screenX;
          HEAP32[idx32 + 2] = t.screenY;
          HEAP32[idx32 + 3] = t.clientX;
          HEAP32[idx32 + 4] = t.clientY;
          HEAP32[idx32 + 5] = t.pageX;
          HEAP32[idx32 + 6] = t.pageY;
          HEAP8[idx + 28] = t.isChanged;
          HEAP8[idx + 29] = t.onTarget;
          HEAP32[idx32 + 8] = t.clientX - (targetRect.left | 0);
          HEAP32[idx32 + 9] = t.clientY - (targetRect.top  | 0);
  
          idx += 48;
  
          if (++numTouches > 31) {
            break;
          }
        }
        HEAP32[(((touchEvent)+(8))/4)] = numTouches;
  
        if (((a1, a2, a3) => getWasmTableEntry(callbackfunc).call(null, a1, BigInt(a2), BigInt(a3)))(eventTypeId, touchEvent, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target,
        allowsDeferredCalls: eventTypeString == 'touchstart' || eventTypeString == 'touchend',
        eventTypeString,
        eventTypeId,
        userData,
        callbackfunc,
        handlerFunc: touchEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  
  function _emscripten_set_touchcancel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    target = bigintToI53Checked(target);
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  return registerTouchEventCallback(target, userData, useCapture, callbackfunc, 25, 'touchcancel', targetThread);
  }

  
  function _emscripten_set_touchend_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    target = bigintToI53Checked(target);
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  return registerTouchEventCallback(target, userData, useCapture, callbackfunc, 23, 'touchend', targetThread);
  }

  
  function _emscripten_set_touchmove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    target = bigintToI53Checked(target);
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  return registerTouchEventCallback(target, userData, useCapture, callbackfunc, 24, 'touchmove', targetThread);
  }

  
  function _emscripten_set_touchstart_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    target = bigintToI53Checked(target);
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  return registerTouchEventCallback(target, userData, useCapture, callbackfunc, 22, 'touchstart', targetThread);
  }

  
  
  var fillVisibilityChangeEventData = (eventStruct) => {
      var visibilityStates = [ 'hidden', 'visible', 'prerender', 'unloaded' ];
      var visibilityState = visibilityStates.indexOf(document.visibilityState);
  
      // Assigning a boolean to HEAP32 with expected type coercion.
      /** @suppress{checkTypes} */
      HEAP8[eventStruct] = document.hidden;
      HEAP32[(((eventStruct)+(4))/4)] = visibilityState;
    };
  
  
  var registerVisibilityChangeEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      var eventSize = 8;
      JSEvents.visibilityChangeEvent ||= _malloc(eventSize);
  
      var visibilityChangeEventHandlerFunc = (e) => {
        var visibilityChangeEvent = JSEvents.visibilityChangeEvent;
        fillVisibilityChangeEventData(visibilityChangeEvent);
  
        if (((a1, a2, a3) => getWasmTableEntry(callbackfunc).call(null, a1, BigInt(a2), BigInt(a3)))(eventTypeId, visibilityChangeEvent, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target,
        eventTypeString,
        eventTypeId,
        userData,
        callbackfunc,
        handlerFunc: visibilityChangeEventHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  
  
  function _emscripten_set_visibilitychange_callback_on_thread(userData, useCapture, callbackfunc, targetThread) {
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  
    if (!specialHTMLTargets[1]) {
      return -4;
    }
      return registerVisibilityChangeEventCallback(specialHTMLTargets[1], userData, useCapture, callbackfunc, 21, 'visibilitychange', targetThread);
    ;
  }

  
  
  
  
  
  var registerWheelEventCallback = (target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) => {
      var eventSize = 96;
      JSEvents.wheelEvent ||= _malloc(eventSize)
  
      // The DOM Level 3 events spec event 'wheel'
      var wheelHandlerFunc = (e) => {
        var wheelEvent = JSEvents.wheelEvent;
        fillMouseEventData(wheelEvent, e, target);
        HEAPF64[(((wheelEvent)+(64))/8)] = e["deltaX"];
        HEAPF64[(((wheelEvent)+(72))/8)] = e["deltaY"];
        HEAPF64[(((wheelEvent)+(80))/8)] = e["deltaZ"];
        HEAP32[(((wheelEvent)+(88))/4)] = e["deltaMode"];
        if (((a1, a2, a3) => getWasmTableEntry(callbackfunc).call(null, a1, BigInt(a2), BigInt(a3)))(eventTypeId, wheelEvent, userData)) e.preventDefault();
      };
  
      var eventHandler = {
        target,
        allowsDeferredCalls: true,
        eventTypeString,
        eventTypeId,
        userData,
        callbackfunc,
        handlerFunc: wheelHandlerFunc,
        useCapture
      };
      return JSEvents.registerOrRemoveHandler(eventHandler);
    };
  
  
  function _emscripten_set_wheel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    target = bigintToI53Checked(target);
    userData = bigintToI53Checked(userData);
    callbackfunc = bigintToI53Checked(callbackfunc);
    targetThread = bigintToI53Checked(targetThread);
  
  
      target = findEventTarget(target);
      if (!target) return -4;
      if (typeof target.onwheel != 'undefined') {
        return registerWheelEventCallback(target, userData, useCapture, callbackfunc, 9, 'wheel', targetThread);
      } else {
        return -1;
      }
    ;
  }

  
  
  function _emscripten_set_window_title(title) {
    title = bigintToI53Checked(title);
  
  return document.title = UTF8ToString(title);
  }

  var _emscripten_sleep = () => {
      abort('Please compile your program with async support in order to use asynchronous operations like emscripten_sleep');
    };

  var ENV = {
  };
  
  var getExecutableName = () => thisProgram;
  var getEnvStrings = () => {
      if (!getEnvStrings.strings) {
        // Default values.
        var lang = (globalThis.navigator?.language ?? 'C').replace('-', '_') + '.UTF-8';
        var env = {
          'USER': 'web_user',
          'LOGNAME': 'web_user',
          'PATH': '/',
          'PWD': '/',
          'HOME': '/home/web_user',
          'LANG': lang,
          '_': getExecutableName()
        };
        // Apply the user-provided values, if any.
        for (var x in ENV) {
          // x is a key in ENV; if ENV[x] is undefined, that means it was
          // explicitly set to be so. We allow user code to do that to
          // force variables with default values to remain unset.
          if (ENV[x] === undefined) delete env[x];
          else env[x] = ENV[x];
        }
        var strings = [];
        for (var x in env) {
          strings.push(`${x}=${env[x]}`);
        }
        getEnvStrings.strings = strings;
      }
      return getEnvStrings.strings;
    };
  
  
  
  function _environ_get(__environ, environ_buf) {
    __environ = bigintToI53Checked(__environ);
    environ_buf = bigintToI53Checked(environ_buf);
  
  
      var bufSize = 0;
      var envp = 0;
      for (var string of getEnvStrings()) {
        var ptr = environ_buf + bufSize;
        HEAPU64[(((__environ)+(envp))/8)] = BigInt(ptr);
        bufSize += stringToUTF8(string, ptr, Infinity) + 1;
        envp += 8;
      }
      return 0;
    ;
  }

  
  
  
  function _environ_sizes_get(penviron_count, penviron_buf_size) {
    penviron_count = bigintToI53Checked(penviron_count);
    penviron_buf_size = bigintToI53Checked(penviron_buf_size);
  
  
      var strings = getEnvStrings();
      HEAPU64[((penviron_count)/8)] = BigInt(strings.length);
      var bufSize = 0;
      for (var string of strings) {
        bufSize += lengthBytesUTF8(string) + 1;
      }
      HEAPU64[((penviron_buf_size)/8)] = BigInt(bufSize);
      return 0;
    ;
  }


  function _fd_close(fd) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.close(stream);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  }
  

  
  /** @param {number=} offset */
  var doReadv = (stream, iov, iovcnt, offset) => {
      var ret = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = Number(HEAPU64[((iov)/8)]);
        var len = Number(HEAPU64[(((iov)+(8))/8)]);
        iov += 16;
        try {
          var curr = FS.read(stream, HEAP8, ptr, len, offset);
        } catch (e) {
          // On a non-blocking stream a subsequent read may would-block after we
          // already gathered data. POSIX readv is a single gather-read: return
          // what we have rather than failing the whole call.
          if (ret > 0 && e instanceof FS.ErrnoError &&
              (e.errno == 6 || e.errno == 6)) {
            break;
          }
          throw e;
        }
        if (curr < 0) return -1;
        ret += curr;
        if (curr < len) break; // nothing more to read
        if (typeof offset != 'undefined') {
          offset += curr;
        }
      }
      return ret;
    };
  
  
  
  function _fd_pread(fd, iov, iovcnt, offset, pnum) {
    iov = bigintToI53Checked(iov);
    iovcnt = bigintToI53Checked(iovcnt);
    offset = bigintToI53Checked(offset);
    pnum = bigintToI53Checked(pnum);
  
  
  try {
  
      if (isNaN(offset)) return 22;
      var stream = SYSCALLS.getStreamFromFD(fd)
      var num = doReadv(stream, iov, iovcnt, offset);
      HEAPU64[((pnum)/8)] = BigInt(num);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  ;
  }

  
  
  
  function _fd_read(fd, iov, iovcnt, pnum) {
    iov = bigintToI53Checked(iov);
    iovcnt = bigintToI53Checked(iovcnt);
    pnum = bigintToI53Checked(pnum);
  
  
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = doReadv(stream, iov, iovcnt);
      HEAPU64[((pnum)/8)] = BigInt(num);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  ;
  }

  
  
  function _fd_seek(fd, offset, whence, newOffset) {
    offset = bigintToI53Checked(offset);
    newOffset = bigintToI53Checked(newOffset);
  
  
  try {
  
      if (isNaN(offset)) return 22;
      var stream = SYSCALLS.getStreamFromFD(fd);
      FS.llseek(stream, offset, whence);
      HEAP64[((newOffset)/8)] = BigInt(stream.position);
      if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null; // reset readdir state
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  ;
  }

  function _fd_sync(fd) {
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var rtn = stream.stream_ops?.fsync?.(stream);
      return rtn;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  }
  

  
  
  /** @param {number=} offset */
  var doWritev = (stream, iov, iovcnt, offset) => {
      // Gather all iovecs into one contiguous buffer and issue a single
      // FS.write, matching POSIX writev's single gather-write semantics (as
      // __syscall_sendmsg already does). Per-iovec writes fragment a stream
      // socket send into multiple segments, breaking stream byte semantics.
      if (iovcnt == 1) {
        // Single iovec: write directly from HEAP8, no gather buffer needed.
        return FS.write(stream, HEAP8, Number(HEAPU64[((iov)/8)]), Number(HEAPU64[(((iov)+(8))/8)]), offset);
      }
      var total = 0;
      for (var i = 0, p = iov; i < iovcnt; i++, p += 16) {
        total += Number(HEAPU64[(((p)+(8))/8)]);
      }
      var view = new Uint8Array(total);
      var voff = 0;
      for (var i = 0; i < iovcnt; i++, iov += 16) {
        var ptr = Number(HEAPU64[((iov)/8)]);
        var len = Number(HEAPU64[(((iov)+(8))/8)]);
        view.set(HEAPU8.subarray(ptr, ptr + len), voff);
        voff += len;
      }
      return FS.write(stream, view, 0, total, offset);
    };
  
  
  
  function _fd_write(fd, iov, iovcnt, pnum) {
    iov = bigintToI53Checked(iov);
    iovcnt = bigintToI53Checked(iovcnt);
    pnum = bigintToI53Checked(pnum);
  
  
  try {
  
      var stream = SYSCALLS.getStreamFromFD(fd);
      var num = doWritev(stream, iov, iovcnt);
      HEAPU64[((pnum)/8)] = BigInt(num);
      return 0;
    } catch (e) {
    if (typeof FS == 'undefined' || !(e.name === 'ErrnoError')) throw e;
    return e.errno;
  }
  ;
  }

  var _glActiveTexture = _emscripten_glActiveTexture;

  var _glAttachShader = _emscripten_glAttachShader;

  var _glBindAttribLocation = _emscripten_glBindAttribLocation;

  var _glBindBuffer = _emscripten_glBindBuffer;

  var _glBindTexture = _emscripten_glBindTexture;


  var _glBlendEquation = _emscripten_glBlendEquation;

  var _glBlendFunc = _emscripten_glBlendFunc;

  var _glBufferData = _emscripten_glBufferData;

  var _glBufferSubData = _emscripten_glBufferSubData;

  var _glCompileShader = _emscripten_glCompileShader;

  var _glCreateProgram = _emscripten_glCreateProgram;

  var _glCreateShader = _emscripten_glCreateShader;

  var _glDeleteBuffers = _emscripten_glDeleteBuffers;

  var _glDeleteProgram = _emscripten_glDeleteProgram;

  var _glDeleteShader = _emscripten_glDeleteShader;

  var _glDeleteTextures = _emscripten_glDeleteTextures;


  var _glDisable = _emscripten_glDisable;


  var _glEnable = _emscripten_glEnable;

  var _glEnableVertexAttribArray = _emscripten_glEnableVertexAttribArray;

  var _glGenBuffers = _emscripten_glGenBuffers;

  var _glGenTextures = _emscripten_glGenTextures;


  var _glGetBufferParameteriv = _emscripten_glGetBufferParameteriv;

  var _glGetError = _emscripten_glGetError;

  var _glGetProgramInfoLog = _emscripten_glGetProgramInfoLog;

  var _glGetProgramiv = _emscripten_glGetProgramiv;

  var _glGetShaderInfoLog = _emscripten_glGetShaderInfoLog;

  var _glGetShaderiv = _emscripten_glGetShaderiv;

  var _glGetString = _emscripten_glGetString;

  var _glGetUniformLocation = _emscripten_glGetUniformLocation;

  var _glLinkProgram = _emscripten_glLinkProgram;

  var _glScissor = _emscripten_glScissor;

  var _glShaderSource = _emscripten_glShaderSource;

  var _glStencilFunc = _emscripten_glStencilFunc;

  var _glStencilMask = _emscripten_glStencilMask;

  var _glStencilOp = _emscripten_glStencilOp;

  var _glTexImage2D = _emscripten_glTexImage2D;

  var _glTexParameteri = _emscripten_glTexParameteri;

  var _glUniform1i = _emscripten_glUniform1i;

  var _glUniform2f = _emscripten_glUniform2f;

  var _glUniform4fv = _emscripten_glUniform4fv;

  var _glUniformMatrix4fv = _emscripten_glUniformMatrix4fv;

  var _glUseProgram = _emscripten_glUseProgram;

  var _glVertexAttribPointer = _emscripten_glVertexAttribPointer;

  var _glViewport = _emscripten_glViewport;


  
  
  function _random_get(buffer, size) {
    buffer = bigintToI53Checked(buffer);
    size = bigintToI53Checked(size);
  
  return randomFill(HEAPU8.subarray(buffer, buffer + size));
  }



  var autoResumeAudioContext = (ctx) => {
      for (var event of ['keydown', 'mousedown', 'touchstart']) {
        for (var element of [document, document.getElementById('canvas')]) {
          element?.addEventListener(event, () => {
            if (ctx.state === 'suspended') ctx.resume();
          }, { 'once': true });
        }
      }
    };

  var dynCall = (sig, ptr, args = [], promising = false) => {
      // With MEMORY64 we have an additional step to convert `p` arguments to
      // bigint. This is the runtime equivalent of the wrappers we create for wasm
      // exports in `emscripten.py:create_wasm64_wrappers`.
      for (var i = 1; i < sig.length; ++i) {
        if (sig[i] == 'p') args[i-1] = BigInt(args[i-1]);
      }
      var func = getWasmTableEntry(ptr);
      var rtn = func(...args);
  
      function convert(rtn) {
        return sig[0] == 'p' ? Number(rtn) : rtn;
      }
  
      return convert(rtn);
    };







  
  
  
  
  
  
  
    /**
   * @param {number} ptr
   * @param {number} value
   * @param {string} type
   */
  function setValue(ptr, value, type = 'i8') {
    if (type.endsWith('*')) type = '*';
    switch (type) {
      case 'i1': HEAP8[ptr] = value; break;
      case 'i8': HEAP8[ptr] = value; break;
      case 'i16': HEAP16[((ptr)/2)] = value; break;
      case 'i32': HEAP32[((ptr)/4)] = value; break;
      case 'i64': HEAP64[((ptr)/8)] = BigInt(value); break;
      case 'float': HEAPF32[((ptr)/4)] = value; break;
      case 'double': HEAPF64[((ptr)/8)] = value; break;
      case '*': HEAPU64[((ptr)/8)] = BigInt(value); break;
      default: abort(`invalid type for setValue: ${type}`);
    }
  }





  var getCFunc = (ident) => {
      var func = Module['_' + ident]; // closure exported function
      return func;
    };
  
  var writeArrayToMemory = (array, buffer) => {
      HEAP8.set(array, buffer);
    };
  
  
  
  
  
  
    /**
   * @param {string|null=} returnType
   * @param {Array=} argTypes
   * @param {Array=} args
   * @param {Object=} opts
   */
  var ccall = (ident, returnType, argTypes, args, opts) => {
      // For fast lookup of conversion functions
      var toC = {
        'pointer': (p) => BigInt(p),
        'string': (str) => {
          var ret = 0;
          if (str !== null && str !== undefined && str !== 0) { // null string
            ret = stringToUTF8OnStack(str);
          }
          return BigInt(ret);
        },
        'array': (arr) => {
          var ret = stackAlloc(arr.length);
          writeArrayToMemory(arr, ret);
          return BigInt(ret);
        }
      };
  
      function convertReturnValue(ret) {
        if (returnType === 'string') {
          return UTF8ToString(Number(ret));
        }
        if (returnType === 'pointer') return Number(ret);
        if (returnType === 'boolean') return Boolean(ret);
        return ret;
      }
  
      var func = getCFunc(ident);
      var cArgs = [];
      var stack = 0;
      if (args) {
        for (var i = 0; i < args.length; i++) {
          var converter = toC[argTypes[i]];
          if (converter) {
            if (stack === 0) stack = stackSave();
            cArgs[i] = converter(args[i]);
          } else {
            cArgs[i] = args[i];
          }
        }
      }
      var ret = func(...cArgs);
      function onDone(ret) {
        if (stack !== 0) stackRestore(stack);
        return convertReturnValue(ret);
      }
  
      ret = onDone(ret);
      return ret;
    };

  
  
    /**
   * @param {string=} returnType
   * @param {Array=} argTypes
   * @param {Object=} opts
   */
  var cwrap = (ident, returnType, argTypes, opts) => {
      // When the function takes numbers and returns a number, we can just return
      // the original function
      var numericArgs = !argTypes || argTypes.every((type) => type === 'number' || type === 'boolean');
      var numericRet = returnType !== 'string';
      if (numericRet && numericArgs && !opts) {
        return getCFunc(ident);
      }
      return (...args) => ccall(ident, returnType, argTypes, args, opts);
    };



  var FS_createPath = (...args) => FS.createPath(...args);



  var FS_unlink = (...args) => FS.unlink(...args);

  var FS_createLazyFile = (...args) => FS.createLazyFile(...args);

  var FS_createDevice = (...args) => FS.createDevice(...args);



  var createContext = Browser.createContext;

  FS.createPreloadedFile = FS_createPreloadedFile;
  FS.preloadFile = FS_preloadFile;
  FS.staticInit();;

      Module['requestAnimationFrame'] = MainLoop.requestAnimationFrame;
      Module['pauseMainLoop'] = MainLoop.pause;
      Module['resumeMainLoop'] = MainLoop.resume;
      MainLoop.init();;
for (let i = 0; i < 32; ++i) tempFixedLengthArray.push(new Array(i));;
// End JS library code

// include: postlibrary.js
// This file is included after the automatically-generated JS library code
// but before the wasm module is created.

{

  // Begin ATMODULES hooks
  if (Module['noExitRuntime']) noExitRuntime = Module['noExitRuntime'];

if (Module['print']) out = Module['print'];
if (Module['printErr']) err = Module['printErr'];
  // End ATMODULES hooks

  if (Module['arguments']) programArgs = Module['arguments'];
  if (Module['thisProgram']) thisProgram = Module['thisProgram'];

  var preInit = Module['preInit'];
  if (preInit) {
    if (typeof preInit == 'function') Module['preInit'] = preInit = [preInit];
    // Written as a loop so that preInit functions that themselves add more
    // preInit functions.  Is this actually needed?
    while (preInit.length > 0) {
      preInit.shift()();
    }
  }
}

// Begin runtime exports
  Module['addRunDependency'] = addRunDependency;
  Module['removeRunDependency'] = removeRunDependency;
  Module['ccall'] = ccall;
  Module['cwrap'] = cwrap;
  Module['UTF8ToString'] = UTF8ToString;
  Module['createContext'] = createContext;
  Module['FS_preloadFile'] = FS_preloadFile;
  Module['FS_unlink'] = FS_unlink;
  Module['FS_createPath'] = FS_createPath;
  Module['FS_createDevice'] = FS_createDevice;
  Module['FS_createDataFile'] = FS_createDataFile;
  Module['FS_createLazyFile'] = FS_createLazyFile;
  // End runtime exports
  // Begin JS library exports
  // End JS library exports

// end include: postlibrary.js

var ASM_CONSTS = {
  2037128: ($0) => { console.error(UTF8ToString(Number($0))); },  
 2037173: () => { return navigator.hardwareConcurrency || 1; },  
 2037220: () => { if (typeof(AudioContext) !== 'undefined') { return true; } else if (typeof(webkitAudioContext) !== 'undefined') { return true; } return false; },  
 2037367: () => { if ((typeof(navigator.mediaDevices) !== 'undefined') && (typeof(navigator.mediaDevices.getUserMedia) !== 'undefined')) { return true; } else if (typeof(navigator.webkitGetUserMedia) !== 'undefined') { return true; } return false; },  
 2037601: ($0) => { if(typeof(Module['SDL2']) === 'undefined') { Module['SDL2'] = {}; } var SDL2 = Module['SDL2']; if (!$0) { SDL2.audio = {}; } else { SDL2.capture = {}; } if (!SDL2.audioContext) { if (typeof(AudioContext) !== 'undefined') { SDL2.audioContext = new AudioContext(); } else if (typeof(webkitAudioContext) !== 'undefined') { SDL2.audioContext = new webkitAudioContext(); } if (SDL2.audioContext) { if ((typeof navigator.userActivation) === 'undefined') { autoResumeAudioContext(SDL2.audioContext); } } } return SDL2.audioContext === undefined ? -1 : 0; },  
 2038153: () => { var SDL2 = Module['SDL2']; return SDL2.audioContext.sampleRate; },  
 2038221: ($0, $1, $2, $3) => { var SDL2 = Module['SDL2']; var have_microphone = function(stream) { if (SDL2.capture.silenceTimer !== undefined) { clearInterval(SDL2.capture.silenceTimer); SDL2.capture.silenceTimer = undefined; SDL2.capture.silenceBuffer = undefined } SDL2.capture.mediaStreamNode = SDL2.audioContext.createMediaStreamSource(stream); SDL2.capture.scriptProcessorNode = SDL2.audioContext.createScriptProcessor($1, $0, 1); SDL2.capture.scriptProcessorNode.onaudioprocess = function(audioProcessingEvent) { if ((SDL2 === undefined) || (SDL2.capture === undefined)) { return; } audioProcessingEvent.outputBuffer.getChannelData(0).fill(0.0); SDL2.capture.currentCaptureBuffer = audioProcessingEvent.inputBuffer; dynCall('vp', $2, [$3]); }; SDL2.capture.mediaStreamNode.connect(SDL2.capture.scriptProcessorNode); SDL2.capture.scriptProcessorNode.connect(SDL2.audioContext.destination); SDL2.capture.stream = stream; }; var no_microphone = function(error) { }; SDL2.capture.silenceBuffer = SDL2.audioContext.createBuffer($0, $1, SDL2.audioContext.sampleRate); SDL2.capture.silenceBuffer.getChannelData(0).fill(0.0); var silence_callback = function() { SDL2.capture.currentCaptureBuffer = SDL2.capture.silenceBuffer; dynCall('vp', $2, [$3]); }; SDL2.capture.silenceTimer = setInterval(silence_callback, ($1 / SDL2.audioContext.sampleRate) * 1000); if ((navigator.mediaDevices !== undefined) && (navigator.mediaDevices.getUserMedia !== undefined)) { navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(have_microphone).catch(no_microphone); } else if (navigator.webkitGetUserMedia !== undefined) { navigator.webkitGetUserMedia({ audio: true, video: false }, have_microphone, no_microphone); } },  
 2039914: ($0, $1, $2, $3) => { var SDL2 = Module['SDL2']; SDL2.audio.scriptProcessorNode = SDL2.audioContext['createScriptProcessor']($1, 0, $0); SDL2.audio.scriptProcessorNode['onaudioprocess'] = function (e) { if ((SDL2 === undefined) || (SDL2.audio === undefined)) { return; } if (SDL2.audio.silenceTimer !== undefined) { clearInterval(SDL2.audio.silenceTimer); SDL2.audio.silenceTimer = undefined; SDL2.audio.silenceBuffer = undefined; } SDL2.audio.currentOutputBuffer = e['outputBuffer']; dynCall('vp', $2, [$3]); }; SDL2.audio.scriptProcessorNode['connect'](SDL2.audioContext['destination']); if (SDL2.audioContext.state === 'suspended') { SDL2.audio.silenceBuffer = SDL2.audioContext.createBuffer($0, $1, SDL2.audioContext.sampleRate); SDL2.audio.silenceBuffer.getChannelData(0).fill(0.0); var silence_callback = function() { if ((typeof navigator.userActivation) !== 'undefined') { if (navigator.userActivation.hasBeenActive) { SDL2.audioContext.resume(); } } SDL2.audio.currentOutputBuffer = SDL2.audio.silenceBuffer; dynCall('vp', $2, [$3]); SDL2.audio.currentOutputBuffer = undefined; }; SDL2.audio.silenceTimer = setInterval(silence_callback, ($1 / SDL2.audioContext.sampleRate) * 1000); } },  
 2041089: ($0, $1) => { var SDL2 = Module['SDL2']; var numChannels = SDL2.capture.currentCaptureBuffer.numberOfChannels; for (var c = 0; c < numChannels; ++c) { var channelData = SDL2.capture.currentCaptureBuffer.getChannelData(c); if (channelData.length != $1) { throw 'Web Audio capture buffer length mismatch! Destination size: ' + channelData.length + ' samples vs expected ' + $1 + ' samples!'; } if (numChannels == 1) { for (var j = 0; j < $1; ++j) { setValue($0 + (j * 4), channelData[j], 'float'); } } else { for (var j = 0; j < $1; ++j) { setValue($0 + (((j * numChannels) + c) * 4), channelData[j], 'float'); } } } },  
 2041694: ($0, $1) => { var SDL2 = Module['SDL2']; var buf = $0 / 4; var numChannels = SDL2.audio.currentOutputBuffer['numberOfChannels']; for (var c = 0; c < numChannels; ++c) { var channelData = SDL2.audio.currentOutputBuffer['getChannelData'](c); if (channelData.length != $1) { throw 'Web Audio output buffer length mismatch! Destination size: ' + channelData.length + ' samples vs expected ' + $1 + ' samples!'; } for (var j = 0; j < $1; ++j) { channelData[j] = HEAPF32[buf + (j*numChannels + c)]; } } },  
 2042181: ($0) => { var SDL2 = Module['SDL2']; if ($0) { if (SDL2.capture.silenceTimer !== undefined) { clearInterval(SDL2.capture.silenceTimer); } if (SDL2.capture.stream !== undefined) { var tracks = SDL2.capture.stream.getAudioTracks(); for (var i = 0; i < tracks.length; i++) { SDL2.capture.stream.removeTrack(tracks[i]); } } if (SDL2.capture.scriptProcessorNode !== undefined) { SDL2.capture.scriptProcessorNode.onaudioprocess = function(audioProcessingEvent) {}; SDL2.capture.scriptProcessorNode.disconnect(); } if (SDL2.capture.mediaStreamNode !== undefined) { SDL2.capture.mediaStreamNode.disconnect(); } SDL2.capture = undefined; } else { if (SDL2.audio.scriptProcessorNode != undefined) { SDL2.audio.scriptProcessorNode.disconnect(); } if (SDL2.audio.silenceTimer !== undefined) { clearInterval(SDL2.audio.silenceTimer); } SDL2.audio = undefined; } if ((SDL2.audioContext !== undefined) && (SDL2.audio === undefined) && (SDL2.capture === undefined)) { SDL2.audioContext.close(); SDL2.audioContext = undefined; } },  
 2043187: ($0, $1, $2) => { var w = $0; var h = $1; var pixels = $2; if (!Module['SDL2']) Module['SDL2'] = {}; var SDL2 = Module['SDL2']; if (SDL2.ctxCanvas !== Module['canvas']) { SDL2.ctx = Browser.createContext(Module['canvas'], false, true); SDL2.ctxCanvas = Module['canvas']; } if (SDL2.w !== w || SDL2.h !== h || SDL2.imageCtx !== SDL2.ctx) { SDL2.image = SDL2.ctx.createImageData(w, h); SDL2.w = w; SDL2.h = h; SDL2.imageCtx = SDL2.ctx; } var data = SDL2.image.data; var src = pixels / 4; var dst = 0; var num; if (typeof CanvasPixelArray !== 'undefined' && data instanceof CanvasPixelArray) { num = data.length; while (dst < num) { var val = HEAP32[src]; data[dst ] = val & 0xff; data[dst+1] = (val >> 8) & 0xff; data[dst+2] = (val >> 16) & 0xff; data[dst+3] = 0xff; src++; dst += 4; } } else { if (SDL2.data32Data !== data) { SDL2.data32 = new Int32Array(data.buffer); SDL2.data8 = new Uint8Array(data.buffer); SDL2.data32Data = data; } var data32 = SDL2.data32; num = data32.length; data32.set(HEAP32.subarray(src, src + num)); var data8 = SDL2.data8; var i = 3; var j = i + 4*num; if (num % 8 == 0) { while (i < j) { data8[i] = 0xff; i = i + 4 | 0; data8[i] = 0xff; i = i + 4 | 0; data8[i] = 0xff; i = i + 4 | 0; data8[i] = 0xff; i = i + 4 | 0; data8[i] = 0xff; i = i + 4 | 0; data8[i] = 0xff; i = i + 4 | 0; data8[i] = 0xff; i = i + 4 | 0; data8[i] = 0xff; i = i + 4 | 0; } } else { while (i < j) { data8[i] = 0xff; i = i + 4 | 0; } } } SDL2.ctx.putImageData(SDL2.image, 0, 0); },  
 2044653: ($0, $1, $2, $3, $4) => { var w = $0; var h = $1; var hot_x = $2; var hot_y = $3; var pixels = $4; var canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h; var ctx = canvas.getContext("2d"); var image = ctx.createImageData(w, h); var data = image.data; var src = pixels / 4; var dst = 0; var num; if (typeof CanvasPixelArray !== 'undefined' && data instanceof CanvasPixelArray) { num = data.length; while (dst < num) { var val = HEAP32[src]; data[dst ] = val & 0xff; data[dst+1] = (val >> 8) & 0xff; data[dst+2] = (val >> 16) & 0xff; data[dst+3] = (val >> 24) & 0xff; src++; dst += 4; } } else { var data32 = new Int32Array(data.buffer); num = data32.length; data32.set(HEAP32.subarray(src, src + num)); } ctx.putImageData(image, 0, 0); var url = hot_x === 0 && hot_y === 0 ? "url(" + canvas.toDataURL() + "), auto" : "url(" + canvas.toDataURL() + ") " + hot_x + " " + hot_y + ", auto"; var urlBuf = _malloc(url.length + 1); stringToUTF8(url, urlBuf, url.length + 1); return urlBuf; },  
 2045641: ($0) => { if (Module['canvas']) { Module['canvas'].style['cursor'] = UTF8ToString($0); } },  
 2045724: () => { if (Module['canvas']) { Module['canvas'].style['cursor'] = 'none'; } },  
 2045793: () => { return window.innerWidth; },  
 2045823: () => { return window.innerHeight; }
};
function SlateWasmCanvasWidth() { const Canvas = Module['canvas']; return (Canvas && Canvas.width) ? Canvas.width : 640; }
function SlateWasmCanvasHeight() { const Canvas = Module['canvas']; return (Canvas && Canvas.height) ? Canvas.height : 360; }
function ReportLine(Label,Value,bOk) { const label = UTF8ToString(Number(Label)); const value = UTF8ToString(Number(Value)); if (typeof globalThis.slateWasmReport === 'function') { globalThis.slateWasmReport(label, value, !!bOk); } else { console.log((bOk ? 'ok   ' : 'FAIL ') + label + ': ' + value); } }

// Imports from the Wasm binary.
var _malloc,
  _realloc,
  _Studio_AllocDoc,
  _Studio_LoadDocFromBuffer,
  _Studio_LastErrorPtr,
  _Studio_LastErrorLen,
  _Studio_WidgetCount,
  _Studio_HitTest,
  _Studio_GeomX,
  _Studio_GeomY,
  _Studio_GeomW,
  _Studio_GeomH,
  _GetStudioFrameCount,
  _Studio_GetRects,
  _Studio_SetEditMode,
  _Studio_Resize,
  _RunStudioProbe,
  _RunCoreProbe,
  _main,
  _emscripten_builtin_memalign,
  _setThrew,
  __emscripten_stack_restore,
  __emscripten_stack_alloc,
  _emscripten_stack_get_current,
  memory,
  __indirect_function_table,
  wasmMemory,
  wasmTable;


function assignWasmExports(wasmExports) {
  _malloc = wasmExports['malloc'];
  _realloc = wasmExports['realloc'];
  _Studio_AllocDoc = Module['_Studio_AllocDoc'] = wasmExports['Studio_AllocDoc'];
  _Studio_LoadDocFromBuffer = Module['_Studio_LoadDocFromBuffer'] = wasmExports['Studio_LoadDocFromBuffer'];
  _Studio_LastErrorPtr = Module['_Studio_LastErrorPtr'] = wasmExports['Studio_LastErrorPtr'];
  _Studio_LastErrorLen = Module['_Studio_LastErrorLen'] = wasmExports['Studio_LastErrorLen'];
  _Studio_WidgetCount = Module['_Studio_WidgetCount'] = wasmExports['Studio_WidgetCount'];
  _Studio_HitTest = Module['_Studio_HitTest'] = wasmExports['Studio_HitTest'];
  _Studio_GeomX = Module['_Studio_GeomX'] = wasmExports['Studio_GeomX'];
  _Studio_GeomY = Module['_Studio_GeomY'] = wasmExports['Studio_GeomY'];
  _Studio_GeomW = Module['_Studio_GeomW'] = wasmExports['Studio_GeomW'];
  _Studio_GeomH = Module['_Studio_GeomH'] = wasmExports['Studio_GeomH'];
  _GetStudioFrameCount = Module['_GetStudioFrameCount'] = wasmExports['GetStudioFrameCount'];
  _Studio_GetRects = Module['_Studio_GetRects'] = wasmExports['Studio_GetRects'];
  _Studio_SetEditMode = Module['_Studio_SetEditMode'] = wasmExports['Studio_SetEditMode'];
  _Studio_Resize = Module['_Studio_Resize'] = wasmExports['Studio_Resize'];
  _RunStudioProbe = Module['_RunStudioProbe'] = wasmExports['RunStudioProbe'];
  _RunCoreProbe = Module['_RunCoreProbe'] = wasmExports['RunCoreProbe'];
  _main = Module['_main'] = wasmExports['main'];
  _emscripten_builtin_memalign = wasmExports['emscripten_builtin_memalign'];
  _setThrew = wasmExports['setThrew'];
  __emscripten_stack_restore = wasmExports['_emscripten_stack_restore'];
  __emscripten_stack_alloc = wasmExports['_emscripten_stack_alloc'];
  _emscripten_stack_get_current = wasmExports['emscripten_stack_get_current'];
  memory = wasmMemory = wasmExports['memory'];
  __indirect_function_table = wasmTable = wasmExports['__indirect_function_table'];
}

var wasmImports = {
  /** @export */
  ReportLine,
  /** @export */
  SlateWasmCanvasHeight,
  /** @export */
  SlateWasmCanvasWidth,
  /** @export */
  _Z10StaticEnumI13EUINavigationEP5UEnumv: __Z10StaticEnumI13EUINavigationEP5UEnumv,
  /** @export */
  _Z10StaticEnumI18ENavigationGenesisEP5UEnumv: __Z10StaticEnumI18ENavigationGenesisEP5UEnumv,
  /** @export */
  _Z10StaticEnumI25ESlateDebuggingFocusEventEP5UEnumv: __Z10StaticEnumI25ESlateDebuggingFocusEventEP5UEnumv,
  /** @export */
  _Z10StaticEnumI25ESlateDebuggingInputEventEP5UEnumv: __Z10StaticEnumI25ESlateDebuggingInputEventEP5UEnumv,
  /** @export */
  _Z10StaticEnumI28EOverriddenPropertyOperationEP5UEnumv: __Z10StaticEnumI28EOverriddenPropertyOperationEP5UEnumv,
  /** @export */
  _Z10StaticEnumI31ESlateDebuggingNavigationMethodEP5UEnumv: __Z10StaticEnumI31ESlateDebuggingNavigationMethodEP5UEnumv,
  /** @export */
  _Z10StaticEnumIN12EMouseCursor4TypeEEP5UEnumv: __Z10StaticEnumIN12EMouseCursor4TypeEEP5UEnumv,
  /** @export */
  _Z42Z_Construct_UScriptStruct_FInstancedStruct19ETypeConstructPhase: __Z42Z_Construct_UScriptStruct_FInstancedStruct19ETypeConstructPhase,
  /** @export */
  _Z43Z_Construct_UScriptStruct_FNavigationMethod19ETypeConstructPhase: __Z43Z_Construct_UScriptStruct_FNavigationMethod19ETypeConstructPhase,
  /** @export */
  _Z67Z_Construct_UScriptStruct_FTestUninitializedScriptStructMembersTest19ETypeConstructPhase: __Z67Z_Construct_UScriptStruct_FTestUninitializedScriptStructMembersTest19ETypeConstructPhase,
  /** @export */
  _ZN10SLinkedBox9ConstructERKNS_10FArgumentsE10TSharedRefI17FLinkedBoxManagerL7ESPMode1EE: __ZN10SLinkedBox9ConstructERKNS_10FArgumentsE10TSharedRefI17FLinkedBoxManagerL7ESPMode1EE,
  /** @export */
  _ZN10SLinkedBoxC1Ev: __ZN10SLinkedBoxC1Ev,
  /** @export */
  _ZN10SLinkedBoxD1Ev: __ZN10SLinkedBoxD1Ev,
  /** @export */
  _ZN10UInterfaceC1ERK18FObjectInitializer: __ZN10UInterfaceC1ERK18FObjectInitializer,
  /** @export */
  _ZN14IPluginManager3GetEv: __ZN14IPluginManager3GetEv,
  /** @export */
  _ZN17FLinkedBoxManagerC1Ev: __ZN17FLinkedBoxManagerC1Ev,
  /** @export */
  _ZN17FLinkedBoxManagerD1Ev: __ZN17FLinkedBoxManagerD1Ev,
  /** @export */
  _ZN21FOodleDataCompression10DecompressEPvxPKvx: __ZN21FOodleDataCompression10DecompressEPvxPKvx,
  /** @export */
  _ZN21FOodleDataCompression39CompressionFormatInitOnFirstUseFromLockEv: __ZN21FOodleDataCompression39CompressionFormatInitOnFirstUseFromLockEv,
  /** @export */
  _ZN28FEmscriptenPlatformStackWalk27CaptureThreadStackBackTraceEyPyjPv: __ZN28FEmscriptenPlatformStackWalk27CaptureThreadStackBackTraceEyPyjPv,
  /** @export */
  _ZN2UE13PluginManager7Private27SetCoreUObjectPluginManagerERNS1_25ICoreUObjectPluginManagerE: __ZN2UE13PluginManager7Private27SetCoreUObjectPluginManagerERNS1_25ICoreUObjectPluginManagerE,
  /** @export */
  _ZN2UE13PreciseFPHashEd: __ZN2UE13PreciseFPHashEd,
  /** @export */
  _ZN2UE13PreciseFPHashEf: __ZN2UE13PreciseFPHashEf,
  /** @export */
  _ZN2UE14PreciseFPEqualEdd: __ZN2UE14PreciseFPEqualEdd,
  /** @export */
  _ZN2UE14PreciseFPEqualEff: __ZN2UE14PreciseFPEqualEff,
  /** @export */
  _ZN2UE5SlatelsER8FArchiveRNS0_25FPreprocessedFontGeometryE: __ZN2UE5SlatelsER8FArchiveRNS0_25FPreprocessedFontGeometryE,
  /** @export */
  _ZN4FApp24GetEpicProductIdentifierEv: __ZN4FApp24GetEpicProductIdentifierEv,
  /** @export */
  _ZN9UFunctionD0Ev: __ZN9UFunctionD0Ev,
  /** @export */
  _ZN9UFunctionD1Ev: __ZN9UFunctionD1Ev,
  /** @export */
  _ZNK2UE5Slate25FPreprocessedFontGeometry16GetAllocatedSizeEv: __ZNK2UE5Slate25FPreprocessedFontGeometry16GetAllocatedSizeEv,
  /** @export */
  __call_sighandler: ___call_sighandler,
  /** @export */
  __syscall_chmod: ___syscall_chmod,
  /** @export */
  __syscall_faccessat: ___syscall_faccessat,
  /** @export */
  __syscall_fcntl64: ___syscall_fcntl64,
  /** @export */
  __syscall_fdatasync: ___syscall_fdatasync,
  /** @export */
  __syscall_fstat64: ___syscall_fstat64,
  /** @export */
  __syscall_ftruncate64: ___syscall_ftruncate64,
  /** @export */
  __syscall_getdents64: ___syscall_getdents64,
  /** @export */
  __syscall_ioctl: ___syscall_ioctl,
  /** @export */
  __syscall_lstat64: ___syscall_lstat64,
  /** @export */
  __syscall_mkdirat: ___syscall_mkdirat,
  /** @export */
  __syscall_newfstatat: ___syscall_newfstatat,
  /** @export */
  __syscall_openat: ___syscall_openat,
  /** @export */
  __syscall_poll: ___syscall_poll,
  /** @export */
  __syscall_renameat: ___syscall_renameat,
  /** @export */
  __syscall_rmdir: ___syscall_rmdir,
  /** @export */
  __syscall_stat64: ___syscall_stat64,
  /** @export */
  __syscall_unlinkat: ___syscall_unlinkat,
  /** @export */
  __syscall_utimensat: ___syscall_utimensat,
  /** @export */
  _abort_js: __abort_js,
  /** @export */
  _emscripten_log_formatted: __emscripten_log_formatted,
  /** @export */
  _emscripten_runtime_keepalive_clear: __emscripten_runtime_keepalive_clear,
  /** @export */
  _emscripten_throw_longjmp: __emscripten_throw_longjmp,
  /** @export */
  _gmtime_js: __gmtime_js,
  /** @export */
  _localtime_js: __localtime_js,
  /** @export */
  _mmap_js: __mmap_js,
  /** @export */
  _munmap_js: __munmap_js,
  /** @export */
  _tzset_js: __tzset_js,
  /** @export */
  clock_time_get: _clock_time_get,
  /** @export */
  eglBindAPI: _eglBindAPI,
  /** @export */
  eglChooseConfig: _eglChooseConfig,
  /** @export */
  eglCreateContext: _eglCreateContext,
  /** @export */
  eglCreateWindowSurface: _eglCreateWindowSurface,
  /** @export */
  eglDestroyContext: _eglDestroyContext,
  /** @export */
  eglDestroySurface: _eglDestroySurface,
  /** @export */
  eglGetConfigAttrib: _eglGetConfigAttrib,
  /** @export */
  eglGetDisplay: _eglGetDisplay,
  /** @export */
  eglGetError: _eglGetError,
  /** @export */
  eglInitialize: _eglInitialize,
  /** @export */
  eglMakeCurrent: _eglMakeCurrent,
  /** @export */
  eglQueryString: _eglQueryString,
  /** @export */
  eglSwapBuffers: _eglSwapBuffers,
  /** @export */
  eglSwapInterval: _eglSwapInterval,
  /** @export */
  eglTerminate: _eglTerminate,
  /** @export */
  eglWaitGL: _eglWaitGL,
  /** @export */
  eglWaitNative: _eglWaitNative,
  /** @export */
  emscripten_asm_const_int: _emscripten_asm_const_int,
  /** @export */
  emscripten_asm_const_int_sync_on_main_thread: _emscripten_asm_const_int_sync_on_main_thread,
  /** @export */
  emscripten_asm_const_ptr_sync_on_main_thread: _emscripten_asm_const_ptr_sync_on_main_thread,
  /** @export */
  emscripten_date_now: _emscripten_date_now,
  /** @export */
  emscripten_exit_fullscreen: _emscripten_exit_fullscreen,
  /** @export */
  emscripten_exit_pointerlock: _emscripten_exit_pointerlock,
  /** @export */
  emscripten_force_exit: _emscripten_force_exit,
  /** @export */
  emscripten_get_callstack: _emscripten_get_callstack,
  /** @export */
  emscripten_get_device_pixel_ratio: _emscripten_get_device_pixel_ratio,
  /** @export */
  emscripten_get_element_css_size: _emscripten_get_element_css_size,
  /** @export */
  emscripten_get_gamepad_status: _emscripten_get_gamepad_status,
  /** @export */
  emscripten_get_heap_max: _emscripten_get_heap_max,
  /** @export */
  emscripten_get_now: _emscripten_get_now,
  /** @export */
  emscripten_get_num_gamepads: _emscripten_get_num_gamepads,
  /** @export */
  emscripten_get_screen_size: _emscripten_get_screen_size,
  /** @export */
  emscripten_glActiveTexture: _emscripten_glActiveTexture,
  /** @export */
  emscripten_glAttachShader: _emscripten_glAttachShader,
  /** @export */
  emscripten_glBeginQuery: _emscripten_glBeginQuery,
  /** @export */
  emscripten_glBeginQueryEXT: _emscripten_glBeginQueryEXT,
  /** @export */
  emscripten_glBeginTransformFeedback: _emscripten_glBeginTransformFeedback,
  /** @export */
  emscripten_glBindAttribLocation: _emscripten_glBindAttribLocation,
  /** @export */
  emscripten_glBindBuffer: _emscripten_glBindBuffer,
  /** @export */
  emscripten_glBindBufferBase: _emscripten_glBindBufferBase,
  /** @export */
  emscripten_glBindBufferRange: _emscripten_glBindBufferRange,
  /** @export */
  emscripten_glBindFramebuffer: _emscripten_glBindFramebuffer,
  /** @export */
  emscripten_glBindRenderbuffer: _emscripten_glBindRenderbuffer,
  /** @export */
  emscripten_glBindSampler: _emscripten_glBindSampler,
  /** @export */
  emscripten_glBindTexture: _emscripten_glBindTexture,
  /** @export */
  emscripten_glBindTransformFeedback: _emscripten_glBindTransformFeedback,
  /** @export */
  emscripten_glBindVertexArray: _emscripten_glBindVertexArray,
  /** @export */
  emscripten_glBindVertexArrayOES: _emscripten_glBindVertexArrayOES,
  /** @export */
  emscripten_glBlendColor: _emscripten_glBlendColor,
  /** @export */
  emscripten_glBlendEquation: _emscripten_glBlendEquation,
  /** @export */
  emscripten_glBlendEquationSeparate: _emscripten_glBlendEquationSeparate,
  /** @export */
  emscripten_glBlendFunc: _emscripten_glBlendFunc,
  /** @export */
  emscripten_glBlendFuncSeparate: _emscripten_glBlendFuncSeparate,
  /** @export */
  emscripten_glBlitFramebuffer: _emscripten_glBlitFramebuffer,
  /** @export */
  emscripten_glBufferData: _emscripten_glBufferData,
  /** @export */
  emscripten_glBufferSubData: _emscripten_glBufferSubData,
  /** @export */
  emscripten_glCheckFramebufferStatus: _emscripten_glCheckFramebufferStatus,
  /** @export */
  emscripten_glClear: _emscripten_glClear,
  /** @export */
  emscripten_glClearBufferfi: _emscripten_glClearBufferfi,
  /** @export */
  emscripten_glClearBufferfv: _emscripten_glClearBufferfv,
  /** @export */
  emscripten_glClearBufferiv: _emscripten_glClearBufferiv,
  /** @export */
  emscripten_glClearBufferuiv: _emscripten_glClearBufferuiv,
  /** @export */
  emscripten_glClearColor: _emscripten_glClearColor,
  /** @export */
  emscripten_glClearDepthf: _emscripten_glClearDepthf,
  /** @export */
  emscripten_glClearStencil: _emscripten_glClearStencil,
  /** @export */
  emscripten_glClientWaitSync: _emscripten_glClientWaitSync,
  /** @export */
  emscripten_glClipControlEXT: _emscripten_glClipControlEXT,
  /** @export */
  emscripten_glColorMask: _emscripten_glColorMask,
  /** @export */
  emscripten_glCompileShader: _emscripten_glCompileShader,
  /** @export */
  emscripten_glCompressedTexImage2D: _emscripten_glCompressedTexImage2D,
  /** @export */
  emscripten_glCompressedTexImage3D: _emscripten_glCompressedTexImage3D,
  /** @export */
  emscripten_glCompressedTexSubImage2D: _emscripten_glCompressedTexSubImage2D,
  /** @export */
  emscripten_glCompressedTexSubImage3D: _emscripten_glCompressedTexSubImage3D,
  /** @export */
  emscripten_glCopyBufferSubData: _emscripten_glCopyBufferSubData,
  /** @export */
  emscripten_glCopyTexImage2D: _emscripten_glCopyTexImage2D,
  /** @export */
  emscripten_glCopyTexSubImage2D: _emscripten_glCopyTexSubImage2D,
  /** @export */
  emscripten_glCopyTexSubImage3D: _emscripten_glCopyTexSubImage3D,
  /** @export */
  emscripten_glCreateProgram: _emscripten_glCreateProgram,
  /** @export */
  emscripten_glCreateShader: _emscripten_glCreateShader,
  /** @export */
  emscripten_glCullFace: _emscripten_glCullFace,
  /** @export */
  emscripten_glDeleteBuffers: _emscripten_glDeleteBuffers,
  /** @export */
  emscripten_glDeleteFramebuffers: _emscripten_glDeleteFramebuffers,
  /** @export */
  emscripten_glDeleteProgram: _emscripten_glDeleteProgram,
  /** @export */
  emscripten_glDeleteQueries: _emscripten_glDeleteQueries,
  /** @export */
  emscripten_glDeleteQueriesEXT: _emscripten_glDeleteQueriesEXT,
  /** @export */
  emscripten_glDeleteRenderbuffers: _emscripten_glDeleteRenderbuffers,
  /** @export */
  emscripten_glDeleteSamplers: _emscripten_glDeleteSamplers,
  /** @export */
  emscripten_glDeleteShader: _emscripten_glDeleteShader,
  /** @export */
  emscripten_glDeleteSync: _emscripten_glDeleteSync,
  /** @export */
  emscripten_glDeleteTextures: _emscripten_glDeleteTextures,
  /** @export */
  emscripten_glDeleteTransformFeedbacks: _emscripten_glDeleteTransformFeedbacks,
  /** @export */
  emscripten_glDeleteVertexArrays: _emscripten_glDeleteVertexArrays,
  /** @export */
  emscripten_glDeleteVertexArraysOES: _emscripten_glDeleteVertexArraysOES,
  /** @export */
  emscripten_glDepthFunc: _emscripten_glDepthFunc,
  /** @export */
  emscripten_glDepthMask: _emscripten_glDepthMask,
  /** @export */
  emscripten_glDepthRangef: _emscripten_glDepthRangef,
  /** @export */
  emscripten_glDetachShader: _emscripten_glDetachShader,
  /** @export */
  emscripten_glDisable: _emscripten_glDisable,
  /** @export */
  emscripten_glDisableVertexAttribArray: _emscripten_glDisableVertexAttribArray,
  /** @export */
  emscripten_glDrawArrays: _emscripten_glDrawArrays,
  /** @export */
  emscripten_glDrawArraysInstanced: _emscripten_glDrawArraysInstanced,
  /** @export */
  emscripten_glDrawArraysInstancedANGLE: _emscripten_glDrawArraysInstancedANGLE,
  /** @export */
  emscripten_glDrawArraysInstancedARB: _emscripten_glDrawArraysInstancedARB,
  /** @export */
  emscripten_glDrawArraysInstancedEXT: _emscripten_glDrawArraysInstancedEXT,
  /** @export */
  emscripten_glDrawArraysInstancedNV: _emscripten_glDrawArraysInstancedNV,
  /** @export */
  emscripten_glDrawBuffers: _emscripten_glDrawBuffers,
  /** @export */
  emscripten_glDrawBuffersEXT: _emscripten_glDrawBuffersEXT,
  /** @export */
  emscripten_glDrawBuffersWEBGL: _emscripten_glDrawBuffersWEBGL,
  /** @export */
  emscripten_glDrawElements: _emscripten_glDrawElements,
  /** @export */
  emscripten_glDrawElementsInstanced: _emscripten_glDrawElementsInstanced,
  /** @export */
  emscripten_glDrawElementsInstancedANGLE: _emscripten_glDrawElementsInstancedANGLE,
  /** @export */
  emscripten_glDrawElementsInstancedARB: _emscripten_glDrawElementsInstancedARB,
  /** @export */
  emscripten_glDrawElementsInstancedEXT: _emscripten_glDrawElementsInstancedEXT,
  /** @export */
  emscripten_glDrawElementsInstancedNV: _emscripten_glDrawElementsInstancedNV,
  /** @export */
  emscripten_glDrawRangeElements: _emscripten_glDrawRangeElements,
  /** @export */
  emscripten_glEnable: _emscripten_glEnable,
  /** @export */
  emscripten_glEnableVertexAttribArray: _emscripten_glEnableVertexAttribArray,
  /** @export */
  emscripten_glEndQuery: _emscripten_glEndQuery,
  /** @export */
  emscripten_glEndQueryEXT: _emscripten_glEndQueryEXT,
  /** @export */
  emscripten_glEndTransformFeedback: _emscripten_glEndTransformFeedback,
  /** @export */
  emscripten_glFenceSync: _emscripten_glFenceSync,
  /** @export */
  emscripten_glFinish: _emscripten_glFinish,
  /** @export */
  emscripten_glFlush: _emscripten_glFlush,
  /** @export */
  emscripten_glFramebufferRenderbuffer: _emscripten_glFramebufferRenderbuffer,
  /** @export */
  emscripten_glFramebufferTexture2D: _emscripten_glFramebufferTexture2D,
  /** @export */
  emscripten_glFramebufferTextureLayer: _emscripten_glFramebufferTextureLayer,
  /** @export */
  emscripten_glFrontFace: _emscripten_glFrontFace,
  /** @export */
  emscripten_glGenBuffers: _emscripten_glGenBuffers,
  /** @export */
  emscripten_glGenFramebuffers: _emscripten_glGenFramebuffers,
  /** @export */
  emscripten_glGenQueries: _emscripten_glGenQueries,
  /** @export */
  emscripten_glGenQueriesEXT: _emscripten_glGenQueriesEXT,
  /** @export */
  emscripten_glGenRenderbuffers: _emscripten_glGenRenderbuffers,
  /** @export */
  emscripten_glGenSamplers: _emscripten_glGenSamplers,
  /** @export */
  emscripten_glGenTextures: _emscripten_glGenTextures,
  /** @export */
  emscripten_glGenTransformFeedbacks: _emscripten_glGenTransformFeedbacks,
  /** @export */
  emscripten_glGenVertexArrays: _emscripten_glGenVertexArrays,
  /** @export */
  emscripten_glGenVertexArraysOES: _emscripten_glGenVertexArraysOES,
  /** @export */
  emscripten_glGenerateMipmap: _emscripten_glGenerateMipmap,
  /** @export */
  emscripten_glGetActiveAttrib: _emscripten_glGetActiveAttrib,
  /** @export */
  emscripten_glGetActiveUniform: _emscripten_glGetActiveUniform,
  /** @export */
  emscripten_glGetActiveUniformBlockName: _emscripten_glGetActiveUniformBlockName,
  /** @export */
  emscripten_glGetActiveUniformBlockiv: _emscripten_glGetActiveUniformBlockiv,
  /** @export */
  emscripten_glGetActiveUniformsiv: _emscripten_glGetActiveUniformsiv,
  /** @export */
  emscripten_glGetAttachedShaders: _emscripten_glGetAttachedShaders,
  /** @export */
  emscripten_glGetAttribLocation: _emscripten_glGetAttribLocation,
  /** @export */
  emscripten_glGetBooleanv: _emscripten_glGetBooleanv,
  /** @export */
  emscripten_glGetBufferParameteri64v: _emscripten_glGetBufferParameteri64v,
  /** @export */
  emscripten_glGetBufferParameteriv: _emscripten_glGetBufferParameteriv,
  /** @export */
  emscripten_glGetError: _emscripten_glGetError,
  /** @export */
  emscripten_glGetFloatv: _emscripten_glGetFloatv,
  /** @export */
  emscripten_glGetFragDataLocation: _emscripten_glGetFragDataLocation,
  /** @export */
  emscripten_glGetFramebufferAttachmentParameteriv: _emscripten_glGetFramebufferAttachmentParameteriv,
  /** @export */
  emscripten_glGetInteger64i_v: _emscripten_glGetInteger64i_v,
  /** @export */
  emscripten_glGetInteger64v: _emscripten_glGetInteger64v,
  /** @export */
  emscripten_glGetIntegeri_v: _emscripten_glGetIntegeri_v,
  /** @export */
  emscripten_glGetIntegerv: _emscripten_glGetIntegerv,
  /** @export */
  emscripten_glGetInternalformativ: _emscripten_glGetInternalformativ,
  /** @export */
  emscripten_glGetProgramBinary: _emscripten_glGetProgramBinary,
  /** @export */
  emscripten_glGetProgramInfoLog: _emscripten_glGetProgramInfoLog,
  /** @export */
  emscripten_glGetProgramiv: _emscripten_glGetProgramiv,
  /** @export */
  emscripten_glGetQueryObjecti64vEXT: _emscripten_glGetQueryObjecti64vEXT,
  /** @export */
  emscripten_glGetQueryObjectivEXT: _emscripten_glGetQueryObjectivEXT,
  /** @export */
  emscripten_glGetQueryObjectui64vEXT: _emscripten_glGetQueryObjectui64vEXT,
  /** @export */
  emscripten_glGetQueryObjectuiv: _emscripten_glGetQueryObjectuiv,
  /** @export */
  emscripten_glGetQueryObjectuivEXT: _emscripten_glGetQueryObjectuivEXT,
  /** @export */
  emscripten_glGetQueryiv: _emscripten_glGetQueryiv,
  /** @export */
  emscripten_glGetQueryivEXT: _emscripten_glGetQueryivEXT,
  /** @export */
  emscripten_glGetRenderbufferParameteriv: _emscripten_glGetRenderbufferParameteriv,
  /** @export */
  emscripten_glGetSamplerParameterfv: _emscripten_glGetSamplerParameterfv,
  /** @export */
  emscripten_glGetSamplerParameteriv: _emscripten_glGetSamplerParameteriv,
  /** @export */
  emscripten_glGetShaderInfoLog: _emscripten_glGetShaderInfoLog,
  /** @export */
  emscripten_glGetShaderPrecisionFormat: _emscripten_glGetShaderPrecisionFormat,
  /** @export */
  emscripten_glGetShaderSource: _emscripten_glGetShaderSource,
  /** @export */
  emscripten_glGetShaderiv: _emscripten_glGetShaderiv,
  /** @export */
  emscripten_glGetString: _emscripten_glGetString,
  /** @export */
  emscripten_glGetStringi: _emscripten_glGetStringi,
  /** @export */
  emscripten_glGetSynciv: _emscripten_glGetSynciv,
  /** @export */
  emscripten_glGetTexParameterfv: _emscripten_glGetTexParameterfv,
  /** @export */
  emscripten_glGetTexParameteriv: _emscripten_glGetTexParameteriv,
  /** @export */
  emscripten_glGetTransformFeedbackVarying: _emscripten_glGetTransformFeedbackVarying,
  /** @export */
  emscripten_glGetUniformBlockIndex: _emscripten_glGetUniformBlockIndex,
  /** @export */
  emscripten_glGetUniformIndices: _emscripten_glGetUniformIndices,
  /** @export */
  emscripten_glGetUniformLocation: _emscripten_glGetUniformLocation,
  /** @export */
  emscripten_glGetUniformfv: _emscripten_glGetUniformfv,
  /** @export */
  emscripten_glGetUniformiv: _emscripten_glGetUniformiv,
  /** @export */
  emscripten_glGetUniformuiv: _emscripten_glGetUniformuiv,
  /** @export */
  emscripten_glGetVertexAttribIiv: _emscripten_glGetVertexAttribIiv,
  /** @export */
  emscripten_glGetVertexAttribIuiv: _emscripten_glGetVertexAttribIuiv,
  /** @export */
  emscripten_glGetVertexAttribPointerv: _emscripten_glGetVertexAttribPointerv,
  /** @export */
  emscripten_glGetVertexAttribfv: _emscripten_glGetVertexAttribfv,
  /** @export */
  emscripten_glGetVertexAttribiv: _emscripten_glGetVertexAttribiv,
  /** @export */
  emscripten_glHint: _emscripten_glHint,
  /** @export */
  emscripten_glInvalidateFramebuffer: _emscripten_glInvalidateFramebuffer,
  /** @export */
  emscripten_glInvalidateSubFramebuffer: _emscripten_glInvalidateSubFramebuffer,
  /** @export */
  emscripten_glIsBuffer: _emscripten_glIsBuffer,
  /** @export */
  emscripten_glIsEnabled: _emscripten_glIsEnabled,
  /** @export */
  emscripten_glIsFramebuffer: _emscripten_glIsFramebuffer,
  /** @export */
  emscripten_glIsProgram: _emscripten_glIsProgram,
  /** @export */
  emscripten_glIsQuery: _emscripten_glIsQuery,
  /** @export */
  emscripten_glIsQueryEXT: _emscripten_glIsQueryEXT,
  /** @export */
  emscripten_glIsRenderbuffer: _emscripten_glIsRenderbuffer,
  /** @export */
  emscripten_glIsSampler: _emscripten_glIsSampler,
  /** @export */
  emscripten_glIsShader: _emscripten_glIsShader,
  /** @export */
  emscripten_glIsSync: _emscripten_glIsSync,
  /** @export */
  emscripten_glIsTexture: _emscripten_glIsTexture,
  /** @export */
  emscripten_glIsTransformFeedback: _emscripten_glIsTransformFeedback,
  /** @export */
  emscripten_glIsVertexArray: _emscripten_glIsVertexArray,
  /** @export */
  emscripten_glIsVertexArrayOES: _emscripten_glIsVertexArrayOES,
  /** @export */
  emscripten_glLineWidth: _emscripten_glLineWidth,
  /** @export */
  emscripten_glLinkProgram: _emscripten_glLinkProgram,
  /** @export */
  emscripten_glPauseTransformFeedback: _emscripten_glPauseTransformFeedback,
  /** @export */
  emscripten_glPixelStorei: _emscripten_glPixelStorei,
  /** @export */
  emscripten_glPolygonModeWEBGL: _emscripten_glPolygonModeWEBGL,
  /** @export */
  emscripten_glPolygonOffset: _emscripten_glPolygonOffset,
  /** @export */
  emscripten_glPolygonOffsetClampEXT: _emscripten_glPolygonOffsetClampEXT,
  /** @export */
  emscripten_glProgramBinary: _emscripten_glProgramBinary,
  /** @export */
  emscripten_glProgramParameteri: _emscripten_glProgramParameteri,
  /** @export */
  emscripten_glQueryCounterEXT: _emscripten_glQueryCounterEXT,
  /** @export */
  emscripten_glReadBuffer: _emscripten_glReadBuffer,
  /** @export */
  emscripten_glReadPixels: _emscripten_glReadPixels,
  /** @export */
  emscripten_glReleaseShaderCompiler: _emscripten_glReleaseShaderCompiler,
  /** @export */
  emscripten_glRenderbufferStorage: _emscripten_glRenderbufferStorage,
  /** @export */
  emscripten_glRenderbufferStorageMultisample: _emscripten_glRenderbufferStorageMultisample,
  /** @export */
  emscripten_glResumeTransformFeedback: _emscripten_glResumeTransformFeedback,
  /** @export */
  emscripten_glSampleCoverage: _emscripten_glSampleCoverage,
  /** @export */
  emscripten_glSamplerParameterf: _emscripten_glSamplerParameterf,
  /** @export */
  emscripten_glSamplerParameterfv: _emscripten_glSamplerParameterfv,
  /** @export */
  emscripten_glSamplerParameteri: _emscripten_glSamplerParameteri,
  /** @export */
  emscripten_glSamplerParameteriv: _emscripten_glSamplerParameteriv,
  /** @export */
  emscripten_glScissor: _emscripten_glScissor,
  /** @export */
  emscripten_glShaderBinary: _emscripten_glShaderBinary,
  /** @export */
  emscripten_glShaderSource: _emscripten_glShaderSource,
  /** @export */
  emscripten_glStencilFunc: _emscripten_glStencilFunc,
  /** @export */
  emscripten_glStencilFuncSeparate: _emscripten_glStencilFuncSeparate,
  /** @export */
  emscripten_glStencilMask: _emscripten_glStencilMask,
  /** @export */
  emscripten_glStencilMaskSeparate: _emscripten_glStencilMaskSeparate,
  /** @export */
  emscripten_glStencilOp: _emscripten_glStencilOp,
  /** @export */
  emscripten_glStencilOpSeparate: _emscripten_glStencilOpSeparate,
  /** @export */
  emscripten_glTexImage2D: _emscripten_glTexImage2D,
  /** @export */
  emscripten_glTexImage3D: _emscripten_glTexImage3D,
  /** @export */
  emscripten_glTexParameterf: _emscripten_glTexParameterf,
  /** @export */
  emscripten_glTexParameterfv: _emscripten_glTexParameterfv,
  /** @export */
  emscripten_glTexParameteri: _emscripten_glTexParameteri,
  /** @export */
  emscripten_glTexParameteriv: _emscripten_glTexParameteriv,
  /** @export */
  emscripten_glTexStorage2D: _emscripten_glTexStorage2D,
  /** @export */
  emscripten_glTexStorage3D: _emscripten_glTexStorage3D,
  /** @export */
  emscripten_glTexSubImage2D: _emscripten_glTexSubImage2D,
  /** @export */
  emscripten_glTexSubImage3D: _emscripten_glTexSubImage3D,
  /** @export */
  emscripten_glTransformFeedbackVaryings: _emscripten_glTransformFeedbackVaryings,
  /** @export */
  emscripten_glUniform1f: _emscripten_glUniform1f,
  /** @export */
  emscripten_glUniform1fv: _emscripten_glUniform1fv,
  /** @export */
  emscripten_glUniform1i: _emscripten_glUniform1i,
  /** @export */
  emscripten_glUniform1iv: _emscripten_glUniform1iv,
  /** @export */
  emscripten_glUniform1ui: _emscripten_glUniform1ui,
  /** @export */
  emscripten_glUniform1uiv: _emscripten_glUniform1uiv,
  /** @export */
  emscripten_glUniform2f: _emscripten_glUniform2f,
  /** @export */
  emscripten_glUniform2fv: _emscripten_glUniform2fv,
  /** @export */
  emscripten_glUniform2i: _emscripten_glUniform2i,
  /** @export */
  emscripten_glUniform2iv: _emscripten_glUniform2iv,
  /** @export */
  emscripten_glUniform2ui: _emscripten_glUniform2ui,
  /** @export */
  emscripten_glUniform2uiv: _emscripten_glUniform2uiv,
  /** @export */
  emscripten_glUniform3f: _emscripten_glUniform3f,
  /** @export */
  emscripten_glUniform3fv: _emscripten_glUniform3fv,
  /** @export */
  emscripten_glUniform3i: _emscripten_glUniform3i,
  /** @export */
  emscripten_glUniform3iv: _emscripten_glUniform3iv,
  /** @export */
  emscripten_glUniform3ui: _emscripten_glUniform3ui,
  /** @export */
  emscripten_glUniform3uiv: _emscripten_glUniform3uiv,
  /** @export */
  emscripten_glUniform4f: _emscripten_glUniform4f,
  /** @export */
  emscripten_glUniform4fv: _emscripten_glUniform4fv,
  /** @export */
  emscripten_glUniform4i: _emscripten_glUniform4i,
  /** @export */
  emscripten_glUniform4iv: _emscripten_glUniform4iv,
  /** @export */
  emscripten_glUniform4ui: _emscripten_glUniform4ui,
  /** @export */
  emscripten_glUniform4uiv: _emscripten_glUniform4uiv,
  /** @export */
  emscripten_glUniformBlockBinding: _emscripten_glUniformBlockBinding,
  /** @export */
  emscripten_glUniformMatrix2fv: _emscripten_glUniformMatrix2fv,
  /** @export */
  emscripten_glUniformMatrix2x3fv: _emscripten_glUniformMatrix2x3fv,
  /** @export */
  emscripten_glUniformMatrix2x4fv: _emscripten_glUniformMatrix2x4fv,
  /** @export */
  emscripten_glUniformMatrix3fv: _emscripten_glUniformMatrix3fv,
  /** @export */
  emscripten_glUniformMatrix3x2fv: _emscripten_glUniformMatrix3x2fv,
  /** @export */
  emscripten_glUniformMatrix3x4fv: _emscripten_glUniformMatrix3x4fv,
  /** @export */
  emscripten_glUniformMatrix4fv: _emscripten_glUniformMatrix4fv,
  /** @export */
  emscripten_glUniformMatrix4x2fv: _emscripten_glUniformMatrix4x2fv,
  /** @export */
  emscripten_glUniformMatrix4x3fv: _emscripten_glUniformMatrix4x3fv,
  /** @export */
  emscripten_glUseProgram: _emscripten_glUseProgram,
  /** @export */
  emscripten_glValidateProgram: _emscripten_glValidateProgram,
  /** @export */
  emscripten_glVertexAttrib1f: _emscripten_glVertexAttrib1f,
  /** @export */
  emscripten_glVertexAttrib1fv: _emscripten_glVertexAttrib1fv,
  /** @export */
  emscripten_glVertexAttrib2f: _emscripten_glVertexAttrib2f,
  /** @export */
  emscripten_glVertexAttrib2fv: _emscripten_glVertexAttrib2fv,
  /** @export */
  emscripten_glVertexAttrib3f: _emscripten_glVertexAttrib3f,
  /** @export */
  emscripten_glVertexAttrib3fv: _emscripten_glVertexAttrib3fv,
  /** @export */
  emscripten_glVertexAttrib4f: _emscripten_glVertexAttrib4f,
  /** @export */
  emscripten_glVertexAttrib4fv: _emscripten_glVertexAttrib4fv,
  /** @export */
  emscripten_glVertexAttribDivisor: _emscripten_glVertexAttribDivisor,
  /** @export */
  emscripten_glVertexAttribDivisorANGLE: _emscripten_glVertexAttribDivisorANGLE,
  /** @export */
  emscripten_glVertexAttribDivisorARB: _emscripten_glVertexAttribDivisorARB,
  /** @export */
  emscripten_glVertexAttribDivisorEXT: _emscripten_glVertexAttribDivisorEXT,
  /** @export */
  emscripten_glVertexAttribDivisorNV: _emscripten_glVertexAttribDivisorNV,
  /** @export */
  emscripten_glVertexAttribI4i: _emscripten_glVertexAttribI4i,
  /** @export */
  emscripten_glVertexAttribI4iv: _emscripten_glVertexAttribI4iv,
  /** @export */
  emscripten_glVertexAttribI4ui: _emscripten_glVertexAttribI4ui,
  /** @export */
  emscripten_glVertexAttribI4uiv: _emscripten_glVertexAttribI4uiv,
  /** @export */
  emscripten_glVertexAttribIPointer: _emscripten_glVertexAttribIPointer,
  /** @export */
  emscripten_glVertexAttribPointer: _emscripten_glVertexAttribPointer,
  /** @export */
  emscripten_glViewport: _emscripten_glViewport,
  /** @export */
  emscripten_glWaitSync: _emscripten_glWaitSync,
  /** @export */
  emscripten_has_asyncify: _emscripten_has_asyncify,
  /** @export */
  emscripten_request_fullscreen_strategy: _emscripten_request_fullscreen_strategy,
  /** @export */
  emscripten_request_pointerlock: _emscripten_request_pointerlock,
  /** @export */
  emscripten_resize_heap: _emscripten_resize_heap,
  /** @export */
  emscripten_return_address: _emscripten_return_address,
  /** @export */
  emscripten_run_script_string: _emscripten_run_script_string,
  /** @export */
  emscripten_sample_gamepad_data: _emscripten_sample_gamepad_data,
  /** @export */
  emscripten_set_beforeunload_callback_on_thread: _emscripten_set_beforeunload_callback_on_thread,
  /** @export */
  emscripten_set_blur_callback_on_thread: _emscripten_set_blur_callback_on_thread,
  /** @export */
  emscripten_set_canvas_element_size: _emscripten_set_canvas_element_size,
  /** @export */
  emscripten_set_element_css_size: _emscripten_set_element_css_size,
  /** @export */
  emscripten_set_focus_callback_on_thread: _emscripten_set_focus_callback_on_thread,
  /** @export */
  emscripten_set_fullscreenchange_callback_on_thread: _emscripten_set_fullscreenchange_callback_on_thread,
  /** @export */
  emscripten_set_gamepadconnected_callback_on_thread: _emscripten_set_gamepadconnected_callback_on_thread,
  /** @export */
  emscripten_set_gamepaddisconnected_callback_on_thread: _emscripten_set_gamepaddisconnected_callback_on_thread,
  /** @export */
  emscripten_set_keydown_callback_on_thread: _emscripten_set_keydown_callback_on_thread,
  /** @export */
  emscripten_set_keypress_callback_on_thread: _emscripten_set_keypress_callback_on_thread,
  /** @export */
  emscripten_set_keyup_callback_on_thread: _emscripten_set_keyup_callback_on_thread,
  /** @export */
  emscripten_set_main_loop: _emscripten_set_main_loop,
  /** @export */
  emscripten_set_mousedown_callback_on_thread: _emscripten_set_mousedown_callback_on_thread,
  /** @export */
  emscripten_set_mouseenter_callback_on_thread: _emscripten_set_mouseenter_callback_on_thread,
  /** @export */
  emscripten_set_mouseleave_callback_on_thread: _emscripten_set_mouseleave_callback_on_thread,
  /** @export */
  emscripten_set_mousemove_callback_on_thread: _emscripten_set_mousemove_callback_on_thread,
  /** @export */
  emscripten_set_mouseup_callback_on_thread: _emscripten_set_mouseup_callback_on_thread,
  /** @export */
  emscripten_set_pointerlockchange_callback_on_thread: _emscripten_set_pointerlockchange_callback_on_thread,
  /** @export */
  emscripten_set_resize_callback_on_thread: _emscripten_set_resize_callback_on_thread,
  /** @export */
  emscripten_set_touchcancel_callback_on_thread: _emscripten_set_touchcancel_callback_on_thread,
  /** @export */
  emscripten_set_touchend_callback_on_thread: _emscripten_set_touchend_callback_on_thread,
  /** @export */
  emscripten_set_touchmove_callback_on_thread: _emscripten_set_touchmove_callback_on_thread,
  /** @export */
  emscripten_set_touchstart_callback_on_thread: _emscripten_set_touchstart_callback_on_thread,
  /** @export */
  emscripten_set_visibilitychange_callback_on_thread: _emscripten_set_visibilitychange_callback_on_thread,
  /** @export */
  emscripten_set_wheel_callback_on_thread: _emscripten_set_wheel_callback_on_thread,
  /** @export */
  emscripten_set_window_title: _emscripten_set_window_title,
  /** @export */
  emscripten_sleep: _emscripten_sleep,
  /** @export */
  environ_get: _environ_get,
  /** @export */
  environ_sizes_get: _environ_sizes_get,
  /** @export */
  exit: _exit,
  /** @export */
  fd_close: _fd_close,
  /** @export */
  fd_pread: _fd_pread,
  /** @export */
  fd_read: _fd_read,
  /** @export */
  fd_seek: _fd_seek,
  /** @export */
  fd_sync: _fd_sync,
  /** @export */
  fd_write: _fd_write,
  /** @export */
  glActiveTexture: _glActiveTexture,
  /** @export */
  glAttachShader: _glAttachShader,
  /** @export */
  glBindAttribLocation: _glBindAttribLocation,
  /** @export */
  glBindBuffer: _glBindBuffer,
  /** @export */
  glBindTexture: _glBindTexture,
  /** @export */
  glBindVertexArray: _glBindVertexArray,
  /** @export */
  glBlendEquation: _glBlendEquation,
  /** @export */
  glBlendFunc: _glBlendFunc,
  /** @export */
  glBufferData: _glBufferData,
  /** @export */
  glBufferSubData: _glBufferSubData,
  /** @export */
  glCompileShader: _glCompileShader,
  /** @export */
  glCreateProgram: _glCreateProgram,
  /** @export */
  glCreateShader: _glCreateShader,
  /** @export */
  glDeleteBuffers: _glDeleteBuffers,
  /** @export */
  glDeleteProgram: _glDeleteProgram,
  /** @export */
  glDeleteShader: _glDeleteShader,
  /** @export */
  glDeleteTextures: _glDeleteTextures,
  /** @export */
  glDeleteVertexArrays: _glDeleteVertexArrays,
  /** @export */
  glDisable: _glDisable,
  /** @export */
  glDrawElements: _glDrawElements,
  /** @export */
  glEnable: _glEnable,
  /** @export */
  glEnableVertexAttribArray: _glEnableVertexAttribArray,
  /** @export */
  glGenBuffers: _glGenBuffers,
  /** @export */
  glGenTextures: _glGenTextures,
  /** @export */
  glGenVertexArrays: _glGenVertexArrays,
  /** @export */
  glGetBufferParameteriv: _glGetBufferParameteriv,
  /** @export */
  glGetError: _glGetError,
  /** @export */
  glGetProgramInfoLog: _glGetProgramInfoLog,
  /** @export */
  glGetProgramiv: _glGetProgramiv,
  /** @export */
  glGetShaderInfoLog: _glGetShaderInfoLog,
  /** @export */
  glGetShaderiv: _glGetShaderiv,
  /** @export */
  glGetString: _glGetString,
  /** @export */
  glGetUniformLocation: _glGetUniformLocation,
  /** @export */
  glLinkProgram: _glLinkProgram,
  /** @export */
  glScissor: _glScissor,
  /** @export */
  glShaderSource: _glShaderSource,
  /** @export */
  glStencilFunc: _glStencilFunc,
  /** @export */
  glStencilMask: _glStencilMask,
  /** @export */
  glStencilOp: _glStencilOp,
  /** @export */
  glTexImage2D: _glTexImage2D,
  /** @export */
  glTexParameteri: _glTexParameteri,
  /** @export */
  glUniform1i: _glUniform1i,
  /** @export */
  glUniform2f: _glUniform2f,
  /** @export */
  glUniform4fv: _glUniform4fv,
  /** @export */
  glUniformMatrix4fv: _glUniformMatrix4fv,
  /** @export */
  glUseProgram: _glUseProgram,
  /** @export */
  glVertexAttribPointer: _glVertexAttribPointer,
  /** @export */
  glViewport: _glViewport,
  /** @export */
  invoke_ii,
  /** @export */
  invoke_iijj,
  /** @export */
  invoke_ij,
  /** @export */
  invoke_ijj,
  /** @export */
  invoke_ijjijj,
  /** @export */
  invoke_ijjj,
  /** @export */
  invoke_ijjjj,
  /** @export */
  invoke_jiijjjj,
  /** @export */
  invoke_jj,
  /** @export */
  invoke_jji,
  /** @export */
  invoke_jjj,
  /** @export */
  invoke_jjji,
  /** @export */
  invoke_jjjj,
  /** @export */
  invoke_jjjjjjjj,
  /** @export */
  invoke_v,
  /** @export */
  invoke_viiijij,
  /** @export */
  invoke_vj,
  /** @export */
  invoke_vji,
  /** @export */
  invoke_vjii,
  /** @export */
  invoke_vjiii,
  /** @export */
  invoke_vjj,
  /** @export */
  invoke_vjjiiiiiii,
  /** @export */
  invoke_vjjij,
  /** @export */
  invoke_vjjj,
  /** @export */
  invoke_vjjji,
  /** @export */
  invoke_vjjjj,
  /** @export */
  proc_exit: _proc_exit,
  /** @export */
  random_get: _random_get
};

function invoke_ijjijj(index,a1,a2,a3,a4,a5) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(Number(index))(a1,a2,a3,a4,a5);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ii(index,a1) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(Number(index))(a1);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jjjjjjjj(index,a1,a2,a3,a4,a5,a6,a7) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(Number(index))(a1,a2,a3,a4,a5,a6,a7);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_jj(index,a1) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(Number(index))(a1);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_jjj(index,a1,a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(Number(index))(a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_jjjj(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(Number(index))(a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_vjj(index,a1,a2) {
  var sp = stackSave();
  try {
    getWasmTableEntry(Number(index))(a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vjjj(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(Number(index))(a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ij(index,a1) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(Number(index))(a1);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vj(index,a1) {
  var sp = stackSave();
  try {
    getWasmTableEntry(Number(index))(a1);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_viiijij(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    getWasmTableEntry(Number(index))(a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jjji(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(Number(index))(a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_ijj(index,a1,a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(Number(index))(a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jji(index,a1,a2) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(Number(index))(a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_vjjji(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(Number(index))(a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vji(index,a1,a2) {
  var sp = stackSave();
  try {
    getWasmTableEntry(Number(index))(a1,a2);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vjjiiiiiii(index,a1,a2,a3,a4,a5,a6,a7,a8,a9) {
  var sp = stackSave();
  try {
    getWasmTableEntry(Number(index))(a1,a2,a3,a4,a5,a6,a7,a8,a9);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vjjjj(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(Number(index))(a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vjii(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    getWasmTableEntry(Number(index))(a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_vjjij(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(Number(index))(a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_iijj(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(Number(index))(a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ijjjj(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(Number(index))(a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_jiijjjj(index,a1,a2,a3,a4,a5,a6) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(Number(index))(a1,a2,a3,a4,a5,a6);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
    return 0n;
  }
}

function invoke_vjiii(index,a1,a2,a3,a4) {
  var sp = stackSave();
  try {
    getWasmTableEntry(Number(index))(a1,a2,a3,a4);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_v(index) {
  var sp = stackSave();
  try {
    getWasmTableEntry(Number(index))();
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}

function invoke_ijjj(index,a1,a2,a3) {
  var sp = stackSave();
  try {
    return getWasmTableEntry(Number(index))(a1,a2,a3);
  } catch(e) {
    stackRestore(sp);
    if (!(e instanceof EmscriptenEH)) throw e;
    _setThrew(1, 0);
  }
}


// Argument name here must shadow the `wasmExports` global so
// that it is recognised by metadce and minify-import-export-names
// passes.
function applySignatureConversions(wasmExports) {
  // First, make a copy of the incoming exports object
  wasmExports = Object.assign({}, wasmExports);
  var makeWrapper_pp = (f) => (a0) => Number(f(BigInt(a0)));
  var makeWrapper_ppp = (f) => (a0, a1) => Number(f(BigInt(a0), BigInt(a1)));
  var makeWrapper___PP = (f) => (a0, a1, a2) => f(a0, BigInt(a1 ? a1 : 0), BigInt(a2 ? a2 : 0));
  var makeWrapper__p_ = (f) => (a0, a1) => f(BigInt(a0), a1);
  var makeWrapper__p = (f) => (a0) => f(BigInt(a0));
  var makeWrapper_p = (f) => () => Number(f());

  wasmExports['malloc'] = makeWrapper_pp(wasmExports['malloc']);
  wasmExports['realloc'] = makeWrapper_ppp(wasmExports['realloc']);
  wasmExports['main'] = makeWrapper___PP(wasmExports['main']);
  wasmExports['emscripten_builtin_memalign'] = makeWrapper_ppp(wasmExports['emscripten_builtin_memalign']);
  wasmExports['setThrew'] = makeWrapper__p_(wasmExports['setThrew']);
  wasmExports['_emscripten_stack_restore'] = makeWrapper__p(wasmExports['_emscripten_stack_restore']);
  wasmExports['_emscripten_stack_alloc'] = makeWrapper_pp(wasmExports['_emscripten_stack_alloc']);
  wasmExports['emscripten_stack_get_current'] = makeWrapper_p(wasmExports['emscripten_stack_get_current']);
  return wasmExports;
}


// include: postamble.js
// === Auto-generated postamble setup entry stuff ===

function callMain() {

  var entryFunction = _main;

  var argc = 0;
  var argv = 0;

  try {

    var ret = entryFunction(argc, BigInt(argv));

    // if we're not running an evented main loop, it's time to exit
    exitJS(ret, /* implicit = */ true);
    return ret;
  } catch (e) {
    return handleException(e);
  }
}

async function run() {

  preRun();

  if (runDependencies) {
    await resolveRunDependencies();
  }

  var setStatus = Module['setStatus'];
  if (setStatus) {
    setStatus('Running...');
    // Yield to the event loop to allow the browser to paint "Running..."
    await new Promise((resolve) => setTimeout(resolve, 1));
    // Then we want to clear the status text, but only after the rest of this function runs.
    setTimeout(setStatus, 1, '');
  }

  if (ABORT) return;

  initRuntime();

  // No ATMAINS hooks

  Module['onRuntimeInitialized']?.();

  var noInitialRun = Module['noInitialRun'] || false;
  if (!noInitialRun) callMain();

  postRun();
}

var wasmExports;

// In modularize mode the generated code is within a factory function so we
// can use await here (since it's not top-level-await).
wasmExports = await createWasm();
await run();

// end include: postamble.js

// include: postamble_modularize.js
// In MODULARIZE mode we wrap the generated code in a factory function
// and return either the Module itself, or a promise of the module.

// end include: postamble_modularize.js



    return Module;
  };
})();

// Export using a UMD style export, or ES6 exports if selected
if (typeof exports === 'object' && typeof module === 'object') {
  module.exports = SlateCoreModule;
  // This default export looks redundant, but it allows TS to import this
  // commonjs style module.
  module.exports.default = SlateCoreModule;
} else if (typeof define === 'function' && define['amd'])
  define([], () => SlateCoreModule);

