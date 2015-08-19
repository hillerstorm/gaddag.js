'use strict';

import fs from 'fs';

class Node {
  constructor(id = 0) {
    this.id = id;
    this.edges = {};
    this.$ = 0;
  }
}

// Loads a newline-separated file from disk containing words to use
export default class Gaddag {
  constructor (dictionary, onCompleted) {
    this._root = new Node();

    this._nextId = 1;
    this._previousWord = '';
    this._uncheckedNodes = [];
    this._minimizedNodes = {};

    fs.readFile(dictionary, (err, data) => this._onDictionaryRead(err, data, onCompleted));
  }

  // Finds a word, returns 1 if the word was found, 0 otherwise
  find (word) {
    let node = this._root;

    for (let i = 0; i < word.length; i++) {
      const letter = word[i].toUpperCase();
      if (!node.edges[letter]) {
        return 0;
      }
      node = node.edges[letter];
    }

    return node.$;
  }

  // Returns the subtree matching the letter given
  get (letter) {
    return this._root.edges[letter.toUpperCase()];
  }

  _str (node) {
    let s = node.$ ? '1' : '0';

    const keys = Object.keys(node.edges);
    for (let i = 0; i < keys.length; i++) {
      s += `_${node.edges[keys[i]]}_${node.edges[keys[i]].id}`;
    }

    return s;
  }

  _minimize (downTo) {
    for (let i = this._uncheckedNodes.length-1; i > downTo-1; i--) {
      const tuple = this._uncheckedNodes.pop();
      const childKey = this._str(tuple.child);
      const node = this._minimizedNodes[childKey];
      if (node) {
        tuple.parent.edges[tuple.letter] = node;
      } else {
        this._minimizedNodes[childKey] = tuple.child;
      }
    }
  }

  _insert (word) {
    let commonPrefix = 0;
    const minWordLength = Math.min(word.length, this._previousWord.length);

    for (let i = 0; i < minWordLength; i++) {
      if (word[i] !== this._previousWord[i]) {
        break;
      }
      commonPrefix += 1;
    }

    this._minimize(commonPrefix);
    var node;
    if (this._uncheckedNodes.length === 0) {
      node = this._root;
    } else {
      node = this._uncheckedNodes[this._uncheckedNodes.length-1].child;
    }

    const slicedWord = word.slice(commonPrefix);
    for (let i = 0; i < slicedWord.length; i++) {
      const nd = new Node(this._nextId);
      this._nextId += 1;
      const ltr = slicedWord[i].toUpperCase();
      node.edges[ltr] = nd;
      this._uncheckedNodes.push({
        parent: node,
        letter: ltr,
        child: nd
      });
      node = nd;
    }
    node.$ = 1;
    this._previousWord = word;
  }

  _finish () {
    this._minimize(0);
    this._uncheckedNodes = null;
    this._minimizedNodes = null;
    this._previousWord = null;
    this._nextId = null;
  }

  _onDictionaryRead (err, data, cb) {
    if (!err) {
      try {
        const words = {
          // TODO: fix a better way of handling huge dictionaries.
          // The only reason it's saved this way is because
          // sorting one letter at a time is quicker...
          a: [], b: [], c: [], d: [],
          e: [], f: [], g: [], h: [],
          i: [], j: [], k: [], l: [],
          m: [], n: [], o: [], p: [],
          q: [], r: [], s: [], t: [],
          u: [], v: [], w: [], x: [],
          y: [], z: [], å: [], ä: [], ö: [], ø: [], æ: []
        };

        const mapWord = (line) => {
          return (letter, index, arr) =>
            words[letter].push(
              index === 0
              ? line
              : line.slice(index, line.length) + '_' + arr.slice(0, index).reverse().join(''));
        };

        const lines = data.toString().split('\r\n');
        for (let i = 0; i < lines.length; i++) {
          lines[i].split('').map(mapWord(lines[i]));
        }

        const keys = Object.keys(words);
        for (let i = 0; i < keys.length; i++) {
          const sorted = words[keys[i]].sort();
          for (let j = 0; j < sorted.length; j++) {
            this._insert(sorted[j]);
          }
        }
        this._finish();
      } catch (e) {
        err = e;
      }
    }

    if (cb) {
      cb(err);
    } else if (err) {
      throw err;
    }
  }
}
