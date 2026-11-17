#!/usr/bin/env python3
"""AU Finance & Advisory: real-footage, silent-captioned 25-second social film.
Pexels clips remain licensed under https://www.pexels.com/license/
Only runs in isolated GitHub branch, never publishes social posts.
"""
import os, subprocess, time, json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path("au-video-work")
OUT = Path("social-video-output")
ROOT.mkdir(exist_ok=True)
OUT.mkdir(exist_ok=True)
W,H,FPS=1280,720,25
NAVY=(9,24,51)
GOLD=(225,196,119)
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

SCENES=[
 ("3981540", "THE TABLE IS BOOKED.", "A busy service. A full diary.", 4.0, "Gustavo Fring"),
 ("4318548", "THEN PLANS CHANGE.", "A last-minute cancellation.", 4.0, "Pavel Danilyuk"),
 ("7320541", "ONE TABLE STAYS EMPTY.", "And the income may disappear.", 4.0, "Pavel Danilyuk"),
 ("8145102", "WHAT HAPPENS TO THE DEPOSIT?", "Your terms, records and refunds matter.", 4.0, "olia danilevich"),
 ("7593326", "AND WHAT ABOUT VAT?", "Review the treatment of retained deposits.", 4.0, "Pavel Danilyuk"),
 ("6327644", "BETTER CONTROL. FEWER SURPRISES.", "AU Finance & Advisory  |  accounting-universe.co.uk", 5.0, "Tima Miroshnichenko"),
]

def run(cmd, timeout=360):
    print("RUN", " ".join(map(str,cmd))[:400], flush=True)
    p=subprocess.run(list(map(str,cmd)),text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=timeout)
    if p.returncode:
        print(p.stdout[-2200:],flush=True)
        raise RuntimeError(f"failed: {cmd[0]}")
    return p.stdout

def valid_video(path):
    if not path.exists() or path.stat().st_size<200000: return False
    r=subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=codec_name,width,height","-of","json",str(path)],capture_output=True,text=True)
    try:
        j=json.loads(r.stdout);return bool(j["streams"][0]["width"]>=640)
    except Exception:return False

def download_clip(video_id):
    target=ROOT/f"{video_id}.mp4"
    if valid_video(target):return target
    candidates=[]
    for fps in (25,30,24,50,60,2997):
        for tier, dims in (("hd","1920_1080"),("hd","1280_720")):
            candidates.append(f"https://videos.pexels.com/video-files/{video_id}/{video_id}-{tier}_{dims}_{fps}fps.mp4")
    candidates.append(f"https://www.pexels.com/download/video/{video_id}/")
    for u in candidates:
        try:
            run(["curl","-fLsS","--retry","1","--connect-timeout","15","--max-time","85","-A","Mozilla/5.0","-o",str(target),u],timeout=100)
            if valid_video(target):
                print("DOWNLOADED",video_id,target.stat().st_size,"via",u,flush=True)
                return target
            target.unlink(missing_ok=True)
        except Exception as e:
            print("FAILED SOURCE",video_id,str(e)[:100],flush=True)
            target.unlink(missing_ok=True)
    raise RuntimeError(f"Cannot get source video {video_id} from Pexels. Not substituting images.")

def draw_overlay(i,title,sub):
    im=Image.new("RGBA",(W,H),(0,0,0,0))
    d=ImageDraw.Draw(im)
    # top corner brand, always over LIVE action
    d.rounded_rectangle((45,34,114,100),radius=22,fill=(*NAVY,220),outline=(255,255,255,215),width=2)
    d.text((57,51),"AU",font=ImageFont.truetype(BOLD,30),fill="white")
    d.text((132,43),"AU FINANCE & ADVISORY",font=ImageFont.truetype(BOLD,20),fill="white",stroke_width=1,stroke_fill=(7,20,39))
    # cinematic lower-third gradient, footage stays visible
    pix=im.load()
    for y in range(455,H):
        alpha=int(220*((y-455)/(H-455))**.56)
        for x in range(W):
            old=pix[x,y]
            pix[x,y]=(*NAVY,max(alpha,old[3]))
    d=ImageDraw.Draw(im)
    d.rounded_rectangle((64,555,116,562),radius=3,fill=(*GOLD,245))
    d.text((64,579),title,font=ImageFont.truetype(BOLD,37 if len(title)<32 else 31),fill="white")
    d.text((66,645),sub,font=ImageFont.truetype(FONT,23),fill=(233,240,248))
    # minimal continuous timeline at bottom
    d.rectangle((0,714,int(W*(i+1)/len(SCENES)),720),fill=(*GOLD,255))
    path=ROOT/f"overlay_{i}.png";im.save(path)
    return path

def segment(src,overlay,i,secs):
    target=ROOT/f"segment_{i}.mp4"
    # source is real moving footage. Intro/outro are NOT still slides.
    filters=("[0:v]scale=1280:720:force_original_aspect_ratio=increase,"
             "crop=1280:720,fps=25,eq=contrast=1.05:saturation=0.93,"
             "format=yuv420p[film];[film][1:v]overlay=0:0:format=auto,"
             "format=yuv420p,fade=t=in:st=0:d=0.22,"
             f"fade=t=out:st={secs-0.20:.2f}:d=0.20[v]")
    cmd=["ffmpeg","-y","-loglevel","error","-ss","1.0","-i",src,
         "-loop","1","-i",overlay,"-filter_complex",filters,
         "-map","[v]","-t",str(secs),"-r",str(FPS),
         "-c:v","libx264","-preset","veryfast","-crf","22",
         "-pix_fmt","yuv420p","-an","-movflags","+faststart",target]
    run(cmd,timeout=240)
    if not valid_video(target):raise RuntimeError("Invalid segment "+str(i))
    return target

parts=[]
credits=[]
for i,(video_id,title,subtitle,secs,author) in enumerate(SCENES):
    src=download_clip(video_id)
    p=segment(src,draw_overlay(i,title,subtitle),i,secs)
    parts.append(p)
    credits.append(f"Scene {i+1}: {author}, https://www.pexels.com/video/{video_id}/ (Pexels Licence)")
concat=ROOT/"concat.txt"
concat.write_text("".join("file '"+str(x.resolve())+"'\n" for x in parts),encoding="utf-8")
final=OUT/"AU_The_Cost_of_a_No_Show_Real_Footage_25s.mp4"
run(["ffmpeg","-y","-loglevel","error","-f","concat","-safe","0","-i",concat,
     "-c","copy","-movflags","+faststart",final],timeout=180)
data=json.loads(run(["ffprobe","-v","error","-show_entries","format=duration,size","-of","json",final]))
print("FINAL",str(final),data,flush=True)
(OUT/"source_credits.txt").write_text("\n".join(credits)+
 "\n\nFootage: real Pexels camera footage, assembled for AU; scenes are dramatised illustrations, not footage of any actual business/customer.\nNo social media posts have been published.\n",encoding="utf-8")
(OUT/"video_validation.json").write_text(json.dumps({
 "duration_seconds":float(data["format"]["duration"]),
 "size_bytes":int(data["format"]["size"]),
 "all_scenes_live_video":True,
 "sources":[v[0] for v in SCENES],
 "aspect":"16:9",
 "size":"1280x720",
 "no_slide_screen":True
},indent=2),encoding="utf-8")
# visual check montage real frame samples from delivered video
for t in [1,5,9,13,17,21]:
    run(["ffmpeg","-y","-loglevel","error","-ss",str(t),"-i",final,
         "-frames:v","1",OUT/f"frame_{t:02d}.jpg"])
