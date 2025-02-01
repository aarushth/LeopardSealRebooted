import sqlite3
from sys import *
import datetime
from flask import Flask, jsonify, request, send_from_directory, Response
from flask_cors import CORS
import urllib.request
import os, shutil

app = Flask(__name__)
CORS(app)


def getConn():
    my_db = 'test.db'
    conn = sqlite3.connect(my_db)
    return conn
    
@app.route('/')
def index():
    return send_from_directory(app.template_folder, 'index.html')

@app.route('/init', methods=['POST'])
def init():
    conn = getConn()
    cur =  conn.cursor()
    #items table
    cur.execute("""SELECT * FROM sqlite_master WHERE type='table' AND name='item';""")
    fetch =  cur.fetchall()
    if(fetch == []):
        print("creating items table")
        cur.execute("""create table item (
                            barcode        VARCHAR,
                            name        TINYTEXT,
                            description        TEXT,
                            quantity        INTEGER,
                            boxcode        VARCHAR,
                            image           VARCHAR,
                            time      DATETIME,
                            vers         INTEGER
                            
                            );""") 

    #box table
    cur.execute("""SELECT * FROM sqlite_master WHERE type='table' AND name='box';""")
    fetch =  cur.fetchall()
    if(fetch == []):
        print("creating box table")
        cur.execute("""create table box (
                            barcode        VARCHAR,
                            name           TINYTEXT, 
                            volume        INTEGER CHECK(volume < 101),
                            size        TINYTEXT CHECK(size IN ('Small','Medium','Large','XLarge','Bag','Bucket','None','Other') ),
                            locationcode        VARCHAR,
                            itemcode           VARCHAR,
                            image          TEXT,
                            time          DATETIME,
                            vers             INTEGER
                            
                            );""") 

    #location table 
    cur.execute("""SELECT * FROM sqlite_master WHERE type='table' AND name='location';""")
    fetch =  cur.fetchall()
    if(fetch == []):
        print("creating location table")
        cur.execute("""create table location (
                            barcode        VARCHAR,
                            name            TINYTEXT,
                            description        TEXT,
                            boxcode           VARCHAR,
                            image        TEXT,
                            time          DATETIME,
                            vers             INTEGER
                            );""") 
    conn.commit()
    return "Action completed!", 200

@app.route('/quit', methods=['POST'])
def quit():
    conn = getConn()
    print("quit")
    conn.close()
    return "Action completed!", 200

#if you want to change the structure of the db call this then change the code and rerun the constructor
@app.route('/reset', methods=['POST'])
def reset_database():
    conn = getConn()
    cur =  conn.cursor()
    print("reset db")
    cur.execute("""DROP table item""")
    cur.execute("""DROP table box""")
    cur.execute("""DROP table location""")
    conn.commit()
    folder = 'images'
    for filename in os.listdir(folder):
        file_path = os.path.join(folder, filename)
        try:
            if os.path.isfile(file_path) or os.path.islink(file_path):
                os.unlink(file_path)
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)
        except Exception as e:
            print('Failed to delete %s. Reason: %s' % (file_path, e))
    return "Action completed!", 200

@app.route('/print', methods=['GET'])
def print_out():
    conn = getConn()
    cur =  conn.cursor()
    cur.execute("""SELECT * FROM item """)
    fetch1 =  cur.fetchall()
    # print("items table")
    
    cur.execute("""SELECT * FROM box """)
    fetch2 =  cur.fetchall()
    # print("box table")
    # print(fetch)
    cur.execute("""SELECT * FROM location """)
    fetch3 =  cur.fetchall()
    # print("location table")
    # print(fetch)
    # return "items:\n" + str(fetch1) + "\nboxes:\n" + str(fetch2) + "\nlocations:\n" + str(fetch3)
    return Response("items:\n" + str(fetch1) + "\nboxes:\n" + str(fetch2) + "\nlocations:\n" + str(fetch3), content_type='text/plain')


