-- JR PHEEF Business Operating Intelligence: first operational foundation.
create table if not exists public.jr_business_products (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.jr_business_workspaces(id) on delete cascade,
 sku text not null, name text not null check (char_length(btrim(name)) between 2 and 160),
 category text not null default 'general', unit_price numeric(14,2) not null default 0 check (unit_price >= 0),
 currency_code text not null default 'KES' check (currency_code ~ '^[A-Z]{3}$'),
 stock_quantity numeric(14,3) not null default 0 check (stock_quantity >= 0),
 reorder_level numeric(14,3) not null default 0 check (reorder_level >= 0),
 unit_label text not null default 'unit', active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(business_id, sku)
);
create index if not exists jr_business_products_business_idx on public.jr_business_products(business_id, active, name);
create table if not exists public.jr_business_stock_movements (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.jr_business_workspaces(id) on delete cascade,
 product_id uuid not null references public.jr_business_products(id) on delete restrict,
 actor_member_id uuid not null references public.members(id),
 movement_type text not null check (movement_type in ('opening','receive','sale','adjustment','waste','return')),
 quantity_delta numeric(14,3) not null check (quantity_delta <> 0), note text not null default '', reference text,
 created_at timestamptz not null default now()
);
create index if not exists jr_business_stock_movements_business_idx on public.jr_business_stock_movements(business_id, created_at desc);
create table if not exists public.jr_business_sales (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.jr_business_workspaces(id) on delete cascade,
 receipt_number text not null, cashier_member_id uuid not null references public.members(id),
 subtotal numeric(14,2) not null check (subtotal >= 0), total numeric(14,2) not null check (total >= 0),
 currency_code text not null default 'KES', payment_method text not null check (payment_method in ('cash','card','mobile_money','other')),
 payment_reference text, status text not null default 'completed' check (status in ('completed','voided','refunded')),
 created_at timestamptz not null default now(), unique(business_id, receipt_number)
);
create index if not exists jr_business_sales_business_idx on public.jr_business_sales(business_id, created_at desc);
create table if not exists public.jr_business_sale_items (
 id uuid primary key default gen_random_uuid(), sale_id uuid not null references public.jr_business_sales(id) on delete cascade,
 product_id uuid not null references public.jr_business_products(id), product_name text not null, sku text not null,
 quantity numeric(14,3) not null check (quantity > 0), unit_price numeric(14,2) not null check (unit_price >= 0),
 line_total numeric(14,2) not null check (line_total >= 0)
);
create table if not exists public.jr_business_tasks (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.jr_business_workspaces(id) on delete cascade,
 created_by uuid not null references public.members(id), assigned_to uuid references public.members(id),
 department text not null default 'general', title text not null check (char_length(btrim(title)) between 3 and 180),
 description text not null default '', priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
 status text not null default 'open' check (status in ('open','in_progress','blocked','completed','cancelled')),
 due_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists jr_business_tasks_business_idx on public.jr_business_tasks(business_id, status, due_at);
create table if not exists public.jr_business_suppliers (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.jr_business_workspaces(id) on delete cascade,
 name text not null check (char_length(btrim(name)) between 2 and 160), contact_name text, email text, phone text,
 notes text not null default '', status text not null default 'active' check (status in ('active','inactive','pending_review')),
 created_at timestamptz not null default now(), unique(business_id,name)
);
create table if not exists public.jr_business_purchase_orders (
 id uuid primary key default gen_random_uuid(), business_id uuid not null references public.jr_business_workspaces(id) on delete cascade,
 supplier_id uuid references public.jr_business_suppliers(id), created_by uuid not null references public.members(id),
 order_number text not null, status text not null default 'draft' check (status in ('draft','submitted','partially_received','received','cancelled')),
 currency_code text not null default 'KES', total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
 notes text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(business_id,order_number)
);
create or replace function public.jr_business_record_sale(p_business_id uuid,p_actor_member_id uuid,p_items jsonb,p_payment_method text,p_payment_reference text default null)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_item jsonb; v_product public.jr_business_products%rowtype; v_qty numeric; v_subtotal numeric(14,2):=0;
 v_sale_id uuid; v_receipt text; v_lines jsonb:='[]'::jsonb; v_line numeric(14,2); v_allowed boolean;
begin
 select exists(select 1 from public.jr_business_workspaces b join public.jr_business_workspace_members m on m.business_id=b.id
 where b.id=p_business_id and m.member_id=p_actor_member_id and m.status='active'
 and (m.role_key in ('owner','manager','cashier') or m.permissions ? 'sales:create')) into v_allowed;
 if not v_allowed then raise exception 'Not authorised to record sales for this business'; end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)<1 or jsonb_array_length(p_items)>100 then raise exception 'A sale must contain between 1 and 100 items'; end if;
 if p_payment_method not in ('cash','card','mobile_money','other') then raise exception 'Unsupported payment method'; end if;
 for v_item in select value from jsonb_array_elements(p_items) loop
  if (v_item->>'product_id') is null or (v_item->>'quantity') is null then raise exception 'Each sale item requires product_id and quantity'; end if;
  v_qty:=(v_item->>'quantity')::numeric; if v_qty<=0 or v_qty>100000 then raise exception 'Invalid sale quantity'; end if;
  select * into v_product from public.jr_business_products where id=(v_item->>'product_id')::uuid and business_id=p_business_id and active=true for update;
  if not found then raise exception 'A selected product is unavailable'; end if;
  if v_product.stock_quantity<v_qty then raise exception 'Insufficient stock for %',v_product.name; end if;
  v_line:=round(v_product.unit_price*v_qty,2);v_subtotal:=v_subtotal+v_line;
  v_lines:=v_lines||jsonb_build_array(jsonb_build_object('product_id',v_product.id,'product_name',v_product.name,'sku',v_product.sku,'quantity',v_qty,'unit_price',v_product.unit_price,'line_total',v_line));
 end loop;
 v_receipt:='JR-'||to_char(now(),'YYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
 insert into public.jr_business_sales(business_id,receipt_number,cashier_member_id,subtotal,total,payment_method,payment_reference)
 values(p_business_id,v_receipt,p_actor_member_id,v_subtotal,v_subtotal,p_payment_method,nullif(left(coalesce(p_payment_reference,''),120),'')) returning id into v_sale_id;
 for v_item in select value from jsonb_array_elements(v_lines) loop
  insert into public.jr_business_sale_items(sale_id,product_id,product_name,sku,quantity,unit_price,line_total)
  values(v_sale_id,(v_item->>'product_id')::uuid,v_item->>'product_name',v_item->>'sku',(v_item->>'quantity')::numeric,(v_item->>'unit_price')::numeric,(v_item->>'line_total')::numeric);
  update public.jr_business_products set stock_quantity=stock_quantity-(v_item->>'quantity')::numeric,updated_at=now() where id=(v_item->>'product_id')::uuid;
  insert into public.jr_business_stock_movements(business_id,product_id,actor_member_id,movement_type,quantity_delta,reference,note)
  values(p_business_id,(v_item->>'product_id')::uuid,p_actor_member_id,'sale',-((v_item->>'quantity')::numeric),v_receipt,'Recorded through JR PHEEF POS');
 end loop;
 return jsonb_build_object('sale_id',v_sale_id,'receipt_number',v_receipt,'subtotal',v_subtotal,'total',v_subtotal,'currency_code','KES','items',v_lines,'status','completed');
end $$;
revoke all on function public.jr_business_record_sale(uuid,uuid,jsonb,text,text) from public,anon,authenticated;
grant execute on function public.jr_business_record_sale(uuid,uuid,jsonb,text,text) to service_role;
alter table public.jr_business_products enable row level security;
alter table public.jr_business_stock_movements enable row level security;
alter table public.jr_business_sales enable row level security;
alter table public.jr_business_sale_items enable row level security;
alter table public.jr_business_tasks enable row level security;
alter table public.jr_business_suppliers enable row level security;
alter table public.jr_business_purchase_orders enable row level security;
create policy jr_business_products_no_client_access on public.jr_business_products for all to anon,authenticated using(false) with check(false);
create policy jr_business_stock_movements_no_client_access on public.jr_business_stock_movements for all to anon,authenticated using(false) with check(false);
create policy jr_business_sales_no_client_access on public.jr_business_sales for all to anon,authenticated using(false) with check(false);
create policy jr_business_sale_items_no_client_access on public.jr_business_sale_items for all to anon,authenticated using(false) with check(false);
create policy jr_business_tasks_no_client_access on public.jr_business_tasks for all to anon,authenticated using(false) with check(false);
create policy jr_business_suppliers_no_client_access on public.jr_business_suppliers for all to anon,authenticated using(false) with check(false);
create policy jr_business_purchase_orders_no_client_access on public.jr_business_purchase_orders for all to anon,authenticated using(false) with check(false);
revoke all on public.jr_business_products,public.jr_business_stock_movements,public.jr_business_sales,public.jr_business_sale_items,public.jr_business_tasks,public.jr_business_suppliers,public.jr_business_purchase_orders from anon,authenticated;
grant all on public.jr_business_products,public.jr_business_stock_movements,public.jr_business_sales,public.jr_business_sale_items,public.jr_business_tasks,public.jr_business_suppliers,public.jr_business_purchase_orders to service_role;


-- Supplier purchasing and receiving.
create table if not exists public.jr_business_purchase_order_items (
 id uuid primary key default gen_random_uuid(),
 purchase_order_id uuid not null references public.jr_business_purchase_orders(id) on delete cascade,
 product_id uuid not null references public.jr_business_products(id),
 quantity numeric(14,3) not null check(quantity>0),
 received_quantity numeric(14,3) not null default 0 check(received_quantity>=0 and received_quantity<=quantity),
 unit_cost numeric(14,2) not null check(unit_cost>=0),
 line_total numeric(14,2) not null check(line_total>=0),
 created_at timestamptz not null default now(),
 unique(purchase_order_id,product_id)
);
create index if not exists jr_business_po_items_order_idx on public.jr_business_purchase_order_items(purchase_order_id);
alter table public.jr_business_purchase_order_items enable row level security;
create policy jr_business_po_items_no_client_access on public.jr_business_purchase_order_items for all to anon,authenticated using(false) with check(false);
revoke all on public.jr_business_purchase_order_items from anon,authenticated;
grant all on public.jr_business_purchase_order_items to service_role;
create or replace function public.jr_business_create_purchase_order(p_business_id uuid,p_actor_member_id uuid,p_supplier_id uuid,p_items jsonb,p_notes text default '')
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_item jsonb;v_product public.jr_business_products%rowtype;v_qty numeric;v_cost numeric;v_total numeric:=0;v_order_id uuid;v_number text;v_allowed boolean;
begin
 select exists(select 1 from public.jr_business_workspace_members m where m.business_id=p_business_id and m.member_id=p_actor_member_id and m.status='active' and (m.role_key in ('owner','manager') or m.permissions ? 'purchasing:manage')) into v_allowed;
 if not v_allowed then raise exception 'Not authorised to create purchase orders'; end if;
 if not exists(select 1 from public.jr_business_suppliers where id=p_supplier_id and business_id=p_business_id and status='active') then raise exception 'Supplier not found or inactive'; end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)<1 or jsonb_array_length(p_items)>100 then raise exception 'A purchase order must contain 1 to 100 lines'; end if;
 v_number:='PO-'||to_char(now(),'YYMMDD')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
 insert into public.jr_business_purchase_orders(business_id,supplier_id,created_by,order_number,status,currency_code,notes)
 values(p_business_id,p_supplier_id,p_actor_member_id,v_number,'submitted','KES',left(coalesce(p_notes,''),1000)) returning id into v_order_id;
 for v_item in select value from jsonb_array_elements(p_items) loop
  if (v_item->>'product_id') is null then raise exception 'Each order line needs a product'; end if;
  v_qty:=(v_item->>'quantity')::numeric;v_cost:=(v_item->>'unit_cost')::numeric;
  if v_qty<=0 or v_qty>100000 or v_cost<0 or v_cost>100000000 then raise exception 'Invalid order quantity or unit cost'; end if;
  select * into v_product from public.jr_business_products where id=(v_item->>'product_id')::uuid and business_id=p_business_id and active=true;
  if not found then raise exception 'A selected product is not available in this business'; end if;
  insert into public.jr_business_purchase_order_items(purchase_order_id,product_id,quantity,unit_cost,line_total) values(v_order_id,v_product.id,v_qty,v_cost,round(v_qty*v_cost,2));
  v_total:=v_total+round(v_qty*v_cost,2);
 end loop;
 update public.jr_business_purchase_orders set total_amount=v_total,updated_at=now() where id=v_order_id;
 return jsonb_build_object('id',v_order_id,'order_number',v_number,'total_amount',v_total,'status','submitted');
