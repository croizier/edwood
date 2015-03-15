/// <reference path="react-0.13.0.d.ts" />

export import dom = require('./dom');
export import parser = require('./parser');
import React = require('react');

var html = React.DOM;

export interface CellProps { node: dom.Node }

export interface CellState {
    domValue: string;
    domError: boolean;
    localValue: string;
    localError: boolean;
}

export var Cell = React.createClass<CellProps, CellState>({
    displayName: 'Cell',
    componentDidMount() {
        this.handleProps(this.props);
        var that = this;
        this.interval = window.setInterval(function() {
            var node: dom.Node = that.props.node;
            var state: CellState = that.state;
            var value = that.getInput().value;
            if (value !== state.domValue) node.textContent = value;
        }, 200);
    },
    componentWillReceiveProps(nextProps: CellProps) {
        this.handleProps(nextProps);
    },
    componentWillUnmount() {
        window.clearInterval(this.interval);
    },
    getInitialState() {
        return this.toState(this.props);
    },
    render: function() {
        var state: CellState = this.state;
        var color = (state.domError || state.localError) ? '#f66' : '#eef';
        return html.input({
            size: 5,
            style: { border: 0, backgroundColor: color, spellCheck: false },
            value: state.localValue,
            onChange: this.handleChange,
        });
    },
    getInput(): HTMLInputElement {
        return <HTMLInputElement>React.findDOMNode(this);
    },
    handleChange() {
        var node: dom.Node = this.props.node;
        var state: CellState = this.state;
        var value = this.getInput().value;
        this.setState({
            localValue: value,
            localError: !node.allows(value),
        });
    },
    handleProps(props: CellProps) {
        this.setState(this.toState(props));
    },
    toState(props: CellProps): CellState {
        var node: dom.Node = props.node;
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

export var cell = React.createFactory(Cell);

export interface UniversalProps { element: dom.Element }

export var Universal: React.ClassicComponentClass<UniversalProps, {}>;
Universal = React.createClass<UniversalProps, {}>({
    displayName: 'Universal',
    render: function() {
        var e: dom.Element = this.props.element;
        var as = e.attributes(null, a => this.line(a.localName, a));
        var es = e.elements(null, c =>
            React.createElement(Universal, { key: c.key, element: c }));
        var content = es.length > 0 ? es : cell({ node: e });
        return html.div(
            { style: { margin: 5, padding: 5, border: 'thin solid' } },
            html.h3({ style: { margin: 0 } }, e.localName),
            html.div({ style: { marginLeft: 20 } }, as, content));
    },
    line(title: string, node: dom.Node) {
        return html.div(
            { key: node.key },
            html.div(
                { style: { display: 'inline-block', marginRight: 5 } },
                title),
            html.div(
                { style: { display: 'inline-block' } },
                cell({ node: node })));
    }
});

export var universal = React.createFactory(Universal);
