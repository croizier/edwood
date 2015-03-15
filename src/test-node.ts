import hashing = require('./hashing');
import lib = require('./library');
import pat = require('./pattern');

function assert(value: any, message?: string): void {
    console.assert(value, message);
}

function testHashing() {
    assert(hashing.mixs('') === 0);

    var n = 1000;
    var a = [{ hash: 3 }, { hash: 5 }, { hash: 6 }, { hash: 7 }];
    var b = [{ hash: 2 }, { hash: 6 }, { hash: 8 }];
    var c = hashing.merge(a, b);
    assert(c.length === 6);
    assert(
        c[0].hash === 2 &&
        c[1].hash === 3 &&
        c[2].hash === 5 &&
        c[3].hash === 6 &&
        c[4].hash === 7 &&
        c[5].hash === 8);

    var hashes: { [index: number]: boolean } = {};
    var collisions = 0;
    var seed = 0;
    for (var i = 0; i < n; i++) {
        var h = hashing.mixn(seed + i);
        if (hashes[h]) collisions += 1;
        hashes[h] = true;
    }
    if (collisions > 0) console.log(collisions, h);
    assert(collisions === 0);
}

function assertAllows(dt: lib.Datatype, texts: string[]): void {
    texts.forEach(text => assert(dt.allows(text)));
}

function assertForbids(dt: lib.Datatype, texts: string[]): void {
    texts.forEach(text => assert(!dt.allows(text)));
}

function testLibrary() {
    var types = lib.factory();
    var p = (name: string, value: string) => ({ name: name, value: value });

    assert(types(lib.NS_XSD, 'string') === types('', 'string'));
    assert(types(lib.NS_XSD, 'token') === types('', 'token'));

    var xsString = types(lib.NS_XSD, 'string');
    assert(xsString.name === 'string');
    assert(xsString.allows('foo'));
    assert(xsString.allows('foo \t'));
    assert(xsString.value('foo \t') === 'foo \t');

    var xsNormalizedString = types(lib.NS_XSD, 'normalizedString');
    assert(xsNormalizedString.name === 'normalizedString');
    assert(xsNormalizedString.allows('foo'));
    assert(xsNormalizedString.allows('foo \t'));
    assert(xsNormalizedString.value('foo \t') === 'foo  ');

    var xsToken = types(lib.NS_XSD, 'token');
    assert(xsToken.name === 'token');
    assert(xsToken.allows('foo'));
    assert(xsToken.allows('foo \t'));
    assert(xsToken.value('foo \t') === 'foo');

    var xsLanguage = types(lib.NS_XSD, 'language');
    assert(!xsLanguage.allows('123'));
    assert(xsLanguage.allows(' abcdefgh-12345678  '));
    assert(xsLanguage.value(' abcdefgh-12345678  ') === 'abcdefgh-12345678');
    assert(!xsLanguage.allows('abcdefgh-123456789'));
    assert(!xsLanguage.allows('abcdefghi-12345678'));
    assert(!xsLanguage.allows('abcd efgh-12345678'));

    assert(xsLanguage.derive([]).allows(' abcdefgh-12345678  '));

    var ct1 = xsToken.derive([p('pattern', 'a+b?'), p('pattern', 'a?b+')]);
    assertAllows(ct1, ['a', 'b', 'ab', 'aab', 'abb', ' a', 'a   ']);
    assertForbids(ct1, ['c', 'aabb', '', 'a b']);

    var ct2 = xsToken.derive([p('enumeration', 'a'), p('enumeration', 'b')]);
    assertAllows(ct2, ['a', 'b', ' a', 'a ']);
    assertForbids(ct2, ['', 'c', 'ab']);

    var tw = (base: lib.Datatype, ws: string, text: string, value: string) =>
        assert(base.derive([p('whiteSpace', ws)]).value(text) === value);
    tw(xsString, 'preserve', '\t\na\t\nb\t\n', '\t\na\t\nb\t\n');
    tw(xsString, 'replace', '\t\na\t\nb\t\n', '  a  b  ');
    tw(xsString, 'collapse', '\t\na\t\nb\t\n', 'a b');
    tw(xsNormalizedString, 'replace', '\t\na\t\nb\t\n', '  a  b  ');
    tw(xsNormalizedString, 'collapse', '\t\na\t\nb\t\n', 'a b');
    tw(xsToken, 'collapse', '\t\na\t\nb\t\n', 'a b');

    var xsBoolean = types(lib.NS_XSD, 'boolean');
    assertAllows(xsBoolean, ['0 ', ' 1', ' true', 'false ']);
    assertForbids(xsBoolean, ['2', 'yes', 'tr ue']);
    assert(xsBoolean.value(' 0') === false);
    assert(xsBoolean.value('1 ') === true);
    assert(xsBoolean.value(' false') === false);
    assert(xsBoolean.value('true ') === true);

    var xsDecimal = types(lib.NS_XSD, 'decimal');
    assertAllows(xsDecimal, ['0', '-0', '-3.14   ', '  42']);
    assertForbids(xsDecimal, ['a', '- 0', '']);

    var ct3 = xsDecimal.derive([{ name: 'maxInclusive', value: '42' }]);
    assertAllows(ct3, ['0', '42', '-3.14']);
    assertForbids(ct3, ['43', '42.0000001']);

    var xsNonNegativeInteger = types(lib.NS_XSD, 'nonNegativeInteger');
    assertAllows(xsNonNegativeInteger, ['0', '1', '42']);
    assertForbids(xsNonNegativeInteger, ['-1', '3.14']);

    var xsPositiveInteger = types(lib.NS_XSD, 'positiveInteger');
    assertAllows(xsPositiveInteger, ['1', '42']);
    assertForbids(xsPositiveInteger, ['0', '-1', '3.14']);

    var ct4 = xsString.derive([p('minLength', '3')]);
    assertAllows(ct4, ['xxx', '   ', 'abcdef']);
    assertForbids(ct4, ['xx', '  ']);

    var ct5 = xsToken.derive([p('minLength', '4')]);
    assertAllows(ct5, ['xxxx', 'abcdef']);
    assertForbids(ct5, ['xxx', '   ', '     x  x      ']);

    var ct6 = xsDecimal.derive([
        p('minInclusive', '2.5'), p('maxInclusive', '3.5')]);
    assertAllows(ct6, ['  2.5', '  3  ', '3.4999   ', '  3.5  ']);
    assertForbids(ct6, ['2.49999', '3.500001', '-42']);
}

