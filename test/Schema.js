'use strict';

//var util = require('util');

var dynamoose = require('../');
var errors = require('../lib/errors');

dynamoose.AWS.config.update({
  accessKeyId: 'AKID',
  secretAccessKey: 'SECRET',
  region: 'us-east-1'
});

dynamoose.local();

var Schema = dynamoose.Schema;

var should = require('should');

describe('Schema tests', function (){
  this.timeout(10000);

  it('Simple schema', function (done) {
    var schemaObj = {
      id: Number,
      name: String,
      children: [Number],
      aObject: Object,
      aArray: Array,
      aMap: {
        mapId: Number,
        mapName: String,
        anotherMap: {
          m1:String,
        }
      },
      aList: [
        {
          listMapId: Number,
          listMapName: String
        }
      ]
    };

    var schema = new Schema(schemaObj);

    schema.attributes.id.type.name.should.eql('number');
    should(schema.attributes.id.isSet).not.be.ok;
    should.not.exist(schema.attributes.id.default);
    should.not.exist(schema.attributes.id.validator);
    should(schema.attributes.id.required).not.be.ok;

    schema.attributes.name.type.name.should.eql('string');
    schema.attributes.name.isSet.should.not.be.ok;
    should.not.exist(schema.attributes.name.default);
    should.not.exist(schema.attributes.name.validator);
    should(schema.attributes.name.required).not.be.ok;

    schema.attributes.children.type.name.should.eql('number');
    schema.attributes.children.isSet.should.be.ok;
    should.not.exist(schema.attributes.children.default);
    should.not.exist(schema.attributes.children.validator);
    should(schema.attributes.children.required).not.be.ok;

    schema.attributes.aObject.type.name.should.eql('object');

    schema.attributes.aArray.type.name.should.eql('array');

    schema.attributes.aMap.type.name.should.eql('map');

    schema.attributes.aList.type.name.should.eql('list');

    schema.hashKey.should.equal(schema.attributes.id); // should be same object
    should.not.exist(schema.rangeKey);

    schema.throughput.read.should.equal(1);
    schema.throughput.write.should.equal(1);

    done();
  });

  it('Schema with basic options', function (done) {
    var schema = new Schema({
      id: {
        type: Number,
        validate: function(v) { return v > 0; },
        rangeKey: true
      },
      breed: {
        type: String,
        hashKey: true
      },
      name: {
        type: String,
        required: true
      },
      color: {
        type: String,
        default: 'Brown'
      },
      born: {
        type: Date,
        default: Date.now
      },
      aObject: {
        type: 'Object',
        default: { state: 'alive' }
      },
      aMap: {
        type: 'map',
        map: {
          mapId: {type: Number, required:true },
          mapName: {type: String, required:true }
        }
      },
      aList: {
        type: 'list',
        list: [
          {
            listMapId: {type: Number, default: 1},
            listMapName: {type: String, default:'SomeName'}
          }
        ]
      }
    }, {throughput: {read: 10, write: 2}, useDocumentTypes: false, useNativeBooleans: false});

    schema.attributes.id.type.name.should.eql('number');
    should(schema.attributes.id.isSet).not.be.ok;
    should.not.exist(schema.attributes.id.default);
    var validator = schema.attributes.id.validator;
    should.exist(validator);
    validator(-1).should.not.be.ok;
    validator(1).should.be.ok;
    should(schema.attributes.id.required).not.be.ok;

    schema.attributes.name.type.name.should.eql('string');
    schema.attributes.name.isSet.should.not.be.ok;
    should.not.exist(schema.attributes.name.default);
    should.not.exist(schema.attributes.name.validator);
    schema.attributes.name.required.should.be.ok;

    schema.attributes.color.type.name.should.eql('string');
    schema.attributes.color.isSet.should.not.be.ok;
    schema.attributes.color.default().should.eql('Brown');
    should.not.exist(schema.attributes.color.validator);
    should(schema.attributes.color.required).not.be.ok;

    schema.attributes.born.type.name.should.eql('date');
    schema.attributes.born.isSet.should.not.be.ok;
    schema.attributes.born.default().should.be.ok;
    should.not.exist(schema.attributes.born.validator);
    should(schema.attributes.born.required).not.be.ok;

    schema.attributes.aObject.type.name.should.eql('object');
    should.exist(schema.attributes.aObject.default);

    schema.attributes.aMap.type.name.should.eql('object');

    schema.attributes.aList.type.name.should.eql('array');

    schema.hashKey.should.equal(schema.attributes.breed); // should be same object
    schema.rangeKey.should.equal(schema.attributes.id);

    schema.throughput.read.should.equal(10);
    schema.throughput.write.should.equal(2);

    done();
  });

  it('Schema with ttl default options', function (done) {
    var schema = new Schema(
      {
        id: Number,
        name: String
      },
      {
        expires: 30*24*60*60 // 30 days in seconds
      }
    );

    should.exist(schema.expires);
    should.exist(schema.expires.ttl);
    schema.expires.ttl.should.be.equal(30*24*60*60);
    should.exist(schema.expires.attribute);
    schema.expires.attribute.should.be.equal('expires');
    done();
  });

  it('Schema with ttl options', function (done) {
    var schema = new Schema(
      {
        id: Number,
        name: String
      },
      {
        expires: {
          ttl: 30*24*60*60, // 30 days in seconds
          attribute: 'ttl'
        }
      }
    );

    should.exist(schema.expires);
    should.exist(schema.expires.ttl);
    schema.expires.ttl.should.be.equal(30*24*60*60);
    should.exist(schema.expires.attribute);
    schema.expires.attribute.should.be.equal('ttl');
    done();
  });


  it('Schema with timestamps options', function (done) {
    var schema1 = new Schema({
      id: {
        type: Number,
        validate: function(v) { return v > 0; },
        rangeKey: true
      },
      name: {
        type: String,
        required: true
      },
    },
    {
      throughput: {read: 10, write: 2},
      timestamps: true
    });

    var schema2 = new Schema({
      id: {
        type: Number,
        validate: function(v) { return v > 0; },
        rangeKey: true
      },
      name: {
        type: String,
        required: true
      },
    },
    {
      throughput: {read: 10, write: 2},
      timestamps: { createdAt: 'createDate', updatedAt: 'lastUpdate'}
    });


    schema1.attributes.id.type.name.should.eql('number');
    should(schema1.attributes.id.isSet).not.be.ok;
    should.not.exist(schema1.attributes.id.default);
    var validator = schema1.attributes.id.validator;
    should.exist(validator);
    validator(-1).should.not.be.ok;
    validator(1).should.be.ok;
    should(schema1.attributes.id.required).not.be.ok;

    schema1.attributes.name.type.name.should.eql('string');
    schema1.attributes.name.isSet.should.not.be.ok;
    should.not.exist(schema1.attributes.name.default);
    should.not.exist(schema1.attributes.name.validator);
    schema1.attributes.name.required.should.be.ok;

    schema1.rangeKey.should.equal(schema1.attributes.id);

    schema1.throughput.read.should.equal(10);
    schema1.throughput.write.should.equal(2);
    //
    // Schema1 timestamps validation
    //
    should.exist(schema1.timestamps);
    should.exist(schema1.timestamps.createdAt);
    schema1.timestamps.createdAt.should.be.equal('createdAt');
    should.exist(schema1.timestamps.updatedAt);
    schema1.timestamps.updatedAt.should.be.equal('updatedAt');

    schema1.attributes.createdAt.type.name.should.eql('date');
    should.exist(schema1.attributes.createdAt.default);

    schema1.attributes.updatedAt.type.name.should.eql('date');
    should.exist(schema1.attributes.updatedAt.default);
    //
    // Schema2 timestamps validation
    //
    should.exist(schema2.timestamps);
    should.exist(schema2.timestamps.createdAt);
    schema2.timestamps.createdAt.should.be.equal('createDate');
    should.exist(schema2.timestamps.updatedAt);
    schema2.timestamps.updatedAt.should.be.equal('lastUpdate');

    schema2.attributes.createDate.type.name.should.eql('date');
    should.exist(schema2.attributes.createDate.default);

    schema2.attributes.lastUpdate.type.name.should.eql('date');
    should.exist(schema2.attributes.lastUpdate.default);

    done();
  });


  it('Schema with timestamps options that are rangeKey', function () {
    var schema = new Schema({
      id: {
        type: Number,
        hashKey: true
      },
      started_at: {
        type: Number,
        rangeKey: true
      }
    },
    {
      timestamps: {
        createdAt: 'started_at',
        updatedAt: 'updated_at'
      }
    });

    should.exist(schema.attributes.started_at);
    should.exist(schema.attributes.updated_at);
    schema.attributes.started_at.type.name.should.eql('date');
    should.exist(schema.attributes.updated_at.default);
    should.exist(schema.rangeKey);
    schema.rangeKey.should.equal(schema.attributes.started_at);

    //
    // Schema timestamps validation
    //
    should.exist(schema.timestamps);
    should.exist(schema.timestamps.createdAt);
    schema.timestamps.createdAt.should.be.equal('started_at');
    should.exist(schema.timestamps.updatedAt);
    schema.timestamps.updatedAt.should.be.equal('updated_at');
  });


  it('Schema with use Document Types', function (done) {
    var schema = new Schema({
      id: {
        type: Number,
        validate: function(v) { return v > 0; },
        rangeKey: true
      },
      breed: {
        type: String,
        hashKey: true
      },
      aObject: {
        type: 'Object',
        default: { state: 'alive' }
      },
      anotherObject: Object,
      aArray: Array,
      aMap: {
        mapId: Number,
        mapName: String,
        anotherMap:{
          m1:String,
        }
      },
      aList:[
        {
          listMapId: Number,
          listMapName: String
        }
      ],
      anotherMap: {
        type: 'map',
        map: {
          mapId: {type: Number, required:true },
          mapName: {type: String, required:true }
        }
      },
      anotherList: {
        type: 'list',
        list: [
          {
            listMapId: {type: Number, default: 1},
            listMapName: {type: String, default:'SomeName'}
          }
        ]
      }
    });

    schema.useDocumentTypes.should.be.ok;

    schema.attributes.aObject.type.name.should.eql('object');
    schema.attributes.anotherObject.type.name.should.eql('object');
    schema.attributes.aArray.type.name.should.eql('array');

    schema.attributes.aMap.type.name.should.eql('map');

    schema.attributes.aMap.type.name.should.eql('map');
    schema.attributes.aMap.attributes.mapId.type.name.should.eql('number');
    schema.attributes.aMap.attributes.mapName.type.name.should.eql('string');
    should.not.exist( schema.attributes.aMap.attributes.mapId.default);
    should.not.exist( schema.attributes.aMap.attributes.mapId.validator);
    should( schema.attributes.aMap.attributes.mapId.required).not.be.ok;
    schema.attributes.aMap.attributes.anotherMap.attributes.m1.type.name.should.eql('string');

    schema.attributes.anotherMap.attributes.mapId.type.name.should.eql('number');
    schema.attributes.anotherMap.attributes.mapId.required.should.be.ok;
    schema.attributes.anotherMap.attributes.mapName.type.name.should.eql('string');
    schema.attributes.anotherMap.attributes.mapName.required.should.be.ok;

    schema.attributes.aList.type.name.should.eql('list');
    schema.attributes.aList.attributes[0].attributes.listMapId.type.name.should.eql('number');
    schema.attributes.aList.attributes[0].attributes.listMapName.type.name.should.eql('string');

    schema.attributes.anotherList.attributes[0].attributes.listMapId.type.name.should.eql('number');
    schema.attributes.anotherList.attributes[0].attributes.listMapId.default().should.be.ok;
    schema.attributes.anotherList.attributes[0].attributes.listMapName.type.name.should.eql('string');
    schema.attributes.anotherList.attributes[0].attributes.listMapName.default().should.be.ok;

    done();
  });

  it('Schema with use Native Booleans', function (done) {
    var schema = new Schema({
      name: String,
      isAwesome: Boolean
    });

    var Cat = dynamoose.model('Cat' + Date.now(), schema);
    var fluffy = new Cat();

    fluffy.name = 'Fluff Johnson';
    fluffy.isAwesome = true;

    schema.useNativeBooleans.should.be.ok;

    Cat.$__.schema.attributes.isAwesome.type.dynamo.should.eql('BOOL');

    Cat.$__.table.delete(function () {
      delete dynamoose.models.Cat;
      done();
    });

  });

  it('Schema with secondary indexes', function (done) {
    var schema = new Schema({
      ownerId: {
        type: Number,
        validate: function(v) { return v > 0; },
        hashKey: true
      },
      breed: {
        type: String,
        rangeKey: true,
        index: {
          global: true,
          rangeKey: 'color',
          name: 'IdGlobalIndex',
          project: true, // ProjectionType: ALL
          throughput: 5 // read and write are both 5
        }
      },
      name: {
        type: String,
        required: true,
        index: true // name: nameLocalIndex, ProjectionType: ALL
      },
      color: {
        type: String,
        default: 'Brown',
        index: [{ // name: colorLocalIndex
          project: ['name'] // ProjectionType: INCLUDE
        },{ // name: colorGlobalIndex, no ragne key
          global: true,
          project: ['name', 'breed'] // ProjectionType: INCLUDE
        }]
      },
      born: {
        type: Date,
        default: Date.now,
        index: {
          name: 'birthIndex',
          project: false // ProjectionType: KEYS_ONLY
        }
      }
    });

    schema.attributes.ownerId.type.name.should.eql('number');
    should(schema.attributes.ownerId.isSet).not.be.ok;
    should.not.exist(schema.attributes.ownerId.default);
    var validator = schema.attributes.ownerId.validator;
    should.exist(validator);
    validator(-1).should.not.be.ok;
    validator(1).should.be.ok;
    should(schema.attributes.ownerId.required).not.be.ok;

    var breed = schema.attributes.breed;
    breed.type.name.should.eql('string');
    breed.isSet.should.not.be.ok;
    should.not.exist(breed.default);
    should.not.exist(breed.validator);
    should(breed.required).not.be.ok;
    breed.indexes.should.have.property('IdGlobalIndex');
    breed.indexes.IdGlobalIndex.should.have.property('global', true);
    breed.indexes.IdGlobalIndex.should.have.property('project', true);
    breed.indexes.IdGlobalIndex.should.have.property('rangeKey', 'color');
    breed.indexes.IdGlobalIndex.should.have.property('throughput', {read: 5, write: 5});

    var name = schema.attributes.name;
    name.type.name.should.eql('string');
    name.isSet.should.not.be.ok;
    should.not.exist(name.default);
    should.not.exist(name.validator);
    name.required.should.be.ok;
    name.indexes.should.have.property('nameLocalIndex');
    name.indexes.nameLocalIndex.should.not.have.property('global');
    name.indexes.nameLocalIndex.should.have.property('project', true);
    name.indexes.nameLocalIndex.should.not.have.property('rangeKey');
    name.indexes.nameLocalIndex.should.not.have.property('throughput');


    var color = schema.attributes.color;
    color.type.name.should.eql('string');
    color.isSet.should.not.be.ok;
    color.default().should.eql('Brown');
    should.not.exist(color.validator);
    should(color.required).not.be.ok;
    color.indexes.should.have.property('colorLocalIndex');
    color.indexes.colorLocalIndex.should.not.have.property('global');
    color.indexes.colorLocalIndex.should.have.property('project', ['name']);
    color.indexes.colorLocalIndex.should.not.have.property('rangeKey');
    color.indexes.colorLocalIndex.should.not.have.property('throughput');
    color.indexes.should.have.property('colorGlobalIndex');
    color.indexes.colorGlobalIndex.should.have.property('global', true);
    color.indexes.colorGlobalIndex.should.have.property('project', ['name', 'breed'] );
    color.indexes.colorGlobalIndex.should.not.have.property('rangeKey');
    color.indexes.colorGlobalIndex.should.have.property('throughput', {read: 1, write: 1});

    var born = schema.attributes.born;
    born.type.name.should.eql('date');
    born.isSet.should.not.be.ok;
    born.default().should.be.ok;
    should.not.exist(born.validator);
    should(born.required).not.be.ok;
    born.indexes.should.have.property('birthIndex');
    born.indexes.birthIndex.should.not.have.property('global');
    born.indexes.birthIndex.should.have.property('project', false);
    born.indexes.birthIndex.should.not.have.property('rangeKey');
    born.indexes.birthIndex.should.not.have.property('throughput');


    schema.hashKey.should.equal(schema.attributes.ownerId); // should be same object
    schema.rangeKey.should.equal(schema.attributes.breed);

    schema.throughput.read.should.equal(1);
    schema.throughput.write.should.equal(1);

    done();
  });

  it('Schema useDocumentTypes and useNativeBooleans should default to true', function (done) {
    var schema = new Schema({
      id: {
        type: Number,
        validate: function(v) { return v > 0; },
        rangeKey: true
      },
      breed: {
        type: String,
        hashKey: true
      },
      aObject: {
        type: 'Object',
        default: { state: 'alive' }
      },
      anotherObject: Object,
      aArray: Array,
      aMap: {
        mapId: Number,
        mapName: String,
        anotherMap:{
          m1:String,
        }
      },
      aList:[
        {
          listMapId: Number,
          listMapName: String
        }
      ],
      anotherMap: {
        type: 'map',
        map: {
          mapId: {type: Number, required:true },
          mapName: {type: String, required:true }
        }
      },
      anotherList: {
        type: 'list',
        list: [
          {
            listMapId: {type: Number, default: 1},
            listMapName: {type: String, default:'SomeName'}
          }
        ]
      }
    });

    schema.useDocumentTypes.should.eql(true);
    schema.useNativeBooleans.should.eql(true);
    done();
  });


  it('Schema with added instance methods', function (done) {

    dynamoose.setDefaults({ prefix: '' });

    var schema = new Schema({
      id: Number
    });

    schema.method('meow', function() {
      this.lastcall = 'meooowwww';
    });

    var Kitty = dynamoose.model('Kitty', schema);
    var fizz = new Kitty();
    fizz.meow();
    fizz.lastcall.should.eql('meooowwww');

    schema.method({
      purr:function(){this.didpurr = 1;},
      scratch:function(){this.didscratch = 1;}
    });

    var Tabby = dynamoose.model('Tabby', schema);
    var tom = new Tabby();

    tom.should.not.have.property('didpurr');
    tom.should.not.have.property('didscratch');

    tom.purr();
    tom.scratch();

    tom.didscratch.should.be.ok;
    tom.didpurr.should.be.ok;


    Tabby.$__.table.delete(function () {
      delete dynamoose.models.Tabby;

      Kitty.$__.table.delete(function () {
        delete dynamoose.models.Kitty;
        done();
      });
    });

  });

  it('Schema with added static methods', function (done) {

    dynamoose.setDefaults({ prefix: '' });

    var staticSchema = new Schema({
      name: String
    });

    staticSchema.static('findKittenName', function (name){
      return name + '\'s kitten';
    });

    var Cat = dynamoose.model('Cat' + Date.now(),staticSchema);
    var kitten = Cat.findKittenName('sue');
    kitten.should.eql('sue\'s kitten');

    staticSchema.static({
      findCatsByOwner:function(owner){return owner + 'fluffy';},
      findCatsByRace:function(owner){return owner + 'bobbly';}
    });

    var Cats = dynamoose.model('Cats',staticSchema);
    var catsByOwner = Cats.findCatsByOwner('fred');
    var catsByRace = Cats.findCatsByRace('siamese');

    catsByOwner.should.eql('fredfluffy');
    catsByRace.should.eql('siamesebobbly');

    Cat.$__.table.delete(function () {
      delete dynamoose.models.Cat;

      Cats.$__.table.delete(function () {
        delete dynamoose.models.Cats;
        done();
      });
    });
  });

  it('Schema with bound static methods', function (done) {

    dynamoose.setDefaults({ prefix: '' });

    var staticSchema = new Schema({
      name: String
    });

    staticSchema.static('getKittensNamePunctuation', function (){
      return '!';
    });

    staticSchema.static('findKittenName', function (name){
      // Inside a static method "this" refers to the Model
      return name + '\'s kitten' + this.getKittensNamePunctuation();
    });

    var Cat = dynamoose.model('Cat' + Date.now(), staticSchema);
    var kittenOwners = ['Sue', 'Janice'];
    var kittens = kittenOwners.map(Cat.findKittenName);

    kittens.should.eql(['Sue\'s kitten!', 'Janice\'s kitten!']);

    done();
  });


  it('Schema with added virtual methods', function (done) {

    var schema = new Schema({
      name: String,
      owner: String
    });

    schema.virtual('mergedname').get(function () {
      return (this._mergedname)?this._mergedname:this.name;//this.name + this.owner;
    });

    schema.virtual('mergedname').set(function(v){
      this._mergedname = v;
    });

    var Cat = dynamoose.model('Cat' + Date.now(), schema);
    var tim = new Cat();

    tim.name = 'tommy';
    tim.owner = 'bill';

    tim.should.have.property('mergedname');
    tim.mergedname.should.eql('tommy');

    tim.mergedname = 'george';
    tim.mergedname.should.eql('george');


    Cat.$__.table.delete(function () {
      delete dynamoose.models.Cat;
      done();
    });
  });

  it('Schema with custom parser', function (done) {

    var schema = new Schema({
      name: String,
      owner: String
    }, {
      attributeFromDynamo: function(name, value, fallback) {
        if (name === 'owner') {
          return 'Cat Lover: ' + value.S;
        }
        return fallback(value);
      }
    });

    var Cat = dynamoose.model('Cat' + Date.now(), schema);
    var tim = new Cat();

    tim.name = 'tommy';
    tim.owner = 'bill';

    tim.save(function() {
      Cat.scan().exec(function(err, models) {
        if (err) {
          throw err;
        }
        var timSaved = models.pop();
        timSaved.owner.should.eql('Cat Lover: bill');

        Cat.$__.table.delete(function () {
          delete dynamoose.models.Cat;
          done();
        });
      });
    });
  });

  it('Schema with custom formatter', function (done) {

    var schema = new Schema({
      name: String,
      owner: String
    }, {
      attributeToDynamo: function(name, value, model, fallback) {
        if (name === 'owner') {
          return {S: 'Cat Lover: ' + value};
        }
        return fallback(value);
      }
    });

    var Cat = dynamoose.model('Cat' + Date.now(), schema);
    var tim = new Cat();

    tim.name = 'tommy';
    tim.owner = 'bill';

    tim.save(function() {
      Cat.scan().exec(function(err, models) {
        if (err) {
          throw err;
        }
        var timSaved = models.pop();
        timSaved.owner.should.eql('Cat Lover: bill');

        Cat.$__.table.delete(function () {
          delete dynamoose.models.Cat;
          done();
        });
      });
    });
  });

  it('Attribute with custom parser', function (done) {

    var schema = new Schema({
      name: String,
      owner: {
        type: String,
        fromDynamo: function(json) {
          return 'Cat Lover: ' + json.S;
        }
      }
    });

    var Cat = dynamoose.model('Cat' + Date.now(), schema);
    var tim = new Cat();

    tim.name = 'tommy';
    tim.owner = 'bill';

    tim.save(function() {
      Cat.scan().exec(function(err, models) {
        if (err) {
          throw err;
        }
        var timSaved = models.pop();
        timSaved.owner.should.eql('Cat Lover: bill');

        Cat.$__.table.delete(function () {
          delete dynamoose.models.Cat;
          done();
        });
      });
    });
  });

  it('Schema with custom formatter', function (done) {

    var schema = new Schema({
      name: String,
      owner: {
        type: String,
        toDynamo: function(value) {
          return {S: 'Cat Lover: ' + value};
        }
      }
    });

    var Cat = dynamoose.model('Cat' + Date.now(), schema);
    var tim = new Cat();

    tim.name = 'tommy';
    tim.owner = 'bill';

    tim.save(function() {
      Cat.scan().exec(function(err, models) {
        if (err) {
          throw err;
        }
        var timSaved = models.pop();
        timSaved.owner.should.eql('Cat Lover: bill');

        Cat.$__.table.delete(function () {
          delete dynamoose.models.Cat;
          done();
        });
      });
    });
  });

  it('Parses document types when saveUnknown=false and useDocumentTypes=true', async function () {

    var schema = new Schema({
      id: Number,
      mapAttrib: {
        aString: String,
        aNumber: Number,
      },
      listAttrib: {
        type: 'list',
        list: [String],
      },
    }, {
      saveUnknown: false
    });

    var model = {};
    await schema.parseDynamo(model, {
      id: { N: '2' },
      mapAttrib: {
        M: {
          aString: { S: 'Fluffy' },
          aNumber: { N: '5' },
        },
      },
      listAttrib: {
        L: [
          { S: 'v1' },
          { S: 'v2' },
        ],
      },
    });

    model.should.eql({
      id: 2,
      mapAttrib: {
        aString: 'Fluffy',
        aNumber: 5,
      },
      listAttrib: [
        'v1',
        'v2',
      ],
    });
  });

  it('Parses document types when saveUnknown=true and useDocumentTypes=true', async function () {

    var schema = new Schema({
      id: Number,
      anotherMap: Map,
    }, {
      saveUnknown: true
    });

    var model = {};
    await schema.parseDynamo(model, {
      id: { N: '2' },
      mapAttrib: {
        M: {
          aString: { S: 'Fluffy' },
          aNumber: { N: '5' },
        },
      },
      anotherMap: {
        M: {
          aNestedAttribute: { S: 'I am a nested unknown sub-attribute of a known top-level attribute' },
          weHaveTheSameName: { S: 'I should be independent of the top-level field with the same name' },
        }
      },
      weHaveTheSameName: { N: 123 },
      listAttrib: {
        L: [
          { S: 'v1' },
          { S: 'v2' },
        ],
      },
    });

    model.should.eql({
      id: 2,
      mapAttrib: {
        aString: 'Fluffy',
        aNumber: 5,
      },
      anotherMap: {
        aNestedAttribute: 'I am a nested unknown sub-attribute of a known top-level attribute',
        weHaveTheSameName: 'I should be independent of the top-level field with the same name'
      },
      weHaveTheSameName: 123,
      listAttrib: [
        'v1',
        'v2',
      ],
    });
  });

  it('Handle unknown attributes in DynamoDB', async function () {

    var unknownSchema = new Schema({
      id: Number
    }, {
      saveUnknown: true
    });

    var model = {};
    await unknownSchema.parseDynamo(model, {
      id: { N: 2 },
      name: { S: 'Fluffy' },
      anObject: { S: '{"a":"attribute"}' },
      numberString: { S: '1' },
      anArray: { S: '[2,{"test2": "5","test": "1"},"value1"]' },
      anObjectB: { M: {'a':{S: 'attribute'}} },
      anArrayB: { L: [{N : 1}, {N : 2}, {N : 3}]},// can't handle dissimilar items list {M: {'test2': {S: '5'},'test': {S: '1'}}},{S: "value1"}] },
      aBoolean: { S: 'true' },
      aBooleanB: { BOOL: true },
    });

    model.should.eql({
      id: 2,
      name: 'Fluffy',
      anObject: '{"a":"attribute"}',
      numberString: '1',
      // TODO: the numbers below should probably be parseInt'ed like the `numberString` attr
      anArray: '[2,{"test2": "5","test": "1"},"value1"]',
      anObjectB: { a: 'attribute' },
      // TODO: the numbers below should probably be parseInt'ed like the `numberString` attr
      anArrayB: [1, 2, 3],
      aBoolean: 'true',
      aBooleanB: true
    });
  });

  it('Handle unknown attributes in DynamoDB when document types are set to false', async function () {

    var unknownSchema = new Schema({
      id: Number
    }, {
      saveUnknown: true,
      useDocumentTypes: false,
      useNativeBooleans: false
    });

    var model = {};

    try {
      await unknownSchema.parseDynamo(model, {
        id: { N: 2 },
        name: { S: 'Fluffy' },
        anObject: { S: '{"a":"attribute"}' },
        numberString: { S: '1' },
        anArray: { S: '[2,{"test2": "5","test": "1"},"value1"]'},
        anObjectB: { M: {'a':{S: 'attribute'}} },
        anArrayB: { L: [{N:2},{M: {'test2': {S: '5'},'test': {S: '1'}}},{S: 'value1'}]},
        aBoolean: { S: 'true' },
        aBooleanB: { BOOL: true },
      });
    } catch(err) {
      // M and L aren't supported with document types are set to false
      err.should.be.instanceof(Error);
      err.should.be.instanceof(errors.ParseError);
    }
  });

  it('Throws a useful error when parsing a record that does not match the schema', async function () {

    const schema = new Schema({
      topLevel: {
        nestedField: Boolean,
      }
    });

    var model = {};

    try {
      await schema.parseDynamo(model, {
        topLevel: {
          nestedField: 'This is a string',
        }
      });
    } catch(err) {
      err.should.be.instanceof(errors.ParseError);
      err.message.should.match(/Attribute "nestedField" of type "BOOL" has an invalid value of "This is a string"/);
    }
  });

  it('Enum Should be set in schema attributes object', function (done) {
    var enumData = ['Golden retriever', 'Beagle'];
    var schema = new Schema({
      race: {
        type: String,
        enum: enumData
      }
    });

    schema.attributes.race.options.should.have.property('enum');
    schema.attributes.race.options.enum.should.deepEqual(enumData);
    done();
  });

  it('Enum Should throw error when using different value', function (done) {
    var schema = new Schema({
      race: {
        type: String,
        enum: ['Golden retriever', 'Beagle']
      }
    });

    var Dog = dynamoose.model('Dog' + Date.now(), schema);
    var oscar = new Dog();

    oscar.race = 'Persian';

    oscar.save(function(err) {
      err.should.be.instanceof(Error);
      err.should.be.instanceof(errors.ValidationError);
      done();
    });
  });

  it('Enum Should not throw an error if value is empty', function (done) {
    var schema = new Schema({
      name: {
        type: String,
        required: true,
        hashKey: true
      },
      race: {
        type: String,
        enum: ['Golden retriever', 'Beagle']
      },
      weight: {
        type: Number
      }
    });

    var Dog = dynamoose.model('Dog' + Date.now(), schema);
    var oscar = new Dog();

    oscar.name = 'oscar';
    oscar.weight = 100;

    oscar.save(function(err) {
      should(err).be.null();

      Dog.$__.table.delete(function () {
        delete dynamoose.models.Dog;
        done();
      });
    });
  });

  it('Enum Should save new instance of model with a good value', function (done) {

    var enumData = ['Golden retriever', 'Beagle'];
    var choosedRace = enumData[0];

    var schema = new Schema({
      race: {
        type: String,
        enum: enumData
      }
    });

    var Dog = dynamoose.model('Dog' + Date.now(), schema);
    var oscar = new Dog();

    oscar.race = choosedRace;

    oscar.save(function(err, savedDog) {
      should(err).be.null();
      savedDog.race.should.equal(choosedRace);

      Dog.$__.table.delete(function () {
        delete dynamoose.models.Dog;
        done();
      });
    });
  });
  it('Handle unknown attributes as array in DynamoDB', async function () {

    var unknownSchema = new Schema({
      id: Number
    }, {
      saveUnknown: ['name', 'numberString']
    });

    var model = {};
    await unknownSchema.parseDynamo(model, {
      id: { N: '2' },
      name: { S: 'Fluffy' },
      anObject: { S: '{"a":"attribute"}' },
      numberString: { S: '1' }
    });

    model.should.eql({
      id: 2,
      name: 'Fluffy',
      numberString: '1'
    });
  });

  it('Handle unknown attributes as array in DynamoDB when document types are set to false', async function () {

    var unknownSchema = new Schema({
      id: Number
    }, {
      saveUnknown: ['name', 'numberString'],
      useDocumentTypes: false,
      useNativeBooleans: false
    });

    var model = {};
    await unknownSchema.parseDynamo(model, {
      id: { N: '2' },
      name: { S: 'Fluffy' },
      anObject: { S: '{"a":"attribute"}' },
      numberString: { S: '1' }
    });

    model.should.eql({
      id: 2,
      name: 'Fluffy',
      numberString: '1'
    });
  });


  it('Errors when encountering an unknown attribute if errorUnknown is set to true', async function () {
    const schema = new Schema({
      myHashKey: {
        hashKey: true,
        type: String,
      },
      myRangeKey: {
        rangeKey: true,
        type: String,
      },
      knownAttribute: String,
    }, {
      errorUnknown: true,
    });

    let err;
    const model = {['$__']: {
      name: 'OnlyKnownAttributesModel'
    }};
    try {
      await schema.parseDynamo(model, {
        myHashKey: 'I am the hash key',
        myRangeKey: 'I am the range key',
        knownAttribute: { S: 'I am known to the schema. Everything is groovy.' },
        unknownAttribute: { S: 'I am but a stranger to the schema. I should cause an error.' }
      });
    } catch (e) {
      err = e;
    }

    err.should.be.instanceof(errors.ParseError);
    err.message.should.equal('Unknown top-level attribute unknownAttribute on model OnlyKnownAttributesModel with hash-key "I am the hash key" and range-key "I am the range key" and value: {"S":"I am but a stranger to the schema. I should cause an error."}');
  });


  it('Errors when encountering an unknown nested attribute if errorUnknown is set to true', async function () {
    const schema = new Schema({
      myHashKey: {
        hashKey: true,
        type: String,
      },
      myRangeKey: {
        rangeKey: true,
        type: String,
      },
      knownAttribute: String,
      myMap: Map,
    }, {
      errorUnknown: true,
    });

    let err;
    const model = {['$__']: {
      name: 'OnlyKnownAttributesModel'
    }};

    try {
      await schema.parseDynamo(model, {
        myHashKey: 'I am the hash key',
        myRangeKey: 'I am the range key',
        knownAttribute: { S: 'I am known to the schema. Everything is groovy.' },
        myMap: {
          M: {
            nestedUnknownAttribute: { S: 'I too am a stranger. Will the schema be able to find me down here?' }
          }
        }
      });
    } catch (e) {
      err = e;
    }

    err.should.be.instanceof(errors.ParseError);
    err.message.should.match(/Unknown nested attribute nestedUnknownAttribute with value: {"S":"I too am a stranger. Will the schema be able to find me down here\?"}/);
  });

  it('Should throw error when type is map but no map is provided', function (done) {
    let err;
    try {
      new Schema({
        race: {
          type: 'map',
        }
      });
    } catch (e) {
      err = e;
    }
    err.should.be.instanceof(Error);
    err.should.be.instanceof(errors.SchemaError);

    done();
  });

  it('Should throw error when type is list but no list is provided', function (done) {
    let err;
    try {
      new Schema({
        race: {
          type: 'list',
        }
      });
    } catch (e) {
      err = e;
    }
    err.should.be.instanceof(Error);
    err.should.be.instanceof(errors.SchemaError);

    err = undefined;
    try {
      new Schema({
        race: {
          type: 'list',
          list: []
        }
      });
    } catch (e) {
      err = e;
    }

    err.should.be.instanceof(Error);
    err.should.be.instanceof(errors.SchemaError);

    done();

  });
});
