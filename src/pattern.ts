import hashing = require('./hashing');
import lib = require('./library');

export interface QName {
    uri: string;
    localname: string;
    hash: number;
}

export interface NameClass {
    contain(qname: QName): boolean;
    hash: number;
}

export interface Pattern {
    applyAfter(f: (p: Pattern) => Pattern): Pattern;
    att(qn: QName, t: string): Pattern;
    close(): Pattern;
    end(): Pattern;
    nullable(): boolean;
    start(qn: QName): Pattern;
    text(t: string): Pattern;
    fac: Factory;
    hash: number;
}

export interface Factory {
    datatype: lib.Factory;
    anyName: NameClass;
    empty: Pattern;
    notAllowed: Pattern;
    text: Pattern;
    qname(uri: string, localname: string): QName;
    anyNameExcept(nc: NameClass): NameClass;
    name(uri: string, localname: string): NameClass;
    nameClassChoice(nc1: NameClass, nc2: NameClass): NameClass;
    nsName(uri: string): NameClass;
    nsNameExcept(uri: string, nc: NameClass): NameClass;
    attribute(nc: NameClass, p: Pattern): Pattern;
    after(p1: Pattern, p2: Pattern): Pattern;
    choice(...patterns: Pattern[]): Pattern;
    data(datatype: lib.Datatype): Pattern;
    dataExcept(datatype: lib.Datatype, p: Pattern): Pattern;
    element(nc: NameClass, p: Pattern): Pattern;
    group(p1: Pattern, p2: Pattern): Pattern;
    interleave(p1: Pattern, p2: Pattern): Pattern;
    list(p: Pattern): Pattern;
    oneOrMore(p: Pattern): Pattern;
    ref(name: string): Pattern;
    value(type: lib.Datatype, value: string): Pattern;
    define(name: string, p: Pattern): void;
}

enum Type {
    AnyName = 1,
    AnyNameExcept,
    Name,
    NameClassChoice,
    NsName,
    NsNameExcept,

    ParamList,

    After,
    Attribute,
    Choice,
    Data,
    DataExcept,
    Element,
    Empty,
    Group,
    Interleave,
    List,
    NotAllowed,
    OneOrMore,
    Ref,
    Text,
    Value,
}

class AnyName implements NameClass {
    constructor(public hash: number) { }
    contain(qname: QName): boolean {
        return true;
    }
    toString(): string {
        return 'Anyname';
    }
}

class AnyNameExcept implements NameClass {
    constructor(public nc: NameClass, public hash: number) { }
    contain(qname: QName): boolean {
        return !this.nc.contain(qname);
    }
    toString(): string {
        return 'AnyNameExcept(' + this.nc + ')';
    }
}

class Name implements NameClass {
    constructor(public uri: string, public localname: string,
        public hash: number) { }
    contain(qname: QName): boolean {
        return this.uri === qname.uri && this.localname === qname.localname;
    }
    toString(): string {
        return 'Name(' + this.uri + ', ' + this.localname + ')';
    }
}

class NameClassChoice implements NameClass {
    constructor(public nc1: NameClass, public nc2: NameClass,
        public hash: number) { }
    contain(qname: QName): boolean {
        return this.nc1.contain(qname) || this.nc2.contain(qname);
    }
    toString(): string {
        return 'NameClassChoice(' + this.nc1 + ', ' + this.nc2 + ')';
    }
}

class NsName implements NameClass {
    constructor(public uri: string, public hash: number) { }
    contain(qname: QName): boolean {
        return this.uri === qname.uri;
    }
    toString(): string {
        return 'NsName(' + this.uri + ')';
    }
}

class NsNameExcept implements NameClass {
    constructor(public uri: string, public nc: NameClass,
        public hash: number) { }
    contain(qname: QName): boolean {
        return this.uri === qname.uri && !this.nc.contain(qname);
    }
    toString(): string {
        return 'NsNameExcept(' + this.uri + ', ' + this.nc + ')';
    }
}

