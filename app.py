from flask import Flask, render_template, request, session , url_for, redirect, flash, logging, jsonify, json
from flask_mail import Mail, Message
from flask_apscheduler import APScheduler
from threading import Thread
import sqlite3 as sql
from functools import wraps
from datetime import date, time, datetime, timedelta
import calendar
import random
import time


app = Flask(__name__)


DATABASE ='/mdn1.db'
app.secret_key = b'_5#y2L"F4Q8z\n\xec]/'


# this part for scheduler
scheduler = APScheduler()# scheduler object for reminder email
scheduler.init_app(app) # init it whit app
scheduler.start() # start to work


# this part for email sender 
app.config['MAIL_SERVER']='smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USERNAME'] = 'procalendar.mehrdad@gmail.com'
app.config['MAIL_PASSWORD'] = 'Nasrin@1234'
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True
mail = Mail(app)


def async_send_mail(app, msg):
    with app.app_context():
        mail.send(msg)

        


def send_email(email_address, message_body, subjects):
    msg = Message(subjects, sender = 'procalendar.mehrdad@gmail.com', recipients = [email_address])
    msg.body = message_body
    thr = Thread(target=async_send_mail, args=[app, msg])
    thr.start()
    return thr




@app.route('/')
def home():
    return render_template('home1.html')




def is_logged_in(f):
    @wraps(f)
    def wrap(*args, **kwargs):
        if 'logged_in' in session:
            return f(*args, **kwargs)
        else:
            return redirect(url_for('no'))
    return wrap



@app.route('/register')
def ne():
    return render_template('register.html',msg='')#chang with flash 




@app.route('/aduser', methods=['POST','GET'])
def adduser():
    if request.method =='POST':
        uname=request.form['uname']
        psw=request.form['psw']
        iemail=request.form['iemail']
        lname=request.form['lname']
        fname=request.form['fname']
        ViewSet={'first_day':6,'timeInterval':60,'viewLy':'month'}
        ViewSet=json.dumps(ViewSet)
        print(ViewSet)
        print(uname +","+ psw +","+ fname +","+lname+","+iemail+","+ ViewSet)
        try:
            with sql.connect("mdn1.db") as con:
                cur=con.cursor()
                cur.execute('INSERT INTO users(username,password,email,lname,fname,ViewSet) VALUES (?,?,?,?,?,?)', (uname,psw,iemail,lname,fname,ViewSet))
                con.commit()
                cur.execute('INSERT INTO groups(name,username,color,showG) VALUES (?,?,?,?) ',(uname,uname,'#8080ff',True))            
                con.commit()
                msg=''
        except:
            con.rollback()
            msg = 'error in insertion'
        finally:
            con.close()
            if msg=='' :
                subjects='Welcome to Pro-Calendar '
                message_body=f"Hello {fname},\n You are a Proclander   "
                email_address=iemail
                send_email(iemail,message_body,subjects)
                return redirect('/login')
            else:
                print(msg)
                return render_template('register.html',msg = msg)
    else:
        return     




@app.route('/login')
def no():
    return render_template('login.html',msg='')#change with flash 




@app.route('/login1', methods=['POST','GET'])
def logi():
    if request.method =='POST':
        uname=request.form['uname']
        psw=request.form['psw']
        con=sql.connect("mdn1.db")
        con.row_factory = sql.Row
        cur=con.cursor()
        cur.execute("select password from users where username = ?",(uname,))
        retrive=cur.fetchall()
        con.close()
        if len(retrive)>0 :
            if retrive[0]['password'] == psw :
               session['logged_in'] = True
               session['username'] = uname 
            # print("ok"+ str(retrive[0]['password']))
               return redirect(url_for('dashboard')) 
            else :
                error ='invalid login'
                print(error)                
                return render_template('login.html',msg = error)
        else :
            error ='username not found'
            return render_template('login.html',msg = error)
    else :
        return                




