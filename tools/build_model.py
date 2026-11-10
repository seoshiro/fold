"""FOLD: original procedural thin-paper sculpture. Blender 4.3+, no external assets.
Run: blender -b --python tools/build_model.py -- [--render] [--proof]
Blender axes are Z-up. glTF export converts to Y-up. Hinges use local X.
"""
import bpy, math, os, sys, json, random
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
for p in ['public/models','public/textures','public/posters','model/proof']: (ROOT/p).mkdir(parents=True,exist_ok=True)
random.seed(39)
bpy.context.preferences.edit.use_global_undo=False
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
for d in list(bpy.data.materials): bpy.data.materials.remove(d)

# Original paper texture, generated with deterministic short fibers, no image generation.
import numpy as np
N=512
rng=np.random.default_rng(219)
noise=rng.normal(0,.018,(N,N))
# A modest low-frequency mottling, with fine, strongly directional fibers.
base=np.ones((N,N,4),dtype=np.float32)
for c,v in enumerate([.89,.835,.735]): base[:,:,c]=v+noise
for _ in range(7500):
 x,y=rng.integers(0,N,2); ln=int(rng.integers(2,12)); val=float(rng.uniform(-.045,.065))
 for j in range(ln):
  yy=(y+j)%N; xx=(x+int(j*.18))%N
  base[yy,xx,:3]+=val
base[:,:,:3]=np.clip(base[:,:,:3],0,1)
img=bpy.data.images.new('FOLD original cotton fibers',width=N,height=N,alpha=True)
img.pixels.foreach_set(base.ravel());img.filepath_raw=str(ROOT/'public/textures/paper-fibers.png');img.file_format='PNG';img.save()
if (ROOT/'public/textures/higgsfield-washi-albedo.webp').exists():
 img=bpy.data.images.load(str(ROOT/'public/textures/higgsfield-washi-albedo.webp'));img.name='Approved Higgsfield washi albedo'

def mat(name,color,rough=1,paper=False):
 # Printed ink colors are specified in sRGB; Blender shader inputs are linear.
 if name not in ['Warm cotton paper','Vermilion cyclorama']:
  color=tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in color)
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=rough
 if paper:
  tex=m.node_tree.nodes.new('ShaderNodeTexImage');tex.image=img;tex.extension='REPEAT'
  m.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
  bump=m.node_tree.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.13;bump.inputs['Distance'].default_value=.013
  if (ROOT/'public/textures/higgsfield-washi-height.webp').exists():
   hm=bpy.data.images.get('Higgsfield high-pass paper height')
   if not hm:hm=bpy.data.images.load(str(ROOT/'public/textures/higgsfield-washi-height.webp'));hm.name='Higgsfield high-pass paper height';hm.colorspace_settings.name='Non-Color'
   ht=m.node_tree.nodes.new('ShaderNodeTexImage');ht.image=hm
   bump.inputs['Strength'].default_value=1;bump.inputs['Distance'].default_value=.007
   m.node_tree.links.new(ht.outputs['Color'],bump.inputs['Height'])
  else:m.node_tree.links.new(tex.outputs['Color'],bump.inputs['Height'])
  m.node_tree.links.new(bump.outputs['Normal'],bs.inputs['Normal'])
 return m
PAPER=mat('Warm cotton paper',(.89,.835,.735),paper=True)
LIGHT=mat('Paper cut edge',(.94,.88,.76));SHADE=mat('Fold interior',(.70,.615,.48));INK=mat('Warm charcoal ink',(.20,.19,.16));FAINT=mat('Faded printed paths',(.47,.405,.31));RED=mat('Oxide red ink',(.53,.14,.085));ROOF=mat('Terracotta folded roof',(.59,.255,.15));GREEN=mat('Sage paper',(.30,.365,.245));LEAF=mat('Olive paper',(.46,.47,.29));GOLD=mat('Ochre paper',(.72,.50,.19));BLUE=mat('Blue-grey river ink',(.32,.42,.44));WHITE=mat('Snow paper',(.94,.90,.81));TILE=mat('Azulejo blue',(.19,.32,.41));BLACK=mat('Window recess',(.22,.225,.20));REDLEAF=mat('Maple rust paper',(.63,.21,.11))
MATS=[PAPER,LIGHT,SHADE,INK,FAINT,RED,ROOF,GREEN,LEAF,GOLD,BLUE,WHITE,TILE,BLACK,REDLEAF]

def empty(name,parent=None,loc=(0,0,0)):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o)
 if parent:o.parent=parent
 o.location=loc
 return o
MASTER=empty('FOLD_MASTER')

def sheet(name,verts,faces=None,material=PAPER,parent=None,thick=.007):
 if faces is None:faces=[list(range(len(verts)))]
 # Solidify intentionally preserves thin edge and complete underside.
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update()
 ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);ob.data.materials.append(material);ob.data.materials.append(LIGHT)
 if parent:ob.parent=parent
 uv=me.uv_layers.new(name='Paper grain UV')
 for poly in me.polygons:
  normal=poly.normal; major=max(range(3),key=lambda i:abs(normal[i]));axes=[i for i in range(3) if i!=major]
  for li in poly.loop_indices:
   co=me.vertices[me.loops[li].vertex_index].co; uv.data[li].uv=(co[axes[0]]*1.8,co[axes[1]]*1.8)
 if thick:
  mod=ob.modifiers.new('True paper thickness','SOLIDIFY');mod.thickness=thick;mod.offset=0;mod.material_offset_rim=1;mod.use_even_offset=True
  bpy.context.view_layer.objects.active=ob;ob.select_set(True);bpy.ops.object.modifier_apply(modifier=mod.name);ob.select_set(False)
 return ob

