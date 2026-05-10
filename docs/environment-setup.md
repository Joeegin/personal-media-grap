# Environment Setup

Run these commands yourself before verification.

## Node Dependencies

```bash
npm install
```

## Rust for Tauri

Install Rust with rustup:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Restart the terminal, then verify:

```bash
rustc --version
cargo --version
```

Tauri's SQL plugin requires Rust 1.77.2 or newer.

## Git Identity

Use your GitHub username and either your public GitHub email or GitHub noreply email:

```bash
git config user.name "YOUR_GITHUB_USERNAME"
git config user.email "YOUR_GITHUB_NOREPLY_EMAIL"
```

## GitHub SSH

```bash
ssh-keygen -t ed25519 -C "YOUR_GITHUB_NOREPLY_EMAIL"
cat ~/.ssh/id_ed25519.pub
```

Add the printed public key to GitHub:

`Settings -> SSH and GPG keys -> New SSH key`

## First Verification

```bash
npm run typecheck
npm run test
npm run build
npm run tauri:dev
```
