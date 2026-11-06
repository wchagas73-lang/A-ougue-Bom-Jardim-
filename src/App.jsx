import React, { useEffect, useMemo, useRef, useState } from "react";
import { Beef, Search, ShoppingBag, ShoppingCart, Plus, Minus, X, Clock3, MapPin, ShieldCheck, LayoutDashboard, Package, ClipboardList, Settings, Tag, Pencil, Trash2, Eye, EyeOff, TrendingUp, Users, Truck, CheckCircle2, LogOut, ArrowLeft, Save, ImagePlus, LockKeyhole, Copy, Printer } from "lucide-react";
import { supabase } from "./lib/supabase";
import { loadPublicCatalog, loadAdminCatalog, saveAdminProduct, deleteAdminProduct, loadAdminOrders, updateAdminOrderStatus, updateAdminOrderItems, deleteAdminOrder } from "./lib/storeData";

const initialProducts = [
  {id:1,name:"Acém",category:"Boi",price:34.90,unit:"kg",note:"Ideal para panela e carne moída",available:true,featured:true},
  {id:2,name:"Alcatra",category:"Boi",price:54.90,unit:"kg",note:"Corte macio para grelha e bifes",available:true,featured:true},
  {id:3,name:"Contrafilé",category:"Boi",price:49.90,unit:"kg",note:"Sabor marcante e ótima maciez",available:true},
  {id:4,name:"Picanha",category:"Boi",price:69.90,unit:"kg",note:"Clássico para o churrasco",available:true,featured:true},
  {id:5,name:"Patinho",category:"Boi",price:39.90,unit:"kg",note:"Versátil para bifes e moída",available:true},
  {id:6,name:"Músculo",category:"Boi",price:29.90,unit:"kg",note:"Perfeito para cozidos",available:true},
  {id:7,name:"Carne moída",category:"Boi",price:36.90,unit:"kg",note:"Moída na hora",available:true},
  {id:8,name:"Costela bovina",category:"Boi",price:32.90,unit:"kg",note:"Ideal para assar lentamente",available:true},
  {id:9,name:"Bife à milanesa bovino",category:"Boi",price:39.90,unit:"kg",note:"Pronto para preparar",available:true},
  {id:10,name:"Almôndegas",category:"Boi",price:35.90,unit:"kg",note:"Práticas para o dia a dia",available:true},
  {id:11,name:"Costelinha suína",category:"Porco",price:27.90,unit:"kg",note:"Ótima assada ou na churrasqueira",available:true},
  {id:12,name:"Bisteca suína",category:"Porco",price:24.90,unit:"kg",note:"Corte saboroso",available:true},
  {id:13,name:"Lombo suíno",category:"Porco",price:29.90,unit:"kg",note:"Macio e versátil",available:true},
  {id:14,name:"Linguiça toscana",category:"Porco",price:22.90,unit:"kg",note:"Perfeita para churrasco",available:true},
  {id:15,name:"Bacon",category:"Porco",price:39.90,unit:"kg",note:"Para receitas e acompanhamentos",available:true},
  {id:16,name:"Asa de frango",category:"Frango",price:19.90,unit:"kg",note:"Boa opção para churrasco",available:true},
  {id:17,name:"Peito de frango",category:"Frango",price:21.90,unit:"kg",note:"Sem osso",available:true},
  {id:18,name:"Coxa e sobrecoxa",category:"Frango",price:15.90,unit:"kg",note:"Saborosa e econômica",available:true},
  {id:19,name:"Filé de peito",category:"Frango",price:25.90,unit:"kg",note:"Prático para grelhar",available:true},
  {id:20,name:"Coxinha da asa",category:"Frango",price:21.90,unit:"kg",note:"Ideal para petiscos",available:true},
  {id:26,name:"Frango assado",category:"Frango",price:0,unit:"un.",note:"Frango assado inteiro",available:true},
  {id:21,name:"Kit Churrasco Família",category:"Churrasco",price:149.90,unit:"un.",note:"Seleção demonstrativa para a família",available:true,featured:true},
  {id:22,name:"Kit Churrasco Especial",category:"Churrasco",price:199.90,unit:"un.",note:"Seleção demonstrativa especial",available:true},
  {id:23,name:"Carvão 4 kg",category:"Diversos",price:18.90,unit:"un.",note:"Para completar o churrasco",available:true},
  {id:24,name:"Pão de alho",category:"Diversos",price:12.90,unit:"un.",note:"Acompanhamento para churrasco",available:true},
  {id:25,name:"Queijo coalho",category:"Diversos",price:29.90,unit:"kg",note:"Ótimo na churrasqueira",available:true}
];
const baseCategories = ["Todos","Boi","Porco","Aves","Churrasco","Diversos"];
const money = n => Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const statusClass = value => ({ "Novo":"novo", "Aguardando resolução":"aguardando-resolucao", "Em preparação":"em-preparacao", "Saiu para entrega":"saiu-para-entrega", "Entregue":"entregue", "Retornando":"retornando", "Retornado":"retornando", "Cancelado":"cancelado" }[value] || "status-padrao");
const load = (key,fallback) => { try { const v=localStorage.getItem(key); return v?JSON.parse(v):fallback; } catch { return fallback; } };

