"""Re-render saved master geometry; no modeling or export needed."""
import bpy,sys,math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'model/fold-master.blend'))
for o in bpy.data.objects:
 if o.animation_data:o.animation_data_clear()
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
if '--details' in sys.argv:
 from mathutils import Vector
 pose(1,'kyoto');s.cycles.samples=48;s.render.resolution_x=1200;s.render.resolution_y=900
 cam=s.camera;cam.location=(3.5,-4.2,3.3);target=Vector((2.0,-1.4,1.0));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=2.6
 s.render.filepath=str(ROOT/'model/proof/paper-closeup.png');bpy.ops.render.render(write_still=True)
 cam.location=(3,-8,.50);target=Vector((.6,-.3,1.45));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=9.8
 s.render.filepath=str(ROOT/'model/proof/wing-underside.png');bpy.ops.render.render(write_still=True)
elif '--proof' in sys.argv:
 s.render.resolution_x=1200;s.render.resolution_y=880;s.cycles.samples=32
 for i,p in enumerate([0,.25,.5,.75,1]):
  pose(p,'kyoto');s.render.filepath=str(ROOT/f'model/proof/hinge-{i*25:03d}.png');bpy.ops.render.render(write_still=True)
else:
 s.render.film_transparent=True;s.cycles.samples=24
 bpy.data.objects['RENDER_ground'].hide_render=True
 bpy.data.objects['RENDER_ground'].is_shadow_catcher=False
 for id in ['crane','kyoto','lisbon','almaty']:
  pose(0 if id=='crane' else 1,id);s.render.filepath=str(ROOT/f'public/posters/{id}.png');bpy.ops.render.render(write_still=True)
