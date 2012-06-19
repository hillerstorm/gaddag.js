/*!
 * gaddag.js
 * Copyright(c) 2012 hillerstorm <progr@mmer.nu>
 */
var fs = require('fs');

function str (node) {
    var s, label;

    if (node.$) {
        s = '1';
    } else {
        s = '0';
    }

    for (label in node.edges) {
        if (node.edges.hasOwnProperty(label)) {
            s += '_' + label + '_' + node.edges[label].id;
        }
    }

    return s;
}

module.exports = function () {
    var nextId = 0,
        previousWord = '',
        root = { id: nextId++, edges: {}, $: 0 },
        uncheckedNodes = [],
        minimizedNodes = {};

    function minimize (downTo) {
        var i, tuple,
            childKey, node;

        for (i = uncheckedNodes.length-1; i > downTo-1; i--) {
            tuple = uncheckedNodes.pop();
            childKey = str(tuple.child);
            node = minimizedNodes[childKey];
            if (node) {
                tuple.parent.edges[tuple.letter] = node;
            } else {
                minimizedNodes[childKey] = tuple.child;
            }
        }
    }

    function insert (word) {
        var commonPrefix = 0, i,
            node, slicedWord, nd, ltr;

        for (i = 0; i < Math.min(word.length, previousWord.length); i++) {
            if (word[i] !== previousWord[i]) {
                break;
            }
            commonPrefix += 1;
        }

        minimize(commonPrefix);
        if (uncheckedNodes.length === 0) {
            node = root;
        } else {
            node = uncheckedNodes[uncheckedNodes.length-1].child;
        }

        slicedWord = word.slice(commonPrefix);
        for (i = 0; i < slicedWord.length; i++) {
            nd = { id: nextId++, edges: {}, $: 0 };
            ltr = slicedWord[i].toUpperCase();
            node.edges[ltr] = nd;
            uncheckedNodes.push({
                parent: node,
                letter: ltr,
                child: nd
            });
            node = nd;
        }
        node.$ = 1;
        previousWord = word;
    }

    function finish () {
        minimize(0);
        uncheckedNodes = [];
        minimizedNodes = {};
        previousWord = null;
    }

    // Finds a word, returns 1 if the word was found, 0 otherwise
    this.find = function (word) {
        var node = root,
            i, letter;

        for (i = 0; i < word.length; i++) {
            letter = word[i].toUpperCase();
            if (!node.edges[letter]) {
                return 0;
            }
            node = node.edges[letter];
        }
        return node.$;
    };

    // Returns the subtree matching the letter given
    this.get = function (letter) {
        return root.edges[letter.toUpperCase()];
    };

    // Loads a newline-separated file from disk containing words to use
    this.load = function (dictionary, onCompleted) {
        process.nextTick(function () {
            var words = {
                // TODO: fix a better way of handling huge dictionaries.
                // The only reason it's saved this way is because
                // sorting one letter at a time is quicker...
                a: [], b: [], c: [], d: [],
                e: [], f: [], g: [], h: [],
                i: [], j: [], k: [], l: [],
                m: [], n: [], o: [], p: [],
                q: [], r: [], s: [], t: [],
                u: [], v: [], w: [], x: [],
                y: [], z: [], å: [], ä: [], ö: []
            }, letter;

            nextId = 0;
            previousWord = '';
            root = { id: nextId++, edges: {}, $: 0 };
            uncheckedNodes = [];
            minimizedNodes = {};

            fs.readFileSync(dictionary)
                .toString()
                .split('\r\n')
                .forEach(function (word) {
                    var i, idx;

                    words[word[0]].push(word);
                    word += '_';
                    for (i = 2; i < word.length; i++) {
                        idx = word.indexOf('_') + 1;
                        word = word.slice(1, idx) + word[0] + word.slice(idx);
                        words[word[0]].push(word);
                    }
                });

            for (letter in words) {
                if (words.hasOwnProperty(letter)) {
                    words[letter].sort();
                    words[letter].forEach(insert);
                }
            }
            finish();
            if (onCompleted) {
                onCompleted();
            }
        });
    };
};