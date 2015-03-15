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

// implementations of api.Node wrap a native node with some expandos:
// _proxy: the wrapping object
// _pattern: the pattern that this node must validate against
// _content: the pattern that the node content must validate against

function wrapAttr(a: Attr) {
    if ((<any>a)._proxy) return (<any>a)._proxy;
    var p = new ProxyAttr(a);
    (<any>a)._proxy = p;
    return p;
}

function wrapElement(e: Element) {
    if ((<any>e)._proxy) return (<any>e)._proxy;
    var p = new ProxyElement(e);
    (<any>e)._proxy = p;
    return p;
}

function proxy(n: Node): ProxyNode {
    return (<any>n)._proxy;
}

var proxyCount = 1;

interface ProxyNode extends dom.Node {
    node: Node;
}

class ProxyAttr implements dom.Attr, ProxyNode {
    key = ':' + proxyCount++;
    version = 1;
    constructor(public node: Attr) {
        (<any>node)._proxy = this;
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
        var p = <pat.Pattern>((<any>a)._pattern);
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
        (<any>node)._proxy = this;
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
        var p = <pat.Pattern>((<any>this.node)._content);
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
            if (!filter || filter(b)) ts.push(mapper ? mapper(b, i) : <T>b);
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
            if (!filter || filter(e)) ts.push(mapper ? mapper(e, i++) : <T>e);
        }
        return ts;
    }
}

class ProxyDocument implements dom.Document {
    node: Document;
    private pattern: pat.Pattern;
    private error: dom.Error;
    private changeActions: Array<() => void> = [];
    version = 1;
    constructor(xml: string, rng: string) {
        this.node = new DOMParser().parseFromString(xml, 'application/xml');
        (<any>this.node)._proxy = this;

        var doc = new DOMParser().parseFromString(rng, 'application/xml');
        this.pattern = gra.parse(doc.documentElement);
        this.validate();
    }

    get documentElement() {
        return wrapElement(this.node.documentElement);
    }
    createElement(namespace: string, qualifiedName: string): dom.Element {
        var res = this.node.createElementNS(namespace, qualifiedName);
        return wrapElement(res);
    }

    getError() {
        return this.error;
    }
    onChange(action: () => void) {
        this.changeActions.push(action);
    }
    emitChange() {
        this.changeActions.forEach(a => a());
    }
    serialize(): string {
        return new XMLSerializer().serializeToString(this.node);
    }
    changeAncestors(n: dom.Node) {
        n.version += 1;
        var p = (<ProxyNode>n).node;
        p = p instanceof Attr ? p.ownerElement : p.parentNode;
        while (p !== this.node) {
            var q = proxy(p);
            if (q) q.version += 1;
            p = p.parentNode;
        }
        this.version += 1;
    }
    validate(): void {
        var n: Node = this.node.documentElement;
        var p = this.pattern;
        var e = <Element>(n.parentNode);

        while (true) {
            switch (n.nodeType) {
                case Node.ELEMENT_NODE:
                    this.setp(n, p);

                    // open start tag
                    p = p.start(p.fac.qname(n.namespaceURI || '', n.localName));
                    if (p === p.fac.notAllowed) {
                        this.setElementError(n, dom.Message.UNEXPECTED_ELEMENT);
                        return;
                    }

                    // validate attributes
                    for (var i = 0; i < n.attributes.length; i++) {
                        var a = n.attributes.item(i);
                        this.setp(a, p);

                        // ignore xmlns pseudo-attributes
                        if (a.name === 'xmlns' ||
                            a.name.match(/^xmlns:/)) continue;

                        // set pattern for current attribute
                        (<any>a)._pattern = p;

                        // validate the attribute
                        var qn = p.fac.qname(a.namespaceURI || '', a.localName);
                        p = p.att(qn, a.value);
                        if (p === p.fac.notAllowed) {
                            this.setAttrError(a, dom.Message.WRONG_ATTRIBUTE);
                            return;
                        }
                    }

                    // close start tag 
                    p = p.close();
                    if (p === p.fac.notAllowed) {
                        this.setElementError(n, dom.Message.MISSING_ATTRIBUTE);
                        return;
                    }

                    // set content pattern for current element
                    (<any>n)._content = p;

                    if (!(<Element>n).firstElementChild) {
                        // element contains only text, process it
                        p = this.deriveText(p, n.textContent);
                        if (p === p.fac.notAllowed) {
                            this.setElementError(n, dom.Message.WRONG_DATA);
                            return;
                        }

                        // and move to the end of the element
                        e = <Element>n;
                        n = null;
                    } else {
                        // element contains elements, move its first child
                        e = <Element>n;
                        n = n.firstChild;
                    }

                    break;
                case Node.TEXT_NODE:
                    var merged = this.mergeTextNodes(n);
                    n = merged.node;
                    p = this.deriveText(p, merged.text);
                    if (p === p.fac.notAllowed) {
                        this.setElementError(e, dom.Message.WRONG_DATA);
                        return;
                    }
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
                    throw new Error('unexpected node type: ' + n.nodeType);
            }

            while (!n) {
                // no more children in this element

                // process end tag of parent
                p = p.end();
                if (p === p.fac.notAllowed) {
                    this.setElementError(e, dom.Message.MISSING_CONTENT);
                    return;
                }

                if (e !== this.node.documentElement) {
                    // move up to parent
                    n = e;
                    e = <Element>(n.parentNode);

                    // continue the walk with next sibling
                    n = n.nextSibling;
                } else {
                    // we have reached the end of the document
                    if (p.nullable()) {
                        this.error = null;
                    } else {
                        this.setElementError(e, dom.Message.EOF);
                    }
                    return;
                }
            }
        }
    }
    private deriveText(p: pat.Pattern, text: string): pat.Pattern {
        var p1 = p.text(text);
        return text.match(/^\s*$/) ? p.fac.choice(p, p1) : p1;
    }
    // advance node to the first element if any, ignoring non-text nodes
    // return concatenation of all text nodes traversed
    private mergeTextNodes(node: Node): { text: string; node: Node } {
        var text = '';
        while (node && node.nodeType !== Node.ELEMENT_NODE) {
            if (node.nodeType === Node.TEXT_NODE) text += node.textContent;
            node = node.nextSibling;
        }
        return { text: text, node: node };
    }
    private setElementError(node: Node, message: dom.Message): void {
        this.error = {
            attribute: null,
            element: wrapElement(<Element>node),
            message: message
        };
    }
    private setAttrError(node: Node, message: dom.Message): void {
        this.error = {
            attribute: wrapAttr(<Attr>node),
            element: null,
            message: message
        };
    }
    private getp(node: Node) {
        return (<any>node)._pattern;
    }
    private setp(node: Node, pattern: pat.Pattern) {
        (<any>node)._pattern = pattern;
    }
}

function change(node: dom.Node) {
    var doc = <ProxyDocument>node.ownerDocument;
    doc.changeAncestors(node);
    doc.validate();
    doc.emitChange();
}

export function parse(xml: string, rng: string): dom.Document {
    return new ProxyDocument(xml, rng);
}
