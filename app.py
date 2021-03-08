from flask import Flask, render_template, request, session ,url_for,redirect,flash ,logging ,jsonify,json
from flask_mail import Mail, Message
import sqlite3 as sql
from functools import wraps
from datetime import date,time,datetime,timedelta
import calendar
import random



#from passlib.hash import sha256_crypt

app = Flask(__name__)
DATABASE ='/mdn1.db'
app.secret_key = b'_5#y2L"F4Q8z\n\xec]/'

app.config['MAIL_SERVER']='smtp.gmail.com'
app.config['MAIL_PORT'] = 465
app.config['MAIL_USERNAME'] = 'procalendar.mehrdad@gmail.com'
app.config['MAIL_PASSWORD'] = 'Nasrin@1234'
app.config['MAIL_USE_TLS'] = False
app.config['MAIL_USE_SSL'] = True
mail = Mail(app)



def send_email(email_address,message_body,subjects):
    msg = Message(subjects, sender = 'procalendar.mehrdad@gmail.com', recipients = [email_address])
    msg.body = message_body
    mail.send(msg)
    return



@app.route('/')
def home():
    return render_template('home1.html')

def is_logged_in(f):
    @wraps(f)
    def wrap(*args, **kwargs):
        if 'logged_in' in session:
            return f(*args, **kwargs)
        else:
            #flash( Please login')
            return redirect(url_for('no'))
    return wrap


@app.route('/register')
def ne():
    return render_template('register.html',msg='')#chang with flash 
@app.route('/aduser', methods=['POST','GET'])
def adduser():
    if request.method =='POST':
        try:
            uname=request.form['uname']
            psw=request.form['psw']
            iemail=request.form['iemail']
            lname=request.form['lname']
            fname=request.form['fname']
            print(uname +","+ psw +","+ fname +","+lname+","+iemail)
            with sql.connect("mdn1.db") as con:
                cur=con.cursor()
                cur.execute('INSERT INTO users(username,password,email,lname,fname)\
                             VALUES (?,?,?,?,?)', (uname,psw,iemail,lname,fname))
                con.commit()
                msg=''
        except:
            con.rollback()
            msg = 'error in insertion'
        finally:
            con.close()
            if msg=='' :
                #return render_template('account.html',username =uname)
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


    


#login
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


##dashboard
@app.route('/doshbord')
@is_logged_in
def dashboard():   
    con=sql.connect("mdn1.db")
    con.row_factory =dict_factory
    cur=con.cursor()
    cur.execute("select * from users where username = ?",(session['username'],))
    user = cur.fetchall()
    con.close()
    return render_template('index.html',user = user)


## month calendar MVC 
@app.route('/month_calendar',methods = ['POST','GET'])
@is_logged_in
def month_calendar():
#   if method != 'POST" return redirect 
    data_rec=json.loads(request.form['data'])   
    month = data_rec['month']
    year = data_rec['year']
    fd = data_rec['first_day']
    week_name={0:'MONDAY',1:'TUESDAY',2:'WEDNESDAY',3:'THURSDAY',4:'FRIDAY',5:'SATURDAY',6:'SUNDAY'}
    j,month_name=0,{}
    for i in calendar.month_name:
      month_name[j]=i
      j+=1
#this is first day of week 0=monday 6=sunday 5=saturday 
    c=calendar.Calendar(firstweekday=fd)
#make a dictionay for month names
    j,month_name=0,{}
    for i in calendar.month_name:
      month_name[j]=i
      j+=1
#make proper month header for day
    month_header=month_name[month]+" "+str(year)
#make proper week header (at first i made a dictionary but the dicide to make a list)
    week_header=[]
    for i in c.iterweekdays():
      week_header.append(week_name[i])  