@app.route('/dashboard')
@is_logged_in
def dashboard():   
    time.sleep(0.1)
    con=sql.connect("mdn1.db")
    con.row_factory =dict_factory
    cur=con.cursor()
    cur.execute("select username , email, lname, fname, ViewSet from users where username = ?",(session['username'],))
    global user 
    global groups
    user=cur.fetchall()[0]
    user['ViewSet']=json.loads(user['ViewSet'])
    cur.execute("select * from groups where username = ?",(session['username'],))
    groups=cur.fetchall()
    con.close()
    if user['ViewSet']['viewLy']=='week':
        return render_template('weekly.html', user=user)
    if user['ViewSet']['viewLy']=='year':
        return render_template('yearly.html', user=user)
    if user['ViewSet']['viewLy']=='day':
        return render_template('daily.html', user=user)
    if user['ViewSet']['viewLy']=='account':
        return render_template('account.html', user=user)
    return render_template('monthly.html', user=user)




@app.route('/month_calendar', methods = ['POST','GET'])
@is_logged_in
def month():  
    data_rec=json.loads(request.form['data'])   
    month = data_rec['month']
    year = data_rec['year']
    dayToV =data_rec['dayToV']
    global ViewSet
    global user
    ViewSet = data_rec['ViewSet']
    user['ViewSet'] = ViewSet
    fd=int(ViewSet['first_day'])
    week_header,week_abbr,month_name,month_abbr,c = calendName(fd)
    month_header=month_name[month]+" "+str(year)
    # make day_header {0:{name:28,cur:c}}  p/c/n are the posible value for cur
    # maybe we want to show them in another style
    next_month=((month)%12)+1
    pre_month=((month-2)%12)+1 
    day_header=[]
    for i in c.itermonthdays3(year,month):
        k={}
        if i[1]==month:
            k['cur']='c'
        elif  i[1]==next_month:
            k['cur']='n'
        else:
            k['cur']='p'  
        k['name']= month_name[i[1]]+" 1" if i[2]==1 else i[2]
        k['id'] = date(i[0],i[1],i[2]).strftime('%Y-%m-%d')
        day_header.append(k)   
    # make day_event this is a list which it contains 42 list of event bjects 
    con=sql.connect("mdn1.db")
    con.row_factory =dict_factory
    cur=con.cursor()
    uname=session['username']
    day_event=[]
    for i in day_header:
        day_id = i['id'] 
        cur.execute("select event.eventname ,groups.color, event.start,event.eventID \
        from event natural join groups where groups.showG=1 and \
            event.date =? and event.username=? order by event.start",(day_id,uname))
        day_event.append(cur.fetchall())
    con.close()  
    data = {'month_header':month_header, 'week_header':week_header, 'user':user, 'day_header':day_header, 'day_event':day_event, 'groups':groups}
    return {'data':data}




