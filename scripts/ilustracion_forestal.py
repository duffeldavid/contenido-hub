import math, random, re, sys
R = random.Random(7)
W, H = 1080, 1920
INK, BG = '#343A1D', '#F7E4CA'
out = []
def add(s): out.append(s)
def g(a, b): return R.uniform(a, b)

# ---------- geometry helpers ----------
def cr_sample(pts, n=10):
    """Catmull-Rom sample through pts (tuples of any dim)."""
    if len(pts) < 3: return list(pts)
    P = [pts[0]] + list(pts) + [pts[-1]]
    res = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i-1], P[i], P[i+1], P[i+2]
        for k in range(n):
            t = k / n
            res.append(tuple(0.5 * ((2*b) + (-a+c)*t + (2*a-5*b+4*c-d)*t*t + (-a+3*b-3*c+d)*t**3)
                             for a, b, c, d in zip(p0, p1, p2, p3)))
    res.append(pts[-1])
    return res

def path(pts, closed=False):
    """Smooth bezier path through points."""
    n = len(pts)
    if n < 2: return ''
    d = 'M%.1f,%.1f' % pts[0][:2]
    for i in range(n - 1 if not closed else n):
        p0 = pts[(i-1) % n] if (closed or i > 0) else pts[i]
        p1 = pts[i % n]; p2 = pts[(i+1) % n]
        p3 = pts[(i+2) % n] if (closed or i + 2 < n) else p2
        c1 = (p1[0] + (p2[0]-p0[0])/6, p1[1] + (p2[1]-p0[1])/6)
        c2 = (p2[0] - (p3[0]-p1[0])/6, p2[1] - (p3[1]-p1[1])/6)
        d += 'C%.1f,%.1f %.1f,%.1f %.1f,%.1f' % (c1 + c2 + tuple(p2[:2]))
    return d + ('Z' if closed else '')

def line(pts, w=3, fill='none', closed=False, stroke=INK, extra=''):
    add('<path d="%s" fill="%s" stroke="%s" stroke-width="%.1f" stroke-linecap="round" stroke-linejoin="round" %s/>'
        % (path(pts, closed), fill, stroke, w, extra))

def limb(ctrl, fill=BG, sw=3, shade=0, ticks=0):
    """Tapered trunk/branch. ctrl = [(x,y,width),...]"""
    pts = cr_sample(ctrl, 8)
    L, Rr, S = [], [], []
    for i, (x, y, w) in enumerate(pts):
        a = pts[min(i+1, len(pts)-1)]; b = pts[max(i-1, 0)]
        dx, dy = a[0]-b[0], a[1]-b[1]; m = math.hypot(dx, dy) or 1
        nx, ny = -dy/m, dx/m
        j = g(-.06, .06) * w
        L.append((x + nx*(w/2+j), y + ny*(w/2+j)))
        Rr.append((x - nx*(w/2-j), y - ny*(w/2-j)))
        S.append((x - nx*w*(.5-shade)*g(.75, 1.2), y - ny*w*(.5-shade)*g(.75, 1.2)))
    poly = L + Rr[::-1]
    add('<path d="%s" fill="%s" stroke="%s" stroke-width="%.1f" stroke-linejoin="round"/>' % (path(L) + 'L' + path(Rr[::-1])[1:] + 'Z', fill, INK, sw))
    if shade:
        add('<path d="%s" fill="%s"/>' % (path(Rr) + 'L' + path(S[::-1])[1:] + 'Z', INK))
    for _ in range(ticks):
        i = R.randrange(2, len(pts)-2); x, y, w = pts[i]
        if w < 7: continue
        o = g(-.25, .4) * w; l = g(.04, .13) * w + 3
        add('<path d="M%.1f,%.1f q%.1f,%.1f %.1f,%.1f" fill="none" stroke="%s" stroke-width="%.1f" stroke-linecap="round"/>'
            % (x+o-l, y+g(-2, 2), l, g(-2.5, 2.5), 2*l, g(-2, 2), INK, min(3, 1.4 + w/40)))
    return pts

