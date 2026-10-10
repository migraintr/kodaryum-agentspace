# Rapor altyapısı: yazı tipi, renk, paragraf stilleri, tablo/kutu bileşenleri ve çizim bileşenleri (diyagramlar).
import math
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, Flowable, Frame, KeepTogether, PageBreak, PageTemplate, Paragraph,
                                Spacer, Table, TableStyle)
from reportlab.platypus.tableofcontents import TableOfContents

F = 'C:/Windows/Fonts/'
pdfmetrics.registerFont(TTFont('S', F + 'segoeui.ttf'))
pdfmetrics.registerFont(TTFont('S-B', F + 'segoeuib.ttf'))
pdfmetrics.registerFont(TTFont('S-I', F + 'segoeuii.ttf'))
pdfmetrics.registerFont(TTFont('S-BI', F + 'segoeuiz.ttf'))
pdfmetrics.registerFontFamily('S', normal='S', bold='S-B', italic='S-I', boldItalic='S-BI')

NAVY = colors.HexColor('#13234d')
BLUE = colors.HexColor('#2f80ed')
VIOLET = colors.HexColor('#7c3aed')
ORANGE = colors.HexColor('#f59e1b')
GREEN = colors.HexColor('#17a673')
RED = colors.HexColor('#e5484d')
INK = colors.HexColor('#1e293b')
MUTE = colors.HexColor('#64748b')
LINE = colors.HexColor('#dbe3ef')
SOFT = colors.HexColor('#f4f7fc')
SOFT_O = colors.HexColor('#fff6e6')
SOFT_B = colors.HexColor('#eaf2ff')
SOFT_G = colors.HexColor('#e9f8f1')
SOFT_R = colors.HexColor('#fdecec')

W, H = 210 * mm, 297 * mm
MX = 20 * mm
CW = W - 2 * MX


def st(name, **kw):
    base = dict(fontName='S', fontSize=10, leading=14.6, textColor=INK, spaceAfter=5, alignment=TA_LEFT)
    base.update(kw)
    return ParagraphStyle(name, **base)


BODY = st('body')
SMALL = st('small', fontSize=8.6, leading=12, textColor=MUTE)
H1 = st('h1', fontName='S-B', fontSize=22, leading=27, textColor=NAVY, spaceBefore=0, spaceAfter=8)
H2 = st('h2', fontName='S-B', fontSize=14, leading=18, textColor=NAVY, spaceBefore=12, spaceAfter=5, keepWithNext=1)
H3 = st('h3', fontName='S-B', fontSize=11, leading=15, textColor=BLUE, spaceBefore=8, spaceAfter=3, keepWithNext=1)
LEAD = st('lead', fontSize=11.5, leading=17, textColor=MUTE, spaceAfter=10)
BUL = st('bul', leftIndent=13, bulletIndent=2, spaceAfter=2.5)
CELL = st('cell', fontSize=8.8, leading=12, spaceAfter=0)
CELLB = st('cellb', fontName='S-B', fontSize=8.8, leading=12, spaceAfter=0)
CELLH = st('cellh', fontName='S-B', fontSize=8.8, leading=12, spaceAfter=0, textColor=colors.white)


def P(t, s=BODY):
    return Paragraph(t, s)


def bullets(items, style=BUL, color='#2f80ed'):
    return [Paragraph(t, style, bulletText='•') for t in items]


def h1(t, kicker=None):
    out = []
    if kicker:
        out.append(Paragraph(kicker.upper(), st('k', fontName='S-B', fontSize=8.5, leading=11, textColor=ORANGE, spaceAfter=2)))
    out.append(Paragraph(t, H1))
    return out


class Rule(Flowable):
    def __init__(self, w=CW, color=LINE, thick=0.8, accent=None):
        super().__init__()
        self.w, self.color, self.thick, self.accent = w, color, thick, accent
        self.height = 4

    def wrap(self, *_):
        return self.w, 6

    def draw(self):
        c = self.canv
        c.setStrokeColor(self.color)
        c.setLineWidth(self.thick)
        c.line(0, 2, self.w, 2)
        if self.accent:
            c.setStrokeColor(self.accent)
            c.setLineWidth(2.2)
            c.line(0, 2, 38, 2)