def line(name,points,material=FAINT,width=.003,parent=None):
 cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.resolution_u=1;cu.bevel_depth=width;cu.bevel_resolution=0
 sp=cu.splines.new('POLY');sp.points.add(len(points)-1)
 for p,co in zip(sp.points,points):p.co=(*co,1)
 ob=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(ob);ob.data.materials.append(material)
 if parent:ob.parent=parent
 bpy.context.view_layer.objects.active=ob;ob.select_set(True);bpy.ops.object.convert(target='MESH');ob.select_set(False)
 return ob

def rect(name,x0,x1,y,z0,z1,material=PAPER,parent=None):return sheet(name,[(x0,y,z0),(x1,y,z0),(x1,y,z1),(x0,y,z1)],material=material,parent=parent,thick=.004)
def hinge(name,parent,loc=(0,0,0),closed=math.pi/2,delay=0):
 o=empty('HINGE_'+name,parent,loc);o['fold_axis']='x';o['fold_closed']=closed;o['fold_delay']=delay;o['fold_role']='architecture';return o

def window(parent,x,z,w=.07,h=.11,y=-.008,material=INK):
 rect('Printed window',x-w/2,x+w/2,y,z,z+h,material,parent)
 line('Window mullion',[(x,y-.002,z),(x,y-.002,z+h)],LIGHT,.002,parent)

def boxwalls(name,w,d,h,parent,material=PAPER,gable=0,roofmat=ROOF):
 # Rigid die-cut façade cards, including roof ridge, all rotate from a real baseline.
 p=hinge(name,parent,closed=math.pi/2,delay=random.uniform(.0,.12))
 verts=[(-w/2,0,0),(w/2,0,0),(w/2,0,h)]
 if gable and name!='Machiya': verts += [(0,0,h+gable)]
 verts += [(-w/2,0,h)]
 sheet(name+' front card',verts,material=material,parent=p)
 # Two additional folded paper facets give the front card a modest physical depth.
 sheet(name+' return fold',[(-w/2,0,0),(-w/2,d,0),(-w/2,d,h),(-w/2,0,h)],parent=p)
 sheet(name+' far wall',[(-w/2,d,0),(w/2,d,0),(w/2,d,h),(-w/2,d,h)],parent=p)
 sheet(name+' side return',[(w/2,0,0),(w/2,d,0),(w/2,d,h),(w/2,0,h)],parent=p)
 if gable and name=='Machiya':
  sheet('Machiya front eave',[(-w*.62,-.055,h),(w*.62,-.055,h),(w*.51,d*.5,h+gable*.55),(-w*.51,d*.5,h+gable*.55)],material=roofmat,parent=p)
  sheet('Machiya back eave',[(-w*.51,d*.5,h+gable*.55),(w*.51,d*.5,h+gable*.55),(w*.62,d+.05,h),(-w*.62,d+.05,h)],material=roofmat,parent=p)
  for k in range(9):
   xx=(k/8-.5)*w
   line('Machiya roof tile print',[(xx,-.055,h+.008),(xx,d*.5,h+gable*.55+.008)],SHADE,.002,p)
  for k in range(10):
   xx=(k/9-.5)*w*.86
   line('Machiya timber lattice',[(xx,-.014,.03),(xx,-.014,.19)],ROOF,.002,p)
 elif gable:
  sheet(name+' roof fold left',[(-w/2-.045,-.035,h),(0,-.035,h+gable),(0,d+.035,h+gable),(-w/2-.045,d+.035,h)],material=roofmat,parent=p)
  sheet(name+' roof fold right',[(0,-.035,h+gable),(w/2+.045,-.035,h),(w/2+.045,d+.035,h),(0,d+.035,h+gable)],material=roofmat,parent=p)
 else:sheet(name+' top paper',[(-w/2,0,h),(w/2,0,h),(w/2,d,h),(-w/2,d,h)],material=roofmat,parent=p)
 for iz in range(max(1,round(h/.20))):
  zz=.065+iz*.18
  if zz+.09>h:break
  for ix in range(max(2,round(w/.13))):
   x=-w/2+.075+ix*.125
   if x<w/2-.04:window(p,x,zz,w=.045,h=.075)
 rect('Printed doorway',-.045,.045,-.012,0,.14,INK,p)
 line('Base scored seam',[(-w/2,0,.003),(w/2,0,.003)],SHADE,.003,p)
 return p

