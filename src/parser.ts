import dom = require('./dom');
import gra = require('./grammar');
import pat = require('./pattern');

function checkElement(e1: dom.Element, e2?: dom.Element): void {
    if (!(e1 instanceof ProxyElement)) throw new Error();
    if (e2 && !(e2 instanceof ProxyElement)) throw new Error();
}

function pe(e: dom.Element): ProxyElement {
    return <ProxyElement>e;
}

// information attached to native nodes during validation
interface Info {
    proxy: ProxyNode; // proxy to the node
    content: pat.Pattern; // pattern that must validate the content of the node
    pattern: pat.Pattern; // pattern that must validate the whole node
    result: pat.Pattern; // result of the last validation of the node
}

// get info of the node, after initializing it if it is not there yet
function info(node: Node): Info {
    var n: any = node;
    if (!n._psvi) n._psvi = {
        proxy: null, content: null, pattern: null, result: null };
    return n._psvi;
}

function wrapAttr(a: Attr): ProxyAttr {
    var i = info(a);
    if (!i.proxy) i.proxy = new ProxyAttr(a);
    return <ProxyAttr>i.proxy;
}

function wrapElement(e: Element): ProxyElement {
    var i = info(e);
    if (!i.proxy) i.proxy = new ProxyElement(e);
    return <ProxyElement>i.proxy;
}

var errorAttr = (a: Attr, message: dom.Message) =>
    <dom.Error>{ attribute: wrapAttr(a), element: null, message: message };

var errorElem = (e: Element, message: dom.Message) =>
    <dom.Error>{ attribute: null, element: wrapElement(e), message: message};

var proxyCount = 1;

interface ProxyNode extends dom.Node {
    node: Node;
}

class ProxyAttr implements dom.Attr, ProxyNode {
    key = ':' + proxyCount++;
    version = 1;
    constructor(public node: Attr) {
        info(node).proxy = this;
    }

    get localName() {
        return this.node.localName;
    }
    get namespaceURI() {
        return this.node.namespaceURI;
    }
    get textContent() {
        return this.node.value;
    }
    set textContent(content: string) {
        this.node.value = content;
        change(this);
    }
    get ownerElement() {
        return wrapElement(<Element>this.node.ownerElement);
    }
    get ownerDocument() {
        return <ProxyDocument>(<any>this.node.ownerDocument)._proxy;
    }

    allows(text: string) {
        var a = this.node;
        var p = info(a).pattern;
        if (!p) return true;
        var qn = p.fac.qname(a.namespaceURI || '', a.localName);
        return p.att(qn, text) !== p.fac.notAllowed;
    }
}

class ProxyElement implements dom.Element, ProxyNode {
    content: pat.Pattern;
    key = ':' + proxyCount++;
    version = 1;
    constructor(public node: Element) {
        info(node).proxy = this;
    }

    get localName() {
        return this.node.localName;
    }
    get namespaceURI() {
        return this.node.namespaceURI;
    }
    get textContent() {
        return this.node.textContent;
    }
    set textContent(content: string) {
        this.node.textContent = content;
        change(this);
    }
    get ownerElement() {
        var parent = this.node.parentNode;
        if (parent === this.node.ownerDocument) return null;
        return wrapElement(<Element>parent);
    }
    get ownerDocument() {
        return <ProxyDocument>(<any>this.node.ownerDocument)._proxy;
    }
    getAttributeNodeNS(namespace: string, localName: string) {
        var attr = this.node.getAttributeNodeNS(namespace, localName);
        return attr ? wrapAttr(attr) : null;
    }
    setAttributeNS(namespace: string, localName: string, value: string) {
        this.node.setAttributeNS(namespace, localName, value);
        var a = this.getAttributeNodeNS(namespace, localName);
        if (a === null) throw new Error();
        change(a);
    }
    removeAttributeNS(namespace: string, localName: string) {
        this.node.removeAttributeNS(namespace, localName);
        change(this);
    }
    appendChild(node: dom.Element) {
        checkElement(node);
        this.node.appendChild(pe(node).node);
        change(node);
    }
    insertBefore(node: dom.Element, child: dom.Element) {
        checkElement(node, child);
        this.node.insertBefore(pe(node).node, pe(child).node);
        change(node);
    }
    removeChild(child: dom.Element) {
        checkElement(child);
        this.node.removeChild(pe(child).node);
        change(this);
    }
    replaceChild(node: dom.Element, child: dom.Element) {
        checkElement(node, child);
        this.node.replaceChild(pe(node).node, pe(child).node);
        change(child);
    }

    allows(text: string) {
        var p = info(this.node).content;
        if (!p) return true;
        return p.text(text) !== p.fac.notAllowed;
    }
    attributes<T>(
        filter?: (a: dom.Attr) => boolean,
        mapper?: (a: dom.Attr, i?: number) => T): T[] {
        var ts: T[] = [];
        var as = this.node.attributes;
        for (var i = 0; i < as.length; i++) {
            var a = as.item(i);
            var b = wrapAttr(a);
            if (!filter || filter(b)) ts.push(mapper ? mapper(b, i) : <any>b);
        }
        return ts;
    }
    elements<T>(
        filter?: (e: dom.Element) => boolean,
        mapper?: (e: dom.Element, i?: number) => T): T[] {
        var i = 0;
        var ts: T[] = [];
        for (var c = this.node.firstElementChild; c; c = c.nextElementSibling) {
            var e = wrapElement(c);
            if (!filter || filter(e)) ts.push(mapper ? mapper(e, i++) : <any>e);
        }
        return ts;
    }
}

