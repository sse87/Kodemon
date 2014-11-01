# Kodemon

Kodemon - Project 3 in T-514-VEFT, Vefþjónustur, 2014-3

## Setup

### mongoDB - [website](http://www.mongodb.org)

install and run:
```
sudo apt-get install mongodb

sudo mongod
```
*if says that port is not available then run this code before run mongod again*
```
sudo service mongoodb stop
```

### elasticsearch - [website](http://www.elasticsearch.org)

download, extract and run:
```
wget https://download.elasticsearch.org/elasticsearch/elasticsearch/elasticsearch-1.3.4.tar.gz

tar xzvf elasticsearch-1.3.4.tar.gz

cd elasticsearch-1.3.4

bin/elasticsearch
```
*good to change cluster name in config/elasticsearch.yml*


### Kodemon

after cloning, install dependency and run
```
npm install

node index.js
```

nice to use nodemon when developing, so install and run index.js using nodemon
```
sudo apt-get install nodemon

node_modules/nodemon/bin/nodemon.js index.js
```





## Basic idea

TODO

