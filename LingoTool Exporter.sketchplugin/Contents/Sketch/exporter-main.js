var kVersion = "0.1.0"
var kLoggerPrefix = "LingoTool"

function onRun(context) {
  var sketch = context.api()

  // Setup
  logVersionInfo(sketch)

  var document = context.document
  var page = [document currentPage]
  var artboard = [page currentArtboard]
  var stringsMissingKeysArray = []
  var keyStringStore = []

  // Iterate through each layer and grab strings
  if (artboard != null) {
    p_recurseLayers([artboard layers]);
  } else {
    p_recurseLayers([page children]);
  }

  // If there is any issues with keys
  if (stringsMissingKeysArray.length > 0){
    var prettyStringsMissingKeys = prettifyStringsArray(stringsMissingKeysArray)
    displayUserError("There is " + stringsMissingKeysArray.length + " strings missing keys: \n" + prettyStringsMissingKeys)
    return;
  }

  // Otherwise notify user that strings were copied correctly
  [document showMessage: "Copied " + keyStringStore.length + " strings"]

  // Deal with new strings translations
  p_saveStringsToFile(keyStringStore)

  // Object Related functions

  function p_saveStringsToFile(thisStore){
    LTLog("Response: " + thisStore)
  }

  function p_recurseLayers(layers, parentName) {
    for (var i = 0; i < [layers count]; i++) {
      var layer = [layers objectAtIndex:i]

      if ([layer isMemberOfClass:[MSTextLayer class]]) {
        p_copyTextString(layer)
      }

      if ([layer isMemberOfClass:[MSLayerGroup class]]) {
        var groupKeyName = parentName + "." + [layer name]
        p_recurseLayers([layer layers], groupKeyName)
      }
    }
  }

  function p_copyTextString(layer){
    if ([layer name] == [layer stringValue]){
      stringsMissingKeysArray.push([layer stringValue])
      return
    }

    var keyStringObject = {
      "id" : [layer name],
      "string" : [layer stringValue]
    }

    keyStringStore.push(keyStringObject)
  }

};


// Utility Functions
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
