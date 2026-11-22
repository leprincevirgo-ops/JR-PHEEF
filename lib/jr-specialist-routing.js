"use strict";

function inferJrSpecialistMode(value) {
  const q=String(value==null?"":value).toLowerCase();
  if(/\b(quantum|qubit|quantum mechanics|quantum computing|quantum field|quantum information)\b/.test(q))return "quantum";
  if(/\b(human history|history of humanity|world history|african history|historical timeline|historical evidence|civilisation history|civilization history)\b/.test(q))return "human_history";
  if(/\b(civilisation archive|civilization archive|digital archive|archival preservation|preserve records|preserve historical records|long[- ]term archive)\b/.test(q))return "civilisation_archive";
  if(/\b(physics|relativity|thermodynamics|electromagnetism|particle physics|mechanics)\b/.test(q))return "physics";
  if(/\b(mathematics|mathematical|math|algebra|calculus|geometry|topology|number theory|theorem|proof|equation)\b/.test(q))return "mathematics";
  if(/\b(jpc|tokenomics|token supply|fixed supply|market graph|market price|digital asset|token market)\b/.test(q))return "market_research";
  return "universe";
}

module.exports=inferJrSpecialistMode;
