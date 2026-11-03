import { supabase } from "./supabase";

export const STORE_SLUG = "acougue-bom-jardim";

const categoryName = (row) => row.categories?.name || "Diversos";

export async function loadPublicCatalog() {
  if (!supabase) return { products: [], store: null };
  const { data, error } = await supabase
    .from("public_store_catalog")
    .select("*")
    .eq("store_slug", STORE_SLUG)
    .order("category_sort_order", { ascending: true })
    .order("product_name", { ascending: true });
  if (error) throw error;
  const rows = data || [];
  return {
    store: rows[0] ? {
      name: rows[0].store_name,
      whatsapp: rows[0].store_whatsapp,
      businessHours: rows[0].business_hours,
      instagram: rows[0].instagram,
    } : null,
    products: rows.map((p) => ({
      id: p.product_id,
      name: p.product_name,
      category: p.category_name || "Diversos",
      price: Number(p.product_price),
      unit: p.product_unit,
      note: p.product_description || "",
      imageUrl: p.product_image_url || "",
      available: p.product_available,
      featured: false,
    })),
  };
}

export async function loadAdminCatalog(storeId) {
  if (!supabase || !storeId) throw new Error("Sessão da loja não encontrada.");
  const { data, error } = await supabase
    .from("products")
    .select("id,name,description,price,unit,image_url,active,available,category_id,categories(name)")
    .eq("store_id", storeId)
    .order("name");
  if (error) throw error;
  return (data || []).map((p) => ({
    id: p.id,
    name: p.name,
    category: categoryName(p),
    price: Number(p.price),
    unit: p.unit,
    note: p.description || "",
    imageUrl: p.image_url || "",
    available: p.available && p.active,
    featured: false,
  }));
}


export async function loadPublicPromotions() {
  if (!supabase) return [];
  const { data, error } = await supabase.from("public_active_promotions")
    .select("promotion_id,product_id,product_name,product_unit,old_price,promotional_price,title,description,icon")
    .eq("store_slug", STORE_SLUG);
  if (error) throw error;
  return (data || []).map(p => ({
    id:p.promotion_id, productId:p.product_id, productName:p.product_name,
    unit:p.product_unit, oldPrice:Number(p.old_price),
    promotionalPrice:Number(p.promotional_price), title:p.title || "Oferta especial",
    description:p.description || "", icon:p.icon || "🔥"
  }));
}

export async function loadAdminPromotions(storeId) {
  if (!supabase || !storeId) throw new Error("Sessão da loja não encontrada.");
  const { data, error } = await supabase.from("promotions")
    .select("id,product_id,old_price,promotional_price,title,description,icon,starts_at,ends_at,active")
    .eq("store_id", storeId).order("starts_at", {ascending:true});
  if (error) throw error;
  return (data || []).map(p => ({
    id:p.id, productId:p.product_id, oldPrice:Number(p.old_price),
    promotionalPrice:Number(p.promotional_price), title:p.title || "Oferta especial",
    description:p.description || "", icon:p.icon || "🔥",
    startsAt:p.starts_at ? p.starts_at.slice(0,16) : "",
    endsAt:p.ends_at ? p.ends_at.slice(0,16) : "", active:p.active
  }));
}

export async function saveAdminPromotion(promo, storeId) {
  if (!supabase || !storeId) throw new Error("Sessão da loja não encontrada.");
  const productPrice = Number(promo.oldPrice);
  const salePrice = Number(promo.promotionalPrice);
  if (!promo.productId || !Number.isFinite(salePrice) || salePrice < 0 || salePrice > productPrice)
    throw new Error("Escolha um produto e informe um preço promocional válido, menor ou igual ao preço normal.");
  const payload = {
    store_id:storeId, product_id:promo.productId, old_price:productPrice,
    promotional_price:salePrice, title:String(promo.title || "Oferta especial").trim(),
    description:String(promo.description || "").trim(), icon:promo.icon || "🔥",
    starts_at:promo.startsAt ? new Date(promo.startsAt).toISOString() : new Date().toISOString(),
    ends_at:promo.endsAt ? new Date(promo.endsAt).toISOString() : null,
    active:promo.active !== false
  };
  const query = promo.id && typeof promo.id === "string"
    ? supabase.from("promotions").update(payload).eq("id",promo.id).eq("store_id",storeId)
    : supabase.from("promotions").insert(payload);
  const {data,error}=await query.select("id").single();
  if(error) {
    const detail=[error.message,error.details,error.hint,error.code].filter(Boolean).join(" | ");
    throw new Error(detail || "O Supabase recusou a gravação da promoção.");
  }
  if(!data?.id) throw new Error("O banco não confirmou a gravação da promoção. Verifique as permissões da conta e a migração 0003.");
  return {...promo,id:data.id,oldPrice:productPrice,promotionalPrice:salePrice};
}

