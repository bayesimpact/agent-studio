echo "Installing posthog-cli"
npm install -g @posthog/cli@0.6.1

# echo "Injecting context to sourcemaps"
posthog-cli sourcemap inject --directory ./dist/assets

# echo "Uploading sourcemaps to posthog"
posthog-cli sourcemap upload --directory ./dist/assets --project=$VERCEL_GIT_REPO_SLUG --version=$VERCEL_GIT_COMMIT_SHA
