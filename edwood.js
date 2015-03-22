(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory(require("React"));
	else if(typeof define === 'function' && define.amd)
		define(["React"], factory);
	else if(typeof exports === 'object')
		exports["edwood"] = factory(require("React"));
	else
		root["edwood"] = factory(root["React"]);
})(this, function(__WEBPACK_EXTERNAL_MODULE_1__) {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	exports.dom = __webpack_require__(2);
	exports.parser = __webpack_require__(3);
	var React = __webpack_require__(1);
	var html = React.DOM;
	exports.Cell = React.createClass({
	    displayName: 'Cell',
	    componentDidMount: function () {
	        this.handleProps(this.props);
	        var that = this;
	        this.interval = window.setInterval(function () {
	            var node = that.props.node;
	            var state = that.state;
	            var value = that.getInput().value;
	            if (value !== state.domValue)
	                node.textContent = value;
	        }, 200);
	    },
	    componentWillReceiveProps: function (nextProps) {
	        this.handleProps(nextProps);
	    },
	    componentWillUnmount: function () {
	        window.clearInterval(this.interval);
	    },
	    getInitialState: function () {
	        return this.toState(this.props);
	    },
	    render: function () {
	        var state = this.state;
	        var color = (state.domError || state.localError) ? '#f66' : '#eef';
	        return html.input({
	            size: 5,
	            style: { border: 0, backgroundColor: color, spellCheck: false },
	            value: state.localValue,
	            onChange: this.handleChange,
	        });
	    },
	    getInput: function () {
	        return React.findDOMNode(this);
	    },
	    handleChange: function () {
	        var node = this.props.node;
	        var state = this.state;
	        var value = this.getInput().value;
	        this.setState({
	            localValue: value,
	            localError: !node.allows(value),
	        });
	    },
	    handleProps: function (props) {
	        this.setState(this.toState(props));
	    },
	    toState: function (props) {
	        var node = props.node;
	        var text = node.textContent;
	        var error = node.ownerDocument.getError();
	        var ko = error && (error.attribute === node || error.element === node);
	        return {
	            domValue: text,
	            domError: ko,
	            localValue: text,
	            localError: !node.allows(text),
	        };
	    },
	});
	exports.cell = React.createFactory(exports.Cell);
	exports.Universal;
	exports.Universal = React.createClass({
	    displayName: 'Universal',
	    render: function () {
	        var _this = this;
	        var e = this.props.element;
	        var as = e.attributes(null, function (a) { return _this.line(a.localName, a); });
	        var es = e.elements(null, function (c) { return React.createElement(exports.Universal, { key: c.key, element: c }); });
	        var content = es.length > 0 ? es : exports.cell({ node: e });
	        return html.div({ style: { margin: 5, padding: 5, border: 'thin solid' } }, html.h3({ style: { margin: 0 } }, e.localName), html.div({ style: { marginLeft: 20 } }, as, content));
	    },
	    line: function (title, node) {
	        return html.div({ key: node.key }, html.div({ style: { display: 'inline-block', marginRight: 5 } }, title), html.div({ style: { display: 'inline-block' } }, exports.cell({ node: node })));
	    }
	});
	exports.universal = React.createFactory(exports.Universal);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __WEBPACK_EXTERNAL_MODULE_1__;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	(function (Message) {
	    Message[Message["EOF"] = 1] = "EOF";
	    Message[Message["DATA"] = 2] = "DATA";
	    Message[Message["MISSING_ATTRIBUTE"] = 3] = "MISSING_ATTRIBUTE";
	    Message[Message["MISSING_CONTENT"] = 4] = "MISSING_CONTENT";
	    Message[Message["WRONG_ATTRIBUTE"] = 5] = "WRONG_ATTRIBUTE";
	    Message[Message["WRONG_ELEMENT"] = 6] = "WRONG_ELEMENT";
	})(exports.Message || (exports.Message = {}));
	var Message = exports.Message;


/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var dom = __webpack_require__(2);
	var gra = __webpack_require__(4);
	function checkElement(e1, e2) {
	    if (!(e1 instanceof ProxyElement))
	        throw new Error();
	    if (e2 && !(e2 instanceof ProxyElement))
	        throw new Error();
	}
	function pe(e) {
	    return e;
	}
	function info(node) {
	    var n = node;
	    if (!n._psvi)
	        n._psvi = {
	            proxy: null,
	            content: null,
	            pattern: null,
	            result: null
	        };
	    return n._psvi;
	}
	function wrapAttr(a) {
	    var i = info(a);
	    if (!i.proxy)
	        i.proxy = new ProxyAttr(a);
	    return i.proxy;
	}
	function wrapElement(e) {
	    var i = info(e);
	    if (!i.proxy)
	        i.proxy = new ProxyElement(e);
	    return i.proxy;
	}
	var errorAttr = function (a, message) { return { attribute: wrapAttr(a), element: null, message: message }; };
	var errorElem = function (e, message) { return { attribute: null, element: wrapElement(e), message: message }; };
	var proxyCount = 1;
	var ProxyAttr = (function () {
	    function ProxyAttr(node) {
	        this.node = node;
	        this.key = ':' + proxyCount++;
	        this.version = 1;
	        info(node).proxy = this;
	    }
	    Object.defineProperty(ProxyAttr.prototype, "localName", {
	        get: function () {
	            return this.node.localName;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ProxyAttr.prototype, "namespaceURI", {
	        get: function () {
	            return this.node.namespaceURI;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ProxyAttr.prototype, "textContent", {
	        get: function () {
	            return this.node.value;
	        },
	        set: function (content) {
	            this.node.value = content;
	            change(this);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ProxyAttr.prototype, "ownerElement", {
	        get: function () {
	            return wrapElement(this.node.ownerElement);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ProxyAttr.prototype, "ownerDocument", {
	        get: function () {
	            return this.node.ownerDocument._proxy;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    ProxyAttr.prototype.allows = function (text) {
	        var a = this.node;
	        var p = info(a).pattern;
	        if (!p)
	            return true;
	        var qn = p.fac.qname(a.namespaceURI || '', a.localName);
	        return p.att(qn, text) !== p.fac.notAllowed;
	    };
	    return ProxyAttr;
	})();
	var ProxyElement = (function () {
	    function ProxyElement(node) {
	        this.node = node;
	        this.key = ':' + proxyCount++;
	        this.version = 1;
	        info(node).proxy = this;
	    }
	    Object.defineProperty(ProxyElement.prototype, "localName", {
	        get: function () {
	            return this.node.localName;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ProxyElement.prototype, "namespaceURI", {
	        get: function () {
	            return this.node.namespaceURI;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ProxyElement.prototype, "textContent", {
	        get: function () {
	            return this.node.textContent;
	        },
	        set: function (content) {
	            this.node.textContent = content;
	            change(this);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ProxyElement.prototype, "ownerElement", {
	        get: function () {
	            var parent = this.node.parentNode;
	            if (parent === this.node.ownerDocument)
	                return null;
	            return wrapElement(parent);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(ProxyElement.prototype, "ownerDocument", {
	        get: function () {
	            return this.node.ownerDocument._proxy;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    ProxyElement.prototype.getAttributeNodeNS = function (namespace, localName) {
	        var attr = this.node.getAttributeNodeNS(namespace, localName);
	        return attr ? wrapAttr(attr) : null;
	    };
	    ProxyElement.prototype.setAttributeNS = function (namespace, localName, value) {
	        this.node.setAttributeNS(namespace, localName, value);
	        var a = this.getAttributeNodeNS(namespace, localName);
	        if (a === null)
	            throw new Error();
	        change(a);
	    };
	    ProxyElement.prototype.removeAttributeNS = function (namespace, localName) {
	        this.node.removeAttributeNS(namespace, localName);
	        change(this);
	    };
	    ProxyElement.prototype.appendChild = function (node) {
	        checkElement(node);
	        this.node.appendChild(pe(node).node);
	        change(node);
	    };
	    ProxyElement.prototype.insertBefore = function (node, child) {
	        checkElement(node, child);
	        this.node.insertBefore(pe(node).node, pe(child).node);
	        change(node);
	    };
	    ProxyElement.prototype.removeChild = function (child) {
	        checkElement(child);
	        this.node.removeChild(pe(child).node);
	        change(this);
	    };
	    ProxyElement.prototype.replaceChild = function (node, child) {
	        checkElement(node, child);
	        this.node.replaceChild(pe(node).node, pe(child).node);
	        change(child);
	    };
	    ProxyElement.prototype.allows = function (text) {
	        var p = info(this.node).content;
	        if (!p)
	            return true;
	        return p.text(text) !== p.fac.notAllowed;
	    };
	    ProxyElement.prototype.attributes = function (filter, mapper) {
	        var ts = [];
	        var as = this.node.attributes;
	        for (var i = 0; i < as.length; i++) {
	            var a = as.item(i);
	            var b = wrapAttr(a);
	            if (!filter || filter(b))
	                ts.push(mapper ? mapper(b, i) : b);
	        }
	        return ts;
	    };
	    ProxyElement.prototype.elements = function (filter, mapper) {
	        var i = 0;
	        var ts = [];
	        for (var c = this.node.firstElementChild; c; c = c.nextElementSibling) {
	            var e = wrapElement(c);
	            if (!filter || filter(e))
	                ts.push(mapper ? mapper(e, i++) : e);
	        }
	        return ts;
	    };
	    return ProxyElement;
	})();
	var ProxyDocument = (function () {
	    function ProxyDocument(xml, rng) {
	        this.changeActions = [];
	        this.version = 1;
	        this.doc = new DOMParser().parseFromString(xml, 'application/xml');
	        this.doc._proxy = this;
	        var doc = new DOMParser().parseFromString(rng, 'application/xml');
	        this.pattern = gra.parse(doc.documentElement);
	        this.validate();
	    }
	    Object.defineProperty(ProxyDocument.prototype, "documentElement", {
	        get: function () {
	            return wrapElement(this.doc.documentElement);
	        },
	        enumerable: true,
	        configurable: true
	    });
	    ProxyDocument.prototype.createElement = function (namespace, qualifiedName) {
	        var res = this.doc.createElementNS(namespace, qualifiedName);
	        return wrapElement(res);
	    };
	    ProxyDocument.prototype.getError = function () {
	        return this.error;
	    };
	    ProxyDocument.prototype.onChange = function (action) {
	        this.changeActions.push(action);
	    };
	    ProxyDocument.prototype.serialize = function () {
	        return new XMLSerializer().serializeToString(this.doc);
	    };
	    ProxyDocument.prototype.change = function (node) {
	        var first = this.error && (this.error.attribute || this.error.element);
	        if (first)
	            this.changeAncestors(first);
	        this.changeAncestors(node);
	        this.validate();
	        this.emitChange();
	    };
	    ProxyDocument.prototype.changeAncestors = function (n) {
	        n.version += 1;
	        var p = n.node;
	        info(p).result = null;
	        p = p instanceof Attr ? p.ownerElement : p.parentNode;
	        while (p !== this.doc) {
	            var i = info(p);
	            i.result = null;
	            var q = i.proxy;
	            if (q)
	                q.version += 1;
	            p = p.parentNode;
	        }
	        this.version += 1;
	    };
	    ProxyDocument.prototype.emitChange = function () {
	        this.changeActions.forEach(function (a) { return a(); });
	    };
	    ProxyDocument.prototype.validate = function () {
	        var element = this.doc.documentElement;
	        this.error = this.validateElement(element, this.pattern);
	    };
	    ProxyDocument.prototype.validateElement = function (e, p) {
	        var i = info(e);
	        if (i.pattern === p && i.result)
	            return null;
	        i.pattern = p;
	        i.result = null;
	        var no = p.fac.notAllowed;
	        p = p.start(p.fac.qname(e.namespaceURI || '', e.localName));
	        if (p === no)
	            return errorElem(e, 6 /* WRONG_ELEMENT */);
	        for (var j = 0; j < e.attributes.length; j++) {
	            var a = e.attributes.item(j);
	            if (a.name === 'xmlns' || a.name.match(/^xmlns:/))
	                continue;
	            info(a).pattern = p;
	            var qn = p.fac.qname(a.namespaceURI || '', a.localName);
	            p = p.att(qn, a.value);
	            if (p === no)
	                return errorAttr(a, 5 /* WRONG_ATTRIBUTE */);
	        }
	        p = p.close();
	        if (p === no)
	            return errorElem(e, 3 /* MISSING_ATTRIBUTE */);
	        i.content = p;
	        if (!e.firstElementChild) {
	            p = this.deriveText(p, e.textContent);
	            if (p === no)
	                return errorElem(e, 2 /* DATA */);
	        }
	        else {
	            for (var n = e.firstChild; n; n = n.nextSibling) {
	                switch (n.nodeType) {
	                    case Node.ELEMENT_NODE:
	                        var error = this.validateElement(n, p);
	                        if (error)
	                            return error;
	                        p = info(n).result;
	                        break;
	                    case Node.TEXT_NODE:
	                        var merged = this.mergeTextNodes(n);
	                        p = this.deriveText(p, merged.text);
	                        if (p === no)
	                            return errorElem(e, 2 /* DATA */);
	                        n = merged.node;
	                        break;
	                    case Node.COMMENT_NODE:
	                    case Node.PROCESSING_INSTRUCTION_NODE:
	                        break;
	                    case Node.ATTRIBUTE_NODE:
	                    case Node.DOCUMENT_NODE:
	                    case Node.DOCUMENT_TYPE_NODE:
	                    case Node.DOCUMENT_FRAGMENT_NODE:
	                        throw new Error('impossible node type: ' + n.nodeType);
	                    default:
	                        throw new Error('unknown node type: ' + n.nodeType);
	                }
	            }
	        }
	        p = p.end();
	        if (p === no)
	            return errorElem(e, 4 /* MISSING_CONTENT */);
	        i.result = p;
	        return null;
	    };
	    ProxyDocument.prototype.deriveText = function (p, text) {
	        var p1 = p.text(text);
	        return text.match(/^\s*$/) ? p.fac.choice(p, p1) : p1;
	    };
	    ProxyDocument.prototype.mergeTextNodes = function (node) {
	        var text = '';
	        while (true) {
	            if (node.nodeType === Node.TEXT_NODE)
	                text += node.textContent;
	            var next = node.nextSibling;
	            var ok = next && next.nodeType !== Node.ELEMENT_NODE;
	            if (ok)
	                node = next;
	            else
	                break;
	        }
	        return { text: text, node: node };
	    };
	    return ProxyDocument;
	})();
	function change(node) {
	    var doc = node.ownerDocument;
	    doc.change(node);
	}
	function parse(xml, rng) {
	    return new ProxyDocument(xml, rng);
	}
	exports.parse = parse;


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var pat = __webpack_require__(5);
	function parse(grammar) {
	    var fac = pat.factory();
	    function datatype(element) {
	        var uri = element.getAttribute('datatypeLibrary');
	        var localname = element.getAttribute('type');
	        return fac.datatype(uri, localname);
	    }
	    function parseExceptNameClass(element) {
	        if (!element || element.tagName !== 'except')
	            return null;
	        return parseNameClass(element.firstElementChild);
	    }
	    function parseNameClass(element) {
	        switch (element.tagName) {
	            case 'anyName':
	                var except = parseExceptNameClass(element.firstElementChild);
	                return except ? fac.anyNameExcept(except) : fac.anyName;
	            case 'nsName':
	                var except = parseExceptNameClass(element.firstElementChild);
	                var ns = element.getAttribute('ns');
	                return except ? fac.nsNameExcept(ns, except) : fac.nsName(ns);
	            case 'name':
	                var name = element.textContent;
	                var ns = element.getAttribute('ns') || '';
	                return fac.name(ns, name);
	            case 'choice':
	                var child1 = element.firstElementChild;
	                var child2 = child1.nextElementSibling;
	                var nc1 = parseNameClass(child1);
	                var nc2 = parseNameClass(child2);
	                return fac.nameClassChoice(nc1, nc2);
	        }
	    }
	    function parseParams(cursor) {
	        var params = [];
	        while (cursor && cursor.tagName === 'param') {
	            var name = cursor.getAttribute('name');
	            var value = cursor.textContent;
	            params.push({ name: name, value: value });
	            cursor = cursor.nextElementSibling;
	        }
	        return params;
	    }
	    function parseExceptPattern(element) {
	        if (!element || element.tagName !== 'except')
	            return null;
	        return parsePattern(element.firstElementChild);
	    }
	    function parsePattern(element) {
	        switch (element.tagName) {
	            case 'attribute':
	                var child1 = element.firstElementChild;
	                var child2 = child1.nextElementSibling;
	                var nc = parseNameClass(child1);
	                var p = parsePattern(child2);
	                return fac.attribute(nc, p);
	            case 'choice':
	                var child1 = element.firstElementChild;
	                var child2 = child1.nextElementSibling;
	                var p1 = parsePattern(child1);
	                var p2 = parsePattern(child2);
	                return fac.choice(p1, p2);
	            case 'data':
	                var uri = 'http://www.w3.org/2001/XMLSchema-datatypes';
	                var localname = element.getAttribute('type');
	                var datatype = fac.datatype(uri, localname);
	                var cursor = element.firstElementChild;
	                var params = parseParams(cursor);
	                var except = parseExceptPattern(cursor);
	                var derived = datatype.derive(params);
	                return except ? fac.dataExcept(derived, except) : fac.data(derived);
	            case 'empty':
	                return fac.empty;
	            case 'group':
	                var child1 = element.firstElementChild;
	                var child2 = child1.nextElementSibling;
	                var p1 = parsePattern(child1);
	                var p2 = parsePattern(child2);
	                return fac.group(p1, p2);
	            case 'interleave':
	                var child1 = element.firstElementChild;
	                var child2 = child1.nextElementSibling;
	                var p1 = parsePattern(child1);
	                var p2 = parsePattern(child2);
	                return fac.interleave(p1, p2);
	            case 'list':
	                var child = element.firstElementChild;
	                var p = parsePattern(child);
	                return fac.list(p);
	            case 'notAllowed':
	                return fac.notAllowed;
	            case 'oneOrMore':
	                var child = element.firstElementChild;
	                var p = parsePattern(child);
	                return fac.oneOrMore(p);
	            case 'ref':
	                var name = element.getAttribute('name');
	                return fac.ref(name);
	            case 'text':
	                return fac.text;
	            case 'value':
	                var uri = 'http://www.w3.org/2001/XMLSchema-datatypes';
	                var localname = element.getAttribute('type');
	                var datatype = fac.datatype(uri, localname);
	                var value = element.textContent;
	                return fac.value(datatype, value);
	            case 'zeroOrMore':
	                var child = element.firstElementChild;
	                var p = parsePattern(child);
	                return fac.choice(fac.empty, fac.oneOrMore(p));
	        }
	    }
	    var start = grammar.firstElementChild;
	    var top = parsePattern(start.firstElementChild);
	    for (var define = start.nextElementSibling; define; define = define.nextElementSibling) {
	        var name = define.getAttribute('name');
	        var element = define.firstElementChild;
	        var child1 = element.firstElementChild;
	        var child2 = child1.nextElementSibling;
	        var nc = parseNameClass(child1);
	        var p = parsePattern(child2);
	        fac.define(name, fac.element(nc, p));
	    }
	    return top;
	}
	exports.parse = parse;


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	var hashing = __webpack_require__(6);
	var lib = __webpack_require__(7);
	var Type;
	(function (Type) {
	    Type[Type["AnyName"] = 1] = "AnyName";
	    Type[Type["AnyNameExcept"] = 2] = "AnyNameExcept";
	    Type[Type["Name"] = 3] = "Name";
	    Type[Type["NameClassChoice"] = 4] = "NameClassChoice";
	    Type[Type["NsName"] = 5] = "NsName";
	    Type[Type["NsNameExcept"] = 6] = "NsNameExcept";
	    Type[Type["ParamList"] = 7] = "ParamList";
	    Type[Type["After"] = 8] = "After";
	    Type[Type["Attribute"] = 9] = "Attribute";
	    Type[Type["Choice"] = 10] = "Choice";
	    Type[Type["Data"] = 11] = "Data";
	    Type[Type["DataExcept"] = 12] = "DataExcept";
	    Type[Type["Element"] = 13] = "Element";
	    Type[Type["Empty"] = 14] = "Empty";
	    Type[Type["Group"] = 15] = "Group";
	    Type[Type["Interleave"] = 16] = "Interleave";
	    Type[Type["List"] = 17] = "List";
	    Type[Type["NotAllowed"] = 18] = "NotAllowed";
	    Type[Type["OneOrMore"] = 19] = "OneOrMore";
	    Type[Type["Ref"] = 20] = "Ref";
	    Type[Type["Text"] = 21] = "Text";
	    Type[Type["Value"] = 22] = "Value";
	})(Type || (Type = {}));
	var AnyName = (function () {
	    function AnyName(hash) {
	        this.hash = hash;
	    }
	    AnyName.prototype.contain = function (qname) {
	        return true;
	    };
	    AnyName.prototype.toString = function () {
	        return 'Anyname';
	    };
	    return AnyName;
	})();
	var AnyNameExcept = (function () {
	    function AnyNameExcept(nc, hash) {
	        this.nc = nc;
	        this.hash = hash;
	    }
	    AnyNameExcept.prototype.contain = function (qname) {
	        return !this.nc.contain(qname);
	    };
	    AnyNameExcept.prototype.toString = function () {
	        return 'AnyNameExcept(' + this.nc + ')';
	    };
	    return AnyNameExcept;
	})();
	var Name = (function () {
	    function Name(uri, localname, hash) {
	        this.uri = uri;
	        this.localname = localname;
	        this.hash = hash;
	    }
	    Name.prototype.contain = function (qname) {
	        return this.uri === qname.uri && this.localname === qname.localname;
	    };
	    Name.prototype.toString = function () {
	        return 'Name(' + this.uri + ', ' + this.localname + ')';
	    };
	    return Name;
	})();
	var NameClassChoice = (function () {
	    function NameClassChoice(nc1, nc2, hash) {
	        this.nc1 = nc1;
	        this.nc2 = nc2;
	        this.hash = hash;
	    }
	    NameClassChoice.prototype.contain = function (qname) {
	        return this.nc1.contain(qname) || this.nc2.contain(qname);
	    };
	    NameClassChoice.prototype.toString = function () {
	        return 'NameClassChoice(' + this.nc1 + ', ' + this.nc2 + ')';
	    };
	    return NameClassChoice;
	})();
	var NsName = (function () {
	    function NsName(uri, hash) {
	        this.uri = uri;
	        this.hash = hash;
	    }
	    NsName.prototype.contain = function (qname) {
	        return this.uri === qname.uri;
	    };
	    NsName.prototype.toString = function () {
	        return 'NsName(' + this.uri + ')';
	    };
	    return NsName;
	})();
	var NsNameExcept = (function () {
	    function NsNameExcept(uri, nc, hash) {
	        this.uri = uri;
	        this.nc = nc;
	        this.hash = hash;
	    }
	    NsNameExcept.prototype.contain = function (qname) {
	        return this.uri === qname.uri && !this.nc.contain(qname);
	    };
	    NsNameExcept.prototype.toString = function () {
	        return 'NsNameExcept(' + this.uri + ', ' + this.nc + ')';
	    };
	    return NsNameExcept;
	})();
	var Pool = (function () {
	    function Pool() {
	        this.clear();
	    }
	    Pool.prototype.clear = function () {
	        this.items = Object.create(null);
	        this.size = 0;
	    };
	    Pool.prototype.load = function (hash) {
	        return this.items[hash];
	    };
	    Pool.prototype.store = function (hash, item) {
	        this.size += 1;
	        if (this.items[hash])
	            console.warn('hash collision');
	        this.items[hash] = item;
	    };
	    return Pool;
	})();
	function isAllowed(p) {
	    return !(p instanceof NotAllowed);
	}
	function isSameArray(a1, a2) {
	    var len = a1.length;
	    if (len !== a2.length)
	        return false;
	    for (var i = 0; i < len; i++)
	        if (a1[i] !== a2[i])
	            return false;
	    return true;
	}
	var PoolingFactory = (function () {
	    function PoolingFactory() {
	        this.pool = new Pool();
	        this.datatype = lib.factory();
	        this.defines = Object.create(null);
	        this.anyName = new AnyName(1 /* AnyName */);
	        this.empty = new Empty(14 /* Empty */, this);
	        this.notAllowed = new NotAllowed(18 /* NotAllowed */, this);
	        this.text = new Text(21 /* Text */, this);
	    }
	    PoolingFactory.prototype.qname = function (uri, localname) {
	        var hash = hashing.mix(hashing.mixs(uri), hashing.mixs(localname));
	        return { uri: uri, localname: localname, hash: hash };
	    };
	    PoolingFactory.prototype.anyNameExcept = function (nc) {
	        var hash = hashing.mix(2 /* AnyNameExcept */, nc.hash);
	        var a = this.pool.load(hash);
	        if (a instanceof AnyNameExcept && a.nc === nc)
	            return a;
	        var b = new AnyNameExcept(nc, hash);
	        this.pool.store(hash, b);
	        return b;
	    };
	    PoolingFactory.prototype.name = function (uri, localname) {
	        var hash = hashing.mix(3 /* Name */, hashing.mix(hashing.mixs(uri), hashing.mixs(localname)));
	        var a = this.pool.load(hash);
	        if (a instanceof Name && a.uri === uri && a.localname === localname)
	            return a;
	        var b = new Name(uri, localname, hash);
	        this.pool.store(hash, b);
	        return b;
	    };
	    PoolingFactory.prototype.nameClassChoice = function (nc1, nc2) {
	        var hash = hashing.mix(4 /* NameClassChoice */, hashing.mix(nc1.hash, nc2.hash));
	        var a = this.pool.load(hash);
	        if (a instanceof NameClassChoice && a.nc1 === nc1 && a.nc2 && nc2)
	            return a;
	        var b = new NameClassChoice(nc1, nc2, hash);
	        this.pool.store(hash, b);
	        return b;
	    };
	    PoolingFactory.prototype.nsName = function (uri) {
	        var hash = hashing.mix(5 /* NsName */, hashing.mixs(uri));
	        var a = this.pool.load(hash);
	        if (a instanceof NsName && a.uri === uri)
	            return a;
	        var b = new NsName(uri, hash);
	        this.pool.store(hash, b);
	        return b;
	    };
	    PoolingFactory.prototype.nsNameExcept = function (uri, nc) {
	        var hash = hashing.mix(6 /* NsNameExcept */, hashing.mix(hashing.mixs(uri), nc.hash));
	        var a = this.pool.load(hash);
	        if (a instanceof NsNameExcept && a.uri === uri && a.nc === a.nc)
	            return a;
	        var b = new NsNameExcept(uri, nc, hash);
	        this.pool.store(hash, b);
	        return b;
	    };
	    PoolingFactory.prototype.attribute = function (nc, p) {
	        var hash = hashing.mix(9 /* Attribute */, hashing.mix(nc.hash, p.hash));
	        var a = this.pool.load(hash);
	        if (a instanceof Attribute && a.nc === nc && a.p === p)
	            return a;
	        var b = new Attribute(nc, p, hash, this);
	        this.pool.store(hash, b);
	        return b;
	    };
	    PoolingFactory.prototype.after = function (p1, p2) {
	        if (p1 === this.notAllowed)
	            return this.notAllowed;
	        if (p2 === this.notAllowed)
	            return this.notAllowed;
	        var hash = hashing.mix(8 /* After */, hashing.mix(p1.hash, p2.hash));
	        var a = this.pool.load(hash);
	        if (a instanceof After && a.p1 === p1 && a.p2 === p2)
	            return a;
	        var b = new After(p1, p2, hash, this);
	        this.pool.store(hash, b);
	        return b;
	    };
	    PoolingFactory.prototype.choice = function () {
	        var patterns = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            patterns[_i - 0] = arguments[_i];
	        }
	        var ps = [];
	        for (var i = 0; i < patterns.length; i++) {
	            var p = patterns[i];
	            if (p instanceof NotAllowed) {
	                continue;
	            }
	            if (p instanceof Choice) {
	                ps = hashing.merge(ps, p.ps);
	            }
	            else {
	                hashing.insert(p, ps);
	            }
	        }
	        ps = ps.filter(isAllowed);
	        if (ps.length === 0)
	            return this.notAllowed;
	        if (ps.length === 1)
	            return ps[0];
	        var hash = hashing.mixa(10 /* Choice */, ps);
	        var a = this.pool.load(hash);
	        if (a instanceof Choice && isSameArray(ps, a.ps))
	            return a;
	        var b = new Choice(ps, hash, this);
	        this.pool.store(hash, b);
	        return b;
	    };
	    PoolingFactory.prototype.data = function (datatype) {
	        var hash = hashing.mix(11 /* Data */, datatype.id);
	        var a = this.pool.load(hash);
	        if (a instanceof Data && a.type === datatype)
	            return a;
	        var b = new Data(datatype, hash, this);
	        this.pool.store(hash, b);
	        return b;
	    };
	    PoolingFactory.prototype.dataExcept = function (datatype, p) {
	        var hash = hashing.mix(12 /* DataExcept */, hashing.mix(datatype.id, p.hash));
	        var a = this.pool.load(hash);
	        if (a instanceof DataExcept && a.type === datatype && a.p === p)
	            return a;
	        var b = new DataExcept(datatype, p, hash, this);
	        this.pool.store(hash, b);
	        return b;
	    };
	    PoolingFactory.prototype.element = function (nc, p) {
	        var hash = hashing.mix(13 /* Element */, hashing.mix(nc.hash, p.hash));
	        var a = this.pool.load(hash);
	        if (a instanceof Element && a.nc === nc && a.p === p)
	            return a;
	        var b = new Element(nc, p, hash, this);
	        this.pool.store(hash, b);
	        return b;
	    };
	    PoolingFactory.prototype.group = function (p1, p2) {
	        if (p1 === this.notAllowed)
	            return this.notAllowed;
	        if (p2 === this.notAllowed)
	            return this.notAllowed;
	        if (p1 === this.empty)
	            return p2;
	        if (p2 === this.empty)
	            return p1;
	        var hash = hashing.mix(15 /* Group */, hashing.mix(p1.hash, p2.hash));
	        var a = this.pool.load(hash);
	        if (a instanceof Group && a.p1 === p1 && a.p2 === p2)
	            return a;
	        var b = new Group(p1, p2, hash, this);
	        this.pool.store(hash, b);
	        return b;
	    };
	    PoolingFactory.prototype.interleave = function (p1, p2) {
	        if (p1 === this.notAllowed)
	            return this.notAllowed;
	        if (p2 === this.notAllowed)
	            return this.notAllowed;
	        if (p1 === this.empty)
	            return p2;
	        if (p2 === this.empty)
	            return p1;
	        var hash = hashing.mix(16 /* Interleave */, hashing.mix(p1.hash, p2.hash));
	        var a = this.pool.load(hash);
	        if (a instanceof Interleave && a.p1 === p1 && a.p2 === p2)
	            return a;
	        var b = new Interleave(p1, p2, hash, this);
	        this.pool.store(hash, b);
	        return b;
	    };
	    PoolingFactory.prototype.list = function (p) {
	        var hash = hashing.mix(17 /* List */, p.hash);
	        var a = this.pool.load(hash);
	        if (a instanceof List && a.p === p)
	            return a;
	        var b = new List(p, hash, this);
	        this.pool.store(hash, b);
	        return b;
	    };
	    PoolingFactory.prototype.oneOrMore = function (p) {
	        if (p === this.notAllowed)
	            return this.notAllowed;
	        var hash = hashing.mix(19 /* OneOrMore */, p.hash);
	        var a = this.pool.load(hash);
	        if (a instanceof OneOrMore && a.p === p)
	            return a;
	        var b = new OneOrMore(p, hash, this);
	        this.pool.store(hash, b);
	        return b;
	    };
	    PoolingFactory.prototype.ref = function (name) {
	        var hash = hashing.mix(20 /* Ref */, hashing.mixs(name));
	        var a = this.pool.load(hash);
	        if (a instanceof Ref && a.name === name)
	            return a;
	        var b = new Ref(name, hash, this);
	        this.pool.store(hash, b);
	        return b;
	    };
	    PoolingFactory.prototype.value = function (type, value) {
	        var hash = hashing.mix(22 /* Value */, hashing.mixs(value));
	        var a = this.pool.load(hash);
	        if (a instanceof Value && a.type === type && a.value === value)
	            return a;
	        var b = new Value(type, value, hash, this);
	        this.pool.store(hash, b);
	        return b;
	    };
	    PoolingFactory.prototype.define = function (name, p) {
	        this.defines[name] = p;
	    };
	    return PoolingFactory;
	})();
	function impossible(message) {
	    throw new Error('The impossible happened: ' + message);
	}
	var After = (function () {
	    function After(p1, p2, hash, fac) {
	        this.p1 = p1;
	        this.p2 = p2;
	        this.hash = hash;
	        this.fac = fac;
	    }
	    After.prototype.applyAfter = function (f) {
	        return this.fac.after(this.p1, f(this.p2));
	    };
	    After.prototype.att = function (qn, t) {
	        return this.fac.after(this.p1.att(qn, t), this.p2);
	    };
	    After.prototype.close = function () {
	        return this.fac.after(this.p1.close(), this.p2);
	    };
	    After.prototype.end = function () {
	        return this.p1.nullable() ? this.p2 : this.fac.notAllowed;
	    };
	    After.prototype.nullable = function () {
	        return false;
	    };
	    After.prototype.start = function (qn) {
	        return this.p1.start(qn).applyAfter(this.flipAfter(this.p2));
	    };
	    After.prototype.text = function (t) {
	        return this.fac.after(this.p1.text(t), this.p2);
	    };
	    After.prototype.toString = function () {
	        return 'After(' + this.p1 + ', ' + this.p2 + ')';
	    };
	    After.prototype.flipAfter = function (p1) {
	        var _this = this;
	        return function (p2) { return _this.fac.after(p2, p1); };
	    };
	    return After;
	})();
	var Attribute = (function () {
	    function Attribute(nc, p, hash, fac) {
	        this.nc = nc;
	        this.p = p;
	        this.hash = hash;
	        this.fac = fac;
	    }
	    Attribute.prototype.applyAfter = function (f) {
	        return impossible();
	    };
	    Attribute.prototype.att = function (qn, t) {
	        return this.nc.contain(qn) && this.valueMatch(t) ? this.fac.empty : this.fac.notAllowed;
	    };
	    Attribute.prototype.close = function () {
	        return this.fac.notAllowed;
	    };
	    Attribute.prototype.end = function () {
	        return this.fac.notAllowed;
	    };
	    Attribute.prototype.nullable = function () {
	        return false;
	    };
	    Attribute.prototype.start = function (qn) {
	        return this.fac.notAllowed;
	    };
	    Attribute.prototype.text = function (t) {
	        return this.fac.notAllowed;
	    };
	    Attribute.prototype.toString = function () {
	        return 'Attribute(' + this.nc + ', ' + this.p + ')';
	    };
	    Attribute.prototype.valueMatch = function (t) {
	        return (this.p.nullable() && !!t.match(/^\s*$/)) || this.p.text(t).nullable();
	    };
	    return Attribute;
	})();
	var Choice = (function () {
	    function Choice(ps, hash, fac) {
	        this.ps = ps;
	        this.hash = hash;
	        this.fac = fac;
	    }
	    Choice.prototype.applyAfter = function (f) {
	        var ps = this.ps.map(function (p) { return p.applyAfter(f); });
	        return this.fac.choice.apply(this.fac, ps);
	    };
	    Choice.prototype.att = function (qn, t) {
	        var ps = this.ps.map(function (p) { return p.att(qn, t); });
	        return this.fac.choice.apply(this.fac, ps);
	    };
	    Choice.prototype.close = function () {
	        var ps = this.ps.map(function (p) { return p.close(); });
	        return this.fac.choice.apply(this.fac, ps);
	    };
	    Choice.prototype.end = function () {
	        var ps = this.ps.map(function (p) { return p.end(); });
	        return this.fac.choice.apply(this.fac, ps);
	    };
	    Choice.prototype.nullable = function () {
	        for (var i = 0; i < this.ps.length; i++)
	            if (this.ps[i].nullable()) {
	                return true;
	            }
	        return false;
	    };
	    Choice.prototype.start = function (qn) {
	        var ps = this.ps.map(function (p) { return p.start(qn); });
	        return this.fac.choice.apply(this.fac, ps);
	    };
	    Choice.prototype.text = function (t) {
	        var ps = this.ps.map(function (p) { return p.text(t); });
	        return this.fac.choice.apply(this.fac, ps);
	    };
	    Choice.prototype.toString = function () {
	        return 'Choice(' + this.ps.join(', ') + ')';
	    };
	    return Choice;
	})();
	var Data = (function () {
	    function Data(type, hash, fac) {
	        this.type = type;
	        this.hash = hash;
	        this.fac = fac;
	    }
	    Data.prototype.applyAfter = function (f) {
	        return impossible();
	    };
	    Data.prototype.att = function (qn, t) {
	        return this.fac.notAllowed;
	    };
	    Data.prototype.close = function () {
	        return this;
	    };
	    Data.prototype.end = function () {
	        return this.fac.notAllowed;
	    };
	    Data.prototype.nullable = function () {
	        return false;
	    };
	    Data.prototype.start = function (qn) {
	        return this.fac.notAllowed;
	    };
	    Data.prototype.text = function (t) {
	        return this.type.allows(t) ? this.fac.empty : this.fac.notAllowed;
	    };
	    Data.prototype.toString = function () {
	        return 'Data(' + this.type + ')';
	    };
	    return Data;
	})();
	var DataExcept = (function () {
	    function DataExcept(type, p, hash, fac) {
	        this.type = type;
	        this.p = p;
	        this.hash = hash;
	        this.fac = fac;
	    }
	    DataExcept.prototype.applyAfter = function (f) {
	        return impossible();
	    };
	    DataExcept.prototype.att = function (qn, t) {
	        return this.fac.notAllowed;
	    };
	    DataExcept.prototype.close = function () {
	        return this;
	    };
	    DataExcept.prototype.end = function () {
	        return this.fac.notAllowed;
	    };
	    DataExcept.prototype.nullable = function () {
	        return false;
	    };
	    DataExcept.prototype.start = function (qn) {
	        return this.fac.notAllowed;
	    };
	    DataExcept.prototype.text = function (t) {
	        return (this.type.allows(t) && !this.p.text(t).nullable()) ? this.fac.empty : this.fac.notAllowed;
	    };
	    DataExcept.prototype.toString = function () {
	        return 'DataExcept(' + this.type + ', ' + this.p + ')';
	    };
	    return DataExcept;
	})();
	var Element = (function () {
	    function Element(nc, p, hash, fac) {
	        this.nc = nc;
	        this.p = p;
	        this.hash = hash;
	        this.fac = fac;
	    }
	    Element.prototype.applyAfter = function (f) {
	        return impossible();
	    };
	    Element.prototype.att = function (qn, t) {
	        return this.fac.notAllowed;
	    };
	    Element.prototype.close = function () {
	        return this;
	    };
	    Element.prototype.end = function () {
	        return this.fac.notAllowed;
	    };
	    Element.prototype.nullable = function () {
	        return false;
	    };
	    Element.prototype.start = function (qn) {
	        if (this.nc.contain(qn))
	            return this.fac.after(this.p, this.fac.empty);
	        return this.fac.notAllowed;
	    };
	    Element.prototype.text = function (t) {
	        return this.fac.notAllowed;
	    };
	    Element.prototype.toString = function () {
	        return 'Element(' + this.nc + ', ' + this.p + ')';
	    };
	    return Element;
	})();
	var Empty = (function () {
	    function Empty(hash, fac) {
	        this.hash = hash;
	        this.fac = fac;
	    }
	    Empty.prototype.applyAfter = function (f) {
	        return impossible();
	    };
	    Empty.prototype.att = function (qn, t) {
	        return this.fac.notAllowed;
	    };
	    Empty.prototype.close = function () {
	        return this;
	    };
	    Empty.prototype.end = function () {
	        return this.fac.notAllowed;
	    };
	    Empty.prototype.nullable = function () {
	        return true;
	    };
	    Empty.prototype.start = function (qn) {
	        return this.fac.notAllowed;
	    };
	    Empty.prototype.text = function (t) {
	        return t === '' ? this : this.fac.notAllowed;
	    };
	    Empty.prototype.toString = function () {
	        return 'Empty';
	    };
	    return Empty;
	})();
	var Group = (function () {
	    function Group(p1, p2, hash, fac) {
	        this.p1 = p1;
	        this.p2 = p2;
	        this.hash = hash;
	        this.fac = fac;
	    }
	    Group.prototype.applyAfter = function (f) {
	        return impossible();
	    };
	    Group.prototype.att = function (qn, t) {
	        var r1 = this.fac.group(this.p1.att(qn, t), this.p2);
	        var r2 = this.fac.group(this.p1, this.p2.att(qn, t));
	        return this.fac.choice(r1, r2);
	    };
	    Group.prototype.close = function () {
	        return this.fac.group(this.p1.close(), this.p2.close());
	    };
	    Group.prototype.end = function () {
	        return this.fac.notAllowed;
	    };
	    Group.prototype.nullable = function () {
	        return this.p1.nullable() && this.p2.nullable();
	    };
	    Group.prototype.start = function (qn) {
	        var r = this.p1.start(qn).applyAfter(this.flipGroup(this.p2));
	        if (this.p1.nullable())
	            return this.fac.choice(r, this.p2.start(qn));
	        return r;
	    };
	    Group.prototype.text = function (t) {
	        var r = this.fac.group(this.p1.text(t), this.p2);
	        if (this.p1.nullable())
	            return this.fac.choice(r, this.p2.text(t));
	        return r;
	    };
	    Group.prototype.toString = function () {
	        return 'Group(' + this.p1 + ', ' + this.p2 + ')';
	    };
	    Group.prototype.flipGroup = function (p1) {
	        var _this = this;
	        return function (p2) { return _this.fac.group(p2, p1); };
	    };
	    return Group;
	})();
	var Interleave = (function () {
	    function Interleave(p1, p2, hash, fac) {
	        this.p1 = p1;
	        this.p2 = p2;
	        this.hash = hash;
	        this.fac = fac;
	    }
	    Interleave.prototype.applyAfter = function (f) {
	        return impossible();
	    };
	    Interleave.prototype.att = function (qn, t) {
	        var r1 = this.fac.interleave(this.p1.att(qn, t), this.p2);
	        var r2 = this.fac.interleave(this.p1, this.p2.att(qn, t));
	        return this.fac.choice(r1, r2);
	    };
	    Interleave.prototype.close = function () {
	        return this.fac.interleave(this.p1.close(), this.p2.close());
	    };
	    Interleave.prototype.end = function () {
	        return this.fac.notAllowed;
	    };
	    Interleave.prototype.nullable = function () {
	        return this.p1.nullable() && this.p2.nullable();
	    };
	    Interleave.prototype.start = function (qn) {
	        var r1 = this.p1.start(qn).applyAfter(this.flipInterleave(this.p2));
	        var r2 = this.p2.start(qn).applyAfter(this.interleave(this.p1));
	        return this.fac.choice(r1, r2);
	    };
	    Interleave.prototype.text = function (t) {
	        var r1 = this.fac.interleave(this.p1.text(t), this.p2);
	        var r2 = this.fac.interleave(this.p1, this.p2.text(t));
	        return this.fac.choice(r1, r2);
	    };
	    Interleave.prototype.toString = function () {
	        return 'Interleave(' + this.p1 + ', ' + this.p2 + ')';
	    };
	    Interleave.prototype.interleave = function (p1) {
	        var _this = this;
	        return function (p2) { return _this.fac.interleave(p1, p2); };
	    };
	    Interleave.prototype.flipInterleave = function (p1) {
	        var _this = this;
	        return function (p2) { return _this.fac.interleave(p2, p1); };
	    };
	    return Interleave;
	})();
	var List = (function () {
	    function List(p, hash, fac) {
	        this.p = p;
	        this.hash = hash;
	        this.fac = fac;
	    }
	    List.prototype.applyAfter = function (f) {
	        return impossible();
	    };
	    List.prototype.att = function (qn, t) {
	        return this.fac.notAllowed;
	    };
	    List.prototype.close = function () {
	        return this;
	    };
	    List.prototype.end = function () {
	        return this.fac.notAllowed;
	    };
	    List.prototype.nullable = function () {
	        return false;
	    };
	    List.prototype.start = function (qn) {
	        return this.fac.notAllowed;
	    };
	    List.prototype.text = function (t) {
	        var r = this.p;
	        var normalized = t.replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ');
	        if (normalized === '')
	            return r;
	        var list = normalized.split(' ');
	        for (var i = 0; i < list.length; i++)
	            r = r.text(list[i]);
	        return r;
	    };
	    List.prototype.toString = function () {
	        return 'List(' + this.p + ')';
	    };
	    return List;
	})();
	var NotAllowed = (function () {
	    function NotAllowed(hash, fac) {
	        this.hash = hash;
	        this.fac = fac;
	    }
	    NotAllowed.prototype.applyAfter = function (f) {
	        return this.fac.notAllowed;
	    };
	    NotAllowed.prototype.att = function (qn, t) {
	        return this.fac.notAllowed;
	    };
	    NotAllowed.prototype.close = function () {
	        return this;
	    };
	    NotAllowed.prototype.end = function () {
	        return this.fac.notAllowed;
	    };
	    NotAllowed.prototype.nullable = function () {
	        return false;
	    };
	    NotAllowed.prototype.start = function (qn) {
	        return this.fac.notAllowed;
	    };
	    NotAllowed.prototype.text = function (t) {
	        return this.fac.notAllowed;
	    };
	    NotAllowed.prototype.toString = function () {
	        return 'NotAllowed';
	    };
	    return NotAllowed;
	})();
	var OneOrMore = (function () {
	    function OneOrMore(p, hash, fac) {
	        this.p = p;
	        this.hash = hash;
	        this.fac = fac;
	    }
	    OneOrMore.prototype.applyAfter = function (f) {
	        return impossible();
	    };
	    OneOrMore.prototype.att = function (qn, t) {
	        var r1 = this.p.att(qn, t);
	        var r2 = this.fac.choice(this, this.fac.empty);
	        return this.fac.group(r1, r2);
	    };
	    OneOrMore.prototype.close = function () {
	        return this.fac.oneOrMore(this.p.close());
	    };
	    OneOrMore.prototype.end = function () {
	        return this.fac.notAllowed;
	    };
	    OneOrMore.prototype.nullable = function () {
	        return this.p.nullable();
	    };
	    OneOrMore.prototype.start = function (qn) {
	        var r = this.fac.choice(this, this.fac.empty);
	        return this.p.start(qn).applyAfter(this.flipGroup(r));
	    };
	    OneOrMore.prototype.text = function (t) {
	        var r1 = this.p.text(t);
	        var r2 = this.fac.choice(this, this.fac.empty);
	        return this.fac.group(r1, r2);
	    };
	    OneOrMore.prototype.toString = function () {
	        return 'OneOrMore(' + this.p + ')';
	    };
	    OneOrMore.prototype.flipGroup = function (p1) {
	        var _this = this;
	        return function (p2) { return _this.fac.group(p2, p1); };
	    };
	    return OneOrMore;
	})();
	var Ref = (function () {
	    function Ref(name, hash, fac) {
	        this.name = name;
	        this.hash = hash;
	        this.fac = fac;
	    }
	    Ref.prototype.applyAfter = function (f) {
	        return this.fac.defines[this.name].applyAfter(f);
	    };
	    Ref.prototype.att = function (qn, t) {
	        return this.fac.defines[this.name].att(qn, t);
	    };
	    Ref.prototype.close = function () {
	        return this.fac.defines[this.name].close();
	    };
	    Ref.prototype.end = function () {
	        return this.fac.defines[this.name].end();
	    };
	    Ref.prototype.nullable = function () {
	        return this.fac.defines[this.name].nullable();
	    };
	    Ref.prototype.start = function (qn) {
	        return this.fac.defines[this.name].start(qn);
	    };
	    Ref.prototype.text = function (t) {
	        return this.fac.defines[this.name].text(t);
	    };
	    Ref.prototype.toString = function () {
	        return 'Ref(' + this.name + ')';
	    };
	    return Ref;
	})();
	var Text = (function () {
	    function Text(hash, fac) {
	        this.hash = hash;
	        this.fac = fac;
	    }
	    Text.prototype.applyAfter = function (f) {
	        return impossible();
	    };
	    Text.prototype.att = function (qn, t) {
	        return this.fac.notAllowed;
	    };
	    Text.prototype.close = function () {
	        return this;
	    };
	    Text.prototype.end = function () {
	        return this.fac.notAllowed;
	    };
	    Text.prototype.nullable = function () {
	        return true;
	    };
	    Text.prototype.start = function (qn) {
	        return this.fac.notAllowed;
	    };
	    Text.prototype.text = function (t) {
	        return this;
	    };
	    Text.prototype.toString = function () {
	        return 'Text';
	    };
	    return Text;
	})();
	var Value = (function () {
	    function Value(type, value, hash, fac) {
	        this.type = type;
	        this.value = value;
	        this.hash = hash;
	        this.fac = fac;
	    }
	    Value.prototype.applyAfter = function (f) {
	        return impossible();
	    };
	    Value.prototype.att = function (qn, t) {
	        return this.fac.notAllowed;
	    };
	    Value.prototype.close = function () {
	        return this;
	    };
	    Value.prototype.end = function () {
	        return this.fac.notAllowed;
	    };
	    Value.prototype.nullable = function () {
	        return false;
	    };
	    Value.prototype.start = function (qn) {
	        return this.fac.notAllowed;
	    };
	    Value.prototype.text = function (t) {
	        var typ = this.type;
	        var ok = typ.allows(t) && typ.value(t) === typ.value(this.value);
	        return ok ? this.fac.empty : this.fac.notAllowed;
	    };
	    Value.prototype.toString = function () {
	        return 'Value(' + this.type + ', ' + this.value + ')';
	    };
	    return Value;
	})();
	function factory() {
	    return new PoolingFactory();
	}
	exports.factory = factory;


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	function mixn(n) {
	    var phi = 40507;
	    var lo = n & 0x3ffffff;
	    var hi = (n - lo) / 0x4000000;
	    var x = lo | 0;
	    x = ((((x >> 16) ^ x) | 0) * phi) | 0;
	    x = ((((x >> 16) ^ x) | 0) * phi) | 0;
	    var y = hi | 0;
	    y = ((((y >> 16) ^ y) | 0) * phi) | 0;
	    y = ((((y >> 16) ^ y) | 0) * phi) | 0;
	    return x * 0x80000 + y;
	}
	exports.mixn = mixn;
	function mix(a, b) {
	    return mixn(a) * 0x80000 + mixn(b);
	}
	exports.mix = mix;
	function mixs(text) {
	    var res = 0;
	    var len = text.length;
	    for (var i = 0; i < len; i++)
	        res = mix(res, text.charCodeAt(i));
	    return res;
	}
	exports.mixs = mixs;
	function mixa(seed, arr) {
	    var res = seed;
	    for (var i = 0; i < arr.length; i++)
	        res = mix(res, arr[i].hash);
	    return res;
	}
	exports.mixa = mixa;
	function insert(item, a) {
	    var i = 0;
	    while (i < a.length && a[i].hash < item.hash)
	        i += 1;
	    if (i >= a.length || a[i] !== item)
	        a.splice(i, 0, item);
	}
	exports.insert = insert;
	function merge(a, b) {
	    var res = a.concat(b);
	    var i = 0, j = 0, k = 0;
	    while (i < a.length && j < b.length) {
	        var diff = a[i].hash - b[j].hash;
	        if (diff < 0) {
	            res[k++] = a[i++];
	        }
	        else if (diff > 0) {
	            res[k++] = b[j++];
	        }
	        else {
	            res[k++] = a[i];
	            i++;
	            j++;
	        }
	    }
	    if (i === a.length) {
	        while (j < b.length)
	            res[k++] = b[j++];
	    }
	    else {
	        while (i < a.length)
	            res[k++] = a[i++];
	    }
	    return res.slice(0, k);
	}
	exports.merge = merge;


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	var Whitespaces = {
	    PRESERVE: 'preserve',
	    REPLACE: 'replace',
	    COLLAPSE: 'collapse',
	};
	var whitespaces = {
	    'preserve': function (text) { return text; },
	    'replace': function (text) { return text.replace(/\s/g, ' '); },
	    'collapse': function (text) { return text.replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' '); },
	};
	function addParams(constraint, params) {
	    var res = {
	        whitespace: constraint.whitespace,
	        patterns: constraint.patterns.slice(),
	        canon: constraint.canon,
	        enumerations: constraint.enumerations.slice(),
	        facets: constraint.facets.slice(),
	    };
	    var i = 0;
	    for (i = 0; i < params.length; i++) {
	        if (params[i].name === 'whiteSpace') {
	            res.whitespace = whitespaces[params[i].value];
	            break;
	        }
	    }
	    for (i = 0; i < params.length; i++) {
	        var param = params[i];
	        switch (param.name) {
	            case 'enumeration':
	                res.enumerations.push(res.canon(res.whitespace(param.value)));
	                break;
	            case 'pattern':
	                res.patterns.push(new RegExp('^' + param.value + '$'));
	                break;
	            case 'whiteSpace':
	                break;
	            default:
	                res.facets.push(param);
	        }
	    }
	    return res;
	}
	function checkContraint(text, constraint) {
	    var lexicalSpace = constraint.whitespace(text);
	    if (constraint.patterns.length > 0 && constraint.patterns.every(function (p) { return !p.test(lexicalSpace); }))
	        return false;
	    var valueSpace = constraint.canon(lexicalSpace);
	    if (constraint.enumerations.length > 0 && constraint.enumerations.every(function (e) { return e !== valueSpace; }))
	        return false;
	    for (var i = 0; i < constraint.facets.length; i++) {
	        var facet = constraint.facets[i];
	        switch (facet.name) {
	            case 'maxInclusive':
	                if (valueSpace > constraint.canon(facet.value))
	                    return false;
	                break;
	            case 'minInclusive':
	                if (valueSpace < constraint.canon(facet.value))
	                    return false;
	                break;
	            case 'minLength':
	                if (valueSpace.length < parseInt(facet.value, 10))
	                    return false;
	                break;
	            default:
	                throw new Error('unknow parameter: ' + facet.name);
	        }
	    }
	    return true;
	}
	var datatypeCount = 1;
	var ConstrainedDatatype = (function () {
	    function ConstrainedDatatype(constraint) {
	        this.constraint = constraint;
	        this.name = 'derived';
	        this.id = datatypeCount++;
	    }
	    ConstrainedDatatype.prototype.allows = function (text) {
	        return checkContraint(text, this.constraint);
	    };
	    ConstrainedDatatype.prototype.value = function (text) {
	        return this.constraint.canon(this.constraint.whitespace(text));
	    };
	    ConstrainedDatatype.prototype.derive = function (params) {
	        var constraint = addParams(this.constraint, params);
	        return new ConstrainedDatatype(constraint);
	    };
	    ConstrainedDatatype.prototype.toString = function () {
	        return this.name;
	    };
	    return ConstrainedDatatype;
	})();
	function xsdDatatypes() {
	    function typ(whitespace, canon) {
	        return new ConstrainedDatatype({
	            whitespace: whitespaces[whitespace],
	            patterns: [],
	            canon: canon,
	            enumerations: [],
	            facets: [],
	        });
	    }
	    var id = function (text) { return text; };
	    var p = function (name, value) { return ({ name: name, value: value }); };
	    var tok = function (regex, canon) { return typ(Whitespaces.COLLAPSE, canon || id).derive([p('pattern', regex)]); };
	    var r_NCName = '[A-Z_a-z][A-Z_a-z0-9.-]*';
	    var r_QName = '(' + r_NCName + ':)?' + r_NCName;
	    var TODO = typ(Whitespaces.PRESERVE, id);
	    var xsInteger = tok('[+-]?(?!$)[0-9]*', function (t) { return parseInt(t, 10); });
	    var types = {
	        'anyURI': TODO,
	        'boolean': tok('(0|1|false|true)', function (t) { return t === '1' || t === 'true'; }),
	        'date': TODO,
	        'dateTime': TODO,
	        'decimal': tok('[+-]?(?!$)[0-9]*(\\.[0-9]*)?', parseFloat),
	        'double': tok('[+-]?(?!$)[0-9]*(\\.[0-9]*)?', parseFloat),
	        'duration': TODO,
	        'ID': TODO,
	        'float': TODO,
	        'gDay': TODO,
	        'gMonth': TODO,
	        'gMonthDay': TODO,
	        'gYear': TODO,
	        'gYearMonth': TODO,
	        'integer': xsInteger,
	        'language': tok('[a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*'),
	        'NCName': tok(r_NCName),
	        'NMTOKEN': tok('[A-Za-z0-9._-]+'),
	        'nonNegativeInteger': xsInteger.derive([p('minInclusive', '0')]),
	        'normalizedString': typ(Whitespaces.REPLACE, id),
	        'positiveInteger': xsInteger.derive([p('minInclusive', '1')]),
	        'QName': tok(r_QName),
	        'string': typ(Whitespaces.PRESERVE, id),
	        'time': TODO,
	        'token': typ(Whitespaces.COLLAPSE, id),
	    };
	    for (var name in types) {
	        types[name].name = name;
	    }
	    return types;
	}
	exports.NS_XSD = 'http://www.w3.org/2001/XMLSchema-datatypes';
	function factory() {
	    var datatypes = xsdDatatypes();
	    return function (library, datatype) {
	        if (library !== '' && library !== exports.NS_XSD) {
	            throw new Error('unknown datatype library: ' + library);
	        }
	        var res = datatypes[datatype];
	        if (!res) {
	            throw new Error('unknown datatype: ' + datatype + ' in ' + library);
	        }
	        return res;
	    };
	}
	exports.factory = factory;


/***/ }
/******/ ])
});
;