class Pool<T extends Object> {
    public items: { [hash: number]: T };
    private size: number;
    constructor() {
        this.clear();
    }
    clear(): void {
        this.items = Object.create(null);
        this.size = 0;
    }
    load(hash: number): T {
        return this.items[hash];
    }
    store(hash: number, item: T): void {
        this.size += 1;
        // The pool must work even with hash collisions
        // but too many collisions could slow it or be a symptom for a bug.
        // For now, we log collisions and investigate their cause.
        if (this.items[hash]) console.warn('hash collision');
        this.items[hash] = item;
    }
}

function isAllowed(p: Pattern): boolean {
    return !(p instanceof NotAllowed);
}

function isSameArray<T>(a1: T[], a2: T[]): boolean {
    var len = a1.length;
    if (len !== a2.length) return false;
    for (var i = 0; i < len; i++) if (a1[i] !== a2[i]) return false;
    return true;
}

class PoolingFactory implements Factory {

    private pool = new Pool<Object>();

    datatype = lib.factory();

    defines: { [name: string]: Pattern } = Object.create(null);

    // Singletons

    anyName: NameClass = new AnyName(Type.AnyName);

    empty: Pattern = new Empty(Type.Empty, this);

    notAllowed: Pattern = new NotAllowed(Type.NotAllowed, this);

    text: Pattern = new Text(Type.Text, this);

    // Name classes

    qname(uri: string, localname: string): QName {
        var hash = hashing.mix(hashing.mixs(uri), hashing.mixs(localname));
        return { uri: uri, localname: localname, hash: hash };
    }

    anyNameExcept(nc: NameClass): NameClass {
        var hash = hashing.mix(Type.AnyNameExcept, nc.hash);
        var a = <AnyNameExcept>this.pool.load(hash);
        if (a instanceof AnyNameExcept &&
            a.nc === nc) return a;

        var b = new AnyNameExcept(nc, hash);
        this.pool.store(hash, b);
        return b;
    }

    name(uri: string, localname: string): NameClass {
        var hash = hashing.mix(Type.Name,
            hashing.mix(hashing.mixs(uri), hashing.mixs(localname)));
        var a = <Name>this.pool.load(hash);
        if (a instanceof Name &&
            a.uri === uri && a.localname === localname) return a;

        var b = new Name(uri, localname, hash);
        this.pool.store(hash, b);
        return b;
    }

    nameClassChoice(nc1: NameClass, nc2: NameClass): NameClass {
        var hash = hashing.mix(Type.NameClassChoice,
            hashing.mix(nc1.hash, nc2.hash));
        var a = <NameClassChoice>this.pool.load(hash);
        if (a instanceof NameClassChoice &&
            a.nc1 === nc1 && a.nc2 && nc2) return a;

        var b = new NameClassChoice(nc1, nc2, hash);
        this.pool.store(hash, b);
        return b;
    }

    nsName(uri: string): NameClass {
        var hash = hashing.mix(Type.NsName, hashing.mixs(uri));
        var a = <NsName>this.pool.load(hash);
        if (a instanceof NsName &&
            a.uri === uri) return a;

        var b = new NsName(uri, hash);
        this.pool.store(hash, b);
        return b;
    }

    nsNameExcept(uri: string, nc: NameClass): NameClass {
        var hash = hashing.mix(Type.NsNameExcept,
            hashing.mix(hashing.mixs(uri), nc.hash));
        var a = <NsNameExcept>this.pool.load(hash);
        if (a instanceof NsNameExcept &&
            a.uri === uri && a.nc === a.nc) return a;

        var b = new NsNameExcept(uri, nc, hash);
        this.pool.store(hash, b);
        return b;
    }

    // Patterns

    attribute(nc: NameClass, p: Pattern): Pattern {
        var hash = hashing.mix(Type.Attribute, hashing.mix(nc.hash, p.hash));
        var a = <Attribute>this.pool.load(hash);
        if (a instanceof Attribute &&
            a.nc === nc && a.p === p) return a;

        var b = new Attribute(nc, p, hash, this);
        this.pool.store(hash, b);
        return b;
    }

