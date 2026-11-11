# @orderly.network/orderly (vendored)

Generated from [OrderlyNetwork/cli](https://github.com/OrderlyNetwork/cli)
`bindings/js`. Do not edit by hand.

The WebAssembly core is the CLI's Rust signing and request layer, compiled with
`wasm-bindgen`. The transport is host `fetch`; the signer interface keeps key
material outside the SDK.

Regenerate:

```bash
cd ../cli/bindings/js
pnpm build
cd ../../showcase
node scripts/sync-orderly-sdk.mjs
```