def blob_pts(cx, cy, rx, ry, rough=.1, rot=0):
    per = math.pi * (rx + ry)
    n = max(7, int(per / 30))
    pts = []
    for i in range(n):
        a = 2*math.pi*i/n + g(-.12, .12)
        r = 1 + R.gauss(0, rough)
        x, y = rx*r*math.cos(a), ry*r*math.sin(a)
        pts.append((cx + x*math.cos(rot) - y*math.sin(rot), cy + x*math.sin(rot) + y*math.cos(rot)))
    return pts

def scallop(pts, c, bump=9):
    d = 'M%.1f,%.1f' % pts[0]
    n = len(pts)
    for i in range(n):
        a, b = pts[i], pts[(i+1) % n]
        mx, my = (a[0]+b[0])/2, (a[1]+b[1])/2
        vx, vy = mx-c[0], my-c[1]; m = math.hypot(vx, vy) or 1
        k = bump * g(.6, 1.5)
        d += 'Q%.1f,%.1f %.1f,%.1f' % (mx + vx/m*k, my + vy/m*k, b[0], b[1])
    return d + 'Z'

def cluster(cx, cy, rx, ry, sw=2.6, marks=None, dark=.25, rot=0):
    """Leafy mass: union of lumpy sub-blobs, dark underside, leaf-blot texture."""
    k = max(2, int(rx / 26))
    subs = []
    for i in range(k):
        t = (i + .5) / k * 2 - 1
        sx = cx + t * rx * .72 + g(-6, 6)
        sy = cy + g(-.35, .35) * ry - (1 - t*t) * ry * .25
        srx = rx * g(.36, .5) * (1.15 - .3*abs(t)); sry = ry * g(.6, .85)
        pts = blob_pts(sx, sy, srx, sry, rough=.15)
        subs.append((scallop(pts, (sx, sy), bump=g(5, 9)), sx, sy, srx, sry))
    if dark:
        ox, oy = g(-3, 5), ry*dark + 3
        for d, *_ in subs:
            add('<path d="%s" fill="%s" transform="translate(%.1f,%.1f)"/>' % (d, INK, ox, oy))
    for d, *_ in subs:
        add('<path d="%s" fill="%s" stroke="%s" stroke-width="%.1f" stroke-linejoin="round"/>' % (d, INK, INK, sw*2))
    for d, *_ in subs:
        add('<path d="%s" fill="%s"/>' % (d, BG))
    n = marks if marks is not None else int(rx*ry/120)
    for _ in range(n):
        d, sx, sy, srx, sry = R.choice(subs)
        a = g(0, 2*math.pi); r = math.sqrt(g(0, 1)) * .7
        x, y = sx + srx*r*math.cos(a), sy + sry*r*math.sin(a)
        s = g(4, 9)
        if R.random() < (.6 if y > sy else .15):   # solid leaf-shadow blot
            bp = blob_pts(x, y, s*1.4, s*.75, rough=.25, rot=g(-.6, .6))
            add('<path d="%s" fill="%s"/>' % (scallop(bp, (x, y), 3), INK))
        else:
            add('<path d="M%.1f,%.1f q%.1f,%.1f %.1f,%.1f" fill="none" stroke="%s" stroke-width="2" stroke-linecap="round"/>'
                % (x, y, s*.5, -s*g(.5, 1), s*g(1, 1.6), g(-2, 3), INK))