# Permanent folded body, hand-placed triangular facets, hollow folded sheets not blocks.
B=empty('CRANE_body',MASTER)
A=(-1.45,-.42,.20);C=(-.38,.18,1.72);D=(.91,-.1,.76);E=(-.05,-.9,.64);F=(-.90,.65,.70)
sheet('Body facing folds',[A,C,D,E],[[0,1,3],[1,2,3]],PAPER,B)
sheet('Body far folds',[A,F,C,D],[[0,1,2],[1,3,2]],PAPER,B)
sheet('Body lower folds',[A,E,D,F],[[0,1,2],[0,2,3]],SHADE,B)
sheet('Body central pleat',[A,(-.51,-.30,1.57),(-.1,-.78,.78)],material=LIGHT,parent=B)
line('Body mountain crease',[A,C,D],SHADE,.005,B)
sheet('Chest folded peak',[A,(-.42,-.67,1.63),(.57,-.80,.67)],material=PAPER,parent=B)
sheet('Chest side return',[(-.42,-.67,1.63),(.91,-.10,.76),(.57,-.80,.67)],material=LIGHT,parent=B)
sheet('Chest inset valley',[A,(-.67,-.73,1.25),(-.42,-.67,1.63)],material=LIGHT,parent=B)
line('Chest scored central fold',[A,(-.42,-.67,1.63),(.57,-.80,.67)],SHADE,.003,B)
# Neck long side is broad but sharply tapered; head has two deliberate bevel faces.
NECK=empty('CRANE_neck',MASTER)
nb=(-1.45,-.39,.25);n1=(-1.50,-.16,1.40);n2=(-2.62,-.02,3.54);n3=(-2.89,-.13,3.59);n4=(-2.02,-.48,1.30)
sheet('Long neck face',[nb,n4,n3,n2,n1],[[0,1,4],[1,2,3,4]],PAPER,NECK)
sheet('Neck narrow folded return',[nb,(-1.39,.10,.55),(-2.49,.19,3.45),n2,n1],[[0,1,4],[1,2,3,4]],SHADE,NECK)
sheet('Neck valley face',[n3,(-2.98,.07,3.52),(-2.22,-.10,1.23),nb,n4],material=LIGHT,parent=NECK)
line('Neck central crease',[nb,n4,n3],SHADE,.004,NECK)
# Beak folded over, no eye (origami, not organic bird).
tip=(-4.03,-.20,2.55)
sheet('Beak upper face',[n3,n2,(-3.05,.13,3.51),tip],[[0,1,2],[0,2,3]],PAPER,NECK)
sheet('Beak lower face',[n3,tip,(-2.94,-.14,3.22)],material=LIGHT,parent=NECK)
sheet('Beak inner ridge',[tip,(-3.05,.13,3.51),(-2.94,-.14,3.22)],material=SHADE,parent=NECK)
# Raised tail and far wing remain the same object in every state.
TAIL=empty('CRANE_tail',MASTER)
sheet('Tail long folded sail',[(.35,.28,.83),(1.57,.40,4.18),(1.09,.55,1.12)],material=PAPER,parent=TAIL)
sheet('Tail folded return',[(.35,.28,.83),(.75,.05,1.33),(1.57,.40,4.18)],material=LIGHT,parent=TAIL)
line('Tail ridge',[(.35,.28,.83),(1.57,.40,4.18)],SHADE,.003,TAIL)
FAR=empty('CRANE_far_wing',MASTER)
sheet('Far wing mountain',[( -1.0,.24,.80),(-.20,1.48,2.78),(1.37,1.30,1.13),(.45,.28,.88)],[[0,1,3],[1,2,3]],PAPER,FAR)
line('Far wing crease',[(-1,.24,.80),(-.20,1.48,2.78),(1.37,1.30,1.13)],SHADE,.003,FAR)
# Original engraved mountain contours seated on the far wing plane.
fa=Vector((-1.0,.24,.80));fb=Vector((-.20,1.48,2.78));fd=Vector((.45,.28,.88))
n=(fb-fa).cross(fd-fa).normalized()
if n.y>0:n=-n
for k in range(6):
 pts=[]
 for v,u in [(.12,.27),(.25,.45),(.37,.29),(.49,.42),(.65,.19)]:
  u-=k*.012;co=fa+(fb-fa)*u+(fd-fa)*v+n*.009;pts.append(tuple(co))
 line('Engraved mountain contour',pts,FAINT,.0028,FAR)

# A continuous shared deck is physically attached to the body.
W=empty('WING_attachment',MASTER,(-.90,-.23,.69));W.rotation_euler.y=-.17
DECK=[(0,0,0),(4.86,.43,0),(4.63,-1.95,0),(2.23,-2.50,0),(.25,-.95,0)]
sheet('Wing continuous lower paper',DECK,material=PAPER,parent=W,thick=.013)
sheet('Wing underside pleat',[(0,0,-.016),(4.47,-1.40,-.016),(2.1,-.75,-.09),(.25,-.58,-.016)],[[0,1,2],[0,2,3]],PAPER,W)
for i in range(4):
 line('Wing underside structural crease',[(.16,-.38,-.023),(1.3+i*.70,-.6-i*.28,-.023)],SHADE,.003,W)
# Three stacked folios. All stay attached to the root. They fold behind the city.
COVERS=[]
cover_polys=[[(0,0,0),(4.90,.43,0),(3.96,-.30,0),(.18,-.42,0)],[(0,0,0),(4.38,-.27,0),(3.55,-.94,0),(.20,-.53,0)],[(0,0,0),(3.94,-.91,0),(2.24,-2.48,0),(.25,-.95,0)]]
for i,city in enumerate(['kyoto','lisbon','almaty']):
 p=empty('COVER_'+city,W,(0,0,.18+i*.008));p['fold_role']='cover';p['fold_open']=-3.02+i*.035;p['fold_axis']='x'
 sheet(city+' exterior folio',cover_polys[i],material=PAPER,parent=p,thick=.010)
 line(city+' scored edge',cover_polys[i][:3],SHADE,.003,p)
 # Fine original topographic print on the visible reverse of the opened folio.
 for k in range(5):
  pts=[]
  for j in range(25):
   x=2.0+j*.058;y=-.12-i*.54 + math.sin(j*.24)*.05 + k*.018
   pts.append((x,y,-.009))
  line('Reverse folio topographic print',pts,FAINT,.002,p)
 # restrained dashed route print, independent of real HTML city labels.
 for j in range(9):
  x=1.72+j*.105;y=(-.08-i*.59)-math.sin(j*.35)*.05
  line('Travel route dash',[(x,y,.009),(x+.051,y+.005,.009)],FAINT,.004,p)
 a=empty('ANCHOR_city-'+city,p,[(3.45,-.10,.025),(3.15,-.70,.025),(2.77,-1.33,.025)][i]);COVERS.append(p)

# Shared helpers for pop-up city sheets.
CITIES={};POI={}
def cityroot(id):
 c=empty('CITY_'+id,W,(0,0,.025));c['city']=id;CITIES[id]=c;return c

