# MovieShows - TikTok-Style Movie Discovery

A TikTok-style movie and TV show trailer discovery app with vertical scrolling navigation.

## 🎬 Live Demo

**GitHub Pages**: [https://eltonaguiar.github.io/MOVIESHOWS/](https://eltonaguiar.github.io/MOVIESHOWS/)

**Production** (Coming Soon): `https://findtorontoevents.ca/MOVIESHOWS/`

## ✨ Features

- 🎥 TikTok-style vertical scrolling through movie trailers
- 🎞️ 237+ movies and TV shows from 2026
- ▶️ YouTube trailer integration
- 📱 Responsive design (desktop, tablet, mobile)
- ⌨️ Keyboard navigation (↑/↓ arrows, j/k keys)
- 🖱️ Mouse wheel and touch swipe support
- 📚 Full library browser with search
- 🎯 Queue system for playlist creation

## 🚀 Deployment

This is a **static Next.js export** configured with `basePath: "/MOVIESHOWS/"`.

### GitHub Actions

Automatic deployment is configured via GitHub Actions. Every push to `main` triggers a deployment to GitHub Pages.

See: [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)

### Manual Deployment

To deploy elsewhere, copy all files to a web server at the `/MOVIESHOWS/` subdirectory path.

For detailed deployment instructions, see: [`DEPLOYMENT.md`](DEPLOYMENT.md)

## 🛠️ Technical Stack

- **Framework**: Next.js (Static Export)
- **Styling**: Tailwind CSS
- **Video**: YouTube IFrame API
- **Data**: TMDB API (movie metadata)
- **Deployment**: GitHub Pages / GitHub Actions

## 📁 Project Structure

```
MOVIESHOWS2_CURSOR/
├── index.html              # Main application entry
├── _next/                  # Next.js static assets
│   └── static/
│       ├── chunks/         # JavaScript bundles
│       └── media/          # Fonts and images
├── scroll-fix.js           # Custom scroll navigation
├── ui-fix.js               # UI enhancement fixes
├── movies-database.json    # Movie metadata
├── DEPLOYMENT.md           # Deployment guide
└── .github/
    └── workflows/
        └── deploy.yml      # GitHub Actions workflow
```

## 🎮 Usage

### Navigation

- **Scroll**: Mouse wheel or trackpad
- **Keyboard**: Arrow keys (↑/↓) or j/k
- **Touch**: Swipe up/down
- **Click**: Movie posters in bottom carousel

### Controls

- **Full Library**: Browse all 237 titles
- **Queue**: Build a playlist (green button, top-right)
- **Volume**: Adjust or mute trailers
- **Speed**: Change playback speed

## 📝 License

This project is for demonstration purposes.

## 🔗 Links

- **Live Site**: [https://eltonaguiar.github.io/MOVIESHOWS/](https://eltonaguiar.github.io/MOVIESHOWS/)
- **Repository**: [https://github.com/eltonaguiar/MOVIESHOWS2_CURSOR](https://github.com/eltonaguiar/MOVIESHOWS2_CURSOR)
- **Issues**: [Report a bug](https://github.com/eltonaguiar/MOVIESHOWS2_CURSOR/issues)

---

Built with ❤️ using Next.js and deployed via GitHub Actions
