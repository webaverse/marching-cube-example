import * as THREE from 'three';
const _v21 = new THREE.Vector2();
const _v31 = new THREE.Vector3();
export default class Perlin {
    static perm = [
        151, 160, 137, 91, 90, 15,
        131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23,
        190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
        88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71, 134, 139, 48, 27, 166,
        77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
        102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196,
        135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123,
        5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42,
        223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
        129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
        251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107,
        49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254,
        138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
        151
    ]
    static Noisen1(x) {
        var X = Math.floor(x) & 0xff;
        x -= Math.floor(x);
        var u = Perlin.Fade(x);
        return Perlin.Lerp(u, Perlin.Gradn1(Perlin.perm[X], x), Perlin.Gradn1(Perlin.perm[X + 1], x - 1)) * 2;
    }
    static Noisen2(x, y) {
        var X = Math.floor(x) & 0xff;
        var Y = Math.floor(y) & 0xff;
        x -= Math.floor(x);
        y -= Math.floor(y);
        var u = Perlin.Fade(x);
        var v = Perlin.Fade(y);
        var A = (Perlin.perm[X] + Y) & 0xff;
        var B = (Perlin.perm[X + 1] + Y) & 0xff;
        return Perlin.Lerp(v, Perlin.Lerp(u, Perlin.Gradn2(Perlin.perm[A], x, y), Perlin.Gradn2(Perlin.perm[B], x - 1, y)), Perlin.Lerp(u, Perlin.Gradn2(Perlin.perm[A + 1], x, y - 1), Perlin.Gradn2(Perlin.perm[B + 1], x - 1, y - 1)));
    }
    static Noisev2(coord) {
        return Perlin.Noisen2(coord.x, coord.y);
    }
    static Noisen3(x, y, z) {
        var X = Math.floor(x) & 0xff;
        var Y = Math.floor(y) & 0xff;
        var Z = Math.floor(z) & 0xff;
        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);
        var u = Perlin.Fade(x);
        var v = Perlin.Fade(y);
        var w = Perlin.Fade(z);
        var A = (Perlin.perm[X] + Y) & 0xff;
        var B = (Perlin.perm[X + 1] + Y) & 0xff;
        var AA = (Perlin.perm[A] + Z) & 0xff;
        var BA = (Perlin.perm[B] + Z) & 0xff;
        var AB = (Perlin.perm[A + 1] + Z) & 0xff;
        var BB = (Perlin.perm[B + 1] + Z) & 0xff;
        return Perlin.Lerp(w, Perlin.Lerp(v, Perlin.Lerp(u, Perlin.Gradn3(Perlin.perm[AA], x, y, z), Perlin.Gradn3(Perlin.perm[BA], x - 1, y, z)), Perlin.Lerp(u, Perlin.Gradn3(Perlin.perm[AB], x, y - 1, z), Perlin.Gradn3(Perlin.perm[BB], x - 1, y - 1, z))), Perlin.Lerp(v, Perlin.Lerp(u, Perlin.Gradn3(Perlin.perm[AA + 1], x, y, z - 1), Perlin.Gradn3(Perlin.perm[BA + 1], x - 1, y, z - 1)), Perlin.Lerp(u, Perlin.Gradn3(Perlin.perm[AB + 1], x, y - 1, z - 1), Perlin.Gradn3(Perlin.perm[BB + 1], x - 1, y - 1, z - 1))));
    }
    static Noisev3(coord) {
        return Perlin.Noisen3(coord.x, coord.y, coord.z);
    }
    static Fbmn1(x, octave) {
        var f = 0.0;
        var w = 0.5;
        for (var i = 0; i < octave; i++) {
            f += w * Perlin.Noisen1(x);
            x *= 2.0;
            w *= 0.5;
        }
        return f;
    }
    static Fbmv2(coord, octave) {
        var f = 0.0;
        var w = 0.5;
        _v21.copy(coord);
        for (var i = 0; i < octave; i++) {
            f += w * Perlin.Noisev2(coord);
            _v21.multiplyScalar(2.0);
            w *= 0.5;
        }
        return f;
    }
    static Fbmn2(x, y, octave) {
        return Perlin.Fbmv2(new THREE.Vector2(x, y), octave);
    }
    static Fbmv3(coord, octave) {
        var f = 0.0;
        var w = 0.5;
        _v31.copy(coord);
        for (var i = 0; i < octave; i++) {
            f += w * Perlin.Noisev3(_v31);
            _v31.multiplyScalar(2.0);
            w *= 0.5;
        }
        return f;
    }
    static Fbm3n(x, y, z, octave) {
        return Perlin.Fbmv3(new THREE.Vector3(x, y, z), octave);
    }
    static Fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    static Lerp(t, a, b) {
        return a + t * (b - a);
    }
    static Gradn1(hash, x) {
        return (hash & 1) == 0 ? x : -x;
    }
    static Gradn2(hash, x, y) {
        return ((hash & 1) == 0 ? x : -x) + ((hash & 2) == 0 ? y : -y);
    }
    static Gradn3(hash, x, y, z) {
        var h = hash & 15;
        var u = h < 8 ? x : y;
        var v = h < 4 ? y : (h == 12 || h == 14 ? x : z);
        return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
    }

}  