def inside_wing(x,y):
 inside=False;j=len(DECK)-1
 for i in range(len(DECK)):
  xi,yi,_=DECK[i];xj,yj,_=DECK[j]
  if (yi>y)!=(yj>y) and x<(xj-xi)*(y-yi)/(yj-yi)+xi:inside=not inside
  j=i
 return inside

def river(parent,curve,wide=.15):
 # Printed multi-line water, not glossy blue plastic.
 for k in range(9):
  pts=[]
  for j in range(61):
   t=j/60;x,y=curve(t);y+=(k-4)*wide/8
   if inside_wing(x,y):pts.append((x,y,.018))
  line('Printed river contour',pts,BLUE,.008 if k%3==0 else .003,parent)

def tree(parent,x,y,h=.50,autumn=False):
 t=hinge('tree',parent,(x,y,.02),closed=1.57,delay=random.uniform(.02,.18));leaf=REDLEAF if autumn else (GREEN if random.random()<.6 else LEAF)
 line('Tree cut-paper trunk',[(0,0,0),(0,0,h*.88)],INK,.012,t)
 for side in [-1,1]:
  for j in range(3):
   zz=h*(.3+j*.17);xx=side*(.13+j*.025)
   line('Branch print',[(0,0,zz-.08),(xx,0,zz+.07)],INK,.006,t)
 for j in range(7):
  xx=(random.random()-.5)*h*.70;zz=h*(.52+random.random()*.42);r=h*(.15+random.random()*.09)
  if autumn:
   verts=[]
   for k in range(10):
    a=k*math.pi/5;rr=r*(1 if k%2==0 else .43);verts.append((xx+rr*math.sin(a),-.005,zz+rr*math.cos(a)))
  else:
   verts=[(xx-r,0,zz),(xx-r*.68,0,zz+r*.72),(xx,0,zz+r),(xx+r*.72,0,zz+r*.7),(xx+r,0,zz),(xx+r*.65,0,zz-r*.60),(xx-r*.6,0,zz-r*.6)]
  verts=[(vx,vy-.012-j*.009,vz) for vx,vy,vz in verts]
  sheet('Die-cut foliage',verts,material=leaf,parent=t,thick=.003)
 return t

def roof(parent,x,y,z,w,d,material=ROOF):
 # Four pitched roof planes, subtly raised corners; real 0.006 m paper.
 verts=[(x-w/2,y-d/2,z),(x+w/2,y-d/2,z),(x+w/2,y+d/2,z),(x-w/2,y+d/2,z),(x,y,z+.12)]
 sheet('Four folded roof pitches',verts,[[0,1,4],[1,2,4],[2,3,4],[3,0,4]],material,parent,thick=.005)
 for side in [-1,1]:
  for k in range(9):
   u=(k/8-.5)*w;line('Printed roof rib',[(x+u,y+side*d/2,z+.005),(x+u*.38,y,z+.11)],SHADE,.002,parent)

def place_anchor(city,index,loc):
 a=empty('ANCHOR_'+city+'-poi-'+str(index),CITIES[city],loc);POI[(city,index)]=a

# KYOTO — gabled machiya cards, layered temple roof, river and maple grove.
K=cityroot('kyoto')
river(K,lambda t:(1.10+3.26*t,-1.52+.58*math.sin(t*math.pi*2-.9)),.20)
for x,y,w,h in [(1.1,-.82,.33,.40),(1.5,-1.08,.36,.37),(1.89,-1.10,.32,.45),(2.25,-1.20,.31,.34),(2.60,-.93,.38,.46),(3.43,-.66,.36,.42),(3.87,-.55,.33,.37)]:
 b=empty('Kyoto machiya foundation',K,(x,y,.035));boxwalls('Machiya',w,.10,h,b,gable=.14)
# Unnamed decorative Kyoto pagoda motif; never used as the Kiyomizu place anchor.
pag=hinge('Kyoto temple pop-up',K,(3.72,.04,.03),closed=1.57,delay=.15)
for level in range(4):
 z=.05+level*.23;w=.56-level*.085;h=.20
 rect('Pagoda tier front',-w*.36,w*.36,-w*.28,z,z+h,PAPER,pag)
 rect('Pagoda tier back',-w*.36,w*.36,w*.28,z,z+h,PAPER,pag)
 for xx in [-w*.25,0,w*.25]: window(pag,xx,z+.025,w=.046,h=.12,y=-w*.28-.01,material=RED)
 roof(pag,0,0,z+h,w+.20,.18,ROOF)
line('Pagoda finial',[(0,0,.95),(0,0,1.23)],GOLD,.009,pag)
for j in range(5):line('Finial rings',[(-.025,0,1.0+j*.035),(.025,0,1.0+j*.035)],GOLD,.005,pag)
# Red torii card distinct from the temple motif.
t=hinge('Torii gate',K,(2.19,-.45,.03),closed=1.57,delay=.1)
for x in [-.19,.19]:rect('Torii column',x-.025,x+.025,0,0,.51,RED,t)
rect('Torii lower lintel',-.26,.26,-.008,.36,.40,RED,t)
sheet('Torii folded top',[(-.31,-.02,.48),(.31,-.02,.48),(.34,-.02,.54),(-.34,-.02,.54)],material=RED,parent=t)
# Thin arched bridge, hinged as a die-cut side-view assembly.
br=hinge('River bridge',K,(2.80,-1.28,.03),closed=1.57,delay=.10)
for yy in [-.08,.08]:
 pts=[(-.36+u*.72,yy,.08+.16*math.sin(u*math.pi)) for u in [i/18 for i in range(19)]]
 line('Bridge curved red rail',pts,RED,.013,br)
 for j in range(7):
  x=-.33+j*.11;z=.08+.16*math.sin((j*.11+.03)/.72*math.pi);line('Bridge rail post',[(x,yy,0),(x,yy,z)],RED,.009,br)
