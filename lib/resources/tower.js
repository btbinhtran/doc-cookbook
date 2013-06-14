
/**
 * Module dependencies.
 */

var fs = require('fs');
var exec = require('child_process').exec;
var tfs = require('tower-fs');
var path = require('path');
var ejs = require('ejs');
var path = require('path');
var dox = require('dox');
var mkdirp = require('mkdirp');
var _ = require('underscore');

/**
 * Options and Defaults.
 */

var ignoredDirs = 'test,public,static,views,templates, components,node_modules';

/**
 * Template used to produce the documentation.
 */

exports.templatePath = path.resolve(__dirname, '../../templates/tower/docs.ejs');

/**
 * Parse source code to produce documentation.
 * @param {Array} modules Array with all module dox data
 * @param {Object} options Object for rendering options
 * @return {String} doc html string
 */

exports.render = function(modules, options){
  var template = fs.readFileSync(exports.templatePath, 'utf-8');
  var locals = { filename: exports.templatePath };

  // if (files) {
  //   options.structure = [];

  //   files.forEach(function(f){
  //     f.currentFile = file.targetFile;
  //     options.structure.push(buildStructureForFile(f));
  //   });
  // } else {
  //   options.structure = new Array(buildStructureForFile(file));
  // }
  
  return ejs.compile(template, locals)(modules);
};

/**
 * Test if a method should be ignored or not
 *
 * @param  {Object} method
 * @return {Boolean} true if the method is not private nor must be ignored
 * @api private
 */

exports.shouldPass = function(method){
  if (method.isPrivate || method.ignore) return false;

  var ignored = method.tags.filter(function(tag){
    return 'private' === tag.type || 'ignore' === tag.type;
  });

  return 0 === ignored.length;
};

/**
 * Collect files in source directory.
 * @param {String} source Path to source
 * @param {Object} options Collecting options
 * @return {Array} containing the module file paths
 */

exports.collectFiles = function(source, options, callback){
  var dirtyFiles = [];
  var ignore = options.ignore || [];
  var files = [];

  // If more paths are given with the --source flag
  if (source.split(',').length > 1) {
    var dirtyPaths = source.split(',');

    dirtyPaths.forEach(function(dirtyPath){
      dirtyFiles = dirtyFiles.concat(require('walkdir').sync(path.resolve(process.cwd(), dirtyPath),{follow_symlinks:true
      }));
    });
  } else {
    // Just one path given with the --source flag
    source  = path.resolve(process.cwd(), source);
    dirtyFiles = require('walkdir').sync(source,{follow_symlinks:true}); // tee hee!
  }
  
  dirtyFiles.forEach(function(file){
    file = path.relative(process.cwd(), file);
    
    var doNotIgnore = _.all(ignore, function(d){
      // return true if no part of the path is in the ignore list
      return (file.indexOf(d) === -1);
    });
    
    if ((file.substr(-2) === 'js' || file.substr(-5) === 'tower' || file.substr(-11) === 'postinstall') && doNotIgnore) {
      files.push(file);
    }
  });

  return files;
};

/**
 * Make sure the folder structure in target mirrors source.
 */

exports.createTargetFolders = function(target, files){
  var folders = [];
  // Ensure that the target folder exists
  mkdirp.sync(target);
  
  files.forEach(function(file){
    var folder = file.substr(0, file.lastIndexOf('/'));

    if ((folder !== '') && (folders.indexOf(folder) === -1)) {
      folders.push(folder);
      mkdirp.sync(path.join(target, folder));
    }
  });
};

/**
 * Dox all the files found by collectFiles.
 */

exports.doxFiles = function(source, target, options, files){
  var result;

  files = files.map(function(file) {
    try {
      // If more paths are given with the --source flag
      if (source.split(',').length >= 1) {
        var tmpSource = source.split(',');

        tmpSource.forEach(function(s){
          if (file.indexOf(s) !== -1) {
            result = s;
          }
          
        });
      } else {
        result = source;
      }
      
      var content = fs.readFileSync(file).toString();
      
      return {
        sourceFile: file,
        targetFile: path.relative(process.cwd(),target) + path.sep + file + '.html',
        dox:        dox.parseComments(content, options)
      };

    } catch(err) {
      console.log(err);
    }
  });

  return files;
};

function parseArgs(args) {
  var options = require('commander')
    .option('-s --source [value]', 'Path to Tower source directory')
    .option('-r, --raw', 'output \'raw\' comments, leaving the markdown intact')
    .option('-d, --debug', 'output parsed comments for debugging')
    .option('-t, --target-file-path <string>', 'The file you write to')
    .option('-i, --ignore <directories>', 'Comma seperated list of directories to ignore. Overrides default of ' + ignoredDirs)
    .option('-o, --output-directory [value]', 'Output directory', process.cwd())
    .parse(args);

  return options;
}

