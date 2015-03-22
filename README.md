# Edwood [![Build Status](https://api.travis-ci.org/croizier/edwood.svg?branch=master)](https://travis-ci.org/croizier/edwood) [![Bower version](https://badge.fury.io/bo/edwood.svg)](http://badge.fury.io/bo/edwood) [![npm version](https://badge.fury.io/js/edwood.svg)](http://badge.fury.io/js/edwood)

Edwood is a JavaScript library for building in-browser schema-aware XML editors.

### Features

An editor built with Edwood will display an XML document as the HTML document of your choice. It will show validation errors in real time, and let the user correct them in-place. In the end, it will serialize the document so that the user can save it back.

Validation is incremental, so revalidating a document after a modification is much faster than validating it the first time.

Edwood understands [Relax NG](http://relaxng.org/tutorial-20011203.html) schemas.

### Usage

At the document level, Edwood offers a DOM interface for you to edit an XML document and locate validation errors.
At the UI level, Edwood provides [React](http://facebook.github.io/react/) components to edit a document or part of it.
An Edwood application is really a React application that uses an Edwood DOM as its model and Edwood components in its views.

You can use Edwood in plain JavaScript (ES5) and we also provide a TypeScript API. Edwood itself is written in TypeScript.

Have a look at the [demo](http://croizier.github.io/edwood.html) for an example.

### Limitations

The project is at an early stage. API is very likely to change.

You must write schemas in Relax NG [simple syntax](http://relaxng.org/spec-20011203.html#simple-syntax), without external reference nor include. `ns` attribute of `data` and `value` patterns are ignored.

Edwood supports only a few XML Schema datatypes and facets for now.

Edwood performs global (not yet incremental) rendering, which is unsuitable for large XML documents.

### License

Released under the MIT license.
