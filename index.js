
/**
 * Expose `doc`.
 */

exports = module.exports = doc;

/**
 * Sub-cookbooks.
 */

exports.objects = [
  'cheatsheet',
  'tutorial'
];

/**
 * Alternative names for commands.
 */

exports.aliases = {
  cheatsheets: 'cheatsheet',
  tutorials: 'tutorial'
};

function doc(name) {
  return require.resolve('./lib/resources/' + name);
}