const CATEGORY_IMAGES = {Boi:"https://images.unsplash.com/photo-1602470520998-f4a52199a3d6?w=900",Porco:"https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=900",Frango:"https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=900",Churrasco:"https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=900",Diversos:"https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=900"};
const PRODUCT_IMAGES = [
  [/salsicha/,"https://images.unsplash.com/photo-1585325701956-60dd9c8553bc?w=900"],
  [/torresm|torriço/,"https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=900"],
  [/gordura/,"https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=900"],
  [/presunto/,"https://images.unsplash.com/photo-1524438418049-ab2acb7aa48f?w=900"],
  [/mussarela|muçarela|queijo/,"https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=900"],
  [/massa de pastel|massa de kibe/,"https://images.unsplash.com/photo-1556761223-4c4282c73f77?w=900"],
  [/carvão/,"https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=900"],
  [/pão de alho/,"https://images.unsplash.com/photo-1619531040576-f94167406619?w=900"],
  [/linguiça/,"https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=900"],
  [/costelinha/,"https://images.unsplash.com/photo-1544025162-d76694265947?w=900"],
  [/bacon/,"https://images.unsplash.com/photo-1524438418049-ab2acb7aa48f?w=900"],
  [/kit de churrasco|kit churrasco/,"https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=900"]
];
const productImage = product => {
  if(product?.imageUrl) return product.imageUrl;
  const name = String(product?.name||"").toLocaleLowerCase("pt-BR");
  const match = PRODUCT_IMAGES.find(([pattern]) => pattern.test(name));
  return match?.[1] || CATEGORY_IMAGES[product?.category] || CATEGORY_IMAGES.Diversos;
};
const demoMeatImage = category => CATEGORY_IMAGES[category]||CATEGORY_IMAGES.Diversos;
const normalizeProduct = product => {
  if (!product || typeof product !== "object" || typeof product.name !== "string" || !product.name.trim()) return null;
  const price = Number(product.price);
  return {
    ...product,
    name: product.name.trim(),
    category: typeof product.category === "string" && product.category.trim() ? product.category.trim() : "Diversos",
    price: Number.isFinite(price) && price >= 0 ? price : 0,
    unit: product.unit === "un." ? "un." : "kg",
    note: typeof product.note === "string" ? product.note : "",
    imageUrl: typeof product.imageUrl === "string" ? product.imageUrl : "",
    available: product.available !== false
  };
};
export default function App(){
 const deletedOrderIds=useRef(new Set());
 const ordersRequestVersion=useRef(0);
 async function refreshAdminOrders(storeId){
  const requestVersion=++ordersRequestVersion.current;
  const fresh=await loadAdminOrders(storeId);
  if(requestVersion===ordersRequestVersion.current){
   const visible=fresh.filter(order=>!deletedOrderIds.current.has(String(order.id)));
   setOrders(old=>[...old.filter(order=>String(order.id).startsWith("DEMO-")||String(order.id).startsWith("FALLBACK-")),...visible]);
  }
  return fresh;
 }
 const [products,setProducts]=useState([]);
 const [orders,setOrders]=useState(()=>{const saved=load("bomjardim_orders",[]);return Array.isArray(saved)?saved.filter(order=>order&&typeof order==="object"):[];});
 const [delivery,setDelivery]=useState(()=>{const saved=load("bomjardim_delivery",null);if(!saved||typeof saved!=="object"||Array.isArray(saved))return {mode:"manual",fee:0,freeOver:150,paused:false,estimatedTime:"40 a 60 minutos"};if(saved.mode==="fixed"&&Number(saved.fee)===7&&saved.demoFee!==false)return {...saved,mode:"manual",fee:0,demoFee:false};return {...{mode:"manual",fee:0,freeOver:150,paused:false,estimatedTime:"40 a 60 minutos"},...saved};});
 const [category,setCategory]=useState("Todos"),[search,setSearch]=useState(""),[cart,setCart]=useState([]),[cartOpen,setCartOpen]=useState(false);
 const [configuringProduct,setConfiguringProduct]=useState(null),[purchaseMode,setPurchaseMode]=useState("weight"),[purchaseInput,setPurchaseInput]=useState("0.5");
 const [customer,setCustomer]=useState({name:"",phone:"",address:"",reference:"",payment:"Pix",change:"",notes:""});
 const [checkoutErrors,setCheckoutErrors]=useState({});
 const [area,setArea]=useState("store"),[adminTab,setAdminTab]=useState("overview"),[editing,setEditing]=useState(null),[notice,setNotice]=useState("");
 const [orderFilter,setOrderFilter]=useState("Novos e pendentes");
 const [orderSearch,setOrderSearch]=useState("");
 const [selectedOrder,setSelectedOrder]=useState(null);
 const [orderEditItems,setOrderEditItems]=useState([]),[orderEditMode,setOrderEditMode]=useState(false);
 const [orderEditCustomer,setOrderEditCustomer]=useState({name:"",phone:"",address:"",reference:"",notes:"",payment:"Pix",cashReceived:""});
 const [orderPeriod,setOrderPeriod]=useState("Hoje");
 const [orderDate,setOrderDate]=useState(new Date().toISOString().slice(0,10));
 const [orderStartDate,setOrderStartDate]=useState(new Date().toISOString().slice(0,10));
 const [orderEndDate,setOrderEndDate]=useState(new Date().toISOString().slice(0,10));
 const [orderMonth,setOrderMonth]=useState(new Date().toISOString().slice(0,7));
 const [orderYear,setOrderYear]=useState(String(new Date().getFullYear()));
 const [session,setSession]=useState(null),[profile,setProfile]=useState(null),[authLoading,setAuthLoading]=useState(false),[loginEmail,setLoginEmail]=useState(""),[loginPassword,setLoginPassword]=useState("");
 const [catalogLoaded,setCatalogLoaded]=useState(false),[storeInfo,setStoreInfo]=useState(null),[dataLoading,setDataLoading]=useState(false);
 useEffect(()=>{if(!supabase)return;let alive=true;supabase.auth.getSession().then(async({data})=>{if(!alive)return;const current=data.session;if(!current){setSession(null);return}const{data:member,error}=await supabase.from("profiles").select("store_id,role,active").eq("id",current.user.id).single();if(!alive)return;if(error||!member?.active||!["owner","employee"].includes(member.role)){await supabase.auth.signOut();setSession(null);setProfile(null);return}setSession(current);setProfile(member)});const{data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{if(!next){setSession(null);setProfile(null)}});return()=>{alive=false;subscription.unsubscribe()}},[]);
 async function signIn(){if(!supabase){setNotice("Conexão com o banco não configurada. Verifique as variáveis da Vercel.");return}if(!loginEmail.trim()||!loginPassword){setNotice("Informe e-mail e senha do responsável.");return}setAuthLoading(true);const{data,error}=await supabase.auth.signInWithPassword({email:loginEmail.trim(),password:loginPassword});if(error){setNotice("Não foi possível entrar. Confira o e-mail e a senha.");setAuthLoading(false);return}const{data:member,error:profileError}=await supabase.from("profiles").select("store_id,role,active").eq("id",data.user.id).single();if(profileError||!member?.active||!["owner","employee"].includes(member.role)){await supabase.auth.signOut();setNotice("Este usuário não tem permissão para acessar o painel desta loja.");setAuthLoading(false);return}setSession(data.session);setProfile(member);setLoginPassword("");setNotice("Acesso autorizado.");setAuthLoading(false)}
 async function signOut(){if(supabase)await supabase.auth.signOut();setSession(null);setProfile(null);setArea("store")}
 const persistLocal=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch(error){console.warn("Não foi possível salvar dados locais ("+key+").",error);}};
 useEffect(()=>persistLocal("bomjardim_products",products),[products]);
 useEffect(()=>persistLocal("bomjardim_orders",orders),[orders]);
 useEffect(()=>persistLocal("bomjardim_delivery",delivery),[delivery]);
 useEffect(()=>{let alive=true;(async()=>{try{const result=await loadPublicCatalog();if(!alive)return;setProducts((result.products||[]).map(normalizeProduct).filter(Boolean));if(result.store)setStoreInfo(result.store);setCatalogLoaded(true)}catch(error){if(alive){setProducts([]);setCatalogLoaded(false);setNotice("Não foi possível carregar o catálogo oficial. Tente novamente em instantes.")}}})();return()=>{alive=false}},[]);
 useEffect(()=>{if(!session||!profile?.store_id)return;let alive=true;(async()=>{setDataLoading(true);try{const [dbProducts,dbOrders]=await Promise.all([loadAdminCatalog(profile.store_id),loadAdminOrders(profile.store_id)]);if(!alive)return;setProducts(dbProducts);const localDemoOrders=load("bomjardim_orders",[]).filter(o=>String(o.id).startsWith("DEMO-"));setOrders([...localDemoOrders,...dbOrders]);if(dbProducts.length===0)setNotice("Banco conectado. Cadastre o primeiro produto oficial da loja.");}catch(error){if(alive)setNotice("Erro ao carregar os dados da loja: "+(error.message||"verifique as permissões do Supabase."));}finally{if(alive)setDataLoading(false)}})();return()=>{alive=false}},[session,profile?.store_id]);
 useEffect(()=>{if(!supabase||!session||!profile?.store_id)return;let active=true;const storeId=profile.store_id;const refreshOrders=async()=>{try{if(active)await refreshAdminOrders(storeId);}catch(error){console.warn("Não foi possível atualizar os pedidos automaticamente.",error)}};const channel=supabase.channel("store-orders-"+storeId).on("postgres_changes",{event:"*",schema:"public",table:"orders",filter:"store_id=eq."+storeId},()=>{refreshOrders()}).subscribe((status,error)=>{if(status==="CHANNEL_ERROR"||status==="TIMED_OUT")console.warn("Realtime dos pedidos indisponível; atualização periódica será mantida.",error||status)});const fallbackRefresh=window.setInterval(refreshOrders,15000);return()=>{active=false;window.clearInterval(fallbackRefresh);supabase.removeChannel(channel)}},[session,profile?.store_id]);
 const STORE_WHATSAPP="5532998275204";
 const estimatedTime=delivery.estimatedTime||"40 a 60 minutos";
 const catalogProducts=(Array.isArray(products)?products:[]).map(normalizeProduct).filter(Boolean);
 const adminCatalogProducts=products.filter(p=>typeof p.id==="string"&&/^[0-9a-f-]{36}$/i.test(p.id));
 const orderEditCatalogProducts=String(selectedOrder?.id||"").startsWith("DEMO-")?products.filter(p=>p.available):adminCatalogProducts.filter(p=>p.available);
 const categories=baseCategories;
 const normalizeCategory=value=>String(value||"").trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
 const isChurrascoProduct=p=>{const cat=normalizeCategory(p.category);const name=normalizeCategory(p.name);const description=normalizeCategory(p.note);return cat==="churrasco"||name.includes("churrasco")||description.includes("churrasco")};
 const visible=useMemo(()=>catalogProducts.filter(p=>p.available&&(category==="Todos"||(category==="Aves"?["aves","ave","frango","frangos"].includes(normalizeCategory(p.category)):category==="Churrasco"?isChurrascoProduct(p):normalizeCategory(p.category)===normalizeCategory(category)))&&p.name.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))),[catalogProducts,category,search]);
 const priceOf=p=>Number(p.price||0);
 const lineTotalOf=p=>p.purchaseMode==="amount"?Number(p.requestedAmount||0):Number((priceOf(p)*p.qty).toFixed(2));
 const itemDescription=p=>p.purchaseMode==="amount"?"Valor solicitado: "+money(p.requestedAmount)+" (aprox. "+p.qty.toLocaleString("pt-BR",{maximumFractionDigits:3})+" kg)":p.qty.toLocaleString("pt-BR")+" "+p.unit+" × "+money(priceOf(p))+"/"+p.unit+" = "+money(lineTotalOf(p));
 // Mantém "Todos" como categoria inicial.
 const count=cart.length,subtotal=cart.reduce((s,p)=>s+lineTotalOf(p),0);
 const fee=delivery.mode==="manual"?0:delivery.mode==="fixed"?Number(delivery.fee||0):(subtotal>=Number(delivery.freeOver||0)?0:Number(delivery.fee||0));
 const total=subtotal+fee;
 const delivered=orders.filter(o=>o.status==="Entregue");
 const inProgressCount=orders.filter(o=>!["Entregue","Cancelado","Retornando"].includes(o.status)).length;
 const cancelledCount=orders.filter(o=>o.status==="Cancelado").length;
 const orderStatuses=[{label:"Novos e pendentes",match:o=>["Novo","Aguardando resolução"].includes(o.status)},{label:"Todos",match:()=>true},{label:"Pendentes",match:o=>["Novo","Aguardando resolução"].includes(o.status)},{label:"Em preparação",match:o=>o.status==="Em preparação"},{label:"Saiu para entrega",match:o=>o.status==="Saiu para entrega"},{label:"Entregues",match:o=>o.status==="Entregue"},{label:"Retornando",match:o=>o.status==="Retornando"},{label:"Cancelados",match:o=>o.status==="Cancelado"}];
 const inSelectedOrderPeriod=o=>{const d=new Date(o.createdAt);if(Number.isNaN(d.getTime()))return false;const localDate=[d.getFullYear(),String(d.getMonth()+1).padStart(2,"0"),String(d.getDate()).padStart(2,"0")].join("-");if(orderPeriod==="Hoje")return localDate===new Date().toLocaleDateString("en-CA");if(orderPeriod==="Data específica")return localDate>=orderStartDate&&localDate<=orderEndDate;if(orderPeriod==="Mês")return localDate.slice(0,7)===orderMonth;if(orderPeriod==="Ano")return String(d.getFullYear())===orderYear;return true};
 const normalizedOrderSearch=orderSearch.trim().toLocaleLowerCase("pt-BR").replace(/^#/, "");
 const filteredOrders=orders.filter(o=>{
  // Quando há uma busca explícita, consultar o histórico inteiro,
  // independentemente da aba de status ou do período selecionado.
  const matchesStatus=Boolean(normalizedOrderSearch)||orderStatuses.find(s=>s.label===orderFilter)?.match(o);
  const matchesPeriod=Boolean(normalizedOrderSearch)||(orderFilter==="Novos e pendentes"&&orderPeriod==="Hoje"?true:inSelectedOrderPeriod(o));
  const searchable=[o.displayId,o.orderNumber,o.id,o.customer?.name,o.customer?.phone].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
  const matchesSearch=!normalizedOrderSearch||searchable.includes(normalizedOrderSearch)||searchable.replace(/[^a-z0-9]/g,"").includes(normalizedOrderSearch.replace(/[^a-z0-9]/g,""));
  return matchesStatus&&matchesPeriod&&matchesSearch;
 });
 const revenue=delivered.reduce((s,o)=>s+o.total,0);
 function add(p,mode="weight",value=0.5){if(delivery.paused){setNotice("A loja pausou temporariamente o recebimento de pedidos.");return}if(p.unit==="kg"&&(!(priceOf(p)>0)||!(value>0)||(mode==="weight"&&value<0.5))){setNotice("Informe um peso ou valor válido para este produto.");return}const requestedAmount=p.unit==="kg"&&mode==="amount"?Number(value.toFixed(2)):null;const quantity=p.unit==="kg"?(mode==="amount"?Number((requestedAmount/priceOf(p)).toFixed(6)):Number(value)):1;setCart(old=>{const x=old.find(i=>i.id===p.id);return x?old.map(i=>i.id===p.id?{...i,qty:Number((i.qty+quantity).toFixed(6)),purchaseMode:mode==="amount"||i.purchaseMode==="amount"?"amount":"weight",requestedAmount:mode==="amount"||i.purchaseMode==="amount"?Number((lineTotalOf(i)+(mode==="amount"?requestedAmount:Number((priceOf(p)*quantity).toFixed(2)))).toFixed(2)):null}:i):[...old,{...p,qty:quantity,purchaseMode:mode==="amount"?"amount":"weight",requestedAmount}]});setConfiguringProduct(null)}
 function qty(id,d){setCart(old=>old.map(p=>{if(p.id!==id)return p;const nextQty=Math.max(0,Number((p.qty+d).toFixed(6)));return {...p,qty:nextQty,requestedAmount:p.purchaseMode==="amount"?Number((nextQty*priceOf(p)).toFixed(2)):p.requestedAmount}}).filter(p=>p.qty>0))}
 async function finishOrder(){
  if(delivery.paused){setNotice("A loja pausou temporariamente o recebimento de pedidos.");return}
  const errors={name:!customer.name.trim(),phone:!customer.phone.trim(),address:!customer.address.trim()};
  setCheckoutErrors(errors);
  if(errors.name||errors.phone||errors.address){setNotice("Confira os campos destacados em vermelho e preencha as informações obrigatórias.");const first=errors.name?"customer-name":errors.phone?"customer-phone":"customer-address";requestAnimationFrame(()=>document.getElementById(first)?.focus());return}
  if(!cart.length){setNotice("Adicione pelo menos um produto antes de confirmar o pedido.");return}
  const isDemoOrder=cart.every(p=>typeof p.id==="number");
  if(isDemoOrder){
   const demoNumber=String(Date.now()).slice(-6);
   const createdAt=new Date().toISOString();
   const demoOrder={id:"DEMO-"+demoNumber,createdAt,estimatedDeliveryMinutes:estimatedTime,customer:{...customer},items:cart.map(p=>({...p,price:priceOf(p),total:lineTotalOf(p)})),subtotal,fee,total,payment:customer.payment,status:"Novo",statusHistory:[{status:"Novo",at:createdAt}]};
   const nextOrders=[demoOrder,...orders];setOrders(nextOrders);localStorage.setItem("bomjardim_orders",JSON.stringify(nextOrders));
   const orderLines=cart.map(p=>"• "+p.name+"\n  "+itemDescription(p)+"\n  Total: "+money(lineTotalOf(p))).join("\n\n");
   const whatsappMessage="🥩 AÇOUGUE BOM JARDIM\n"+
    "📦 NOVO PEDIDO DE DEMONSTRAÇÃO #"+demoNumber+"\n"+
    "🕒 Recebido em: "+new Date(createdAt).toLocaleString("pt-BR")+"\n\n"+
    "👤 CLIENTE\n"+customer.name+"\n📞 "+customer.phone+"\n📍 "+customer.address+(customer.reference?"\n📌 Referência: "+customer.reference:"")+"\n\n"+
    "🛒 PRODUTOS\n"+orderLines+"\n\n"+
    "💰 RESUMO DO PEDIDO\nProdutos: "+money(subtotal)+"\n🛵 Entrega: "+(delivery.mode==="manual"?"A combinar":money(fee))+"\n💵 TOTAL: "+money(total)+"\n\n"+
    "💳 Pagamento: "+customer.payment+(customer.payment==="Dinheiro"&&customer.change&&Number(String(customer.change).replace(",","."))>=total?"\n💵 Cliente paga com: "+money(Number(String(customer.change).replace(",",".")))+"\n💸 TROCO A DEVOLVER: "+money(Number(String(customer.change).replace(",","."))-total):"")+
    (customer.notes?"\n📝 Observações: "+customer.notes:"")+"\n\n❤️ Obrigado pela preferência!\nPedido fictício para demonstração.";
   setCart([]);setCartOpen(false);setCustomer({name:"",phone:"",address:"",reference:"",payment:"Pix",change:"",notes:""});
   setNotice("Pedido de demonstração criado! Abrindo o WhatsApp da loja.");
   const boldWhatsAppMessage=whatsappMessage.split("\n").map(line=>line.trim()?"*"+line+"*":line).join("\n");
   window.location.assign("https://wa.me/"+STORE_WHATSAPP+"?text="+encodeURIComponent(boldWhatsAppMessage));
   return;
  }
  if(!supabase||!catalogLoaded||!cart.every(p=>typeof p.id==="string")){setNotice("O catálogo oficial ainda não está disponível para pedidos online. Aguarde a loja cadastrar os produtos no banco.");return}
  const paymentMap={"Pix":"pix","Dinheiro":"cash","Cartão de débito":"debit","Cartão de crédito":"credit"};
  // Open WhatsApp in the same tab only after the order is saved. This avoids
  // launching an empty WhatsApp chat before the message is ready on mobile browsers.
  setDataLoading(true);
  try{
   const {data,error}=await supabase.functions.invoke("create-order",{body:{
    store_slug:"acougue-bom-jardim",
    customer_name:customer.name.trim(),
    customer_phone:customer.phone,
    delivery_address:customer.address.trim(),
    delivery_reference:customer.reference.trim(),
    cash_received:customer.payment==="Dinheiro"&&customer.change.trim()!==""?Number(String(customer.change).replace(",",".")):null,
    payment_method:paymentMap[customer.payment],
    customer_notes:customer.notes.trim(),
    items:cart.map(p=>({product_id:p.id,quantity:p.qty,requested_amount:p.purchaseMode==="amount"?p.requestedAmount:null}))
   }});
   if(error){
    const serverMessage=data?.error||error?.context?.message||error?.message;
    throw new Error(serverMessage||"Não foi possível registrar o pedido no sistema da loja.");
   }
   if(!data?.success)throw new Error(data?.error||"Não foi possível registrar o pedido.");
   const orderLines=cart.map(p=>"• "+p.name+"\n  "+itemDescription(p)+"\n  Total: "+money(lineTotalOf(p))).join("\n\n");
   const receivedAt=new Date().toLocaleString("pt-BR");
   const whatsappMessage="🥩 AÇOUGUE BOM JARDIM\n"+
    "📦 NOVO PEDIDO #"+data.order_number+"\n"+
    "🕒 Recebido em: "+receivedAt+"\n\n"+
    "👤 CLIENTE\n"+customer.name+"\n📞 "+customer.phone+"\n📍 "+customer.address+(customer.reference?"\n📌 Referência: "+customer.reference:"")+"\n\n"+
    "🛒 PRODUTOS\n"+orderLines+"\n\n"+
    "💰 RESUMO DO PEDIDO\nProdutos: "+money(data.subtotal)+"\n🛵 Entrega: "+money(data.delivery_fee)+"\n💵 TOTAL: "+money(data.total)+"\n\n"+
    "💳 Pagamento: "+customer.payment+(customer.payment==="Dinheiro"&&customer.change&&Number(String(customer.change).replace(",","."))>=Number(data.total)?"\n💵 Cliente paga com: "+money(Number(String(customer.change).replace(",",".")))+"\n💸 TROCO A DEVOLVER: "+money(Number(String(customer.change).replace(",","."))-Number(data.total)):"")+
    (customer.notes?"\n📝 Observações: "+customer.notes:"")+"\n\n❤️ Obrigado pela preferência!";
   const whatsappNumber=STORE_WHATSAPP;
   if(!whatsappNumber)throw new Error("O WhatsApp de recebimento da loja não está configurado.");
   const boldWhatsAppMessage=whatsappMessage.split("\n").map(line=>line.trim()?"*"+line+"*":line).join("\n");
   const whatsappUrl="https://wa.me/"+whatsappNumber+"?text="+encodeURIComponent(boldWhatsAppMessage);
   window.location.assign(whatsappUrl);
   setCart([]);setCartOpen(false);setCustomer({name:"",phone:"",address:"",reference:"",payment:"Pix",change:"",notes:""});
   setNotice("Pedido #"+data.order_number+" registrado com sucesso. Abrindo o WhatsApp da loja...");
   setArea("store");
  }catch(error){
   // Fallback: se o banco estiver indisponível, não perder o pedido.
   // O WhatsApp recebe os dados completos, mas o painel não é atualizado.
   const fallbackNumber=String(Date.now()).slice(-6);
   const fallbackAt=new Date().toISOString();
   const fallbackItems=cart.map(p=>({...p,price:priceOf(p),total:lineTotalOf(p)}));
   const fallbackSubtotal=Number(fallbackItems.reduce((sum,p)=>sum+p.total,0).toFixed(2));
   const fallbackFee=Number(fee||0);
   const fallbackTotal=Number((fallbackSubtotal+fallbackFee).toFixed(2));
   const fallbackLines=fallbackItems.map(p=>"• "+p.name+"\\n  "+itemDescription(p)+"\\n  Total: "+money(p.total)).join("\\n\\n");
   const fallbackChange=customer.payment==="Dinheiro"&&customer.change.trim()!==""?Number(String(customer.change).replace(",",".")):null;
   const fallbackMessage="🥩 AÇOUGUE BOM JARDIM\n"+
    "📦 NOVO PEDIDO #"+fallbackNumber+"\n"+
    "🕒 Recebido em: "+new Date(fallbackAt).toLocaleString("pt-BR")+"\n\n"+
    "👤 CLIENTE\n"+customer.name+"\n📞 "+customer.phone+"\n📍 "+customer.address+(customer.reference?"\n📌 Referência: "+customer.reference:"")+"\n\n"+
    "🛒 PRODUTOS\n"+fallbackLines+"\n\n"+
    "💰 RESUMO DO PEDIDO\nProdutos: "+money(fallbackSubtotal)+"\n🛵 Entrega: "+(delivery.mode==="manual"?"A combinar":money(fallbackFee))+"\n💵 TOTAL: "+money(fallbackTotal)+"\n\n"+
    "💳 Pagamento: "+customer.payment+(fallbackChange!==null&&fallbackChange>=fallbackTotal?"\n💵 Cliente paga com: "+money(fallbackChange)+"\n💸 TROCO A DEVOLVER: "+money(fallbackChange-fallbackTotal):"")+
    (customer.notes?"\n📝 Observações: "+customer.notes:"")+"\n\n❤️ Obrigado pela preferência!\n\n⚠️ O banco não confirmou o registro deste pedido. A loja deve conferir e registrar no painel.";
   const fallbackOrder={id:"FALLBACK-"+fallbackNumber,displayId:"#"+fallbackNumber,createdAt:fallbackAt,customer:{...customer},items:fallbackItems,subtotal:fallbackSubtotal,fee:fallbackFee,total:fallbackTotal,payment:customer.payment,status:"Novo",statusHistory:[{status:"Novo",at:fallbackAt,note:"Recebido localmente; aguardando conferência no WhatsApp."}]};
   const nextOrders=[fallbackOrder,...orders];
   setOrders(nextOrders);
   try{localStorage.setItem("bomjardim_orders",JSON.stringify(nextOrders))}catch(storageError){console.warn("Não foi possível salvar a cópia local do pedido.",storageError)}
   const whatsappNumber=STORE_WHATSAPP;
   if(whatsappNumber){
    const boldFallbackMessage=fallbackMessage.split("\n").map(line=>line.trim()?"*"+line+"*":line).join("\n");
    window.location.assign("https://wa.me/"+whatsappNumber+"?text="+encodeURIComponent(boldFallbackMessage));
    setCart([]);setCartOpen(false);setCustomer({name:"",phone:"",address:"",reference:"",payment:"Pix",change:"",notes:""});
    setNotice("Banco indisponível. Pedido encaminhado ao WhatsApp como envio alternativo; confira e registre no painel.");
   }else{
    setNotice("Falha no banco e WhatsApp da loja não configurado. Anote os dados do pedido antes de fechar.");
   }
  }
  finally{setDataLoading(false)}
 }
 function startOrderEdit(){
  if(selectedOrder?.status!=="Em preparação"||profile?.role!=="owner")return;
  setOrderEditItems((selectedOrder.items||[]).map(i=>({productId:i.productId??(orderEditCatalogProducts.find(p=>p.name===i.name)?.id??""),name:i.name,qty:Number(i.qty),unit:i.unit,price:Number(i.price??i.unit_price??0)})));
  setOrderEditCustomer({
   name:selectedOrder.customer?.name||"",phone:selectedOrder.customer?.phone||"",
   address:selectedOrder.customer?.address||"",reference:selectedOrder.customer?.reference||"",
   notes:selectedOrder.customer?.notes||"",payment:selectedOrder.payment||"Pix",
   cashReceived:selectedOrder.customer?.cashReceived||""
  });
  setOrderEditMode(true);
 }
 function changeOrderEditItem(index,patch){setOrderEditItems(old=>old.map((item,i)=>i===index?{...item,...patch}:item))}
 const orderEditSubtotal=Number(orderEditItems.reduce((sum,item)=>sum+Number((Number(item.price||0)*Number(item.qty||0)).toFixed(2)),0).toFixed(2));
 const orderEditTotal=Number((orderEditSubtotal+Number(selectedOrder?.fee||0)).toFixed(2));
 const orderEditCash=Number(String(orderEditCustomer.cashReceived||"").replace(",","."));
 const orderEditChange=orderEditCustomer.payment==="Dinheiro"&&orderEditCustomer.cashReceived!==""?Number((orderEditCash-orderEditTotal).toFixed(2)):0;
 async function saveOrderEdit(){
  if(!selectedOrder||selectedOrder.status!=="Em preparação")return;
  if(!orderEditCustomer.name.trim()||!orderEditCustomer.phone.trim()||!orderEditCustomer.address.trim()){
   setNotice("Preencha nome, telefone e endereço do cliente.");return;
  }
  if(!orderEditItems.length||orderEditItems.some(i=>!i.productId||!Number.isFinite(Number(i.qty))||Number(i.qty)<=0)){
   setNotice("Confira os produtos e as quantidades antes de salvar.");return;
  }
  if(orderEditCustomer.payment==="Dinheiro"&&orderEditCustomer.cashReceived!==""&&(!Number.isFinite(orderEditCash)||orderEditCash<orderEditTotal)){
   setNotice("O valor recebido precisa ser igual ou maior que o total do pedido.");return;
  }
  setDataLoading(true);
  try{
   const details={
    customer_name:orderEditCustomer.name.trim(),
    customer_phone:orderEditCustomer.phone.trim(),
    delivery_address:orderEditCustomer.address.trim(),
    delivery_reference:orderEditCustomer.reference.trim(),
    customer_notes:orderEditCustomer.notes.trim(),
    payment_method:({"Pix":"pix","Dinheiro":"cash","Cartão de débito":"debit","Cartão de crédito":"credit"})[orderEditCustomer.payment],
    cash_received:orderEditCustomer.payment==="Dinheiro"&&orderEditCustomer.cashReceived!==""?orderEditCash:null
   };
   let updated;
   if(String(selectedOrder.id).startsWith("DEMO-")){
    const items=orderEditItems.map(i=>{const p=products.find(x=>String(x.id)===String(i.productId));return {...i,name:p?.name||i.name,unit:p?.unit||i.unit,price:Number(p?.price??i.price),total:Number((Number(p?.price??i.price)*Number(i.qty)).toFixed(2))}});
    const subtotal=Number(items.reduce((sum,i)=>sum+i.total,0).toFixed(2));
    const total=Number((subtotal+Number(selectedOrder.fee||0)).toFixed(2));
    const cashReceived=details.cash_received;
    updated={...selectedOrder,customer:{...selectedOrder.customer,name:details.customer_name,phone:details.customer_phone,address:details.delivery_address,reference:details.delivery_reference,notes:details.customer_notes,cashReceived:cashReceived==null?"":String(cashReceived),changeDue:cashReceived==null?"":String(Math.max(0,cashReceived-total))},items,subtotal,total,payment:orderEditCustomer.payment,statusHistory:[...(selectedOrder.statusHistory||[]),{status:"Em preparação",at:new Date().toISOString(),note:"Dados, itens, pagamento e valores do pedido atualizados."}]};
    const next=orders.map(o=>o.id===updated.id?updated:o);setOrders(next);localStorage.setItem("bomjardim_orders",JSON.stringify(next));
   }else{
    await updateAdminOrderItems(selectedOrder.id,orderEditItems,details);
    const fresh=await loadAdminOrders(profile.store_id);
    setOrders(old=>[...old.filter(o=>String(o.id).startsWith("DEMO-")),...fresh]);
    updated=fresh.find(o=>o.id===selectedOrder.id);
    if(!updated)throw new Error("Pedido atualizado, mas não foi possível recarregar seus dados.");
   }
   setSelectedOrder(updated);setOrderEditMode(false);
   setNotice("Pedido completo atualizado e salvo no banco. O WhatsApp já poderá usar os novos dados.");
  }catch(error){setNotice("Não foi possível salvar o pedido: "+(error.message||"erro ao salvar."));}
  finally{setDataLoading(false)}
 }
 async function copyUpdatedOrder(){
  if(!selectedOrder)return;
  const orderLines=(selectedOrder.items||[]).map(i=>{const lineTotal=Number(i.total??i.line_total??Number(i.price??i.unit_price??0)*Number(i.qty??i.quantity??0));const qty=Number(i.qty??i.quantity??0),price=Number(i.price??i.unit_price??0);const amountPurchase=i.unit==="kg"&&Math.abs(lineTotal-Math.round(qty*price*100)/100)>=0.005;return "• "+i.name+"\\n  "+(amountPurchase?"Valor solicitado: "+money(lineTotal)+" · peso aprox. "+qty.toLocaleString("pt-BR")+" kg":qty+" "+i.unit+" × "+money(price)+"/"+i.unit)+"\\n  Total: "+money(lineTotal)}).join("\\n\\n");
  const cash=Number(String(selectedOrder.customer?.cashReceived||"").replace(",","."));
  const change=Number.isFinite(cash)?Math.max(0,cash-Number(selectedOrder.total||0)):0;
  const message="🥩 AÇOUGUE BOM JARDIM\n"+
   "📦 PEDIDO ATUALIZADO "+(selectedOrder.displayId||selectedOrder.id)+"\n"+
   "🕒 Atualizado em: "+new Date().toLocaleString("pt-BR")+"\n\n"+
   "👤 CLIENTE\n"+(selectedOrder.customer?.name||"")+"\n📞 "+(selectedOrder.customer?.phone||"")+"\n📍 "+(selectedOrder.customer?.address||"")+
   (selectedOrder.customer?.reference?"\n📌 Referência: "+selectedOrder.customer.reference:"")+"\n\n"+
   "🛒 PRODUTOS\n"+orderLines+"\n\n"+
   "💰 RESUMO DO PEDIDO\nProdutos: "+money(selectedOrder.subtotal)+"\n🛵 Entrega: "+money(selectedOrder.fee)+"\n💵 TOTAL: "+money(selectedOrder.total)+"\n\n"+
   "💳 Pagamento: "+(selectedOrder.payment||"Não informado")+
   (selectedOrder.payment==="Dinheiro"&&selectedOrder.customer?.cashReceived?"\n💵 Cliente paga com: "+money(cash)+"\n💸 TROCO A DEVOLVER: "+money(change):"")+
   (selectedOrder.customer?.notes?"\n📝 Observações: "+selectedOrder.customer.notes:"")+
   "\n\n❤️ Obrigado pela preferência!\n"+
   "⚠️ Esta mensagem contém os dados atualizados e substitui a versão anterior do pedido.";
  try{
   if(navigator.clipboard?.writeText){
    await navigator.clipboard.writeText(message);
   }else{
    const area=document.createElement("textarea");
    area.value=message;area.setAttribute("readonly","");
    area.style.position="fixed";area.style.opacity="0";
    document.body.appendChild(area);area.select();
    const copied=document.execCommand("copy");area.remove();
    if(!copied)throw new Error("O navegador não permitiu copiar automaticamente.");
   }
   setNotice("Pedido atualizado copiado com o mesmo layout e emojis da mensagem original. Abra a conversa do cliente, cole e envie.");
  }catch(error){setNotice("Não foi possível copiar o pedido. Tente novamente ou copie manualmente os dados.");}
 }
 async function deleteOrder(order){
  if(!order)return;
  const label=order.displayId||order.id;
  const confirmed=window.confirm("Deseja realmente excluir permanentemente o pedido "+label+"?\n\nTodos os dados deste pedido, incluindo itens e histórico, serão apagados do banco de dados. Esta ação não poderá ser desfeita.\n\nClique em OK para excluir ou Cancelar para manter.");
  if(!confirmed)return;
  setDataLoading(true);
  try{
   const id=String(order.id||"");
   if(id.startsWith("DEMO-")||id.startsWith("FALLBACK-")){
    const next=orders.filter(item=>String(item.id)!==id);
    setOrders(next);
    localStorage.setItem("bomjardim_orders",JSON.stringify(next));
   }else{
    if(profile?.role!=="owner")throw new Error("Somente o proprietário pode excluir pedidos.");
    // Invalida consultas anteriores para não restaurar contagens antigas no painel.
    ordersRequestVersion.current++;
    await deleteAdminOrder(id,profile.store_id);
    // Impede que consultas futuras tragam novamente o pedido excluído.
    deletedOrderIds.current.add(id);
    setOrders(old=>{
     const next=old.filter(item=>String(item.id)!==id);
     localStorage.setItem("bomjardim_orders",JSON.stringify(next));
     return next;
    });
    await refreshAdminOrders(profile.store_id);
   }
   if(String(selectedOrder?.id)===id)setSelectedOrder(null);
   setNotice("Pedido "+label+" excluído permanentemente.");
  }catch(error){
   setNotice("Não foi possível excluir o pedido: "+(error.message||"verifique a conexão e as permissões."));
  }finally{setDataLoading(false)}
 }
 async function updateStatus(id,status){
  try{
   const isLocalOrder=String(id).startsWith("DEMO-")||String(id).startsWith("FALLBACK-");
   if(!isLocalOrder){
    ordersRequestVersion.current++;
    await updateAdminOrderStatus(id,status);
    await refreshAdminOrders(profile.store_id);
   }else{
    const changedAt=new Date().toISOString();
    setOrders(old=>{const next=old.map(o=>o.id===id?{...o,status,statusHistory:[...(o.statusHistory||[{status:o.status,at:o.createdAt}]),{status,at:changedAt}]}:o);localStorage.setItem("bomjardim_orders",JSON.stringify(next));return next});
   }
   setNotice("Status atualizado e confirmado no sistema.");
   return true;
  }catch(error){
   setNotice("Não foi possível salvar o status: "+(error.message||"erro de conexão."));
   return false;
  }
 }
 async function printOrder(order){
  if(!order)return;
  const printWindow=window.open("","_blank","width=440,height=720");
  if(!printWindow){setNotice("O navegador bloqueou a janela de impressão. Permita pop-ups para este site e tente novamente.");return}
  printWindow.document.write("<!doctype html><html lang='pt-BR'><head><meta charset='utf-8'><title>Preparando pedido...</title></head><body style='font-family:Arial;padding:20px;font-weight:bold'>Carregando itens do pedido para impressão...</body></html>");
  const escapeHtml=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  let orderItems=Array.isArray(order.items)?order.items:[];
  if(orderItems.length===0&&supabase&&order.id&&!String(order.id).startsWith("DEMO-")&&!String(order.id).startsWith("FALLBACK-")){
   try{
    const {data,error}=await supabase.from("order_items").select("id,product_id,product_name,quantity,unit,unit_price,line_total").eq("order_id",order.id);
    if(error)throw error;
    orderItems=(data||[]).map(item=>({id:item.id,productId:item.product_id,name:item.product_name,qty:Number(item.quantity),unit:item.unit||"un.",price:Number(item.unit_price),total:Number(item.line_total)}));
   }catch(error){
    console.error("Falha ao recuperar itens para impressão:",error);
    setNotice("Não foi possível recuperar os produtos deste pedido. Verifique a conexão e tente imprimir novamente.");
    printWindow.close();
    return;
   }
  }
  const items=orderItems.map(item=>{
   const qty=Number(item.qty??item.quantity??0),unit=item.unit||"un.",price=Number(item.price??item.unit_price??0);
   const name=item.name??item.product_name??"Produto";
   const lineTotal=Number(item.total??item.line_total??price*qty);
   const amountPurchase=unit==="kg"&&Math.abs(lineTotal-Math.round(qty*price*100)/100)>=0.005;const detail=amountPurchase?"Valor solicitado: "+money(lineTotal)+" · peso aprox. "+qty.toLocaleString("pt-BR")+" kg":qty.toLocaleString("pt-BR")+" "+escapeHtml(unit)+" × "+money(price)+"/"+escapeHtml(unit);return "<tr><td><b>"+escapeHtml(name)+"</b><small>"+detail+"</small></td><td>"+money(lineTotal)+"</td></tr>";
  }).join("");
  const cash=Number(String(order.customer?.cashReceived??"").replace(",","."));
  const change=Number.isFinite(cash)?Math.max(0,cash-Number(order.total||0)):Number(order.customer?.changeDue||0);
  const updatedAt=order.updatedAt||order.statusHistory?.[order.statusHistory.length-1]?.at||order.createdAt;
  const cashInfo=order.payment==="Dinheiro"&&order.customer?.cashReceived!==""&&order.customer?.cashReceived!=null?"<p>Cliente paga com: <b>"+money(cash)+"</b></p><p>Troco a devolver: <b>"+money(change)+"</b></p>":"";
  const itemsContent=items||"<tr><td colspan='2'><b>Itens não encontrados neste pedido. Consulte o painel antes de concluir a impressão.</b></td></tr>";
  const html="<!doctype html><html lang='pt-BR'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Pedido "+escapeHtml(order.displayId||order.id)+"</title><style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#000;margin:0;padding:18px;font-size:13px;font-weight:700}h1{font-size:19px;margin:0 0 5px;font-weight:900}h2{font-size:14px;margin:18px 0 7px;border-bottom:1px solid #111;padding-bottom:5px;font-weight:900}p{margin:5px 0;line-height:1.35}b,strong{font-weight:900}.muted{color:#222;font-size:11px}.status{font-weight:900;border:1px solid #111;border-radius:4px;padding:3px 6px;display:inline-block;margin:7px 0}table{width:100%;border-collapse:collapse;margin-top:7px}td{padding:7px 2px;border-bottom:1px solid #777;vertical-align:top;font-weight:700}td:last-child{text-align:right;white-space:nowrap;font-weight:900}small{display:block;color:#111;font-size:11px;font-weight:700;margin-top:3px}.total{font-size:17px;font-weight:900;border-top:2px solid #111;padding-top:9px;margin-top:10px}.footer{margin-top:18px;border-top:1px dashed #555;padding-top:9px;font-size:11px;font-weight:700}@media print{body{padding:0}}</style></head><body><h1>🥩 AÇOUGUE BOM JARDIM</h1><p><b>PEDIDO "+escapeHtml(order.displayId||order.id)+"</b></p><span class='status'>"+escapeHtml(order.status||"Novo")+"</span><p class='muted'>Atualizado em: "+escapeHtml(new Date(updatedAt).toLocaleString("pt-BR"))+"</p><h2>CLIENTE</h2><p><b>"+escapeHtml(order.customer?.name||"Não informado")+"</b></p><p>Telefone: "+escapeHtml(order.customer?.phone||"Não informado")+"</p><p>Endereço: "+escapeHtml(order.customer?.address||"Não informado")+"</p>"+(order.customer?.reference?"<p>Referência: "+escapeHtml(order.customer.reference)+"</p>":"")+"<h2>PRODUTOS</h2><table>"+itemsContent+"</table><h2>RESUMO</h2><p>Produtos: <b>"+money(order.subtotal)+"</b></p><p>Entrega: <b>"+money(order.fee)+"</b></p><p class='total'>TOTAL: "+money(order.total)+"</p><h2>PAGAMENTO</h2><p>Forma de pagamento: <b>"+escapeHtml(order.payment||"Não informado")+"</b></p>"+cashInfo+(order.customer?.notes?"<p>Observações: "+escapeHtml(order.customer.notes)+"</p>":"")+"<div class='footer'>Documento gerado pelo painel do Açougue Bom Jardim.</div><script>window.onload=function(){window.focus();window.print();};</script></body></html>";
  printWindow.document.open();printWindow.document.write(html);printWindow.document.close();
 }
 async function handleProductImage(file){
  if(!file)return;
  if(!file.type?.startsWith("image/")){setNotice("Selecione um arquivo de imagem válido.");return}
  if(file.size>8*1024*1024){setNotice("A imagem deve ter no máximo 8 MB.");return}
  try{
   const dataUrl=await new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(reader.result);
    reader.onerror=()=>reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
   });
   const image=await new Promise((resolve,reject)=>{
    const img=new Image();
    img.onload=()=>resolve(img);
    img.onerror=()=>reject(new Error("Não foi possível abrir a imagem."));
    img.src=dataUrl;
   });
   // Padrão equilibrado: até 640 px, JPEG otimizado e arquivo final de até 120 KB.
   // Se a foto for muito detalhada, reduzimos a dimensão gradualmente para preservar qualidade.
   const contextCanvas=document.createElement("canvas");
   const context=contextCanvas.getContext("2d");
   if(!context)throw new Error("Não foi possível preparar a imagem neste aparelho.");
   let compressed="";
   for(const maxSide of [640,560,480,400]){
    const scale=Math.min(1,maxSide/Math.max(image.width,image.height));
    contextCanvas.width=Math.max(1,Math.round(image.width*scale));
    contextCanvas.height=Math.max(1,Math.round(image.height*scale));
    context.clearRect(0,0,contextCanvas.width,contextCanvas.height);
    context.drawImage(image,0,0,contextCanvas.width,contextCanvas.height);
    for(const quality of [0.76,0.68,0.60,0.54]){
     compressed=contextCanvas.toDataURL("image/jpeg",quality);
     if(compressed.length<=120*1024)break;
    }
    if(compressed.length<=120*1024)break;
   }
   if(!compressed||compressed.length>120*1024)throw new Error("Não foi possível ajustar esta imagem ao limite leve de 120 KB.");
   setEditing(current=>current?({...current,imageUrl:compressed}):current);
   setNotice("Imagem ajustada: qualidade equilibrada, até 640 px e no máximo 120 KB.");
  }catch(error){setNotice(error.message||"Não foi possível processar a imagem.")}
 }
 async function saveProduct(){
  if(!editing)return;
  const name=String(editing.name||"").trim();
  const price=Number(String(editing.price??"").replace(",","."));
  if(name.length<2){setNotice("Informe o nome do produto.");return}
  if(!Number.isFinite(price)||price<0){setNotice("Informe um preço válido.");return}
  if(!profile?.store_id){setNotice("Não foi possível identificar a loja. Saia e entre novamente no painel.");return}
  setDataLoading(true);
  try{
   const saved=await saveAdminProduct({...editing,name,price},profile.store_id);
   setProducts(old=>editing.id?old.map(product=>product.id===editing.id?saved:product):[saved,...old]);
   setEditing(null);
   setNotice(editing.id?"Produto atualizado com sucesso no catálogo online.":"Produto cadastrado com sucesso no catálogo online.");
  }catch(error){
   setNotice("Não foi possível salvar o produto: "+(error.message||"verifique a conexão e tente novamente."));
  }finally{setDataLoading(false)}
 }
 function newProduct(){setEditing({name:"",category:"Boi",price:"",unit:"kg",note:"",available:true,featured:false})}
 return <div className="app-shell">
  <header className="topbar"><a className="brand" href="#" onClick={e=>{e.preventDefault();setArea("store")}}><span className="brand-mark"><img src="/logo-bom-jardim.jpg" alt="Logo oficial Açougue Bom Jardim"/></span><span><strong>Açougue Bom Jardim</strong><small>QUALIDADE E CONFIANÇA</small></span></a><div className="top-actions">{area==="store"?<><button className="admin-link" onClick={()=>{setArea("admin");setAdminTab("overview")}}> <LayoutDashboard size={16}/> Área da loja</button></>:<button className="admin-link" onClick={()=>setArea("store")}><ArrowLeft size={16}/> Ver cardápio</button>}</div></header>
  {area==="store"?<><button type="button" className="floating-cart-button" onClick={()=>setCartOpen(true)} aria-label={"Abrir carrinho com "+count+" itens"}><span className="floating-cart-icon"><ShoppingCart size={23}/><b>{count}</b></span><span className="floating-cart-copy"><strong>Meu carrinho</strong><small>{count?`${count} ${count===1?"item":"itens"} · ${money(total)}`:"Confira seus produtos"}</small></span><span className="floating-cart-arrow">→</span></button><main>{delivery.paused&&<div className="store-paused"><strong>Pedidos temporariamente pausados</strong><span>Estamos organizando a loja. Volte em breve!</span></div>}<section className="hero intro-hero"><div className="intro-copy"><span className="eyebrow">AÇOUGUE BOM JARDIM · LINHARES</span><h1>Carne de qualidade,<br/><em>do seu jeito.</em></h1><p>Tradição, variedade e praticidade para escolher seus cortes e fazer seu pedido sem sair de casa.</p><a className="hero-cta" href="#catalog">Ver produtos <span>→</span></a><div className="intro-address"><MapPin size={16}/><span>Rua Luiz Fávero, 276 · Loja 101 · Linhares</span></div></div><div className="intro-video-wrap"><video className="intro-video" controls playsInline preload="metadata" poster="/bom-jardim-hero-poster.jpg" aria-label="Vídeo de apresentação do Açougue Bom Jardim"><source src="/bom-jardim-video-compativel.mp4" type="video/mp4"/></video><span className="video-caption">CONHEÇA NOSSA LOJA</span></div></section>
  <section className="trust-row"><div><ShieldCheck/><span><b>Qualidade</b><small>Seleção de cortes</small></span></div><div><Clock3/><span><b>Praticidade</b><small>Peça pelo celular</small></span></div><div><MapPin/><span><b>Entrega</b><small>Consulte sua região</small></span></div></section>
  
  <section className="catalog" id="catalog"><div className="section-heading"><div><span className="eyebrow">NOSSO CATÁLOGO</span><h2>Escolha seus produtos</h2></div><span className="catalog-count">{visible.length} produtos</span></div>
  <label className="search-box"><Search size={19}/><input type="search" list="catalog-product-suggestions" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar carne, corte ou produto..." autoComplete="off"/><datalist id="catalog-product-suggestions">{catalogProducts.filter(p=>p.available).map(p=><option key={p.id} value={p.name}/>)}</datalist></label>
  <nav className="categories">{categories.map(c=><button key={c} className={category===c?"active":""} onClick={()=>setCategory(c)}>{c}</button>)}</nav>
  <div className="product-grid">{visible.map(p=>{const selected=cart.find(item=>item.id===p.id);const step=p.unit==="kg"?(selected?.purchaseMode==="amount"?0.1:0.5):1;return <article className="product-card" key={p.id}><div className="product-art"><img src={productImage(p)} alt={"Imagem ilustrativa de "+p.name}/><span>{p.category}</span></div><div className="product-info"><span className="product-category">{p.category}</span><h3>{p.name}</h3><p>{p.note}</p><div className="product-bottom"><strong>{money(priceOf(p))} <small>/{p.unit}</small></strong>{selected?<div className="qty catalog-qty"><button aria-label={"Diminuir "+p.name} onClick={()=>qty(p.id,-step)}><Minus size={15}/></button><b>{selected.purchaseMode==="amount"?money(selected.requestedAmount):selected.qty.toLocaleString("pt-BR")+" "+p.unit}</b><button aria-label={"Aumentar "+p.name} onClick={()=>qty(p.id,step)}><Plus size={15}/></button></div>:p.unit==="kg"?<button className="choose-product-button" aria-label={"Adicionar "+p.name} onClick={()=>{setConfiguringProduct(p.id);setPurchaseMode("weight");setPurchaseInput("0.5")}}><Plus size={18}/></button>:<button aria-label={"Adicionar "+p.name} onClick={()=>add(p)}><Plus size={18}/></button>}</div>{configuringProduct===p.id&&p.unit==="kg"&&<div className="purchase-choice"><div className="purchase-choice-tabs"><button type="button" className={purchaseMode==="weight"?"active":""} onClick={()=>{setPurchaseMode("weight");setPurchaseInput("0.5")}}>Por peso (kg)</button><button type="button" className={purchaseMode==="amount"?"active":""} onClick={()=>{setPurchaseMode("amount");setPurchaseInput("20")}}>Por valor (R$)</button></div><label>{purchaseMode==="weight"?"Quantidade em kg (mínimo 0,5 kg)":"Quanto deseja gastar?"}<input type="number" min={purchaseMode==="weight"?"0.5":"0.01"} step={purchaseMode==="weight"?"0.001":"0.01"} inputMode="decimal" value={purchaseInput} onChange={e=>setPurchaseInput(e.target.value)} placeholder={purchaseMode==="weight"?"Ex.: 0,5":"Ex.: 20,00"}/></label>{purchaseMode==="amount"&&Number(purchaseInput)>0&&<small className="purchase-estimate">Peso aproximado: {(Number(purchaseInput)/priceOf(p)).toLocaleString("pt-BR",{maximumFractionDigits:3})} kg</small>}<div className="purchase-choice-actions"><button type="button" className="purchase-cancel" onClick={()=>setConfiguringProduct(null)}>Cancelar</button><button type="button" className="purchase-confirm" onClick={()=>add(p,purchaseMode,Number(String(purchaseInput).replace(",",".")))}>Adicionar ao carrinho</button></div></div>}</div></article>})}</div>
  <p className="price-note">{catalogLoaded?"Catálogo oficial da loja. Preços e disponibilidade podem mudar sem aviso.":"Carregando catálogo oficial..."}</p></section></main><footer className="store-footer"><div className="footer-brand"><strong>Açougue Bom Jardim</strong><span>Casa de Carnes Bom Jardim Ltda.</span><small>Qualidade e confiança em Linhares.</small></div><div className="footer-contact"><b>CONTATO E LOCALIZAÇÃO</b><a href="https://www.google.com/maps/search/?api=1&query=Rua+Luiz+Favero+276+Loja+101+Linhares+Juiz+de+Fora+MG+36060-380" target="_blank" rel="noreferrer"><MapPin size={15}/> Rua Luiz Fávero, 276, Loja 101 · Linhares · Juiz de Fora/MG · CEP 36060-380</a><a href="https://wa.me/5532998275204" target="_blank" rel="noreferrer">WhatsApp: (32) 99827-5204</a><a href="https://www.instagram.com/acougue.bomjardimjf/" target="_blank" rel="noreferrer">Instagram: @acougue.bomjardimjf</a></div><div className="footer-hours"><b>HORÁRIO INFORMADO</b><span>Segunda a sábado: 09h às 20h</span><span>Domingos e feriados: 09h às 14h</span><small>Horários sujeitos à confirmação pela loja.</small></div></footer></>:!session?<main className="admin-layout"><section className="admin-content"><div className="admin-card settings-card" style={{maxWidth:460,margin:"50px auto",padding:28}}><span className="brand-mark"><LockKeyhole/></span><h2 style={{marginTop:16}}>Acesso da equipe</h2><p>Entre com o e-mail e a senha cadastrados pelo responsável da loja.</p>{notice&&<div className="notice">{notice}</div>}<label>E-mail<input type="email" autoComplete="username" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} placeholder="E-mail de acesso"/></label><label>Senha<input type="password" autoComplete="current-password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} placeholder="Sua senha"/></label><button className="primary-action" style={{width:"100%",marginTop:16}} onClick={signIn} disabled={authLoading}>{authLoading?"Verificando...":"Entrar no painel"}</button><button className="secondary-action" style={{width:"100%",marginTop:8}} onClick={()=>setArea("store")}>Voltar ao cardápio</button><div className="tip-box">O acesso é validado pelo Supabase. Não compartilhe sua senha por mensagem.</div></div></section></main>:<main className="admin-layout">
   <aside className="admin-sidebar"><div className="admin-title"><span className="brand-mark"><Beef/></span><div><b>Painel da loja</b><small>Açougue Bom Jardim</small></div></div>
    {[["overview","Visão geral",LayoutDashboard],["products","Produtos",Package],["orders","Pedidos",ClipboardList],["delivery","Entrega",Truck],["settings","Configurações",Settings]].map(([id,label,Icon])=><button key={id} className={adminTab===id?"selected":""} onClick={()=>{setAdminTab(id);setEditing(null)}}><Icon size={18}/>{label}{id==="orders"&&orders.length>0&&<b className="nav-count">{orders.length}</b>}</button>)}
    <button className="back-store" onClick={signOut}><LogOut size={17}/> Sair do painel</button>
   </aside>
   <section className="admin-content">
    <div className="admin-heading"><div><span className="eyebrow">GESTÃO DO AÇOUGUE</span><h1>{({overview:"Visão geral",products:"Produtos e catálogo",orders:"Gestão de pedidos",delivery:"Configuração de entrega",settings:"Configurações"})[adminTab]}</h1><p>Dados sincronizados com o banco da loja.</p></div><span className="demo-pill">{dataLoading?"SINCRONIZANDO":"BANCO CONECTADO"}</span></div>
    {notice&&<div className="notice"><CheckCircle2 size={17}/>{notice}<button onClick={()=>setNotice("")}><X size={15}/></button></div>}
    {adminTab==="overview"&&<><div className="stats-grid"><div className="stat-card"><span><ClipboardList/> Pedidos cadastrados</span><b>{orders.length}</b><small>Pedidos registrados no banco</small></div><div className="stat-card"><span><TrendingUp/> Vendas entregues</span><b>{money(revenue)}</b><small>Pedidos entregues registrados</small></div><div className="stat-card"><span><Package/> Produtos ativos</span><b>{products.filter(p=>p.available).length}</b><small>De {products.length} cadastrados</small></div><div className="stat-card"><span><ClipboardList/> Situação dos pedidos</span><div style={{display:"flex",flexDirection:"column",gap:8,marginTop:10}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",color:"#b7791f",fontWeight:700}}><span>Em andamento</span><b style={{color:"#b7791f"}}>{inProgressCount}</b></div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",color:"#16834a",fontWeight:700}}><span>Entregues</span><b style={{color:"#16834a"}}>{delivered.length}</b></div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",color:"#dc2626",fontWeight:700}}><span>Cancelados</span><b style={{color:"#dc2626"}}>{cancelledCount}</b></div></div><small>Total por situação</small></div></div>
     <div className="admin-columns"><section className="admin-card"><div className="card-title"><div><h3>Pedidos recentes</h3><p>Acompanhe o andamento das solicitações</p></div><button onClick={()=>setAdminTab("orders")}>Ver todos</button></div>{orders.slice(0,5).length?orders.slice(0,5).map(o=><div className="recent-order" key={o.id}><div><b>{o.customer.name}</b><small>{o.displayId||o.id} • {new Date(o.createdAt).toLocaleString("pt-BR")}</small></div><strong>{money(o.total)}</strong><span className={"status "+statusClass(o.status)}>{o.status}</span></div>):<div className="admin-empty"><ClipboardList/><b>Nenhum pedido por enquanto</b><span>Os pedidos de teste feitos pelo cardápio aparecerão aqui.</span></div>}</section>
     <section className="admin-card"><div className="card-title"><div><h3>Ações rápidas</h3><p>Atalhos para administrar a loja</p></div></div><button className="quick-action" onClick={()=>{newProduct();setAdminTab("products")}}><Plus/> Cadastrar produto</button><button className="quick-action" onClick={()=>setAdminTab("orders")}><ClipboardList/> Acompanhar pedidos</button><button className="quick-action" onClick={()=>setAdminTab("delivery")}><Truck/> Ajustar taxa de entrega</button><div className="tip-box">Dica: antes de publicar para clientes, revise preços, fotos, contato de WhatsApp e regras de entrega.</div></section></div></>}
    {adminTab==="products"&&<>{editing?<section className="admin-card edit-card"><div className="card-title"><div><h3>{editing.id?"Editar produto":"Novo produto"}</h3><p>Preencha as informações que aparecerão no cardápio.</p></div><button onClick={()=>setEditing(null)}><X size={17}/></button></div><div className="edit-grid"><label>Nome do produto<input value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})} placeholder="Ex.: Picanha premium"/></label><label>Categoria<select value={editing.category} onChange={e=>setEditing({...editing,category:e.target.value})}>{baseCategories.filter(c=>c!=="Todos").map(c=><option key={c}>{c}</option>)}</select></label><label>Preço (R$)<input type="number" min="0" step="0.01" value={editing.price} onChange={e=>setEditing({...editing,price:e.target.value})}/></label><label>Unidade<select value={editing.unit} onChange={e=>setEditing({...editing,unit:e.target.value})}><option value="kg">Quilo (kg)</option><option value="un.">Unidade</option></select></label><label className="wide-field">Descrição<input value={editing.note||""} onChange={e=>setEditing({...editing,note:e.target.value})} placeholder="Descrição curta do produto"/></label><div className="image-upload-field"><div className="image-upload-preview">{editing.imageUrl?<img src={editing.imageUrl} alt="Prévia da foto do produto"/>:<ImagePlus size={28}/>}</div><div className="image-upload-actions"><label className="secondary-action image-pick-button"><ImagePlus size={16}/> Escolher foto do celular<input type="file" accept="image/*" onChange={e=>{handleProductImage(e.target.files?.[0]);e.target.value=""}}/></label><small>Escolha uma foto ou print da galeria. Até 8 MB.</small>{editing.imageUrl&&<button type="button" className="text-action" onClick={()=>setEditing({...editing,imageUrl:""})}>Remover foto</button>}</div></div><label className="toggle-line"><input type="checkbox" checked={editing.available!==false} onChange={e=>setEditing({...editing,available:e.target.checked})}/> Produto disponível no cardápio</label><label className="toggle-line"><input type="checkbox" checked={!!editing.featured} onChange={e=>setEditing({...editing,featured:e.target.checked})}/> Marcar como destaque</label></div><div className="edit-actions"><button className="primary-action" onClick={saveProduct} disabled={dataLoading}><Save size={17}/> {dataLoading?"Aguarde...":"Salvar produto"}</button><button className="secondary-action" onClick={()=>setEditing(null)}>Cancelar</button></div></section>:<><div className="toolbar"><label className="search-box"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar produto..."/></label><button className="primary-action" onClick={newProduct}><Plus size={17}/> Novo produto</button></div><div className="admin-card table-card"><div className="table-scroll"><table><thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Unidade</th><th>Disponibilidade</th><th>Ações</th></tr></thead><tbody>{products.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())).map(p=><tr key={p.id}><td><b>{p.name}</b></td><td>{p.category}</td><td>{money(p.price)}</td><td>{p.unit}</td><td><span className={p.available?"available-label":"unavailable-label"}>{p.available?"Disponível":"Pausado"}</span></td><td><div className="row-actions"><button title="Editar" onClick={()=>setEditing({...p})}><Pencil size={16}/></button><button title={p.available?"Pausar":"Ativar"} onClick={async()=>{try{const saved=await saveAdminProduct({...p,available:!p.available},profile.store_id);setProducts(old=>old.map(x=>x.id===p.id?saved:x));setNotice("Disponibilidade atualizada no catálogo online.")}catch(error){setNotice("Falha ao alterar disponibilidade: "+(error.message||"erro no banco."))}}}>{p.available?<EyeOff size={16}/>:<Eye size={16}/>}</button><button title="Excluir" onClick={()=>deleteProduct(p.id)}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div></div></>}</>}
    {adminTab==="orders"&&<div className="admin-card"><div className="card-title"><div><h3>Gestão de pedidos</h3><p>Por padrão, aparecem os pedidos novos de hoje e os que continuam pendentes de dias anteriores. Ao mudar para preparação, saiu para entrega ou entregue, eles saem desta lista.</p></div><span>{filteredOrders.length} de {orders.length} pedido(s)</span></div><div className="order-period-filter"><label>Período<select value={orderPeriod} onChange={e=>{setOrderPeriod(e.target.value);setOrderFilter(e.target.value==="Hoje"?"Novos e pendentes":"Todos")}}><option>Hoje</option><option>Data específica</option><option>Mês</option><option>Ano</option><option>Todos</option></select></label>{orderPeriod==="Data específica"&&<><label>Data inicial<input type="date" value={orderStartDate} onChange={e=>setOrderStartDate(e.target.value)}/></label><label>Data final<input type="date" min={orderStartDate} value={orderEndDate} onChange={e=>setOrderEndDate(e.target.value)}/></label></>}{orderPeriod==="Mês"&&<label>Mês<input type="month" value={orderMonth} onChange={e=>setOrderMonth(e.target.value)}/></label>}{orderPeriod==="Ano"&&<label>Ano<input type="number" min="2020" max="2100" value={orderYear} onChange={e=>setOrderYear(e.target.value)}/></label>}</div><label className="order-search-box"><Search size={18}/><input type="search" value={orderSearch} onChange={e=>setOrderSearch(e.target.value)} placeholder="Consultar por número do pedido ou nome do cliente..." aria-label="Consultar pedido por número ou nome do cliente"/>{orderSearch&&<button type="button" onClick={()=>setOrderSearch("")} aria-label="Limpar pesquisa"><X size={16}/></button>}</label><div className="order-status-tabs" role="tablist" aria-label="Filtrar pedidos">{orderStatuses.map(tab=><button key={tab.label} type="button" role="tab" aria-selected={orderFilter===tab.label} className={orderFilter===tab.label?"active":""} onClick={()=>setOrderFilter(tab.label)}>{tab.label}<b>{orders.filter(o=>tab.match(o)&&(tab.label==="Novos e pendentes"&&orderPeriod==="Hoje"?true:inSelectedOrderPeriod(o))).length}</b></button>)}</div>{filteredOrders.length?filteredOrders.map(o=><article className="order-card order-card-compact" key={o.id} onClick={()=>setSelectedOrder(o)}><div className="order-compact-main"><div className="order-compact-customer"><b>{o.customer.name}</b><small>{o.displayId||o.id}</small></div><strong>{money(o.total)}</strong></div><div className="order-compact-footer"><span className={"status "+statusClass(o.status)}>{o.status}</span><time>{new Date(o.createdAt).toLocaleString("pt-BR")}</time><button type="button" className="order-detail-button" title="Imprimir pedido" aria-label={"Imprimir pedido "+(o.displayId||o.id)} onClick={e=>{e.stopPropagation();printOrder(o)}}><Printer size={16}/></button>{profile?.role==="owner"&&<button type="button" className="order-detail-button" title="Excluir pedido permanentemente" aria-label={"Excluir pedido "+(o.displayId||o.id)} disabled={dataLoading} onClick={e=>{e.stopPropagation();deleteOrder(o)}}><Trash2 size={16}/></button>}<button type="button" className="order-detail-button" title="Consultar pedido completo" aria-label={"Consultar pedido "+(o.displayId||o.id)} onClick={e=>{e.stopPropagation();setSelectedOrder(o)}}><Eye size={16}/><span>Visualizar</span></button></div></article>):<div className="admin-empty"><ClipboardList/><b>{orders.length?"Nenhum pedido nesta etapa":"Nenhum pedido recebido"}</b><span>{orders.length?"Escolha outra aba para visualizar pedidos de outras etapas.":"Os pedidos recebidos pelo cardápio aparecerão aqui."}</span>{!orders.length&&<button className="secondary-action" onClick={()=>setArea("store")}>Abrir cardápio</button>}</div>}</div>}{adminTab==="delivery"&&<div className="admin-card settings-card"><h3>Regras de entrega</h3><p>Configure os valores que serão estimados no carrinho.</p><label>Modelo de cobrança<select value={delivery.mode} onChange={e=>setDelivery({...delivery,mode:e.target.value})}><option value="fixed">Taxa fixa</option><option value="freeOver">Grátis acima de um valor mínimo</option><option value="manual">Taxa a combinar com a loja</option></select></label><label>Taxa padrão (R$)<input type="number" min="0" step="0.50" value={delivery.fee} onChange={e=>setDelivery({...delivery,fee:e.target.value})}/></label><label>Previsão de entrega<input value={estimatedTime} onChange={e=>setDelivery({...delivery,estimatedTime:e.target.value})} placeholder="Ex.: 40 a 60 minutos"/></label>{delivery.mode==="freeOver"&&<label>Pedido mínimo para entrega grátis (R$)<input type="number" min="0" step="1" value={delivery.freeOver} onChange={e=>setDelivery({...delivery,freeOver:e.target.value})}/></label>}<label className="toggle-line"><input type="checkbox" checked={delivery.paused} onChange={e=>setDelivery({...delivery,paused:e.target.checked})}/> Pausar recebimento de pedidos</label><div className="tip-box">A previsão é apenas uma estimativa inicial e pode ser ajustada conforme a demanda. No modo “Taxa a combinar com a loja”, nenhum valor de entrega é acrescentado ao pedido. Configure uma taxa fixa ou uma regra de gratuidade somente quando os valores reais forem definidos pelo estabelecimento.</div></div>}
    {adminTab==="settings"&&<div className="admin-card settings-card"><h3>Dados da loja</h3><p>Informações básicas da apresentação comercial.</p><label>Nome da loja<input value="Açougue Bom Jardim" readOnly/></label><label>WhatsApp de pedidos<input value="A configurar com o proprietário" readOnly/></label><label>Endereço da loja<input placeholder="Será preenchido com os dados oficiais"/></label><div className="tip-box">A conta do proprietário, os acessos individuais da equipe e a integração segura com o banco de dados serão configurados antes de colocar o sistema em operação real.</div></div>}
   </section>
  </main>}
  {selectedOrder&&<div className="overlay order-detail-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setSelectedOrder(null)}}><section className="order-detail-panel"><div className="panel-head"><div><span className="eyebrow">CONSULTA DE PEDIDO</span><h2>{selectedOrder.displayId||selectedOrder.id}</h2></div><button className="icon-button" onClick={()=>setSelectedOrder(null)} aria-label="Fechar detalhes"><X/></button></div><div className="order-detail-content"><div className="order-detail-summary"><div><span className={"status "+statusClass(selectedOrder.status)}>{selectedOrder.status}</span><small>Etapa atual do pedido</small></div><b>{money(selectedOrder.total)}</b><label className="order-detail-status-control">Atualizar status<select value={selectedOrder.status} onChange={async e=>{const nextStatus=e.target.value;const saved=await updateStatus(selectedOrder.id,nextStatus);if(saved){if(nextStatus!=="Em preparação")setOrderEditMode(false);const freshOrder=orders.find(item=>item.id===selectedOrder.id);setSelectedOrder(current=>({...current,status:nextStatus,statusHistory:[...(freshOrder?.statusHistory||current.statusHistory||[{status:current.status,at:current.createdAt}])]}))}}}>{["Novo","Aguardando resolução","Em preparação","Saiu para entrega","Entregue","Retornando","Cancelado"].map(v=><option key={v}>{v}</option>)}</select></label></div><h3>Dados do cliente</h3><p><b>Nome:</b> {selectedOrder.customer?.name||"Não informado"}</p><p><b>Telefone:</b> {selectedOrder.customer?.phone||"Não informado"}</p><p><b>Endereço:</b> {selectedOrder.customer?.address||"Não informado"}</p>{selectedOrder.customer?.reference&&<p><b>Referência:</b> {selectedOrder.customer.reference}</p>}<p><b>Recebido em:</b> {new Date(selectedOrder.createdAt).toLocaleString("pt-BR")}</p><h3>Produtos do pedido</h3>{orderEditMode?<div className="order-edit-box">{orderEditItems.map((item,index)=><div className="order-edit-row" key={index}><label>Produto<select value={item.productId} onChange={e=>{const p=orderEditCatalogProducts.find(x=>String(x.id)===e.target.value);changeOrderEditItem(index,{productId:e.target.value,name:p?.name||"",unit:p?.unit||"kg",price:Number(p?.price||0)})}}><option value="">Selecione um produto</option>{orderEditCatalogProducts.map(p=><option key={p.id} value={p.id}>{p.name} — {money(p.price)}/{p.unit}</option>)}</select></label><label>Quantidade<input type="number" min="0.001" step={item.unit==="kg"?"0.001":"1"} value={item.qty} onChange={e=>changeOrderEditItem(index,{qty:e.target.value})}/></label><button type="button" className="text-action" onClick={()=>setOrderEditItems(old=>old.filter((_,i)=>i!==index))}>Remover</button></div>)}<button type="button" className="secondary-action" onClick={()=>setOrderEditItems(old=>[...old,{productId:"",name:"",qty:1,unit:"kg",price:0}])}><Plus size={15}/> Adicionar produto</button><p className="order-edit-total">Novo subtotal: <b>{money(orderEditSubtotal)}</b> · Total: <b>{money(orderEditSubtotal+Number(selectedOrder.fee||0))}</b></p><div className="edit-actions"><button className="primary-action" onClick={saveOrderEdit} disabled={dataLoading}><Save size={16}/> Salvar alterações</button><button className="secondary-action" onClick={()=>setOrderEditMode(false)}>Cancelar</button></div><small>Os preços são atualizados conforme o catálogo atual da loja.</small></div>:<>{(selectedOrder.items||[]).map((item,index)=><div className="order-detail-item" key={item.id||index}><span>{item.name} • {Math.abs(Number(item.total??item.line_total??0)-Number(item.price??item.unit_price??0)*Number(item.qty??item.quantity??0))>=0.005?"Valor solicitado · aprox. "+Number(item.qty??item.quantity??0).toLocaleString("pt-BR")+" kg":item.qty+" "+item.unit}</span><b>{money(item.total??item.line_total??(Number(item.price??item.unit_price??0)*Number(item.qty??item.quantity??0)))}</b></div>)}{selectedOrder.status==="Em preparação"&&profile?.role==="owner"&&<div className="order-edit-actions"><button className="secondary-action" onClick={startOrderEdit}><Pencil size={16}/> Editar pedido</button><button className="secondary-action" onClick={copyUpdatedOrder}><Copy size={16}/> Copiar pedido atualizado</button></div>}</>}{orderEditMode&&<div className="order-edit-box order-edit-customer">
 <h3>Editar dados do cliente e pagamento</h3>
 <label>Nome do cliente<input value={orderEditCustomer.name} onChange={e=>setOrderEditCustomer(v=>({...v,name:e.target.value}))}/></label>
 <label>Telefone / WhatsApp<input value={orderEditCustomer.phone} onChange={e=>setOrderEditCustomer(v=>({...v,phone:e.target.value}))}/></label>
 <label>Endereço completo<input value={orderEditCustomer.address} onChange={e=>setOrderEditCustomer(v=>({...v,address:e.target.value}))}/></label>
 <label>Ponto de referência<input value={orderEditCustomer.reference} onChange={e=>setOrderEditCustomer(v=>({...v,reference:e.target.value}))}/></label>
 <label>Observações<textarea value={orderEditCustomer.notes} onChange={e=>setOrderEditCustomer(v=>({...v,notes:e.target.value}))}/></label>
 <label>Forma de pagamento<select value={orderEditCustomer.payment} onChange={e=>setOrderEditCustomer(v=>({...v,payment:e.target.value,cashReceived:e.target.value==="Dinheiro"?v.cashReceived:""}))}><option>Pix</option><option>Dinheiro</option><option>Cartão de débito</option><option>Cartão de crédito</option></select></label>
 {orderEditCustomer.payment==="Dinheiro"&&<label>Cliente vai pagar com (R$)<input type="number" min={orderEditTotal} step="0.01" value={orderEditCustomer.cashReceived} onChange={e=>setOrderEditCustomer(v=>({...v,cashReceived:e.target.value}))} placeholder="Ex.: 100,00"/>{orderEditCustomer.cashReceived!==""&&<p className="order-edit-total">Troco a devolver: <b>{money(orderEditChange)}</b></p>}</label>}
 <p className="order-edit-total">Subtotal recalculado: <b>{money(orderEditSubtotal)}</b> · Entrega: <b>{money(selectedOrder.fee)}</b> · Total recalculado: <b>{money(orderEditTotal)}</b></p>
</div>}<div className="order-detail-totals"><p>Subtotal <b>{money(selectedOrder.subtotal)}</b></p><p>Entrega <b>{money(selectedOrder.fee)}</b></p><p className="order-detail-grand-total">Total <b>{money(selectedOrder.total)}</b></p></div><h3>Pagamento e observações</h3><p><b>Forma de pagamento:</b> {selectedOrder.payment||"Não informado"}</p>{selectedOrder.payment==="Dinheiro"&&selectedOrder.customer?.cashReceived&&<p><b>Cliente paga com:</b> {money(Number(selectedOrder.customer.cashReceived))}</p>}{selectedOrder.payment==="Dinheiro"&&selectedOrder.customer?.changeDue!==""&&selectedOrder.customer?.changeDue!=null&&<p><b>Troco a devolver:</b> {money(Number(selectedOrder.customer.changeDue))}</p>}{selectedOrder.customer?.notes&&<p><b>Observações:</b> {selectedOrder.customer.notes}</p>}<h3>Histórico de acontecimentos</h3><div className="order-detail-timeline">{(selectedOrder.statusHistory||[]).map((event,index)=><div className={"order-detail-event "+statusClass(event.status)} key={event.id||index}><span className="timeline-dot"/><div><span className={"status "+statusClass(event.status)}>{event.status}</span><time>{new Date(event.at).toLocaleString("pt-BR")}</time>{event.note&&<small>{event.note}</small>}</div></div>)}</div></div></section></div>}
  {cartOpen&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setCartOpen(false)}}><aside className="cart-panel"><div className="panel-head"><div><span className="eyebrow">SEU PEDIDO</span><h2>Conferir sacola</h2></div><button className="icon-button" onClick={()=>setCartOpen(false)}><X/></button></div>
  {!cart.length?<div className="empty-cart"><ShoppingBag size={38}/><h3>Sua sacola está vazia</h3><p>Adicione produtos para montar seu pedido.</p></div>:<><div className="cart-items">{cart.map(p=><div className="cart-line" key={p.id}><div><b>{p.name}</b><small>{p.purchaseMode==="amount"?"Pedido por valor: "+money(p.requestedAmount)+" · peso aprox. "+p.qty.toLocaleString("pt-BR",{maximumFractionDigits:3})+" kg":p.qty.toLocaleString("pt-BR")+" "+p.unit+" · "+money(priceOf(p))+"/"+p.unit}</small></div><div className="qty"><button onClick={()=>qty(p.id,-(p.unit==="kg"?(p.purchaseMode==="amount"?0.1:0.5):1))}><Minus size={14}/></button><b>{money(lineTotalOf(p))}</b><button onClick={()=>qty(p.id,p.unit==="kg"?(p.purchaseMode==="amount"?0.1:0.5):1)}><Plus size={14}/></button></div></div>)}</div>
  <div className="cart-total"><span>Subtotal estimado</span><strong>{money(subtotal)}</strong></div><div className="cart-total"><span>Entrega</span><strong>{delivery.mode==="manual"?"A combinar":money(fee)}</strong></div><div className="cart-total"><span>Total estimado</span><strong>{money(total)}</strong></div><div className="checkout-form"><h3>Dados para entrega</h3>
  <input id="customer-name" className={checkoutErrors.name?"field-invalid":""} aria-invalid={!!checkoutErrors.name} placeholder="Nome completo *" value={customer.name} onChange={e=>{setCustomer(current=>({...current,name:e.target.value}));setCheckoutErrors(current=>({...current,name:false}))}}/>{checkoutErrors.name&&<small className="field-error">Informe seu nome completo.</small>}<input id="customer-phone" className={checkoutErrors.phone?"field-invalid":""} aria-invalid={!!checkoutErrors.phone} placeholder="Telefone / WhatsApp *" value={customer.phone} onChange={e=>{setCustomer(current=>({...current,phone:e.target.value}));setCheckoutErrors(current=>({...current,phone:false}))}}/>{checkoutErrors.phone&&<small className="field-error">Informe seu telefone ou WhatsApp.</small>}<div className="address-field"><input id="customer-address" className={checkoutErrors.address?"field-invalid":""} aria-invalid={!!checkoutErrors.address} type="text" autoComplete="off" placeholder="Digite sua rua ou endereço... *" value={customer.address} onChange={e=>{setCustomer(current=>({...current,address:e.target.value}));setCheckoutErrors(current=>({...current,address:false}))}}/>{checkoutErrors.address&&<small className="field-error">Informe seu endereço completo.</small>}<small>Digite o endereço completo, incluindo rua, número, bairro e cidade.</small></div><input placeholder="Ponto de referência (opcional)" value={customer.reference} onChange={e=>setCustomer(current=>({...current,reference:e.target.value}))}/><select value={customer.payment} onChange={e=>setCustomer(current=>({...current,payment:e.target.value}))}><option>Pix</option><option>Dinheiro</option><option>Cartão de débito</option><option>Cartão de crédito</option></select>{customer.payment==="Dinheiro"&&<div className="cash-change-box"><label htmlFor="cash-change">Vai pagar com quanto? (opcional)</label><input id="cash-change" type="number" inputMode="decimal" min={total.toFixed(2)} step="0.01" placeholder="Ex.: 100,00" value={customer.change} onChange={e=>setCustomer(current=>({...current,change:e.target.value}))}/>{customer.change.trim()!==""&&<div className="cash-change-result" aria-live="polite">{Number(String(customer.change).replace(",","."))>=total?<><span>Troco a devolver:</span><strong>{money(Number(String(customer.change).replace(",","."))-total)}</strong></>:<span className="cash-change-warning">O valor informado precisa ser igual ou maior que o total do pedido ({money(total)}).</span>}</div>}</div>}<textarea placeholder="Observações do pedido (opcional)" value={customer.notes} onChange={e=>setCustomer(current=>({...current,notes:e.target.value}))}/><button className="send-order" onClick={finishOrder} disabled={dataLoading}>{dataLoading?"Enviando pedido...":"Confirmar pedido"}</button><small className="disclaimer">O pedido será registrado no sistema da loja. A confirmação não significa pagamento aprovado.</small></div></>}</aside></div>}
  </div>
}