@app.route('/week_calendar',methods = ['POST','GET'])
@is_logged_in
def week():
    data_rec=json.loads(request.form['data'])   
    month = data_rec['month']
    year = data_rec['year']
    dayToV = data_rec['dayToV']
    global ViewSet
    global user
    ViewSet = data_rec['ViewSet']
    user['ViewSet']=ViewSet
    fd=int(ViewSet['first_day'])
    week_header,week_abbr,month_name,month_abbr,c = calendName(fd)
    j=0
    for i in c.itermonthdays4(year,month):
        if (i[1]==month and i[2]==dayToV):
            break
        j+=1
    st=(j//7)*7
    wekk=[]
    for i in c.itermonthdays4(year,month):
        if(st<=0 and st>-7):
            hd=month_abbr[i[1]]+' '+str(i[2])
            wekk.append({'week_head':hd, 'id':date(i[0],i[1],i[2]).strftime('%Y-%m-%d'), 'weekS':week_abbr[i[3]] + ' ' + hd})
        st-=1
    if wekk[0]['week_head'].split(' ')[0]==wekk[-1]['week_head'].split(' ')[0]:
        head_cal_week=wekk[0]['week_head'] + '-' + wekk[-1]['week_head'].split(' ')[1] + ', ' + wekk[-1]['id'].split('-')[0]
    else:
        head_cal_week=wekk[0]['week_head'] + '-' + wekk[-1]['week_head'] + ', ' + wekk[-1]['id'].split('-')[0]
    print(wekk)
    k=ViewSet['timeInterval']
    t1= datetime(2020,2,2,0,0)
    td=timedelta(minutes=ViewSet['timeInterval'])
    con=sql.connect("mdn1.db")
    con.row_factory =dict_factory
    cur=con.cursor()
    uname=session['username']
    time_header=[]
    time_event=[]
    for i in range(0,1440,k):
        ta=t1.strftime('%H:%M')
        time_header.append(ta)
        tb= (t1+td).strftime('%H:%M')
        for j in wekk:
            cur.execute("select event.eventname , groups.color, event.eventID \
            from event natural join groups where groups.showG=1 and  event.date =? \
            and event.username=? and ((event.start >= ? and event.start < ? ) or \
            (event.endt > ? and  event.endt <= ?) or ( event.start <= ? and  ? < event.endt))\
            order by event.start",(j['id'],uname,ta,tb,ta,tb,ta,ta))
            time_event.append(cur.fetchall())
        t1+=td
    con.close()  
    data = {'head_cal_week':head_cal_week, 'wekk':wekk, 'user':user, 'time_header':time_header, 'time_event':time_event, 'groups':groups}
    return {'data':data}




def calendName(fd):
    week_name={0:'MONDAY', 1:'TUESDAY', 2:'WEDNESDAY', 3:'THURSDAY', 4:'FRIDAY', 5:'SATURDAY', 6:'SUNDAY'}
    month_name=[]
    for i in calendar.month_name:
        month_name.append(i)
    month_abbr=[]
    for i in calendar.month_abbr:
        month_abbr.append(i)
    # this is first day of week 0=monday 6=sunday 5=saturday 
    c=calendar.Calendar(firstweekday=fd)
    # make proper week header (to make a list)
    week_header=[]
    for i in c.iterweekdays():
        week_header.append(week_name[i]) 
    # make week abbr
    week_abbr=[]
    for i in calendar.day_abbr:
        week_abbr.append(i) 
    return week_header,week_abbr,month_name,month_abbr,c




@app.route('/logout')
@is_logged_in
def logout():
    session.clear()
    return redirect('/login')




@app.route('/usercheck',methods = ['POST','GET']) 
def checkuser():
    con=sql.connect("mdn1.db")
    cur=con.cursor()
    checkReq=json.loads(request.form['checkReq'])
    if checkReq['flag'] == 'uname':
        cur.row_factory= dict_factory
        cur.execute('SELECT * FROM users WHERE username=?',(checkReq['uname'],))
        a=cur.fetchall()
        con.close()
        return {'pass':(len(a)==0 )}
    if checkReq['flag'] == 'iemail':
        cur.row_factory= dict_factory
        cur.execute('SELECT * FROM users WHERE email=?',(checkReq['iemail'],))
        a=cur.fetchall()
        con.close()
        return {'pass':(len(a)==0 )}
    if checkReq['flag'] == 'validemail':
       global rndNum
       rndNum=random.randint(100000,999999) 
       print(rndNum)
       email=checkReq['email']
       uname=checkReq['username']
       subjects='PRO-Calendar email validation'
       message_body= 'Hello '+uname+', \n Please Enter this validation code to active your account\t'\
       + str(rndNum)+ '\n \n Pro-claenar team'
       send_email(email,message_body,subjects)
       global requestTime 
       requestTime = datetime.now()
       print(requestTime) 
       requestTime += timedelta(minutes=1)
       print(requestTime)
       return  'ok'  
    if checkReq['flag'] == 'rndcode':
        code= int(checkReq['code'])
        allPass = datetime.now() < requestTime and code == rndNum
        return{'pass': allPass }




@app.route('/edit_event', methods = ['POST','GET'])
@is_logged_in
def edit_event():
    jsd = json.loads(request.form['id'])
    con=sql.connect("mdn1.db")
    cur=con.cursor()
    if(jsd['st'] =='editEv' or jsd['st'] =='addEv'):
        name,address=jsd['name'],jsd['address']
        uname=session['username']
        date=jsd['date']
        start=jsd['start']
        endt=jsd['endt']
        groupID =jsd['groupID']
        reminder=jsd['reminder']
        if (jsd['st'] =='edit'):
            event_id=int(jsd['ido'])
            cur.execute('UPDATE event SET eventname=?, address=?, username=?, date=?, start=?, endt=?, group=? reminder=? WHERE eventID=?', (name, address, uname, date, start, endt, groupID, reminder, event_id))
            scheduler.remove_job(str(event_id))
        if (jsd['st']=='addEv'):
            cur.execute('INSERT INTO event(eventname, address, username, date, start, endt, groupID, reminder)\VALUES (?,?,?,?,?,?,?,?)', (name, address, uname, date, start, endt, groupID, reminder))
            email=user['email']
            fname=user['fname']
            subjects='PRO-Calendar You Add an event'
            message_body= 'Hello' + fname + ',\n You add an event to your pro_calendar.\n The detail is:\n EVENT NAME:\t'\
             + name + '\n ADDRESS:\t' + address + '\n Event Date:\t' + str(date) + '\n Start Time:\t' + str(start)\
             + '\n End Time:\t' + str(endt) + '\n\n Pro-claenar team'
            send_email(email,message_body,subjects)
        if (jsd['st']=='delEv'):
            a=int(jsd['ido'])
            cur.execute('DELETE FROM event WHERE eventID = ?;',(a,))
            scheduler.remove_job(str(a))
    con.commit()
    con.close()
    con=sql.connect("mdn1.db")
    con.row_factory =dict_factory
    cur=con.cursor()
    if jsd['st']=='delEv':  #for delete mw should .........???
        date='2021-03-02'
    cur.execute("select * from event where username = ? and date = ? Order by date,start;",(session['username'],date))
    events =cur.fetchall()
    #add_sch is not in proper place
    add_sch(events,user)    
    con.close()
    day_data={'day_event':events,'day_id':date}
    return {'day_data':day_data}




@app.route('/edit_group', methods = ['POST','GET'])
@is_logged_in
def edit_group():
    jsd = json.loads(request.form['id'])
    con=sql.connect("mdn1.db")
    cur=con.cursor()
    if(jsd['st'] =='editGr' or jsd['st'] =='addGr'):
        name,color=jsd['name'],jsd['color']
        uname,showG=session['username'],True    
    if (jsd['st'] =='editGr'):
        groupID=int(jsd['groupID'])
        cur.execute('UPDATE groups SET name=?,color=?,username=?,showG=? WHERE groupID=?',(name,color,uname,showG,groupID))
    if (jsd['st']=='addGr'):
        cur.execute('INSERT INTO groups(name,username,color,showG) VALUES (?,?,?,?)',(name,uname,color,showG))
        # for send email
        con.commit()
        cur.row_factory= dict_factory
        cur.execute('SELECT * FROM groups WHERE username=?',(uname,))
        a=cur.fetchall()
    if (jsd['st']=='showChange'):        
        cur.execute('UPDATE groups SET showG=? WHERE groupID=?',(jsd['showG'],int(jsd['id'])))
    if (jsd['st']=='delGr'):
        a=int(jsd['id'])
        cur.execute('DELETE FROM groups WHERE groupID = ?;',(a,))
    if (jsd['st']=='save_user'):
        global user
        user=jsd['user']
        lname=user['lname']
        fname=user['fname']
        ViewSet=user['ViewSet']
        ViewSet=json.dumps(ViewSet)
        uname=user['username']
        print(ViewSet)
        print(uname)
        cur.execute('UPDATE users SET lname=?,fname=?, ViewSet=? WHERE username=?',(lname,fname,ViewSet,uname))
    con.commit()
    con.close()
    con=sql.connect("mdn1.db")
    con.row_factory =dict_factory
    cur=con.cursor()
    cur.execute("select * from groups where username = ?",(session['username'],))
    global groups
    groups =cur.fetchall()
    con.close()
    return 'ok'




def add_sch(events, user):
    for event in events :
        ind= event['reminder']
        if ind==0 :
            return
        time_before={1:0,2:5,3:15,4:30,5:60,6:120,7:1440,8:1080}
        delta=timedelta(minutes=time_before[ind])
        if ind==8 :
            delta=timedelta(days=7)
        d=event['date']+' '+event['start']
        r_d=datetime.strptime(d,'%Y-%m-%d %H:%M')
        r_d=r_d -delta
        e_id=str(event['eventID'])
        scheduler.add_job(func=scheduled_task, trigger='date', run_date=r_d,args=[event,user,e_id], id=e_id)
    return




def scheduled_task(event, user, e_id):
    message_body=user['fname'] + ', you have an upcomming event\n on ' + event['date'] + ' ,at ' + event['start'] + '\n\
    The event name is ' + event['eventname'] + '\n\n pro-calendar team'
    subjects='reminder'
    print(event['eventID'])
    send_email(user['email'],message_body,subjects)
    return




def dict_factory(cursor, row):
    d = {}
    for indx, col in enumerate(cursor.description):
            d[col[0]] = row[indx]
    return d




if '__name__'=='__main__':
    app.run(debug=True)