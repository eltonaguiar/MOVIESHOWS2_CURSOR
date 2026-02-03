# GitHub Pages Configuration for MOVIESHOWS

This repository is configured to be deployed at the `/MOVIESHOWS/` subdirectory path.

## Deployment URLs

- **GitHub Pages**: `https://eltonaguiar.github.io/MOVIESHOWS/`
- **Production**: `https://findtorontoevents.ca/MOVIESHOWS/` (future)

## Build Configuration

The Next.js build is configured with `basePath: "/MOVIESHOWS/"` which means:
- All assets are prefixed with `/MOVIESHOWS/`
- The app must be served from the `/MOVIESHOWS/` path, not root

## GitHub Pages Setup

To deploy this correctly on GitHub Pages:

1. Go to repository Settings → Pages
2. Set source to the branch containing these files (e.g., `main` or `gh-pages`)
3. The site will be available at: `https://eltonaguiar.github.io/MOVIESHOWS/`

## Important Notes

- ✅ The build is already configured correctly for `/MOVIESHOWS/` path
- ✅ All asset references use the correct base path
- ✅ This will work identically when moved to `findtorontoevents.ca/MOVIESHOWS/`
- ⚠️ Do NOT access at root URL (`eltonaguiar.github.io/`) - it will cause 404 errors

## Files in This Repository

This is a **static export** from Next.js containing:
- `index.html` - Main application entry point
- `_next/` - Next.js static assets (JS, CSS, fonts)
- `scroll-fix.js` - Custom scroll navigation
- `ui-fix.js` - UI enhancement fixes
- Movie database files (CSV/JSON)

## Verification

After deployment, verify:
1. No 404 errors in browser console
2. React hydration completes successfully
3. Movie clicks work from bottom list
4. Queue functionality works
