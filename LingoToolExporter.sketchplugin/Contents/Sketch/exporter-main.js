var kVersion = "0.1.0"
var kLoggerPrefix = "LingoTool"



function onExportAllStrings(context) {
  var sketch = context.api()

  // Setup
  logVersionInfo(sketch)

  var document = context.document
  var page = [document currentPage]
  var artboards = [document artboards]
  var artboard = [page currentArtboard]
  var stringsMissingKeysArray = []
  var copyStore = []

  // Iterate through each layer and grab strings
  if (artboard != null) {
    p_recurseLayers([artboard layers])
  } else {
    p_recurseLayers([page children])
  }

  for (i = 0; i < artboards.length; i++) {
    var thisArtboard = artboards[i]
    LTLog("Artboard: " + thisArtboard.name())
    var keyStringArrayResult = p_recurseLayers([thisArtboard layers])
    var artboardStore = []
    artboardStore["name"] = thisArtboard.name()
    artboardStore["strings"] = keyStringArrayResult
    copyStore.push(artboardStore)

    exportImage(document, {
        layer: this.artboard,
        path: NSTemporaryDirectory(),
        scale: 1,
        suffix: "",
        format: "png",
        layer: thisArtboard,
        path: NSHomeDirectory() + '/Desktop/AppScreenshots',
        scale: 2,
        name: thisArtboard.name()
    });

  }

  // Otherwise notify user that strings were copied correctly
  [document showMessage: "Copied " + copyStore.length + " strings"]

  // Deal with new strings translations
  p_saveStringsToFile(copyStore)

  // MARK:- Object Related functions
  function p_saveStringsToFile(thisStore) {
    var contentForiOS = ""
    var contentForAndroid = ""

    for (i = 0; i < thisStore.length; i++) {
      var artboardStore = thisStore[i]
      contentForiOS += "\n/* - " + artboardStore["name"] + " - */\n"
      contentForAndroid += "\n<!-- " + artboardStore["name"] + "-->\n"

      for (j = 0; j < artboardStore["strings"].length; j++) {
        var unitID = artboardStore["name"] + artboardStore["strings"][j]["id"]
        var unitString = artboardStore["strings"][j]["string"]
        var unitPrefix = artboardStore["strings"][j]["prefix"]
        contentForiOS += appleLocalizationLine(unitPrefix + "." + unitID, unitString) + "\n"
        contentForAndroid += androidLocalizationLine(unitPrefix + "." + unitID, unitString) + "\n"
        LTLog(unitString)
      }
    }

    // writeTextToFile(content, NSHomeDirectory() + '/Desktop/' + artboard.name() + '.txt')
    writeTextToFile(contentForiOS, NSHomeDirectory() + '/Desktop/AppTranslations-iOS.localizable')
    writeTextToFile(contentForAndroid, NSHomeDirectory() + '/Desktop/AppTranslations-Android.xml')
  }

  function appleLocalizationLine(id, content) {
    return "\"" + id + "\"=\"" + content + "\""
  }

  function androidLocalizationLine(id, content) {
    return "<string name=\"" + id + "\">" + content + "</string>"
  }

  function exportImage(document, options) {
      var slice = MSExportRequest.exportRequestsFromExportableLayer(options.layer).firstObject()
      var savePathName = [];

      slice.scale = options.scale;
      slice.format = options.format;

      savePathName.push(
              options.path,
              "/",
              options.name,
              options.suffix,
              ".",
              options.format
          );
      savePathName = savePathName.join("");

      document.saveArtboardOrSlice_toFile(slice, savePathName);

      return savePathName;
  }

  function p_recurseLayers(layers, parentName) {
    var keyStringArray = []
    for (var i = 0; i < [layers count]; i++) {
      var layer = [layers objectAtIndex:i]

      if ([layer isMemberOfClass:[MSTextLayer class]]) {
        var keyStringObj = p_copyTextString(parentName, layer)
        keyStringArray.push(keyStringObj)
      }



      if ([layer isMemberOfClass:[MSLayerGroup class]]) {
        var groupKeyName = parentName + "." + [layer name]
        var newKeyStringArray = p_recurseLayers([layer layers], groupKeyName)
        keyStringArray.concat(newKeyStringArray)
      }
    }
    return keyStringArray;
  }

  function p_copyTextString(groupPrefix, layer){
    var keyStringObject = {
      "id" : [layer name],
      "prefix" : groupPrefix,
      "string" : [layer stringValue]
    }

    return keyStringObject;
  }

};


// MARK:- Utility Functions
function prettifyStringsArray(unPrettyArray){
  var workingString = ""
  for (var i = 0; i < unPrettyArray.length; i++) {
    workingString += " - " + unPrettyArray[i] + "\n"
  }
  return workingString
}

// File Utilities
var writeTextToFile = function(text, filePath) {
    var t = [NSString stringWithFormat:@"%@", text],
    f = [NSString stringWithFormat:@"%@", filePath];
    return [t writeToFile:f atomically:true encoding:NSUTF8StringEncoding error:nil];
}

var readTextFromFile = function(filePath) {
    var fileManager = [NSFileManager defaultManager];
    if([fileManager fileExistsAtPath:filePath]) {
        return [NSString stringWithContentsOfFile:filePath encoding:NSUTF8StringEncoding error:nil];
    }
    return nil;
}

var jsonFromFile = function(filePath, mutable) {
    var data = [NSData dataWithContentsOfFile:filePath];
	var options = mutable == true ? NSJSONReadingMutableContainers : 0
	return [NSJSONSerialization JSONObjectWithData:data options:options error:nil];
}

var saveJsonToFile = function(jsonObj, filePath) {
    writeTextToFile(stringify(jsonObj), filePath);
}

var stringify = function(obj, prettyPrinted) {
    var prettySetting = prettyPrinted ? NSJSONWritingPrettyPrinted : 0,
    jsonData = [NSJSONSerialization dataWithJSONObject:obj options:prettySetting error:nil];
    return [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
}

var createTempFolderNamed = function(name) {
    var tempPath = getTempFolderPath(name);
    createFolderAtPath(tempPath);
    return tempPath;
}

var getTempFolderPath = function(withName) {
    var fileManager = [NSFileManager defaultManager],
    cachesURL = [[fileManager URLsForDirectory:NSCachesDirectory inDomains:NSUserDomainMask] lastObject],
    withName = (typeof withName !== 'undefined') ? withName : (Date.now() / 1000),
    folderName = [NSString stringWithFormat:"%@", withName];
    return [[cachesURL URLByAppendingPathComponent:folderName] path];
}

var createFolderAtPath = function(pathString) {
    var fileManager = [NSFileManager defaultManager];
    if([fileManager fileExistsAtPath:pathString]) return true;
    return [fileManager createDirectoryAtPath:pathString withIntermediateDirectories:true attributes:nil error:nil];
}

var removeFileOrFolder = function(filePath) {
    [[NSFileManager defaultManager] removeItemAtPath:filePath error:nil];
}

// Alert Functions
function displayUserError(message){
  var app = NSApplication.sharedApplication()
  app.displayDialog_withTitle(message, "LingoTool Error")
}

// Logger Functions
function LTLog(content){
  log("[" + kLoggerPrefix + "] " + content)
}

function logVersionInfo(sketch){
  LTLog("LingoTool Exporter Started [" + kVersion + "]")
  LTLog("Sketch Verion: " + sketch.version + " Sketch Build: " +  sketch.build + " Sketch Full Version: " + sketch.full_version)
}
