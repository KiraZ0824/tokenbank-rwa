/* Calendar-day maturity reminders and contractual extensions. No wallet or token mutation. */
(function(){
  var M=TB.pages.member,t=M.t,key='tokenbank.maturity-reminders.v1',reminders=[];
  try{reminders=JSON.parse(localStorage.getItem(key)||'[]');if(!Array.isArray(reminders))reminders=[];}catch(e){}
  function active(h){return ['settled','checkoutPending','overdue','extended'].includes(h.status)&&!h.tokenReturnConfirmedAt;}
  function date(h){return String(h.maturityDate||'').slice(0,10);}
  function today(){return TB.utils.nowET().slice(0,10);}
  function shift(day,n){return new Date(Date.parse(day+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);}
  function overdue(h,day){return active(h)&&/^\d{4}-\d{2}-\d{2}$/.test(date(h))&&date(h)<(day||today());}
  function collect(day){day=day||today();var changed=false;TB.data.holdings.filter(active).forEach(function(h){var end=date(h);if(!/^\d{4}-\d{2}-\d{2}$/.test(end)||!Number.isFinite(Date.parse(end)))return;[3,2,1].forEach(function(n){var scheduled=shift(end,-n),id=h.id+'|'+end+'|'+n;if(scheduled!==day||reminders.some(function(r){return r.id===id;}))return;reminders.push({id:id,holdingId:h.id,member:h.member,series:h.series,dueDate:end,days:n,time:day,read:false});changed=true;});});if(changed)localStorage.setItem(key,JSON.stringify(reminders));return reminders;}
  var holdingRows=M._holdingRows;
  M._holdingRows=function(){return holdingRows().map(function(row){var h=TB.data.holdings.find(function(h){return h.id===row.id;});if(h&&overdue(h))row.status=TB.ui.badge(t('借款延期','Loan Extended'),'warning');return row;});};
  var oldRows=M._notifRows;
  M._notifRows=function(){collect();var org=TB.state.user&&TB.state.user.org;return reminders.filter(function(r){return r.member===org;}).map(function(r){return {id:r.id,title:t('Token 到期提醒','Token Maturity Reminder'),desc:TB.utils.esc(r.series)+' · '+t('距约定赎回日还有','Days until redemption: ')+r.days+t('天，请按时办理赎回。','; please redeem on time.'),time:r.time,status:TB.ui.statusBadge(r.read?'completed':'pending'),read:r.read};}).concat(oldRows());};
  var markRead=TB.utils.markAllRead;TB.utils.markAllRead=function(){var org=TB.state.user&&TB.state.user.org;if(TB.state.portal==='member'){reminders.forEach(function(r){if(r.member===org)r.read=true;});localStorage.setItem(key,JSON.stringify(reminders));}var result=markRead.apply(this,arguments);if(TB.state.portal==='member'&&TB.state.route==='#/notifications')TB.router.render();return result;};
  TB.redemptionPolicy={isOverdue:overdue,collect:collect,reminders:reminders};
  collect();setInterval(function(){collect();},60000);
})();