function testFactory() {
    var fac = pat.factory();

    var a = fac.anyName;
    var e = fac.empty;
    var n = fac.notAllowed;
    var t = fac.text;

    assert(fac.qname('', '').hash === 0);
    assert(fac.qname('a', 'b').hash !== 0);

    assert(fac.anyNameExcept(a) === fac.anyNameExcept(a));
    assert(fac.name('a', 'b') === fac.name('a', 'b'));
    assert(fac.nameClassChoice(a, fac.name('a', 'b')) ===
        fac.nameClassChoice(a, fac.name('a', 'b')));
    assert(fac.nsName('a') === fac.nsName('a'));
    assert(fac.nsNameExcept('a', a) === fac.nsNameExcept('a', a));

    assert(fac.attribute(a, e) === fac.attribute(a, e));

    assert(fac.after(t, n) === n);
    assert(fac.after(n, t) === n);
    assert(fac.after(t, t) === fac.after(t, t));

    assert(fac.choice(t, n) === t);
    assert(fac.choice(n, t) === t);
    assert(fac.choice(e, t) === fac.choice(e, t));
    assert(fac.choice(e, t) === fac.choice(t, e));
    assert(fac.choice(e, t) === fac.choice(t, fac.choice(e, t)));
    assert(fac.choice(e, e) === e);

    var token = fac.datatype('', 'token');
    assert(fac.data(token) === fac.data(token));
    assert(fac.dataExcept(token, t) === fac.dataExcept(token, t));

    assert(fac.element(a, e) === fac.element(a, e));

    assert(fac.group(t, n) === n);
    assert(fac.group(n, t) === n);
    assert(fac.group(e, t) === t);
    assert(fac.group(t, e) === t);
    assert(fac.group(t, t) === fac.group(t, t));

    assert(fac.interleave(t, n) === n);
    assert(fac.interleave(n, t) === n);
    assert(fac.interleave(e, t) === t);
    assert(fac.interleave(t, e) === t);
    assert(fac.interleave(t, t) === fac.interleave(t, t));

    assert(fac.list(t) === fac.list(t));

    assert(fac.oneOrMore(n) === n);
    assert(fac.oneOrMore(t) === fac.oneOrMore(t));

    assert(fac.ref('a') === fac.ref('a'));
    assert(fac.ref('b') !== fac.ref('a'));

    assert(fac.value(token, 'abc') === fac.value(token, 'abc'));
    assert(fac.value(token, 'def') !== fac.value(token, 'abc'));
}

