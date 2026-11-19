const vm=require('vm'),fs=require('fs'),assert=require('node:assert/strict');const storage={};const c={console,window:{location:{hash:''}},document:{addEventListener(){},getElementById(){return null;}},setTimeout(){},clearTimeout(){},setInterval(){},localStorage:{getItem(k){return storage[k]||null;},setItem(k,v){storage[k]=v;}}};vm.createContext(c);for(const f of ['core','member-portal','issuer-portal','ops-portal','portal-review','member-platform','bank-reviews','order-routing','free-orders','buyer-execution','redemption-policy']){let text=fs.readFileSync('frontend/js/'+f+'.js','utf8');if(f==='core')text=text.split('// start app')[0];vm.runInContext(text,c);}
const T=c.TB,B=T.freeOrders,P=T.redemptionPolicy;
T.utils.nowET=()=> '2026-11-19 10:00:00';T.utils.defaultTradingDay=()=> '2026-11-19';T.utils.isTradingDay=()=>true;T.utils.toast=()=>{};
T.state.user=T.data.users.find(u=>u.name==='John Smith');T.state.portal='member';
const h={id:'REMINDER-TEST',series:T.data.series[0].id,member:T.state.user.org,maturityDate:'2026-11-22',status:'settled',tokens:100000,faceValue:100000};T.data.holdings.push(h);
for(const day of ['2026-11-19','2026-11-20','2026-11-21']){P.collect(day);P.collect(day);}
assert.equal(P.reminders.filter(r=>r.holdingId===h.id).length,3);
assert(!P.isOverdue(h,'2026-11-22'));assert(P.isOverdue(h,'2026-11-23'));assert.equal(h.status,'settled');assert.equal(h.tokens,100000);
h.tokenReturnConfirmedAt='2026-11-20';assert(!P.isOverdue(h,'2026-11-23'));delete h.tokenReturnConfirmedAt;
const other={...h,id:'RETURNED-TEST',tokenReturnConfirmedAt:'2026-11-18'};T.data.holdings.push(other);P.collect('2026-11-19');assert(!P.reminders.some(r=>r.holdingId===other.id));
const s=T.data.series[0];s.status='open';s.faceAvailable=500000;s.faceTotal=300000;
assert.equal(B.capacity(s.id),300000);B.state.deals.push({id:'PAST-DEAL',series:s.id,face:200000,exitDate:'2026-11-01',sellerOrg:'Bison Group',status:'settled'});assert.equal(B.capacity(s.id),100000);B.expire(Date.now()+86400000*30);assert.equal(B.capacity(s.id),100000);
const blocked=B.create({side:'buy',series:s.id,price:1,face:200000,purchaseDate:'2026-11-19',exitDate:'2026-11-24'});assert.equal(blocked,null);
const rows=T.pages.member._notifRows();assert.equal(rows.filter(r=>r.id.startsWith(h.id+'|')).length,3);assert(!rows.some(r=>r.id.startsWith(other.id+'|')));
console.log('Pool total cap, overdue occupancy, no token mutation, T-3/T-2/T-1 reminders, deduplication and returned-token exclusion passed');
