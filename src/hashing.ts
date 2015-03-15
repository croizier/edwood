// 52-bit block cipher
export function mixn(n: number): number {
    // Ideally, this should be a crytographic cipher,
    // so that an attacker cannot weaken it with a forged schema.
    // This algorithm is inspired by the following SO entries. 
    // http://stackoverflow.com/a/19274574/3478605
    // http://stackoverflow.com/a/12996028/3478605
    // We split the 52-bit integer in two halves,
    // shuffle them into "random" 32-bit integers,
    // and add them into a 52-bit integer by shifting one by 19 bits. 
    var phi = 40507; // prime closest to the 16-bit golden ratio

    /* tslint:disable:no-bitwise */
    var lo = n & 0x3ffffff; // lowest 26 bits
    var hi = (n - lo) / 0x4000000; // highest 26 bits

    var x = lo | 0;
    x = ((((x >> 16) ^ x) | 0) * phi) | 0;
    x = ((((x >> 16) ^ x) | 0) * phi) | 0;

    var y = hi | 0;
    y = ((((y >> 16) ^ y) | 0) * phi) | 0;
    y = ((((y >> 16) ^ y) | 0) * phi) | 0;
    /* tslint:enable:no-bitwise */

    return x * 0x80000 + y;
}

export function mix(a: number, b: number): number {
    /* tslint:disable:no-bitwise */
    return mixn(a) * 0x80000 + mixn(b);
    /* tslint:enable:no-bitwise */
}

export function mixs(text: string): number {
    var res = 0;
    var len = text.length;
    for (var i = 0; i < len; i++) res = mix(res, text.charCodeAt(i));
    return res;
}

export interface Hashed { hash: number }

export function mixa<T extends Hashed>(seed: number, arr: T[]): number {
    var res = seed;
    for (var i = 0; i < arr.length; i++) res = mix(res, arr[i].hash);
    return res;
}

export function insert<T extends Hashed>(item: T, a: T[]): void {
    var i = 0;
    while (i < a.length && a[i].hash < item.hash) i += 1;
    if (i >= a.length || a[i] !== item) a.splice(i, 0, item);
}

export function merge<T extends Hashed>(a: T[], b: T[]): T[] {
    var res = a.concat(b);
    var i = 0, j = 0, k = 0;
    while (i < a.length && j < b.length) {
        var diff = a[i].hash - b[j].hash;

        if (diff < 0) {
            res[k++] = a[i++];
        } else if (diff > 0) {
            res[k++] = b[j++];
        } else {
            res[k++] = a[i]; i++; j++;
        }
    }

    if (i === a.length) {
        while (j < b.length) res[k++] = b[j++];
    } else {
        while (i < a.length) res[k++] = a[i++];
    }

    return res.slice(0, k);
}