function testClassName() {
    var fac = pat.factory();

    var an = fac.anyName;
    assert(an.contain(fac.qname('', '')));
    assert(an.contain(fac.qname('foo', 'bar')));

    var nan = fac.anyNameExcept(an);
    assert(!nan.contain(fac.qname('', '')));
    assert(!nan.contain(fac.qname('foo', 'bar')));

    var n = fac.name('foo', 'bar');
    assert(n.contain(fac.qname('foo', 'bar')));
    assert(!n.contain(fac.qname('', 'bar')));
    assert(!n.contain(fac.qname('foo', '')));

    var c = fac.nameClassChoice(fac.name('a', ''), fac.name('', 'b'));
    assert(c.contain(fac.qname('a', '')));
    assert(c.contain(fac.qname('', 'b')));
    assert(!c.contain(fac.qname('', '')));
    assert(!c.contain(fac.qname('a', 'b')));

    var nsn = fac.nsName('a');
    assert(nsn.contain(fac.qname('a', '')));
    assert(nsn.contain(fac.qname('a', 'b')));
    assert(!nsn.contain(fac.qname('', '')));

    var nsne = fac.nsNameExcept('a', fac.name('a', 'b'));
    assert(nsne.contain(fac.qname('a', '')));
    assert(!nsne.contain(fac.qname('a', 'b')));
    assert(nsne.contain(fac.qname('a', 'c')));
}

function testList() {
    var fac = pat.factory();
    var e = fac.empty;
    var n = fac.notAllowed;
    var bool = fac.data(fac.datatype(lib.NS_XSD, 'boolean'));
    var deci = fac.data(fac.datatype(lib.NS_XSD, 'decimal'));
    var bools = fac.oneOrMore(bool);

    assert(bool.text('1') === e);
    var optbools = bools.text('1');
    assert(optbools.text('0').text('true').text('false') === optbools);

    var lic = fac.list(fac.choice(bool, deci));
    assert(lic.text('true') === e);
    assert(lic.text('3.1') === e);
    assert(lic.text('foo') === n);
    var lig = fac.list(fac.group(bool, deci));
    assert(lig.text(' true   3.1 ') === e);
    assert(lig.text(' 3.1   true ') === n);
    var lii = fac.list(fac.interleave(bool, deci));
    assert(lii.text(' true   3.1 ') === e);
    assert(lii.text(' 3.1   true ') === e);
    var lio = fac.list(fac.oneOrMore(bool));
    assert(lio.text(' true false   0    1  1    1 ') === optbools);

    var oc = fac.oneOrMore(fac.choice(bool, deci));
    var oc0 = oc.text('0');
    assert(oc0 !== n);
    var lioc = fac.list(oc);
    assert(lioc.text(' 1.3  -2 true\r false 0 \t ') === oc0);
}