    after(p1: Pattern, p2: Pattern): Pattern {
        if (p1 === this.notAllowed) return this.notAllowed;
        if (p2 === this.notAllowed) return this.notAllowed;

        var hash = hashing.mix(Type.After, hashing.mix(p1.hash, p2.hash));
        var a = <After>this.pool.load(hash);
        if (a instanceof After &&
            a.p1 === p1 && a.p2 === p2) return a;

        var b = new After(p1, p2, hash, this);
        this.pool.store(hash, b);
        return b;
    }

    choice(...patterns: Pattern[]): Pattern {
        var ps: Pattern[] = [];
        for (var i = 0; i < patterns.length; i++) {
            var p = patterns[i];
            if (p instanceof NotAllowed) {
                continue;
            }
            if (p instanceof Choice) {
                ps = hashing.merge(ps, p.ps);
            } else {
                hashing.insert(p, ps);
            }
        }
        ps = ps.filter(isAllowed);
        if (ps.length === 0) return this.notAllowed;
        if (ps.length === 1) return ps[0];

        var hash = hashing.mixa(Type.Choice, ps);
        var a = <Choice>this.pool.load(hash);
        if (a instanceof Choice &&
            isSameArray(ps, a.ps)) return a;

        var b = new Choice(ps, hash, this);
        this.pool.store(hash, b);
        return b;
    }

    data(datatype: lib.Datatype): Pattern {
        var hash = hashing.mix(Type.Data, datatype.id);
        var a = <Data>this.pool.load(hash);
        if (a instanceof Data &&
            a.type === datatype) return a;

        var b = new Data(datatype, hash, this);
        this.pool.store(hash, b);
        return b;
    }

    dataExcept(datatype: lib.Datatype, p: Pattern): Pattern {
        var hash = hashing.mix(Type.DataExcept,
            hashing.mix(datatype.id, p.hash));
        var a = <DataExcept>this.pool.load(hash);
        if (a instanceof DataExcept &&
            a.type === datatype && a.p === p) return a;

        var b = new DataExcept(datatype, p, hash, this);
        this.pool.store(hash, b);
        return b;
    }

    element(nc: NameClass, p: Pattern): Pattern {
        var hash = hashing.mix(Type.Element,
            hashing.mix(nc.hash, p.hash));
        var a = <Element>this.pool.load(hash);
        if (a instanceof Element &&
            a.nc === nc && a.p === p) return a;

        var b = new Element(nc, p, hash, this);
        this.pool.store(hash, b);
        return b;
    }

    group(p1: Pattern, p2: Pattern): Pattern {
        if (p1 === this.notAllowed) return this.notAllowed;
        if (p2 === this.notAllowed) return this.notAllowed;
        if (p1 === this.empty) return p2;
        if (p2 === this.empty) return p1;

        var hash = hashing.mix(Type.Group, hashing.mix(p1.hash, p2.hash));
        var a = <Group>this.pool.load(hash);
        if (a instanceof Group &&
            a.p1 === p1 && a.p2 === p2) return a;

        var b = new Group(p1, p2, hash, this);
        this.pool.store(hash, b);
        return b;
    }

    interleave(p1: Pattern, p2: Pattern): Pattern {
        if (p1 === this.notAllowed) return this.notAllowed;
        if (p2 === this.notAllowed) return this.notAllowed;
        if (p1 === this.empty) return p2;
        if (p2 === this.empty) return p1;

        var hash = hashing.mix(Type.Interleave, hashing.mix(p1.hash, p2.hash));
        var a = <Interleave>this.pool.load(hash);
        if (a instanceof Interleave &&
            a.p1 === p1 && a.p2 === p2) return a;

        var b = new Interleave(p1, p2, hash, this);
        this.pool.store(hash, b);
        return b;
    }

    list(p: Pattern): Pattern {
        var hash = hashing.mix(Type.List, p.hash);
        var a = <List>this.pool.load(hash);
        if (a instanceof List &&
            a.p === p) return a;

        var b = new List(p, hash, this);
        this.pool.store(hash, b);
        return b;
    }

