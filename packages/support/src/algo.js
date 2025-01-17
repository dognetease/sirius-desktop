/* eslint-disable */
const data = {};
const charSeq = '';
const func = function (type, gen) {
  // console.log('new conf finished ',data);
  if (!data['stage'] || !data['host']) {
    throw new Error('config file not work ');
  }
  if (data['stage'] && !data['stage'].startsWith('local') && typeof window !== 'undefined' && window.location !== undefined) {
    // let href = window.location.href;
    // if (href.indexOf(data['host']) < 0 && !href.startsWith('sirius://sirius.page') && !href.endsWith(data['bkPage']) && !href.endsWith('about.html')) {
    //   throw new Error('not proper environment to run:' + href + ' ' + data['host'] + ' ' + data['stage']);
    // }
  }
  gen = gen || 'getSetValuesFromMap';
  if (gen === 'genRandomKey') {
    const generateKey = function (len) {
      let result = '';
      const charactersLength = charSeq.length;
      for (let i = 0; i < len; i++) {
        result += charSeq.charAt(Math.floor(Math.random() * charactersLength));
      }
      return result;
    };
    const s = generateKey(parseInt(type, 16));
    return s;
  }
  if (gen === 'getSetValuesFromMap') {
    const datum = data[type];
    if (typeof datum === 'undefined') {
      console.trace('get value', type);
      throw new Error(type + ' key props not found , rebuild support package ,please -- 关键值未找到，请重新构建 support package: ***' + type + '***');
    }
    // if (typeof datum === 'string' && datum === 'edm_prod') {
    //   return 'prod';
    // }
    return datum;
  }
  if (gen.startsWith('putValuesTo')) {
    gen = gen.replace(/^putValuesTo/, '');
    if (!(gen in data)) {
      data[gen] = type;
      return 'content setted';
    }
    return 'key already exist';
  }
  if (gen === 'encryptRSA') {
    if (!this.__proto__.b) {
      this.__proto__.b = (function () {
        let dbits;
        const canary = 0xdeadbeefcafe;
        const j_lm = (canary & 0xffffff) == 0xefcafe;

        function BigInteger(a, b, c) {
          if (a != null) {
            if (typeof a === 'number') {
              this.fromNumber(a, b, c);
            } else if (b == null && typeof a !== 'string') {
              this.fromString(a, 256);
            } else {
              this.fromString(a, b);
            }
          }
        }

        function nbi() {
          return new BigInteger(null);
        }

        function am1(i, x, w, j, c, n) {
          while (--n >= 0) {
            const v = x * this[i++] + w[j] + c;
            c = Math.floor(v / 0x4000000);
            w[j++] = v & 0x3ffffff;
          }
          return c;
        }

        function am2(i, x, w, j, c, n) {
          const xl = x & 0x7fff;
          const xh = x >> 15;
          while (--n >= 0) {
            let l = this[i] & 0x7fff;
            const h = this[i++] >> 15;
            const m = xh * l + h * xl;
            l = xl * l + ((m & 0x7fff) << 15) + w[j] + (c & 0x3fffffff);
            c = (l >>> 30) + (m >>> 15) + xh * h + (c >>> 30);
            w[j++] = l & 0x3fffffff;
          }
          return c;
        }

        function am3(i, x, w, j, c, n) {
          const xl = x & 0x3fff;
          const xh = x >> 14;
          while (--n >= 0) {
            let l = this[i] & 0x3fff;
            const h = this[i++] >> 14;
            const m = xh * l + h * xl;
            l = xl * l + ((m & 0x3fff) << 14) + w[j] + c;
            c = (l >> 28) + (m >> 14) + xh * h;
            w[j++] = l & 0xfffffff;
          }
          return c;
        }

        if (j_lm && typeof navigator !== 'undefined' && navigator.appName === 'Microsoft Internet Explorer') {
          BigInteger.prototype.am = am2;
          dbits = 30;
        } else if (j_lm && typeof navigator !== 'undefined' && navigator.appName != 'Netscape') {
          BigInteger.prototype.am = am1;
          dbits = 26;
        } else {
          BigInteger.prototype.am = am3;
          dbits = 28;
        }

        BigInteger.prototype.DB = dbits;
        BigInteger.prototype.DM = (1 << dbits) - 1;
        BigInteger.prototype.DV = 1 << dbits;

        const BI_FP = 52;
        BigInteger.prototype.FV = Math.pow(2, BI_FP);
        BigInteger.prototype.F1 = BI_FP - dbits;
        BigInteger.prototype.F2 = 2 * dbits - BI_FP;

        const BI_RM = '0123456789abcdefghijklmnopqrstuvwxyz';
        const BI_RC = new Array();
        let rr;
        let vv;
        rr = '0'.charCodeAt(0);
        for (vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
        rr = 'a'.charCodeAt(0);
        for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
        rr = 'A'.charCodeAt(0);
        for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

        function int2char(n) {
          return BI_RM.charAt(n);
        }

        function intAt(s, i) {
          const c = BI_RC[s.charCodeAt(i)];
          return c == null ? -1 : c;
        }

        function bnpCopyTo(r) {
          for (let i = this.t - 1; i >= 0; --i) r[i] = this[i];
          r.t = this.t;
          r.s = this.s;
        }

        function bnpFromInt(x) {
          this.t = 1;
          this.s = x < 0 ? -1 : 0;
          if (x > 0) {
            this[0] = x;
          } else if (x < -1) {
            this[0] = x + DV;
          } else {
            this.t = 0;
          }
        }

        function nbv(i) {
          const r = nbi();
          r.fromInt(i);
          return r;
        }

        function bnpFromString(s, b) {
          let k;
          if (b == 16) {
            k = 4;
          } else if (b == 8) {
            k = 3;
          } else if (b == 256) {
            k = 8;
          } else if (b == 2) {
            k = 1;
          } else if (b == 32) {
            k = 5;
          } else if (b == 4) {
            k = 2;
          } else {
            this.fromRadix(s, b);
            return;
          }
          this.t = 0;
          this.s = 0;
          let i = s.length;
          let mi = false;
          let sh = 0;
          while (--i >= 0) {
            const x = k == 8 ? s[i] & 0xff : intAt(s, i);
            if (x < 0) {
              if (s.charAt(i) == '-') mi = true;
              continue;
            }
            mi = false;
            if (sh == 0) {
              this[this.t++] = x;
            } else if (sh + k > this.DB) {
              this[this.t - 1] |= (x & ((1 << (this.DB - sh)) - 1)) << sh;
              this[this.t++] = x >> (this.DB - sh);
            } else {
              this[this.t - 1] |= x << sh;
            }
            sh += k;
            if (sh >= this.DB) sh -= this.DB;
          }
          if (k == 8 && (s[0] & 0x80) != 0) {
            this.s = -1;
            if (sh > 0) this[this.t - 1] |= ((1 << (this.DB - sh)) - 1) << sh;
          }
          this.clamp();
          if (mi) BigInteger.ZERO.subTo(this, this);
        }

        function bnpClamp() {
          const c = this.s & this.DM;
          while (this.t > 0 && this[this.t - 1] == c) --this.t;
        }

        function bnToString(b) {
          if (this.s < 0) {
            return '-' + this.negate().toString(b);
          }
          let k;
          if (b == 16) {
            k = 4;
          } else if (b == 8) {
            k = 3;
          } else if (b == 2) {
            k = 1;
          } else if (b == 32) {
            k = 5;
          } else if (b == 4) {
            k = 2;
          } else {
            return this.toRadix(b);
          }
          const km = (1 << k) - 1;
          let d;
          let m = false;
          let r = '';
          let i = this.t;
          let p = this.DB - ((i * this.DB) % k);
          if (i-- > 0) {
            if (p < this.DB && (d = this[i] >> p) > 0) {
              m = true;
              r = int2char(d);
            }
            while (i >= 0) {
              if (p < k) {
                d = (this[i] & ((1 << p) - 1)) << (k - p);
                d |= this[--i] >> (p += this.DB - k);
              } else {
                d = (this[i] >> (p -= k)) & km;
                if (p <= 0) {
                  p += this.DB;
                  --i;
                }
              }
              if (d > 0) m = true;
              if (m) r += int2char(d);
            }
          }
          return m ? r : '0';
        }

        function bnNegate() {
          const r = nbi();
          BigInteger.ZERO.subTo(this, r);
          return r;
        }

        function bnAbs() {
          return this.s < 0 ? this.negate() : this;
        }

        function bnCompareTo(a) {
          let r = this.s - a.s;
          if (r != 0) return r;
          let i = this.t;
          r = i - a.t;
          if (r != 0) return this.s < 0 ? -r : r;
          while (--i >= 0) if ((r = this[i] - a[i]) != 0) return r;
          return 0;
        }

        function nbits(x) {
          let r = 1;
          let t;
          if ((t = x >>> 16) != 0) {
            x = t;
            r += 16;
          }
          if ((t = x >> 8) != 0) {
            x = t;
            r += 8;
          }
          if ((t = x >> 4) != 0) {
            x = t;
            r += 4;
          }
          if ((t = x >> 2) != 0) {
            x = t;
            r += 2;
          }
          if ((t = x >> 1) != 0) {
            x = t;
            r += 1;
          }
          return r;
        }

        function bnBitLength() {
          if (this.t <= 0) return 0;
          return this.DB * (this.t - 1) + nbits(this[this.t - 1] ^ (this.s & this.DM));
        }

        function bnpDLShiftTo(n, r) {
          let i;
          for (i = this.t - 1; i >= 0; --i) r[i + n] = this[i];
          for (i = n - 1; i >= 0; --i) r[i] = 0;
          r.t = this.t + n;
          r.s = this.s;
        }

        function bnpDRShiftTo(n, r) {
          for (let i = n; i < this.t; ++i) r[i - n] = this[i];
          r.t = Math.max(this.t - n, 0);
          r.s = this.s;
        }

        function bnpLShiftTo(n, r) {
          const bs = n % this.DB;
          const cbs = this.DB - bs;
          const bm = (1 << cbs) - 1;
          const ds = Math.floor(n / this.DB);
          let c = (this.s << bs) & this.DM;
          let i;
          for (i = this.t - 1; i >= 0; --i) {
            r[i + ds + 1] = (this[i] >> cbs) | c;
            c = (this[i] & bm) << bs;
          }
          for (i = ds - 1; i >= 0; --i) r[i] = 0;
          r[ds] = c;
          r.t = this.t + ds + 1;
          r.s = this.s;
          r.clamp();
        }

        function bnpRShiftTo(n, r) {
          r.s = this.s;
          const ds = Math.floor(n / this.DB);
          if (ds >= this.t) {
            r.t = 0;
            return;
          }
          const bs = n % this.DB;
          const cbs = this.DB - bs;
          const bm = (1 << bs) - 1;
          r[0] = this[ds] >> bs;
          for (let i = ds + 1; i < this.t; ++i) {
            r[i - ds - 1] |= (this[i] & bm) << cbs;
            r[i - ds] = this[i] >> bs;
          }
          if (bs > 0) r[this.t - ds - 1] |= (this.s & bm) << cbs;
          r.t = this.t - ds;
          r.clamp();
        }

        function bnpSubTo(a, r) {
          let i = 0;
          let c = 0;
          const m = Math.min(a.t, this.t);
          while (i < m) {
            c += this[i] - a[i];
            r[i++] = c & this.DM;
            c >>= this.DB;
          }
          if (a.t < this.t) {
            c -= a.s;
            while (i < this.t) {
              c += this[i];
              r[i++] = c & this.DM;
              c >>= this.DB;
            }
            c += this.s;
          } else {
            c += this.s;
            while (i < a.t) {
              c -= a[i];
              r[i++] = c & this.DM;
              c >>= this.DB;
            }
            c -= a.s;
          }
          r.s = c < 0 ? -1 : 0;
          if (c < -1) {
            r[i++] = this.DV + c;
          } else if (c > 0) r[i++] = c;
          r.t = i;
          r.clamp();
        }

        function bnpMultiplyTo(a, r) {
          const x = this.abs();
          const y = a.abs();
          let i = x.t;
          r.t = i + y.t;
          while (--i >= 0) r[i] = 0;
          for (i = 0; i < y.t; ++i) r[i + x.t] = x.am(0, y[i], r, i, 0, x.t);
          r.s = 0;
          r.clamp();
          if (this.s != a.s) BigInteger.ZERO.subTo(r, r);
        }

        function bnpSquareTo(r) {
          const x = this.abs();
          let i = (r.t = 2 * x.t);
          while (--i >= 0) r[i] = 0;
          for (i = 0; i < x.t - 1; ++i) {
            const c = x.am(i, x[i], r, 2 * i, 0, 1);
            if ((r[i + x.t] += x.am(i + 1, 2 * x[i], r, 2 * i + 1, c, x.t - i - 1)) >= x.DV) {
              r[i + x.t] -= x.DV;
              r[i + x.t + 1] = 1;
            }
          }
          if (r.t > 0) r[r.t - 1] += x.am(i, x[i], r, 2 * i, 0, 1);
          r.s = 0;
          r.clamp();
        }

        function bnpDivRemTo(m, q, r) {
          const pm = m.abs();
          if (pm.t <= 0) return;
          const pt = this.abs();
          if (pt.t < pm.t) {
            if (q != null) q.fromInt(0);
            if (r != null) this.copyTo(r);
            return;
          }
          if (r == null) r = nbi();
          const y = nbi();
          const ts = this.s;
          const ms = m.s;
          const nsh = this.DB - nbits(pm[pm.t - 1]);
          if (nsh > 0) {
            pm.lShiftTo(nsh, y);
            pt.lShiftTo(nsh, r);
          } else {
            pm.copyTo(y);
            pt.copyTo(r);
          }
          const ys = y.t;
          const y0 = y[ys - 1];
          if (y0 == 0) return;
          const yt = y0 * (1 << this.F1) + (ys > 1 ? y[ys - 2] >> this.F2 : 0);
          const d1 = this.FV / yt;
          const d2 = (1 << this.F1) / yt;
          const e = 1 << this.F2;
          let i = r.t;
          let j = i - ys;
          const t = q == null ? nbi() : q;
          y.dlShiftTo(j, t);
          if (r.compareTo(t) >= 0) {
            r[r.t++] = 1;
            r.subTo(t, r);
          }
          BigInteger.ONE.dlShiftTo(ys, t);
          t.subTo(y, y);
          while (y.t < ys) y[y.t++] = 0;
          while (--j >= 0) {
            let qd = r[--i] == y0 ? this.DM : Math.floor(r[i] * d1 + (r[i - 1] + e) * d2);
            if ((r[i] += y.am(0, qd, r, j, 0, ys)) < qd) {
              y.dlShiftTo(j, t);
              r.subTo(t, r);
              while (r[i] < --qd) r.subTo(t, r);
            }
          }
          if (q != null) {
            r.drShiftTo(ys, q);
            if (ts != ms) BigInteger.ZERO.subTo(q, q);
          }
          r.t = ys;
          r.clamp();
          if (nsh > 0) r.rShiftTo(nsh, r);
          if (ts < 0) BigInteger.ZERO.subTo(r, r);
        }

        function bnMod(a) {
          const r = nbi();
          this.abs().divRemTo(a, null, r);
          if (this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r, r);
          return r;
        }

        function Classic(m) {
          this.m = m;
        }

        function cConvert(x) {
          if (x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
          return x;
        }

        function cRevert(x) {
          return x;
        }

        function cReduce(x) {
          x.divRemTo(this.m, null, x);
        }

        function cMulTo(x, y, r) {
          x.multiplyTo(y, r);
          this.reduce(r);
        }

        function cSqrTo(x, r) {
          x.squareTo(r);
          this.reduce(r);
        }

        Classic.prototype.convert = cConvert;
        Classic.prototype.revert = cRevert;
        Classic.prototype.reduce = cReduce;
        Classic.prototype.mulTo = cMulTo;
        Classic.prototype.sqrTo = cSqrTo;

        function bnpInvDigit() {
          if (this.t < 1) return 0;
          const x = this[0];
          if ((x & 1) == 0) return 0;
          let y = x & 3;
          y = (y * (2 - (x & 0xf) * y)) & 0xf;
          y = (y * (2 - (x & 0xff) * y)) & 0xff;
          y = (y * (2 - (((x & 0xffff) * y) & 0xffff))) & 0xffff;

          y = (y * (2 - ((x * y) % this.DV))) % this.DV;

          return y > 0 ? this.DV - y : -y;
        }

        function Montgomery(m) {
          this.m = m;
          this.mp = m.invDigit();
          this.mpl = this.mp & 0x7fff;
          this.mph = this.mp >> 15;
          this.um = (1 << (m.DB - 15)) - 1;
          this.mt2 = 2 * m.t;
        }

        function montConvert(x) {
          const r = nbi();
          x.abs().dlShiftTo(this.m.t, r);
          r.divRemTo(this.m, null, r);
          if (x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r, r);
          return r;
        }

        function montRevert(x) {
          const r = nbi();
          x.copyTo(r);
          this.reduce(r);
          return r;
        }

        function montReduce(x) {
          while (x.t <= this.mt2) x[x.t++] = 0;
          for (let i = 0; i < this.m.t; ++i) {
            let j = x[i] & 0x7fff;
            const u0 = (j * this.mpl + (((j * this.mph + (x[i] >> 15) * this.mpl) & this.um) << 15)) & x.DM;

            j = i + this.m.t;
            x[j] += this.m.am(0, u0, x, i, 0, this.m.t);

            while (x[j] >= x.DV) {
              x[j] -= x.DV;
              x[++j]++;
            }
          }
          x.clamp();
          x.drShiftTo(this.m.t, x);
          if (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
        }

        function montSqrTo(x, r) {
          x.squareTo(r);
          this.reduce(r);
        }

        function montMulTo(x, y, r) {
          x.multiplyTo(y, r);
          this.reduce(r);
        }

        Montgomery.prototype.convert = montConvert;
        Montgomery.prototype.revert = montRevert;
        Montgomery.prototype.reduce = montReduce;
        Montgomery.prototype.mulTo = montMulTo;
        Montgomery.prototype.sqrTo = montSqrTo;

        function bnpIsEven() {
          return (this.t > 0 ? this[0] & 1 : this.s) == 0;
        }

        function bnpExp(e, z) {
          if (e > 0xffffffff || e < 1) return BigInteger.ONE;
          let r = nbi();
          let r2 = nbi();
          const g = z.convert(this);
          let i = nbits(e) - 1;
          g.copyTo(r);
          while (--i >= 0) {
            z.sqrTo(r, r2);
            if ((e & (1 << i)) > 0) {
              z.mulTo(r2, g, r);
            } else {
              const t = r;
              r = r2;
              r2 = t;
            }
          }
          return z.revert(r);
        }

        function bnModPowInt(e, m) {
          let z;
          if (e < 256 || m.isEven()) z = new Classic(m);
          else z = new Montgomery(m);
          return this.exp(e, z);
        }

        BigInteger.prototype.copyTo = bnpCopyTo;
        BigInteger.prototype.fromInt = bnpFromInt;
        BigInteger.prototype.fromString = bnpFromString;
        BigInteger.prototype.clamp = bnpClamp;
        BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
        BigInteger.prototype.drShiftTo = bnpDRShiftTo;
        BigInteger.prototype.lShiftTo = bnpLShiftTo;
        BigInteger.prototype.rShiftTo = bnpRShiftTo;
        BigInteger.prototype.subTo = bnpSubTo;
        BigInteger.prototype.multiplyTo = bnpMultiplyTo;
        BigInteger.prototype.squareTo = bnpSquareTo;
        BigInteger.prototype.divRemTo = bnpDivRemTo;
        BigInteger.prototype.invDigit = bnpInvDigit;
        BigInteger.prototype.isEven = bnpIsEven;
        BigInteger.prototype.exp = bnpExp;

        BigInteger.prototype.toString = bnToString;
        BigInteger.prototype.negate = bnNegate;
        BigInteger.prototype.abs = bnAbs;
        BigInteger.prototype.compareTo = bnCompareTo;
        BigInteger.prototype.bitLength = bnBitLength;
        BigInteger.prototype.mod = bnMod;
        BigInteger.prototype.modPowInt = bnModPowInt;

        BigInteger.ZERO = nbv(0);
        BigInteger.ONE = nbv(1);

        function Arcfour() {
          this.i = 0;
          this.j = 0;
          this.S = new Array();
        }

        function ARC4init(key) {
          let i;
          let j;
          let t;
          for (i = 0; i < 256; ++i) this.S[i] = i;
          j = 0;
          for (i = 0; i < 256; ++i) {
            j = (j + this.S[i] + key[i % key.length]) & 255;
            t = this.S[i];
            this.S[i] = this.S[j];
            this.S[j] = t;
          }
          this.i = 0;
          this.j = 0;
        }

        function ARC4next() {
          let t;
          this.i = (this.i + 1) & 255;
          this.j = (this.j + this.S[this.i]) & 255;
          t = this.S[this.i];
          this.S[this.i] = this.S[this.j];
          this.S[this.j] = t;
          return this.S[(t + this.S[this.i]) & 255];
        }

        Arcfour.prototype.init = ARC4init;
        Arcfour.prototype.next = ARC4next;

        function prng_newstate() {
          return new Arcfour();
        }

        const rng_psize = 256;

        let rng_state;
        let rng_pool;
        let rng_pptr;

        function rng_seed_int(x) {
          rng_pool[rng_pptr++] ^= x & 255;
          rng_pool[rng_pptr++] ^= (x >> 8) & 255;
          rng_pool[rng_pptr++] ^= (x >> 16) & 255;
          rng_pool[rng_pptr++] ^= (x >> 24) & 255;
          if (rng_pptr >= rng_psize) rng_pptr -= rng_psize;
        }

        function rng_seed_time() {
          rng_seed_int(new Date().getTime());
        }

        if (rng_pool == null) {
          rng_pool = new Array();
          rng_pptr = 0;
          let t;
          if (typeof navigator !== 'undefined' && navigator.appName === 'Netscape' && navigator.appVersion < 5 && window.crypto) {
            const z = window.crypto.random(32);
            for (t = 0; t < z.length; ++t) rng_pool[rng_pptr++] = z.charCodeAt(t) & 255;
          }
          while (rng_pptr < rng_psize) {
            t = Math.floor(65536 * Math.random());
            rng_pool[rng_pptr++] = t >>> 8;
            rng_pool[rng_pptr++] = t & 255;
          }
          rng_pptr = 0;
          rng_seed_time();
        }

        function rng_get_byte() {
          if (rng_state == null) {
            rng_seed_time();

            rng_state = prng_newstate();
            rng_state.init(rng_pool);
            for (rng_pptr = 0; rng_pptr < rng_pool.length; ++rng_pptr) rng_pool[rng_pptr] = 0;
            rng_pptr = 0;
          }

          return rng_state.next();
        }

        function rng_get_bytes(ba) {
          let i;
          for (i = 0; i < ba.length; ++i) ba[i] = rng_get_byte();
        }

        function SecureRandom() {}

        SecureRandom.prototype.nextBytes = rng_get_bytes;

        function parseBigInt(str, r) {
          return new BigInteger(str, r);
        }

        function linebrk(s, n) {
          let ret = '';
          let i = 0;
          while (i + n < s.length) {
            ret += s.substring(i, i + n) + '';
            i += n;
          }
          return ret + s.substring(i, s.length);
        }

        function byte2Hex(b) {
          if (b < 0x10) return '0' + b.toString(16);
          return b.toString(16);
        }

        function pkcs1pad2(s, n) {
          if (n < s.length + 11) {
            console.log('Message too long for RSA');
            return null;
          }
          const ba = new Array();
          let i = s.length - 1;
          while (i >= 0 && n > 0) {
            const c = s.charCodeAt(i--);
            if (c < 128) {
              ba[--n] = c;
            } else if (c > 127 && c < 2048) {
              ba[--n] = (c & 63) | 128;
              ba[--n] = (c >> 6) | 192;
            } else {
              ba[--n] = (c & 63) | 128;
              ba[--n] = ((c >> 6) & 63) | 128;
              ba[--n] = (c >> 12) | 224;
            }
          }
          ba[--n] = 0;
          const rng = new SecureRandom();
          const x = new Array();
          while (n > 2) {
            x[0] = 0;
            while (x[0] == 0) rng.nextBytes(x);
            ba[--n] = x[0];
          }
          ba[--n] = 2;
          ba[--n] = 0;
          return new BigInteger(ba);
        }

        function RSAKey() {
          this.n = null;
          this.e = 0;
          this.d = null;
          this.p = null;
          this.q = null;
          this.dmp1 = null;
          this.dmq1 = null;
          this.coeff = null;
        }

        function RSASetPublic(N, E) {
          if (N != null && E != null && N.length > 0 && E.length > 0) {
            this.n = parseBigInt(N, 16);
            this.e = parseInt(E, 16);
          } else {
            console.log('Invalid RSA public key');
          }
        }

        function RSADoPublic(x) {
          return x.modPowInt(this.e, this.n);
        }

        function RSAEncrypt(text) {
          const m = pkcs1pad2(text, (this.n.bitLength() + 7) >> 3);
          if (m == null) return null;
          const c = this.doPublic(m);
          if (c == null) return null;
          const h = c.toString(16);
          if ((h.length & 1) == 0) return h;
          return '0' + h;
        }

        RSAKey.prototype.doPublic = RSADoPublic;

        RSAKey.prototype.setPublic = RSASetPublic;
        RSAKey.prototype.encrypt = RSAEncrypt;

        return function (m, e, rand, con) {
          const rsa = new RSAKey();
          rsa.setPublic(m, e);
          return rsa.encrypt(con + '#' + rand);
        };
      })();
    }
    return this.__proto__.b;
  }
  return 'no content of this case';
};
export default func.toString();
