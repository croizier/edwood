export interface Node {
    // W3C DOM level 3
    localName: string;
    namespaceURI: string;
    ownerDocument: Document;
    textContent: string;

    // Extensions
    ownerElement: Element;
    key: string;
    version: number;
    allows(text: string): boolean;
}

export interface Attr extends Node { }

export interface Element extends Node {
    // W3C DOM level 3
    appendChild(node: Element): void;
    getAttributeNodeNS(namespace: string, localName: string): Attr;
    insertBefore(node: Element, child: Element): void;
    removeAttributeNS(namespace: string, localName: string): void;
    removeChild(child: Element): void;
    replaceChild(node: Element, child: Element): void;
    setAttributeNS(
        namespace: string, localName: string, value: string): void;

    // Extensions
    attributes(filter?: (a: Attr) => boolean): Attr[];
    attributes<T>(
        filter: (a: Attr) => boolean,
        mapper: (a: Attr, i?: number) => T): T[];
    elements(filter?: (e: Element) => boolean): Element[];
    elements<T>(
        filter: (e: Element) => boolean,
        mapper: (e: Element, i?: number) => T): T[];
}

export enum Message {
    EOF = 1,
    UNEXPECTED_ELEMENT,
    MISSING_ATTRIBUTE,
    MISSING_CONTENT,
    WRONG_ATTRIBUTE,
    WRONG_DATA,
}

export interface Error {
    attribute: Attr;
    element: Element;
    message: Message;
}

export interface Document {
    // W3C DOM level 3
    createElement(namespace: string, qualifiedName: string): Element;
    documentElement: Element;

    // Extensions
    version: number;
    getError(): Error;
    onChange(action: () => void): void;
    serialize(): string;
}
