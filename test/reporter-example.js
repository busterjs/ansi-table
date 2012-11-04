var am = require("../lib/ansi-table");
var data = [];
var environments = ["Firefox", "Chrome", "Internet Explorer",
                    "Safari", "Node 0.8"];
var events = [".", ".", ".", ".", ".", ".", ".", ".", "E",
              "F", "T"]; // More passed than failed

var testCount = parseInt(process.argv[2] || 80, 10);
var options = { cellSpacing: 1 };

if (process.argv[3]) {
    options.width = parseInt(process.argv[3], 10);
}

var table = am.draw(data, options);
process.stdout.write(table.toString());

function draw(data) {
    table = table.redraw(data);
    process.stdout.write(table.toString());
}

var colors = {
    ".": "\x1b[1m\x1b[32m",
    "E": "\x1b[1m\x1b[33m",
    "F": "\x1b[1m\x1b[31m",
    "T": "\x1b[1m\x1b[31m"
};

function addEnvironment() {
    if (environments.length === 0) { return; }

    data.push([environments.shift(), {
        content: "",

        get length() {
            return this.content.length;
        },

        toString: function () {
            return this.content;
        },

        format: function (str) {
            return str.replace(/./g, function (c) {
                return colors[c] + c + "\x1b[0m";
            });
        }
    }]);

    addEvent();
}

var completedEnvs = 0;

function addEvent() {
    function addEnvEvent(env) {
        if (env[1].length === testCount) {
            completedEnvs += 1;
            if (completedEnvs === environments.length) {
                process.stdout.write("\x1b[?25h");
            }
            return;
        }
        env[1].content += events[Math.floor(Math.random() * events.length)];        
        draw(data);
        setTimeout(addEvent, Math.random() * 50);
    }

    data.forEach(function (env) {
        setTimeout(function () {
            addEnvEvent(env);
        }, Math.random() * 10);
    });
}

process.stdout.write("\x1b[?25l");

environments.forEach(function () {
    setTimeout(addEnvironment, Math.random() * 1000);
});

process.on("SIGINT", function () {
    process.stdout.write("\x1b[?25h");
    process.exit(0);
});
