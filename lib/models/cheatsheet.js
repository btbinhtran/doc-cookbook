var exec = require('child_process').exec
  , jsdocProc;

exports.create = function(recipe, args, fn){
  var rootPath = __dirname + '/../../',
    templatesPath = rootPath + 'templates/',
    templateName = 'cheatsheet';
  console.log('create exec:', templatesPath),
  commandStr = [
    'jsdoc -d', rootPath + 'cheatsheet', '-t',
    templatesPath + templateName,
    rootPath + 'index.js'];

  jsdocProc = exec(commandStr.join(' '), function(error, stdout, stderr){
    console.log('Finished compiling docs!');
    fn();
  });
};