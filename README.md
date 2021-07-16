## kstream

Packaging DataView  [api](./dist/kstream.d.ts)

## install
```
$ npm i ajanuw-kstream
```

## nodejs
```
const ks = kstream.create('xx.sav');
```

## browser
```
<script src="./dist/kstream.js"></script>
<script>
    const { kstream } = window.kstream;
    const ks = kstream.create(new Uint8Array([1, 2, 3, 4]));
</script>
```

## test
> $ npm t

## build
> $ npm run build