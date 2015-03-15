import lib = require('./library');
import pat = require('./pattern');

export function parse(grammar: Element): pat.Pattern {
    var fac = pat.factory();

    function datatype(element: Element): lib.Datatype {
        var uri = element.getAttribute('datatypeLibrary');
        var localname = element.getAttribute('type');
        return fac.datatype(uri, localname);
    }

    function parseExceptNameClass(element: Element): pat.NameClass {
        if (!element || element.tagName !== 'except') return null;
        return parseNameClass(element.firstElementChild);
    }

    /* tslint:disable:no-duplicate-variable */
    /* tslint:disable:no-use-before-declare */
    function parseNameClass(element: Element): pat.NameClass {
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

    function parseParams(cursor: Element): lib.Param[] {
        var params: lib.Param[] = [];
        while (cursor && cursor.tagName === 'param') {
            var name = cursor.getAttribute('name');
            var value = cursor.textContent;
            params.push({ name: name, value: value });
            cursor = cursor.nextElementSibling;
        }
        return params;
    }

    function parseExceptPattern(element: Element): pat.Pattern {
        if (!element || element.tagName !== 'except') return null;
        return parsePattern(element.firstElementChild);
    }

    function parsePattern(element: Element): pat.Pattern {
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
                // var uri = element.getAttribute('datatypeLibrary');
                var localname = element.getAttribute('type');
                var datatype = fac.datatype(uri, localname);
                var cursor = element.firstElementChild;
                var params = parseParams(cursor);
                var except = parseExceptPattern(cursor);
                var derived = datatype.derive(params);
                return except ?
                    fac.dataExcept(derived, except) :
                    fac.data(derived);
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
                // var uri = element.getAttribute('datatypeLibrary');
                var localname = element.getAttribute('type');
                var datatype = fac.datatype(uri, localname);
                var value = element.textContent;
                return fac.value(datatype, value);
            case 'zeroOrMore': // part of Relax NG but not simplified Relax NG
                var child = element.firstElementChild;
                var p = parsePattern(child);
                return fac.choice(fac.empty, fac.oneOrMore(p));
        }
    }

    var start = grammar.firstElementChild;
    var top = parsePattern(start.firstElementChild);

    for (var define = start.nextElementSibling;
        define;
        define = define.nextElementSibling) {
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
