# LeopardSealRebooted
#### this is a new version of leopard seal made from parts of the POE.html file and the old database.py file. It uses python to interface with a sqlite3 database. The python file is running on a Flask server, and then the vanila website (html, css, javascript) sends queries to the flask server to send and receive data to the db.

## How to run
### 1. Clone repository and open in VSCode
#### -You know how to do this :)
### 2. Make sure all required software is installed
#### -in VSCode, open terminal, and make sure you are in the directory where the repository is stored
##### run 'pip install flask' to install Flask
##### run 'pip show flask' to confirm installation
##### run 'pip install flask-cors' to install Flask CORS
##### run 'pip show flask-cors' to confirm installation
#### -in VSCode, navigate to extensions and install 'Live Server' Extension
### 3. Run Flask server
#### -in the terminal run 'python app.py'
#### you should see "* Serving Flask app 'app'", some IP adresses, and a Debugger pin
### 4. Launch Website
#### -in the explorer open the 'templates' folder and open 'index.html'
#### -in the bottom right click 'Go Live'
#### -the website should open in your browser. If it shows some folders, cliick on 'templates' and the website should open




#ignore
sudo chown -R root:www-data <filename>