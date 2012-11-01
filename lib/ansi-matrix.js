function repeat(str, times) {
    return new Array(Math.max(times || 0, 0) + 1).join(str);
}

function leftAlign(str, width) {
    return str + repeat(" ", width - str.length);
}

function sum(numbers) {
    return numbers.reduce(function (s, n) { return s + n; });
}

// Given a row and the calculated column widths, break cells that
// are too wide up into multi-line cells.
//
// Example:
// reflowCellContent(["Some long string", "Here"], [5, 5])
// =>
//    [["Some ", "Here"], ["long ", ""], ["string", ""]]
function reflowCellContent(row, widths) {
    var lineCount = Math.max.apply(Math, row.map(function (cell, i) {
        return (cell.length / widths[i]);
    }));

    for (var i = 0, rows = []; i < lineCount; ++i) {
        rows.push(row.map(function (cell, n) {
            return {
                content: String(cell).substr(i * widths[n], widths[n]),
                format: cell.format || function (s) { return s; }
            };
        }));
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

// Figures out:
//   1. Does the matrix contain colspans
//   2. What are the approximate required widths of each cell?
//
// Why "approximate" width? If there are colspans in the table, we will
// split the spanning cell's width over the number of cells it spans.
//
// Example:
// getColumnStats([
//   ["First col", "Second col"],
//   [{ toString: function () {
//          return "Here's a really long line for ya";
//      }, length: 32, colspan: 2 }]
// ]);
// 
// =>
// { containsSpans: true,
//   widths: [16, 16] }
//
function getColumnStats(data) {
    var stats = { containsSpans: false };
    var columnCount = data[0].reduce(function (count, c) {
        return count + (c.colspan || 1);
    }, 0);

    stats.widths = data.reduce(function (widths, row) {
        // TODO: This sucks. Find a better way
        var rowLengths = widths.slice(), len;

        for (var i = 0; i < columnCount; ++i) {
            if (!row[i]) { continue; }

            if (row[i].colspan) {
                len = Math.ceil(row[i].length / row[i].colspan);
                for (var j = 0; j < row[i].colspan; ++j) {
                    rowLengths[i + j] = Math.max(widths[i + j] || 0, len);
                }
            } else {
                rowLengths[i] = Math.max(widths[i] || 0, row[i].length);
            }

            stats.containsSpans = stats.containsSpans || !!(row[i] && row[i].colspan);
        }
        return rowLengths;
    }, []);

    return stats;
}

// Re-calculates widths to account for colspans.
// Given the approximate widths previously calculated, this function
// sets the desired width for colspanned cells to be the exact width
// of cells it spans, plus any cell spacing it spans over.
function adjustForSpans(widths, data, options) {
    return data.map(function (row, y) {
        return row.map(function (col, x) {
            if (col.colspan) {
                var spacing = options.cellSpacing * (col.colspan - 1);
                return sum(widths.slice(x, col.colspan)) + spacing;
            }
            return widths[x];
        }, []);
    }, []);
}

// Adjust the cell widths to either expand or shrink so the total
// width of all the cells sum up to the total matrix width.
function adjustWidthsForTotalWidth(widths, options) {
    var total = sum(widths);
    var spacing = options.cellSpacing * (widths.length - 1);
    var remaining = options.width - spacing - total;
    widths[widths.length - 1] += options.width - spacing - total;
    return widths;
}

function calculateColumnWidths(data, options) {
    var stats = getColumnStats(data);
    if (options.width) {
        stats.widths = adjustWidthsForTotalWidth(stats.widths, options);
    }
    if (stats.containsSpans) {
        stats.widths = adjustForSpans(stats.widths, data, options);
    }
    return stats.widths;
}

function up(num) {
    if (num === 0) { return ""; }
    return "\x1b[" + num + "A";
}

function left(num) {
    if (num === 0) { return ""; }
    return "\x1b[" + num + "D";
}

function matrix(rendered, options) {
    return {
        length: rendered.length,

        toString: function () {
            return rendered;
        },

        redraw: function (data) {
            var lines = rendered.split("\n");
            var newMatrix = draw(data, options).toString();
            var m = matrix(up(Math.max(1, lines.length - 1)) +
                           left(lines[lines.length - 1].length) +
                           newMatrix, options);
            m.changed = rendered !== newMatrix;
            return m;
        }
    };
}

function draw(data, options) {
    if (data.length === 0) { return matrix("\n", options); }
    options = Object.create(options || {});
    options.cellSpacing = options.cellSpacing || 0;
    options.widths = calculateColumnWidths(data, options);

    return matrix(data.reduce(function (str, row, i) {
        var widths = options.widths;
        widths = Array.isArray(widths[i]) ? widths[i] : widths;
        return str + drawRow(row, widths, options);
    }, ""), options);
};

module.exports.draw = draw;