function testDerivation() {
    var fac = pat.factory();
    var e = fac.empty;
    var n = fac.notAllowed;

    // value content
    var foobar = fac.value(fac.datatype('', 'token'), 'foobar');
    assert(foobar.text('foobar') === e);
    assert(foobar.text('   foobar  \t') === e);
    assert(foobar.text('blabla') === n);

    // boolean content
    var bool = fac.data(fac.datatype(lib.NS_XSD, 'boolean'));
    assert(bool.text('foo') === n);
    assert(bool.text('123') === n);
    assert(bool.text('true') === e);

    // decimal content
    var deci = fac.data(fac.datatype(lib.NS_XSD, 'decimal'));
    assert(deci.text('123') === e);
    assert(deci.text('true') === n);

    // choice between boolean and decimal content
    var choi = fac.choice(bool, deci);
    assert(choi.text('123') === e);
    assert(choi.text('true') === e);
    assert(choi.text('foo') === n);

    // ref to choice between boolean and decimal content
    fac.define('choi', choi);
    assert(fac.ref('choi').text('123') === e);
    assert(fac.ref('choi').text('true') === e);
    assert(fac.ref('choi').text('foo') === n);

    // neither boolean nor decimal content
    var nobd = fac.dataExcept(fac.datatype('', 'string'), choi);
    assert(nobd.text('') === e);
    assert(nobd.text('foo') === e);
    assert(nobd.text('123') === n);
    assert(nobd.text('true') === n);

    // element with decimal content
    var ela = fac.element(fac.name('', 'a'), deci);
    var qna = fac.qname('', 'a');
    assert(ela.start(qna) === fac.after(deci, e));
    assert(ela.start(qna).end() === n);
    assert(ela.start(qna).close() === fac.after(deci, e));
    assert(ela.start(qna).close().end() === n);
    assert(ela.start(qna).close().text('a') === n);
    assert(ela.start(qna).close().text('3.1') === fac.after(e, e));
    assert(ela.start(qna).close().text('3.1').end() === e);

    // element with element content
    var elb = fac.element(fac.name('', 'b'), ela);
    var qnb = fac.qname('', 'b');
    assert(elb.start(qna) === n);
    assert(elb.start(qnb) !== n);
    assert(elb.start(qnb).close().end() === n);
    assert(elb.start(qnb).close().start(qnb) === n);
    assert(elb.start(qnb).close().start(qna).close().text('') === n);
    assert(elb.start(qnb).close().start(qna).close().text('3.1').end().end()
        === e);

    // element with attribute only
    var atb = fac.attribute(fac.name('', 'b'), bool);
    var elatb = fac.element(fac.name('', 'a'), atb);
    assert(elatb.start(qna).close() === n);
    assert(elatb.start(qna).att(qna, 'true') === n);
    assert(elatb.start(qna).att(qnb, 'true').close().text('foo') === n);
    assert(elatb.start(qna).att(qnb, 'true').close().start(qna) === n);
    assert(elatb.start(qna).att(qnb, 'true').close().end() === e);

    // element with choice of attributes
    var atd = fac.attribute(fac.name('', 'd'), deci);
    var qnd = fac.qname('', 'd');
    var atc = fac.choice(atb, atd);
    var ec = fac.element(fac.name('', 'a'), atc);
    assert(ec.start(qna).close() === n);
    assert(ec.start(qna).att(qnb, 'true').close().end() === e);
    assert(ec.start(qna).att(qnd, '-3.1').close().end() === e);
    assert(ec.start(qna).att(qnb, '-3.1').close().end() === n);
    assert(ec.start(qna).att(qnd, 'true').close().end() === n);
    assert(ec.start(qna).att(qnb, 'true').att(qnd, '-3.1').close().end() === n);

    // element with group of attributes
    var eg = fac.element(fac.name('', 'a'), fac.group(atb, atd));
    assert(eg.start(qna).close() === n);
    assert(eg.start(qna).att(qnb, 'true').close().end() === n);
    assert(eg.start(qna).att(qnd, '3.1').close().end() === n);
    assert(eg.start(qna).att(qnb, 'true').att(qna, '3.1').close().end() === n);
    assert(eg.start(qna).att(qna, 'true').att(qnd, '3.1').close().end() === n);
    assert(eg.start(qna).att(qnb, 'true').att(qnd, '3.1').close().end() === e);
    assert(eg.start(qna).att(qnd, '3.1').att(qnb, 'true').close().end() === e);
    assert(eg.start(qna).att(qnd, '3.1').att(qnd, '3.1').close().end() === n);

    // element with interleave of attributes, same as group of attributes
    var ei = fac.element(fac.name('', 'a'), fac.interleave(atb, atd));
    assert(ei.start(qna).close() === n);
    assert(ei.start(qna).att(qnb, 'true').close().end() === n);
    assert(ei.start(qna).att(qnd, '3.1').close().end() === n);
    assert(ei.start(qna).att(qnb, 'true').att(qna, '3.1').close().end() === n);
    assert(ei.start(qna).att(qna, 'true').att(qnd, '3.1').close().end() === n);
    assert(ei.start(qna).att(qnb, 'true').att(qnd, '3.1').close().end() === e);
    assert(ei.start(qna).att(qnd, '3.1').att(qnb, 'true').close().end() === e);
    assert(ei.start(qna).att(qnd, '3.1').att(qnd, '3.1').close().end() === n);

    // group of elements
    var na = fac.name('', 'a');
    var nb = fac.name('', 'b');
    var ge = fac.group(fac.element(na, e), fac.element(nb, e));
    assert(ge.start(qnb) === n);
    assert(ge.start(qna).close().end() !== e);
    assert(ge.start(qna).close().end().start(qnb).close().end() === e);

    // interleave of elements
    var ie = fac.interleave(fac.element(na, e), fac.element(nb, e));
    assert(ie.start(qna).close().end().start(qnb).close().end() === e);
    assert(ie.start(qnb).close().end().start(qna).close().end() === e);

    // choice of elements
    var ce = fac.choice(fac.element(na, e), fac.element(nb, e));
    assert(ce.start(qna).close().end() === e);
    assert(ce.start(qnb).close().end() === e);
    assert(ce.start(qna).close().end().start(qnb) === n);
    assert(ce.start(qna).close().end().start(qna) === n);

    // refs
    fac.define('e', e);
    fac.define('na', fac.element(na, fac.ref('e')));
    fac.define('nb', fac.element(nb, fac.ref('e')));
    fac.define('ce', fac.choice(fac.ref('na'), fac.ref('nb')));
    var rce = fac.ref('ce');
    assert(rce.start(qna).close().end() === e);
    assert(rce.start(qnb).close().end() === e);
    assert(rce.start(qna).close().end().start(qnb) === n);
    assert(rce.start(qna).close().end().start(qna) === n);

    // element with sequence of element children
    var bs = fac.oneOrMore(fac.element(nb, e));
    var ese = fac.element(na, bs);
    assert(ese.start(qna).close()
        .end() === n);
    assert(ese.start(qna).close()
        .start(qnb).close().end()
        .end() === e);
    assert(ese.start(qna).close()
        .start(qnb).close().end()
        .start(qnb).close().end()
        .end() === e);

    // element with optional sequence of element children
    var bs0 = fac.choice(e, bs);
    var eose = fac.element(na, bs0);
    assert(eose.start(qna).close()
        .end() === e);
    assert(eose.start(qna).close()
        .start(qnb).close().end()
        .end() === e);
    assert(eose.start(qna).close()
        .start(qnb).close().end()
        .start(qnb).close().end()
        .end() === e);

    // element with namespace
    var qnsa = fac.qname('s', 'a');
    var elsa = fac.element(fac.name('s', 'a'), e);
    assert(elsa.start(qnsa).close().end() === e);
}

