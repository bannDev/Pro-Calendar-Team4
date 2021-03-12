    // collapsible menu sections
    // collapsible menu sections
    var coll= document.getElementsByClassName("collapsible");
    for (var i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function() {
            this.classList.toggle("active");
            var content = this.nextElementSibling;
            if (content.style.display === "block") {
                content.style.display = "none";
            } else {
                content.style.display = "block";
            }
        });
    }
   
    var user
    var groups
    var today= new Date();
    var month=today.getMonth();
    var year=today.getFullYear();
    var day =new Date(today.getTime() - (today.getTimezoneOffset() * 60000 )).toISOString().split('T')[0]
    var first_day=6  //it causes the first day of week to become Sunday  
    $(document).ready(function(){
        month=today.getMonth();
        year=today.getFullYear();
        view();
        
        })
   
   // here I add an event lisinter for first day of week   
    $("[name='first_day']").click(function() {s=($(this).val());first_day=parseInt(s); view();});
    // we should to save all setting parameters such as theme, first_day of week ,.. on back_end database 
    //after complete this part on front_end I will code for it
    
    function view(){
        var data={'first_day':first_day ,'month':month+1 , 'year':year}
        myJSON = JSON.stringify(data);
        $.post("/month_calendar",{'data': myJSON},function(resp){
            user=resp.data.user
            groups=resp.data.groups
            month_header=resp.data.month_header
            week_header=resp.data.week_header
            day_header=resp.data.day_header
            day_event=resp.data.day_event
            $('.col-5').html('<h1>'+month_header+'</h1>')
            for (i in week_header){
                $('.day').eq(i).html(week_header[i])
            }
            //adjust the number of rows to show
            m=$('[class|="grid-col"]').length
            n=day_header.length
            for(i=0; i<m-n;i++){$('[class|="grid-col"]').eq(6).remove()}
            for(i=0 ; i<n-m ; i++){$('[class|="grid-col"]').eq(0).after($('[class|="grid-col"]').eq(7).clone())}
              
                   
            for (i in day_header){
                e=$('.date').eq(i)
                e.html(day_header[i].name)
                e.attr('id',day_header[i].id)
                if (day==day_header[i].id) {e.parent().css('border','3px outset red')}
                else {e.parent().css('border','')}
                if (day_header[i].cur == 'c'){e.css("color", "#111111"); continue}
                if (day_header[i].cur == 'n'){e.css("color", "#7fbf7f")}
                else{e.css("color" ,"#7f7fbf")}
            }
            for (i in day_event){
                e=$('.event-area').eq(i)
                e.empty();
                for (j in day_event[i]){ for (k in groups){ 
                    if (day_event[i][j].groupID !=groups[k].groupID){continue}
                    if (!(groups[k].show)) {continue}
                    e.append("<span style='background-color:"+groups[k].color+"'>"+day_event[i][j].eventname+"</span><br>")    
                    }
                }
            }
            e=$('[id|="group"]').eq(0);  m=$('[id|="grList"]').eq(0); 
            $('[id|="group"]').remove();   $('[id|="grList"]').remove()
            
            for (i in groups){
                gr=groups[i];
                gop ='grList-'+gr.groupID.toString();
                gdiv ='group-'+ gr.groupID.toString();
                e=e.clone();e.attr('id',gdiv);e.children().eq(1).attr('value',gr.name)
                e.children().eq(2).val(gr.color);e.children().eq(0).prop("checked",gr.show);
                $('#addGr').before(e);
                m=m.clone();m.attr('id',gop);m.css('background-color',gr.color)
                m.val(gr.groupID);m.html(gr.name); $('#group_list').append(m) 
               
            }
            
            if (groups.length<2){ $('[name=delGroup]').hide()}
            //$('#group_list').val(groups[0].name)
            
            $('#group_list').css('background-color',groups[0].color)
            
        }) }
    
    function forward(){
        month ++
        if (month>11){ month=0; year ++}
        view() }

    function back(){
        month --
        if (month<0){ month=11; year --}
        view()   }
    
        
   function checkEvent(){
       var a= ($('#start').val()=="")||($('#end').val()=="")||($('#date').val()=="")||($('#title').val()=="")
       //add some code to check overlaping time ,....
       if (a) {alert ('some fild doesnt fill'); return}
       $('#addEventBtn').prop('disabled',true)
       title=$('#title').val(); address=$('#descr').val() ; date=$('#date').val()
       start=$('#start').val(); end=$('#end').val();groupID=$('#group_list').val()
       var send={'st':'addEv','name':title , 'address':address ,'date':date ,'start':start,'end':end,'groupID':groupID}
           myJSON = JSON.stringify(send);
           $.post( "/edit_event", {'id': myJSON},function(data){
                for (i in day_header){
                    if (day_header[i].id==data.day_data.day_id){
                        day_event.splice(i,0,data.day_data.day_event)
                    }
                }
                $('#addEventBtn').prop('disabled',false)
                view()  
            })               
   }
   function addGroup(){
   if ($('#addGroup').html()=='New Group'){
        $('[name=delGroup]').hide('slow')
        $('[name=edGroup]').hide('slow')
        $('#addGroup').html('Add')
        $('[id |="addG"]').show('slow')
    }
    else{ 
        if ($('#addG-Name').val()==""){$('#noGroup').show('slow') ;return}else{$('#noGroup').hide('slow')}
        $('#addGroup').attr('disabled',true)
        gname=$('#addG-Name').val()
        gcolor=$('#addG-Color').val()
        var send={'st':'addGr','name':gname , 'color':gcolor }
        myJSON = JSON.stringify(send);
        $.post( "/edit_group", {'id': myJSON},function(data){ 
            adcGrCancel()
            view()
            $('#addGroup').attr('disabled',false)
        })

        
    
    }

   }
   function adcGrCancel(){
    $('[name=delGroup]').show()
    $('[name=edGroup]').show()
    $('#addGroup').html('New Group')
    $('[id |="addG"]').hide('slow')
    $('#noGroup').hide()        
   }
   function editGroup(e){m='#'+e.parentElement.id
        eb=$(m +'>[name="edGroup"]')
        if (eb.html()=='Edit'){
            $('[name=showG]').hide()
            $('[name=delGroup]').hide()
            $('[name=edGroup]').hide()
            eb.html('DONE');eb.show()
            $('#addGroup').hide()
            $('#'+e.parentElement.id).children().attr('disabled',false)
            }
        else{ 
            if ($(m+'>[name="nameG"]').val()==""){$('#noGroup').show('slow');return}
            else{$('#noGroup').hide('slow')}
            gname=$(m+'>[name="nameG"]').val()
            gcolor=$(m+'>[name="colorG"]').val()
            groupID=e.parentElement.id.slice(6,)
        var send={'st':'editGr','name':gname , 'color':gcolor,'groupID':groupID }
        myJSON = JSON.stringify(send);
        $.post( "/edit_group", {'id': myJSON},function(data){ 
            adcGrCancel()
            view()
            $('#addGroup').show()
            $('[name=showG]').show()
        })
    } return
   }
   function delGroup(e){m=e.parentElement.id.slice(6,)
    var send={'st':'delGr','id':m }
        myJSON = JSON.stringify(send);
        $.post( "/edit_group", {'id': myJSON},function(data){view()})
   }
   function changroup(){for (i in groups){
       if(groups[i].groupID==$('#group_list').val()){
           $('#group_list').css('background-color',groups[i].color)}
   }}
   function changeshow(e){m=e.parentElement.id.slice(6,)
    show=e.checked;
    var send={'st':'showChange','id':m ,'show':show }
        myJSON = JSON.stringify(send);
        $.post( "/edit_group", {'id': myJSON},function(data){view()})
    }
   