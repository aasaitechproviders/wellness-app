import { useNavigate, useLocation } from 'react-router-dom'

export default function Confirmed() {
  const nav = useNavigate()
  const { state } = useLocation()
  const { order, basket, plan } = state||{}

  return(
    <div className="page-full fade-in" style={{minHeight:'100dvh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'36px 22px',textAlign:'center',background:'linear-gradient(180deg,var(--green-pale) 0%,var(--cream) 100%)'}}>
      
      <div style={{width:92,height:92,borderRadius:'50%',background:'var(--green)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:44,marginBottom:20,boxShadow:'0 8px 28px rgba(45,106,53,0.3)',animation:'popIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275)'}}>✅</div>

      <h1 style={{fontSize:24,marginBottom:8}}>Order Placed!</h1>
      <p style={{marginBottom:26,fontSize:14}}>Your wellness basket is confirmed.<br/>Fresh produce is on its way 🌿</p>

      {order&&(
        <div style={{width:'100%',background:'#fff',borderRadius:16,padding:'16px',marginBottom:20,border:'1px solid var(--border)',textAlign:'left'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <span style={{fontWeight:700,fontSize:13}}>{order.orderNo}</span>
            <span className="pill pill-placed">Placed</span>
          </div>
          {basket&&<Row label={basket.basketName||'Wellness Basket'} value={`₹${basket.price||order.totalAmount}`} bold/>}
          {plan&&<Row label="Plan" value={plan.name||plan.planName}/>}
          {order.deliveryDate&&<Row label="Delivery" value={new Date(order.deliveryDate).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})}/>}
          {order.deliverySlot&&<Row label="Time" value={order.deliverySlot}/>}
        </div>
      )}

      {/* SS features row */}
      <div style={{display:'flex',gap:20,marginBottom:26}}>
        {[['🌿','Freshly\nPacked'],['🧼','Hygienic'],['🚜','Farm\nFresh']].map(([ic,lb])=>(
          <div key={lb} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
            <div style={{width:48,height:48,background:'var(--green-pale)',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>{ic}</div>
            <span style={{fontSize:10,color:'var(--text-mid)',textAlign:'center',whiteSpace:'pre'}}>{lb}</span>
          </div>
        ))}
      </div>

      <p style={{fontFamily:'Playfair Display,serif',fontSize:16,fontStyle:'italic',color:'var(--green)',marginBottom:22}}>Eat Pure. Live Well.</p>

      <div style={{display:'flex',flexDirection:'column',gap:10,width:'100%'}}>
        <button className="btn btn-primary" onClick={()=>nav('/orders')}>Track Order →</button>
        <button className="btn btn-ghost"   onClick={()=>nav('/home')}>Back to Home</button>
      </div>

      <style>{`@keyframes popIn{from{opacity:0;transform:scale(0.4)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  )
}

function Row({label,value,bold}){
  return(
    <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
      <span style={{fontSize:13,color:bold?'var(--text)':'var(--text-light)',fontWeight:bold?600:400}}>{label}</span>
      <span style={{fontSize:13,fontWeight:600}}>{value}</span>
    </div>
  )
}