@app.route('/write_item', methods=['POST'])
def write_item():
    data = request.get_json()
    conn = getConn()
    cur =  conn.cursor()
    fetch = pull_item_internal(data['barcode'])
    vers = 0
    if(fetch['vers'] != ""):
        vers = data['vers']
    if(data['boxcode'] != fetch['boxcode']):
        add_box_itemcode(fetch['boxcode'], data['barcode'])
        if(fetch['boxcode'] != ''):
            remove_box_itemcode(fetch['boxcode'], data['barcode'])
    
    if(data['imageChange'] == 'y'):
        response = urllib.request.urlopen(data['image'])
        imUrl = f"/images/I{data['barcode']}_vers{vers}.jpg"
        with open(imUrl[1:], 'wb') as f:
            f.write(response.file.read())
    else:
        if(fetch["image"] == ""):
            imUrl = data["image"]
        else:
            imUrl = fetch["image"]

    timestamp = datetime.datetime.now()
    
    cur.execute('''INSERT INTO item VALUES (?, ?, ?, ?, ?, ?, ?, ?) ''', [data['barcode'], data['name'], data['description'], data['quantity'], data['boxcode'],  imUrl, timestamp, vers+1]) 
    conn.commit()
    return "Action completed!", 200

@app.route('/write_box', methods=['POST'])
def write_box():
    data = request.get_json()
    conn = getConn()
    cur =  conn.cursor()
    fetch = pull_box_internal(data['barcode'])
    vers = 0
    if(fetch['vers'] != ""):
        vers = fetch['vers']
    if(data['locationcode'] != fetch['locationcode']):
       add_location_boxcode(data['locationcode'], data['barcode'])
       if(fetch['locationcode'] != ''):
            remove_location_boxcode(fetch['locationcode'], data['barcode'])
    
    if(data['imageChange'] == 'y'):
        response = urllib.request.urlopen(data['image'])
        imUrl = f"/images/B{data['barcode']}_vers{vers}.jpg"
        with open(imUrl[1:], 'wb') as f:
            f.write(response.file.read())
    else:
        if(fetch["image"] == ""):
            imUrl = data["image"]
        else:
            imUrl = fetch["image"]

    timestamp = datetime.datetime.now()
    
    cur.execute('''INSERT INTO box VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ''', [data['barcode'], data['name'], data['volume'], data['size'], data['locationcode'], data['itemcode'], imUrl, timestamp, vers+1])
    conn.commit()
    return "Action completed!", 200

def add_box_itemcode(code, itemcode):
    fetch =  pull_box_internal(code)
    vers = 0
    if(fetch['vers'] != ""):
        vers = fetch['vers']
    timestamp = datetime.datetime.now()
    conn = getConn()
    cur = conn.cursor()
    cur.execute('''INSERT INTO box VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ''', [code, fetch['name'], fetch['volume'], fetch['size'], fetch['locationcode'], fetch['itemcode']+f',{itemcode}', fetch['image'], timestamp, vers+1])
    conn.commit()
    return 

def remove_box_itemcode(code, itemcode):
    fetch =  pull_box_internal(code)
    vers = 0
    if(fetch['vers'] != ""):
        vers = fetch['vers']
    timestamp = datetime.datetime.now()
    conn = getConn()
    cur = conn.cursor()
    
    itemcodes = fetch['itemcode'].split(",")
    itemcodes.remove(str(itemcode))
    fincodes = ",".join(itemcodes)

    if(itemcode[len(itemcode)-1]==' '):
        itemcode = itemcode[:len(itemcode)-1]
    cur.execute('''INSERT INTO box VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ''', [code, fetch['name'], fetch['volume'], fetch['size'], fetch['locationcode'], fincodes, fetch['image'], timestamp, vers+1])
    conn.commit()
    return 