    oneOrMore(p: Pattern): Pattern {
        if (p === this.notAllowed) return this.notAllowed;

        var hash = hashing.mix(Type.OneOrMore, p.hash);
        var a = <OneOrMore>this.pool.load(hash);
        if (a instanceof OneOrMore &&
            a.p === p) return a;

        var b = new OneOrMore(p, hash, this);
        this.pool.store(hash, b);
        return b;
    }

    ref(name: string): Pattern {
        var hash = hashing.mix(Type.Ref, hashing.mixs(name));
        var a = <Ref>this.pool.load(hash);
        if (a instanceof Ref &&
            a.name === name) return a;

        var b = new Ref(name, hash, this);
        this.pool.store(hash, b);
        return b;
    }

    value(type: lib.Datatype, value: string): Pattern {
        var hash = hashing.mix(Type.Value, hashing.mixs(value));
        var a = <Value>this.pool.load(hash);
        if (a instanceof Value &&
            a.type === type && a.value === value) return a;

        var b = new Value(type, value, hash, this);
        this.pool.store(hash, b);
        return b;
    }

    // Defines

    define(name: string, p: Pattern): void {
        this.defines[name] = p;
    }

}

function impossible(message?: string): any {
    throw new Error('The impossible happened: ' + message);
}

class After implements Pattern {
    constructor(public p1: Pattern, public p2: Pattern,
        public hash: number, public fac: PoolingFactory) { }
    applyAfter(f: (p: Pattern) => Pattern): Pattern {
        return this.fac.after(this.p1, f(this.p2));
    }
    att(qn: QName, t: string): Pattern {
        return this.fac.after(this.p1.att(qn, t), this.p2);
    }
    close(): Pattern {
        return this.fac.after(this.p1.close(), this.p2);
    }
    end(): Pattern {
        return this.p1.nullable() ? this.p2 : this.fac.notAllowed;
    }
    nullable(): boolean {
        return false;
    }
    start(qn: QName): Pattern {
        return this.p1.start(qn).applyAfter(this.flipAfter(this.p2));
    }
    text(t: string): Pattern {
        return this.fac.after(this.p1.text(t), this.p2);
    }
    toString(): string {
        return 'After(' + this.p1 + ', ' + this.p2 + ')';
    }
    private flipAfter(p1: Pattern): (p2: Pattern) => Pattern {
        return (p2: Pattern) => this.fac.after(p2, p1);
    }
}

class Attribute implements Pattern {
    constructor(public nc: NameClass, public p: Pattern,
        public hash: number, public fac: PoolingFactory) { }
    applyAfter(f: (p: Pattern) => Pattern): Pattern {
        return impossible();
    }
    att(qn: QName, t: string): Pattern {
        return this.nc.contain(qn) && this.valueMatch(t) ?
            this.fac.empty : this.fac.notAllowed;
    }
    close(): Pattern {
        return this.fac.notAllowed;
    }
    end(): Pattern {
        return this.fac.notAllowed;
    }
    nullable(): boolean {
        return false;
    }
    start(qn: QName): Pattern {
        return this.fac.notAllowed;
    }
    text(t: string): Pattern {
        return this.fac.notAllowed;
    }
    toString(): string {
        return 'Attribute(' + this.nc + ', ' + this.p + ')';
    }
    private valueMatch(t: string): boolean {
        return (this.p.nullable() && !!t.match(/^\s*$/)) ||
            this.p.text(t).nullable();
    }
}

class Choice implements Pattern {
    // ps must contain no Choice
    constructor(public ps: Pattern[], public hash: number,
        public fac: PoolingFactory) { }
    applyAfter(f: (p: Pattern) => Pattern): Pattern {
        var ps = this.ps.map((p) => p.applyAfter(f));
        return this.fac.choice.apply(this.fac, ps);
    }
    att(qn: QName, t: string): Pattern {
        var ps = this.ps.map((p) => p.att(qn, t));
        return this.fac.choice.apply(this.fac, ps);
    }
    close(): Pattern {
        var ps = this.ps.map((p) => p.close());
        return this.fac.choice.apply(this.fac, ps);
    }
    end(): Pattern {
        var ps = this.ps.map((p) => p.end());
        return this.fac.choice.apply(this.fac, ps);
    }
    nullable(): boolean {
        for (var i = 0; i < this.ps.length; i++) if (this.ps[i].nullable()) {
            return true;
        }
        return false;
    }
    start(qn: QName): Pattern {
        var ps = this.ps.map((p) => p.start(qn));
        return this.fac.choice.apply(this.fac, ps);
    }
    text(t: string): Pattern {
        var ps = this.ps.map((p) => p.text(t));
        return this.fac.choice.apply(this.fac, ps);
    }
    toString(): string {
        return 'Choice(' + this.ps.join(', ') + ')';
    }
}

