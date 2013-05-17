var template = require('jsdoc/template'),
    fs = require('jsdoc/fs'),
    path = require('jsdoc/path'),
    taffy = require('taffydb').taffy,
    handle = require('jsdoc/util/error').handle,
    helper = require('jsdoc/util/templateHelper'),
    htmlsafe = helper.htmlsafe,
    linkto = helper.linkto,
    resolveAuthorLinks = helper.resolveAuthorLinks,
    scopeToPunc = helper.scopeToPunc,
    hasOwnProp = Object.prototype.hasOwnProperty,
    data,
    view,
    outdir = env.opts.destination;

exports.publish = function(taffyData, opts, tutorials) {
  data = taffyData;

  var conf = env.conf.templates || {};
  conf['default'] = conf['default'] || {};

  var templatePath = opts.template;
  view = new template.Template(templatePath + '/tmpl');

  // claim some special filenames in advance, so the All-Powerful Overseer of Filename Uniqueness
  // doesn't try to hand them out later
  var indexUrl = helper.getUniqueFilename('cheatsheet');
  // don't call registerLink() on this one! 'index' is also a valid longname

  var globalUrl = helper.getUniqueFilename('global');
  helper.registerLink('global', globalUrl);

  // set up templating
  view.layout = 'layout.tmpl';

  var sourceFiles = {};
  var sourceFilePaths = [];

  // console.log('taffyData:', taffyData);
  
  console.log('outdir:', outdir);
  console.log('templatePath:', templatePath);


  data = helper.prune(data);
  data.sort('longname, version, since');
  helper.addEventListeners(data);


  var sourceFiles = {};
  var sourceFilePaths = [];
  // data().each(function(doclet) {
  //      doclet.attribs = '';
      
  //     if (doclet.examples) {
  //         doclet.examples = doclet.examples.map(function(example) {
  //             var caption, code;
              
  //             if (example.match(/^\s*<caption>([\s\S]+?)<\/caption>(\s*[\n\r])([\s\S]+)$/i)) {
  //                 caption = RegExp.$1;
  //                 code    = RegExp.$3;
  //             }
              
  //             return {
  //                 caption: caption || '',
  //                 code: code || example
  //             };
  //         });
  //     }
  //     if (doclet.see) {
  //         doclet.see.forEach(function(seeItem, i) {
  //             doclet.see[i] = hashToLink(doclet, seeItem);
  //         });
  //     }

  //     // build a list of source files
  //     var sourcePath;
  //     var resolvedSourcePath;
  //     if (doclet.meta) {
  //         sourcePath = getPathFromDoclet(doclet);
  //         resolvedSourcePath = resolveSourcePath(sourcePath);
  //         sourceFiles[sourcePath] = {
  //             resolved: resolvedSourcePath,
  //             shortened: null
  //         };
  //         sourceFilePaths.push(resolvedSourcePath);
  //     }
  // });

  // copy the template's static files to outdir
  var fromDir = path.join(templatePath, 'static');
  var staticFiles = fs.ls(fromDir, 3);

  staticFiles.forEach(function(fileName){
    var toDir = fs.toDir( fileName.replace(fromDir, outdir) );
    fs.mkPath(toDir);
    fs.copyFileSync(fileName, toDir);
  });

  console.log('gen outdiur');

  // generate index.html
  generate('Tower Cheat Sheet',
        [],
    indexUrl);

  console.log("-------------------END--------------------");
};

function generate(title, docs, filename, resolveLinks) {
  console.log("-------------------GENERATE--------------------");
  resolveLinks = resolveLinks === false ? false : true;

  var docData = {
    title: title,
    docs: docs
  };

  var outpath = path.join(outdir, filename),
  html = view.render('main.tmpl', docData);

  if (resolveLinks) {
        html = helper.resolveLinks(html); // turn {@link foo} into <a href="foodoc.html">foo</a>
  }

  console.log('generate out:', outpath);
  fs.writeFileSync(outpath, html, 'utf8');
}

function generateSourceFiles(sourceFiles) {
  Object.keys(sourceFiles).forEach(function(file) {
    var source;
    // links are keyed to the shortened path in each doclet's `meta.filename` property
    var sourceOutfile = helper.getUniqueFilename(sourceFiles[file].shortened);
    helper.registerLink(sourceFiles[file].shortened, sourceOutfile);

    try {
      source = {
        kind: 'source',
        code: helper.htmlsafe( fs.readFileSync(sourceFiles[file].resolved, 'utf8') )
      };
    }
    catch(e) {
      handle(e);
    }

    generate('Source: ' + sourceFiles[file].shortened, [source], sourceOutfile,
      false);
  });
}