export async function saveAdminPromotions(promotions, storeId) {
  if (!supabase || !storeId) throw new Error("Sessão da loja não encontrada.");
  if (!Array.isArray(promotions) || promotions.length === 0) throw new Error("Selecione pelo menos um produto para salvar.");
  const payload = promotions.map((promo) => {
    const oldPrice = Number(promo.oldPrice);
    const promotionalPrice = Number(String(promo.promotionalPrice).trim().replace(",", "."));
    if (!promo.productId || !Number.isFinite(oldPrice) || oldPrice <= 0 || !Number.isFinite(promotionalPrice) || promotionalPrice < 0 || promotionalPrice > oldPrice)
      throw new Error("Preço inválido no produto " + (promo.productName || "") + ".");
    const startsAt = new Date(promo.startsAt);
    const endsAt = new Date(promo.endsAt);
    if (!Number.isFinite(startsAt.getTime()) || !Number.isFinite(endsAt.getTime()) || endsAt <= startsAt)
      throw new Error("Confira o período da promoção de " + (promo.productName || "um produto") + ".");
    return {
      store_id: storeId, product_id: promo.productId, old_price: oldPrice,
      promotional_price: promotionalPrice, title: String(promo.title || "Oferta especial").trim(),
      description: String(promo.description || "").trim(), icon: promo.icon || "🔥",
      starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString(), active: promo.active !== false
    };
  });
  // Um único INSERT grava o lote inteiro. Cada novo lote cria registros próprios e preserva os anteriores.
  const { data, error } = await supabase.from("promotions").insert(payload).select(
    "id,product_id,old_price,promotional_price,title,description,icon,starts_at,ends_at,active"
  );
  if (error) {
    const detail = [error.message, error.details, error.hint, error.code].filter(Boolean).join(" | ");
    throw new Error(detail || "O Supabase recusou a gravação do lote de promoções.");
  }
  if (!data || data.length !== payload.length) throw new Error("O banco não confirmou todos os itens do lote.");
  return data.map(row => ({
    id: row.id, productId: row.product_id, oldPrice: Number(row.old_price),
    promotionalPrice: Number(row.promotional_price), title: row.title || "Oferta especial",
    description: row.description || "", icon: row.icon || "🔥",
    startsAt: row.starts_at ? row.starts_at.slice(0, 16) : "",
    endsAt: row.ends_at ? row.ends_at.slice(0, 16) : "", active: row.active
  }));
}

export async function deleteAdminPromotion(id, storeId) {
  const {error}=await supabase.from("promotions").delete().eq("id",id).eq("store_id",storeId);
  if(error) throw error;
}

export async function saveAdminProduct(product, storeId) {
  if (!supabase || !storeId) throw new Error("Sessão da loja não encontrada.");
  const category = String(product.category || "Diversos").trim();
  const { data: categoryRow, error: categoryError } = await supabase
    .from("categories")
    .upsert({ store_id: storeId, name: category }, { onConflict: "store_id,name" })
    .select("id")
    .single();
  if (categoryError) throw categoryError;

  const payload = {
    store_id: storeId,
    category_id: categoryRow.id,
    name: product.name.trim(),
    description: String(product.note || "").trim(),
    price: Number(product.price),
    unit: product.unit === "un." ? "un." : "kg",
    available: product.available !== false,
    image_url: product.imageUrl || null,
    active: true,
  };
  const query = product.id && typeof product.id === "string"
    ? supabase.from("products").update(payload).eq("id", product.id).eq("store_id", storeId)
    : supabase.from("products").insert(payload);
  const { data, error } = await query
    .select("id,name,description,price,unit,image_url,available,categories(name)")
    .single();
  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    category: data.categories?.name || category,
    price: Number(data.price),
    unit: data.unit,
    note: data.description || "",
    imageUrl: data.image_url || "",
    available: data.available,
    featured: false,
  };
}

