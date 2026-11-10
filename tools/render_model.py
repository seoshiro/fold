"""Re-render saved master geometry; no modeling or export needed."""
import bpy,sys,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'model/fold-master.blend'))
s=bpy.context.scene;s.cycles.use_denoising=False;s.cycles.samples=48;s.render.resolution_x=1500;s.render.resolution_y=1100

def visible(root,value):
 root.hide_render=not value
 for o in root.children_recursive:o.hide_render=not value

def pose(p,city):
 for id in ['kyoto','lisbon','almaty']:visible(bpy.data.objects['CITY_'+id],p>.001 and id==city)
 visible(bpy.data.objects['STORY_TAB'],False)
 for o in bpy.data.objects:
  if 'fold_closed' in o:o.rotation_euler.x=float(o['fold_closed'])*(1-p)
  if o.name.startswith('COVER_'):o.rotation_euler.x=float(o['fold_open'])*p
if '--proof' in sys.argv:
 s.render.resolution_x=1200;s.render.resolution_y=880;s.cycles.samples=32
 for i,p in enumerate([0,.25,.5,.75,1]):
  pose(p,'kyoto');s.render.filepath=str(ROOT/f'model/proof/hinge-{i*25:03d}.png');bpy.ops.render.render(write_still=True)
else:
 for id in ['crane','kyoto','lisbon','almaty']:
  pose(0 if id=='crane' else 1,id);s.render.filepath=str(ROOT/f'public/posters/{id}.png');bpy.ops.render.render(write_still=True)
