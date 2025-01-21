Define SRVROOT "/Apache2"

ServerRoot "${SRVROOT}"

Listen 5050

ServerName www.inventory.com:5050

<Directory />
    AllowOverride none
    Require all denied
</Directory>

DocumentRoot "/home/pi/LeopardSealRebooted"
<Directory "/home/pi/LeopardSealRebooted">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>