def callout(title, body, tone='blue'):
    bg, bar = {'blue': (SOFT_B, BLUE), 'orange': (SOFT_O, ORANGE), 'green': (SOFT_G, GREEN), 'red': (SOFT_R, RED)}[tone]
    inner = [Paragraph(f'<b>{title}</b>', st('ct', fontName='S-B', fontSize=9.6, leading=13, textColor=bar, spaceAfter=2))]
    inner += [Paragraph(b, st('cb', fontSize=9.4, leading=13.6, spaceAfter=2)) if isinstance(b, str) else b for b in (body if isinstance(body, list) else [body])]
    t = Table([[inner]], colWidths=[CW])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg), ('LINEBEFORE', (0, 0), (0, -1), 3, bar),
        ('LEFTPADDING', (0, 0), (-1, -1), 11), ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8), ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ]))
    return t


def table(rows, widths, head=True, zebra=True, first_bold=True, hcolor=NAVY, valign='TOP'):
    data = []
    for i, r in enumerate(rows):
        row = []
        for j, c in enumerate(r):
            if isinstance(c, str):
                s = CELLH if (head and i == 0) else (CELLB if (first_bold and j == 0) else CELL)
                row.append(Paragraph(c, s))
            else:
                row.append(c)
        data.append(row)
    tw = sum(widths)
    t = Table(data, colWidths=[w / tw * CW for w in widths], repeatRows=1 if head else 0)
    sty = [
        ('VALIGN', (0, 0), (-1, -1), valign), ('LEFTPADDING', (0, 0), (-1, -1), 6), ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LINEBELOW', (0, 0), (-1, -1), 0.4, LINE),
    ]
    if head:
        sty += [('BACKGROUND', (0, 0), (-1, 0), hcolor)]
    if zebra:
        for i in range(1 if head else 0, len(rows)):
            if (i % 2 == 0):
                sty.append(('BACKGROUND', (0, i), (-1, i), SOFT))
    t.setStyle(TableStyle(sty))
    return t


