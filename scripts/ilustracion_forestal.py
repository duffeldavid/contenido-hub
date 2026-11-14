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


def leaflet(x, y, s, rot, col=INK):
    add('<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="%s" transform="rotate(%.0f %.1f %.1f)"/>' % (x, y, s, s*.45, col, rot, x, y))

LOGO = (540, 40, 1010, 330)   # keep-clear box for the logo
def in_logo(x, y, m=30):
    return LOGO[0]-m < x < LOGO[2]+m and LOGO[1]-m < y < LOGO[3]+m

def spray(x, y, r=60, n=18, s=(4.5, 8)):
    """Airy feathery foliage: fine twigs + loose leaflets."""
    if in_logo(x, y): return
    for _ in range(3):
        a = g(0, 2*math.pi); l = r*g(.4, .9)
        add('<path d="M%.1f,%.1f q%.1f,%.1f %.1f,%.1f" fill="none" stroke="%s" stroke-width="1.5" stroke-linecap="round"/>'
            % (x, y, math.cos(a)*l*.5 + g(-6, 6), math.sin(a)*l*.5 + g(-6, 6), math.cos(a)*l, math.sin(a)*l*.7, INK))
    for _ in range(n):
        px, py = x + R.gauss(0, r*.5), y + R.gauss(0, r*.36)
        if in_logo(px, py, 8): continue
        if R.random() < .12:
            bp = blob_pts(px, py, g(9, 16), g(6, 10), rough=.2)
            add('<path d="%s" fill="%s" stroke="%s" stroke-width="1.8"/>' % (scallop(bp, (px, py), 3), BG, INK))
        else:
            leaflet(px, py, g(*s), g(-50, 50))

def frond(x, y, ang, L, col=INK, lw=2.4, ll=13):
    a = math.radians(ang); bend = g(-.25, .25)
    pts = []
    for i in range(int(L/9) + 1):
        t = i*9
        aa = a + bend*t/L
        pts.append((x + math.cos(aa)*t, y + math.sin(aa)*t, math.degrees(aa)))
    line([p[:2] for p in pts], lw*.7, stroke=col)
    for i, (px, py, d) in enumerate(pts[1:]):
        k = ll * (1 - .5*i/len(pts))
        for sgn in (-1, 1):
            r = math.radians(d + sgn*62)
            leaflet(px + math.cos(r)*k*.55, py + math.sin(r)*k*.55, k*.6, d + sgn*62, col)

def weed(x, y, s=1.0):
    for a in sorted([g(-170, -10) for _ in range(R.randint(5, 7))], key=lambda v: abs(v + 90), reverse=True):
        leaf(x, y, a, 52*s*g(.8, 1.2), 14*s, shade=R.random() < .3, sw=2.2, veins=False)

# ================= SCENE (referencia: video de la finca) =================
add('<rect width="%d" height="%d" fill="%s"/>' % (W, H, BG))

# --- distant airy trees (far left and behind the path) ---
for (x, y0, y1) in [(40, 1000, 640), (300, 1100, 800), (430, 1120, 850), (560, 1130, 900), (640, 1140, 960)]:
    lean = g(-25, 25)
    limb([(x, y0, 7), (x + lean*.5, (y0+y1)/2, 5.5), (x + lean, y1 + 40, 4)], sw=1.8)
    tp = []
    for a in (-150, -120, -90, -60, -30):
        bare(x + lean, y1 + 45, a + g(-8, 8), g(70, 110), 3.2, 1, tp, bias=a*.4 - 50, spread=28)
    for (tx, ty) in tp: spray(tx, ty, r=g(40, 60), n=R.randint(9, 14), s=(3.5, 6))

# --- leaning tree, centre ---
tp = []
limb([(705, 1180, 27), (690, 1000, 24), (672, 880, 22), (630, 790, 18), (580, 700, 15), (520, 600, 12), (450, 480, 9), (400, 380, 7)], sw=2.6, ticks=8)
limb([(676, 895, 15), (686, 820, 14), (668, 740, 12), (624, 640, 10), (590, 540, 8), (575, 470, 6)], sw=2.4)
for (bx, by, a, ln, w) in [(520, 600, -65, 150, 6), (450, 480, -105, 130, 5), (580, 700, -35, 140, 6), (624, 640, -75, 130, 5),
                           (400, 380, -110, 110, 4), (575, 470, -80, 110, 4), (630, 790, -160, 120, 5)]:
    bare(bx, by, a, ln, w, 2, tp, bias=a*.5 - 45, spread=30)
