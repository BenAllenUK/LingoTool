var kVersion = "0.1.0"
var kLoggerPrefix = "LingoTool"
var kFolderName = "LingoTool Preview"
var kDifferentalCharacter = "."

var PreviewHelper = {
    init(sketchAPI){
      this.sketchAPI = sketchAPI
    },

    createGroupFromArtboard: function(artboard) {
      return artboard.newGroup({frame: new this.sketchAPI.Rectangle(0, 0, artboard.frame.width, artboard.frame.height), name: kFolderName})
    },

    removeGroupFromArtboard: function(artboard) {
      artboard.iterate(function(layer){
        if (layer.name.indexOf(kFolderName) == 0) {
          layer.remove()
        }
      })
    },

    groupExistsFromArtboard: function(artboard) {
      var result = false
      artboard.iterate(function(layer){
        if (layer.name.indexOf(kFolderName) == 0) {
          result = true
        }
      })
      return result
    },

    highlightTextLayers: function(rootLayer, layer) {
      var newRect = this.p_abolsuteFrameForLayer(layer)
      var color = layer.text.indexOf(layer.name) == 0 ? "#E8AE2B30" : "#4BCA0F30"
      rootLayer.newShape({"frame": newRect, fills: [color], borders: []})
    },

    p_abolsuteFrameForLayer: function(layer) {
      return this.recurseFrameForLayer(layer, layer, 0, 0)
    },

    recurseFrameForLayer: function(orgLayer, workingLayer, x, y) {
      if (workingLayer.isArtboard) {
        return new this.sketchAPI.Rectangle(x, y, orgLayer.frame.width, orgLayer.frame.height)
      }
      else {
        x = x + workingLayer.frame.x
        y = y + workingLayer.frame.y
        return this.recurseFrameForLayer(orgLayer, workingLayer.container, x, y)
      }
    }
}

var LayerHelper = {
  isValidName: function(layer) {
    return layer.name.indexOf("-") != 0
  },
  cleanName: function(name) {
    return name
  },
  findTextLayers: function(layer, path) {
    var textLayers = []
    if (layer.isText && this.isValidName(layer)) {
      var foundObject = []
      foundObject['layer'] = layer
      foundObject['path'] = path
      log(layer.name)
      textLayers.push(foundObject)
    }

    if (layer.isGroup) {
      var newPath = path + kDifferentalCharacter + this.cleanName(layer.name)
      layer.iterate(function(subLayer) {
        var moreLayers = LayerHelper.findTextLayers(subLayer, newPath)
        textLayers = Util.mergeByNameProperty(textLayers, moreLayers)
      })
    }

    return textLayers
  }
}

var Util = {
  extend: function( options, target ){
      var target = target || this;

      for ( var key in options ){
          target[key] = options[key];
      }
      return target;
  },
  mergeByNameProperty: function (arr1, arr2) {
    var arr3 = []
    for(var i in arr1) {
      arr3.push(arr1[i])
    }

    for (var i in arr2) {
      arr3.push(arr2[i])
    }

    return arr3
  },
  displayUserError: function(message){
    var app = NSApplication.sharedApplication()
    app.displayDialog_withTitle(message, "LingoTool Error")
  }
}

function onPreviewToggle(context) {
  var sketch = context.api()
  PreviewHelper.init(sketch)
  logVersionInfo(sketch)

  var selectedPage = sketch.selectedDocument.selectedPage

  selectedPage.iterate(function(layer) {
    if (layer.isArtboard) {
      if (PreviewHelper.groupExistsFromArtboard(layer)) {
        PreviewHelper.removeGroupFromArtboard(layer)
        return
      }

      PreviewHelper.removeGroupFromArtboard(layer)

      var container = PreviewHelper.createGroupFromArtboard(layer)
      var path = LayerHelper.cleanName(layer.name)
      var textLayers = LayerHelper.findTextLayers(layer, path)

      for (var i in textLayers) {
        PreviewHelper.highlightTextLayers(container, textLayers[i])
      }
    }
  });
}

var ExportHelper = {
  init(sketchAPI){
    this.sketchAPI = sketchAPI
  },

  recurseArtboard: function(layer) {
    var artboardCopy = []
    artboardCopy["name"] = layer.name

    var path = LayerHelper.cleanName(layer.name)
    var textLayers = LayerHelper.findTextLayers(layer, path)

    for (var i in textLayers.length) {
      var thisTextHolder = textLayers[i]
      var thisTextLayer = thisTextHolder['layer']
      log(thisTextLayer.name)
    }
  },

  p_exportImageWithDefaultOptions: function(artboardLayer) {
    this.p_exportImage({
        layer: artboardLayer,
        path: NSTemporaryDirectory(),
        scale: 1,
        suffix: "",
        format: "png",
        path: NSHomeDirectory() + '/Desktop/AppScreenshots',
        name: artboardLayer.name
    });
  },
}

