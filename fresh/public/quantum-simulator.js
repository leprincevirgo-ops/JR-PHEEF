"use strict";
(function(root){
  function simulate(gates){
    if(!Array.isArray(gates)||gates.length>20)throw new TypeError("Circuit must contain at most 20 gates.");
    const z=()=>({re:0,im:0}),s=[{re:1,im:0},z(),z(),z()],h=Math.SQRT1_2;
    for(const item of gates){
      if(!Array.isArray(item)||!["H","X","Z","CNOT"].includes(item[0]))throw new TypeError("Unsupported gate.");
      const gate=item[0],target=Number(item[1]);
      if(gate==="CNOT"){
        // Basis index uses q0 as the least-significant bit. Control q0 -> target q1.
        [s[1],s[3]]=[s[3],s[1]];
        continue;
      }
      if(target!==0&&target!==1)throw new TypeError("Single-qubit gate target must be q0 or q1.");
      for(let i=0;i<4;i++)if(((i>>target)&1)===0){
        const j=i|(1<<target),a=s[i],b=s[j];
        if(gate==="X"){s[i]=b;s[j]=a;}
        else if(gate==="H"){
          s[i]={re:(a.re+b.re)*h,im:(a.im+b.im)*h};
          s[j]={re:(a.re-b.re)*h,im:(a.im-b.im)*h};
        }else if(gate==="Z")s[j]={re:-b.re,im:-b.im};
      }
    }
    const probabilities=s.map(a=>a.re*a.re+a.im*a.im);
    const total=probabilities.reduce((sum,p)=>sum+p,0);
    if(!Number.isFinite(total)||total<=0)throw new Error("Invalid simulated state.");
    return {amplitudes:s.map(a=>({...a})),probabilities:probabilities.map(p=>p/total)};
  }
  const api=Object.freeze({simulate});
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.JRQuantumSimulator=api;
})(typeof window!=="undefined"?window:null);