end $$;
create or replace function public.jr_business_receive_purchase_order(p_business_id uuid,p_actor_member_id uuid,p_purchase_order_id uuid)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_order public.jr_business_purchase_orders%rowtype;v_line public.jr_business_purchase_order_items%rowtype;v_remaining numeric;v_count integer:=0;v_allowed boolean;
begin
 select exists(select 1 from public.jr_business_workspace_members m where m.business_id=p_business_id and m.member_id=p_actor_member_id and m.status='active' and (m.role_key in ('owner','manager') or m.permissions ? 'inventory:manage' or m.permissions ? 'purchasing:manage')) into v_allowed;
 if not v_allowed then raise exception 'Not authorised to receive purchase orders'; end if;
 select * into v_order from public.jr_business_purchase_orders where id=p_purchase_order_id and business_id=p_business_id for update;
 if not found or v_order.status not in ('submitted','partially_received') then raise exception 'Purchase order is not available for receiving'; end if;
 for v_line in select * from public.jr_business_purchase_order_items where purchase_order_id=p_purchase_order_id for update loop
  v_remaining:=v_line.quantity-v_line.received_quantity;
  if v_remaining>0 then
   update public.jr_business_products set stock_quantity=stock_quantity+v_remaining,updated_at=now() where id=v_line.product_id and business_id=p_business_id;
   insert into public.jr_business_stock_movements(business_id,product_id,actor_member_id,movement_type,quantity_delta,reference,note) values(p_business_id,v_line.product_id,p_actor_member_id,'receive',v_remaining,v_order.order_number,'Received against purchase order');
   update public.jr_business_purchase_order_items set received_quantity=quantity where id=v_line.id;
   v_count:=v_count+1;
  end if;
 end loop;
 update public.jr_business_purchase_orders set status='received',updated_at=now() where id=p_purchase_order_id;
 return jsonb_build_object('purchase_order_id',p_purchase_order_id,'order_number',v_order.order_number,'lines_received',v_count,'status','received');
