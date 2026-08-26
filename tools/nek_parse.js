// NEK chamber (Wix) member-page parser — slug=name, footer-number frequency filter
const fs=require("fs");
const dir=process.argv[2];
const files=fs.readdirSync(dir).filter(f=>f.endsWith(".html"));
const freq={};
const pages=files.map(f=>{
 const h=fs.readFileSync(dir+"/"+f,"utf8");
 const phones=[...new Set([...h.matchAll(/\(?(802|603)\)?[ .-]?(\d{3})[ .-](\d{4})/g)].map(m=>m[1]+m[2]+m[3]))];
 phones.forEach(p=>freq[p]=(freq[p]||0)+1);
 const slug=f.replace(".html","");
 const name=slug.split("-").map(w=>w.charAt(0).toUpperCase()+w.slice(1)).join(" ").replace(/\bLlc\b/,"LLC").replace(/\bSt\b/,"St.");
 const town=((h.match(/(St\.? Johnsbury|Saint Johnsbury|Lyndonville|Danville|Barnet|Waterford|Concord|Lunenburg|Ryegate|Littleton|Lancaster|Whitefield|Sutton|Burke|Newport|Derby|Island Pond|Glover|Hardwick|Craftsbury|Greensboro|Peacham|Groton|Wells River|Bradford|Lyndon)\b/i)||[])[1])||"";
 return {name,phones,town};
});
const common=new Set(Object.entries(freq).filter(([p,n])=>n>3).map(([p])=>p));
const RING=new Set(["St. Johnsbury","St Johnsbury","Saint Johnsbury","Lyndonville","Lyndon","Danville","Barnet","Waterford","Concord","Lunenburg","Ryegate","Littleton","Lancaster","Whitefield"]);
function cat(n){const s=n.toLowerCase();
 if(/funeral|cremat|monument/.test(s))return"Funeral Home / Monuments";
 if(/law |law$|attorney|legal/.test(s))return"Elder Law / Estate Attorney";
 if(/insurance/.test(s))return"Insurance";
 if(/wealth|financial|cpa|account|bookkeep/.test(s))return"Financial Planner / Retirement";
 if(/bank|credit union/.test(s))return"Bank / Credit Union";
 if(/dental|dentist|orthodont/.test(s))return"Dentist / Dentures";
 if(/eye|optic|vision/.test(s))return"Eye / Optometry";
 if(/hearing|audiolog/.test(s))return"Hearing / Audiology";
 if(/pharmac/.test(s))return"Pharmacy";
 if(/chiro|physical therapy|rehab/.test(s))return"Physical Therapy / Chiropractic";
 if(/assisted|senior|manor|home care|home health|hospice|visiting/.test(s))return"Retirement / Senior Living";
 if(/plumb|septic/.test(s))return"Plumbing / Sewer";
 if(/hvac|heating|fuel|propane|energy/.test(s))return"Heating / AC";
 if(/electric/.test(s))return"Electrician";
 if(/roof|siding/.test(s))return"Roofing / Siding / Gutters";
 if(/landscap|tree service|excavat|paving|lawn/.test(s))return"Landscaping / Snow / Tree";
 if(/construction|remodel|carpentr|builder/.test(s))return"Remodeling / Bath & Accessibility";
 if(/auto|garage|tire|collision/.test(s))return"Auto Service / Tire";
 if(/realty|real estate/.test(s))return"Realtor / Downsizing / Senior Move";
 return null;}
const sheet=fs.readFileSync(__dirname+"/../littleton-strose/index.html","utf8");
const have=new Set([...sheet.matchAll(/p:"([^"]+)"/g)].map(m=>m[1].replace(/\D/g,"")));
const fmt=d=>"("+d.slice(0,3)+") "+d.slice(3,6)+"-"+d.slice(6);
const keeps=[],oor=[],dup=[];let nocat=0,nop=0;
pages.forEach(pg=>{
 const c=cat(pg.name);
 if(!c){nocat++;return}
 const cand=pg.phones.filter(p=>!common.has(p));
 if(!cand.length){nop++;return}
 const d=cand[0];
 if(have.has(d)){dup.push(pg.name);return}
 let t=(pg.town||"St. Johnsbury").replace(/^Saint /,"St. ");
 if(t==="St Johnsbury")t="St. Johnsbury";
 if(t==="Lyndon")t="Lyndonville";
 if(!RING.has(t)){oor.push(pg.name+" ["+t+"]");return}
 keeps.push({c,n:"⭐ "+pg.name.slice(0,60)+" [NEK chamber ✓]",p:fmt(d),t});
 have.add(d);
});
console.log("KEEPS:",keeps.length,"| dup:",dup.length,"| not-his-cats:",nocat,"| OOR:",oor.length,"| no-clean-phone:",nop);
keeps.forEach(k=>console.log("  +",k.p,"|",k.c.slice(0,18).padEnd(18),"|",k.n.slice(2,52),"|",k.t));
console.log("OOR:",oor.slice(0,12).join(" · "));
console.log("DUP:",dup.join(" · "));
fs.writeFileSync(process.argv[3],JSON.stringify(keeps,null,1));
