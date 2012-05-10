/*!
 * gaddag.js
 * Copyright(c) 2012 phete <progr@mmer.nu>
 */

module.exports.Gaddag = function () {
    var nextId = 0,
        previousWord = '',
        root = { id: nextId++, edges: {}, $: 0 },
        uncheckedNodes = [],
        minimizedNodes = {};

    function str(node) {
        var s, label;
        if (node.$) {
            s = '1';
        } else {
            s = '0';
        }

        for (label in node.edges) {
            s += '_' + label + '_' + node.edges[label].id;
        }

        return s;
    }

    function minimize(downTo) {
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

    function insert(word) {
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

    function finish() {
        minimize(0);
        uncheckedNodes = [];
        minimizedNodes = {};
        previousWord = null;
    }

    this.find = function (word) {
        var node = root,
            i, letter;
        for (i = 0; i < word.length; i++) {
            letter = word[i].toUpperCase();
            if (!node.edges[letter]) {
                return false;
            }
            node = node.edges[letter];
        }
        return node.$;
    };

    this.get = function (chr) {
        return root.edges[chr.toUpperCase()];
    };

    this.load = function (dictionary, onCompleted) {
        process.nextTick(function () {
            nextId = 0;
            previousWord = '';
            root = { id: nextId++, edges: {}, $: 0 };
            uncheckedNodes = [];
            minimizedNodes = {};
            require('fs').readFileSync(dictionary)
                .toString()
                .split('\r\n')
                .forEach(insert);
            finish();
            if (onCompleted) {
                onCompleted();
            }
        });
    };
};