# Amoha Group website

The website of Amoha Group, a real estate developer in Bathinda, Punjab: the home page, an About page and a
page for each project.

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home |
| `about.html` | About us |
| `gardens.html` | Amoha Gardens |
| `leaf.html` | Amoha Leaf |
| `roots.html` | Amoha Roots |
| `blooming-soon.html` | The upcoming project |
| `404.html` | Not found. It also forwards the pages' earlier addresses (`amoha-leaf.html` and so on). |

## Structure

```
css/
  tokens.css       colour, type scale, spacing and motion values
  base.css         reset, typography, grid and shared components
  sections.css     section layouts
  motion.css       reveal states and transitions
  amoha.css        the brand: fonts, palette, logo, loader and page refinements
js/
  app.js           start-up
  components.js    buttons, navigation, modals, sliders and the enquiry form
  motion.js        smooth scrolling, the loader, scroll reveals and theme switching
  scenes.js        scroll-driven scenes
  wind.js          the bougainvillea sprays
  petals.js        falling petals
  vendor/          GSAP and Lenis, see vendor/README.txt
assets/
  img/             photographs and renders, each JPEG with AVIF copies at several widths
  video/           the hero and spray clips
  fonts/           Fraunces and Manrope
```

## Running it

There is no build step. Serve the folder with any static web server, for example `npx serve .`, and open
the address it prints. Opened straight from the disk the pages mostly work, but the videos need a server.

## Images

Every photograph is a JPEG with AVIF copies next to it: `name.avif` at the JPEG's own width and
`name-400w.avif`, `name-640w.avif` and so on at each narrower step up to 1920. A picture lists those widths
in its `srcset`, with a `sizes` measured for that picture on phones, tablets and desktops, so the browser
downloads the smallest file that is still sharp on the screen in front of it. A picture cropped to fill its
frame is drawn wider than the frame, and its `sizes` allows for that. Phones with very dense screens are
served about twice their width rather than three times. Browsers that cannot read AVIF get the JPEG.

The page heroes, the quote and the closing picture also have a narrower cut for phones up to 479px wide,
`name-n.jpg` with its own AVIF copies: only the part of the picture a phone shows, at the same sharpness.

To replace a picture, keep its file name and replace the JPEG and every AVIF that starts with that name,
at the same widths (AVIF quality 52 matches the rest). A cut (`-n`) is the same height as its picture.

## Publishing

The site is plain files. GitHub Pages serves it from the root of the `main` branch. On a cPanel host,
upload the contents of this folder to `public_html`.

## Credits

Designed and developed by Jatin Dhir (jatindhir.dev@gmail.com).

- Fraunces and Manrope, SIL Open Font License 1.1 (`assets/fonts/OFL.txt`)
- GSAP 3.15, GreenSock Standard licence, and Lenis 1.3, MIT licence
- Photograph of Qila Mubarak by Tamoghni, CC BY-SA 4.0, Wikimedia Commons (credited in the page footer)
- Renders, project photographs and the Amoha Group logo belong to Amoha Group

© 2026 Amoha Group. All rights reserved.
