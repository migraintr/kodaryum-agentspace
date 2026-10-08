#!/bin/bash
# Kodaryum AgentSpace - tek tikla baslat (macOS: cift tikla, Linux: ./baslat.command)
REPO=https://github.com/migraintr/kodaryum-agentspace.git
BRANCH=claude/clever-babbage-99hw5i
HERE="$(cd "$(dirname "$0")" && pwd)"
DIR="$HERE/kodaryum-agentspace"
[ -f "$HERE/package.json" ] && DIR="$HERE"

command -v git >/dev/null || { echo "Git bulunamadı."; read -p "Enter..."; exit 1; }
command -v npm >/dev/null || { echo "Node.js bulunamadı (https://nodejs.org)."; read -p "Enter..."; exit 1; }

[ -f "$DIR/package.json" ] || git clone "$REPO" "$DIR" || exit 1
cd "$DIR" || exit 1
git fetch origin "$BRANCH" && git checkout "$BRANCH" && git pull origin "$BRANCH"
npm install || exit 1

( sleep 4; (open http://localhost:5173 || xdg-open http://localhost:5173) >/dev/null 2>&1 ) &
npm run dev
