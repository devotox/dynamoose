function Listener(type, stage, func, plugin) {
  this.type = type;
  this.stage = stage;
  this.func = func;

  const debugPluginName = plugin.name && plugin.name !== '' ? plugin.name : 'unnamed-plugin';
  this._debug = require('debug')(`dynamoose:${debugPluginName}:listener`);
}

Listener.prototype.emit = async function (type, stage, obj) {
  this._debug('Received emit');

  if (!obj.event) {
    obj.event = {};
  }
  obj.event.type = type;
  obj.event.stage = stage;

  try {
    const result = await this.func(obj);
    return result;
  } catch (e) {
    this._debug(`Error running emit on plugin ${obj.plugin.name}`);
    return;
  }
};

module.exports = Listener;
