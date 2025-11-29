# {{display_name}}

{{description}}

## Prerequisites

- [Rust](https://rustup.rs/)
- [Trunk](https://trunkrs.dev/) - `cargo install trunk`
- wasm32 target - `rustup target add wasm32-unknown-unknown`

## Getting Started

Start the development server:

```bash
trunk serve
```

This compiles the Rust code to WebAssembly and serves it with hot reloading.

## Building

```bash
trunk build --release
```

Output goes to `dist/` and is ready for deployment.

## Project Structure

```
├── src/
│   └── lib.rs        # Game entry point
├── index.html        # HTML entry
└── Cargo.toml        # Rust dependencies
```

## WebAssembly Bindings

This template uses `wasm-bindgen` and `web-sys` for DOM interaction:

```rust
use wasm_bindgen::prelude::*;
use web_sys::window;

#[wasm_bindgen(start)]
pub fn main() {
    let document = window().unwrap().document().unwrap();
    let body = document.body().unwrap();
    body.set_inner_html("<h1>Hello!</h1>");
}
```

## Deployment

First, create a new repository on GitHub:

1. Go to [github.com/new](https://github.com/new)
2. Create a new repository (can be public or private)
3. **Don't** initialize it with a README, .gitignore, or license

Then connect your local project and push:

```bash
git remote add origin git@github.com:YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

The included GitHub Actions workflow will automatically deploy to RCade.
