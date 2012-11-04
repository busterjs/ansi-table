var am = require("../lib/ansi-table");

var characters = ("abcdefghijklmnopqrstuvwxyz0123456789" +
                  "ABCDEFGHIJKLMNOPQRSTUVWXYZ").split("");
var colors = [31, 32, 33];
var data = [];
var width = parseInt(process.argv[2] || 3, 10);
var height = parseInt(process.argv[3] || 3, 10);
var timeout = parseInt(process.argv[4] || 100, 10);
var row;
var table = am.draw([], { cellSpacing: 1 });

function rand(col) {
    return col[Math.floor(Math.random() * col.length)];
}

function print() {
    process.stdout.write(table.toString());
}

print();

function addRandomCharacter(r, c) {
    var color = rand(colors);

    row.push({
        length: 1,
        toString: function () {
            return c;
        },
        format: function (s) {
            return "\x1b[" + color + "m" + s + "\x1b[0m";
        }
    });
}

function addData() {
    if (!row || row.length === width) {
        if (data.length === height) {
            process.stdout.write("\x1b[?25h");
            return;
        }

        row = [];
        data.push(row);
    }

    addRandomCharacter(row, rand(characters));
    table = table.redraw(data);
    print();
    setTimeout(addData, timeout);
}

process.stdout.write("\x1b[?25l");
addData();

process.on("SIGINT", function () {
    process.stdout.write("\x1b[?25h");
    process.exit(0);
});

setTimeout(function () {
    data.unshift([{
        colspan: width,
        length: 26,
        toString: function () {
            return "Oh my isn't this something";
        }
    }]);
}, width * height * timeout / 2);
