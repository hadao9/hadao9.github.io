# Ha Dao Thi Thu — Academic Website

## File structure

```
├── index.html                  # The whole site (tabs: Bio / Publications / Teaching / Service / Contact)
├── style.css                   # Styles
├── publications.bib            # ← Edit this to add/update papers
├── js/main.js                  # BibTeX parser, tab switcher
└── assets/
    ├── photo.jpg               # ← Add your photo here
    ├── cv.pdf                  # ← Add your CV here
    └── preprints/
        ├── Dao_PETS26.pdf      # ← Add preprint PDFs here (filename matches .bib url_preprint field)
        └── ...
```

---

## Add or update a paper

Open **`publications.bib`** and add a BibTeX entry:

```bibtex
@inproceedings{MyKey25,
  year         = {2025},
  title        = {My Paper Title},
  author       = {Dao, Ha and Coauthor, Alice},
  booktitle    = {Conference Name 2025},
  url_doi      = {https://doi.org/10.xxxx/...},
  url_preprint = {MyKey25.pdf},       % file in assets/preprints/
}
```

Supported link fields: `url_doi`, `url_preprint`, `url_pdf`, `url_arxiv`, `url_code`

`url_preprint` points to a PDF in `assets/preprints/` — it opens directly in the browser.

Papers are sorted newest first automatically. No other file needs to change.

---

## Add your photo

Drop a photo file into `assets/` named `photo.jpg` (or change the filename in `index.html`).

---

## Deploy to GitHub Pages

```bash
git init && git add . && git commit -m "launch"
git remote add origin https://github.com/USERNAME/USERNAME.github.io.git
git push -u origin main
```

Settings → Pages → Deploy from branch → main → Save.

> **Note:** The BibTeX file is loaded via `fetch()`, which requires a web server.
> Use `python3 -m http.server` to preview locally.
