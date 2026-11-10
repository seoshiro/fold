"""Crop transparent Blender renders consistently and encode browser-ready RGBA WebP."""
from pathlib import Path
from PIL import Image
import json
ROOT=Path(__file__).resolve().parents[1];report=[]
for name in ['crane','kyoto','lisbon','almaty']:
 p=ROOT/'public/posters'/f'{name}.png'
 im=Image.open(p).convert('RGBA')
 if im.getpixel((0,0))[3]>0:raise RuntimeError(f'{name}: render is not transparent yet')
 w,h=im.size;crop=(round(w*.07),round(h*.16),round(w*.90),round(h*.86))
 opaque=im.getchannel('A').point(lambda p:255 if p>220 else 0).getbbox()
 if opaque:
  crop=(min(crop[0],opaque[0]-30),min(crop[1],opaque[1]-30),max(crop[2],opaque[2]+30),max(crop[3],opaque[3]+30))
 im=im.crop(crop)
 out=p.with_suffix('.webp');im.save(out,'WEBP',quality=88,method=4)
 report.append({'file':out.name,'dimensions':im.size,'bytes':out.stat().st_size,'source':'Transparent CPU Cycles render of the actual master model, with shadow catcher.','crop':crop})
 print(out.name,im.size,out.stat().st_size,flush=True)
(ROOT/'model/poster-manifest.json').write_text(json.dumps(report,indent=2))