line('Bridge deck folded edge',[(-.38,0,.01),(0,0,.13),(.38,0,.01)],ROOF,.035,br)
for x,y,h in [(1.13,-.45,.55),(1.70,-.55,.45),(3.21,-.08,.40),(3.33,-.95,.40),(4.17,-.80,.43)]:tree(K,x,y,h,True)
hall=hinge('Kiyomizu broad veranda hall',K,(2.56,-.11,.03),closed=1.57,delay=.16)
# Broad hillside stage, open timber trestles and projecting eaves distinguish the
# Kiyomizu-inspired hall from the small decorative pagoda. All are thin cards.
for xx in [-.53,-.265,0,.265,.53]:
 rect('Veranda timber upright',xx-.014,xx+.014,-.035,0,.49,ROOF,hall)
 line('Veranda timber paper strut',[(xx-.105,-.036,.04),(xx+.105,-.036,.44)],ROOF,.012,hall)
rect('Veranda stage fascia',-.62,.62,-.20,.42,.48,ROOF,hall)
sheet('Veranda folded stage',[(-.62,-.20,.48),(.62,-.20,.48),(.62,.13,.48),(-.62,.13,.48)],parent=hall)
rect('Broad temple hall',-.53,.53,.012,.48,.83,PAPER,hall)
for xx in [-.43,-.215,0,.215,.43]:window(hall,xx,.51,.115,.25,y=-.002,material=ROOF)
for xx in [-.54,.54]:
 rect('Temple corner timber',xx-.013,xx+.013,-.015,.48,.85,ROOF,hall)
sheet('Temple shallow side fold',[(-.53,.012,.48),(-.53,.13,.48),(-.53,.13,.83),(-.53,.012,.83)],parent=hall)
# Broad hipped roof with a long ridge and lifted corner facets, rather than a
# stack of pagoda roofs. Open footprint remains inside the common wing.
rv=[(-.75,-.25,.86),(.75,-.25,.86),(.73,.28,.86),(-.73,.28,.86),(-.45,.035,1.04),(.45,.035,1.04)]
sheet('Kiyomizu long hipped roof',rv,[[0,1,5,4],[1,2,5],[2,3,4,5],[3,0,4]],ROOF,hall,thick=.006)
line('Temple dark eave',[(-.75,-.25,.855),(.75,-.25,.855)],ROOF,.018,hall)
for xx in [-.6,-.45,-.3,-.15,0,.15,.3,.45,.6]:
 line('Temple roof crease',[(xx,-.25,.868),(max(-.45,min(.45,xx)),.035,1.047)],SHADE,.0025,hall)
line('Veranda rail',[(-.62,-.22,.62),(.62,-.22,.62)],RED,.010,hall)
for xx in [-.60,-.40,-.20,0,.20,.40,.60]:line('Veranda posts',[(xx,-.22,.48),(xx,-.22,.65)],RED,.007,hall)
br.scale=(1.10,1.10,1.10)
place_anchor('kyoto',0,(2.56,-.11,1.14));place_anchor('kyoto',1,(1.60,-1.50,.65));place_anchor('kyoto',2,(2.80,-1.25,.43))

# LISBON — separated hillside terraces, varied roof silhouettes, yellow tram,
# and the broad riverside bastion of an explicitly artistic Belem interpretation.
L=cityroot('lisbon')
river(L,lambda t:(1.50+2.78*t,-1.87+.12*math.sin(t*math.pi)),.25)
# Ten existing townhouse hinges retained. Foundations are continuous folded
# paper risers, not floating blocks. The back row rises to a different skyline.
houses=[(1.14,-.86,.33,.43,.00,'gable'),(1.56,-.74,.32,.57,.06,'hip'),
 (1.98,-.63,.38,.45,.13,'flat'),(2.47,-.49,.41,.62,.19,'hip'),
 (2.98,-.30,.39,.43,.14,'gable'),(3.44,-.16,.34,.36,.07,'hip'),
 (1.66,-.22,.28,.53,.04,'flat'),(2.08,.00,.32,.65,.10,'gable'),
 (2.62,.07,.36,.54,.21,'hip'),(3.12,.12,.31,.41,.14,'flat')]
