INSERT INTO public.venture_registration_templates(venture_slug,version,form_schema,active,updated_at)
VALUES
(
 'dgbo','1.0',
 '{
   "label":"DGBO",
   "roles":[
     {"key":"business_partner","label":"Business partner"},
     {"key":"consultant","label":"Consultant"},
     {"key":"supplier","label":"Supplier"},
     {"key":"venture_founder","label":"Venture founder"},
     {"key":"staff","label":"Staff"},
     {"key":"investor_interest","label":"Investor interest (non-binding)"}
   ],
   "fields":[
     {"key":"organisation","type":"text","label":"Organisation or business name","required":false},
     {"key":"experience","type":"textarea","label":"Relevant experience or proposal","required":true}
   ],
   "notice":"An application is not an offer of investment, partnership or employment. DGBO approval is separate."
 }'::jsonb,
 true,now()
),
(
 'family','1.0',
 '{
   "label":"FAMILY",
   "roles":[
     {"key":"member","label":"FAMILY member"},
     {"key":"goal_coordinator","label":"Family goal coordinator"},
     {"key":"partner_referral","label":"Authorised partner referral"}
   ],
   "fields":[
     {"key":"participation_goal","type":"textarea","label":"What would you like to use FAMILY for?","required":true}
   ],
   "notice":"FAMILY membership does not create a bank account, deposit, loan, investment product or promise of returns. Regulated services remain unavailable unless properly licensed and activated."
 }'::jsonb,
 true,now()
)
ON CONFLICT (venture_slug) DO UPDATE
SET version=EXCLUDED.version,form_schema=EXCLUDED.form_schema,active=EXCLUDED.active,updated_at=now();
