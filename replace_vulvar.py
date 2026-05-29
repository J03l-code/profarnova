import glob

def replace_in_files():
    files = glob.glob("**/*.html", recursive=True) + glob.glob("**/*.jsx", recursive=True)
    replacements = [
        # Exact sentence replacements for the main description
        ("Gel hidratante y lubricante vulvar premium formulado con Ácido Hialurónico, Vitamina E, Aloe Vera y Ácido Láctico para el alivio de la sequedad íntima.",
         "Gel hidratante y lubricante íntimo premium formulado con Ácido Hialurónico, Vitamina E, Aloe Vera y Ácido Láctico para brindar confort íntimo."),
        ("Gel hidratante y lubricante vulvar premium diseñado para el alivio integral de la sequedad íntima.",
         "Gel hidratante y lubricante íntimo premium diseñado para brindar confort íntimo."),
        ("Un gel hidratante y lubricante íntimo vulvar premium", "Un gel hidratante y lubricante íntimo premium"),
        ("gel hidratante y lubricante íntimo vulvar", "gel hidratante y lubricante íntimo"),
        ("gel hidratante vulvar", "gel hidratante íntimo"),
        ("lubricante vulvar", "lubricante íntimo"),
        ("salud vulvar", "salud íntima"),
        ("epitelio vulvar", "epitelio íntimo"),
        ("microbiota vulvar", "microbiota íntima"),
        ("elasticidad vulvar", "elasticidad íntima"),
        ("irritación vulvar", "irritación íntima"),
        ("pH fisiológico vulvar", "pH fisiológico íntimo"),
        ("resequedad vulvar", "resequedad íntima"),
        ("zona vulvar", "zona íntima"),
        ("área vulvar", "área íntima"),
        ("tejido íntimo vulvar", "tejido íntimo"),
        ("mucosa íntima vulvar", "mucosa íntima"),
        ("vulvar", "íntima") # Fallback for any remaining "vulvar"
    ]

    for f in files:
        if "node_modules" in f:
            continue
        try:
            with open(f, 'r', encoding='utf-8') as file:
                content = file.read()
            original = content
            
            for old, new in replacements:
                content = content.replace(old, new)
                # Also handle capitalized versions
                content = content.replace(old.capitalize(), new.capitalize())
            
            if content != original:
                with open(f, 'w', encoding='utf-8') as file:
                    file.write(content)
                print(f"Updated {f}")
        except Exception as e:
            print(f"Error reading {f}: {e}")

if __name__ == '__main__':
    replace_in_files()
