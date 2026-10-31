"use strict";
const fs=require("fs");
const html=fs.readFileSync("public/index.html","utf8");
const server=fs.readFileSync("server.js","utf8");
const css=fs.readFileSync("public/coordination-studio.css","utf8");
const js=fs.readFileSync("public/coordination-studio.js","utf8");
const checks=[
["coordination studio is in JR Assistant",html.includes('id="jrCoordinationStudio"')],
["all four coordination patterns are available",["many-to-many","one-to-many","many-to-one","one-to-one"].every(x=>html.includes('value="'+x+'"'))],
["participant scale is bounded",html.includes('max="1000"')],
["visual network container exists",html.includes('id="jrCoordVisual"')],
["project save uses authenticated project API",js.includes('fetch("/api/projects"')],
["answer depth selector is connected",html.includes('id="aiAnswerDepth"')&&html.includes('answer_depth:$(')],
["AI right-sizing instructions exist",server.includes("Right-size every answer")],
["AI visual explanation instructions exist",server.includes("visual descriptions")],
["AI multi-party coordination instructions exist",server.includes("many-to-many")],
["responsive network styles exist",css.includes("@media(max-width:520px)")],
["limitations are disclosed",html.includes("invitations, shared assignments and live multi-party execution require further connected workflows")]
];
for(const [label,ok] of checks){console.log((ok?"PASS ":"FAIL ")+label);if(!ok)process.exitCode=1;}