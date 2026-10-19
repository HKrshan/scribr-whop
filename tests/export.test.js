import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, readdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {publicWebConfig} from '../scripts/lib/public-web-config.js';
import {buildWeb} from '../scripts/build-web.js';
import {verifiedCheckout} from '../web/src/routes.js';

test('unconfigured export is usable, has no credentials or endpoint, and rejects unsafe partial configuration',async()=>{
  const config=publicWebConfig({SECRET_KEY:'must-never-be-exported'});
  assert.deepEqual(config,{authEnabled:false,websiteOrigin:null,apiOrigin:null,publishableKey:null,syncHost:null,storeUrl:null});
  for(const key of ['PUBLIC_WEBSITE_ORIGIN','PUBLIC_API_ORIGIN','PUBLIC_CLERK_SYNC_HOST','PUBLIC_CLERK_PUBLISHABLE_KEY']) assert.throws(()=>publicWebConfig({[key]:'set'}),/requires all four/);
  const env={PUBLIC_WEBSITE_ORIGIN:'https://website.example.test',PUBLIC_API_ORIGIN:'https://api.example.test',PUBLIC_CLERK_SYNC_HOST:'https://sync.example.test',PUBLIC_CLERK_PUBLISHABLE_KEY:'invalid-public-key'};
  assert.throws(()=>publicWebConfig(env),/public Clerk publishable key/);
  for(const value of ['http://localhost:8787','https://user:pass@api.example.test','https://api.example.test/path','https://api.example.test?x=1','https://api.example.test#fragment']) assert.throws(()=>publicWebConfig({...env,PUBLIC_API_ORIGIN:value}));
  assert.throws(()=>publicWebConfig({PUBLIC_STORE_URL:'https://unsafe.example.test/listing'}));
  let calls=0;
  await assert.rejects(verifiedCheckout(null,'starter',()=>{calls++;}),/requires production configuration/);
  assert.equal(calls,0);
  const output=await mkdtemp(join(tmpdir(),'scribr-whop-'));
  try {
    await buildWeb({env:{SECRET_KEY:'must-never-be-exported'},outdir:output});
    assert.deepEqual(JSON.parse(await readFile(join(output,'assets/config.json'),'utf8')),config);
    const home=await readFile(join(output,'index.html'),'utf8');
    assert.match(home,/Watch in/);assert.match(home,/data-studio-scene/);assert.match(home,/Illustrative sample/);
    assert.equal((await readdir(join(output,'assets/studio'))).length,9);
    assert.doesNotMatch(await readFile(join(output,'assets/main.js'),'utf8'),/must-never-be-exported/);
    for(const route of ['sign-in','sign-up','welcome','account','privacy','help']) assert.match(await readFile(join(output,route,'index.html'),'utf8'),/Scribr/);
  } finally {await rm(output,{recursive:true,force:true});}
});