export async function deleteAdminProduct(id, storeId) {
  if (!supabase || !storeId) throw new Error("Sessão da loja não encontrada.");
  const { error } = await supabase.from("products")
    .delete().eq("id", id).eq("store_id", storeId);
  if (error) throw error;
}

const statusToDb = {
  "Novo": "received",
  "Em preparação": "preparing",
  "Saiu para entrega": "out_for_delivery",
  "Entregue": "delivered",
  "Cancelado": "cancelled",
  "Aguardando resolução": "awaiting_resolution",
};
const statusFromDb = Object.fromEntries(
  Object.entries(statusToDb).map(([label, value]) => [value, label])
);

export async function loadAdminOrders(storeId) {
  if (!supabase || !storeId) throw new Error("Sessão da loja não encontrada.");
  const { data, error } = await supabase
    .from("orders")
    .select("id,order_number,customer_name,customer_phone,delivery_address,delivery_reference,payment_method,cash_received,change_due,status,subtotal,delivery_fee,total,customer_notes,created_at,order_items(id,product_id,product_name,quantity,unit,unit_price,line_total),order_events(id,event_type,old_value,new_value,note,created_at)")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((o) => ({
    id: o.id,
    orderNumber: o.order_number,
    displayId: "BJ-" + o.order_number,
    customer: { name: o.customer_name, phone: o.customer_phone, address: o.delivery_address, reference: o.delivery_reference || "", notes: o.customer_notes || "", cashReceived: o.cash_received == null ? "" : String(o.cash_received), changeDue: o.change_due == null ? "" : String(o.change_due) },
    items: (o.order_items || []).map((i) => ({
      id: i.id, productId: i.product_id, name: i.product_name, qty: Number(i.quantity),
      unit: i.unit, price: Number(i.unit_price), total: Number(i.line_total),
    })),
    subtotal: Number(o.subtotal),
    fee: Number(o.delivery_fee),
    total: Number(o.total),
    payment: ({ pix: "Pix", cash: "Dinheiro", debit: "Cartão de débito", credit: "Cartão de crédito" })[o.payment_method] || o.payment_method,
    status: statusFromDb[o.status] || "Novo",
    createdAt: o.created_at,
    statusHistory: (o.order_events || []).map(event => ({
      id: event.id,
      status: statusFromDb[event.new_value] || event.new_value || (event.event_type === "order_created" ? "Novo" : "Atualização"),
      at: event.created_at,
      note: event.note || "",
    })).sort((a,b) => new Date(a.at) - new Date(b.at)),
  }));
}

export async function updateAdminOrderItems(orderId, items, details) {
  if (!supabase) throw new Error("Banco de dados não configurado.");
  const { error } = await supabase.rpc("update_preparing_order_complete", {
    p_order_id: orderId,
    p_items: items.map(item => ({ product_id: item.productId, quantity: Number(item.qty) })),
    p_order_data: details
  });
  if (error) {
    const detail = [error.message, error.details, error.hint, error.code].filter(Boolean).join(" | ");
    throw new Error(detail || "O banco não confirmou a atualização completa do pedido.");
  }
}

export async function updateAdminOrderStatus(id, status) {
  if (!supabase) throw new Error("Banco de dados não configurado.");
  const dbStatus = statusToDb[status];
  if (!dbStatus) throw new Error("Status de pedido inválido.");
  const { error } = await supabase.from("orders")
    .update({ status: dbStatus, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