exports.create = function(recipe, args, fn){
  console.log('Generating Tower Docs...');
  var options = parseArgs(args);
  var towerPath = options.outputDirectory; // Path to tower directory of submodules
  var docPath = path.join(options.outputDirectory, 'docs');
  var packagePath = path.join(towerPath, 'package.json');
  var componentPath = path.join(towerPath, 'component.json');
  var moduleData = fs.existsSync(packagePath)
    ? require(packagePath)
    : fs.existsSync(componentPath)
      ? require(componentPath)
      : { name: 'doc', version: '0.0.1' };
  var title = ["'", moduleData.name, ' ', moduleData.version, "'"].join('');
  var rootPath = path.normalize(__dirname + '/../../');

  // Cleanup and turn into an array the ignoredDirs
  var ignore = options.ignore || ignoredDirs;
  ignore = ignore.trim().replace(' ','').split(',');

  var towerModules = ['adapter', 'cookbook', 'expression', 'route', 'type', 'cli', 'directive', 'query', 'template', 'validator', 'content', 'element', 'resource', 'text'];

  // Build docs from latest modules by through git clone
  var tempModulesPath = path.join(towerPath, '.temp_tower_modules');
  var numModules = 0;
  var targetFilePath = options.targetFilePath;

  // XXX: Need to do something smarter
  // if (tfs.existsSync(tempModulesPath))
  //   tfs.removeDirectoryRecursiveSync(tempModulesPath);

  towerModules.forEach(function(module){
    var modulePath = path.join(tempModulesPath, module),
        commandStr = 'git clone https://github.com/tower/' +
        module + '.git' + ' ' + modulePath,
        files;

    // XXX: Don't git clone
    commandStr = '';

    var execCB = function(err, stdout, stderr){
      if (err) {
        console.log('clone failed' + err.toString());
        exec(commandStr, execCB);
      } else {
        numModules += 1;

        files = exports.collectFiles(modulePath, { ignore: ignore });

        exports.createTargetFolders(docPath, files);

        files = exports.doxFiles(modulePath, docPath, { raw: options.raw }, files);


        // Set correct paths to produce the index.html file
        files.push({
          sourceFile: targetFilePath,
          targetFile: targetFilePath,
          dox: []
        });

        files.hasMethods = files.some(function(element, index, array) {
          return element.dox.some(function(cData, index, array) {
            return cData.ctx && (cData.ctx.type === 'function' || cData.ctx.type === 'method');
          });
        });
        files.hasProperties = files.some(function(element, index, array) {
          return element.dox.some(function(cData, index, array) {
            return cData.ctx && (cData.ctx.type === 'property');
          });
        });
        files.hasClasses = files.hasProperties = files.some(function(element, index, array) {
          return element.dox.some(function(cData, index, array) {
            return cData.ctx && (cData.ctx.type === 'class');
          });
        });

        files.properties = [];
        files.methods = [];
        files.classes = [];

        for (var i = 0, len = files.length; i < len; i += 1){
          var file = files[i];
          for (var j = 0, len2 = file.dox.length; j < len2; j += 1){
            var cData = file.dox[j];

            var isClass = cData.tags.some(function(ele, index, array){
              return ele.type === 'class';
            });

            var isClassMethod = cData.ctx && (typeof cData.ctx.constructor !== 'undefined' && cData.ctx.type === 'method');

            if (isClass) {
              cData.methods = [];
              cData.properties = [];
              files.classes.push(cData);
            } else if (isClassMethod) {
              for (var c = files.classes.length - 1; c >= 0; c -= 1){
                var aClass = files.classes[c];
                if (cData.ctx.constructor === aClass.ctx.name){
                  files.classes[c].methods.push(cData);
                  break;
                }
              }
            } else if (cData.ctx){
              if (cData.ctx.type === 'property')
                files.properties.push(cData);
              else if (cData.ctx.type === 'method' || cData.ctx.type === 'function'){
                files.methods.push(cData);
              } 
            }
          }
        }

        towerModules[module] = files;
      }
      if (numModules >= towerModules.length){
        console.log('All modules cloned!');
        
        // Render and save all file documentation into one big file
        var output = exports.render({ modules: towerModules }, options);

        fs.writeFileSync(targetFilePath, output);

        console.log('Finished generating tower docs!');
        fn();
      }
    };
    exec(commandStr, execCB);
  });
};

/**
  * Return a list of methods for the side navigation.
  *
  * @param {Object} file
  * @return {Object} Object formatted for template nav helper
  * @api private
  */

function buildStructureForFile(file) {
  var names = [];
  var targetLink;

  if (file.dox.length === 0) return false;

  file.dox.forEach(function(method){
    if (method.ctx) names.push(method.ctx.name);
  });

  // How deep is your love?
  // If the splitted currentFile (the file we are currently rendering) path got one folder
  // in the path or more, add ../ for each level found
  if (file.currentFile && file.currentFile.split('/').length > 1 ) {
    // Depth of current file
    var depth = file.currentFile.split('/').length,
    // Create a prefix with n "../"
    prefix = new Array(depth).join('../');
    // Set up target link with prefix
    targetLink = prefix + file.targetFile;
  } else {
    // Link does not have to be altered
    targetLink = file.targetFile;
  }

  return {
    source: file.sourceFile,
    target: file.targetFile,
    methods: names,
    link: targetLink
  };
}
