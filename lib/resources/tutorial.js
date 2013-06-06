
/**
 * Generate a new tutorial.
 */

exports.create = function(recipe, args, fn){
  var options = parseArgs(args);
  var projectName = args[4];

  recipe.outputDirectory(options.outputDirectory);
  recipe.set('projectName', projectName);
  recipe.set('strcase', require('tower-strcase'));
  recipe.directory(projectName, function(){
    // XXX: Failing because of undefined sourcePath value within the recipe object's template function
    // recipe.template('index.md', 'tutorial.md');
    recipe.directory('chapters');
  });
  
  fn();
};

function parseArgs(args) {
  var options = require('commander')
    .option('-o, --output-directory [value]', 'Output directory', process.cwd())
    .parse(args);

  return options;
}