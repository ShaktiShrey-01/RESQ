If a secret (like `.env`) was committed, follow these steps to remove it from the repo and rotate credentials.

1) Prevent future commits

```bash
# add .env to .gitignore and remove the file from the index
git rm --cached .env
git commit -m "chore: remove .env from repo and add to .gitignore"
```

2) Purge the secret from history (recommended: install git-filter-repo)

```bash
# install (if not installed): pip install git-filter-repo
# run from the repository root
git fetch --all
git checkout --orphan temp-clean
git commit --allow-empty -m "start clean history"
git branch -D main
# Recreate a clean history using git-filter-repo
# Example to remove the file path 'server/.env'
git-filter-repo --path server/.env --invert-paths
# Or with BFG (alternative)
# bfg --delete-files .env
```

See the `git-filter-repo` or `BFG Repo-Cleaner` docs for full instructions and backups.

3) Rotate all exposed secrets

- Create new database users / passwords in your cloud provider (Atlas, etc.).
- Revoke the compromised credentials immediately.
- Update `.env` locally with new secrets and *do not* commit.

4) Push cleaned history (force) to remote

```bash
# after confirming local repo is cleaned
git push --force origin main
```

5) Inform team and update any deployed environments with rotated secrets.
