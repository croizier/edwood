export interface Param {
    name: string;
    value: string;
}

export interface Datatype {
    id: number;
    name: string;

    allows(text: string): boolean;
    value(text: string): any;

    derive(params: Param[]): Datatype;
}

export interface Factory {
    (uri: string, localname: string): Datatype;
}

interface Whitespace {
    (text: string): string;
}

var Whitespaces = {
    PRESERVE: 'preserve',
    REPLACE: 'replace',
    COLLAPSE: 'collapse',
};

var whitespaces: { [name: string]: Whitespace } = {
    'preserve': text => text,
    'replace': text => text.replace(/\s/g, ' '),
    'collapse': text => text.replace(/^\s+|\s+$/g, '').replace(/\s+/g, ' '),
};

interface Canon {
    (text: string): any;
}

interface Constraint {
    whitespace: Whitespace;
    patterns: RegExp[];
    canon: Canon;
    enumerations: any[];
    facets: Param[];
}

function addParams(constraint: Constraint, params: Param[]): Constraint {
    var res: Constraint = {
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
                // we accept any other parameter at creation time
                // unknown parameter will throw an exception during validation
                res.facets.push(param);
        }
    }

    return res;
}

function checkContraint(text: string, constraint: Constraint): boolean {
    var lexicalSpace = constraint.whitespace(text);
    if (constraint.patterns.length > 0 &&
        constraint.patterns.every(p => !p.test(lexicalSpace))) return false;

    var valueSpace = constraint.canon(lexicalSpace);
    if (constraint.enumerations.length > 0 &&
        constraint.enumerations.every(e => e !== valueSpace)) return false;

    for (var i = 0; i < constraint.facets.length; i++) {
        var facet = constraint.facets[i];
        switch (facet.name) {
            case 'maxInclusive':
                if (valueSpace > constraint.canon(facet.value)) return false;
                break;
            case 'minInclusive':
                if (valueSpace < constraint.canon(facet.value)) return false;
                break;
            case 'minLength':
                if (valueSpace.length < parseInt(facet.value, 10)) return false;
                break;
            default:
                throw new Error('unknow parameter: ' + facet.name);
        }
    }

    return true;
}

var datatypeCount = 1;

class ConstrainedDatatype implements Datatype {
    id: number;
    name = 'derived'; // will be overriden later before publication if need be

    constructor(private constraint: Constraint) {
        this.id = datatypeCount++;
    }

    allows(text: string): boolean {
        return checkContraint(text, this.constraint);
    }

    value(text: string): any {
        return this.constraint.canon(this.constraint.whitespace(text));
    }

    derive(params: Param[]): Datatype {
        var constraint = addParams(this.constraint, params);
        return new ConstrainedDatatype(constraint);
    }

    toString(): string {
        return this.name;
    }
}

function xsdDatatypes(): { [name: string]: Datatype } {
    function typ(whitespace: string, canon: Canon): Datatype {
        return new ConstrainedDatatype({
            whitespace: whitespaces[whitespace],
            patterns: [],
            canon: canon,
            enumerations: [],
            facets: [],
        });
    }

    var id = (text: string) => text;
    var p = (name: string, value: string) => ({ name: name, value: value });
    var tok = (regex: string, canon?: (text: string) => any) =>
        typ(Whitespaces.COLLAPSE, canon || id).derive([p('pattern', regex)]);

    var r_NCName = '[A-Z_a-z][A-Z_a-z0-9.-]*';
    var r_QName = '(' + r_NCName + ':)?' + r_NCName;

    var TODO = typ(Whitespaces.PRESERVE, id);
    var xsInteger = tok('[+-]?(?!$)[0-9]*', t => parseInt(t, 10));

    var types: { [name: string]: Datatype } = {
        'anyURI': TODO,
        'boolean': tok('(0|1|false|true)', t => t === '1' || t === 'true'),
        'date': TODO,
        'dateTime': TODO,
        'decimal': tok('[+-]?(?!$)[0-9]*(\\.[0-9]*)?', parseFloat),
        'double': tok('[+-]?(?!$)[0-9]*(\\.[0-9]*)?', parseFloat), // TODO
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
        'NMTOKEN': tok('[A-Za-z0-9._-]+'), // TODO
        'nonNegativeInteger': xsInteger.derive([p('minInclusive', '0')]),
        'normalizedString': typ(Whitespaces.REPLACE, id),
        'positiveInteger': xsInteger.derive([p('minInclusive', '1')]),
        'QName': tok(r_QName),
        'string': typ(Whitespaces.PRESERVE, id),
        'time': TODO,
        'token': typ(Whitespaces.COLLAPSE, id),
    };

    // override datatype names
    for (var name in types) {
        types[name].name = name;
    }

    return types;
}

export var NS_XSD = 'http://www.w3.org/2001/XMLSchema-datatypes';

export function factory(): Factory {
    var datatypes = xsdDatatypes();

    return function(library: string, datatype: string): Datatype {
        if (library !== '' && library !== NS_XSD) {
            throw new Error('unknown datatype library: ' + library);
        }

        var res = datatypes[datatype];
        if (!res) {
            throw new Error('unknown datatype: ' + datatype + ' in ' + library);
        }

        return res;
    };
}
