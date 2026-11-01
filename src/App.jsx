import { useMemo, useState } from "react";
import { Beef, Search, ShoppingBag, Plus, Minus, X, Clock3, MapPin, ShieldCheck } from "lucide-react";

const categories = ["Todos", "Kit Churrasco", "Boi", "Porco", "Frango", "Diversos"];
// Preços iniciais recuperados do catálogo informado; confirmar com a loja antes de publicar.
const products = [
  {id:1,name:"Acém",category:"Boi",price:44.90,unit:"kg",note:"Ideal para panela e carne moída"},
  {id:2,name:"Almôndega de carne",category:"Boi",price:44.90,unit:"kg",note:"Prática para o dia a dia"},
  {id:3,name:"Alcatra",category:"Boi",price:63,unit:"kg",note:"Corte macio e saboroso"},
  {id:4,name:"Bacon suíno",category:"Porco",price:44.99,unit:"kg",note:"Para receitas e acompanhamentos"},
  {id:5,name:"Costelinha de porco",category:"Porco",price:28.99,unit:"kg",note:"Boa opção para assar"},
  {id:6,name:"Asa de frango",category:"Frango",price:22.99,unit:"kg",note:"Perfeita para churrasco"},
  {id:7,name:"Coxa de frango",category:"Frango",price:15.99,unit:"kg",note:"Versátil e suculenta"},
  {id:8,name:"Kit Churrasco 1",category:"Kit Churrasco",price:140,unit:"un.",note:"Consulte a composição com a loja"},
  {id:9,name:"Carvão",category:"Diversos",price:17.99,unit:"un.",note:"Item sujeito à disponibilidade"}
];
const money = n => n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

