/// <reference path='phantomjs.d.ts' />

import dom = require('./dom');
import gram = require('./grammar');
import parser = require('./parser');
import pat = require('./pattern');

import fs = require('fs');

function exit(code: number) {
    setTimeout(() => phantom.exit(code), 0);
    phantom.onError = function(): void { return null; };
    throw new Error('');
}

function run(action: () => void): void {
    try {
        action();
    } catch (e) {
        console.error(e.message);
        var stack = (<Error>e).stack.replace(/^[^\(]+?[\n$]/gm, '')
            .replace(/^\s+at\s+/gm, '')
            .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
            .split('\n');
        console.log('FAIL', stack);
        exit(1);
    }
}

function assert(test: boolean) {
    if (test === false) {
        console.log('FAIL');
        exit(1);
    }
}

interface Expected { id: number; valid: number; invalid: number; }

function parse(xml: string): Document {
    return new DOMParser().parseFromString(xml, 'application/xml');
}

/*jshint unused:false */
// resulting rng108/valid2.xml must be patched by hand to add newlines
function split() {
    var summary: Expected[] = [];
    var ns = 'http://relaxng.org/ns/structure/1.0';
    var spectest = fs.open('data/spectest.xml', 'r').read().replace(/\n/g, '');
    var doc = parse(spectest);
    var corrects = doc.getElementsByTagName('correct');
    var n = 0;
    for (var i = 0; i < corrects.length; i++) {
        var correct = <Element>corrects[i];
        var externals = correct.getElementsByTagNameNS(ns, 'externalRef');
        if (externals.length > 0) continue;
        var includes = correct.getElementsByTagNameNS(ns, 'include');
        if (includes.length > 0) continue;
        if (correct.childElementCount !== 1) {
            console.warn('Grammar has more than one single child.', i);
            exit(1);
        }

        n++;
        var dir = 'data/suite/rng' + n;
        fs.makeDirectory(dir);
        var grammar = correct.firstElementChild;
        var text = new XMLSerializer().serializeToString(grammar);
        var schema = fs.open(dir + '/schema.rng', 'w');
        schema.write(text);
        schema.close();

        var valid = 0;
        var invalid = 0;
        for (var e = correct.nextElementSibling; e; e = e.nextElementSibling) {
            if (e.tagName === 'valid' || e.tagName === 'invalid') {
                if (e.tagName === 'valid') valid++;
                if (e.tagName === 'invalid') invalid++;
                var f = e.tagName === 'valid' ? valid : invalid;
                var serializer = new XMLSerializer();
                var xml = serializer.serializeToString(e.firstElementChild);
                var filename = e.tagName + f + '.xml';
                var file = fs.open(dir + '/' + filename, 'w');
                file.write(xml);
                file.close();
            }
        }

        summary.push({ id: n, valid: valid, invalid: invalid });
    }
    var out = fs.open('data/suite/expected.json', 'w');
    out.write(JSON.stringify(summary, undefined, 2));
    out.close();
}
/*jshint unused:true */

function testGrammar() {
    var expected = fs.open('data/suite/expected.json', 'r').read();
    var summary: Expected[] = JSON.parse(expected);
    var paths = summary.map(s => 'data/suite/rng' + s.id + '/schema.xml');
    paths.push('data/relaxng.xml');
    paths.push('data/xsd10.xml');
    for (var i = 0; i < paths.length; i++) {
        var path = paths[i];
        run(() => {
            var schema = fs.open(path, 'r').read();
            var grammar = parse(schema).documentElement;
            var pattern = gram.parse(grammar);
            if (!pattern) {
                console.warn('PARSE FAILED', path);
                exit(1);
            }
        });
    }
}

function validationError(xml: string, rng: string): string {
    try {
        var error = parser.parse(xml, rng).getError();
        return error && dom.Message[error.message];
    } catch (e) {
        return null;
    }
}

function testValidation() {
    var expected = fs.open('data/suite/expected.json', 'r').read();
    var summary: Expected[] = JSON.parse(expected);
    for (var i = 0; i < summary.length; i++) {
        var s = summary[i];
        if (s.id >= 152 && s.id <= 154) continue; // TODO <value ns="..."
        var dir = 'data/suite/rng' + s.id;
        var path = dir + '/schema.xml';
        run(() => {
            var rng = fs.open(path, 'r').read();
            var grammar = parse(rng).documentElement;
            for (var j = 1; j <= s.valid; j++) {
                var pathOk = dir + '/valid' + j + '.xml';
                var xmlOk = fs.open(pathOk, 'r').read();
                var errorOk = validationError(xmlOk, rng);
                if (errorOk) {
                    console.log('wrong valid ' + s.id + '/' + j, errorOk);
                    exit(1);
                }
            }
            for (var k = 1; k <= s.invalid; k++) {
                var pathKo = dir + '/invalid' + k + '.xml';
                var xmlKo = fs.open(pathKo, 'r').read();
                var errorKo = validationError(xmlKo, rng);
                if (!errorKo) {
                    console.log('wrong invalid ' + s.id + '/' + k);
                    exit(1);
                }
            }
        });
    }
}

function testBigSchemas() {
    var combos = [
        { rng: 'relaxng.xml', xml: 'relaxng.xml' },
        { rng: 'relaxng.xml', xml: 'relaxng.rng' },
        { rng: 'relaxng.xml', xml: 'xsd10.xml' },
        { rng: 'relaxng.xml', xml: 'xsd10.rng' },
        { rng: 'xsd10.xml', xml: 'valid.xsd' },
    ];
    for (var i = 0; i < combos.length; i++) {
        var combo = combos[i];
        run(() => {
            var rng = fs.open('data/' + combo.rng, 'r').read();
            var grammar = parse(rng).documentElement;
            var pattern = gram.parse(grammar);
            if (!pattern) {
                console.warn('PARSE FAILED', combo.rng);
                exit(1);
            }

            var xml = fs.open('data/' + combo.xml, 'r').read();
            var error = validationError(xml, rng);
            if (error) {
                console.log('INVALID ' + combo.rng + ': ' + combo.xml);
                exit(1);
            }
        });
    }
}

function testDom() {
    var xml = '<a><b>true</b><c d="123"/></a>';
    var rng = fs.open('data/abcd.xml', 'r').read();
    var doc = parser.parse(xml, rng);
    assert(!doc.getError());
    var a = doc.documentElement;
    assert(!!a);
    assert(a.localName === 'a');
    assert(a.namespaceURI === null);
    assert(a.getAttributeNodeNS('', '') === null);
    var children = a.elements();
    assert(children.length === 2);
    var b = children[0];
    assert(b.textContent === 'true');
    var c = children[1];
    var d = c.getAttributeNodeNS('', 'd');
    assert(d.textContent === '123');
    assert(doc.serialize() === xml);

    assert(b.allows('false'));
    assert(!b.allows('foo'));
    assert(d.allows('42'));
    assert(!d.allows('bar'));

    d.textContent = 'foo';
    assert(doc.getError().attribute === d);
    b.textContent = 'bar';
    assert(doc.getError().element === b);
    b.textContent = 'false';
    assert(doc.getError().attribute === d);
    d.textContent = '-321';
    assert(!doc.getError());
    c.removeAttributeNS('', 'd');
    assert(doc.getError().element === c);
    c.setAttributeNS('', 'd', '123');
    assert(!doc.getError());
    var d2 = c.getAttributeNodeNS('', 'd');
    assert(d2.textContent === '123');
    assert(d2 !== d);

    var e = doc.createElement('urn:foo', 'bar');
    assert(e.namespaceURI === 'urn:foo' && e.localName === 'bar');

    a.removeChild(c);
    assert(doc.getError().element === a);
    a.appendChild(c);
    assert(!doc.getError());

    var t1 = a.elements();
    assert(t1.length === 2 && t1[0] === b && t1[1] === c);
    var t2 = a.elements(e => e.localName === 'b');
    assert(t2.length === 1 && t2[0] === b);
    var t3 = a.elements(e => !!e.getAttributeNodeNS('', 'd'));
    assert(t3.length === 1 && t3[0] === c);
    var t4 = a.elements(e => e.localName === 'a');
    assert(t4.length === 0);
    var t5 = a.elements(null, e => e.localName);
    assert(t5.length === 2 && t5[0] === 'b' && t5[1] === 'c');
    var t6 = c.attributes();
    assert(t6.length === 1 && t6[0] === d2);
    var t7 = c.attributes(a => a.textContent === '123', a => a.localName);
    assert(t7.length === 1 && t7[0] === 'd');
    var t8 = c.attributes(a => a.localName === 'foo');
    assert(t8.length === 0);
}

try {
    testGrammar();
    testValidation();
    testBigSchemas();
    run(testDom);
} catch (e) {
    var stack = (<Error>e).stack.replace(/^[^\(]+?[\n$]/gm, '')
        .replace(/^\s+at\s+/gm, '')
        .replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
        .split('\n');
    console.log('FAIL', stack);
    exit(1);
}

console.log('OK Phantom');
exit(0);