class Data implements Pattern {
    constructor(public type: lib.Datatype,
        public hash: number, public fac: PoolingFactory) { }
    applyAfter(f: (p: Pattern) => Pattern): Pattern {
        return impossible();
    }
    att(qn: QName, t: string): Pattern {
        return this.fac.notAllowed;
    }
    close(): Pattern {
        return this;
    }
    end(): Pattern {
        return this.fac.notAllowed;
    }
    nullable(): boolean {
        return false;
    }
    start(qn: QName): Pattern {
        return this.fac.notAllowed;
    }
    text(t: string): Pattern {
        return this.type.allows(t) ? this.fac.empty : this.fac.notAllowed;
    }
    toString(): string {
        return 'Data(' + this.type + ')';
    }
}

class DataExcept implements Pattern {
    constructor(public type: lib.Datatype, public p: Pattern,
        public hash: number, public fac: PoolingFactory) { }
    applyAfter(f: (p: Pattern) => Pattern): Pattern {
        return impossible();
    }
    att(qn: QName, t: string): Pattern {
        return this.fac.notAllowed;
    }
    close(): Pattern {
        return this;
    }
    end(): Pattern {
        return this.fac.notAllowed;
    }
    nullable(): boolean {
        return false;
    }
    start(qn: QName): Pattern {
        return this.fac.notAllowed;
    }
    text(t: string): Pattern {
        return (this.type.allows(t) && !this.p.text(t).nullable()) ?
            this.fac.empty : this.fac.notAllowed;
    }
    toString(): string {
        return 'DataExcept(' + this.type + ', ' + this.p + ')';
    }
}

class Element implements Pattern {
    constructor(public nc: NameClass, public p: Pattern,
        public hash: number, public fac: PoolingFactory) { }
    applyAfter(f: (p: Pattern) => Pattern): Pattern {
        return impossible();
    }
    att(qn: QName, t: string): Pattern {
        return this.fac.notAllowed;
    }
    close(): Pattern {
        return this;
    }
    end(): Pattern {
        return this.fac.notAllowed;
    }
    nullable(): boolean {
        return false;
    }
    start(qn: QName): Pattern {
        if (this.nc.contain(qn)) return this.fac.after(this.p, this.fac.empty);
        return this.fac.notAllowed;
    }
    text(t: string): Pattern {
        return this.fac.notAllowed;
    }
    toString(): string {
        return 'Element(' + this.nc + ', ' + this.p + ')';
    }
}

class Empty implements Pattern {
    constructor(public hash: number, public fac: PoolingFactory) { }
    applyAfter(f: (p: Pattern) => Pattern): Pattern {
        return impossible();
    }
    att(qn: QName, t: string): Pattern {
        return this.fac.notAllowed;
    }
    close(): Pattern {
        return this;
    }
    end(): Pattern {
        return this.fac.notAllowed;
    }
    nullable(): boolean {
        return true;
    }
    start(qn: QName): Pattern {
        return this.fac.notAllowed;
    }
    text(t: string): Pattern {
        return t === '' ? this : this.fac.notAllowed;
    }
    toString(): string {
        return 'Empty';
    }
}