function testChoice() {
    var fac = pat.factory();
    var e = fac.empty;
    var n = fac.notAllowed;
    var aa = fac.attribute(fac.name('', 'a'), e);
    var ab = fac.attribute(fac.name('', 'b'), e);
    var ac = fac.attribute(fac.name('', 'c'), e);
    var ad = fac.attribute(fac.name('', 'd'), e);
    var na = fac.qname('', 'a');
    var nb = fac.qname('', 'b');
    var nc = fac.qname('', 'c');
    var nd = fac.qname('', 'd');
    var nx = fac.qname('', 'x');

    var cab = fac.choice(aa, ab);
    var eab = fac.element(fac.anyName, cab);
    assert(eab.start(nx).close() === n);
    assert(eab.start(nx).att(na, '').close().end() === e);
    assert(eab.start(nx).att(nb, '').close().end() === e);
    assert(eab.start(nx).att(nc, '').close().end() === n);

    var cabc = fac.choice(cab, ac);
    var eabc = fac.element(fac.anyName, cabc);
    assert(eabc.start(nx).close() === n);
    assert(eabc.start(nx).att(na, '').close().end() === e);
    assert(eabc.start(nx).att(nb, '').close().end() === e);
    assert(eabc.start(nx).att(nc, '').close().end() === e);
    assert(eabc.start(nx).att(nd, '').close().end() === n);

    var ccd = fac.choice(ac, ad);
    var cabcd = fac.choice(cab, ccd);
    var eabcd = fac.element(fac.anyName, cabcd);
    assert(eabcd.start(nx).close() === n);
    assert(eabcd.start(nx).att(na, '').close().end() === e);
    assert(eabcd.start(nx).att(nb, '').close().end() === e);
    assert(eabcd.start(nx).att(nc, '').close().end() === e);
    assert(eabcd.start(nx).att(nd, '').close().end() === e);

    var ecc = fac.element(fac.anyName, fac.choice(cabc, cabcd));
    assert(ecc.start(nx).close() === n);
    assert(ecc.start(nx).att(na, '').close().end() === e);
    assert(ecc.start(nx).att(nb, '').close().end() === e);
    assert(ecc.start(nx).att(nc, '').close().end() === e);
    assert(ecc.start(nx).att(nd, '').close().end() === e);

    var ea = fac.element(fac.name('', 'a'), e);
    var eb = fac.element(fac.name('', 'b'), e);
    var ec = fac.element(fac.name('', 'c'), e);
    var ed = fac.element(fac.name('', 'd'), e);
    var ceabc = fac.choice(ea, fac.choice(eb, ec));
    var ceabcd = fac.choice(fac.choice(ea, eb), fac.choice(ec, ed));
    var cecc = fac.choice(ceabc, ceabcd);

    var e1 = fac.element(fac.anyName, cecc);
    assert(e1.start(nx).close().end() === n);
    assert(e1.start(nx).close().start(na).close().end().end() === e);
    assert(e1.start(nx).close().start(nb).close().end().end() === e);
    assert(e1.start(nx).close().start(nc).close().end().end() === e);
    assert(e1.start(nx).close().start(nd).close().end().end() === e);
    assert(e1.start(nx).close().start(na).close().end().start(na) === n);
    assert(e1.start(nx).close().start(na).close().end().start(nb) === n);

    var e2 = fac.element(fac.anyName, fac.choice(e, cecc));
    assert(e2.start(nx).close().end() === e);
    assert(e2.start(nx).close().start(na).close().end().end() === e);
    assert(e2.start(nx).close().start(nb).close().end().end() === e);
    assert(e2.start(nx).close().start(nc).close().end().end() === e);
    assert(e2.start(nx).close().start(nd).close().end().end() === e);
    assert(e2.start(nx).close().start(na).close().end().start(na) === n);
    assert(e2.start(nx).close().start(na).close().end().start(nb) === n);

    var e3 = fac.element(fac.anyName, fac.oneOrMore(fac.choice(e, cecc)));
    var p3 = e3.start(nx).close();
    assert(p3.end() === e);
    assert(p3.start(na).close().end().end() === e);
    assert(p3.start(na).close().end().start(na).close().end().end() === e);
    assert(p3.start(na).close().end().start(nb).close().end().end() === e);
    assert(p3.start(nb).close().end().start(na).close().end().end() === e);
}

