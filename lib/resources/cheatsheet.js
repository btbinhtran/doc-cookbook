
/**
 * Module dependencies.
 */

var exec = require('child_process').exec;

/**
 * Generate the tower cheatsheet.
 *
 * XXX: or maybe this can generate a cheatsheet
 *      from any tower app.
 */

exports.create = function(recipe, args, fn){
  var rootPath = __dirname + '/../../';
  var templatesPath = rootPath + 'templates/';
  var templateName = 'cheatsheet';

  console.log('Compiling cheatsheet...');

  var cmd = [
    'jsdoc -d', rootPath + 'cheatsheet', '-t',
    templatesPath + templateName,
    rootPath + 'index.js'
  ].join(' ');

  exec(cmd, function(error, stdout, stderr){
    console.log('Finished compiling cheatsheet!');
    fn();
  });
};