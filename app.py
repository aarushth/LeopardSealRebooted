import os
import sqlite3
import sys
from sys import *
import datetime
from flask import Flask, jsonify, request, send_from_directory, Response
from flask_cors import CORS

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
                            barcode        VARCHAR primary key,
                            name        TINYTEXT,
                            description        TEXT,
                            quantity        INTEGER,
                            boxcode        VARCHAR,
                            image           VARCHAR,
                            times      DATETIME,
                            vers         INTEGER
                            
                            );""") 

    #box table
    cur.execute("""SELECT * FROM sqlite_master WHERE type='table' AND name='box';""")
    fetch =  cur.fetchall()
    if(fetch == []):
        print("creating box table")
        cur.execute("""create table box (
                            barcode        VARCHAR primary key,
                            name           TINYTEXT, 
                            volume        INTEGER CHECK(volume < 101),
                            size        TINYTEXT CHECK(size IN ('Small','Medium','Large','XLarge','Bag','Bucket','None','Other') ),
                            locationcode        VARCHAR,
                            itemcode           VARCHAR,
                            times          DATETIME,
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
                            times          DATETIME,
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
    return "Action completed!", 200

@app.route('/print')
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

@app.route('/write_item/<code>/<name>/<description>/<quantity>/<boxCodes>/<imageAddress>/<newBoxVol>', methods=['POST'])
def write_item(code, name, description, quantity, boxCodes, imageAddress, newBoxVol):
    conn = getConn()
    cur =  conn.cursor()
    cur.execute(f"""SELECT MAX(vers) FROM item WHERE barcode='{code}';""")
    fetch =  cur.fetchone()
    vers = 0
    if(fetch[0] != None):
        vers = fetch[0]
    
    timestamp = datetime.datetime.now()
    
    cur.execute('''INSERT INTO item VALUES (?, ?, ?, ?, ?, ?, ?, ?) ''', [code, name, description, quantity, boxCodes, imageAddress, timestamp, vers+1])
    
    codes = boxCodes.split(",")
    for cod in codes:
        cur.execute(f"""SELECT * FROM box WHERE barcode='{cod}' AND vers = (SELECT MAX(vers) FROM box WHERE barcode='{cod}');""")
        fetch =  cur.fetchall()
        
        for box in fetch:
            itemCodes = box[4]
            if(code not in itemCodes):
                itemCodes += "," + code
            cur.execute('''INSERT INTO box VALUES (?, ?, ?, ?, ?, ?, ?) ''', [box[0], box[1], newBoxVol, box[3], box[4], itemCodes, timestamp, box[7]+1])
    conn.commit()
    return "Action completed!", 200

@app.route('/write_box/<code>/<name>/<size>/<locationCode>/<itemcodes>', methods=['POST'])
def write_box(code, name, volume, size, locationCode, itemcodes):
    conn = getConn()
    cur =  conn.cursor()
    cur.execute(f"""SELECT MAX(vers) FROM box WHERE barcode='{code}';""")
    fetch =  cur.fetchone()
    vers = 0
    if(fetch[0] != None):
        vers = fetch[0]
    
    timestamp = datetime.datetime.now()
    
    cur.execute('''INSERT INTO box VALUES (?, ?, ?, ?, ?, ?, ?) ''', [code, name, volume, size, locationCode, itemcodes, timestamp, vers+1])
    
    
    cur.execute(f"""SELECT * FROM location WHERE barcode='{locationCode}' AND vers = (SELECT MAX(vers) FROM location WHERE barcode='{locationCode}');""")
    fetch =  cur.fetchall()
        
    boxCodes = fetch[2]
    if(code not in boxCodes):
        boxCodes += "," + code
    cur.execute('''INSERT INTO location VALUES (?, ?, ?, ?, ?, ?) ''', [fetch[0], fetch[1], fetch[2], boxCodes,  timestamp, fetch[5]+1])
    conn.commit()
    return "Action completed!", 200

@app.route('/write_location/<code>/<name>/<description>/<boxCodes>', methods=['POST'])
def write_location(code, name, description, boxCodes):
    conn = getConn()
    cur =  conn.cursor()
    cur.execute(f"""SELECT MAX(vers) FROM location WHERE barcode='{code}';""")
    fetch =  cur.fetchone()
    vers = 0
    if(fetch[0] != None):
        vers = fetch[0]
    
    timestamp = datetime.datetime.now()
    
    cur.execute('''INSERT INTO location VALUES (?, ?, ?, ?, ?, ?) ''', [code, name, description, boxCodes, timestamp, vers+1])
    conn.commit()
    return "Action completed!", 200

@app.route('/pull_item/<code>')
def pull_item(code)->tuple:
    conn = getConn()
    cur =  conn.cursor()
    cur.execute(f"""SELECT * FROM item WHERE barcode='{code}' AND vers = (SELECT MAX(vers) FROM item WHERE barcode='{code}');""")
    fetch =  cur.fetchone()
    if(fetch != None):
        return fetch
    return ("", "", "", "", "", "", "", "")

@app.route('/pull_box/<code>')
def pull_box(code)->tuple:
    conn = getConn()
    cur =  conn.cursor()
    cur.execute(f"""SELECT * FROM box WHERE barcode='{code}' AND vers = (SELECT MAX(vers) FROM box WHERE barcode='{code}');""")
    fetch =  cur.fetchone()
    if(fetch != None):
        return fetch
    return ("", "", "", "", "", "", "", "")

def pull_location_internal(code):
    conn = getConn()
    cur =  conn.cursor()
    cur.execute(f"""SELECT * FROM location WHERE barcode='{code}' AND vers = (SELECT MAX(vers) FROM location WHERE barcode='{code}');""")
    return cur.fetchone()

@app.route('/pull_location/<code>')
def pull_location(code) ->tuple:
    fetch = pull_location_internal(code)
    if(fetch != None):
        response = {"barcode": fetch[0],
                    "name": fetch[1],
                    "description": fetch[2],
                    "boxcode": fetch[3],
                    "time": fetch[4],
                    "vers": fetch[5]}
    else:
        response = {"barcode": "",
                    "name": "",
                    "description": "",
                    "boxcode": "",
                    "time": "",
                    "vers": ""}
    return jsonify(response), 200

@app.route('/pull_all_locations')
def pull_all_locations():
    conn = getConn()
    cur =  conn.cursor()
    cur.execute(f"""SELECT DISTINCT barcode FROM location""")
    fetch =  cur.fetchall()
    response = {"locations":[]}
    for code in fetch:
        location = pull_location_internal(code[0])
        response["locations"].append({"barcode": location[0],
                    "name": location[1],
                    "description": location[2],
                    "boxcode": location[3],
                    "time": location[4],
                    "vers": location[5]})
    return jsonify(response),200

@app.route('/pull_all_boxes')
def pull_all_boxes():
    conn = getConn()
    cur =  conn.cursor()
    cur.execute(f"""SELECT DISTINCT barcode FROM box""")
    fetch = cur.fetchall()
    output = []
    for code in fetch:
        output.append(pull_item(code[0]))
    return output

@app.route('/pull_all_items')
def pull_all_items(self):
    conn = getConn()
    cur =  conn.cursor()
    cur.execute(f"""SELECT DISTINCT barcode FROM item""")
    fetch = cur.fetchall()
    output = []
    for code in fetch:
        output.append(pull_item(code[0]))
    return output

@app.route('/pull_item_history/<code>')
def pull_item_history(code)->list[tuple]:
    conn = getConn()
    cur =  conn.cursor()
    cur.execute(f""" SELECT * FROM item WHERE barcode='{code}' ORDER BY vers DESC;""")
    return cur.fetchall()

@app.route('/pull_box_history/<code>')
def pull_box_history(code)->list[tuple]:
    conn = getConn()
    cur =  conn.cursor()
    cur.execute(f""" SELECT * FROM box WHERE barcode='{code}' ORDER BY vers DESC;""")
    return  cur.fetchall()

@app.route('/pull_location_history/<code>')
def pull_location_history(code)->list[tuple]:
    conn = getConn()
    cur =  conn.cursor()
    cur.execute(f""" SELECT * FROM location WHERE barcode='{code}' ORDER BY vers DESC;""")
    fetch = cur.fetchall()
    response = {"locations":[]}
    for item in fetch:
        print(item)
        response["locations"].append({"barcode": item[0],
                    "name": item[1],
                    "description": item[2],
                    "boxcode": item[3],
                    "time": item[4],
                    "vers": item[5]})
    return jsonify(response),200


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5502) 