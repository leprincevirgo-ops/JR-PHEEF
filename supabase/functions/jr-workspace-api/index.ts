import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { rankMatches } from "./matching.mjs";

const cors = {
  "Access-Control-Allow-Origin": "https://jr-pheef-marketplace.onrender.com",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: cors });
const clean = (v: unknown, max = 500) => typeof v === "string" ? v.trim().slice(0, max) : "";
const uuid = (v: unknown) => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok:false, error:"Method not allowed." },405);
  const token=(req.headers.get("Authorization")||"").replace(/^Bearer /,"");
  const url=Deno.env.get("SUPABASE_URL")||"";
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||Deno.env.get("SUPABASE_SECRET_KEY")||"";
  const publish=Deno.env.get("SUPABASE_ANON_KEY")||Deno.env.get("SUPABASE_PUBLISHABLE_KEY")||"";
  if(!token||!url||!service||!publish)return json({ok:false,error:"JR workspace is not configured."},503);
  try {
    const auth=await fetch(url+"/auth/v1/user",{headers:{apikey:publish,Authorization:"Bearer "+token}});
    if(!auth.ok)return json({ok:false,error:"Please sign in again."},401);
    const user=await auth.json();
    if(!user.email_confirmed_at)return json({ok:false,error:"Verify your email before using JR PHEEF."},403);
    const headers={apikey:service,Authorization:"Bearer "+service,"Content-Type":"application/json"};
    const rest=async(path:string,method="GET",body?:unknown,prefer="return=representation")=>{
      const response=await fetch(url+"/rest/v1/"+path,{method,headers:{...headers,Prefer:prefer},body:body===undefined?undefined:JSON.stringify(body)});
      const raw=await response.text();let data:any=null;try{data=raw?JSON.parse(raw):null;}catch{}
      if(!response.ok)throw new Error("Database operation failed ("+response.status+").");
      return data;
    };
    const profiles=await rest("members?auth_user_id=eq."+encodeURIComponent(user.id)+"&select=id,full_name,email,jp_number,role,account_type,verified,status,phone,bio,city,country,theme,profile_photo,profile_photo_hidden,profile_photo_hidden_url,profile_visibility,public_phone,show_email,show_location&limit=1");
    const member=profiles?.[0];
    if(!member||member.status!=="active")return json({ok:false,error:"Your member profile is not active."},403);
    const input=await req.json().catch(()=>({}));
    const action=clean(input.action,60);
    const mid=member.id;
    const rows=(table:string,query:string)=>rest(table+"?"+query);
    const insert=(table:string,body:unknown)=>rest(table,"POST",body);
    const response=(data:unknown)=>json({ok:true,data});
    const storagePath=(value:unknown)=>typeof value==="string"&&/^[0-9a-f-]{36}\/(profile|status|channel|opportunity|listing|ad)\/[A-Za-z0-9._-]{1,160}$/.test(value);
    const signedMedia=async(items:any[])=>Promise.all((Array.isArray(items)?items:[]).map(async(item:any)=>{
      if(!item||!storagePath(item.path))return null;
      const r=await fetch(url+"/storage/v1/object/sign/jr-pheef-member-media/"+item.path,{method:"POST",headers,body:JSON.stringify({expiresIn:3600})});
      if(!r.ok)return null;const d=await r.json();return {...item,url:url+"/storage/v1"+(d.signedURL||d.signedUrl||"")};
    })).then(x=>x.filter(Boolean));
    const uploadMemberMedia=async()=> {
      const purpose=clean(input.purpose,20),mime=clean(input.contentType,80);
      const allowed=["image/jpeg","image/png","image/webp","video/mp4","video/webm","video/quicktime"];
      if(!["profile","status","channel","opportunity","listing","ad"].includes(purpose)||!allowed.includes(mime))throw new Error("Choose a supported photo or video.");
      const encoded=clean(input.fileBase64,12000000).replace(/^data:[^;]+;base64,/,"");
      if(!encoded||encoded.length>11200000)throw new Error("Media file is too large. Maximum upload is 8 MB.");
      const bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));
      if(bytes.length>8388608)throw new Error("Media file is too large. Maximum upload is 8 MB.");
      const ext=({ "image/jpeg":"jpg","image/png":"png","image/webp":"webp","video/mp4":"mp4","video/webm":"webm","video/quicktime":"mov"} as Record<string,string>)[mime];
      const safeName=clean(input.fileName,80).replace(/[^A-Za-z0-9._-]/g,"_").slice(-60)||("upload."+ext);
      const path=mid+"/"+purpose+"/"+crypto.randomUUID()+"-"+safeName;
      const r=await fetch(url+"/storage/v1/object/jr-pheef-member-media/"+path,{method:"POST",headers:{apikey:service,Authorization:"Bearer "+service,"Content-Type":mime,"x-upsert":"false"},body:bytes});
      if(!r.ok)throw new Error("Secure media upload failed.");
      const meta={path,contentType:mime,fileName:safeName,kind:mime.startsWith("video/")?"video":"image"};
      const signed=await signedMedia([meta]);return signed[0]||meta;
    };

    if(action==="overview"){
      const [listings,marketListings,opportunities,projects,goals,businesses,statuses,notifications,deliveries,rooms,marketRooms,dealRooms]=await Promise.all([
        rows("jr_listings","member_id=eq."+mid+"&select=id,title,description,price,location,category,status,media,created_at&order=created_at.desc&limit=30"),
        rows("jr_listings","status=eq.active&select=id,member_id,title,description,price,location,category,media,created_at&order=created_at.desc&limit=30"),
        rows("jr_opportunities","publication_status=eq.published&select=id,owner_user_id,title,description,opportunity_type,location,currency_code,verification_status,media,created_at&order=created_at.desc&limit=30"),
        rows("jr_projects","member_id=eq."+mid+"&select=id,title,goal,status,budget_ksh,summary,created_at&order=created_at.desc&limit=30"),
        rows("family_goals","member_id=eq."+mid+"&select=id,title,target_amount,saved_amount,target_date,status&order=created_at.desc&limit=30"),
        rows("jr_business_workspaces","owner_member_id=eq."+mid+"&select=id,business_name,sector,location,status,plan_tier&order=created_at.desc&limit=20"),
        rows("jr_status_updates","member_id=eq."+mid+"&select=id,body,background,visibility,created_at,expires_at&order=created_at.desc&limit=20"),
        rows("jr_notifications","member_id=eq."+mid+"&select=id,title,message,type,read,created_at&order=created_at.desc&limit=30"),
        rows("jr_delivery_requests","requester_id=eq."+mid+"&select=id,pickup,destination,description,status,created_at&order=created_at.desc&limit=20"),
        rows("room_listings","member_id=eq."+mid+"&select=id,title,room_type,rent_ksh,location,description,status,available_from,media&order=created_at.desc&limit=30"),
        rows("room_listings","status=eq.active&select=id,member_id,title,room_type,rent_ksh,location,description,available_from,media&order=created_at.desc&limit=50"),
        rows("jr_deal_rooms","or=(buyer_id.eq."+mid+",seller_id.eq."+mid+")&select=id,buyer_id,seller_id,listing_id,amount,offer_amount,status,buyer_agreed,seller_agreed,created_at&order=created_at.desc&limit=30")
      ]);
      return response({member, listings:await Promise.all((listings||[]).map(async (item:any)=>({...item,media:await signedMedia(item.media||[])}))), marketListings:await Promise.all((marketListings||[]).map(async (item:any)=>({...item,media:await signedMedia(item.media||[])}))), opportunities:await Promise.all((opportunities||[]).map(async (item:any)=>({...item,media:await signedMedia(item.media||[])}))), projects, familyGoals:goals, businesses, statuses, notifications, deliveries, rooms:await Promise.all((rooms||[]).map(async (item:any)=>({...item,media:await signedMedia(item.media||[])}))), marketRooms:await Promise.all((marketRooms||[]).map(async (item:any)=>({...item,media:await signedMedia(item.media||[])}))), dealRooms, services:{liveAi:false,payments:false,production:false}});
    }
    if(action==="list_worlds"){
      const data=await rows("jr_worlds","owner_member_id=eq."+mid+"&select=id,world_type,name,description,status,created_at,updated_at&order=created_at.desc&limit=100");
      return response(data||[]);
    }
    if(action==="create_world"){
      const name=clean(input.name,120),description=clean(input.description,2000),type=clean(input.worldType,30);
      const allowed=["personal","family_personal","business","education","commerce","family_finance","creative","community","global"];
      if(name.length<2||!allowed.includes(type))return json({ok:false,error:"Enter a world name and choose a valid world type."},400);
      const workflows=Array.isArray(input.workflows)?input.workflows.slice(0,20).map((x:any)=>clean(x,120)).filter(Boolean):[];
      const data=await insert("jr_worlds",{owner_member_id:mid,world_type:type,name,description,intended_members:clean(input.intendedMembers,500)||"Owner only",permissions:{owner:"manage",members:"invite-only"},workflows,status:"active"});
      return response(data?.[0]||data);
    }
    if(action==="get_world"||action==="update_world"){
      const worldId=clean(input.worldId,50);
      if(!uuid(worldId))return json({ok:false,error:"Choose a valid world."},400);
      const found=await rows("jr_worlds","id=eq."+worldId+"&owner_member_id=eq."+mid+"&select=id,owner_member_id,world_type,name,description,intended_members,permissions,workflows,status,created_at,updated_at&limit=1");
      const world=found?.[0];
      if(!world)return json({ok:false,error:"This world was not found or you do not have permission to manage it."},404);
      if(action==="get_world")return response(world);
      const patch:any={updated_at:new Date().toISOString()};
      if(input.status!==undefined){const status=clean(input.status,20);if(!["active","paused"].includes(status))return json({ok:false,error:"Choose active or paused."},400);patch.status=status;}
      if(input.name!==undefined){const name=clean(input.name,120);if(name.length<2)return json({ok:false,error:"World name must be at least two characters."},400);patch.name=name;}
      if(input.description!==undefined)patch.description=clean(input.description,2000);
      if(input.intendedMembers!==undefined)patch.intended_members=clean(input.intendedMembers,500)||"Owner only";
      if(input.workflows!==undefined){if(!Array.isArray(input.workflows))return json({ok:false,error:"World activities must be a list."},400);patch.workflows=input.workflows.slice(0,20).map((x:any)=>clean(x,120)).filter(Boolean);}
      if(Object.keys(patch).length===1)return json({ok:false,error:"There are no world changes to save."},400);
      const updated=await rest("jr_worlds?id=eq."+worldId+"&owner_member_id=eq."+mid,"PATCH",patch);
      return response(updated?.[0]||{...world,...patch});
    }
    if(action==="create_listing"){
      const title=clean(input.title,120),description=clean(input.description,2000),location=clean(input.location,180),category=clean(input.category,60);
      const price=Number(input.price);
      if(title.length<3||location.length<2||!Number.isFinite(price)||price<0)return json({ok:false,error:"Add a title, location and valid non-negative price."},400);
      const media=Array.isArray(input.media)?input.media.slice(0,8):[];
      if(media.some((m:any)=>!m||!storagePath(m.path)||!m.path.startsWith(mid+"/listing/")))return json({ok:false,error:"Offer media is invalid."},400);
      const data=await insert("jr_listings",{member_id:mid,title,description,price,location,category:category||"other",seller_name:member.full_name,status:"active",negotiable:Boolean(input.negotiable),media});
      return response(data?.[0]||data);
    }
    if(action==="submit_idea_to_dgbo"){
      const title=clean(input.title,180),summary=clean(input.summary,3000),sector=clean(input.sector,80)||"general",targetMarket=clean(input.targetMarket,240);
      if(input.consentToDgbo!==true)return json({ok:false,error:"Please explicitly confirm that you want to submit this idea to DGBO."},400);
      if(title.length<3||summary.length<20)return json({ok:false,error:"Enter a title and at least 20 characters describing your idea."},400);
      const dossier=await insert("dgbo_opportunity_dossiers",{title,summary,sector,target_market:targetMarket,source_type:"member_submission",source_name:"Member-submitted idea",source_url:null,submitted_by_member_id:mid,consent_to_dgbo:true,status:"ready_for_review",created_by_member_id:mid});
      const created=dossier?.[0];if(!created?.id)throw new Error("The idea could not be added to the review queue.");
      await insert("dgbo_opportunity_events",{dossier_id:created.id,actor_member_id:mid,actor_type:"member",event_type:"submitted",details:{source_type:"member_submission",consent:true}});
      return response({id:created.id,status:created.status,message:"Your idea has been submitted to DGBO for private review. It has not been approved or published."});
    }
    if(action==="create_opportunity"){
      const title=clean(input.title,140),description=clean(input.description,3000),type=clean(input.opportunityType,60)||"business_opportunity";
      const location=clean(input.location,180);
      if(title.length<3||description.length<10)return json({ok:false,error:"Enter a clear title and at least 10 characters of description."},400);
      const media=Array.isArray(input.media)?input.media.slice(0,8):[];
      if(media.some((m:any)=>!m||!storagePath(m.path)||!m.path.startsWith(mid+"/opportunity/")))return json({ok:false,error:"Opportunity media is invalid."},400);
      const data=await insert("jr_opportunities",{owner_user_id:mid,title,description,opportunity_type:type,location:location||null,media,publication_status:"published",verification_status:"unverified"});
      return response(data?.[0]||data);
    }
    if(action==="express_interest"){
      const opportunityId=clean(input.opportunityId,50),message=clean(input.message,1000);
      if(!uuid(opportunityId))return json({ok:false,error:"Select a valid opportunity."},400);
      const found=await rows("jr_opportunities","id=eq."+opportunityId+"&publication_status=eq.published&select=id,owner_user_id&limit=1");
      if(!found?.length||found[0].owner_user_id===mid)return json({ok:false,error:"This opportunity is unavailable."},404);
      const data=await insert("jr_opportunity_interests",{opportunity_id:opportunityId,member_id:mid,message,status:"pending"});
      await insert("jr_notifications",{member_id:found[0].owner_user_id,title:"New opportunity interest",message:member.full_name+" expressed interest in your opportunity.",type:"opportunity_interest",read:false});
      return response(data?.[0]||data);
    }
    if(action==="create_business"){
      const name=clean(input.businessName,140),sector=clean(input.sector,80)||"other",location=clean(input.location,180);
      if(name.length<2)return json({ok:false,error:"Enter a business name."},400);
      const data=await insert("jr_business_workspaces",{owner_member_id:mid,business_name:name,sector,location:location||null,goals:clean(input.goals,1000)||null,status:"setup",plan_tier:"free"});
      const business=data?.[0];if(!business?.id)throw new Error("Business workspace could not be created.");
      await insert("jr_business_workspace_members",{business_id:business.id,member_id:mid,role_key:"owner",permissions:["business:manage","people:manage","data:import","data:export","integrations:manage","documents:manage","finance:view","approvals:manage","sales:create","inventory:manage","tasks:manage"],status:"active"});
      return response(business);
    }
    const businessAccess=async(businessId:string,required:string)=>{
      if(!uuid(businessId))return null;
      const membership=(await rows("jr_business_workspace_members","business_id=eq."+businessId+"&member_id=eq."+mid+"&status=eq.active&select=role_key,permissions&limit=1"))?.[0];
      if(!membership)return null;
      const perms=Array.isArray(membership.permissions)?membership.permissions:[];
      if(membership.role_key!=="owner"&&membership.role_key!=="manager"&&!perms.includes("business:manage")&&!perms.includes(required))return null;
      return membership;
    };
    if(action==="list_business_workspaces"){
      const owned=await rows("jr_business_workspaces","owner_member_id=eq."+mid+"&select=id,business_name,sector,location,status,plan_tier,created_at&order=created_at.desc&limit=50");
      const joined=await rows("jr_business_workspace_members","member_id=eq."+mid+"&status=eq.active&select=business_id,role_key&limit=100");
      const ids=(joined||[]).map((x:any)=>x.business_id).filter((x:string)=>uuid(x));
      const shared=ids.length?await rows("jr_business_workspaces","id=in.("+ids.join(",")+")&select=id,business_name,sector,location,status,plan_tier,created_at&limit=100"):[];
      const all=new Map<string,any>();for(const b of [...(owned||[]),...(shared||[])])all.set(b.id,{...b,myRole:b.owner_member_id===mid?"owner":(joined||[]).find((x:any)=>x.business_id===b.id)?.role_key||"staff"});
      return response([...all.values()]);
    }
    if(action==="business_overview"||action==="list_business_products"||action==="list_business_tasks"||action==="list_business_sales"){
      const businessId=clean(input.businessId,50),required=action==="list_business_sales"?"finance:view":action==="list_business_tasks"?"tasks:manage":"inventory:manage";
      const access=await businessAccess(businessId,required);
      if(!access)return json({ok:false,error:"Business workspace not found or you do not have permission."},403);
      if(action==="list_business_products"||action==="business_overview"){
        const products=await rows("jr_business_products","business_id=eq."+businessId+"&active=eq.true&select=id,sku,name,category,unit_price,currency_code,stock_quantity,reorder_level,unit_label&order=name.asc&limit=500");
        if(action==="list_business_products")return response(products||[]);
        const [tasks,sales,suppliers,purchaseOrders,customers,expenses]=await Promise.all([
          rows("jr_business_tasks","business_id=eq."+businessId+"&select=id,title,department,priority,status,due_at,created_at&order=created_at.desc&limit=100"),
          rows("jr_business_sales","business_id=eq."+businessId+"&select=id,receipt_number,total,currency_code,payment_method,status,created_at&order=created_at.desc&limit=100"),
          rows("jr_business_suppliers","business_id=eq."+businessId+"&select=id,name,contact_name,email,phone,status&order=name.asc&limit=200"),
          rows("jr_business_purchase_orders","business_id=eq."+businessId+"&select=id,order_number,supplier_id,status,currency_code,total_amount,created_at&order=created_at.desc&limit=100"),
          rows("jr_business_customers","business_id=eq."+businessId+"&select=id,customer_name,phone,email,customer_type,status&order=customer_name.asc&limit=500"),
          rows("jr_business_expenses","business_id=eq."+businessId+"&select=id,category,description,amount,currency_code,payment_method,status,occurred_at&order=occurred_at.desc&limit=200")
        ]);
        return response({products:products||[],tasks:tasks||[],sales:sales||[],suppliers:suppliers||[],purchaseOrders:purchaseOrders||[],customers:customers||[],expenses:expenses||[],role:access.role_key});
      }
      if(action==="list_business_tasks"){
        const data=await rows("jr_business_tasks","business_id=eq."+businessId+"&select=id,title,description,department,priority,status,due_at,created_at&order=created_at.desc&limit=200");
        return response(data||[]);
      }
      const data=await rows("jr_business_sales","business_id=eq."+businessId+"&select=id,receipt_number,total,currency_code,payment_method,status,created_at&order=created_at.desc&limit=200");
      return response(data||[]);
    }
    if(action==="create_business_product"){
      const businessId=clean(input.businessId,50),access=await businessAccess(businessId,"inventory:manage");
      if(!access)return json({ok:false,error:"You do not have inventory permission for this business."},403);
      const sku=clean(input.sku,60),name=clean(input.name,160),price=Number(input.unitPrice),stock=Number(input.openingStock||0),reorder=Number(input.reorderLevel||0);
      if(sku.length<1||name.length<2||!Number.isFinite(price)||price<0||!Number.isFinite(stock)||stock<0||!Number.isFinite(reorder)||reorder<0)return json({ok:false,error:"Check the SKU, product name, price and stock quantities."},400);
      const created=await insert("jr_business_products",{business_id:businessId,sku,name,category:clean(input.category,80)||"general",unit_price:price,currency_code:clean(input.currencyCode,3)||"KES",stock_quantity:stock,reorder_level:reorder,unit_label:clean(input.unitLabel,20)||"unit"});
      const product=created?.[0];if(!product?.id)throw new Error("Product could not be created.");
      if(stock>0)await insert("jr_business_stock_movements",{business_id:businessId,product_id:product.id,actor_member_id:mid,movement_type:"opening",quantity_delta:stock,note:"Opening stock"});
      return response(product);
    }
    if(action==="receive_business_stock"){
      const businessId=clean(input.businessId,50),productId=clean(input.productId,50),quantity=Number(input.quantity),access=await businessAccess(businessId,"inventory:manage");
      if(!access)return json({ok:false,error:"You do not have inventory permission for this business."},403);
      if(!uuid(productId)||!Number.isFinite(quantity)||quantity<=0||quantity>100000)return json({ok:false,error:"Enter a valid product and received quantity."},400);
      const product=(await rows("jr_business_products","id=eq."+productId+"&business_id=eq."+businessId+"&select=id,stock_quantity&limit=1"))?.[0];
      if(!product)return json({ok:false,error:"Product not found in this business."},404);
      await rest("jr_business_products?id=eq."+productId+"&business_id=eq."+businessId,"PATCH",{stock_quantity:Number(product.stock_quantity)+quantity,updated_at:new Date().toISOString()});
      await insert("jr_business_stock_movements",{business_id:businessId,product_id:productId,actor_member_id:mid,movement_type:"receive",quantity_delta:quantity,note:clean(input.note,240)});
      return response({received:quantity});
    }
    if(action==="create_business_customer"){
      const businessId=clean(input.businessId,50),access=await businessAccess(businessId,"sales:create"),name=clean(input.customerName,160);
      if(!access)return json({ok:false,error:"You do not have customer-management permission for this business."},403);
      if(name.length<2)return json({ok:false,error:"Enter a customer name."},400);
      const type=["retail","wholesale","business","other"].includes(input.customerType)?input.customerType:"retail";
      const data=await insert("jr_business_customers",{business_id:businessId,customer_name:name,phone:clean(input.phone,30)||null,email:clean(input.email,254)||null,customer_type:type,notes:clean(input.notes,1000),status:"active"});
      return response(data?.[0]||data);
    }
    if(action==="record_business_expense"){
      const businessId=clean(input.businessId,50),access=await businessAccess(businessId,"finance:view"),amount=Number(input.amount),description=clean(input.description,240);
      if(!access)return json({ok:false,error:"You do not have expense-recording permission for this business."},403);
      if(description.length<3||!Number.isFinite(amount)||amount<=0||amount>100000000000)return json({ok:false,error:"Enter an expense description and a valid amount."},400);
      const method=clean(input.paymentMethod,30);
      if(!["cash","card","mobile_money","bank_transfer","other"].includes(method))return json({ok:false,error:"Choose a supported payment method."},400);
      const currency=clean(input.currencyCode,3)||"KES";if(!/^[A-Z]{3}$/.test(currency))return json({ok:false,error:"Enter a valid currency code."},400);
      const data=await insert("jr_business_expenses",{business_id:businessId,recorded_by:mid,category:clean(input.category,60)||"general",description,amount,currency_code:currency,payment_method:method,payment_reference:clean(input.paymentReference,120)||null});
      return response(data?.[0]||data);
    }
    if(action==="create_business_supplier"){
      const businessId=clean(input.businessId,50),access=await businessAccess(businessId,"purchasing:manage"),name=clean(input.name,160);
      if(!access)return json({ok:false,error:"You do not have supplier-management permission for this business."},403);
      if(name.length<2)return json({ok:false,error:"Enter a supplier name."},400);
      const data=await insert("jr_business_suppliers",{business_id:businessId,name,contact_name:clean(input.contactName,120)||null,email:clean(input.email,254)||null,phone:clean(input.phone,30)||null,notes:clean(input.notes,1000),status:"active"});
      return response(data?.[0]||data);
    }
    if(action==="create_business_purchase_order"){
      const businessId=clean(input.businessId,50),items=Array.isArray(input.items)?input.items:[];
      if(!await businessAccess(businessId,"purchasing:manage"))return json({ok:false,error:"You do not have purchasing permission for this business."},403);
      if(!uuid(clean(input.supplierId,50))||items.length<1||items.length>100)return json({ok:false,error:"Choose a supplier and at least one order line."},400);
      const cleanItems=items.map((x:any)=>({product_id:clean(x.productId,50),quantity:Number(x.quantity),unit_cost:Number(x.unitCost)}));
      if(cleanItems.some((x:any)=>!uuid(x.product_id)||!Number.isFinite(x.quantity)||x.quantity<=0||!Number.isFinite(x.unit_cost)||x.unit_cost<0)||new Set(cleanItems.map((x:any)=>x.product_id)).size!==cleanItems.length)return json({ok:false,error:"Check the product, quantity and unit cost on each order line."},400);
      const data=await rest("rpc/jr_business_create_purchase_order","POST",{p_business_id:businessId,p_actor_member_id:mid,p_supplier_id:clean(input.supplierId,50),p_items:cleanItems,p_notes:clean(input.notes,1000)});
      return response(data);
    }
    if(action==="receive_business_purchase_order"){
      const businessId=clean(input.businessId,50),orderId=clean(input.purchaseOrderId,50);
      if(!await businessAccess(businessId,"inventory:manage")&&!await businessAccess(businessId,"purchasing:manage"))return json({ok:false,error:"You do not have stock-receiving permission for this business."},403);
      if(!uuid(orderId))return json({ok:false,error:"Choose a valid purchase order."},400);
      const data=await rest("rpc/jr_business_receive_purchase_order","POST",{p_business_id:businessId,p_actor_member_id:mid,p_purchase_order_id:orderId});
      return response(data);
    }
    if(action==="create_business_task"){
      const businessId=clean(input.businessId,50),access=await businessAccess(businessId,"tasks:manage"),title=clean(input.title,180);
      if(!access)return json({ok:false,error:"You do not have task-management permission for this business."},403);
      if(title.length<3)return json({ok:false,error:"Enter a task title."},400);
      const data=await insert("jr_business_tasks",{business_id:businessId,created_by:mid,title,description:clean(input.description,1500),department:clean(input.department,60)||"general",priority:["low","normal","high","urgent"].includes(input.priority)?input.priority:"normal",due_at:clean(input.dueAt,40)||null});
      return response(data?.[0]||data);
    }
    if(action==="record_business_sale"){
      const businessId=clean(input.businessId,50),items=Array.isArray(input.items)?input.items:[];
      if(!await businessAccess(businessId,"sales:create"))return json({ok:false,error:"You do not have sales permission for this business."},403);
      if(items.length<1||items.length>100)return json({ok:false,error:"Choose at least one product for this sale."},400);
      const cleanItems=items.map((x:any)=>({product_id:clean(x.productId,50),quantity:Number(x.quantity)}));
      if(cleanItems.some((x:any)=>!uuid(x.product_id)||!Number.isFinite(x.quantity)||x.quantity<=0))return json({ok:false,error:"Sale items contain invalid products or quantities."},400);
      if(new Set(cleanItems.map((x:any)=>x.product_id)).size!==cleanItems.length)return json({ok:false,error:"Add each product once and adjust its quantity."},400);
      const method=clean(input.paymentMethod,30);
      if(!["cash","card","mobile_money","other"].includes(method))return json({ok:false,error:"Choose a supported payment method."},400);
      const data=await rest("rpc/jr_business_record_sale","POST",{p_business_id:businessId,p_actor_member_id:mid,p_items:cleanItems.map((x:any)=>({product_id:x.product_id,quantity:x.quantity})),p_payment_method:method,p_payment_reference:clean(input.paymentReference,120)});
      return response(data);
    }
    if(action==="create_project"){
      const title=clean(input.title,140),goal=clean(input.goal,1500);
      if(title.length<3||goal.length<5)return json({ok:false,error:"Add a project title and goal."},400);
      const data=await insert("jr_projects",{member_id:mid,title,goal,budget_ksh:input.budget===null||input.budget===""?null:Number(input.budget),summary:clean(input.summary,1500)||null,status:"planning"});
      return response(data?.[0]||data);
    }
    if(action==="create_family_goal"){
      const title=clean(input.title,140),target=Number(input.targetAmount);
      if(title.length<3||!Number.isFinite(target)||target<=0)return json({ok:false,error:"Enter a goal name and a positive target amount."},400);
      const data=await insert("family_goals",{member_id:mid,title,target_amount:target,target_date:clean(input.targetDate,10)||null,status:"active"});
      return response({goal:data?.[0]||data,note:"This records a personal goal only. It does not deposit, hold, lend or transfer money."});
    }
    if(action==="upload_media"){const media=await uploadMemberMedia();return response(media);}
    if(action==="create_status"){
      const body=clean(input.body,700),media=Array.isArray(input.media)?input.media.slice(0,5):[];
      if(!body&&!media.length)return json({ok:false,error:"Add text or media before sharing your status."},400);
      if(media.some((m:any)=>!m||!storagePath(m.path)||!m.path.startsWith(mid+"/status/")))return json({ok:false,error:"Status media is invalid."},400);
      const visibility=input.visibility==="private"?"private":input.visibility==="public"||input.visibility==="everyone"?"everyone":"connections";
      const data=await insert("jr_status_updates",{member_id:mid,body,media,visibility,background:clean(input.background,30)||"ocean"});
      return response(data?.[0]||data);
    }
    if(action==="list_my_statuses"){
      const data=await rows("jr_status_updates","member_id=eq."+mid+"&select=id,body,media,visibility,background,created_at,updated_at,expires_at&order=created_at.desc&limit=30");
      return response(await Promise.all((data||[]).map(async(s:any)=>({...s,media:await signedMedia(s.media||[])}))));
    }
    if(action==="update_status"||action==="delete_status"){
      const id=clean(input.statusId,50);if(!uuid(id))return json({ok:false,error:"Choose a valid status."},400);
      const found=await rows("jr_status_updates","id=eq."+id+"&member_id=eq."+mid+"&select=id,body,media,visibility&limit=1");
      if(!found?.length)return json({ok:false,error:"Status not found or not yours."},404);
      if(action==="delete_status"){
        for(const item of found[0].media||[])if(item?.path&&storagePath(item.path)&&item.path.startsWith(mid+"/status/"))await fetch(url+"/storage/v1/object/jr-pheef-member-media/"+item.path,{method:"DELETE",headers});
        await rest("jr_status_updates?id=eq."+id,"DELETE",undefined,"return=minimal");return response({deleted:true});
      }
      const body=clean(input.body,700),visibility=input.visibility==="private"?"private":input.visibility==="public"||input.visibility==="everyone"?"everyone":"connections";
      if(!body&&!(found[0].media||[]).length)return json({ok:false,error:"A status cannot be empty."},400);
      const updated=await rest("jr_status_updates?id=eq."+id+"&member_id=eq."+mid,"PATCH",{body,visibility,updated_at:new Date().toISOString()});
      return response(updated?.[0]||{updated:true});
    }
    if(action==="update_profile"){
      const patch:any={};
      for(const key of ["bio","city","country","theme"])if(typeof input[key]==="string")patch[key]=clean(input[key],key==="bio"?500:120);
      if(typeof input.profile_photo==="string"){
        if(input.profile_photo==="" ){patch.profile_photo="";patch.profile_photo_hidden_url="";patch.profile_photo_hidden=false;}
        else if(storagePath(input.profile_photo)&&input.profile_photo.startsWith(mid+"/profile/")){patch.profile_photo=input.profile_photo;patch.profile_photo_hidden=false;patch.profile_photo_hidden_url="";}
      }
      if(input.profile_photo_hidden===true){patch.profile_photo_hidden=true;patch.profile_photo_hidden_url=member.profile_photo||member.profile_photo_hidden_url||"";patch.profile_photo="";}
      if(input.profile_photo_hidden===false){patch.profile_photo_hidden=false;const replacingPhoto=typeof input.profile_photo==="string"&&storagePath(input.profile_photo)&&input.profile_photo.startsWith(mid+"/profile/");if(!replacingPhoto&&input.profile_photo!==""&&member.profile_photo_hidden_url){patch.profile_photo=member.profile_photo_hidden_url;patch.profile_photo_hidden_url="";}}
      if(typeof input.profile_photo_hidden_url==="string"&&input.profile_photo_hidden_url===""&&input.profile_photo==="")patch.profile_photo_hidden_url="";
      patch.public_phone=false;
      for(const key of ["show_email","show_location"])if(typeof input[key]==="boolean")patch[key]=input[key];
      if(typeof input.profile_visibility==="string"&&["public","connections","private"].includes(input.profile_visibility))patch.profile_visibility=input.profile_visibility;
      if(!Object.keys(patch).length)return json({ok:false,error:"There are no valid profile changes to save."},400);
      const data=await rest("members?id=eq."+mid,"PATCH",patch);
      return response(data?.[0]||{updated:true});
    }
    if(action==="get_profile_photo"){
      const p=await rows("members?id=eq."+mid+"&select=profile_photo,profile_photo_hidden,profile_photo_hidden_url&limit=1");
      const path=p?.[0]?.profile_photo_hidden?p?.[0]?.profile_photo_hidden_url:p?.[0]?.profile_photo;
      if(!path||!storagePath(path))return response({url:null,hidden:!!p?.[0]?.profile_photo_hidden});
      const signed=await signedMedia([{path,kind:"image"}]);return response({url:signed[0]?.url||null,hidden:!!p?.[0]?.profile_photo_hidden});
    }
    if(action==="list_connections"){
      const data=await rows("connections","or=(requester_id.eq."+mid+",receiver_id.eq."+mid+")&select=id,requester_id,receiver_id,status,created_at&order=created_at.desc&limit=100");
      const ids=[...new Set((data||[]).flatMap((x:any)=>[x.requester_id,x.receiver_id]).filter((id:any)=>String(id)!==String(mid)))];
      const people=ids.length?await rows("members","id=in.("+ids.map((id:any)=>encodeURIComponent(String(id))).join(",")+")&select=id,full_name,verified,profile_visibility,country_code,role,account_type,status"):[];
      const byId=new Map((people||[]).map((person:any)=>[String(person.id),person]));
      return response((data||[]).map((connection:any)=>{
        const other=byId.get(String(connection.requester_id)===String(mid)?connection.receiver_id:connection.requester_id);
        if(!other){const {requester_id,receiver_id,...safeConnection}=connection;return {...safeConnection,direction:String(receiver_id)===String(mid)?"incoming":"outgoing",other_member:null};}
        const privateProfile=String(other.profile_visibility||"public").toLowerCase()==="private";
        const owner=[other.role,other.account_type].some((value:any)=>String(value||"").toLowerCase()==="owner");
        const countryCode=connection.status==="accepted"&&!privateProfile&&!owner&&/^[A-Z]{2}$/.test(String(other.country_code||""))?String(other.country_code):null;
        const {requester_id,receiver_id,...safeConnection}=connection;
        return {...safeConnection,direction:String(receiver_id)===String(mid)?"incoming":"outgoing",other_member:{
          contact_key:connection.id,
          full_name:privateProfile?"JR PHEEF Member":other.full_name||"JR PHEEF Member",
          verified:!!other.verified,
          profile_visibility:privateProfile?"private":"public",
          country_code:countryCode,
          connected:connection.status==="accepted"
        }};
      }));
    }
    if(action==="create_contact_invite"){
      const since=new Date(Date.now()-24*60*60*1000).toISOString();
      const recent=await rows("jp_contact_invites","member_id=eq."+encodeURIComponent(String(mid))+"&created_at=gt."+encodeURIComponent(since)+"&select=id&limit=10");
      if((recent||[]).length>=10)return json({ok:false,error:"You have reached today's invitation limit. Try again tomorrow."},429);
      const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);
      const invite=[...bytes].map((b:number)=>b.toString(16).padStart(2,"0")).join("");
      const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(invite));
      const tokenHash=[...new Uint8Array(digest)].map((b:number)=>b.toString(16).padStart(2,"0")).join("");
      const expiresAt=new Date(Date.now()+7*24*60*60*1000).toISOString();
      await insert("jp_contact_invites",{member_id:mid,token_hash:tokenHash,expires_at:expiresAt});
      return response({invite_code:invite,expires_at:expiresAt,message:"Private invitation created. It expires in seven days and does not reveal your JP number."});
    }
    if(action==="request_connection_by_invite"){
      const raw=clean(input.invite_code,160);
      const match=raw.match(/(?:jp_invite=)?([a-f0-9]{64})/i);
      if(!match)return json({ok:false,error:"Paste a valid JR PHEEF invitation link or code."},400);
      const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(match[1].toLowerCase()));
      const tokenHash=[...new Uint8Array(digest)].map((b:number)=>b.toString(16).padStart(2,"0")).join("");
      const invites=await rows("jp_contact_invites","token_hash=eq."+tokenHash+"&revoked_at=is.null&expires_at=gt."+encodeURIComponent(new Date().toISOString())+"&select=id,member_id&limit=1");
      const invite=invites?.[0];
      if(!invite)return json({ok:false,error:"This invitation has expired or is no longer available."},404);
      const targetId=String(invite.member_id);
      if(targetId===String(mid))return json({ok:false,error:"This is your own invitation."},400);
      const targets=await rows("members","id=eq."+encodeURIComponent(targetId)+"&select=id,full_name,verified,status,profile_visibility&limit=1");
      const target=targets?.[0];
      if(!target||["blocked","suspended","disabled"].includes(String(target.status||"").toLowerCase()))return json({ok:false,error:"This member is not currently available."},404);
      const since=new Date(Date.now()-60*60*1000).toISOString();
      const recent=await rows("connections","requester_id=eq."+encodeURIComponent(String(mid))+"&status=eq.pending&created_at=gt."+encodeURIComponent(since)+"&select=id&limit=20");
      if((recent||[]).length>=20)return json({ok:false,error:"You have reached the connection-request limit for this hour."},429);
      const existing=await rows("connections","or=(and(requester_id.eq."+mid+",receiver_id.eq."+targetId+"),and(requester_id.eq."+targetId+",receiver_id.eq."+mid+"))&select=id,status&limit=1");
      if(existing?.length&&["pending","accepted"].includes(String(existing[0].status))){const {requester_id,receiver_id,...safeExisting}=existing[0];return response({already_exists:true,connection:safeExisting,message:"A connection request or connection already exists."});}
      let created;
      if(existing?.length)created=await rest("connections?id=eq."+encodeURIComponent(existing[0].id),"PATCH",{requester_id:String(mid),receiver_id:targetId,status:"pending",updated_at:new Date().toISOString()});
      else created=await insert("connections",{requester_id:String(mid),receiver_id:targetId,status:"pending"});
      await insert("jr_notifications",{member_id:targetId,title:"New connection request",message:member.full_name+" wants to connect with you on JR PHEEF.",type:"connection",read:false});
      const saved=created?.[0]||created;const {requester_id,receiver_id,...safeSaved}=saved||{};
      return response({already_exists:false,connection:safeSaved,message:"Connection request sent. Both JP numbers remain private."});
    }
    if(action==="request_connection"){
      return json({ok:false,error:"JP numbers are private. Ask the member for a JR PHEEF invitation link or code instead."},410);
    }
    if(action==="update_connection"){
      const id=clean(input.connectionId,50),status=clean(input.status,20);
      if(!uuid(id)||!["accepted","declined","cancelled"].includes(status))return json({ok:false,error:"Choose a valid connection action."},400);
      const found=await rows("connections","id=eq."+encodeURIComponent(id)+"&select=id,requester_id,receiver_id,status&limit=1");
      const current=found?.[0];
      if(!current)return json({ok:false,error:"Connection request not found."},404);
      if(current.status!=="pending")return json({ok:false,error:"This connection request is no longer pending."},409);
      const isReceiver=String(current.receiver_id)===String(mid),isRequester=String(current.requester_id)===String(mid);
      if((status==="accepted"||status==="declined")&&!isReceiver)return json({ok:false,error:"Only the recipient can accept or decline this request."},403);
      if(status==="cancelled"&&!isRequester)return json({ok:false,error:"Only the requester can cancel this request."},403);
      const updated=await rest("connections?id=eq."+encodeURIComponent(id),"PATCH",{status,updated_at:new Date().toISOString()});
      const saved=updated?.[0]||{...current,status};const {requester_id,receiver_id,...safeSaved}=saved;
      return response({connection:safeSaved,message:"Connection updated."});
    }
    if(action==="find_matches"){
      const query=clean(input.query,240);
      const matchType=clean(input.matchType,30)||"all";
      const location=clean(input.location,180);
      const maxPrice=input.maxPrice===""||input.maxPrice===null||input.maxPrice===undefined?null:Number(input.maxPrice);
      if(query.length<2)return json({ok:false,error:"Describe what you need in at least two characters."},400);
      if(!["all","goods_services","jobs","property","partners","transport"].includes(matchType))return json({ok:false,error:"Choose a valid matching category."},400);
      if(maxPrice!==null&&(!Number.isFinite(maxPrice)||maxPrice<0))return json({ok:false,error:"Enter a valid maximum budget."},400);
      const [listings,opportunities,properties]=await Promise.all([
        rows("jr_listings","status=eq.active&select=id,member_id,title,description,price,location,category,created_at&order=created_at.desc&limit=100"),
        rows("jr_opportunities","publication_status=eq.published&select=id,owner_user_id,title,description,opportunity_type,location,currency_code,verification_status,created_at&order=created_at.desc&limit=100"),
        rows("room_listings","status=eq.active&select=id,member_id,title,room_type,rent_ksh,location,description,available_from,created_at&order=created_at.desc&limit=100")
      ]);
      const candidates=[
        ...(listings||[]).filter((x:any)=>x.member_id!==mid).map((x:any)=>({id:x.id,kind:"listing",ownerId:x.member_id,title:x.title,description:x.description,category:x.category,location:x.location,price:Number(x.price),currency:"KES",createdAt:x.created_at})),
        ...(opportunities||[]).filter((x:any)=>x.owner_user_id!==mid).map((x:any)=>({id:x.id,kind:"opportunity",ownerId:x.owner_user_id,title:x.title,description:x.description,category:x.opportunity_type,opportunityType:x.opportunity_type,location:x.location,price:null,currency:x.currency_code||"KES",verificationStatus:x.verification_status,createdAt:x.created_at})),
        ...(properties||[]).filter((x:any)=>x.member_id!==mid).map((x:any)=>({id:x.id,kind:"property",ownerId:x.member_id,title:x.title,description:x.description,category:x.room_type,location:x.location,price:Number(x.rent_ksh),currency:"KES",availableFrom:x.available_from,createdAt:x.created_at}))
      ];
      const matches=rankMatches({query,location,matchType,maxPrice,candidates});
      return response(matches.slice(0,25));
    }
    if(action==="search_members"){
      const term=clean(input.query,80);
      if(term.length<2)return json({ok:false,error:"Enter at least two characters of a member's name."},400);
      const safe=term.replace(/[,%()]/g," ").trim();
      const found=await rows("members","status=eq.active&profile_visibility=eq.public&select=id,full_name,bio,city,country,country_code,verified,role,account_type&full_name=ilike.*"+encodeURIComponent(safe)+"*&limit=15");
      const results=(found||[]).filter((m:any)=>m.id!==mid);
      const [follows,connections]=await Promise.all([
        rows("social_follows","follower_id=eq."+mid+"&select=followee_id&limit=300"),
        rows("connections","or=(requester_id.eq."+mid+",receiver_id.eq."+mid+")&select=id,requester_id,receiver_id,status&limit=300")
      ]);
      const followed=new Set((follows||[]).map((x:any)=>x.followee_id));
      const connectionByMember=new Map((connections||[]).map((c:any)=>[String(c.requester_id)===String(mid)?String(c.receiver_id):String(c.requester_id),c]));
      return response(results.map((m:any)=>{
        const owner=[m.role,m.account_type].some((value:any)=>String(value||"").toLowerCase()==="owner");
        const {role,account_type,...publicMember}=m;
        const connection=connectionByMember.get(String(m.id));
        return {...publicMember,country_code:owner?null:m.country_code||null,is_following:followed.has(m.id),connection_id:connection?.id||null,connection_status:connection?.status||null,connection_direction:connection?(String(connection.receiver_id)===String(mid)?"incoming":"outgoing"):null};
      }));
    }
    if(action==="request_connection_by_member_id"){
      const targetId=clean(input.memberId,50);
      if(!uuid(targetId)||targetId===String(mid))return json({ok:false,error:"Choose a valid other JR PHEEF member."},400);
      const since=new Date(Date.now()-60*60*1000).toISOString();
      const recent=await rows("connections","requester_id=eq."+encodeURIComponent(String(mid))+"&status=eq.pending&created_at=gt."+encodeURIComponent(since)+"&select=id&limit=20");
      if((recent||[]).length>=20)return json({ok:false,error:"You have reached the connection-request limit for this hour."},429);
      const targets=await rows("members","id=eq."+encodeURIComponent(targetId)+"&select=id,full_name,verified,status,profile_visibility&limit=1");
      const target=targets?.[0];
      if(!target||["blocked","suspended","disabled"].includes(String(target.status||"").toLowerCase()))return json({ok:false,error:"This member is not currently available."},404);
      const existing=await rows("connections","or=(and(requester_id.eq."+mid+",receiver_id.eq."+targetId+"),and(requester_id.eq."+targetId+",receiver_id.eq."+mid+"))&select=id,status,requester_id,receiver_id&limit=1");
      if(existing?.length&&["pending","accepted"].includes(String(existing[0].status))){const {requester_id,receiver_id,...safeExisting}=existing[0];return response({already_exists:true,connection:safeExisting,message:existing[0].status==="accepted"?"You are already connected.":"A connection request is already pending."});}
      let created;
      if(existing?.length)created=await rest("connections?id=eq."+encodeURIComponent(existing[0].id),"PATCH",{requester_id:String(mid),receiver_id:targetId,status:"pending",updated_at:new Date().toISOString()});
      else created=await insert("connections",{requester_id:String(mid),receiver_id:targetId,status:"pending"});
      await insert("jr_notifications",{member_id:targetId,title:"New connection request",message:member.full_name+" wants to connect with you on JR PHEEF.",type:"connection",read:false});
      const saved=created?.[0]||created;const {requester_id,receiver_id,...safeSaved}=saved||{};
      return response({already_exists:false,connection:safeSaved,member:{full_name:String(target.profile_visibility||"public").toLowerCase()==="private"?"JR PHEEF Member":target.full_name||"JR PHEEF Member",verified:!!target.verified},message:"Connection request sent. JP numbers remain private."});
    }
    if(action==="list_ai_memories"){
      const data=await rows("jr_memory_items","member_id=eq."+mid+"&active=eq.true&consent_ai_context=eq.true&select=memory_kind,memory_text&order=updated_at.desc&limit=30");
      return response(data||[]);
    }
    if(action==="list_jr_memories"){
      const data=await rows("jr_memory_items","member_id=eq."+mid+"&select=id,memory_kind,memory_text,consent_ai_context,active,source,created_at,updated_at&order=created_at.desc&limit=100");
      return response(data||[]);
    }
    if(action==="create_jr_memory"){
      const kind=clean(input.memoryKind,30),memoryText=clean(input.memoryText,1000);
      const allowed=["preference","goal","project_context","workflow","non_sensitive_fact"];
      if(!allowed.includes(kind)||memoryText.length<3)return json({ok:false,error:"Choose a memory type and enter at least three characters."},400);
      const data=await insert("jr_memory_items",{member_id:mid,memory_kind:kind,memory_text:memoryText,consent_ai_context:input.consentAiContext===true,active:true,source:"member_entered"});
      return response(data?.[0]||data);
    }
    if(action==="update_jr_memory"||action==="delete_jr_memory"){
      const id=clean(input.memoryId,50);
      if(!uuid(id))return json({ok:false,error:"Choose a valid memory item."},400);
      const found=await rows("jr_memory_items","id=eq."+id+"&member_id=eq."+mid+"&select=id,memory_kind,memory_text,consent_ai_context,active&limit=1");
      if(!found?.length)return json({ok:false,error:"This memory item was not found or does not belong to you."},404);
      if(action==="delete_jr_memory"){await rest("jr_memory_items?id=eq."+id+"&member_id=eq."+mid,"DELETE",undefined,"return=minimal");return response({deleted:true});}
      const patch:any={updated_at:new Date().toISOString()};
      if(input.memoryText!==undefined){const memoryText=clean(input.memoryText,1000);if(memoryText.length<3)return json({ok:false,error:"Memory text must be at least three characters."},400);patch.memory_text=memoryText;}
      if(input.memoryKind!==undefined){const kind=clean(input.memoryKind,30);if(!["preference","goal","project_context","workflow","non_sensitive_fact"].includes(kind))return json({ok:false,error:"Choose a valid memory type."},400);patch.memory_kind=kind;}
      if(input.consentAiContext!==undefined)patch.consent_ai_context=input.consentAiContext===true;
      if(input.active!==undefined)patch.active=input.active===true;
      if(Object.keys(patch).length===1)return json({ok:false,error:"There are no memory changes to save."},400);
      const updated=await rest("jr_memory_items?id=eq."+id+"&member_id=eq."+mid,"PATCH",patch);
      return response(updated?.[0]||{...found[0],...patch});
    }
    if(action==="list_ai_conversations"){
      const data=await rows("jr_ai_conversations","member_id=eq."+mid+"&select=id,title,created_at,updated_at,last_message_at&order=last_message_at.desc&limit=50");
      return response(data||[]);
    }
    if(action==="create_ai_conversation"){
      const title=clean(input.title,120)||"New conversation";
      const created=await insert("jr_ai_conversations",{member_id:mid,title});
      return response(created?.[0]||created);
    }
    if(action==="list_ai_messages"||action==="save_ai_message"){
      const conversationId=clean(input.conversationId,50);
      if(!uuid(conversationId))return json({ok:false,error:"Choose a valid JR conversation."},400);
      const found=await rows("jr_ai_conversations","id=eq."+conversationId+"&member_id=eq."+mid+"&select=id&limit=1");
      if(!found?.length)return json({ok:false,error:"This JR conversation was not found or does not belong to you."},404);
      if(action==="save_ai_message"){
        const role=clean(input.role,20),content=clean(input.content,5000);
        if(!["user","assistant"].includes(role)||!content)return json({ok:false,error:"A valid JR message is required."},400);
        const saved=await insert("jr_ai_messages",{conversation_id:conversationId,member_id:mid,role,content});
        await rest("jr_ai_conversations?id=eq."+conversationId+"&member_id=eq."+mid,"PATCH",{updated_at:new Date().toISOString(),last_message_at:new Date().toISOString()});
        return response(saved?.[0]||saved);
      }
      const messages=await rows("jr_ai_messages","conversation_id=eq."+conversationId+"&member_id=eq."+mid+"&select=id,role,content,created_at&order=created_at.asc&limit=200");
      return response(messages||[]);
    }
    if(action==="list_conversations"){
      const participants=await rows("jr_conversation_participants","member_id=eq."+mid+"&select=conversation_id,last_read_at&order=joined_at.desc&limit=50");
      const ids=(participants||[]).map((p:any)=>p.conversation_id).filter(uuid);
      if(!ids.length)return response([]);
      const conversations=await rows("jr_conversations","id=in.("+ids.join(",")+")&select=id,title,is_group,created_at,updated_at&order=updated_at.desc&limit=50");
      const result=[];
      for(const conv of conversations||[]){
        const peers=await rows("jr_conversation_participants","conversation_id=eq."+conv.id+"&member_id=neq."+mid+"&select=member_id&limit=5");
        const peerIds=(peers||[]).map((p:any)=>p.member_id).filter(uuid);
        const profiles=peerIds.length?await rows("members","id=in.("+peerIds.join(",")+")&select=full_name&limit=5"):[];
        const messages=await rows("jr_messages","conversation_id=eq."+conv.id+"&select=body,sender_id,created_at&order=created_at.desc&limit=1");
        result.push({...conv,peers:profiles,lastMessage:messages?.[0]||null});
      }
      return response(result);
    }
    if(action==="create_conversation"||action==="create_group"){
      const title=clean(input.title,80),ids=Array.isArray(input.memberIds)?[...new Set(input.memberIds.filter((x:any)=>uuid(x)&&x!==mid))].slice(0,49):[];
      if(action==="create_conversation"){const connectionId=clean(input.connectionId,50);if(connectionId){if(!uuid(connectionId))return json({ok:false,error:"Choose a valid JR PHEEF contact."},400);const connection=(await rows("connections","id=eq."+connectionId+"&select=id,requester_id,receiver_id,status&limit=1"))?.[0];if(!connection||connection.status!=="accepted"||![String(connection.requester_id),String(connection.receiver_id)].includes(String(mid)))return json({ok:false,error:"Only accepted contacts can start a private chat."},403);const other=String(connection.requester_id)===String(mid)?String(connection.receiver_id):String(connection.requester_id);ids.push(other);}else{const other=clean(input.otherMemberId,50);if(uuid(other)&&other!==mid)ids.push(other);}}
      const unique=[...new Set(ids)];
      if(!unique.length)return json({ok:false,error:"Select at least one other active member."},400);
      if(action==="create_group"&&title.length<2)return json({ok:false,error:"Give your group a name."},400);
      const targets=await rows("members","id=in.("+unique.join(",")+")&status=eq.active&select=id");
      if((targets||[]).length!==unique.length)return json({ok:false,error:"One or more selected members are unavailable."},404);
      if(action==="create_conversation"&&unique.length!==1)return json({ok:false,error:"A private chat must have one other member."},400);
      for(const targetId of unique){
        const existing=await rows("connections","or=(and(requester_id.eq."+mid+",receiver_id.eq."+targetId+"),and(requester_id.eq."+targetId+",receiver_id.eq."+mid+"))&select=id,status&limit=1");
        if(!existing?.length||existing[0].status!=="accepted")return json({ok:false,error:"Only accepted JR PHEEF contacts can start a private chat or join a group."},403);
      }
      const conv=await insert("jr_conversations",{created_by:mid,title:title||null,is_group:action==="create_group",description:clean(input.description,500)||null});
      const conversation=conv?.[0];if(!conversation?.id)throw new Error("Conversation could not be created.");
      await insert("jr_conversation_participants",[{conversation_id:conversation.id,member_id:mid,role:"owner"},...unique.map((id:string)=>({conversation_id:conversation.id,member_id:id,role:"member"}))]);
      for(const id of unique)await insert("jr_notifications",{member_id:id,title:action==="create_group"?"Added to a JR PHEEF group":"New conversation",message:action==="create_group"?member.full_name+" added you to "+title:member.full_name+" started a conversation with you.",type:"message",read:false});
      return response(conversation);
    }
    if(action==="send_message"||action==="list_messages"){
      const conversationId=clean(input.conversationId,50);
      if(!uuid(conversationId))return json({ok:false,error:"Select a valid conversation."},400);
      const participant=await rows("jr_conversation_participants","conversation_id=eq."+conversationId+"&member_id=eq."+mid+"&select=conversation_id&limit=1");
      if(!participant?.length)return json({ok:false,error:"You do not have access to this conversation."},403);
      if(action==="send_message"){
        const body=clean(input.body,4000);if(!body)return json({ok:false,error:"Message cannot be empty."},400);
        const data=await insert("jr_messages",{conversation_id:conversationId,sender_id:mid,body});
        const peers=await rows("jr_conversation_participants","conversation_id=eq."+conversationId+"&member_id=neq."+mid+"&select=member_id&limit=10");
        for(const peer of peers||[])await insert("jr_notifications",{member_id:peer.member_id,title:"New message",message:body.slice(0,180),type:"message",read:false});
        return response(data?.[0]||data);
      }
      const messages=await rows("jr_messages","conversation_id=eq."+conversationId+"&select=id,sender_id,body,created_at&order=created_at.asc&limit=100");
      return response(messages);
    }

    if(action==="list_channels"){
      const owned=await rows("jr_channels","owner_member_id=eq."+mid+"&select=id,owner_member_id,name,description,category,visibility,avatar_url,created_at&order=created_at.desc&limit=100");
      const joined=await rows("jr_channel_members","member_id=eq."+mid+"&select=channel_id,role&limit=100");
      const ids=(joined||[]).map((x:any)=>x.channel_id).filter(uuid);
      const visible=await rows("jr_channels","visibility=eq.public&select=id,owner_member_id,name,description,category,visibility,avatar_url,created_at&order=created_at.desc&limit=100");
      const all=new Map<string,any>();for(const c of [...(owned||[]),...(visible||[])])all.set(c.id,c);
      if(ids.length){const privateRows=await rows("jr_channels","id=in.("+ids.join(",")+")&select=id,owner_member_id,name,description,category,visibility,avatar_url,created_at");for(const c of privateRows||[])all.set(c.id,c);}
      return response([...all.values()].map((c:any)=>({...c,role:c.owner_member_id===mid?"owner":(joined||[]).find((x:any)=>x.channel_id===c.id)?.role||"discover"})));
    }
    if(action==="create_channel"){
      const name=clean(input.name,100),description=clean(input.description,1000),category=clean(input.category,60)||"community",visibility=input.visibility==="private"?"private":"public";
      if(name.length<2)return json({ok:false,error:"Channel name must be at least two characters."},400);
      const created=await insert("jr_channels",{owner_member_id:mid,name,description,category,visibility});
      const channel=created?.[0];if(!channel?.id)throw new Error("Channel could not be created.");
      await insert("jr_channel_members",{channel_id:channel.id,member_id:mid,role:"owner"});
      return response(channel);
    }
    if(action==="join_channel"||action==="leave_channel"||action==="publish_channel_post"||action==="list_channel_posts"){
      const channelId=clean(input.channelId,50);if(!uuid(channelId))return json({ok:false,error:"Choose a valid channel."},400);
      const ch=(await rows("jr_channels","id=eq."+channelId+"&select=id,owner_member_id,visibility&limit=1"))?.[0];
      if(!ch)return json({ok:false,error:"Channel not found."},404);
      const membership=(await rows("jr_channel_members","channel_id=eq."+channelId+"&member_id=eq."+mid+"&select=role&limit=1"))?.[0];
      if(action==="join_channel"){
        if(ch.visibility==="private"&&ch.owner_member_id!==mid)return json({ok:false,error:"This is a private channel. Ask its owner for an invitation."},403);
        if(!membership)await insert("jr_channel_members",{channel_id:channelId,member_id:mid,role:"follower"});
        return response({joined:true});
      }
      if(action==="leave_channel"){
        if(membership?.role==="owner")return json({ok:false,error:"Transfer ownership before leaving your channel."},409);
        if(membership)await rest("jr_channel_members?channel_id=eq."+channelId+"&member_id=eq."+mid,"DELETE",undefined,"return=minimal");
        return response({left:true});
      }
      if(action==="publish_channel_post"){
        if(!membership||!["owner","moderator"].includes(membership.role))return json({ok:false,error:"Only channel owners and moderators can publish."},403);
        const body=clean(input.body,4000),media=Array.isArray(input.media)?input.media.slice(0,5):[];
        if(!body&&!media.length)return json({ok:false,error:"Add a message or media."},400);
        if(media.some((m:any)=>!m||!storagePath(m.path)||!m.path.startsWith(mid+"/channel/")))return json({ok:false,error:"Channel media is invalid."},400);
        const post=await insert("jr_channel_posts",{channel_id:channelId,author_member_id:mid,body,media});
        return response(post?.[0]||post);
      }
      if(ch.visibility==="private"&&ch.owner_member_id!==mid&&!membership)return json({ok:false,error:"Follow or join this private channel by invitation."},403);
      const posts=await rows("jr_channel_posts","channel_id=eq."+channelId+"&select=id,author_member_id,body,media,created_at,updated_at&order=created_at.desc&limit=50");
      return response(await Promise.all((posts||[]).map(async(p:any)=>({...p,media:await signedMedia(p.media||[])}))));
    }
    if(action==="list_social_feed"){
      const cutoff=new Date(Date.now()-24*60*60*1000).toISOString();
      const publicRows=await rows("jr_status_updates","visibility=eq.everyone&created_at=gte."+encodeURIComponent(cutoff)+"&select=id,member_id,body,media,background,visibility,created_at,expires_at&order=created_at.desc&limit=50");
      const follows=await rows("social_follows","follower_id=eq."+mid+"&select=followee_id&limit=300");
      const followed=(follows||[]).map((x:any)=>x.followee_id).filter(uuid);
      let followedRows:any[]=[];
      if(followed.length)followedRows=await rows("jr_status_updates","member_id=in.("+followed.join(",")+")&visibility=eq.connections&created_at=gte."+encodeURIComponent(cutoff)+"&select=id,member_id,body,media,background,visibility,created_at,expires_at&order=created_at.desc&limit=50");
      const merged=new Map<string,any>();for(const item of [...(publicRows||[]),...followedRows])if(new Date(item.expires_at||item.created_at)>new Date())merged.set(item.id,item);
      const feed=[...merged.values()].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime()).slice(0,60);
      const ids=[...new Set(feed.map(x=>x.member_id))];
      const profiles=ids.length?await rows("members","id=in.("+ids.join(",")+")&select=id,full_name,profile_photo,profile_photo_hidden,profile_visibility"):[];
      const profileMap=new Map((profiles||[]).map((p:any)=>[p.id,p]));
      const result=await Promise.all(feed.map(async(item:any)=>{
        const author:any=profileMap.get(item.member_id)||{};let avatar=null;
        if(author.profile_visibility!=="private"&&!author.profile_photo_hidden&&author.profile_photo&&storagePath(author.profile_photo))avatar=(await signedMedia([{path:author.profile_photo,kind:"image"}]))[0]?.url||null;
        return {...item,author:{id:item.member_id,name:author.profile_visibility==="private"?"JR PHEEF member":author.full_name||"JR PHEEF member",avatar},media:await signedMedia(item.media||[])};
      }));
      return response({items:result,following:followed});
    }
    if(action==="follow_member"||action==="unfollow_member"){
      const target=clean(input.memberId,50);if(!uuid(target)||target===mid)return json({ok:false,error:"Choose another valid member."},400);
      const profile=(await rows("members","id=eq."+target+"&status=eq.active&select=id,profile_visibility&limit=1"))?.[0];
      if(!profile||profile.profile_visibility==="private")return json({ok:false,error:"This member is not available to follow."},404);
      const existing=await rows("social_follows","follower_id=eq."+mid+"&followee_id=eq."+target+"&select=follower_id&limit=1");
      if(action==="follow_member"){if(!existing?.length)await insert("social_follows",{follower_id:mid,followee_id:target});return response({following:true});}
      if(existing?.length)await rest("social_follows?follower_id=eq."+mid+"&followee_id=eq."+target,"DELETE",undefined,"return=minimal");
      return response({following:false});
    }
    if(action==="list_ad_campaigns"){
      const own=await rows("ad_campaigns","member_id=eq."+mid+"&select=id,title,body,category,location,budget_ksh,paid,status,review_note,starts_at,ends_at,impressions,clicks,media_urls,created_at&order=created_at.desc&limit=50");
      const approved=await rows("ad_campaigns","status=eq.approved&paid=eq.true&select=id,title,body,category,location,media_urls,starts_at,ends_at&order=created_at.desc&limit=30");
      const now=Date.now(),active=(approved||[]).filter((a:any)=>(!a.starts_at||new Date(a.starts_at).getTime()<=now)&&(!a.ends_at||new Date(a.ends_at).getTime()>now));
      const withMedia=async(a:any)=>({...a,media:await signedMedia((a.media_urls||[]).map((p:string)=>({path:p,kind:"image"})))});
      return response({mine:await Promise.all((own||[]).map(withMedia)),sponsored:await Promise.all(active.map(withMedia))});
    }
    if(action==="create_ad_campaign"){
      const title=clean(input.title,80),body=clean(input.body,300),category=clean(input.category,60),location=clean(input.location,120);
      const budget=Number(input.budgetKsh??0),paths=Array.isArray(input.mediaPaths)?input.mediaPaths.slice(0,5):[];
      if(title.length<3||body.length<5||!Number.isFinite(budget)||budget<0)return json({ok:false,error:"Add a title, message and a valid non-negative budget."},400);
      if(paths.some((p:any)=>!storagePath(p)||!p.startsWith(mid+"/ad/")))return json({ok:false,error:"Advertisement media is invalid."},400);
      const created=await insert("ad_campaigns",{member_id:mid,title,body,category:category||null,location:location||null,budget_ksh:budget,status:"pending",paid:false,media_urls:paths});
      return response({campaign:created?.[0]||created,note:"Advertisement submitted for review. It is not published, paid or being displayed. Payment and campaign activation are not connected yet."});
    }
    if(action==="pause_ad_campaign"){
      const id=clean(input.campaignId,50);if(!uuid(id))return json({ok:false,error:"Choose a valid advertisement."},400);
      const found=await rows("ad_campaigns","id=eq."+id+"&member_id=eq."+mid+"&select=id,status&limit=1");
      if(!found?.length)return json({ok:false,error:"Advertisement not found or not yours."},404);
      if(found[0].status==="rejected"||found[0].status==="ended")return json({ok:false,error:"This advertisement cannot be paused."},409);
      const updated=await rest("ad_campaigns?id=eq."+id+"&member_id=eq."+mid,"PATCH",{status:"paused",updated_at:new Date().toISOString()});
      return response(updated?.[0]||{paused:true});
    }
    if(action==="create_room_listing"){
      const title=clean(input.title,120),roomType=clean(input.roomType,40),location=clean(input.location,180),description=clean(input.description,2000),rent=Number(input.rent);
      const allowed=["bedsitter","studio","one_bedroom","two_bedroom","three_bedroom","four_bedroom","shared","single_room","other"];
      if(title.length<3||!allowed.includes(roomType)||location.length<2||!Number.isFinite(rent)||rent<0)return json({ok:false,error:"Enter a title, room type, location and valid monthly rent."},400);
      const amenities=Array.isArray(input.amenities)?input.amenities.filter((x:any)=>typeof x==="string").slice(0,20).map((x:any)=>clean(x,50)):[];
      const media=Array.isArray(input.media)?input.media.slice(0,9):[];
      if(media.some((m:any)=>!m||!storagePath(m.path)||!m.path.startsWith(mid+"/listing/")||!["image","video"].includes(m.kind)))return json({ok:false,error:"One or more property media files are invalid or do not belong to this account."},400);
      if(media.filter((m:any)=>m.kind==="image").length>8||media.filter((m:any)=>m.kind==="video").length>1)return json({ok:false,error:"Add up to 8 photos and one video walkthrough."},400);
      const data=await insert("room_listings",{member_id:mid,title,room_type:roomType,location,description,rent_ksh:rent,amenities,media,available_from:clean(input.availableFrom,10)||null,status:"active"});
      return response(data?.[0]||data);
    }
    if(action==="create_deal_room"){
      const listingId=clean(input.listingId,80);
      if(!listingId)return json({ok:false,error:"Choose a listing first."},400);
      const listing=await rows("jr_listings","id=eq."+encodeURIComponent(listingId)+"&status=eq.active&select=id,member_id,title,price&limit=1");
      if(!listing?.length||!listing[0].member_id||listing[0].member_id===mid)return json({ok:false,error:"This listing is unavailable for a deal."},404);
      const existing=await rows("jr_deal_rooms","buyer_id=eq."+mid+"&seller_id=eq."+listing[0].member_id+"&listing_id=eq."+encodeURIComponent(listingId)+"&status=eq.open&select=id&limit=1");
      if(existing?.length)return response({id:existing[0].id,existing:true});
      const created=await insert("jr_deal_rooms",{buyer_id:mid,seller_id:listing[0].member_id,listing_id:listingId,amount:Number(listing[0].price)||0,fee:0,status:"open"});
      const room=created?.[0];if(!room?.id)throw new Error("Deal Room could not be opened.");
      await insert("jr_notifications",{member_id:listing[0].member_id,title:"New Deal Room",message:member.full_name+" opened a conversation about "+(listing[0].title||"your listing")+".",type:"deal_room",read:false});
      return response(room);
    }
    if(action==="deal_room_messages"||action==="send_deal_message"||action==="confirm_deal_terms"){
      const roomId=clean(input.roomId,50);
      if(!uuid(roomId))return json({ok:false,error:"Choose a valid Deal Room."},400);
      const found=await rows("jr_deal_rooms","id=eq."+roomId+"&select=id,buyer_id,seller_id,status,buyer_agreed,seller_agreed&limit=1");
      const room=found?.[0];
      if(!room||![room.buyer_id,room.seller_id].includes(mid))return json({ok:false,error:"You do not have access to this Deal Room."},403);
      if(action==="deal_room_messages"){
        const messages=await rows("jr_deal_messages","room_id=eq."+roomId+"&select=id,sender_id,body,created_at&order=created_at.asc&limit=100");
        return response(messages);
      }
      if(room.status!=="open")return json({ok:false,error:"This Deal Room is no longer open for changes."},409);
      if(action==="send_deal_message"){
        const body=clean(input.body,2000);if(!body)return json({ok:false,error:"Message cannot be empty."},400);
        const data=await insert("jr_deal_messages",{room_id:roomId,sender_id:mid,body});
        const other=room.buyer_id===mid?room.seller_id:room.buyer_id;
        await insert("jr_notifications",{member_id:other,title:"Deal Room message",message:body.slice(0,180),type:"deal_room_message",read:false});
        return response(data?.[0]||data);
      }
      const patch:any=room.buyer_id===mid?{buyer_agreed:true}:{seller_agreed:true};
      const both=(room.buyer_id===mid?true:!!room.buyer_agreed)&&(room.seller_id===mid?true:!!room.seller_agreed);
      if(both)patch.status="agreed";
      const updated=await rest("jr_deal_rooms?id=eq."+roomId,"PATCH",patch);
      const other=room.buyer_id===mid?room.seller_id:room.buyer_id;
      await insert("jr_notifications",{member_id:other,title:"Deal terms confirmed",message:"The other party confirmed the current terms in your Deal Room.",type:"deal_room_agreement",read:false});
      return response(updated?.[0]||updated);
    }
    if(action==="create_delivery"){
      const pickup=clean(input.pickup,180),destination=clean(input.destination,180),description=clean(input.description,1000);
      if(pickup.length<2||destination.length<2)return json({ok:false,error:"Enter both pickup and destination."},400);
      const data=await insert("jr_delivery_requests",{requester_id:mid,pickup,destination,description:description||null,status:"open"});
      return response({request:data?.[0]||data,note:"Request recorded. No rider has been assigned and no live tracking or fare estimate is connected yet."});
    }
    return json({ok:false,error:"Unknown workspace action."},400);
  } catch(error) {
    console.error("JR workspace API:",error instanceof Error?error.message:"unknown");
    return json({ok:false,error:error instanceof Error?error.message:"Workspace request failed."},400);
  }
});
