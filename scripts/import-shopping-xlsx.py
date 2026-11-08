#!/usr/bin/env python3
"""Extract the Shopping sheet and anchored product images from a Google Sheets XLSX export."""
import hashlib, json, re, shutil, subprocess, sys, tempfile, zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

if len(sys.argv) != 2:
    raise SystemExit('usage: import-shopping-xlsx.py sheet.xlsx')
source = Path(sys.argv[1])
root = Path(__file__).resolve().parents[1]
asset_dir = root / 'assets' / 'shopping'
asset_dir.mkdir(parents=True, exist_ok=True)
for old in asset_dir.glob('sheet-*.webp'):
    old.unlink()

MAIN = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'
DRAW = 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing'
A = 'http://schemas.openxmlformats.org/drawingml/2006/main'
REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'

with tempfile.TemporaryDirectory() as tmp_name:
    tmp = Path(tmp_name)
    with zipfile.ZipFile(source) as archive:
        archive.extractall(tmp)
    shared = []
    for item in ET.parse(tmp/'xl/sharedStrings.xml').getroot():
        shared.append(''.join(node.text or '' for node in item.iter(f'{{{MAIN}}}t')))
    rows = {}
    sheet = ET.parse(tmp/'xl/worksheets/sheet2.xml').getroot()
    sheet_format = sheet.find(f'{{{MAIN}}}sheetFormatPr')
    default_row_height = float(sheet_format.attrib.get('defaultRowHeight', '15'))
    row_heights = {}
    for row in sheet.findall(f'.//{{{MAIN}}}sheetData/{{{MAIN}}}row'):
        row_heights[int(row.attrib['r'])] = float(row.attrib.get('ht', default_row_height))
        values = {}
        for cell in row.findall(f'{{{MAIN}}}c'):
            column = re.match(r'[A-Z]+', cell.attrib['r']).group()
            value = cell.find(f'{{{MAIN}}}v')
            if value is not None:
                values[column] = shared[int(value.text)] if cell.attrib.get('t') == 's' else value.text
        rows[int(row.attrib['r'])] = values
    rels = {item.attrib['Id']: Path(item.attrib['Target']).name for item in ET.parse(tmp/'xl/drawings/_rels/drawing2.xml.rels').getroot()}
    images = {}
    def row_height_emu(row_number):
        return row_heights.get(row_number, default_row_height) * 12700

    def image_center_row(anchor):
        origin = anchor.find(f'{{{DRAW}}}from')
        extent = anchor.find(f'{{{DRAW}}}ext')
        origin_row = int(origin.find(f'{{{DRAW}}}row').text)
        row_offset = int(origin.find(f'{{{DRAW}}}rowOff').text)
        image_height = int(extent.attrib['cy'])
        center = sum(row_height_emu(row) for row in range(1, origin_row + 1)) + row_offset + image_height / 2
        bottom = 0
        for row_number in range(1, max(rows) + 2):
            bottom += row_height_emu(row_number)
            if center < bottom:
                return row_number
        raise ValueError('image center is outside the shopping sheet')

    for anchor in ET.parse(tmp/'xl/drawings/drawing2.xml').getroot():
        origin = anchor.find(f'{{{DRAW}}}from')
        picture = anchor.find(f'{{{DRAW}}}pic')
        extent = anchor.find(f'{{{DRAW}}}ext')
        if origin is None or extent is None or picture is None:
            continue
        row_number = image_center_row(anchor)
        blip = picture.find(f'.//{{{A}}}blip')
        if row_number in images:
            raise ValueError(f'multiple product images resolve to row {row_number}')
        images[row_number] = rels[blip.attrib[f'{{{REL}}}embed']]

    def price(text):
        text = str(text or '').strip()
        if re.fullmatch(r'\d+(?:\.\d+)?', text):
            return round(float(text))
        match = re.search(r'¥\s*([\d,]+)', text)
        return int(match.group(1).replace(',', '')) if match else 0

    def price_text(text):
        text = str(text or '').strip()
        if re.fullmatch(r'\d+(?:\.0+)?', text):
            return f'¥{round(float(text)):,}'
        return text

    def category(text):
        if re.search(r'과자|식품|디저트|주류|공항', text): return '먹거리'
        if re.search(r'뷰티|생활|드럭|의약|피부|구강|건강', text): return '생활용품'
        return '기념품'

    products = []
    for row_number in sorted(rows):
        row = rows[row_number]
        name = row.get('B', '').strip()
        if row_number == 1 or not name:
            continue
        image_url = ''
        if row_number in images:
            target = asset_dir / f'sheet-{row_number}.webp'
            subprocess.run(['magick', str(tmp/'xl/media'/images[row_number]), '-auto-orient', '-thumbnail', '420x420^', '-gravity', 'center', '-extent', '420x420', '-quality', '76', str(target)], check=True)
            digest = hashlib.sha256(target.read_bytes()).hexdigest()[:12]
            image_url = f'./assets/shopping/{target.name}?v={digest}'
        note = ' · '.join(part for part in [row.get('F','').strip(), row.get('H','').strip()] if part)
        products.append({
            'id': f'sheet-shopping-{row_number}', 'name': name, 'localName': row.get('C','').strip(),
            'store': row.get('D','').strip(), 'category': category(row.get('A','')), 'sheetCategory': row.get('A','').strip(),
            'currency': 'JPY', 'quantity': 1, 'price': price(row.get('E','')), 'priceText': price_text(row.get('E','')),
            'priceStatus': row.get('F','').strip(), 'imageUrl': image_url, 'note': note[:300], 'sourceUrl': row.get('K','').strip(),
            'done': row.get('I','').strip() in {'☑','✓','TRUE'}, 'sourceRow': row_number
        })

output = root / 'shopping-sheet-data.js'
output.write_text('window.MYTRIP_HOKKAIDO_SHOPPING_V1 = '+json.dumps(products, ensure_ascii=False, separators=(',',':'))+';\n', encoding='utf-8')
print(json.dumps({'products':len(products),'images':sum(bool(item['imageUrl']) for item in products)}, ensure_ascii=False))
