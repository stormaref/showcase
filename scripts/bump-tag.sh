#!/usr/bin/env bash
set -euo pipefail

bump="${1:-patch}"

latest="$(git tag --sort=-v:refname 2>/dev/null | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | head -1 || true)"
if [[ -z "$latest" ]]; then
  latest="v0.0.0"
fi

version="${latest#v}"
IFS='.' read -r major minor patch <<< "$version"

case "$bump" in
  major)
    major=$((major + 1))
    minor=0
    patch=0
    ;;
  minor)
    minor=$((minor + 1))
    patch=0
    ;;
  patch)
    patch=$((patch + 1))
    ;;
  *)
    echo "Invalid bump type: $bump (expected major, minor, or patch)" >&2
    exit 1
    ;;
esac

new_tag="v${major}.${minor}.${patch}"

echo "Latest tag: ${latest}"
echo "Bump type:  ${bump}"
echo "New tag:    ${new_tag}"

git tag -a "$new_tag" -m "Release ${new_tag}"
git push origin "$new_tag"

echo "Tagged and pushed ${new_tag}"
