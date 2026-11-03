import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return json({ error: "Função não configurada." }, 500);

    const db = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const body = await req.json();
    const storeSlug = String(body.store_slug ?? "").trim();
    const customerName = String(body.customer_name ?? "").trim();
    const customerPhone = String(body.customer_phone ?? "").replace(/\D/g, "");
    const address = String(body.delivery_address ?? "").trim();
    const reference = String(body.delivery_reference ?? "").trim().slice(0,300);
    const cashReceived = body.cash_received == null ? null : Number(body.cash_received);
    const payment = String(body.payment_method ?? "");
    const notes = String(body.customer_notes ?? "").trim().slice(0, 1000);
    const items = body.items;

    if (!storeSlug || storeSlug.length > 100 ||
        customerName.length < 2 || customerName.length > 120 ||
        customerPhone.length < 10 || customerPhone.length > 13 ||
        address.length < 5 || address.length > 500 ||
        !["pix", "cash", "debit", "credit"].includes(payment) ||
        !Array.isArray(items) || items.length < 1 || items.length > 40) {
      return json({ error: "Confira os dados do pedido." }, 400);
    }

    const { data: store, error: storeError } = await db
      .from("stores")
      .select("id,name,whatsapp")
      .eq("slug", storeSlug)
      .maybeSingle();
    if (storeError || !store) return json({ error: "Loja não encontrada." }, 404);

    const { data: settings } = await db
      .from("delivery_settings")
      .select("mode,fixed_fee,free_over_amount,active,orders_paused,minimum_order")
      .eq("store_id", store.id)
      .maybeSingle();

    if (settings?.orders_paused || settings?.active === false) {
      return json({ error: "A loja não está recebendo pedidos no momento." }, 409);
    }
    if (settings?.mode === "manual" || settings?.mode === "by_neighborhood") {
      return json({ error: "A taxa de entrega precisa ser configurada pela loja." }, 409);
    }

    const cleanItems = items.map((item: any) => ({
      product_id: String(item?.product_id ?? ""),
      quantity: Number(item?.quantity),
    }));
    if (cleanItems.some((item: any) =>
      !/^[0-9a-f-]{36}$/i.test(item.product_id) ||
      !Number.isFinite(item.quantity) || item.quantity <= 0 || item.quantity > 50
    )) return json({ error: "Há um produto ou quantidade inválida." }, 400);

    const ids = [...new Set(cleanItems.map((item: any) => item.product_id))];
    const { data: products, error: productsError } = await db
      .from("products")
      .select("id,name,price,unit,active,available")
      .eq("store_id", store.id)
      .in("id", ids)
      .eq("active", true)
      .eq("available", true);
    if (productsError || !products || products.length !== ids.length) {
      return json({ error: "Um ou mais produtos não estão disponíveis. Atualize o catálogo." }, 409);
    }

    const productMap = new Map(products.map((p: any) => [p.id, p]));
    const now = new Date().toISOString();
    const { data: promotionRows, error: promotionsError } = await db
      .from("promotions")
      .select("product_id,promotional_price,title,icon,starts_at,ends_at")
      .eq("store_id", store.id).eq("active", true);
    if (promotionsError) return json({ error: "Não foi possível validar as promoções. Tente novamente." }, 500);
    const currentTime = Date.now();
    const activePromotions = (promotionRows || []).filter((p: any) =>
      (!p.starts_at || new Date(p.starts_at).getTime() <= currentTime) &&
      (!p.ends_at || new Date(p.ends_at).getTime() >= currentTime)
    );
    const promoMap = new Map(activePromotions.map((p: any) => [p.product_id, p]));
    const orderItems = cleanItems.map((item: any) => {
      const product: any = productMap.get(item.product_id);
      const promo: any = promoMap.get(product.id);
      const quantity = Math.round(item.quantity * 1000) / 1000;
      const regularPrice = Number(product.price);
      const unitPrice = promo ? Number(promo.promotional_price) : regularPrice;
      return {
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit: product.unit,
        unit_price: unitPrice,
        line_total: Math.round(quantity * unitPrice * 100) / 100
      };
    });
    const subtotal = Math.round(orderItems.reduce((sum: number, item: any) => sum + item.line_total, 0) * 100) / 100;
    const minimum = Number(settings?.minimum_order ?? 0);
    if (subtotal < minimum) {
      return json({ error: `O pedido mínimo é R$ ${minimum.toFixed(2).replace(".", ",")}.` }, 409);
    }

    let deliveryFee = Number(settings?.fixed_fee ?? 0);
    if (settings?.mode === "free_over" &&
        subtotal >= Number(settings.free_over_amount ?? Number.POSITIVE_INFINITY)) {
      deliveryFee = 0;
    }
    deliveryFee = Math.max(0, Math.round(deliveryFee * 100) / 100);
    const total = Math.round((subtotal + deliveryFee) * 100) / 100;
    if (payment === "cash" && cashReceived !== null && (!Number.isFinite(cashReceived) || cashReceived < total)) {
      return json({ error: "O valor recebido precisa ser igual ou maior que o total do pedido." }, 400);
    }

    const { data: order, error: orderError } = await db
      .from("orders")
      .insert({
        store_id: store.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_address: address,
        delivery_reference: reference || null,
        cash_received: payment === "cash" ? cashReceived : null,
        change_due: payment === "cash" && cashReceived !== null ? Math.round((cashReceived - total) * 100) / 100 : 0,
        payment_method: payment,
        status: "received",
        subtotal,
        delivery_fee: deliveryFee,
        total,
        customer_notes: notes || null,
      })
      .select("id,order_number")
      .single();
    if (orderError || !order) return json({ error: "Não foi possível registrar o pedido." }, 500);

    const rows = orderItems.map((item: any) => ({ ...item, order_id: order.id }));
    const { error: itemsError } = await db.from("order_items").insert(rows);
    if (itemsError) {
      await db.from("orders").delete().eq("id", order.id);
      return json({ error: "Não foi possível salvar os itens do pedido." }, 500);
    }

    return json({
      success: true,
      order_id: order.id,
      order_number: order.order_number,
      store_name: store.name,
      store_whatsapp: store.whatsapp,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      items: orderItems,
    }, 201);
  } catch {
    return json({ error: "Não foi possível processar o pedido. Tente novamente." }, 400);
  }
});
