function repeat(str, times) {
    return new Array(Math.max(times || 0, 0) + 1).join(str);
}

function leftAlign(str, width) {
    return str + repeat(" ", width - str.length);
}

function sum(numbers) {
    return numbers.reduce(function (s, n) { return s + n; });
}

function up(num) {
    if (num === 0) { return ""; }
    return "\x1b[" + num + "A";
}

function left(num) {
    if (num === 0) { return ""; }
    return "\x1b[" + num + "D";
}

function IDENTITY(s) {
    return s;
}

function rowMapper(widths, i) {
    return function (cell, n) {
        return {
            content: String(cell).substr(i * widths[n], widths[n]),
            format: cell.format || IDENTITY
        };
    };
}

// Given a row and the calculated column widths, break cells that
// are too wide up into multi-line cells.
//
// Example:
// reflowCellContent(["Some long string", "Here"], [5, 5])
// =>
//    [["Some ", "Here"], ["long ", ""], ["string", ""]]
function reflowCellContent(row, widths) {
    var i, rows, lineCount = Math.max.apply(Math, row.map(function (cell, i) {
        return (cell.length / widths[i]);
    }));

    for (i = 0, rows = []; i < lineCount; ++i) {
        rows.push(row.map(rowMapper(widths, i)));
    }

    return rows;
}

function drawRow(row, widths, options) {
    var rows = reflowCellContent(row, widths);
    var separator = repeat(" ", options.cellSpacing);
    return rows.map(function (r, y) {
        return r.map(function (cell, x) {
            return leftAlign(cell.format(cell.content), widths[x]);
        }).join(separator) + "\n";
    }).join("");
}

function splitCell(cell) {
    var i, cells = [], str = cell.toString();
    for (i = 0; i < cell.colspan; ++i) {
        cells.push({ length: Math.ceil(str.length / cell.colspan) });
    }
    return cells;
}

function splitSpanningCells(data) {
    return data.map(function (row) {
        return row.reduce(function (splitRow, cell) {
            if (cell.colspan) {
                splitRow = splitRow.concat(splitCell(cell));
            } else {
                splitRow.push(cell);
            }
            return splitRow;
        }, []);
    });
}

function calculateWidths(data) {
    return data.reduce(function (widths, row) {
        var w, i, l = row.length;
        for (i = 0; i < l; ++i) {
            widths[i] = Math.max(widths[i] || 0, (row[i] || "").length);
        }
        return widths;
    }, []);
}

// Adjust the cell widths to either expand or shrink so the total
// width of all the cells sum up to the total table width.
function adjustWidthsForTotalWidth(widths, options) {
    if (!options.width) { return widths; }
    var total = sum(widths);
    var spacing = options.cellSpacing * (widths.length - 1);
    var remaining = options.width - spacing - total;
    widths[widths.length - 1] += options.width - spacing - total;
    return widths;
}

function adjustWidthsForSpans(widths, data, options) {
    return data.reduce(function (newWidths, row) {
        var width, i, j, l = row.length, rowWidths = [];

        for (i = 0; i < l; ++i) {
            width = widths[i];
            for (j = 1; j < (row[i].colspan || 0); ++j) {
                width += widths[i + j] + (options.cellSpacing || 0);
            }
            rowWidths.push(width);
        }

        newWidths.push(rowWidths);
        return newWidths;
    }, []);
}

function calculateColumnWidths(data, options) {
    return adjustWidthsForSpans(
        adjustWidthsForTotalWidth(
            calculateWidths(splitSpanningCells(data)),
            options
        ),
        data,
        options
    );
}

function Table(rendered, options) {
    this.options = options || {};
    this.offset = options.offset || [0, 0];
    this.changed = options.changed;
    this.length = rendered.length;
    this.raw = rendered;
}

function draw(data, options) {
    if (data.length === 0) { return new Table("\n", options); }
    options = Object.create(options || {});
    options.cellSpacing = options.cellSpacing || 0;
    options.widths = calculateColumnWidths(data, options);

    return new Table(data.reduce(function (str, row, i) {
        var widths = options.widths;
        widths = Array.isArray(widths[i]) ? widths[i] : widths;
        return str + drawRow(row, widths, options);
    }, ""), options);
}

Table.prototype = {
    toString: function () {
        return up(this.offset[1]) + left(this.offset[0]) + this.raw;
    },

    redraw: function (data) {
        var newTable = draw(data, this.options).raw;
        var options = Object.create(this.options);
        options.changed = this.raw !== newTable;
        var lines = this.raw.split("\n");
        options.offset = [
            lines[lines.length - 1].length,
            Math.max(1, lines.length - 1)
        ];
        return new Table(newTable, options);
    }
};

module.exports.draw = draw;
