/* Product approval handoff: Bank creation → Group product review → TokenBank IT. */
(function(){
  var t = function(zh,en){ return TB.state.lang === 'zh' ? zh : en; };
  TB.data.series.forEach(function(s){
    s.issuer = 'Bison Group'; s.quoteProvider = 'Bison Group';
    if(s.status === 'approving') s.reviewStage = 'group';
  });
  var submit = TB.pages.issuer.submitIssuance;
  TB.pages.issuer.submitIssuance = function(){
    var prior = TB.data.series.map(function(s){return s.id;});
    submit();
    TB.data.series.forEach(function(s){
      if(s.status === 'approving' && (!s.reviewStage || prior.indexOf(s.id) < 0)){
        s.reviewStage = 'group'; s.issuer = 'Bison Group'; s.quoteProvider = 'Bison Group';
      }
    });
  };
  function page(stage){
    var title = stage === 'group' ? t('发行产品审核','Issuance Product Review') : t('IT 审核','IT Review');
    return TB.utils.contentHeader(title)
      + '<p class="text-muted mb-3">'+t('Bison Bank 创建并提交 → Bison Group 产品审核 → TokenBank IT 审核 → 上架。退回后由 Bank 修改并重新提交。','Bison Bank submits → Bison Group reviews → TokenBank IT reviews → Listing. Returned products go back to Bank for revision.')+'</p>'
      + TB.ui.table({columns:[
        {key:'id',label:TB.t('lbl.seriesId')}, {key:'name',label:TB.t('lbl.productName')},
        {key:'issuer',label:TB.t('lbl.issuer')},
        {key:'reviewStage',label:t('当前节点','Current Stage'),render:function(){return title;}},
        {key:'actions',label:TB.t('actions'),render:function(s){return '<button class="btn btn-sm" onclick="TB.pages.issuer.openSeriesRow(\''+s.id+'\')">'+t('详情','Details')+'</button> <button class="btn btn-sm btn-primary" onclick="TB.productReview.decide(\''+s.id+'\',true)">'+t('通过','Approve')+'</button> <button class="btn btn-sm" onclick="TB.productReview.decide(\''+s.id+'\',false)">'+t('退回','Return')+'</button>';}}
      ],data:TB.data.series.filter(function(s){return s.status === 'approving' && s.reviewStage === stage;})});
  }
  TB.productReview = {decide:function(id,approve){
    var s = TB.data.series.find(function(x){return x.id === id;});
    var stage = TB.state.portal === 'group' ? 'group' : TB.state.portal === 'ops' ? 'it' : null;
    if(!s || !stage || s.status !== 'approving' || s.reviewStage !== stage) return;
    if(!approve){
      TB.ui.modal({title:t('退回产品','Return Product'),body:TB.ui.formField({label:t('退回原因','Reason'),name:'product_return_reason',type:'textarea',required:true}),footer:'<button class="btn btn-primary" onclick="TB.productReview.returnProduct(\''+id+'\')">'+t('确认退回','Confirm Return')+'</button>'});return;
    }
    s.reviewHistory = s.reviewHistory || [];
    s.reviewHistory.push({stage:stage,decision:'approved',user:TB.state.user.name,time:TB.utils.nowET()});
    s.reviewStage = stage === 'group' ? 'it' : 'listed';
    if(stage === 'it') s.status = 'open';
    TB.utils.toast(stage === 'group' ? t('已转交 TokenBank IT 审核','Sent to TokenBank IT review') : t('IT 审核通过，产品已上架','IT approved; product listed'),'success');TB.router.render();
  },returnProduct:function(id){
    var reason = document.getElementById('product_return_reason').value.trim();
    if(!reason){TB.utils.toast(t('请填写退回原因','Enter a return reason'),'error');return;}
    var s = TB.data.series.find(function(x){return x.id === id;});
    var stage = TB.state.portal === 'group' ? 'group' : TB.state.portal === 'ops' ? 'it' : null;
    if(!s || !stage || s.reviewStage !== stage) return;
    s.returnReason = reason;s.status = 'draft';s.reviewStage = null;
    TB.ui.closeModal();TB.router.render();
  }};
  TB.router.routes.group['/product-review'] = function(){return page('group');};
  TB.router.routes.ops['/series-review'] = function(){return page('it');};
})();
