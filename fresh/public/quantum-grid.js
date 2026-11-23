(()=>{"use strict";
const root=document.querySelector("#view-worlds");if(!root||document.getElementById("jrQuantumGrid"))return;
const section=document.createElement("section");section.id="jrQuantumGrid";section.className="jr-quantum-grid";
section.innerHTML=`
 <div class="jr-quantum-heading"><div><p class="eyebrow">JR QUANTUM WORK · COMPUTE GRID</p><h2>Quantum Workbench</h2><p class="view-copy">Explore quantum computing, build small circuits and compare simulation with classical computing. This workbench runs a local educational simulator; no external quantum hardware is connected.</p></div><span class="jr-quantum-status">LOCAL SIMULATOR READY</span></div>
 <div class="jr-quantum-cards">
  <article><span>01 · INTELLIGENCE</span><h3>Quantum science</h3><p>Learn quantum physics, mathematics, algorithms, circuits and research methods.</p></article>
  <article><span>02 · WORK</span><h3>Experiment studio</h3><p>Compose gates, simulate state vectors, inspect probabilities and repeat experiments.</p></article>
  <article><span>03 · GRID</span><h3>Compute routing</h3><p>Choose classical, quantum simulation or an external quantum provider when one is connected and authorised.</p></article>
 </div>
 <div class="jr-quantum-workbench">
  <div class="jr-quantum-workbench-title"><div><p class="eyebrow">INTERACTIVE EXPERIMENT</p><h3>Two-qubit circuit simulator</h3></div><span class="jr-quantum-chip">Up to 2 qubits</span></div>
  <p class="jr-quantum-help">Choose a starter experiment or build a circuit. The simulator calculates the state vector and measurement probabilities locally in your browser.</p>
  <div class="jr-quantum-controls">
   <label>Starter experiment<select id="jrQuantumPreset"><option value="bell">Bell pair · entanglement</option><option value="superposition">Superposition</option><option value="bitflip">Bit flip</option><option value="phase">Phase flip</option><option value="custom">Custom circuit</option></select></label>
   <label>Gate<select id="jrQuantumGate"><option value="H">Hadamard (H)</option><option value="X">Pauli-X</option><option value="Z">Pauli-Z</option><option value="CNOT">CNOT (control q0 → q1)</option></select></label>
   <label>Target<select id="jrQuantumTarget"><option value="0">Qubit 0</option><option value="1">Qubit 1</option></select></label>
   <button type="button" id="jrQuantumAdd">Add gate</button>
  </div>
  <div class="jr-quantum-circuit"><div><strong>Circuit</strong><p id="jrQuantumCircuit" aria-live="polite">H(q0) → CNOT(q0,q1)</p></div><button type="button" class="jr-quantum-secondary" id="jrQuantumClear">Clear circuit</button></div>
  <div class="jr-quantum-actions"><button type="button" id="jrQuantumRun">Run simulation</button><button type="button" class="jr-quantum-secondary" id="jrQuantumReset">Reset experiment</button><span id="jrQuantumFeedback" role="status">Ready. No external job has been submitted.</span></div>
  <div id="jrQuantumResults" class="jr-quantum-results" aria-live="polite"><p>Run an experiment to see its output probabilities.</p></div>
 </div>
 <div class="jr-quantum-routing"><h3>Quantum Grid · routing policy</h3><p>JR selects the appropriate compute path. Classical CPUs/GPUs remain the default for ordinary workloads; quantum simulation supports learning and small circuits; real quantum hardware requires a separately authorised provider connection, credentials, cost controls and job monitoring.</p><div class="jr-quantum-route-grid"><div><strong>Classical compute</strong><small>Available locally / connected infrastructure subject to deployment</small></div><div><strong>Quantum simulation</strong><small>Available now in this browser for circuits up to 2 qubits</small></div><div><strong>Quantum hardware</strong><small>Not connected · provider integration pending</small></div></div></div>
 <p class="jr-quantum-footnote">Scientific integrity: simulated results are not hardware experiments, and quantum computing is not faster for every problem. This prototype does not submit cloud jobs, charge users, store research, or promise scientific discoveries.</p>`;
root.append(section);
const $=id=>document.getElementById(id),sqrt=Math.SQRT1_2;
let gates=[["H",0],["CNOT",0]];
function label(g){return g[0]==="CNOT"?"CNOT(q0,q1)":g[0]+"(q"+g[1]+")";}
function renderCircuit(){$("jrQuantumCircuit").textContent=gates.length?gates.map(label).join(" → "):"No gates added · initial state |00⟩";}
function preset(name){const map={bell:[["H",0],["CNOT",0]],superposition:[["H",0],["H",1]],bitflip:[["X",0]],phase:[["H",0],["Z",0],["H",0]],custom:[]};gates=map[name].map(g=>g.slice());renderCircuit();$("jrQuantumResults").innerHTML="<p>Preset loaded. Run the simulation to calculate results.</p>";$("jrQuantumFeedback").textContent="Circuit prepared locally.";}
function runCircuit(){
 const result=window.JRQuantumSimulator.simulate(gates);
 const rows=result.probabilities.map((p,i)=>({state:"|"+i.toString(2).padStart(2,"0")+"⟩",p,amp:result.amplitudes[i]}));
 const html=rows.map(r=>'<div class="jr-quantum-prob"><div><strong>'+r.state+'</strong><small>Amplitude '+r.amp.re.toFixed(4)+(r.amp.im<0?" − ":" + ")+Math.abs(r.amp.im).toFixed(4)+'i</small></div><div class="jr-quantum-bar"><span style="width:'+(r.p*100).toFixed(2)+'%"></span></div><b>'+(r.p*100).toFixed(2)+'%</b></div>').join("");
 $("jrQuantumResults").innerHTML='<h4>Calculated measurement probabilities</h4>'+html+'<p class="jr-quantum-result-note">Exact state-vector probabilities for this ideal circuit; noise, decoherence and hardware imperfections are not modelled.</p>';
 $("jrQuantumFeedback").textContent="Simulation completed locally · "+gates.length+" gate(s) · 2 qubits.";
}
$("jrQuantumPreset").addEventListener("change",e=>preset(e.target.value));
$("jrQuantumAdd").addEventListener("click",()=>{const gate=$("jrQuantumGate").value,target=Number($("jrQuantumTarget").value);if(gates.length>=20){$("jrQuantumFeedback").textContent="Circuit limit: 20 gates.";return;}if(gate==="CNOT"){if(gates.some(g=>g[0]==="CNOT")){$("jrQuantumFeedback").textContent="This teaching simulator supports one CNOT per circuit.";return;}gates.push(["CNOT",0]);}else gates.push([gate,target]);$("jrQuantumPreset").value="custom";renderCircuit();$("jrQuantumFeedback").textContent="Gate added. Run the simulator when ready.";});
$("jrQuantumClear").addEventListener("click",()=>{gates=[];$("jrQuantumPreset").value="custom";renderCircuit();$("jrQuantumResults").innerHTML="<p>Circuit cleared.</p>";$("jrQuantumFeedback").textContent="Ready for a new circuit.";});
$("jrQuantumRun").addEventListener("click",runCircuit);
$("jrQuantumReset").addEventListener("click",()=>preset("bell"));
renderCircuit();
})();