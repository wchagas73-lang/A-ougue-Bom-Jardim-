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
    active: true,
  };
  const query = product.id && typeof product.id === "string"
    ? supabase.from("products").update(payload).eq("id", product.id).eq("store_id", storeId)
    : supabase.from("products").insert(payload);
  const { data, error } = await query
    .select("id,name,description,price,unit,available,categories(name)")
    .single();
  if (error) throw error;
  return {
    id: data.id,
    name: data.name,
    category: data.categories?.name || category,
    price: Number(data.price),
    unit: data.unit,
    note: data.description || "",
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
    .select("id,order_number,customer_name,customer_phone,delivery_address,payment_method,status,subtotal,delivery_fee,total,customer_notes,created_at,order_items(id,product_name,quantity,unit,unit_price,line_total)")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((o) => ({
    id: o.id,
    displayId: "BJ-" + o.order_number,
    customer: { name: o.customer_name, phone: o.customer_phone, address: o.delivery_address, notes: o.customer_notes || "" },
    items: (o.order_items || []).map((i) => ({
      id: i.id, name: i.product_name, qty: Number(i.quantity),
      unit: i.unit, price: Number(i.unit_price), total: Number(i.line_total),
    })),
    subtotal: Number(o.subtotal),
    fee: Number(o.delivery_fee),
    total: Number(o.total),
    payment: ({ pix: "Pix", cash: "Dinheiro", debit: "Cartão de débito", credit: "Cartão de crédito" })[o.payment_method] || o.payment_method,
    status: statusFromDb[o.status] || "Novo",
    createdAt: o.created_at,
  }));
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