def cards(items, cols=3, color=BLUE, gap=6):
    """items: [(başlık, metin)] → kart ızgarası"""
    w = (CW - gap * (cols - 1)) / cols
    cells = []
    for t, b in items:
        cells.append([Paragraph(f'<b>{t}</b>', st('cc', fontName='S-B', fontSize=9.6, leading=12.5, textColor=NAVY, spaceAfter=2)),
                      Paragraph(b, st('cd', fontSize=8.7, leading=12, textColor=INK, spaceAfter=0))])
    rows = [cells[i:i + cols] for i in range(0, len(cells), cols)]
    for r in rows:
        while len(r) < cols:
            r.append('')
    t = Table(rows, colWidths=[w] * cols, rowHeights=None, hAlign='LEFT')
    sty = [('VALIGN', (0, 0), (-1, -1), 'TOP'), ('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (0, 0), (-1, -1), gap), ('TOPPADDING', (0, 0), (-1, -1), 0), ('BOTTOMPADDING', (0, 0), (-1, -1), gap)]
    t.setStyle(TableStyle(sty))
    # her hücreyi kutu yap
    boxed = []
    for r in rows:
        br = []
        for c in r:
            if c == '':
                br.append('')
                continue
            inner = Table([[c]], colWidths=[w - gap])
            inner.setStyle(TableStyle([('BOX', (0, 0), (-1, -1), 0.6, LINE), ('BACKGROUND', (0, 0), (-1, -1), colors.white), ('LINEABOVE', (0, 0), (-1, 0), 2.2, color),
                                       ('LEFTPADDING', (0, 0), (-1, -1), 8), ('RIGHTPADDING', (0, 0), (-1, -1), 7), ('TOPPADDING', (0, 0), (-1, -1), 6), ('BOTTOMPADDING', (0, 0), (-1, -1), 7)]))
            br.append(inner)
        boxed.append(br)
    t2 = Table(boxed, colWidths=[w] * cols, hAlign='LEFT')
    t2.setStyle(TableStyle(sty))
    return t2


# ── Çizim bileşenleri ─────────────────────────────────────────────────────────────────────────────
def rr(c, x, y, w, h, r=6, fill=None, stroke=None, lw=0.8):
    if fill is not None:
        c.setFillColor(fill)
    if stroke is not None:
        c.setStrokeColor(stroke)
        c.setLineWidth(lw)
    c.roundRect(x, y, w, h, r, stroke=1 if stroke is not None else 0, fill=1 if fill is not None else 0)


def txt(c, s, x, y, size=9, font='S', color=INK, align='l'):
    c.setFont(font, size)
    c.setFillColor(color)
    {'l': c.drawString, 'c': c.drawCentredString, 'r': c.drawRightString}[align](x, y, s)


def wrap_lines(s, width, font='S', size=8.5):
    words, lines, cur = s.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if pdfmetrics.stringWidth(t, font, size) <= width:
            cur = t
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


class Loop(Flowable):
    """Pazarlama operasyon döngüsü: yedi adım dairesel"""
    STEPS = [('1', 'Anla', 'İşletme profili, hedef, bütçe'), ('2', 'Planla', 'Strateji + 30 günlük takvim'), ('3', 'Üret', 'İçerik, reklam, e-posta, görsel'),
             ('4', 'Onayla', 'Sahibine tek dokunuş onay'), ('5', 'Yayınla', 'Kanallara zamanlanmış yayın'), ('6', 'Ölç', 'Atıf, ROI, haftalık rapor'), ('7', 'Öğren', 'Sonuçtan marka hafızasına')]

    def __init__(self, h=250):
        super().__init__()
        self.h = h

    def wrap(self, *_):
        return CW, self.h

    def draw(self):
        c = self.canv
        cx, cy, R = CW / 2, self.h / 2, self.h / 2 - 38
        c.setStrokeColor(LINE)
        c.setLineWidth(1.4)
        c.circle(cx, cy, R)
        rr(c, cx - 62, cy - 30, 124, 60, 10, fill=NAVY)
        txt(c, 'PAZARLAMA', cx, cy + 6, 10.5, 'S-B', colors.white, 'c')
        txt(c, 'OPERASYON DÖNGÜSÜ', cx, cy - 8, 7.8, 'S', colors.HexColor('#b9c6e6'), 'c')
        txt(c, 'her hafta kendini geliştirir', cx, cy - 20, 7.2, 'S-I', colors.HexColor('#b9c6e6'), 'c')
        n = len(self.STEPS)
        for i, (no, t, d) in enumerate(self.STEPS):
            a = math.pi / 2 - i * 2 * math.pi / n
            x, y = cx + R * math.cos(a), cy + R * math.sin(a)
            col = [BLUE, VIOLET, ORANGE, RED, GREEN, BLUE, VIOLET][i]
            c.setFillColor(col)
            c.circle(x, y, 14, stroke=0, fill=1)
            txt(c, no, x, y - 4, 11, 'S-B', colors.white, 'c')
            # etiket dışarıda
            right = math.cos(a) >= -0.05
            lx = x + (22 if right else -22)
            txt(c, t, lx, y + 3, 10, 'S-B', NAVY, 'l' if right else 'r')
            txt(c, d, lx, y - 9, 7.8, 'S', MUTE, 'l' if right else 'r')


class ModuleMap(Flowable):
    """Dört katmanlı modül haritası"""
    LAYERS = [
        ('TEMEL', NAVY, ['M1 Marka hafızası', 'M2 Pazar ve rakip istihbaratı', 'M10 Onay, güvenlik ve uyum']),
        ('ÜRETİM', VIOLET, ['M3 Strateji ve plan motoru', 'M4 İçerik fabrikası', 'M12 Görsel ve video stüdyosu']),
        ('YAYIN VE BÜYÜME', ORANGE, ['M5 Kanal bağlayıcıları', 'M6 Yerel SEO ve yorumlar', 'M7 Reklam otopilotu', 'M8 Müşteri ve WhatsApp asistanı']),
        ('ÖLÇÜM', GREEN, ['M9 Analitik ve patron raporu', 'M11 Satış kanalı ve e-ticaret verisi']),
    ]

    def __init__(self):
        super().__init__()
        self.h = 232

    def wrap(self, *_):
        return CW, self.h

    def draw(self):
        c = self.canv
        y = self.h
        for name, col, mods in self.LAYERS:
            lh = 50
            y -= lh
            rr(c, 0, y, CW, lh - 6, 8, fill=colors.HexColor('#f7f9fd'), stroke=LINE)
            rr(c, 0, y, 78, lh - 6, 8, fill=col)
            c.setFillColor(col)
            c.rect(60, y, 20, lh - 6, stroke=0, fill=1)
            for ln, t in enumerate(wrap_lines(name, 66, 'S-B', 8)):
                txt(c, t, 39, y + (lh - 6) / 2 + (3 if len(wrap_lines(name, 66, 'S-B', 8)) == 1 else 7 - ln * 11) - 3, 8, 'S-B', colors.white, 'c')
            n = len(mods)
            gw = (CW - 88 - 6 * (n - 1) - 6) / n
            for i, m in enumerate(mods):
                x = 84 + i * (gw + 6)
                rr(c, x, y + 6, gw, lh - 18, 6, fill=colors.white, stroke=col, lw=1)
                for k, ln in enumerate(wrap_lines(m, gw - 10, 'S-B', 8.2)[:2]):
                    txt(c, ln, x + gw / 2, y + (lh - 18) / 2 + 6 - k * 10.5 + (0 if len(wrap_lines(m, gw - 10, 'S-B', 8.2)) > 1 else -3), 8.2, 'S-B', NAVY, 'c')
            y -= 0


class Gantt(Flowable):
    ROWS = [
        ('Faz 0 · Keşif ve temel', 0, 2, MUTE, '2 hf'),
        ('Faz 1 · MVP: İçerik + Onay + 2 kanal', 2, 10, BLUE, '8 hf'),
        ('Faz 2 · Yerel SEO, yorum, WhatsApp asistanı', 10, 18, VIOLET, '8 hf'),
        ('Faz 3 · Reklam otopilotu ve atıf', 16, 26, ORANGE, '10 hf'),
        ('Faz 4 · Kurumsal: ekip, onay zinciri, API', 24, 36, GREEN, '12 hf'),
        ('Sürekli · Güvenlik, uyum, maliyet, deney', 2, 36, colors.HexColor('#94a3b8'), 'sürekli'),
    ]

    def __init__(self):
        super().__init__()
        self.h = 196

    def wrap(self, *_):
        return CW, self.h

    def draw(self):
        c = self.canv
        lw = 168
        gw = CW - lw - 4
        weeks = 36
        top = self.h - 14
        for k in range(0, weeks + 1, 4):
            x = lw + gw * k / weeks
            c.setStrokeColor(LINE)
            c.setLineWidth(0.5)
            c.line(x, 6, x, top)
            txt(c, f'H{k}', x, top + 3, 7, 'S', MUTE, 'c')
        rh = 27
        for i, (name, a, b, col, lab) in enumerate(self.ROWS):
            y = top - 8 - (i + 1) * rh + 6
            txt(c, name, 0, y + 7, 8.6, 'S-B', NAVY)
            x0, x1 = lw + gw * a / weeks, lw + gw * b / weeks
            rr(c, x0, y, x1 - x0, 17, 5, fill=col)
            txt(c, lab, (x0 + x1) / 2, y + 5, 7.8, 'S-B', colors.white, 'c')


class Wire(Flowable):
    """Pazarlama odası ekran taslağı (Pazarlama Merkezi)"""

    def __init__(self, h=300):
        super().__init__()
        self.h = h

    def wrap(self, *_):
        return CW, self.h

    def draw(self):
        c = self.canv
        h = self.h
        rr(c, 0, 0, CW, h, 10, fill=colors.HexColor('#f4f6fa'), stroke=LINE, lw=1.2)
        rr(c, 0, h - 26, CW, 26, 10, fill=NAVY)
        c.setFillColor(NAVY)
        c.rect(0, h - 26, CW, 10, stroke=0, fill=1)
        for i, col in enumerate(['#ff5f57', '#febc2e', '#28c840']):
            c.setFillColor(colors.HexColor(col))
            c.circle(14 + i * 12, h - 13, 3.4, stroke=0, fill=1)
        txt(c, 'Pazarlama Merkezi · Çiçek Dünyası Butik', 62, h - 17, 8.5, 'S-B', colors.white)
        txt(c, 'Bu ay: 18 gönderi · 6 reklam · 2 e-posta', CW - 12, h - 17, 7.6, 'S', colors.HexColor('#b9c6e6'), 'r')
        # sol sütun: bugünün planı
        sx = 10
        sw = 150
        rr(c, sx, 10, sw, h - 46, 7, fill=colors.white, stroke=LINE)
        txt(c, 'BUGÜN İÇİN 5 İŞ', sx + 9, h - 52, 7.8, 'S-B', ORANGE)
        items = [('Onay bekliyor', 'Hafta sonu kampanya gönderisi', RED), ('Onay bekliyor', '"Sevgililer Günü" reklam seti', RED), ('Hazır', 'Instagram hikâyesi (3 kare)', GREEN),
                 ('Yayında', 'Google işletme yorum yanıtı ×4', BLUE), ('Planlı', 'E-posta bülteni 18:00', MUTE)]
        for i, (a, b, col) in enumerate(items):
            y = h - 78 - i * 30
            rr(c, sx + 7, y - 6, sw - 14, 26, 5, fill=SOFT)
            c.setFillColor(col)
            c.circle(sx + 16, y + 7, 3, stroke=0, fill=1)
            txt(c, a, sx + 24, y + 11, 6.8, 'S-B', col)
            for k, ln in enumerate(wrap_lines(b, sw - 40, 'S', 7.6)[:1]):
                txt(c, ln, sx + 24, y, 7.6, 'S', INK)
        rr(c, sx + 7, 18, sw - 14, 22, 6, fill=BLUE)
        txt(c, 'Tümünü onayla (2)', sx + sw / 2, 26, 8.2, 'S-B', colors.white, 'c')
        # orta: takvim
        mx = sx + sw + 10
        mw = 190
        rr(c, mx, 10, mw, h - 46, 7, fill=colors.white, stroke=LINE)
        txt(c, 'İÇERİK TAKVİMİ · KASIM', mx + 9, h - 52, 7.8, 'S-B', ORANGE)
        days = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz']
        cw_ = (mw - 18) / 7
        for i, d in enumerate(days):
            txt(c, d, mx + 9 + cw_ * i + cw_ / 2, h - 66, 7, 'S-B', MUTE, 'c')
        cols = [BLUE, VIOLET, ORANGE, GREEN, RED]
        n = 0
        for r in range(5):
            for q in range(7):
                x = mx + 9 + cw_ * q
                y = h - 76 - (r + 1) * 30
                rr(c, x + 1, y, cw_ - 2, 27, 3, fill=SOFT)
                txt(c, str(r * 7 + q + 1), x + 4, y + 18, 6.4, 'S', MUTE)
                if (r * 7 + q) % 3 != 2:
                    for k in range(1 + (r + q) % 2):
                        c.setFillColor(cols[(r * 3 + q + k) % 5])
                        c.roundRect(x + 4, y + 9 - k * 7, cw_ - 10, 5, 2, stroke=0, fill=1)
        # sağ: sonuç
        rx = mx + mw + 10
        rw = CW - rx - 10
        rr(c, rx, 10, rw, h - 46, 7, fill=colors.white, stroke=LINE)
        txt(c, 'SONUÇLAR (30 GÜN)', rx + 9, h - 52, 7.8, 'S-B', ORANGE)
        kp = [('Yeni müşteri adayı', '212', '+38%'), ('WhatsApp randevu', '64', '+21%'), ('Reklam harcaması', '₺9.800', ''), ('Müşteri başı maliyet', '₺46', '-17%')]
        for i, (a, v, d) in enumerate(kp):
            y = h - 84 - i * 40
            txt(c, a, rx + 9, y + 14, 6.8, 'S', MUTE)
            txt(c, v, rx + 9, y - 3, 13, 'S-B', NAVY)
            if d:
                txt(c, d, rx + rw - 9, y - 2, 8, 'S-B', GREEN if d[0] in '+-' and d[0] != '-' else GREEN, 'r')
        # mini grafik
        gx, gy, gwid, gh = rx + 9, 20, rw - 18, 36
        c.setStrokeColor(BLUE)
        c.setLineWidth(1.6)
        pts = [0.2, 0.3, 0.28, 0.45, 0.5, 0.62, 0.8]
        p = c.beginPath()
        for i, v in enumerate(pts):
            x, y = gx + gwid * i / (len(pts) - 1), gy + gh * v
            p.moveTo(x, y) if i == 0 else p.lineTo(x, y)
        c.drawPath(p, stroke=1, fill=0)


class Pill(Flowable):
    def __init__(self, items, color=BLUE):
        super().__init__()
        self.items, self.color = items, color

    def wrap(self, aw, ah):
        return CW, 22

    def draw(self):
        c = self.canv
        x = 0
        for t in self.items:
            w = pdfmetrics.stringWidth(t, 'S-B', 8.2) + 16
            rr(c, x, 2, w, 17, 8.5, fill=colors.HexColor('#eef3fc'), stroke=self.color, lw=0.7)
            txt(c, t, x + 8, 7, 8.2, 'S-B', NAVY)
            x += w + 5


# ── Belge ──────────────────────────────────────────────────────────────────────────────────────────
class Doc(BaseDocTemplate):
    def __init__(self, fn, title):
        super().__init__(fn, pagesize=(W, H), leftMargin=MX, rightMargin=MX, topMargin=24 * mm, bottomMargin=20 * mm,
                         title=title, author='Kodaryum AgentSpace', subject='Pazarlama modülü strateji ve ürün planı')
        fr = Frame(MX, 20 * mm, CW, H - 44 * mm, id='f', leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
        self.addPageTemplates([PageTemplate(id='cover', frames=[Frame(0, 0, W, H, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)], onPage=self.cover),
                               PageTemplate(id='body', frames=[fr], onPage=self.chrome)])
        self.toc_entries = []

    def cover(self, c, d):
        pass

    def chrome(self, c, d):
        c.saveState()
        c.setStrokeColor(LINE)
        c.setLineWidth(0.6)
        c.line(MX, H - 16 * mm, W - MX, H - 16 * mm)
        txt(c, 'KODARYUM AgentSpace', MX, H - 13 * mm, 7.8, 'S-B', NAVY)
        txt(c, 'Pazarlama Modülü · Strateji ve Ürün Planı', W - MX, H - 13 * mm, 7.8, 'S', MUTE, 'r')
        c.line(MX, 14 * mm, W - MX, 14 * mm)
        txt(c, 'Gizli · yalnızca Kodaryum kurucuları için', MX, 9.5 * mm, 7.4, 'S', MUTE)
        txt(c, str(d.page - 1), W - MX, 9.5 * mm, 8.5, 'S-B', NAVY, 'r')
        c.restoreState()

    def afterFlowable(self, f):
        if isinstance(f, Paragraph) and f.style.name in ('h1x', 'h2x'):
            lvl = 0 if f.style.name == 'h1x' else 1
            text = f.getPlainText()
            import zlib
            key = 'k%08x' % zlib.crc32(text.encode('utf-8'))
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(text, key, level=lvl, closed=lvl == 0)
            if lvl == 0:
                self.notify('TOCEntry', (lvl, text, self.page - 1, key))
            self.toc_entries.append(text)


H1X = ParagraphStyle('h1x', parent=H1)
H2X = ParagraphStyle('h2x', parent=H2)


def chapter(num, title, kicker=None):
    out = []
    ek = num.isalpha()
    out.append(Paragraph('EK' if ek else f'BÖLÜM {num}', st('k', fontName='S-B', fontSize=8.5, leading=11, textColor=ORANGE, spaceAfter=2)))
    out.append(Paragraph(title if ek else f'{num}. {title}', H1X))
    out.append(Rule(accent=ORANGE))
    out.append(Spacer(1, 6))
    return out


def sec(title):
    return Paragraph(title, H2X)
