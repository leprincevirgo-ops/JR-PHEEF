const STOP_WORDS=new Set(["a","an","the","and","or","for","to","of","in","on","at","with","near","me","my","i","need","want","looking","find","please","is","are","be","as","by","from","that","this","it","we","you","can","help","na","ya","kwa","ni","wa","za","la","ku","and","or"]);
const TYPE_FILTERS={
 all:()=>true,
 goods_services:c=>c.kind==="listing"||(c.kind==="opportunity"&&["goods","service"].includes(String(c.opportunityType||"").toLowerCase())),
 jobs:c=>c.kind==="opportunity"&&String(c.opportunityType||"").toLowerCase()==="job",
 property:c=>c.kind==="property"||(c.kind==="listing"&&/property|real estate|land|house|apartment|bedsitter|room/i.test([c.title,c.description,c.category].join(" ")))||(c.kind==="opportunity"&&String(c.opportunityType||"").toLowerCase()==="property"),
 partners:c=>c.kind==="opportunity"&&["partnership","business_opportunity"].includes(String(c.opportunityType||"").toLowerCase()),
 transport:c=>[c.title,c.description,c.category,c.opportunityType].join(" ").toLowerCase().match(/transport|delivery|rider|courier|moving|logistics|vehicle|driver/)!==null
};
export function tokenize(value){
 return String(value||"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter(x=>x.length>1&&!STOP_WORDS.has(x));
}
function containsToken(haystack,token){return tokenize(haystack).some(word=>word===token||word.startsWith(token)||token.startsWith(word));}
export function rankMatches({query,location="",matchType="all",maxPrice=null,candidates=[]}={}){
 const terms=[...new Set(tokenize(query))];
 if(!terms.length)return [];
 const filter=TYPE_FILTERS[matchType]||TYPE_FILTERS.all;
 const locationTerms=tokenize(location);
 return (Array.isArray(candidates)?candidates:[]).filter(c=>c&&c.id&&c.ownerId&&filter(c))
  .filter(c=>!locationTerms.length||!c.location||/remote|online|anywhere|global/i.test(String(c.location))||locationTerms.some(term=>containsToken(c.location,term)))
  .filter(c=>maxPrice===null||maxPrice===undefined||!Number.isFinite(Number(c.price))||Number(c.price)<=Number(maxPrice))
  .map(c=>{
   const title=String(c.title||""),description=String(c.description||""),category=String(c.category||""),type=String(c.opportunityType||c.kind||""),place=String(c.location||"");
   let covered=0,weighted=0;const titleHit=[],detailHit=[],categoryHit=[];
   for(const term of terms){
    let matched=false;
    if(containsToken(title,term)){weighted+=5;matched=true;titleHit.push(term);}
    if(containsToken(category,term)){weighted+=4;matched=true;categoryHit.push(term);}
    if(containsToken(type,term)){weighted+=3;matched=true;categoryHit.push(term);}
    if(containsToken(description,term)){weighted+=2;matched=true;detailHit.push(term);}
    if(containsToken(place,term)){weighted+=2;matched=true;}
    if(matched)covered++;
   }
   if(!covered)return null;
   const locationHits=locationTerms.filter(term=>containsToken(place,term)).length;
   const coverage=(covered/terms.length)*65;
   const relevance=Math.min(1,weighted/(terms.length*14))*25;
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