#make day_header {0:{name:28,cur:c}}  p/c/n are the posible value for cur
# maybe we want to show them in another style
# the day headr must be a list of 42 objects (not 35 or 28 because T'anna design 42 div )
    #current_month=d.month
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
   
    rej=7 if day_header[-1]['cur']=='n'else 0
    j=42-len(day_header)+rej
    y=year+1 if month==12 else year
    for i in c.itermonthdays3(y,next_month):
        j-=1
        rej -=1
        if rej>=0 :
            continue
        k={}
        k['cur']='n'  
        k['name']= month_name[i[1]]+" 1" if i[2]==1 else i[2]
        k['id'] = date(i[0],i[1],i[2]).strftime('%Y-%m-%d')
        day_header.append(k)
        if j==0 :
            break
   
    # make day_event this is a list which it contains 42 list of event bjects 
    con=sql.connect("mdn1.db")
    con.row_factory =dict_factory
    cur=con.cursor()
    uname=session['username']
    day_event=[]
    for i in day_header:
        day_id = i['id'] 
        cur.execute("select eventname ,color, start,eventID  from event where username = ?\
        and date = ? order by start",(uname,day_id))
        day_event.append(cur.fetchall())
    con.close()    
    data={'month_header':month_header,'week_header':week_header,'day_header':day_header,'day_event':day_event}
    return {'data':data}


    



##logout
@app.route('/logout')
@is_logged_in
def logout():
    session.clear()
    #flash
    return redirect('/login')



#checkuser
@app.route('/usercheck',methods = ['POST','GET']) 
@is_logged_in 
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
        print(checkReq['iemail'])
        print(a)
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
       timedelta(minutes=1)
       requestTime += timedelta(minutes=1)
       print(requestTime)
       return  'ok'  
    if checkReq['flag'] == 'rndcode':
        code= int(checkReq['code'])
        allPass = datetime.now() < requestTime and code == rndNum
        print (allPass)
        return{'pass': allPass }
    
## for del and edit and add events

@app.route('/edit_event', methods = ['POST','GET'])
@is_logged_in
def edit_event():
    jsd = json.loads(request.form['id'])
    con=sql.connect("mdn1.db")
    cur=con.cursor()
    print(jsd)

    if(jsd['st'] =='edit' or jsd['st'] =='add'):
        name,address=jsd['name'],jsd['address']
        uname=session['username']
        date=jsd['date']
        start=jsd['start']
        end=jsd['end']
        color=jsd['color']
        print(name,address,uname,date,start,end,color)
    if (jsd['st'] =='edit'):
        event_id=int(jsd['ido'])
        cur.execute('UPDATE event SET eventname=?,address=?,username=?,date=?,\
                    start=?,end=?,color=? WHERE eventID=?',(name,address,uname,date,start,end,color,event_id))
          
   
    if (jsd['st']=='add'):
        cur.execute('INSERT INTO event(eventname,address,username,date,start,end,color)\
                    VALUES (?,?,?,?,?,?,?)',(name,address,uname,date,start,end,color))
        ##for send email
        con.commit()
        cur.row_factory= dict_factory
        cur.execute('SELECT * FROM users WHERE username=?',(uname,))
        a=cur.fetchall()
        email=a[0]['email']
        fname=a[0]['fname']
        subjects='PRO-Calendar You Add an event'
        message_body= 'Hello '+fname+', \n We add an event to you pro_calendar.\n The deitel is:\n EVENT NAME:\t'\
        +name+'\n ADDRESS:\t'+address+'\n Event Date:\t'+str(date)+'\n Start Time:\t'+str(start)\
        +'\n End Time:\t'+str(end)+'\n \n Pro-claenar team'
        
        send_email(email,message_body,subjects)
    
    if (jsd['st']=='del'):
        a=int(jsd['ido'])
        cur.execute('DELETE FROM event WHERE eventID = ?;',(a,))
     
    con.commit()
    con.close()
    con=sql.connect("mdn1.db")
    con.row_factory =dict_factory
    cur=con.cursor()
    
    cur.execute("select * from event where username = ? and date = ? Order by date,start;",(session['username'],date))
    events =cur.fetchall()
    con.close()
    day_data={'day_event':events,'day_id':date}
    return {'day_data':day_data}


 


def dict_factory(cursor, row):
    d = {}
    for indx, col in enumerate(cursor.description):
            d[col[0]] = row[indx]
    return d


if '__name__'=='__main__':
    
    app.run(debug=True)