function testAttributeSwitch() {
    var fac = pat.factory();
    var e = fac.empty;
    var n = fac.notAllowed;
    var a = fac.attribute(fac.name('', 'a'), e);
    var b = fac.attribute(fac.name('', 'b'), e);
    var bool = fac.data(fac.datatype(lib.NS_XSD, 'boolean'));
    var deci = fac.data(fac.datatype(lib.NS_XSD, 'decimal'));
    var choi = fac.choice(fac.group(a, bool), fac.group(b, deci));
    var c = fac.element(fac.name('', 'c'), choi);
    var na = fac.qname('', 'a');
    var nb = fac.qname('', 'b');
    var nc = fac.qname('', 'c');
    assert(c.start(nc).close() === n);
    assert(c.start(nc).att(na, '') === fac.after(bool, e));
    assert(c.start(nc).att(na, '').text('eurt') === n);
    assert(c.start(nc).att(na, '').text('true') === fac.after(e, e));
    assert(c.start(nc).att(na, '').text('true').close().end() === e);
    assert(c.start(nc).att(nb, '') === fac.after(deci, e));
    assert(c.start(nc).att(nb, '').text('abc') === n);
    assert(c.start(nc).att(nb, '').text('123') === fac.after(e, e));
    assert(c.start(nc).att(nb, '').text('123').close().end() === e);
}

function test() {
    testHashing();
    testLibrary();
    testFactory();
    testClassName();
    testList();
    testDerivation();
    testChoice();
    testAttributeSwitch();

    console.log('OK');
}

function benchDerivation() {
    var t0 = new Date().getTime();
    for (var i = 0; i < 10 * 1000; i++) {
        testDerivation();
        testChoice();
    }
    var t1 = new Date().getTime();
    console.log(t1 - t0);
}

test();
