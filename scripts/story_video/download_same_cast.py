#!/usr/bin/env python3
import subprocess,os,json
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
P=Path("story-assets")
P.mkdir(exist_ok=True)
IDs=[6816117,6816118,6816127,6816190,6816201,6816123]
def sh(cmd,timeout=160):
 r=subprocess.run(cmd,capture_output=True,text=True,timeout=timeout)
 if r.returncode:raise RuntimeError(r.stderr[-500:])
 return r.stdout
def inspect(path):
 try:
  j=json.loads(sh(["ffprobe","-v","error","-show_entries","format=duration,size:stream=width,height,codec_name","-of","json",str(path)]))
  v=next(t for t in j.get("streams",[]) if t.get("codec_name") in ["h264","hevc","vp9","mpeg4","av1"])
  return float(j['format']['duration']),int(v['width']),int(v['height']),int(j['format']['size'])
 except Exception:return None
meta=[]
for video in IDs:
 target=P/f"{video}.mp4"
 formats=[]
 for fps in [25,30,24,50,60,2997]:
  for dim in ["1280_720","1920_1080","960_540"]:
   formats.append(f"https://videos.pexels.com/video-files/{video}/{video}-hd_{dim}_{fps}fps.mp4")
 formats.append(f"https://www.pexels.com/download/video/{video}/")
 for ix,url in enumerate(formats):
  try:
   sh(["curl","-fLsS","--retry","1","--connect-timeout","8","--max-time","40","-A","Mozilla/5.0","-o",str(target),url],timeout=48)
   info=inspect(target)
   if info and info[2]>=540 and info[0]>=3:
    print("SUCCESS",video,info,url,flush=True)
    break
  except Exception as e:
   if ix==0: print("TRYING",video,str(e)[:100],flush=True)
  target.unlink(missing_ok=True)
 else:
  print("DOWNLOAD FAIL",video,flush=True)
  continue
 meta.append({"id":video,"duration":info[0],"width":info[1],"height":info[2],"size":info[3]})
 for j,fraction in enumerate([0.15,0.5,0.85]):
  time=min(info[0]-0.25,max(0.2,info[0]*fraction))
  jpg=P/f"{video}_{j}.jpg"
  sh(["ffmpeg","-y","-loglevel","error","-ss",str(time),"-i",str(target),"-frames:v","1","-vf","scale=480:-2",str(jpg)])
allthumbs=[]
for v in meta:
 for j in range(3):
  fp=P/f"{v['id']}_{j}.jpg"
  im=Image.open(fp).convert("RGB"); im=ImageOps.fit(im,(400,235))
  allthumbs.append((v['id'],j,im))
sheet=Image.new("RGB",(1200,270*len(meta)),(245,245,245))
draw=ImageDraw.Draw(sheet)
for i,(ident,j,im) in enumerate(allthumbs):
 x=(i%3)*400;y=(i//3)*270
 sheet.paste(im,(x,y+24))
 draw.text((x+6,y+5),f"{ident} / shot {j+1}",fill=(0,0,0))
sheet.save(P/"source_contact_sheet.jpg",quality=88)
(P/"sources.json").write_text(json.dumps(meta,indent=2))
if len(meta)<4:raise RuntimeError("Insufficient coherent live-action clips: only "+str(len(meta)))
