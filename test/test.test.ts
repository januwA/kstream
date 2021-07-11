import { kstream } from "../src";
import { sbytes as b, sbytes2 as b2, sview } from "struct-buffer";

describe("test kstream", () => {
  it("test kstream", () => {
    const v = b(
      "47 56 41 53 02 00 00 00 02 02 00 00 04 00 12 00 00 00 00 00 00 00 13 00 00 00 2B 2B 55 45 34 2B 52 65 6C 65 61 73 65 2D 34 2E 31 38 00"
    );
    const ks = kstream.create(v);

    expect(ks.u8).toBe(0x47);
    expect(ks.pos).toBe(1);

    expect(ks.pi8()).toBe(0x56);
    expect(ks.pi8(1)).toBe(0x41);
    expect(ks.pi32(3)).toBe(2);
    expect(ks.pos).toBe(1);

    ks.pos = 4;
    expect(ks.i32).toBe(2);

    ks.i8 = 3;
    expect(ks.pi8(-1)).toBe(3);
  });

  it("test kstream read readString", () => {
    const v = b2("ab\\x00c\\x00");
    const ks = kstream.create(v);

    expect(ks.readString(4)).toBe("ab");
    expect(ks.offset).toBe(4);

    ks.back(); // ks.pos -= 4

    expect(ks.readString()).toBe("ab");
    expect(ks.readString()).toBe("c");
    expect(ks.pos).toBe(5);

    // pack string
    ks.pos = 0;
    expect(ks.pstring()).toBe("ab");
    expect(ks.pstring(4)).toBe("ab");
    expect(ks.pos).toBe(0);
  });

  it("test kstream offset", () => {
    const v = b("01 02 03 04 05");
    const ks = kstream.create(v);

    expect(ks.i16).toBe(0x0201);
    expect(ks.offset).toBe(2);

    ks.pos = 0;
    expect(ks.offset).toBe(-2);
    ks.back();

    expect(ks.pos).toBe(2);
    expect(ks.offset).toBe(2);
  });

  it("test kstream writeString", () => {
    const v = b2("abcd\\x00");
    const ks = kstream.create(v);
    ks.writeString("xyz");
    ks.back();
    expect(ks.pstring()).toBe("xyzd");
  });

  it("test kstream copy", () => {
    const v = b("01 02 03 04 05");
    const ks = kstream.create(v);
    const u8a = ks.copy(4);
    expect(sview(u8a)).toBe("01 02 03 04");
    expect(ks.pos).toBe(0);
    expect(ks.offset).toBe(0);
  });

  it("test kstream cmp", () => {
    const b1 = b("01 02 03 04 05");
    const ks = kstream.create(b1);
    expect(ks.cmp(b("01 02 03 04 05"), b1.byteLength)).toBeTruthy();
    expect(ks.cmp(b("01 02 03 04 06"), b1.byteLength)).toBeFalsy();
  });

  it("test kstream icmp", () => {
    const b1 = b2("abc");
    const ks = kstream.create(b1);

    expect(ks.icmp(b2("abc"), b1.byteLength)).toBeTruthy();
    expect(ks.icmp(b2("aBC"), b1.byteLength)).toBeTruthy();
    expect(ks.icmp(b2("aBd"), b1.byteLength)).toBeFalsy();
  });

  it("test kstream set", () => {
    const b1 = b2("abc");
    const ks = kstream.create(b1);
    ks.set(0, b1.byteLength);

    expect(sview(ks.v)).toBe("00 00 00");
    expect(ks.offset).toBe(3);
    expect(ks.pos).toBe(3);
  });

  it("test kstream insert", () => {
    const b1 = b("01 02 03 04");
    const ks = kstream.create(b1);

    ks.pos = 1;
    ks.insert(b("09 09"));
    expect(sview(ks.v)).toBe("01 09 09 02 03 04");
    expect(ks.pos).toBe(3);
    expect(ks.offset).toBe(2);
  });
});
