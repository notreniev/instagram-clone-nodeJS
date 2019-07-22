var express = require("express");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var objectId = require("mongodb").ObjectId;
var multiparty = require("connect-multiparty");
var fs = require("fs");

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(multiparty());
app.use(function(req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    res.setHeader("Access-Control-Allow-Credentials", true);
    next();
});

var port = 8080;

app.listen(port);

var db = new mongodb.Db(
    'instagram',
    new mongodb.Server('localhost', 27017, {}), {}
);

console.log('Servidor HTTP está online e escutando na porta ' + port);

app.get('/', function(req, res) {
    res.send({
        msg: 'Olá'
    });
});

app.post('/api', function(req, res) {

    var dados = req.body;
    var date = new Date();
    time_stamp = date.getTime();

    var urlImagem = time_stamp + '_' + req.files.arquivo.originalFilename;
    var pathOrigem = req.files.arquivo.path;
    var pathDestino = './uploads/' + urlImagem;

    fs.rename(pathOrigem, pathDestino, function(err) {
        if (err) {
            res.status(500).json({
                error: err
            });
            return;
        }

        var dados = {
            urlImagem: urlImagem,
            titulo: req.body.titulo
        };

        db.open(function(err, mongoClient) {
            mongoClient.collection('postagens', function(err, collection) {
                collection.insert(dados, function(err, result) {
                    if (err) {
                        res.status(res.statusCode).json({
                            'status': {
                                'erro': err
                            }
                        });
                    } else {
                        res.status(200).json({
                            'status': 'Inclusão realizada com sucesso!'
                        });
                    }
                    mongoClient.close();
                });
            });
        });
    });
});

app.get('/api', function(req, res) {
    var dados = req.body;

    db.open(function(err, mongoClient) {
        mongoClient.collection('postagens', function(err, collection) {
            collection.find().toArray(function(err, results) {
                if (err) {
                    res.json(err);
                } else {
                    res.status(200).json(results);
                }
                mongoClient.close();
            });
        });
    });
});

app.get('/api/:id', function(req, res) {
    var dados = req.body;

    db.open(function(err, mongoClient) {
        mongoClient.collection('postagens', function(err, collection) {
            collection.find(objectId(req.params.id)).toArray(function(err, results) {
                if (err) {
                    res.json(err);
                } else {
                    res.status(200).json(results);
                }
                mongoClient.close();
            });
        });
    });
});

app.get('/imagens/:images', function(req, res) {

    var img = req.params.images;

    fs.readFile('./uploads/' + img, function(err, content) {
        if (err) {
            res.status(400).json(err);
            return;
        }

        res.writeHead(200, { 'content-type': 'image/jpg' });
        res.end(content);
    });
});

app.put('/api/:id', function(req, res) {
    db.open(function(err, mongoClient) {
        mongoClient.collection('postagens', function(err, collection) {
            collection.update({
                    _id: objectId(req.params.id)
                }, {
                    $push: {
                        comentarios: { id_comentario: new objectId(), comentario: req.body.comentario }
                    }
                }, {},
                function(err, results) {
                    if (err) {
                        res.json(err);
                    } else {
                        res.status(200).json(results);
                    }
                    mongoClient.close();
                }
            );
        });
    });
});

app.delete('/api/:id', function(req, res) {
    db.open(function(err, mongoClient) {
        mongoClient.collection('postagens', function(err, collection) {
            collection.update({}, { $pull: { comentarios: { id_comentario: objectId(req.params.id) } } }, { multi: true },
                function(err, results) {
                    if (err) {
                        res.json(err);
                    } else {
                        res.status(200).json(results);
                    }
                    mongoClient.close();
                }
            );
        });
    });
});