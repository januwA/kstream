import * as fs from "fs";

type int8 = number;
type uint8 = number;

type int16 = number;
type uint16 = number;

type int32 = number;
type uint32 = number;

type int64 = bigint;
type uint64 = bigint;

type float = number;
type double = number;

export class kstream {
  /**
   * Text decoder, you can reset
   */
  public textDecoder = new TextDecoder();

  /**
   * Text encoder, you can reset
   */
  public textEncoder = new TextEncoder();

  /**
   * How many bytes were moved last time pos
   */
  public offset = 0;

  // 在api内部永远使用 this.pos_ 而不是 this.pos
  get pos(): number {
    return this.pos_;
  }
  // 记录 ks.pos += -= 等赋值偏移
  set pos(value: number) {
    this.offset = value - this.pos_; // 记录偏移值
    this.pos_ = value;
  }

  private constructor(
    public v: DataView,

    /**
     * Current reading position
     */
    private pos_ = 0,

    /**
     * Default little endian
     */
    public littleEndian = true
  ) {}

  /**
   * `kstream.create('x.sav')`
   * @param filepath
   */
  static create(
    filepath: string,
    pos?: number,
    littleEndian?: boolean
  ): kstream;

  static create(nodeBuf: Buffer, pos?: number, littleEndian?: boolean): kstream;

  static create(
    uint8arr: Uint8Array,
    pos?: number,
    littleEndian?: boolean
  ): kstream;

  static create(v: DataView, pos?: number, littleEndian?: boolean): kstream;

  static create(v: any, pos = 0, littleEndian = true): kstream {
    let _v: DataView | undefined;

    if (typeof v === "string") {
      const buf: Buffer = fs.readFileSync(v as string);
      const uint8arr = new Uint8Array(buf.byteLength);
      buf.copy(uint8arr, 0, 0, buf.byteLength);
      _v = new DataView(uint8arr.buffer);
    } else if (v instanceof Buffer) {
      const uint8arr = new Uint8Array(v.byteLength);
      v.copy(uint8arr, 0, 0, v.byteLength);
      _v = new DataView(uint8arr.buffer);
    } else if (v instanceof Uint8Array) {
      _v = new DataView(v.buffer);
    } else if (v instanceof DataView) {
      _v = v;
    } else {
      throw "Unknown args[0]";
    }

    return new kstream(_v, pos, littleEndian);
  }

  private _pos(size: number = 1): number {
    const p = this.pos_;
    this.pos_ += size;
    this.offset = size;
    return p;
  }

  /**
   * Go back to the previous position
   */
  back() {
    this.pos -= this.offset; // 回去的同时，记录偏移
  }

  eof(): boolean {
    return this.pos_ >= this.v.byteLength;
  }

  /* ============================== read and set ===================================== */
  get i8(): int8 {
    return this.v.getInt8(this._pos());
  }
  set i8(value: int8) {
    this.v.setInt8(this._pos(), value);
  }

  get u8(): uint8 {
    return this.v.getUint8(this._pos());
  }
  set u8(value: uint8) {
    this.v.setUint8(this._pos(), value);
  }

  get i16(): int16 {
    return this.v.getInt16(this._pos(2), this.littleEndian);
  }
  set i16(value: int16) {
    this.v.setInt16(this._pos(2), value, this.littleEndian);
  }

  get u16(): uint16 {
    return this.v.getUint16(this._pos(2), this.littleEndian);
  }
  set u16(value: uint16) {
    this.v.setUint16(this._pos(2), value, this.littleEndian);
  }

  get i32(): int32 {
    return this.v.getInt32(this._pos(4), this.littleEndian);
  }
  set i32(value: int32) {
    this.v.setInt32(this._pos(4), value, this.littleEndian);
  }

  get u32(): uint32 {
    return this.v.getUint32(this._pos(4), this.littleEndian);
  }
  set u32(value: uint32) {
    this.v.setUint32(this._pos(4), value, this.littleEndian);
  }

  get i64(): int64 {
    return this.v.getBigInt64(this._pos(8), this.littleEndian);
  }
  set i64(value: int64) {
    this.v.setBigInt64(this._pos(8), value, this.littleEndian);
  }

  get u64(): uint64 {
    return this.v.getBigUint64(this._pos(8), this.littleEndian);
  }
  set u64(value: uint64) {
    this.v.setBigUint64(this._pos(8), value, this.littleEndian);
  }

  get float(): float {
    return this.v.getFloat32(this._pos(4), this.littleEndian);
  }
  set float(value: float) {
    this.v.setFloat32(this._pos(4), value, this.littleEndian);
  }

  get double(): double {
    return this.v.getFloat64(this._pos(8), this.littleEndian);
  }
  set double(value: double) {
    this.v.setFloat64(this._pos(8), value, this.littleEndian);
  }

