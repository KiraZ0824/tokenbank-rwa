/* Bank's internal review categories are independent of Group product approval. */
(function(){
  var I=TB.pages.issuer,t=I.t;
  var types=[
    {id:'AF-BANK-CREATE',type:'bankProductCreation',name:{zh:'产品创建审核',en:'Product Creation Review'}},
    {id:'AF-BANK-MINT',type:'bankMint',name:{zh:'铸币审核',en:'Mint Review'}},
    {id:'AF-BANK-BURN',type:'bankBurn',name:{zh:'销币审核',en:'Token Burn Review'}}
  ];
  types.forEach(function(def){
    if(!TB.data.approvalFlows.some(function(f){return f.id===def.id;}))TB.data.approvalFlows.push({id:def.id,type:def.type,name:def.name,portal:'issuer',enabled:true,updatedAt:TB.utils.nowET(),nodes:[{id:def.id+'-1',order:1,name:def.name,approvers:['James Wilson'],mode:'any'}]});
  });
  // Replace the unused generic Bank flow with the three business categories.
  TB.data.approvalFlows=TB.data.approvalFlows.filter(function(f){return f.id!=='AF-BANK' || TB.data.approvalTasks.some(function(k){return k.flow===f.id;});});
  var demoRefs=['DEMO-CREATE-001','DEMO-MINT-001','DEMO-BURN-001'];
  types.forEach(function(def,i){
    if(TB.data.approvalTasks.some(function(k){return k.ref===demoRefs[i];}))return;
    TB.data.approvalTasks.push({id:'APR-BANK-DEMO-'+(i+1),flow:def.id,ref:demoRefs[i],applicant:'Maria Garcia',submittedAt:TB.utils.nowET(),nodeOrder:1,approvers:['James Wilson'],status:'pending',priority:'Medium',completedAt:'-',decidedBy:'-',nodeApprovals:[],trail:[],demo:true});
  });
  var source=I.reviewItems;
  I.reviewItems=function(){var rows=source();if(TB.state.portal!=='issuer')return rows;return rows.filter(function(row){return !TB.bankReviews.filter || (I.taskById(row.taskId)||{}).flow===TB.bankReviews.filter;});};
  TB.bankReviews={filter:'',setFilter:function(value){TB.bankReviews.filter=types.some(function(x){return x.id===value;})?value:'';TB.router.render();}};
  var page=TB.router.routes.issuer['/review-center'];
  TB.router.routes.issuer['/review-center']=function(){
    var options='<option value="">'+t('全部类型','All Types')+'</option>'+types.map(function(def){return '<option value="'+def.id+'"'+(TB.bankReviews.filter===def.id?' selected':'')+'>'+TB.text(def.name)+'</option>';}).join('');
    return '<div class="filter-bar"><label for="bank-review-type">'+t('审核类型','Review Type')+'</label><select id="bank-review-type" class="form-input" style="width:240px" onchange="TB.bankReviews.setFilter(this.value)">'+options+'</select></div>'+page()+'<p class="form-hint">'+t('此处为 Bison Bank 内部审核。示例编号 DEMO 的任务用于演示审核操作，不执行真实铸币或销币；Bison Group 产品审核和 TokenBank IT 审核保持独立。','These are Bison Bank internal reviews. DEMO tasks demonstrate approval actions and do not execute real minting or burning. Bison Group product review and TokenBank IT review remain independent.')+'</p>';
  };
  var detail=I.viewApprovalDetail;
  I.viewApprovalDetail=function(id){var task=I.taskById(id);if(!task || !I.flowById(task.flow))return;return detail(id);};
  var decide=I.confirmDecide;
  I.confirmDecide=function(id,decision){
    var task=I.taskById(id),u=TB.state.user;
    if(task && types.some(function(x){return x.id===task.flow;})){
      var acc=u && TB.data.accounts.find(function(a){return a.email===u.email;});
      if(!u || TB.state.portal!=='issuer' || u.portal!=='issuer' || (acc && (acc.status!=='active' || (Array.isArray(acc.perms) && acc.perms.indexOf('review.handle')<0))))return;
      if(['approved','returned','rejected'].indexOf(decision)<0)return;
    }
    return decide(id,decision);
  };
})();
