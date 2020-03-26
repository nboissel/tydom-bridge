import {Logger} from 'winston';
import createLogger from '../utils/logger';
import mqtt, {Client} from 'mqtt';
import {mqttConfig} from '../config/config';

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
                    this.logger.info(`Command ${message} set for cover ${coverName}`)
                    actionCommand(coverName, message.toString());
                }
            } else if (positionSetRegEx.test(topic)) {
                const result = positionSetRegEx.exec(topic);
                if(result != null) {
                    const coverName = result[1];
                    this.logger.info(`Position ${message} set for cover ${coverName}`)
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
}