function onExportAllStrings(context) {
  var sketchAPI = context.api()
  ExportHelper.init(sketchAPI)
  // Setup
  logVersionInfo(sketchAPI)

  var document = context.document
  var selectedPage = sketchAPI.selectedDocument.selectedPage

  var stringsMissingKeysArray = []
  var copyStore = []

  var artboardStore = []
  selectedPage.iterate(function(layer) {
    if (layer.isArtboard) {
      var artboardCopy = ExportHelper.recurseArtboard(layer)
    }
  })

  exportArtboardImagesUsingMSAPI(document)



  // Otherwise notify user that strings were copied correctly


  // Deal with new strings translations
  // p_saveStringsToFile(copyStore)

  // MARK:- Object Related functions
  // function p_saveStringsToFile(thisStore) {
  //   var contentForiOS = ""
  //   var contentForAndroid = ""
  //
  //   for (i = 0; i < thisStore.length; i++) {
  //     var artboardStore = thisStore[i]
  //     contentForiOS += "\n/* - " + artboardStore["name"] + " - */\n"
  //     contentForAndroid += "\n<!-- " + artboardStore["name"] + "-->\n"
  //
  //     for (j = 0; j < artboardStore["strings"].length; j++) {
  //       var unitID = artboardStore["name"] + artboardStore["strings"][j]["id"]
  //       var unitString = artboardStore["strings"][j]["string"]
  //       var unitPrefix = artboardStore["strings"][j]["prefix"]
  //       contentForiOS += appleLocalizationLine(unitPrefix + "." + unitID, unitString) + "\n"
  //       contentForAndroid += androidLocalizationLine(unitPrefix + "." + unitID, unitString) + "\n"
  //       LTLog(unitString)
  //     }
  //   }
  //
  //   // writeTextToFile(content, NSHomeDirectory() + '/Desktop/' + artboard.name() + '.txt')
  //   writeTextToFile(contentForiOS, NSHomeDirectory() + '/Desktop/AppTranslations-iOS.localizable')
  //   writeTextToFile(contentForAndroid, NSHomeDirectory() + '/Desktop/AppTranslations-Android.xml')
  // }
  //
  // function appleLocalizationLine(id, content) {
  //   return "\"" + id + "\"=\"" + content + "\""
  // }
  //
  // function androidLocalizationLine(id, content) {
  //   return "<string name=\"" + id + "\">" + content + "</string>"
  // }
};

// MARK:- Utility Functions
function prettifyStringsArray(unPrettyArray){
  var workingString = ""
  for (var i in unPrettyArray) {
    workingString += " - " + unPrettyArray[i] + "\n"
  }
  return workingString
}

// File Utilities
var FileUtil = {
  writeTextToFile: function(text, filePath) {
    var t = [NSString stringWithFormat:@"%@", text],
    f = [NSString stringWithFormat:@"%@", filePath];
    return [t writeToFile:f atomically:true encoding:NSUTF8StringEncoding error:nil];
  },

  readTextFromFile: function(filePath) {
    var fileManager = [NSFileManager defaultManager];
    if([fileManager fileExistsAtPath:filePath]) {
        return [NSString stringWithContentsOfFile:filePath encoding:NSUTF8StringEncoding error:nil];
    }
    return nil;
  },

  jsonFromFile: function(filePath, mutable) {
    var data = [NSData dataWithContentsOfFile:filePath];
	  var options = mutable == true ? NSJSONReadingMutableContainers : 0
	  return [NSJSONSerialization JSONObjectWithData:data options:options error:nil];
  },

  saveJsonToFile: function(jsonObj, filePath) {
    this.writeTextToFile(stringify(jsonObj), filePath);
  },

  stringify: function(obj, prettyPrinted) {
    var prettySetting = prettyPrinted ? NSJSONWritingPrettyPrinted : 0,
    jsonData = [NSJSONSerialization dataWithJSONObject:obj options:prettySetting error:nil];
    return [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
  },

  createTempFolderNamed: function(name) {
    var tempPath = getTempFolderPath(name);
    createFolderAtPath(tempPath);
    return tempPath;
  },

  getTempFolderPath: function(withName) {
    var fileManager = [NSFileManager defaultManager],
    cachesURL = [[fileManager URLsForDirectory:NSCachesDirectory inDomains:NSUserDomainMask] lastObject],
    withName = (typeof withName !== 'undefined') ? withName : (Date.now() / 1000),
    folderName = [NSString stringWithFormat:"%@", withName];
    return [[cachesURL URLByAppendingPathComponent:folderName] path];
  },

  createFolderAtPath: function(pathString) {
    var fileManager = [NSFileManager defaultManager];
    if([fileManager fileExistsAtPath:pathString]) return true;
    return [fileManager createDirectoryAtPath:pathString withIntermediateDirectories:true attributes:nil error:nil];
  },

  removeFileOrFolder: function(filePath) {
    [[NSFileManager defaultManager] removeItemAtPath:filePath error:nil];
  }
}

function exportArtboardImagesUsingMSAPI(document) {
  var page = [document currentPage]
  var artboards = [document artboards]

  for (i = 0; i < artboards.length; i++) {
    var thisArtboard = artboards[i]
    log(thisArtboard.name())
    exportImage(document, {
        suffix: "",
        format: "png",
        layer: thisArtboard,
        path: NSHomeDirectory() + '/Desktop/AppScreenshots',
        scale: 2,
        name: thisArtboard.name()
    });
  }
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

// Logger Functions
function LTLog(content){
  log("[" + kLoggerPrefix + "] " + content)
}

function logVersionInfo(sketch){
  LTLog("LingoTool Exporter Started [" + kVersion + "]")
  LTLog("Sketch Verion: " + sketch.version + " Sketch Build: " +  sketch.build + " Sketch Full Version: " + sketch.full_version)
}