class Group implements Pattern {
    constructor(public p1: Pattern, public p2: Pattern,
        public hash: number, public fac: PoolingFactory) { }
    applyAfter(f: (p: Pattern) => Pattern): Pattern {
        return impossible();
    }
    att(qn: QName, t: string): Pattern {
        var r1 = this.fac.group(this.p1.att(qn, t), this.p2);
        var r2 = this.fac.group(this.p1, this.p2.att(qn, t));
        return this.fac.choice(r1, r2);
    }
    close(): Pattern {
        return this.fac.group(this.p1.close(), this.p2.close());
    }
    end(): Pattern {
        return this.fac.notAllowed;
    }
    nullable(): boolean {
        return this.p1.nullable() && this.p2.nullable();
    }
    start(qn: QName): Pattern {
        var r = this.p1.start(qn).applyAfter(this.flipGroup(this.p2));
        if (this.p1.nullable()) return this.fac.choice(r, this.p2.start(qn));
        return r;
    }
    text(t: string): Pattern {
        var r = this.fac.group(this.p1.text(t), this.p2);
        if (this.p1.nullable()) return this.fac.choice(r, this.p2.text(t));
        return r;
    }
    toString(): string {
        return 'Group(' + this.p1 + ', ' + this.p2 + ')';
    }
    private flipGroup(p1: Pattern): (p2: Pattern) => Pattern {
        return (p2: Pattern) => this.fac.group(p2, p1);
    }
}

class Interleave implements Pattern {
    constructor(public p1: Pattern, public p2: Pattern,
        public hash: number, public fac: PoolingFactory) { }
    applyAfter(f: (p: Pattern) => Pattern): Pattern {
        return impossible();
    }
    att(qn: QName, t: string): Pattern {
        var r1 = this.fac.interleave(this.p1.att(qn, t), this.p2);
        var r2 = this.fac.interleave(this.p1, this.p2.att(qn, t));
        return this.fac.choice(r1, r2);
    }
    close(): Pattern {
        return this.fac.interleave(this.p1.close(), this.p2.close());
    }
    end(): Pattern {
        return this.fac.notAllowed;
    }
    nullable(): boolean {
        return this.p1.nullable() && this.p2.nullable();
    }
    start(qn: QName): Pattern {
        var r1 = this.p1.start(qn).applyAfter(this.flipInterleave(this.p2));
        var r2 = this.p2.start(qn).applyAfter(this.interleave(this.p1));
        return this.fac.choice(r1, r2);
    }
    text(t: string): Pattern {
        var r1 = this.fac.interleave(this.p1.text(t), this.p2);
        var r2 = this.fac.interleave(this.p1, this.p2.text(t));
        return this.fac.choice(r1, r2);
    }
    toString(): string {
        return 'Interleave(' + this.p1 + ', ' + this.p2 + ')';
    }
    private interleave(p1: Pattern): (p2: Pattern) => Pattern {
        return (p2: Pattern) => this.fac.interleave(p1, p2);
    }
    private flipInterleave(p1: Pattern): (p2: Pattern) => Pattern {
        return (p2: Pattern) => this.fac.interleave(p2, p1);
    }
}

class List implements Pattern {
    constructor(public p: Pattern,
        public hash: number, public fac: PoolingFactory) { }
    applyAfter(f: (p: Pattern) => Pattern): Pattern { return impossible(); }
    att(qn: QName, t: string): Pattern {
        return this.fac.notAllowed;
    }
    close(): Pattern {
        return this;
    }
    end(): Pattern {
        return this.fac.notAllowed;
    }
    nullable(): boolean {
        return false;
    }
    start(qn: QName): Pattern {
        return this.fac.notAllowed;
    }
    text(t: string): Pattern {
        var r = this.p;
        var normalized = t.replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' ');
        if (normalized === '') return r;

        var list = normalized.split(' ');
        for (var i = 0; i < list.length; i++) r = r.text(list[i]);
        return r;
    }
    toString(): string {
        return 'List(' + this.p + ')';
    }
}

