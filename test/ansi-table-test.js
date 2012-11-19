var buster = require("buster-node");
var assert = buster.assert;
var refute = buster.refute;
var ansiTable = require("../lib/ansi-table");

function cell(text, options) {
    options.toString = function () {
        return text;
    };

    options.length = text.length;
    return options;
}

buster.testCase("ANSI table", {
    "draws single row": function () {
        var table = ansiTable.draw([["Something"]]);
        assert.equals(table.toString(), "Something\n");
    },

    "draws multiple rows": function () {
        var table = ansiTable.draw([["Something"], ["Something"]]);
        assert.equals(table.toString(), "Something\nSomething\n");
    },

    "draws columns equally wide": function () {
        var table = ansiTable.draw([["Something"], ["Other"]]);
        assert.equals(table.toString(), "Something\nOther    \n");
    },

    "draws mutliple columns equally wide": function () {
        var table = ansiTable.draw([
            ["Something", "In here"],
            ["Other", "There is stuff"]
        ]);
        assert.equals(table.toString(),
                      "SomethingIn here       \n" +
                      "Other    There is stuff\n");
    },

    "draws empty columns": function () {
        var table = ansiTable.draw([["Something", ""]]);
        assert.equals(table.toString(), "Something\n");
    },

    "spaces columns apart": function () {
        var table = ansiTable.draw([
            ["Something", "In here"],
            ["Other", "There is stuff"]
        ], { cellSpacing: 1 });

        assert.equals(table.toString(),
                      "Something In here       \n" +
                      "Other     There is stuff\n");
    },

    "draws table with specified width": function () {
        var table = ansiTable.draw([
            ["Something", "In here"],
            ["Other", "There is stuff"]
        ], { cellSpacing: 1, width: 30 });

        assert.equals(table.toString(),
                      "Something In here             \n" +
                      "Other     There is stuff      \n");
    },

    "expands rightmost column": function () {
        var table = ansiTable.draw([
            ["Something", "In here", "2"],
            ["Other", "There is stuff", "3"]
        ], { cellSpacing: 1, width: 30 });

        assert.equals(table.toString(),
                      "Something In here        2    \n" +
                      "Other     There is stuff 3    \n");
    },

    "draws multi-line cells": function () {
        var table = ansiTable.draw([
            ["Something", "In this cell"],
            ["Other", "There is stuff"]
        ], { cellSpacing: 1, width: 18 });

        assert.equals(table.toString(),
                      "Something In this \n" +
                      "          cell    \n" +
                      "Other     There is\n" +
                      "           stuff  \n");
    },

    "draws column with colspan": function () {
        var table = ansiTable.draw([
            [cell("Long one", { colspan: 2 }), "short"],
            [cell("Very long string", { colspan: 3 })],
            ["Three", "Small", "Cells"]
        ], { cellSpacing: 1 });

        assert.equals(table.toString(),
                      "Long one      short \n" +
                      "Very long string    \n" +
                      "Three  Small  Cells \n");
    },

    "draws column wider than spanned columns to fit": function () {
        var table = ansiTable.draw([
            ["0", cell("1", { colspan: 2 })],
            [cell("Short", { colspan: 3 })],
            ["Three", "Small", "Cells"]
        ], { cellSpacing: 1 });

        assert.equals(table.toString(),
                      "0     1          \n" +
                      "Short            \n" +
                      "Three Small Cells\n");
    },

    "redraws table": function () {
        var table = ansiTable.draw([
            ["A", "B", "C"],
            ["D", "E", "F"]
        ], { cellSpacing: 1 });

        var newTable = table.redraw([
            ["F", "G", "H"],
            ["I", "J", "K"]
        ]);

        assert.equals(newTable.toString(), "\x1b[2AF G H\nI J K\n");
    },

    "signals unchanged table": function () {
        var data = [
            ["A", "B", "C"],
            ["D", "E", "F"]
        ];
        var table = ansiTable.draw(data, { cellSpacing: 1 });
        var newTable = table.redraw(data);

        refute(newTable.changed);
    },

    "redraws multiple times": function () {
        var data = [["A", "B", "C"]];
        var table = ansiTable.draw(data, { cellSpacing: 1 });
        table = table.redraw([["B", "C", "D"]]);
        table = table.redraw([["C", "D", "E"]]);

        assert(table.changed);
        assert.equals(table.toString(), "\x1b[1AC D E\n");
    },

    "redraws over empty table": function () {
        var data = [];
        var table = ansiTable.draw(data, { cellSpacing: 1 });
        table = table.redraw([["A", "B", "C"]]);

        assert(table.changed);
        assert.equals(table.toString(), "\x1b[1AA B C\n");
    },

    "draws incomplete table": function () {
        var data = [["A", "B", "C"], ["D"]];
        var table = ansiTable.draw(data, { cellSpacing: 1 });

        assert.equals(table.toString(), "A B C\nD\n");
    },

    "draws table with effects": function () {
        var data = [["A", "B", "C"], [{
            toString: function () { return "D"; },
            length: 3,
            format: function (str) {
                return str + "!";
            }
        }]];
        var table = ansiTable.draw(data, { cellSpacing: 1 });

        assert.equals(table.toString(), "A   B C\nD! \n");
    }
});
