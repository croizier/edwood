import dom = require('./dom');
import parser = require('./parser');
import React = require('react');
import ui = require('./ui');

var html = React.DOM;

interface State { root: dom.Element }
class Main extends React.Component<State, State> {
    state = this.props;
    componentDidMount() {
        this.state.root.ownerDocument.onChange(() => this.forceUpdate());
    }
    render() {
        var root = this.state.root;
        var error = root.ownerDocument.getError();
        return html.div(null,
            root.localName,
            html.ul(null,
                root.elements(null, e =>
                    html.li({key: e.key},
                        html.span(null, e.localName + ': '),
                        ui.cell({node: e})
                    )
                )
            ),
            error && ('ERROR: ' + error.message)
        );
    }
}

var main = React.createFactory(Main);

var xsd = 'http://www.w3.org/2001/XMLSchema-datatypes';
var data = (datatype: string) =>
    '<data type="' + datatype + '" datatypeLibrary="' + xsd + '"/>';
var define = (name: string, content: string) =>
    '<define name="' + name + '"><element><name ns="">' + name + '</name>' +
    content + '</element></define>';
var rng = '<grammar xmlns="http://relaxng.org/ns/structure/1.0">' +
    '<start><ref name="a"/></start>' +
    define('a', '<group><ref name="b"/><ref name="c"/></group>') +
    define('b', data('boolean')) +
    define('c', data('integer')) +
    '</grammar>';

var xml = '<a><b>true</b><c>123</c></a>';
var doc = parser.parse(xml, rng);
var a = doc.documentElement;

var container = document.getElementById('container');
React.render(main({root: a}), container);
