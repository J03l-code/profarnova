import os
import glob

html_files = glob.glob("*.html")
css_files = ["styles.css", "profarnova-main.css", "lubryn-e.css"]

html_old = '<p style="margin-top: 0.8rem; font-size: 0.85rem; opacity: 0.85;">Desarrollado con ❤️ por <a href="https://jiyanedesign.com" target="_blank" rel="noopener" class="designer-link">JiyaneDesign</a></p>'
html_new = '<p style="margin-top: 0.8rem; font-size: 0.9rem; opacity: 0.95; font-weight: 500;">Desarrollado por <a href="https://jiyanedesign.com" target="_blank" rel="noopener" class="designer-link">JiyaneDesign</a></p>'

css_old = """/* Designer Link Styling */
.designer-link {
    color: var(--color-primary-light) !important;
    font-weight: 700 !important;
    text-decoration: none !important;
    transition: all 0.3s ease !important;
    border-bottom: 1px dashed var(--color-primary-light);
    padding-bottom: 2px;
}

.designer-link:hover {
    color: #fff !important;
    border-bottom-color: #fff !important;
    text-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
}"""

css_new = """/* Designer Link Styling */
.designer-link {
    color: #c9f2d5 !important;
    font-weight: 800 !important;
    text-decoration: none !important;
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
    border-bottom: 2px solid rgba(201, 242, 213, 0.5);
    padding-bottom: 1px;
    letter-spacing: 0.5px;
    display: inline-block;
}

.designer-link:hover {
    color: #ffffff !important;
    border-bottom-color: #ffffff !important;
    text-shadow: 0 0 15px rgba(201, 242, 213, 0.9);
    transform: translateY(-2px);
}"""

for f in html_files:
    try:
        with open(f, "r", encoding="utf-8") as file:
            content = file.read()
        if html_old in content:
            content = content.replace(html_old, html_new)
            with open(f, "w", encoding="utf-8") as file:
                file.write(content)
            print(f"Updated {f}")
    except Exception as e:
        print(f"Error {f}: {e}")

for f in css_files:
    try:
        with open(f, "r", encoding="utf-8") as file:
            content = file.read()
        if css_old in content:
            content = content.replace(css_old, css_new)
            with open(f, "w", encoding="utf-8") as file:
                file.write(content)
            print(f"Updated {f}")
    except Exception as e:
        print(f"Error {f}: {e}")