for (tx, ty) in tp: spray(tx, ty, r=g(50, 75), n=R.randint(14, 22))

# --- twin-trunk shade tree, left ---
tp = []
limb([(128, 990, 44), (125, 760, 40), (132, 520, 36), (138, 330, 31), (140, 150, 25), (118, -20, 19)], sw=3, ticks=10)
limb([(250, 292, 22), (300, 205, 19), (400, 135, 15), (510, 70, 11), (590, 0, 8)], sw=2.8)
limb([(246, 295, 19), (254, 150, 15), (240, -20, 11)], sw=2.8)
limb([(186, 990, 46), (205, 760, 42), (225, 560, 40), (238, 400, 34), (250, 270, 27)], sw=3, ticks=10)
for yy in (548, 556):   # knot ring on the right stem
    line([(206, yy), (226, yy + 6), (246, yy)], 2.4)
bare(118, 506, -172, 120, 7, 1, [], bias=-165, spread=22)          # dry stub
bare(206, 520, -30, 60, 6, 0, [], bias=-40)
for (bx, by, a, ln, w) in [(330, 185, -85, 150, 8), (430, 118, -50, 130, 7), (480, 88, -115, 90, 6), (254, 160, -55, 120, 7),
                           (250, 120, -125, 110, 6), (138, 330, -135, 150, 9), (140, 205, -55, 140, 8), (134, 420, -40, 120, 6),
                           (300, 205, 10, 150, 6), (128, 300, -160, 110, 6)]:
    bare(bx, by, a, ln, w, 2, tp, bias=a*.5 - 45, spread=32)
for (tx, ty) in tp: spray(tx, ty, r=g(55, 85), n=R.randint(16, 26))
for _ in range(16): spray(g(0, 520), g(20, 470), r=g(40, 60), n=R.randint(8, 14))
for _ in range(5): spray(g(1010, 1080), g(20, 330), r=45, n=10)
for _ in range(4): spray(g(600, 760), g(380, 470), r=45, n=10)

# --- mid-ground trees behind the hedge ---
for (cx, cy, rx, ry) in [(600, 1090, 70, 34), (760, 1040, 125, 55), (930, 1080, 110, 48), (1050, 1050, 80, 44), (500, 1150, 60, 30)]:
    cluster(cx, cy, rx, ry, dark=.3)
for (a, l) in [(-150, 120), (-115, 150), (-80, 140), (-40, 125), (-10, 100)]:   # young plantain
    leaf(805, 1120, a, l, 26, shade=R.random() < .4)

# --- dense dark tree, right ---
mass = [(930, 520, 170, 150), (880, 700, 200, 150), (990, 850, 150, 120), (800, 610, 110, 120), (1040, 400, 95, 95)]
for (cx, cy, rx, ry) in mass:
    add('<path d="%s" fill="%s"/>' % (scallop(blob_pts(cx, cy, rx, ry, rough=.12), (cx, cy), 10), INK))
for (cx, cy, rx, ry) in mass:
    for _ in range(int(rx*ry/1500)):
        a = g(0, 2*math.pi); r = math.sqrt(g(0, 1))*.8
        frond(cx + rx*r*math.cos(a), cy + ry*r*math.sin(a), g(110, 200), g(50, 90), col=BG, lw=2.2, ll=11)
    for _ in range(int((rx+ry)/22)):
        a = g(.45*math.pi, 1.6*math.pi)
        frond(cx + rx*.9*math.cos(a), cy + ry*.9*math.sin(a), math.degrees(a) + g(-25, 25), g(60, 110))

# --- grass lane ---
add('<path d="M565,1300 L600,1288 L1100,1478 L1100,1940 L425,1940 L540,1420 Z" fill="%s"/>' % BG)
def xl(y): return 568 - (y-1300)*.22
def xr(y): return min(1085, 600 + (y-1290)*2.67)

# --- coffee hedge along the right of the lane ---
for (cx, cy, rx, ry, n) in [(600, 1245, 46, 44, 16), (690, 1240, 70, 70, 28), (800, 1252, 95, 95, 42), (925, 1272, 115, 125, 60), (1050, 1292, 120, 160, 74)]:
    bush(cx, cy, rx, ry, n, ln=40 + rx*.28, wd=10 + rx*.07)
    for _ in range(int(rx/22)):
        cherries(cx + g(-.6, .6)*rx, cy + g(-.4, .6)*ry, R.randint(3, 5), r=3 + rx/26)

