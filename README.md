# SLHS 302 Hearing Science Lab

The site includes Section 1, Weeks 1–4. Open index.html to preview the homepage. To test theme persistence reliably, serve the folder over HTTP. For example, run `python3 -m http.server 8000` in this folder, then open http://localhost:8000.

## Publish with GitHub Pages

1. Extract the ZIP. Commit its contents to the root of your GitHub repository, keeping index.html and the assets folder at the same level.
2. Under Settings → Pages, choose Deploy from a branch. Select your branch and /(root).
3. After GitHub Pages publishes, open the site from the Pages settings. Check a topic link and the High Contrast toggle.

The site uses relative links and needs no build step. The activity pages use shared files in assets. To add a week, add its links to index.html and use an existing activity page as a template. Keep the [Section].[Week].[Item] numbering and give each topic a unique anchor within its page. The header, stylesheet, and scripts provide the shared theme and interactions.
