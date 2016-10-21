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
      LTLog([layer stringValue])
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