class NotAllowed implements Pattern {
    constructor(public hash: number, public fac: PoolingFactory) { }
    applyAfter(f: (p: Pattern) => Pattern): Pattern {
        return this.fac.notAllowed;
    }
    att(qn: QName, t: string): Pattern {
        return this.fac.notAllowed;
    }
    close(): Pattern {
        return this;
    }
    end(): Pattern {
        return this.fac.notAllowed;
    }
    nullable(): boolean {
        return false;
    }
    start(qn: QName): Pattern {
        return this.fac.notAllowed;
    }
    text(t: string): Pattern {
        return this.fac.notAllowed;
    }
    toString(): string {
        return 'NotAllowed';
    }
}

class OneOrMore implements Pattern {
    constructor(public p: Pattern,
        public hash: number, public fac: PoolingFactory) { }
    applyAfter(f: (p: Pattern) => Pattern): Pattern {
        return impossible();
    }
    att(qn: QName, t: string): Pattern {
        var r1 = this.p.att(qn, t);
        var r2 = this.fac.choice(this, this.fac.empty);
        return this.fac.group(r1, r2);
    }
    close(): Pattern {
        return this.fac.oneOrMore(this.p.close());
    }
    end(): Pattern {
        return this.fac.notAllowed;
    }
    nullable(): boolean {
        return this.p.nullable();
    }
    start(qn: QName): Pattern {
        var r = this.fac.choice(this, this.fac.empty);
        return this.p.start(qn).applyAfter(this.flipGroup(r));
    }
    text(t: string): Pattern {
        var r1 = this.p.text(t);
        var r2 = this.fac.choice(this, this.fac.empty);
        return this.fac.group(r1, r2);
    }
    toString(): string {
        return 'OneOrMore(' + this.p + ')';
    }
    private flipGroup(p1: Pattern): (p2: Pattern) => Pattern {
        return (p2: Pattern) => this.fac.group(p2, p1);
    }
}

class Ref implements Pattern {
    constructor(public name: string,
        public hash: number, public fac: PoolingFactory) { }
    applyAfter(f: (p: Pattern) => Pattern): Pattern {
        return this.fac.defines[this.name].applyAfter(f);
    }
    att(qn: QName, t: string): Pattern {
        return this.fac.defines[this.name].att(qn, t);
    }
    close(): Pattern {
        return this.fac.defines[this.name].close();
    }
    end(): Pattern {
        return this.fac.defines[this.name].end();
    }
    nullable(): boolean {
        return this.fac.defines[this.name].nullable();
    }
    start(qn: QName): Pattern {
        return this.fac.defines[this.name].start(qn);
    }
    text(t: string): Pattern {
        return this.fac.defines[this.name].text(t);
    }
    toString(): string {
        return 'Ref(' + this.name + ')';
    }
}

class Text implements Pattern {
    constructor(public hash: number, public fac: PoolingFactory) { }
    applyAfter(f: (p: Pattern) => Pattern): Pattern {
        return impossible();
    }
    att(qn: QName, t: string): Pattern {
        return this.fac.notAllowed;
    }
    close(): Pattern {
        return this;
    }
    end(): Pattern {
        return this.fac.notAllowed;
    }
    nullable(): boolean {
        return true;
    }
    start(qn: QName): Pattern {
        return this.fac.notAllowed;
    }
    text(t: string): Pattern {
        return this;
    }
    toString(): string {
        return 'Text';
    }
}

class Value implements Pattern {
    constructor(public type: lib.Datatype, public value: string,
        public hash: number, public fac: PoolingFactory) { }
    applyAfter(f: (p: Pattern) => Pattern): Pattern {
        return impossible();
    }
    att(qn: QName, t: string): Pattern {
        return this.fac.notAllowed;
    }
    close(): Pattern {
        return this;
    }
    end(): Pattern {
        return this.fac.notAllowed;
    }
    nullable(): boolean {
        return false;
    }
    start(qn: QName): Pattern {
        return this.fac.notAllowed;
    }
    text(t: string): Pattern {
        var typ = this.type;
        var ok = typ.allows(t) && typ.value(t) === typ.value(this.value);
        return ok ? this.fac.empty : this.fac.notAllowed;
    }
    toString(): string {
        return 'Value(' + this.type + ', ' + this.value + ')';
    }
}

export function factory(): Factory {
    return new PoolingFactory();
}
