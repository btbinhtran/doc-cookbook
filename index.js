/**
 * Expose `doc`.
 */

exports = module.exports = doc;

/**
 * Sub-cookbooks.
 *
 * XXX: Maybe they're called `commands`?
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
}

function doc(name) {
  return require.resolve('./lib/models/' + name);
}