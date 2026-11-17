// FAMILY banking preparation module. Pre-launch service-intake only.
const makeHelpers = require("./helpers");
module.exports = function mountFamilyBank(ctx) {
  const { app, db, clean, requireMember } = ctx;
  const { wrap, bad, limited } = makeHelpers(ctx);
  const types = new Set(["account_interest","kyc_help","licensed_partner_referral","financial_education","support"]);
  const requireFamilyMembership = async (member, res) => {
    const { data, error } = await db.from("venture_memberships").select("id,role_key")
      .eq("member_id", member.id).eq("venture_slug", "family").eq("status", "approved").maybeSingle();
    if (error) throw error;
    if (!data) { res.status(403).json({ ok:false, error:"FAMILY_MEMBERSHIP_REQUIRED", message:"Apply for FAMILY membership and wait for approval before using these services." }); return null; }
    if (!["member", "goal_coordinator"].includes(data.role_key)) {
      res.status(403).json({ ok:false, error:"FAMILY_ROLE_NOT_AUTHORIZED", message:"This FAMILY role does not include personal member services." }); return null;
    }
    return data;
  };
  app.get("/api/family/bank", wrap("FAMILY bank overview", async (req,res) => {
    const member = await requireMember(req,res); if (!member) return;
    if (!await requireFamilyMembership(member,res)) return;
    const [{data:profile,error:pe},{data:requests,error:re}] = await Promise.all([
      db.from("family_bank_profiles").select("status,kyc_status,created_at,updated_at").eq("member_id",member.id).maybeSingle(),
      db.from("family_bank_service_requests").select("id,request_type,details,status,created_at,updated_at").eq("member_id",member.id).order("created_at",{ascending:false}).limit(30)
    ]);
    if(pe) throw pe; if(re) throw re;
    res.json({ok:true,product:"FAMILY",mode:"prelaunch",profile:profile||{status:"prelaunch",kyc_status:"not_started"},requests:requests||[],enabled_services:["financial_education","licensed_partner_referral","service_interest"],disabled_services:["deposits","stored_value","lending","money_transfers","payment_processing"],notice:"FAMILY is preparing for future regulated services. This page is not a bank account and does not hold or move money."});
  }));
  app.post("/api/family/bank/requests", wrap("FAMILY bank request", async (req,res) => {
    const member = await requireMember(req,res); if (!member) return;
    if (!await requireFamilyMembership(member,res)) return;
    if(limited(req,res,"family-bank-request",8,3600000)) return;
    const requestType=clean(req.body.request_type).toLowerCase();
    const input=req.body.details&&typeof req.body.details==="object"&&!Array.isArray(req.body.details)?req.body.details:{};
    if(!types.has(requestType)) return bad(res,"Choose a valid FAMILY service request.");
    if (requestType === "licensed_partner_referral") {
      const { data: consent, error: consentError } = await db.from("ecosystem_links")
        .select("consent_scopes,status").eq("member_id", member.id).eq("venture", "family").maybeSingle();
      if (consentError) throw consentError;
      if (!consent || consent.status === "left" || !(consent.consent_scopes || []).includes("profile"))
        return bad(res, "Share your basic profile with FAMILY before requesting a licensed partner referral.", 403);
    }
    const details={};
    for(const key of ["topic","message","preferred_contact","region"]) if(typeof input[key]==="string") details[key]=clean(input[key]).slice(0,key==="message"?700:120);
    if(!details.message&&!details.topic) return bad(res,"Add a short topic or message so FAMILY can understand your request.");
    const {data,error}=await db.from("family_bank_service_requests").insert({member_id:member.id,request_type:requestType,details,status:"received"}).select("id,request_type,details,status,created_at").single();
    if(error) throw error;
    await db.from("family_bank_audit_events").insert({actor_member_id:member.id,subject_member_id:member.id,event_type:"member_service_request_created",metadata:{request_id:data.id,request_type:requestType}});
    res.status(201).json({ok:true,request:data,message:"Your request has been recorded. This is not approval for a financial product."});
  }));
};