# grass: long blades + tufts, larger towards the viewer
for _ in range(300):
    y = g(1300, 1930); k = (y - 1290) / 640
    x = g(xl(y), xr(y)); l = (22 + 85*k) * g(.6, 1.2); dx = g(-.4, .4)*l
    add('<path d="M%.1f,%.1f q%.1f,%.1f %.1f,%.1f" fill="none" stroke="%s" stroke-width="%.1f" stroke-linecap="round"/>'
        % (x, y, dx*.2, -l*.6, dx, -l, INK, 1.5 + 1.2*k))
for _ in range(150):
    y = g(1310, 1930); k = (y - 1290) / 640
    tuft(g(xl(y), xr(y)), y, s=.5 + 1.3*k)
weed(645, 1445, .8); weed(870, 1615, 1.1); weed(930, 1900, 1.5); weed(700, 1760, 1.0)

# --- foreground coffee tree, left (lower trunk of the shade tree behind it) ---
limb([(118, 1440, 92), (128, 1200, 86), (152, 975, 80)], sw=3, ticks=14)
leaf(470, 1120, -8, 150, 30, shade=True)            # plantain leaves poking out
leaf(60, 1010, -120, 120, 26); leaf(40, 1180, -160, 130, 28, shade=True)
for (cx, cy, rx, ry) in [(185, 1330, 110, 150), (190, 1600, 130, 180), (170, 1840, 140, 120)]:
    add('<path d="%s" fill="%s"/>' % (scallop(blob_pts(cx, cy, rx, ry, rough=.1), (cx, cy), 12), INK))
for (cx, cy, rx, ry, n) in [(50, 1300, 95, 85, 20), (370, 1330, 95, 75, 20), (70, 1560, 95, 95, 22), (350, 1590, 105, 95, 24), (80, 1800, 105, 95, 22), (340, 1830, 105, 85, 22)]:
    bush(cx, cy, rx, ry, n, ln=84, wd=22)
bush(215, 1035, 150, 70, 34, ln=92, wd=24)          # crown
BR = [
    [(215, 1150), (120, 1170), (30, 1240), (-30, 1330)],
    [(225, 1170), (330, 1180), (430, 1240), (505, 1330)],
    [(210, 1290), (110, 1330), (30, 1420), (-20, 1520)],
    [(225, 1310), (330, 1340), (430, 1420), (500, 1530)],
    [(205, 1450), (110, 1500), (40, 1600), (0, 1700)],
    [(220, 1470), (320, 1520), (420, 1610), (475, 1730)],
    [(200, 1620), (120, 1690), (60, 1790), (30, 1900)],
    [(215, 1640), (310, 1700), (390, 1800), (430, 1920)],
]
line(cr_sample([(215, 1100), (212, 1400), (205, 1700), (195, 1940)], 8), 7)
for b in BR:
    coffee_branch(b, 5, 104, 28, start=.2)
coffee_branch([(205, 1790), (240, 1850), (290, 1900)], 2, 95, 26, start=.5)

# --- birds ---
for (x, y, s) in [(600, 420, 1.0), (665, 380, .7), (40, 470, .8)]:
    add('<path d="M%.1f,%.1f q%.1f,%.1f %.1f,%.1f q%.1f,%.1f %.1f,%.1f" fill="none" stroke="%s" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
        % (x, y, 10*s, -12*s, 20*s, 2*s, 8*s, -14*s, 22*s, -10*s, INK))

# --- logo (traced from the brand's vector file; wordmark only) ---
svg = open(sys.argv[1]).read()
paths = re.findall(r'<path d="([^"]+)"', svg, re.S)
paths = [p for p in paths if int(re.match(r'M(\d+) (\d+)', p).group(2)) > 7000]
LW = 430; sc = LW / 1956.0; lx, ly = 560, 70
inner = ''.join('<path d="%s"/>' % p.replace('\n', ' ') for p in paths)
tf = 'translate(%d,%d) scale(%.5f) translate(0,1493) scale(0.1,-0.1)' % (lx, ly, sc)
add('<g transform="%s" fill="%s" stroke="%s" stroke-width="620" stroke-linejoin="round">%s</g>' % (tf, BG, BG, inner))
add('<g transform="%s" fill="%s" fill-rule="evenodd">%s</g>' % (tf, INK, inner))

open(sys.argv[2], 'w').write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d">\n%s\n</svg>\n' % (W, H, W, H, '\n'.join(out)))
print(len(out), 'elements')
