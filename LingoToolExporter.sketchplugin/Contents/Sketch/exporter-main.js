var kVersion = "0.1.0"
var kLoggerPrefix = "LingoTool"
var kFolderName = "LingoTool Preview"
var kDifferentalCharacter = "."
var kPOFile = NSHomeDirectory() + '/Desktop/AppTranslations.po'
var kImageFolder = NSHomeDirectory() + '/Desktop/AppScreenshots'
var deprecatedDocument = []
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
      var newRect = this.p_absoluteFrameForLayer(layer)
      var color = layer.text.indexOf(layer.name) == 0 ? "#E8AE2B50" : "#4BCA0F30"
      rootLayer.newShape({"frame": newRect, fills: [color], borders: []})
      // rootLayer.setIsLocked(1)
      // var msLayer = Util.findMSItemWithId(deprecatedDocument, rootLayer.id)
      // msLayer.setIsLocked(1)
    },
    
    

    p_absoluteFrameForLayer: function(layer) {
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
    var newName = name.trim().replace(/[,\/#!$%\^&\*;:{}=`~()]/g,"").replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();})
    newName = newName.split('.').filter(txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()).join("")
    newName = newName.split(' ').filter(txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()).join("")
    newName = newName.split('_').filter(txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()).join("")
    newName = newName.split('-').filter(txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()).join("")
    return newName
  },
  nameForiOS: function(name) {
    return str.trim().replace(/[.,\/#!$%\^&\*;:{}=`~()]/g,"").replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}).replace(" ", "")
  },
  nameForAndroid: function(name) {
    return str.trim().replace(/[,\/#!$%\^&\*;:{}=`~()]/g,"").replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}).replace(" ", "_")
  },
  findTextLayers: function(layer, path) {
    var textLayers = []
    if (layer.isText && this.isValidName(layer)) {
      var foundObject = []
      foundObject['layer'] = layer
      foundObject['path'] = path + kDifferentalCharacter + this.cleanName(layer.name)
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
  displayUserMessage: function(message){
      var app = NSApplication.sharedApplication()
      app.displayDialog_withTitle(message, "LingoTool")
  },
  
  findMSItemWithId: function(document, id) {
    var page = [deprecatedDocument currentPage]
    var artboards = [deprecatedDocument artboards]
    for (var i = 0; i < [artboards count]; i++) {
    //  return this.findMSItemFromRoot(artboards[i], id)
    }
  },
  
  findMSItemFromRoot: function(currentItem, id) {
    if ([currentItem objectID] == id) {
      return currentItem
    }
    
    if ([currentItem isKindOfClass:[MSLayerGroup class]]) {
      var layers = [currentItem layers]
      log(layers)

      for (var i = 0; i < [layers count]; i++) {
        return Util.findMSItemWithId(layers[i], id)
      }
    }
    return
  }
}


function onPreviewToggle(context) {
  var sketch = context.api()
  deprecatedDocument = context.document
  PreviewHelper.init(sketch, context)
  logVersionInfo(sketch)

  var selectedPage = sketch.selectedDocument.selectedPage
  

  selectedPage.iterate(function(layer) {
    if (layer.isArtboard) {
      if (PreviewHelper.groupExistsFromArtboard(layer)) {
        PreviewHelper.removeGroupFromArtboard(layer)
        return
      }
      
      PreviewHelper.removeGroupFromArtboard(layer)
      var path = LayerHelper.cleanName(layer.name)
      var textObjects = LayerHelper.findTextLayers(layer, path)
      
      var container = PreviewHelper.createGroupFromArtboard(layer)
      for (var i in textObjects) {
        PreviewHelper.highlightTextLayers(container, textObjects[i]['layer'])
      }
      // container.setIsLocked(1)
    }
  });
}


var ExportHelper = {
  init(sketchAPI){
    this.sketchAPI = sketchAPI
  },
  
  getPoHeader: function() {
    return 'msgid ""\n' +
    'msgstr ""\n' +
    '"Project-Id-Version: CExample\\n"\n' +
    '"Report-Msgid-Bugs-To: \\n"\n' +
    '"POT-Creation-Date: 2016-12-12 11:29+0000\\n"\n' +
    '"PO-Revision-Date: 2017-01-16 12:20+0000\\n"\n' +
    '"Last-Translator: \\n"\n' +
    '"Language-Team: \\n"\n' +
    '"Language: en\\n"\n' +
    '"MIME-Version: 1.0\\n"\n' +
    '"Content-Type: text/plain; charset=UTF-8\\n"\n' +
    '"Content-Transfer-Encoding: 8bit\\n"\n' +
    '"Plural-Forms: nplurals=1; plural=0;\\n"\n' +
    '"X-Generator: Weblate 2.9\\n"\n'
    
  },
  
  producePoFromat(path, layer) {
    return `
msgctxt "${path}"
msgid "${layer.text}"
msgstr "${layer.text}"
`
  },

  p_exportImageWithDefaultOptions: function(artboardLayer) {
    this.p_exportImage({
        layer: artboardLayer,
        path: NSTemporaryDirectory(),
        scale: 1,
        suffix: "",
        format: "png",
        path: kImageFolder,
        name: artboardLayer.name
    });
  },

  // TODO: Replace with Sketch API Export when available
  exportArtboardImagesUsingMSAPI: function(document) {
    var page = [document currentPage]
    var artboards = [document artboards]
    
    for (i = 0; i < artboards.length; i++) {
      var thisArtboard = artboards[i]
      this.exportImage(document, {
          suffix: "",
          format: "png",
          layer: thisArtboard,
          path: kImageFolder,
          scale: 2,
          name: thisArtboard.name()
      });
    }
  },

  exportImage: function(document, options) {
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
}

function onExportAllStrings(context) {
  var sketchAPI = context.api()
  ExportHelper.init(sketchAPI)
  // Setup
  logVersionInfo(sketchAPI)

  var document = context.document
  var selectedPage = sketchAPI.selectedDocument.selectedPage

  var artboardStore = []
  
  var rootName = selectedPage.name

  var newCopy = ""
  var existingPoFileContent = FileUtil.readTextFromFile(kPOFile)
  var ammendedCopy = existingPoFileContent
  
  if (ammendedCopy == null) {
    ammendedCopy = ExportHelper.getPoHeader()
  }
  
  selectedPage.iterate(function(layer) {
    if (layer.isArtboard) {
      var startMaker = `#: < -- ${layer.id} {`
      var endMaker = `#: } ${layer.id} -- >`
      var prefix = `${startMaker}\n#:   -- Artboard name: ${rootName} \n#:   -- Page name: ${layer.name} \n#:   -- Updated at: ` + new Date() + '#:   -- Generated by SketchLingo'
      
      
      var textLayers = LayerHelper.findTextLayers(layer, rootName)
      var overallContent = prefix + '\n'
      
      // If no text layers then return
      if (textLayers.length == 0) {
        return
      }
      
      for (var i in textLayers) {
        var thisTextHolder = textLayers[i]
        var thisTextLayer = thisTextHolder['layer']
        var thisTextPath = thisTextHolder['path']
        var poContent = ExportHelper.producePoFromat(thisTextPath, thisTextLayer)
        overallContent += poContent
      }
      
      overallContent += '\n' + endMaker
      
      // Find Marker in and out points
      var startMarkerPos = ammendedCopy ? ammendedCopy.indexOf(startMaker) : -1
      var endMarkerPos = ammendedCopy ? ammendedCopy.indexOf(endMaker) : -1
      
      // If content already exists so replace
      if (startMarkerPos > -1 && endMarkerPos > -1) {
        
        // A rather dirty find a replace
        // TODO: Clean this dirt
        var currentContent = ammendedCopy.substring(startMarkerPos) // find start position
        var endContentMarkerPos = currentContent.indexOf(endMaker) // find length
        currentContent = currentContent.substring(0, endContentMarkerPos) // take 0 to length content
        ammendedCopy = ammendedCopy.replace(currentContent + endMaker, overallContent) // replace this content with out new content  
      } else {
        // Append copy on to the end
        newCopy += '\n' + overallContent + '\n\n'     
      }    
    }
  })
  var allContent = ammendedCopy + newCopy
  
  FileUtil.writeTextToFile(allContent, kPOFile)
  
  Util.displayUserMessage("Exported strings")
  
  ExportHelper.exportArtboardImagesUsingMSAPI(document)
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

// Logger Functions
function LTLog(content){
  log("[" + kLoggerPrefix + "] " + content)
}

function logVersionInfo(sketch){
  LTLog("LingoTool Exporter Started [" + kVersion + "]")
  LTLog("Sketch Verion: " + sketch.version + " Sketch Build: " +  sketch.build + " Sketch Full Version: " + sketch.full_version)
}