for i,(x,y,w,h,lift,kind) in enumerate(houses):
 b=empty('Lisbon stepped foundation',L,(x,y,.025))
 p=boxwalls('Lisbon townhouse',w,.12,h,b,material=GOLD if i in [0,3,8] else PAPER,gable=.12 if kind=='gable' else 0,roofmat=ROOF)
 # Lift the paper facade from its own baseline without moving the physical hinge.
 for ob in p.children:
  if ob.type=='MESH':
   for v in ob.data.vertices:v.co.z+=lift
 if lift:
  rect('Hillside folded terrace face',-w*.62,w*.62,-.042,0,lift,LIGHT,p)
  sheet('Hillside thin terrace landing',[(-w*.62,-.042,lift),(w*.62,-.042,lift),(w*.62,.15,lift),(-w*.62,.15,lift)],parent=p)
  for z in [lift*.35,lift*.70]:line('Hillside terrace contour',[(-w*.61,-.047,z),(w*.61,-.047,z)],FAINT,.002,p)
 if kind=='hip':
  # Long terracotta ridge, distinct from both triangular and parapet silhouettes.
  verts=[(-w*.59,-.035,h+lift),(w*.59,-.035,h+lift),(w*.59,.155,h+lift),(-w*.59,.155,h+lift),(-w*.25,.06,h+lift+.115),(w*.25,.06,h+lift+.115)]
  sheet('Lisbon hipped terracotta roof',verts,[[0,1,5,4],[1,2,5],[2,3,4,5],[3,0,4]],ROOF,p)
 elif kind=='flat':
  rect('Lisbon scalloped parapet',-w*.53,w*.53,-.012,h+lift-.025,h+lift+.065,PAPER,p)
  rect('Lisbon blue parapet stripe',-w*.53,w*.53,-.017,h+lift+.012,h+lift+.034,TILE,p)
 if i in [1,4,6]:
  for zz in [h*.30,h*.55,h*.80]:
   for xx in [-w*.29,0,w*.29]:
    sheet('Azulejo diamond',[(xx-.022,-.013,zz+lift),(xx,-.013,zz+lift+.022),(xx+.022,-.013,zz+lift),(xx,-.013,zz+lift-.022)],material=TILE,parent=p,thick=.001)
 if i in [1,3,7]:
  z=lift+h*.54
  sheet('Lisbon folded balcony',[(-w*.43,-.012,z),(w*.43,-.012,z),(w*.43,-.09,z),(-w*.43,-.09,z)],material=LIGHT,parent=p)
  line('Lisbon balcony rail',[(-w*.43,-.09,z+.07),(w*.43,-.09,z+.07)],INK,.004,p)
  for k in range(5):
   xx=(k/4-.5)*w*.86;line('Lisbon balcony baluster',[(xx,-.09,z),(xx,-.09,z+.07)],INK,.003,p)
# Printed climbing lanes help read two hills without adding rigid landscape blocks.
for offset in [0,.04]:
 line('Lisbon climbing lane',[(1.0,-.98+offset,.024),(1.45,-.91+offset,.024),(1.58,-.48+offset,.024),(2.08,-.40+offset,.024),(2.20,-.13+offset,.024),(2.92,-.01+offset,.024)],FAINT,.003,L)
tram=hinge('Yellow tram pop-up',L,(2.15,-1.48,.03),closed=1.57,delay=.12)
sheet('Tram yellow body',[(-.41,0,.045),(.41,0,.045),(.40,0,.34),(.34,0,.405),(-.34,0,.405),(-.40,0,.34)],material=GOLD,parent=tram)
rect('Tram ivory window band',-.36,.36,-.009,.20,.375,PAPER,tram)
for x in [-.275,-.137,0,.137,.275]:window(tram,x,.225,w=.105,h=.13,y=-.020)
rect('Tram yellow lower stripe',-.38,.38,-.015,.12,.165,GOLD,tram)
for xx in [-.23,.23]:
 sheet('Tram wheel',[(xx-.045,0,.015),(xx+.045,0,.015),(xx+.045,0,.085),(xx-.045,0,.085)],material=BLACK,parent=tram)
# Visible return and curved paper roof distinguish the vehicle from a facade.
sheet('Tram front return',[(.40,0,.07),(.40,.15,.07),(.40,.15,.34),(.40,0,.34)],material=GOLD,parent=tram)
sheet('Tram folded ivory roof',[(-.42,-.025,.382),(.42,-.025,.382),(.38,.065,.43),(-.38,.065,.43),(-.42,.17,.382),(.42,.17,.382)],[[0,1,2,3],[3,2,5,4]],PAPER,tram)
line('Tram roof rim',[(-.42,-.026,.385),(.42,-.026,.385)],INK,.010,tram)
line('Tram pantograph',[(-.06,.06,.43),(.04,.06,.59),(.17,.06,.59)],INK,.007,tram)
for xx in [-.35,.35]:rect('Tram end lamp',xx-.018,xx+.018,-.018,.11,.155,LIGHT,tram)
for offs in [-.08,.08]:line('Tram ink track',[(1.0,-1.43+offs,.02),(2.5,-1.48+offs,.02),(3.30,-1.22+offs,.02)],FAINT,.005,L)
# Broad bastion, tower loggia, projecting turrets and crenellations. This remains
# a die-cut paper interpretation, not a dimensionally accurate monument model.
tower=hinge('Belem-inspired paper tower',L,(4.02,-.91,.025),closed=1.57,delay=.10)
rect('Tower main facade',-.245,.245,.015,.26,1.00,PAPER,tower)
sheet('Tower shallow return',[(-.245,.015,.26),(-.245,.17,.26),(-.245,.17,1.0),(-.245,.015,1.0)],parent=tower)
sheet('Belem broad bastion',[(-.54,-.025,0),(.54,-.025,0),(.49,-.025,.33),(-.49,-.025,.33)],material=PAPER,parent=tower)
sheet('Bastion folded terrace',[(-.54,-.025,.31),(.54,-.025,.31),(.45,.20,.31),(-.45,.20,.31)],parent=tower)
for z in [.34,.66,.95]:rect('Tower limestone ledge',-.28,.28,-.018,z,z+.036,LIGHT,tower)
def arch(parent,name,x,z,w,h,y=-.03):
 r=w/2
 verts=[(x-r,y,z),(x+r,y,z),(x+r,y,z+h-r)]
 for k in range(1,7):
  a=k*math.pi/6;verts.append((x+r*math.cos(a),y,z+h-r+r*math.sin(a)))
 sheet(name,verts,material=INK,parent=parent,thick=.001)