def bare(x, y, ang, ln, w, depth, tips, bias=-90, spread=30):
    """Recursive bare branch; returns via tips list."""
    steps = max(2, int(ln/22)); ctrl = [(x, y, w)]
    a = ang
    for i in range(steps):
        a += g(-9, 9) + (bias - a) * .06
        x += math.cos(math.radians(a)) * ln/steps
        y += math.sin(math.radians(a)) * ln/steps
        ctrl.append((x, y, w * (1 - .45*(i+1)/steps)))
    if w > 5.5: limb(ctrl, sw=2.4)
    else: limb(ctrl, fill=INK, sw=.6)
    if depth <= 0 or w < 1.6:
        tips.append((x, y)); return
    for s in ([-1, 1] if R.random() < .85 else [R.choice([-1, 1])]):
        bare(x, y, a + s*g(spread*.5, spread*1.2), ln*g(.6, .8), w*.55*g(.85, 1.1), depth-1, tips, bias, spread)
    if R.random() < .6:
        mx, my, mw = ctrl[len(ctrl)//2]
        bare(mx, my, a + R.choice([-1, 1])*g(30, 55), ln*g(.4, .6), mw*.45, depth-2, tips, bias, spread)

def tuft(x, y, s=1.0, n=None):
    n = n or R.randint(3, 6)
    for i in range(n):
        a = math.radians(-90 + g(-38, 38)); l = g(14, 34) * s; wb = g(2.5, 4.5) * s
        tx, ty = x + math.cos(a)*l, y + math.sin(a)*l
        bx = x + g(-7, 7) * s
        add('<path d="M%.1f,%.1f Q%.1f,%.1f %.1f,%.1f Q%.1f,%.1f %.1f,%.1f Z" fill="%s"/>'
            % (bx-wb, y, bx-wb*.3 + (tx-bx)*.3, y-l*.5, tx, ty, bx+wb*.6 + (tx-bx)*.4, y-l*.45, bx+wb, y, INK))

def leaf(x, y, ang, ln, wd, shade=False, sw=2.6, veins=True):
    """Coffee leaf from base (x,y) pointing at ang degrees."""
    a = math.radians(ang); ca, sa = math.cos(a), math.sin(a)
    def T(u, v): return (x + u*ca - v*sa, y + u*sa + v*ca)
    bend = g(-.12, .12) * ln
    tip = T(ln, bend)
    c1, c2 = T(ln*.3, -wd*1.05), T(ln*.78, -wd*.75 + bend)
    c3, c4 = T(ln*.78, wd*.75 + bend), T(ln*.3, wd*1.05)
    mid = T(ln*.5, bend*.45)
    f = lambda p: '%.1f,%.1f' % p
    d = 'M%s C%s %s %s C%s %s %s Z' % (f((x, y)), f(c1), f(c2), f(tip), f(c3), f(c4), f((x, y)))
    add('<path d="%s" fill="%s" stroke="%s" stroke-width="%.1f" stroke-linejoin="round"/>' % (d, BG, INK, sw))
    if shade:
        add('<path d="M%s C%s %s %s Q%s %s Z" fill="%s"/>' % (f((x, y)), f(c4), f(c3), f(tip), f(mid), f((x, y)), INK))
    add('<path d="M%s Q%s %s" fill="none" stroke="%s" stroke-width="%.1f" stroke-linecap="round"/>' % (f((x, y)), f(mid), f(tip), INK, sw*.8))
    if veins and ln > 60:
        for k in range(1, 5):
            t = k/5.2
            p = T(ln*t, bend*t*t)
            q = T(ln*(t+.16), -wd*.62*math.sin(math.pi*min(1, t+.1)) + bend*t)
            add('<path d="M%s L%s" fill="none" stroke="%s" stroke-width="1.7" stroke-linecap="round"/>' % (f(p), f(q), INK))
            if not shade:
                q2 = T(ln*(t+.16), wd*.62*math.sin(math.pi*min(1, t+.1)) + bend*t)
                add('<path d="M%s L%s" fill="none" stroke="%s" stroke-width="1.7" stroke-linecap="round"/>' % (f(p), f(q2), INK))

def cherries(x, y, n, r=11):
    for i in range(n):
        a = 2*math.pi*i/max(1, n-1) + g(-.3, .3); d = g(r*1.2, r*1.9) if i else 0
        cx, cy = x + math.cos(a)*d, y + math.sin(a)*d*.9
        add('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s" stroke="%s" stroke-width="2.6"/>' % (cx, cy, r*g(.85, 1.1), BG, INK))
        add('<path d="M%.1f,%.1f q3,-2 6,0" fill="none" stroke="%s" stroke-width="1.8" stroke-linecap="round"/>' % (cx-3, cy+r*.35, INK))

def coffee_branch(pts, n_nodes, ln, wd, start=.15, cher=True, flip=1):
    sp = cr_sample(pts, 12)
    line(sp, 4)
    for k in range(n_nodes):
        t = start + (1-start) * k / max(1, n_nodes-1)
        i = min(len(sp)-2, int(t*(len(sp)-1)))
        x, y = sp[i]; ang = math.degrees(math.atan2(sp[i+1][1]-y, sp[i+1][0]-x))
        s = 1 - .3*t
        leaf(x, y, ang - g(48, 72), ln*s*g(.85, 1.1), wd*s, shade=R.random() < .35)
        leaf(x, y, ang + g(48, 72), ln*s*g(.85, 1.1), wd*s, shade=R.random() < .55)
        if cher and k < n_nodes-1: cherries(x + g(-6, 6), y + 6*flip, R.randint(4, 6), r=10*s+3)
    x, y = sp[-1]
    leaf(x, y, math.degrees(math.atan2(y-sp[-3][1], x-sp[-3][0])), ln*.7, wd*.65)

def bush(cx, cy, rx, ry, n, ln=58, wd=15):
    """Mid-ground coffee shrub: dark core + radiating leaves."""
    bp = blob_pts(cx, cy + ry*.1, rx*.92, ry*.9)
    add('<path d="%s" fill="%s"/>' % (scallop(bp, (cx, cy), 8), INK))
    L = []
    for _ in range(n):
        a = g(0, 2*math.pi); r = math.sqrt(g(0, 1))
        x, y = cx + rx*r*math.cos(a)*.85, cy + ry*r*math.sin(a)*.85
        out_ang = math.degrees(math.atan2(y-cy + ry*.3, x-cx)) + g(-35, 35)
        L.append((y, x, out_ang))
    for y, x, a in sorted(L):
        leaf(x, y, a, ln*g(.7, 1.15), wd*g(.8, 1.1), shade=R.random() < .3, sw=2.2, veins=False)

# ================= SCENE =================
add('<rect width="%d" height="%d" fill="%s"/>' % (W, H, BG))

# --- distant hills through the gap ---
line(cr_sample([(330, 1345), (400, 1318), (470, 1300), (540, 1312), (640, 1296), (720, 1325)], 6), 2.4)
line(cr_sample([(380, 1362), (450, 1340), (520, 1350), (600, 1338), (680, 1356)], 6), 2)
for _ in range(14):
    x = g(400, 660); y = g(1325, 1350)
    add('<path d="M%.1f,%.1f l%.1f,%.1f" stroke="%s" stroke-width="1.8" stroke-linecap="round"/>' % (x, y, g(8, 18), g(-3, 3), INK))

# --- tall canopy tree (centre-right, far) ---
tips = []
tr = limb([(668, 1400, 20), (664, 1100, 17), (656, 800, 14), (650, 560, 12), (648, 400, 10)], ticks=26)
for (bx, by, a, ln, w) in [(648, 410, -112, 170, 9), (650, 420, -62, 200, 9), (652, 560, -142, 160, 7), (654, 600, -38, 190, 8),
                           (656, 780, -150, 150, 6), (658, 820, -35, 140, 6), (648, 405, -88, 170, 8)]:
    bare(bx, by, a, ln, w, 2, tips, bias=a*.5 - 45, spread=34)
tips.sort(key=lambda p: p[1])
for (x, y) in tips:
    if x < 720 and y < 520: x = 720 + g(0, 50)
    cluster(x + g(-10, 10), y + g(-8, 4), g(55, 95), g(20, 32), dark=.35)

# --- second tall slim tree, right ---
tips2 = []
limb([(905, 1400, 26), (880, 1050, 22), (842, 700, 18), (808, 380, 14), (786, 150, 11), (776, -20, 9)], ticks=34)
for (bx, by, a, ln, w) in [(800, 300, -40, 170, 8), (812, 420, -150, 150, 7), (822, 520, -30, 150, 7), (790, 190, -135, 130, 6), (846, 730, -28, 120, 6)]:
    bare(bx, by, a, ln, w, 2, tips2, bias=a*.5 - 45, spread=32)
tips2.sort(key=lambda p: p[1])
for (x, y) in tips2:
    cluster(x + g(-8, 8), y + g(-6, 4), g(50, 84), g(19, 30), dark=.35)

# --- bare trees, left ---
t = []
limb([(52, 1440, 30), (70, 1150, 26), (100, 850, 21), (112, 600, 17), (104, 380, 13)], ticks=30)
bare(104, 385, -108, 170, 12, 4, t, bias=-112, spread=22)
bare(108, 560, -55, 150, 9, 3, t, bias=-60, spread=22)
bare(100, 700, -125, 170, 8, 3, t, bias=-105, spread=26)
limb([(215, 1440, 22), (224, 1200, 19), (236, 960, 15), (252, 760, 12), (262, 640, 10)], ticks=20)
bare(262, 645, -80, 120, 9, 3, t, bias=-84, spread=24)
bare(250, 780, -128, 130, 6, 2, t, bias=-110, spread=24)
bare(240, 900, -48, 130, 6, 2, t, bias=-65, spread=24)
limb([(-6, 1300, 22), (4, 900, 18), (-2, 500, 15), (14, 200, 12), (40, -20, 9)])
bare(8, 300, -70, 120, 7, 2, t, bias=-95, spread=22)

# --- understory: layered small trees ---
trees = []
for x in [20, 120, 190, 290, 345, 415, 500, 560, 610, 720, 770, 840, 960, 1040, 150, 460, 680, 900]:
    trees.append((x + g(-18, 18), g(860, 1230)))
trees.sort(key=lambda p: p[1])           # higher crowns = further back
for (x, top) in trees:
    lean = g(-40, 40); w = g(8, 13)
    limb([(x, 1450, w), (x + lean*.3, 1300, w*.9), (x + lean*.7, (1300+top)/2, w*.75), (x + lean, top, w*.5)], sw=2.2, ticks=5)
    tx = x + lean
    for s in (-1, 1):
        ex, ey = tx + s*g(40, 75), top - g(10, 50)
        line(cr_sample([(tx, top + 40), (tx + s*14, top + 5), (ex, ey)], 5), 2.6)
    k = R.randint(2, 5)
    cl = [(tx + g(-90, 90), top + g(-60, 40), g(45, 105), g(24, 46)) for _ in range(k)]
    for (cx, cy, rx, ry) in sorted(cl, key=lambda c: c[1]):
        cluster(cx, cy, rx, ry, dark=.3)

# dark shrub band behind the ground line (leaves the centre gap light)
for (x0, x1) in [(-30, 400), (560, 1110)]:
    x = x0
    while x < x1:
        rx = g(45, 80)
        bp = blob_pts(x, 1425 + g(-14, 10), rx, g(34, 56))
        add('<path d="%s" fill="%s"/>' % (scallop(bp, (x, 1430), 9), INK))
        x += rx * 1.1
for _ in range(60):
    x = R.choice([g(0, 390), g(570, 1080)]); y = g(1385, 1440); s = g(5, 10)
    add('<path d="M%.1f,%.1f q%.1f,%.1f %.1f,%.1f" fill="none" stroke="%s" stroke-width="2.2" stroke-linecap="round"/>' % (x, y, s*.5, -s, s*1.5, 0, BG))

# --- ground ---
ground = cr_sample([(-20, 1452), (120, 1436), (260, 1452), (400, 1474), (500, 1490), (600, 1484), (760, 1470), (900, 1476), (1100, 1462)], 8)
add('<path d="%s L%d,%d L-20,%d Z" fill="%s" stroke="%s" stroke-width="3"/>' % (path(ground), W+20, H+20, H+20, BG, INK))
# path edges
pl = cr_sample([(505, 1496), (470, 1560), (380, 1660), (250, 1790), (150, 1930)], 10)
pr = cr_sample([(560, 1494), (600, 1550), (690, 1640), (800, 1760), (880, 1930)], 10)
for P in (pl, pr):
    add('<path d="%s" fill="none" stroke="%s" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="26 16 9 18"/>' % (path(P), INK))
# tyre-track dashes inside the path
for i in range(46):
    y = g(1510, 1900); k = (y - 1490) / 430
    cxm = 532 - 20*k
    x = cxm + g(-1, 1) * (30 + 240*k)
    l = (8 + 30*k) * g(.6, 1.3)
    add('<path d="M%.1f,%.1f q%.1f,%.1f %.1f,%.1f" fill="none" stroke="%s" stroke-width="%.1f" stroke-linecap="round"/>' % (x, y, l/2, g(-2, 2), l, g(-3, 3), INK, 1.6 + k))
# grass tufts, denser on the banks
for i in range(120):
    y = g(1470, 1900); k = (y - 1460) / 440
    if R.random() < .75:
        x = R.choice([g(-10, 500 - 330*k), g(570 + 290*k, 1090)])
    else:
        x = g(500 - 330*k, 570 + 290*k)
    tuft(x, y, s=.45 + 1.1*k)

# --- big foreground trunk, right edge ---
limb([(1058, 1500, 150), (1052, 1200, 138), (1040, 800, 124), (1022, 400, 112), (1000, 100, 100), (990, -40, 96)], sw=3.2, shade=.2, ticks=70)
bare(962, 760, -150, 110, 7, 2, [], bias=-120, spread=26)

# --- coffee shrubs, right mid-ground ---
for (cx, cy, rx, ry, n) in [(760, 1470, 90, 60, 26), (900, 1440, 110, 85, 40), (1030, 1500, 100, 110, 44), (860, 1570, 95, 62, 30), (1000, 1650, 110, 85, 40)]:
    bush(cx, cy, rx, ry, n)
cherries(905, 1470, 4, 7); cherries(1010, 1560, 5, 7); cherries(835, 1585, 3, 7)
# left bank shrubs
for (cx, cy, rx, ry) in [(60, 1470, 90, 40), (210, 1482, 75, 30), (330, 1492, 55, 22)]:
    cluster(cx, cy, rx, ry, dark=.3)
for _ in range(16): tuft(g(-10, 380), g(1500, 1560), s=g(.7, 1.1))

# --- foreground coffee branches ---
coffee_branch([(1110, 1900), (960, 1820), (820, 1790), (690, 1720)], 5, 150, 40, start=.12)
coffee_branch([(1100, 1700), (1000, 1730), (930, 1760)], 2, 110, 30, start=.5, cher=False)
coffee_branch([(-30, 1880), (90, 1800), (190, 1790), (300, 1735)], 4, 125, 34, start=.2)
for _ in range(7): tuft(g(380, 640), g(1850, 1930), s=g(1.3, 1.8))

# --- birds ---
for (x, y, s) in [(560, 250, 1.0), (500, 300, .7), (330, 610, .8)]:
    add('<path d="M%.1f,%.1f q%.1f,%.1f %.1f,%.1f q%.1f,%.1f %.1f,%.1f" fill="none" stroke="%s" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
        % (x, y, 10*s, -12*s, 20*s, 2*s, 8*s, -14*s, 22*s, -10*s, INK))

# --- logo (traced from the brand's vector file) ---
svg = open(sys.argv[1]).read()
paths = re.findall(r'<path d="([^"]+)"', svg, re.S)
LW = 380; sc = LW / 1956.0; lx, ly = 118, 100
inner = ''.join('<path d="%s"/>' % p.replace('\n', ' ') for p in paths)
tf = 'translate(%d,%d) scale(%.5f) translate(0,1493) scale(0.1,-0.1)' % (lx, ly, sc)
add('<g transform="%s" fill="%s" stroke="%s" stroke-width="620" stroke-linejoin="round">%s</g>' % (tf, BG, BG, inner))
add('<g transform="%s" fill="%s" fill-rule="evenodd">%s</g>' % (tf, INK, inner))

open(sys.argv[2], 'w').write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d">\n%s\n</svg>\n' % (W, H, W, H, '\n'.join(out)))
print(len(out), 'elements')
