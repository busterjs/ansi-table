var buster = require("buster-node");
var assert = buster.assert;
var refute = buster.refute;
var ansiMatrix = require("../lib/ansi-matrix");

function cell(text, options) {
    options.toString = function () {
        return text;
    };

    options.length = text.length;
    return options;
}

buster.testCase("ANSI matrix", {
    "draws single row": function () {
        var matrix = ansiMatrix.draw([["Something"]]);
        assert.equals(matrix.toString(), "Something\n");
    },

    "draws multiple rows": function () {
        var matrix = ansiMatrix.draw([["Something"], ["Something"]]);
        assert.equals(matrix.toString(), "Something\nSomething\n");
    },

    "draws columns equally wide": function () {
        var matrix = ansiMatrix.draw([["Something"], ["Other"]]);
        assert.equals(matrix.toString(), "Something\nOther    \n");
    },

    "draws mutliple columns equally wide": function () {
        var matrix = ansiMatrix.draw([
            ["Something", "In here"],
            ["Other", "There is stuff"]
        ]);
        assert.equals(matrix.toString(),
                      "SomethingIn here       \n" +
                      "Other    There is stuff\n");
    },

    "spaces columns apart": function () {
        var matrix = ansiMatrix.draw([
            ["Something", "In here"],
            ["Other", "There is stuff"]
        ], { cellSpacing: 1 });

        assert.equals(matrix.toString(),
                      "Something In here       \n" +
                      "Other     There is stuff\n");
    },

    "draws table with specified width": function () {
        var matrix = ansiMatrix.draw([
            ["Something", "In here"],
            ["Other", "There is stuff"]
        ], { cellSpacing: 1, width: 30 });

        assert.equals(matrix.toString(),
                      "Something In here             \n" +
                      "Other     There is stuff      \n");
    },

    "expands rightmost column": function () {
        var matrix = ansiMatrix.draw([
            ["Something", "In here", "2"],
            ["Other", "There is stuff", "3"]
        ], { cellSpacing: 1, width: 30 });

        assert.equals(matrix.toString(),
                      "Something In here        2    \n" +
                      "Other     There is stuff 3    \n");
    },

    "draws multi-line cells": function () {
        var matrix = ansiMatrix.draw([
            ["Something", "In this cell"],
            ["Other", "There is stuff"]
        ], { cellSpacing: 1, width: 18 });

        assert.equals(matrix.toString(),
                      "Something In this \n" +
                      "          cell    \n" +
                      "Other     There is\n" +
                      "           stuff  \n");
    },

    "draws column with colspan": function () {
        var matrix = ansiMatrix.draw([
            [cell("Long one", { colspan: 2 }), "short"],
            [cell("Very long string", { colspan: 3 })],
            ["Three", "Small", "Cells"]
        ], { cellSpacing: 1 });

        assert.equals(matrix.toString(),
                      "Long one      short \n" +
                      "Very long string    \n" +
                      "Three  Small  Cells \n");
    },

    "draws column wider than spanned columns to fit": function () {
        var matrix = ansiMatrix.draw([
            ["0", cell("1", { colspan: 2 })],
            [cell("Short", { colspan: 3 })],
            ["Three", "Small", "Cells"]
        ], { cellSpacing: 1 });

        assert.equals(matrix.toString(),
                      "0     1     \n" +
                      "Short            \n" +
                      "Three Small Cells\n");
    },

    "redraws matrix": function () {
        var matrix = ansiMatrix.draw([
            ["A", "B", "C"],
            ["D", "E", "F"]
        ], { cellSpacing: 1 });

        var newMatrix = matrix.redraw([
            ["F", "G", "H"],
            ["I", "J", "K"]
        ]);

        assert.equals(newMatrix.toString(), "\x1b[2AF G H\nI J K\n");
    },

    "signals unchanged matrix": function () {
        var data = [
            ["A", "B", "C"],
            ["D", "E", "F"]
        ];
        var matrix = ansiMatrix.draw(data, { cellSpacing: 1 });
        var newMatrix = matrix.redraw(data);

        refute(newMatrix.changed);
    },

    "redraws multiple times": function () {
        var data = [["A", "B", "C"]];
        var matrix = ansiMatrix.draw(data, { cellSpacing: 1 });
        matrix = matrix.redraw([["B", "C", "D"]]);
        matrix = matrix.redraw([["C", "D", "E"]]);

        assert(matrix.changed);
        assert.equals(matrix.toString(), "\x1b[1AC D E\n");
    },

    "redraws over empty matrix": function () {
        var data = [];
        var matrix = ansiMatrix.draw(data, { cellSpacing: 1 });
        matrix = matrix.redraw([["A", "B", "C"]]);

        assert(matrix.changed);
        assert.equals(matrix.toString(), "\x1b[1AA B C\n");
    },

    "draws incomplete matrix": function () {
        var data = [["A", "B", "C"], ["D"]];
        var matrix = ansiMatrix.draw(data, { cellSpacing: 1 });

        var lines = matrix.toString().split("\n");
        assert.equals(matrix.toString(), "A B C\nD\n");
    },

    "draws matrix with effects": function () {
        var data = [["A", "B", "C"], [{
            toString: function () { return "D"; },
            length: 3,
            format: function (str) {
                return str + "!";
            }
        }]];
        var matrix = ansiMatrix.draw(data, { cellSpacing: 1 });

        var lines = matrix.toString().split("\n");
        assert.equals(matrix.toString(), "A   B C\nD! \n");
    }
});
