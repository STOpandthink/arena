export const SUITS = Object.freeze({
    BLANK: 0,
    WHITE: 1,
    BLACK: 2,
    TEAL: 3,
    PURPLE: 4,
})

export const ACTIONS = Object.freeze({
    DEFEND: 0,
    ATTACK: 1,
})

export const HAND_TYPES = Object.freeze({
    HIGH: 1,
    FLUSH: 2,
    PAIR: 3,
    SET: 4,
});

export const SYMBOLS = Object.freeze({
    DAGGER: 15,
    SWORD: 1,
    AXE: 2,
    SPEAR: 3,
    BOMB: 4,
    HELMET: 5,
    SHIELD: 6,
    ARMOR: 7,
    CLOAK: 18,
    COIN: 8,
    BANNER: 9,
    RING: 10,
    CANDLE: 11,
    RUNE: 12,
    PRAYER: 13,
    JOKER: 14,
    ROYALTY: 16,
    MAGIC: 17,
    BERSERK: 19,
    NINJA: 20,
    MAX: 21,
})

// Warn if overriding existing method
if (Array.prototype.equals)
    console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;
    // if the argument is the same array, we can be sure the contents are same as well
    if (array === this)
        return true;
    // compare lengths - can save a lot of time 
    if (this.length != array.length)
        return false;

    for (var i = 0, l = this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", { enumerable: false });