'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

test('Every published HTML page loads both visitor trackers',()=>{
  const root=path.join(__dirname,'..');
  const pages=fs.readdirSync(root).filter(name=>name.endsWith('.html'));
  assert(pages.length>=15,'unexpectedly few public HTML pages');
  for(const page of pages){
    const body=fs.readFileSync(path.join(root,page),'utf8');
    assert.match(body,/<script\\b[^>]*\\bsrc=["']\\/metricool\\.js\\?v=[^"']+["']/i,page+' lacks Metricool');
    assert.match(body,/<script\\b[^>]*\\bsrc=["']\\/_vercel\\/insights\\/script\\.js["']/i,page+' lacks Vercel Web Analytics');
  }
});

test('Metricool requires accepted consent before starting',()=>{
  const script=fs.readFileSync(path.join(__dirname,'..','metricool.js'),'utf8');
  assert.match(script,/choice\\(\\) !== 'accepted'/);
  assert.match(script,/tracker\\.metricool\\.com\\/resources\\/be\\.js/);
  assert.match(script,/window\\.beTracker\\.t/);
});
