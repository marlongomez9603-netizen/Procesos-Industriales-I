# -*- coding: utf-8 -*-
"""
Genera la guía educativa en PDF de las 4 unidades del simulador:
CDU, VDU, FCC e Hidrocraqueo.
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
    PageBreak, ListFlowable, ListItem, HRFlowable, KeepTogether
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ---------------------------------------------------------------------------
# Fuentes (Arial de Windows para soporte Unicode: subíndices, °, etc.)
# ---------------------------------------------------------------------------
FONTS = "C:/Windows/Fonts/"
def reg(name, fname):
    try:
        pdfmetrics.registerFont(TTFont(name, FONTS + fname))
        return True
    except Exception:
        return False

HAS_ARIAL = reg("AR", "arial.ttf") and reg("AR-B", "arialbd.ttf")
reg("AR-I", "ariali.ttf")
if HAS_ARIAL:
    pdfmetrics.registerFontFamily("AR", normal="AR", bold="AR-B", italic="AR-I", boldItalic="AR-B")
    F, FB, FI = "AR", "AR-B", "AR-I"
else:
    F, FB, FI = "Helvetica", "Helvetica-Bold", "Helvetica-Oblique"

# ---------------------------------------------------------------------------
# Paleta
# ---------------------------------------------------------------------------
NAVY   = colors.HexColor("#1f3550")
BLUE   = colors.HexColor("#2563eb")
ACCENT = colors.HexColor("#ea580c")
LIGHT  = colors.HexColor("#eef2f7")
LIGHT2 = colors.HexColor("#f6f8fb")
GREY   = colors.HexColor("#5a6470")
LINE   = colors.HexColor("#c9d2dd")

UNIT_COLORS = {
    "CDU": colors.HexColor("#2563eb"),
    "VDU": colors.HexColor("#7c3aed"),
    "FCC": colors.HexColor("#dc2626"),
    "HCK": colors.HexColor("#0d9488"),
}

# ---------------------------------------------------------------------------
# Estilos
# ---------------------------------------------------------------------------
ss = getSampleStyleSheet()
S = {}
S["title"]   = ParagraphStyle("title", fontName=FB, fontSize=26, leading=30, textColor=NAVY, alignment=TA_CENTER, spaceAfter=6)
S["subtitle"]= ParagraphStyle("subtitle", fontName=F, fontSize=13, leading=18, textColor=GREY, alignment=TA_CENTER)
S["h1"]      = ParagraphStyle("h1", fontName=FB, fontSize=18, leading=22, textColor=colors.white, spaceBefore=4, spaceAfter=8)
S["h2"]      = ParagraphStyle("h2", fontName=FB, fontSize=13, leading=17, textColor=NAVY, spaceBefore=12, spaceAfter=4)
S["body"]    = ParagraphStyle("body", fontName=F, fontSize=10.5, leading=15, textColor=colors.HexColor("#222831"), alignment=TA_JUSTIFY, spaceAfter=6)
S["bodyc"]   = ParagraphStyle("bodyc", parent=S["body"], alignment=TA_CENTER)
S["small"]   = ParagraphStyle("small", fontName=F, fontSize=9, leading=13, textColor=GREY)
S["li"]      = ParagraphStyle("li", fontName=F, fontSize=10.5, leading=14.5, textColor=colors.HexColor("#222831"))
S["liB"]     = ParagraphStyle("liB", parent=S["li"])
S["cellH"]   = ParagraphStyle("cellH", fontName=FB, fontSize=9.5, leading=12, textColor=colors.white)
S["cell"]    = ParagraphStyle("cell", fontName=F, fontSize=9.5, leading=12.5, textColor=colors.HexColor("#222831"))
S["cellb"]   = ParagraphStyle("cellb", fontName=FB, fontSize=9.5, leading=12.5, textColor=NAVY)
S["quote"]   = ParagraphStyle("quote", fontName=FI, fontSize=10, leading=14, textColor=NAVY, leftIndent=10, spaceAfter=6)
S["tip"]     = ParagraphStyle("tip", fontName=F, fontSize=10, leading=14, textColor=colors.HexColor("#1a4731"))
S["qstn"]    = ParagraphStyle("qstn", fontName=F, fontSize=10.5, leading=15, textColor=colors.HexColor("#222831"), leftIndent=4)

def band(text, color):
    """Encabezado de sección con banda de color."""
    t = Table([[Paragraph(text, S["h1"])]], colWidths=[17*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), color),
        ("LEFTPADDING", (0,0), (-1,-1), 12),
        ("RIGHTPADDING", (0,0), (-1,-1), 12),
        ("TOPPADDING", (0,0), (-1,-1), 7),
        ("BOTTOMPADDING", (0,0), (-1,-1), 7),
        ("ROUNDEDCORNERS", [4,4,4,4]),
    ]))
    return t

def bullets(items, color=BLUE):
    flow = []
    for it in items:
        flow.append(ListItem(Paragraph(it, S["li"]), value="circle"))
    return ListFlowable(flow, bulletType="bullet", start="circle", bulletColor=color,
                        leftIndent=14, bulletFontSize=7, spaceBefore=0, spaceAfter=8)

def kv_table(rows, color):
    """Tabla de 2 columnas clave/valor."""
    data = [[Paragraph(k, S["cellb"]), Paragraph(v, S["cell"])] for k, v in rows]
    t = Table(data, colWidths=[5.2*cm, 11.3*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (0,-1), LIGHT),
        ("ROWBACKGROUNDS", (1,0), (1,-1), [colors.white, LIGHT2]),
        ("LINEBELOW", (0,0), (-1,-1), 0.4, LINE),
        ("LINEAFTER", (0,0), (0,-1), 0.4, LINE),
        ("BOX", (0,0), (-1,-1), 0.6, LINE),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("LEFTPADDING", (0,0), (-1,-1), 7),
        ("RIGHTPADDING", (0,0), (-1,-1), 7),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
        ("LINEABOVE", (0,0), (-1,0), 1.2, color),
    ]))
    return t

def header_table(headers, rows, color, col_widths):
    data = [[Paragraph(h, S["cellH"]) for h in headers]]
    for r in rows:
        data.append([Paragraph(str(c), S["cell"]) for c in r])
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,0), color),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, LIGHT2]),
        ("BOX", (0,0), (-1,-1), 0.6, LINE),
        ("INNERGRID", (0,0), (-1,-1), 0.4, LINE),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("LEFTPADDING", (0,0), (-1,-1), 6),
        ("RIGHTPADDING", (0,0), (-1,-1), 6),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ]))
    return t

def callout(title, text, bg, br):
    inner = []
    inner.append(Paragraph("<b>%s</b>" % title, ParagraphStyle("ct", fontName=FB, fontSize=10.5, leading=14, textColor=br, spaceAfter=3)))
    if isinstance(text, list):
        inner.append(bullets(text, br))
    else:
        inner.append(Paragraph(text, S["tip"]))
    t = Table([[inner]], colWidths=[17*cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), bg),
        ("BOX", (0,0), (-1,-1), 0.8, br),
        ("LEFTPADDING", (0,0), (-1,-1), 12),
        ("RIGHTPADDING", (0,0), (-1,-1), 12),
        ("TOPPADDING", (0,0), (-1,-1), 9),
        ("BOTTOMPADDING", (0,0), (-1,-1), 9),
    ]))
    return t

# ---------------------------------------------------------------------------
# Plantilla con pie de página
# ---------------------------------------------------------------------------
def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(F, 8)
    canvas.setFillColor(GREY)
    canvas.drawString(2*cm, 1.1*cm, "Guía educativa · Simulador de unidades de refinería")
    canvas.drawRightString(19*cm, 1.1*cm, "Página %d" % doc.page)
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(2*cm, 1.4*cm, 19*cm, 1.4*cm)
    canvas.restoreState()

story = []
A = story.append

def H2(t): A(Paragraph(t, S["h2"]))
def P(t): A(Paragraph(t, S["body"]))
def SP(h=0.3): A(Spacer(1, h*cm))

# ===========================================================================
# PORTADA
# ===========================================================================
A(Spacer(1, 4*cm))
A(Paragraph("Procesos Industriales de Refinación", S["title"]))
A(Spacer(1, 0.2*cm))
A(Paragraph("Guía educativa de las unidades del simulador 3D", S["subtitle"]))
A(Spacer(1, 0.6*cm))
A(HRFlowable(width="40%", thickness=2, color=ACCENT, hAlign="CENTER"))
A(Spacer(1, 0.8*cm))
cover = Table([
    [Paragraph("<b>Destilación Atmosférica (CDU)</b>", S["bodyc"])],
    [Paragraph("<b>Destilación al Vacío (VDU)</b>", S["bodyc"])],
    [Paragraph("<b>Craqueo Catalítico Fluidizado (FCC)</b>", S["bodyc"])],
    [Paragraph("<b>Hidrocraqueo (Hydrocracking)</b>", S["bodyc"])],
], colWidths=[12*cm])
cover.setStyle(TableStyle([
    ("ALIGN", (0,0), (-1,-1), "CENTER"),
    ("ROWBACKGROUNDS", (0,0), (-1,-1), [LIGHT, LIGHT2]),
    ("BOX", (0,0), (-1,-1), 0.8, LINE),
    ("INNERGRID", (0,0), (-1,-1), 0.5, LINE),
    ("TOPPADDING", (0,0), (-1,-1), 8),
    ("BOTTOMPADDING", (0,0), (-1,-1), 8),
]))
A(cover)
A(Spacer(1, 3.5*cm))
A(Paragraph("Material de apoyo para uso en aula. Acompaña al visor 3D interactivo "
            "donde los estudiantes exploran cada equipo, lo seleccionan para leer su "
            "ficha técnica y usan la vista explosionada para ver su composición interna.", S["small"]))
A(PageBreak())

# ===========================================================================
# 1. INTRODUCCIÓN: LA REFINERÍA
# ===========================================================================
A(band("1. ¿Cómo encaja todo? El esquema de una refinería", NAVY))
SP(0.3)
P("Una refinería transforma el <b>petróleo crudo</b> —una mezcla de miles de hidrocarburos— "
  "en productos útiles: GLP, gasolina, kerosene/jet, diésel, bases lubricantes, asfalto y "
  "materias primas petroquímicas. Ningún equipo hace esto solo: el crudo recorre una "
  "secuencia de unidades, cada una con una función específica. Las cuatro unidades de este "
  "simulador son piezas centrales de ese recorrido.")
P("La idea clave que deben entender los estudiantes es <b>separar primero, transformar después</b>:")
A(bullets([
    "<b>Separación física</b> (no cambia las moléculas): la destilación <b>atmosférica (CDU)</b> "
    "y la <b>de vacío (VDU)</b> ordenan el crudo por punto de ebullición en cortes (naftas, "
    "kerosene, gasóleos, residuo).",
    "<b>Conversión química</b> (rompe o reordena moléculas): el <b>FCC</b> y el "
    "<b>hidrocraqueo</b> rompen las moléculas pesadas y de bajo valor en productos ligeros "
    "más valiosos como gasolina y diésel.",
], NAVY))
SP(0.2)
A(callout("Flujo simplificado del crudo en estas 4 unidades",
    "Crudo  ->  <b>CDU</b> (separa a presión atmosférica)  ->  el residuo va a la "
    "<b>VDU</b> (separa al vacío lo que no destila a presión normal)  ->  los gasóleos "
    "pesados (HVGO) y el residuo van al <b>FCC</b> y/o al <b>Hidrocraqueo</b> para "
    "convertirse en gasolina y diésel.", LIGHT, BLUE))
SP(0.2)
H2("¿Por qué se calienta tanto y se separa por temperatura?")
P("Cada hidrocarburo hierve a una temperatura distinta: cuanto más grande y pesada es la "
  "molécula, mayor es su punto de ebullición. Si calentamos el crudo y lo metemos en una "
  "<b>columna de destilación</b>, los componentes ligeros suben como vapor hasta lo alto "
  "(donde hace más frío) y los pesados se quedan abajo (donde hace más calor). A distintas "
  "alturas se extraen los <b>cortes</b>. Esto es exactamente lo que verán representado en "
  "los modelos de la CDU y la VDU.")

A(PageBreak())

# ===========================================================================
# 2. CÓMO USAR EL SIMULADOR
# ===========================================================================
A(band("2. Cómo usar el simulador 3D en clase", NAVY))
SP(0.3)
P("El visor permite manipular cada unidad y descubrir sus partes. Sugerencias de uso:")
A(header_table(
    ["Acción", "Cómo se hace", "Qué aprenden"],
    [
        ["Girar / acercar", "Arrastrar (1 dedo o clic izq.), rueda o pellizco", "Ubicar los equipos en el espacio y su tamaño relativo"],
        ["Seleccionar un equipo", "Tocar/clic sobre una pieza", "Se resalta y aparece su ficha: función y datos técnicos"],
        ["Lista de componentes", "Panel lateral 'Componentes'", "Recorrer sistemáticamente todas las partes"],
        ["Resaltar por color", "Interruptor 'Resaltar por color'", "Agrupar visualmente por categoría (columna, tubería...)"],
        ["Vista explosionada", "Deslizar el control 'Vista explosionada'", "Separar las piezas y ver la composición interna"],
    ],
    NAVY, [3.2*cm, 7.0*cm, 6.3*cm]))
SP(0.3)
A(callout("Actividad sugerida",
    ["Proyecta la unidad y pide a los estudiantes nombrar los equipos antes de seleccionarlos.",
     "Usa la <b>vista explosionada</b> en la columna para mostrar cómo se apilan secciones, "
     "platos e internos: es el mejor momento para explicar el contacto vapor-líquido.",
     "Asigna a cada grupo un corte (nafta, kerosene, diésel...) y que rastreen por dónde sale en el modelo."],
    colors.HexColor("#eafaf1"), colors.HexColor("#0d9488")))

A(PageBreak())

# ===========================================================================
# CONTENIDO POR UNIDAD
# ===========================================================================
UNITS = [
    {
        "key": "CDU", "color": UNIT_COLORS["CDU"],
        "title": "3. Unidad de Destilación Atmosférica (CDU)",
        "what": "Es la <b>primera unidad de proceso</b> de la refinería y el corazón de la separación. "
                "Recibe el crudo ya desalado y precalentado y lo separa, a una presión cercana a la "
                "atmosférica, en sus grandes familias de productos según su punto de ebullición. "
                "Todo lo demás en la refinería depende de cómo trabaje esta columna.",
        "feed": "Crudo desalado (mezcla completa de hidrocarburos).",
        "products": "Gases (a tope) y nafta ligera, nafta pesada, kerosene/jet, gasóleo ligero (LGO), "
                    "gasóleo pesado (HGO) y, por el fondo, el <b>residuo atmosférico</b> (lo que no "
                    "alcanzó a evaporarse).",
        "inside": "El crudo se calienta en el <b>horno de carga</b> hasta unos 360 °C y entra en la "
                  "<b>zona de flasheo</b> de la columna, donde se separa instantáneamente en vapor y "
                  "líquido. El vapor asciende y se va enfriando: en cada nivel condensa una fracción "
                  "distinta que se extrae como corte lateral. Esos cortes laterales pasan por pequeñas "
                  "columnas (<b>side strippers</b>) donde el vapor de stripping les quita los componentes "
                  "demasiado ligeros y ajusta su calidad. Los <b>pumparounds</b> retiran calor en puntos "
                  "intermedios para controlar el perfil de temperatura. Por la cabeza salen los vapores "
                  "más ligeros, que se condensan en el <b>sistema de cabeza</b> (condensador + tambor de "
                  "reflujo); parte del líquido vuelve como <b>reflujo</b> para mantener la separación.",
        "chem": "No hay reacción química: es <b>separación física</b> por diferencia de puntos de "
                "ebullición. La 'magia' está en el equilibrio vapor-líquido que se repite plato a plato.",
        "equip": [
            ["Horno de carga", "Aporta el calor para vaporizar parcialmente el crudo (~360 °C)."],
            ["Columna (secciones)", "Donde ocurre la separación; el diámetro crece hacia arriba para el vapor."],
            ["Platos / internos", "Generan el contacto vapor-líquido en cada etapa."],
            ["Side strippers", "Ajustan el flash point de kerosene, LGO y HGO con vapor."],
            ["Sistema de cabeza", "Condensa los vapores de tope y genera el reflujo."],
            ["Bombas de pumparound", "Recirculan y enfrían cortes para controlar la temperatura."],
        ],
        "cond": [
            ["Presión", "Cercana a la atmosférica (~1-2 bar)"],
            ["Temp. de carga", "~360 °C a la salida del horno"],
            ["Tipo de proceso", "Separación física (sin reacción)"],
            ["Producto de fondo", "Residuo atmosférico -> alimenta la VDU"],
        ],
        "explore": [
            "Selecciona el <b>horno</b> y sigue la <b>línea de transferencia</b> hasta la columna.",
            "Abre la <b>vista explosionada</b>: observa cómo se separan las secciones y aparecen los "
            "<b>platos</b> y el <b>demister</b>. Pregunta: ¿por qué hay tantos platos?",
            "Localiza los tres <b>side strippers</b> y relaciónalos con kerosene, LGO y HGO.",
            "Identifica el <b>sistema de cabeza</b> y explica qué es el reflujo.",
        ],
        "questions": [
            "¿Por qué el corte más ligero sale por arriba y el más pesado por abajo?",
            "¿Qué función cumple el reflujo? ¿Qué pasaría si lo quitáramos?",
            "¿Para qué sirve inyectar vapor en los side strippers y en el fondo?",
            "¿Por qué la parte superior de la columna tiene mayor diámetro?",
        ],
    },
    {
        "key": "VDU", "color": UNIT_COLORS["VDU"],
        "title": "4. Unidad de Destilación al Vacío (VDU)",
        "what": "Recupera más producto valioso del <b>residuo atmosférico</b>. Ese residuo todavía "
                "contiene gasóleos pesados, pero para destilarlos a presión normal habría que "
                "calentarlos tanto que las moléculas se romperían y formarían coque. La solución es "
                "trabajar <b>al vacío</b>: al bajar la presión, los hidrocarburos hierven a menor "
                "temperatura y se pueden separar sin degradarlos.",
        "feed": "Residuo atmosférico (fondo de la CDU).",
        "products": "Gasóleo ligero de vacío (LVGO), gasóleo pesado de vacío (HVGO) —cargas ideales para "
                    "FCC e hidrocraqueo— y, por el fondo, el <b>residuo de vacío</b> (asfalto / base para "
                    "fuel oil pesado o coque).",
        "inside": "El residuo se calienta en el <b>horno</b> y entra en la torre, que opera a una presión "
                  "muy baja (25-50 mm Hg) generada por un <b>sistema de eyectores de vapor</b>. Como el "
                  "volumen de vapor a baja presión es enorme, la torre es <b>'swaged'</b>: estrecha abajo "
                  "y muy ancha arriba para que el vapor circule despacio. Un <b>lecho de lavado</b> (wash "
                  "bed) evita que gotas de asfalto contaminen el HVGO. Los eyectores arrastran los gases "
                  "no condensables; entre etapas, los <b>intercondensadores</b> (enfriados con agua) "
                  "condensan el vapor y descargan al <b>sump</b> por piernas barométricas.",
        "chem": "Igual que la CDU: <b>separación física</b>. La novedad no es química sino de "
                "<b>presión</b>: el vacío permite separar sin coquizar.",
        "equip": [
            ["Horno de carga", "Calienta el residuo (400-455 °C) con inyección de vapor."],
            ["Torre swaged", "Mayor diámetro arriba para manejar gran volumen de vapor."],
            ["Lecho de lavado", "Protege la calidad del HVGO de gotas de asfalto."],
            ["Eyectores de vapor", "Generan el vacío arrastrando los no condensables."],
            ["Intercondensadores", "Condensan vapor entre etapas (agua de refrigeración)."],
            ["Sump", "Recoge el condensado y separa aceite del agua aceitosa."],
        ],
        "cond": [
            ["Presión", "Vacío profundo: 25-50 mm Hg"],
            ["Temp. de carga", "400-455 °C (750-850 °F)"],
            ["Por qué al vacío", "Para destilar sin que se forme coque"],
            ["Producto de fondo", "Residuo de vacío (asfalto / carga a coker)"],
        ],
        "explore": [
            "Compara la <b>silueta</b> de la torre con la de la CDU: nota cómo se ensancha hacia arriba.",
            "Selecciona el <b>sistema de eyectores</b> y los <b>intercondensadores</b>; explica cómo se "
            "consigue el vacío.",
            "En vista explosionada observa los <b>lechos de relleno</b> (en vez de platos): el vacío exige "
            "baja caída de presión.",
            "Sigue la línea de <b>asfalto</b> por el fondo y la de <b>vapores de cabeza</b> hacia los eyectores.",
        ],
        "questions": [
            "¿Por qué no se puede separar el residuo a presión atmosférica?",
            "¿Cómo logra el vacío que los hidrocarburos hiervan a menor temperatura?",
            "¿Por qué la torre es más ancha en la parte superior?",
            "¿Qué pasaría con el HVGO si no existiera el lecho de lavado?",
        ],
    },
    {
        "key": "FCC", "color": UNIT_COLORS["FCC"],
        "title": "5. Craqueo Catalítico Fluidizado (FCC)",
        "what": "Es la principal unidad de <b>conversión</b> y la 'fábrica de gasolina' de muchas "
                "refinerías. Toma gasóleos pesados de poco valor (como el HVGO de la VDU) y rompe sus "
                "moléculas grandes en otras más pequeñas y valiosas —sobre todo gasolina— usando un "
                "<b>catalizador</b> en forma de polvo fino que se comporta como un fluido.",
        "feed": "Gasóleo pesado de vacío (HVGO) y otros gasóleos pesados.",
        "products": "Gas combustible y GLP (con olefinas para petroquímica/alquilación), abundante "
                    "<b>gasolina (nafta de FCC)</b>, aceites de ciclo (LCO ~ diésel, HCO) y, por el fondo, "
                    "slurry/decant oil.",
        "inside": "La carga caliente entra por la base del <b>riser</b> (un tubo vertical) y se mezcla "
                  "con catalizador muy caliente que viene del regenerador. En apenas <b>2-4 segundos</b>, "
                  "mientras suben juntos, ocurre el craqueo: las moléculas grandes se rompen. Arriba, en "
                  "el <b>reactor/disengager</b>, unos <b>ciclones</b> separan el catalizador de los "
                  "vapores de producto, que van a la <b>fraccionadora principal</b>. El catalizador, ahora "
                  "cubierto de <b>coque</b> (carbón), cae al <b>stripper</b> y pasa al <b>regenerador</b>, "
                  "donde se quema ese coque con aire. Esa combustión calienta el catalizador y lo "
                  "reactiva; vuelve al riser y el ciclo se repite continuamente. El calor del coque "
                  "quemado es el que alimenta la reacción: el FCC se 'autoabastece' de energía.",
        "chem": "<b>Craqueo catalítico</b>: ruptura de enlaces C-C sobre un catalizador ácido (zeolita). "
                "Es endotérmico (consume calor), por eso necesita el catalizador caliente. El coque "
                "depositado se elimina por <b>combustión</b> en el regenerador (exotérmico).",
        "equip": [
            ["Riser", "Reactor tubular donde ocurre el craqueo en segundos."],
            ["Reactor / disengager", "Separa catalizador y vapores; aloja los ciclones."],
            ["Regenerador", "Quema el coque del catalizador y lo reactiva (680-730 °C)."],
            ["Ciclones", "Retienen las partículas de catalizador."],
            ["Líneas de catalizador", "Transportan el catalizador entre reactor y regenerador."],
            ["Fraccionadora principal", "Separa los productos craqueados en cortes."],
            ["Soplante de aire", "Suministra el aire de combustión al regenerador."],
        ],
        "cond": [
            ["Catalizador", "Zeolita en polvo fluidizado"],
            ["T del riser / reacción", "~520 °C, tiempo de residencia 2-4 s"],
            ["T del regenerador", "680-730 °C (quema de coque)"],
            ["Tipo de proceso", "Conversión catalítica (sin hidrógeno)"],
        ],
        "explore": [
            "Identifica el <b>par reactor-regenerador</b> y las dos <b>líneas de catalizador</b> que los "
            "unen: ese lazo continuo es la clave del FCC.",
            "Selecciona el <b>riser</b> y explica que la reacción dura solo segundos.",
            "Observa los <b>ciclones</b> sobre reactor y regenerador: ¿por qué hay que recuperar el catalizador?",
            "Sigue los vapores hasta la <b>fraccionadora principal</b> y nombra sus productos.",
        ],
        "questions": [
            "¿Qué le pasa al catalizador que obliga a regenerarlo continuamente?",
            "¿De dónde sale la energía que necesita la reacción de craqueo?",
            "¿Por qué el catalizador está en polvo fino y 'fluidizado'?",
            "¿Qué diferencia hay entre la nafta de FCC y la nafta de la CDU?",
        ],
    },
    {
        "key": "HCK", "color": UNIT_COLORS["HCK"],
        "title": "6. Unidad de Hidrocraqueo (Hydrocracking)",
        "what": "Es la unidad de conversión más <b>flexible</b> y de mayor calidad. Igual que el FCC rompe "
                "moléculas pesadas, pero lo hace <b>en presencia de hidrógeno a muy alta presión</b>. El "
                "hidrógeno satura las moléculas y elimina impurezas (azufre, nitrógeno), produciendo "
                "combustibles muy limpios, especialmente <b>diésel y jet de alta calidad</b>.",
        "feed": "Gasóleos de vacío (VGO) y/o aceites pesados, a veces el LCO del FCC.",
        "products": "GLP, naftas (carga a reformado), <b>kerosene/jet y diésel de excelente calidad</b> "
                    "(bajo azufre, alto número de cetano) y aceite no convertido para lubricantes.",
        "inside": "La carga se mezcla con <b>hidrógeno de reciclo</b>, se calienta en el <b>horno</b> y "
                  "pasa por dos reactores en serie de pared muy gruesa (trabajan a 150-175 bar). El "
                  "<b>reactor R-1</b> hace el <b>hidrotratamiento</b>: quita azufre y nitrógeno. El "
                  "<b>reactor R-2</b> hace el <b>hidrocraqueo</b>: rompe las moléculas sobre un catalizador "
                  "y el hidrógeno satura los fragmentos. Como las reacciones liberan calor, se inyecta "
                  "hidrógeno frío (<b>quench</b>) entre los lechos para controlar la temperatura. El "
                  "efluente se enfría en los <b>intercambiadores carga/efluente</b> y se separa: el gas "
                  "rico en hidrógeno se limpia de H2S en el <b>absorbedor de aminas</b> y el "
                  "<b>compresor de reciclo</b> lo devuelve al proceso; el líquido va al <b>fraccionador</b> "
                  "que separa los productos finales.",
        "chem": "<b>Hidrocraqueo</b>: ruptura de moléculas + <b>adición de hidrógeno</b> (hidrogenación). "
                "Catalizador bifuncional (metal + zeolita). Fuertemente <b>exotérmico</b>: de ahí el "
                "quench. El hidrógeno también hace <b>HDS/HDN</b> (quita azufre y nitrógeno).",
        "equip": [
            ["Reactor R-1 (hidrotrat.)", "Quita azufre, nitrógeno y metales de la carga."],
            ["Reactor R-2 (hidrocraqueo)", "Rompe e hidrogena las moléculas (alta presión)."],
            ["Anillos de quench", "Inyectan H2 frío entre lechos para controlar la temperatura."],
            ["Horno de carga", "Lleva la mezcla carga + H2 a la temperatura de reacción."],
            ["Intercambiadores C/E", "Recuperan calor del efluente para precalentar la carga."],
            ["Separadores HP / LP", "Separan el gas rico en H2 del líquido."],
            ["Absorbedor de aminas", "Limpia el H2S del gas de reciclo."],
            ["Compresores de H2", "De reciclo (recircula H2) y de aporte (makeup)."],
        ],
        "cond": [
            ["Presión", "Muy alta: 150-175 bar"],
            ["Temperatura", "360-420 °C"],
            ["Reactivo clave", "Hidrógeno (a presión, en exceso)"],
            ["Tipo de proceso", "Conversión catalítica con hidrógeno (exotérmica)"],
        ],
        "explore": [
            "Compara los <b>dos reactores</b>: fíjate en el espesor de pared (alta presión).",
            "Localiza los <b>anillos de quench</b> y explica por qué hay que enfriar entre lechos.",
            "Sigue el <b>lazo de hidrógeno</b> (líneas de color distinto): separador -> absorbedor de "
            "aminas -> compresor de reciclo -> de vuelta al horno.",
            "Identifica los <b>compresores</b> y el <b>fraccionador</b> de productos.",
        ],
        "questions": [
            "¿Qué dos cosas hace el hidrógeno en esta unidad además de ayudar a craquear?",
            "¿Por qué los reactores tienen paredes tan gruesas?",
            "¿Para qué sirve el quench y qué problema evita?",
            "¿Por qué el diésel del hidrocraqueo es más limpio que el del FCC?",
        ],
    },
]

def unit_section(u):
    flow = []
    flow.append(band(u["title"], u["color"]))
    flow.append(Spacer(1, 0.3*cm))
    flow.append(Paragraph("¿Qué es y para qué sirve?", S["h2"]))
    flow.append(Paragraph(u["what"], S["body"]))
    flow.append(kv_table([
        ["Carga (entra)", u["feed"]],
        ["Productos (salen)", u["products"]],
    ], u["color"]))
    flow.append(Spacer(1, 0.3*cm))
    flow.append(Paragraph("¿Qué sucede dentro?", S["h2"]))
    flow.append(Paragraph(u["inside"], S["body"]))
    flow.append(callout("La química en una frase", u["chem"], LIGHT, u["color"]))
    flow.append(Spacer(1, 0.3*cm))
    # Equipos
    flow.append(Paragraph("Equipos clave", S["h2"]))
    flow.append(header_table(["Equipo", "Función"], u["equip"], u["color"], [5.5*cm, 11*cm]))
    flow.append(Spacer(1, 0.3*cm))
    flow.append(Paragraph("Condiciones y datos de operación", S["h2"]))
    flow.append(kv_table(u["cond"], u["color"]))
    flow.append(Spacer(1, 0.3*cm))
    # Explorar en el simulador
    flow.append(callout("Explora en el simulador 3D", u["explore"], colors.HexColor("#eef4ff"), u["color"]))
    flow.append(Spacer(1, 0.3*cm))
    # Preguntas
    qitems = []
    for i, q in enumerate(u["questions"], 1):
        qitems.append(Paragraph("<b>%d.</b> %s" % (i, q), S["qstn"]))
        qitems.append(Spacer(1, 0.12*cm))
    qbox = Table([[qitems]], colWidths=[17*cm])
    qbox.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (-1,-1), colors.HexColor("#fff7ed")),
        ("BOX", (0,0), (-1,-1), 0.8, ACCENT),
        ("LEFTPADDING", (0,0), (-1,-1), 12),
        ("RIGHTPADDING", (0,0), (-1,-1), 12),
        ("TOPPADDING", (0,0), (-1,-1), 9),
        ("BOTTOMPADDING", (0,0), (-1,-1), 9),
    ]))
    flow.append(Paragraph("Preguntas para los estudiantes", S["h2"]))
    flow.append(qbox)
    return flow

for u in UNITS:
    for f in unit_section(u):
        A(f)
    A(PageBreak())

# ===========================================================================
# 7. CUADRO COMPARATIVO
# ===========================================================================
A(band("7. Cuadro comparativo de las cuatro unidades", NAVY))
SP(0.3)
P("Una vez exploradas las cuatro unidades, este cuadro ayuda a los estudiantes a "
  "organizar las diferencias esenciales:")
A(header_table(
    ["", "CDU", "VDU", "FCC", "Hidrocraqueo"],
    [
        ["Tipo", "Separación", "Separación", "Conversión", "Conversión"],
        ["¿Reacción?", "No", "No", "Sí (catalítica)", "Sí (con H2)"],
        ["Presión", "~1-2 bar", "Vacío (25-50 mmHg)", "Baja", "Muy alta (150-175 bar)"],
        ["Carga", "Crudo", "Residuo atm.", "HVGO", "VGO / pesados"],
        ["Producto estrella", "Todos los cortes", "HVGO / LVGO", "Gasolina", "Diésel / jet"],
        ["Usa hidrógeno", "No", "No", "No", "Sí"],
    ],
    NAVY, [3.0*cm, 2.9*cm, 3.6*cm, 3.0*cm, 4.0*cm]))
SP(0.5)
A(callout("Ideas para recordar",
    ["La <b>CDU y la VDU separan</b>; el <b>FCC y el hidrocraqueo transforman</b>.",
     "La <b>VDU</b> existe por una razón: el vacío evita el coquizado al destilar lo pesado.",
     "El <b>FCC</b> produce sobre todo gasolina y se autoabastece de calor quemando coque.",
     "El <b>hidrocraqueo</b> usa hidrógeno a alta presión y da los combustibles más limpios."],
    LIGHT, NAVY))

A(PageBreak())

# ===========================================================================
# 8. GLOSARIO
# ===========================================================================
A(band("8. Glosario de términos", NAVY))
SP(0.3)
GLOS = [
    ["Corte (fracción)", "Grupo de hidrocarburos que se extrae junto por tener un rango de punto de ebullición similar."],
    ["Punto de ebullición", "Temperatura a la que un líquido se convierte en vapor; aumenta con el tamaño de la molécula."],
    ["Reflujo", "Líquido condensado que se devuelve a la cabeza de la columna para mejorar la separación."],
    ["Pumparound", "Corriente que se extrae, se enfría y se reinyecta para retirar calor y controlar el perfil térmico."],
    ["Stripping", "Inyección de vapor para arrastrar y eliminar los componentes ligeros de un líquido."],
    ["Residuo atmosférico", "Fondo de la CDU; lo que no se evapora a presión atmosférica."],
    ["Residuo de vacío", "Fondo de la VDU; la fracción más pesada (asfalto)."],
    ["Catalizador", "Sustancia que acelera una reacción sin consumirse en ella."],
    ["Zeolita", "Mineral poroso ácido usado como catalizador de craqueo."],
    ["Coque", "Depósito de carbón que se forma sobre el catalizador y debe quemarse para reactivarlo."],
    ["Riser", "Tubo vertical del FCC donde ocurre el craqueo en pocos segundos."],
    ["Regeneración", "Quema del coque del catalizador para reactivarlo (y generar calor)."],
    ["Quench", "Inyección de fluido frío (H2) entre lechos para controlar la temperatura de reacción."],
    ["HDS / HDN", "Hidrodesulfuración / hidrodesnitrogenación: eliminación de azufre y nitrógeno con hidrógeno."],
    ["Endotérmico / Exotérmico", "Reacción que consume calor / que libera calor."],
    ["Eyector de vapor", "Dispositivo que genera vacío arrastrando gases con un chorro de vapor."],
    ["HVGO / LVGO", "Gasóleo pesado / ligero de vacío (productos de la VDU)."],
    ["LCO", "Light Cycle Oil: corte tipo diésel producido por el FCC."],
]
gdata = [[Paragraph("<b>Término</b>", S["cellH"]), Paragraph("<b>Definición</b>", S["cellH"])]]
for k, v in GLOS:
    gdata.append([Paragraph(k, S["cellb"]), Paragraph(v, S["cell"])])
gt = Table(gdata, colWidths=[4.3*cm, 12.2*cm], repeatRows=1)
gt.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), NAVY),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, LIGHT2]),
    ("BOX", (0,0), (-1,-1), 0.6, LINE),
    ("INNERGRID", (0,0), (-1,-1), 0.4, LINE),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("LEFTPADDING", (0,0), (-1,-1), 6),
    ("RIGHTPADDING", (0,0), (-1,-1), 6),
    ("TOPPADDING", (0,0), (-1,-1), 4),
    ("BOTTOMPADDING", (0,0), (-1,-1), 4),
]))
A(gt)

# ---------------------------------------------------------------------------
# Construir documento
# ---------------------------------------------------------------------------
OUT = "Guia_Educativa_Unidades_Refineria.pdf"
doc = BaseDocTemplate(OUT, pagesize=A4,
                      leftMargin=2*cm, rightMargin=2*cm, topMargin=1.8*cm, bottomMargin=1.8*cm,
                      title="Guía educativa - Unidades de refinería",
                      author="Simulador de Procesos Industriales")
frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
doc.addPageTemplates([PageTemplate(id="tpl", frames=[frame], onPage=footer)])
doc.build(story)
print("PDF generado:", os.path.abspath(OUT))
