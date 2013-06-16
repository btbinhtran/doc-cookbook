# Tower Doc Cookbook

## Installation

node.js:

```bash
npm install tower-doc-cookbook
```

## Examples

Generate Tower API docs with newly cloned modules (Do this to generate the latest docs):

```bash
$ tower create doc:tower -t views/docs.ejs
```

Generate Tower API docs with existing cloned modules:

```bash
$ tower create doc:tower -t views/docs.ejs -g false
```

## Contributing

Before you send a pull request, make sure your code meets the style guidelines at [https://github.com/tower/style-guide](https://github.com/tower/style-guide) and all tests pass.

## Licence

MIT