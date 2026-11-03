import { useEffect, useMemo, useRef, useState } from "react";
import { Beef, Search, ShoppingBag, Plus, Minus, X, Clock3, MapPin, ShieldCheck, LayoutDashboard, Package, ClipboardList, Settings, Tag, Pencil, Trash2, Eye, EyeOff, TrendingUp, Users, Truck, CheckCircle2, LogOut, ArrowLeft, Save, ImagePlus, LockKeyhole } from "lucide-react";
import { supabase } from "./lib/supabase";
import { loadPublicCatalog, loadAdminCatalog, saveAdminProduct, deleteAdminProduct, loadAdminOrders, updateAdminOrderStatus, updateAdminOrderItems } from "./lib/storeData";

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
const statusClass = value => ({ "Novo":"novo", "Aguardando resolução":"aguardando-resolucao", "Em preparação":"em-preparacao", "Saiu para entrega":"saiu-para-entrega", "Entregue":"entregue", "Retornado":"retornado", "Cancelado":"cancelado" }[value] || "status-padrao");
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
export default function App(){
 const [products,setProducts]=useState(()=>load("bomjardim_products",initialProducts));
 const [orders,setOrders]=useState(()=>load("bomjardim_orders",[]));
 const [delivery,setDelivery]=useState(()=>load("bomjardim_delivery",{mode:"fixed",fee:7,freeOver:150,paused:false,estimatedTime:"40 a 60 minutos"}));
 const [category,setCategory]=useState("Todos"),[search,setSearch]=useState(""),[cart,setCart]=useState([]),[cartOpen,setCartOpen]=useState(false);
 const [customer,setCustomer]=useState({name:"",phone:"",address:"",reference:"",payment:"Pix",change:"",notes:""});
 const addressInputRef=useRef(null);
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
 useEffect(()=>{
  if(!cartOpen||!addressInputRef.current)return;
  const apiKey=import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if(!apiKey)return;
  let cancelled=false,autocomplete=null,listener=null;
  const setup=async()=>{
   try{
    if(!window.google?.maps?.importLibrary){
     await new Promise((resolve,reject)=>{
      const existing=document.querySelector('script[data-google-places]');
      if(existing){existing.addEventListener("load",resolve,{once:true});existing.addEventListener("error",reject,{once:true});return}
      const script=document.createElement("script");script.dataset.googlePlaces="true";script.src="https://maps.googleapis.com/maps/api/js?key="+encodeURIComponent(apiKey)+"&libraries=places&language=pt-BR&region=BR";script.async=true;script.defer=true;script.onload=resolve;script.onerror=reject;document.head.appendChild(script);
     });
    }
    if(cancelled||!addressInputRef.current)return;
    const {Autocomplete}=await window.google.maps.importLibrary("places");
    if(cancelled||!addressInputRef.current)return;
    autocomplete=new Autocomplete(addressInputRef.current,{componentRestrictions:{country:"br"},fields:["formatted_address","address_components"],types:["address"]});
    listener=autocomplete.addListener("place_changed",()=>{const place=autocomplete.getPlace();if(place?.formatted_address)setCustomer(current=>({...current,address:place.formatted_address}));});
   }catch(error){console.warn("Não foi possível ativar as sugestões de endereço.",error)}
  };
  setup();
  return()=>{cancelled=true;if(listener)listener.remove()};
 },[cartOpen]);
 useEffect(()=>{if(!supabase)return;let alive=true;supabase.auth.getSession().then(async({data})=>{if(!alive)return;const current=data.session;if(!current){setSession(null);return}const{data:member,error}=await supabase.from("profiles").select("store_id,role,active").eq("id",current.user.id).single();if(!alive)return;if(error||!member?.active||!["owner","employee"].includes(member.role)){await supabase.auth.signOut();setSession(null);setProfile(null);return}setSession(current);setProfile(member)});const{data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{if(!next){setSession(null);setProfile(null)}});return()=>{alive=false;subscription.unsubscribe()}},[]);
 async function signIn(){if(!supabase){setNotice("Conexão com o banco não configurada. Verifique as variáveis da Vercel.");return}if(!loginEmail.trim()||!loginPassword){setNotice("Informe e-mail e senha do responsável.");return}setAuthLoading(true);const{data,error}=await supabase.auth.signInWithPassword({email:loginEmail.trim(),password:loginPassword});if(error){setNotice("Não foi possível entrar. Confira o e-mail e a senha.");setAuthLoading(false);return}const{data:member,error:profileError}=await supabase.from("profiles").select("store_id,role,active").eq("id",data.user.id).single();if(profileError||!member?.active||!["owner","employee"].includes(member.role)){await supabase.auth.signOut();setNotice("Este usuário não tem permissão para acessar o painel desta loja.");setAuthLoading(false);return}setSession(data.session);setProfile(member);setLoginPassword("");setNotice("Acesso autorizado.");setAuthLoading(false)}
 async function signOut(){if(supabase)await supabase.auth.signOut();setSession(null);setProfile(null);setArea("store")}
 useEffect(()=>localStorage.setItem("bomjardim_products",JSON.stringify(products)),[products]);
 useEffect(()=>localStorage.setItem("bomjardim_orders",JSON.stringify(orders)),[orders]);
 useEffect(()=>localStorage.setItem("bomjardim_delivery",JSON.stringify(delivery)),[delivery]);
 useEffect(()=>{let alive=true;(async()=>{try{const result=await loadPublicCatalog();if(!alive)return;const officialProducts=result.products||[];const officialNames=new Set(officialProducts.map(p=>p.name.trim().toLowerCase()));const demoProducts=initialProducts.filter(p=>!officialNames.has(p.name.trim().toLowerCase()));setProducts([...officialProducts,...demoProducts]);if(result.store)setStoreInfo(result.store);setCatalogLoaded(true)}catch(error){if(alive){setProducts(initialProducts);setNotice("Não foi possível atualizar o catálogo online. Exibindo o catálogo fictício de demonstração.")}}})();return()=>{alive=false}},[]);
 useEffect(()=>{if(!session||!profile?.store_id)return;let alive=true;(async()=>{setDataLoading(true);try{const [dbProducts,dbOrders]=await Promise.all([loadAdminCatalog(profile.store_id),loadAdminOrders(profile.store_id)]);if(!alive)return;if(dbProducts.length)setProducts(dbProducts);const localDemoOrders=load("bomjardim_orders",[]).filter(o=>String(o.id).startsWith("DEMO-"));setOrders([...localDemoOrders,...dbOrders]);if(dbProducts.length===0)setNotice("Banco conectado. Cadastre o primeiro produto oficial da loja.");}catch(error){if(alive)setNotice("Erro ao carregar os dados da loja: "+(error.message||"verifique as permissões do Supabase."));}finally{if(alive)setDataLoading(false)}})();return()=>{alive=false}},[session,profile?.store_id]);
 const STORE_WHATSAPP="5532999953215";
 const estimatedTime=delivery.estimatedTime||"40 a 60 minutos";
 const catalogProducts=products.length?products:initialProducts;
 const adminCatalogProducts=products.filter(p=>typeof p.id==="string"&&/^[0-9a-f-]{36}$/i.test(p.id));
 const orderEditCatalogProducts=String(selectedOrder?.id||"").startsWith("DEMO-")?products.filter(p=>p.available):adminCatalogProducts.filter(p=>p.available);
 const categories=baseCategories;
 const normalizeCategory=value=>String(value||"").trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g,"");
 const isChurrascoProduct=p=>{const cat=normalizeCategory(p.category);const name=normalizeCategory(p.name);const description=normalizeCategory(p.note);return cat==="churrasco"||name.includes("churrasco")||description.includes("churrasco")};
 const visible=useMemo(()=>catalogProducts.filter(p=>p.available&&(category==="Todos"||(category==="Aves"?["aves","ave","frango","frangos"].includes(normalizeCategory(p.category)):category==="Churrasco"?isChurrascoProduct(p):normalizeCategory(p.category)===normalizeCategory(category)))&&p.name.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))),[catalogProducts,category,search]);
 const priceOf=p=>Number(p.price||0);
 // Mantém "Todos" como categoria inicial.
 const count=cart.reduce((s,p)=>s+p.qty,0),subtotal=cart.reduce((s,p)=>s+priceOf(p)*p.qty,0);
 const fee=delivery.mode==="fixed"?Number(delivery.fee||0):(delivery.mode==="freeOver"&&subtotal>=Number(delivery.freeOver||0)?0:Number(delivery.fee||0));
 const total=subtotal+fee;
 const delivered=orders.filter(o=>o.status==="Entregue");
 const orderStatuses=[{label:"Novos e pendentes",match:o=>["Novo","Aguardando resolução"].includes(o.status)},{label:"Todos",match:()=>true},{label:"Pendentes",match:o=>["Novo","Aguardando resolução"].includes(o.status)},{label:"Em preparação",match:o=>o.status==="Em preparação"},{label:"Saiu para entrega",match:o=>o.status==="Saiu para entrega"},{label:"Entregues",match:o=>o.status==="Entregue"},{label:"Retornados",match:o=>o.status==="Retornado"},{label:"Cancelados",match:o=>o.status==="Cancelado"}];
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
 function add(p){if(delivery.paused){setNotice("A loja pausou temporariamente o recebimento de pedidos.");return}setCart(old=>{const x=old.find(i=>i.id===p.id);const step=p.unit==="kg"?0.5:1;return x?old.map(i=>i.id===p.id?{...i,qty:Math.round((i.qty+step)*1000)/1000}:i):[...old,{...p,qty:p.unit==="kg"?0.5:1}]})}
 function qty(id,d){setCart(old=>old.map(p=>p.id===id?{...p,qty:Math.max(0,Math.round((p.qty+d)*1000)/1000)}:p).filter(p=>p.qty>0))}
 async function finishOrder(){
  if(delivery.paused){setNotice("A loja pausou temporariamente o recebimento de pedidos.");return}
  if(!customer.name.trim()||!customer.phone.trim()||!customer.address.trim()||!cart.length){setNotice("Preencha nome, telefone, endereço e adicione pelo menos um produto.");return}
  const isDemoOrder=cart.every(p=>typeof p.id==="number");
  if(isDemoOrder){
   const demoNumber=String(Date.now()).slice(-6);
   const createdAt=new Date().toISOString();
   const demoOrder={id:"DEMO-"+demoNumber,createdAt,estimatedDeliveryMinutes:estimatedTime,customer:{...customer},items:cart.map(p=>({...p,price:priceOf(p)})),subtotal,fee,total,payment:customer.payment,status:"Novo",statusHistory:[{status:"Novo",at:createdAt}]};
   const nextOrders=[demoOrder,...orders];setOrders(nextOrders);localStorage.setItem("bomjardim_orders",JSON.stringify(nextOrders));
   const orderLines=cart.map(p=>"• "+p.name+"\n  "+p.qty+" "+p.unit+" × "+money(priceOf(p))+"/"+p.unit+" = "+money(priceOf(p)*p.qty)).join("\n\n");
   const whatsappMessage="🥩 AÇOUGUE BOM JARDIM\n"+
    "📦 NOVO PEDIDO DE DEMONSTRAÇÃO #"+demoNumber+"\n"+
    "🕒 Recebido em: "+new Date(createdAt).toLocaleString("pt-BR")+"\n\n"+
    "👤 CLIENTE\n"+customer.name+"\n📞 "+customer.phone+"\n📍 "+customer.address+(customer.reference?"\n📌 Referência: "+customer.reference:"")+"\n\n"+
    "🛒 PRODUTOS\n"+orderLines+"\n\n"+
    "💰 RESUMO DO PEDIDO\nProdutos: "+money(subtotal)+"\n🛵 Entrega: "+money(fee)+"\n💵 TOTAL: "+money(total)+"\n\n"+
    "💳 Pagamento: "+customer.payment+(customer.payment==="Dinheiro"&&customer.change&&Number(String(customer.change).replace(",","."))>=total?"\n💵 Cliente paga com: "+money(Number(String(customer.change).replace(",",".")))+"\n💸 TROCO A DEVOLVER: "+money(Number(String(customer.change).replace(",","."))-total):"")+
    (customer.notes?"\n📝 Observações: "+customer.notes:"")+"\n\n❤️ Obrigado pela preferência!\nPedido fictício para demonstração.";
   setCart([]);setCartOpen(false);setCustomer({name:"",phone:"",address:"",reference:"",payment:"Pix",change:"",notes:""});
   setNotice("Pedido de demonstração criado! Abrindo o WhatsApp da loja.");
   window.location.href="https://wa.me/"+STORE_WHATSAPP+"?text="+encodeURIComponent(whatsappMessage);
   return;
  }
  if(!supabase||!catalogLoaded||!cart.every(p=>typeof p.id==="string")){setNotice("O catálogo oficial ainda não está disponível para pedidos online. Aguarde a loja cadastrar os produtos no banco.");return}
  const paymentMap={"Pix":"pix","Dinheiro":"cash","Cartão de débito":"debit","Cartão de crédito":"credit"};
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
    customer_notes:[customer.payment==="Dinheiro"&&customer.change?("Cliente paga com: "+money(Number(String(customer.change).replace(",",".")))+"; Troco a devolver: "+money(Number(String(customer.change).replace(",","."))-Number(total||0))):"",customer.notes].filter(Boolean).join(" | "),
    items:cart.map(p=>({product_id:p.id,quantity:p.qty}))
   }});
   if(error)throw error;
   if(!data?.success)throw new Error(data?.error||"Não foi possível registrar o pedido.");
   const orderItems=Array.isArray(data.items)&&data.items.length?data.items:cart.map(p=>({product_name:p.name,quantity:p.qty,unit:p.unit,unit_price:p.price,line_total:p.price*p.qty}));
   const orderLines=orderItems.map(item=>"• "+item.product_name+"\n  "+item.quantity+" "+item.unit+" × "+money(item.unit_price)+"/"+item.unit+" = "+money(item.line_total)).join("\n\n");
   const receivedAt=new Date().toLocaleString("pt-BR");
   const whatsappMessage="🥩 AÇOUGUE BOM JARDIM\n"+
    "📦 NOVO PEDIDO #"+data.order_number+"\n"+
    "🕒 Recebido em: "+receivedAt+"\n\n"+
    "👤 CLIENTE\n"+customer.name+"\n📞 "+customer.phone+"\n📍 "+customer.address+(customer.reference?"\n📌 Referência: "+customer.reference:"")+"\n\n"+
    "🛒 PRODUTOS\n"+orderLines+"\n\n"+
    "💰 RESUMO DO PEDIDO\nProdutos: "+money(data.subtotal)+"\n🛵 Entrega: "+money(data.delivery_fee)+"\n💵 TOTAL: "+money(data.total)+"\n\n"+
    "💳 Pagamento: "+customer.payment+(customer.payment==="Dinheiro"&&customer.change&&Number(String(customer.change).replace(",","."))>=Number(data.total)?"\n💵 Cliente paga com: "+money(Number(String(customer.change).replace(",",".")))+"\n💸 TROCO A DEVOLVER: "+money(Number(String(customer.change).replace(",","."))-Number(data.total)):"")+
    (customer.notes?"\n📝 Observações: "+customer.notes:"")+"\n\n❤️ Obrigado pela preferência!";
   window.location.href="https://wa.me/"+STORE_WHATSAPP+"?text="+encodeURIComponent(whatsappMessage);
   setCart([]);setCartOpen(false);setCustomer({name:"",phone:"",address:"",payment:"Pix",change:"",notes:""});
   setNotice("Pedido #"+data.order_number+" registrado com sucesso. Abrindo o WhatsApp da loja...");
   setArea("store");
  }catch(error){setNotice("Não foi possível enviar o pedido: "+(error.message||"tente novamente."));}
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
 const orderEditSubtotal=orderEditItems.reduce((sum,item)=>sum+Number(item.price||0)*Number(item.qty||0),0);
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
 function sendUpdatedOrderWhatsApp(){
  if(!selectedOrder)return;
  const lines=(selectedOrder.items||[]).map(i=>"• "+i.name+" — "+i.qty+" "+i.unit+" × "+money(i.price)+" = "+money(i.total??Number(i.price||0)*Number(i.qty||0))).join("\n");
  const cash=Number(String(selectedOrder.customer?.cashReceived||"").replace(",","."));
  const change=Number.isFinite(cash)?Math.max(0,cash-Number(selectedOrder.total||0)):0;
  const message="🥩 AÇOUGUE BOM JARDIM\nPEDIDO ATUALIZADO "+(selectedOrder.displayId||selectedOrder.id)+
   "\n\nCLIENTE\n"+(selectedOrder.customer?.name||"")+"\nTelefone: "+(selectedOrder.customer?.phone||"")+
   "\nEndereço: "+(selectedOrder.customer?.address||"")+
   (selectedOrder.customer?.reference?"\nReferência: "+selectedOrder.customer.reference:"")+
   "\n\nITENS DO PEDIDO\n"+lines+
   "\n\nSubtotal: "+money(selectedOrder.subtotal)+"\nEntrega: "+money(selectedOrder.fee)+"\nTOTAL: "+money(selectedOrder.total)+
   "\nPagamento: "+(selectedOrder.payment||"")+
   (selectedOrder.payment==="Dinheiro"&&selectedOrder.customer?.cashReceived?"\nCliente paga com: "+money(cash)+"\nTROCO A DEVOLVER: "+money(change):"")+
   (selectedOrder.customer?.notes?"\nObservações: "+selectedOrder.customer.notes:"")+
   "\n\nConfira os dados e, se estiver tudo certo, confirme com a loja.";
  const phone=(selectedOrder.customer?.phone||"").replace(/\D/g,"");
  window.open("https://wa.me/"+phone+"?text="+encodeURIComponent(message),"_blank","noopener,noreferrer");
 }
 async function updateStatus(id,status){
  try{
   if(!String(id).startsWith("DEMO-"))await updateAdminOrderStatus(id,status);
   const changedAt=new Date().toISOString();
   setOrders(old=>{const next=old.map(o=>o.id===id?{...o,status,statusHistory:[...(o.statusHistory||[{status:o.status,at:o.createdAt}]),{status,at:changedAt}]}:o);localStorage.setItem("bomjardim_orders",JSON.stringify(next));return next});
   setNotice("Status atualizado e registrado no histórico.");
  }catch(error){setNotice("Não foi possível atualizar o pedido: "+(error.message||"erro de conexão."))}
 }
 async function handleProductImage(file){
  if(!file)return;
  if(!file.type?.startsWith("image/")){setNotice("Selecione uma foto ou imagem da galeria.");return}
  if(file.size>8*1024*1024){setNotice("A imagem deve ter no máximo 8 MB.");return}
  if(!supabase||!profile?.store_id){setNotice("Entre novamente no painel da loja para enviar imagens.");return}
  setDataLoading(true);
  setNotice("Enviando foto...");
  try{
   const extension=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg";
   const path=profile.store_id+"/"+crypto.randomUUID()+"."+extension;
   const {error}=await supabase.storage.from("product-images").upload(path,file,{cacheControl:"3600",upsert:false,contentType:file.type});
   if(error)throw error;
   const {data}=supabase.storage.from("product-images").getPublicUrl(path);
   if(!data?.publicUrl)throw new Error("O Supabase não retornou o endereço público da imagem.");
   setEditing(current=>({...current,imageUrl:data.publicUrl}));
   setNotice("Foto enviada. Agora toque em Salvar produto para gravar no catálogo.");
  }catch(error){
   setNotice("Falha ao enviar a foto: "+(error?.message||"confira se a migração 0008 foi executada no Supabase."));
  }finally{setDataLoading(false)}
 }
 async function saveProduct(){
  if(!profile?.store_id){setNotice("Sua sessão expirou. Entre novamente no painel.");return}
  const name=String(editing?.name||"").trim();
  const price=Number(String(editing?.price??"").replace(",","."));
  if(!name){setNotice("Informe o nome do produto.");return}
  if(!Number.isFinite(price)||price<0){setNotice("Informe um preço válido.");return}
  setDataLoading(true);
  try{
   const isOfficial=typeof editing.id==="string"&&/^[0-9a-f-]{36}$/i.test(editing.id);
   const saved=await saveAdminProduct({...editing,name,price,id:isOfficial?editing.id:undefined},profile.store_id);
   setProducts(old=>{
    const withoutEditedDemo=old.filter(p=>p.id!==editing.id);
    const existingIndex=withoutEditedDemo.findIndex(p=>p.id===saved.id);
    if(existingIndex>=0)return withoutEditedDemo.map(p=>p.id===saved.id?saved:p);
    return [...withoutEditedDemo,saved];
   });
   setEditing(null);
   setNotice(isOfficial?"Produto atualizado com sucesso no catálogo.":"Produto cadastrado no banco e pronto para edição no catálogo.");
  }catch(error){
   setNotice("Não foi possível salvar o produto: "+(error?.message||"verifique sua conexão e as permissões da conta."));
  }finally{setDataLoading(false)}
 }
 async function deleteProduct(id){
  const product=products.find(p=>p.id===id);
  if(!product)return;
  if(!window.confirm('Excluir "'+product.name+'" do catálogo? Essa ação não pode ser desfeita.'))return;
  const isOfficial=typeof id==="string"&&/^[0-9a-f-]{36}$/i.test(id);
  setDataLoading(true);
  try{
   if(isOfficial)await deleteAdminProduct(id,profile.store_id);
   setProducts(old=>old.filter(p=>p.id!==id));
   setNotice(isOfficial?"Produto excluído do catálogo online.":"Produto fictício removido desta demonstração.");
  }catch(error){
   setNotice("Não foi possível excluir "+product.name+": "+(error?.message||"verifique se há pedidos ou registros vinculados a este produto."));
  }finally{setDataLoading(false)}
 }
 function newProduct(){setEditing({name:"",category:"Boi",price:"",unit:"kg",note:"",available:true,featured:false})}
 return <div className="app-shell">
  <header className="topbar"><a className="brand" href="#" onClick={e=>{e.preventDefault();setArea("store")}}><span className="brand-mark"><img src="/logo-bom-jardim.jpg" alt="Logo oficial Açougue Bom Jardim"/></span><span><strong>Açougue Bom Jardim</strong><small>QUALIDADE E CONFIANÇA</small></span></a><div className="top-actions">{area==="store"?<><button className="admin-link" onClick={()=>{setArea("admin");setAdminTab("overview")}}> <LayoutDashboard size={16}/> Área da loja</button><button className="cart-button" onClick={()=>setCartOpen(true)}><ShoppingBag size={18}/> Meu pedido <b>{count}</b></button></>:<button className="admin-link" onClick={()=>setArea("store")}><ArrowLeft size={16}/> Ver cardápio</button>}</div></header>
  {area==="store"?<><main>{delivery.paused&&<div className="store-paused"><strong>Pedidos temporariamente pausados</strong><span>Estamos organizando a loja. Volte em breve!</span></div>}<section className="hero intro-hero"><div className="intro-copy"><span className="eyebrow">AÇOUGUE BOM JARDIM · LINHARES</span><h1>Carne de qualidade,<br/><em>do seu jeito.</em></h1><p>Tradição, variedade e praticidade para escolher seus cortes e fazer seu pedido sem sair de casa.</p><a className="hero-cta" href="#catalog">Ver produtos <span>→</span></a><div className="intro-address"><MapPin size={16}/><span>Rua Luiz Fávero, 276 · Loja 101 · Linhares</span></div></div><div className="intro-video-wrap"><video className="intro-video" controls playsInline preload="metadata" poster="/bom-jardim-hero-poster.jpg" aria-label="Vídeo de apresentação do Açougue Bom Jardim"><source src="/bom-jardim-video-compativel.mp4" type="video/mp4"/></video><span className="video-caption">CONHEÇA NOSSA LOJA</span></div></section>
  <section className="trust-row"><div><ShieldCheck/><span><b>Qualidade</b><small>Seleção de cortes</small></span></div><div><Clock3/><span><b>Praticidade</b><small>Peça pelo celular</small></span></div><div><MapPin/><span><b>Entrega</b><small>Consulte sua região</small></span></div></section>
  
  <section className="catalog" id="catalog"><div className="section-heading"><div><span className="eyebrow">NOSSO CATÁLOGO</span><h2>Escolha seus produtos</h2></div><span className="catalog-count">{visible.length} produtos</span></div>
  <label className="search-box"><Search size={19}/><input type="search" list="catalog-product-suggestions" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar carne, corte ou produto..." autoComplete="off"/><datalist id="catalog-product-suggestions">{catalogProducts.filter(p=>p.available).map(p=><option key={p.id} value={p.name}/>)}</datalist></label>
  <nav className="categories">{categories.map(c=><button key={c} className={category===c?"active":""} onClick={()=>setCategory(c)}>{c}</button>)}</nav>
  <div className="product-grid">{visible.map(p=>{const selected=cart.find(item=>item.id===p.id);const step=p.unit==="kg"?0.5:1;return <article className="product-card" key={p.id}><div className="product-art"><img src={productImage(p)} alt={"Imagem ilustrativa de "+p.name}/><span>{p.category}</span></div><div className="product-info"><span className="product-category">{p.category}</span><h3>{p.name}</h3><p>{p.note}</p><div className="product-bottom"><strong>{money(priceOf(p))} <small>/{p.unit}</small></strong>{selected?<div className="qty catalog-qty"><button aria-label={"Diminuir "+p.name} onClick={()=>qty(p.id,-step)}><Minus size={15}/></button><b>{selected.qty.toLocaleString("pt-BR")} {p.unit}</b><button aria-label={"Aumentar "+p.name} onClick={()=>qty(p.id,step)}><Plus size={15}/></button></div>:<button aria-label={"Adicionar "+p.name} onClick={()=>add(p)}><Plus size={18}/></button>}</div></div></article>})}</div>
  <p className="price-note">{catalogLoaded&&products.some(p=>typeof p.id==="string")?"Catálogo atualizado pela loja. Preços e disponibilidade podem mudar sem aviso.":"Catálogo de demonstração: os itens ainda não foram cadastrados no banco oficial."}</p></section></main><footer className="store-footer"><div className="footer-brand"><strong>Açougue Bom Jardim</strong><span>Casa de Carnes Bom Jardim Ltda.</span><small>Qualidade e confiança em Linhares.</small></div><div className="footer-contact"><b>CONTATO E LOCALIZAÇÃO</b><a href="https://www.google.com/maps/search/?api=1&query=Rua+Luiz+Favero+276+Loja+101+Linhares+Juiz+de+Fora+MG+36060-380" target="_blank" rel="noreferrer"><MapPin size={15}/> Rua Luiz Fávero, 276, Loja 101 · Linhares · Juiz de Fora/MG · CEP 36060-380</a><a href="https://wa.me/553232119262" target="_blank" rel="noreferrer">WhatsApp: (32) 3211-9262</a><a href="https://www.instagram.com/acougue.bomjardimjf/" target="_blank" rel="noreferrer">Instagram: @acougue.bomjardimjf</a></div><div className="footer-hours"><b>HORÁRIO INFORMADO</b><span>Segunda a sábado: 09h às 20h</span><span>Domingos e feriados: 09h às 14h</span><small>Horários sujeitos à confirmação pela loja.</small></div></footer></>:!session?<main className="admin-layout"><section className="admin-content"><div className="admin-card settings-card" style={{maxWidth:460,margin:"50px auto",padding:28}}><span className="brand-mark"><LockKeyhole/></span><h2 style={{marginTop:16}}>Acesso da equipe</h2><p>Entre com o e-mail e a senha cadastrados pelo responsável da loja.</p>{notice&&<div className="notice">{notice}</div>}<label>E-mail<input type="email" autoComplete="username" value={loginEmail} onChange={e=>setLoginEmail(e.target.value)} placeholder="E-mail de acesso"/></label><label>Senha<input type="password" autoComplete="current-password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} placeholder="Sua senha"/></label><button className="primary-action" style={{width:"100%",marginTop:16}} onClick={signIn} disabled={authLoading}>{authLoading?"Verificando...":"Entrar no painel"}</button><button className="secondary-action" style={{width:"100%",marginTop:8}} onClick={()=>setArea("store")}>Voltar ao cardápio</button><div className="tip-box">O acesso é validado pelo Supabase. Não compartilhe sua senha por mensagem.</div></div></section></main>:<main className="admin-layout">
   <aside className="admin-sidebar"><div className="admin-title"><span className="brand-mark"><Beef/></span><div><b>Painel da loja</b><small>Açougue Bom Jardim</small></div></div>
    {[["overview","Visão geral",LayoutDashboard],["products","Produtos",Package],["orders","Pedidos",ClipboardList],["delivery","Entrega",Truck],["settings","Configurações",Settings]].map(([id,label,Icon])=><button key={id} className={adminTab===id?"selected":""} onClick={()=>{setAdminTab(id);setEditing(null)}}><Icon size={18}/>{label}{id==="orders"&&orders.length>0&&<b className="nav-count">{orders.length}</b>}</button>)}
    <button className="back-store" onClick={signOut}><LogOut size={17}/> Sair do painel</button>
   </aside>
   <section className="admin-content">
    <div className="admin-heading"><div><span className="eyebrow">GESTÃO DO AÇOUGUE</span><h1>{({overview:"Visão geral",products:"Produtos e catálogo",orders:"Gestão de pedidos",delivery:"Configuração de entrega",settings:"Configurações"})[adminTab]}</h1><p>Dados sincronizados com o banco da loja.</p></div><span className="demo-pill">{dataLoading?"SINCRONIZANDO":"BANCO CONECTADO"}</span></div>
    {notice&&<div className="notice"><CheckCircle2 size={17}/>{notice}<button onClick={()=>setNotice("")}><X size={15}/></button></div>}
    {adminTab==="overview"&&<><div className="stats-grid"><div className="stat-card"><span><ClipboardList/> Pedidos cadastrados</span><b>{orders.length}</b><small>Pedidos registrados no banco</small></div><div className="stat-card"><span><TrendingUp/> Vendas entregues</span><b>{money(revenue)}</b><small>Pedidos entregues registrados</small></div><div className="stat-card"><span><Package/> Produtos ativos</span><b>{products.filter(p=>p.available).length}</b><small>De {products.length} cadastrados</small></div><div className="stat-card"><span><Users/> Ticket médio</span><b>{delivered.length?money(revenue/delivered.length):money(0)}</b><small>Pedidos entregues</small></div></div>
     <div className="admin-columns"><section className="admin-card"><div className="card-title"><div><h3>Pedidos recentes</h3><p>Acompanhe o andamento das solicitações</p></div><button onClick={()=>setAdminTab("orders")}>Ver todos</button></div>{orders.slice(0,5).length?orders.slice(0,5).map(o=><div className="recent-order" key={o.id}><div><b>{o.customer.name}</b><small>{o.displayId||o.id} • {new Date(o.createdAt).toLocaleString("pt-BR")}</small></div><strong>{money(o.total)}</strong><span className={"status "+statusClass(o.status)}>{o.status}</span></div>):<div className="admin-empty"><ClipboardList/><b>Nenhum pedido por enquanto</b><span>Os pedidos de teste feitos pelo cardápio aparecerão aqui.</span></div>}</section>
     <section className="admin-card"><div className="card-title"><div><h3>Ações rápidas</h3><p>Atalhos para administrar a loja</p></div></div><button className="quick-action" onClick={()=>{newProduct();setAdminTab("products")}}><Plus/> Cadastrar produto</button><button className="quick-action" onClick={()=>setAdminTab("orders")}><ClipboardList/> Acompanhar pedidos</button><button className="quick-action" onClick={()=>setAdminTab("delivery")}><Truck/> Ajustar taxa de entrega</button><div className="tip-box">Dica: antes de publicar para clientes, revise preços, fotos, contato de WhatsApp e regras de entrega.</div></section></div></>}
    {adminTab==="products"&&<>{editing?<section className="admin-card edit-card"><div className="card-title"><div><h3>{editing.id?"Editar produto":"Novo produto"}</h3><p>Preencha as informações que aparecerão no cardápio.</p></div><button onClick={()=>setEditing(null)}><X size={17}/></button></div><div className="edit-grid"><label>Nome do produto<input value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})} placeholder="Ex.: Picanha premium"/></label><label>Categoria<select value={editing.category} onChange={e=>setEditing({...editing,category:e.target.value})}>{baseCategories.filter(c=>c!=="Todos").map(c=><option key={c}>{c}</option>)}</select></label><label>Preço (R$)<input type="number" min="0" step="0.01" value={editing.price} onChange={e=>setEditing({...editing,price:e.target.value})}/></label><label>Unidade<select value={editing.unit} onChange={e=>setEditing({...editing,unit:e.target.value})}><option value="kg">Quilo (kg)</option><option value="un.">Unidade</option></select></label><label className="wide-field">Descrição<input value={editing.note||""} onChange={e=>setEditing({...editing,note:e.target.value})} placeholder="Descrição curta do produto"/></label><div className="image-upload-field"><div className="image-upload-preview">{editing.imageUrl?<img src={editing.imageUrl} alt="Prévia da foto do produto"/>:<ImagePlus size={28}/>}</div><div className="image-upload-actions"><label className="secondary-action image-pick-button"><ImagePlus size={16}/> Escolher foto do celular<input type="file" accept="image/*" onChange={e=>{handleProductImage(e.target.files?.[0]);e.target.value=""}}/></label><small>Escolha uma foto ou print da galeria. Até 8 MB.</small>{editing.imageUrl&&<button type="button" className="text-action" onClick={()=>setEditing({...editing,imageUrl:""})}>Remover foto</button>}</div></div><label className="toggle-line"><input type="checkbox" checked={editing.available!==false} onChange={e=>setEditing({...editing,available:e.target.checked})}/> Produto disponível no cardápio</label><label className="toggle-line"><input type="checkbox" checked={!!editing.featured} onChange={e=>setEditing({...editing,featured:e.target.checked})}/> Marcar como destaque</label></div><div className="edit-actions"><button className="primary-action" onClick={saveProduct} disabled={dataLoading}><Save size={17}/> {dataLoading?"Aguarde...":"Salvar produto"}</button><button className="secondary-action" onClick={()=>setEditing(null)}>Cancelar</button></div></section>:<><div className="toolbar"><label className="search-box"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar produto..."/></label><button className="primary-action" onClick={newProduct}><Plus size={17}/> Novo produto</button></div><div className="admin-card table-card"><div className="table-scroll"><table><thead><tr><th>Produto</th><th>Categoria</th><th>Preço</th><th>Unidade</th><th>Disponibilidade</th><th>Ações</th></tr></thead><tbody>{products.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())).map(p=><tr key={p.id}><td><b>{p.name}</b></td><td>{p.category}</td><td>{money(p.price)}</td><td>{p.unit}</td><td><span className={p.available?"available-label":"unavailable-label"}>{p.available?"Disponível":"Pausado"}</span></td><td><div className="row-actions"><button title="Editar" onClick={()=>setEditing({...p})}><Pencil size={16}/></button><button title={p.available?"Pausar":"Ativar"} onClick={async()=>{try{const saved=await saveAdminProduct({...p,available:!p.available},profile.store_id);setProducts(old=>old.map(x=>x.id===p.id?saved:x));setNotice("Disponibilidade atualizada no catálogo online.")}catch(error){setNotice("Falha ao alterar disponibilidade: "+(error.message||"erro no banco."))}}}>{p.available?<EyeOff size={16}/>:<Eye size={16}/>}</button><button title="Excluir" onClick={()=>deleteProduct(p.id)}><Trash2 size={16}/></button></div></td></tr>)}</tbody></table></div></div></>}</>}
    {adminTab==="orders"&&<div className="admin-card"><div className="card-title"><div><h3>Gestão de pedidos</h3><p>Por padrão, aparecem os pedidos novos de hoje e os que continuam pendentes de dias anteriores. Ao mudar para preparação, saiu para entrega ou entregue, eles saem desta lista.</p></div><span>{filteredOrders.length} de {orders.length} pedido(s)</span></div><div className="order-period-filter"><label>Período<select value={orderPeriod} onChange={e=>{setOrderPeriod(e.target.value);setOrderFilter(e.target.value==="Hoje"?"Novos e pendentes":"Todos")}}><option>Hoje</option><option>Data específica</option><option>Mês</option><option>Ano</option><option>Todos</option></select></label>{orderPeriod==="Data específica"&&<><label>Data inicial<input type="date" value={orderStartDate} onChange={e=>setOrderStartDate(e.target.value)}/></label><label>Data final<input type="date" min={orderStartDate} value={orderEndDate} onChange={e=>setOrderEndDate(e.target.value)}/></label></>}{orderPeriod==="Mês"&&<label>Mês<input type="month" value={orderMonth} onChange={e=>setOrderMonth(e.target.value)}/></label>}{orderPeriod==="Ano"&&<label>Ano<input type="number" min="2020" max="2100" value={orderYear} onChange={e=>setOrderYear(e.target.value)}/></label>}</div><label className="order-search-box"><Search size={18}/><input type="search" value={orderSearch} onChange={e=>setOrderSearch(e.target.value)} placeholder="Consultar por número do pedido ou nome do cliente..." aria-label="Consultar pedido por número ou nome do cliente"/>{orderSearch&&<button type="button" onClick={()=>setOrderSearch("")} aria-label="Limpar pesquisa"><X size={16}/></button>}</label><div className="order-status-tabs" role="tablist" aria-label="Filtrar pedidos">{orderStatuses.map(tab=><button key={tab.label} type="button" role="tab" aria-selected={orderFilter===tab.label} className={orderFilter===tab.label?"active":""} onClick={()=>setOrderFilter(tab.label)}>{tab.label}<b>{orders.filter(o=>tab.match(o)&&(tab.label==="Novos e pendentes"&&orderPeriod==="Hoje"?true:inSelectedOrderPeriod(o))).length}</b></button>)}</div>{filteredOrders.length?filteredOrders.map(o=><article className="order-card order-card-compact" key={o.id} onClick={()=>setSelectedOrder(o)}><div className="order-compact-main"><div className="order-compact-customer"><b>{o.customer.name}</b><small>{o.displayId||o.id}</small></div><strong>{money(o.total)}</strong></div><div className="order-compact-footer"><span className={"status "+statusClass(o.status)}>{o.status}</span><time>{new Date(o.createdAt).toLocaleString("pt-BR")}</time><button type="button" className="order-detail-button" title="Consultar pedido completo" aria-label={"Consultar pedido "+(o.displayId||o.id)} onClick={e=>{e.stopPropagation();setSelectedOrder(o)}}><Eye size={16}/><span>Visualizar</span></button></div></article>):<div className="admin-empty"><ClipboardList/><b>{orders.length?"Nenhum pedido nesta etapa":"Nenhum pedido recebido"}</b><span>{orders.length?"Escolha outra aba para visualizar pedidos de outras etapas.":"Os pedidos recebidos pelo cardápio aparecerão aqui."}</span>{!orders.length&&<button className="secondary-action" onClick={()=>setArea("store")}>Abrir cardápio</button>}</div>}</div>}{adminTab==="delivery"&&<div className="admin-card settings-card"><h3>Regras de entrega</h3><p>Configure os valores que serão estimados no carrinho.</p><label>Modelo de cobrança<select value={delivery.mode} onChange={e=>setDelivery({...delivery,mode:e.target.value})}><option value="fixed">Taxa fixa</option><option value="freeOver">Grátis acima de um valor mínimo</option><option value="manual">Taxa a combinar com a loja</option></select></label><label>Taxa padrão (R$)<input type="number" min="0" step="0.50" value={delivery.fee} onChange={e=>setDelivery({...delivery,fee:e.target.value})}/></label><label>Previsão de entrega<input value={estimatedTime} onChange={e=>setDelivery({...delivery,estimatedTime:e.target.value})} placeholder="Ex.: 40 a 60 minutos"/></label>{delivery.mode==="freeOver"&&<label>Pedido mínimo para entrega grátis (R$)<input type="number" min="0" step="1" value={delivery.freeOver} onChange={e=>setDelivery({...delivery,freeOver:e.target.value})}/></label>}<label className="toggle-line"><input type="checkbox" checked={delivery.paused} onChange={e=>setDelivery({...delivery,paused:e.target.checked})}/> Pausar recebimento de pedidos</label><div className="tip-box">A previsão é apenas uma estimativa inicial e pode ser ajustada conforme a demanda. A taxa exibida aqui é demonstrativa; cálculo automático por bairro ou distância será integrado depois.</div></div>}
    {adminTab==="settings"&&<div className="admin-card settings-card"><h3>Dados da loja</h3><p>Informações básicas da apresentação comercial.</p><label>Nome da loja<input value="Açougue Bom Jardim" readOnly/></label><label>WhatsApp de pedidos<input value="A configurar com o proprietário" readOnly/></label><label>Endereço da loja<input placeholder="Será preenchido com os dados oficiais"/></label><div className="tip-box">A conta do proprietário, os acessos individuais da equipe e a integração segura com o banco de dados serão configurados antes de colocar o sistema em operação real.</div></div>}
   </section>
  </main>}
  {selectedOrder&&<div className="overlay order-detail-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setSelectedOrder(null)}}><section className="order-detail-panel"><div className="panel-head"><div><span className="eyebrow">CONSULTA DE PEDIDO</span><h2>{selectedOrder.displayId||selectedOrder.id}</h2></div><button className="icon-button" onClick={()=>setSelectedOrder(null)} aria-label="Fechar detalhes"><X/></button></div><div className="order-detail-content"><div className="order-detail-summary"><div><span className={"status "+statusClass(selectedOrder.status)}>{selectedOrder.status}</span><small>Etapa atual do pedido</small></div><b>{money(selectedOrder.total)}</b><label className="order-detail-status-control">Atualizar status<select value={selectedOrder.status} onChange={e=>{const nextStatus=e.target.value;updateStatus(selectedOrder.id,nextStatus);setSelectedOrder(current=>({...current,status:nextStatus,statusHistory:[...(current.statusHistory||[{status:current.status,at:current.createdAt}]),{status:nextStatus,at:new Date().toISOString()}]}))}}>{["Novo","Aguardando resolução","Em preparação","Saiu para entrega","Entregue","Retornado","Cancelado"].map(v=><option key={v}>{v}</option>)}</select></label></div><h3>Dados do cliente</h3><p><b>Nome:</b> {selectedOrder.customer?.name||"Não informado"}</p><p><b>Telefone:</b> {selectedOrder.customer?.phone||"Não informado"}</p><p><b>Endereço:</b> {selectedOrder.customer?.address||"Não informado"}</p>{selectedOrder.customer?.reference&&<p><b>Referência:</b> {selectedOrder.customer.reference}</p>}<p><b>Recebido em:</b> {new Date(selectedOrder.createdAt).toLocaleString("pt-BR")}</p><h3>Produtos do pedido</h3>{orderEditMode?<div className="order-edit-box">{orderEditItems.map((item,index)=><div className="order-edit-row" key={index}><label>Produto<select value={item.productId} onChange={e=>{const p=orderEditCatalogProducts.find(x=>String(x.id)===e.target.value);changeOrderEditItem(index,{productId:e.target.value,name:p?.name||"",unit:p?.unit||"kg",price:Number(p?.price||0)})}}><option value="">Selecione um produto</option>{orderEditCatalogProducts.map(p=><option key={p.id} value={p.id}>{p.name} — {money(p.price)}/{p.unit}</option>)}</select></label><label>Quantidade<input type="number" min="0.001" step={item.unit==="kg"?"0.001":"1"} value={item.qty} onChange={e=>changeOrderEditItem(index,{qty:e.target.value})}/></label><button type="button" className="text-action" onClick={()=>setOrderEditItems(old=>old.filter((_,i)=>i!==index))}>Remover</button></div>)}<button type="button" className="secondary-action" onClick={()=>setOrderEditItems(old=>[...old,{productId:"",name:"",qty:1,unit:"kg",price:0}])}><Plus size={15}/> Adicionar produto</button><p className="order-edit-total">Novo subtotal: <b>{money(orderEditSubtotal)}</b> · Total: <b>{money(orderEditSubtotal+Number(selectedOrder.fee||0))}</b></p><div className="edit-actions"><button className="primary-action" onClick={saveOrderEdit} disabled={dataLoading}><Save size={16}/> Salvar alterações</button><button className="secondary-action" onClick={()=>setOrderEditMode(false)}>Cancelar</button></div><small>Os preços são atualizados conforme o catálogo atual da loja.</small></div>:<>{(selectedOrder.items||[]).map((item,index)=><div className="order-detail-item" key={item.id||index}><span>{item.name} • {item.qty} {item.unit}</span><b>{money(item.total??(Number(item.price??item.unit_price??0)*Number(item.qty??item.quantity??0)))}</b></div>)}{selectedOrder.status==="Em preparação"&&profile?.role==="owner"&&<div className="order-edit-actions"><button className="secondary-action" onClick={startOrderEdit}><Pencil size={16}/> Editar pedido</button><button className="secondary-action" onClick={sendUpdatedOrderWhatsApp}><Truck size={16}/> Enviar atualização pelo WhatsApp</button></div>}</>}{orderEditMode&&<div className="order-edit-box order-edit-customer">
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
  {!cart.length?<div className="empty-cart"><ShoppingBag size={38}/><h3>Sua sacola está vazia</h3><p>Adicione produtos para montar seu pedido.</p></div>:<><div className="cart-items">{cart.map(p=><div className="cart-line" key={p.id}><div><b>{p.name}</b><small>{money(priceOf(p))} / {p.unit}</small></div><div className="qty"><button onClick={()=>qty(p.id,-(p.unit==="kg"?0.5:1))}><Minus size={14}/></button><b>{p.qty.toLocaleString("pt-BR")}</b><button onClick={()=>qty(p.id,p.unit==="kg"?0.5:1)}><Plus size={14}/></button></div></div>)}</div>
  <div className="cart-total"><span>Subtotal estimado</span><strong>{money(subtotal)}</strong></div><div className="cart-total"><span>Entrega demonstrativa</span><strong>{delivery.mode==="manual"?"A combinar":money(fee)}</strong></div><div className="cart-total"><span>Total estimado</span><strong>{money(total)}</strong></div><div className="checkout-form"><h3>Dados para entrega</h3>
  <input placeholder="Nome completo" value={customer.name} onChange={e=>setCustomer(current=>({...current,name:e.target.value}))}/><input placeholder="Telefone / WhatsApp" value={customer.phone} onChange={e=>setCustomer(current=>({...current,phone:e.target.value}))}/><div className="address-field"><input ref={addressInputRef} type="text" autoComplete="street-address" placeholder="Digite sua rua ou endereço..." value={customer.address} onChange={e=>setCustomer(current=>({...current,address:e.target.value}))}/><small>Escolha uma sugestão para preencher rua, bairro e cidade. Depois, complete com o número e ajuste se precisar.</small></div><input placeholder="Ponto de referência (opcional)" value={customer.reference} onChange={e=>setCustomer(current=>({...current,reference:e.target.value}))}/><select value={customer.payment} onChange={e=>setCustomer(current=>({...current,payment:e.target.value}))}><option>Pix</option><option>Dinheiro</option><option>Cartão de débito</option><option>Cartão de crédito</option></select>{customer.payment==="Dinheiro"&&<div className="cash-change-box"><label htmlFor="cash-change">Vai pagar com quanto? (opcional)</label><input id="cash-change" type="number" inputMode="decimal" min={total.toFixed(2)} step="0.01" placeholder="Ex.: 100,00" value={customer.change} onChange={e=>setCustomer(current=>({...current,change:e.target.value}))}/>{customer.change.trim()!==""&&<div className="cash-change-result" aria-live="polite">{Number(String(customer.change).replace(",","."))>=total?<><span>Troco a devolver:</span><strong>{money(Number(String(customer.change).replace(",","."))-total)}</strong></>:<span className="cash-change-warning">O valor informado precisa ser igual ou maior que o total do pedido ({money(total)}).</span>}</div>}</div>}<textarea placeholder="Observações do pedido (opcional)" value={customer.notes} onChange={e=>setCustomer(current=>({...current,notes:e.target.value}))}/><button className="send-order" onClick={finishOrder} disabled={dataLoading}>{dataLoading?"Enviando pedido...":"Confirmar pedido"}</button><small className="disclaimer">O pedido será registrado no sistema da loja. A confirmação não significa pagamento aprovado.</small></div></>}</aside></div>}
  </div>
}
