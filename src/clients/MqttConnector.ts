import {Logger} from 'winston';
import createLogger from '../utils/logger';
import mqtt, {Client} from 'mqtt';
import {mqttConfig, coverConfig} from '../config/config';

export default class MqttConnector {
    client: Client
    logger: Logger
    commandTopic: string
    positionSetTopic: string

    constructor() {
        this.logger = createLogger('MqttConnector');
        const clientConfig = {...mqttConfig.client, debug: true};

        this.logger.info('Connecting to MQTT server');
        this.client = mqtt.connect(mqttConfig.client.host, clientConfig);

        this.commandTopic = mqttConfig.topics.command;
        this.positionSetTopic = mqttConfig.topics.position_set;
        this.client.on('connect', () => {
            this.logger.info('Mqtt client successfully connected');
            this.client.subscribe(this.commandTopic);
            this.client.subscribe(this.positionSetTopic);
            this._sendCoversDiscoveryConfig();
        });

        this.client.on('error', err => {
            this.logger.error('Error with Mqtt server: ' + err);
        })
    }

    /**
     * Set actions when receiving a command or a position set by MQTT.
     * 
     * @param actionCommand 
     * @param actionSetPosition 
     */
    startTopicListener(actionCommand: (coverName: string, command: string) => void,
                       actionSetPosition: (coverName: string, position: number) => void) {

        const commandRegEx = new RegExp('^' + this.commandTopic.replace("+", "(.+)") + '$');
        const positionSetRegEx = new RegExp('^' + this.positionSetTopic.replace("+", "(.+)") + '$');

        this.client.on('message', (topic, message) => {
            if(commandRegEx.test(topic)) {
                const result = commandRegEx.exec(topic);
                if(result != null) {
                    const coverName = result[1];
                    actionCommand(coverName, message.toString());
                }
            } else if (positionSetRegEx.test(topic)) {
                const result = positionSetRegEx.exec(topic);
                if(result != null) {
                    const coverName = result[1];
                    actionSetPosition(coverName, parseInt(message.toString()));
                }
            }
        });
    }

    /**
     * Send to MQTT the new cover position
     * 
     * @param coverName 
     * @param position 
     */
    sendCoverNewPosition(coverName: string, position: number) {
        const targetTopic = mqttConfig.topics.position.replace("+", coverName);
        this.client.publish(targetTopic, position.toString());
    }

    /**
     * Send discovery configuration for Home assistant.
     */
    _sendCoversDiscoveryConfig() {
        // see https://www.home-assistant.io/docs/mqtt/discovery/
        if(mqttConfig.ha_discovery_prefix) {
            this.logger.info('Sending HA discovery config for all covers');
            Object.keys(coverConfig.nameToTydom).forEach(id => {
                const topic = `${mqttConfig.ha_discovery_prefix}/cover/${id}/config`;
                const name = `${id.charAt(0).toUpperCase() + id.substring(1).toLowerCase()} cover`
                const config = {
                    device_class: 'shutter',
                    name: name, 
                    unique_id: `${id}_cover`,
                    device: {
                        manufacturer: 'Delta dore',
                        model: 'shutter',
                        name: name,
                        identifiers: id
                    },
                    command_topic: mqttConfig.topics.command.replace('+', id),
                    position_topic: mqttConfig.topics.position.replace('+', id),
                    set_position_topic: mqttConfig.topics.position_set.replace('+', id),
                    qos: 0,
                    retain: false,
                    payload_open: 'OPEN',
                    payload_close: 'CLOSE',
                    position_open: 100,
                    position_closed: 0,
                    optimistic: false
                };
                this.client.publish(topic, JSON.stringify(config), {qos: 0, retain: true});
            });
        } else {
            this.logger.info('No HA discovery prefix set.');
        }
    }
}

