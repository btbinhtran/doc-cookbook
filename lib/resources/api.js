
/**
 * Module dependencies.
 */

var exec = require('child_process').exec;
var path = require('path');

/**
 * Generate documentation.
 */

exports.create = function(recipe, args, fn){
  var options = parseArgs(args);
  var towerPath = args[4] || options.outputDirectory; // Path to tower directory of submodules
  var packagePath = path.join(towerPath, 'package.json');
  var moduleData = require(packagePath);
  var docPath = path.join(options.outputDirectory, 'docs');
  var title = ["'", moduleData.name, ' ', moduleData.version, "'"].join('');
  var rootPath = path.normalize(__dirname + '/../../');
  var templatesPath = path.join(rootPath, 'templates/api');
  var templatePath = path.join(templatesPath, 'template.jade');

  console.log('Compiling tower source docs...')

  var cmd = [
    path.join(rootPath, 'node_modules/.bin/dox-foundation'),
    '--title', title,
    '--template', templatePath,
    '--source', towerPath,
    '--target', docPath,
    '--ignore test,build,components,public,static,views,node_modules,.idea'
  ].join(' ');

  exec(cmd, function(error, stdout, stderr){
    console.log(error);
    console.log(stdout);
    console.log(stderr);

    console.log('Finished compiling tower source docs!');
    fn();
  });
};

function parseArgs(args) {
  var options = require('commander')
    .option('-o, --output-directory [value]', 'Output directory', process.cwd())
    .parse(args);

  return options;
}