export default function App(){
 const [category,setCategory]=useState("Todos"),[search,setSearch]=useState(""),[cart,setCart]=useState([]),[cartOpen,setCartOpen]=useState(false);
 const [customer,setCustomer]=useState({name:"",phone:"",address:"",payment:"Pix",notes:""});
 const visible=useMemo(()=>products.filter(p=>(category==="Todos"||p.category===category)&&p.name.toLowerCase().includes(search.toLowerCase())),[category,search]);
 const count=cart.reduce((s,p)=>s+p.qty,0),subtotal=cart.reduce((s,p)=>s+p.price*p.qty,0);
 function add(p){setCart(old=>{const x=old.find(i=>i.id===p.id);return x?old.map(i=>i.id===p.id?{...i,qty:i.qty+1}:i):[...old,{...p,qty:1}]})}
 function qty(id,d){setCart(old=>old.map(p=>p.id===id?{...p,qty:p.qty+d}:p).filter(p=>p.qty>0))}
 function send(){
  if(!customer.name.trim()||!customer.phone.trim()||!customer.address.trim()||!cart.length){alert("Preencha nome, telefone, endereço e adicione pelo menos um produto.");return}
  const lines=cart.map(p=>"- "+p.name+": "+p.qty+" x "+money(p.price)+" = "+money(p.qty*p.price)).join("\n");
  const msg="Olá! Quero fazer um pedido no Açougue Bom Jardim.\n\nCliente: "+customer.name+"\nTelefone: "+customer.phone+"\nEndereço: "+customer.address+"\nPagamento: "+customer.payment+"\n\nITENS:\n"+lines+"\n\nSubtotal estimado: "+money(subtotal)+"\nObservações: "+(customer.notes||"Nenhuma")+"\n\nPor favor, confirmem disponibilidade, peso e valor final.";
  window.open("https://wa.me/5532999953215?text="+encodeURIComponent(msg),"_blank","noopener,noreferrer");
 }
 return <div className="app-shell">
  <header className="topbar"><a className="brand" href="#"><span className="brand-mark"><Beef size={25}/></span><span><strong>Açougue Bom Jardim</strong><small>QUALIDADE E CONFIANÇA</small></span></a><button className="cart-button" onClick={()=>setCartOpen(true)}><ShoppingBag size={18}/> Meu pedido <b>{count}</b></button></header>
  <main><section className="hero"><div><span className="eyebrow">SEU AÇOUGUE DE CONFIANÇA</span><h1>Carne de qualidade,<br/><em>do seu jeito.</em></h1><p>Escolha seus cortes, monte seu pedido e receba em casa.</p><a className="hero-cta" href="#catalog">Ver produtos <span>→</span></a></div><div className="hero-stamp"><Beef size={48}/><span>FRESCO<br/>TODOS OS DIAS</span></div></section>
  <section className="trust-row"><div><ShieldCheck/><span><b>Qualidade</b><small>Seleção de cortes</small></span></div><div><Clock3/><span><b>Praticidade</b><small>Peça pelo celular</small></span></div><div><MapPin/><span><b>Entrega</b><small>Consulte sua região</small></span></div></section>
  <section className="catalog" id="catalog"><div className="section-heading"><div><span className="eyebrow">NOSSO CATÁLOGO</span><h2>Escolha seus produtos</h2></div><span className="catalog-count">{visible.length} produtos</span></div>
  <label className="search-box"><Search size={19}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar carne, corte ou produto..."/></label>
  <nav className="categories">{categories.map(c=><button key={c} className={category===c?"active":""} onClick={()=>setCategory(c)}>{c}</button>)}</nav>
  <div className="product-grid">{visible.map(p=><article className="product-card" key={p.id}><div className="product-art"><Beef size={38}/><span>{p.category}</span></div><div className="product-info"><span className="product-category">{p.category}</span><h3>{p.name}</h3><p>{p.note}</p><div className="product-bottom"><strong>{money(p.price)} <small>/{p.unit}</small></strong><button aria-label={"Adicionar "+p.name} onClick={()=>add(p)}><Plus size={18}/></button></div></div></article>)}</div>
  <p className="price-note">Preços demonstrativos, sujeitos à confirmação pelo açougue. O pedido só será confirmado após verificar preços, peso e disponibilidade.</p></section></main>
  <footer><strong>Açougue Bom Jardim</strong><span>Cardápio online • Atendimento pelo WhatsApp</span></footer>
  {cartOpen&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setCartOpen(false)}}><aside className="cart-panel"><div className="panel-head"><div><span className="eyebrow">SEU PEDIDO</span><h2>Conferir sacola</h2></div><button className="icon-button" onClick={()=>setCartOpen(false)}><X/></button></div>
  {!cart.length?<div className="empty-cart"><ShoppingBag size={38}/><h3>Sua sacola está vazia</h3><p>Adicione produtos para montar seu pedido.</p></div>:<><div className="cart-items">{cart.map(p=><div className="cart-line" key={p.id}><div><b>{p.name}</b><small>{money(p.price)} / {p.unit}</small></div><div className="qty"><button onClick={()=>qty(p.id,-1)}><Minus size={14}/></button><b>{p.qty}</b><button onClick={()=>qty(p.id,1)}><Plus size={14}/></button></div></div>)}</div>
  <div className="cart-total"><span>Subtotal estimado</span><strong>{money(subtotal)}</strong></div><div className="checkout-form"><h3>Dados para entrega</h3>
  <input placeholder="Nome completo" value={customer.name} onChange={e=>setCustomer({...customer,name:e.target.value})}/><input placeholder="Telefone / WhatsApp" value={customer.phone} onChange={e=>setCustomer({...customer,phone:e.target.value})}/><textarea placeholder="Rua, número, bairro e referência" value={customer.address} onChange={e=>setCustomer({...customer,address:e.target.value})}/><select value={customer.payment} onChange={e=>setCustomer({...customer,payment:e.target.value})}><option>Pix</option><option>Dinheiro</option><option>Cartão de débito</option><option>Cartão de crédito</option></select><textarea placeholder="Observações do pedido (opcional)" value={customer.notes} onChange={e=>setCustomer({...customer,notes:e.target.value})}/><button className="send-order" onClick={send}>Enviar pedido pelo WhatsApp</button><small className="disclaimer">Demonstração inicial: taxa de entrega e total final serão confirmados pela loja.</small></div></>}</aside></div>}
 </div>
}