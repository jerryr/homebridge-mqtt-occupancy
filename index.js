//use 'strict';

var Service, Characteristic;
var mqtt = require('mqtt');

function MqttOccupancySensor(log, config) {
  this.log = log;
  this.name = config["name"];
  this.url = config["url"];
  this.client_id = "homebridge-occupancy-" + config["name"];
  this.options = {
    keepalive: 10,
    clientId: this.client_id,
    protocolId: "MQTT",
    protocolVersion: 4,
    clean: true,
    reconnectPeriod: 1000,
    connectionTimeout: 10000,
    username: config["username"],
    password: config["password"],
    rejectUnauthorized: false
  };
  this.caption = config["caption"];
  this.topic = config["topic"];

  this.service = new Service.OccupancySensor(this.name);
  this.service.getCharacteristic(Characteristic.OccupancyDetected)
          .on('get', this.getStatus.bind(this));
  this.status = Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED;
  this.client = mqtt.connect(this.url, this.options);
  var that = this;
  this.client.on('error', function () {
       that.log.error('Error event on MQTT');
   });
  this.client.on('message', function(topic, message) {
    var status = message.toString();
    that.log.debug("Received a message: " + status);
    that.status = (status == "occupied"? Characteristic.OccupancyDetected.OCCUPANCY_DETECTED
                : Characteristic.OccupancyDetected.OCCUPANCY_NOT_DETECTED);
    that.service.getCharacteristic(Characteristic.OccupancyDetected)
                .setValue(that.status, undefined, 'fromSetValue');
  });
  this.client.on('connect', function(){
    that.log.info("Connected successfully to MQTT broker");
    that.client.subscribe(that.topic);
  });
}
module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-mqtt-occupancy", "mqtt-occupancy",
                  MqttOccupancySensor);
}

MqttOccupancySensor.prototype.getStatus = function(callback) {
  callback(null, this.status);
}
MqttOccupancySensor.prototype.getServices = function() {
  return [this.service];
}
