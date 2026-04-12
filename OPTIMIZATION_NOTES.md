# Image Optimization Notes
## Lighthouse stima: -787 KiB di risparmio potenziale

---

## 1. Immagini da convertire in WebP

Converti tutte le seguenti immagini in WebP (mantieni il JPG/PNG originale come fallback).

### Slider gallery pannelli (assets/img/)
| File originale | Dimensioni display | Priorità |
|---|---|---|
| slider_pic_marmo (1).jpg | 271×271 px | Alta |
| slider_pic_marmo (2).jpg | 271×271 px | Alta |
| slider_pic_marmo (3).jpg | 271×271 px | Alta |
| slider_pic_marmo (4).jpg | 271×271 px | Alta |
| slider_pic_marmo (5).jpg | 271×271 px | Alta |
| slider_pic_marmo (6).JPG | 271×271 px | Alta |
| slider_pic_marmo (7).jpg | 271×271 px | Alta |
| slider_pic_marmo (8).jpg | 271×271 px | Alta |
| slider_pic_marmo (9).jpg | 271×271 px | Alta |
| slider_pic_marmo (10).jpg | 271×271 px | Alta |
| slider_pic_marmo (11).jpg | 271×271 px | Alta |
| slider_pic_marmo (12).jpg | 271×271 px | Alta |
| slider_pic_marmo (13).jpg | 271×271 px | Alta |
| slider_pic_marmo (14).jpg | 271×271 px | Alta |
| slider_pic_marmo (15).jpg | 271×271 px | Alta |
| slider_pic_marmo (16).jpg | 271×271 px | Alta |
| slider_pic_marmo (17).jpg | 271×271 px | Alta |
| slider_pic_marmo (1).png | 271×271 px | Alta |
| slider_pic_marmo (2).png | 271×271 px | Alta |

### Slider ambienti homepage (assets/img/slider_home/)
Queste immagini sono il caso più critico: i file sono 1024×1024 px o più,
ma vengono mostrate a circa 280 px su mobile e ~500 px su desktop.

| File originale | Dimensioni originali | Dimensioni display (mobile) |
|---|---|---|
| foto_ambienti_slider_homepage (1).jpg | 1536×1024 | ~500px |
| foto_ambienti_slider_homepage (2).jpg | 1024×1536 | ~500px |
| foto_ambienti_slider_homepage (3).jpg | 1536×1024 | ~500px |
| foto_ambienti_slider_homepage (4).jpg | 1024×1024 | ~280px |
| foto_ambienti_slider_homepage (5).jpg | 1280×1024 | ~500px |
| foto_ambienti_slider_homepage (6).jpg | 1024×1024 | ~280px |
| foto_ambienti_slider_homepage (7).jpg | 1024×1024 | ~280px |
| foto_ambienti_slider_homepage (8).jpg | 1024×1024 | ~280px |
| foto_ambienti_slider_homepage (9).jpg | 1272×832 | ~500px |
| foto_ambienti_slider_homepage (10).jpg | 1024×1536 | ~500px |
| foto_ambienti_slider_homepage (11).jpg | 1024×1024 | ~280px |

### Altre immagini
| File | Note |
|---|---|
| og-home-preview.jpg | OG image, non ottimizzare troppo (min 1200×630) |
| logo_last_nav.png | SVG o WebP consigliato |
| logo_last.svg | Già ottimale |
| set.marmo*.jpg | Verificare se usate, altrimenti rimuovere |

---

## 2. Come usare `<picture>` con fallback JPG

Sostituire ogni `<img src="file.jpg">` con:

```html
<picture>
  <source srcset="assets/img/file.webp" type="image/webp">
  <img src="assets/img/file.jpg" alt="..." width="271" height="271" loading="lazy" decoding="async">
</picture>
```

Mantenere sempre `width`, `height`, `alt`, `loading` e `decoding` sull'elemento `<img>` interno.

---

## 3. Attributo `sizes` per le immagini gallery

Le immagini `.slider_pic_marmo` sono mostrate in una griglia responsive.
Aggiungere `sizes` a ogni `<img>` della gallery:

```html
<img
  src="assets/img/slider_pic_marmo (1).jpg"
  alt="..."
  width="271" height="271"
  sizes="(max-width: 480px) calc(50vw - 24px), (max-width: 768px) calc(33vw - 24px), 271px"
  loading="lazy"
  decoding="async"
>
```

Questo permette al browser di scegliere la dimensione corretta quando si aggiungono varianti `srcset`.

---

## 4. Compressione immagini slider_home (priorità massima)

Le immagini in `assets/img/slider_home/` sono il contributo maggiore al peso della pagina.
Vengono mostrate in un contenitore di circa 280 px su mobile e ~560 px su desktop,
ma i file originali arrivano a 1536 px di larghezza.

**Azioni consigliate:**

1. **Ridimensionare** a massimo 800×600 px (le versioni 1536×1024 non hanno senso a queste dimensioni display)
2. **Convertire in WebP** con qualità 75–80
3. **Creare due varianti** per srcset: 400w (mobile) e 800w (desktop)

Esempio con `<picture>` + `srcset`:

```html
<picture>
  <source
    type="image/webp"
    srcset="
      assets/img/slider_home/foto_ambienti_slider_homepage (1)-400.webp 400w,
      assets/img/slider_home/foto_ambienti_slider_homepage (1)-800.webp 800w
    "
    sizes="(max-width: 768px) 100vw, 560px"
  >
  <img
    src="assets/img/slider_home/foto_ambienti_slider_homepage (1).jpg"
    alt="..."
    width="1536" height="1024"
    loading="eager"
    fetchpriority="high"
    decoding="async"
  >
</picture>
```

**Tool consigliati per la conversione:**
- [Squoosh](https://squoosh.app) — online, nessuna installazione
- `cwebp` (Google) — da CLI: `cwebp -q 80 input.jpg -o output.webp`
- Sharp (Node.js) — per batch processing

---

## 5. Stima risparmio

| Categoria | Risparmio stimato |
|---|---|
| slider_home JPG → WebP 800w | ~450–550 KiB |
| slider_pic_marmo JPG → WebP | ~150–200 KiB |
| Totale stimato | ~600–750 KiB |
