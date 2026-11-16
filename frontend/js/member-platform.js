/* TokenBank member platform: shared services and independent business modules. */
(function(){
  var M=TB.pages.member,R=TB.router.routes.member,t=M.t;
  var originalDashboard=R['/dashboard'];
  var common=['/dashboard','/asset-accounts','/wallet','/wallet/withdraw','/accounts','/account-security','/settings','/compliance','/activation-setup','/fx'];
  function cash(v){return TB.utils.money(v,'EMT');}
  function route(){return (window.location.hash||'#/dashboard').replace(/^#/,'');}
  function isRwa(path){return common.indexOf(path)<0 && path.indexOf('/accounts/')!==0;}
  function link(label,path,primary){return '<button class="btn'+(primary?' btn-primary':'')+'" onclick="TB.router.navigate(\'#'+path+'\')">'+label+'</button>';}
  function nav(label,path){return {label:label,route:'#'+path};}
  function updateNav(){
    var path=route(),rwa=isRwa(path);
    TB.nav.member=[{group:null,items:rwa?[
      nav(t('返回平台','Platform Home'),'/dashboard'),nav(t('RWA 总览','RWA Overview'),'/rwa'),nav(t('产品市场','Product Market'),'/market'),nav(t('我的持仓','My Holdings'),'/holdings'),nav(t('挂单与预定','Orders & Bookings'),'/bookings'),nav(t('交易记录','Transactions'),'/transactions'),nav(t('RWA 资金','RWA Funds'),'/rwa/balance'),nav(t('通知中心','Notifications'),'/notifications')
    ]:[nav(t('平台首页','Platform Home'),'/dashboard'),nav(t('资产账户','Asset Accounts'),'/asset-accounts'),nav(t('提现','Withdraw'),'/wallet/withdraw'),nav(t('成员管理','Member Management'),'/accounts'),nav(t('账户与安全','Account & Security'),'/account-security')]}];
  }
  // Illustrative cash allocation, kept separate from R-UST holdings valuation.
  var balances=[{id:'MAIN-001',type:'main',available:2500000,frozen:0},{id:'RWA-001',type:'rwa',available:10000000,frozen:200000},{id:'FX-001',type:'fx',available:0,frozen:0}];
  function name(a){return a.type==='main'?t('平台总账户 · 未分配资金','Platform Main · Unallocated Funds'):a.type==='rwa'?t('RWA 业务子账户','RWA Business Sub-account'):t('FX 业务子账户','FX Business Sub-account');}
  function summary(){var available=balances.reduce(function(n,a){return n+a.available;},0),frozen=balances.reduce(function(n,a){return n+a.frozen;},0);return '<div class="stat-grid platform-balances">'+TB.ui.statCard(t('资金总额 · EMT','Total Cash · EMT'),cash(available+frozen))+TB.ui.statCard(t('可用资金 · EMT','Available Cash · EMT'),cash(available))+TB.ui.statCard(t('冻结资金 · EMT','Frozen Cash · EMT'),cash(frozen))+'</div>';}
  function accounts(){return TB.ui.table({columns:[{key:'id',label:t('账户编号','Account ID')},{key:'name',label:t('账户','Account'),render:name},{key:'available',label:t('可用 · EMT','Available · EMT'),render:function(a){return cash(a.available);}},{key:'frozen',label:t('冻结 · EMT','Frozen · EMT'),render:function(a){return cash(a.frozen);}},{key:'total',label:t('合计 · EMT','Total · EMT'),render:function(a){return cash(a.available+a.frozen);}},{key:'status',label:t('状态','Status'),render:function(a){return a.type==='fx'?TB.ui.badge(t('业务未开放','Business Not Available'),'default'):TB.ui.badge(t('正常','Active'),'success');}}],data:balances,paginate:false});}
  R['/dashboard']=function(){
    return TB.utils.contentHeader(t('TokenBank 平台首页','TokenBank Platform Home'),link(t('资产账户','Asset Accounts'),'/asset-accounts')+link(t('提现','Withdraw'),'/wallet/withdraw',true))
      +'<p class="platform-intro">'+t('统一管理机构账户与资金，选择业务模块开始工作。','Manage your institution’s accounts and funds, then choose a business module.')+'</p>'
      +summary()+'<section class="platform-module-section" aria-labelledby="business-modules"><h2 id="business-modules">'+t('业务模块','Business Modules')+'</h2><div class="platform-modules">'
      +'<article class="platform-module"><div class="platform-module-top"><span class="platform-module-code">RWA</span>'+TB.ui.badge(t('已开放','Available'),'success')+'</div><h3>'+t('美债代币业务','Tokenized US Treasuries')+'</h3><p>'+t('R-UST 产品市场、挂单、持仓和交易管理。','R-UST product market, orders, holdings and transactions.')+'</p><div class="platform-module-foot"><span>R-UST</span>'+link(t('进入 RWA 模块','Enter RWA'),'/rwa',true)+'</div></article>'
      +'<article class="platform-module platform-module-fx"><div class="platform-module-top"><span class="platform-module-code">FX</span>'+TB.ui.badge(t('暂未开放','Not Yet Available'),'default')+'</div><h3>'+t('外汇交易业务','Foreign Exchange')+'</h3><p>'+t('外汇业务独立模块，后续开放。','An independent foreign exchange module, coming later.')+'</p><div class="platform-module-foot"><span>'+t('统一账户体系','Unified Accounts')+'</span><button class="btn" disabled>'+t('暂未开放','Not Yet Available')+'</button></div></article>'
      +'</div></section><div class="platform-section-heading"><h2>'+t('总账户与业务子账户','Main & Business Sub-accounts')+'</h2>'+link(t('查看账户明细','View Account Details'),'/asset-accounts')+'</div>'+accounts()
      +'<p class="form-hint">'+t('演示资金数据。资金总额 = 总账户未分配资金 + RWA 子账户 + FX 子账户，不包含 R-UST 持仓估值。','Illustrative balances. Total cash equals unallocated main-account funds plus RWA and FX sub-accounts, excluding R-UST holdings valuation.')+'</p>';
  };
  R['/asset-accounts']=R['/wallet']=function(){return TB.utils.contentHeader(t('资产账户','Asset Accounts'),link(t('提现','Withdraw'),'/wallet/withdraw',true))+summary()+accounts()+'<p class="form-hint">'+t('总账户与业务子账户用于资金管理；成员管理中的用户子账号用于登录和权限管理。当前为演示数据，不执行真实资金划转。','Main and business sub-accounts hold funds. User accounts in Member Management control login and permissions. These are illustrative balances; no real transfers are executed.')+'</p>';};
  R['/rwa']=function(){return '<div class="platform-context"><span>RWA / R-UST</span>'+link(t('返回平台首页','Back to Platform'),'/dashboard')+'</div>'+originalDashboard().replace(t('Dashboard','Dashboard'),t('RWA 业务总览','RWA Overview')).replace(t('钱包余额','Wallet Balance'),t('RWA 可用资金','RWA Available Cash')).replace(TB.utils.moneyShort(12500000),cash(balances[1].available));};
  M._quickActions=function(){return link(t('前往产品市场','Go to Product Market'),'/market',true);};
  R['/rwa/balance']=function(){var a=balances[1];return TB.utils.contentHeader(t('RWA 业务资金','RWA Business Funds'),link(t('平台资产账户','Platform Asset Accounts'),'/asset-accounts'))+TB.ui.descList([{label:t('业务账户','Business Account'),value:a.id},{label:t('可用余额 · EMT','Available · EMT'),value:cash(a.available)},{label:t('冻结余额 · EMT','Frozen · EMT'),value:cash(a.frozen)}])+TB.ui.table({columns:[{key:'id',label:t('流水号','Transaction ID')},{key:'time',label:TB.t('time')},{key:'type',label:TB.t('type')},{key:'amount',label:TB.t('amount')},{key:'status',label:TB.t('status')}],data:M._transactionRows()});};
  R['/fx']=function(){return TB.utils.contentHeader(t('FX 外汇交易','FX Foreign Exchange'))+TB.ui.emptyState('',t('FX 模块暂未开放','The FX module is not yet available'))+link(t('返回平台首页','Back to Platform'),'/dashboard');};
  // Keep the same login and withdrawal implementation in platform services.
  var withdraw=R['/wallet/withdraw'];R['/wallet/withdraw']=function(){return '<div class="platform-context"><span>'+t('平台公共服务 / 提现','Platform Services / Withdraw')+'</span>'+link(t('资产账户','Asset Accounts'),'/asset-accounts')+'</div>'+withdraw();};
  var render=TB.router.render;
  TB.router.render=function(){if(TB.state.portal==='member')updateNav();var result=render.apply(this,arguments);if(TB.state.portal==='member' && TB.state.user)TB.auth.renderShell();return result;};
  var shell=TB.auth.renderShell;
  TB.auth.renderShell=function(){document.getElementById('app-shell').classList.toggle('member-platform',TB.state.portal==='member');if(TB.state.portal==='member')updateNav();return shell.apply(this,arguments);};
  var sidebar=TB.auth.renderSidebar;
  TB.auth.renderSidebar=function(){var result=sidebar.apply(this,arguments);if(TB.state.portal==='member'){
    var el=document.getElementById('sidebar');el.style.display='block';el.innerHTML='<nav class="platform-nav" aria-label="'+t('成员机构导航','Member Navigation')+'">'+TB.nav.member[0].items.map(function(item){return '<a href="'+item.route+'"'+(('#'+route())===item.route?' aria-current="page"':'')+'>'+TB.text(item.label)+'</a>';}).join('')+'</nav>';
  }return result;};
  M.platform={isRwa:isRwa,balances:balances,updateNav:updateNav};
})();
