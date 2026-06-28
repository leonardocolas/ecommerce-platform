with open(r'd:\Pincha\Personal\ecommerce-platform\ecommerce-platform\backend\products\CSV\scriptImportacion.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    print("Últimas 15 líneas:")
    for i, line in enumerate(lines[-15:], len(lines)-14):
        print("3d")