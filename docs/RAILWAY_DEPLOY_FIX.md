# Railway deploy fix

This package is cleaned for Railway deployment.

## What was fixed
- Removed `node_modules` from the project package.
- Removed local Manus debug logs and build/cache artifacts.
- Added `.dockerignore` so `node_modules` and generated files cannot enter the Railway Docker build context.
- Kept `package.json` and `pnpm-lock.yaml` intact so Railway can install dependencies itself.

## Important if the old GitHub repository already contains `node_modules`
`.gitignore` does not remove files that were already committed. If Railway still reports an error involving `/app/node_modules/typescript`, remove the tracked `node_modules` directory from the GitHub repository and commit that deletion, then redeploy.

Do **not** upload a local `node_modules` folder to GitHub.
