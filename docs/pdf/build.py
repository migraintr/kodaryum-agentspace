import sys
sys.path.insert(0, '.')
from lib import *
from reportlab.platypus import NextPageTemplate
from part1 import part1
from part2 import part2, part2b
from part3 import part3, appendices


class Cover(Flowable):
    def wrap(self, *_):
        return W, H

    def draw(self):
        c = self.canv
        # arka plan: lacivert → mor degrade (şeritlerle)
        n = 60
        for i in range(n):
            t = i / (n - 1)
            r = 0x0d + (0x3b - 0x0d) * t
            g = 0x1a + (0x1d - 0x1a) * t
            b = 0x45 + (0x7a - 0x45) * t
            c.setFillColor(colors.Color(r / 255, g / 255, b / 255))
            c.rect(0, H - (i + 1) * H / n, W, H / n + 1, stroke=0, fill=1)
        # dekoratif altıgenler
        import math
        def hexa(cx, cy, r, col, a):
            c.setFillColor(colors.Color(col.red, col.green, col.blue, alpha=a))
            p = c.beginPath()
            for k in range(6):
                ang = math.pi / 6 + k * math.pi / 3
                x, y = cx + r * math.cos(ang), cy + r * math.sin(ang)
                p.moveTo(x, y) if k == 0 else p.lineTo(x, y)
            p.close()
            c.drawPath(p, stroke=0, fill=1)
        hexa(W - 40 * mm, H - 70 * mm, 62 * mm, BLUE, 0.22)
        hexa(W - 8 * mm, H - 118 * mm, 34 * mm, ORANGE, 0.28)
        hexa(W - 62 * mm, H - 128 * mm, 22 * mm, VIOLET, 0.35)
        hexa(30 * mm, 40 * mm, 40 * mm, BLUE, 0.12)
        # marka
        txt(c, 'KODARYUM', MX, H - 34 * mm, 15, 'S-B', colors.white)
        txt(c, 'AgentSpace', MX, H - 41 * mm, 10.5, 'S', colors.HexColor('#9fb3e8'))
        c.setStrokeColor(ORANGE)
        c.setLineWidth(2.5)
        c.line(MX, H - 100 * mm, MX + 24 * mm, H - 100 * mm)
        txt(c, 'STRATEJİ VE ÜRÜN PLANI', MX, H - 93 * mm, 10, 'S-B', ORANGE)
        for i, ln in enumerate(['Pazarlama Modülü:', 'İşletmenin cebindeki', 'pazarlama departmanı']):
            txt(c, ln, MX, H - (125 + i * 17) * mm, 31, 'S-B', colors.white)
        for i, ln in enumerate(['Küçük, orta ve büyük işletmelerin en büyük sorununa yapay zekâ ekibiyle',
                                'çözüm: problem, ürün, 12 modül, mimari, pazara çıkış ve yol haritası.']):
            txt(c, ln, MX, H - (190 + i * 6.2) * mm, 11.5, 'S', colors.HexColor('#c4d0f0'))
        # alt bilgi kutuları
        x = MX
        for lab, val in [('Kapsam', '16 bölüm · 5 ek'), ('Hazırlayan', 'Claude · Kodaryum ekibi için'), ('Durum', 'Taslak v1 · karar bekliyor')]:
            rr(c, x, 24 * mm, 54 * mm, 16 * mm, 6, fill=colors.Color(1, 1, 1, alpha=0.08), stroke=colors.Color(1, 1, 1, alpha=0.2))
            txt(c, lab.upper(), x + 6, 24 * mm + 9.5 * mm, 6.8, 'S-B', colors.HexColor('#9fb3e8'))
            txt(c, val, x + 6, 24 * mm + 4.2 * mm, 9, 'S-B', colors.white)
            x += 58 * mm
        txt(c, 'Gizli · yalnızca Kodaryum kurucuları için', MX, 14 * mm, 7.6, 'S', colors.HexColor('#7f93c9'))


story = [Cover(), NextPageTemplate('body'), PageBreak()]
story.append(Paragraph('İÇİNDEKİLER', st('k', fontName='S-B', fontSize=8.5, leading=11, textColor=ORANGE, spaceAfter=2)))
story.append(Paragraph('Bu belgede neler var', H1))
story.append(Rule(accent=ORANGE))
story.append(Spacer(1, 10))
toc = TableOfContents()
toc.levelStyles = [ParagraphStyle('t0', fontName='S-B', fontSize=10.5, leading=17, textColor=NAVY, leftIndent=0, rightIndent=28, firstLineIndent=0, spaceAfter=0)]
toc.dotsMinLevel = 0
story.append(toc)
story.append(Spacer(1, 12))
story.append(callout('Nasıl okunur?', ['<b>Karar vericiler:</b> 0, 2, 12, 13 ve 15. bölümler (≈ 12 sayfa).', '<b>Ürün ve tasarım:</b> 4, 5, 9 ve 10. bölümler ile Ek A.', '<b>Mühendislik:</b> 3, 7, 8 ve 13. bölümler, Ek D.', '<b>Hukuk ve uyum:</b> 5 (M10), 11. bölüm.'], 'blue'))
story.append(PageBreak())
story += part1()
story.append(PageBreak())
story += part2()
story.append(PageBreak())
story += part2b()
story.append(PageBreak())
story += part3()
story += appendices()

out = sys.argv[1] if len(sys.argv) > 1 else 'out.pdf'
doc = Doc(out, 'Kodaryum Pazarlama Modülü: Strateji ve Ürün Planı')
doc.multiBuild(story)
print('pages', doc.page, '->', out)