  /**
   * Read the string, you can specify the length of the string, the default -1 reads the string ending with null, but does not contain null
   * @param len
   * @returns
   */
  readString(len: number = -1): string {
    if (len === 0) return "";

    const bytes = [];
    let b: uint8;
    if (len === -1) {
      let offset = 1;
      while ((b = this.u8)) {
        bytes.push(b);
        offset++;
      }
      this.offset = offset;
    } else {
      this.offset = len;

      while (len--) {
        b = this.v.getUint8(this.pos_++);

        // 虽然指定的固定长度，但是读到null还是直接返回
        if (b === 0) {
          this.pos_ += len; // 加上剩下的len
          break;
        }
        bytes.push(b);
      }
    }
    return this.textDecoder.decode(new Uint8Array(bytes));
  }

  /**
   * Write all str starting from pos
   * @param str
   */
  writeString(str: string) {
    const u8a = this.textEncoder.encode(str);
    for (const i of u8a) this.u8 = i;
    this.offset = u8a.byteLength;
  }

  /**
   * Copy bytes
   *
   * Won't change pos
   * @param count How many bytes need to be copied
   */
  copy(count: number): Uint8Array {
    const dst = new Uint8Array(new ArrayBuffer(count));
    for (let i = 0; i < count; dst[i] = this.pu8(i++));

    return dst;
  }

  /**
   * This will change the v reference and is very time consuming
   * @param bytes
   */
  insert(bytes: Uint8Array): void;
  insert(bytes: DataView): void;
  insert(bytes: any): void {
    const newview = new DataView(
      new ArrayBuffer(this.v.byteLength + bytes.byteLength)
    );

    let _bytes = bytes;

    if (bytes instanceof DataView) {
      _bytes = new Uint8Array(bytes.buffer);
    }

    let i = 0;
    const oldPos = this.pos_;
    for (; i < this.pos_; i++) {
      newview.setUint8(i, this.v.getUint8(i));
    }

    for (let j = 0; j < _bytes.byteLength; j++, i++) {
      newview.setUint8(i, _bytes[j]);
    }

    for (; i < newview.byteLength; i++) {
      newview.setUint8(i, this.u8);
    }

    this.v = newview;
    this.pos_ = oldPos + _bytes.byteLength;
    this.offset = _bytes.byteLength;
  }

  /**
   * memset
   * @param c
   * @param count
   */
  set(c: uint8, count: number) {
    for (let i = 0; i < count; i++) {
      this.u8 = c;
    }
    this.offset = count;
  }

  /**
   * Compare bytes
   *
   * Won't change pos
   *
   * @param buf2 The buffer to compare
   *
   * @param count The number of bytes to compare
   *
   * @param buf2Offset offset of buf2, default 0
   */
  cmp(buf2: Uint8Array, count: number, buf2Offset?: number): boolean;
  cmp(buf2: DataView, count: number, buf2Offset?: number): boolean;
  cmp(buf2: any, count: number, buf2Offset = 0): boolean {
    let view = buf2;
    if (buf2 instanceof Uint8Array) {
      view = new DataView(buf2);
    }

    for (let i = 0; i < count; i++) {
      if (this.pu8(i) !== view.getUint8(buf2Offset + i)) return false;
    }
    return true;
  }

  /**
   * Same as cmp, but ignoring case
   *
   * @param buf2
   * @param count
   * @param buf2Offset
   * @returns
   */
  icmp(buf2: Uint8Array, count: number, buf2Offset?: number): boolean;
  icmp(buf2: DataView, count: number, buf2Offset?: number): boolean;
  icmp(buf2: any, count: number, buf2Offset = 0): boolean {
    let view = buf2;
    if (buf2 instanceof Uint8Array) {
      view = new DataView(buf2);
    }

    const x = 0x20;
    for (let i = 0; i < count; i++) {
      const b1 = this.pu8(i);
      const b2 = view.getUint8(buf2Offset + i);
      if (b1 !== b2 && b1 + x !== b2 && b2 + x !== b1) return false;
    }
    return true;
  }

  /* ============================== peek ===================================== */
  pi8(offset: number = 0): int8 {
    return this.v.getInt8(this.pos_ + offset);
  }
  pu8(offset: number = 0): uint8 {
    return this.v.getUint8(this.pos_ + offset);
  }

  pi16(offset: number = 0): int16 {
    return this.v.getInt16(this.pos_ + offset, this.littleEndian);
  }
  pu16(offset: number = 0) {
    this.v.getUint16(this.pos_ + offset, this.littleEndian);
  }

  pi32(offset: number = 0): int32 {
    return this.v.getInt32(this.pos_ + offset, this.littleEndian);
  }
  pu32(offset: number = 0): uint32 {
    return this.v.getUint32(this.pos_ + offset, this.littleEndian);
  }

  pi64(offset: number = 0): int64 {
    return this.v.getBigInt64(this.pos_ + offset, this.littleEndian);
  }
  pu64(offset: number = 0): uint64 {
    return this.v.getBigUint64(this.pos_ + offset, this.littleEndian);
  }
  pstring(len = -1): string {
    const s = this.readString(len);
    this.back();
    return s;
  }
}
