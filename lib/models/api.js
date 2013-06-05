var exec = require('child_process').exec,
    path = require('path'),
    moduleData,
    doxProc;

var options = {
  title: 'Tower'
};

exports.create = function(recipe, args, fn){
  var options = parseArgs(args),
      towerPath = args[4] || options.outputDirectory, // Path to tower directory of submodules
      docPath = path.join(options.outputDirectory, 'docs'),
      packagePath = path.join(towerPath, 'package.json'),
      moduleData = require(packagePath),
      title = ["'", moduleData.name, ' ', moduleData.version, "'"].join(''),
      rootPath = path.normalize(__dirname + '/../../'),
      templatesPath = path.join(rootPath, 'templates/api'), 
      templatePath = path.join(templatesPath, 'template.jade');

  console.log('Compiling tower source docs...')

  commandStr = [
    path.join(rootPath, 'node_modules/.bin/dox-foundation'),
    '--title', title,
    '--template', templatePath,
    '--source', towerPath,
    '--target', docPath,
    '--ignore test,build,components,public,static,views,node_modules,.idea'
  ];

  doxProc = exec(commandStr.join(' '), function(error, stdout, stderr){
    console.log('--------ERROR----------');
    console.log(error);
    console.log('-----------endERROR-----');
    console.log('---------STDOUT----------');
    console.log(stdout);
    console.log('-----------endSTDOUT-----');
    console.log('---------STDERR----------');
    console.log(stderr);
    console.log('-----------endSTDERR-----');

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