for xx in [-.16,0,.16]:arch(tower,'Belem arched loggia',xx,.70,.095,.18)
for xx in [-.13,.13]:arch(tower,'Belem narrow window',xx,.43,.065,.13)
for xx in [-.34,-.17,0,.17,.34]:arch(tower,'Bastion open arcade',xx,.075,.10,.17,y=-.031)
for xx in [-.225,-.113,0,.113,.225]:rect('Tower crenellation',xx-.035,xx+.035,.010,.995,1.075,PAPER,tower)
for xx,z in [(-.285,.84),(.285,.84),(-.48,.22),(.48,.22)]:
 sheet('Belem projecting turret',[(xx-.065,-.045,z),(xx+.065,-.045,z),(xx+.075,-.045,z+.15),(xx-.075,-.045,z+.15)],material=PAPER,parent=tower)
 sheet('Belem turret folded cap',[(xx-.092,-.047,z+.15),(xx,-.065,z+.29),(xx+.092,-.047,z+.15)],material=LIGHT,parent=tower)
 line('Turret central fold',[(xx,-.052,z+.155),(xx,-.065,z+.28)],SHADE,.0025,tower)
# Sails near the river edge, clearly separate from the larger tower.
sail=hinge('Tagus folded sail',L,(3.19,-1.83,.025),closed=1.57,delay=.08)
line('Sail mast',[(0,0,0),(0,0,.47)],SHADE,.005,sail)
sheet('Triangular paper sail',[(0,0,.43),(.23,0,.07),(0,0,.07)],material=WHITE,parent=sail)
for x,y,h in [(1.02,-.55,.35),(2.87,-.02,.34),(3.55,.10,.31)]:tree(L,x,y,h)
place_anchor('lisbon',0,(2.47,-.35,1.12));place_anchor('lisbon',1,(2.15,-1.48,.72));place_anchor('lisbon',2,(4.02,-.91,1.21))

# ALMATY — layered mountain cuts, avenues, and a cathedral-inspired card.
A=cityroot('almaty')
for layer in range(3):
 mountain=hinge('Alatau mountain layer '+str(layer),A,(.95,.20-layer*.20,.025),closed=1.57,delay=.1+layer*.04)
 peaks=[(0,0,0),(.32,0,.38),(.70,0,.24),(1.10,0,.90),(1.43,0,.51),(1.84,0,1.17),(2.20,0,.58),(2.62,0,.87),(3.36,0,.05),(3.36,0,0)]
 peaks=[(x,0,z*(1-.21*layer)) for x,_,z in peaks]
 sheet('Folded mountain silhouette',peaks,material=WHITE if layer==0 else PAPER,parent=mountain)
 for x,z in [(1.1,.90),(1.84,1.17),(2.62,.87)]:
  z*=1-.21*layer
  sheet('Mountain facet',[(x-.28,-.012,z*.65),(x,-.012,z),(x+.14,-.012,z*.44)],material=LIGHT if layer==0 else SHADE,parent=mountain)
  line('Mountain scored ridge',[(x,-.020,z),(x+.14,-.020,z*.44)],SHADE,.0025,mountain)
for x,y,w,h in [(1.2,-1.25,.40,.32),(1.71,-1.14,.44,.39),(2.23,-1.02,.36,.36),(3.62,-1.02,.43,.31)]:
 b=empty('Almaty avenue foundation',A,(x,y,.03));boxwalls('Almaty avenue building',w,.10,h,b,gable=0,roofmat=LIGHT)
# Cathedral keeps Kazakhstan-specific tiered bell tower + warm gold silhouette.
cat=hinge('Ascension-inspired cathedral',A,(2.93,-.80,.03),closed=1.57,delay=.18)
rect('Cathedral ivory façade',-.29,.29,0,0,.48,PAPER,cat)
for xx in [-.22,.22]:
 rect('Cathedral side tower',xx-.095,xx+.095,-.004,0,.61,PAPER,cat)
 roof(cat,xx,0,.61,.23,.17,GREEN)
 sheet('Side gold cupola',[(xx-.07,-.014,.72),(xx-.09,-.014,.80),(xx,-.014,.90),(xx+.09,-.014,.80),(xx+.07,-.014,.72)],material=GOLD,parent=cat)
 line('Side cupola cross',[(xx,0,.87),(xx,0,.99)],GOLD,.005,cat)
 line('Side crossbar',[(xx-.028,0,.95),(xx+.028,0,.95)],GOLD,.005,cat)
rect('Cathedral central tower',-.105,.105,-.018,.25,.89,PAPER,cat)
for zz in [.18,.41,.65]:
 for xx in [-.20,0,.20]:window(cat,xx,zz,.055,.105,material=GREEN)
roof(cat,0,0,.89,.30,.23,GREEN)
sheet('Central gold dome', [(-.08,-.025,.99),(-.12,-.025,1.08),(0,-.025,1.23),(.12,-.025,1.08),(.08,-.025,.99)],material=GOLD,parent=cat)
line('Central gold cross',[(0,0,1.21),(0,0,1.39)],GOLD,.006,cat)
line('Central crossbar',[(-.04,0,1.33),(.04,0,1.33)],GOLD,.006,cat)
for x,y,h in [(1.04,-.64,.43),(1.43,-.75,.50),(1.96,-.61,.49),(2.32,-.66,.51),(3.35,-1.41,.43),(3.76,-.48,.44),(4.12,-.70,.38)]:tree(A,x,y,h)
# Fine avenue paths.
for off in [-.07,.07]:line('Green avenue print',[(1.2,-1.45+off,.02),(2.5,-1.51+off,.02),(4.08,-1.0+off,.02)],FAINT,.004,A)
marketbase=empty('Green Bazaar foundation',A,(1.76,-.51,.03))
market=boxwalls('Green Bazaar long market hall',.95,.13,.32,marketbase,gable=.10,roofmat=GREEN)
for xx in [-.38,-.19,0,.19,.38]:window(market,xx,.07,.11,.18,material=GREEN)
place_anchor('almaty',0,(2.93,-.80,1.42));place_anchor('almaty',1,(1.76,-.51,.58));place_anchor('almaty',2,(3.00,.08,1.42))

