const logger = require('../services/logger');

class VoicemailScriptGenerator {
  generateScript(prospectData) {
    const { firstName, lastName, company, phoneNumber } = prospectData;

    const script = `
      Hello ${firstName} ${lastName} from ${company}. This is a message from our sales team. We tried to reach you at ${phoneNumber} but were unable to connect. Could you please call us back at your earliest convenience? We look forward to speaking with you soon.
    `;

    logger.log('Voicemail script generated', { script, prospectData });
    return script;
  }
}

module.exports = VoicemailScriptGenerator;
