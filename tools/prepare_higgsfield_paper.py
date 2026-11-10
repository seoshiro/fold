"""Reproducible technical texture preparation. No generation or external service calls.

The Higgsfield original is immutable. This script tone-normalizes, joins boundaries,
downsamples and encodes a web material; the optional height is a luminance derivative.
"""
from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np
import hashlib, json

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'assets/higgsfield/fold-paper-001/original.png'
DEST=ROOT/'public/textures'
DEST.mkdir(parents=True,exist_ok=True)

def image(a):
    return Image.fromarray(np.uint8(np.clip(np.rint(a),0,255)))

def seamless(a, band=24):
    """Symmetric cosine blend in 24-px boundary bands, equal opposite edge pixels."""
    a=a.copy()
    for axis in (1,0):
        view=np.swapaxes(a,0,axis)
        for i in range(band):
            w=.5*(1+np.cos(np.pi*i/band))
            left=view[i].copy(); right=view[-i-1].copy(); mean=(left+right)*.5
            view[i]=left*(1-w)+mean*w
            view[-i-1]=right*(1-w)+mean*w
    return a

src=np.asarray(Image.open(SOURCE).convert('RGB')).astype(np.float64)
# Resample before joining seams so the final asset itself has matching edge values.
a=np.asarray(image(src).resize((1024,1024),Image.Resampling.LANCZOS)).astype(np.float64)
target=np.array([234.,223.,201.],dtype=np.float64)
# Preserve the scanned material's actual luminance. Mildly reduce color variation.
centered=a-a.mean(axis=(0,1),keepdims=True)
lum=centered@np.array([.2126,.7152,.0722],dtype=np.float64)
a=target+lum[:,:,None]*.85+centered*.15
a=seamless(a)
albedo=image(a)
albedo_path=DEST/'higgsfield-washi-albedo.webp'
# Archive an exact-seam master, then use high-quality compression in the site.
albedo.save(ROOT/'assets/higgsfield/fold-paper-001/albedo-lossless.webp',format='WEBP',lossless=True,method=6)
albedo.save(albedo_path,format='WEBP',quality=94,method=6)
height=np.asarray(albedo.convert('L')).astype(np.float64)
blur=np.asarray(albedo.convert('L').filter(ImageFilter.GaussianBlur(2))).astype(np.float64)
height=seamless(128+(height-blur)*2,band=24)
height_path=DEST/'higgsfield-washi-height.webp'
image(height).save(height_path,format='WEBP',lossless=True,method=6)

def stats(a):
    return {'mean_rgb':np.mean(a,axis=(0,1)).tolist(),
            'std_rgb':np.std(a,axis=(0,1)).tolist(),
            'edge_mean_abs_lr':float(np.abs(a[:,0]-a[:,-1]).mean()),
            'edge_mean_abs_tb':float(np.abs(a[0]-a[-1]).mean())}

report={'processing':'Original retained; Lanczos 2048→1024; mean normalization to RGB 234 223 201; 15% original color variation and 85% luminance variation; symmetric cosine seam bands 24 px; archived lossless master plus WebP quality 94 for web. Height: 128 + 2*(luminance - GaussianBlur radius 2), seam correction, lossless WebP.',
        'original':stats(src),
        'web_albedo':stats(np.asarray(Image.open(albedo_path)).astype(float)),
        'assets':[]}
for p in (SOURCE,albedo_path,height_path):
    report['assets'].append({'file':str(p.relative_to(ROOT)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'size':Image.open(p).size})
(ROOT/'assets/higgsfield/fold-paper-001/processing.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