@app.route('/write_location', methods=['POST'])
def write_location():
    data = request.get_json()
    # print(data) 
    conn = getConn()
    cur =  conn.cursor()
    # cur.execute(f"""SELECT MAX(vers) FROM location WHERE barcode='{data['barcode']}';""")
    fetch = pull_location_internal(data['barcode'])
    vers = 0
    if(fetch['vers'] != ""):
        vers = fetch['vers']
    
    # print(data['image'])
    if(data['imageChange'] == 'y'):
        response = urllib.request.urlopen(data['image'])
        imUrl = f"/images/L{data['barcode']}_vers{vers}.jpg"
        with open(imUrl[1:], 'wb') as f:
            f.write(response.file.read())
    else:
        if(fetch["image"] == ""):
            imUrl = data["image"]
        else:
            imUrl = fetch["image"]

    timestamp = datetime.datetime.now()
    
    cur.execute('''INSERT INTO location VALUES (?, ?, ?, ?, ?, ?, ?) ''', [data['barcode'], data['name'], data['description'], data['boxcode'], imUrl, timestamp, vers+1])
    conn.commit()
    return "Action completed!", 200

def add_location_boxcode(code, boxcode):
    fetch =  pull_location_internal(code)
    vers = 0
    if(fetch['vers'] != ""):
        vers = fetch['vers']
    timestamp = datetime.datetime.now()
    conn = getConn()
    cur = conn.cursor()
    cur.execute('''INSERT INTO location VALUES (?, ?, ?, ?, ?, ?, ?) ''', [code, fetch['name'], fetch['description'], fetch['boxcode']+f',{boxcode}', fetch['image'], timestamp, vers+1])
    conn.commit()
    return 

def remove_location_boxcode(code, boxcode):
    fetch =  pull_location_internal(code)
    vers = 0
    if(fetch['vers'] != ""):
        vers = fetch['vers']
    timestamp = datetime.datetime.now()
    conn = getConn()
    cur = conn.cursor()
    
    boxcodes = fetch['boxcode'].split(",")
    boxcodes.remove(str(boxcode))
    fincodes = ",".join(boxcodes)
    cur.execute('''INSERT INTO location VALUES (?, ?, ?, ?, ?, ?, ?) ''', [code, fetch['name'], fetch['description'], fincodes, fetch['image'], timestamp, vers+1])
    conn.commit()
    return 



def pull_item_internal(code, vers=None):
    conn = getConn()
    cur =  conn.cursor()
    if(vers == None):
        cur.execute(f"""SELECT * FROM item WHERE barcode='{code}' AND vers = (SELECT MAX(vers) FROM item WHERE barcode='{code}');""")
    else:
        cur.execute(f"""SELECT * FROM item WHERE barcode='{code}' AND vers = '{vers}';""")
    fetch = cur.fetchone()
    if(fetch != None):
        response = {"barcode": fetch[0],
                    "name": fetch[1],
                    "description": fetch[2],
                    "quantity": fetch[3],
                    "boxcode": fetch[4],
                    "image": fetch[5],
                    "time": fetch[6],
                    "vers": fetch[7]}
    else:
        response = {"barcode": "",
                    "name": "",
                    "description": "",
                    "quantity": "",
                    "boxcode": "",
                    "image": "",
                    "time": "",
                    "vers": ""}
    return response

@app.route('/pull_item/<code>')
def pull_item(code)->tuple:
    return jsonify(pull_item_internal(code)), 200



def pull_box_internal(code, vers=None):
    conn = getConn()
    cur =  conn.cursor()
    if(vers == None):
        cur.execute(f"""SELECT * FROM box WHERE barcode='{code}' AND vers = (SELECT MAX(vers) FROM box WHERE barcode='{code}');""")
        
    else:
        cur.execute(f"""SELECT * FROM box WHERE barcode='{code}' AND vers = '{vers}';""")
    fetch = cur.fetchone()
    if(fetch != None):
        response = {"barcode": fetch[0],
                    "name": fetch[1],
                    "volume": fetch[2],
                    "size": fetch[3],
                    "locationcode": fetch[4],
                    "itemcode": fetch[5],
                    "image": fetch[6],
                    "time": fetch[7],
                    "vers": fetch[8]}
    else:
        response = {"barcode": "",
                    "name": "",
                    "volume": "",
                    "size": "",
                    "locationcode": "",
                    "itemcode": "",
                    "image": "",
                    "time": "",
                    "vers": ""}
    return response