# Story tab physically emerges from the selected place. HTML owns readable story.
ST=empty('STORY_TAB',W,(3.70,-1.18,.04));ST['fold_role']='story'
sheet('Die-cut story leaf',[(0,0,0),(1.25,0,0),(1.45,-.22,0),(1.45,-.75,0),(0,-.75,0)],material=PAPER,parent=ST,thick=.009)
for k in range(5):line('Story print rule',[(.18,-.18-k*.075,.008),(1.14,-.18-k*.075,.008)],FAINT,.002,ST)
ST.hide_render=True

# Rig poses, saved in open state to keep the glTF inspectable.
for c in CITIES.values():c.hide_render=True
CITIES['kyoto'].hide_render=False
for p in COVERS:p.rotation_euler.x=p['fold_open']

# Merge rigid parts by hinge parent and material, preserving their transform hierarchy.
# This changes neither paper geometry nor pivot placement; it only reduces draw calls.
mergegroups={}
for o in list(bpy.data.objects):
 if o.type=='MESH':
  key=(o.parent.name if o.parent else '',tuple(m.name for m in o.data.materials))
  mergegroups.setdefault(key,[]).append(o)
for obs in mergegroups.values():
 if len(obs)<2:continue
 bpy.ops.object.select_all(action='DESELECT')
 for o in obs:o.select_set(True)
 bpy.context.view_layer.objects.active=obs[0]
 bpy.ops.object.join()

# Scene stage, excluded from GLB (render only).
scene=bpy.context.scene
stage=mat('Vermilion cyclorama',(.39,.025,.014))
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,.01));ground=bpy.context.object;ground.name='RENDER_ground';ground.data.materials.append(stage)
world=bpy.data.worlds.new('Soft warm environment');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.59,.44,.32,1);world.node_tree.nodes['Background'].inputs[1].default_value=.40

def area(name,loc,power,size,color):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color;o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
area('RENDER_softbox',(-4,-5,9),850,6,(1,.89,.75));area('RENDER_fill',(3,3,6),450,5,(.86,.90,1))
bpy.ops.object.camera_add(location=(1.55,-14.5,9.2));cam=bpy.context.object;cam.name='RENDER_camera';cam.rotation_euler=(Vector((.25,0,1.75))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=11.6;scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=False
scene.render.resolution_x=1500;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.view_settings.view_transform='AgX';scene.view_settings.look='AgX - Medium High Contrast'
scene.render.image_settings.file_format='PNG';scene.render.film_transparent=False
# Select master hierarchy only: exports architecture and all city folders, no baked backdrop.
bpy.ops.object.select_all(action='DESELECT')
for ob in bpy.data.objects:
 p=ob
 while p and p!=MASTER:p=p.parent
 if p==MASTER:ob.select_set(True)
bpy.context.view_layer.objects.active=MASTER
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/fold-master.glb'),export_format='GLB',use_selection=True,export_extras=True,export_apply=True,export_yup=True,export_normals=True,export_texcoords=True,export_materials='EXPORT',export_cameras=False,export_lights=False)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'model/fold-master.blend'))
# Accurate evaluated mesh counts including paper thickness, not a low-poly guess.
counts={}
for ob in bpy.data.objects:
 if ob.type=='MESH' and not ob.name.startswith('RENDER_'):
  ob.data.calc_loop_triangles();counts[ob.name]=len(ob.data.loop_triangles)
report={'generator':'Original deterministic Blender Python geometry. No generated AI model or third-party mesh.','blender':bpy.app.version_string,'mesh_objects':len(counts),'triangles':sum(counts.values()),'texture':{'file':'paper-fibers.png','width':N,'height':N,'source':'Original deterministic cotton-fiber texture generated locally with seed 219'},'glb_bytes':(ROOT/'public/models/fold-master.glb').stat().st_size,'cities':list(CITIES),'hinges':len([o for o in bpy.data.objects if o.name.startswith('HINGE_')]),'per_mesh_triangles':counts}
(ROOT/'model/asset-manifest.json').write_text(json.dumps(report,indent=2))
print('FOLD_ASSET_REPORT',json.dumps({k:v for k,v in report.items() if k!='per_mesh_triangles'}))

def pose(progress,city='kyoto'):
 for id,c in CITIES.items():
  c.hide_render=id!=city or progress<.001
  for child in c.children_recursive:child.hide_render=c.hide_render
 for o in bpy.data.objects:
  if 'fold_closed' in o:o.rotation_euler.x=float(o['fold_closed'])*(1-progress)
 for p in COVERS:p.rotation_euler.x=p['fold_open']*progress
 ST.hide_render=True
 for child in ST.children_recursive:child.hide_render=True

if '--proof' in sys.argv:
 scene.render.resolution_x=1000;scene.render.resolution_y=720;scene.cycles.samples=16
 for i,p in enumerate([0,.25,.5,.75,1]):
  pose(p);scene.render.filepath=str(ROOT/f'model/proof/hinge-{i*25:03d}.png');bpy.ops.render.render(write_still=True)
if '--render' in sys.argv:
 scene.render.film_transparent=True;ground.hide_render=True;ground.is_shadow_catcher=False
 scene.render.resolution_x=1500;scene.render.resolution_y=1100;scene.cycles.samples=24
 for id in ['crane','kyoto','lisbon','almaty']:
  pose(0 if id=='crane' else 1,id if id!='crane' else 'kyoto');scene.render.filepath=str(ROOT/f'public/posters/{id}.png');bpy.ops.render.render(write_still=True)
