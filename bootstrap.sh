#!/bin/bash

# repos
apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10 2> /dev/null
echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | tee /etc/apt/sources.list.d/mongodb.list
add-apt-repository -y ppa:chris-lea/node.js-devel 2> /dev/null

# init
apt-get update 2> /dev/null
apt-get install -y build-essential libssl-dev monit unzip vim curl ntp redis-server mongodb-org 2> /dev/null

# ntp
service ntp restart

# install ngrok
wget -qO /tmp/ngrok.zip https://dl.ngrok.com/linux_386/ngrok.zip
unzip /tmp/ngrok.zip
mv ngrok /usr/local/bin/ngrok

# configure monit
cat <<EOF > /etc/monit/conf.d/ngrok
set httpd port 5150 and
    use address localhost
    allow localhost

set daemon 30
#with start delay 5

check process ngrok matching "/usr/local/bin/ngrok"
    start program = "/bin/bash -c '2>&1 1>>/var/log/ngrok.log /usr/local/bin/ngrok -log=stdout 3000'"
    stop program = "/usr/bin/killall ngrok"
EOF

# restart monit service
service monit restart
sleep 2
monit monitor all

# install node
apt-get install -y nodejs=0.11.* 2> /dev/null
npm install -g nodemon 2> /dev/null

# set vim tabs
cat <<EOF > /home/vagrant/.vimrc
set tabstop=4
EOF
chown vagrant.vagrant /home/vagrant/.vimrc

adjs=("autumn hidden bitter misty silent empty dry dark summer icy delicate quiet white cool spring winter patient twilight dawn crimson wispy weathered blue billowing broken cold damp falling frosty green long late lingering bold little morning muddy old red rough still small sparkling throbbing shy wandering withered wild black young holy solitary fragrant aged snowy proud floral restless divine polished ancient purple lively nameless")
nouns=("waterfall river breeze moon rain wind sea morning snow lake sunset pine shadow leaf dawn glitter forest hill cloud meadow sun glade bird brook butterfly bush dew dust field fire flower firefly feather grass haze mountain night pond darkness snowflake silence sound sky shape surf thunder violet water wildflower wave water resonance sun wood dream cherry tree fog frost voice paper frog smoke star")
adj=($adjs)
noun=($nouns)
num_adjs=${#adj[*]}
num_nouns=${#noun[*]}

# print ngrok on login
if grep --quiet LOCAL_BASE_URL /home/vagrant/.profile; then
echo "Using existing .profile settings"
else
cat <<EOF >> /home/vagrant/.profile
export DEV_KEY="${adj[$((RANDOM%num_adjs))]}-${noun[$((RANDOM%num_nouns))]}-$((RANDOM%10000))"
export LOCAL_BASE_URL=\`grep "Tunnel established" /var/log/ngrok.log | tail -1 | sed 's/.*Tunnel established at //g'\`
echo -e "\n\e[1mTunnel established at \${LOCAL_BASE_URL}\e[0m\n"
echo "Run 'cd project && npm run web-dev' to start your add-on."
echo
EOF
fi

# install project node_modules
su - vagrant
cd /home/vagrant/project
npm install 2> /dev/null

# install git
apt-get -y install git 2> /dev/null

# install bunyan
#npm install -g bunyan 2> /dev/null

# install bower
npm install -g bower 2> /dev/null