@app.route('/pull_box/<code>')
def pull_box(code):
    return jsonify(pull_box_internal(code)), 200



def pull_location_internal(code, vers=None):
    
    conn = getConn()
    cur =  conn.cursor()
    if(vers == None):
        cur.execute(f"""SELECT * FROM location WHERE barcode='{code}' AND vers = (SELECT MAX(vers) FROM location WHERE barcode='{code}');""")
    else:
        cur.execute(f""" SELECT * FROM location WHERE barcode='{code}' AND vers='{vers}'; """)
    fetch = cur.fetchone()
    if(fetch != None):
        response = {"barcode": fetch[0],
                    "name": fetch[1],
                    "description": fetch[2],
                    "boxcode": fetch[3],
                    "image": fetch[4],
                    "time": fetch[5],
                    "vers": fetch[6]}
    else:
        response = {"barcode": "",
                    "name": "",
                    "description": "",
                    "boxcode": "",
                    "image": "",
                    "time": "",
                    "vers": ""}
    return response

@app.route('/pull_location/<code>')
def pull_location(code):
    return jsonify(pull_location_internal(code)), 200



@app.route('/pull_all_locations')
def pull_all_locations():
    conn = getConn()
    cur =  conn.cursor()
    cur.execute(f"""SELECT DISTINCT barcode FROM location""")
    fetch =  cur.fetchall()
    response = {"locations":[]}
    for code in fetch:
        response["locations"].append(pull_location_internal(code[0]))
    return jsonify(response), 200

@app.route('/pull_all_boxes')
def pull_all_boxes():
    conn = getConn()
    cur =  conn.cursor()
    cur.execute(f"""SELECT DISTINCT barcode FROM box""")
    fetch = cur.fetchall()
    response = {"boxes":[]}
    for code in fetch:
        response["boxes"].append(pull_box_internal(code[0]))
    return jsonify(response), 200

@app.route('/pull_all_items')
def pull_all_items():
    conn = getConn()
    cur =  conn.cursor()
    cur.execute(f"""SELECT DISTINCT barcode FROM item""")
    fetch = cur.fetchall()
    response = {"items":[]}
    for code in fetch:
        response["items"].append(pull_item_internal(code[0]))
    return jsonify(response), 200



@app.route('/pull_item_history/<code>')
def pull_item_history(code):
    conn = getConn()
    cur =  conn.cursor()
    cur.execute(f""" SELECT vers FROM item WHERE barcode='{code}' ORDER BY vers DESC;""")
    fetch =  cur.fetchall()
    response = {"items":[]}
    for item in fetch:
        response["items"].append(pull_item_internal(code, item[0]))
    return jsonify(response), 200

@app.route('/pull_box_history/<code>')
def pull_box_history(code):
    conn = getConn()
    cur =  conn.cursor()
    cur.execute(f""" SELECT vers FROM box WHERE barcode='{code}' ORDER BY vers DESC;""")
    fetch = cur.fetchall()
    response = {"boxes":[]}
    for item in fetch:
        response["boxes"].append(pull_box_internal(code, item[0]))
    return jsonify(response), 200

@app.route('/pull_location_history/<code>')
def pull_location_history(code):
    conn = getConn()
    cur =  conn.cursor()
    cur.execute(f""" SELECT vers FROM location WHERE barcode='{code}' ORDER BY vers DESC;""")
    fetch = cur.fetchall()
    response = {"locations":[]}
    for item in fetch:
        response["locations"].append(pull_location_internal(code, item[0]))
    return jsonify(response), 200


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5502) 