class ProxyDocument implements dom.Document {
    private pattern: pat.Pattern;
    private error: dom.Error;
    private changeActions: Array<() => void> = [];
    doc: Document;
    version = 1;
    constructor(xml: string, rng: string) {
        this.doc = new DOMParser().parseFromString(xml, 'application/xml');
        (<any>this.doc)._proxy = this;

        var doc = new DOMParser().parseFromString(rng, 'application/xml');
        this.pattern = gra.parse(doc.documentElement);
        this.validate();
    }

    get documentElement() {
        return wrapElement(this.doc.documentElement);
    }
    createElement(namespace: string, qualifiedName: string): dom.Element {
        var res = this.doc.createElementNS(namespace, qualifiedName);
        return wrapElement(res);
    }

    getError() {
        return this.error;
    }
    onChange(action: () => void) {
        this.changeActions.push(action);
    }
    serialize(): string {
        return new XMLSerializer().serializeToString(this.doc);
    }
    change(node: dom.Node): void {
        var first = this.error && (this.error.attribute || this.error.element);
        if (first) this.changeAncestors(first);
        this.changeAncestors(node);
        this.validate();
        this.emitChange();
    }
    // increment version and invalidate result of ancestors or self
    private changeAncestors(n: dom.Node) {
        n.version += 1;
        var p = (<ProxyNode>n).node;
        info(p).result = null;
        p = p instanceof Attr ? p.ownerElement : p.parentNode;
        while (p !== this.doc) {
            var i = info(p);
            i.result = null;
            var q = i.proxy;
            if (q) q.version += 1;
            p = p.parentNode;
        }
        this.version += 1;
    }
    private emitChange() {
        this.changeActions.forEach(a => a());
    }
    private validate(): void {
        var element = this.doc.documentElement;
        this.error = this.validateElement(element, this.pattern);
    }
    private validateElement(e: Element, p: pat.Pattern): dom.Error {
        var i = info(e);
        // incremental validation optimization:
        // if the pattern has not changed since the last validation and
        // the element was valid and we know the validation result,
        // then we don't need to process it again nor its subtree
        if (i.pattern === p && i.result) return null;

        // set the element pattern and invalidate its result
        i.pattern = p;
        i.result = null;

        var no = p.fac.notAllowed;
        // open start tag
        p = p.start(p.fac.qname(e.namespaceURI || '', e.localName));
        if (p === no) return errorElem(e, dom.Message.WRONG_ELEMENT);

        // validate attributes
        for (var j = 0; j < e.attributes.length; j++) {
            var a = e.attributes.item(j);

            // ignore xmlns pseudo-attributes
            if (a.name === 'xmlns' || a.name.match(/^xmlns:/)) continue;

            // set pattern for current attribute
            info(a).pattern = p;

            // validate the attribute
            var qn = p.fac.qname(a.namespaceURI || '', a.localName);
            p = p.att(qn, a.value);
            if (p === no) return errorAttr(a, dom.Message.WRONG_ATTRIBUTE);
        }

        // close start tag 
        p = p.close();
        if (p === no) return errorElem(e, dom.Message.MISSING_ATTRIBUTE);

        // set content pattern for current element
        i.content = p;

        // check whether element is text-only or has element children
        if (!e.firstElementChild) {
            // element contains only text
            p = this.deriveText(p, e.textContent);
            if (p === no) return errorElem(e, dom.Message.DATA);
        } else {
            // element contains elements, and maybe also mixed content
            for (var n = e.firstChild; n; n = n.nextSibling) {
                switch (n.nodeType) {
                    case Node.ELEMENT_NODE:
                        var error = this.validateElement(<Element>n, p);
                        if (error) return error;
                        p = info(n).result;
                        break;
                    case Node.TEXT_NODE:
                        var merged = this.mergeTextNodes(n);
                        p = this.deriveText(p, merged.text);
                        if (p === no) return errorElem(e, dom.Message.DATA);
                        n = merged.node;
                        break;
                    case Node.COMMENT_NODE:
                    case Node.PROCESSING_INSTRUCTION_NODE:
                        // ignore it
                        break;
                    case Node.ATTRIBUTE_NODE:
                    case Node.DOCUMENT_NODE:
                    case Node.DOCUMENT_TYPE_NODE:
                    case Node.DOCUMENT_FRAGMENT_NODE:
                        // this algorithm should never reach those nodes here
                        throw new Error('impossible node type: ' + n.nodeType);
                    default:
                        // obsolete or totally unknown nodes
                        throw new Error('unknown node type: ' + n.nodeType);
                }
            }
        }

        // process end tag
        p = p.end();
        if (p === no) return errorElem(e, dom.Message.MISSING_CONTENT);

        // the element is valid; cache the result, hoping to reuse it next time
        i.result = p;
        return null;
    }
    private deriveText(p: pat.Pattern, text: string): pat.Pattern {
        var p1 = p.text(text);
        return text.match(/^\s*$/) ? p.fac.choice(p, p1) : p1;
    }
    // merge text nodes, moving to the last one, ignoring comments and PIs
    // return concatenation of all text nodes traversed
    private mergeTextNodes(node: Node): { text: string; node: Node } {
        var text = '';
        while (true) {
            if (node.nodeType === Node.TEXT_NODE) text += node.textContent;
            var next = node.nextSibling;
            var ok = next && next.nodeType !== Node.ELEMENT_NODE;
            if (ok) node = next; else break;
        }
        return { text: text, node: node };
    }
}

function change(node: dom.Node) {
    var doc =  <ProxyDocument>node.ownerDocument;
    doc.change(node);
}

export function parse(xml: string, rng: string): dom.Document {
    return new ProxyDocument(xml, rng);
}
