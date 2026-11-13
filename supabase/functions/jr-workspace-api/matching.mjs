const STOP_WORDS=new Set(["a","an","the","and","or","for","to","of","in","on","at","with","near","me","my","i","need","want","looking","find","please","is","are","be","as","by","from","that","this","it","we","you","can","help","na","ya","kwa","ni","wa","za","la","ku","nataka","natafuta","nahitaji","naomba","nisaidie","tafuta","mimi"]);
const SYNONYMS={
 fundi:["electrician","plumber","mechanic","technician"],
 umeme:["electrician","electrical","electricity"],
 kazi:["job","work","employment","vacancy"],
 ajira:["job","vacancy","employment"],
 nyumba:["house","home","property"],
 chumba:["room","bedsitter","studio"],
 bidhaa:["goods","product"],
 huduma:["service"],
 biashara:["business","company"],
 mshirika:["partner","partnership"],
 mwekezaji:["investor"],
 usafiri:["transport","vehicle"],
 dereva:["driver"],
 pikipiki:["motorcycle","rider","boda"],
 nduthi:["motorcycle","rider","boda"],
 peleka:["delivery","courier"],
 nunua:["buy","purchase"],
 uza:["sell"]
};
const TYPE_FILTERS={
 all:()=>true,
 goods_services:c=>c.kind==="listing"||(c.kind==="opportunity"&&["goods","service"].includes(String(c.opportunityType||"").toLowerCase())),
 jobs:c=>(c.kind==="opportunity"&&String(c.opportunityType||"").toLowerCase()==="job")||(c.kind==="listing"&&/\b(job|vacancy|employment|career)\b/i.test([c.title,c.description,c.category].join(" "))),
 property:c=>c.kind==="property"||(c.kind==="listing"&&/property|real estate|land|house|apartment|bedsitter|room/i.test([c.title,c.description,c.category].join(" ")))||(c.kind==="opportunity"&&String(c.opportunityType||"").toLowerCase()==="property"),
 partners:c=>c.kind==="opportunity"&&["partnership","business_opportunity"].includes(String(c.opportunityType||"").toLowerCase()),
 transport:c=>[c.title,c.description,c.category,c.opportunityType].join(" ").toLowerCase().match(/transport|delivery|rider|courier|moving|logistics|vehicle|driver|boda|motorcycle/)!==null
};
export function tokenize(value){
 return String(value||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter(x=>x.length>1&&!STOP_WORDS.has(x));
}
function containsToken(haystack,token){return tokenize(haystack).some(word=>word===token||word.startsWith(token)||token.startsWith(word));}
export function rankMatches({query,location="",matchType="all",maxPrice=null,candidates=[]}={}){
 const groups=[...new Set(tokenize(query))].map(token=>[token,...(SYNONYMS[token]||[])]);
 if(!groups.length)return [];
 const filter=TYPE_FILTERS[matchType]||TYPE_FILTERS.all;
 const locationTerms=tokenize(location);
 return (Array.isArray(candidates)?candidates:[]).filter(c=>c&&c.id&&c.ownerId&&filter(c))
  .filter(c=>!locationTerms.length||!c.location||/remote|online|anywhere|global/i.test(String(c.location))||locationTerms.some(term=>containsToken(c.location,term)))
  .filter(c=>maxPrice===null||maxPrice===undefined||!Number.isFinite(Number(c.price))||Number(c.price)<=Number(maxPrice))
  .map(c=>{
   const title=String(c.title||""),description=String(c.description||""),category=String(c.category||""),type=String(c.opportunityType||c.kind||""),place=String(c.location||"");
   let covered=0,weighted=0;const titleHit=[],detailHit=[],categoryHit=[];
   for(const group of groups){
    let hit=null;
    for(const term of group){
     if(containsToken(title,term)){hit={weight:5,field:"title",term:group[0]};break;}
     if(containsToken(category,term)){hit={weight:4,field:"category",term:group[0]};break;}
     if(containsToken(type,term)){hit={weight:3,field:"type",term:group[0]};break;}
     if(containsToken(description,term)){hit={weight:2,field:"description",term:group[0]};break;}
     if(containsToken(place,term)){hit={weight:2,field:"location",term:group[0]};break;}
    }
    if(hit){covered++;weighted+=hit.weight;if(hit.field==="title")titleHit.push(hit.term);if(hit.field==="category"||hit.field==="type")categoryHit.push(hit.term);if(hit.field==="description")detailHit.push(hit.term);}
   }
   if(!covered)return null;
   const locationHits=locationTerms.filter(term=>containsToken(place,term)).length;
   const coverage=(covered/groups.length)*65;
   const relevance=Math.min(1,weighted/(groups.length*5))*25;
   const locationScore=locationTerms.length?(locationHits/locationTerms.length)*10:0;
   const score=Math.max(1,Math.min(99,Math.round(coverage+relevance+locationScore)));
   const reasons=[];
   if(titleHit.length)reasons.push("Title matches "+titleHit.slice(0,3).join(", "));
   if(categoryHit.length)reasons.push("Category or type matches");
   if(detailHit.length)reasons.push("Description matches");
   if(locationHits)reasons.push("Location matches");
   return {...c,matchScore:score,matchReasons:reasons};
  }).filter(Boolean).sort((a,b)=>b.matchScore-a.matchScore||String(b.createdAt||"").localeCompare(String(a.createdAt||"")));
}
