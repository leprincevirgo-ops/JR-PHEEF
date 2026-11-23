"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {simulate}=require("../public/quantum-simulator.js");
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-10, a+" not close to "+b);
test("Bell pair entangles q0 and q1 with equal |00> and |11> probabilities",()=>{
 const r=simulate([["H",0],["CNOT",0]]);
 close(r.probabilities[0],.5);close(r.probabilities[1],0);close(r.probabilities[2],0);close(r.probabilities[3],.5);
});
test("Hadamard on q0 creates equal |00> and |01> probabilities",()=>{
 const r=simulate([["H",0]]);
 close(r.probabilities[0],.5);close(r.probabilities[1],.5);close(r.probabilities[2],0);close(r.probabilities[3],0);
});
test("Pauli X flips q0 from |00> to |01>",()=>{
 const r=simulate([["X",0]]);
 close(r.probabilities[0],0);close(r.probabilities[1],1);close(r.probabilities[2],0);close(r.probabilities[3],0);
});
test("Pauli X on q1 flips |00> to |10>",()=>{
 const r=simulate([["X",1]]);
 close(r.probabilities[0],0);close(r.probabilities[1],0);close(r.probabilities[2],1);close(r.probabilities[3],0);
});
test("H-Z-H on q0 produces a q0 bit flip",()=>{
 const r=simulate([["H",0],["Z",0],["H",0]]);
 close(r.probabilities[1],1);close(r.probabilities[0],0);
});
test("state probabilities remain normalized",()=>{
 for(const gates of [[],[["H",0]],[["H",1]],[["H",0],["H",1]],[["H",0],["CNOT",0]],[["X",1],["H",0]]]){
  close(simulate(gates).probabilities.reduce((a,b)=>a+b,0),1);
 }
});
test("rejects unsupported gates and oversized circuits",()=>{
 assert.throws(()=>simulate([["Y",0]]),/Unsupported gate/);
 assert.throws(()=>simulate(Array.from({length:21},()=>["X",0])),/20 gates/);
});