end $$;
revoke all on function public.jr_business_create_purchase_order(uuid,uuid,uuid,jsonb,text) from public,anon,authenticated;
revoke all on function public.jr_business_receive_purchase_order(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.jr_business_create_purchase_order(uuid,uuid,uuid,jsonb,text) to service_role;
grant execute on function public.jr_business_receive_purchase_order(uuid,uuid,uuid) to service_role;


-- Customer records and operating expense register.
create table if not exists public.jr_business_customers (
 id uuid primary key default gen_random_uuid(),business_id uuid not null references public.jr_business_workspaces(id) on delete cascade,
 customer_name text not null check(char_length(btrim(customer_name)) between 2 and 160),phone text,email text,
 customer_type text not null default 'retail' check(customer_type in ('retail','wholesale','business','other')),
 notes text not null default '',status text not null default 'active' check(status in ('active','inactive')),
 created_at timestamptz not null default now(),unique(business_id,customer_name)
);
create index if not exists jr_business_customers_business_idx on public.jr_business_customers(business_id,status,customer_name);
create table if not exists public.jr_business_expenses (
 id uuid primary key default gen_random_uuid(),business_id uuid not null references public.jr_business_workspaces(id) on delete cascade,
 recorded_by uuid not null references public.members(id),category text not null,
 description text not null check(char_length(btrim(description)) between 3 and 240),
 amount numeric(14,2) not null check(amount>0),currency_code text not null default 'KES' check(currency_code ~ '^[A-Z]{3}$'),
 payment_method text not null default 'other' check(payment_method in ('cash','card','mobile_money','bank_transfer','other')),
 payment_reference text,occurred_at timestamptz not null default now(),
 status text not null default 'recorded' check(status in ('recorded','voided')),created_at timestamptz not null default now()
);
create index if not exists jr_business_expenses_business_idx on public.jr_business_expenses(business_id,occurred_at desc);
alter table public.jr_business_customers enable row level security;
alter table public.jr_business_expenses enable row level security;
create policy jr_business_customers_no_client_access on public.jr_business_customers for all to anon,authenticated using(false) with check(false);
create policy jr_business_expenses_no_client_access on public.jr_business_expenses for all to anon,authenticated using(false) with check(false);
revoke all on public.jr_business_customers,public.jr_business_expenses from anon,authenticated;
grant all on public.jr_business_customers,public.jr_business_expenses to service_role;
