/* Product approval handoff: Bank creation → Group product review → TokenBank IT. */
(function(){
  var t = function(zh,en){ return TB.state.lang === 'zh' ? zh : en; };
  TB.data.series.forEach(function(s){
    s.issuer = 'Bison Group'; s.quoteProvider = 'Bison Group';
    if(s.status === 'approving' && !s.reviewStage) s.reviewStage = 'group';
  });
  function page(stage){
    var title = stage === 'group' ? t('发行产品审核','Issuance Product Review') : t('IT 审核','IT Review');
    return TB.utils.contentHeader(title)
      + '<p class="text-muted mb-3">'+t('Bison Bank 创建并提交 → Bison Group 产品审核 → TokenBank IT 审核 → 上架。退回后由 Bank 修改并重新提交。','Bison Bank submits → Bison Group reviews → TokenBank IT reviews → Listing. Returned products go back to Bank for revision.')+'</p>'
      + TB.ui.table({columns:[
        {key:'id',label:TB.t('lbl.seriesId')}, {key:'name',label:TB.t('lbl.productName')},
        {key:'issuer',label:TB.t('lbl.issuer')},
        {key:'reviewStage',label:t('当前节点','Current Stage'),render:function(s){return TB.utils.esc(TB.productReview.stageLabel(s));}},
        {key:'actions',label:TB.t('actions'),render:function(s){if(!TB.productReview.canAct(s,stage))return '<button class="btn btn-sm" onclick="TB.pages.issuer.openSeriesRow(\''+s.id+'\')">'+t('查看','View')+'</button>';return '<button class="btn btn-sm" onclick="TB.pages.issuer.openSeriesRow(\''+s.id+'\')">'+t('详情','Details')+'</button> <button class="btn btn-sm btn-primary" onclick="TB.productReview.decide(\''+s.id+'\',true)">'+t('通过','Approve')+'</button> <button class="btn btn-sm" onclick="TB.productReview.decide(\''+s.id+'\',false)">'+t('退回','Return')+'</button>';}}
      ],data:TB.data.series.filter(function(s){return s.status === 'approving' && s.reviewStage === stage;})});
  }
  TB.productReview = {decide:function(id,approve){
    var s = TB.data.series.find(function(x){return x.id === id;});
    var stage = TB.state.portal === 'group' ? 'group' : TB.state.portal === 'ops' ? 'it' : null;
    if(!s || !stage || !TB.productReview.canReview(stage) || s.status !== 'approving' || s.reviewStage !== stage) return;
    if(stage==='group'){
      var pending=TB.data.approvalTasks.find(function(x){return x.ref===id && x.flow==='AF-ISSU' && x.status==='pending';});
      if(!pending || pending.approvers.indexOf(TB.state.user.name)<0 || (pending.nodeApprovals||[]).indexOf(TB.state.user.name)>=0)return;
      TB.pages.issuer.openDecide(pending.id,approve?'approved':'returned');return;
    }
    if(!approve){
      TB.ui.modal({title:t('退回产品','Return Product'),body:TB.ui.formField({label:t('退回原因','Reason'),name:'product_return_reason',type:'textarea',required:true}),footer:'<button class="btn btn-primary" onclick="TB.productReview.returnProduct(\''+id+'\')">'+t('确认退回','Confirm Return')+'</button>'});return;
    }
    s.reviewHistory = s.reviewHistory || [];
    s.reviewHistory.push({stage:stage,decision:'approved',user:TB.state.user.name,time:TB.utils.nowET()});
    s.reviewStage = stage === 'group' ? 'it' : 'listed';
    if(stage === 'it') s.status = 'open';
    TB.utils.toast(stage === 'group' ? t('已转交 TokenBank IT 审核','Sent to TokenBank IT review') : t('IT 审核通过，产品已上架','IT approved; product listed'),'success');TB.router.render();
  },returnProduct:function(id){
    var reason = TB.utils.getInputVal('product_return_reason').trim();
    if(!reason){TB.utils.toast(t('请填写退回原因','Enter a return reason'),'error');return;}
    var s = TB.data.series.find(function(x){return x.id === id;});
    var stage = TB.state.portal === 'group' ? 'group' : TB.state.portal === 'ops' ? 'it' : null;
    if(!s || stage!=='it' || !TB.productReview.canReview(stage) || s.status !== 'approving' || s.reviewStage !== stage) return;
    (s.reviewHistory = s.reviewHistory || []).push({stage:stage,decision:'returned',reason:reason,user:TB.state.user.name,time:TB.utils.nowET()});
    TB.data.approvalTasks.forEach(function(task){if(task.ref === id && task.status === 'pending'){task.status='returned';task.completedAt=TB.utils.nowET();}});
    s.returnReason = reason;s.status = 'draft';s.reviewStage = null;
    TB.ui.closeModal();TB.router.render();
  }};
  // Institution configuration is independent; product approval belongs to Group.
  TB.data.users.push({id:'G003',name:'Victor Reyes',email:'victor@bisongroup.com',role:'group_officer',portal:'group',org:'Bison Group',remiId:'RM-BG-001'});
  TB.data.approvalFlows.forEach(function(f){f.portal='group';});
  TB.data.approvalFlows.push({id:'AF-BANK',portal:'issuer',type:'internal',name:{zh:'机构内部审核',en:'Internal Review'},enabled:true,nodes:[{id:'BANK-1',order:1,name:{zh:'机构复核',en:'Internal Check'},approvers:['James Wilson'],mode:'any'}]});
  TB.pages.issuer.flowById = function(id){return TB.data.approvalFlows.find(function(f){return f.id===id && f.portal===TB.state.portal;});};
  TB.pages.issuer.flowByType = function(type){return TB.data.approvalFlows.find(function(f){return f.type===type && f.portal===TB.state.portal;});};
  TB.productReview.canAct=function(s,stage){
    if(!TB.productReview.canReview(stage))return false;
    if(stage==='it')return true;
    var task=TB.data.approvalTasks.find(function(x){return x.ref===s.id && x.flow==='AF-ISSU' && x.status==='pending';});
    return !!task && task.approvers.indexOf(TB.state.user.name)>=0 && (task.nodeApprovals||[]).indexOf(TB.state.user.name)<0;
  };
  TB.productReview.canReview = function(stage){
    var u=TB.state.user;
    var acc=u && TB.data.accounts.find(function(a){return a.email===u.email;});
    if(acc && (acc.status!=='active' || (Array.isArray(acc.perms) && acc.perms.indexOf(stage==='group'?'review.handle':'ops.seriesReview')<0)))return false;
    return !!u && u.portal===TB.state.portal && (stage==='group' ? ['group_admin','group_officer'].indexOf(u.role)>=0 : ['sys_admin','ops_admin','reviewer'].indexOf(u.role)>=0);
  };
  TB.productReview.submit = function(row){
    row.reviewStage='group';row.returnReason='';row.issuer='Bison Group';row.quoteProvider='Bison Group';row.faceAvailable=row.faceTotal;
    var flow=TB.data.approvalFlows.find(function(f){return f.id==='AF-ISSU';});
    // Mandatory external product review cannot be skipped by disabling configuration.
    if(!flow.nodes.length) flow.nodes=[{id:'GROUP-1',order:1,name:{zh:'产品审核',en:'Product Review'},approvers:['Daniel Park'],mode:'any'}];
    var task=TB.data.approvalTasks.find(function(x){return x.ref===row.id && x.flow===flow.id;});
    if(!task){task={id:'APR-'+Date.now()+'-'+TB.data.approvalTasks.length,ref:row.id,flow:flow.id,trail:[]};TB.data.approvalTasks.push(task);}
    Object.assign(task,{applicant:TB.state.user.name,submittedAt:TB.utils.nowET(),nodeOrder:1,approvers:flow.nodes[0].approvers.slice(),nodeApprovals:[],status:'pending',priority:'High',completedAt:'-',decidedBy:'-'});
    return task;
  };
  var confirm=TB.pages.issuer.confirmDecide;
  TB.pages.issuer.confirmDecide=function(id,decision){
    var task=TB.pages.issuer.taskById(id),u=TB.state.user;
    if(!task || task.status!=='pending' || !u || !TB.pages.issuer.flowById(task.flow) || task.approvers.indexOf(u.name)<0 || (task.nodeApprovals||[]).indexOf(u.name)>=0) return;
    var row=TB.data.series.find(function(s){return s.id===task.ref;});
    if(task.flow==='AF-ISSU' && (!TB.productReview.canReview('group') || !row || row.reviewStage!=='group' || row.status!=='approving'))return;
    confirm(id,decision);
    if(row && task.flow==='AF-ISSU'){
      row.reviewHistory=(task.trail||[]).slice();
      if(task.status==='approved'){row.reviewStage='it';}
      if(task.status==='returned' || task.status==='rejected'){row.status='draft';row.reviewStage=null;row.returnReason=TB.utils.getInputVal('decide_remarks') || ((task.trail||[]).slice(-1)[0]||{}).remarks;}
      TB.router.render();
    }
  };
  var open=TB.pages.issuer.openIssuance,save=TB.pages.issuer._persistIssuance;
  function bankCanEdit(){var u=TB.state.user,acc=u && TB.data.accounts.find(function(a){return a.email===u.email;});if(acc && (acc.status!=='active' || (Array.isArray(acc.perms) && acc.perms.indexOf('series.issue')<0)))return false;return TB.state.portal==='issuer' && TB.state.user && TB.state.user.portal==='issuer' && ['issuer_admin','issuer_staff'].indexOf(TB.state.user.role)>=0;}
  TB.pages.issuer.openIssuance=function(id){var row=TB.data.series.find(function(s){return s.id===id;});if(!bankCanEdit() || (row && ['draft','rejected'].indexOf(row.status)<0))return;return open(id);};
  TB.pages.issuer._persistIssuance=function(status){if(!bankCanEdit())throw new Error(t('无产品编辑权限','No product editing permission'));return save(status);};
  var submitIssuance=TB.pages.issuer.submitIssuance;
  TB.pages.issuer.submitIssuance=function(){
    if(!bankCanEdit())return;
    var st=TB.pages.issuer._issuance;if(!st)return;
    var row=TB.data.series.find(function(s){return s.id===st.id;});if(row && ['draft','rejected'].indexOf(row.status)<0)return;
    TB.pages.issuer._collectIssuance();var d=st.data;
    if(!(Number(d.faceTotal)>0) || !(Number(d.markPrice)>0) || !Number.isFinite(Number(d.faceTotal)) || !Number.isFinite(Number(d.markPrice)) || !d.agree || !/^\d{4}-\d{2}-\d{2}$/.test(d.maturityDate||'') || d.maturityDate<=TB.utils.nowET().slice(0,10)){TB.utils.toast(t('请确认正数金额、有效的未来到期日及责任声明','Confirm positive amounts, a future maturity date and responsibility declaration'),'error');return;}
    return submitIssuance();
  };
  var items=TB.pages.issuer.reviewItems;
  TB.pages.issuer.reviewItems=function(){return items().filter(function(x){return x.taskId ? !!TB.pages.issuer.flowById((TB.pages.issuer.taskById(x.taskId)||{}).flow) : TB.state.portal==='group' && x.route!=='#/reconciliation';}).map(function(x){if(x.taskId && (TB.pages.issuer.taskById(x.taskId)||{}).flow==='AF-ISSU')x.route='#/product-review';return x;});};
  // Shared details remain read-only outside Bank drafts.
  TB.pages.issuer.openSeriesRow=function(id){var row=TB.data.series.find(function(s){return s.id===id;});if(row && bankCanEdit() && ['draft','rejected'].indexOf(row.status)>=0)return TB.pages.issuer.openIssuance(id);return TB.pages.issuer.viewSeries(id);};
  TB.i18n['nav.seriesReview']={zh:'IT 审核上架',en:'IT Review & Listing'};
  TB.i18n['nav.series']={zh:'产品创建与提交',en:'Product Creation & Submission'};
  TB.data.permCatalog.issuer=TB.data.permCatalog.issuer.map(function(g){return Object.assign({},g,{items:g.items.filter(function(i){return /^(series\.|review\.|accounts\.|notif\.)/.test(i.key);})});}).filter(function(g){return g.items.length;});
  TB.data.roles.issuer=TB.data.roles.issuer.map(function(r){return Object.assign({},r,{perms:r.perms==='all'?'all':r.perms.filter(function(k){return TB.utils.allPermKeys('issuer').indexOf(k)>=0;})});});
  TB.data.permCatalog.group=TB.data.permCatalog.group.map(function(g){return Object.assign({},g,{items:g.items.filter(function(i){return i.key!=='series.issue';})});});
  // The review stage is visible in every product status table.

  TB.productReview.stageLabel=function(s){return s.status==='approving' ? (s.reviewStage==='it'?t('待 TokenBank IT 审核','Awaiting TokenBank IT Review'):t('待 Bison Group 产品审核','Awaiting Bison Group Review')) : TB.t('st.'+s.status);};
  var view=TB.pages.issuer.viewSeries;
  TB.pages.issuer.viewSeries=function(id){
    var s=TB.data.series.find(function(x){return x.id===id;});
    if(!s)return;
    var modal=TB.ui.modal;
    TB.ui.modal=function(cfg){cfg.body='<div class="alert alert-info">'+TB.utils.esc(TB.productReview.stageLabel(s))+(s.returnReason?'<br>'+TB.utils.esc(s.returnReason):'')+'</div>'+cfg.body;
      if(s.reviewHistory && s.reviewHistory.length)cfg.body+=TB.ui.table({columns:[{key:'user',label:t('审核人','Reviewer')},{key:'decision',label:t('决定','Decision')},{key:'time',label:t('时间','Time')},{key:'remarks',label:t('意见','Remarks')}],data:s.reviewHistory,paginate:false});
      return modal(cfg);};
    try{return view(id);}finally{TB.ui.modal=modal;}
  };
  ['saveNode','_deleteNodeDone','saveFlowStatus'].forEach(function(key){var fn=TB.pages.issuer[key];TB.pages.issuer[key]=function(){var flow=TB.pages.issuer.flowById(TB.pages.issuer._flowSel);if(!flow)return; if(TB.data.approvalTasks.some(function(task){return task.flow===flow.id && task.status==='pending';})){TB.utils.toast(t('存在审核中的任务，请完成后再修改流程','Complete pending tasks before changing this flow'),'error');return;}return fn.apply(this,arguments);};});
  // Legacy backend queue actions use the same authoritative IT queue.
  var openTask=TB.ops.openReviewTask;
  TB.ops.openReviewTask=function(id){var task=TB.data.reviewTasks.find(function(x){return x.id===id;});if(task && task.type==='Series Issuance'){TB.router.navigate('#/series-review');return;}return openTask(id);};
  // Persist demo workflow so a refresh does not reset cross-portal handoffs.
  var storageKey='tokenbank.product-review.v2';
  try{var saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved && saved.version===2){['series','approvalTasks','approvalFlows'].forEach(function(k){if(Array.isArray(saved[k]))TB.data[k]=saved[k];});}}catch(e){}
  function persist(){try{localStorage.setItem(storageKey,JSON.stringify({version:2,series:TB.data.series,approvalTasks:TB.data.approvalTasks,approvalFlows:TB.data.approvalFlows}));}catch(e){}}
  ['submitIssuance','saveDraftIssuance','confirmDecide','saveNode','_deleteNodeDone','saveFlowStatus'].forEach(function(key){var fn=TB.pages.issuer[key];if(fn)TB.pages.issuer[key]=function(){var result=fn.apply(this,arguments);persist();return result;};});
  ['decide','returnProduct'].forEach(function(key){var fn=TB.productReview[key];TB.productReview[key]=function(){var result=fn.apply(this,arguments);persist();return result;};});
  TB.router.routes.ops['/series/:id']=function(p){var s=TB.data.series.find(function(x){return x.id===p.id;});if(!s)return TB.ui.emptyState('',t('产品不存在','Product not found'));return TB.utils.contentHeader(TB.utils.esc(s.name))+TB.ui.descList([{label:t('产品编号','Product ID'),value:TB.utils.esc(s.id)},{label:t('当前状态','Current Status'),value:TB.utils.esc(TB.productReview.stageLabel(s))},{label:t('发行方','Issuer'),value:'Bison Group'},{label:t('创建代理','Creation Agent'),value:'Bison Bank'},{label:t('退回原因','Return Reason'),value:TB.utils.esc(s.returnReason||'-')}])+TB.ui.table({columns:[{key:'user',label:t('审核人','Reviewer')},{key:'decision',label:t('决定','Decision')},{key:'time',label:t('时间','Time')},{key:'remarks',label:t('意见','Remarks')}],data:s.reviewHistory||[],paginate:false});};
  TB.router.routes.group['/product-review'] = function(){return page('group');};
  TB.router.routes.ops['/series-review'] = function(){return page('it');};
})();
